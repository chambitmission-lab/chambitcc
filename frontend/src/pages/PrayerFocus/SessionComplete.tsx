import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import type { MoodPalette } from './moodPalette'
import type { PrayerTheme } from './prayerThemes'
import {
  createPrayerSession,
  getPrayerSessionStats,
  recordLocalSession,
  updatePrayerSessionNote,
  type AmbienceId,
  type PrayerSessionStats,
} from '../../api/prayerSession'
import { tokenStore } from '../../utils/tokenStore'

interface SessionCompleteProps {
  duration: number  // 분 단위
  theme: PrayerTheme | null
  mood: MoodPalette
  verseId?: number
  /** 이 세션에 쓰인 말씀 — "말씀 카드로 간직하기" 연결에 사용 */
  verseText?: string
  verseRef?: string
  ambienceId?: string
  onRestart: () => void
  onClose: () => void
}

const isLoggedIn = (): boolean => !!tokenStore.getAccess()

/* 세션 기록은 마운트 시 POST 한 번 — 그런데 이 화면은 두 번 기록되기 쉬운 자리에 있다.
   ① StrictMode(main.tsx)는 개발 중 마운트 이펙트를 setup→cleanup→setup 으로 두 번 돌린다.
   ② 완료 화면이 어떤 이유로든 언마운트 후 다시 마운트되면 같은 세션이 또 적재된다.
   ①은 컴포넌트 인스턴스가 유지되므로 ref 로 막히지만, ②는 ref 가 초기화돼 못 막는다.
   그래서 모듈 스코프에 "방금 기록한 세션"의 지문을 짧게 남겨 둘 다 차단한다.
   같은 지문의 진짜 두 번째 세션은 최소 duration 만큼 뒤에 오므로 창을 좁게 잡아도 안전하다. */
const RECORD_DEDUPE_MS = 15_000
let lastRecorded: { key: string; at: number } | null = null

const isDuplicateRecord = (key: string): boolean => {
  const now = Date.now()
  if (lastRecorded && lastRecorded.key === key && now - lastRecorded.at < RECORD_DEDUPE_MS) {
    return true
  }
  lastRecorded = { key, at: now }
  return false
}

