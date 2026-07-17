import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDailyMeditation } from '../../../hooks/useDailyMeditation'
import {
  useCreateMeditationRecord,
  useMeditationRecords,
  useMeditationStreak,
} from '../../../hooks/useMeditationRecords'
import { isAuthenticated } from '../../../utils/auth'
import { showToast } from '../../../utils/toast'
import { API_V1 } from '../../../config/api'
import type { EmotionTag, TimeOfDay } from '../../../types/meditation'
import './MeditationPage.css'

const EMOTIONS: { tag: EmotionTag; label: string; emoji: string }[] = [
  { tag: 'weary', label: '지쳤어요', emoji: '😮‍💨' },
  { tag: 'anxious', label: '불안해요', emoji: '😰' },
  { tag: 'lonely', label: '외로워요', emoji: '🥺' },
  { tag: 'grateful', label: '감사해요', emoji: '🙏' },
  { tag: 'joyful', label: '기뻐요', emoji: '😊' },
  { tag: 'peaceful', label: '평안해요', emoji: '😌' },
]

const TOD_TITLES: Record<TimeOfDay, string> = {
  morning: '아침 묵상',
  afternoon: '오후 묵상',
  evening: '저녁 묵상',
}

/* "오늘의 기도" 예시 — 시간대·감정에 따라 조합되는 짧은 기도문 */
const PRAYER_OPENINGS: Record<TimeOfDay, string> = {
  morning: '주님, 오늘 하루를 주님과 함께 시작합니다.',
  afternoon: '주님, 분주한 하루 가운데 잠시 주님 앞에 멈춰 섭니다.',
  evening: '주님, 오늘 하루를 주님의 손에 내려놓습니다.',
}

const PRAYER_EMOTIONS: Record<EmotionTag, string> = {
  weary: '지친 마음을 주님께 가져갑니다. 새 힘을 주옵소서.',
  anxious: '염려하는 마음을 주님께 맡깁니다. 평안을 주옵소서.',
  lonely: '외로운 마음 가운데 함께하심을 느끼게 하옵소서.',
  grateful: '베풀어주신 은혜에 감사드립니다.',
  joyful: '주신 기쁨이 주님께로부터 온 것임을 고백합니다.',
  peaceful: '주시는 평안을 누리며 감사드립니다.',
}

const SILENCE_SECONDS = 60

const MeditationPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const loggedIn = isAuthenticated()

  const todParam = searchParams.get('tod')
  const timeOfDay: TimeOfDay | undefined =
    todParam === 'morning' || todParam === 'afternoon' || todParam === 'evening'
      ? todParam
      : undefined

  const [emotion, setEmotion] = useState<EmotionTag | undefined>(undefined)
  const { data, isLoading, error } = useDailyMeditation({ emotion, timeOfDay })
  const { data: streak } = useMeditationStreak()
  const { data: records = [] } = useMeditationRecords(5)
  const createRecord = useCreateMeditationRecord()

  /* ── 구절 듣기 (TTS) ── */
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlaying(false)
  }

  useEffect(() => stopAudio, [])
  // 절이 바뀌면 재생 중이던 오디오 중지
  const verseKey = data
    ? `${data.verse.book_number}-${data.verse.chapter}-${data.verse.verse}`
    : ''
  useEffect(() => {
    stopAudio()
  }, [verseKey])

  const toggleAudio = () => {
    if (!data) return
    if (playing) {
      stopAudio()
      return
    }
    const { book_number, chapter, verse } = data.verse
    const audio = new Audio(
      `${API_V1}/bible/tts/${book_number}/${chapter}/${verse}?voice=female`
    )
    audioRef.current = audio
    audio.onended = () => setPlaying(false)
    audio.onerror = () => {
      setPlaying(false)
      showToast('음성을 불러오지 못했어요', 'error')
    }
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => showToast('음성을 불러오지 못했어요', 'error'))
  }

  /* ── 1분 침묵 타이머 ── */
  const [silenceLeft, setSilenceLeft] = useState<number | null>(null)
  const silenceDone = silenceLeft === 0

  useEffect(() => {
    if (silenceLeft === null || silenceLeft <= 0) return
    const t = setTimeout(() => setSilenceLeft(silenceLeft - 1), 1000)
    return () => clearTimeout(t)
  }, [silenceLeft])

  /* ── 묵상 기록 ── */
  const [journal, setJournal] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSaveRecord = async () => {
    if (!loggedIn) {
      navigate('/login')
      return
    }
    const content = journal.trim()
    if (!content) {
      showToast('묵상 내용을 적어주세요', 'info')
      return
    }
    setSaving(true)
    try {
      await createRecord.mutateAsync({
        content,
        verse_reference: data?.verse.reference ?? null,
        verse_text: data?.verse.text ?? null,
        emotion: emotion ?? null,
      })
      setJournal('')
      showToast('오늘의 묵상이 기록되었어요 🌱', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '저장에 실패했어요', 'error')
    } finally {
      setSaving(false)
    }
  }

  const prayerText = useMemo(() => {
    const tod = data?.context.time_of_day ?? 'morning'
    const lines = [PRAYER_OPENINGS[tod]]
    if (emotion) lines.push(PRAYER_EMOTIONS[emotion])
    if (data) {
      lines.push(`오늘 주신 말씀, ${data.verse.reference}의 말씀을 마음에 새깁니다.`)
    }
    lines.push('말씀대로 살아갈 힘을 주옵소서. 예수님의 이름으로 기도합니다. 아멘.')
    return lines.join(' ')
  }, [data, emotion])

  const pageTitle = TOD_TITLES[data?.context.time_of_day ?? timeOfDay ?? 'morning']

  return (
    <div className="meditation-page">
      <header className="mp-header">
        <button type="button" className="mp-back" onClick={() => navigate('/bible')} aria-label="성경으로">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <h1>{pageTitle}</h1>
        {loggedIn && streak && streak.current_streak > 0 && (
          <span className="mp-streak" title="연속 묵상 일수">
            🔥 {streak.current_streak}일
          </span>
        )}
        <button
          type="button"
          className="mp-bell"
          onClick={() => navigate('/bible/alarm')}
          aria-label="구절 알람 설정"
        >
          <span className="material-icons-round">notifications</span>
        </button>
      </header>

      {/* 감정 선택 — 고르면 본문 안에서 맞는 절이 다시 선택된다 */}
      <section className="mp-emotions" aria-label="지금 마음">
        <p className="mp-emotions-title">지금 마음은 어떠세요?</p>
        <div className="mp-emotion-chips">
          {EMOTIONS.map((e) => (
            <button
              key={e.tag}
              type="button"
              className={`mp-emotion-chip${emotion === e.tag ? ' is-active' : ''}`}
              aria-pressed={emotion === e.tag}
              onClick={() => setEmotion(emotion === e.tag ? undefined : e.tag)}
            >
              <span aria-hidden>{e.emoji}</span> {e.label}
            </button>
          ))}
        </div>
      </section>

      {isLoading ? (
        <div className="mp-skeleton" />
      ) : error || !data ? (
        <div className="mp-error">
          오늘의 묵상을 불러오지 못했어요.
          <br />
          잠시 후 다시 시도해주세요.
        </div>
      ) : (
        <>
          {/* 1. 말씀 */}
          <section className="mp-verse-card">
            <span className="mp-step-label">오늘의 말씀</span>
            <blockquote>
              <p className="mp-verse-text">"{data.verse.text}"</p>
              <cite>— {data.verse.reference}</cite>
            </blockquote>
            <div className="mp-verse-actions">
              <button type="button" className="mp-chip-btn" onClick={toggleAudio}>
                <span className="material-icons-round" aria-hidden>
                  {playing ? 'stop' : 'volume_up'}
                </span>
                {playing ? '멈추기' : '말씀 듣기'}
              </button>
              <button
                type="button"
                className="mp-chip-btn"
                onClick={() =>
                  navigate(
                    `/bible/${data.verse.book_number}/${data.verse.chapter}?verse=${data.verse.verse}`
                  )
                }
              >
                <span className="material-icons-round" aria-hidden>menu_book</span>
                본문 읽기
              </button>
            </div>
          </section>

          {/* 2. 묵상 질문 */}
          <section className="mp-block">
            <span className="mp-step-label">💭 오늘의 질문</span>
            <p className="mp-question">{data.meditation_question}</p>
            {data.redemptive_note && (
              <p className="mp-note">{data.redemptive_note}</p>
            )}
          </section>

          {/* 3. 1분 침묵 */}
          <section className="mp-block mp-silence">
            <span className="mp-step-label">🕯️ 잠시 멈춤</span>
            {silenceLeft === null ? (
              <>
                <p className="mp-silence-desc">
                  1분간 조용히 말씀을 마음에 담아보세요.
                </p>
                <button
                  type="button"
                  className="mp-secondary-btn"
                  onClick={() => setSilenceLeft(SILENCE_SECONDS)}
                >
                  1분 침묵 시작
                </button>
              </>
            ) : silenceDone ? (
              <p className="mp-silence-done">
                🌿 잘하셨어요. 말씀이 마음에 머물길 기도합니다.
              </p>
            ) : (
              <div className="mp-silence-timer" aria-live="polite">
                <div
                  className="mp-silence-ring"
                  style={{
                    background: `conic-gradient(var(--mp-accent) ${((SILENCE_SECONDS - silenceLeft) / SILENCE_SECONDS) * 360}deg, var(--mp-surface) 0deg)`,
                  }}
                >
                  <span>{silenceLeft}</span>
                </div>
                <button
                  type="button"
                  className="mp-text-btn"
                  onClick={() => setSilenceLeft(null)}
                >
                  그만하기
                </button>
              </div>
            )}
          </section>

          {/* 4. 오늘의 기도 */}
          <section className="mp-block">
            <span className="mp-step-label">🙏 오늘의 기도</span>
            <p className="mp-prayer">{prayerText}</p>
            <button
              type="button"
              className="mp-secondary-btn"
              onClick={() => navigate('/prayer-focus')}
            >
              <span className="material-icons-round" aria-hidden>self_improvement</span>
              집중 기도하러 가기
            </button>
          </section>

          {/* 5. 묵상 기록 */}
          <section className="mp-block">
            <span className="mp-step-label">✏️ 묵상 기록 남기기</span>
            <textarea
              className="mp-journal"
              rows={4}
              maxLength={3000}
              placeholder={
                loggedIn
                  ? '말씀을 읽고 떠오른 생각, 감사, 결단을 자유롭게 적어보세요'
                  : '로그인하면 묵상을 기록하고 연속 일수를 쌓을 수 있어요'
              }
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              disabled={!loggedIn}
            />
            <button
              type="button"
              className="mp-primary-btn"
              onClick={handleSaveRecord}
              disabled={saving}
            >
              {loggedIn ? (saving ? '저장 중…' : '기록 저장') : '로그인하고 기록하기'}
            </button>
          </section>

          {/* 최근 기록 */}
          {loggedIn && records.length > 0 && (
            <section className="mp-block">
              <span className="mp-step-label">🌱 나의 최근 묵상</span>
              <ul className="mp-records">
                {records.map((r) => (
                  <li key={r.id}>
                    <div className="mp-record-head">
                      <span className="mp-record-date">{r.record_date}</span>
                      {r.verse_reference && (
                        <span className="mp-record-ref">{r.verse_reference}</span>
                      )}
                    </div>
                    <p className="mp-record-content">{r.content}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default MeditationPage
