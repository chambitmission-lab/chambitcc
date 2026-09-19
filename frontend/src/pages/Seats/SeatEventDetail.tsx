// 좌석 예약 — 배치도에서 자리를 고르고, 내 좌석은 모바일 티켓으로 본다.
//
// 흐름: 좌석 누르기(또는 "나란히 N석 찾기") → 하단 바에서 예약 → 티켓 카드 등장.
// 취소는 티켓의 "일부 취소"로 취소 모드에 들어가 내 좌석을 골라 지우거나, "전체 취소".
// 배치도는 15초마다 조용히 새로 받아, 고르던 자리가 먼저 팔리면 선택에서 빼고 알려준다.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBookSeats, useCancelMySeats, useSeatEvent } from '../../hooks/useSeatEvents'
import { isAuthenticated } from '../../utils/auth'
import { confirmDialog } from '../../utils/confirmDialog'
import { showToast } from '../../utils/toast'
import { isApiError } from '../../api/utils/request'
import type { SeatEventDetail as SeatEventDetailData } from '../../types/seatEvent'
import { CenterNote, RailCard, Spinner, SurveyShell } from '../Survey/surveyUi'
import SeatMap, { SeatLegend } from './SeatMap'
import type { SeatVisual } from './SeatMap'
import { findTogether, sortSeats } from './seatLayout'
import {
  PHASE_META,
  dDayLabel,
  formatDay,
  formatShort,
  formatTime,
  isAlmostFull,
  seatPhase,
} from './seatShared'
import { SeatIcon, TicketCard } from './seatUi'

type Mode = 'book' | 'cancel'

