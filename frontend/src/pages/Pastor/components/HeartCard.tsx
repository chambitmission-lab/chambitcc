// 이번 주 성도들의 마음 (익명 집계) — 목회자 홈 우측.
// '지난 7일 교회 흐름'(PulseCard)이 얼마나 모였는지라면, 이 카드는 무엇을 품고 언제 기도했는지다.
// 설교 본문·광고·기도회 시간을 정할 때 참고하라는 자리. 주간 리포트의 감정 흐름은 달력 주 단위라
// 월요일엔 비어 보여서, 홈은 '지난 7일'로 굴린다(백엔드 pastor_home_service._heart).
import { Link } from 'react-router-dom'
import type { PastorHeart } from '../../../api/pastor'
import { chapterLabel } from '../../../utils/bibleLabels'
import { SectionCard } from '../../Admin/components/StatCards'

const BRIGHT = new Set(['hopeful', 'grateful'])

const hourLabel = (h: number) => {
  if (h < 5) return `새벽 ${h}시`
  if (h < 9) return `아침 ${h}시`
  if (h < 12) return `오전 ${h}시`
  if (h < 18) return `오후 ${h === 12 ? 12 : h - 12}시`
  if (h < 21) return `저녁 ${h - 12}시`
  return `밤 ${h - 12}시`
}

/** 가장 많이 모인 두 시각 — 붙어 있는 시각(5시·6시)은 한 덩어리로 보고 다음 봉우리를 찾는다 */
const peakHours = (hours: number[]): number[] => {
  const order = hours.map((n, h) => ({ n, h })).sort((a, b) => b.n - a.n)
  const picks: number[] = []
  for (const { n, h } of order) {
    if (n === 0 || picks.length === 2) break
    if (picks.every((p) => Math.min(Math.abs(p - h), 24 - Math.abs(p - h)) > 2)) picks.push(h)
  }
  return picks.sort((a, b) => a - b)
}

const HeartCard = ({ heart }: { heart: PastorHeart }) => {
  const { emotions: e, chapters, hours } = heart
  const max = Math.max(1, ...e.items.map((x) => Math.max(x.count, x.prev)))
  const peaks = hours ? peakHours(hours) : []
  const hourMax = hours ? Math.max(1, ...hours) : 1

  const headline = !e.enough
    ? `지난 ${heart.days}일 감정을 고른 기도가 ${e.total}건이라 흐름을 말하기엔 아직 적어요`
    : e.rising
      ? `‘${e.rising.label}’의 기도가 그 전 주보다 ${e.rising.delta}건 늘었어요`
      : e.items[0]
        ? `‘${e.items[0].label}’의 마음이 가장 많이 담겼어요`
        : ''

  return (
    <SectionCard
      title="이번 주 성도들의 마음"
      action={
        <Link to="/pastor/report" className="text-[13px] font-semibold text-brand hover:underline">
          주간 리포트
        </Link>
      }
    >
      <div>
        <p className="text-[14px] font-bold leading-[1.5] text-ink-strong break-keep">{headline}</p>
        {e.rising && (
          <p className="mt-0.5 text-[12px] text-gray-600 dark:text-white/60">
            설교·광고·중보 기도 시간에 함께 품을 마음으로 참고해 보세요.
          </p>
        )}
      </div>

      {e.items.length > 0 && (
        <ul className="space-y-1.5">
          {e.items.map((x) => (
            <li key={x.key} className="flex items-center gap-2.5">
              <span className="w-12 shrink-0 text-[12px] font-semibold text-gray-600 dark:text-white/65">{x.label}</span>
              <span className="relative h-3.5 flex-1">
                {/* 그 전 7일은 옅은 막대, 지난 7일은 진한 막대 — 주간 리포트와 같은 문법 */}
                <span className="absolute inset-y-0 left-0 rounded bg-gray-200 dark:bg-white/[0.08]" style={{ width: `${(x.prev / max) * 100}%` }} />
                <span
                  className={`absolute inset-y-[3px] left-0 rounded ${BRIGHT.has(x.key) ? 'bg-brand' : 'bg-gray-500 dark:bg-white/50'}`}
                  style={{ width: `${(x.count / max) * 100}%` }}
                />
              </span>
              <span className="w-12 shrink-0 text-right text-[12px] font-semibold tabular-nums text-gray-600 dark:text-white/65">
                {x.count}
                <span className="font-normal text-gray-500"> / {x.prev}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {chapters.length > 0 && (
        <div className="border-t border-gray-100 pt-3 dark:border-white/[0.06]">
          <p className="text-[12px] font-semibold text-gray-600 dark:text-white/65">성도들이 많이 머문 말씀</p>
          <ol className="mt-1">
            {chapters.map((c, i) => (
              <li key={`${c.book_number}-${c.chapter}`}>
                <Link
                  to={`/bible/${c.book_number}/${c.chapter}`}
                  className="flex items-center gap-2.5 py-1.5 text-[13.5px] text-ink-strong hover:text-brand"
                >
                  <span className="w-3 font-bold tabular-nums text-brand">{i + 1}</span>
                  <span>
                    {c.book_name} {chapterLabel(c.book_number, c.chapter)}
                  </span>
                  <span className="ml-auto text-[12px] tabular-nums text-gray-500 dark:text-white/50">{c.readers}명</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      {hours && peaks.length > 0 && (
        <div className="border-t border-gray-100 pt-3 dark:border-white/[0.06]">
          <p className="text-[12px] font-semibold text-gray-600 dark:text-white/65">기도가 모이는 시간</p>
          <p className="mt-0.5 text-[13.5px] font-semibold text-ink-strong">
            {peaks.map(hourLabel).join(' · ')}에 가장 많이 기도해요
          </p>
          <div className="mt-2 flex h-10 items-end gap-[2px]" role="img" aria-label="시간대별 기도 수">
            {hours.map((n, h) => (
              <div key={h} className="flex h-full flex-1 items-end" title={`${hourLabel(h)} · ${n}건`}>
                <div
                  className={`w-full rounded-[2px] ${peaks.includes(h) ? 'bg-brand' : 'bg-[var(--brand-soft-strong)]'}`}
                  style={{ height: `${Math.max(6, (n / hourMax) * 100)}%`, opacity: n === 0 ? 0.35 : 1 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-gray-500 dark:text-white/50">
            <span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>24시</span>
          </div>
        </div>
      )}

      <p className="text-[12px] leading-relaxed text-gray-500 dark:text-white/50">
        지난 {heart.days}일 익명 집계 · 나만 보기 기도는 빼고, 목사님께 맡긴 기도는 포함해요
      </p>
    </SectionCard>
  )
}

export default HeartCard
