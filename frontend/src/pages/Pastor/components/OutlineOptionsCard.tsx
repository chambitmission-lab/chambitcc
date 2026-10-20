// 대지 후보 — 본문 + 중심 명제로 설교 뼈대 후보 2~3가지 (PastorSermonStudy)
//   뼈대만(대지 제목 · 근거 절 · 한 문장 요지). 근거 절이 본문 밖이면 서버가 비우고 '확인 필요'로 표시한다.
//   '이 뼈대로 개요 만들기' → 개요 보드에 서론 · 대지들 · 결론 칸을 만들고 그 개요로 간다. 살은 목사님이 붙인다.
//   중심 명제는 직접 쓰거나, AI 연구 재료의 '중심 명제 후보'를 눌러 고른다.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createOutline,
  fetchOutlineOptions,
  fetchSermonBrief,
  type OutlineOption,
  type OutlineOptions,
  type OutlineSection,
  type SermonBrief,
} from '../../../api/pastor'
import { pastorKeys } from '../../../hooks/queryKeys'
import { showToast } from '../../../utils/toast'
import { SectionCard } from '../../Admin/components/StatCards'
import { BriefLoading } from './SermonBriefCard'
import { inputCls } from './pastorUtils'

const sectionsOf = (o: OutlineOption, bookLabel: string): OutlineSection[] => [
  { id: 'intro', label: '서론', text: o.intro, manuscript: '', note_ids: [] },
  ...o.points.map((p, i) => ({
    id: `p${i + 1}`,
    label: p.label.slice(0, 30),
    text: [p.gist, p.verses ? `근거: ${bookLabel} ${p.verses}` : null].filter(Boolean).join('\n'),
    manuscript: '',
    note_ids: [],
  })),
  { id: 'close', label: '결론', text: o.close, manuscript: '', note_ids: [] },
]

