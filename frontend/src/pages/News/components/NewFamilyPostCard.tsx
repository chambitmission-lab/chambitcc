// 새가족 포스트 카드 (Single Responsibility: 인스타형 포스트 한 장 표시)
import { useState } from 'react'
import NewFamilyPhotoCarousel from './NewFamilyPhotoCarousel'
import { WELCOME_EMOJI_META, WelcomeEmojiImg } from './welcomeEmoji'
import { AnimatedEmojiText } from '../../../components/common/animatedEmoji'
import type { NewFamilyPost } from '../../../types/newFamily'

interface NewFamilyPostCardProps {
  post: NewFamilyPost
  onToggleWelcome: (emoji: string) => void
  onOpenComments: () => void
  onOpenViewer: (photoIndex: number) => void
  isAdmin?: boolean
  onDelete?: () => void
}

const formatRegisteredAt = (value: string): string => {
  // 'YYYY-MM-DD' — 타임존 보정 없이 그대로 읽는다 (등록 주일은 날짜 개념)
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return value
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = days[new Date(y, m - 1, d).getDay()]
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${weekday})`
}

const GREETING_CLAMP = 90

const NewFamilyPostCard = ({
  post,
  onToggleWelcome,
  onOpenComments,
  onOpenViewer,
  isAdmin,
  onDelete,
}: NewFamilyPostCardProps) => {
  const [expanded, setExpanded] = useState(false)

  const greeting = post.greeting ?? ''
  const needsClamp = greeting.length > GREETING_CLAMP && !expanded
  const shownGreeting = needsClamp ? `${greeting.slice(0, GREETING_CLAMP)}…` : greeting

  return (
    <article className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.3)]">
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-3xl" />

      {/* 헤더 */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[17px] shadow-[0_4px_12px_-3px_rgba(168,85,247,0.6)]">
          🌱
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em] truncate">
              {post.member_name}
            </span>
            {post.group_name && (
              <span className="shrink-0 inline-flex items-center px-2 h-5 rounded-full bg-purple-500/12 dark:bg-purple-500/20 border border-purple-500/25 text-purple-700 dark:text-purple-300 text-[10.5px] font-bold">
                {post.group_name}
              </span>
            )}
            {isAdmin && !post.is_published && (
              <span className="shrink-0 inline-flex items-center px-2 h-5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60 text-[10.5px] font-bold">
                비공개
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-0.5">
            {formatRegisteredAt(post.registered_at)} 등록
          </p>
        </div>

        {isAdmin && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="삭제"
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 dark:text-white/40 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        )}
      </div>

      {/* 사진 캐러셀 */}
      <div className="relative z-10">
        <NewFamilyPhotoCarousel
          photos={post.photos}
          alt={post.member_name}
          onPhotoClick={onOpenViewer}
        />
      </div>

      {/* 환영 리액션 바 */}
      <div className="relative z-10 flex items-center gap-1.5 px-3 pt-3 pb-1">
        {WELCOME_EMOJI_META.map((meta) => {
          const count = post.welcome_breakdown[meta.char] ?? 0
          const active = post.my_welcome === meta.char
          return (
            <button
              key={meta.char}
              type="button"
              onClick={() => onToggleWelcome(meta.char)}
              aria-label={meta.label}
              aria-pressed={active}
              className={[
                'inline-flex items-center gap-1 h-9 rounded-full border transition-all active:scale-90',
                count > 0 ? 'pl-1.5 pr-2.5' : 'px-1.5',
                active
                  ? 'bg-[var(--brand-soft-strong)] border-[var(--brand)] shadow-[0_2px_10px_-3px_var(--brand-glow)]'
                  : 'bg-gray-100/70 dark:bg-white/[0.05] border-gray-200/70 dark:border-white/[0.08] hover:bg-[var(--brand-soft)]',
              ].join(' ')}
            >
              <WelcomeEmojiImg meta={meta} size={22} />
              {count > 0 && (
                <span
                  className={[
                    'text-[12px] font-bold tabular-nums',
                    active
                      ? 'text-[var(--brand)]'
                      : 'text-gray-600 dark:text-white/65',
                  ].join(' ')}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}

        <button
          type="button"
          onClick={onOpenComments}
          className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-gray-500 dark:text-white/60 hover:text-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors"
          aria-label="댓글 보기"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span className="text-[12.5px] font-bold tabular-nums">{post.comment_count}</span>
        </button>
      </div>

      {/* 환영 수 요약 */}
      {post.welcome_count > 0 && (
        <p className="relative z-10 px-4 text-[12.5px] font-bold text-gray-700 dark:text-white/75">
          {post.welcome_count}명이 환영했어요
        </p>
      )}

      {/* 인사말 */}
      {greeting && (
        <div className="relative z-10 px-4 pt-1.5">
          <AnimatedEmojiText
            content={`${post.member_name} ${shownGreeting}`}
            className="text-[13.5px] leading-[1.65] text-gray-700 dark:text-white/80 whitespace-pre-wrap break-words"
          />
          {needsClamp && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-0.5 text-[12.5px] font-semibold text-gray-400 dark:text-white/40 hover:text-[var(--brand)] transition-colors"
            >
              더 보기
            </button>
          )}
        </div>
      )}

      {/* 댓글 진입 */}
      <div className="relative z-10 px-4 pt-2 pb-3.5">
        <button
          type="button"
          onClick={onOpenComments}
          className="text-[12.5px] font-semibold text-gray-400 dark:text-white/40 hover:text-[var(--brand)] transition-colors"
        >
          {post.comment_count > 0
            ? `환영 댓글 ${post.comment_count}개 모두 보기`
            : '첫 환영 인사를 남겨보세요'}
        </button>
        <p className="text-[10.5px] text-gray-400 dark:text-white/30 mt-1">{post.time_ago}</p>
      </div>
    </article>
  )
}

export default NewFamilyPostCard
