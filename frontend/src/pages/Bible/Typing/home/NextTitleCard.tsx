import { Link } from 'react-router-dom'
import { TitleGlyph } from '../../../../components/titles/TitleGlyph'
import type { TitleStatus } from '../../../../api/titles'

type TitleLike = Pick<TitleStatus, 'key' | 'name' | 'icon' | 'hint' | 'earned' | 'progress'>

const pctOf = (t: TitleLike) =>
  t.progress ? Math.min(100, Math.round((t.progress.current / Math.max(1, t.progress.target)) * 100)) : 0

/**
 * 필사 칭호 — 다음에 딸 칭호 하나만 크게(진행률과 함께), 이미 딴 칭호는 아이콘 줄로 접는다.
 */
const NextTitleCard = ({ titles }: { titles: TitleLike[] }) => {
  if (titles.length === 0) return null
  const earned = titles.filter((t) => t.earned)
  const pending = titles.filter((t) => !t.earned)
  // 가장 가까운(진행률 높은) 칭호 — 진행률이 없는 것은 뒤로
  const next = [...pending].sort((a, b) => pctOf(b) - pctOf(a))[0]

  return (
    <section className="bt-section" aria-labelledby="bt-title-next">
      <h2 id="bt-title-next" className="bt-section__title">
        필사 칭호{' '}
        <span className="bt-section__count">
          {earned.length}/{titles.length}
        </span>
      </h2>
      <div className="bt-card bt-nexttitle">
        {next ? (
          <div className="bt-nexttitle__main">
            <span className="bt-title__icon" aria-hidden>
              <TitleGlyph titleKey={next.key} fallback={next.icon} />
            </span>
            <span className="bt-nexttitle__body">
              <span className="bt-nexttitle__eyebrow">다음 칭호</span>
              <span className="bt-nexttitle__name">{next.name}</span>
              <span className="bt-nexttitle__hint">
                {next.hint}
                {next.progress && (
                  <b>
                    {' '}
                    {next.progress.current.toLocaleString()}/{next.progress.target.toLocaleString()}
                  </b>
                )}
              </span>
              {next.progress && (
                <span className="bt-title__bar">
                  <span style={{ width: `${pctOf(next)}%` }} />
                </span>
              )}
            </span>
          </div>
        ) : (
          <p className="bt-nexttitle__all">필사 칭호를 모두 모았어요 🎉</p>
        )}
        {earned.length > 0 && (
          <ul className="bt-nexttitle__earned" aria-label="받은 칭호">
            {earned.map((t) => (
              <li key={t.key} title={t.name}>
                <TitleGlyph titleKey={t.key} fallback={t.icon} />
              </li>
            ))}
          </ul>
        )}
        <Link to="/garden" className="bt-link">
          칭호 도감 전체 보기
        </Link>
      </div>
    </section>
  )
}

export default NextTitleCard
