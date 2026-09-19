// 좌석 예약 현황판 — 관리자가 행사 당일까지 쓰는 한 화면.
//
// 배치도 탭: 좌석을 눌러 고르면 아래 바가 상황에 맞는 일을 제안한다.
//   빈 자리만 골랐으면 → 대리 예약(전화·현장 접수, 보류석 배정)
//   예약된 자리를 골랐으면 → 예약자 확인·입장 확인·예약 취소
// 명단 탭: 예약자(팀)별로 묶어 이름·좌석으로 찾고, 입장 체크를 한 번에.
// 20초마다 새로 받아 여러 명이 동시에 접수·입장 체크해도 화면이 맞는다.
import { useMemo, useState } from 'react'
import MemberSearchInput from '../../../components/common/MemberSearchInput'
import { downloadSeatCsv } from '../../../api/seatEvent'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useSeatAdminAction, useSeatEvent, useSeatReservations } from '../../../hooks/useSeatEvents'
import { confirmDialog } from '../../../utils/confirmDialog'
import { showToast } from '../../../utils/toast'
import type { SeatEventSummary, SeatReservation } from '../../../types/seatEvent'
import SeatMap, { SeatLegend } from '../../Seats/SeatMap'
import type { SeatVisual } from '../../Seats/SeatMap'
import { sortSeats } from '../../Seats/seatLayout'
import { formatShort, inputCls } from '../../Seats/seatShared'
import { CloseButton } from './SeatEventComposer'

interface Holder {
  code: string
  name: string
  source: 'member' | 'admin'
  userId?: number | null
  note?: string | null
  seats: string[]
  checked: number
  createdAt?: string | null
}