const SessionComplete = ({
  duration,
  theme,
  mood,
  verseId,
  verseText,
  verseRef,
  ambienceId,
  onRestart,
  onClose,
}: SessionCompleteProps) => {
  const { t } = useLanguage()
  const tx = t as unknown as (k: string) => string
  const navigate = useNavigate()

  const [stats, setStats] = useState<PrayerSessionStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [amenPressed, setAmenPressed] = useState(false)
  const [recordError, setRecordError] = useState<string | null>(null)

  // 마운트 시 세션 기록 + 통계 조회 (중복 적재 방지는 위 isDuplicateRecord 주석 참고)
  const recordedRef = useRef(false)

  useEffect(() => {
    const seconds = duration * 60
    const payload = {
      duration: seconds,
      theme: theme?.id ?? null,
      verse_id: verseId ?? null,
      ambience: (ambienceId as AmbienceId | undefined) ?? null,
      completed_at: new Date().toISOString(),
    }

    if (recordedRef.current) return
    recordedRef.current = true
    // 이미 적재된 세션이면 POST 만 건너뛴다 — 통계는 읽기 전용이라 그대로 보여준다
    const alreadyRecorded = isDuplicateRecord(`${seconds}|${theme?.id ?? ''}|${verseId ?? ''}`)

    if (!isLoggedIn()) {
      // 비로그인 — 로컬에만 저장, 통계는 표시 안 함
      if (!alreadyRecorded) recordLocalSession(payload)
      return
    }

    setStatsLoading(true)
    ;(async () => {
      try {
        if (!alreadyRecorded) {
          const session = await createPrayerSession(payload)
          setSessionId(session.id)
        }
        const s = await getPrayerSessionStats()
        setStats(s)
      } catch (err) {
        setRecordError((err as Error).message)
        // 실패 시 로컬에라도 남김
        if (!alreadyRecorded) recordLocalSession(payload)
      } finally {
        setStatsLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveNote = async () => {
    const trimmed = note.trim()
    if (!trimmed) return
    if (!isLoggedIn()) {
      setRecordError(t('loginRequired') || '로그인이 필요합니다')
      return
    }
    if (!sessionId) {
      // 세션 기록 자체가 실패한 경우 — 묵상 메모를 붙일 대상이 없음
      setRecordError(recordError || t('prayerSessionSaveFailed') || '세션 기록에 실패해 묵상을 저장할 수 없습니다')
      return
    }
    setSavingNote(true)
    setRecordError(null)
    try {
      // 공개 감사가 아니라 이 기도 세션에 종속된 비공개 묵상 기록으로 저장
      await updatePrayerSessionNote(sessionId, trimmed.slice(0, 100))
      setNoteSaved(true)
    } catch (err) {
      setRecordError((err as Error).message)
    } finally {
      setSavingNote(false)
    }
  }

  const handleAmen = () => {
    setAmenPressed(true)
    if ('vibrate' in navigator) {
      navigator.vibrate(80)
    }
  }

  const closingMessage = theme?.closingMessageKey ? tx(theme.closingMessageKey) : t('prayerCompleteRest')

  return (
    <div className={`min-h-screen ${mood.bgBase} text-white relative overflow-hidden`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[20%] left-[10%] w-96 h-96 ${mood.glowA} rounded-full blur-3xl`}></div>
        <div className={`absolute bottom-[20%] right-[10%] w-96 h-96 ${mood.glowB} rounded-full blur-3xl`}></div>
      </div>

      <div className="relative z-10 px-4 py-10 max-w-md mx-auto space-y-6 animate-fade-in text-center">
        {/* 완료 Hero 카드 */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-[rgba(20,20,25,0.6)] backdrop-blur-xl border border-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

          <div className="relative z-10">
            {/* 완료 아이콘 (emblem) */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className={`w-24 h-24 bg-gradient-to-br ${mood.buttonGradient} rounded-full flex items-center justify-center animate-scale-in shadow-[0_10px_15px_-3px_rgba(168,85,247,0.25),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-4px_6px_rgba(0,0,0,0.2)]`}>
                <span className="material-icons-outlined text-5xl">check_circle</span>
              </div>
              <div className={`absolute inset-0 w-24 h-24 rounded-full animate-ping ${mood.glowC}`}></div>
            </div>

            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/70">
              {t('prayerComplete')}
            </h2>
            <p className="text-white/70 leading-relaxed mt-2">{closingMessage}</p>

            {/* 시간·주제 chip */}
            <div className="mt-4 flex justify-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full bg-white/8 border border-white/10 text-xs font-medium ${mood.accentText}`}>
                {duration} {t('minutes')}{theme ? ` · ${tx(theme.labelKey)}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* 영적 흔적 (통계) */}
        {isLoggedIn() && (
          <div className="bg-[rgba(20,20,25,0.6)] backdrop-blur-xl rounded-2xl p-5 border border-white/8 text-left">
            <div className="flex items-center gap-2 mb-3">
              <span className={`material-icons-outlined text-sm ${mood.accentText}`}>auto_awesome</span>
              <h3 className={`text-xs font-bold tracking-widest uppercase ${mood.accentText}`}>
                {t('spiritualTrace')}
              </h3>
            </div>

            {statsLoading && (
              <p className="text-white/40 text-sm text-center py-4">...</p>
            )}

            {!statsLoading && stats && (
              <>
                <p className="text-white/80 text-sm mb-4">
                  {(t('todaysPrayerAdded') || '오늘 {minutes}분이 기도에 더해졌습니다').replace(
                    '{minutes}',
                    String(duration),
                  )}
                </p>
                {stats.week_days && <WeekDots weekDays={stats.week_days} mood={mood} labels={t('weekdaysShort')} />}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <Stat value={stats.streak_days} unit={t('daysUnit')} label={t('streakDaysLabel')} mood={mood} />
                  <Stat value={stats.this_week_minutes} unit={t('minutesUnit')} label={t('thisWeekMinutesLabel')} mood={mood} />
                  <Stat value={stats.total_minutes} unit={t('minutesUnit')} label={t('totalMinutesLabel')} mood={mood} />
                  <Stat value={stats.average_duration_minutes} unit={t('minutesUnit')} label={t('averageSessionLabel')} mood={mood} />
                </div>
              </>
            )}

            {!statsLoading && !stats && recordError && (
              <p className="text-rose-300/70 text-xs text-center py-2">{recordError}</p>
            )}
          </div>
        )}

        {/* 한 줄 묵상 기록 (비공개 — 이 기도 세션에 종속) */}
        {isLoggedIn() && !noteSaved && (
          <div className="bg-[rgba(20,20,25,0.6)] backdrop-blur-xl rounded-2xl p-5 border border-white/8 text-left">
            <p className="text-white/75 text-sm mb-1">{t('recordOneLineTitle')}</p>
            <p className="text-white/40 text-xs mb-3 flex items-center gap-1">
              <span className="material-icons-outlined text-[13px]">lock</span>
              {t('devotionNotePrivateHint')}
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 100))}
              placeholder={t('recordOneLinePlaceholder')}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
            />
            <div className="flex justify-end mt-1.5">
              <span className="text-[10px] text-white/30">{note.length}/100</span>
            </div>
            <button
              onClick={handleSaveNote}
              disabled={!note.trim() || savingNote}
              className={`w-full mt-2 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r ${mood.buttonGradient} disabled:opacity-40 disabled:cursor-not-allowed transition-all`}
            >
              {savingNote ? '...' : t('saveOneLine')}
            </button>
          </div>
        )}

        {noteSaved && (
          <div className="bg-[rgba(20,20,25,0.6)] backdrop-blur-xl rounded-2xl p-4 border border-white/8 text-left">
            <p className={`text-sm ${mood.accentText}`}>✓ {t('devotionNoteSaved')}</p>
            <p className="text-white/50 text-xs mt-1.5">{t('devotionNoteSavedHint')}</p>
            <button
              onClick={() => navigate('/growth')}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white transition-colors"
            >
              <span className="material-icons-outlined text-sm">timeline</span>
              {t('viewInGrowth')}
            </button>
          </div>
        )}

        {/* 격려 말씀 + 세션 말씀 카드 만들기 */}
        <div className="bg-[rgba(20,20,25,0.6)] backdrop-blur-xl rounded-2xl p-4 border border-white/8">
          <p className="text-white/75 leading-relaxed font-serif italic text-sm">
            "쉬지 말고 기도하라" — 데살로니가전서 5:17
          </p>
          {verseText && verseRef && (
            <button
              onClick={() =>
                navigate('/bible/photo-verse', {
                  state: { presetVerse: { text: verseText, refLabel: verseRef } },
                })
              }
              className="mt-3 w-full py-2.5 rounded-xl text-xs font-medium text-white/80 bg-white/8 border border-white/12 hover:bg-white/15 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-icons-outlined text-sm">photo_camera</span>
              {t('makeVerseCard')}
            </button>
          )}
        </div>

        {/* 아멘 / 다시 / 닫기 */}
        <div className="space-y-3">
          {!amenPressed ? (
            <button
              onClick={handleAmen}
              className={`w-full py-4 bg-gradient-to-r ${mood.buttonGradient} rounded-xl font-semibold tracking-wide transition-all hover:shadow-[0_10px_25px_-5px_rgba(168,85,247,0.4)]`}
            >
              🙏 {t('amenButton')}
            </button>
          ) : (
            <div className={`w-full py-4 bg-white/10 border border-white/15 rounded-xl text-sm ${mood.accentText}`}>
              ✓ {t('amenSaved')}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onRestart}
              className="py-3 bg-white/10 backdrop-blur-md rounded-xl text-sm font-medium border border-white/15 hover:bg-white/20 transition-all"
            >
              {t('startAgain')}
            </button>
            <button
              onClick={onClose}
              className="py-3 bg-white/5 backdrop-blur-md rounded-xl text-sm font-medium border border-white/10 hover:bg-white/15 transition-all"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 이번 주(월~일) 기도한 날 도트 — 오늘은 링으로 강조
const WeekDots = ({ weekDays, mood, labels }: { weekDays: string[]; mood: MoodPalette; labels: string }) => {
  const toLocalISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))

  const prayed = new Set(weekDays)
  const todayISO = toLocalISO(today)
  const dayLabels = (labels || '월,화,수,목,금,토,일').split(',')

  return (
    <div className="flex justify-between mb-5 px-1">
      {Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        const iso = toLocalISO(d)
        const done = prayed.has(iso)
        const isToday = iso === todayISO
        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                done
                  ? `bg-gradient-to-br ${mood.buttonGradient} shadow-[0_2px_8px_rgba(0,0,0,0.3)]`
                  : 'bg-white/[0.06] border border-white/10'
              } ${isToday ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-transparent' : ''}`}
            >
              {done && <span className="material-icons-outlined text-[14px] text-white">check</span>}
            </div>
            <span className={`text-[10px] ${isToday ? 'text-white/80 font-semibold' : 'text-white/35'}`}>
              {dayLabels[i] ?? ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const Stat = ({ value, unit, label, mood }: { value: number; unit: string; label: string; mood: MoodPalette }) => (
  <div>
    <div className={`text-xl font-bold ${mood.accentText} whitespace-nowrap`}>
      {value}
      <span className="text-xs font-medium ml-0.5">{unit}</span>
    </div>
    <div className="text-[10px] text-white/50 mt-1 whitespace-nowrap">{label}</div>
  </div>
)

export default SessionComplete
