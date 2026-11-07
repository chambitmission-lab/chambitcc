// 기도 내용 컴포넌트
import { useState, useEffect, useMemo } from 'react'

interface PrayerContentProps {
  title?: string | null
  content: string
}

const FADE_OUT_MS = 150

/** 빈 줄(공백만 있는 줄 포함) 하나 이상을 문단 경계로 본다. 앞뒤 공백 줄은 버린다 */
function splitParagraphs(text: string): string[] {
  const parts = text.replace(/\r\n?/g, '\n').split(/\n[ \t]*\n\s*/).map(p => p.replace(/^\n+|\s+$/g, ''))
  const kept = parts.filter(p => p.length > 0)
  return kept.length > 0 ? kept : [text]
}

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

  const paragraphs = useMemo(() => splitParagraphs(displayContent), [displayContent])

  return (
    <div className="mb-7">
      {displayTitle && (
        <h3
          className="text-[22px] lg:text-[length:calc(25px*var(--fs,1))] font-bold text-ink-strong tracking-[-0.015em] leading-[1.3] mb-8"
          style={transitionStyles}
        >
          {displayTitle}
        </h3>
      )}
      {/* 빈 줄로 나뉜 문단은 <p> 로 묶어 간격을 1em 으로 고르게 — 빈 줄 그대로면 문단마다 눈이 크게 점프한다.
          문단 안의 줄바꿈은 pre-wrap 으로 그대로 살린다. rd-text 는 다크 '등불 아래' 본문색(readingWarm.css) */}
      <div
        className="rd-text text-[15px] lg:text-[length:calc(18px*var(--fs,1))] text-gray-700 dark:text-gray-300 lg:text-gray-800 dark:lg:text-gray-200 leading-[1.75] lg:leading-[1.8] tracking-[-0.01em]"
        style={transitionStyles}
      >
        {paragraphs.map((para, i) => (
          <p key={i} className="whitespace-pre-wrap [&:not(:last-child)]:mb-[1em]">
            {para}
          </p>
        ))}
      </div>
    </div>
  )
}

export default PrayerContent
