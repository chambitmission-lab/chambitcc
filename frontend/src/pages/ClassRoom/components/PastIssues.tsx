// 주간 매거진 지난 호 — 한 주가 지나면 이 호가 책장처럼 쌓인다. 누르면 그 자리에서 펼쳐 읽는다.
import { useState } from 'react'
import type { ClassPost } from '../../../types/classRoom'
import { awaitingMe, issueNo, weekLabel, weekRelative, type Issue } from '../classWeek'
import IssueChapter from './IssueChapter'

interface Props {
  issues: Issue[]
  classCreatedAt: string
  isTeacher: boolean
  memberCount: number
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onOpenComments: (post: ClassPost) => void
  onOpenStatus: (post: ClassPost) => void
  onPractice: (post: ClassPost) => void
}

const coverLine = (issue: Issue) => {
  const verse = issue.posts.find((p) => p.post_type === 'verse' && p.verse)
  if (verse?.verse) return verse.verse.reference
  const first = issue.posts[issue.posts.length - 1]
  return (first.title || first.content || '').split('\n')[0].slice(0, 28)
}

const PastIssues = ({
  issues,
  classCreatedAt,
  isTeacher,
  memberCount,
  hasMore,
  loadingMore,
  onLoadMore,
  onOpenComments,
  onOpenStatus,
  onPractice,
}: Props) => {
  const [open, setOpen] = useState<number | null>(null)
  if (issues.length === 0 && !hasMore) return null

  return (
    <section className="px-4 pt-10">
      <div className="flex items-baseline justify-between px-1">
        <h3 className="text-[19px] font-extrabold tracking-[-0.02em] text-ink-strong">지난 호</h3>
        <span className="text-[12px] font-semibold text-gray-400 dark:text-white/40">한 주가 끝나면 이곳에 보관돼요</span>
      </div>

      <div className="mt-3 space-y-2.5">
        {issues.map((issue) => {
          const isOpen = open === issue.weekKey
          const photos = issue.posts.flatMap((p) => p.photos).slice(0, 3)
          const pending = isTeacher ? 0 : issue.posts.filter((p) => awaitingMe(p, memberCount)).length
          const rel = weekRelative(issue.weekKey)
          return (
            <div key={issue.weekKey} className="rounded-3xl bg-white dark:bg-card-dark overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : issue.weekKey)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3.5 p-4 text-left"
              >
                <span className="shrink-0 w-[54px] h-[68px] rounded-xl bg-[linear-gradient(160deg,#3182f6,#1b64da)] text-white flex flex-col items-center justify-center shadow-[0_8px_18px_-10px_var(--brand-glow)]">
                  <span className="text-[9.5px] font-extrabold tracking-[0.1em] opacity-80">VOL</span>
                  <span className="text-[20px] font-extrabold leading-none tabular-nums">{issueNo(issue.weekKey, classCreatedAt)}</span>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15.5px] font-extrabold tracking-[-0.015em] text-ink-strong">
                    {weekLabel(issue.weekKey)}
                    {rel && <span className="ml-1.5 text-[12px] font-bold text-gray-400 dark:text-white/40">{rel}</span>}
                  </span>
                  <span className="block mt-0.5 text-[13px] text-gray-500 dark:text-white/55 truncate">{coverLine(issue)}</span>
                  <span className="block mt-1 text-[12px] font-semibold text-gray-400 dark:text-white/40">
                    소식 {issue.posts.length}개
                    {pending > 0 && <span className="ml-1.5 font-bold text-rose-500">아직 {pending}개 남았어요</span>}
                  </span>
                </span>
                {photos.length > 0 && (
                  <span className="shrink-0 flex -space-x-5">
                    {photos.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt=""
                        loading="lazy"
                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-white dark:ring-card-dark"
                      />
                    ))}
                  </span>
                )}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 text-gray-300 dark:text-white/30 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  aria-hidden
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-2 pb-2 space-y-2 bg-gray-50 dark:bg-white/[0.02] pt-2">
                  {issue.posts.map((post, i) => (
                    <IssueChapter
                      key={post.id}
                      post={post}
                      index={i + 1}
                      isTeacher={isTeacher}
                      memberCount={memberCount}
                      onOpenComments={onOpenComments}
                      onOpenStatus={onOpenStatus}
                      onPractice={onPractice}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-5 py-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold disabled:opacity-50"
          >
            {loadingMore ? '불러오는 중...' : '더 지난 호 불러오기'}
          </button>
        </div>
      )}
    </section>
  )
}

export default PastIssues
