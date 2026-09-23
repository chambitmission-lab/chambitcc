import { useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { VISIT_KIND_ICON, VISIT_KIND_LABEL, fetchWeeklyReport, type WeeklyReport } from '../../api/pastor'
import { EmptyHint, SectionCard, StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import { Avatar } from './components/ui'
import { agoLabel, formatDay, usePastorGate } from './components/pastorUtils'

// 주간 목양 리포트 — 좌: 한 주 돌아보기 · 구역별 심방 커버리지 / 우: 기도 감정 흐름(익명 집계).
// 모두 규칙·집계라 숫자의 뜻이 화면에 그대로 적혀 있어야 한다.

const PastorReport = () => {
  const pastor = usePastorGate()
  const [week, setWeek] = useState(0)

  const { data, isPending } = useQuery<WeeklyReport>({
    queryKey: ['pastor-report', week],
    queryFn: () => fetchWeeklyReport(week),
    enabled: pastor,
    refetchOnMount: 'always',
    // 주를 넘길 때 스피너 대신 이전 주를 잠깐 유지 — 화면이 덜컹이지 않게
    placeholderData: keepPreviousData,
  })

  return (
    <PastorShell>
      <WeekNav data={data} week={week} onChange={setWeek} />
      {isPending && !data ? (
        <StatSpinner label="한 주를 돌아보는 중..." />
      ) : !data ? (
        <p className="px-4 py-16 text-center text-[13px] text-gray-500">주간 리포트를 불러오지 못했습니다</p>
      ) : (
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="contents lg:block lg:min-w-0">
            <SummaryCard data={data} />
            <CoverageCard data={data} />
          </div>
          <div className="contents lg:block">
            <EmotionCard data={data} />
          </div>
        </div>
      )}
    </PastorShell>
  )
}

// ── 주 넘기기 ─────────────────────────────────────────
const WeekNav = ({ data, week, onChange }: { data?: WeeklyReport; week: number; onChange: (w: number) => void }) => (
  <div className="px-4 pt-4 flex items-center justify-center gap-3">
    <button
      type="button"
      onClick={() => onChange(week - 1)}
      disabled={week <= -52}
      className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand hover:text-brand disabled:opacity-30"
      aria-label="지난주"
    >
      <span className="material-icons-outlined text-[20px]">chevron_left</span>
    </button>
    <div className="min-w-[210px] text-center">
      <p className="text-[15px] font-bold text-ink-strong tracking-[-0.01em]">
        {data ? `${formatDay(data.week_start, false)} ~ ${formatDay(data.week_end, false).replace(/^\d+년 /, '')}` : '…'}
      </p>
      <p className="text-[11.5px] font-semibold text-brand">
        {week === 0 ? '이번 주' : week === -1 ? '지난주' : `${-week}주 전`}
      </p>
    </div>
    <button
      type="button"
      onClick={() => onChange(week + 1)}
      disabled={week >= 0}
      className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand hover:text-brand disabled:opacity-30"
      aria-label="다음 주"
    >
      <span className="material-icons-outlined text-[20px]">chevron_right</span>
    </button>
  </div>
)

// ── 한 주 돌아보기 ─────────────────────────────────────
const SummaryCard = ({ data }: { data: WeeklyReport }) => {
  const s = data.summary
  const delta = s.my_visits - s.my_visits_prev
  const profileRate = s.members ? Math.round((s.with_profile / s.members) * 100) : 0
  const tiles = [
    {
      label: '내 심방',
      value: s.my_visits,
      unit: '건',
      sub: delta === 0 ? '지난주와 같음' : `지난주보다 ${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}`,
    },
    { label: '만난 성도', value: s.my_members_met, unit: '명', sub: `교역자 전체 ${s.team_members_met}명` },
    { label: '마친 후속 할 일', value: s.follow_ups_done, unit: '건', sub: '심방 기록 기준' },
    { label: '목양 기도 답글', value: s.my_prayer_replies, unit: '건', sub: `새로 맡겨진 기도 ${s.shared_prayers_new}건` },
  ]
  return (
    <SectionCard
      title={data.is_current ? '이번 주 돌아보기' : '그 주 돌아보기'}
      action={<span className="text-[11px] text-gray-400 dark:text-white/35">교역자 전체 심방 {s.team_visits}건</span>}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {tiles.map(t => (
          <div key={t.label} className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-3.5 py-3">
            <p className="text-[11.5px] font-semibold text-gray-500 dark:text-white/55">{t.label}</p>
            <p className="mt-0.5 text-[22px] font-bold tracking-[-0.02em] leading-tight">
              <span className="brand-text-gradient">{t.value}</span>
              <span className="text-[12px] font-semibold text-gray-400 ml-0.5">{t.unit}</span>
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/40 truncate">{t.sub}</p>
          </div>
        ))}
      </div>
      {s.my_visits_by_kind.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {s.my_visits_by_kind.map(k => (
            <span key={k.kind} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-brand text-[12px] font-semibold">
              <span className="material-icons-outlined text-[14px]">{VISIT_KIND_ICON[k.kind]}</span>
              {VISIT_KIND_LABEL[k.kind]} {k.count}
            </span>
          ))}
        </div>
      )}
      <div>
        <div className="flex items-center justify-between text-[11.5px] font-semibold text-gray-500 dark:text-white/55">
          <span>성도 명부 작성률</span>
          <span>{s.with_profile} / {s.members}명 · {profileRate}%</span>
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full bg-brand" style={{ width: `${profileRate}%` }} />
        </div>
      </div>
    </SectionCard>
  )
}

// ── 구역별 심방 커버리지 ────────────────────────────────
const CoverageCard = ({ data }: { data: WeeklyReport }) => {
  const c = data.coverage
  const [open, setOpen] = useState<string | null>(null)
  return (
    <SectionCard
      title="구역별 심방 커버리지"
      action={
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-brand">
          전체 {c.rate}%
        </span>
      }
    >
      <p className="text-[11.5px] text-gray-500 dark:text-white/45 leading-relaxed">
        지금 기준으로 최근 {c.window_days}일 안에 교역자 누구라도 심방한 성도의 비율입니다. 비어 있는 구역이 위에 옵니다.
      </p>
      {c.districts.length === 0 ? (
        <EmptyHint text="아직 성도가 없습니다" />
      ) : (
        <ul className="space-y-2">
          {c.districts.map(d => {
            const expanded = open === d.district
            const low = d.rate < 50
            return (
              <li key={d.district} className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : d.district)}
                  className="w-full text-left px-3.5 py-3"
                  aria-expanded={expanded}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-bold text-ink-strong">{d.district}</span>
                    <span className="text-[11.5px] text-gray-500 dark:text-white/50">
                      {d.covered}/{d.members}명
                    </span>
                    <span className={`ml-auto text-[13px] font-bold ${low ? 'text-[var(--amber)]' : 'text-brand'}`}>{d.rate}%</span>
                    <span className="material-icons-outlined text-[18px] text-gray-400">{expanded ? 'expand_less' : 'expand_more'}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-200/70 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${low ? 'bg-[var(--amber-icon)]' : 'bg-brand'}`}
                      style={{ width: `${Math.max(d.rate, 2)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-gray-500 dark:text-white/45">
                    {d.days_since_visit == null ? '심방 기록 없음' : `마지막 심방 ${agoLabel(d.days_since_visit)}`}
                    {d.quiet > 0 && ` · 소식 뜸한 분 ${d.quiet}명`}
                    {d.unvisited_count > 0 && ` · 아직 못 만난 분 ${d.unvisited_count}명`}
                  </p>
                </button>
                {expanded && (
                  <div className="px-3.5 pb-3 border-t border-gray-100 dark:border-white/[0.06]">
                    {d.unvisited.length === 0 ? (
                      <p className="pt-3 text-[12px] text-gray-500">모두 최근에 만났습니다</p>
                    ) : (
                      <ul className="pt-2 space-y-1.5">
                        {d.unvisited.map(m => (
                          <li key={m.user_id}>
                            <Link to={`/pastor/members/${m.user_id}`} className="flex items-center gap-2.5 group">
                              <Avatar name={m.name} url={m.avatar_url} size="sm" />
                              <span className="flex-1 min-w-0 text-[12.5px] font-semibold text-ink-strong truncate group-hover:text-brand">
                                {m.name}
                                {m.church_title && <span className="ml-1 text-[11px] text-brand">{m.church_title}</span>}
                              </span>
                              <span className="shrink-0 text-[11px] text-gray-500 dark:text-white/45">
                                {m.last_visit ? `심방 ${formatDay(m.last_visit, false)}` : '심방 없음'} · 활동 {agoLabel(m.quiet_days)}
                              </span>
                            </Link>
                          </li>
                        ))}
                        {d.unvisited_count > d.unvisited.length && (
                          <li className="text-[11px] text-gray-400">외 {d.unvisited_count - d.unvisited.length}명 — 성도 명부에서 구역으로 걸러 보세요</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}

// ── 기도 감정 흐름 (익명 집계) ──────────────────────────
const EmotionCard = ({ data }: { data: WeeklyReport }) => {
  const e = data.emotions
  const max = Math.max(1, ...e.this_week.map(x => Math.max(x.count, x.prev)))
  const trendMax = Math.max(1, ...e.trend.map(t => t.total))
  return (
    <SectionCard
      title="기도 감정 흐름"
      action={<span className="text-[11px] text-gray-400 dark:text-white/35">익명 집계</span>}
    >
      {!e.enough ? (
        <p className="py-4 text-center text-[12.5px] text-gray-500 dark:text-white/50 leading-relaxed">
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
              <p className="mt-0.5 text-[11.5px] text-gray-600 dark:text-white/60">
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
                <span className="w-14 shrink-0 text-right text-[11.5px] font-semibold text-gray-600 dark:text-white/65">
                  {x.count}
                  <span className="text-gray-400 font-normal"> / {x.prev}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-gray-400 dark:text-white/35">진한 막대가 이 주, 옅은 막대가 지난주입니다. (이 주 {e.total}건 · 지난주 {e.prev_total}건)</p>
        </>
      )}

      <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06]">
        <p className="text-[11.5px] font-semibold text-gray-500 dark:text-white/55">최근 {e.trend.length}주 · 무거운 마음과 밝은 마음</p>
        <div className="mt-2 flex items-end gap-2">
          {e.trend.map(t => (
            <div key={t.week_start} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${t.week_start} · 무거운 ${t.heavy} · 밝은 ${t.bright}`}>
              {/* 막대 높이(%)의 기준이 되도록 고정 높이 — flex-1 만으로는 퍼센트가 풀리지 않는다 */}
              <div className="w-full h-[72px] flex flex-col justify-end gap-[2px]">
                <div className="w-full rounded-t bg-brand" style={{ height: `${(t.bright / trendMax) * 100}%` }} />
                <div className="w-full rounded-b bg-gray-400 dark:bg-white/40" style={{ height: `${(t.heavy / trendMax) * 100}%` }} />
              </div>
              <span className="text-[10px] text-gray-400 dark:text-white/35 leading-none">
                {formatDay(t.week_start, false).replace(/^\d+년 /, '').replace('월 ', '/').replace('일', '')}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-gray-400 dark:text-white/35 leading-relaxed">
          파랑은 소망·감사, 회색은 불안·지침·슬픔·외로움·분노·혼란입니다. 나만 보기 기도는 세지 않으며, 누가 썼는지는 드러나지 않습니다.
        </p>
      </div>
    </SectionCard>
  )
}

export default PastorReport
