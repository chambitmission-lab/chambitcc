// 알림장 글 카드 — 공지/암송요절/일정/사진/투표 유형별 렌더링 + 확인·암송·RSVP·투표 액션
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CommentIcon } from '../../../components/icons/ActionIcons'
import {
  useCancelClassPostRsvp,
  useDeleteClassPost,
  useSetClassPostRsvp,
  useToggleClassPostCheck,
  useToggleClassPostRecite,
  useUpdateClassPost,
  useVoteClassPoll,
} from '../../../hooks/useClassRoom'
import type { ClassPost, RsvpStatus } from '../../../types/classRoom'
import { formatKstDateTime, formatRemaining, parseKstDate } from '../../../utils/kstTime'
import { showToast } from '../../../utils/toast'
import { Avatar, timeAgo } from '../classUi'
import {
  BallotIcon,
  CalendarIcon,
  CameraIcon,
  ClockIcon,
  EyeIcon,
  ImageIcon,
  MapPinIcon,
  MegaphoneIcon,
  OpenBookIcon,
  PinIcon,
  StarIcon,
  TargetIcon,
  type IconFn,
} from '../ClassIcons'
import VersePracticeSheet from './VersePracticeSheet'
import { confirmDialog } from '../../../utils/confirmDialog'

const TYPE_META: Record<string, { icon: IconFn; label: string; cls: string }> = {
  notice: { icon: MegaphoneIcon, label: '공지', cls: 'bg-[var(--brand-soft)] text-brand' },
  verse: { icon: OpenBookIcon, label: '암송요절', cls: 'bg-amber-400/15 text-amber-600 dark:text-amber-300' },
  event: { icon: CalendarIcon, label: '일정', cls: 'bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300' },
  photo: { icon: CameraIcon, label: '사진', cls: 'bg-violet-500/[0.12] text-violet-600 dark:text-violet-300' },
  poll: { icon: BallotIcon, label: '투표', cls: 'bg-sky-500/[0.12] text-sky-600 dark:text-sky-300' },
}

interface ClassPostCardProps {
  post: ClassPost
  isTeacher: boolean
  memberCount: number
  onOpenComments: (post: ClassPost) => void
  onOpenChecks: (post: ClassPost) => void
  onOpenRecitations: (post: ClassPost) => void
  onOpenRsvps: (post: ClassPost) => void
  onOpenPollDetail: (post: ClassPost) => void
}

