// 좌석 예약 — 배치도에서 자리를 고르고, 내 좌석은 모바일 티켓으로 본다.
//
// 흐름: 좌석 누르기(또는 "나란히 N석 찾기") → 하단 바에서 예약 → 티켓 카드 등장.
// 취소는 티켓의 "일부 취소"로 취소 모드에 들어가 내 좌석을 골라 지우거나, "전체 취소".
// 배치도는 15초마다 조용히 새로 받아, 고르던 자리가 먼저 팔리면 선택에서 빼고 알려준다.
//
// PC(lg+)는 어르신이 큰 화면으로 예약하는 자리라 따로 다듬었다(선거 화면과 같은 문법):
// 오른쪽 레일에 고른 좌석("B열 12번")·빼기·큰 예약 버튼이 스크롤과 상관없이 늘 보이고,
// 배치도는 좌석·번호를 크게 + 상태를 ✓·✕ 표시로도 구분한다. 모바일은 하단 고정 바 그대로.
// 예약·취소 확인은 공용 confirmDialog 대신 페이지 안 SeatConfirm(좌석을 크게, Enter 로 제출 안 됨).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBookSeats, useCancelMySeats, useSeatEvent } from '../../hooks/useSeatEvents'
import { useThemeArt } from '../../hooks/useThemeArt'
import { SEATS_DETAIL } from '../../utils/themeAssets'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { isApiError } from '../../api/utils/request'
import type { SeatEventDetail as SeatEventDetailData, SeatLabeling } from '../../types/seatEvent'
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
import './seats-hero.css'

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
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
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

  const submitBooking = () => {
    if (!event || !selected.length) return
    if (!loggedIn) return goLogin()
    setConfirm({ kind: 'book', seats: sortSeats(selected) })
  }

  const doBook = (seats: string[]) =>
    book.mutate(
      { id: seatEventId, seats },
      {
        onSuccess: () => {
          setConfirm(null)
          setSelected([])
          setPop(new Set(seats))
          showToast('예약이 완료됐어요. 입장 때 티켓을 보여주세요', 'success')
          requestAnimationFrame(() =>
            ticketRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          )
        },
        onError: (e) => {
          setConfirm(null)
          showToast(e.message, 'error')
          if (isApiError(e, 409)) setSelected([])
        },
      }
    )

  const submitCancel = (all: boolean) => {
    if (!event) return
    const seats = all ? [...mine] : toCancel
    if (!seats.length) return
    setConfirm({ kind: all ? 'cancel-all' : 'cancel', seats: sortSeats(seats) })
  }

  const doCancel = (all: boolean, seats: string[]) =>
    cancel.mutate(
      { id: seatEventId, seats: all ? undefined : seats },
      {
        onSuccess: (result) => {
          setConfirm(null)
          setToCancel([])
          setMode('book')
          showToast(
            result.my_seats.length ? `${seats.length}석을 취소했어요` : '예약을 취소했어요',
            'success'
          )
        },
        onError: (e) => {
          setConfirm(null)
          showToast(e.message, 'error')
        },
      }
    )

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

  const showBar = mode === 'cancel' || (bookingOpen && (selected.length > 0 || allowance > 0))
  const labeling = event.layout.labeling
  const rail = (
    <>
      {showBar ? (
        mode === 'cancel' ? (
          <PickRail
            tone="danger"
            title="취소할 좌석"
            seats={toCancel}
            labeling={labeling}
            onRemove={(s) => setToCancel((prev) => prev.filter((x) => x !== s))}
            hint={toCancel.length ? '다시 누르면 취소 목록에서 빠져요.' : '왼쪽 배치도에서 초록색 내 좌석을 누르세요.'}
            actionLabel={cancel.isPending ? '취소하는 중…' : toCancel.length ? `${toCancel.length}석 취소하기` : '좌석을 골라주세요'}
            actionDisabled={!toCancel.length || cancel.isPending}
            onAction={() => submitCancel(false)}
            secondary={{
              label: '취소 그만하기',
              onClick: () => {
                setMode('book')
                setToCancel([])
              },
            }}
          />
        ) : (
          <PickRail
            tone="brand"
            title="내가 고른 좌석"
            seats={selected}
            max={allowance}
            labeling={labeling}
            onRemove={(s) => setSelected((prev) => prev.filter((x) => x !== s))}
            hint={
              allowance <= 0
                ? '예약 가능한 좌석 수를 모두 채웠어요.'
                : !selected.length
                  ? '왼쪽 배치도에서 빈 좌석을 누르세요.'
                  : selected.length < allowance
                    ? `${allowance - selected.length}석 더 고를 수 있어요.`
                    : '다 골랐어요. 바꾸려면 고른 좌석을 다시 누르세요.'
            }
            actionLabel={
              book.isPending
                ? '예약하는 중…'
                : !selected.length
                  ? '좌석을 선택해주세요'
                  : loggedIn
                    ? `${selected.length}석 예약하기`
                    : '로그인하고 예약하기'
            }
            actionDisabled={!selected.length || book.isPending}
            onAction={submitBooking}
            note="공연 시작 전까지 언제든 취소할 수 있어요"
          />
        )
      ) : null}
      <DetailRail event={event} />
    </>
  )

  return (
    <SurveyShell onBack={goBack} title={event.title} rail={rail} pinRail>
      <div className={`px-4 pt-4 space-y-4 lg:px-6 lg:pt-6 lg:space-y-5 ${showBar ? 'pb-36 lg:pb-8' : 'pb-6 lg:pb-8'}`}>
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
                      className={`flex-1 h-10 rounded-xl text-[13px] font-bold border transition-colors lg:h-12 lg:text-[16px] ${
                        mode === 'cancel'
                          ? 'border-brand text-brand bg-[var(--brand-soft)]'
                          : 'border-gray-200 dark:border-white/[0.1] text-ink hover:border-brand hover:text-brand'
                      }`}
                    >
                      {mode === 'cancel' ? '취소 그만하기' : '일부 취소'}
                    </button>
                    <button
                      type="button"
                      onClick={() => submitCancel(true)}
                      disabled={cancel.isPending}
                      className="flex-1 h-10 rounded-xl text-[13px] lg:h-12 lg:text-[16px] font-bold border border-gray-200 dark:border-white/[0.1] text-ink-muted hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
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
        <section className="rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm p-4 lg:p-6">
          <div className="flex items-start justify-between gap-3 mb-3 lg:mb-4">
            <div className="min-w-0">
              <h2 className="text-[15px] font-extrabold text-ink-strong tracking-[-0.02em] lg:text-[24px]">
                {mode === 'cancel' ? '취소할 좌석을 눌러주세요' : '좌석 선택'}
              </h2>
              <p className="mt-0.5 text-[12px] text-ink-muted lg:mt-1.5 lg:text-[16px] break-keep">
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

          <div className="mb-3 lg:mb-5">
            <SeatLegend items={legend} large />
          </div>

          {/* 나란히 N석 — 가족·일행이 붙어 앉기 쉬운 자리를 바로 잡아 준다 */}
          {mode === 'book' && bookingOpen && allowance >= 2 ? (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-[var(--brand-soft)] px-3 py-2 lg:mb-5 lg:gap-3 lg:px-4 lg:py-3">
              <span className="text-brand shrink-0">
                <SeatIcon size={17} />
              </span>
              <span className="text-[12.5px] font-bold text-ink-strong lg:text-[16px]">나란히</span>
              <div className="flex items-center rounded-full bg-white dark:bg-white/[0.06] border border-[var(--brand-soft-strong)]">
                <button
                  type="button"
                  onClick={() => setParty((p) => Math.max(2, p - 1))}
                  className="w-7 h-7 lg:w-10 lg:h-10 lg:text-[20px] flex items-center justify-center text-brand font-bold disabled:opacity-30"
                  disabled={party <= 2}
                  aria-label="한 명 줄이기"
                >
                  −
                </button>
                <span className="w-6 lg:w-8 text-center text-[13px] lg:text-[18px] font-extrabold text-ink-strong tabular-nums">
                  {Math.min(party, allowance)}
                </span>
                <button
                  type="button"
                  onClick={() => setParty((p) => Math.min(allowance, p + 1))}
                  className="w-7 h-7 lg:w-10 lg:h-10 lg:text-[20px] flex items-center justify-center text-brand font-bold disabled:opacity-30"
                  disabled={party >= allowance}
                  aria-label="한 명 늘리기"
                >
                  +
                </button>
              </div>
              <span className="text-[12.5px] font-bold text-ink-strong lg:text-[16px]">석</span>
              <button
                type="button"
                onClick={pickTogether}
                className="relative ml-auto h-8 px-3.5 rounded-full bg-brand text-white text-[12.5px] font-bold seal-chip [--seal-drop:none] lg:h-11 lg:px-5 lg:text-[16px]"
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
            large
            titleOf={(label) => {
              const v = stateOf(label)
              return `${label} ${v === 'taken' ? '예약됨' : v === 'held' ? '예약 불가' : v === 'mine' ? '내 좌석' : ''}`.trim()
            }}
          />
        </section>

        {event.notice ? (
          <section className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] p-4 lg:p-6">
            <p className="text-[12px] font-bold text-gray-500 dark:text-white/50 mb-1.5 lg:text-[15px] lg:mb-2">예약 안내</p>
            <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line break-keep lg:text-[16.5px] lg:leading-[1.75]">{event.notice}</p>
          </section>
        ) : null}
      </div>

      {/* 하단 바 — 모바일 전용. PC 는 오른쪽 PickRail 이 같은 역할을 한다 */}
      {showBar ? (
        <div className="fixed bottom-0 inset-x-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-t border-border-light dark:border-border-dark lg:hidden">
          <div className="max-w-md mx-auto">
            {mode === 'cancel' ? (
              <>
                <SelectedStrip seats={toCancel} tone="danger" empty="취소할 좌석을 눌러주세요" />
                <button
                  type="button"
                  onClick={() => submitCancel(false)}
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
                  onClick={submitBooking}
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

      {confirm ? (
        <SeatConfirm
          state={confirm}
          labeling={labeling}
          performanceAt={event.performance_at}
          pending={book.isPending || cancel.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={() =>
            confirm.kind === 'book' ? doBook(confirm.seats) : doCancel(confirm.kind === 'cancel-all', confirm.seats)
          }
        />
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
  // 표지 삽화는 CSS 배경 — 도착에 맞춰 페이드인(utils/themeAssets.ts)
  const artReady = useThemeArt(SEATS_DETAIL)

  // 카드 크기는 삽화 전과 같다 — 삽화는 띠로 덧붙이지 않고 카드 오른쪽 배경으로 깐다.
  // 카드 바탕은 삽화 바닥 실측색(라이트 #eef5fe · 다크 #071222)이라 삽화 가장자리를 같은 색으로 녹이면 이음매가 없다.
  // 모바일: 카드 윗부분 전체 폭 148px(삽화 왼쪽은 빈 하늘이라 칩·제목이 얹혀도 된다 — 의자·양은 오른쪽 약 200px)
  // PC: 오른쪽 62% 전체 높이. 글자는 왼쪽, 게이지는 PC 에서 왼쪽 절반까지.
  return (
    <section className="relative overflow-hidden rounded-3xl p-5 bg-[#eef5fe] ring-1 ring-[rgba(49,130,246,0.15)] shadow-[0_10px_30px_-14px_rgba(49,130,246,0.45)] dark:bg-[#071222] dark:ring-white/[0.08] dark:shadow-[0_10px_34px_-12px_rgba(0,0,0,0.6)]">
      {/* "좌석 안내 양" 삽화(docs/seats-hero-bg-prompts.md 시안 C) */}
      <div className="absolute inset-x-0 top-0 h-[148px] lg:left-auto lg:h-full lg:w-[62%]" aria-hidden>
        <div className={`seats-detail-art absolute inset-0${artReady ? ' is-ready' : ''}`} />
        {/* 가장자리를 카드색으로 녹인다 — 모바일은 아래, PC 는 왼쪽 */}
        <div className="hidden lg:block absolute inset-y-0 left-0 w-[18%] bg-gradient-to-r from-[#eef5fe] to-transparent dark:from-[#071222]" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-[#eef5fe] dark:to-[#071222] lg:hidden" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex text-[10.5px] font-bold px-2 py-0.5 rounded-full border lg:text-[13.5px] lg:px-3 lg:py-1 ${PHASE_META[phase].badge}`}>
            {soldOut ? '매진' : PHASE_META[phase].label}
          </span>
          {dday ? (
            <span className="inline-flex text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 tabular-nums lg:text-[13.5px] lg:px-3 lg:py-1">
              {dday}
            </span>
          ) : null}
          {almostFull && !soldOut ? (
            <span className="inline-flex text-[10.5px] font-bold px-2 py-0.5 rounded-full border lg:text-[13.5px] lg:px-3 lg:py-1 bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25">
              마감 임박
            </span>
          ) : null}
        </div>

        <h1 className="mt-2.5 pr-[180px] lg:pr-0 lg:max-w-[45%] text-[21px] lg:text-[30px] font-extrabold text-[#152648] dark:text-white tracking-[-0.025em] leading-snug break-keep">
          {event.title}
        </h1>
        {event.description ? (
          <p className="mt-1.5 pr-[180px] lg:pr-0 lg:max-w-[45%] text-[13px] lg:text-[16.5px] text-[#41527a] dark:text-white/70 leading-relaxed whitespace-pre-line break-keep">
            {event.description}
          </p>
        ) : null}

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px] lg:mt-5 lg:gap-x-4 lg:gap-y-2 lg:text-[17px]">
          {event.performance_at ? (
            <>
              <dt className="text-[#7a8bb0] dark:text-white/45 font-semibold">일시</dt>
              <dd className="text-[#152648] dark:text-white font-semibold">
                {formatDay(event.performance_at)} {formatTime(event.performance_at)}
              </dd>
            </>
          ) : null}
          {event.venue ? (
            <>
              <dt className="text-[#7a8bb0] dark:text-white/45 font-semibold">장소</dt>
              <dd className="text-[#152648] dark:text-white font-semibold">{event.venue}</dd>
            </>
          ) : null}
          {event.closes_at && phase !== 'ended' ? (
            <>
              <dt className="text-[#7a8bb0] dark:text-white/45 font-semibold">마감</dt>
              <dd className="text-[#152648] dark:text-white font-semibold">{formatShort(event.closes_at)}</dd>
            </>
          ) : null}
          {phase === 'upcoming' && event.opens_at ? (
            <>
              <dt className="text-[#7a8bb0] dark:text-white/45 font-semibold">오픈</dt>
              <dd className="text-brand font-bold">{formatShort(event.opens_at)}</dd>
            </>
          ) : null}
        </dl>

        {/* 잔여석 게이지 — PC 에선 삽화(오른쪽)와 겹치지 않게 왼쪽 절반까지 */}
        <div className="mt-4 lg:max-w-[48%]">
          <div className="flex items-baseline justify-between text-[12px] lg:text-[15px]">
            <span className="font-semibold text-[#41527a] dark:text-white/60">
              남은 좌석{' '}
              <b className={`text-[15px] lg:text-[22px] tabular-nums ${almostFull || soldOut ? 'text-red-500' : 'text-brand'}`}>
                {event.available_count}
              </b>
            </span>
            <span className="text-[#7a8bb0] dark:text-white/45 tabular-nums">
              {event.reserved_count} / {event.total_seats}석 예약
            </span>
          </div>
          <div className="mt-1.5 h-2 lg:mt-2 lg:h-3 rounded-full bg-white dark:bg-white/[0.1] overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${almostFull || soldOut ? 'bg-red-400' : 'bg-brand'}`}
              style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
            />
          </div>
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

type ConfirmState = { kind: 'book' | 'cancel' | 'cancel-all'; seats: string[] }

/** 좌석 번호를 말로 — "B12" → "B열 12번" / 열이 글자인 배치 "D3" → "3번 줄 D석". 번호 규칙 자체는 seatLayout 그대로 */
const seatSpoken = (labeling: SeatLabeling, label: string): string => {
  const m = /^([A-Z]+)(\d+)$/.exec(label)
  if (!m) return label
  return labeling === 'col_letter' ? `${m[2]}번 줄 ${m[1]}석` : `${m[1]}열 ${m[2]}번`
}

/** PC 레일 — 고른 좌석·빈 칸·빼기·큰 버튼. 스크롤과 상관없이 늘 보인다 */
const PickRail = ({
  tone,
  title,
  seats,
  max,
  labeling,
  onRemove,
  hint,
  actionLabel,
  actionDisabled,
  onAction,
  note,
  secondary,
}: {
  tone: 'brand' | 'danger'
  title: string
  seats: string[]
  max?: number
  labeling: SeatLabeling
  onRemove: (seat: string) => void
  hint: string
  actionLabel: string
  actionDisabled: boolean
  onAction: () => void
  note?: string
  secondary?: { label: string; onClick: () => void }
}) => {
  const sorted = sortSeats(seats)
  const danger = tone === 'danger'
  const empty = max ? Math.max(0, max - sorted.length) : 0
  return (
    <RailCard>
      <p className="text-[15px] font-bold text-ink-muted">{title}</p>
      <p className="mt-1 text-ink-strong tabular-nums">
        <b className={`text-[40px] font-extrabold leading-none ${danger ? 'text-red-500' : 'text-brand'}`}>{sorted.length}</b>
        <span className="text-[20px] font-bold">{max ? ` / ${max}석` : '석'}</span>
      </p>
      <ul className="mt-4 space-y-2 max-h-[calc(40vh/var(--az,1))] overflow-y-auto">
        {sorted.map((s) => (
          <li
            key={s}
            className={`flex items-center gap-3 rounded-2xl pl-4 pr-1.5 py-2 ${
              danger ? 'bg-red-50 dark:bg-red-500/10' : 'bg-[var(--brand-soft)]'
            }`}
          >
            <p className={`min-w-0 flex-1 text-[19px] font-extrabold tabular-nums truncate ${danger ? 'text-red-500 dark:text-red-300' : 'text-brand'}`}>
              {seatSpoken(labeling, s)}
            </p>
            <button
              type="button"
              onClick={() => onRemove(s)}
              aria-label={`${seatSpoken(labeling, s)} 빼기`}
              className="shrink-0 h-10 px-3 rounded-xl text-[14px] font-semibold text-ink-muted hover:bg-white hover:text-ink-strong dark:hover:bg-white/10 transition-colors"
            >
              빼기
            </button>
          </li>
        ))}
        {Array.from({ length: Math.min(empty, 4) }, (_, i) => (
          <li
            key={`empty-${i}`}
            className="flex items-center h-[56px] rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 px-4 text-[15px] text-ink-muted"
          >
            빈 칸
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[15px] leading-relaxed text-ink break-keep">{hint}</p>
      <button
        type="button"
        onClick={onAction}
        disabled={actionDisabled}
        className={`mt-4 w-full h-14 rounded-2xl text-white text-[19px] font-bold disabled:opacity-40 transition-opacity ${
          danger ? 'bg-red-500' : 'bg-brand'
        }`}
      >
        {actionLabel}
      </button>
      {secondary ? (
        <button
          type="button"
          onClick={secondary.onClick}
          className="mt-2 w-full h-12 rounded-2xl bg-gray-100 dark:bg-white/[0.08] text-ink-strong text-[16px] font-bold"
        >
          {secondary.label}
        </button>
      ) : null}
      {note ? <p className="mt-2.5 text-[13.5px] text-ink-muted text-center">{note}</p> : null}
    </RailCard>
  )
}

/**
 * 예약·취소 마지막 확인 — 공용 confirmDialog 대신 좌석을 "B열 12번"처럼 크게 보여 준다.
 * 포털이 아니라 페이지 안에 그려 PC 글씨 크기(zoom)도 함께 받는다. Enter 로 제출되지 않게 버튼만 받는다.
 */
const SeatConfirm = ({
  state,
  labeling,
  performanceAt,
  pending,
  onCancel,
  onConfirm,
}: {
  state: ConfirmState
  labeling: SeatLabeling
  performanceAt: string | null | undefined
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const book = state.kind === 'book'
  const n = state.seats.length
  const title = book ? '이 좌석으로 예약할까요?' : state.kind === 'cancel-all' ? '예약을 모두 취소할까요?' : `${n}석을 취소할까요?`
  const desc = book
    ? `${performanceAt ? `${formatShort(performanceAt)} · ` : ''}공연 시작 전까지 언제든 취소할 수 있어요.`
    : '취소한 자리는 바로 다른 분이 예약할 수 있어요.'
  const confirmText = book ? `${n}석 예약하기` : state.kind === 'cancel-all' ? '전체 취소' : `${n}석 취소`

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="seat-confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md lg:max-w-[560px] max-h-[calc(90vh/var(--az,1))] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] sm:pb-5 lg:p-8 shadow-2xl animate-pop-in"
      >
        <h3 id="seat-confirm-title" className="text-[19px] lg:text-[26px] font-extrabold text-ink-strong tracking-[-0.02em]">
          {title}
        </h3>
        <p className="mt-1.5 text-[13.5px] lg:text-[16px] text-ink-muted leading-relaxed break-keep">{desc}</p>
        <div className="mt-4 lg:mt-6 flex flex-wrap gap-2 lg:gap-2.5">
          {state.seats.map((s) => (
            <span
              key={s}
              className={`inline-flex items-center h-10 lg:h-14 px-3.5 lg:px-5 rounded-2xl text-[16px] lg:text-[22px] font-extrabold tabular-nums ${
                book
                  ? 'bg-[var(--brand-soft)] text-brand'
                  : 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300'
              }`}
            >
              {seatSpoken(labeling, s)}
            </span>
          ))}
        </div>
        <div className="mt-5 lg:mt-7 grid grid-cols-2 gap-2.5 lg:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 lg:h-16 rounded-2xl bg-gray-100 dark:bg-white/[0.08] text-ink-strong text-[15px] lg:text-[19px] font-bold"
          >
            {book ? '다시 고를게요' : '그대로 둘게요'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`h-12 lg:h-16 rounded-2xl text-white text-[15px] lg:text-[19px] font-bold disabled:opacity-50 ${
              book ? 'bg-brand' : 'bg-red-500'
            }`}
          >
            {pending ? (book ? '예약하는 중…' : '취소하는 중…') : confirmText}
          </button>
        </div>
      </div>
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
            <span className="text-[15px] font-semibold text-gray-500 dark:text-white/55">{label}</span>
            <span className={`text-[20px] font-bold tabular-nums ${cls}`}>{value}</span>
          </div>
        ))}
      </div>
    </RailCard>
    <RailCard title="예약 안내">
      <ul className="space-y-2 text-[15px] text-gray-600 dark:text-white/60 leading-relaxed break-keep">
        <li>· 한 분당 최대 {event.max_per_user}석까지 예약할 수 있어요.</li>
        <li>· 일행과 붙어 앉으려면 ‘나란히 N석’으로 자리를 찾아보세요.</li>
        <li>· 공연 시작 전까지 일부 좌석만 취소할 수도 있어요.</li>
        <li>· 입장할 때 내 좌석 티켓을 보여주세요.</li>
      </ul>
    </RailCard>
  </>
)

export default SeatEventDetail
