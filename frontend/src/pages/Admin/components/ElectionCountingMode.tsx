// 개표 입력 모드 — 종이 투표함을 열고 한 장씩 빠르게 넣는 전체 화면.
//
// 투표지 한 장 = 후보 고르기 → Enter(또는 '이 표 넣기'). 키보드만으로 끝까지 갈 수 있다:
//   숫자 = 기호 토글(10번 이상은 두 자리를 이어 친다) · Enter = 넣기 · X/- = 무효표 · A = 기권표
//   Backspace = 고른 것 비우기 · Ctrl+Z = 방금 넣은 표 취소 · Esc = 닫기
// 오른쪽 "대조용 합계"는 종이 표만의 후보별 합계다. 다른 위원이 정자(正)로 센 개표지와 맞춰 본다.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ElectionAdminDetail, ElectionRound } from '../../../types/election'
import { CandidateAvatar } from '../../Election/electionUi'
import { CloseButton } from './SeatEventComposer'

interface Props {
  election: ElectionAdminDetail
  round: ElectionRound
  pending: boolean
  onAdd: (candidateIds: number[], blankKind: 'invalid' | 'abstain') => void
  onDelete: (ballotId: number) => void
  onClose: () => void
}

const ElectionCountingMode = ({ election, round, pending, onAdd, onDelete, onClose }: Props) => {
  const candidates = useMemo(() => {
    const ids = new Set(round.candidate_ids)
    return election.candidates.filter((c) => ids.has(c.id))
  }, [election.candidates, round.candidate_ids])
  const [picked, setPicked] = useState<number[]>([])
  const [flash, setFlash] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<number[]>([])
  const digitBuf = useRef('')
  const digitTimer = useRef<number | undefined>(undefined)
  // 넣기 직전의 종이 표 id — 응답이 오면 새로 생긴 id 를 '방금 넣은 표'로 기억한다
  const [snapshot, setSnapshot] = useState<Set<number> | null>(null)

  const paper = election.paper_ballots
  const allowance = election.paper_allowance ?? 0
  const left = Math.max(0, allowance - paper.length)

  const [paperFor, setPaperFor] = useState(paper)
  if (paperFor !== paper) {
    setPaperFor(paper)
    if (snapshot) {
      const fresh = paper.filter((b) => !snapshot.has(b.id)).map((b) => b.id)
      setSnapshot(null)
      if (fresh.length) setUndoStack((s) => [...s, ...fresh].slice(-20))
    }
  }

  const totals = useMemo(() => {
    const byCand = new Map<number, number>()
    let invalid = 0
    let abstain = 0
    for (const b of paper) {
      if (b.kind === 'abstain') abstain += 1
      else if (!b.choices.length) invalid += 1
      for (const cid of b.choices) byCand.set(cid, (byCand.get(cid) ?? 0) + 1)
    }
    return { byCand, invalid, abstain }
  }, [paper])

  const toggle = (cid: number) =>
    setPicked((prev) =>
      prev.includes(cid) ? prev.filter((x) => x !== cid) : prev.length >= round.max_select ? prev : [...prev, cid]
    )

  const submit = (blankKind: 'invalid' | 'abstain' = 'invalid', blank = false) => {
    if (pending || left <= 0) return
    if (!blank && !picked.length) return
    setSnapshot(new Set(paper.map((b) => b.id)))
    onAdd(blank ? [] : picked, blankKind)
    const label = blank
      ? blankKind === 'abstain'
        ? '기권표'
        : '무효표'
      : candidates
          .filter((c) => picked.includes(c.id))
          .map((c) => `${c.number}.${c.name}`)
          .join(', ')
    setFlash(`넣었어요 — ${label}`)
    setPicked([])
  }

  const undo = () => {
    const last = undoStack[undoStack.length - 1]
    if (last == null || pending) return
    setUndoStack((s) => s.slice(0, -1))
    onDelete(last)
    setFlash('방금 넣은 표를 취소했어요')
  }

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 1600)
    return () => window.clearTimeout(t)
  }, [flash])

  // 키보드 — 최신 상태를 쓰도록 매 렌더 다시 단다(핸들러 하나라 비용이 없다)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
        return
      }
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault()
        window.clearTimeout(digitTimer.current)
        const twoDigit = candidates.length >= 10
        digitBuf.current = twoDigit ? (digitBuf.current + e.key).slice(-2) : e.key
        const pick = () => {
          const n = Number(digitBuf.current)
          digitBuf.current = ''
          const c = candidates.find((x) => x.number === n)
          if (c) toggle(c.id)
        }
        // 두 자리 기호가 있는 선거는 잠깐 기다렸다가 고른다 — '1' 다음 '2' 면 12번
        if (twoDigit && digitBuf.current.length < 2 && candidates.some((c) => c.number >= 10)) {
          digitTimer.current = window.setTimeout(pick, 600)
        } else pick()
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        submit()
      } else if (e.key === 'x' || e.key === 'X' || e.key === '-') {
        submit('invalid', true)
      } else if (e.key === 'a' || e.key === 'A') {
        submit('abstain', true)
      } else if (e.key === 'Backspace') {
        setPicked([])
      } else if (e.key === 'Escape') {
        if (picked.length) setPicked([])
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="fixed inset-0 z-[130] bg-[var(--app-canvas)] dark:bg-background-dark flex flex-col">
      <div className="shrink-0 flex items-center gap-3 px-5 py-3.5 border-b border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[0.08em] text-brand">개표 입력 · {round.round_no}차</p>
          <h2 className="text-[18px] font-extrabold text-ink-strong truncate">{election.title}</h2>
        </div>
        <p className="shrink-0 text-right tabular-nums">
          <span className="block text-[11px] font-bold text-ink-muted">넣은 종이 표</span>
          <span className="text-[22px] font-extrabold text-ink-strong">{paper.length}</span>
          <span className="text-[14px] font-bold text-ink-muted"> / {allowance}장</span>
        </p>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="px-5 py-5 lg:overflow-y-auto">
          <p className="text-[13px] text-ink-muted break-keep">
            투표지에 적힌 후보를 누르고 <b className="text-ink-strong">이 표 넣기</b>(Enter). 한 표에 {round.max_select}명까지.
            <span className="hidden lg:inline"> 숫자키 = 기호 · X = 무효 · A = 기권 · Ctrl+Z = 방금 넣은 표 취소</span>
          </p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            {candidates.map((c) => {
              const on = picked.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-pressed={on}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-colors ${
                    on ? 'border-brand bg-[var(--brand-soft)]' : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-card-dark'
                  }`}
                >
                  <span className="shrink-0 w-11 h-11 rounded-xl bg-ink-strong text-white dark:bg-white dark:text-[#16161d] flex items-center justify-center text-[20px] font-extrabold tabular-nums">
                    {c.number}
                  </span>
                  <span className="min-w-0 flex-1 text-[17px] font-bold text-ink-strong truncate">{c.name}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => submit()}
              disabled={!picked.length || pending || left <= 0}
              className="col-span-3 sm:col-span-1 h-14 rounded-2xl bg-brand text-white text-[17px] font-bold disabled:opacity-40"
            >
              이 표 넣기{picked.length ? ` (${picked.length}명)` : ''}
            </button>
            <button
              type="button"
              onClick={() => submit('invalid', true)}
              disabled={pending || left <= 0}
              className="h-14 rounded-2xl border border-gray-200 dark:border-white/[0.12] text-[15px] font-bold text-ink disabled:opacity-40"
            >
              무효표
            </button>
            <button
              type="button"
              onClick={() => submit('abstain', true)}
              disabled={pending || left <= 0}
              className="h-14 rounded-2xl border border-gray-200 dark:border-white/[0.12] text-[15px] font-bold text-ink disabled:opacity-40"
            >
              기권표
            </button>
            <button
              type="button"
              onClick={undo}
              disabled={!undoStack.length || pending}
              className="col-span-3 sm:col-span-1 h-14 rounded-2xl border border-gray-200 dark:border-white/[0.12] text-[15px] font-bold text-ink-muted disabled:opacity-40"
            >
              방금 넣은 표 취소
            </button>
          </div>

          <p className={`mt-4 h-6 text-[14px] font-bold ${flash ? 'text-emerald-600 dark:text-emerald-300' : 'text-transparent'}`} aria-live="polite">
            {flash ?? '·'}
          </p>
          {left <= 0 ? (
            <p className="mt-1 text-[13.5px] font-semibold text-amber-700 dark:text-amber-300 break-keep">
              교부한 투표용지만큼 다 넣었어요. 더 있다면 현황판에서 투표용지 교부를 먼저 확인하세요.
            </p>
          ) : null}
        </div>

        <aside className="px-5 pb-8 lg:py-5 lg:pl-0 lg:overflow-y-auto">
          <section className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] p-4">
            <h3 className="text-[14px] font-extrabold text-ink-strong">대조용 합계 (종이 표만)</h3>
            <p className="mt-1 text-[11.5px] text-ink-muted break-keep">손으로 센 개표지와 숫자가 같은지 맞춰 보세요.</p>
            <div className="mt-3 space-y-2">
              {candidates.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5">
                  <CandidateAvatar candidate={c} size={30} />
                  <span className="min-w-0 flex-1 text-[14px] font-semibold text-ink truncate">{c.name}</span>
                  <span className="text-[17px] font-extrabold text-ink-strong tabular-nums">{totals.byCand.get(c.id) ?? 0}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-gray-100 dark:border-white/[0.06] flex justify-between text-[13px] font-semibold text-ink-muted tabular-nums">
                <span>무효 {totals.invalid} · 기권 {totals.abstain}</span>
                <span>남은 투표용지 {left}장</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default ElectionCountingMode
