// 공동 묵상방 홈 (/rooms/:roomId) — "오늘" 한 화면
// 흐름: 오늘 본문을 방 안에서 읽는다 → 읽은 사람 얼굴이 쌓인다 → 반응 칩 한 번 또는
// 오늘의 질문에 답한다 → 서로의 나눔에 마음을 남긴다.
// 초대·설정·완주 카드는 시트로 뺀다. lg+ 는 방 카드가 우측 레일로 간다.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import EmojiPickerPanel from '../../components/common/EmojiPickerPanel'
import { AnimatedEmojiText } from '../../components/common/animatedEmoji'
import { CommentIcon, HeartIcon } from '../../components/icons/ActionIcons'
import { useBibleChapter } from '../../hooks/useBible'
import {
  useCreateRoomPost,
  useCreateRoomReply,
  useDeleteRoomPost,
  useDeleteRoomReply,
  useLeaveRoom,
  useMarkRoomDayRead,
  useNudgeDay,
  useRoom,
  useRoomDay,
  useRoomPosts,
  useRoomReplies,
  useSetDayReaction,
  useToggleRoomPostLike,
  useToggleVerseMark,
} from '../../hooks/useMeditationRoom'
import type { PlanPassage } from '../../types/biblePlan'
import type { RoomDayDetail, RoomDetail, RoomPost, RoomPostType, RoomReactionKey } from '../../types/meditationRoom'
import { isAuthenticated } from '../../utils/auth'
import { confirmDialog } from '../../utils/confirmDialog'
import { showToast } from '../../utils/toast'
import CompletionSheet from './CompletionSheet'
import InviteSheet from './InviteSheet'
import { Avatar, FaceStack } from './RoomBits'
import RoomSettingsSheet from './RoomSettingsSheet'
import {
  CheckIcon,
  ExternalIcon,
  FlameIcon,
  HandHeartIcon,
  MoreIcon,
  PartyIcon,
  PokeIcon,
  ReactionGlyph,
  RoomGlyph,
  SmallHeartIcon,
  SproutIcon,
  UserPlusIcon,
} from './RoomIcons'
import { REACTIONS, WEEKDAYS_KO, formatMd, parseYmd, pickDailyQuestion, reactionMeta } from './roomCourses'

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  return `${Math.floor(hr / 24)}일 전`
}

