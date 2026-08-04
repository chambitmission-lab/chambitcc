import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useDailyVerse } from '../../hooks/useDailyVerse'
import { usePrayerTimer } from './usePrayerTimer'
import TimerDisplay from './TimerDisplay'
import VerseDisplay from './VerseDisplay'
import TimerControls from './TimerControls'
import SessionComplete from './SessionComplete'
import RitualIntro from './RitualIntro'
import CandleHero from './CandleHero'
import MidPrayerVerse from './MidPrayerVerse'
import ExitSheet from './ExitSheet'
import SharedIntercession from './SharedIntercession'
import { PRAYER_TIME_PRESETS } from './presets'
import { getCurrentMood } from './moodPalette'
import { PRAYER_THEMES, findTheme } from './prayerThemes'
import type { PrayerTheme } from './prayerThemes'
import { AMBIENCE_TRACKS, findAmbience } from './ambienceTracks'
import { useAmbience } from './useAmbience'
import { useWakeLock } from './useWakeLock'
import { ACTS_SEGMENTS } from './actsSegments'
import SegmentGuide from './SegmentGuide'
import { warmupChime, playChime } from './chime'
import { saveLastSetup, loadLastSetup } from './lastSetup'

type Stage = 'setup' | 'ritual' | 'praying'

// 무접촉 시 화면을 추가로 어둡게 하기까지의 대기 시간
const DIM_AFTER_MS = 20000