const SeatEventDetail = () => {
  const { id } = useParams<{ id: string }>()
  const seatEventId = Number(id)
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()

  const { data: event, isLoading, error } = useSeatEvent(seatEventId)

  const [modeState, setMode] = useState<Mode>('book')
  const [picked, setSelected] = useState<string[]>([])
  const [toCancel, setToCancel] = useState<string[]>([])
  const [pop, setPop] = useState<Set<string>>(new Set())
  const [party, setParty] = useState(2)
  const ticketRef = useRef<HTMLDivElement>(null)

  const book = useBookSeats()
  const cancel = useCancelMySeats()

  const mine = useMemo(() => new Set(event?.my_seats ?? []), [event?.my_seats])
  const taken = useMemo(() => new Set(event?.taken ?? []), [event?.taken])
  const held = useMemo(() => new Set(event?.layout.held ?? []), [event?.layout.held])
  const disabled = useMemo(() => new Set(event?.layout.disabled ?? []), [event?.layout.disabled])

  const phase = event ? seatPhase(event) : 'closed'
  const bookingOpen = phase === 'open'
  const allowance = event ? Math.max(event.max_per_user - mine.size, 0) : 0

  // 고르던 자리가 그사이 다른 분께 예약되면 선택에서 빼고(파생값) 한 번 알려준다
  const selected = useMemo(() => picked.filter((s) => !taken.has(s)), [picked, taken])
  const notifiedLost = useRef<Set<string>>(new Set())
  useEffect(() => {
    const lost = picked.filter((s) => taken.has(s) && !notifiedLost.current.has(s))
    if (!lost.length) return
    lost.forEach((s) => notifiedLost.current.add(s))
    showToast(`선택한 ${lost.join(', ')} 좌석이 방금 예약됐어요`, 'error')
  }, [picked, taken])

  // 톡 튀는 애니메이션은 한 번만
  useEffect(() => {
    if (!pop.size) return
    const t = setTimeout(() => setPop(new Set()), 400)
    return () => clearTimeout(t)
  }, [pop])

  // 내 좌석이 없어지면 취소 모드도 끝
  const mode: Mode = mine.size ? modeState : 'book'

  const isFree = (label: string) =>
    !disabled.has(label) && !held.has(label) && !taken.has(label) && !mine.has(label)

  const stateOf = (label: string): SeatVisual => {
    if (disabled.has(label)) return 'disabled'
    if (mine.has(label)) return toCancel.includes(label) ? 'mine-remove' : 'mine'
    if (taken.has(label)) return 'taken'
    if (held.has(label)) return 'held'
    if (selected.includes(label)) return 'selected'
    return 'available'
  }

  const canPress = (label: string) =>
    mode === 'cancel' ? mine.has(label) : bookingOpen && isFree(label)

  const pressSeat = (label: string) => {
    if (mode === 'cancel') {
      setToCancel((prev) => (prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]))
      return
    }
    if (selected.includes(label)) {
      setSelected((prev) => prev.filter((s) => s !== label))
      return
    }
    if (selected.length >= allowance) {
      showToast(
        mine.size
          ? `한 분당 최대 ${event?.max_per_user}석이에요 (추가로 ${allowance}석 가능)`
          : `한 분당 최대 ${event?.max_per_user}석까지 고를 수 있어요`,
        'error'
      )
      return
    }
    navigator.vibrate?.(8)
    setSelected((prev) => [...prev, label])
    setPop(new Set([label]))
  }

  const pickTogether = () => {
    if (!event) return
    const count = Math.min(party, allowance)
    const found = findTogether(event.layout, count, isFree)
    if (!found) {
      showToast(`나란히 ${count}석이 비어 있는 줄이 없어요`, 'error')
      return
    }
    setSelected(found)
    setPop(new Set(found))
  }

  // 일정 상세에서 들어왔으면 그리로, 딥링크로 들어왔으면 목록으로
  const goBack = () =>
    (window.history.state as { idx?: number } | null)?.idx ? navigate(-1) : navigate('/seats')

  const goLogin = () => {
    sessionStorage.setItem('redirect_after_login', `/seats/${seatEventId}`)
    navigate('/login')
  }

  const submitBooking = async () => {
    if (!event || !selected.length) return
    if (!loggedIn) return goLogin()
    const seats = sortSeats(selected)
    const ok = await confirmDialog({
      title: '이 좌석으로 예약할까요?',
      message: `${seats.join(' · ')}  (${seats.length}석)`,
      description: event.performance_at
        ? `${formatShort(event.performance_at)} · 공연 시작 전까지 언제든 취소할 수 있어요.`
        : '공연 시작 전까지 언제든 취소할 수 있어요.',
      confirmText: `${seats.length}석 예약하기`,
      tone: 'brand',
    })
    if (!ok) return
    book.mutate(
      { id: seatEventId, seats },
      {
        onSuccess: () => {
          setSelected([])
          setPop(new Set(seats))
          showToast('예약이 완료됐어요. 입장 때 티켓을 보여주세요', 'success')
          requestAnimationFrame(() =>
            ticketRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          )
        },
        onError: (e) => {
          showToast(e.message, 'error')
          if (isApiError(e, 409)) setSelected([])
        },
      }
    )
  }

  const submitCancel = async (all: boolean) => {
    if (!event) return
    const seats = all ? [...mine] : toCancel
    if (!seats.length) return
    const ok = await confirmDialog({
      title: all ? '예약을 모두 취소할까요?' : `${seats.length}석을 취소할까요?`,
      message: sortSeats(seats).join(' · '),
      description: '취소한 자리는 바로 다른 분이 예약할 수 있어요.',
      confirmText: all ? '전체 취소' : `${seats.length}석 취소`,
      tone: 'danger',
    })
    if (!ok) return
    cancel.mutate(
      { id: seatEventId, seats: all ? undefined : seats },
      {
        onSuccess: (result) => {
          setToCancel([])
          setMode('book')
          showToast(
            result.my_seats.length ? `${seats.length}석을 취소했어요` : '예약을 취소했어요',
            'success'
          )
        },
        onError: (e) => showToast(e.message, 'error'),
      }
    )
  }

  // ── 화면 ──

  if (isLoading) {
    return (
      <SurveyShell onBack={goBack} title="좌석 예약">
        <Spinner />
      </SurveyShell>
    )
  }

  if (error || !event) {
    return (
      <SurveyShell onBack={goBack} title="좌석 예약">
        <CenterNote
          title="행사를 찾을 수 없어요"
          hint="예약이 끝났거나 준비 중인 행사일 수 있어요."
          actionLabel="예약 목록으로"
          onAction={() => navigate('/seats')}
        />
      </SurveyShell>
    )
  }

  const legend: { visual: SeatVisual; label: string }[] = [
    { visual: 'available', label: '선택 가능' },
    { visual: 'selected', label: '선택' },
    ...(mine.size ? [{ visual: 'mine' as const, label: '내 좌석' }] : []),
    { visual: 'taken', label: '예약됨' },
    ...(held.size ? [{ visual: 'held' as const, label: '예약 불가' }] : []),
  ]

  const rail = <DetailRail event={event} />
  const showBar = mode === 'cancel' || (bookingOpen && (selected.length > 0 || allowance > 0))

  return (
    <SurveyShell onBack={goBack} title={event.title} rail={rail}>
      <div className={`px-4 pt-4 space-y-4 ${showBar ? 'pb-36 lg:pb-4' : 'pb-6'}`}>
        <InfoCard event={event} />

        {mine.size > 0 ? (
          <div ref={ticketRef}>
            <TicketCard
              event={event}
              seats={event.my_seats}
              actions={
                phase !== 'ended' ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'cancel' ? 'book' : 'cancel')
                        setToCancel([])
                        setSelected([])
                      }}
                      className={`flex-1 h-10 rounded-xl text-[13px] font-bold border transition-colors ${
                        mode === 'cancel'
                          ? 'border-brand text-brand bg-[var(--brand-soft)]'
                          : 'border-gray-200 dark:border-white/[0.1] text-ink hover:border-brand hover:text-brand'
                      }`}
                    >
                      {mode === 'cancel' ? '취소 그만하기' : '일부 취소'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void submitCancel(true)}
                      disabled={cancel.isPending}
                      className="flex-1 h-10 rounded-xl text-[13px] font-bold border border-gray-200 dark:border-white/[0.1] text-ink-muted hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      전체 취소
                    </button>
                  </div>
                ) : null
              }
            />
          </div>
        ) : null}

        {/* 배치도 */}
        <section className="rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h2 className="text-[15px] font-extrabold text-ink-strong tracking-[-0.02em]">
                {mode === 'cancel' ? '취소할 좌석을 눌러주세요' : '좌석 선택'}
              </h2>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                {mode === 'cancel'
                  ? '초록색 내 좌석 중 취소할 자리를 고르세요'
                  : !bookingOpen
                    ? PHASE_NOTE[phase]
                    : allowance > 0
                      ? `한 분당 최대 ${event.max_per_user}석 · ${mine.size ? `추가로 ${allowance}석 더 고를 수 있어요` : '원하는 자리를 눌러 고르세요'}`
                      : `최대 ${event.max_per_user}석을 모두 예약했어요`}
              </p>
            </div>
          </div>

          <div className="mb-3">
            <SeatLegend items={legend} />
          </div>

          {/* 나란히 N석 — 가족·일행이 붙어 앉기 쉬운 자리를 바로 잡아 준다 */}
          {mode === 'book' && bookingOpen && allowance >= 2 ? (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-[var(--brand-soft)] px-3 py-2">
              <span className="text-brand shrink-0">
                <SeatIcon size={17} />
              </span>
              <span className="text-[12.5px] font-bold text-ink-strong">나란히</span>
              <div className="flex items-center rounded-full bg-white dark:bg-white/[0.06] border border-[var(--brand-soft-strong)]">
                <button
                  type="button"
                  onClick={() => setParty((p) => Math.max(2, p - 1))}
                  className="w-7 h-7 flex items-center justify-center text-brand font-bold disabled:opacity-30"
                  disabled={party <= 2}
                  aria-label="한 명 줄이기"
                >
                  −
                </button>
                <span className="w-6 text-center text-[13px] font-extrabold text-ink-strong tabular-nums">
                  {Math.min(party, allowance)}
                </span>
                <button
                  type="button"
                  onClick={() => setParty((p) => Math.min(allowance, p + 1))}
                  className="w-7 h-7 flex items-center justify-center text-brand font-bold disabled:opacity-30"
                  disabled={party >= allowance}
                  aria-label="한 명 늘리기"
                >
                  +
                </button>
              </div>
              <span className="text-[12.5px] font-bold text-ink-strong">석</span>
              <button
                type="button"
                onClick={pickTogether}
                className="relative ml-auto h-8 px-3.5 rounded-full bg-brand text-white text-[12.5px] font-bold seal-chip [--seal-drop:none]"
              >
                자리 찾기
              </button>
            </div>
          ) : null}

          <SeatMap
            layout={event.layout}
            stateOf={stateOf}
            canPress={canPress}
            onSeatPress={pressSeat}
            popLabels={pop}
            titleOf={(label) => {
              const v = stateOf(label)
              return `${label} ${v === 'taken' ? '예약됨' : v === 'held' ? '예약 불가' : v === 'mine' ? '내 좌석' : ''}`.trim()
            }}
          />
        </section>

        {event.notice ? (
          <section className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] p-4">
            <p className="text-[12px] font-bold text-gray-500 dark:text-white/50 mb-1.5">예약 안내</p>
            <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line break-keep">{event.notice}</p>
          </section>
        ) : null}
      </div>

      {/* 하단 바 — 모바일 고정, PC는 본문 흐름에 */}
      {showBar ? (
        <div className="fixed bottom-0 inset-x-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-t border-border-light dark:border-border-dark lg:static lg:px-4 lg:pb-6 lg:pt-0 lg:bg-transparent lg:dark:bg-transparent lg:backdrop-blur-none lg:border-0">
          <div className="max-w-md mx-auto lg:max-w-none">
            {mode === 'cancel' ? (
              <>
                <SelectedStrip seats={toCancel} tone="danger" empty="취소할 좌석을 눌러주세요" />
                <button
                  type="button"
                  onClick={() => void submitCancel(false)}
                  disabled={!toCancel.length || cancel.isPending}
                  className="mt-2.5 w-full h-12 rounded-2xl bg-red-500 text-white text-[15px] font-bold disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-white/[0.08] dark:disabled:text-white/35 transition-colors"
                >
                  {cancel.isPending ? '취소하는 중…' : toCancel.length ? `${toCancel.length}석 취소하기` : '좌석을 골라주세요'}
                </button>
              </>
            ) : (
              <>
                <SelectedStrip
                  seats={selected}
                  tone="brand"
                  empty={allowance > 0 ? '좌석을 눌러 선택해주세요' : '예약 가능한 좌석 수를 모두 채웠어요'}
                  counter={allowance > 0 || selected.length ? `${selected.length}/${allowance}` : undefined}
                  onClear={selected.length ? () => setSelected([]) : undefined}
                />
                <button
                  type="button"
                  onClick={() => void submitBooking()}
                  disabled={!selected.length || book.isPending}
                  className={`relative mt-2.5 w-full h-12 rounded-2xl bg-brand text-white text-[15px] font-bold disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-white/[0.08] dark:disabled:text-white/35 transition-colors ${
                    selected.length ? 'seal-chip [--seal-radius:1rem] [--seal-drop:0_10px_30px_-8px_var(--brand-glow)]' : ''
                  }`}
                >
                  {book.isPending
                    ? '예약하는 중…'
                    : !selected.length
                      ? '좌석을 선택해주세요'
                      : loggedIn
                        ? `${selected.length}석 예약하기`
                        : '로그인하고 예약하기'}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </SurveyShell>
  )
}

const PHASE_NOTE = {
  upcoming: '아직 예약이 열리지 않았어요. 배치도를 미리 둘러보세요',
  open: '',
  closed: '예약이 마감됐어요',
  ended: '끝난 행사예요',
} as const

// ── 부분 ──────────────────────────────────────────────────────────────

const InfoCard = ({ event }: { event: SeatEventDetailData }) => {
  const phase = seatPhase(event)
  const dday = phase !== 'ended' ? dDayLabel(event.performance_at) : null
  const ratio = event.total_seats ? event.reserved_count / event.total_seats : 0
  const almostFull = phase === 'open' && isAlmostFull(event)
  const soldOut = phase === 'open' && event.available_count === 0

  return (
    <section className="relative overflow-hidden rounded-3xl p-5 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`inline-flex text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${PHASE_META[phase].badge}`}>
          {soldOut ? '매진' : PHASE_META[phase].label}
        </span>
        {dday ? (
          <span className="inline-flex text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 tabular-nums">
            {dday}
          </span>
        ) : null}
        {almostFull && !soldOut ? (
          <span className="inline-flex text-[10.5px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25">
            마감 임박
          </span>
        ) : null}
      </div>

      <h1 className="mt-2.5 text-[21px] font-extrabold text-ink-strong tracking-[-0.025em] leading-snug break-keep">
        {event.title}
      </h1>
      {event.description ? (
        <p className="mt-1.5 text-[13px] text-ink-muted leading-relaxed whitespace-pre-line break-keep">
          {event.description}
        </p>
      ) : null}

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">
        {event.performance_at ? (
          <>
            <dt className="text-gray-400 dark:text-white/40 font-semibold">일시</dt>
            <dd className="text-ink-strong font-semibold">
              {formatDay(event.performance_at)} {formatTime(event.performance_at)}
            </dd>
          </>
        ) : null}
        {event.venue ? (
          <>
            <dt className="text-gray-400 dark:text-white/40 font-semibold">장소</dt>
            <dd className="text-ink-strong font-semibold">{event.venue}</dd>
          </>
        ) : null}
        {event.closes_at && phase !== 'ended' ? (
          <>
            <dt className="text-gray-400 dark:text-white/40 font-semibold">마감</dt>
            <dd className="text-ink-strong font-semibold">{formatShort(event.closes_at)}</dd>
          </>
        ) : null}
        {phase === 'upcoming' && event.opens_at ? (
          <>
            <dt className="text-gray-400 dark:text-white/40 font-semibold">오픈</dt>
            <dd className="text-brand font-bold">{formatShort(event.opens_at)}</dd>
          </>
        ) : null}
      </dl>

      {/* 잔여석 게이지 */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between text-[12px]">
          <span className="font-semibold text-gray-500 dark:text-white/50">
            남은 좌석{' '}
            <b className={`text-[15px] tabular-nums ${almostFull || soldOut ? 'text-red-500' : 'text-brand'}`}>
              {event.available_count}
            </b>
          </span>
          <span className="text-gray-400 dark:text-white/40 tabular-nums">
            {event.reserved_count} / {event.total_seats}석 예약
          </span>
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${almostFull || soldOut ? 'bg-red-400' : 'bg-brand'}`}
            style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
          />
        </div>
      </div>
    </section>
  )
}

const SelectedStrip = ({
  seats,
  tone,
  empty,
  counter,
  onClear,
}: {
  seats: string[]
  tone: 'brand' | 'danger'
  empty: string
  counter?: string
  onClear?: () => void
}) => {
  const sorted = sortSeats(seats)
  const chip =
    tone === 'brand'
      ? 'bg-[var(--brand-soft)] text-brand border-[var(--brand-soft-strong)]'
      : 'bg-red-50 text-red-500 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25'
  return (
    <div className="flex items-center gap-2 min-h-[28px]">
      <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar">
        {sorted.length ? (
          sorted.map((s) => (
            <span key={s} className={`shrink-0 inline-flex items-center h-7 px-2.5 rounded-lg border text-[12.5px] font-extrabold tabular-nums ${chip}`}>
              {s}
            </span>
          ))
        ) : (
          <span className="text-[12.5px] text-ink-muted self-center">{empty}</span>
        )}
      </div>
      {counter ? (
        <span className="shrink-0 text-[12px] font-bold text-gray-400 dark:text-white/40 tabular-nums">{counter}</span>
      ) : null}
      {onClear ? (
        <button type="button" onClick={onClear} className="shrink-0 text-[12px] font-semibold text-ink-muted hover:text-brand">
          비우기
        </button>
      ) : null}
    </div>
  )
}

const DetailRail = ({ event }: { event: SeatEventDetailData }) => (
  <>
    <RailCard title="예약 현황">
      <div className="flex flex-col gap-1.5">
        {[
          ['남은 좌석', event.available_count, 'text-brand'],
          ['예약된 좌석', event.reserved_count, 'text-ink-strong'],
          ['전체 좌석', event.total_seats, 'text-ink-strong'],
        ].map(([label, value, cls]) => (
          <div key={label as string} className="flex items-baseline justify-between gap-2">
            <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">{label}</span>
            <span className={`text-[16px] font-bold tabular-nums ${cls}`}>{value}</span>
          </div>
        ))}
      </div>
    </RailCard>
    <RailCard title="예약 안내">
      <ul className="space-y-2 text-[12.5px] text-gray-500 dark:text-white/55 leading-relaxed">
        <li>· 한 분당 최대 {event.max_per_user}석까지 예약할 수 있어요.</li>
        <li>· 일행과 붙어 앉으려면 ‘나란히 N석’으로 자리를 찾아보세요.</li>
        <li>· 공연 시작 전까지 일부 좌석만 취소할 수도 있어요.</li>
        <li>· 입장할 때 내 좌석 티켓을 보여주세요.</li>
      </ul>
    </RailCard>
  </>
)

export default SeatEventDetail
