// 주간 매거진 꼭지 — 알림 한 개 = 잡지 한 꼭지.
// "01 · 다가오는 날" 머리말 → 큰 제목 → 본문 → 유형별 블록(일정 날짜판·사진·투표) → 응답 → 글쓴이·댓글
import { useState } from 'react'
import { CommentIcon } from '../../../components/icons/ActionIcons'
import { useDeleteClassPost, useUpdateClassPost } from '../../../hooks/useClassRoom'
import type { ClassPost } from '../../../types/classRoom'
import { confirmDialog } from '../../../utils/confirmDialog'
import { KO_WEEKDAYS, formatKstDateTime, kstNow, toKstCalendarDate } from '../../../utils/date'
import { showToast } from '../../../utils/toast'
import { Avatar, timeAgo } from '../classUi'
import { responseTarget, toStampSlot } from '../classWeek'
import { ClockIcon, MapPinIcon, PinIcon } from '../ClassIcons'
import { CheckButton, PollOptions, RsvpButtons, VerseButtons } from './IssueActions'

const DAY_MS = 24 * 60 * 60 * 1000

/** 꼭지 머리말 — 유형마다 잡지 섹션 이름 */
const eyebrowOf = (post: ClassPost) => {
  switch (post.post_type) {
    case 'notice':
      return '꼭 확인해 주세요'
    case 'verse':
      return '함께 외워요'
    case 'event':
      return post.event && toKstCalendarDate(post.event.start_at).getTime() >= kstNow().getTime() - DAY_MS
        ? '다가오는 날'
        : '지난 일정'
    case 'photo':
      return '우리 반 사진'
    case 'poll':
      return '함께 정해요'
    default:
      return '알림'
  }
}

/** 제목이 없으면 본문 첫 줄을 제목으로, 나머지를 본문으로 */
const splitHeading = (post: ClassPost) => {
  if (post.title) return { heading: post.title, body: post.content }
  const text = (post.content || '').trim()
  const nl = text.indexOf('\n')
  if (nl < 0 && text.length <= 40) return { heading: text, body: '' }
  if (nl > 0 && nl <= 40) return { heading: text.slice(0, nl), body: text.slice(nl + 1).trim() }
  return { heading: '', body: text }
}

const STATUS_WORD: Record<string, string> = {
  notice: '확인',
  verse: '암송',
  event: '응답',
  poll: '참여',
}

interface Props {
  post: ClassPost
  index: number
  isTeacher: boolean
  memberCount: number
  onOpenComments: (post: ClassPost) => void
  onOpenStatus: (post: ClassPost) => void
  onPractice: (post: ClassPost) => void
}

