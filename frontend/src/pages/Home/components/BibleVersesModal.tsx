import type { RecommendedVerses } from '../../../types/prayer'

interface BibleVersesModalProps {
  verses: RecommendedVerses
  onClose: () => void
}

const BibleVersesModal = ({ verses, onClose }: BibleVersesModalProps) => {
  const handleShare = () => {
    const shareText = `📖 당신을 위한 성경 말씀\n\n${verses.summary}\n\n${verses.verses.map(v => 
      `${v.reference}\n"${v.text}"\n💡 ${v.message}`
    ).join('\n\n')}`
    
    if (navigator.share) {
      navigator.share({
        title: '당신을 위한 성경 말씀',
        text: shareText,
      }).catch(() => {
        // 공유 취소 시 무시
      })
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(shareText).then(() => {
        alert('클립보드에 복사되었습니다')
      })
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/30 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-purple-200/50 dark:border-purple-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-icons-outlined text-white text-3xl drop-shadow-lg">
                auto_stories
              </span>
              <div>
                <h2 className="text-lg font-bold text-white drop-shadow-md">
                  당신을 위한 성경 말씀
                </h2>
                <p className="text-xs text-white/90 mt-0.5">
                  하나님의 위로와 격려
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <span className="material-icons-outlined text-white text-xl">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary */}
          <div className="mb-6 p-4 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-purple-200/50 dark:border-purple-500/20">
            <div className="flex items-start gap-3">
              <span className="material-icons-outlined text-purple-500 dark:text-purple-400 text-xl mt-0.5">
                lightbulb
              </span>
              <div>
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-1">
                  기도 주제
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {verses.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Verses */}
          <div className="space-y-4">
            {verses.verses.map((verse, index) => (
              <div 
                key={index}
                className="relative p-5 bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-purple-200/50 dark:border-purple-500/20 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-transparent dark:from-purple-500/20 rounded-bl-full"></div>
                
                {/* Reference */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-icons-outlined text-purple-500 dark:text-purple-400 text-lg">
                    menu_book
                  </span>
                  <h3 className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    {verse.reference}
                  </h3>
                </div>

                {/* Text */}
                <blockquote className="mb-4 pl-4 border-l-4 border-purple-400 dark:border-purple-500">
                  <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed italic">
                    "{verse.text}"
                  </p>
                </blockquote>

                {/* Message */}
                <div className="flex items-start gap-2 p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg">
                  <span className="material-icons-outlined text-purple-600 dark:text-purple-400 text-lg mt-0.5">
                    favorite
                  </span>
                  <p className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
                    {verse.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span className="material-icons-outlined text-xl">
                share
              </span>
              공유하기
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              기도 목록으로
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              이 말씀이 당신의 기도에 힘이 되기를 바랍니다 🙏
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BibleVersesModal
