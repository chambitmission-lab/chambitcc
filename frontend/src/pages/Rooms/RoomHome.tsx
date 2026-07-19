// 공동 묵상방 홈 (/rooms/:roomId)
// 멤버 아바타 · 초대 링크 공유 · 일차별 본문 · 묵상/기도제목 피드(좋아요·댓글)
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useCreateRoomPost,
  useCreateRoomReply,
  useDeleteRoomPost,
  useDeleteRoomReply,
  useLeaveRoom,
  useMarkRoomDayRead,
  useRoom,
  useRoomPosts,
  useRoomReplies,
  useToggleRoomPostLike,
} from '../../hooks/useMeditationRoom'
import type { RoomDetail, RoomMember, RoomPost, RoomPostType } from '../../types/meditationRoom'
import { CommentIcon, HeartIcon } from '../../components/icons/ActionIcons'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  return `${Math.floor(hr / 24)}일 전`
}

const inviteUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/join/${code}`

const RoomHome = () => {
  const navigate = useNavigate()
  const { roomId } = useParams<{ roomId: string }>()
  const id = Number(roomId)

  const { data: room, isLoading, error } = useRoom(id, isAuthenticated())
  const leaveRoom = useLeaveRoom()
  const markDayRead = useMarkRoomDayRead(id)

  // 선택 일차 — 기본은 오늘 일차 (시작 전이면 1일차)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const day = selectedDay ?? Math.max(1, room?.current_day ?? 1)
  const dayInfo = room?.days.find((d) => d.day_number === day)

  // 일차 칩을 현재 일차로 자동 스크롤
  const dayChipsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!room || selectedDay !== null) return
    const el = dayChipsRef.current?.querySelector(`[data-day="${day}"]`)
    el?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [room, day, selectedDay])

  useEffect(() => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', `/rooms/${id}`)
      navigate('/login')
    }
  }, [id, navigate])

  const handleShare = async () => {
    if (!room?.invite_code) return
    const url = inviteUrl(room.invite_code)
    const text = `📖 '${room.title}' 공동 묵상에 초대해요!\n${room.total_days}일 동안 매일 같은 본문을 읽고 묵상을 나눠요.\n\n${url}\n\n앱을 설치했다면 [공동 묵상방 → 초대 코드로 참여]에 코드 ${room.invite_code} 를 입력해도 돼요.`
    if (navigator.share) {
      try {
        await navigator.share({ title: room.title, text, url })
        return
      } catch {
        /* 사용자가 취소 — 폴백 없이 종료 */
        return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      showToast('초대 링크를 복사했어요. 카톡에 붙여넣어 보내주세요!', 'success')
    } catch {
      showToast('복사에 실패했어요. 초대 코드를 직접 알려주세요: ' + room.invite_code, 'error')
    }
  }

  const handleLeave = async () => {
    if (!confirm('이 묵상방을 나가시겠어요?')) return
    try {
      await leaveRoom.mutateAsync(id)
      showToast('묵상방을 나왔어요', 'success')
      navigate('/rooms')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'error')
    }
  }

  const handleReadPassage = () => {
    const first = dayInfo?.passages[0]
    if (!first) return
    // 본문 읽기 진입 = 그 일차 읽음 처리 (멱등, 실패해도 읽기 흐름은 방해하지 않음)
    if (dayInfo && !dayInfo.read_by_me) {
      markDayRead.mutate(dayInfo.day_number)
    }
    const verse = first.verse_start ? `?verse=${first.verse_start}` : ''
    navigate(`/bible/${first.book_number}/${first.chapter_start}${verse}`)
  }

  if (isLoading || !room) {
    return (
      <Shell onBack={() => navigate('/rooms')} title="공동 묵상방">
        {error ? (
          <div className="text-center py-16 px-6">
            <span className="text-4xl block mb-3">🔒</span>
            <p className="text-[13px] text-gray-500 dark:text-white/55">
              {error instanceof Error ? error.message : '묵상방을 불러오지 못했습니다'}
            </p>
          </div>
        ) : (
          <div className="px-4 pt-4 space-y-3">
            <div className="h-36 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
            <div className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          </div>
        )}
      </Shell>
    )
  }

  return (
    <Shell
      onBack={() => navigate('/rooms')}
      title={room.title}
      actions={
        <button
          type="button"
          onClick={handleLeave}
          className="text-[12px] font-semibold text-gray-400 dark:text-white/40 hover:text-red-500"
        >
          나가기
        </button>
      }
    >
      {/* 방 헤더 */}
      <section className="relative overflow-hidden rounded-3xl mx-4 mt-4 p-5 border border-blue-200/60 dark:border-white/[0.08] bg-gradient-to-br from-blue-50 to-sky-50 dark:from-[#172554]/60 dark:to-[#1e3a8a]/35">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-12 h-12 rounded-2xl bg-white/70 dark:bg-white/[0.08] flex items-center justify-center text-[24px]">
            {room.emoji || '🕊️'}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap text-[10.5px] font-bold tracking-[0.08em] text-blue-600 dark:text-blue-300">
              {room.status === 'upcoming'
                ? `${room.start_date} 시작`
                : room.status === 'finished'
                  ? '여정 마침 🎉'
                  : `${room.current_day} / ${room.total_days}일차 진행 중`}
            </div>
            <h2 className="text-[19px] font-bold tracking-[-0.015em] leading-[1.3] text-gray-900 dark:text-white mt-0.5 break-keep">
              {room.title}
            </h2>
            {room.description && (
              <p className="text-[12.5px] text-gray-600 dark:text-white/65 mt-1">{room.description}</p>
            )}
          </div>
        </div>

        {/* 내 여정 — 방 상태(날짜 기준)와 별개인 개인 진행률.
            "읽었는데 왜 계속 진행 중?"의 답을 화면에서 바로 준다 */}
        <div className="mt-4">
          {room.my_read_count >= room.total_days ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/[0.12]">
              <span className="text-[15px]">🎉</span>
              <span className="text-[12.5px] font-bold text-emerald-600 dark:text-emerald-300">
                내 몫 완주! {room.total_days}일치 본문을 모두 읽었어요
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[11.5px] font-semibold mb-1.5">
                <span className="text-gray-500 dark:text-white/55">내 여정</span>
                <span className="text-brand">
                  ✓ {room.my_read_count} / {room.total_days}일 읽음
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/70 dark:bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((room.my_read_count / Math.max(1, room.total_days)) * 100))}%`,
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* 참여자 */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {room.members.slice(0, 6).map((m) => (
                <MemberAvatar key={m.user_id} member={m} />
              ))}
            </div>
            <span className="ml-2.5 text-[12px] font-semibold text-gray-500 dark:text-white/55">
              {room.member_count}명 함께
            </span>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-brand text-white text-[12px] font-bold shadow-[0_4px_14px_-4px_var(--brand-glow)] active:scale-95 transition-transform"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            초대하기
          </button>
        </div>
      </section>

      {/* 일차 선택 칩 */}
      <div
        ref={dayChipsRef}
        className="flex gap-2 overflow-x-auto px-4 pt-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {room.days.map((d) => {
          const active = d.day_number === day
          const isToday = d.day_number === room.current_day
          return (
            <button
              key={d.day_number}
              type="button"
              data-day={d.day_number}
              onClick={() => setSelectedDay(d.day_number)}
              className={`relative shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                active
                  ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
              }`}
            >
              {d.read_by_me && <span className="mr-0.5">✓</span>}
              {d.day_number}일차
              {d.post_count > 0 && (
                <span className={`ml-1 text-[10px] ${active ? 'text-white/80' : 'text-brand'}`}>
                  {d.post_count}
                </span>
              )}
              {isToday && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-background-light dark:ring-background-dark" />
              )}
            </button>
          )
        })}
      </div>

      {/* 오늘 본문 카드 */}
      <section className="mx-4 mt-3 p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-400 dark:text-white/45">
              {day}일차 본문{dayInfo?.date ? ` · ${dayInfo.date}` : ''}
            </p>
            <p className="text-[15px] font-bold text-gray-900 dark:text-white mt-0.5 truncate">
              📖 {dayInfo?.title ?? '본문 없음'}
            </p>
          </div>
          {dayInfo?.read_by_me ? (
            <button
              type="button"
              onClick={handleReadPassage}
              className="shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300 text-[12px] font-bold active:scale-95 transition-transform"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              읽었어요
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReadPassage}
              className="shrink-0 px-3.5 py-2 rounded-full bg-brand text-white text-[12px] font-bold shadow-[0_4px_14px_-4px_var(--brand-glow)] active:scale-95 transition-transform"
            >
              본문 읽기
            </button>
          )}
        </div>
        {(dayInfo?.read_count ?? 0) > 0 && (
          <p className="text-[11.5px] text-gray-400 dark:text-white/45 mt-2">
            👀 {dayInfo!.read_count}명이 이 본문을 읽었어요
          </p>
        )}
      </section>

      {/* 작성 + 피드 */}
      <DayFeed room={room} day={day} />
    </Shell>
  )
}