const ClassPostCard = ({
  post,
  isTeacher,
  memberCount,
  onOpenComments,
  onOpenChecks,
  onOpenRecitations,
  onOpenRsvps,
  onOpenPollDetail,
}: ClassPostCardProps) => {
  const deletePost = useDeleteClassPost(post.class_id)
  const updatePost = useUpdateClassPost(post.class_id)
  const meta = TYPE_META[post.post_type] ?? TYPE_META.notice

  const handleDelete = async () => {
    if (
      !(await confirmDialog({
        title: '알림 삭제',
        message: '이 알림을 삭제할까요?',
        description: '삭제된 내용은 복구할 수 없습니다.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deletePost.mutateAsync(post.id)
      showToast('알림을 삭제했어요', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '삭제에 실패했습니다', 'error')
    }
  }

  const handleTogglePin = async () => {
    try {
      await updatePost.mutateAsync({
        postId: post.id,
        payload: { is_pinned: !post.is_pinned },
      })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '고정 변경에 실패했습니다', 'error')
    }
  }

  return (
    <article
      className={`p-4 rounded-2xl bg-white dark:bg-card-dark border shadow-sm ${
        post.is_pinned
          ? 'border-brand/40 dark:border-brand/40 ring-1 ring-[var(--brand-soft-strong)]'
          : 'border-gray-200/70 dark:border-white/[0.08]'
      }`}
    >
      {post.is_pinned && (
        <p className="flex items-center gap-1 text-[11px] font-bold text-brand mb-2">
          <PinIcon width={12} height={12} />
          고정된 알림
        </p>
      )}
      {post.is_scheduled && post.publish_at && (
        <p className="flex items-center gap-1 text-[11px] font-bold text-violet-600 dark:text-violet-300 mb-2">
          <ClockIcon width={12} height={12} className="shrink-0" />
          예약됨 · {formatKstDateTime(post.publish_at)}에 발행돼요 (선생님에게만 보여요)
        </p>
      )}

      {/* 작성자 헤더 */}
      <div className="flex items-center gap-2.5">
        <Avatar name={post.author_name} avatarUrl={post.author_avatar_url} size={34} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13.5px] font-bold text-ink-strong truncate">
              {post.author_name}
              {post.author_is_teacher && ' 선생님'}
            </span>
            <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold leading-none ${meta.cls}`}>
              <meta.icon width={10} height={10} />
              {meta.label}
            </span>
          </div>
          <span className="block text-[11px] text-gray-400 dark:text-white/40 mt-0.5">
            {timeAgo(post.created_at)}
            {post.updated_at && ' · 수정됨'}
          </span>
        </div>
        {isTeacher && (
          <div className="shrink-0 flex items-center gap-2.5">
            {post.post_type === 'notice' && (
              <button
                type="button"
                onClick={handleTogglePin}
                aria-label={post.is_pinned ? '고정 해제' : '상단 고정'}
                className={`text-[11.5px] font-semibold transition-colors ${
                  post.is_pinned ? 'text-brand' : 'text-gray-300 dark:text-white/30 hover:text-brand'
                }`}
              >
                <PinIcon width={15} height={15} />
              </button>
            )}
            {(post.is_mine || isTeacher) && (
              <button
                type="button"
                onClick={handleDelete}
                aria-label="삭제"
                className="text-gray-300 dark:text-white/30 hover:text-red-500 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 제목 + 본문 */}
      {post.title && (
        <h4 className="text-[15.5px] font-bold text-ink-strong mt-3 break-keep">{post.title}</h4>
      )}
      {post.content && (
        <p className={`text-[14px] leading-[1.75] text-gray-800 dark:text-white/85 whitespace-pre-wrap break-words ${post.title ? 'mt-1.5' : 'mt-3'}`}>
          {post.content}
        </p>
      )}

      {/* 유형별 블록 */}
      {post.post_type === 'verse' && post.verse && (
        <VerseSection
          post={post}
          memberCount={memberCount}
          onOpenRecitations={onOpenRecitations}
        />
      )}
      {post.post_type === 'event' && post.event && (
        <EventSection post={post} isTeacher={isTeacher} onOpenRsvps={onOpenRsvps} />
      )}
      {post.post_type === 'poll' && post.poll && (
        <PollSection
          post={post}
          isTeacher={isTeacher}
          onOpenPollDetail={onOpenPollDetail}
        />
      )}
      {post.photos.length > 0 && <PhotoGrid urls={post.photos} />}

      {/* 확인했어요 — 공지·암송요절·일정 공통 (사진·투표는 각자 반응이 따로) */}
      {post.post_type !== 'photo' && post.post_type !== 'poll' && (
        <CheckSection
          post={post}
          isTeacher={isTeacher}
          memberCount={memberCount}
          onOpenChecks={onOpenChecks}
        />
      )}

      {/* 댓글 */}
      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={() => onOpenComments(post)}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-400 dark:text-white/45 hover:text-brand transition-colors"
        >
          <CommentIcon size={17} />
          {post.comment_count > 0 ? `댓글 ${post.comment_count}` : '댓글 남기기'}
        </button>
        {post.post_type === 'photo' && post.check_count > 0 && (
          <span className="inline-flex items-center gap-1 text-[11.5px] text-gray-400 dark:text-white/40">
            <EyeIcon width={13} height={13} />
            {post.check_count}명이 봤어요
          </span>
        )}
      </div>
    </article>
  )
}

// ── 확인했어요 ──
const CheckSection = ({
  post,
  isTeacher,
  memberCount,
  onOpenChecks,
}: {
  post: ClassPost
  isTeacher: boolean
  memberCount: number
  onOpenChecks: (post: ClassPost) => void
}) => {
  const toggleCheck = useToggleClassPostCheck(post.class_id)
  // 작성자 본인을 뺀 인원이 확인 대상
  const targetCount = Math.max(0, memberCount - 1)

  return (
    <div className="mt-3.5 flex items-center justify-between gap-2">
      {post.is_mine ? (
        <span className="text-[12px] text-gray-400 dark:text-white/40">
          내가 쓴 알림이에요
        </span>
      ) : (
        <button
          type="button"
          onClick={() => toggleCheck.mutate(post.id)}
          disabled={toggleCheck.isPending}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12.5px] font-bold transition-all active:scale-95 ${
            post.checked_by_me
              ? 'bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300'
              : 'bg-brand text-white shadow-[0_4px_14px_-4px_var(--brand-glow)]'
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {post.checked_by_me ? '확인했어요' : '확인했어요!'}
        </button>
      )}
      {isTeacher ? (
        <button
          type="button"
          onClick={() => onOpenChecks(post)}
          className="text-[12px] font-bold text-brand hover:underline"
        >
          확인 {post.check_count}/{targetCount}명 →
        </button>
      ) : (
        post.check_count > 0 && (
          <span className="text-[11.5px] text-gray-400 dark:text-white/40">
            {post.check_count}명이 확인했어요
          </span>
        )
      )}
    </div>
  )
}

// ── 암송요절 ──
const VerseSection = ({
  post,
  memberCount,
  onOpenRecitations,
}: {
  post: ClassPost
  memberCount: number
  onOpenRecitations: (post: ClassPost) => void
}) => {
  const navigate = useNavigate()
  const toggleRecite = useToggleClassPostRecite(post.class_id)
  const [showPractice, setShowPractice] = useState(false)
  const verse = post.verse!
  // 작성자(선생님)를 뺀 인원이 암송 대상
  const targetCount = Math.max(1, memberCount - 1)
  const progress = Math.min(1, post.recite_count / targetCount)

  return (
    <div className="mt-3.5 rounded-2xl overflow-hidden border border-amber-200/60 dark:border-amber-300/20">
      <div className="px-4 py-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-400/[0.08] dark:to-orange-400/[0.05]">
        {verse.week_label && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 text-[10.5px] font-bold mb-2">
            {verse.week_label}
          </span>
        )}
        <p className="text-[15px] leading-[1.8] font-medium text-gray-800 dark:text-white/90 break-keep">
          “{verse.text}”
        </p>
        <p className="text-[12.5px] font-bold text-amber-700 dark:text-amber-300 mt-2 text-right">
          — {verse.reference}
        </p>
      </div>
      <div className="px-3 py-2.5 bg-white dark:bg-card-dark">
        {/* 우리 반 진행바 */}
        <button
          type="button"
          onClick={() => post.recite_count > 0 && onOpenRecitations(post)}
          className="w-full mb-2.5 text-left"
        >
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
              우리 반 암송 {post.recite_count}/{targetCount}명
              {progress >= 1 && ' 🎉 전원 완료!'}
            </span>
            {post.recite_count > 0 && (
              <span className="text-[10.5px] font-bold text-amber-600 dark:text-amber-300">
                누가 했나 →
              </span>
            )}
          </div>
          <div className="h-[6px] rounded-full bg-amber-100/80 dark:bg-amber-300/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-500"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </button>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowPractice(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500 text-white text-[12px] font-bold transition-all active:scale-95 shadow-[0_4px_12px_-4px_rgba(245,158,11,0.5)]"
            >
              <TargetIcon width={13} height={13} />
              외우기 연습
            </button>
            <button
              type="button"
              onClick={() => toggleRecite.mutate(post.id)}
              disabled={toggleRecite.isPending}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all active:scale-95 ${
                post.recited_by_me
                  ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
              }`}
            >
              <StarIcon width={13} height={13} className="shrink-0" />
              {post.recited_by_me ? '암송 완료!' : '암송했어요'}
            </button>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate('/bible/photo-verse', {
                state: { presetVerse: { text: verse.text, refLabel: verse.reference } },
              })
            }
            className="inline-flex items-center gap-1 text-[11.5px] font-bold text-brand hover:underline"
          >
            <ImageIcon width={13} height={13} />
            말씀카드
          </button>
        </div>
      </div>
      {showPractice && (
        <VersePracticeSheet post={post} onClose={() => setShowPractice(false)} />
      )}
    </div>
  )
}