const OutlineOptionsCard = ({ label }: { label: string }) => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [bigIdea, setBigIdea] = useState('')
  const [result, setResult] = useState<OutlineOptions | null>(null)
  // 연구 재료를 이미 받았다면 그 '중심 명제 후보'를 고를 수 있게 — 새로 부르지는 않는다
  const { data: brief } = useQuery<SermonBrief>({
    queryKey: pastorKeys.sermonBrief(label),
    queryFn: () => fetchSermonBrief(label),
    enabled: false,
  })
  const bookLabel = label.replace(/\s+[\d:,\-–\s]+$/, '')

  const ask = useMutation({
    mutationFn: () => fetchOutlineOptions(label, bigIdea.trim()),
    onSuccess: setResult,
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const make = useMutation({
    // 뼈대를 함께 보내 한 번에 만든다(만들고 또 고치는 두 요청이었다)
    mutationFn: (o: OutlineOption) => createOutline({ title: o.title || `${label} 설교`, passage: label, sections: sectionsOf(o, bookLabel) }),
    onSuccess: saved => {
      void qc.invalidateQueries({ queryKey: pastorKeys.outlines() })
      void qc.invalidateQueries({ queryKey: pastorKeys.sermonStudy(label) })
      showToast('개요 보드에 뼈대를 만들었어요', 'success')
      navigate(`/pastor/sermon/outlines/${saved.id}`)
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  return (
    <SectionCard title="대지 후보 — 설교 뼈대" action={<span className="text-[12px] text-gray-500 dark:text-white/50">뼈대만 · 살은 목사님이</span>}>
      <div className="space-y-2">
        <label className="block text-[12.5px] lg:text-[13.5px] font-bold text-gray-600 dark:text-white/60" htmlFor="big-idea">
          중심 명제 — 이 설교가 한 문장으로 말하려는 것
        </label>
        <textarea
          id="big-idea"
          className={`${inputCls} lg:text-[15px] resize-none`}
          rows={2}
          maxLength={160}
          value={bigIdea}
          placeholder="예: 열매는 짜내는 것이 아니라 그리스도께 붙어 있을 때 맺힌다 (비워 두면 본문의 중심 메시지로)"
          onChange={e => setBigIdea(e.target.value)}
        />
        {brief?.big_ideas && brief.big_ideas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[12px] font-semibold text-gray-500 dark:text-white/50 mr-0.5 self-center">연구 재료의 후보</span>
            {brief.big_ideas.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBigIdea(b.text)}
                className="max-w-full px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-brand text-[12px] lg:text-[13px] font-semibold text-left"
              >
                {b.text}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          disabled={ask.isPending}
          onClick={() => ask.mutate()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-[14px] lg:text-[15px] font-bold disabled:opacity-60"
        >
          <span className={`material-icons-outlined text-[18px] ${ask.isPending ? 'animate-spin' : ''}`}>
            {ask.isPending ? 'autorenew' : 'account_tree'}
          </span>
          {ask.isPending ? '뼈대를 세우는 중…' : result ? '다시 받기' : '뼈대 후보 받기'}
        </button>
      </div>

      {ask.isPending && !result && <BriefLoading text="본문에서 대지를 찾는 중입니다… (30초쯤)" />}

      {result && (
        <div className="space-y-3">
          {result.filtered > 0 && (
            <p className="text-[12.5px] text-amber-800 dark:text-amber-300">이단 표현이 섞인 후보 {result.filtered}개는 자동으로 뺐습니다.</p>
          )}
          <div className="grid gap-3 xl:grid-cols-2">
            {result.options.map(o => (
              <div key={o.id} className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02] p-3.5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-brand text-[11.5px] lg:text-[12.5px] font-bold">{o.style}</span>
                  <h3 className="min-w-0 truncate text-[14.5px] lg:text-[16px] font-bold text-ink-strong">{o.title}</h3>
                </div>
                {o.intro && <p className="text-[12.5px] lg:text-[13.5px] text-gray-600 dark:text-white/60"><b className="mr-1">서론</b>{o.intro}</p>}
                <ol className="space-y-1.5">
                  {o.points.map((p, i) => (
                    <li key={i} className="rounded-lg bg-white dark:bg-white/[0.04] px-3 py-2">
                      <p className="flex flex-wrap items-baseline gap-x-1.5 text-[13.5px] lg:text-[14.5px] font-bold text-ink-strong">
                        <span className="text-brand">{i + 1}.</span>
                        {p.label}
                        {p.verses ? (
                          <span className="text-[12px] font-semibold text-gray-500 dark:text-white/50">{p.verses}</span>
                        ) : p.verses_unchecked ? (
                          <span className="text-[12px] font-semibold text-amber-700 dark:text-amber-300">근거 절 확인 필요</span>
                        ) : null}
                      </p>
                      {p.gist && <p className="text-[12.5px] lg:text-[13.5px] leading-relaxed text-gray-600 dark:text-white/65">{p.gist}</p>}
                    </li>
                  ))}
                </ol>
                {o.close && <p className="text-[12.5px] lg:text-[13.5px] text-gray-600 dark:text-white/60"><b className="mr-1">결론</b>{o.close}</p>}
                <button
                  type="button"
                  disabled={make.isPending}
                  onClick={() => make.mutate(o)}
                  className="mt-auto inline-flex items-center justify-center gap-1 py-2 rounded-xl bg-ink-strong text-white dark:bg-white dark:text-black text-[13px] lg:text-[14px] font-bold disabled:opacity-50"
                >
                  <span className="material-icons-outlined text-[17px]">view_agenda</span>
                  {make.isPending && make.variables?.id === o.id ? '만드는 중…' : '이 뼈대로 개요 만들기'}
                </button>
              </div>
            ))}
          </div>
          <p className="text-[12px] lg:text-[13px] text-gray-500 dark:text-white/50">
            AI 초안입니다. 대지와 근거 절이 본문의 흐름에 맞는지 확인해 주세요.
          </p>
        </div>
      )}
    </SectionCard>
  )
}

export default OutlineOptionsCard
