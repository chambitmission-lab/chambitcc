import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import { useLeaveTypingRelay, useTypingRelay, useTypingRelayLive } from '../../../hooks/useBibleTyping'
import { safeStorage } from '../../../utils/safeStorage'
import { showToast } from '../../../utils/toast'
import { tokenStore } from '../../../utils/tokenStore'
import { sessionPath, useTypingMode } from './typingPrefs'
import { shareRelayInvite } from './relayShare'
import Faces from './home/Faces'
import './typing.css'

// 멤버별 칸 색 — 들어온 순서대로 돌려 쓴다
const HUES = 6

/**
 * 릴레이 필사 상세 — 한 장의 칸들이 누구 손으로 채워졌는지.
 * 절을 미리 나누지 않는다: 아무 빈칸이나 쓰면 내 칸이 된다.
 */
const TypingRelay = () => {
  const navigate = useNavigate()
  const params = useParams()
  const [search, setSearch] = useSearchParams()
  const id = Number(params.id) || 0
  const loggedIn = !!tokenStore.getAccess()
  const { data: relay, isLoading, error } = useTypingRelay(id)
  // 다른 멤버가 칸을 채우면 새로고침 없이 바로 반영(SSE)
  useTypingRelayLive(id)
  const leave = useLeaveTypingRelay()
  const [mode] = useTypingMode()
  const isNew = search.get('new') === '1'

  const hueOf = useMemo(() => {
    const m = new Map<number, number>()
    relay?.members.forEach((mem, i) => m.set(mem.user_id, i % HUES))
    return m
  }, [relay])

  // 완성 축하는 이 기기에서 한 번만
  useEffect(() => {
    if (!relay?.completed) return
    const key = `bt-relay-done-${relay.id}`
    if (safeStorage.get(key)) return
    safeStorage.set(key, '1')
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.55 }, colors: ['#3182f6', '#60a5fa', '#ffb547', '#ffe08a'] })
  }, [relay])

  const unit = relay?.book_number === 19 ? '편' : '장'
  const ranked = useMemo(() => [...(relay?.members ?? [])].sort((a, b) => b.verses - a.verses), [relay])

  const onLeave = () => {
    if (!relay) return
    if (!window.confirm('이 릴레이에서 나갈까요? 내가 채운 칸은 빈칸으로 돌아가요.')) return
    leave.mutate(relay.id, {
      onSuccess: () => {
        showToast('릴레이에서 나왔어요', 'success')
        navigate('/bible/typing', { replace: true })
      },
      onError: (e) => showToast(e instanceof Error ? e.message : '나가지 못했어요', 'error'),
    })
  }

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="typing" />

        <main className="bt-shell bt-shell--session">
          <header className="bt-head">
            <button type="button" className="bt-icon-btn" onClick={() => navigate('/bible/typing')} aria-label="필사 홈으로">
              <span className="material-icons-round">arrow_back</span>
            </button>
            <div className="bt-head__titles">
              <span className="bt-head__eyebrow">릴레이 필사</span>
              <h1 className="bt-head__title">{relay?.title ?? '릴레이'}</h1>
            </div>
          </header>

          {!loggedIn && (
            <p className="bt-note">
              <Link to="/login">로그인</Link>하면 릴레이에 함께할 수 있어요.
            </p>
          )}
          {isLoading && <p className="bt-empty">릴레이를 불러오는 중…</p>}
          {error && <p className="bt-empty">{error instanceof Error ? error.message : '릴레이를 불러오지 못했어요'}</p>}

          {relay && (
            <>
              {isNew && !relay.completed && (
                <div className="bt-card bt-relay-hello">
                  <p>
                    <b>릴레이를 만들었어요!</b> 함께 쓸 사람을 초대해 보세요. 초대받은 사람이 이 장을 쓰면 빈칸이 하나씩 채워져요.
                  </p>
                  <div className="bt-relay-hello__actions">
                    <button type="button" className="bt-btn bt-btn--primary" onClick={() => void shareRelayInvite(relay)}>
                      초대하기
                    </button>
                    <button
                      type="button"
                      className="bt-btn bt-btn--ghost"
                      onClick={() => {
                        search.delete('new')
                        setSearch(search, { replace: true })
                      }}
                    >
                      나중에
                    </button>
                  </div>
                </div>
              )}

              <section className={`bt-card bt-relay${relay.completed ? ' is-done' : ''}`}>
                <p className="bt-relay__ref">
                  {relay.book_name} {relay.chapter}
                  {unit} · {relay.members.length}명 함께
                </p>
                <p className="bt-relay__lead">
                  {relay.completed ? (
                    <>함께 {relay.chapter}{unit}을 완성했어요!</>
                  ) : (
                    <>
                      <b className="brand-text-gradient">{relay.done}</b>
                      <span> / {relay.total}칸 채웠어요</span>
                    </>
                  )}
                </p>
                <div className="bt-relays__bar bt-relay__bar" aria-hidden>
                  <span style={{ width: `${relay.total ? (relay.done / relay.total) * 100 : 0}%` }} />
                </div>

                <div className="bt-relay__grid" role="list" aria-label="절별로 채운 사람">
                  {relay.verses.map((v) => {
                    const hue = v.by ? hueOf.get(v.by.user_id) ?? 0 : null
                    return (
                      <button
                        key={v.id}
                        type="button"
                        role="listitem"
                        className={`bt-relay__cell${v.by ? ` is-filled bt-hue-${hue}` : ''}`}
                        title={v.by ? `${v.label}절 · ${v.by.name}` : `${v.label}절 · 빈칸`}
                        onClick={() => navigate(sessionPath(relay.book_number, relay.chapter, mode, v.verse))}
                      >
                        <span className="bt-relay__no">{v.label}</span>
                        {v.by && <span className="bt-relay__who">{v.by.name.slice(0, 1)}</span>}
                      </button>
                    )
                  })}
                </div>

                <div className="bt-summary__actions">
                  {relay.next_verse !== null ? (
                    <button
                      type="button"
                      className="bt-btn bt-btn--primary bt-btn--block"
                      onClick={() => navigate(sessionPath(relay.book_number, relay.chapter, mode, relay.next_verse ?? undefined))}
                    >
                      빈칸 채우러 가기 · {relay.next_verse}절부터
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="bt-btn bt-btn--primary bt-btn--block"
                      onClick={() => navigate('/bible/typing')}
                    >
                      필사 홈으로
                    </button>
                  )}
                  <button type="button" className="bt-btn bt-btn--block" onClick={() => void shareRelayInvite(relay)}>
                    <span className="material-icons-round" aria-hidden>
                      person_add
                    </span>
                    함께 쓸 사람 초대하기
                  </button>
                </div>
              </section>

              <section className="bt-section">
                <h2 className="bt-section__title">함께 쓰는 사람</h2>
                <ul className="bt-card bt-relay-members">
                  {ranked.map((m) => (
                    <li key={m.user_id} className={m.is_me ? 'is-me' : ''}>
                      <span className={`bt-relay__swatch bt-hue-${hueOf.get(m.user_id) ?? 0}`} aria-hidden />
                      <Faces people={[m]} max={1} />
                      <span className="bt-relay-members__name">
                        {m.name}
                        {m.is_owner && <small> · 만든 사람</small>}
                      </span>
                      <span className="bt-relay-members__value">
                        <b>{m.verses}</b>칸
                      </span>
                    </li>
                  ))}
                </ul>
                <button type="button" className="bt-btn bt-btn--ghost bt-btn--block bt-relay__leave" onClick={onLeave} disabled={leave.isPending}>
                  릴레이 나가기
                </button>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default TypingRelay
