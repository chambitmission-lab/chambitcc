import { useLanguage } from '../../../contexts/LanguageContext'
import type { MyReply } from '../../../types/profile'
import { getRelativeTime } from '../../../utils/dateUtils'
import ExpandableText from './ExpandableText'

interface MyRepliesListProps {
  replies: MyReply[]
  onReplyClick?: (prayerId: number) => void
}

const MyRepliesList = ({ replies, onReplyClick }: MyRepliesListProps) => {
  const { t } = useLanguage()

  if (replies.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl block mb-3">💬</span>
        <p className="text-[13px] text-gray-500 dark:text-white/55">
          {t('profileEmptyReplies')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => (
        <div
          key={reply.id}
          role="button"
          tabIndex={0}
          onClick={() => onReplyClick?.(reply.prayer_id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onReplyClick?.(reply.prayer_id)
            }
          }}
          className="
            relative overflow-hidden rounded-2xl p-4 cursor-pointer
            bg-white/80 dark:bg-card-dark
            border border-gray-200/70 dark:border-white/[0.08]
            shadow-sm
            dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(168,85,247,0.08)]
            transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
          "
        >
          <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-white/45">
                {t('profileReplyLabel')}
              </span>
              <span className="text-[12px] font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent truncate min-w-0">
                {reply.prayer_title}
              </span>
            </div>

            <div className="relative pl-3 mb-3">
              <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
              <ExpandableText
                text={reply.content}
                lines={3}
                textClassName="text-[14px] text-gray-700 dark:text-white/80 leading-[1.7] italic"
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-gray-500 dark:text-white/50">
              <span>{reply.display_name}{t('profileWrittenAs')}</span>
              <span className="ml-auto">{getRelativeTime(reply.created_at)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MyRepliesList
