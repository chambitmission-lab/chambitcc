import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { EventComment } from '../../../../types/event'
import type { Translation } from '../../../../locales'
import { getMe } from '../../../../api/account'
import { accountKeys } from '../../../../hooks/queryKeys'
import { toKstCalendarDate } from '../../../../utils/kstTime'
import { formatEventTime } from '../../utils/dateGrouping'
import { EventAvatar, SectionCard } from './EventAvatar'

interface EventThreadProps {
  comments?: EventComment[]
  comment: string
  setComment: (value: string) => void
  submitting: boolean
  isLoggedIn: boolean
  onSubmit: (e: React.FormEvent) => void
  onDelete: (commentId: number) => void
  t: Translation
}

const formatWhen = (value: string): string => {
  const d = toKstCalendarDate(value)
  return `${d.getMonth() + 1}/${d.getDate()} ${formatEventTime(value)}`
}

/** 모임 이야기 — 댓글을 대화창처럼. 내 말은 오른쪽 파란 말풍선, 삭제는 내 말에만(백엔드도 본인만 허용) */
export const EventThread = ({
  comments,
  comment,
  setComment,
  submitting,
  isLoggedIn,
  onSubmit,
  onDelete,
  t,
}: EventThreadProps) => {
  const { data: me } = useQuery({
    queryKey: accountKeys.me(),
    queryFn: getMe,
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 10,
  })
  const list = comments ?? []

  return (
    <SectionCard title={t.threadTitle} count={list.length}>
      {list.length === 0 ? (
        <p className="py-4 text-center text-gray-400 dark:text-white/45 text-[14.5px] lg:text-[15.5px] leading-[1.65] whitespace-pre-line">
          {t.threadEmpty}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map(c => {
            const name = c.user_name?.trim() || t.anonymous
            const mine = me?.id !== undefined && c.user_id === me.id
            return (
              <li key={c.id} className={`flex items-end gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                {!mine && <EventAvatar name={name} className="w-9 h-9 text-[14px]" />}
                <div className={`min-w-0 max-w-[82%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1 px-0.5 text-[12.5px] lg:text-[13.5px] text-gray-400 dark:text-white/45 font-semibold">
                    <span className={mine ? '' : 'text-gray-600 dark:text-white/70 font-bold'}>{mine ? t.threadMe : name}</span>
                    <span>{formatWhen(c.created_at)}</span>
                    {mine && (
                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        className="font-semibold hover:text-rose-500 transition-colors"
                      >
                        {t.deleteComment}
                      </button>
                    )}
                  </div>
                  <p
                    className={`px-3.5 py-2.5 text-[15.5px] lg:text-[16.5px] leading-[1.6] whitespace-pre-wrap break-words ${
                      mine
                        ? 'evd-bubble-me bg-[var(--brand)] text-white'
                        : 'evd-bubble-you bg-[var(--app-canvas)] text-ink-strong'
                    }`}
                  >
                    {c.content}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
        {isLoggedIn ? (
          <form onSubmit={onSubmit} className="flex items-end gap-2.5">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={t.threadPlaceholder}
              aria-label={t.threadPlaceholder}
              rows={1}
              className="flex-1 min-h-[48px] max-h-40 [field-sizing:content] resize-none px-4 py-3 rounded-[14px] bg-[var(--app-canvas)] border border-gray-200/70 dark:border-white/[0.08] text-ink-strong text-[16px] lg:text-[16.5px] leading-[1.5] placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:border-[var(--brand)] focus:bg-white dark:focus:bg-transparent transition-colors"
            />
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              aria-label={t.send}
              className="w-12 h-12 rounded-[14px] bg-[var(--brand)] text-white flex items-center justify-center shrink-0 hover:bg-[var(--brand-dim)] active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
              </svg>
            </button>
          </form>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center h-12 rounded-[14px] bg-[var(--brand-soft)] text-brand text-[15px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
          >
            {t.threadLogin}
          </Link>
        )}
      </div>
    </SectionCard>
  )
}
