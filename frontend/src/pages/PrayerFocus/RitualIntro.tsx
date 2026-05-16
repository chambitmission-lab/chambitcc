// 진입 의식(Ritual) 단계 — 어두워진 화면, 말씀 한 줄, 호흡 멘트가 차례로 fade-in
// 사용자가 화면을 터치하거나 자동 타임아웃이 끝나면 onEnter 호출
import { useEffect, useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import type { MoodPalette } from './moodPalette'

interface RitualIntroProps {
  mood: MoodPalette
  /** 주제별 시작 멘트(옵션). 없으면 기본 골방 말씀 표시 */
  themeQuoteKey?: string
  themeQuoteRefKey?: string
  /** 자동으로 다음 단계로 넘어가기까지의 ms. 기본 5500ms */
  autoAdvanceMs?: number
  onEnter: () => void
}

const RitualIntro = ({ mood, themeQuoteKey, themeQuoteRefKey, autoAdvanceMs = 5500, onEnter }: RitualIntroProps) => {
  const { t } = useLanguage()
  const tx = t as unknown as (k: string) => string
  const [step, setStep] = useState(0) // 0: 어두움 → 1: 말씀 → 2: 호흡 멘트 → 3: 터치 안내

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 600),   // 말씀 fade-in
      setTimeout(() => setStep(2), 2400),  // 호흡 멘트 fade-in
      setTimeout(() => setStep(3), 4000),  // 터치 안내 fade-in
    ]
    const auto = setTimeout(onEnter, autoAdvanceMs)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(auto)
    }
  }, [autoAdvanceMs, onEnter])

  const verseText = themeQuoteKey ? tx(themeQuoteKey) : t('ritualRoomVerse')
  const verseRef = themeQuoteRefKey ? tx(themeQuoteRefKey) : t('ritualRoomVerseRef')

  return (
    <div
      onClick={onEnter}
      className={`fixed inset-0 z-50 ${mood.bgBase} text-white cursor-pointer overflow-hidden animate-fade-in`}
      role="button"
      aria-label={t('tapToEnter')}
    >
      {/* 매우 흐릿한 단일 글로우 — 어두움 강조 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] ${mood.glowA} rounded-full blur-[120px] opacity-60`}></div>
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 text-center">
        {/* 말씀 한 줄 */}
        <div
          className={`transition-all duration-[1400ms] ease-out max-w-md ${
            step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="font-serif italic text-white/90 text-xl md:text-2xl leading-relaxed">
            {verseText}
          </p>
          <p className={`mt-3 text-xs tracking-widest uppercase ${mood.accentText}`}>
            — {verseRef}
          </p>
        </div>

        {/* 호흡 멘트 */}
        <div
          className={`mt-16 transition-all duration-[1400ms] ease-out ${
            step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-white/70 text-base md:text-lg leading-loose">
            {t('ritualBreathe')}
            <br />
            {t('ritualGaze')}
          </p>
        </div>

        {/* 터치 안내 */}
        <div
          className={`mt-20 transition-opacity duration-[1200ms] ${
            step >= 3 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-white/30 text-xs tracking-[0.3em] uppercase animate-pulse-slow">
            {t('tapToEnter')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default RitualIntro
