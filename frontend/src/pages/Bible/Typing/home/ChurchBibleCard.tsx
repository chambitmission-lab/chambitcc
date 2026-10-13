import type { ChurchBible } from '../../../../api/bibleTyping'

const pctText = (p: number) => (p === 0 ? '0' : p < 1 ? p.toFixed(2) : p < 10 ? p.toFixed(1) : String(Math.floor(p)))

/** 책 하나가 얼마나 채워졌는지 → 칸 농도 0~4 */
const shadeOf = (n: number, total: number) => {
  if (!n || !total) return 0
  const r = n / total
  return r >= 1 ? 4 : r >= 0.5 ? 3 : r >= 0.1 ? 2 : 1
}

interface ChurchBibleCardProps {
  data?: ChurchBible
  bookName: (n: number) => string
}

/**
 * 우리 교회 손글씨 성경 — 교회가 함께 채워 가는 성경 한 권.
 * 내가 쓴 절이 그 성경의 한 칸이 된다. 순위 대신 '함께 채운 양'을 보여 주어
 * 참여자가 적어도 쓸쓸하지 않게 한다.
 */
const ChurchBibleCard = ({ data, bookName }: ChurchBibleCardProps) => {
  if (!data) return null
  const pct = data.total_verses ? (data.typed_verses / data.total_verses) * 100 : 0
  return (
    <section className="bt-section" aria-labelledby="bt-church-title">
      <h2 id="bt-church-title" className="bt-section__title">
        우리 교회 손글씨 성경
      </h2>
      <div className="bt-card bt-church">
        <p className="bt-church__lead">
          <b className="brand-text-gradient">{data.typed_verses.toLocaleString()}</b>
          <span> / {data.total_verses.toLocaleString()}절</span>
          <span className="bt-church__pct">{pctText(pct)}%</span>
        </p>
        <div className="bt-church__bar" aria-hidden>
          <span style={{ width: `${Math.max(pct, data.typed_verses ? 0.6 : 0)}%` }} />
        </div>
        <p className="bt-church__week">
          {data.week_added > 0 ? (
            <>
              이번 주 <b>+{data.week_added.toLocaleString()}절</b> · {data.week_people}명이 새 칸을 채웠어요
            </>
          ) : (
            '이번 주 첫 칸을 채워 보세요'
          )}
        </p>

        <div className="bt-church__books" role="img" aria-label="책별로 함께 채운 정도">
          {Array.from({ length: 66 }, (_, i) => i + 1).map((b) => {
            const n = data.books[String(b)] ?? 0
            const total = data.book_totals[String(b)] ?? 0
            return (
              <span
                key={b}
                className={`bt-church__book sh-${shadeOf(n, total)}${b === 40 ? ' is-nt' : ''}`}
                title={`${bookName(b) || `${b}권`} · ${n}/${total}절`}
              />
            )
          })}
        </div>
        <p className="bt-church__legend" aria-hidden>
          <span>구약 39권</span>
          <span>신약 27권</span>
        </p>

        <dl className="bt-church__mine">
          <div>
            <dt>함께 쓴 성도</dt>
            <dd>{data.contributors}명</dd>
          </div>
          <div>
            <dt>내가 새긴 절</dt>
            <dd>{data.my_verses.toLocaleString()}</dd>
          </div>
          <div>
            <dt>내가 처음 채운 칸</dt>
            <dd>{data.my_first.toLocaleString()}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

export default ChurchBibleCard
