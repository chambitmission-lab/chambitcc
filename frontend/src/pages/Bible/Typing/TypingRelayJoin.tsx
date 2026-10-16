import { Link, useNavigate, useParams } from 'react-router-dom'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import { useJoinTypingRelay, useTypingRelayInvite } from '../../../hooks/useBibleTyping'
import { chapterUnit } from '../../../utils/bibleLabels'
import { showToast } from '../../../utils/toast'
import { tokenStore } from '../../../utils/tokenStore'
import './typing.css'

/** 릴레이 필사 초대 링크 랜딩 — 비로그인이면 로그인 후 이 페이지로 돌아온다 */
const TypingRelayJoin = () => {
  const navigate = useNavigate()
  const { code = '' } = useParams()
  const loggedIn = !!tokenStore.getAccess()
  const { data: preview, isLoading, error } = useTypingRelayInvite(code)
  const join = useJoinTypingRelay()

  const goLogin = () => {
    try {
      sessionStorage.setItem('redirect_after_login', `/bible/typing/relay/join/${code}`)
    } catch {
      /* noop */
    }
    navigate('/login')
  }

  const onJoin = () =>
    join.mutate(code, {
      onSuccess: (id) => {
        showToast('릴레이에 함께하게 됐어요! 빈칸 하나부터 채워 볼까요? ✍️', 'success')
        navigate(`/bible/typing/relay/${id}`, { replace: true })
      },
      onError: (e) => showToast(e instanceof Error ? e.message : '참여하지 못했어요', 'error'),
    })

  const unit = chapterUnit(preview?.book_number)

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="typing" />
        <main className="bt-shell bt-shell--session">
          <section className="bt-card bt-sprint-intro bt-relay-invite">
            <span className="bt-sprint-intro__icon material-icons-round" aria-hidden>
              diversity_3
            </span>
            <p className="bt-summary__eyebrow">릴레이 필사 초대</p>
            {!loggedIn ? (
              <>
                <h1 className="bt-summary__title">한 장을 함께 나눠 써요</h1>
                <p className="bt-sprint-intro__lead">로그인하면 초대받은 릴레이에 바로 함께할 수 있어요.</p>
                <button type="button" className="bt-btn bt-btn--primary bt-btn--block" onClick={goLogin}>
                  로그인하고 함께하기
                </button>
              </>
            ) : isLoading ? (
              <p className="bt-empty">초대장을 펼치는 중…</p>
            ) : error || !preview ? (
              <>
                <p className="bt-sprint-intro__lead">{error instanceof Error ? error.message : '초대 링크가 올바르지 않아요'}</p>
                <Link to="/bible/typing" className="bt-link">
                  필사 홈으로
                </Link>
              </>
            ) : (
              <>
                <h1 className="bt-summary__title">{preview.title}</h1>
                <p className="bt-sprint-intro__lead">
                  {preview.owner_name ? `${preview.owner_name}님이 ` : ''}
                  {preview.book_name} {preview.chapter}
                  {unit} {preview.total}절을 함께 나눠 쓰자고 초대했어요.
                  <br />
                  지금 {preview.members}명이 {preview.done}칸을 채웠어요.
                </p>
                <div className="bt-relays__bar bt-relay__bar" aria-hidden>
                  <span style={{ width: `${preview.total ? (preview.done / preview.total) * 100 : 0}%` }} />
                </div>
                {preview.is_member ? (
                  <button
                    type="button"
                    className="bt-btn bt-btn--primary bt-btn--block"
                    onClick={() => navigate(`/bible/typing/relay/${preview.id}`, { replace: true })}
                  >
                    이미 함께하고 있어요 · 보러 가기
                  </button>
                ) : (
                  <button type="button" className="bt-btn bt-btn--primary bt-btn--block" disabled={join.isPending} onClick={onJoin}>
                    {join.isPending ? '함께하는 중…' : '릴레이에 함께하기'}
                  </button>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default TypingRelayJoin
