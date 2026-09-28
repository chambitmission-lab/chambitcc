import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteOutline,
  fetchNotes,
  fetchOutline,
  fetchRelatedNotes,
  finishOutline,
  updateOutline,
  type OutlineSection,
  type SermonNote,
  type SermonOutline,
} from '../../api/pastor'
import { showToast } from '../../utils/toast'
import DatePicker from '../../components/common/DatePicker'
import { EmptyHint, SectionCard, StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import NoteComposer from './components/NoteComposer'
import { GhostButton, PastorModal, PrimaryButton } from './components/ui'
import { IconButton, NoteCard, SermonPicker, SermonTabs } from './components/sermonNotes'
import { invalidateNoteQueries, noteListKey } from './components/sermonNoteUtils'
import { formatDay, inputCls, pickerCls, usePastorGate } from './components/pastorUtils'

// 설교 개요 보드 — 칸(서론·본론·적용·결론…)마다 글을 쓰고 메모 카드를 붙여 배치한다.
// 입력이 멈추면 1초 뒤 저장. PC 오른쪽엔 '이 본문과 이어지는 메모'가 있어 누르면 지금 고른 칸에 붙는다.
// 설교를 마치면 붙인 메모가 모두 '설교에 씀'으로 표시된다(같은 예화 되풀이 방지).

interface Draft {
  title: string
  passage: string
  preach_on: string
  sections: OutlineSection[]
}

const toDraft = (o: SermonOutline): Draft => ({
  title: o.title,
  passage: o.passage ?? '',
  preach_on: o.preach_on ?? '',
  sections: o.sections,
})

const newSectionId = () => `s${Date.now().toString(36)}`

const PastorSermonOutline = () => {
  const pastor = usePastorGate()
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isPending } = useQuery<SermonOutline>({
    queryKey: ['pastor-outline', id],
    queryFn: () => fetchOutline(id),
    enabled: pastor && !!id,
    refetchOnMount: 'always',
  })

  const [draft, setDraft] = useState<Draft | null>(null)
  const [dirty, setDirty] = useState(false)
  const [notes, setNotes] = useState<Record<number, SermonNote>>({})
  const [active, setActive] = useState<string | null>(null)
  const [picking, setPicking] = useState<string | null>(null)
  const [openNote, setOpenNote] = useState<SermonNote | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const loadedId = useRef<number | null>(null)

  // 서버 값은 처음 한 번만 옮겨 온다 — 저장 응답으로 입력 중인 글을 덮지 않게
  useEffect(() => {
    if (!data) return
    setNotes(prev => ({ ...prev, ...Object.fromEntries(data.notes.map(n => [n.id, n])) }))
    if (loadedId.current !== data.id) {
      loadedId.current = data.id
      setDraft(toDraft(data))
      setActive(data.sections.find(s => s.id === 'body')?.id ?? data.sections[0]?.id ?? null)
    }
  }, [data])

  const save = useMutation({
    mutationFn: (d: Draft) =>
      updateOutline(id, {
        title: d.title.trim() || '제목 없는 설교',
        passage: d.passage.trim() || null,
        preach_on: d.preach_on || null,
        sections: d.sections,
      }),
    onSuccess: saved => {
      qc.setQueryData(['pastor-outline', id], saved)
      void qc.invalidateQueries({ queryKey: ['pastor-outlines'] })
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  // 입력이 멈추고 1초 뒤 저장
  useEffect(() => {
    if (!dirty || !draft) return
    const t = setTimeout(() => {
      setDirty(false)
      save.mutate(draft)
    }, 1000)
    return () => clearTimeout(t)
    // save 는 매 렌더 새 객체라 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty])

  // 1초 대기 중에 화면을 떠나도 마지막 입력을 잃지 않게 — 떠나는 순간 바로 저장
  const pending = useRef<Draft | null>(null)
  pending.current = dirty ? draft : null
  useEffect(
    () => () => {
      const d = pending.current
      if (!d) return
      void updateOutline(id, {
        title: d.title.trim() || '제목 없는 설교',
        passage: d.passage.trim() || null,
        preach_on: d.preach_on || null,
        sections: d.sections,
      })
        .then(() => qc.invalidateQueries({ queryKey: ['pastor-outlines'] }))
        .catch(() => undefined)
    },
    [id, qc],
  )

  const edit = (patch: Partial<Draft>) => {
    setDraft(d => (d ? { ...d, ...patch } : d))
    setDirty(true)
  }
  const editSections = (fn: (s: OutlineSection[]) => OutlineSection[]) => {
    setDraft(d => (d ? { ...d, sections: fn(d.sections) } : d))
    setDirty(true)
  }

  const attach = (sectionId: string, picked: SermonNote[]) => {
    setNotes(prev => ({ ...prev, ...Object.fromEntries(picked.map(n => [n.id, n])) }))
    editSections(list =>
      list.map(s =>
        s.id === sectionId
          ? { ...s, note_ids: [...s.note_ids, ...picked.map(n => n.id).filter(nid => !s.note_ids.includes(nid))] }
          : s,
      ),
    )
  }

  /** 메모 카드 한 칸 위/아래 — 칸 끝에서는 이웃 칸으로 넘어간다 */
  const moveNote = (sectionIdx: number, noteIdx: number, dir: -1 | 1) =>
    editSections(list => {
      const next = list.map(s => ({ ...s, note_ids: [...s.note_ids] }))
      const from = next[sectionIdx]
      const [nid] = from.note_ids.splice(noteIdx, 1)
      const target = noteIdx + dir
      if (target >= 0 && target <= from.note_ids.length) {
        from.note_ids.splice(target, 0, nid)
      } else {
        const other = next[sectionIdx + dir]
        if (!other) {
          from.note_ids.splice(noteIdx, 0, nid)
          return list
        }
        if (dir < 0) other.note_ids.push(nid)
        else other.note_ids.unshift(nid)
      }
      return next
    })

  const moveSection = (idx: number, dir: -1 | 1) =>
    editSections(list => {
      const next = [...list]
      const t = idx + dir
      if (t < 0 || t >= next.length) return list
      ;[next[idx], next[t]] = [next[t], next[idx]]
      return next
    })

  const allNoteIds = useMemo(() => new Set(draft?.sections.flatMap(s => s.note_ids) ?? []), [draft])

  const remove = useMutation({
    mutationFn: () => deleteOutline(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pastor-outlines'] })
      showToast('개요를 지웠습니다', 'success')
      navigate('/pastor/sermon/outlines', { replace: true })
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const finish = useMutation({
    mutationFn: async (choice: { sermonId: number | null; date: string }) => {
      if (draft) await save.mutateAsync(draft)
      setDirty(false)
      return finishOutline(id, { sermon_id: choice.sermonId, preached_on: choice.sermonId ? null : choice.date })
    },
    onSuccess: saved => {
      qc.setQueryData(['pastor-outline', id], saved)
      setNotes(prev => ({ ...prev, ...Object.fromEntries(saved.notes.map(n => [n.id, n])) }))
      invalidateNoteQueries(qc)
      setFinishing(false)
      showToast(saved.notes.length ? `설교를 마쳤습니다 · 메모 ${saved.notes.length}개를 '설교에 씀'으로 표시했어요` : '설교를 마쳤습니다', 'success')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  if (isPending || !draft || !data) {
    return (
      <PastorShell>
        <SermonTabs />
        {isPending ? <StatSpinner label="개요를 불러오는 중..." /> : <p className="px-4 py-16 text-center text-[13px] text-gray-600">개요를 찾을 수 없습니다</p>}
      </PastorShell>
    )
  }

  const outlineText = () => buildOutlineText(draft, notes)

  return (
    <PastorShell>
      <SermonTabs />
      <div className="px-4 pt-3 flex items-center gap-2 text-[12.5px]">
        <Link to="/pastor/sermon/outlines" className="flex items-center gap-0.5 font-semibold text-gray-600 dark:text-white/60 hover:text-brand">
          <span className="material-icons-outlined text-[18px]">chevron_left</span>개요 목록
        </Link>
        <span className="ml-auto text-gray-500 dark:text-white/50">
          {save.isPending ? '저장 중...' : dirty ? '입력 중' : '저장됨'}
        </span>
      </div>

      <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="contents lg:block lg:min-w-0">
          <SectionCard
            title={data.status === 'done' ? '마친 설교' : '설교 개요'}
            action={
              <span className="flex items-center gap-0.5">
                <IconButton
                  icon="content_copy"
                  label="글로 복사"
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(outlineText())
                      .then(() => showToast('개요를 복사했습니다', 'success'))
                      .catch(() => showToast('복사하지 못했습니다', 'error'))
                  }
                />
                <IconButton icon="print" label="인쇄" onClick={() => printOutline(draft.title, outlineText())} />
                <IconButton
                  icon="delete_outline"
                  label={confirmDelete ? '한 번 더 누르면 지웁니다' : '개요 지우기'}
                  danger
                  onClick={() => (confirmDelete ? remove.mutate() : setConfirmDelete(true))}
                />
              </span>
            }
          >
            <input
              className={`${inputCls} text-[16px] lg:text-[18px] font-bold`}
              value={draft.title}
              maxLength={200}
              placeholder="설교 제목"
              onChange={e => edit({ title: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className={inputCls}
                value={draft.passage}
                maxLength={100}
                placeholder="본문 — 예: 빌 4:4-7"
                onChange={e => edit({ passage: e.target.value })}
              />
              <DatePicker value={draft.preach_on} onChange={v => edit({ preach_on: v })} placeholder="설교할 날" className={pickerCls} />
            </div>
            {data.status === 'done' ? (
              <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand">
                <span className="material-icons-outlined text-[17px]">task_alt</span>
                {data.preach_on ? `${formatDay(data.preach_on)} 설교를 마쳤습니다` : '설교를 마쳤습니다'} · 붙인 메모는 '설교에 씀'으로 남았습니다
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setFinishing(true)}
                className="w-full py-2.5 rounded-xl border border-brand text-brand text-[13.5px] font-bold hover:bg-[var(--brand-soft)]"
              >
                설교를 마쳤어요
              </button>
            )}
          </SectionCard>

          {draft.sections.map((s, si) => (
            <div key={s.id} className="px-4 pt-4" onFocusCapture={() => setActive(s.id)} onClick={() => setActive(s.id)}>
              <div
                className={`rounded-2xl border bg-white/80 dark:bg-card-dark p-4 space-y-3 transition-colors ${
                  active === s.id ? 'border-brand' : 'border-gray-200/70 dark:border-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <input
                    className="flex-1 min-w-0 bg-transparent text-[14.5px] lg:text-[16px] font-bold text-ink-strong focus:outline-none border-b border-transparent focus:border-brand"
                    value={s.label}
                    maxLength={30}
                    onChange={e => editSections(list => list.map(x => (x.id === s.id ? { ...x, label: e.target.value } : x)))}
                    aria-label="칸 이름"
                  />
                  <IconButton icon="arrow_upward" label="칸 위로" disabled={si === 0} onClick={() => moveSection(si, -1)} />
                  <IconButton icon="arrow_downward" label="칸 아래로" disabled={si === draft.sections.length - 1} onClick={() => moveSection(si, 1)} />
                  <IconButton
                    icon="close"
                    label="칸 지우기"
                    danger
                    disabled={draft.sections.length <= 1}
                    onClick={() => {
                      if ((s.text.trim() || s.note_ids.length) && !window.confirm(`'${s.label}' 칸의 글과 메모 배치를 지울까요?`)) return
                      editSections(list => list.filter(x => x.id !== s.id))
                    }}
                  />
                </div>
                <textarea
                  className={`${inputCls} min-h-[96px] resize-y lg:text-[15.5px] lg:leading-[1.8]`}
                  value={s.text}
                  maxLength={6000}
                  placeholder={`${s.label}에서 전할 내용`}
                  onChange={e => editSections(list => list.map(x => (x.id === s.id ? { ...x, text: e.target.value } : x)))}
                />
                {s.note_ids.length > 0 && (
                  <ul className="space-y-1.5">
                    {s.note_ids.map((nid, ni) => {
                      const n = notes[nid]
                      if (!n) return null
                      const first = si === 0 && ni === 0
                      const last = si === draft.sections.length - 1 && ni === s.note_ids.length - 1
                      return (
                        <li key={nid}>
                          <NoteCard
                            note={n}
                            compact
                            onOpen={() => setOpenNote(n)}
                            trailing={
                              <>
                                <IconButton icon="arrow_upward" label="위로" disabled={first} onClick={() => moveNote(si, ni, -1)} />
                                <IconButton icon="arrow_downward" label="아래로" disabled={last} onClick={() => moveNote(si, ni, 1)} />
                                <IconButton
                                  icon="link_off"
                                  label="이 칸에서 빼기"
                                  danger
                                  onClick={() =>
                                    editSections(list => list.map(x => (x.id === s.id ? { ...x, note_ids: x.note_ids.filter(v => v !== nid) } : x)))
                                  }
                                />
                              </>
                            }
                          />
                        </li>
                      )
                    })}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => setPicking(s.id)}
                  className="w-full py-2 rounded-xl border border-dashed border-gray-300 dark:border-white/[0.15] text-[12.5px] lg:text-[14px] font-semibold text-gray-600 dark:text-white/65 hover:border-brand hover:text-brand"
                >
                  + 메모 넣기
                </button>
              </div>
            </div>
          ))}
          <div className="px-4 pt-3">
            <button
              type="button"
              disabled={draft.sections.length >= 12}
              onClick={() => {
                const sid = newSectionId()
                editSections(list => [...list, { id: sid, label: '새 칸', text: '', note_ids: [] }])
                setActive(sid)
              }}
              className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.05] text-[13px] font-semibold text-gray-600 dark:text-white/70 hover:text-brand disabled:opacity-40"
            >
              + 칸 추가 (예: 본론 2, 예화, 기도)
            </button>
          </div>
        </div>

        <div className="contents lg:block">
          <RelatedPanel
            passage={draft.passage}
            used={allNoteIds}
            activeLabel={draft.sections.find(x => x.id === active)?.label ?? null}
            onAdd={n => active && attach(active, [n])}
            onOpen={setOpenNote}
          />
        </div>
      </div>

      {picking && (
        <NotePicker
          passage={draft.passage}
          exclude={allNoteIds}
          sectionLabel={draft.sections.find(x => x.id === picking)?.label ?? ''}
          onClose={() => setPicking(null)}
          onPick={picked => {
            attach(picking, picked)
            setPicking(null)
          }}
        />
      )}
      {openNote && (
        <NoteComposer
          note={openNote}
          onClose={() => setOpenNote(null)}
          onSaved={saved => setNotes(prev => ({ ...prev, [saved.id]: saved }))}
        />
      )}
      {finishing && (
        <PastorModal title="설교를 마쳤어요" onClose={() => setFinishing(false)} footer={<GhostButton onClick={() => setFinishing(false)}>닫기</GhostButton>}>
          <p className="text-[12.5px] text-gray-600 dark:text-white/65 leading-relaxed">
            어느 설교였나요? 이 개요에 붙인 메모 {allNoteIds.size}개가 '설교에 씀'으로 표시되어, 다음에 같은 예화를 쓰려 할 때 알려 드립니다.
          </p>
          <SermonPicker
            pending={finish.isPending}
            onPick={({ sermon, date }) => finish.mutate({ sermonId: sermon?.id ?? null, date: draft.preach_on || date })}
          />
        </PastorModal>
      )}
    </PastorShell>
  )
}

// ── 오른쪽: 이 본문과 이어지는 메모 ─────────────────────────
const RelatedPanel = ({
  passage,
  used,
  activeLabel,
  onAdd,
  onOpen,
}: {
  passage: string
  used: Set<number>
  activeLabel: string | null
  onAdd: (n: SermonNote) => void
  onOpen: (n: SermonNote) => void
}) => {
  const ref = passage.trim()
  const { data, isFetching } = useQuery({
    queryKey: ['pastor-note-related', ref],
    queryFn: () => fetchRelatedNotes(ref),
    enabled: ref.length >= 2,
    staleTime: 30_000,
  })
  const items = (data?.items ?? []).filter(n => !used.has(n.id))
  return (
    <SectionCard title="이 본문과 이어지는 메모" action={isFetching ? <span className="text-[12px] text-gray-500">찾는 중...</span> : undefined}>
      {!ref ? (
        <EmptyHint text="본문을 적으면 이어지는 메모를 찾아 드립니다" />
      ) : items.length === 0 ? (
        <EmptyHint text={data?.items.length ? '이어지는 메모를 모두 넣었습니다' : '이 본문과 이어지는 메모가 아직 없습니다'} />
      ) : (
        <>
          {data?.topics && data.topics.length > 0 && (
            <p className="text-[12px] text-gray-600 dark:text-white/60">본문의 주제: {data.topics.join(' · ')}</p>
          )}
          <ul className="space-y-1.5">
            {items.map(n => (
              <li key={n.id}>
                <NoteCard
                  note={n}
                  compact
                  onOpen={() => onOpen(n)}
                  trailing={<IconButton icon="add" label={activeLabel ? `'${activeLabel}' 칸에 넣기` : '칸을 먼저 고르세요'} disabled={!activeLabel} onClick={() => onAdd(n)} />}
                />
              </li>
            ))}
          </ul>
          {activeLabel && <p className="text-[12px] text-gray-500 dark:text-white/50">+ 를 누르면 '{activeLabel}' 칸에 붙습니다</p>}
        </>
      )}
    </SectionCard>
  )
}

// ── 메모 넣기 ─────────────────────────────────────────────
const NotePicker = ({
  passage,
  exclude,
  sectionLabel,
  onClose,
  onPick,
}: {
  passage: string
  exclude: Set<number>
  sectionLabel: string
  onClose: () => void
  onPick: (notes: SermonNote[]) => void
}) => {
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Record<number, SermonNote>>({})
  const ref = passage.trim()
  const related = useQuery({
    queryKey: ['pastor-note-related', ref],
    queryFn: () => fetchRelatedNotes(ref),
    enabled: ref.length >= 2,
  })
  const all = useQuery({ queryKey: noteListKey({ q }), queryFn: () => fetchNotes({ q }) })

  const relatedItems = (related.data?.items ?? []).filter(n => !exclude.has(n.id))
  const relatedIds = new Set(relatedItems.map(n => n.id))
  const others = (all.data?.items ?? []).filter(n => !exclude.has(n.id) && !relatedIds.has(n.id))
  const count = Object.keys(picked).length

  const toggle = (n: SermonNote) =>
    setPicked(p => {
      const next = { ...p }
      if (next[n.id]) delete next[n.id]
      else next[n.id] = n
      return next
    })

  const row = (n: SermonNote) => (
    <li key={n.id}>
      <NoteCard
        note={n}
        compact
        onOpen={() => toggle(n)}
        trailing={
          <span className={`material-icons-outlined text-[22px] mt-1 ${picked[n.id] ? 'text-brand' : 'text-gray-400'}`}>
            {picked[n.id] ? 'check_circle' : 'radio_button_unchecked'}
          </span>
        }
      />
    </li>
  )

  return (
    <PastorModal
      title={`'${sectionLabel}' 칸에 메모 넣기`}
      onClose={onClose}
      footer={
        <PrimaryButton disabled={!count} onClick={() => onPick(Object.values(picked))}>
          {count ? `${count}개 넣기` : '메모를 고르세요'}
        </PrimaryButton>
      }
    >
      <form
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault()
          setQ(search.trim())
        }}
      >
        <input className={inputCls} value={search} onChange={e => setSearch(e.target.value)} placeholder="메모 찾기" maxLength={50} />
        <button type="submit" className="shrink-0 px-4 rounded-xl bg-brand text-white text-[13.5px] font-bold">
          찾기
        </button>
      </form>
      {relatedItems.length > 0 && !q && (
        <div className="space-y-1.5">
          <p className="text-[12px] font-bold text-gray-600 dark:text-white/65">이 본문과 이어지는 메모</p>
          <ul className="space-y-1.5">{relatedItems.map(row)}</ul>
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-[12px] font-bold text-gray-600 dark:text-white/65">{q ? `'${q}' 찾은 메모` : '모든 메모'}</p>
        {all.isPending ? (
          <p className="py-4 text-center text-[12.5px] text-gray-500">불러오는 중...</p>
        ) : others.length === 0 ? (
          <EmptyHint text="넣을 수 있는 메모가 없습니다" />
        ) : (
          <ul className="space-y-1.5">{others.map(row)}</ul>
        )}
      </div>
    </PastorModal>
  )
}

// ── 복사·인쇄 ─────────────────────────────────────────────
const buildOutlineText = (d: Draft, notes: Record<number, SermonNote>): string => {
  const lines: string[] = [d.title.trim() || '제목 없는 설교']
  const meta = [d.passage.trim(), d.preach_on && formatDay(d.preach_on)].filter(Boolean).join(' · ')
  if (meta) lines.push(meta)
  for (const s of d.sections) {
    lines.push('', `■ ${s.label}`)
    if (s.text.trim()) lines.push(s.text.trim())
    for (const nid of s.note_ids) {
      const n = notes[nid]
      if (!n) continue
      lines.push(`  · ${n.body.replace(/\s*\n\s*/g, ' ')}${n.source ? ` (${n.source})` : ''}`)
    }
  }
  return lines.join('\n')
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const printOutline = (title: string, text: string) => {
  const w = window.open('', '_blank', 'width=800,height=900')
  if (!w) {
    showToast('팝업이 막혀 인쇄 창을 열지 못했습니다', 'error')
    return
  }
  w.document.write(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
      `<style>body{font-family:'Pretendard','Apple SD Gothic Neo','Malgun Gothic',sans-serif;margin:48px;color:#111;line-height:1.9;font-size:15px}` +
      `pre{white-space:pre-wrap;font-family:inherit;margin:0}</style></head>` +
      `<body><pre>${escapeHtml(text)}</pre></body></html>`,
  )
  w.document.close()
  w.focus()
  w.print()
}

export default PastorSermonOutline
