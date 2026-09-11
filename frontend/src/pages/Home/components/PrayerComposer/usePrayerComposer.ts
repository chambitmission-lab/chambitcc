import { useState, useCallback } from 'react'
import { usePrayersInfinite } from '../../../../hooks/usePrayersQuery'
import { useMyIdentity } from '../../../../hooks/useProfile'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { validation } from '../../../../utils/validation'
import type { Prayer, PrayerEmotion, RecommendedVerses, SortType } from '../../../../types/prayer'
import { tokenStore } from '../../../../utils/tokenStore'
import { prayerToastFeedback } from '../../../../components/prayer/prayerFeedback'

interface UsePrayerComposerProps {
  onClose: () => void
  onSuccess?: (prayer: Prayer) => void
  sort: SortType
  groupId?: number | null  // ✅ 초기 groupId 추가
}

export const usePrayerComposer = ({ onClose, onSuccess, sort, groupId }: UsePrayerComposerProps) => {
  const { createPrayer, isCreating } = usePrayersInfinite(sort, groupId, undefined, undefined, prayerToastFeedback)  // ✅ groupId 전달
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [selectedGroupId, setSelectedGroupIdRaw] = useState<number | null>(groupId || null)  // ✅ 초기값 설정
  // 나만 보기(비밀기도) — 그룹과 배타적. 하나를 고르면 다른 쪽은 풀린다
  const [isPrivate, setIsPrivateRaw] = useState(false)
  const setIsPrivate = useCallback((next: boolean) => {
    setIsPrivateRaw(next)
    if (next) setSelectedGroupIdRaw(null)
  }, [])
  const setSelectedGroupId = useCallback((next: number | null) => {
    setSelectedGroupIdRaw(next)
    if (next !== null) setIsPrivateRaw(false)
  }, [])
  const [emotion, setEmotion] = useState<PrayerEmotion | null>(null)
  const [error, setError] = useState('')
  const [recommendedVerses, setRecommendedVerses] = useState<RecommendedVerses | null>(null)
  const [showVersesModal, setShowVersesModal] = useState(false)
  // 등록 성공 → 이모지 폭죽을 잠깐 보여주고 닫는다 (추천 구절 모달이 뜨는 경우는 모달이 보상)
  const [celebrating, setCelebrating] = useState(false)
  // 방금 올린 기도 id — 묵상 모달의 타임캡슐 초대(그날의 기도 봉인)에 넘긴다
  const [createdPrayerId, setCreatedPrayerId] = useState<number | null>(null)

  // 브라우저 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  const isLoggedIn = !!tokenStore.getAccess()

  // 내 사진·이름 — 헤더가 캐시한 가벼운 /profile/stats(useMyIdentity). 작성 모달을 열 때마다
  // 무거운 프로필 상세(통계+목록 집계)를 다시 부르지 않는다. 이름은 full_name 우선(실제 노출 기준)
  const { avatarUrl, displayName: myName } = useMyIdentity()

  const getUserName = (): string => {
    if (!isLoggedIn || isAnonymous) return '익명'
    return myName || '익명'
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
        group_id: isPrivate ? undefined : selectedGroupId || undefined,
        is_private: isPrivate || undefined,
        emotion: emotion || undefined,
      })

      const prayer = response.data

      onSuccess?.(prayer)
      setCreatedPrayerId(prayer.id)

      if (prayer.recommended_verses && prayer.recommended_verses.verses.length > 0) {
        setRecommendedVerses(prayer.recommended_verses)
        setShowVersesModal(true)
      } else {
        // 구절 추천은 백그라운드 처리 — 기다리지 않고 바로 닫는다.
        // 묵상 스토리(와 타임캡슐 초대)는 피드 카드의 말씀 아이콘에서 열린다.
        if (response.processing) {
          console.log('성경 구절이 백그라운드에서 처리 중입니다')
        }
        setCelebrating(true)
        window.setTimeout(onClose, 780)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다')
    }
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
    isPrivate,
    selectedGroupId,
    emotion,
    error,
    recommendedVerses,
    showVersesModal,
    celebrating,
    createdPrayerId,
    isCreating,
    isLoggedIn,
    displayName,
    avatarUrl,

    // Handlers
    setTitle: handleTitleChange,
    setContent: handleContentChange,
    setIsAnonymous,
    setIsPrivate,
    setSelectedGroupId,
    setEmotion,
    handleSubmit,
    handleVersesModalClose,
  }
}
