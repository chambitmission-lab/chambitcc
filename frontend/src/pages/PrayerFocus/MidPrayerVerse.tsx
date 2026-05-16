// 기도 중간(약 50% 시점)에 잔잔히 fade-in 했다가 fade-out 되는 말씀
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

const MidPrayerVerse = ({ show, verseText, verseRef, visibleMs = 9000, onHide }: MidPrayerVerseProps) => {
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!show) {
      setMounted(false)
      return
    }
    setMounted(true)
    const hide = setTimeout(() => {
      setMounted(false)
      onHide?.()
    }, visibleMs)
    return () => clearTimeout(hide)
  }, [show, visibleMs, onHide])

  if (!show) return null

  const text = verseText || t('midPrayerWhisper')

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-1/3 flex flex-col items-center justify-center px-8 text-center transition-all duration-[1400ms] ease-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <p className="font-serif italic text-white/85 text-xl md:text-2xl leading-relaxed max-w-md">
        "{text}"
      </p>
      {verseRef && (
        <p className="mt-3 text-white/40 text-xs tracking-widest">— {verseRef}</p>
      )}
    </div>
  )
}

export default MidPrayerVerse
