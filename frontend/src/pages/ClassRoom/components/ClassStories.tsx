// 주간 매거진 스토리 — 안 본·아직 응답 안 한 소식을 링으로, 누르면 한 장씩 전체 화면으로 넘겨 본다.
// 링 색: 아직 볼/할 것 = 브랜드 그라데이션, 본 것 = 회색. 화면 왼쪽 ⅓ 탭 = 이전, 나머지 = 다음.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { ClassPost, ClassPostType } from '../../../types/classRoom'
import { formatKstDateTime, toKstCalendarDate } from '../../../utils/kstTime'
import { Avatar, timeAgo } from '../classUi'
import { responseTarget, thisWeekKey, toStampSlot, weekKeyOf } from '../classWeek'
import { BallotIcon, CalendarIcon, CameraIcon, MapPinIcon, MegaphoneIcon, OpenBookIcon, type IconFn } from '../ClassIcons'
import { CheckButton, PollOptions, RsvpButtons, VerseButtons } from './IssueActions'

const KIND: Record<ClassPostType, { icon: IconFn; label: string; tint: string; bg: string }> = {
  notice: { icon: MegaphoneIcon, label: '공지', tint: 'text-emerald-600 dark:text-emerald-300', bg: 'linear-gradient(160deg,#0f3d33 0%,#081f1b 100%)' },
  verse: { icon: OpenBookIcon, label: '암송', tint: 'text-amber-600 dark:text-amber-300', bg: 'linear-gradient(160deg,#3b2a0c 0%,#120c04 100%)' },
  event: { icon: CalendarIcon, label: '일정', tint: 'text-brand', bg: 'linear-gradient(160deg,#0b2a5c 0%,#050f24 100%)' },
  photo: { icon: CameraIcon, label: '사진', tint: 'text-rose-500 dark:text-rose-300', bg: '#05070c' },
  poll: { icon: BallotIcon, label: '투표', tint: 'text-sky-600 dark:text-sky-300', bg: 'linear-gradient(160deg,#0c3550 0%,#04121d 100%)' },
}

interface Props {
  posts: ClassPost[]
  seen: Set<number>
  isTeacher: boolean
  memberCount: number
  onSeen: (postId: number) => void
  onOpenStatus: (post: ClassPost) => void
  onPractice: (post: ClassPost) => void
  onJump: (post: ClassPost) => void
}

const ClassStories = ({ posts, seen, isTeacher, memberCount, onSeen, onOpenStatus, onPractice, onJump }: Props) => {
  const [openAt, setOpenAt] = useState<number | null>(null)
  if (posts.length === 0) return null
  const nowKey = thisWeekKey()

  return (
    <>
      <div className="flex gap-3.5 overflow-x-auto px-4 pt-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {posts.map((post, i) => {
          const k = KIND[post.post_type] ?? KIND.notice
          const isSeen = seen.has(post.id)
          return (
            <button
              key={post.id}
              type="button"
              onClick={() => setOpenAt(i)}
              className="shrink-0 w-[66px] flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <span
                className={`w-[64px] h-[64px] rounded-full p-[2.5px] ${
                  isSeen ? 'bg-gray-200 dark:bg-white/[0.12]' : 'bg-[conic-gradient(from_200deg,#3182f6,#7cc0ff,#ffb547,#3182f6)]'
                }`}
              >
                <span className="w-full h-full rounded-full p-[2.5px] bg-background-light dark:bg-background-dark block">
                  {post.photos[0] ? (
                    <img src={post.photos[0]} alt="" loading="lazy" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className={`w-full h-full rounded-full grid place-items-center bg-white dark:bg-card-dark ${k.tint}`}>
                      <k.icon width={24} height={24} />
                    </span>
                  )}
                </span>
              </span>
              <span className={`text-[11.5px] font-bold truncate max-w-full ${isSeen ? 'text-gray-400 dark:text-white/40' : 'text-ink-strong'}`}>
                {weekKeyOf(post) === nowKey ? k.label : `지난 ${k.label}`}
              </span>
            </button>
          )
        })}
      </div>

      {openAt !== null && posts[openAt] && (
        <StoryViewer
          posts={posts}
          index={openAt}
          isTeacher={isTeacher}
          memberCount={memberCount}
          onIndex={setOpenAt}
          onClose={() => setOpenAt(null)}
          onSeen={onSeen}
          onOpenStatus={(p) => {
            setOpenAt(null)
            onOpenStatus(p)
          }}
          onPractice={onPractice}
          onJump={(p) => {
            setOpenAt(null)
            onJump(p)
          }}
        />
      )}
    </>
  )
}