const PrayerFocus = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const tx = t as unknown as (k: string) => string
  const { data: verseData } = useDailyVerse()

  const verse = verseData
    ? { content: verseData.verse_text, reference: verseData.verse_reference, id: verseData.id }
    : null

  const mood = useMemo(() => getCurrentMood(), [])
  const lastSetup = useMemo(() => loadLastSetup(), [])

  const [stage, setStage] = useState<Stage>('setup')
  // 시간은 항상 선택돼 있다 — 마지막 설정 또는 15분(조용히 집중하기)이 기본
  const [selectedMinutes, setSelectedMinutes] = useState<number>(lastSetup?.minutes ?? 15)
  const [selectedTheme, setSelectedTheme] = useState<PrayerTheme | null>(null)
  const [ambienceId, setAmbienceId] = useState<string>('silent')
  const [helpersOpen, setHelpersOpen] = useState(false)
  const [showMidVerse, setShowMidVerse] = useState(false)
  const [guidedMode, setGuidedMode] = useState(false)
  const [chimeOn, setChimeOn] = useState(true)
  const [soundMuted, setSoundMuted] = useState(false)
  const [guideSegIndex, setGuideSegIndex] = useState<number | null>(null)
  const [showExitSheet, setShowExitSheet] = useState(false)
  // 중도 종료로 부분 세션을 기록할 때의 실제 기도 초 (null 이면 정상 진행 중)
  const [earlyFinishSeconds, setEarlyFinishSeconds] = useState<number | null>(null)
  const [dimmed, setDimmed] = useState(false)

  const ambience = useAmbience(ambienceId)

  const {
    timeLeft,
    totalSeconds,
    isRunning,
    isPaused,
    isComplete,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    extendTimer,
  } = usePrayerTimer({
    onComplete: () => {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }
      ambience.stop()
    },
    onHalfway: () => setShowMidVerse(true),
  })

  // 기도 중 화면이 자동으로 꺼지지 않도록 유지
  useWakeLock(stage === 'praying' && !isComplete && earlyFinishSeconds === null)

  // ── 무접촉 디밍 — 일정 시간 터치가 없으면 다이얼을 은은하게 낮춘다 ──
  const dimTimerRef = useRef<number | null>(null)
  const clearDimTimer = useCallback(() => {
    if (dimTimerRef.current) {
      clearTimeout(dimTimerRef.current)
      dimTimerRef.current = null
    }
  }, [])
  const wake = useCallback(() => {
    setDimmed(false)
    clearDimTimer()
    dimTimerRef.current = window.setTimeout(() => setDimmed(true), DIM_AFTER_MS)
  }, [clearDimTimer])

  useEffect(() => {
    const active = stage === 'praying' && isRunning && !isPaused && !isComplete && !showExitSheet
    if (active) {
      wake()
    } else {
      clearDimTimer()
      setDimmed(false)
    }
    return clearDimTimer
  }, [stage, isRunning, isPaused, isComplete, showExitSheet, wake, clearDimTimer])

  // 안내/말씀이 떠오르는 순간엔 화면을 깨워 보여준다 (이후 디밍 대기 재시작)
  useEffect(() => {
    if (showMidVerse || guideSegIndex !== null) {
      wake()
    }
  }, [showMidVerse, guideSegIndex, wake])

  // ── ACTS 구간 안내 — 경과 시간을 4등분해 현재 구간을 계산 ──
  const actsIndex =
    guidedMode && totalSeconds > 0
      ? Math.min(3, Math.floor(((totalSeconds - timeLeft) / totalSeconds) * 4))
      : -1
  const prevActsRef = useRef(-1)
  useEffect(() => {
    if (actsIndex < 0) {
      prevActsRef.current = -1
      return
    }
    // 앞으로 나아갈 때만 안내를 띄운다 (+5분 연장으로 인덱스가 되돌아가는 경우는 무시)
    if (actsIndex > prevActsRef.current) {
      const isFirst = prevActsRef.current === -1
      prevActsRef.current = actsIndex
      setGuideSegIndex(actsIndex)
      if (!isFirst) {
        if ('vibrate' in navigator) {
          navigator.vibrate(40)
        }
        if (chimeOn) playChime()
      }
    }
  }, [actsIndex, chimeOn])

  // ── 설정 화면에서 배경음 트랙을 바꾸면 짧게 미리 들려준다 ──
  const prevAmbienceRef = useRef(ambienceId)
  useEffect(() => {
    if (prevAmbienceRef.current === ambienceId) return
    prevAmbienceRef.current = ambienceId
    if (stage === 'setup' && ambienceId !== 'silent') {
      ambience.preview()
    }
  }, [ambienceId, stage, ambience])

  // 주제별 시작 멘트(없으면 기본 골방 말씀)
  const ritualQuoteKey = selectedTheme?.startQuoteKey
  const ritualQuoteRefKey = selectedTheme?.startQuoteRefKey

  // 하단 CTA — 선택을 마치고 진입 의식으로
  const handleEnter = () => {
    setStage('ritual')
  }

  // "지난 기도 그대로 시작" — 마지막 설정을 복원하고 바로 진입 의식으로
  const handleQuickStart = () => {
    if (!lastSetup) return
    setSelectedTheme(findTheme(lastSetup.themeId))
    setAmbienceId(lastSetup.ambienceId)
    setGuidedMode(lastSetup.guidedMode)
    setSelectedMinutes(lastSetup.minutes)
    setStage('ritual')
  }

  const handleRitualEnter = () => {
    if (!selectedMinutes) return
    // 사용자 제스처 시점에 차임용 AudioContext 를 깨워둔다
    warmupChime()
    saveLastSetup({
      minutes: selectedMinutes,
      themeId: selectedTheme?.id ?? null,
      ambienceId,
      guidedMode,
    })
    setStage('praying')
    setShowMidVerse(false)
    setSoundMuted(false)
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
    if (!soundMuted) ambience.play()
  }

  // 기도 중 배경음만 켜고 끄기 (타이머와 무관)
  const handleToggleSound = () => {
    if (soundMuted) {
      setSoundMuted(false)
      if (!isPaused) ambience.play()
    } else {
      setSoundMuted(true)
      ambience.pause()
    }
  }

  const handleReset = () => {
    resetTimer()
    setShowMidVerse(false)
    setGuideSegIndex(null)
    setSoundMuted(false)
    setShowExitSheet(false)
    setEarlyFinishSeconds(null)
    ambience.stop()
    // 시간/주제 선택은 유지한 채 설정 화면으로 — 다시 시작하기 편하도록
    setStage('setup')
  }

  // ── 이탈 흐름 — 기도 중엔 OS confirm 대신 인앱 시트로 ──
  const wasPausedBeforeSheetRef = useRef(false)

  const handleClose = () => {
    if (stage === 'praying' && (isRunning || isPaused) && !isComplete) {
      wasPausedBeforeSheetRef.current = isPaused
      if (!isPaused) {
        pauseTimer()
        ambience.pause()
      }
      setShowExitSheet(true)
      return
    }
    ambience.stop()
    navigate(-1)
  }

  const handleExitStay = () => {
    setShowExitSheet(false)
    if (!wasPausedBeforeSheetRef.current) {
      resumeTimer()
      if (!soundMuted) ambience.play()
    }
  }

  const handleExitSaveAndFinish = () => {
    const elapsed = Math.max(60, totalSeconds - timeLeft)
    setShowExitSheet(false)
    ambience.stop()
    // 타이머 상태를 정리해 완료 화면에서 이탈 경고(beforeunload)가 남지 않게 한다
    resetTimer()
    setEarlyFinishSeconds(elapsed)
  }

  const handleExitDiscard = () => {
    setShowExitSheet(false)
    ambience.stop()
    navigate(-1)
  }

  // 기도 화면/완료 화면에 쓰이는 세션 말씀 (주제 중간 말씀 > 오늘의 말씀)
  const sessionVerseText = selectedTheme?.midVerseTextKey ? tx(selectedTheme.midVerseTextKey) : verse?.content
  const sessionVerseRef = selectedTheme?.midVerseRefKey ? tx(selectedTheme.midVerseRefKey) : verse?.reference

  // 완료 화면 (정상 완료 또는 중도 종료 부분 기록)
  if ((isComplete || earlyFinishSeconds !== null) && selectedMinutes) {
    const durationMinutes =
      earlyFinishSeconds !== null
        ? Math.max(1, Math.round(earlyFinishSeconds / 60))
        : Math.round(totalSeconds / 60) || selectedMinutes
    return (
      <SessionComplete
        duration={durationMinutes}
        theme={selectedTheme}
        mood={mood}
        verseId={verse?.id}
        verseText={sessionVerseText}
        verseRef={sessionVerseRef}
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
      <div
        className={`min-h-screen ${mood.bgBase} text-white relative overflow-hidden`}
        onPointerDown={wake}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] ${mood.glowA} rounded-full blur-[120px] opacity-50`}></div>
        </div>

        {/* 닫기 버튼만 최소한으로 */}
        <button
          onClick={handleClose}
          className={`absolute top-10 right-6 z-20 w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/5 flex items-center justify-center hover:bg-white/15 transition-all duration-1000 ${
            dimmed ? 'opacity-25' : 'opacity-100'
          }`}
          aria-label="close"
        >
          <span className="material-icons-outlined text-lg text-white/60">close</span>
        </button>

        {/* 중간 말씀(절반 시점 fade-in) — 구간 안내 모드에서는 구간 안내가 대신한다 */}
        <MidPrayerVerse
          show={showMidVerse && !guidedMode}
          verseText={sessionVerseText}
          verseRef={sessionVerseRef}
          onHide={() => setShowMidVerse(false)}
        />

        {/* ACTS 구간 진입 안내 */}
        {guidedMode && (
          <SegmentGuide
            segment={guideSegIndex !== null ? ACTS_SEGMENTS[guideSegIndex] : null}
            accentText={mood.accentText}
            onHide={() => setGuideSegIndex(null)}
          />
        )}

        {/* 중보 기도 — 이번 주 공동 기도제목을 하단에 잔잔히 순환 표시 */}
        <SharedIntercession
          show={selectedTheme?.id === 'intercession' || (guidedMode && actsIndex === 3)}
          accentText={mood.accentText}
        />

        {/* 포모도로 다이얼 — 화면 가운데. 무접촉 시 은은하게 디밍 */}
        <div
          className={`relative z-10 min-h-screen flex flex-col items-center justify-center px-6 transition-opacity duration-[2000ms] ease-in-out ${
            dimmed ? 'opacity-30' : 'opacity-100'
          }`}
        >
          {/* 상단 칩 — 구간 안내 모드면 현재 구간, 아니면 선택한 테마.
              위쪽 안내/말씀이 떠 있는 동안은 겹치지 않게 잠깐 숨긴다 */}
          {guidedMode && actsIndex >= 0 ? (
            <div
              className={`mb-8 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md transition-opacity duration-700 ${
                guideSegIndex !== null ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <span className="material-icons-outlined text-sm text-white/60">{ACTS_SEGMENTS[actsIndex].icon}</span>
              <span className="text-xs text-white/70 tracking-wide">{tx(ACTS_SEGMENTS[actsIndex].labelKey)}</span>
              <span className="text-[10px] text-white/35 tabular-nums">{actsIndex + 1}/4</span>
            </div>
          ) : selectedTheme ? (
            <div
              className={`mb-8 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md transition-opacity duration-700 ${
                showMidVerse ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <span className="material-icons-outlined text-sm text-white/60">{selectedTheme.icon}</span>
              <span className="text-xs text-white/70 tracking-wide">{tx(selectedTheme.labelKey)}</span>
            </div>
          ) : null}

          <TimerDisplay
            timeLeft={timeLeft}
            totalSeconds={totalSeconds}
            isPaused={isPaused}
            statusLabel={isPaused ? t('timerPausedBadge') : t('praying')}
            ringFrom={mood.ringFrom}
            ringTo={mood.ringTo}
            segmented={guidedMode}
          />

          <div className="mt-14">
            <TimerControls
              isPaused={isPaused}
              buttonGradient={mood.buttonGradient}
              onPause={handlePause}
              onResume={handleResume}
              onReset={handleReset}
              onExtend={() => extendTimer(5 * 60)}
              showSoundToggle={ambienceId !== 'silent'}
              isMuted={soundMuted}
              onToggleSound={handleToggleSound}
            />
          </div>
        </div>

        {/* 이탈 확인 시트 — 부분 기록 지원 */}
        <ExitSheet
          show={showExitSheet}
          elapsedSeconds={totalSeconds - timeLeft}
          mood={mood}
          onStay={handleExitStay}
          onSaveAndFinish={handleExitSaveAndFinish}
          onDiscard={handleExitDiscard}
        />
      </div>
    )
  }

  // 시작 화면 (setup) — 촛불 히어로 + 마음 → 시간 → 진입 CTA
  const selectedPreset = PRAYER_TIME_PRESETS.find((p) => p.minutes === selectedMinutes)
  const helpersSummary =
    [
      guidedMode ? t('guidedPrayerTitle') : null,
      ambienceId !== 'silent' && findAmbience(ambienceId) ? tx(findAmbience(ambienceId)!.labelKey) : null,
    ]
      .filter(Boolean)
      .join(' · ') || t('helpersNoneSummary')

  return (
    // sticky CTA가 동작하도록 루트엔 overflow-hidden을 두지 않는다 (글로우 클리핑은 아래 absolute 컨테이너가 담당)
    <div className={`min-h-screen ${mood.bgBase} text-white relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[18%] left-[8%] w-96 h-96 ${mood.glowA} rounded-full blur-3xl opacity-70`}></div>
        <div className={`absolute bottom-[18%] right-[8%] w-96 h-96 ${mood.glowB} rounded-full blur-3xl opacity-70`}></div>
        <div className={`absolute bottom-0 right-0 w-80 h-80 ${mood.glowD} rounded-full blur-[100px] translate-x-1/4`}></div>
      </div>

      <div className="relative z-10 pt-12 px-6 flex items-center justify-between">
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/5 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <span className="material-icons-outlined text-xl">close</span>
        </button>
        <h1 className="text-white/55 text-[13px] font-medium tracking-wide">{t('prayerFocusMode')}</h1>
        <div className="w-10 opacity-0"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 pb-8 max-w-md mx-auto animate-fade-in">
        {/* 촛불 히어로 */}
        <div className="mt-4 mb-2">
          <CandleHero haloTint={mood.ringFrom} />
        </div>

        {/* 시간대별 인사 */}
        <div className="text-center mb-7">
          <h2 className="font-serif-kr text-[22px] leading-relaxed text-white/95">{tx(mood.greetingKey)}</h2>
          <p className="mt-1.5 text-[13px] text-white/40">{t('focusGreetingSub')}</p>
        </div>

        {/* 지난 기도 그대로 — 조용한 원탭 재시작 */}
        {lastSetup && (
          <button
            onClick={handleQuickStart}
            className="mb-9 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors"
          >
            <span className="material-icons-outlined text-[15px] text-white/50">replay</span>
            <span className="text-[12px] font-medium text-white/80">{t('quickStartTitle')}</span>
            <span className="text-[11px] text-white/40">
              {[
                `${lastSetup.minutes}${t('minutes')}`,
                findTheme(lastSetup.themeId) ? tx(findTheme(lastSetup.themeId)!.labelKey) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </button>
        )}

        {/* ① 마음 — 주제 선택 */}
        <div className="w-full mb-8">
          <p className="text-white/55 text-[13px] mb-3 text-center font-serif-kr">{t('selectPrayerTheme')}</p>
          <div className="grid grid-cols-3 gap-2">
            {PRAYER_THEMES.map((theme) => {
              const active = selectedTheme?.id === theme.id
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(active ? null : theme)}
                  className={`rounded-2xl py-3.5 px-2 text-xs font-medium tracking-wide border transition-all duration-300 backdrop-blur-md ${
                    active
                      ? 'bg-white/[0.10] text-white'
                      : 'border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white/85'
                  }`}
                  style={
                    active
                      ? { borderColor: `${mood.ringFrom}99`, boxShadow: `0 0 24px ${mood.ringFrom}30` }
                      : undefined
                  }
                >
                  <span
                    className={`material-icons-outlined text-lg block mb-1 ${active ? mood.accentText : 'text-white/40'}`}
                  >
                    {theme.icon}
                  </span>
                  {tx(theme.labelKey)}
                </button>
              )
            })}
          </div>
          {/* 선택한 마음의 한 줄 설명 — 없으면 주제 없이도 된다는 안내 */}
          <p
            key={selectedTheme?.id ?? 'none'}
            className={`text-[12px] text-center mt-3 animate-fade-in ${selectedTheme ? mood.accentText : 'text-white/30'}`}
          >
            {selectedTheme ? tx(selectedTheme.descKey) : t('prayerThemeOptional')}
          </p>
        </div>

        {/* ② 머무는 시간 */}
        <div className="w-full mb-8">
          <p className="text-white/55 text-[13px] mb-3 text-center font-serif-kr">{t('stayHowLong')}</p>
          <div className="grid grid-cols-5 gap-2">
            {PRAYER_TIME_PRESETS.map((preset) => {
              const active = selectedMinutes === preset.minutes
              return (
                <button
                  key={preset.minutes}
                  onClick={() => setSelectedMinutes(preset.minutes)}
                  className={`rounded-xl py-3 flex flex-col items-center border transition-all duration-300 backdrop-blur-md ${
                    active
                      ? 'bg-white/[0.10] text-white'
                      : 'border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08]'
                  }`}
                  style={
                    active
                      ? { borderColor: `${mood.ringFrom}99`, boxShadow: `0 0 24px ${mood.ringFrom}30` }
                      : undefined
                  }
                >
                  <span className="text-lg font-semibold tabular-nums leading-none">{preset.minutes}</span>
                  <span className={`text-[10px] mt-1 ${active ? 'text-white/60' : 'text-white/35'}`}>
                    {t('minutes')}
                  </span>
                </button>
              )
            })}
          </div>
          {selectedPreset && (
            <p key={selectedMinutes} className={`text-[12px] text-center mt-3 animate-fade-in ${mood.accentText}`}>
              {tx(selectedPreset.labelKey)}
            </p>
          )}
        </div>

        {/* ③ 기도를 돕는 것들 — 접이식 (구간 안내 + 차임 + 배경음) */}
        <div className="w-full mb-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-hidden">
          <button
            onClick={() => setHelpersOpen((v) => !v)}
            aria-expanded={helpersOpen}
            className="w-full py-3.5 px-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="material-icons-outlined text-lg text-white/40">tune</span>
              <div>
                <div className="text-[13px] font-medium text-white/85">{t('helpersTitle')}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{helpersSummary}</div>
              </div>
            </div>
            <span
              className={`material-icons-outlined text-white/40 transition-transform duration-300 ${
                helpersOpen ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </button>

          {helpersOpen && (
            <div className="px-4 pb-4 space-y-3 animate-fade-in">
              {/* 구간 안내 기도(ACTS) 토글 */}
              <button
                onClick={() => setGuidedMode((v) => !v)}
                role="switch"
                aria-checked={guidedMode}
                className="w-full rounded-xl py-3 px-3.5 flex items-center justify-between border border-white/10 bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className={`material-icons-outlined text-lg ${guidedMode ? mood.accentText : 'text-white/40'}`}>
                    signpost
                  </span>
                  <div>
                    <div className="text-[13px] font-medium text-white/85">{t('guidedPrayerTitle')}</div>
                    <div className="text-[11px] text-white/40 mt-0.5">{t('guidedPrayerDesc')}</div>
                  </div>
                </div>
                <div
                  className={`shrink-0 w-10 h-6 rounded-full p-0.5 transition-colors ${
                    guidedMode ? `bg-gradient-to-r ${mood.buttonGradient}` : 'bg-white/15'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      guidedMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  ></div>
                </div>
              </button>

              {/* 구간 전환 차임 — 안내 모드일 때만 */}
              {guidedMode && (
                <button
                  onClick={() => setChimeOn((v) => !v)}
                  role="switch"
                  aria-checked={chimeOn}
                  className="w-full rounded-xl py-2.5 px-3.5 flex items-center justify-between border border-white/10 bg-white/[0.03] transition-all animate-fade-in"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className={`material-icons-outlined text-base ${chimeOn ? mood.accentText : 'text-white/40'}`}>
                      notifications
                    </span>
                    <div>
                      <div className="text-[12px] font-medium text-white/80">{t('chimeToggleTitle')}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">{t('chimeToggleDesc')}</div>
                    </div>
                  </div>
                  <div
                    className={`shrink-0 w-9 h-5 rounded-full p-0.5 transition-colors ${
                      chimeOn ? `bg-gradient-to-r ${mood.buttonGradient}` : 'bg-white/15'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        chimeOn ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    ></div>
                  </div>
                </button>
              )}

              {/* 배경음 — 탭하면 짧게 미리 들려준다 */}
              <div>
                <p className="text-white/40 text-[11px] mb-2">{t('ambience')}</p>
                <div className="flex flex-wrap gap-2">
                  {AMBIENCE_TRACKS.map((track) => {
                    const active = ambienceId === track.id
                    return (
                      <button
                        key={track.id}
                        onClick={() => setAmbienceId(track.id)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide border transition-all flex items-center gap-1.5 ${
                          active
                            ? 'bg-white/[0.12] text-white'
                            : 'border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08]'
                        }`}
                        style={active ? { borderColor: `${mood.ringFrom}99` } : undefined}
                      >
                        <span className={`material-icons-outlined text-sm ${active ? mood.accentText : ''}`}>
                          {track.icon}
                        </span>
                        {tx(track.labelKey)}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 진입 CTA — 스크롤해도 손 닿는 곳에 */}
        <div className="sticky bottom-5 w-full mt-4 z-20">
          <button
            onClick={handleEnter}
            className={`w-full rounded-2xl py-4 bg-gradient-to-r ${mood.buttonGradient} shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99]`}
          >
            <div className="text-[15px] font-semibold text-white">{t('enterPrayerCta')}</div>
            <div className="text-[11px] text-white/75 mt-0.5">
              {`${selectedMinutes}${t('minutes')}`} ·{' '}
              {selectedTheme ? tx(selectedTheme.labelKey) : t('freePrayerFallback')}
            </div>
          </button>
        </div>

        {/* 오늘의 말씀 - Footer */}
        {verse && (
          <div className="w-full mt-8">
            <VerseDisplay verse={verse} />
          </div>
        )}
      </div>
    </div>
  )
}

export default PrayerFocus
