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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white relative overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* 헤더 */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <span className="material-icons-outlined">close</span>
        </button>
        <h1 className="text-xl font-bold">{t('prayerFocusMode') || 'Prayer Focus Mode'}</h1>
        <div className="w-10"></div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 pb-20">
        {!isStarted ? (
          // 시작 화면
          <div className="w-full max-w-md space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="material-icons-outlined text-5xl">self_improvement</span>
              </div>
              <h2 className="text-3xl font-bold">{t('selectPrayerTime') || '기도 시간 선택'}</h2>
              <p className="text-white/70">{t('focusedPrayerDescription') || '집중하여 기도하는 시간을 가져보세요'}</p>
            </div>

            {/* 시간 선택 버튼들 */}
            <div className="grid grid-cols-2 gap-4">
              {PRESET_TIMES.map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => handleStart(minutes)}
                  className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 hover:scale-105 transition-all group"
                >
                  <div className="text-4xl font-bold mb-2">{minutes}</div>
                  <div className="text-sm text-white/70">{t('minutes') || '분'}</div>
                </button>
              ))}
            </div>

            {/* 오늘의 말씀 미리보기 */}
            {verse && (
              <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <div className="text-sm text-white/50 mb-2">{t('todayVerse') || '오늘의 말씀'}</div>
                <p className="text-white/90 leading-relaxed line-clamp-3">{verse.content}</p>
                <p className="text-sm text-white/60 mt-2">- {verse.reference}</p>
              </div>
            )}
          </div>
        ) : (
          // 타이머 실행 화면
          <div className="w-full max-w-md space-y-8 animate-fade-in">
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
