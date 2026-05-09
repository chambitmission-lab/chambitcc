import { useLanguage } from '../../../../contexts/LanguageContext'
import { THANKS_EMOTIONS, type Thanks } from '../../../../types/thanks'

interface ThanksCardProps {
  thanks: Thanks
  canDelete: boolean
  onAmen: (id: number) => void
  onDelete: (id: number) => void
  variant?: 'card' | 'list'
}

const ThanksCard = ({ thanks, canDelete, onAmen, onDelete, variant = 'card' }: ThanksCardProps) => {
  const { language } = useLanguage()
  const emotion = thanks.emotion ? THANKS_EMOTIONS[thanks.emotion] : null

  const isList = variant === 'list'

  return (
    <div
      className={`relative bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow ${
        isList ? 'p-4' : 'p-4 w-64 flex-shrink-0 snap-start'
      }`}
    >
      {/* 상단: 감정 이모지 + 삭제 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1 min-h-[24px]">
          {emotion && (
            <span
              className="text-lg leading-none"
              title={language === 'ko' ? emotion.label : emotion.labelEn}
            >
              {emotion.emoji}
            </span>
          )}
        </div>
        {canDelete && (
          <button
            onClick={() => onDelete(thanks.id)}
            className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
            aria-label={language === 'ko' ? '삭제' : 'Delete'}
          >
            <span className="material-icons-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* 본문 */}
      <p
        className={`text-sm text-gray-800 dark:text-gray-100 leading-relaxed mb-3 break-words whitespace-pre-wrap ${
          isList ? '' : 'line-clamp-4'
        }`}
      >
        {thanks.content}
      </p>

      {/* 하단: 작성자 + 시간 + 아멘 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 min-w-0">
          <span className="truncate font-medium">{thanks.display_name}</span>
          <span className="opacity-60">·</span>
          <span className="whitespace-nowrap">{thanks.time_ago}</span>
        </div>
        <button
          onClick={() => onAmen(thanks.id)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
            thanks.is_amened
              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20'
          }`}
          aria-label={language === 'ko' ? '아멘' : 'Amen'}
        >
          <span>🙏</span>
          <span>{thanks.amen_count}</span>
        </button>
      </div>
    </div>
  )
}

export default ThanksCard
