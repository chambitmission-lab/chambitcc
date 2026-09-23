// 기도 감정 흐름(익명 집계) 카드 — 주간 리포트와 설교 준비 도우미가 공유
import type { WeeklyReport } from '../../../api/pastor'
import { SectionCard } from '../../Admin/components/StatCards'
import { formatDay } from './pastorUtils'

// ── 기도 감정 흐름 (익명 집계) ──────────────────────────
const EmotionFlowCard = ({ emotions: e, title = '기도 감정 흐름' }: { emotions: WeeklyReport['emotions']; title?: string }) => {
  const max = Math.max(1, ...e.this_week.map(x => Math.max(x.count, x.prev)))
  const trendMax = Math.max(1, ...e.trend.map(t => t.total))
  return (
    <SectionCard
      title={title}
      action={<span className="text-[12px] text-gray-500 dark:text-white/50">익명 집계</span>}
    >
      {!e.enough ? (
        <p className="py-4 text-center text-[12.5px] text-gray-600 dark:text-white/60 leading-relaxed">
          이 주에 감정을 고른 기도가 {e.total}건이라
          <br />
          흐름을 말하기엔 아직 적습니다 ({e.min_sample}건부터 보여 드려요)
        </p>
      ) : (
        <>
          {e.rising && (
            <div className="rounded-xl bg-[var(--brand-soft)] px-3.5 py-3">
              <p className="text-[12.5px] font-bold text-ink-strong">
                ‘{e.rising.label}’의 기도가 지난주보다 {e.rising.delta}건 늘었습니다
              </p>
              <p className="mt-0.5 text-[12px] text-gray-600 dark:text-white/60">
                설교·광고·중보 기도 시간에 함께 품을 마음으로 참고해 보세요.
              </p>
            </div>
          )}
          <ul className="space-y-1.5">
            {e.this_week.map(x => (
              <li key={x.key} className="flex items-center gap-2.5">
                <span className="w-12 shrink-0 text-[12px] font-semibold text-gray-600 dark:text-white/65">{x.label}</span>
                <span className="flex-1 relative h-3.5">
                  {/* 지난주는 옅은 막대, 이번 주는 진한 막대 */}
                  <span className="absolute inset-y-0 left-0 rounded bg-gray-200 dark:bg-white/[0.08]" style={{ width: `${(x.prev / max) * 100}%` }} />
                  <span
                    className={`absolute inset-y-[3px] left-0 rounded ${x.key === 'hopeful' || x.key === 'grateful' ? 'bg-brand' : 'bg-gray-500 dark:bg-white/50'}`}
                    style={{ width: `${(x.count / max) * 100}%` }}
                  />
                </span>
                <span className="w-14 shrink-0 text-right text-[12px] font-semibold text-gray-600 dark:text-white/65">
                  {x.count}
                  <span className="text-gray-500 font-normal"> / {x.prev}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-gray-500 dark:text-white/50">진한 막대가 이 주, 옅은 막대가 지난주입니다. (이 주 {e.total}건 · 지난주 {e.prev_total}건)</p>
        </>
      )}

      <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06]">
        <p className="text-[12px] font-semibold text-gray-600 dark:text-white/65">최근 {e.trend.length}주 · 무거운 마음과 밝은 마음</p>
        <div className="mt-2 flex items-end gap-2">
          {e.trend.map(t => (
            <div key={t.week_start} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${t.week_start} · 무거운 ${t.heavy} · 밝은 ${t.bright}`}>
              {/* 막대 높이(%)의 기준이 되도록 고정 높이 — flex-1 만으로는 퍼센트가 풀리지 않는다 */}
              <div className="w-full h-[72px] flex flex-col justify-end gap-[2px]">
                <div className="w-full rounded-t bg-brand" style={{ height: `${(t.bright / trendMax) * 100}%` }} />
                <div className="w-full rounded-b bg-gray-400 dark:bg-white/40" style={{ height: `${(t.heavy / trendMax) * 100}%` }} />
              </div>
              <span className="text-[12px] text-gray-500 dark:text-white/50 leading-none">
                {formatDay(t.week_start, false).replace(/^\d+년 /, '').replace('월 ', '/').replace('일', '')}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-gray-500 dark:text-white/50 leading-relaxed">
          파랑은 소망·감사, 회색은 불안·지침·슬픔·외로움·분노·혼란입니다. 나만 보기 기도는 세지 않으며, 누가 썼는지는 드러나지 않습니다.
        </p>
      </div>
    </SectionCard>
  )
}

export default EmotionFlowCard
