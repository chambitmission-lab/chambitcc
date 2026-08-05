import type { Translation } from '../../../../locales'
import { toKstCalendarDate } from '../../../../utils/kstTime'

interface Comment {
  id: number
  user_name: string
  content: string
  created_at: string
}

interface CommentsSectionProps {
  comments?: Comment[]
  comment: string
  setComment: (value: string) => void
  submitting: boolean
  isLoggedIn: boolean
  onSubmit: (e: React.FormEvent) => void
  onDelete: (commentId: number) => void
  t: Translation
}

const formatCommentDate = (value: string): string => {
  const d = toKstCalendarDate(value)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export const CommentsSection = ({
  comments,
  comment,
  setComment,
  submitting,
  isLoggedIn,
  onSubmit,
  onDelete,
  t,
}: CommentsSectionProps) => {
  return (
    <section className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-ink-strong text-[15px] font-bold tracking-[-0.01em]">
          💬 {t.comments}
        </h2>
        <span className="inline-flex items-center px-2 h-5 rounded-full bg-[var(--brand-soft)] text-brand text-[11px] font-bold">
          {comments?.length || 0}
        </span>
      </div>

      {isLoggedIn && (
        <form onSubmit={onSubmit} className="mb-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.writeComment}
            rows={3}
            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200/70 dark:border-white/[0.08] text-ink-strong text-[16px] sm:text-[13.5px] leading-[1.55] placeholder:text-gray-400 dark:placeholder:text-white/35 resize-y outline-none focus:border-[var(--brand)] focus:bg-white dark:focus:bg-transparent transition-colors"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="h-9 px-4 rounded-xl bg-[var(--brand)] text-white text-[13px] font-bold hover:bg-[var(--brand-dim)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? t.submitting : t.submit}
            </button>
          </div>
        </form>
      )}

      {!comments?.length ? (
        <p className="text-gray-400 dark:text-white/45 text-[13px] text-center py-4">
          {t.noComments}
        </p>
      ) : (
        <div className="flex flex-col">
          {comments.map((c, i) => (
            <div
              key={c.id}
              className={`flex items-start gap-2.5 py-3 ${
                i > 0 ? 'border-t border-gray-100 dark:border-white/[0.06]' : ''
              }`}
            >
              <span className="w-8 h-8 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold flex items-center justify-center shrink-0">
                {c.user_name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-ink-strong text-[13px] font-bold">{c.user_name}</span>
                  <span className="text-gray-400 dark:text-white/40 text-[11.5px]">
                    {formatCommentDate(c.created_at)}
                  </span>
                  {isLoggedIn && (
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className="ml-auto text-gray-300 dark:text-white/30 text-[11.5px] font-semibold hover:text-rose-500 transition-colors shrink-0"
                    >
                      {t.deleteComment}
                    </button>
                  )}
                </div>
                <p className="text-gray-600 dark:text-white/75 text-[13.5px] leading-[1.6] mt-0.5 whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
