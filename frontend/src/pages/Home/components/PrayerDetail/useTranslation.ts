// 번역 관련 로직을 처리하는 커스텀 훅
import { useState, useMemo } from 'react'
import type { Prayer } from '../../../../types/prayer'

export const useTranslation = (prayer: Prayer | null) => {
  const [showTranslation, setShowTranslation] = useState(false)

  const translationData = useMemo(() => {
    if (!prayer) {
      return {
        hasEnTranslation: false,
        hasKoTranslation: false,
        hasTranslation: false,
        displayTitle: '',
        displayContent: '',
        translationButtonText: '',
      }
    }

    const hasEnTranslation = !!(prayer.title_en && prayer.content_en)
    const hasKoTranslation = !!(prayer.title_ko && prayer.content_ko)
    const hasTranslation = hasEnTranslation || hasKoTranslation

    const displayTitle = showTranslation 
      ? (prayer.title_en || prayer.title_ko || prayer.title)
      : prayer.title
    
    const displayContent = showTranslation 
      ? (prayer.content_en || prayer.content_ko || prayer.content)
      : prayer.content
    
    const translationButtonText = showTranslation 
      ? (hasKoTranslation ? '🇺🇸 English' : '🇰🇷 한글')
      : (hasKoTranslation ? '🇰🇷 한글' : '🇺🇸 English')

    return {
      hasEnTranslation,
      hasKoTranslation,
      hasTranslation,
      displayTitle,
      displayContent,
      translationButtonText,
    }
  }, [prayer, showTranslation])

  const toggleTranslation = () => setShowTranslation(!showTranslation)

  return {
    showTranslation,
    toggleTranslation,
    ...translationData,
  }
}