const IssueChapter = ({ post, index, isTeacher, memberCount, onOpenComments, onOpenStatus, onPractice }: Props) => {
  const deletePost = useDeleteClassPost(post.class_id)
  const updatePost = useUpdateClassPost(post.class_id)
  const { heading, body } = splitHeading(post)
  const slot = toStampSlot(post, memberCount)
  const target = responseTarget(memberCount)

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
      await updatePost.mutateAsync({ postId: post.id, payload: { is_pinned: !post.is_pinned } })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '고정 변경에 실패했습니다', 'error')
    }
  }

  return (
    <article id={`class-post-${post.id}`} className="scroll-mt-32 rounded-3xl px-5 py-6 bg-white dark:bg-card-dark">
      {/* 머리말 */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-extrabold tracking-[0.08em] text-gray-400 dark:text-white/40 tabular-nums">
          {String(index).padStart(2, '0')}
        </span>
        <span className="text-[12px] font-extrabold tracking-[0.04em] text-brand">{eyebrowOf(post)}</span>
        {post.is_pinned && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-brand">
            <PinIcon width={11} height={11} />
            고정
          </span>
        )}
        {slot?.classComplete && !post.is_scheduled && (
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300 text-[10.5px] font-bold leading-none">
            모두 {STATUS_WORD[slot.kind]}
          </span>
        )}
        {isTeacher && (
          <span className="ml-auto flex items-center gap-3">
            {post.post_type === 'notice' && (
              <button
                type="button"
                onClick={handleTogglePin}
                aria-label={post.is_pinned ? '고정 해제' : '상단 고정'}
                className={post.is_pinned ? 'text-brand' : 'text-gray-300 dark:text-white/30 hover:text-brand'}
              >
                <PinIcon width={15} height={15} />
              </button>
            )}
            <button type="button" onClick={handleDelete} aria-label="삭제" className="text-gray-300 dark:text-white/30 hover:text-red-500">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </span>
        )}
      </div>

      {post.is_scheduled && post.publish_at && (
        <p className="mt-2 flex items-center gap-1 text-[12px] font-bold text-violet-600 dark:text-violet-300">
          <ClockIcon width={12} height={12} />
          예약됨 · {formatKstDateTime(post.publish_at)}에 발행돼요 (선생님에게만 보여요)
        </p>
      )}

      {heading && (
        <h4 className="mt-2.5 text-[21px] font-extrabold leading-[1.4] tracking-[-0.025em] text-ink-strong break-keep">
          {heading}
        </h4>
      )}
      {body && (
        <p className="mt-2 text-[15px] leading-[1.8] text-gray-700 dark:text-white/80 whitespace-pre-wrap break-words">
          {body}
        </p>
      )}

      {/* 유형별 */}
      {post.post_type === 'verse' && post.verse && (
        <div className="mt-4 rounded-2xl px-5 py-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-400/[0.09] dark:to-orange-400/[0.05]">
          <p className="font-serif-kr text-[18px] font-bold leading-[1.65] text-ink-strong break-keep">“{post.verse.text}”</p>
          <p className="mt-1.5 text-[13px] font-bold text-amber-700 dark:text-amber-300">{post.verse.reference}</p>
        </div>
      )}
      {post.post_type === 'event' && post.event && <EventBoard post={post} />}
      {post.photos.length > 0 && <PhotoSpread urls={post.photos} />}
      {post.post_type === 'poll' && post.poll && (
        <div className="mt-4">
          <PollOptions post={post} isTeacher={isTeacher} />
        </div>
      )}

      {/* 응답 */}
      {!post.is_mine && !post.is_scheduled && (
        <>
          {post.post_type === 'notice' && (
            <div className="mt-4">
              <CheckButton post={post} />
            </div>
          )}
          {post.post_type === 'verse' && post.verse && (
            <div className="mt-4">
              <VerseButtons post={post} onPractice={onPractice} onDark={false} />
            </div>
          )}
          {post.post_type === 'event' && post.event && (
            <div className="mt-4">
              <RsvpButtons post={post} />
            </div>
          )}
        </>
      )}

      {/* 반 응답 현황 — 교사는 눌러서 명단·다시 알리기 */}
      {slot && !post.is_scheduled && (
        isTeacher ? (
          <button
            type="button"
            onClick={() => onOpenStatus(post)}
            className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/[0.04] text-left"
          >
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-bold text-ink-strong">
                {STATUS_WORD[slot.kind]} {slot.classDone}/{target}명
                {!slot.classComplete && (
                  <span className="text-gray-400 dark:text-white/45 font-semibold"> · {target - slot.classDone}명 남음</span>
                )}
              </span>
              <span className="mt-1.5 block h-[5px] rounded-full bg-gray-200/80 dark:bg-white/[0.08] overflow-hidden">
                <span
                  className="block h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((slot.classDone / target) * 100))}%` }}
                />
              </span>
            </span>
            <span className="shrink-0 text-[12.5px] font-bold text-brand">
              {slot.classComplete ? '명단' : '다시 알리기'} ›
            </span>
          </button>
        ) : (
          slot.classDone > 0 &&
          post.post_type !== 'poll' && (
            <p className="mt-2.5 text-[12px] font-semibold text-gray-400 dark:text-white/45">
              반 친구 {slot.classDone}명이 {slot.kind === 'verse' ? '외웠어요' : slot.kind === 'event' ? '응답했어요' : '확인했어요'}
            </p>
          )
        )
      )}

      {/* 글쓴이 + 댓글 */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/[0.06] flex items-center gap-2">
        <Avatar name={post.author_name} avatarUrl={post.author_avatar_url} size={24} />
        <span className="min-w-0 truncate text-[12.5px] font-bold text-gray-600 dark:text-white/65">
          {post.author_name}
          {post.author_is_teacher && ' 선생님'}
        </span>
        <span className="shrink-0 text-[12px] text-gray-400 dark:text-white/40">
          {timeAgo(post.created_at)}
          {post.updated_at && ' · 수정됨'}
        </span>
        <button
          type="button"
          onClick={() => onOpenComments(post)}
          className="ml-auto shrink-0 inline-flex items-center gap-1 text-[12.5px] font-bold text-gray-500 dark:text-white/55 hover:text-brand"
        >
          <CommentIcon size={16} />
          {post.comment_count > 0 ? post.comment_count : '댓글'}
        </button>
      </div>
    </article>
  )
}

