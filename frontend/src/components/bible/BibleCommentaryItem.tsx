import { Markdown } from '../../utils/markdown'
import type { BibleCommentary } from '../../types/bibleCommentary'

interface BibleCommentaryItemProps {
  commentary: BibleCommentary
  isAdmin: boolean
  onEdit?: (commentary: BibleCommentary) => void
  onDelete?: (commentary: BibleCommentary) => void
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

const formatRange = (c: BibleCommentary) => {
  if (c.verse_start === c.verse_end) return `${c.verse_start}절`
  return `${c.verse_start}-${c.verse_end}절`
}

const BibleCommentaryItem = ({
  commentary,
  isAdmin,
  onEdit,
  onDelete,
}: BibleCommentaryItemProps) => {
  return (
    <article className="relative mb-3 rounded-2xl border border-black/[0.04] dark:border-white/[0.08] bg-surface-light dark:bg-white/[0.03] px-4 py-3.5 overflow-hidden">
      <div className="hidden dark:block absolute inset-x-0 top-0 h-px bg-white/[0.05] pointer-events-none" />

      <header className="flex items-center gap-2 flex-wrap mb-2">
        <span className="inline-flex items-center text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/12 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300">
          {formatRange(commentary)}
        </span>
        {commentary.category && (
          <span className="inline-flex items-center text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65">
            {commentary.category}
          </span>
        )}
        <span className="ml-auto text-[11px] text-gray-400 dark:text-white/45">
          {formatDate(commentary.updated_at)}
        </span>
      </header>

      {commentary.title && (
        <h4 className="mt-0 mb-1.5 text-[16px] font-bold tracking-[-0.015em] leading-[1.35] text-gray-900 dark:text-white">
          {commentary.title}
        </h4>
      )}

      <div className="text-[14.5px] leading-[1.7] text-gray-700 dark:text-white/80">
        <Markdown source={commentary.content} />
      </div>

      {isAdmin && (
        <div className="flex gap-1.5 justify-end mt-2.5">
          {onEdit && (
            <button
              onClick={() => onEdit(commentary)}
              className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[12px] font-bold bg-purple-500/10 dark:bg-purple-500/12 text-purple-700 dark:text-purple-300 border border-purple-500/20 dark:border-purple-500/25 hover:bg-purple-500/15 dark:hover:bg-purple-500/20 transition-colors"
            >
              <span className="material-icons-round text-[15px]">edit</span>
              수정
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(commentary)}
              className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[12px] font-bold bg-red-500/8 dark:bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20 dark:border-red-400/30 hover:bg-red-500/15 dark:hover:bg-red-500/20 transition-colors"
            >
              <span className="material-icons-round text-[15px]">delete_outline</span>
              삭제
            </button>
          )}
        </div>
      )}
    </article>
  )
}

export default BibleCommentaryItem
