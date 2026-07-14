import { useState, useCallback } from 'react'
import { usePrayersInfinite } from '../../../../hooks/usePrayersQuery'
import { useProfileDetail } from '../../../../hooks/useProfile'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { validation } from '../../../../utils/validation'
import type { PrayerEmotion, RecommendedVerses, SortType } from '../../../../types/prayer'

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
      
      if (prayer.recommended_verses && prayer.recommended_verses.verses.length > 0) {
        setRecommendedVerses(prayer.recommended_verses)
        setShowVersesModal(true)
      } else {
        if (response.processing) {
          console.log('성경 구절이 백그라운드에서 처리 중입니다')
        }
        onClose()
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
    selectedGroupId,
    emotion,
    error,
    recommendedVerses,
    showVersesModal,
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
