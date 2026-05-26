import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useDailyVerse } from '../../hooks/useDailyVerse'
import { usePrayerTimer } from './usePrayerTimer'
import TimerDisplay from './TimerDisplay'
import VerseDisplay from './VerseDisplay'
import TimerControls from './TimerControls'
import SessionComplete from './SessionComplete'
import RitualIntro from './RitualIntro'
import MidPrayerVerse from './MidPrayerVerse'
import { PRAYER_TIME_PRESETS } from './presets'
import { getCurrentMood } from './moodPalette'
import { PRAYER_THEMES } from './prayerThemes'
import type { PrayerTheme } from './prayerThemes'
import { PRAYER_AMBIENCE_TRACKS } from '../../data/ambienceTracks'
import { useAmbience } from '../../hooks/useAmbience'

type Stage = 'setup' | 'ritual' | 'praying'

const PrayerFocus = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const tx = t as unknown as (k: string) => string
  const { data: verseData } = useDailyVerse()

  const verse = verseData
    ? { content: verseData.verse_text, reference: verseData.verse_reference, id: verseData.id }
    : null

  const mood = useMemo(() => getCurrentMood(), [])

  const [stage, setStage] = useState<Stage>('setup')
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<PrayerTheme | null>(null)
  const [ambienceId, setAmbienceId] = useState<string>('silent')
  const [showMidVerse, setShowMidVerse] = useState(false)

  const ambience = useAmbience(ambienceId)

  const {
    timeLeft,
    isRunning,
    isPaused,
    isComplete,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  } = usePrayerTimer({
    onComplete: () => {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }
      ambience.stop()
    },
    onHalfway: () => setShowMidVerse(true),
  })

  // 주제별 시작 멘트(없으면 기본 골방 말씀)
  const ritualQuoteKey = selectedTheme?.startQuoteKey
  const ritualQuoteRefKey = selectedTheme?.startQuoteRefKey

  const handlePickTime = (minutes: number) => {
    setSelectedMinutes(minutes)
    setStage('ritual')
  }

  const handleRitualEnter = () => {
    if (!selectedMinutes) return
    setStage('praying')
    setShowMidVerse(false)
    ambience.play()
    startTimer(selectedMinutes * 60)
  }

  // 일시정지/재개는 타이머와 배경음을 함께 제어한다.
  // (배경음이 'silent'이면 pause/play 는 안전한 no-op)
  const handlePause = () => {
    pauseTimer()
    ambience.pause()
  }

  const handleResume = () => {
    resumeTimer()
    ambience.play()
  }

  const handleReset = () => {
    resetTimer()
    setShowMidVerse(false)
    ambience.stop()
    setStage('setup')
    setSelectedMinutes(null)
    setSelectedTheme(null)
  }

  const handleClose = () => {
    if (isRunning && !window.confirm(t('confirmExitTimer') || '타이머가 실행 중입니다. 종료하시겠습니까?')) {
      return
    }
    ambience.stop()
    navigate(-1)
  }

  // 완료 화면
  if (isComplete && selectedMinutes) {
    return (
      <SessionComplete
        duration={selectedMinutes}
        theme={selectedTheme}
        mood={mood}
        verseId={verse?.id}
        ambienceId={ambienceId}
        onRestart={handleReset}
        onClose={() => navigate(-1)}
      />
    )
  }

  // 진입 의식 단계
  if (stage === 'ritual') {
    return (
      <RitualIntro
        mood={mood}
        themeQuoteKey={ritualQuoteKey}
        themeQuoteRefKey={ritualQuoteRefKey}
        onEnter={handleRitualEnter}
      />
    )
  }

  // 기도 중 화면 — UI 최소화
  if (stage === 'praying' && selectedMinutes) {
    return (
      <div className={`min-h-screen ${mood.bgBase} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] ${mood.glowA} rounded-full blur-[120px] opacity-50`}></div>
        </div>

        {/* 닫기 버튼만 최소한으로 */}
        <button
          onClick={handleClose}
          className="absolute top-10 right-6 z-20 w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/5 flex items-center justify-center hover:bg-white/15 transition-colors"
          aria-label="close"
        >
          <span className="material-icons-outlined text-lg text-white/60">close</span>
        </button>

        {/* 중간 말씀(절반 시점 fade-in) */}
        <MidPrayerVerse
          show={showMidVerse}
          verseText={selectedTheme?.midVerseTextKey ? tx(selectedTheme.midVerseTextKey) : verse?.content}
          verseRef={selectedTheme?.midVerseRefKey ? tx(selectedTheme.midVerseRefKey) : verse?.reference}
          onHide={() => setShowMidVerse(false)}
        />

        {/* 컴팩트 타이머 — 화면 가운데 작게 */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
          <TimerDisplay
            timeLeft={timeLeft}
            totalSeconds={selectedMinutes * 60}
            compact
            ringFrom={mood.ringFrom}
            ringTo={mood.ringTo}
          />

          {/* 일시정지/재개 버튼은 매우 작게 */}
          <div className="mt-12">
            <TimerControls
              isRunning={isRunning}
              isPaused={isPaused}
              onPause={handlePause}
              onResume={handleResume}
              onReset={handleReset}
            />
          </div>
        </div>
      </div>
    )
  }

  // 시작 화면 (setup) — 시간 + 주제 + 사운드
  return (
    <div className={`min-h-screen ${mood.bgBase} text-white relative overflow-hidden`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[20%] left-[10%] w-96 h-96 ${mood.glowA} rounded-full blur-3xl`}></div>
        <div className={`absolute bottom-[20%] right-[10%] w-96 h-96 ${mood.glowB} rounded-full blur-3xl`}></div>
        <div className={`absolute top-1/4 left-0 w-64 h-64 ${mood.glowC} rounded-full blur-3xl -translate-x-1/2`}></div>
        <div className={`absolute bottom-0 right-0 w-80 h-80 ${mood.glowD} rounded-full blur-[100px] translate-x-1/4`}></div>
      </div>

      <div className="relative z-10 pt-12 px-6 flex items-center justify-between">
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/5 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <span className="material-icons-outlined text-xl">close</span>
        </button>
        <h1 className="text-white/90 text-sm font-semibold tracking-wider uppercase">{t('prayerFocusMode')}</h1>
        <div className="w-10 opacity-0"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center min-h-[calc(100vh-120px)] px-6 mt-6 pb-10 max-w-md mx-auto">
        <div className="flex-1 flex flex-col items-center w-full animate-fade-in">
          {/* 3D 아이콘 */}
          <div className="mb-6 relative group">
            <div className={`absolute -inset-4 ${mood.glowC} rounded-full blur-xl group-hover:opacity-100 transition-all duration-700`}></div>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center relative transform transition-transform duration-500 hover:scale-105 hover:rotate-3 bg-gradient-to-br ${mood.buttonGradient} shadow-[0_10px_15px_-3px_rgba(168,85,247,0.25),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-4px_6px_rgba(0,0,0,0.2)]`}>
              <svg viewBox="0 0 24 24" className="w-9 h-9 drop-shadow-md" fill="currentColor" aria-hidden="true">
                <path d="M10.5 2h3v4H18v3h-4.5v13h-3V9H6V6h4.5z" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-6 space-y-1">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/70">
              {t('selectPrayerTime')}
            </h2>
            <p className="text-white/45 text-sm font-medium tracking-wide">
              {t('focusedPrayerDescription')}
            </p>
          </div>

          {/* 기도 주제 선택 */}
          <div className="w-full mb-6">
            <p className="text-white/50 text-xs tracking-widest uppercase mb-3 text-center">
              {t('selectPrayerTheme')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PRAYER_THEMES.map((theme) => {
                const active = selectedTheme?.id === theme.id
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(active ? null : theme)}
                    className={`rounded-xl py-3 px-2 text-xs font-medium tracking-wide border transition-all backdrop-blur-md ${
                      active
                        ? `bg-gradient-to-br ${mood.buttonGradient} border-white/30 text-white shadow-lg`
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="material-icons-outlined text-base block mb-1">{theme.icon}</span>
                    {tx(theme.labelKey)}
                  </button>
                )
              })}
            </div>
            <p className="text-white/30 text-[10px] text-center mt-2">{t('prayerThemeOptional')}</p>
          </div>

          {/* 사운드(ambience) 선택 */}
          <div className="w-full mb-6">
            <p className="text-white/50 text-xs tracking-widest uppercase mb-3 text-center">
              {t('ambience')}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {PRAYER_AMBIENCE_TRACKS.map((track) => {
                const active = ambienceId === track.id
                return (
                  <button
                    key={track.id}
                    onClick={() => setAmbienceId(track.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide border transition-all backdrop-blur-md flex items-center gap-1.5 ${
                      active
                        ? `bg-gradient-to-br ${mood.buttonGradient} border-white/30 text-white`
                        : 'bg-white/5 border-white/10 text-white/65 hover:bg-white/10'
                    }`}
                  >
                    <span className="material-icons-outlined text-sm">{track.icon}</span>
                    {tx(track.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 시간 선택 — 감성 라벨 포함 */}
          <div className="w-full grid grid-cols-1 gap-2.5 mb-6">
            {PRAYER_TIME_PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                onClick={() => handlePickTime(preset.minutes)}
                className={`liquid-pill group rounded-2xl py-4 px-5 flex items-center justify-between relative overflow-hidden border transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 ${
                  preset.highlight
                    ? `bg-gradient-to-br ${mood.buttonGradient} bg-opacity-40 border-white/20`
                    : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="text-left">
                  <div className="text-base font-semibold text-white tracking-wide">
                    {tx(preset.labelKey)}
                  </div>
                  <div className="text-white/45 text-xs mt-0.5">
                    {preset.minutes} {t('minutes')}
                  </div>
                </div>
                <span className="material-icons-outlined text-white/40 group-hover:text-white/80 transition-colors">
                  arrow_forward
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 오늘의 말씀 - Footer */}
        {verse && (
          <div className="w-full">
            <VerseDisplay verse={verse} />
          </div>
        )}
      </div>
    </div>
  )
}

export default PrayerFocus
