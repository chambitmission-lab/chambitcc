import type { TypingWeekly } from '../../../../api/bibleTyping'

/** 이번 주 교회 필사 순위 — 첫 화면에서 빼고 스프린트 안에서만 보여 준다(경쟁은 경주 안에서) */
const WeeklyBoard = ({ weekly }: { weekly?: TypingWeekly }) => {
  if (!weekly) return null
  return (
    <section className="bt-section">
      <h2 className="bt-section__title">이번 주 우리 교회</h2>
      <div className="bt-card bt-weekly">
        <p className="bt-weekly__lead">
          <b className="brand-text-gradient">{weekly.church_verses.toLocaleString()}</b>절을
          <span> {weekly.participants}명이 함께 필사했어요</span>
        </p>
        {weekly.items.length > 0 ? (
          <ol className="bt-board">
            {weekly.items.map((it) => (
              <li key={it.user_id} className={it.is_me ? 'is-me' : ''}>
                <span className="bt-board__rank">{it.rank}</span>
                {it.avatar_url ? (
                  <img className="bt-board__avatar" src={it.avatar_url} alt="" loading="lazy" />
                ) : (
                  <span className="bt-board__avatar bt-board__avatar--initial" aria-hidden>
                    {it.name.slice(0, 1)}
                  </span>
                )}
                <span className="bt-board__name">{it.name}</span>
                <span className="bt-board__value">
                  {it.best_cpm > 0 && <small>{it.best_cpm}타 · </small>}
                  <b>{it.verses}</b>절
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="bt-empty">이번 주 첫 필사의 주인공이 되어 보세요.</p>
        )}
        {weekly.my_rank && weekly.my_rank > weekly.items.length && (
          <p className="bt-weekly__me">
            나는 {weekly.my_rank}번째 · {weekly.my_verses}절
          </p>
        )}
      </div>
    </section>
  )
}

export default WeeklyBoard
