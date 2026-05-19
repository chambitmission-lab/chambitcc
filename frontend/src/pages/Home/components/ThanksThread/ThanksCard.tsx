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
      className={`relative overflow-hidden rounded-2xl bg-background-light dark:bg-[#1c1c26] border border-black/[0.04] dark:border-white/[0.08] shadow-[0_4px_18px_rgba(168,85,247,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)] transition-shadow ${
        isList ? 'p-4' : 'p-4 w-64 flex-shrink-0 snap-start'
      }`}
    >
      {/* 다크모드 미세 그라데이션 */}
      <div className="hidden dark:block absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

      {/* 상단: 감정 이모지 + 삭제 */}
      <div className="relative flex items-start justify-between mb-2">
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
            className="w-7 h-7 -m-1 flex items-center justify-center rounded-full text-gray-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-500/10 transition-colors"
            aria-label={language === 'ko' ? '삭제' : 'Delete'}
          >
            <span className="material-icons-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* 본문 */}
      <p
        className={`relative text-[14px] text-gray-800 dark:text-white/85 leading-[1.65] mb-3 break-words whitespace-pre-wrap ${
          isList ? '' : 'line-clamp-4'
        }`}
      >
        {thanks.content}
      </p>

      {/* 하단: 작성자 + 시간 + 아멘 */}
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-white/50 min-w-0">
          <span className="truncate font-medium">{thanks.display_name}</span>
          <span className="opacity-60">·</span>
          <span className="whitespace-nowrap">{thanks.time_ago}</span>
        </div>
        <button
          onClick={() => onAmen(thanks.id)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold tabular-nums transition-all ${
            thanks.is_amened
              ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-200 border border-purple-200/60 dark:border-purple-400/25'
              : 'bg-surface-light dark:bg-white/[0.05] text-gray-600 dark:text-white/65 border border-black/[0.04] dark:border-white/[0.06] hover:bg-purple-50/60 dark:hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-200'
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
