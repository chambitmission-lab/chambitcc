import { useState, type ReactNode } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  NOTE_KIND_ICON,
  NOTE_KIND_LABEL,
  createNote,
  fetchNotes,
  type NoteFilters,
  type NoteKind,
  type NoteListData,
  type SermonNote,
} from '../../api/pastor'
import { showToast } from '../../utils/toast'
import { EmptyHint, SectionCard, StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import NoteComposer from './components/NoteComposer'
import { NoteCard, SermonTabs } from './components/sermonNotes'
import { chipCls, invalidateNoteQueries, noteListKey } from './components/sermonNoteUtils'
import { inputCls, usePastorGate } from './components/pastorUtils'

// 설교 메모장 — 좌: 빠른 메모 · 찾기 · 메모 목록 / 우: 다시 꺼내 볼 메모 · 안내
// 메모는 목사님만 본다. 말씀 연결(본문·상황 주제)은 서버가 규칙으로 붙인다(AI 미사용).

const KINDS = Object.keys(NOTE_KIND_LABEL) as NoteKind[]

type Editing = { note?: SermonNote; initial?: { kind?: NoteKind; body?: string } } | null

const PastorSermonNotes = () => {
  const pastor = usePastorGate()
  const [filters, setFilters] = useState<NoteFilters>({})
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Editing>(null)

  const { data, isPending } = useQuery<NoteListData>({
    queryKey: noteListKey(filters),
    queryFn: () => fetchNotes(filters),
    enabled: pastor,
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
  })

  const set = (patch: Partial<NoteFilters>) => setFilters(f => ({ ...f, ...patch }))
  const filtered = !!(filters.q || filters.kind || filters.tag || filters.topic || filters.book || filters.unused)

  return (
    <PastorShell>
      <SermonTabs />
      {isPending && !data ? (
        <StatSpinner label="설교 메모를 불러오는 중..." />
      ) : !data ? (
        <p className="px-4 py-16 text-center text-[13px] text-gray-600">설교 메모를 불러오지 못했습니다</p>
      ) : (
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="contents lg:block lg:min-w-0">
            <QuickCapture onExpand={initial => setEditing({ initial })} />

            <SectionCard
              title={`내 설교 메모 ${data.total}`}
              action={
                filtered ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({})
                      setSearch('')
                    }}
                    className="text-[12px] font-semibold text-brand hover:underline"
                  >
                    필터 지우기
                  </button>
                ) : (
                  <span className="text-[12px] text-gray-500 dark:text-white/50">아직 안 쓴 메모 {data.unused}</span>
                )
              }
            >
              <form
                className="flex gap-2"
                onSubmit={e => {
                  e.preventDefault()
                  set({ q: search })
                }}
              >
                <input
                  className={inputCls}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="메모·본문·태그로 찾기"
                  maxLength={50}
                />
                <button type="submit" className="shrink-0 px-4 rounded-xl bg-brand text-white text-[13.5px] font-bold">
                  찾기
                </button>
              </form>

              <div className="flex flex-wrap gap-1.5">
                <button type="button" className={chipCls(!filters.kind)} onClick={() => set({ kind: null })}>
                  전체
                </button>
                {KINDS.map(k => (
                  <button
                    key={k}
                    type="button"
                    className={`${chipCls(filters.kind === k)} inline-flex items-center gap-1`}
                    onClick={() => set({ kind: filters.kind === k ? null : k })}
                  >
                    <span className="material-icons-outlined text-[15px]">{NOTE_KIND_ICON[k]}</span>
                    {NOTE_KIND_LABEL[k]}
                  </button>
                ))}
                <button type="button" className={chipCls(!!filters.unused)} onClick={() => set({ unused: !filters.unused })}>
                  아직 안 쓴 것만
                </button>
              </div>

              {data.topics.length > 0 && (
                <FilterRow label="상황 주제">
                  {data.topics.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className={chipCls(filters.topic === t.id)}
                      onClick={() => set({ topic: filters.topic === t.id ? null : t.id })}
                    >
                      {t.name} <span className="font-normal opacity-70">{t.count}</span>
                    </button>
                  ))}
                </FilterRow>
              )}
              {data.books.length > 0 && (
                <FilterRow label="성경">
                  {data.books.map(b => (
                    <button
                      key={b.book_number}
                      type="button"
                      className={chipCls(filters.book === b.book_number)}
                      onClick={() => set({ book: filters.book === b.book_number ? null : b.book_number })}
                    >
                      {b.name} <span className="font-normal opacity-70">{b.count}</span>
                    </button>
                  ))}
                </FilterRow>
              )}
              {data.tags.length > 0 && (
                <FilterRow label="태그">
                  {data.tags.slice(0, 20).map(t => (
                    <button
                      key={t.tag}
                      type="button"
                      className={chipCls(filters.tag === t.tag)}
                      onClick={() => set({ tag: filters.tag === t.tag ? null : t.tag })}
                    >
                      #{t.tag} <span className="font-normal opacity-70">{t.count}</span>
                    </button>
                  ))}
                </FilterRow>
              )}

              {data.items.length === 0 ? (
                <EmptyHint text={data.total === 0 ? '떠오른 생각을 위에 한 줄로 적어 보세요' : '조건에 맞는 메모가 없습니다'} />
              ) : (
                <ul className="space-y-2">
                  {filtered && <li className="text-[12px] text-gray-600 dark:text-white/60">{data.count}개 찾음</li>}
                  {data.items.map(n => (
                    <li key={n.id}>
                      <NoteCard note={n} onOpen={() => setEditing({ note: n })} />
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          <div className="contents lg:block">
            <SectionCard title="다시 꺼내 볼 메모">
              <p className="text-[12px] text-gray-600 dark:text-white/60 leading-relaxed">
                두 달 넘게 묵혀 둔, 아직 설교에 쓰지 않은 메모를 날마다 두 개씩 꺼내 드립니다.
              </p>
              {data.resurface.length === 0 ? (
                <EmptyHint text="메모가 쌓이면 여기서 다시 만나요" />
              ) : (
                <ul className="space-y-2">
                  {data.resurface.map(n => (
                    <li key={n.id}>
                      <NoteCard note={n} compact onOpen={() => setEditing({ note: n })} />
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
            <SectionCard title="이렇게 이어집니다">
              <ul className="space-y-2 text-[12.5px] text-gray-600 dark:text-white/65 leading-relaxed">
                <li className="flex gap-2">
                  <span className="material-icons-outlined text-[17px] text-brand">menu_book</span>
                  "롬 8:28", "시편 23편"처럼 적은 본문은 자동으로 읽어 본문과 이어 둡니다.
                </li>
                <li className="flex gap-2">
                  <span className="material-icons-outlined text-[17px] text-brand">sell</span>
                  걱정·감사·병원 같은 삶의 말은 상황별 성경의 주제로 묶고 대표 구절을 붙입니다.
                </li>
                <li className="flex gap-2">
                  <span className="material-icons-outlined text-[17px] text-brand">search</span>
                  준비 도우미에서 본문을 확인하면, 그 본문·주제와 이어지는 메모가 함께 나옵니다.
                </li>
                <li className="flex gap-2">
                  <span className="material-icons-outlined text-[17px] text-brand">history</span>
                  설교에 쓴 메모는 날짜가 남아 같은 예화를 되풀이하지 않게 돕습니다.
                </li>
              </ul>
            </SectionCard>
          </div>
        </div>
      )}

      {editing && <NoteComposer note={editing.note} initial={editing.initial} onClose={() => setEditing(null)} />}
    </PastorShell>
  )
}

const FilterRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="text-[12px] font-bold text-gray-600 dark:text-white/65 mb-1.5">{label}</p>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </div>
)

// ── 빠른 메모 — 떠오를 때 한 줄로 ─────────────────────────
export const QuickCapture = ({ onExpand }: { onExpand: (initial: { kind: NoteKind; body: string }) => void }) => {
  const qc = useQueryClient()
  const [kind, setKind] = useState<NoteKind>('idea')
  const [body, setBody] = useState('')
  const save = useMutation({
    mutationFn: () => createNote({ kind, body: body.trim() }),
    onSuccess: saved => {
      invalidateNoteQueries(qc)
      const links = saved.refs.length + saved.topics.length
      showToast(links ? `메모를 남겼습니다 · 말씀 ${links}곳과 이어졌어요` : '메모를 남겼습니다', 'success')
      setBody('')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
  return (
    <SectionCard title="떠오른 생각 적기">
      <div className="flex flex-wrap gap-1.5">
        {KINDS.map(k => (
          <button key={k} type="button" className={chipCls(kind === k)} onClick={() => setKind(k)}>
            {NOTE_KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <textarea
        className={`${inputCls} min-h-[84px] resize-y`}
        value={body}
        maxLength={4000}
        placeholder="아이디어·예화·들은 이야기를 한 줄로. 심방 이야기는 이름을 빼고 적어 주세요."
        onChange={e => setBody(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onExpand({ kind, body })}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-gray-600 dark:text-white/70 hover:border-brand hover:text-brand"
        >
          자세히 쓰기
        </button>
        <button
          type="button"
          disabled={!body.trim() || save.isPending}
          onClick={() => save.mutate()}
          className="flex-1 py-2.5 rounded-xl bg-brand text-white text-[13.5px] font-bold disabled:opacity-40"
        >
          {save.isPending ? '저장 중...' : '메모 남기기'}
        </button>
      </div>
    </SectionCard>
  )
}

export default PastorSermonNotes
