// 설교 계획 — 다가오는 주일 시리즈 후보 (PastorSermon 준비 도우미)
//   재료(AI 없음)를 먼저 보여 준다: 계획할 주일과 교회력·절기, 오래 다루지 않은 권, 올해 표어.
//   '시리즈 후보 받기' → 후보 2개. 주일별 본문은 서버가 성경에서 확인하고, 최근 3년 같은 장 설교는 표시한다.
//   '이 시리즈로 개요 만들기' → 주일마다 개요(제목·본문·설교 날짜·요지)를 차례로 만든다(백엔드가 직렬이라 한 번에 몰지 않는다).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createOutline,
  fetchPlanInputs,
  fetchSermonPlan,
  updateOutline,
  type PlanInputs,
  type SermonPlan,
  type SermonSeries,
} from '../../../api/pastor'
import { pastorKeys } from '../../../hooks/queryKeys'
import { showToast } from '../../../utils/toast'
import { SectionCard } from '../../Admin/components/StatCards'
import { BriefLoading } from './SermonBriefCard'
import { formatDay, inputCls } from './pastorUtils'

const WEEK_CHOICES = [4, 6, 8, 12]

const SermonPlanCard = () => {
  const qc = useQueryClient()
  const [weeks, setWeeks] = useState(6)
  const [focus, setFocus] = useState('')
  const [plan, setPlan] = useState<SermonPlan | null>(null)
  const [made, setMade] = useState<Record<string, number>>({})
  const [progress, setProgress] = useState<{ id: string; done: number; total: number } | null>(null)

  const { data: inputs } = useQuery<PlanInputs>({
    queryKey: pastorKeys.planInputs(weeks, null),
    queryFn: () => fetchPlanInputs(weeks, null),
    staleTime: 1000 * 60 * 10,
  })

  const ask = useMutation({
    mutationFn: () => fetchSermonPlan({ weeks, start: null, focus: focus.trim() }),
    onSuccess: p => {
      setPlan(p)
      setMade({})
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const make = useMutation({
    mutationFn: async (s: SermonSeries) => {
      const rows = s.sundays.filter(r => r.passage)
      let n = 0
      setProgress({ id: s.id, done: 0, total: rows.length })
      for (const r of rows) {
        const o = await createOutline({ title: r.title || `${s.title} ${n + 1}`, passage: r.passage, preach_on: r.date })
        if (r.gist) {
          await updateOutline(o.id, {
            sections: o.sections.map(x => (x.id === 'body' ? { ...x, text: `${r.gist}\n(시리즈: ${s.title})` } : x)),
          })
        }
        n += 1
        setProgress({ id: s.id, done: n, total: rows.length })
      }
      return n
    },
    onSuccess: (n, s) => {
      setMade(m => ({ ...m, [s.id]: n }))
      setProgress(null)
      void qc.invalidateQueries({ queryKey: pastorKeys.outlines() })
      showToast(`개요 ${n}개를 주일별로 만들었어요`, 'success')
    },
    onError: (e: Error) => {
      setProgress(null)
      void qc.invalidateQueries({ queryKey: pastorKeys.outlines() })
      showToast(e.message, 'error')
    },
  })

  return (
    <SectionCard title="설교 계획 — 다가오는 주일 시리즈" action={<span className="text-[12px] text-gray-500 dark:text-white/50">교회력 · 설교 기록 · 표어 기준</span>}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[12.5px] lg:text-[13.5px] font-bold text-gray-600 dark:text-white/60 mr-1">기간</span>
        {WEEK_CHOICES.map(w => (
          <button
            key={w}
            type="button"
            aria-pressed={weeks === w}
            onClick={() => setWeeks(w)}
            className={`px-3 py-1.5 rounded-full text-[12.5px] lg:text-[13.5px] font-bold ${
              weeks === w ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65'
            }`}
          >
            {w}주
          </button>
        ))}
      </div>

      {inputs && (
        <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-3.5 py-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {inputs.sundays.map(s => (
              <span
                key={s.date}
                className={`px-2.5 py-1 rounded-full text-[12px] lg:text-[13px] font-semibold ${
                  s.season ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:border-amber-400/25' : 'bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/75'
                }`}
              >
                {formatDay(s.date, false)}
                {s.season && ` · ${s.season}`}
              </span>
            ))}
          </div>
          <p className="text-[12.5px] lg:text-[13.5px] text-gray-600 dark:text-white/65">
            <b className="mr-1">오래 다루지 않은 권</b>
            {inputs.stale.slice(0, 6).map(b => `${b.name}${b.last_date ? `(${b.last_date.slice(0, 7)})` : '(기록 없음)'}`).join(' · ')}
          </p>
          <p className="text-[12.5px] lg:text-[13.5px] text-gray-600 dark:text-white/65">
            <b className="mr-1">최근 3년</b>구약 {inputs.testament.ot}편 · 신약 {inputs.testament.nt}편
            {inputs.theme && (
              <>
                <b className="ml-3 mr-1">올해 표어</b>
                {inputs.theme.text} ({inputs.theme.ref})
              </>
            )}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className={`${inputCls} lg:text-[15px]`}
          value={focus}
          maxLength={200}
          placeholder="바라는 방향(선택) — 예: 연말을 앞두고 감사와 소망, 청년 회복"
          onChange={e => setFocus(e.target.value)}
        />
        <button
          type="button"
          disabled={ask.isPending}
          onClick={() => ask.mutate()}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-[14px] lg:text-[15px] font-bold disabled:opacity-60"
        >
          <span className={`material-icons-outlined text-[18px] ${ask.isPending ? 'animate-spin' : ''}`}>
            {ask.isPending ? 'autorenew' : 'event_note'}
          </span>
          {ask.isPending ? '계획하는 중…' : plan ? '다시 받기' : '시리즈 후보 받기'}
        </button>
      </div>

      {ask.isPending && !plan && <BriefLoading text="교회력과 설교 기록을 살피며 시리즈를 짜는 중입니다… (40초쯤)" />}

      {plan && (
        <div className="space-y-3">
          {plan.filtered > 0 && (
            <p className="text-[12.5px] text-amber-800 dark:text-amber-300">이단 표현이 섞인 항목 {plan.filtered}개는 자동으로 뺐습니다.</p>
          )}
          {plan.series.map(s => {
            const ready = s.sundays.filter(r => r.passage).length
            const running = progress?.id === s.id
            return (
              <div key={s.id} className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02] p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-brand text-[11.5px] lg:text-[12.5px] font-bold">{s.kind}</span>
                  <h3 className="text-[15px] lg:text-[17px] font-bold text-ink-strong">{s.title}</h3>
                </div>
                {s.why && <p className="text-[12.5px] lg:text-[13.5px] leading-relaxed text-gray-600 dark:text-white/65">{s.why}</p>}
                <ol className="space-y-1">
                  {s.sundays.map(r => (
                    <li key={r.date} className="grid grid-cols-[70px_minmax(0,1fr)] gap-2 rounded-lg bg-white dark:bg-white/[0.04] px-3 py-2">
                      <span className="text-[12px] lg:text-[13px] font-bold text-gray-500 dark:text-white/55">
                        {formatDay(r.date, false)}
                        {r.season && <span className="block text-[11px] font-semibold text-amber-700 dark:text-amber-300 leading-tight">{r.season}</span>}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-baseline gap-x-1.5 text-[13.5px] lg:text-[14.5px] font-bold text-ink-strong">
                          {r.passage ?? <span className="text-amber-700 dark:text-amber-300">본문 확인 필요</span>}
                          {r.title && <span className="font-semibold text-gray-700 dark:text-white/75">· {r.title}</span>}
                        </span>
                        {r.gist && <span className="block text-[12.5px] lg:text-[13.5px] text-gray-600 dark:text-white/60">{r.gist}</span>}
                        {r.recent_overlap && (
                          <span className="block text-[12px] text-amber-700 dark:text-amber-300">
                            {formatDay(r.recent_overlap, false)}에 같은 장을 설교했어요
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
                {made[s.id] ? (
                  <p className="flex flex-wrap items-center gap-2 text-[13px] lg:text-[14px] font-bold text-brand">
                    <span className="material-icons-outlined text-[17px]">check_circle</span>
                    개요 {made[s.id]}개를 만들었어요
                    <Link to="/pastor/sermon/outlines" className="underline">개요 보드에서 보기</Link>
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={make.isPending || ready === 0}
                    onClick={() => make.mutate(s)}
                    className="w-full inline-flex items-center justify-center gap-1 py-2.5 rounded-xl bg-ink-strong text-white dark:bg-white dark:text-black text-[13px] lg:text-[14px] font-bold disabled:opacity-50"
                  >
                    <span className="material-icons-outlined text-[17px]">view_agenda</span>
                    {running ? `개요 만드는 중… ${progress!.done}/${progress!.total}` : `이 시리즈로 주일별 개요 ${ready}개 만들기`}
                  </button>
                )}
              </div>
            )
          })}
          <p className="text-[12px] lg:text-[13px] text-gray-500 dark:text-white/50">
            AI 초안입니다. 교회력 표시는 일반적인 날짜 계산이니 교회 일정과 맞는지 확인해 주세요. 본문이 확인되지 않은 주일은 개요를 만들지 않습니다.
          </p>
        </div>
      )}
    </SectionCard>
  )
}

export default SermonPlanCard
