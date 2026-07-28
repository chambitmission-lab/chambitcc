// 기도 중간(약 50% 시점)에 다이얼 위쪽 빈 공간에 잔잔히 fade-in 했다가 사라지는 말씀
// (표시되는 동안 상단 테마 칩은 잠깐 숨겨져 서로 겹치지 않는다)
import { useEffect, useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

interface MidPrayerVerseProps {
  show: boolean
  verseText?: string
  verseRef?: string
  /** show=true 후 자동으로 사라지기까지의 ms */
  visibleMs?: number
  onHide?: () => void
}

const FADE_MS = 1000

const MidPrayerVerse = ({ show, verseText, verseRef, visibleMs = 9000, onHide }: MidPrayerVerseProps) => {
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!show) {
      setMounted(false)
      return
    }
    const raf = requestAnimationFrame(() => setMounted(true))
    const hide = setTimeout(() => setMounted(false), visibleMs)
    // fade-out이 끝난 뒤 부모 state 정리
    const done = setTimeout(() => onHide?.(), visibleMs + FADE_MS)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hide)
      clearTimeout(done)
    }
  }, [show, visibleMs, onHide])

  if (!show) return null

  const text = verseText || t('midPrayerWhisper')

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center px-8 text-center transition-all duration-[1000ms] ease-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <p className="font-serif italic text-white/90 text-base md:text-lg leading-relaxed max-w-md">
        "{text}"
      </p>
      {verseRef && (
        <p className="mt-2.5 text-white/45 text-xs tracking-widest">— {verseRef}</p>
      )}
    </div>
  )
}

export default MidPrayerVerse
