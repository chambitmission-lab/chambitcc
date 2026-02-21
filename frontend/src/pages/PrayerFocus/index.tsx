import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useDailyVerse } from '../../hooks/useDailyVerse'
import { usePrayerTimer } from './usePrayerTimer'
import TimerDisplay from './TimerDisplay'
import VerseDisplay from './VerseDisplay'
import TimerControls from './TimerControls'
import SessionComplete from './SessionComplete'

const PRESET_TIMES = [5, 10, 15, 20, 30] // 분 단위

const PrayerFocus = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { data: verseData } = useDailyVerse()
  
  // DailyVerseResponse를 VerseDisplay에서 사용할 수 있는 형태로 변환
  const verse = verseData ? {
    content: verseData.verse_text,
    reference: verseData.verse_reference,
    id: verseData.id
  } : null
  
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null)
  const [isStarted, setIsStarted] = useState(false)
  
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
      // 완료 시 진동/알림
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }
    }
  })

  const handleStart = (minutes: number) => {
    setSelectedMinutes(minutes)
    setIsStarted(true)
    startTimer(minutes * 60)
  }

  const handleReset = () => {
    resetTimer()
    setIsStarted(false)
    setSelectedMinutes(null)
  }

  const handleClose = () => {
    if (isRunning && !window.confirm(t('confirmExitTimer') || '타이머가 실행 중입니다. 종료하시겠습니까?')) {
      return
    }
    navigate(-1)
  }

  // 완료 화면
  if (isComplete && selectedMinutes) {
    return (
      <SessionComplete
        duration={selectedMinutes}
        onRestart={handleReset}
        onClose={() => navigate(-1)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white relative overflow-hidden">
      {/* 배경 효과 - Obsidian style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-purple-700/25 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-pink-600/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] translate-x-1/4"></div>
      </div>

      {/* 헤더 */}
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

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-between min-h-[calc(100vh-120px)] px-6 mt-6 pb-10">
        {!isStarted ? (
          // 시작 화면
          <>
            <div className="flex-1 flex flex-col items-center mt-6 w-full max-w-md animate-fade-in">
              {/* 3D 아이콘 */}
              <div className="mb-6 relative group">
                <div className="absolute -inset-4 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all duration-700"></div>
                <div className="w-24 h-24 rounded-full flex items-center justify-center relative transform transition-transform duration-500 hover:scale-105 hover:rotate-3 bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_10px_15px_-3px_rgba(168,85,247,0.3),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-4px_6px_rgba(0,0,0,0.2)]">
                  <span className="material-icons-outlined text-5xl drop-shadow-md">self_improvement</span>
                </div>
              </div>

              {/* 제목 */}
              <div className="text-center mb-10 space-y-2">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-white/80">
                  {t('selectPrayerTime')}
                </h2>
                <p className="text-white/50 text-sm font-medium tracking-wide">
                  {t('focusedPrayerDescription')}
                </p>
              </div>

              {/* 시간 선택 버튼들 */}
              <div className="w-full grid grid-cols-2 gap-4 mb-4">
                {PRESET_TIMES.slice(0, 4).map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => handleStart(minutes)}
                    className="liquid-pill group rounded-2xl h-32 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-500/40 to-purple-600/15 backdrop-blur-[10px] border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:from-purple-400/50 hover:to-purple-500/30 hover:shadow-[0_10px_25px_-5px_rgba(168,85,247,0.4),0_8px_10px_-6px_rgba(168,85,247,0.2)] hover:border-white/30"
                  >
                    <span className="text-5xl font-bold text-white mb-1 drop-shadow-lg group-hover:scale-110 transition-transform">
                      {minutes}
                    </span>
                    <span className="text-white/60 text-xs font-medium uppercase tracking-widest">
                      {t('minutes')}
                    </span>
                  </button>
                ))}
              </div>

              {/* 30분 버튼 */}
              <div className="w-full mb-8">
                <button
                  onClick={() => handleStart(30)}
                  className="liquid-pill group w-full rounded-2xl h-24 flex items-center justify-center gap-4 px-8 relative overflow-hidden bg-gradient-to-br from-purple-500/40 to-purple-600/15 backdrop-blur-[10px] border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:from-purple-400/50 hover:to-purple-500/30 hover:shadow-[0_10px_25px_-5px_rgba(168,85,247,0.4),0_8px_10px_-6px_rgba(168,85,247,0.2)] hover:border-white/30"
                >
                  <span className="text-5xl font-bold text-white drop-shadow-lg group-hover:scale-110 transition-transform">
                    30
                  </span>
                  <span className="text-white/60 text-sm font-medium uppercase tracking-widest mt-4">
                    {t('minutes')}
                  </span>
                </button>
              </div>
            </div>

            {/* 오늘의 말씀 - Footer */}
            {verse && (
              <div className="w-full max-w-md">
                <div className="bg-[rgba(20,20,25,0.6)] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden border border-white/8 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px w-6 bg-pink-500/70"></div>
                      <h3 className="text-pink-500/90 text-xs font-bold tracking-widest uppercase">
                        {t('todayVerse')}
                      </h3>
                    </div>
                    <p className="font-serif text-white/90 text-lg leading-relaxed mb-4 italic">
                      "{verse.content}"
                    </p>
                    <p className="text-white/40 text-xs tracking-wide text-right">
                      - {verse.reference}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // 타이머 실행 화면
          <div className="w-full max-w-md space-y-8 animate-fade-in flex-1 flex flex-col justify-center">
            <TimerDisplay timeLeft={timeLeft} totalSeconds={selectedMinutes! * 60} />
            
            {verse && <VerseDisplay verse={verse} />}
            
            <TimerControls
              isRunning={isRunning}
              isPaused={isPaused}
              onPause={pauseTimer}
              onResume={resumeTimer}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default PrayerFocus
