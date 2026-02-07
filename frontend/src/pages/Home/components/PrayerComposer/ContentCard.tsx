import { useLanguage } from '../../../../contexts/LanguageContext'

interface ContentCardProps {
  title: string
  content: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
}

const ContentCard = ({ title, content, onTitleChange, onContentChange }: ContentCardProps) => {
  const { t } = useLanguage()
  
  return (
    <div className="relative mb-4">
      {/* 기도 카드 - 글래스모피즘 */}
      <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-4 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
        {/* 내부 빛 효과 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-2xl"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-white/10 dark:to-white/5 rounded-full blur-2xl"></div>
        
        {/* Title */}
        <div className="mb-1.5 relative z-10">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t('prayerComposerTitlePlaceholder')}
            maxLength={100}
            required
            className="w-full bg-transparent border-none text-sm font-extrabold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] uppercase py-1"
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder={t('prayerComposerContentPlaceholder')}
            rows={4}
            maxLength={1000}
            required
            className="w-full bg-transparent border-none text-sm text-gray-600 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none leading-[1.5] drop-shadow-[0_0_6px_rgba(168,85,247,0.2)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.25)] py-1"
          />
          <div className="text-xs text-gray-400 dark:text-gray-500 text-right mt-0.5">
            {content.length}/1000
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentCard
