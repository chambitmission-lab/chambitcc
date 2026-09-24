import { useState } from 'react'
import { LAB_MILESTONES, MILESTONE_YEARS, WORLD_NOTES, churchYearOf } from './labData'
import type { LabMilestone } from './labData'

const Article = ({ m }: { m: LabMilestone }) => (
  <div className="hlab-art">
    <div className="hlab-art-date">
      {m.month}월 {m.day}일
    </div>
    <h4>{m.title}</h4>
    <p>{m.text}</p>
  </div>
)

/** ③ 참빛신보 호외 — 해를 고르면 그 해 이정표가 옛날 신문 1면으로. 옆 칸은 "그 해 세상은" */
export default function Newspaper() {
  const [year, setYear] = useState(MILESTONE_YEARS[0])
  const list = LAB_MILESTONES.filter((m) => m.year === year)
  const [head, ...rest] = list
  const half = Math.ceil(rest.length / 2)
  const world = WORLD_NOTES[year] ?? []

  return (
    <div>
      <div className="hlab-years" role="tablist" aria-label="연도 고르기">
        {MILESTONE_YEARS.map((y) => (
          <button
            key={y}
            type="button"
            role="tab"
            aria-selected={y === year}
            className={`hlab-year${y === year ? ' is-on' : ''}`}
            onClick={() => setYear(y)}
          >
            {y}
          </button>
        ))}
      </div>

      <article className="hlab-paper">
        <header className="hlab-mast">
          <div className="hlab-mast-name">참빛신보</div>
          <div className="hlab-mast-meta">
            <span>제 {churchYearOf(year)} 호</span>
            <span>
              {year}년 {head.month}월 {head.day}일
            </span>
            <span>발행 · 참빛교회 역사 정리 위원회</span>
          </div>
        </header>

        <div className="hlab-paper-body" key={year}>
          <span className="hlab-extra">호 외</span>
          <h3 className="hlab-headline">{head.title}</h3>
          <p className="hlab-lede">{head.text}</p>

          <div className="hlab-cols">
            <div>
              {rest.length > 0 ? (
                rest.slice(0, half).map((m) => <Article key={m.index} m={m} />)
              ) : (
                <div className="hlab-art">
                  <p>이 해의 다른 기록은 예전 화면 "연대순"에서 모두 볼 수 있습니다.</p>
                </div>
              )}
            </div>
            <div>
              {rest.slice(half).map((m) => (
                <Article key={m.index} m={m} />
              ))}
            </div>
            <aside className="hlab-world">
              <h5>그 해 세상은</h5>
              {world.length > 0 ? world.map((w) => <p key={w}>· {w}</p>) : <p>—</p>}
              <div className="hlab-world-age">
                그 해 참빛은
                <b>창립 {churchYearOf(year)}년째</b>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </div>
  )
}
