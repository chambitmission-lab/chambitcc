// 기도 내용 컴포넌트
import { useState, useEffect } from 'react'

interface PrayerContentProps {
  title?: string | null
  content: string
}

const FADE_OUT_MS = 150

const PrayerContent = ({ title, content }: PrayerContentProps) => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayTitle, setDisplayTitle] = useState(title ?? '')
  const [displayContent, setDisplayContent] = useState(content)

  // 🎨 Blur Fade Transition - Apple/Notion 스타일
  useEffect(() => {
    if ((title ?? '') !== displayTitle || content !== displayContent) {
      setIsTransitioning(true)

      const timer = setTimeout(() => {
        setDisplayTitle(title ?? '')
        setDisplayContent(content)
        setIsTransitioning(false)
      }, FADE_OUT_MS)

      return () => clearTimeout(timer)
    }
  }, [title, content, displayTitle, displayContent])

  // 페이드아웃은 텍스트 교체 시점(FADE_OUT_MS)에 정확히 완료돼야
  // 완전히 흐려진 상태에서 바뀐다 — 교체 후 페이드인은 여유 있게
  const transitionStyles: React.CSSProperties = {
    transition: isTransitioning
      ? `opacity ${FADE_OUT_MS}ms ease-in, filter ${FADE_OUT_MS}ms ease-in, transform ${FADE_OUT_MS}ms ease-in`
      : 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isTransitioning ? 0 : 1,
    filter: isTransitioning ? 'blur(8px)' : 'blur(0px)',
    transform: isTransitioning ? 'translateY(-4px)' : 'translateY(0)',
  }

  return (
    <div className="mb-7">
      {displayTitle && (
        <h3
          className="text-[22px] font-bold text-gray-900 dark:text-white tracking-[-0.015em] leading-[1.3] mb-8"
          style={transitionStyles}
        >
          {displayTitle}
        </h3>
      )}
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
