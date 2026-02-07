import { useEffect } from 'react'
import type { RecommendedVerses } from '../../../types/prayer'

interface BibleVersesModalProps {
  verses: RecommendedVerses
  onClose: () => void
}

import { useLanguage } from '../../../contexts/LanguageContext'

const BibleVersesModal = ({ verses, onClose }: BibleVersesModalProps) => {
  const { t } = useLanguage()
  // 브라우저 뒤로가기 처리
  useEffect(() => {
    // 모달이 열릴 때 히스토리 엔트리 추가
    window.history.pushState({ modal: 'bible-verses' }, '')

    const handlePopState = () => {
      // 뒤로가기 시 모달만 닫기
      onClose()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onClose])
  // TODO: 나중에 공유 기능 추가 시 사용
  // const handleShare = () => {
  //   const shareText = `📖 당신을 위한 성경 말씀\n\n${verses.summary}\n\n${verses.verses.map(v => 
  //     `${v.reference}\n"${v.text}"\n💡 ${v.message}`
  //   ).join('\n\n')}`
  //   
  //   if (navigator.share) {
  //     navigator.share({
  //       title: '당신을 위한 성경 말씀',
  //       text: shareText,
  //     }).catch(() => {
  //       // 공유 취소 시 무시
  //     })
  //   } else {
  //     // 클립보드에 복사
  //     navigator.clipboard.writeText(shareText).then(() => {
  //       alert('클립보드에 복사되었습니다')
  //     })
  //   }
  // }

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 하늘에서 내려오는 빛 효과 */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-1 h-20 bg-gradient-to-b from-transparent via-yellow-300/60 to-yellow-400/80 dark:via-yellow-200/60 dark:to-yellow-300/80 blur-sm"></div>
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[2px] h-20 bg-gradient-to-b from-transparent via-yellow-400/80 to-yellow-500 dark:via-yellow-300/80 dark:to-yellow-400"></div>
        
        {/* 상단 빛 확산 효과 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-yellow-300/30 to-transparent dark:from-yellow-200/20 blur-3xl rounded-full"></div>

        {/* Header */}
        <div className="relative sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              {/* 아이콘 주변 빛 효과 */}
              <div className="absolute inset-0 bg-yellow-400/30 dark:bg-yellow-300/20 blur-md rounded-full animate-pulse"></div>
              <span className="material-icons-outlined text-yellow-600 dark:text-yellow-400 text-xl relative z-10 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
                auto_stories
              </span>
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t('bibleVersesForYou')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-icons-outlined text-gray-900 dark:text-white text-xl">
              close
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="relative p-4">
          {/* 배경 빛 효과 */}
          <div className="absolute top-10 right-10 w-40 h-40 bg-yellow-300/10 dark:bg-yellow-200/5 blur-3xl rounded-full"></div>
          <div className="absolute bottom-20 left-10 w-32 h-32 bg-yellow-400/10 dark:bg-yellow-300/5 blur-3xl rounded-full"></div>

          {/* Summary */}
          <div className="relative mb-4 p-3 bg-gradient-to-br from-yellow-50/80 to-white dark:from-yellow-900/10 dark:to-gray-800/50 rounded-lg border border-yellow-200/50 dark:border-yellow-700/30 shadow-[0_0_15px_rgba(250,204,21,0.1)]">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {verses.summary}
            </p>
          </div>

          {/* Verses */}
          <div className="space-y-4 relative z-10">
            {verses.verses.map((verse, index) => (
              <div 
                key={index}
                className="relative pb-4 border-b border-gray-200 dark:border-gray-800 last:border-0"
              >
                {/* 구절 주변 은은한 빛 */}
                <div className="absolute -left-2 top-0 w-1 h-full bg-gradient-to-b from-yellow-400/40 via-yellow-300/20 to-transparent dark:from-yellow-300/30 dark:via-yellow-200/10 blur-sm"></div>
                
                {/* Reference */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400/20 dark:bg-yellow-300/10 blur-sm rounded-full"></div>
                    <span className="material-icons-outlined text-yellow-600 dark:text-yellow-400 text-sm relative z-10">
                      menu_book
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
                    {verse.reference}
                  </h3>
                </div>

                {/* Text */}
                <blockquote className="mb-3 pl-3 border-l-2 border-yellow-400/50 dark:border-yellow-500/30">
                  <p className="text-base text-gray-900 dark:text-white leading-relaxed">
                    "{verse.text}"
                  </p>
                </blockquote>

                {/* Message */}
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-3">
                  {verse.message}
                </p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="relative mt-6 z-10">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BibleVersesModal
