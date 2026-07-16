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

  // 익명 표시 이름 — "익명" 대신 마 6:6의 골방 기도자 (피드와 동일, 데이터 값은 그대로 둔다)
  const shownName = (displayName: string) =>
    displayName === '익명' || displayName === 'Anonymous' ? t('anonymousDisplayName') : displayName

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
            relative overflow-hidden rounded-2xl px-4 py-3 cursor-pointer
            bg-white/80 dark:bg-card-dark
            border border-gray-200/70 dark:border-white/[0.08]
            shadow-sm
            dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_var(--brand-soft)]
            transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
          "
        >
          <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

          <div className="relative z-10">
            {reply.prayer_title && (
              <div className="mb-1.5 text-[12px] font-semibold text-brand truncate">
                {reply.prayer_title}
              </div>
            )}

            <div className="relative pl-3 mb-2.5">
              <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-brand" />
              <ExpandableText
                text={reply.content}
                lines={3}
                textClassName="text-[14px] text-gray-700 dark:text-white/80 leading-[1.7] italic"
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-gray-500 dark:text-white/50">
              <span>{shownName(reply.display_name)}{t('profileWrittenAs')}</span>
              <span className="ml-auto">{getRelativeTime(reply.created_at)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MyRepliesList