const StoryViewer = ({
  posts,
  index,
  isTeacher,
  memberCount,
  onIndex,
  onClose,
  onSeen,
  onOpenStatus,
  onPractice,
  onJump,
}: {
  posts: ClassPost[]
  index: number
  isTeacher: boolean
  memberCount: number
  onIndex: (i: number) => void
  onClose: () => void
  onSeen: (postId: number) => void
  onOpenStatus: (post: ClassPost) => void
  onPractice: (post: ClassPost) => void
  onJump: (post: ClassPost) => void
}) => {
  useModalBackButton(onClose)
  useBodyScrollLock(true)
  const post = posts[index]
  const k = KIND[post.post_type] ?? KIND.notice
  const slot = toStampSlot(post, memberCount)
  const target = responseTarget(memberCount)

  useEffect(() => {
    onSeen(post.id)
  }, [post.id, onSeen])

  const next = () => (index < posts.length - 1 ? onIndex(index + 1) : onClose())
  const prev = () => index > 0 && onIndex(index - 1)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // 버튼이 아닌 곳을 탭하면 넘긴다
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return
    const rect = e.currentTarget.getBoundingClientRect()
    if (e.clientX - rect.left < rect.width / 3) prev()
    else next()
  }

  const heading = post.title || (post.content || '').split('\n')[0]
  const rest = post.title ? post.content : (post.content || '').split('\n').slice(1).join('\n').trim()

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-center bg-black" role="dialog" aria-modal="true" aria-label="반 소식 보기">
      <div
        className="relative w-full max-w-[480px] h-full flex flex-col text-white select-none"
        style={{ background: k.bg }}
        onClick={handleTap}
      >
        {post.post_type === 'photo' && post.photos[0] && (
          <>
            <img src={post.photos[0]} alt="" className="absolute inset-0 w-full h-full object-contain" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,transparent_22%,transparent_55%,rgba(0,0,0,0.75)_100%)]" />
          </>
        )}

        {/* 진행 막대 + 머리 */}
        <div className="relative px-4 pt-[max(14px,env(safe-area-inset-top))]">
          <div className="flex gap-1">
            {posts.map((p, i) => (
              <span key={p.id} className={`flex-1 h-[3px] rounded-full ${i <= index ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar name={post.author_name} avatarUrl={post.author_avatar_url} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-bold truncate">
                {post.author_name}
                {post.author_is_teacher && ' 선생님'}
              </span>
              <span className="block text-[11.5px] text-white/60">
                {k.label} · {timeAgo(post.created_at)}
              </span>
            </span>
            <button type="button" onClick={onClose} aria-label="닫기" className="w-10 h-10 grid place-items-center rounded-full hover:bg-white/10">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="relative flex-1 min-h-0 overflow-y-auto px-6 flex flex-col justify-center [scrollbar-width:none]">
          {post.post_type === 'verse' && post.verse ? (
            <>
              <span className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[12px] font-bold">
                <OpenBookIcon width={12} height={12} />
                {weekKeyOf(post) === thisWeekKey() ? '이번 주 암송' : '지난 암송'}
                {post.verse.week_label && ` · ${post.verse.week_label}`}
              </span>
              <p className="font-serif-kr mt-4 text-[30px] font-bold leading-[1.5] break-keep">“{post.verse.text}”</p>
              <p className="mt-3 text-[14px] font-bold text-white/70">{post.verse.reference}</p>
            </>
          ) : post.post_type === 'photo' ? (
            <div className="flex-1" />
          ) : (
            <>
              <span className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[12px] font-bold">
                <k.icon width={12} height={12} />
                {k.label}
              </span>
              {heading && <h3 className="mt-4 text-[27px] font-extrabold leading-[1.4] tracking-[-0.02em] break-keep">{heading}</h3>}
              {rest && <p className="mt-3 text-[15.5px] leading-[1.75] text-white/80 whitespace-pre-wrap break-words line-clamp-[8]">{rest}</p>}
              {post.post_type === 'event' && post.event && (
                <div className="mt-5 rounded-2xl bg-white/10 px-4 py-3.5">
                  <p className="text-[16px] font-bold">
                    <CalendarIcon width={15} height={15} className="inline-block align-[-2px] mr-1.5" />
                    {formatKstDateTime(post.event.start_at)}
                  </p>
                  {post.event.location && (
                    <p className="mt-1 text-[13.5px] text-white/70">
                      <MapPinIcon width={13} height={13} className="inline-block align-[-2px] mr-1.5" />
                      {post.event.location}
                    </p>
                  )}
                  <p className="mt-1 text-[12.5px] text-white/55">
                    {toKstCalendarDate(post.event.start_at).getMonth() + 1}월 {toKstCalendarDate(post.event.start_at).getDate()}일 · 참석 {post.event.attending_count}
                  </p>
                </div>
              )}
              {post.post_type === 'poll' && post.poll && (
                <div className="mt-5">
                  <PollOptions post={post} onDark isTeacher={isTeacher} />
                </div>
              )}
            </>
          )}
        </div>

        {/* 응답 */}
        <div className="relative px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] space-y-2.5">
          {post.post_type === 'photo' && (heading || rest) && (
            <p className="text-[14.5px] leading-[1.6] text-white/90 line-clamp-3">{post.title || post.content}</p>
          )}
          {isTeacher ? (
            slot && (
              <button
                type="button"
                onClick={() => onOpenStatus(post)}
                className="w-full h-[50px] rounded-2xl bg-white text-[#191f28] text-[15px] font-bold"
              >
                {slot.classDone}/{target}명 응답 · 현황과 다시 알리기
              </button>
            )
          ) : (
            !post.is_mine && (
              <>
                {post.post_type === 'notice' && <CheckButton post={post} onDark />}
                {post.post_type === 'verse' && post.verse && <VerseButtons post={post} onPractice={onPractice} onDark />}
                {post.post_type === 'event' && post.event && <RsvpButtons post={post} onDark />}
              </>
            )
          )}
          <button
            type="button"
            onClick={() => onJump(post)}
            className="w-full py-2 text-center text-[12.5px] font-bold text-white/60 hover:text-white"
          >
            알림장에서 자세히 보기 · 댓글 {post.comment_count}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ClassStories
