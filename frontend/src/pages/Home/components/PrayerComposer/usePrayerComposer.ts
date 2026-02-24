import { useState, useEffect } from 'react'
import { usePrayersInfinite } from '../../../../hooks/usePrayersQuery'
import { validation } from '../../../../utils/validation'
import type { RecommendedVerses, SortType } from '../../../../types/prayer'

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
  const [error, setError] = useState('')
  const [recommendedVerses, setRecommendedVerses] = useState<RecommendedVerses | null>(null)
  const [showVersesModal, setShowVersesModal] = useState(false)

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    window.history.pushState({ modal: 'prayer-composer' }, '')

    const handlePopState = () => {
      onClose()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onClose])

  const isLoggedIn = !!localStorage.getItem('access_token')

  const getUserName = (): string => {
    if (!isLoggedIn || isAnonymous) return '익명'
    
    const fullName = localStorage.getItem('user_full_name')
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
        title: title.trim(),
        content: content.trim(),
        display_name: displayName,
        is_fully_anonymous: isAnonymous,
        group_id: selectedGroupId || undefined,
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

  return {
    // State
    title,
    content,
    isAnonymous,
    selectedGroupId,
    error,
    recommendedVerses,
    showVersesModal,
    isCreating,
    isLoggedIn,
    displayName,
    
    // Handlers
    setTitle,
    setContent,
    setIsAnonymous,
    setSelectedGroupId,
    handleSubmit,
    handleVersesModalClose,
  }
}
