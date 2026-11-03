// 주간 매거진 응답 버튼 — 확인·암송·참석·투표.
// 같은 버튼을 꼭지(밝은 면)와 스토리 보기(어두운 면) 두 곳에서 쓴다 → onDark 로 색만 바꾼다.
import { useTickingNow } from '../../../hooks/useTickingNow'
import {
  useCancelClassPostRsvp,
  useSetClassPostRsvp,
  useToggleClassPostCheck,
  useToggleClassPostRecite,
  useVoteClassPoll,
} from '../../../hooks/useClassRoom'
import type { ClassPost, RsvpStatus } from '../../../types/classRoom'
import { confirmDialog } from '../../../utils/confirmDialog'
import { formatKstDateTime, formatRemaining, parseKstDate } from '../../../utils/kstTime'
import { showToast } from '../../../utils/toast'
import { StarIcon, TargetIcon } from '../ClassIcons'

const CheckGlyph = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const BIG = 'h-[50px] rounded-2xl text-[15px] font-bold inline-flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-50'

// ── 공지 확인 ──
export const CheckButton = ({ post, onDark = false }: { post: ClassPost; onDark?: boolean }) => {
  const toggle = useToggleClassPostCheck(post.class_id)
  const done = post.checked_by_me
  return (
    <button
      type="button"
      onClick={() => toggle.mutate(post.id)}
      disabled={toggle.isPending}
      className={`${BIG} w-full ${
        done
          ? onDark
            ? 'bg-white/15 text-white'
            : 'bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300'
          : onDark
            ? 'bg-white text-[#191f28]'
            : 'bg-[#191f28] text-white dark:bg-white dark:text-[#191f28]'
      }`}
    >
      <CheckGlyph />
      {done ? '확인했어요' : '확인했어요, 선생님'}
    </button>
  )
}

// ── 암송: 연습 + 다 외웠어요 ──
export const VerseButtons = ({
  post,
  onPractice,
  onDark = true,
}: {
  post: ClassPost
  onPractice: (post: ClassPost) => void
  onDark?: boolean
}) => {
  const toggle = useToggleClassPostRecite(post.class_id)
  const done = post.recited_by_me
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onPractice(post)}
        className={`${BIG} flex-1 ${onDark ? 'bg-white text-[#191f28]' : 'bg-amber-400/15 text-amber-700 dark:text-amber-300'}`}
      >
        <TargetIcon width={16} height={16} />
        외우기 연습
      </button>
      <button
        type="button"
        onClick={() => {
          toggle.mutate(post.id, {
            onSuccess: () => {
              if (!done) showToast('잘했어요! 별이 하나 늘었어요', 'success')
            },
          })
        }}
        disabled={toggle.isPending}
        className={`${BIG} flex-1 ${
          done
            ? 'bg-amber-400 text-white shadow-[0_8px_20px_-8px_rgba(245,158,11,0.8)]'
            : onDark
              ? 'bg-white/[0.18] text-white backdrop-blur-sm'
              : 'bg-amber-500 text-white'
        }`}
      >
        <StarIcon width={16} height={16} />
        {done ? '외웠어요' : '다 외웠어요'}
      </button>
    </div>
  )
}

// ── 일정 참석 ──
const RSVP: { value: RsvpStatus; label: string }[] = [
  { value: 'attending', label: '참석' },
  { value: 'maybe', label: '미정' },
  { value: 'not_attending', label: '불참' },
]

