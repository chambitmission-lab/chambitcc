// AI 연구 재료 — 본문 작업대에서 본문 하나에 대한 연구 재료 초안을 받는다 (PastorSermonStudy)
//   서버가 고신 개혁주의 기준(웨스트민스터 신앙고백)으로 만들고, 근거 없는 원어·없는 신앙고백 장·이단 표현은 걸러서 준다.
//   항목마다 '메모로 담기 / 고쳐서 담기 / 빼기' — 담은 것만 설교 메모가 된다(출처에 'AI 연구 재료 · 검토' 표시).
//   버튼을 눌러야 만든다(무료 한도·대기 시간). 같은 본문은 화면을 오가도 이 캐시로 다시 보인다.
import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createNote, fetchSermonBrief, type NoteKind, type SermonBrief } from '../../../api/pastor'
import { pastorKeys } from '../../../hooks/queryKeys'
import { showToast } from '../../../utils/toast'
import { SectionCard } from '../../Admin/components/StatCards'
import NoteComposer from './NoteComposer'
import { invalidateNoteQueries } from './sermonNoteUtils'

const AI_SOURCE = 'AI 연구 재료 · 목사님 검토'
const AI_TAGS = ['AI초안']

interface Item {
  id: string
  kind: NoteKind
  /** 화면에 보이는 머리 — 없으면 본문만 */
  head?: string
  sub?: string
  body: string
  /** 메모로 담을 때의 글 */
  note: string
  source?: string
}

interface Group {
  key: string
  title: string
  icon: string
  hint?: string
  items: Item[]
}

const groupsOf = (b: SermonBrief): Group[] =>
  [
    {
      key: 'context',
      title: '배경 · 문맥',
      icon: 'travel_explore',
      items: b.context.map(c => ({ id: c.id, kind: 'idea' as const, head: c.title, body: c.body, note: `[${c.title}] ${c.body}` })),
    },
    {
      key: 'words',
      title: '원어 낱말',
      icon: 'translate',
      hint: '원어 표기는 사전으로 한 번 더 확인해 주세요',
      items: b.words.map(w => ({
        id: w.id,
        kind: 'idea' as const,
        head: w.word,
        sub: w.original,
        body: w.meaning,
        note: `「${w.word}」${w.original ? ` (${w.original})` : ''} — ${w.meaning}`,
      })),
    },
    {
      key: 'christ',
      title: '구속사 · 그리스도 연결',
      icon: 'auto_awesome',
      items: b.christ.map(c => ({ id: c.id, kind: 'idea' as const, body: c.text, note: c.text })),
    },
    {
      key: 'doctrines',
      title: '웨스트민스터 신앙고백 연결',
      icon: 'menu_book',
      items: b.doctrines.map(d => ({
        id: d.id,
        kind: 'quote' as const,
        head: `${d.chapter}장 ${d.title}`,
        body: d.why,
        note: `웨스트민스터 신앙고백 ${d.chapter}장 「${d.title}」 — ${d.why}`,
        source: `웨스트민스터 신앙고백 ${d.chapter}장 · ${AI_SOURCE}`,
      })),
    },
    {
      key: 'cautions',
      title: '해석할 때 주의',
      icon: 'report_gmailerrorred',
      items: b.cautions.map(c => ({ id: c.id, kind: 'idea' as const, head: c.title, body: c.body, note: `해석 주의: ${c.title} — ${c.body}` })),
    },
    {
      key: 'big_ideas',
      title: '중심 명제 후보',
      icon: 'flag',
      items: b.big_ideas.map(x => ({ id: x.id, kind: 'idea' as const, body: x.text, note: `중심 명제 후보: ${x.text}` })),
    },
    {
      key: 'questions',
      title: '더 깊이 물을 질문',
      icon: 'help_outline',
      items: b.questions.map(x => ({ id: x.id, kind: 'question' as const, body: x.text, note: x.text })),
    },
  ].filter(g => g.items.length > 0)

const SermonBriefCard = ({ label, onSaved }: { label: string; onSaved?: () => void }) => {
  const qc = useQueryClient()
  const [asked, setAsked] = useState(() => qc.getQueryData(pastorKeys.sermonBrief(label)) != null)
  const { data, isFetching, error, refetch } = useQuery<SermonBrief, Error>({
    queryKey: pastorKeys.sermonBrief(label),
    queryFn: () => fetchSermonBrief(label),
    enabled: asked,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const regenerate = useMutation({
    mutationFn: () => fetchSermonBrief(label, true),
    onSuccess: fresh => qc.setQueryData(pastorKeys.sermonBrief(label), fresh),
    onError: (e: Error) => showToast(e.message, 'error'),
  })
  const busy = isFetching || regenerate.isPending

  return (
    <SectionCard
      title="AI 연구 재료"
      action={<span className="text-[12px] text-gray-500 dark:text-white/50">고신 개혁주의 기준 · 목사님 확인 후 사용</span>}
    >
      {!asked ? (
        <div className="rounded-xl bg-[var(--brand-soft)] px-4 py-3.5 space-y-2.5">
          <p className="text-[13.5px] lg:text-[15px] leading-relaxed text-ink-strong">
            배경·원어·구속사 흐름·신앙고백 연결·해석할 때 주의할 점을 초안으로 모아 드립니다. 설교문은 쓰지 않습니다.
          </p>
          <p className="text-[12px] lg:text-[13px] text-gray-600 dark:text-white/60">
            웨스트민스터 신앙고백 노선으로 만들고, 이단 단체·교리 표현이 섞인 항목은 자동으로 뺍니다. 30초쯤 걸립니다.
          </p>
          <button
            type="button"
            onClick={() => setAsked(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-[14px] lg:text-[15px] font-bold"
          >
            <span className="material-icons-outlined text-[18px]">auto_awesome</span>
            연구 재료 받기
          </button>
        </div>
      ) : busy && !data ? (
        <BriefLoading />
      ) : error && !data ? (
        <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] px-4 py-3.5 space-y-2">
          <p className="text-[13.5px] text-gray-700 dark:text-white/70">{error.message}</p>
          <button type="button" onClick={() => void refetch()} className="text-[13px] font-bold text-brand hover:underline">
            다시 시도
          </button>
        </div>
      ) : data ? (
        <BriefBody key={JSON.stringify(data.summary) + data.context.length} brief={data} label={label} busy={busy} onSaved={onSaved} onRegenerate={() => regenerate.mutate()} />
      ) : null}
    </SectionCard>
  )
}

const BriefLoading = () => (
  <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] px-4 py-4" role="status">
    <span className="w-5 h-5 rounded-full border-2 border-brand/30 border-t-brand animate-spin" aria-hidden />
    <span className="text-[13.5px] lg:text-[14.5px] text-gray-600 dark:text-white/65">본문을 살피며 연구 재료를 모으는 중입니다… (30초쯤)</span>
  </div>
)

const BriefBody = ({
  brief,
  label,
  busy,
  onSaved,
  onRegenerate,
}: {
  brief: SermonBrief
  label: string
  busy: boolean
  onSaved?: () => void
  onRegenerate: () => void
}) => {
  const qc = useQueryClient()
  const [state, setState] = useState<Record<string, 'saved' | 'dropped'>>({})
  const [editing, setEditing] = useState<Item | null>(null)
  const groups = groupsOf(brief)

  const save = useMutation({
    mutationFn: (it: Item) =>
      createNote({ kind: it.kind, body: it.note, passage: label, source: it.source ?? AI_SOURCE, tags: AI_TAGS }),
    onSuccess: (_n, it) => {
      setState(s => ({ ...s, [it.id]: 'saved' }))
      invalidateNoteQueries(qc)
      onSaved?.()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const savedCount = Object.values(state).filter(v => v === 'saved').length

  return (
    <div className="space-y-4">
      {brief.summary && (
        <p className="rounded-xl bg-[var(--brand-soft)] px-4 py-3 text-[14.5px] lg:text-[16px] font-semibold leading-relaxed text-ink-strong">
          {brief.summary}
        </p>
      )}
      {brief.filtered > 0 && (
        <p className="flex items-start gap-1.5 rounded-xl px-3 py-2 bg-amber-50 border border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/25 text-[12.5px] lg:text-[13.5px] text-amber-900 dark:text-amber-200">
          <span className="material-icons-outlined text-[16px] mt-0.5">shield</span>
          이단 단체·교리 표현이 섞인 항목 {brief.filtered}개는 자동으로 뺐습니다.
        </p>
      )}

      {groups.map(g => (
        <section key={g.key} className="space-y-1.5">
          <h3 className="flex items-center gap-1.5 text-[13px] lg:text-[14.5px] font-bold text-ink-strong">
            <span className="material-icons-outlined text-[17px] text-brand">{g.icon}</span>
            {g.title}
            {g.hint && <span className="ml-1 text-[11.5px] lg:text-[12.5px] font-medium text-gray-500 dark:text-white/50">{g.hint}</span>}
          </h3>
          <ul className="space-y-1.5">
            {g.items.map(it => (
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
        </section>
      ))}

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200/70 dark:border-white/[0.06]">
        <p className="flex-1 min-w-[220px] pt-2 text-[12px] lg:text-[13px] leading-relaxed text-gray-500 dark:text-white/50">
          AI 초안입니다. 신학적 판단과 선택은 목사님께 있습니다. 담은 메모에는 'AI 연구 재료 · 목사님 검토' 출처가 남습니다.
          {savedCount > 0 && <b className="ml-1 text-brand">메모 {savedCount}개 담음</b>}
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
          initial={{ kind: editing.kind, body: editing.note, passage: label, source: editing.source ?? AI_SOURCE, tags: AI_TAGS }}
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

const BriefItem = ({
  item,
  state,
  pending,
  onSave,
  onEdit,
  onDrop,
  onUndo,
}: {
  item: Item
  state?: 'saved' | 'dropped'
  pending: boolean
  onSave: () => void
  onEdit: () => void
  onDrop: () => void
  onUndo: () => void
}) => {
  if (state === 'dropped') {
    return (
      <li className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-[12.5px] text-gray-400 dark:text-white/35">
        <span className="flex-1 truncate line-through">{item.head ?? item.body}</span>
        <button type="button" onClick={onUndo} className="font-bold text-gray-500 dark:text-white/55 hover:text-brand">
          되돌리기
        </button>
      </li>
    )
  }
  const saved = state === 'saved'
  return (
    <li
      className={`rounded-xl px-3.5 py-2.5 border transition-colors ${
        saved
          ? 'bg-[var(--brand-soft)] border-brand/30'
          : 'bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-white/[0.05]'
      }`}
    >
      {item.head && (
        <p className="text-[13.5px] lg:text-[15px] font-bold text-ink-strong">
          {item.head}
          {item.sub && <span className="ml-1.5 font-semibold text-gray-500 dark:text-white/55">{item.sub}</span>}
        </p>
      )}
      <p className="text-[13.5px] lg:text-[15px] leading-relaxed text-gray-700 dark:text-white/75 whitespace-pre-line">{item.body}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {saved ? (
          <span className="inline-flex items-center gap-1 text-[12.5px] lg:text-[13.5px] font-bold text-brand">
            <span className="material-icons-outlined text-[16px]">check_circle</span>설교 메모에 담았어요
          </span>
        ) : (
          <>
            <ItemButton primary disabled={pending} onClick={onSave} icon="add">
              {pending ? '담는 중…' : '메모로 담기'}
            </ItemButton>
            <ItemButton onClick={onEdit} icon="edit">
              고쳐서 담기
            </ItemButton>
            <ItemButton onClick={onDrop} icon="close">
              빼기
            </ItemButton>
          </>
        )}
      </div>
    </li>
  )
}

const ItemButton = ({
  children,
  icon,
  primary,
  disabled,
  onClick,
}: {
  children: ReactNode
  icon: string
  primary?: boolean
  disabled?: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] lg:text-[13px] font-bold disabled:opacity-50 ${
      primary
        ? 'bg-brand text-white'
        : 'bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/65 hover:text-brand'
    }`}
  >
    <span className="material-icons-outlined text-[15px]">{icon}</span>
    {children}
  </button>
)

export default SermonBriefCard
