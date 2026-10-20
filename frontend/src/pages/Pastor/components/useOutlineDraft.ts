// 설교 개요 편집 상태 — 개요 보드(PastorSermonOutline)와 설교 준비실(PastorStudioRoom)이 함께 쓴다.
//   서버 값은 처음 한 번만 옮겨 오고(저장 응답이 입력 중인 글을 덮지 않게), 입력이 멈추고 1초 뒤 저장한다.
//   저장은 한 번에 하나만 — 앞 저장이 끝나기 전엔 보내지 않고, 끝난 뒤 아직 고친 게 있으면 그때 보낸다
//   (백엔드가 요청을 차례로 처리해 저장이 1초를 넘기면, 겹쳐 보낸 옛 원고가 새 원고를 덮을 수 있었다).
//   원고가 저장본과 같은 칸은 manuscript 를 null 로 보내 서버가 저장된 원고를 둔다(칸당 최대 2만 자를 매번 보내지 않게).
//   화면을 떠나는 순간 대기 중인 입력도 바로 저장한다.
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchOutline,
  updateOutline,
  type OutlineSection,
  type OutlineSectionPatch,
  type SermonNote,
  type SermonOutline,
} from '../../../api/pastor'
import { pastorKeys } from '../../../hooks/queryKeys'
import { showToast } from '../../../utils/toast'

export interface OutlineDraft {
  title: string
  passage: string
  preach_on: string
  sections: OutlineSection[]
}

const toDraft = (o: SermonOutline): OutlineDraft => ({
  title: o.title,
  passage: o.passage ?? '',
  preach_on: o.preach_on ?? '',
  // 원고 칸이 생기기 전 개요엔 manuscript 가 없다
  sections: o.sections.map(s => ({ ...s, manuscript: s.manuscript ?? '' })),
})

export const useOutlineDraft = (id: number, enabled: boolean) => {
  const qc = useQueryClient()
  const { data, isPending } = useQuery<SermonOutline>({
    queryKey: pastorKeys.outline(id),
    queryFn: () => fetchOutline(id),
    enabled: enabled && !!id,
    refetchOnMount: 'always',
  })

  const [draft, setDraft] = useState<OutlineDraft | null>(null)
  const [dirty, setDirty] = useState(false)
  const [notes, setNotes] = useState<Record<number, SermonNote>>({})
  const loadedId = useRef<number | null>(null)
  // 마지막으로 서버에 저장된 칸별 원고 — 저장 때 그대로인 칸은 원고를 보내지 않는다
  const savedManuscripts = useRef<Record<string, string>>({})
  const rememberSaved = (o: SermonOutline) => {
    savedManuscripts.current = Object.fromEntries(o.sections.map(s => [s.id, s.manuscript ?? '']))
  }

  useEffect(() => {
    if (!data) return
    setNotes(prev => ({ ...prev, ...Object.fromEntries(data.notes.map(n => [n.id, n])) }))
    if (loadedId.current !== data.id) {
      loadedId.current = data.id
      rememberSaved(data)
      setDraft(toDraft(data))
    }
  }, [data])

  // 개요 글(text)·메모 배치·AI 초안 표시는 작아 늘 보낸다
  const payloadOf = (d: OutlineDraft) => ({
    title: d.title.trim() || '제목 없는 설교',
    passage: d.passage.trim() || null,
    preach_on: d.preach_on || null,
    sections: d.sections.map<OutlineSectionPatch>(s => {
      const m = s.manuscript ?? ''
      return { ...s, manuscript: m === savedManuscripts.current[s.id] ? null : m }
    }),
  })

  const save = useMutation({
    mutationFn: (d: OutlineDraft) => updateOutline(id, payloadOf(d)),
    onSuccess: saved => {
      rememberSaved(saved)
      qc.setQueryData(pastorKeys.outline(id), saved)
      void qc.invalidateQueries({ queryKey: pastorKeys.outlines() })
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  // 지금 서버로 가 있는 저장 — 다음 저장과 떠날 때의 저장은 이것이 끝난 뒤에 보낸다
  const inflight = useRef<Promise<unknown>>(Promise.resolve())
  const run = (d: OutlineDraft) => {
    setDirty(false)
    const p = save.mutateAsync(d)
    inflight.current = p.catch(() => undefined)
    return p
  }

  // 입력이 멈추고 1초 뒤 저장 — 앞 저장이 아직 가는 중이면 끝난 뒤(isPending 이 바뀌어 다시 돈다) 보낸다
  useEffect(() => {
    if (!dirty || !draft || save.isPending) return
    const t = setTimeout(() => void run(draft).catch(() => undefined), 1000)
    return () => clearTimeout(t)
    // save 는 매 렌더 새 객체라 의존성에서 뺀다(isPending 만 본다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty, save.isPending])

  // 1초 대기 중에 화면을 떠나도 마지막 입력을 잃지 않게 — 떠나는 순간 바로 저장(가는 중인 저장 뒤에)
  const pending = useRef<OutlineDraft | null>(null)
  pending.current = dirty ? draft : null
  const latest = useRef<OutlineDraft | null>(null)
  latest.current = draft
  useEffect(
    () => () => {
      const d = pending.current
      if (!d) return
      void inflight.current
        .then(() => updateOutline(id, payloadOf(d)))
        .then(() => qc.invalidateQueries({ queryKey: pastorKeys.outlines() }))
        .catch(() => undefined)
    },
    [id, qc],
  )

  const edit = (patch: Partial<OutlineDraft>) => {
    setDraft(d => (d ? { ...d, ...patch } : d))
    setDirty(true)
  }
  const editSections = (fn: (s: OutlineSection[]) => OutlineSection[]) => {
    setDraft(d => (d ? { ...d, sections: fn(d.sections) } : d))
    setDirty(true)
  }

  /** AI 점검·한 주 묶음은 저장된 원고를 읽는다 — 1초 대기 중인 입력을 먼저 저장 */
  const flush = async () => {
    if (!pending.current) return
    await inflight.current
    const d = pending.current
    if (d) await run(d)
  }

  /** 지금 상태를 바로 저장(설교 마침처럼 저장 뒤에 이어지는 요청 전에) */
  const saveNow = async () => {
    if (!latest.current) return
    await inflight.current
    const d = latest.current
    if (d) await run(d)
  }

  return { data, isPending, draft, dirty, saving: save.isPending, notes, setNotes, edit, editSections, flush, saveNow }
}
