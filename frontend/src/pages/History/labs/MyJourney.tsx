import { useState } from 'react'
import { HistoryGlyph } from '../HistoryIcons'
import { CURRENT_YEAR, FOUNDED_YEAR, LAB_MILESTONES, churchYearOf } from './labData'

const PREVIEW_COUNT = 6
const QUICK_PICKS = [
  { year: FOUNDED_YEAR, label: '창립 때' },
  { year: 2000, label: '2000년대' },
  { year: 2010, label: '2010년대' },
  { year: 2020, label: '2020년대' },
]

/** ④ 나와 참빛 — 처음 오신 해를 고르면 그때 교회 나이와 함께 지나온 이정표를 보여준다 */
export default function MyJourney() {
  const [year, setYear] = useState(2005)
  const [showAll, setShowAll] = useState(false)

  const pick = (y: number) => {
    setYear(Math.min(CURRENT_YEAR, Math.max(FOUNDED_YEAR, y)))
    setShowAll(false)
  }

  const since = LAB_MILESTONES.filter((m) => m.year >= year)
  const shown = showAll ? since : since.slice(0, PREVIEW_COUNT)
  const together = CURRENT_YEAR - year
  const isFounder = year === FOUNDED_YEAR
  const isNew = CURRENT_YEAR - year <= 1

  return (
    <div className="hlab-me">
      <section className="hlab-card hlab-me-pick">
        <h3>처음 오신 해가 언제세요?</h3>
        <p>대략이라도 괜찮아요.</p>
        <div className="hlab-stepper">
          <button type="button" aria-label="한 해 앞으로" disabled={year <= FOUNDED_YEAR} onClick={() => pick(year - 1)}>
            −
          </button>
          <div className="hlab-stepper-value" aria-live="polite">
            {year}
            <small>년</small>
          </div>
          <button type="button" aria-label="한 해 뒤로" disabled={year >= CURRENT_YEAR} onClick={() => pick(year + 1)}>
            +
          </button>
        </div>
        <div className="hlab-quick">
          {QUICK_PICKS.map((q) => (
            <button key={q.year} type="button" onClick={() => pick(q.year)}>
              {q.label}
            </button>
          ))}
        </div>
      </section>

      <section className="hlab-card hlab-me-out">
        <p className="hlab-me-hello">
          {isFounder ? '창립 멤버시군요!' : isNew ? '반가워요, 새 가족!' : `${year}년에 오셨군요!`}
        </p>
        <p className="hlab-me-big">
          {isFounder ? (
            <>
              참빛의 <em>첫 페이지</em>부터
              <br />
              함께 써 오셨습니다.
            </>
          ) : (
            <>
              그때 참빛은 <em>창립 {churchYearOf(year)}년째</em>였고,
              <br />그 뒤로 <em>{together}년</em>을 함께 걸었어요.
            </>
          )}
        </p>

        <div className="hlab-me-stats">
          <div>
            <b>{together}년</b>
            <span>함께한 시간</span>
          </div>
          <div>
            <b>{since.length}개</b>
            <span>함께 지나온 이정표</span>
          </div>
          <div>
            <b>{together > 0 ? `약 ${(together * 52).toLocaleString()}번` : '—'}</b>
            <span>함께 맞은 주일</span>
          </div>
        </div>

        <div className="hlab-me-list">
          {shown.map((m, i) => (
            <div key={m.index} className={`hlab-me-row${i === 0 ? ' is-first' : ''}`}>
              <span className="hlab-me-year">{m.year}</span>
              <span className="hlab-me-icon" aria-hidden="true">
                <HistoryGlyph emoji={m.icon} size={24} />
              </span>
              <span>{m.title}</span>
            </div>
          ))}
          {!showAll && since.length > PREVIEW_COUNT && (
            <button type="button" className="hlab-me-more" onClick={() => setShowAll(true)}>
              + {since.length - PREVIEW_COUNT}개 더 보기
            </button>
          )}
          {since.length === 0 && (
            <div className="hlab-me-row hlab-me-row--empty">
              이제 막 함께하셨네요. 다음 이정표는 우리가 함께 씁니다.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
