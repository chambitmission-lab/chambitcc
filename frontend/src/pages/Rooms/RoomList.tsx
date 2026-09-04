// 공동 묵상방 목록 (/rooms)
// 내가 참여 중인 방 + 새 방 만들기 (본문 범위를 기간에 절 단위 자동 분배)
import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJoinRoom, useMyRooms } from '../../hooks/useMeditationRoom'
import type { RoomSummary } from '../../types/meditationRoom'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { CheckIcon, FlameIcon, PartyIcon, RoomGlyph } from './RoomIcons'
import { UsersIcon } from '../../components/icons/ActionIcons'
import { ROOM_COURSES, courseRangeLabel } from './roomCourses'

// 위저드는 만들 때만 필요 — 목록 진입 번들에서 뺀다
const CreateRoomWizard = lazy(() => import('./CreateRoomWizard'))

const RoomList = () => {
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const { data: rooms, isLoading } = useMyRooms(authed)
  // 우측 레일 요약 — 지금 진행 중인 방 수
  const activeCount = rooms?.filter((r) => r.status === 'active').length ?? 0
  const [showCreate, setShowCreate] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const joinRoom = useJoinRoom()

  const handleJoinByCode = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    try {
      const room = await joinRoom.mutateAsync(code)
      showToast('묵상방에 참여했어요!', 'success')
      navigate(`/rooms/${room.id}`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '참여에 실패했습니다', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 좁은 셸을 풀고 본문(내 묵상방) + 우측 레일(만들기·참여·요약) 2단 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-10 lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden lg:min-h-0">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button
            onClick={() => navigate('/bible')}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
            aria-label="성경으로"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">성경</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong mx-auto pr-10">
            공동 묵상방
          </h1>
        </div>

        {/* Hero — 브랜드 블루 그라데이션 (플랜 히어로와 같은 문법, 사진 없음) */}
        <section className="relative mx-4 mt-5 overflow-hidden rounded-[26px] px-6 py-8 bg-[linear-gradient(120deg,#0b1224_0%,#14306a_58%,#2563eb_125%)] ring-1 ring-white/[0.08] shadow-[0_10px_34px_-12px_rgba(0,0,0,0.55)]">
          {/* 우상단 브랜드 글로우 + 좌하단 잔광 — 사진이 있던 자리를 빛으로 채운다 */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(96,165,250,0.42),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_105%,rgba(49,130,246,0.28),transparent_52%)]" />

          <div className="relative z-10">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.34em] text-white/70">
              Together
            </span>
            <h2 className="text-[26px] font-extrabold tracking-[-0.02em] leading-[1.25] text-white mt-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              같은 말씀,
              <br />
              함께 묵상해요
            </h2>
            <p className="text-[13px] font-light leading-[1.7] text-white/80 mt-3 max-w-[16rem]">
              코스를 고르고 초대장을 보내면 끝. 매일 같은 본문을 읽고 한 줄씩
              마음을 나눠요.
            </p>
          </div>
        </section>

        {/* 만들기 / 코드 참여 — lg에선 우측 레일의 같은 액션이 대신한다 */}
        <section className="px-4 mt-5 space-y-3 lg:hidden">
          <button
            type="button"
            onClick={() => {
              if (!authed) {
                showToast('로그인이 필요합니다', 'error')
                navigate('/login')
                return
              }
              setShowCreate(true)
            }}
            className="w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] hover:-translate-y-0.5 transition-all"
          >
            + 새 묵상방 만들기
          </button>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="초대 코드로 참여 (예: AB12CD34)"
              maxLength={8}
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] text-[13px] font-semibold tracking-[0.08em] placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={handleJoinByCode}
              disabled={joinRoom.isPending || joinCode.trim().length < 4}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[var(--brand-soft)] text-brand text-[13px] font-bold disabled:opacity-40"
            >
              참여
            </button>
          </div>
        </section>

        {/* 내 방 목록 */}
        <section className="px-4 pt-8">
          <h3 className="text-[15px] font-extrabold text-ink-strong tracking-[-0.02em] mb-4 px-0.5">
            내 묵상방
          </h3>
          {!authed ? (
            <EmptyNote emoji="🔑" text="로그인하면 참여 중인 묵상방이 보여요" />
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : !rooms || rooms.length === 0 ? (
            <div>
              <EmptyNote emoji="🕊️" text="아직 참여 중인 방이 없어요. 코스 하나 골라 시작해볼까요?" />
              <div className="grid grid-cols-2 gap-2.5 -mt-4">
                {ROOM_COURSES.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="text-left p-3.5 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm hover:-translate-y-0.5 transition-all"
                  >
                    <span className="inline-flex w-8 h-8 rounded-xl bg-[var(--brand-soft)] text-brand items-center justify-center">
                      <RoomGlyph emoji={c.emoji} size={17} />
                    </span>
                    <p className="text-[13.5px] font-bold text-ink-strong mt-2 leading-[1.3] break-keep">{c.title}</p>
                    <p className="text-[11px] font-semibold text-brand mt-1">{courseRangeLabel(c)}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 lg:items-start">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} onClick={() => navigate(`/rooms/${room.id}`)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 우측 위젯 레일 (lg+) — 방 만들기·초대 코드 참여를 항상 손 닿는 곳에,
          본문은 방 카드에만 집중하게 한다 */}
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
        <section className="rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none">
          <button
            type="button"
            onClick={() => {
              if (!authed) {
                showToast('로그인이 필요합니다', 'error')
                navigate('/login')
                return
              }
              setShowCreate(true)
            }}
            className="w-full py-3 rounded-2xl bg-brand text-white text-[14px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] hover:-translate-y-0.5 transition-all"
          >
            + 새 묵상방 만들기
          </button>

          <p className="mt-4 mb-1.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
            초대 코드로 참여
          </p>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="예: AB12CD34"
              maxLength={8}
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-white dark:bg-[#15151d] border border-gray-200/70 dark:border-white/[0.08] text-[13px] font-semibold tracking-[0.08em] placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={handleJoinByCode}
              disabled={joinRoom.isPending || joinCode.trim().length < 4}
              className="shrink-0 px-3.5 py-2.5 rounded-xl bg-[var(--brand-soft)] text-brand text-[13px] font-bold disabled:opacity-40"
            >
              참여
            </button>
          </div>
        </section>

        {authed && rooms && rooms.length > 0 && (
          <section className="rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none">
            <p className="mb-2.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
              한눈에
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
                  참여 중인 방
                </span>
                <span className="text-[16px] font-bold text-ink-strong tabular-nums">
                  {rooms.length}
                </span>
              </div>
              {activeCount > 0 && (
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
                    진행 중
                  </span>
                  <span className="text-[16px] font-bold text-brand tabular-nums">
                    {activeCount}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}
      </aside>
      </div>

      {showCreate && (
        <Suspense fallback={null}>
          <CreateRoomWizard onClose={() => setShowCreate(false)} />
        </Suspense>
      )}
    </div>
  )
}

const EmptyNote = ({ emoji, text }: { emoji: string; text: string }) => (
  <div className="text-center py-12 px-6">
    <span className="mx-auto mb-3 block w-fit text-gray-300 dark:text-white/25">
      <RoomGlyph emoji={emoji} size={38} />
    </span>
    <p className="text-[13px] text-gray-500 dark:text-white/55">{text}</p>
  </div>
)

const STATUS_META: Record<string, { label: string; cls: string }> = {
  upcoming: { label: '시작 전', cls: 'bg-amber-400/15 text-amber-600 dark:text-amber-300' },
  active: { label: '진행 중', cls: 'bg-[var(--brand-soft)] text-brand' },
  finished: { label: '마침', cls: 'bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300' },
}

const RoomCard = ({ room, onClick }: { room: RoomSummary; onClick: () => void }) => {
  const meta = STATUS_META[room.status] ?? STATUS_META.active
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.985]"
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-11 h-11 rounded-2xl bg-[var(--brand-soft)] text-brand flex items-center justify-center">
          <RoomGlyph emoji={room.emoji} size={22} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="flex-1 min-w-0 text-[15px] font-bold text-ink-strong truncate">
              {room.title}
            </h4>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold leading-none ${meta.cls}`}>
              {meta.label}
            </span>
          </div>
          <p className="text-[12px] text-gray-400 dark:text-white/45 mt-1">
            <UsersIcon size={12} className="inline-block -mt-px mr-1 align-middle" />
            {room.member_count}명 ·{' '}
            {room.status === 'upcoming'
              ? `${room.start_date}부터 ${room.total_days}일`
              : `${room.current_day}/${room.total_days}일차`}
            {room.my_read_count >= room.total_days ? (
              <span className="ml-1.5 font-bold text-emerald-600 dark:text-emerald-300">
                <PartyIcon size={11} className="inline-block -mt-px mr-0.5 align-middle" />
                내 몫 완주
              </span>
            ) : (
              room.my_read_count > 0 && (
                <span className="ml-1.5 font-semibold text-brand">
                  <CheckIcon size={10} className="inline-block -mt-px mr-0.5 align-middle" />
                  내 여정 {room.my_read_count}/{room.total_days}
                </span>
              )
            )}
          </p>
          {room.today_reference && room.status === 'active' && (
            <p className="text-[12px] font-semibold mt-1 truncate">
              {room.today_read_by_me ? (
                <span className="text-emerald-600 dark:text-emerald-300">
                  <CheckIcon size={11} className="inline-block -mt-px mr-0.5 align-middle" />
                  오늘 읽음 · {room.today_reference}
                </span>
              ) : (
                <span className="text-brand">오늘 · {room.today_reference}</span>
              )}
            </p>
          )}
          {room.status === 'active' && ((room.today_read_count ?? 0) > 0 || (room.group_streak ?? 0) > 0) && (
            <p className="text-[11.5px] text-gray-400 dark:text-white/45 mt-1 flex items-center gap-2">
              {(room.today_read_count ?? 0) > 0 && (
                <span>오늘 {room.today_read_count}/{room.member_count}명 읽음</span>
              )}
              {(room.group_streak ?? 0) > 0 && (
                <span className="inline-flex items-center gap-0.5 text-orange-500 font-bold">
                  <FlameIcon size={11} /> 전원 {room.group_streak}일째
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

export default RoomList
