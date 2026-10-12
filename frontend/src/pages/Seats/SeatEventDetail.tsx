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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBookSeats, useCancelMySeats, useSeatEvent } from '../../hooks/useSeatEvents'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { isApiError } from '../../api/utils/request'
import { CenterNote, Spinner, SurveyShell } from '../Survey/surveyUi'
import SeatMap, { SeatLegend } from './SeatMap'
import type { SeatVisual } from './SeatMap'
import { findTogether, sortSeats } from './seatLayout'
import { seatPhase } from './seatShared'
import { DetailRail, InfoCard, PickRail, SeatConfirm, SelectedStrip } from './seatDetailParts'
import type { ConfirmState } from './seatDetailParts'
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

  // SeatMap 은 memo — 좌석 수백 개를 다시 그리는 일이라 아래 콜백은 관련 상태가 바뀔 때만 새로 만든다.
  // (확인 시트 열기·인원 스테퍼·팝 타이머처럼 좌석과 무관한 상태 변화에 배치도가 통째로 리렌더되지 않게)
  const isFree = useCallback(
    (label: string) =>
      !disabled.has(label) && !held.has(label) && !taken.has(label) && !mine.has(label),
    [disabled, held, taken, mine]
  )

  const stateOf = useCallback(
    (label: string): SeatVisual => {
      if (disabled.has(label)) return 'disabled'
      if (mine.has(label)) return toCancel.includes(label) ? 'mine-remove' : 'mine'
      if (taken.has(label)) return 'taken'
      if (held.has(label)) return 'held'
      if (selected.includes(label)) return 'selected'
      return 'available'
    },
    [disabled, mine, toCancel, taken, held, selected]
  )

  const canPress = useCallback(
    (label: string) => (mode === 'cancel' ? mine.has(label) : bookingOpen && isFree(label)),
    [mode, mine, bookingOpen, isFree]
  )

  const titleOf = useCallback(
    (label: string) => {
      const v = stateOf(label)
      return `${label} ${v === 'taken' ? '예약됨' : v === 'held' ? '예약 불가' : v === 'mine' ? '내 좌석' : ''}`.trim()
    },
    [stateOf]
  )

  const maxPerUser = event?.max_per_user
  const pressSeat = useCallback(
    (label: string) => {
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
            ? `한 분당 최대 ${maxPerUser}석이에요 (추가로 ${allowance}석 가능)`
            : `한 분당 최대 ${maxPerUser}석까지 고를 수 있어요`,
          'error'
        )
        return
      }
      navigator.vibrate?.(8)
      setSelected((prev) => [...prev, label])
      setPop(new Set([label]))
    },
    [mode, selected, allowance, mine, maxPerUser]
  )

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
            titleOf={titleOf}
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

export default SeatEventDetail