const groupHolders = (rows: SeatReservation[]): Holder[] => {
  const map = new Map<string, Holder>()
  for (const r of rows) {
    const h = map.get(r.group_code) ?? {
      code: r.group_code,
      name: r.holder_name,
      source: r.source,
      userId: r.user_id,
      note: r.note,
      seats: [],
      checked: 0,
      createdAt: r.created_at,
    }
    h.seats.push(r.seat_label)
    if (r.checked_in_at) h.checked += 1
    if (!h.note && r.note) h.note = r.note
    map.set(r.group_code, h)
  }
  return [...map.values()]
    .map((h) => ({ ...h, seats: sortSeats(h.seats) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

const SeatBoard = ({ summary, onClose }: { summary: SeatEventSummary; onClose: () => void }) => {
  useModalBackButton(onClose)
  const id = summary.id
  const { data: event } = useSeatEvent(id)
  const { data: rows = [], isLoading } = useSeatReservations(id)
  const act = useSeatAdminAction()

  const [tab, setTab] = useState<'map' | 'list'>('map')
  const [picked, setPicked] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [assignName, setAssignName] = useState('')
  const [assignUserId, setAssignUserId] = useState<number | null>(null)
  const [assignNote, setAssignNote] = useState('')
  const [downloading, setDownloading] = useState(false)

  const bySeat = useMemo(() => new Map(rows.map((r) => [r.seat_label, r])), [rows])
  const holders = useMemo(() => groupHolders(rows), [rows])
  const holderByCode = useMemo(() => new Map(holders.map((h) => [h.code, h])), [holders])
  const layout = event?.layout
  const disabled = useMemo(() => new Set(layout?.disabled ?? []), [layout?.disabled])
  const held = useMemo(() => new Set(layout?.held ?? []), [layout?.held])

  const checkedTotal = rows.filter((r) => r.checked_in_at).length
  const total = event?.total_seats ?? summary.total_seats

  const stateOf = (label: string): SeatVisual => {
    if (disabled.has(label)) return 'disabled'
    if (picked.includes(label)) return 'focus'
    const r = bySeat.get(label)
    if (r) return r.checked_in_at ? 'checked' : r.source === 'admin' ? 'assigned' : 'member'
    if (held.has(label)) return 'held'
    return 'available'
  }

  const titleOf = (label: string) => {
    const r = bySeat.get(label)
    if (r) return `${label} · ${r.holder_name}${r.checked_in_at ? ' (입장)' : ''}`
    return held.has(label) ? `${label} · 보류` : label
  }

  const toggle = (label: string) =>
    setPicked((prev) => (prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]))

  const pickedReserved = picked.filter((s) => bySeat.has(s))
  const pickedEmpty = picked.filter((s) => !bySeat.has(s))
  const pickedHolders = [...new Set(pickedReserved.map((s) => bySeat.get(s)!.group_code))]
    .map((code) => holderByCode.get(code))
    .filter(Boolean) as Holder[]

  const resetAssign = () => {
    setAssignName('')
    setAssignUserId(null)
    setAssignNote('')
  }

  const assign = () => {
    if (!assignName.trim()) return showToast('예약자 이름을 입력해주세요', 'error')
    act.mutate(
      {
        kind: 'assign',
        id,
        data: {
          seats: sortSeats(pickedEmpty),
          holder_name: assignName.trim(),
          user_id: assignUserId,
          note: assignNote.trim() || null,
        },
      },
      {
        onSuccess: () => {
          showToast(`${assignName.trim()} 님께 ${pickedEmpty.length}석을 배정했어요`, 'success')
          setPicked([])
          resetAssign()
        },
        onError: (e) => showToast(e.message, 'error'),
      }
    )
  }

  const cancelSeats = async (seats: string[], who?: string) => {
    const ok = await confirmDialog({
      title: `${seats.length}석 예약을 취소할까요?`,
      message: `${who ? `${who} 님 · ` : ''}${sortSeats(seats).join(' · ')}`,
      description: '취소한 자리는 바로 다른 분이 예약할 수 있어요. 예약자에게 따로 알려주세요.',
      confirmText: '예약 취소',
      tone: 'danger',
    })
    if (!ok) return
    act.mutate(
      { kind: 'cancel', id, seats },
      {
        onSuccess: () => {
          showToast('예약을 취소했어요', 'success')
          setPicked((prev) => prev.filter((s) => !seats.includes(s)))
        },
        onError: (e) => showToast(e.message, 'error'),
      }
    )
  }

  const checkIn = (seats: string[], checkedIn: boolean) =>
    act.mutate(
      { kind: 'check-in', id, seats, checkedIn },
      {
        onSuccess: () => showToast(checkedIn ? '입장 확인했어요' : '입장 표시를 지웠어요', 'success'),
        onError: (e) => showToast(e.message, 'error'),
      }
    )

  const download = async () => {
    try {
      setDownloading(true)
      await downloadSeatCsv(id, `${summary.title}-좌석예약.csv`)
    } catch {
      showToast('CSV 내려받기에 실패했습니다', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase()
    if (!q) return holders
    return holders.filter((h) => h.name.toUpperCase().includes(q) || h.seats.some((s) => s.startsWith(q)))
  }, [holders, query])

  const showOnMap = (h: Holder) => {
    setPicked(h.seats)
    setTab('map')
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-4xl h-[94vh] sm:h-[92vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 머리 */}
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="min-w-0">
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">SEAT BOARD</p>
            <h2 className="text-ink-strong text-[16.5px] font-bold tracking-[-0.015em] truncate">{summary.title}</h2>
            {summary.performance_at ? (
              <p className="text-[11.5px] text-ink-muted">{formatShort(summary.performance_at)}{summary.venue ? ` · ${summary.venue}` : ''}</p>
            ) : null}
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {/* 숫자 */}
        <div className="grid grid-cols-4 gap-2 px-5 py-3 border-b border-black/[0.04] dark:border-white/[0.06]">
          {[
            ['예약', `${rows.length}`, `/${total}`, 'text-brand'],
            ['남은 좌석', `${event?.available_count ?? summary.available_count}`, '', 'text-ink-strong'],
            ['예약자', `${holders.length}`, '팀', 'text-ink-strong'],
            ['입장', `${checkedTotal}`, `/${rows.length}`, 'text-emerald-600 dark:text-emerald-300'],
          ].map(([label, value, unit, cls]) => (
            <div key={label} className="rounded-xl bg-white dark:bg-white/[0.04] border border-gray-200/70 dark:border-white/[0.06] px-2.5 py-2">
              <p className="text-[10.5px] font-semibold text-gray-400 dark:text-white/40">{label}</p>
              <p className={`text-[17px] font-extrabold tabular-nums leading-tight ${cls}`}>
                {value}
                <span className="text-[11px] font-semibold text-gray-400 dark:text-white/40">{unit}</span>
              </p>
            </div>
          ))}
        </div>

        {/* 탭 */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-black/[0.04] dark:border-white/[0.06]">
          {(['map', 'list'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
                tab === key ? 'bg-brand text-white border-transparent' : 'border-gray-200 dark:border-white/[0.08] text-ink-muted hover:border-brand'
              }`}
            >
              {key === 'map' ? '배치도' : `명단 ${holders.length}`}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void download()}
            disabled={downloading}
            className="ml-auto text-[12.5px] font-semibold text-brand disabled:opacity-50"
          >
            {downloading ? '내려받는 중…' : '명단 CSV'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!layout || isLoading ? (
            <div className="flex justify-center py-14">
              <div className="w-7 h-7 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
            </div>
          ) : tab === 'map' ? (
            <>
              <div className="mb-3">
                <SeatLegend
                  items={[
                    { visual: 'available', label: '빈 자리' },
                    { visual: 'member', label: '앱 예약' },
                    { visual: 'assigned', label: '대리 예약' },
                    { visual: 'checked', label: '입장' },
                    { visual: 'held', label: '보류' },
                    { visual: 'focus', label: '선택' },
                  ]}
                />
              </div>
              <SeatMap
                layout={layout}
                stateOf={stateOf}
                canPress={(label) => !disabled.has(label)}
                onSeatPress={toggle}
                titleOf={titleOf}
                showSectionNames
                toolbarExtra={
                  picked.length ? (
                    <button type="button" onClick={() => setPicked([])} className="text-[12px] font-semibold text-ink-muted hover:text-brand">
                      선택 해제 ({picked.length})
                    </button>
                  ) : (
                    <span className="mr-auto text-[11.5px] text-ink-muted">좌석을 눌러 고르세요</span>
                  )
                }
              />
            </>
          ) : (
            <>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름이나 좌석(D3)으로 찾기"
                className={`${inputCls} mb-3`}
              />
              {!filtered.length ? (
                <p className="text-[13.5px] text-ink-muted text-center py-14">
                  {holders.length ? '찾는 예약자가 없어요' : '아직 예약이 없어요'}
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((h) => (
                    <HolderRow
                      key={h.code}
                      holder={h}
                      busy={act.isPending}
                      onCheckIn={(v) => checkIn(h.seats, v)}
                      onCancel={() => void cancelSeats(h.seats, h.name)}
                      onShow={() => showOnMap(h)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 선택 액션 바 (배치도 탭) */}
        {tab === 'map' && picked.length ? (
          <div className="border-t border-black/[0.06] dark:border-white/[0.08] px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] bg-white dark:bg-[#20202b] space-y-2.5">
            {pickedHolders.map((h) => {
              const mineHere = h.seats.filter((s) => pickedReserved.includes(s))
              return (
                <div key={h.code} className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold text-ink-strong truncate">
                      {h.name}
                      <span className="ml-1.5 text-[11px] font-semibold text-ink-muted">
                        {h.source === 'admin' ? '대리 예약' : '앱 예약'} · 전체 {h.seats.join(', ')}
                      </span>
                    </p>
                    {h.note ? <p className="text-[11.5px] text-ink-muted truncate">{h.note}</p> : null}
                  </div>
                  <button
                    type="button"
                    disabled={act.isPending}
                    onClick={() => checkIn(mineHere, !mineHere.every((s) => bySeat.get(s)?.checked_in_at))}
                    className="h-9 px-3 rounded-xl bg-emerald-500 text-white text-[12.5px] font-bold disabled:opacity-50"
                  >
                    {mineHere.every((s) => bySeat.get(s)?.checked_in_at) ? '입장 취소' : `입장 확인 ${mineHere.length}석`}
                  </button>
                  <button
                    type="button"
                    disabled={act.isPending}
                    onClick={() => void cancelSeats(mineHere, h.name)}
                    className="h-9 px-3 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[12.5px] font-bold text-ink-muted hover:border-red-400 hover:text-red-500 disabled:opacity-50"
                  >
                    예약 취소
                  </button>
                </div>
              )
            })}

            {pickedEmpty.length ? (
              <div className="rounded-2xl bg-[var(--brand-soft)] p-3 space-y-2">
                <p className="text-[12.5px] font-bold text-ink-strong">
                  빈 자리 {sortSeats(pickedEmpty).join(', ')} — 대리 예약
                  {pickedEmpty.some((s) => held.has(s)) ? <span className="ml-1 text-[11px] font-semibold text-ink-muted">(보류석 포함)</span> : null}
                </p>
                {assignUserId ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.06]">
                    <span className="flex-1 text-[13px] font-bold text-ink-strong">{assignName} <span className="text-[11px] font-semibold text-brand">앱 사용자</span></span>
                    <button type="button" onClick={resetAssign} className="text-[12px] font-semibold text-ink-muted hover:text-red-500">바꾸기</button>
                  </div>
                ) : (
                  <>
                    <input
                      value={assignName}
                      onChange={(e) => setAssignName(e.target.value)}
                      maxLength={100}
                      placeholder="예약자 이름 (전화·현장 접수)"
                      className={inputCls}
                    />
                    <details className="group">
                      <summary className="cursor-pointer text-[11.5px] font-semibold text-brand list-none">앱 사용자에게 배정하기 ›</summary>
                      <div className="mt-2">
                        <MemberSearchInput
                          excludeIds={[]}
                          placeholder="이름으로 앱 사용자 찾기"
                          emptyHint="앱에서 찾을 수 없어요. 이름만 적어 대리 예약해주세요."
                          onPick={(u) => {
                            setAssignUserId(u.id)
                            setAssignName(u.display_name)
                          }}
                        />
                      </div>
                    </details>
                  </>
                )}
                <input
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  maxLength={200}
                  placeholder="메모 (연락처·요청사항, 선택)"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={assign}
                  disabled={act.isPending}
                  className="w-full h-11 rounded-xl bg-brand text-white text-[14px] font-bold disabled:opacity-50"
                >
                  {pickedEmpty.length}석 배정하기
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

const HolderRow = ({
  holder,
  busy,
  onCheckIn,
  onCancel,
  onShow,
}: {
  holder: Holder
  busy: boolean
  onCheckIn: (checkedIn: boolean) => void
  onCancel: () => void
  onShow: () => void
}) => {
  const allIn = holder.checked === holder.seats.length
  return (
    <div className={`rounded-2xl border px-3.5 py-3 transition-colors ${
      allIn ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/[0.06]' : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02]'
    }`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-ink-strong">
            {holder.name}
            <span className={`ml-1.5 align-middle inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
              holder.source === 'admin'
                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25'
                : 'bg-[var(--brand-soft)] text-brand border-[var(--brand-soft-strong)]'
            }`}>
              {holder.source === 'admin' ? '대리' : '앱'}
            </span>
          </p>
          <button type="button" onClick={onShow} className="mt-1 flex flex-wrap gap-1 text-left" title="배치도에서 보기">
            {holder.seats.map((s) => (
              <span key={s} className="inline-flex h-6 px-2 items-center rounded-md bg-gray-100 dark:bg-white/[0.07] text-[12px] font-extrabold text-ink-strong tabular-nums">
                {s}
              </span>
            ))}
          </button>
          {holder.note ? <p className="mt-1 text-[11.5px] text-ink-muted">{holder.note}</p> : null}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => onCheckIn(!allIn)}
            className={`h-8 px-3 rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50 ${
              allIn
                ? 'bg-emerald-500 text-white'
                : 'border border-emerald-400 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
            }`}
          >
            {allIn ? '✓ 입장' : holder.checked ? `입장 ${holder.checked}/${holder.seats.length}` : '입장 확인'}
          </button>
          <button type="button" disabled={busy} onClick={onCancel} className="text-[11.5px] font-semibold text-ink-muted hover:text-red-500">
            예약 취소
          </button>
        </div>
      </div>
    </div>
  )
}

export default SeatBoard