// ── 투표 ──
const PollSection = ({
  post,
  isTeacher,
  onOpenPollDetail,
}: {
  post: ClassPost
  isTeacher: boolean
  onOpenPollDetail: (post: ClassPost) => void
}) => {
  const vote = useVoteClassPoll(post.class_id)
  const poll = post.poll!
  const maxCount = Math.max(1, ...poll.options.map((o) => o.vote_count))
  const iVoted = poll.options.some((o) => o.voted_by_me)

  const handleVote = async (optionId: number) => {
    const current = poll.options.filter((o) => o.voted_by_me).map((o) => o.id)
    let next: number[]
    if (poll.multiple) {
      next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
    } else {
      next = current.includes(optionId) ? [] : [optionId]
    }
    try {
      await vote.mutateAsync({ postId: post.id, optionIds: next })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '투표에 실패했습니다', 'error')
    }
  }

  return (
    <div className="mt-3.5 rounded-2xl border border-sky-200/60 dark:border-sky-300/20 overflow-hidden">
      <div className="px-3.5 py-3 bg-sky-50/70 dark:bg-sky-400/[0.06] space-y-1.5">
        {poll.options.map((opt) => {
          const ratio = opt.vote_count / maxCount
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleVote(opt.id)}
              disabled={vote.isPending}
              className={`relative w-full overflow-hidden rounded-xl border text-left transition-all active:scale-[0.99] ${
                opt.voted_by_me
                  ? 'border-sky-400 dark:border-sky-300/60 bg-white dark:bg-card-dark'
                  : 'border-sky-200/60 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03]'
              }`}
            >
              {/* 득표 게이지 */}
              {opt.vote_count > 0 && (
                <span
                  className="absolute inset-y-0 left-0 bg-sky-400/15 dark:bg-sky-300/10 transition-all duration-500"
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              )}
              <span className="relative flex items-center justify-between gap-2 px-3.5 py-2.5">
                <span
                  className={`text-[13px] font-semibold break-keep ${
                    opt.voted_by_me
                      ? 'text-sky-700 dark:text-sky-200'
                      : 'text-gray-700 dark:text-white/75'
                  }`}
                >
                  {opt.voted_by_me && '✓ '}
                  {opt.text}
                </span>
                <span className="shrink-0 text-[12px] font-bold text-sky-600 dark:text-sky-300 tabular-nums">
                  {opt.vote_count}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="px-3.5 py-2 bg-white dark:bg-card-dark flex items-center justify-between">
        <span className="text-[11.5px] text-gray-400 dark:text-white/40">
          {poll.total_voters}명 참여
          {poll.multiple && ' · 복수 선택'}
          {!iVoted && ' · 눌러서 투표'}
        </span>
        {isTeacher && (
          <button
            type="button"
            onClick={() => onOpenPollDetail(post)}
            className="text-[12px] font-bold text-sky-600 dark:text-sky-300 hover:underline"
          >
            누가 골랐는지 보기 →
          </button>
        )}
      </div>
    </div>
  )
}

// ── 일정 + RSVP ──
const RSVP_OPTIONS: { value: RsvpStatus; label: string; active: string }[] = [
  { value: 'attending', label: '✓ 참석', active: 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]' },
  { value: 'maybe', label: '? 부분참석', active: 'bg-amber-400 text-white' },
  { value: 'not_attending', label: '✗ 불참', active: 'bg-gray-500 text-white' },
]

const EventSection = ({
  post,
  isTeacher,
  onOpenRsvps,
}: {
  post: ClassPost
  isTeacher: boolean
  onOpenRsvps: (post: ClassPost) => void
}) => {
  const setRsvp = useSetClassPostRsvp(post.class_id)
  const cancelRsvp = useCancelClassPostRsvp(post.class_id)
  const event = post.event!

  // 마감 카운트다운 — 30초마다 갱신 (열어둔 화면에서 마감이 지나는 경우 대응)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!event.rsvp_deadline) return
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [event.rsvp_deadline])

  const deadlineAt = event.rsvp_deadline ? parseKstDate(event.rsvp_deadline).getTime() : null
  const isClosed = deadlineAt !== null && now >= deadlineAt
  const remaining = deadlineAt !== null ? formatRemaining(deadlineAt - now) : null
  // 마감 후에는 응답한 적 있는 사람만 변경 가능 (이벤트 RSVP와 동일한 규칙)
  const canRespond = !isClosed || event.my_status != null

  const handleRsvp = async (status: RsvpStatus) => {
    try {
      if (event.my_status === status) {
        if (
          isClosed &&
          !(await confirmDialog({
            title: '참석 응답 취소',
            message: '마감이 지났어요. 참석 응답을 취소할까요?',
            description: '취소 후에는 다시 응답하기 어려울 수 있어요.',
            confirmText: '취소하기',
            cancelText: '닫기',
            tone: 'warning',
            icon: 'event_busy',
          }))
        )
          return
        await cancelRsvp.mutateAsync(post.id)
      } else {
        await setRsvp.mutateAsync({ postId: post.id, status })
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : '참석 응답에 실패했습니다', 'error')
    }
  }

  const counts: Record<RsvpStatus, number> = {
    attending: event.attending_count,
    maybe: event.maybe_count,
    not_attending: event.not_attending_count,
  }

  return (
    <div className="mt-3.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-300/20 overflow-hidden">
      <div className="px-4 py-3.5 bg-emerald-50/70 dark:bg-emerald-400/[0.06] space-y-1">
        <p className="text-[13.5px] font-bold text-ink-strong">
          <CalendarIcon width={13} height={13} className="inline-block align-[-2px] mr-1" />
          {formatKstDateTime(event.start_at)}
          {event.end_at && ` ~ ${formatKstDateTime(event.end_at)}`}
        </p>
        {event.location && (
          <p className="text-[12.5px] text-gray-600 dark:text-white/60">
            <MapPinIcon width={12} height={12} className="inline-block align-[-1.5px] mr-1" />
            {event.location}
          </p>
        )}
        {event.rsvp_deadline && (
          <p className={`text-[12px] font-semibold ${isClosed ? 'text-gray-400 dark:text-white/40' : 'text-emerald-700 dark:text-emerald-300'}`}>
            <ClockIcon width={12} height={12} className="inline-block align-[-1.5px] mr-1" />
            {isClosed
              ? '참석 응답이 마감됐어요'
              : `${formatKstDateTime(event.rsvp_deadline)} 마감${remaining ? ` (${remaining} 남음)` : ''}`}
          </p>
        )}
      </div>
      <div className="px-3 py-2.5 bg-white dark:bg-card-dark">
        <div className="flex gap-1.5">
          {RSVP_OPTIONS.map((opt) => {
            const active = event.my_status === opt.value
            const disabled =
              setRsvp.isPending || cancelRsvp.isPending || (!canRespond && !active)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleRsvp(opt.value)}
                disabled={disabled}
                className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 disabled:opacity-40 ${
                  active
                    ? opt.active
                    : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
                }`}
              >
                {opt.label}
                {counts[opt.value] > 0 && (
                  <span className={active ? 'ml-1 opacity-90' : 'ml-1 text-brand'}>
                    {counts[opt.value]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {isTeacher && (
          <button
            type="button"
            onClick={() => onOpenRsvps(post)}
            className="mt-2 w-full text-center text-[12px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            참석 현황 자세히 보기 →
          </button>
        )}
      </div>
    </div>
  )
}

// ── 사진 그리드 + 라이트박스 ──
const PhotoGrid = ({ urls }: { urls: string[] }) => {
  const [viewer, setViewer] = useState<number | null>(null)

  return (
    <>
      <div className={`mt-3.5 grid gap-1.5 ${urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {urls.slice(0, 4).map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setViewer(i)}
            className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.05] active:scale-[0.98] transition-transform"
          >
            <img
              src={url}
              alt=""
              loading="lazy"
              className={`w-full object-cover ${urls.length === 1 ? 'max-h-80' : 'aspect-square'}`}
            />
            {i === 3 && urls.length > 4 && (
              <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[17px] font-bold">
                +{urls.length - 4}
              </span>
            )}
          </button>
        ))}
      </div>

      {viewer !== null && (
        <div
          className="fixed inset-0 z-[130] bg-black/90 flex flex-col items-center justify-center"
          onClick={() => setViewer(null)}
        >
          <img
            src={urls[viewer]}
            alt=""
            className="max-w-full max-h-[80vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex items-center gap-4 mt-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              disabled={viewer === 0}
              onClick={() => setViewer((v) => (v ?? 0) - 1)}
              className="px-4 py-2 rounded-full bg-white/15 text-white text-[13px] font-bold disabled:opacity-30"
            >
              이전
            </button>
            <span className="text-white/70 text-[12px] font-semibold">
              {viewer + 1} / {urls.length}
            </span>
            <button
              type="button"
              disabled={viewer === urls.length - 1}
              onClick={() => setViewer((v) => (v ?? 0) + 1)}
              className="px-4 py-2 rounded-full bg-white/15 text-white text-[13px] font-bold disabled:opacity-30"
            >
              다음
            </button>
          </div>
          <button
            type="button"
            onClick={() => setViewer(null)}
            aria-label="닫기"
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}

export default ClassPostCard
