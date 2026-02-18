import { useState, useEffect } from 'react'
import type { Prayer } from '../../../../types/prayer'
import { getLanguageFlag, getLanguageName } from '../../../../utils/languageFlags'

export const useTranslationToggle = (prayer: Prayer) => {
  const [showTranslation, setShowTranslation] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayTitle, setDisplayTitle] = useState(prayer.title)
  const [displayContent, setDisplayContent] = useState(prayer.content)

  // 번역이 있는지 확인
  const hasEnTranslation = !!(prayer.title_en && prayer.content_en)
  const hasKoTranslation = !!(prayer.title_ko && prayer.content_ko)
  const hasTranslation = hasEnTranslation || hasKoTranslation
  
  // 원본 언어 (기본값: 한글)
  const originalLanguage = prayer.original_language || 'ko'
  
  console.log('🔍 [PrayerArticle] Prayer ID:', prayer.id)
  console.log('🔍 [PrayerArticle] original_language:', prayer.original_language)
  console.log('🔍 [PrayerArticle] originalLanguage:', originalLanguage)
  console.log('🔍 [PrayerArticle] hasEnTranslation:', hasEnTranslation)
  console.log('🔍 [PrayerArticle] hasKoTranslation:', hasKoTranslation)
  
  // 번역 언어 결정
  let translationLanguage = 'ko' // 기본값: 한글
  if (originalLanguage === 'ko') {
    // 원본이 한글이면 영어 번역 우선, 없으면 베트남어
    translationLanguage = hasEnTranslation ? 'en' : 'vi'
  } else {
    // 원본이 한글이 아니면 한글 번역
    translationLanguage = 'ko'
  }
  
  // 현재 표시할 제목과 내용 결정
  const currentTitle = showTranslation 
    ? (prayer.title_ko || prayer.title_en || prayer.title)
    : prayer.title
  const currentContent = showTranslation 
    ? (prayer.content_ko || prayer.content_en || prayer.content)
    : prayer.content
  
  // 현재 보고 있는 언어
  const currentLanguage = showTranslation ? translationLanguage : originalLanguage
  
  // 다음에 볼 언어
  const nextLanguage = showTranslation ? originalLanguage : translationLanguage
  
  // 버튼 텍스트 결정
  const translationButtonText = `${getLanguageFlag(nextLanguage)} ${getLanguageName(nextLanguage)}`
  
  console.log('🔍 [PrayerArticle] translationLanguage:', translationLanguage)
  console.log('🔍 [PrayerArticle] currentLanguage:', currentLanguage)
  console.log('🔍 [PrayerArticle] nextLanguage:', nextLanguage)
  console.log('---')

  // Blur Fade 애니메이션 효과
  useEffect(() => {
    if (currentTitle !== displayTitle || currentContent !== displayContent) {
      setIsTransitioning(true)
      
      const timer = setTimeout(() => {
        setDisplayTitle(currentTitle)
        setDisplayContent(currentContent)
        setIsTransitioning(false)
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [currentTitle, currentContent, displayTitle, displayContent])

  // 애니메이션 스타일
  const transitionStyles: React.CSSProperties = {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isTransitioning ? 0 : 1,
    filter: isTransitioning ? 'blur(8px)' : 'blur(0px)',
    transform: isTransitioning ? 'translateY(-4px)' : 'translateY(0)',
  }

  const toggleTranslation = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowTranslation(!showTranslation)
  }

  return {
    showTranslation,
    toggleTranslation,
    displayTitle,
    displayContent,
    transitionStyles,
    hasTranslation,
    translationButtonText,
    currentLanguage,
    nextLanguage,
    originalLanguage
  }
}