// ── 피드 ──
const DayFeed = ({ room, day }: { room: RoomDetail; day: number }) => {
  const { data: feed, isLoading } = useRoomPosts(room.id, day)
  const createPost = useCreateRoomPost(room.id)
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<RoomPostType>('meditation')

  const handleSubmit = async () => {
    const text = content.trim()
    if (!text) return
    try {
      await createPost.mutateAsync({ dayNumber: day, postType, content: text })
      setContent('')
      showToast(postType === 'meditation' ? '묵상을 나눴어요 🕊️' : '기도제목을 나눴어요 🙏', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '작성에 실패했습니다', 'error')
    }
  }

  return (
    <section className="px-4 pt-5 pb-8">
      {/* 컴포저 */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm">
        <div className="flex gap-1.5 mb-2.5">
          {(
            [
              ['meditation', '🕊️ 묵상'],
              ['prayer', '🙏 기도제목'],
            ] as [RoomPostType, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => setPostType(t)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                postType === t
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-white/55'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={3000}
          placeholder={
            postType === 'meditation'
              ? `${day}일차 본문을 읽고 받은 은혜를 나눠보세요`
              : '함께 기도했으면 하는 제목을 나눠보세요'
          }
          className="w-full resize-none bg-transparent text-[14px] leading-[1.7] placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none"
        />
        <div className="flex justify-end">
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

      {/* 글 목록 */}
      <div className="mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          ))
        ) : !feed || feed.items.length === 0 ? (
          <p className="text-center text-[13px] text-gray-400 dark:text-white/45 py-10">
            아직 나눈 묵상이 없어요. 첫 마음을 나눠보세요 🌱
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
    if (!confirm('이 글을 삭제할까요?')) return
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
            <span className="text-[13.5px] font-bold text-gray-900 dark:text-white truncate">
              {post.name}
            </span>
            {post.post_type === 'prayer' && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-300 text-[10.5px] font-bold leading-none">
                🙏 기도제목
              </span>
            )}
          </div>
          <span className="block text-[11px] text-gray-400 dark:text-white/40 mt-0.5">
            {timeAgo(post.created_at)}
          </span>
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

      <p className="text-[14px] leading-[1.75] text-gray-800 dark:text-white/85 mt-3 whitespace-pre-wrap break-words">
        {post.content}
      </p>

      {/* 액션 */}
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
          {post.like_count > 0 ? post.like_count : '좋아요'}
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

// ── 댓글 ──
const Replies = ({
  roomId,
  postId,
  roomAdmin,
}: {
  roomId: number
  postId: number
  roomAdmin: boolean
}) => {
  const { data: replies, isLoading } = useRoomReplies(roomId, postId)
  const createReply = useCreateRoomReply(roomId, postId)
  const deleteReply = useDeleteRoomReply(roomId, postId)
  const [text, setText] = useState('')

  const handleSubmit = async () => {
    const content = text.trim()
    if (!content) return
    try {
      await createReply.mutateAsync(content)
      setText('')
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
              <span className="text-[12px] font-bold text-gray-800 dark:text-white/85 mr-1.5">
                {r.name}
              </span>
              <span className="text-[13px] text-gray-700 dark:text-white/75 break-words">
                {r.content}
              </span>
              <span className="block text-[10.5px] text-gray-400 dark:text-white/35 mt-0.5">
                {timeAgo(r.created_at)}
              </span>
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
      <div className="flex items-center gap-2 mt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSubmit()
          }}
          maxLength={1000}
          placeholder="따뜻한 댓글을 남겨보세요"
          className="flex-1 px-3.5 py-2 rounded-full bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[13px] focus:outline-none focus:border-brand"
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
    </div>
  )
}

// ── 공용 소품 ──
const AVATAR_COLORS = ['#3182f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0ea5e9']

export const Avatar = ({
  name,
  avatarUrl,
  size,
}: {
  name: string
  avatarUrl?: string | null
  size: number
}) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-card-dark"
      />
    )
  }
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
  return (
    <span
      style={{ width: size, height: size, backgroundColor: `${color}22`, color }}
      className="shrink-0 rounded-full flex items-center justify-center text-[12px] font-extrabold ring-2 ring-white dark:ring-card-dark"
    >
      {name.slice(0, 1)}
    </span>
  )
}

const MemberAvatar = ({ member }: { member: RoomMember }) => (
  <span title={member.name} className="inline-block">
    <Avatar name={member.name} avatarUrl={member.avatar_url} size={30} />
  </span>
)

const Shell = ({
  onBack,
  title,
  actions,
  children,
}: {
  onBack: () => void
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
    <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-10">
      <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
          aria-label="뒤로"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="flex-1 min-w-0 text-base font-bold tracking-[-0.015em] text-gray-900 dark:text-white truncate">
          {title}
        </h1>
        {actions}
      </div>
      {children}
    </div>
  </div>
)

export default RoomHome
