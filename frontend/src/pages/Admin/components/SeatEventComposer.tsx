// 좌석 예약 행사 만들기/고치기 — 기본 정보 + 예약 규칙 + 좌석 배치 편집기.
//
// 배치는 "구역(블록)마다 행×열"만 정하면 좌석 번호가 규칙대로 붙는다(seatLayout.ts).
// 모양이 네모가 아닌 자리는 배치도에서 칸을 눌러(또는 쓸어서) '자리 없음'으로 지우고,
// 스태프·귀빈석처럼 성도가 못 고르게 할 자리는 '보류'로 칠한다.
// 이미 예약된 좌석이 사라지는 배치 변경은 서버가 거절한다(예약이 허공에 뜨지 않게).
import { useEffect, useMemo, useRef, useState } from 'react'
import DatePicker from '../../../components/common/DatePicker'
import TimePicker from '../../../components/common/TimePicker'
import { fetchAllEvents } from '../../../api/event'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useSaveSeatEvent } from '../../../hooks/useSeatEvents'
import { showToast } from '../../../utils/toast'
import type { Event } from '../../../types/event'
import type {
  SeatEventDetail,
  SeatEventPayload,
  SeatEventStatus,
  SeatLabeling,
  SeatLayout,
} from '../../../types/seatEvent'
import SeatMap from '../../Seats/SeatMap'
import type { SeatVisual } from '../../Seats/SeatMap'
import {
  LAYOUT_PRESETS,
  MAX_COLS,
  MAX_ROWS,
  MAX_SECTIONS,
  buildGrid,
} from '../../Seats/seatLayout'
import { STATUS_META, formatShort, inputCls, labelCls } from '../../Seats/seatShared'

// ── 날짜+시간 ↔ 서버 KST-naive 문자열 ─────────────────────────────────

const splitDateTime = (iso?: string | null): { date: string; time: string } =>
  iso ? { date: iso.slice(0, 10), time: iso.slice(11, 16) } : { date: '', time: '' }

const joinDateTime = (date: string, time: string, fallbackTime: string): string | null =>
  date ? `${date}T${time || fallbackTime}:00` : null

const cloneLayout = (layout: SeatLayout): SeatLayout => ({
  ...layout,
  sections: layout.sections.map((s) => ({ ...s })),
  disabled: [...layout.disabled],
  held: [...layout.held],
})

type PaintTool = 'disabled' | 'held'

interface Props {
  event?: SeatEventDetail | null
  onClose: () => void
  onSaved: () => void
}

