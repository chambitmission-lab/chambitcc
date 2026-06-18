import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import type { MoodPalette } from './moodPalette'
import type { PrayerTheme } from './prayerThemes'
import {
  createPrayerSession,
  getPrayerSessionStats,
  recordLocalSession,
  updatePrayerSessionNote,
  type PrayerSessionStats,
} from '../../api/prayerSession'

interface SessionCompleteProps {
  duration: number  // 분 단위
  theme: PrayerTheme | null
  mood: MoodPalette
  verseId?: number
  ambienceId?: string
  onRestart: () => void
  onClose: () => void
}

const isLoggedIn = (): boolean => !!localStorage.getItem('access_token')

const SessionComplete = ({
  duration,
  theme,
  mood,
  verseId,
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

  // 마운트 시 세션 기록 + 통계 조회
  useEffect(() => {
    const seconds = duration * 60
    const payload = {
      duration: seconds,
      theme: theme?.id ?? null,
      verse_id: verseId ?? null,
      ambience: ambienceId as any,
      completed_at: new Date().toISOString(),
    }

    if (!isLoggedIn()) {
      // 비로그인 — 로컬에만 저장, 통계는 표시 안 함
      recordLocalSession(payload)
      return
    }

    setStatsLoading(true)
    ;(async () => {
      try {
        const session = await createPrayerSession(payload)
        setSessionId(session.id)
        const s = await getPrayerSessionStats()
        setStats(s)
      } catch (err) {
        setRecordError((err as Error).message)
        // 실패 시 로컬에라도 남김
        recordLocalSession(payload)
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

        {/* 격려 말씀 */}
        <div className="bg-[rgba(20,20,25,0.6)] backdrop-blur-xl rounded-2xl p-4 border border-white/8">
          <p className="text-white/75 leading-relaxed font-serif italic text-sm">
            "쉬지 말고 기도하라" — 데살로니가전서 5:17
          </p>
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
