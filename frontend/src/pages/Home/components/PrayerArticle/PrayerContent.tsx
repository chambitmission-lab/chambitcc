import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../../../contexts/LanguageContext'

interface PrayerContentProps {
  title?: string | null
  content: string
  testimony?: string
  isAnswered?: boolean
  transitionStyles: React.CSSProperties
}

const PrayerContent = ({ title, content, testimony, isAnswered, transitionStyles }: PrayerContentProps) => {
  const { language } = useLanguage()
  const contentRef = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  // 3줄 클램프에 실제로 걸린 카드에만 "더보기"를 붙인다 —
  // 짧은 기도까지 링크가 달리면 피드 전체가 소란스러워진다.
  const [isClamped, setIsClamped] = useState(false)

  useEffect(() => {
    const el = contentRef.current
    // 펼친 뒤에는 scrollHeight === clientHeight라 다시 재면 "접기"가 사라진다
    if (!el || expanded) return
    const measure = () => setIsClamped(el.scrollHeight - el.clientHeight > 2)
    measure()
    // 폰트 로드·컬럼 폭 변화로 줄 수가 달라질 수 있다
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [content, expanded])

  const toggleExpanded = (e: React.MouseEvent) => {
    // 카드 전체 클릭(상세 열기)과 겹치므로 전파를 막는다
    e.stopPropagation()
    setExpanded(v => !v)
  }

  return (
    <div className="px-5 pb-3 relative z-10">
      {/* 응답됨 배지 — 이모지 대신 SVG 별(홈 '함께 나누는 은혜' 장식과 같은 형태),
          맨글자가 떠 있지 않게 앰버 pill로 감싼다 */}
      {isAnswered && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--amber-soft)] px-2.5 py-1">
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-[var(--amber-icon)] shrink-0" aria-hidden>
              <path d="M5 0 L6.1 3.9 L10 5 L6.1 6.1 L5 10 L3.9 6.1 L0 5 L3.9 3.9 Z" fill="currentColor" />
            </svg>
            <span className="text-[11px] font-bold text-[var(--amber)]">응답됨</span>
          </span>
        </div>
      )}

      {title && (
        <h3
          className="text-[19px] font-bold text-ink-strong mb-3 tracking-[-0.015em] leading-[1.35] text-left"
          style={transitionStyles}
        >
          {title}
        </h3>
      )}

      <p
        ref={contentRef}
        className={`text-[15px] text-gray-800 dark:text-gray-300 leading-[1.7] font-normal tracking-[-0.01em] text-left ${
          expanded ? '' : 'line-clamp-3'
        }`}
        style={transitionStyles}
      >
        {content}
      </p>

      {/* 긴 기도문은 카드가 한없이 길어지지 않게 3줄로 접고, 이 자리에서 펼친다
          (카드 클릭은 상세 열기라 여기서 전파를 끊는다) */}
      {isClamped && (
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          className="mt-1 text-[13px] font-semibold text-gray-500 dark:text-gray-400 hover:text-brand transition-colors"
        >
          {expanded
            ? language === 'ko' ? '접기' : 'Show less'
            : language === 'ko' ? '더보기' : 'Show more'}
        </button>
      )}

      {/* 간증 — 구분선으로 끊지 않고 앰버 인용 블록으로 감싼다.
          응답/영광의 색 언어(앰버)로 통일 — 브랜드 블루·파티 이모지는 결이 어긋남 */}
      {isAnswered && testimony && (
        <div className="mt-4 rounded-xl bg-[var(--amber-soft)] px-4 py-3 text-left">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg width="9" height="9" viewBox="0 0 10 10" className="text-[var(--amber-icon)] shrink-0" aria-hidden>
              <path d="M5 0 L6.1 3.9 L10 5 L6.1 6.1 L5 10 L3.9 6.1 L0 5 L3.9 3.9 Z" fill="currentColor" />
            </svg>
            <span className="text-[11px] font-bold tracking-[0.04em] text-[var(--amber)]">간증</span>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed line-clamp-2">
            {testimony}
          </p>
        </div>
      )}
    </div>
  )
}

export default PrayerContent