// ── 일정 날짜판 ──
const EventBoard = ({ post }: { post: ClassPost }) => {
  const event = post.event!
  const start = toKstCalendarDate(event.start_at)
  const today = kstNow()
  const days = Math.round(
    (new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      DAY_MS,
  )
  const dday = days > 0 ? `D-${days}` : days === 0 ? '오늘' : null
  const hh = start.getHours()
  const mm = start.getMinutes()
  const time = `${hh < 12 ? '오전' : '오후'} ${hh % 12 || 12}:${String(mm).padStart(2, '0')}`

  return (
    <div className="mt-4 flex items-center gap-4 rounded-2xl p-4 bg-[var(--brand-soft)]">
      <div className="shrink-0 w-[66px] rounded-2xl bg-white dark:bg-card-dark py-2 text-center shadow-[0_6px_16px_-8px_var(--brand-glow)]">
        <span className="block text-[11px] font-extrabold text-rose-500">
          {start.getMonth() + 1}월 · {KO_WEEKDAYS[start.getDay()]}
        </span>
        <span className="block text-[28px] font-extrabold leading-[1.1] tabular-nums text-ink-strong">{start.getDate()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-ink-strong">
          {time}
          {event.end_at && <span className="font-semibold text-gray-500 dark:text-white/55"> ~ {formatKstDateTime(event.end_at)}</span>}
        </p>
        {event.location && (
          <p className="mt-0.5 text-[13px] text-gray-600 dark:text-white/60 truncate">
            <MapPinIcon width={12} height={12} className="inline-block align-[-1.5px] mr-1" />
            {event.location}
          </p>
        )}
        <p className="mt-1 text-[12px] font-semibold text-gray-500 dark:text-white/50">
          참석 {event.attending_count} · 미정 {event.maybe_count}
          {dday && <span className="ml-1.5 font-extrabold text-brand">{dday}</span>}
        </p>
      </div>
    </div>
  )
}

// ── 사진 펼침면 + 라이트박스 ──
const PhotoSpread = ({ urls }: { urls: string[] }) => {
  const [viewer, setViewer] = useState<number | null>(null)
  const shown = urls.slice(0, 3)

  return (
    <>
      <div
        className={`mt-4 grid gap-1 rounded-2xl overflow-hidden ${
          shown.length === 1 ? 'grid-cols-1' : shown.length === 2 ? 'grid-cols-2' : 'grid-cols-[2fr_1fr] grid-rows-[130px_130px] lg:grid-rows-[170px_170px]'
        }`}
      >
        {shown.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setViewer(i)}
            className={`relative bg-gray-100 dark:bg-white/[0.05] ${shown.length === 3 && i === 0 ? 'row-span-2' : ''}`}
          >
            <img
              src={url}
              alt=""
              loading="lazy"
              className={`w-full h-full object-cover ${
                shown.length === 1 ? 'max-h-[420px]' : shown.length === 2 ? 'aspect-[4/5]' : ''
              }`}
            />
            {i === shown.length - 1 && urls.length > shown.length && (
              <span className="absolute inset-0 bg-black/45 grid place-items-center text-white text-[17px] font-bold">
                +{urls.length - shown.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {viewer !== null && (
        <div className="fixed inset-0 z-[130] bg-black/90 flex flex-col items-center justify-center" onClick={() => setViewer(null)}>
          <img
            src={urls[viewer]}
            alt=""
            className="max-w-full max-h-[80vh] lg:max-h-[calc(80vh/var(--az,1))] object-contain"
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}

export default IssueChapter