const RoomHome = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { roomId } = useParams<{ roomId: string }>()
  const id = Number(roomId)

  const { data: room, isLoading, error } = useRoom(id, isAuthenticated())
  const leaveRoom = useLeaveRoom()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteFresh, setInviteFresh] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [completionOpen, setCompletionOpen] = useState(false)

  // 방금 만든 방 — 초대 시트를 바로 연다 (위저드 → navigate state)
  useEffect(() => {
    if ((location.state as { fresh?: boolean } | null)?.fresh && room) {
      setInviteFresh(true)
      setInviteOpen(true)
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id])

  // 선택 일차 — 기본은 오늘 (시작 전이면 1일차, 끝났으면 마지막)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const day = selectedDay ?? Math.min(Math.max(1, room?.current_day ?? 1), room?.total_days ?? 1)
  const dayInfo = room?.days.find((d) => d.day_number === day)

  useEffect(() => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', `/rooms/${id}`)
      navigate('/login')
    }
  }, [id, navigate])

  const handleLeave = async () => {
    if (
      !(await confirmDialog({
        title: '묵상방 나가기',
        message: '이 묵상방을 나가시겠어요?',
        description: '다시 들어오려면 초대가 필요해요.',
        confirmText: '나가기',
        icon: 'logout',
      }))
    )
      return
    try {
      await leaveRoom.mutateAsync(id)
      showToast('묵상방을 나왔어요', 'success')
      navigate('/rooms')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'error')
    }
  }

  if (isLoading || !room) {
    return (
      <Shell onBack={() => navigate('/rooms')} title="공동 묵상방">
        {error ? (
          <div className="text-center py-16 px-6">
            <p className="text-[13px] text-gray-500 dark:text-white/55">
              {error instanceof Error ? error.message : '묵상방을 불러오지 못했습니다'}
            </p>
          </div>
        ) : (
          <div className="px-4 pt-4 space-y-3">
            <div className="h-20 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
            <div className="h-14 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
            <div className="h-64 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          </div>
        )}
      </Shell>
    )
  }

  const myDone = room.my_read_count >= room.total_days
  const isLateJoiner = room.status === 'active' && room.current_day > 1 && room.my_read_count === 0
  const showCompletion = myDone || room.status === 'finished'

  return (
    <Shell
      onBack={() => navigate('/rooms')}
      title={room.title}
      actions={
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setInviteFresh(false)
              setInviteOpen(true)
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--brand-soft)] text-brand text-[12px] font-bold active:scale-95 transition-transform"
          >
            <UserPlusIcon size={14} /> 초대
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="방 설정"
            className="p-1.5 rounded-full text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          >
            <MoreIcon size={20} />
          </button>
        </div>
      }
      rail={
        <>
          <RoomCard room={room} onCompletion={() => setCompletionOpen(true)} showCompletion={showCompletion} />
          <MembersRail room={room} onInvite={() => { setInviteFresh(false); setInviteOpen(true) }} />
        </>
      }
    >
      {/* 늦게 들어온 사람 안내 */}
      {isLateJoiner && (
        <div className="mx-4 mt-4 p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/25">
          <p className="text-[13px] font-bold text-amber-700 dark:text-amber-300">
            {room.current_day}일차부터 함께해요
          </p>
          <p className="text-[12px] text-gray-600 dark:text-white/60 mt-0.5 leading-[1.6]">
            지난 본문은 편하게 따라잡아도 괜찮아요. 오늘 것부터 읽어도 좋고요.
          </p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {room.days
              .filter((d) => d.day_number < room.current_day)
              .slice(-5)
              .map((d) => (
                <button
                  key={d.day_number}
                  type="button"
                  onClick={() => setSelectedDay(d.day_number)}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-white/[0.08] text-[11.5px] font-bold text-amber-700 dark:text-amber-200 border border-amber-400/30"
                >
                  {d.day_number}일차
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="lg:hidden">
        <RoomCard room={room} compact onCompletion={() => setCompletionOpen(true)} showCompletion={showCompletion} />
      </div>

      <DayStrip room={room} day={day} onPick={setSelectedDay} />

      {dayInfo && (
        <>
          {/* key=day — 일차가 바뀌면 펼침·작성 상태를 처음부터 */}
          <TodayCard key={`today-${day}`} room={room} day={day} />
          <DayFeed key={`feed-${day}`} room={room} day={day} />
        </>
      )}

      {inviteOpen && (
        <InviteSheet
          room={room}
          fresh={inviteFresh}
          onClose={() => {
            setInviteOpen(false)
            setInviteFresh(false)
          }}
        />
      )}
      {settingsOpen && (
        <RoomSettingsSheet
          room={room}
          onClose={() => setSettingsOpen(false)}
          onLeave={() => {
            setSettingsOpen(false)
            handleLeave()
          }}
        />
      )}
      {completionOpen && <CompletionSheet room={room} onClose={() => setCompletionOpen(false)} />}
    </Shell>
  )
}

// ── 방 카드 — 정체성·공동 스트릭·내 여정 ──
const RoomCard = ({
  room,
  compact,
  showCompletion,
  onCompletion,
}: {
  room: RoomDetail
  compact?: boolean
  showCompletion: boolean
  onCompletion: () => void
}) => {
  const streak = room.group_streak ?? 0
  const todayRead = room.today_read_count ?? 0
  const statusLine =
    room.status === 'upcoming'
      ? `${formatMd(room.start_date)} 시작`
      : room.status === 'finished'
        ? '여정 마침'
        : `${room.current_day} / ${room.total_days}일차`
  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-blue-200/60 dark:border-white/[0.08] bg-gradient-to-br from-blue-50 to-sky-50 dark:from-[#172554]/60 dark:to-[#1e3a8a]/35 ${
        compact ? 'mx-4 mt-4 p-4' : 'p-5'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0 w-11 h-11 rounded-2xl bg-white/70 dark:bg-white/[0.08] text-brand flex items-center justify-center">
          <RoomGlyph emoji={room.emoji} size={23} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-bold tracking-[0.08em] text-blue-600 dark:text-blue-300">
            {statusLine} · {room.member_count}명
          </p>
          {!compact && (
            <h2 className="text-[18px] font-bold tracking-[-0.015em] leading-[1.3] text-ink-strong mt-0.5 break-keep">
              {room.title}
            </h2>
          )}
          {room.description && !compact && (
            <p className="text-[12px] text-gray-600 dark:text-white/60 mt-0.5">{room.description}</p>
          )}
          {compact && (
            <p className="text-[13px] font-semibold text-ink-strong mt-0.5 truncate">
              {room.status === 'active'
                ? todayRead > 0
                  ? `오늘 ${todayRead}명이 읽었어요`
                  : '오늘 아직 아무도 안 읽었어요. 첫 발자국을 남겨요'
                : room.status === 'upcoming'
                  ? '시작 전이에요. 친구를 초대해두세요'
                  : '수고했어요, 모두'}
            </p>
          )}
        </div>
        {streak > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-orange-500/[0.12] text-orange-600 dark:text-orange-300 text-[11.5px] font-bold">
            <FlameIcon size={13} /> 전원 {streak}일째
          </span>
        )}
      </div>

      {/* 내 여정 */}
      <div className="mt-3.5">
        {room.my_read_count >= room.total_days ? (
          <button
            type="button"
            onClick={onCompletion}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-500/[0.12] active:scale-[0.985] transition-transform"
          >
            <span className="inline-flex items-center gap-2 text-[12.5px] font-bold text-emerald-600 dark:text-emerald-300">
              <PartyIcon size={15} /> 내 몫 완주! {room.total_days}일치를 모두 읽었어요
            </span>
            <span className="text-[11.5px] font-bold text-emerald-700 dark:text-emerald-200 underline underline-offset-2">
              기념 카드
            </span>
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between text-[11.5px] font-semibold mb-1.5">
              <span className="text-gray-500 dark:text-white/55">내 여정</span>
              <span className="text-brand">
                <CheckIcon size={10} className="inline-block -mt-px mr-0.5 align-middle" />
                {room.my_read_count} / {room.total_days}일
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/70 dark:bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${Math.min(100, Math.round((room.my_read_count / Math.max(1, room.total_days)) * 100))}%` }}
              />
            </div>
          </>
        )}
        {showCompletion && room.status === 'finished' && room.my_read_count < room.total_days && (
          <button
            type="button"
            onClick={onCompletion}
            className="mt-2 text-[11.5px] font-bold text-brand underline underline-offset-2"
          >
            우리 방 완주 기념 카드 보기
          </button>
        )}
      </div>
    </section>
  )
}

// lg 레일 — 멤버 목록 + 초대
const MembersRail = ({ room, onInvite }: { room: RoomDetail; onInvite: () => void }) => (
  <section className="rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none">
    <div className="flex items-center justify-between mb-2.5">
      <p className="text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
        함께하는 사람 {room.members.length}명
      </p>
      <button type="button" onClick={onInvite} className="text-[11.5px] font-bold text-brand">
        + 초대
      </button>
    </div>
    <div className="flex flex-col gap-1.5">
      {room.members.slice(0, 12).map((m) => (
        <div key={m.user_id} className="flex items-center gap-2">
          <Avatar name={m.name} avatarUrl={m.avatar_url} size={24} />
          <span className="text-[12.5px] font-semibold text-ink-strong truncate">{m.name}</span>
          {m.is_admin && <span className="text-[10px] font-bold text-brand">방장</span>}
        </div>
      ))}
    </div>
  </section>
)

// ── 요일 스트립 — 날짜·요일·읽음 점 ──
const DayStrip = ({ room, day, onPick }: { room: RoomDetail; day: number; onPick: (d: number) => void }) => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current?.querySelector(`[data-day="${day}"]`)
    el?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [day])
  return (
    <div
      ref={ref}
      className="flex gap-1.5 overflow-x-auto px-4 pt-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {room.days.map((d) => {
        const active = d.day_number === day
        const isToday = d.day_number === room.current_day
        const future = room.status === 'upcoming' || d.day_number > room.current_day
        const date = d.date ? parseYmd(String(d.date)) : null
        const fullRead = room.member_count > 0 && d.read_count >= room.member_count
        return (
          <button
            key={d.day_number}
            type="button"
            data-day={d.day_number}
            onClick={() => onPick(d.day_number)}
            className={`relative shrink-0 w-[52px] py-2 rounded-2xl flex flex-col items-center gap-0.5 transition-all ${
              active
                ? 'bg-brand text-white shadow-[0_6px_16px_-6px_var(--brand-glow)]'
                : future
                  ? 'bg-gray-50 dark:bg-white/[0.04] text-gray-400 dark:text-white/35'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/65'
            }`}
          >
            <span className="text-[10px] font-semibold opacity-80">
              {date ? WEEKDAYS_KO[date.getDay()] : ''}
            </span>
            <span className="text-[14px] font-extrabold tabular-nums leading-none">
              {date ? date.getDate() : d.day_number}
            </span>
            <span className="text-[9.5px] font-semibold opacity-70">{d.day_number}일차</span>
            {/* 점: 내 읽음 / 나눔 있음 / 전원 읽음 */}
            <span className="flex items-center gap-[3px] h-[6px] mt-0.5">
              {d.read_by_me && <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-emerald-500'}`} />}
              {d.post_count > 0 && <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white/70' : 'bg-brand'}`} />}
              {fullRead && <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-amber-200' : 'bg-orange-400'}`} />}
            </span>
            {isToday && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-background-light dark:ring-background-dark" />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── 오늘 카드 — 본문 인라인 읽기 + 읽은 사람 + 콕 찌르기 ──
const TodayCard = ({ room, day }: { room: RoomDetail; day: number }) => {
  const navigate = useNavigate()
  const dayInfo = room.days.find((d) => d.day_number === day)!
  const { data: detail } = useRoomDay(room.id, day)
  const markDayRead = useMarkRoomDayRead(room.id)
  const nudge = useNudgeDay(room.id, day)
  const [expanded, setExpanded] = useState(false)

  const readerIds = new Set(detail?.reader_ids ?? dayInfo.reader_ids ?? [])
  const readers = room.members.filter((m) => readerIds.has(m.user_id))
  const notYet = room.members.filter((m) => !readerIds.has(m.user_id))
  const isFuture = room.status === 'upcoming' || day > room.current_day
  const canNudge =
    !isFuture && dayInfo.read_by_me && (detail?.unread_count ?? notYet.length) > 0 && !(detail?.nudge_sent ?? false)

  const handleRead = () => {
    if (dayInfo.read_by_me) return
    markDayRead.mutate(day, {
      onSuccess: () => showToast(`${day}일차 읽었어요 ✓`, 'success'),
    })
  }

  const handleNudge = async () => {
    try {
      const res = await nudge.mutateAsync()
      showToast(res.sent_count > 0 ? `${res.sent_count}명을 콕 찔렀어요` : '모두 읽었어요!', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '콕 찌르기에 실패했습니다', 'error')
    }
  }

  const first = dayInfo.passages[0]

  return (
    <section className="mx-4 mt-3 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-400 dark:text-white/45">
              {day}일차{dayInfo.date ? ` · ${formatMd(String(dayInfo.date))}` : ''}
            </p>
            <h3 className="text-[17px] font-bold tracking-[-0.015em] text-ink-strong mt-0.5 break-keep">
              {dayInfo.title ?? '본문 없음'}
            </h3>
          </div>
          {dayInfo.read_by_me ? (
            <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300 text-[12px] font-bold">
              <CheckIcon size={10} /> 읽었어요
            </span>
          ) : (
            !expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="shrink-0 px-3.5 py-2 rounded-full bg-brand text-white text-[12px] font-bold shadow-[0_4px_14px_-4px_var(--brand-glow)] active:scale-95 transition-transform"
              >
                읽기
              </button>
            )
          )}
        </div>

        {/* 읽은 사람 얼굴 */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {room.members.length > 0 && (
              <FaceStack members={[...readers, ...notYet]} size={26} max={7} dimIds={new Set(notYet.map((m) => m.user_id))} />
            )}
            <span className="text-[12px] font-semibold text-gray-500 dark:text-white/55 truncate">
              {isFuture
                ? '아직 오지 않은 날'
                : readers.length === 0
                  ? '아직 아무도 안 읽었어요'
                  : `${readers.length}/${room.members.length}명 읽음`}
            </span>
          </div>
          {canNudge && (
            <button
              type="button"
              onClick={handleNudge}
              disabled={nudge.isPending}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-400/15 text-amber-700 dark:text-amber-300 text-[11.5px] font-bold active:scale-95 transition-transform disabled:opacity-50"
            >
              <PokeIcon size={13} /> 콕 찌르기
            </button>
          )}
          {!isFuture && dayInfo.read_by_me && detail?.nudge_sent && notYet.length > 0 && (
            <span className="shrink-0 text-[11px] text-gray-400 dark:text-white/40">콕 찔렀어요</span>
          )}
        </div>
      </div>

      {/* 본문 — 펼치면 방 안에서 바로 읽는다 */}
      {expanded || dayInfo.read_by_me ? (
        <div className="border-t border-gray-100 dark:border-white/[0.06]">
          {!expanded && dayInfo.read_by_me ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full px-4 py-3 text-left text-[12.5px] font-semibold text-brand"
            >
              본문 다시 펼치기
            </button>
          ) : (
            <PassageReader
              room={room}
              day={day}
              passages={dayInfo.passages}
              detail={detail}
              readByMe={dayInfo.read_by_me}
              onRead={handleRead}
              allowAutoRead={!isFuture}
              marking={markDayRead.isPending}
            />
          )}
        </div>
      ) : null}

      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (!first) return
            const verse = first.verse_start ? `?verse=${first.verse_start}` : ''
            navigate(`/bible/${first.book_number}/${first.chapter_start}${verse}`)
          }}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-gray-500 dark:text-white/50 hover:text-brand"
        >
          <ExternalIcon size={13} /> 성경 화면에서 읽기
        </button>
        {(detail?.verse_marks.length ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-rose-500">
            <SmallHeartIcon filled /> 머문 절 {detail!.verse_marks.length}
          </span>
        )}
      </div>
    </section>
  )
}

// ── 본문 리더 — 절을 누르면 '마음이 머문 절' ──
const PassageReader = ({
  room,
  day,
  passages,
  detail,
  readByMe,
  onRead,
  allowAutoRead,
  marking,
}: {
  room: RoomDetail
  day: number
  passages: PlanPassage[]
  detail?: RoomDayDetail
  readByMe: boolean
  onRead: () => void
  allowAutoRead: boolean
  marking: boolean
}) => {
  const toggleMark = useToggleVerseMark(room.id, day)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [loadedCount, setLoadedCount] = useState(0)
  const allLoaded = loadedCount >= passages.length

  // 끝까지 스크롤해 1.5초 머무르면 읽음 처리 (버튼을 눌러도 된다)
  useEffect(() => {
    if (readByMe || !allowAutoRead || !allLoaded || !sentinelRef.current) return
    let timer: number | undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = window.setTimeout(onRead, 1500)
        } else if (timer) {
          window.clearTimeout(timer)
          timer = undefined
        }
      },
      { threshold: 0.9 },
    )
    io.observe(sentinelRef.current)
    return () => {
      io.disconnect()
      if (timer) window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readByMe, allowAutoRead, allLoaded])

  const marks = new Map<string, { count: number; mine: boolean; names: string[] }>()
  detail?.verse_marks.forEach((m) => marks.set(`${m.book_number}:${m.chapter}:${m.verse}`, m))

  return (
    <div className="px-4 pt-3 pb-4">
      <p className="text-[11px] text-gray-400 dark:text-white/40 mb-2">
        마음이 머문 절을 살짝 눌러 표시해요. 방 친구들이 어디에 머물렀는지도 보여요.
      </p>
      {passages.map((p, i) => (
        <PassageBlock
          key={`${p.book_number}-${p.chapter_start}-${p.verse_start ?? 0}`}
          passage={p}
          showRef={passages.length > 1 || i > 0}
          marks={marks}
          onLoaded={() => setLoadedCount((c) => Math.max(c, i + 1))}
          onToggle={(chapter, verse) =>
            toggleMark.mutate({ book_number: p.book_number, chapter, verse })
          }
        />
      ))}
      <div ref={sentinelRef} className="pt-3">
        {readByMe ? (
          <p className="text-center text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-300">
            <CheckIcon size={11} className="inline-block -mt-px mr-1 align-middle" />
            오늘 본문을 읽었어요. 아래에 마음을 남겨보세요
          </p>
        ) : (
          <button
            type="button"
            onClick={onRead}
            disabled={marking}
            className="relative w-full py-3 rounded-2xl bg-brand text-white text-[14px] font-bold seal-chip [--seal-radius:1rem] disabled:opacity-50 active:scale-[0.985] transition-transform"
          >
            {marking ? '표시하는 중...' : '다 읽었어요'}
          </button>
        )}
      </div>
    </div>
  )
}

const PassageBlock = ({
  passage,
  showRef,
  marks,
  onLoaded,
  onToggle,
}: {
  passage: PlanPassage
  showRef: boolean
  marks: Map<string, { count: number; mine: boolean; names: string[] }>
  onLoaded: () => void
  onToggle: (chapter: number, verse: number) => void
}) => {
  // 방 본문은 장 경계로 끊어 저장되므로 chapter_start 하나만 읽으면 된다
  const { data, isLoading } = useBibleChapter(passage.book_number, passage.chapter_start)
  useEffect(() => {
    if (data) onLoaded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])
  const verses = useMemo(() => {
    if (!data) return []
    const s = passage.verse_start ?? 1
    const e = passage.verse_end ?? Number.MAX_SAFE_INTEGER
    return data.verses.filter((v) => v.verse >= s && v.verse <= e)
  }, [data, passage.verse_start, passage.verse_end])

  if (isLoading) {
    return <div className="h-24 rounded-xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse mb-2" />
  }
  return (
    <div className="mb-3">
      {showRef && (
        <p className="text-[12px] font-bold text-brand mb-1.5">{passage.reference ?? `${passage.book_name_ko ?? ''} ${passage.chapter_start}장`}</p>
      )}
      <div className="space-y-0.5">
        {verses.map((v) => {
          const m = marks.get(`${passage.book_number}:${passage.chapter_start}:${v.verse}`)
          return (
            <button
              key={v.verse}
              type="button"
              onClick={() => onToggle(passage.chapter_start, v.verse)}
              className={`w-full text-left flex gap-2 px-2 py-1.5 rounded-xl transition-colors ${
                m?.mine ? 'bg-rose-500/[0.08]' : m ? 'bg-[var(--brand-soft)]/60' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <span className="shrink-0 w-5 text-right text-[10.5px] font-bold text-gray-400 dark:text-white/35 pt-[3px] tabular-nums">
                {v.verse}
              </span>
              <span className="flex-1 text-[15px] leading-[1.75] text-gray-800 dark:text-white/85 font-serif-kr break-keep">
                {v.text}
                {m && (
                  <span
                    className={`inline-flex items-center gap-0.5 ml-1.5 align-middle px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      m.mine ? 'bg-rose-500 text-white' : 'bg-white dark:bg-white/[0.1] text-rose-500 ring-1 ring-rose-200 dark:ring-rose-400/30'
                    }`}
                    title={m.names.join(', ')}
                  >
                    <SmallHeartIcon size={9} filled /> {m.count}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 나눔 카드 + 피드 ──
const DayFeed = ({ room, day }: { room: RoomDetail; day: number }) => {
  const { data: feed, isLoading } = useRoomPosts(room.id, day)
  const { data: detail } = useRoomDay(room.id, day)
  const setReaction = useSetDayReaction(room.id, day)
  const createPost = useCreateRoomPost(room.id)
  const dayInfo = room.days.find((d) => d.day_number === day)

  const [qOffset, setQOffset] = useState(0)
  const question = pickDailyQuestion(room.id, day, qOffset)
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [asPrayer, setAsPrayer] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) textareaRef.current?.focus()
  }, [open])

  const handleSubmit = async () => {
    const text = content.trim()
    if (!text) return
    const postType: RoomPostType = asPrayer ? 'prayer' : 'meditation'
    try {
      await createPost.mutateAsync({ dayNumber: day, postType, content: text })
      setContent('')
      setOpen(false)
      showToast(asPrayer ? '기도제목을 나눴어요 🙏' : '묵상을 나눴어요 🕊️', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '작성에 실패했습니다', 'error')
    }
  }

  const handleReact = (key: RoomReactionKey) => {
    const mine = detail?.reactions.find((r) => r.reaction === key)?.mine
    setReaction.mutate(mine ? null : key)
  }

  const reactionSummary = (detail?.reactions ?? []).filter((r) => r.count > 0)

  return (
    <section className="px-4 pt-4 pb-10 lg:max-w-[640px] lg:mx-auto">
      {/* 나눔 카드 */}
      <div className="p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm">
        <p className="text-[11px] font-bold text-gray-400 dark:text-white/45">오늘 본문에서 나는</p>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {REACTIONS.map((r) => {
            const found = detail?.reactions.find((x) => x.reaction === r.key)
            const mine = !!found?.mine
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => handleReact(r.key)}
                disabled={setReaction.isPending}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12.5px] font-bold transition-all active:scale-95 ${
                  mine
                    ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                    : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/65'
                }`}
              >
                <ReactionGlyph reaction={r.key} size={13} />
                {r.label}
                {found && found.count > 0 && (
                  <span className={`text-[10.5px] tabular-nums ${mine ? 'text-white/80' : 'text-brand'}`}>
                    {found.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 오늘의 질문 */}
        <div className="mt-4 p-3.5 rounded-xl bg-[var(--brand-soft)]">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold text-brand">오늘의 질문</p>
            <button
              type="button"
              onClick={() => setQOffset((o) => o + 1)}
              className="shrink-0 text-[11px] font-semibold text-gray-500 dark:text-white/50 underline underline-offset-2"
            >
              다른 질문
            </button>
          </div>
          <p className="text-[14.5px] font-semibold leading-[1.55] text-ink-strong mt-1 break-keep">{question}</p>
        </div>

        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 w-full text-left px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[13.5px] text-gray-400 dark:text-white/40"
          >
            이 질문에 답해볼게요…
          </button>
        ) : (
          <div className="mt-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={3000}
              placeholder={asPrayer ? '함께 기도했으면 하는 제목을 적어주세요' : '짧아도 괜찮아요. 한 줄이면 충분해요'}
              className="w-full resize-none px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[14px] leading-[1.7] placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand"
            />
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() => setAsPrayer((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                  asPrayer
                    ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300'
                    : 'bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-white/55'
                }`}
              >
                <HandHeartIcon size={13} /> 기도제목으로
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setContent('')
                  }}
                  className="px-3 py-2 text-[12.5px] font-semibold text-gray-400 dark:text-white/40"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createPost.isPending || !content.trim()}
                  className="px-4 py-2 rounded-full bg-brand text-white text-[12.5px] font-bold disabled:opacity-40 active:scale-95 transition-transform"
                >
                  {createPost.isPending ? '나누는 중...' : '나누기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 반응 요약 */}
      {reactionSummary.length > 0 && (
        <div className="mt-3 px-1 flex flex-wrap gap-x-3 gap-y-1">
          {reactionSummary.map((r) => {
            const meta = reactionMeta(r.reaction)
            const head = r.names.slice(0, 2).join(', ')
            const rest = r.count - Math.min(2, r.names.length)
            return (
              <p key={r.reaction} className="text-[12px] text-gray-500 dark:text-white/55">
                <ReactionGlyph reaction={r.reaction} size={12} className="inline-block -mt-px mr-1 align-middle text-brand" />
                <b className="text-gray-700 dark:text-white/75">{head}</b>
                {rest > 0 ? ` 외 ${rest}명` : ''}
                {r.count === 1 ? '님이' : '이'} {meta?.sentence}
              </p>
            )
          })}
        </div>
      )}

      {/* 글 목록 */}
      <div className="mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          ))
        ) : !feed || feed.items.length === 0 ? (
          <p className="text-center text-[13px] text-gray-400 dark:text-white/45 py-8 leading-[1.7]">
            <SproutIcon size={26} className="mx-auto mb-2 block text-gray-300 dark:text-white/25" />
            {dayInfo?.read_by_me
              ? '아직 나눈 묵상이 없어요. 위의 질문에 한 줄만 남겨보세요'
              : '본문을 읽고 나면 여기에 서로의 마음이 모여요'}
          </p>
        ) : (
          feed.items.map((post) => <PostCard key={post.id} post={post} roomAdmin={room.is_admin} />)
        )}
      </div>
    </section>
  )
}

// ── 글 카드 ──
const PostCard = ({ post, roomAdmin }: { post: RoomPost; roomAdmin: boolean }) => {
  const toggleLike = useToggleRoomPostLike(post.room_id)
  const deletePost = useDeleteRoomPost(post.room_id)
  const [showReplies, setShowReplies] = useState(false)

  const handleDelete = async () => {
    if (
      !(await confirmDialog({
        title: '글 삭제',
        message: '이 글을 삭제할까요?',
        description: '삭제된 내용은 복구할 수 없습니다.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deletePost.mutateAsync(post.id)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '삭제에 실패했습니다', 'error')
    }
  }

  return (
    <article className="p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm">
      <div className="flex items-center gap-2.5">
        <Avatar name={post.name} avatarUrl={post.avatar_url} size={34} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13.5px] font-bold text-ink-strong truncate">{post.name}</span>
            {post.post_type === 'prayer' && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-300 text-[10.5px] font-bold leading-none">
                <HandHeartIcon size={11} className="inline-block -mt-px mr-0.5 align-middle" />
                기도제목
              </span>
            )}
          </div>
          <span className="block text-[11px] text-gray-400 dark:text-white/40 mt-0.5">{timeAgo(post.created_at)}</span>
        </div>
        {(post.is_mine || roomAdmin) && (
          <button
            type="button"
            onClick={handleDelete}
            aria-label="삭제"
            className="shrink-0 text-gray-300 dark:text-white/30 hover:text-red-500 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      <AnimatedEmojiText
        content={post.content}
        className="text-[14px] leading-[1.75] text-gray-800 dark:text-white/85 mt-3 whitespace-pre-wrap break-words"
      />

      <div className="flex items-center gap-4 mt-3.5">
        <button
          type="button"
          onClick={() => toggleLike.mutate(post.id)}
          disabled={toggleLike.isPending}
          className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors ${
            post.liked_by_me ? 'text-rose-500' : 'text-gray-400 dark:text-white/45 hover:text-rose-400'
          }`}
        >
          <HeartIcon size={17} filled={post.liked_by_me} />
          {post.like_count > 0 ? post.like_count : '마음'}
        </button>
        <button
          type="button"
          onClick={() => setShowReplies((v) => !v)}
          className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors ${
            showReplies ? 'text-brand' : 'text-gray-400 dark:text-white/45 hover:text-brand'
          }`}
        >
          <CommentIcon size={17} />
          {post.reply_count > 0 ? post.reply_count : '댓글'}
        </button>
      </div>

      {showReplies && <Replies roomId={post.room_id} postId={post.id} roomAdmin={roomAdmin} />}
    </article>
  )
}

// ── 댓글 — 움직이는 이모티콘 지원 ──
const Replies = ({ roomId, postId, roomAdmin }: { roomId: number; postId: number; roomAdmin: boolean }) => {
  const { data: replies, isLoading } = useRoomReplies(roomId, postId)
  const createReply = useCreateRoomReply(roomId, postId)
  const deleteReply = useDeleteRoomReply(roomId, postId)
  const [text, setText] = useState('')
  const [stickers, setStickers] = useState(false)

  const handleSubmit = async () => {
    const content = text.trim()
    if (!content) return
    try {
      await createReply.mutateAsync(content)
      setText('')
      setStickers(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '댓글 작성에 실패했습니다', 'error')
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
      {isLoading ? (
        <p className="text-[12px] text-gray-400 dark:text-white/40 py-2">불러오는 중...</p>
      ) : (
        (replies ?? []).map((r) => (
          <div key={r.id} className="flex items-start gap-2 py-1.5">
            <Avatar name={r.name} avatarUrl={r.avatar_url} size={26} />
            <div className="flex-1 min-w-0">
              <span className="text-[12px] font-bold text-gray-800 dark:text-white/85 mr-1.5">{r.name}</span>
              <AnimatedEmojiText content={r.content} className="inline text-[13px] text-gray-700 dark:text-white/75 break-words" />
              <span className="block text-[10.5px] text-gray-400 dark:text-white/35 mt-0.5">{timeAgo(r.created_at)}</span>
            </div>
            {(r.is_mine || roomAdmin) && (
              <button
                type="button"
                onClick={() => deleteReply.mutate(r.id)}
                aria-label="댓글 삭제"
                className="shrink-0 text-[11px] text-gray-300 dark:text-white/25 hover:text-red-500"
              >
                삭제
              </button>
            )}
          </div>
        ))
      )}
      <div className="flex items-center gap-1.5 mt-2">
        <button
          type="button"
          onClick={() => setStickers((v) => !v)}
          aria-label="이모티콘"
          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[17px] transition-colors ${
            stickers ? 'bg-[var(--brand-soft)]' : 'bg-gray-50 dark:bg-white/[0.05]'
          }`}
        >
          😊
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSubmit()
          }}
          maxLength={1000}
          placeholder="따뜻한 한마디"
          className="flex-1 min-w-0 px-3.5 py-2 rounded-full bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[13px] focus:outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={createReply.isPending || !text.trim()}
          className="shrink-0 px-3.5 py-2 rounded-full bg-brand text-white text-[12px] font-bold disabled:opacity-40"
        >
          등록
        </button>
      </div>
      {stickers && (
        <EmojiPickerPanel
          className="mt-2"
          onSelect={(ch) => setText((t) => t + ch)}
          disabled={createReply.isPending}
        />
      )}
    </div>
  )
}

// ── 셸 — lg+ 는 본문 + 우측 레일 2단 ──
const Shell = ({
  onBack,
  title,
  actions,
  rail,
  children,
}: {
  onBack: () => void
  title: string
  actions?: ReactNode
  rail?: ReactNode
  children: ReactNode
}) => (
  <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
    <div className={rail ? 'lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12' : ''}>
      <div
        className={`max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-10 ${
          rail ? 'lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:min-h-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden' : ''
        }`}
      >
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button onClick={onBack} className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors" aria-label="뒤로">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="flex-1 min-w-0 text-base font-bold tracking-[-0.015em] text-ink-strong truncate">{title}</h1>
          {actions}
        </div>
        {children}
      </div>

      {rail && (
        <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">{rail}</aside>
      )}
    </div>
  </div>
)

export default RoomHome
