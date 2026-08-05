import { useState, useCallback, useEffect, useRef } from 'react'
import { usePrayersInfinite } from '../../../../hooks/usePrayersQuery'
import { useProfileDetail } from '../../../../hooks/useProfile'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { fetchPrayerDetail } from '../../../../api/prayer/prayerApi'
import { validation } from '../../../../utils/validation'
import { showToast } from '../../../../utils/toast'
import type { PrayerEmotion, RecommendedVerses, SortType } from '../../../../types/prayer'

// 구절 추천은 백엔드 BackgroundTask라 등록 응답에는 보통 없다.
// 잠깐 폴링해서 도착하면 묵상 스토리(기도→말씀→타임캡슐)로 바로 잇는다.
const VERSE_POLL_INTERVAL = 2500
const VERSE_POLL_MAX_TRIES = 5

interface UsePrayerComposerProps {
  onClose: () => void
  onSuccess?: () => void
  sort: SortType
  groupId?: number | null  // ✅ 초기 groupId 추가
}

export const usePrayerComposer = ({ onClose, onSuccess, sort, groupId }: UsePrayerComposerProps) => {
  const { createPrayer, isCreating } = usePrayersInfinite(sort, groupId)  // ✅ groupId 전달
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(groupId || null)  // ✅ 초기값 설정
  const [emotion, setEmotion] = useState<PrayerEmotion | null>(null)
  const [error, setError] = useState('')
  const [recommendedVerses, setRecommendedVerses] = useState<RecommendedVerses | null>(null)
  const [showVersesModal, setShowVersesModal] = useState(false)
  // 등록 성공 → 이모지 폭죽을 잠깐 보여주고 닫는다 (추천 구절 모달이 뜨는 경우는 모달이 보상)
  const [celebrating, setCelebrating] = useState(false)
  // 방금 올린 기도 id — 묵상 모달의 타임캡슐 초대(그날의 기도 봉인)에 넘긴다
  const [createdPrayerId, setCreatedPrayerId] = useState<number | null>(null)
  // 백그라운드 구절 생성을 기다리는 중 (제출 버튼 문구로 표시)
  const [awaitingVerses, setAwaitingVerses] = useState(false)

  const pollTimerRef = useRef<number | null>(null)
  const cancelledRef = useRef(false)
  useEffect(() => {
    return () => {
      cancelledRef.current = true
      if (pollTimerRef.current !== null) window.clearTimeout(pollTimerRef.current)
    }
  }, [])

  // 브라우저 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  const isLoggedIn = !!localStorage.getItem('access_token')

  // 프로필 사진 — 캐시된 프로필 상세에서 가져온다 (미등록/비로그인 시 null → 이니셜 아바타)
  const { data: profileDetail } = useProfileDetail()
  const avatarUrl = profileDetail?.stats.avatar_url ?? null

  // 로그인 응답에 full_name이 없으면 localStorage에 이름이 저장되지 않으므로
  // 프로필 상세(stats.full_name)를 최우선으로 사용한다 — 실제 노출도 이름 기준
  const getUserName = (): string => {
    if (!isLoggedIn || isAnonymous) return '익명'

    const fullName =
      profileDetail?.stats.full_name || localStorage.getItem('user_full_name')
    const username = localStorage.getItem('user_username')

    return fullName || username || '익명'
  }

  const displayName = getUserName()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 검증
    const titleValidation = validation.validateTitle(title)
    if (!titleValidation.valid) {
      setError(titleValidation.error!)
      return
    }

    const contentValidation = validation.validateContent(content)
    if (!contentValidation.valid) {
      setError(contentValidation.error!)
      return
    }

    const nameValidation = validation.validateDisplayName(displayName)
    if (!nameValidation.valid) {
      setError(nameValidation.error!)
      return
    }

    setError('')

    try {
      const response = await createPrayer({
        title: title.trim() || undefined,  // 제목은 선택 — 비면 보내지 않음
        content: content.trim(),
        display_name: displayName,
        is_fully_anonymous: isAnonymous,
        group_id: selectedGroupId || undefined,
        emotion: emotion || undefined,
      })

      const prayer = response.data

      onSuccess?.()
      setCreatedPrayerId(prayer.id)

      if (prayer.recommended_verses && prayer.recommended_verses.verses.length > 0) {
        setRecommendedVerses(prayer.recommended_verses)
        setShowVersesModal(true)
      } else if (response.processing) {
        // 구절이 백그라운드에서 생성 중 — 폭죽을 보여주며 잠깐 기다렸다가
        // 도착하면 묵상 스토리로 바로 잇고, 늦으면 조용히 닫는다
        setCelebrating(true)
        setAwaitingVerses(true)
        startVersePolling(prayer.id)
      } else {
        setCelebrating(true)
        window.setTimeout(onClose, 780)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다')
    }
  }

  const startVersePolling = (prayerId: number) => {
    let tries = 0
    const poll = async () => {
      if (cancelledRef.current) return
      tries += 1
      try {
        const detail = await fetchPrayerDetail(prayerId)
        if (cancelledRef.current) return
        const verses = detail.recommended_verses
        if (verses && verses.verses.length > 0) {
          setAwaitingVerses(false)
          setCelebrating(false)
          setRecommendedVerses(verses)
          setShowVersesModal(true)
          return
        }
      } catch {
        // 일시 오류는 다음 시도에서 재확인
      }
      if (tries < VERSE_POLL_MAX_TRIES) {
        pollTimerRef.current = window.setTimeout(poll, VERSE_POLL_INTERVAL)
      } else {
        setAwaitingVerses(false)
        showToast('말씀은 잠시 후 기도 카드에서 볼 수 있어요', 'info')
        onClose()
      }
    }
    pollTimerRef.current = window.setTimeout(poll, VERSE_POLL_INTERVAL)
  }

  const handleVersesModalClose = () => {
    setShowVersesModal(false)
    onClose()
  }

  // 음성 인식을 위한 안정적인 setter (중복 방지)
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(prev => {
      if (prev === newTitle) {
        console.log('usePrayerComposer: Ignoring duplicate title update:', newTitle)
        return prev
      }
      return newTitle
    })
  }, [])

  const handleContentChange = useCallback((newContent: string) => {
    setContent(prev => {
      if (prev === newContent) {
        console.log('usePrayerComposer: Ignoring duplicate content update:', newContent)
        return prev
      }
      return newContent
    })
  }, [])

  return {
    // State
    title,
    content,
    isAnonymous,
    selectedGroupId,
    emotion,
    error,
    recommendedVerses,
    showVersesModal,
    celebrating,
    createdPrayerId,
    awaitingVerses,
    isCreating,
    isLoggedIn,
    displayName,
    avatarUrl,

    // Handlers
    setTitle: handleTitleChange,
    setContent: handleContentChange,
    setIsAnonymous,
    setSelectedGroupId,
    setEmotion,
    handleSubmit,
    handleVersesModalClose,
  }
}
