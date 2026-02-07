import { useState, useEffect } from 'react'
import type { Prayer } from '../../../../types/prayer'

export const useTranslationToggle = (prayer: Prayer) => {
  const [showTranslation, setShowTranslation] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayTitle, setDisplayTitle] = useState(prayer.title)
  const [displayContent, setDisplayContent] = useState(prayer.content)

  // 번역이 있는지 확인
  const hasEnTranslation = !!(prayer.title_en && prayer.content_en)
  const hasKoTranslation = !!(prayer.title_ko && prayer.content_ko)
  const hasTranslation = hasEnTranslation || hasKoTranslation
  
  // 현재 표시할 제목과 내용 결정
  const currentTitle = showTranslation 
    ? (prayer.title_en || prayer.title_ko || prayer.title)
    : prayer.title
  const currentContent = showTranslation 
    ? (prayer.content_en || prayer.content_ko || prayer.content)
    : prayer.content
  
  // 버튼 텍스트 결정
  const translationButtonText = showTranslation 
    ? (hasKoTranslation ? '🇺🇸 EN' : '🇰🇷 한글')
    : (hasKoTranslation ? '🇰🇷 한글' : '🇺🇸 EN')

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
    translationButtonText
  }
}
