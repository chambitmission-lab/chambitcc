import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLeaveRoom, useRoom } from '../../hooks/useMeditationRoom'
import { isAuthenticated } from '../../utils/auth'
import { confirmDialog } from '../../utils/confirmDialog'
import { showToast } from '../../utils/toast'
import CompletionSheet from './CompletionSheet'
import InviteSheet from './InviteSheet'
import RoomSettingsSheet from './RoomSettingsSheet'
import { MoreIcon, UserPlusIcon } from './RoomIcons'
import { Shell } from './components/RoomShell'
import { RoomCard } from './components/RoomCard'
import { MembersRail } from './components/MembersRail'
import { DayStrip } from './components/DayStrip'
import { TodayCard } from './components/TodayCard'
import { DayFeed } from './components/DayFeed'

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

export default RoomHome
