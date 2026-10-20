// 적용 다리 — 본문 작업대에서 '이 본문을 요즘 우리 성도에게' 잇는 대상별 적용 후보 (PastorSermonStudy)
//   근거로 쓴 교회 형편(기도 감정·돌봄 상황 수·밑줄 낱말·다가오는 일정·표어)을 먼저 그대로 보여 준다.
//   서버가 이름·기도 본문·심방 메모는 AI 에 보내지 않는다(숫자·낱말만, 표본이 적으면 뺌).
//   항목은 연구 재료와 같은 '메모로 담기 / 고쳐서 담기 / 빼기'.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createNote, fetchSermonBridge, type ChurchContext, type SermonBridge } from '../../../api/pastor'
import { pastorKeys } from '../../../hooks/queryKeys'
import { showToast } from '../../../utils/toast'
import { SectionCard } from '../../Admin/components/StatCards'
import NoteComposer from './NoteComposer'
import { BriefItem, BriefLoading, type Item } from './SermonBriefCard'
import { AI_NOTE_SOURCE, AI_NOTE_TAGS, invalidateNoteQueries } from './sermonNoteUtils'

const SermonBridgeCard = ({ label, onSaved }: { label: string; onSaved?: () => void }) => {
  const qc = useQueryClient()
  const [asked, setAsked] = useState(() => qc.getQueryData(pastorKeys.sermonBridge(label)) != null)
  const { data, isFetching, error, refetch } = useQuery<SermonBridge, Error>({
    queryKey: pastorKeys.sermonBridge(label),
    queryFn: () => fetchSermonBridge(label),
    enabled: asked,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const regenerate = useMutation({
    mutationFn: () => fetchSermonBridge(label, true),
    onSuccess: fresh => qc.setQueryData(pastorKeys.sermonBridge(label), fresh),
    onError: (e: Error) => showToast(e.message, 'error'),
  })
  const busy = isFetching || regenerate.isPending

  return (
    <SectionCard
      title="적용 다리 — 요즘 우리 성도에게"
      action={<span className="text-[12px] text-gray-500 dark:text-white/50">성도 이름을 뺀 교회 형편 · 목사님 확인 후 사용</span>}
    >
      {!asked ? (
        <div className="rounded-xl bg-[var(--brand-soft)] px-4 py-3.5 space-y-2.5">
          <p className="text-[13.5px] lg:text-[15px] leading-relaxed text-ink-strong">
            최근 기도에 담긴 마음, 돌봄 중인 가정 수, 성도들이 밑줄 그은 말씀, 다가오는 교회 일정을 본문과 이어 대상별 적용 후보를 드립니다.
          </p>
          <p className="text-[12px] lg:text-[13px] text-gray-600 dark:text-white/60">
            이름·기도 내용·심방 메모는 보내지 않습니다. 비밀기도는 빼고, 적은 수는 누군지 짐작되지 않게 뺍니다.
          </p>
          <button
            type="button"
            onClick={() => setAsked(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-[14px] lg:text-[15px] font-bold"
          >
            <span className="material-icons-outlined text-[18px]">diversity_3</span>
            적용 후보 받기
          </button>
        </div>
      ) : busy && !data ? (
        <BriefLoading text="우리 교회 형편과 본문을 잇는 중입니다… (30초쯤)" />
      ) : error && !data ? (
        <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] px-4 py-3.5 space-y-2">
          <p className="text-[13.5px] text-gray-700 dark:text-white/70">{error.message}</p>
          <button type="button" onClick={() => void refetch()} className="text-[13px] font-bold text-brand hover:underline">
            다시 시도
          </button>
        </div>
      ) : data ? (
        <BridgeBody key={data.bridges.map(b => b.id + b.truth).join('|')} data={data} label={label} busy={busy} onSaved={onSaved} onRegenerate={() => regenerate.mutate()} />
      ) : null}
    </SectionCard>
  )
}

const ContextChips = ({ ctx }: { ctx: ChurchContext }) => {
  const rows: Array<[string, string[]]> = [
    [`최근 ${ctx.days}일 기도의 마음`, ctx.emotions.map(e => `${e.label} ${e.count}`)],
    ['돌봄 중인 가정', ctx.care.map(c => `${c.label} ${c.count}가정`)],
    ['밑줄 그은 낱말', ctx.words],
    ['다가오는 일정', ctx.events.map(e => e.title)],
    ['올해 표어', ctx.theme ? [`${ctx.theme.text} (${ctx.theme.ref})`] : []],
  ]
  const shown = rows.filter(([, v]) => v.length > 0)
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-3.5 py-3 space-y-1.5">
      <p className="text-[12px] lg:text-[13px] font-bold text-gray-500 dark:text-white/50">근거로 쓴 우리 교회 형편</p>
      {shown.length === 0 ? (
        <p className="text-[12.5px] text-gray-600 dark:text-white/60">아직 집계할 만큼 모이지 않아 본문에서 바로 나오는 적용으로 만들었습니다.</p>
      ) : (
        shown.map(([k, v]) => (
          <p key={k} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-[12.5px] lg:text-[13.5px]">
            <span className="shrink-0 font-semibold text-gray-600 dark:text-white/65">{k}</span>
            {v.map(x => (
              <span key={x} className="px-2 py-0.5 rounded-full bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/75">
                {x}
              </span>
            ))}
          </p>
        ))
      )}
    </div>
  )
}

const BridgeBody = ({
  data,
  label,
  busy,
  onSaved,
  onRegenerate,
}: {
  data: SermonBridge
  label: string
  busy: boolean
  onSaved?: () => void
  onRegenerate: () => void
}) => {
  const qc = useQueryClient()
  const [state, setState] = useState<Record<string, 'saved' | 'dropped'>>({})
  const [editing, setEditing] = useState<Item | null>(null)

  const items: Item[] = data.bridges.map(b => ({
    id: b.id,
    kind: 'idea',
    head: b.audience,
    sub: b.basis ? `근거: ${b.basis}` : undefined,
    body: [b.need && `형편 — ${b.need}`, `진리 — ${b.truth}`, `적용 — ${b.application}`].filter(Boolean).join('\n'),
    note: `[적용 · ${b.audience}] ${b.truth}\n${b.application}${b.need ? `\n(형편: ${b.need})` : ''}`,
  }))

  const save = useMutation({
    mutationFn: (it: Item) => createNote({ kind: it.kind, body: it.note, passage: label, source: AI_NOTE_SOURCE, tags: [...AI_NOTE_TAGS, '적용'] }),
    onSuccess: (_n, it) => {
      setState(s => ({ ...s, [it.id]: 'saved' }))
      invalidateNoteQueries(qc)
      onSaved?.()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  return (
    <div className="space-y-3">
      <ContextChips ctx={data.context} />
      {data.filtered > 0 && (
        <p className="flex items-center gap-1.5 rounded-xl px-3 py-2 bg-amber-50 border border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/25 text-[12.5px] lg:text-[13.5px] text-amber-900 dark:text-amber-200">
          <span className="material-icons-outlined text-[16px]">shield</span>
          이단·번영신학 표현이 섞인 후보 {data.filtered}개는 자동으로 뺐습니다.
        </p>
      )}
      <ul className="space-y-1.5">
        {items.map(it => (
          <BriefItem
            key={it.id}
            item={it}
            state={state[it.id]}
            pending={save.isPending && save.variables?.id === it.id}
            onSave={() => save.mutate(it)}
            onEdit={() => setEditing(it)}
            onDrop={() => setState(s => ({ ...s, [it.id]: 'dropped' }))}
            onUndo={() =>
              setState(s => {
                const next = { ...s }
                delete next[it.id]
                return next
              })
            }
          />
        ))}
      </ul>
      {data.caution && (
        <p className="flex items-start gap-1.5 text-[12.5px] lg:text-[13.5px] leading-relaxed text-gray-700 dark:text-white/75">
          <span className="material-icons-outlined text-[16px] mt-0.5 text-amber-600 dark:text-amber-300">report_gmailerrorred</span>
          <span>
            <b className="mr-1">적용할 때 주의</b>
            {data.caution}
          </span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200/70 dark:border-white/[0.06]">
        <p className="flex-1 min-w-[220px] pt-2 text-[12px] lg:text-[13px] leading-relaxed text-gray-500 dark:text-white/50">
          AI 초안입니다. 특정 성도를 떠올리게 하는 표현은 설교에서 다듬어 주세요.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={onRegenerate}
          className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 text-[12.5px] lg:text-[13.5px] font-bold text-gray-600 dark:text-white/65 hover:text-brand disabled:opacity-40"
        >
          <span className={`material-icons-outlined text-[16px] ${busy ? 'animate-spin' : ''}`}>refresh</span>
          {busy ? '만드는 중…' : '다시 만들기'}
        </button>
      </div>
      {editing && (
        <NoteComposer
          initial={{ kind: 'idea', body: editing.note, passage: label, source: AI_NOTE_SOURCE, tags: [...AI_NOTE_TAGS, '적용'] }}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setState(s => ({ ...s, [editing.id]: 'saved' }))
            setEditing(null)
            onSaved?.()
          }}
        />
      )}
    </div>
  )
}

export default SermonBridgeCard
