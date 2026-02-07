import { useEffect, useState } from 'react'
import type { RecommendedVerses } from '../../../types/prayer'

interface BibleVersesModalProps {
  verses: RecommendedVerses
  onClose: () => void
}

import { useLanguage } from '../../../contexts/LanguageContext'

// 떠다니는 빛 입자 컴포넌트
const FloatingParticle = ({ delay }: { delay: number }) => (
  <div 
    className="absolute w-1 h-1 bg-yellow-300/60 dark:bg-yellow-200/40 rounded-full blur-sm animate-float"
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${3 + Math.random() * 2}s`
    }}
  />
)

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
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 떠다니는 빛 입자들 - 성령의 임재 표현 */}
      {[...Array(15)].map((_, i) => (
        <FloatingParticle key={i} delay={i * 0.3} />
      ))}

      <div 
        className={`relative bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 하늘에서 내려오는 빛 효과 - 더 강렬하게 */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-2 h-20 bg-gradient-to-b from-transparent via-yellow-300/80 to-yellow-400 dark:via-yellow-200/80 dark:to-yellow-300 blur-sm animate-pulse"></div>
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[3px] h-20 bg-gradient-to-b from-transparent via-yellow-400 to-yellow-500 dark:via-yellow-300 dark:to-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)]"></div>
        
        {/* 상단 빛 확산 효과 - 더 넓게 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-gradient-to-b from-yellow-300/40 via-yellow-200/20 to-transparent dark:from-yellow-200/30 dark:via-yellow-100/10 blur-3xl rounded-full animate-pulse"></div>

        {/* 호흡하는 후광 효과 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-radial from-yellow-400/20 via-yellow-300/10 to-transparent dark:from-yellow-300/15 dark:via-yellow-200/5 blur-3xl rounded-full animate-breathe"></div>

        {/* Header */}
        <div className="relative sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              {/* 아이콘 주변 빛 효과 - 더 강렬하게 */}
              <div className="absolute inset-0 bg-yellow-400/50 dark:bg-yellow-300/40 blur-lg rounded-full animate-pulse"></div>
              <div className="absolute inset-0 bg-yellow-300/30 dark:bg-yellow-200/20 blur-md rounded-full animate-ping"></div>
              <span className="material-icons-outlined text-yellow-600 dark:text-yellow-400 text-xl relative z-10 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] animate-bounce-slow">
                auto_stories
              </span>
            </div>
            <h2 className="text-base font-semibold bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 dark:from-yellow-400 dark:via-yellow-300 dark:to-yellow-400 bg-clip-text text-transparent animate-gradient">
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
          <div className="relative mb-4 p-4 bg-gradient-to-br from-yellow-50/90 via-amber-50/80 to-white dark:from-yellow-900/20 dark:via-amber-900/15 dark:to-gray-800/50 rounded-xl border border-yellow-200/60 dark:border-yellow-700/40 shadow-[0_0_20px_rgba(250,204,21,0.15)] overflow-hidden">
            {/* 배경 빛나는 효과 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300/20 dark:bg-yellow-200/10 rounded-full blur-2xl animate-pulse"></div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed relative z-10">
              {verses.summary}
            </p>
          </div>

          {/* Verses */}
          <div className="space-y-4 relative z-10">
            {verses.verses.map((verse, index) => (
              <div 
                key={index}
                className="relative pb-4 border-b border-gray-200 dark:border-gray-800 last:border-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* 구절 주변 강렬한 빛 */}
                <div className="absolute -left-2 top-0 w-1.5 h-full bg-gradient-to-b from-yellow-400/60 via-yellow-300/30 to-transparent dark:from-yellow-300/50 dark:via-yellow-200/20 blur-sm animate-pulse"></div>
                <div className="absolute -left-1 top-0 w-0.5 h-full bg-gradient-to-b from-yellow-500 via-yellow-400/50 to-transparent dark:from-yellow-400 dark:via-yellow-300/40 shadow-[0_0_10px_rgba(250,204,21,0.6)]"></div>
                
                {/* Reference */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400/60 dark:bg-yellow-300/50 blur-lg rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 bg-yellow-300/40 dark:bg-yellow-200/30 blur-md rounded-full animate-ping"></div>
                    <span className="material-icons-outlined text-yellow-600 dark:text-yellow-400 text-base relative z-10 drop-shadow-[0_0_15px_rgba(250,204,21,1)]">
                      menu_book
                    </span>
                  </div>
                  <h3 className="text-sm font-bold bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 dark:from-yellow-400 dark:via-amber-300 dark:to-yellow-400 bg-clip-text text-transparent uppercase tracking-wide drop-shadow-[0_0_15px_rgba(250,204,21,1)] animate-gradient">
                    {verse.reference}
                  </h3>
                </div>

                {/* Text - 말씀에 최대 임팩트 */}
                <blockquote className="mb-3 pl-5 border-l-4 border-yellow-400 dark:border-yellow-300 relative group">
                  {/* 말씀 주변 매우 강한 빛 효과 */}
                  <div className="absolute -left-3 top-0 w-6 h-full bg-gradient-to-r from-yellow-400/80 via-yellow-300/50 to-transparent dark:from-yellow-300/70 dark:via-yellow-200/40 blur-lg animate-pulse"></div>
                  <div className="absolute -left-2 top-0 w-3 h-full bg-gradient-to-r from-yellow-500 via-yellow-400/60 to-transparent dark:from-yellow-400 dark:via-yellow-300/50 blur-md shadow-[0_0_20px_rgba(250,204,21,0.8)]"></div>
                  
                  {/* 말씀 배경 빛 - 호흡하는 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-50/90 via-amber-50/60 to-transparent dark:from-yellow-900/30 dark:via-amber-900/20 rounded-r-xl animate-breathe"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/40 to-transparent dark:from-yellow-800/20 rounded-r-xl blur-sm"></div>
                  
                  {/* 반짝이는 효과 */}
                  <div className="absolute top-2 right-4 w-2 h-2 bg-yellow-400 dark:bg-yellow-300 rounded-full blur-sm animate-twinkle"></div>
                  <div className="absolute bottom-4 right-8 w-1.5 h-1.5 bg-amber-400 dark:bg-amber-300 rounded-full blur-sm animate-twinkle" style={{ animationDelay: '0.5s' }}></div>
                  
                  <p className="text-base font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-yellow-50 dark:to-white bg-clip-text text-transparent leading-relaxed relative z-10 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] dark:drop-shadow-[0_0_25px_rgba(253,224,71,0.6)] py-1">
                    "{verse.text}"
                  </p>
                </blockquote>

                {/* Message */}
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-4">
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