const SeatEventComposer = ({ event, onClose, onSaved }: Props) => {
  useModalBackButton(onClose)

  const perf = splitDateTime(event?.performance_at)
  const opens = splitDateTime(event?.opens_at)
  const closes = splitDateTime(event?.closes_at)

  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [venue, setVenue] = useState(event?.venue ?? '')
  const [notice, setNotice] = useState(event?.notice ?? '')
  const [perfDate, setPerfDate] = useState(perf.date)
  const [perfTime, setPerfTime] = useState(perf.time)
  const [opensDate, setOpensDate] = useState(opens.date)
  const [opensTime, setOpensTime] = useState(opens.time)
  const [closesDate, setClosesDate] = useState(closes.date)
  const [closesTime, setClosesTime] = useState(closes.time)
  const [status, setStatus] = useState<SeatEventStatus>(event?.status ?? 'draft')
  const [maxPerUser, setMaxPerUser] = useState(event?.max_per_user ?? 4)
  const [eventId, setEventId] = useState<number | null>(event?.event_id ?? null)
  const [layout, setLayout] = useState<SeatLayout>(
    event?.layout ? cloneLayout(event.layout) : cloneLayout(LAYOUT_PRESETS[0].layout)
  )
  const [tool, setTool] = useState<PaintTool>('disabled')
  // 한 획 동안 칠할 값 — 첫 칸에서 정하고 이어지는 칸에 그대로 쓴다(렌더를 기다리지 않게 ref)
  const paintValue = useRef(true)

  // 연결할 일정 — 고르면 비어 있는 제목·장소·일시를 채워 준다
  const [events, setEvents] = useState<Event[]>([])
  const [eventSearch, setEventSearch] = useState('')
  useEffect(() => {
    let cancelled = false
    fetchAllEvents(0, 50)
      .then((res) => {
        if (!cancelled) setEvents(res.data.items)
      })
      .catch(() => {
        /* 일정 연결은 옵션 — 실패해도 만들 수 있다 */
      })
    return () => {
      cancelled = true
    }
  }, [])
  const selectedEvent = eventId != null ? events.find((e) => e.id === eventId) : undefined
  const matchedEvents = useMemo(() => {
    const q = eventSearch.trim()
    if (!q) return []
    return events.filter((e) => e.title.includes(q)).slice(0, 6)
  }, [events, eventSearch])

  const linkEvent = (ev: Event) => {
    setEventId(ev.id)
    setEventSearch('')
    if (!title.trim()) setTitle(ev.title)
    if (!venue.trim() && ev.location) setVenue(ev.location)
    if (!perfDate && ev.start_datetime) {
      const { date, time } = splitDateTime(ev.start_datetime)
      setPerfDate(date)
      setPerfTime(time)
    }
  }

  // ── 배치 ──
  const reservedCount = event?.reserved_count ?? 0
  const grid = useMemo(() => buildGrid(layout), [layout])
  const disabledSet = useMemo(() => new Set(layout.disabled), [layout.disabled])
  const heldSet = useMemo(() => new Set(layout.held), [layout.held])
  const seatCount = grid.allLabels.length - grid.allLabels.filter((l) => disabledSet.has(l)).length

  const patchSection = (index: number, patch: Partial<SeatLayout['sections'][number]>) =>
    setLayout((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }))

  const paint = (label: string, first: boolean) => {
    const set = tool === 'disabled' ? disabledSet : heldSet
    const value = first ? !set.has(label) : paintValue.current
    if (first) paintValue.current = value
    setLayout((prev) => {
      const key = tool
      const other = tool === 'disabled' ? 'held' : 'disabled'
      const list = new Set(prev[key])
      if (value) list.add(label)
      else list.delete(label)
      // 한 칸은 '자리 없음'과 '보류' 중 하나만
      const otherList = value ? prev[other].filter((l) => l !== label) : prev[other]
      return { ...prev, [key]: [...list], [other]: otherList }
    })
  }

  const stateOf = (label: string): SeatVisual =>
    disabledSet.has(label) ? 'disabled' : heldSet.has(label) ? 'held' : 'available'

  // ── 저장 ──
  const save = useSaveSeatEvent()

  const handleSave = () => {
    if (!title.trim()) return showToast('행사 이름을 입력해주세요', 'error')
    if (!layout.sections.length) return showToast('구역을 하나 이상 만들어주세요', 'error')
    if (seatCount <= 0) return showToast('예약할 수 있는 좌석이 없어요', 'error')

    const performanceAt = joinDateTime(perfDate, perfTime, '00:00')
    const opensAt = joinDateTime(opensDate, opensTime, '00:00')
    const closesAt = joinDateTime(closesDate, closesTime, '23:59')
    if (opensAt && closesAt && opensAt > closesAt)
      return showToast('예약 시작이 마감보다 늦어요', 'error')
    if (closesAt && performanceAt && closesAt > performanceAt)
      return showToast('예약 마감은 공연 시작 전이어야 해요', 'error')

    const payload: SeatEventPayload = {
      title: title.trim(),
      description: description.trim() || null,
      notice: notice.trim() || null,
      venue: venue.trim() || null,
      event_id: eventId,
      performance_at: performanceAt,
      opens_at: opensAt,
      closes_at: closesAt,
      status,
      max_per_user: maxPerUser,
      layout: {
        ...layout,
        sections: layout.sections.map((s, i) => ({ ...s, name: s.name.trim() || `${i + 1}구역` })),
        stage_label: layout.stage_label.trim() || '무대',
      },
    }
    save.mutate(
      { id: event?.id, data: payload },
      {
        onSuccess: () => {
          showToast(event ? '행사를 저장했어요' : '행사를 만들었어요', 'success')
          onSaved()
        },
        onError: (e) => showToast(e.message, 'error'),
      }
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-3xl max-h-[94vh] sm:max-h-[92vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">ADMIN</p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
              {event ? '좌석 예약 행사 수정' : '새 좌석 예약 행사'}
            </h2>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* ① 기본 정보 */}
          <section className="space-y-3">
            <StepTitle n={1}>행사 정보</StepTitle>
            <div>
              <label className={labelCls}>행사 이름</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 오르겔 콘서트" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-2">
              <div>
                <label className={labelCls}>공연 날짜</label>
                <DatePicker
                  value={perfDate}
                  onChange={setPerfDate}
                  placeholder="날짜 선택"
                  className={`${inputCls} flex items-center justify-between gap-2 text-left hover:border-brand`}
                />
              </div>
              <div>
                <label className={labelCls}>시작 시간</label>
                <TimePicker
                  value={perfTime}
                  onChange={setPerfTime}
                  placeholder="시간 선택"
                  className={`${inputCls} flex items-center justify-between gap-2 text-left hover:border-brand`}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>장소 (선택)</label>
              <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="예) 본당" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>소개 (선택)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="행사를 한두 줄로 소개해주세요"
                className={`${inputCls} resize-none leading-relaxed`}
              />
            </div>

            {/* 일정 연결 */}
            <div>
              <label className={labelCls}>연결할 일정 (선택)</label>
              <p className="-mt-1 mb-2 text-[11px] text-gray-400 dark:text-white/40">
                연결하면 일정 상세 화면에 ‘좌석 예약하기’ 카드가 떠요.
              </p>
              {eventId != null ? (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--brand-glow)] bg-[var(--brand-soft)]">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink-strong truncate">
                      {selectedEvent?.title ?? `일정 #${eventId}`}
                    </p>
                    {selectedEvent ? (
                      <p className="text-[11px] text-gray-500 dark:text-white/50">{formatShort(selectedEvent.start_datetime)}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEventId(null)}
                    className="shrink-0 text-[12px] font-semibold text-ink-muted hover:text-red-500"
                  >
                    연결 해제
                  </button>
                </div>
              ) : (
                <>
                  <input
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder="일정 제목으로 검색"
                    className={inputCls}
                  />
                  {matchedEvents.length ? (
                    <div className="mt-2 rounded-xl border border-gray-200 dark:border-white/[0.08] overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {matchedEvents.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => linkEvent(ev)}
                          className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left bg-white dark:bg-white/[0.02] hover:bg-[var(--brand-soft)] transition-colors"
                        >
                          <span className="shrink-0 text-[11px] font-bold text-gray-500 dark:text-white/55 tabular-nums">
                            {formatShort(ev.start_datetime)}
                          </span>
                          <span className="flex-1 min-w-0 text-[13px] font-semibold text-ink-strong truncate">{ev.title}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </section>

          {/* ② 예약 규칙 */}
          <section className="space-y-3">
            <StepTitle n={2}>예약 규칙</StepTitle>
            <div>
              <label className={labelCls}>상태</label>
              <div className="flex gap-1.5">
                {(['draft', 'open', 'closed'] as SeatEventStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-xl text-[13px] font-semibold border transition-colors ${
                      status === s ? 'bg-brand text-white border-transparent' : 'border-gray-200 dark:border-white/[0.08] text-ink hover:border-brand'
                    }`}
                  >
                    {s === 'draft' ? '준비 중 (숨김)' : s === 'open' ? '예약 받기' : '마감'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-white/[0.08] px-3.5 py-2.5">
              <div>
                <p className="text-[13.5px] font-semibold text-ink-strong">한 사람당 최대 좌석</p>
                <p className="text-[11.5px] text-ink-muted">가족 단위 행사라면 넉넉하게 잡아주세요</p>
              </div>
              <Stepper value={maxPerUser} min={1} max={20} onChange={setMaxPerUser} suffix="석" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>예약 오픈 (선택)</label>
                <DatePicker value={opensDate} onChange={setOpensDate} placeholder="바로 오픈" className={`${inputCls} flex items-center justify-between gap-2 text-left hover:border-brand`} />
                {opensDate ? (
                  <div className="mt-1.5">
                    <TimePicker value={opensTime} onChange={setOpensTime} placeholder="00:00" className={`${inputCls} flex items-center justify-between gap-2 text-left hover:border-brand`} />
                  </div>
                ) : null}
              </div>
              <div>
                <label className={labelCls}>예약 마감 (선택)</label>
                <DatePicker value={closesDate} onChange={setClosesDate} placeholder="공연 전까지" className={`${inputCls} flex items-center justify-between gap-2 text-left hover:border-brand`} />
                {closesDate ? (
                  <div className="mt-1.5">
                    <TimePicker value={closesTime} onChange={setClosesTime} placeholder="23:59" className={`${inputCls} flex items-center justify-between gap-2 text-left hover:border-brand`} />
                  </div>
                ) : null}
              </div>
            </div>
            {(opensDate || closesDate) && (
              <button
                type="button"
                onClick={() => {
                  setOpensDate('')
                  setOpensTime('')
                  setClosesDate('')
                  setClosesTime('')
                }}
                className="-mt-1 text-[12px] font-semibold text-ink-muted hover:text-brand"
              >
                기간 지우기
              </button>
            )}

            <div>
              <label className={labelCls}>예약 안내 (선택)</label>
              <textarea
                value={notice}
                onChange={(e) => setNotice(e.target.value)}
                rows={3}
                placeholder={'예) 공연 20분 전부터 입장합니다.\n주차는 교회 지하주차장을 이용해주세요.'}
                className={`${inputCls} resize-none leading-relaxed`}
              />
            </div>
          </section>

          {/* ③ 좌석 배치 */}
          <section className="space-y-3">
            <StepTitle n={3}>좌석 배치</StepTitle>

            {reservedCount > 0 ? (
              <p className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 px-3.5 py-2.5 text-[12.5px] text-amber-800 dark:text-amber-200 leading-relaxed">
                이미 {reservedCount}석이 예약됐어요. 예약된 자리가 없어지는 변경(구역 줄이기·번호 규칙 변경·자리 없음)은 저장되지 않아요.
              </p>
            ) : null}

            <div>
              <label className={labelCls}>빠른 시작</label>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
                {LAYOUT_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    title={p.hint}
                    onClick={() => setLayout(cloneLayout(p.layout))}
                    className="shrink-0 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-left hover:border-brand transition-colors"
                  >
                    <span className="block text-[12.5px] font-bold text-ink-strong">{p.label}</span>
                    <span className="block text-[10.5px] text-ink-muted max-w-[13rem] truncate">{p.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 구역 */}
            <div className="space-y-2">
              {layout.sections.map((section, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] px-3 py-2.5">
                  <input
                    value={section.name}
                    onChange={(e) => patchSection(i, { name: e.target.value })}
                    placeholder={`${i + 1}구역`}
                    maxLength={30}
                    className="w-24 flex-1 min-w-[5rem] px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-transparent text-[13px] font-semibold text-ink-strong focus:outline-none focus:border-brand"
                  />
                  <span className="text-[11.5px] font-semibold text-ink-muted">줄</span>
                  <Stepper value={section.rows} min={1} max={MAX_ROWS} onChange={(v) => patchSection(i, { rows: v })} />
                  <span className="text-[11.5px] font-semibold text-ink-muted">칸</span>
                  <Stepper value={section.cols} min={1} max={MAX_COLS} onChange={(v) => patchSection(i, { cols: v })} />
                  <button
                    type="button"
                    disabled={layout.sections.length <= 1}
                    onClick={() => setLayout((prev) => ({ ...prev, sections: prev.sections.filter((_, j) => j !== i) }))}
                    className="ml-auto text-[12px] font-semibold text-ink-muted hover:text-red-500 disabled:opacity-30"
                  >
                    삭제
                  </button>
                </div>
              ))}
              {layout.sections.length < MAX_SECTIONS ? (
                <button
                  type="button"
                  onClick={() =>
                    setLayout((prev) => ({
                      ...prev,
                      sections: [...prev.sections, { name: '', rows: prev.sections[prev.sections.length - 1]?.rows ?? 10, cols: 6 }],
                    }))
                  }
                  className="w-full py-2.5 rounded-2xl border border-dashed border-gray-300 dark:border-white/[0.14] text-[13px] font-semibold text-ink-muted hover:border-brand hover:text-brand transition-colors"
                >
                  + 구역 추가 (통로로 나뉩니다)
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
              <div>
                <label className={labelCls}>좌석 번호 규칙</label>
                <div className="flex gap-1.5">
                  {(
                    [
                      ['row_letter', '극장식', 'A열 1번 → A1·A2…'],
                      ['col_letter', '세로 줄', 'A·B·C 세로 × 1·2·3 앞줄부터'],
                    ] as [SeatLabeling, string, string][]
                  ).map(([key, label, hint]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setLayout((prev) => ({ ...prev, labeling: key, disabled: [], held: [] }))}
                      className={`flex-1 px-3 py-2 rounded-xl border text-left transition-colors ${
                        layout.labeling === key
                          ? 'border-brand bg-[var(--brand-soft)]'
                          : 'border-gray-200 dark:border-white/[0.08] hover:border-brand'
                      }`}
                    >
                      <span className={`block text-[12.5px] font-bold ${layout.labeling === key ? 'text-brand' : 'text-ink-strong'}`}>{label}</span>
                      <span className="block text-[10.5px] text-ink-muted">{hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>앞쪽 이름</label>
                <input
                  value={layout.stage_label}
                  onChange={(e) => setLayout((prev) => ({ ...prev, stage_label: e.target.value }))}
                  maxLength={30}
                  placeholder="무대"
                  className={`${inputCls} sm:w-28`}
                />
              </div>
            </div>

            {/* 미리보기 + 칠하기 */}
            <div className="rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="text-[12.5px] text-ink-muted">
                  <b className="text-ink-strong text-[14px] tabular-nums">{seatCount}</b>석
                  {layout.held.length ? ` · 보류 ${layout.held.length}석` : ''}
                </p>
                <div className="flex rounded-full bg-gray-100 dark:bg-white/[0.06] p-0.5">
                  {(
                    [
                      ['disabled', '자리 없음'],
                      ['held', '보류'],
                    ] as [PaintTool, string][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTool(key)}
                      className={`px-3 h-7 rounded-full text-[12px] font-bold transition-colors ${
                        tool === key ? 'bg-white dark:bg-white/[0.14] text-ink-strong shadow-sm' : 'text-ink-muted'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mb-3 text-[11.5px] text-ink-muted leading-relaxed">
                {tool === 'disabled'
                  ? '칸을 누르거나 쓸어서 통로·기둥처럼 자리가 없는 곳을 지워요. 다시 누르면 살아나요.'
                  : '스태프·귀빈석처럼 성도가 고르지 못하게 할 자리를 칠해요. 관리자는 현황판에서 이 자리를 배정할 수 있어요.'}
              </p>
              <SeatMap
                layout={layout}
                stateOf={stateOf}
                paintable
                onPaint={paint}
                showDisabledSlots
                showSectionNames
              />
            </div>
          </section>
        </div>

        <div className="px-5 py-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center gap-2">
          <span className={`hidden sm:inline-flex text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_META[status].badge}`}>
            {STATUS_META[status].label}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-4 h-11 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[14px] font-semibold text-ink-muted hover:text-ink-strong"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={save.isPending}
            className="px-6 h-11 rounded-xl bg-brand text-white text-[14px] font-bold disabled:opacity-60"
          >
            {save.isPending ? '저장 중…' : event ? '저장' : '만들기'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 작은 부품 ─────────────────────────────────────────────────────────

const StepTitle = ({ n, children }: { n: number; children: string }) => (
  <div className="flex items-center gap-2">
    <span className="w-5 h-5 rounded-full bg-brand text-white text-[11px] font-extrabold flex items-center justify-center">{n}</span>
    <h3 className="text-[14px] font-extrabold text-ink-strong tracking-[-0.02em]">{children}</h3>
  </div>
)

export const Stepper = ({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  suffix?: string
}) => (
  <div className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04]">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="w-8 h-8 flex items-center justify-center text-[16px] font-bold text-ink-muted hover:text-brand disabled:opacity-30"
      aria-label="줄이기"
    >
      −
    </button>
    <input
      value={value}
      inputMode="numeric"
      onChange={(e) => {
        const n = Number(e.target.value.replace(/\D/g, ''))
        if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n || min)))
      }}
      className="w-8 text-center bg-transparent text-[13.5px] font-extrabold text-ink-strong tabular-nums focus:outline-none"
      aria-label="값"
    />
    {suffix ? <span className="-ml-1 mr-1 text-[12px] font-semibold text-ink-muted">{suffix}</span> : null}
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="w-8 h-8 flex items-center justify-center text-[16px] font-bold text-ink-muted hover:text-brand disabled:opacity-30"
      aria-label="늘리기"
    >
      +
    </button>
  </div>
)

export const CloseButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
    aria-label="닫기"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </button>
)

export default SeatEventComposer
