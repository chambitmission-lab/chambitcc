import { useEffect, useState } from 'react'
import type { RecommendedVerses } from '../../../types/prayer'

interface BibleVersesModalProps {
  verses: RecommendedVerses
  onClose: () => void
}

import { useLanguage } from '../../../contexts/LanguageContext'

const BibleVersesModal = ({ verses, onClose }: BibleVersesModalProps) => {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)

  // 등장 애니메이션
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50)
  }, [])

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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`relative bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="relative sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons-outlined text-gray-600 dark:text-gray-400 text-lg">
              auto_stories
            </span>
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('versesToMeditateOn')}
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
          {/* Summary */}
          <div className="relative mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              💡 {verses.summary}
            </p>
          </div>

          {/* Verses */}
          <div className="space-y-4">
            {verses.verses.map((verse, index) => (
              <div 
                key={index}
                className="pb-4 border-b border-gray-200 dark:border-gray-800 last:border-0"
              >
                {/* Reference */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="material-icons-outlined text-gray-500 dark:text-gray-400 text-sm">
                    menu_book
                  </span>
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {verse.reference}
                  </h3>
                </div>

                {/* Text */}
                <blockquote className="mb-2 pl-3 border-l-2 border-gray-300 dark:border-gray-600">
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    "{verse.text}"
                  </p>
                </blockquote>

                {/* Message */}
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-3">
                  {verse.message}
                </p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm rounded-lg hover:opacity-90 transition-opacity"
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