export const RsvpButtons = ({ post, onDark = false }: { post: ClassPost; onDark?: boolean }) => {
  const setRsvp = useSetClassPostRsvp(post.class_id)
  const cancelRsvp = useCancelClassPostRsvp(post.class_id)
  const event = post.event!
  const now = useTickingNow(30_000, Boolean(event.rsvp_deadline))
  const deadlineAt = event.rsvp_deadline ? parseKstDate(event.rsvp_deadline).getTime() : null
  const isClosed = deadlineAt !== null && now >= deadlineAt
  const remaining = deadlineAt !== null ? formatRemaining(deadlineAt - now) : null
  const canRespond = !isClosed || event.my_status != null
  const counts: Record<RsvpStatus, number> = {
    attending: event.attending_count,
    maybe: event.maybe_count,
    not_attending: event.not_attending_count,
  }

  const handle = async (status: RsvpStatus) => {
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

  return (
    <div>
      <div className="flex gap-1.5">
        {RSVP.map((opt) => {
          const active = event.my_status === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handle(opt.value)}
              disabled={setRsvp.isPending || cancelRsvp.isPending || (!canRespond && !active)}
              className={`flex-1 h-[46px] rounded-[14px] text-[14px] font-bold transition-all active:scale-95 disabled:opacity-40 ${
                active
                  ? 'bg-brand text-white shadow-[0_6px_16px_-6px_var(--brand-glow)]'
                  : onDark
                    ? 'bg-white/[0.14] text-white'
                    : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/65'
              }`}
            >
              {opt.label}
              {counts[opt.value] > 0 && (
                <span className={`ml-1 tabular-nums ${active ? 'opacity-90' : onDark ? 'text-white/70' : 'text-brand'}`}>
                  {counts[opt.value]}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {event.rsvp_deadline && (
        <p className={`mt-2 text-[12px] font-semibold ${onDark ? 'text-white/60' : 'text-gray-400 dark:text-white/45'}`}>
          {isClosed
            ? '참석 응답이 마감됐어요'
            : `${formatKstDateTime(event.rsvp_deadline)} 응답 마감${remaining ? ` · ${remaining} 남음` : ''}`}
        </p>
      )}
    </div>
  )
}

// ── 투표 ──
export const PollOptions = ({
  post,
  onDark = false,
  isTeacher = false,
}: {
  post: ClassPost
  onDark?: boolean
  isTeacher?: boolean
}) => {
  const vote = useVoteClassPoll(post.class_id)
  const poll = post.poll!
  const iVoted = poll.options.some((o) => o.voted_by_me)
  // 결과는 투표한 뒤(또는 내가 쓴 글이면) 보여준다 — 남의 표에 끌려가지 않게
  const showResult = iVoted || post.is_mine || isTeacher
  const total = Math.max(1, poll.options.reduce((n, o) => n + o.vote_count, 0))

  const handle = async (optionId: number) => {
    const current = poll.options.filter((o) => o.voted_by_me).map((o) => o.id)
    const next = poll.multiple
      ? current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      : current.includes(optionId)
        ? []
        : [optionId]
    try {
      await vote.mutateAsync({ postId: post.id, optionIds: next })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '투표에 실패했습니다', 'error')
    }
  }

  return (
    <div className="space-y-2">
      {poll.options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => handle(opt.id)}
          disabled={vote.isPending}
          className={`relative w-full min-h-[52px] rounded-2xl overflow-hidden text-left transition-all active:scale-[0.99] border-[1.5px] ${
            opt.voted_by_me
              ? 'border-brand'
              : onDark
                ? 'border-white/20'
                : 'border-gray-200 dark:border-white/[0.1]'
          }`}
        >
          {showResult && (
            <span
              className={`absolute inset-y-0 left-0 transition-all duration-500 ${onDark ? 'bg-white/[0.16]' : 'bg-[var(--brand-soft)]'}`}
              style={{ width: `${Math.round((opt.vote_count / total) * 100)}%` }}
            />
          )}
          <span className="relative flex items-center gap-2 px-4 py-3">
            {opt.voted_by_me && (
              <span className="shrink-0 text-brand">
                <CheckGlyph size={14} />
              </span>
            )}
            <span className={`flex-1 text-[15px] font-bold break-keep ${onDark ? 'text-white' : 'text-ink-strong'}`}>
              {opt.text}
            </span>
            {showResult && (
              <span className={`shrink-0 text-[13px] font-bold tabular-nums ${onDark ? 'text-white/70' : 'text-gray-400 dark:text-white/45'}`}>
                {opt.vote_count}표
              </span>
            )}
          </span>
        </button>
      ))}
      <p className={`text-[12px] font-semibold ${onDark ? 'text-white/60' : 'text-gray-400 dark:text-white/45'}`}>
        {poll.total_voters}명 참여{poll.multiple && ' · 여러 개 고를 수 있어요'}
        {!showResult && ' · 고르면 결과가 보여요'}
      </p>
    </div>
  )
}
