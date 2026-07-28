// ACTS 구간 진입 시 다이얼 위쪽 빈 공간에 잔잔히 fade-in 했다가 사라지는 안내
// (표시되는 동안 상단 구간 칩은 잠깐 숨겨져 서로 겹치지 않는다)
import { useEffect, useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import type { ActsSegment } from './actsSegments'

interface SegmentGuideProps {
  segment: ActsSegment | null
  /** 무드 팔레트 강조 텍스트 클래스 */
  accentText: string
  /** 표시 유지 ms */
  visibleMs?: number
  onHide?: () => void
}

const FADE_MS = 800

const SegmentGuide = ({ segment, accentText, visibleMs = 6000, onHide }: SegmentGuideProps) => {
  const { t } = useLanguage()
  const tx = t as unknown as (k: string) => string
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!segment) {
      setMounted(false)
      return
    }
    // 다음 프레임에 mount 클래스를 켜서 fade-in 트랜지션이 걸리게 한다
    const raf = requestAnimationFrame(() => setMounted(true))
    const hide = setTimeout(() => setMounted(false), visibleMs)
    // fade-out이 끝난 뒤 부모 state 정리
    const done = setTimeout(() => onHide?.(), visibleMs + FADE_MS)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hide)
      clearTimeout(done)
    }
  }, [segment, visibleMs, onHide])

  if (!segment) return null

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center px-8 text-center transition-all duration-[800ms] ease-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className={`flex items-center gap-2 text-xs tracking-[0.35em] uppercase ${accentText}`}>
        <span className="material-icons-outlined text-base">{segment.icon}</span>
        {tx(segment.labelKey)}
      </div>
      <p className="mt-3 font-serif italic text-white/90 text-lg leading-relaxed max-w-md">
        {tx(segment.guideKey)}
      </p>
    </div>
  )
}

export default SegmentGuide
