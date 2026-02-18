// 번역 관련 로직을 처리하는 커스텀 훅
import { useState, useMemo } from 'react'
import type { Prayer } from '../../../../types/prayer'
import { getLanguageFlag, getLanguageName } from '../../../../utils/languageFlags'

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
        currentLanguage: 'ko',
        nextLanguage: 'en',
        originalLanguage: 'ko',
      }
    }

    const hasEnTranslation = !!(prayer.title_en && prayer.content_en)
    const hasKoTranslation = !!(prayer.title_ko && prayer.content_ko)
    const hasTranslation = hasEnTranslation || hasKoTranslation

    // 원본 언어 (기본값: 한글)
    const originalLanguage = prayer.original_language || 'ko'
    
    // 번역 언어 결정
    let translationLanguage = 'ko' // 기본값: 한글
    if (originalLanguage === 'ko') {
      // 원본이 한글이면 영어 번역 우선, 없으면 베트남어
      translationLanguage = hasEnTranslation ? 'en' : 'vi'
    } else {
      // 원본이 한글이 아니면 한글 번역
      translationLanguage = 'ko'
    }

    const displayTitle = showTranslation 
      ? (prayer.title_ko || prayer.title_en || prayer.title)
      : prayer.title
    
    const displayContent = showTranslation 
      ? (prayer.content_ko || prayer.content_en || prayer.content)
      : prayer.content
    
    // 현재 보고 있는 언어
    const currentLanguage = showTranslation ? translationLanguage : originalLanguage
    
    // 다음에 볼 언어
    const nextLanguage = showTranslation ? originalLanguage : translationLanguage
    
    const translationButtonText = `${getLanguageFlag(nextLanguage)} ${getLanguageName(nextLanguage)}`

    return {
      hasEnTranslation,
      hasKoTranslation,
      hasTranslation,
      displayTitle,
      displayContent,
      translationButtonText,
      currentLanguage,
      nextLanguage,
      originalLanguage,
    }
  }, [prayer, showTranslation])

  const toggleTranslation = () => setShowTranslation(!showTranslation)

  return {
    showTranslation,
    toggleTranslation,
    ...translationData,
  }
}
