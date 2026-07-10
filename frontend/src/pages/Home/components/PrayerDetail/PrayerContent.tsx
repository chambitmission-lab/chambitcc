// 기도 내용 컴포넌트
import { useState, useEffect } from 'react'
import LangFlag from '../../../../components/common/LangFlag'
import { getLanguageName } from '../../../../utils/languageFlags'

interface PrayerContentProps {
  title: string
  content: string
  /** 번역 — 본문이 시작되는 자리에 있어야 "본문을 번역하는 기능"으로 읽힌다 */
  hasTranslation: boolean
  showTranslation: boolean
  nextLanguage: string
  onTranslationToggle: () => void
}

const PrayerContent = ({
  title,
  content,
  hasTranslation,
  showTranslation,
  nextLanguage,
  onTranslationToggle,
}: PrayerContentProps) => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayTitle, setDisplayTitle] = useState(title)
  const [displayContent, setDisplayContent] = useState(content)

  // 🎨 Blur Fade Transition - Apple/Notion 스타일
  useEffect(() => {
    if (title !== displayTitle || content !== displayContent) {
      setIsTransitioning(true)

      const timer = setTimeout(() => {
        setDisplayTitle(title)
        setDisplayContent(content)
        setIsTransitioning(false)
      }, 150) // 블러 페이드아웃 시간

      return () => clearTimeout(timer)
    }
  }, [title, content, displayTitle, displayContent])

  // 애니메이션 스타일
  const transitionStyles: React.CSSProperties = {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isTransitioning ? 0 : 1,
    filter: isTransitioning ? 'blur(8px)' : 'blur(0px)',
    transform: isTransitioning ? 'translateY(-4px)' : 'translateY(0)',
  }

  return (
    <div className="mb-7">
      {/* 제목 + 번역 버튼 — 제목과 본문 사이 여백을 넉넉히 둬 읽기 전 숨 고를 공간 확보 */}
      <div className="flex items-start justify-between gap-3 mb-8">
        <h3
          className="flex-1 min-w-0 text-[22px] font-bold text-gray-900 dark:text-white tracking-[-0.015em] leading-[1.3]"
          style={transitionStyles}
        >
          {displayTitle}
        </h3>
        {hasTranslation && (
          <button
            onClick={onTranslationToggle}
            className="group shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 mt-0.5 bg-surface-light dark:bg-white/[0.05] border border-border-light dark:border-white/[0.08] rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-500/15 transition-all duration-300"
            title={showTranslation ? '원문 보기' : `${getLanguageName(nextLanguage)}로 번역`}
          >
            <LangFlag code={nextLanguage} className="rounded-[2px]" />
            <span>{showTranslation ? '원문 보기' : '번역'}</span>
          </button>
        )}
      </div>
      <p
        className="text-[15px] text-gray-700 dark:text-gray-300 leading-[1.75] whitespace-pre-wrap tracking-[-0.01em]"
        style={transitionStyles}
      >
        {displayContent}
      </p>
    </div>
  )
}

export default PrayerContent
