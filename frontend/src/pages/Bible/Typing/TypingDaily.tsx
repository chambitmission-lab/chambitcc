import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import { useSubmitTyping, useTypingDaily } from '../../../hooks/useBibleTyping'
import { useTickingNow } from '../../../hooks/useTickingNow'
import { KST_OFFSET_MS } from '../../../utils/kstTime'
import { tokenStore } from '../../../utils/tokenStore'
import { showToast } from '../../../utils/toast'
import TypingPad, { type TypingFinish } from './TypingPad'
import { PASS_ACCURACY } from './hangulTyping'
import { formatDuration, useIgnorePunct } from './typingPrefs'
import { playTypingSound } from './typingSound'
import { renderDailyCard, shareOrDownload } from './dailyCard'
import SoundMenu from './SoundMenu'
import Faces from './home/Faces'
import './typing.css'

const DAY_MS = 24 * 3600 * 1000

/** KST 자정까지 남은 시간 'H시간 M분' */
const untilMidnight = (now: number) => {
  const left = DAY_MS - ((now + KST_OFFSET_MS) % DAY_MS)
  const h = Math.floor(left / 3600000)
  const m = Math.floor((left % 3600000) / 60000)
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`
}

const dateLabelOf = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return { long: `${y}. ${m}. ${d}.`, short: `${m}월 ${d}일` }
}

/**
 * 오늘의 한 절 — 교회 전체가 같은 구절 하나를 1분 동안 새긴다.
 * 다 쓰면 '우리 교회 N번째' 결과 카드를 이미지로 나눌 수 있고, 내일 0시에 새 절이 열린다.
 */
const TypingDaily = () => {
  const navigate = useNavigate()
  const loggedIn = !!tokenStore.getAccess()
  const { data: daily, isLoading, error, refetch: refetchDaily } = useTypingDaily()
  const submit = useSubmitTyping()
  const [ignorePunct] = useIgnorePunct()
  const [attempt, setAttempt] = useState(0)
  const [note, setNote] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const now = useTickingNow(30_000)

  const v = daily?.verse
  const me = daily?.me
  const ref = v ? `${v.book_name} ${v.chapter}:${v.label}` : ''
  const date = daily ? dateLabelOf(daily.date) : null

  const handleFinish = async (r: TypingFinish) => {
    if (!v) return
    if (r.suspicious) {
      setNote('한꺼번에 들어온 입력은 기록되지 않아요. 직접 써 볼까요?')
      return
    }
    if (r.accuracy < PASS_ACCURACY) {
      setNote(`정확도 ${Math.round(r.accuracy * 100)}% — 95% 이상이면 새겨져요`)
      return
    }
    setSaving(true)
    try {
      const res = await submit.mutateAsync({
        verse_id: v.id,
        mode: 'copy',
        accuracy: r.accuracy,
        char_count: r.charCount,
        keystrokes: r.keystrokes,
        duration_ms: r.durationMs,
        merged_verse_ids: v.merged_ids,
      })
      if (!res.passed) {
        setNote(res.counted ? '정확도가 조금 모자라요 — 다시 써 볼까요?' : '너무 빠른 입력이라 기록으로 인정되지 않았어요')
        return
      }
      playTypingSound('finish')
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: ['#3182f6', '#60a5fa', '#ffb547', '#ffe08a'] })
      // 결과(순번)는 오늘의 한 절을 다시 받아야 채워진다 — useSubmitTyping 은 daily 를 stale 로만
      // 표시하므로(세션 화면 요청 줄이기) 여기서 직접 받는다. 받는 동안은 '새기는 중…' 유지
      await refetchDaily()
    } catch {
      setNote('기록을 저장하지 못했어요 — 연결을 확인해 주세요')
    } finally {
      setSaving(false)
    }
  }

  const share = async () => {
    if (!v || !me || !date) return
    setSharing(true)
    try {
      const blob = await renderDailyCard({
        text: v.text,
        refLabel: ref,
        dateLabel: date.long,
        statLine: `우리 교회 ${me.rank}번째로 새김 · ${formatDuration(me.duration_ms)} · 정확도 ${Math.round(me.accuracy * 100)}%`,
      })
      if (!blob) throw new Error('canvas')
      const result = await shareOrDownload(blob, `오늘의한절-${daily?.date}.png`, `오늘의 한 절 · ${ref}`)
      if (result === 'downloaded') showToast('카드 이미지를 저장했어요', 'success')
    } catch {
      showToast('카드를 만들지 못했어요', 'error')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="typing" />

        <main className="bt-shell bt-shell--session bt-shell--daily">
          <header className="bt-head">
            <button type="button" className="bt-icon-btn" onClick={() => navigate('/bible/typing')} aria-label="필사 홈으로">
              <span className="material-icons-round">arrow_back</span>
            </button>
            <div className="bt-head__titles">
              <span className="bt-head__eyebrow">오늘의 한 절</span>
              <h1 className="bt-head__title">{date ? `${date.short}의 말씀` : '오늘의 말씀'}</h1>
            </div>
            <SoundMenu />
          </header>

          {!loggedIn && (
            <p className="bt-note">
              <Link to="/login">로그인</Link>하면 교회 성도들과 같은 말씀을 함께 새기고 순번을 받을 수 있어요.
            </p>
          )}
          {loggedIn && isLoading && <p className="bt-empty">오늘의 말씀을 펼치는 중…</p>}
          {error && <p className="bt-empty">오늘의 한 절을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>}

          {v && !me && (
            <section className="bt-card bt-active bt-daily-write">
              <div className="bt-daily-write__top">
                <span className="bt-verse-no">{ref}</span>
                <span className="bt-daily-write__people">
                  {daily && daily.recent.length > 0 && <Faces people={daily.recent} max={4} />}
                  {daily && daily.done_count > 0 ? `오늘 ${daily.done_count}명이 먼저 썼어요` : '오늘 첫 번째로 새겨 보세요'}
                </span>
              </div>
              <TypingPad
                key={`${v.id}-${attempt}-${ignorePunct ? 1 : 0}`}
                text={v.text}
                mode="copy"
                ignorePunct={ignorePunct}
                disabled={saving}
                onStart={() => setNote(null)}
                onFinish={(r) => void handleFinish(r)}
              />
              {saving && (
                <div className="bt-outcome bt-outcome--saving" role="status">
                  새기는 중…
                </div>
              )}
              {note && !saving && (
                <div className="bt-outcome bt-outcome--failed" role="status">
                  <span>{note}</span>
                  <span className="bt-outcome__actions">
                    <button
                      type="button"
                      className="bt-btn bt-btn--primary"
                      onClick={() => {
                        setNote(null)
                        setAttempt((n) => n + 1)
                      }}
                    >
                      다시 쓰기
                    </button>
                  </span>
                </div>
              )}
            </section>
          )}

          {v && me && date && (
            <section className="bt-daily-result">
              <figure className="bt-daily-paper">
                <p className="bt-daily-paper__eyebrow">
                  오늘의 한 절 <span>{date.long}</span>
                </p>
                <blockquote className="bt-daily-paper__text">{v.text}</blockquote>
                <figcaption className="bt-daily-paper__ref">— {ref}</figcaption>
                <p className="bt-daily-paper__stat">
                  우리 교회 <b>{me.rank}</b>번째로 새김 · {formatDuration(me.duration_ms)} · 정확도 {Math.round(me.accuracy * 100)}%
                </p>
              </figure>

              <p className="bt-daily-result__people">
                {daily && daily.recent.length > 0 && <Faces people={daily.recent} max={5} />}
                오늘 <b>{daily?.done_count ?? 0}</b>명이 이 말씀을 함께 새겼어요
              </p>

              <div className="bt-summary__actions">
                <button type="button" className="bt-btn bt-btn--primary bt-btn--block" disabled={sharing} onClick={() => void share()}>
                  <span className="material-icons-round" aria-hidden>
                    ios_share
                  </span>
                  {sharing ? '카드 만드는 중…' : '카드로 나누기'}
                </button>
                <button type="button" className="bt-btn bt-btn--block" onClick={() => navigate('/bible/typing')}>
                  오늘의 필사 이어 쓰기
                </button>
              </div>
              <p className="bt-daily-result__next">
                <span className="material-icons-round" aria-hidden>
                  schedule
                </span>
                다음 말씀은 {untilMidnight(now)} 뒤 0시에 열려요
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default TypingDaily
