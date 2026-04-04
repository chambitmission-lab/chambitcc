import { useState, useEffect } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { Prayer } from '../../../types/prayer'
import BibleVersesModal from './BibleVersesModal'

interface PrayerArticleProps {
  prayer: Prayer
  onPrayerToggle: (prayerId: number) => void
  onClick: () => void
  onReplyClick: () => void
}

const PrayerArticle = ({ prayer, onPrayerToggle, onClick, onReplyClick }: PrayerArticleProps) => {
  const { t, language } = useLanguage()
  const [isPraying, setIsPraying] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false) // 번역 보기 상태
  const [showVersesModal, setShowVersesModal] = useState(false) // 성경 구절 모달
  
  // 🎨 언어 전환 애니메이션 상태
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayTitle, setDisplayTitle] = useState(prayer.title)
  const [displayContent, setDisplayContent] = useState(prayer.content)

  const handlePray = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPraying) return
    setIsPraying(true)
    try {
      await onPrayerToggle(prayer.id)
    } finally {
      setIsPraying(false)
    }
  }

  // 번역이 있는지 확인
  const hasEnTranslation = !!(prayer.title_en && prayer.content_en)
  const hasKoTranslation = !!(prayer.title_ko && prayer.content_ko)
  const hasTranslation = hasEnTranslation || hasKoTranslation
  
  // 현재 표시할 제목과 내용 결정
  const currentTitle = showTranslation 
    ? (prayer.title_en || prayer.title_ko || prayer.title)
    : prayer.title
  const currentContent = showTranslation 
    ? (prayer.content_en || prayer.content_ko || prayer.content)
    : prayer.content
  
  // 🎨 Blur Fade 애니메이션 효과
  useEffect(() => {
    if (currentTitle !== displayTitle || currentContent !== displayContent) {
      setIsTransitioning(true)
      
      const timer = setTimeout(() => {
        setDisplayTitle(currentTitle)
        setDisplayContent(currentContent)
        setIsTransitioning(false)
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [currentTitle, currentContent, displayTitle, displayContent])
  
  // 버튼 텍스트 결정
  const translationButtonText = showTranslation 
    ? (hasKoTranslation ? '🇺🇸 EN' : '🇰🇷 한글') // 한글 번역 보는 중 → 영어(원문)로, 영어 번역 보는 중 → 한글(원문)로
    : (hasKoTranslation ? '🇰🇷 한글' : '🇺🇸 EN') // 원문 보는 중 → 번역 언어 표시

  // 애니메이션 스타일
  const transitionStyles: React.CSSProperties = {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isTransitioning ? 0 : 1,
    filter: isTransitioning ? 'blur(8px)' : 'blur(0px)',
    transform: isTransitioning ? 'translateY(-4px)' : 'translateY(0)',
  }

  return (
    <article 
      className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark pb-3 mb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
      onClick={onClick}
    >
      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* 주변 빛 확산 효과 */}
            <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-white/20 blur-md animate-pulse"></div>
            <div className="w-8 h-8 rounded-full backdrop-blur-md bg-gradient-to-b from-purple-400/60 via-purple-500/40 to-purple-600/25 dark:from-white/50 dark:via-white/30 dark:to-white/15 border-2 border-purple-500/70 dark:border-white/60 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_25px_rgba(168,85,247,0.6),0_-8px_20px_rgba(168,85,247,0.5),inset_0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[0_0_25px_rgba(255,255,255,0.4),0_-8px_20px_rgba(255,255,255,0.3),inset_0_1px_3px_rgba(255,255,255,0.6)] relative z-10">
              {prayer.display_name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">
              {prayer.display_name}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {prayer.time_ago}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasTranslation && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowTranslation(!showTranslation)
              }}
              className="group px-2.5 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 flex items-center gap-1"
              title={showTranslation ? '원문 보기' : '번역 보기'}
              style={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                className="group-hover:scale-110"
              >
                {translationButtonText.split(' ')[0]}
              </span>
              {' '}
              <span
                style={{
                  transition: 'letter-spacing 0.2s ease-in-out',
                }}
                className="group-hover:tracking-wider"
              >
                {translationButtonText.split(' ')[1]}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mb-3">
        <div className="relative">
          {/* 기도 카드 - 글래스모피즘 */}
          <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-4 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            {/* 내부 빛 효과 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-2xl"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-white/10 dark:to-white/5 rounded-full blur-2xl"></div>
            
            <h3 
              className="text-base font-extrabold text-gray-900 dark:text-white mb-2.5 tracking-[0.02em] relative z-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] uppercase"
              style={transitionStyles}
            >
              {displayTitle}
            </h3>
            
            <p 
              className="text-[15px] text-gray-600 dark:text-gray-400 leading-[1.7] relative z-10 font-normal tracking-[-0.01em] drop-shadow-[0_0_6px_rgba(168,85,247,0.2)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]"
              style={transitionStyles}
            >
              {displayContent}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 flex items-center gap-3 mb-2">
        <button
          onClick={handlePray}
          disabled={isPraying}
          className={`group flex items-center gap-1 transition-colors ${
            prayer.is_prayed ? 'text-ig-red' : 'text-gray-800 dark:text-white hover:opacity-70'
          }`}
        >
          <span className={`text-[24px] ${prayer.is_prayed ? 'material-icons-round' : 'material-icons-outlined'}`}>
            volunteer_activism
          </span>
        </button>

        {/* 성경 구절 버튼 */}
        {prayer.recommended_verses && prayer.recommended_verses.verses.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowVersesModal(true)
            }}
            className="group flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:opacity-70 transition-colors"
            title="성경 말씀 보기"
          >
            <span className="material-icons-outlined text-[24px]">
              auto_stories
            </span>
          </button>
        )}
      </div>

      {/* Stats - 한 줄로 통합 */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-gray-900 dark:text-white">
            {prayer.prayer_count}{language === 'ko' ? '명이 ' : ' '}{t('peopleArePraying')}
          </span>
          {prayer.reply_count > 0 && (
            <>
              <span className="text-gray-400 dark:text-gray-600">·</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  onReplyClick()
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {t('reply')} {prayer.reply_count}{t('replyCount')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 성경 구절 - 첫 번째 구절만 작게 표시 */}
      {prayer.recommended_verses && prayer.recommended_verses.verses.length > 0 && (
        <div className="px-4 pb-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowVersesModal(true)
            }}
            className="w-full bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-200/50 dark:border-purple-500/30 hover:border-purple-300 dark:hover:border-purple-400 transition-colors text-left"
          >
            <div className="flex items-start gap-2">
              <span className="material-icons-outlined text-purple-500 dark:text-purple-400 text-sm mt-0.5 flex-shrink-0">
                auto_stories
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-purple-700 dark:text-purple-300 mb-1">
                  {prayer.recommended_verses.verses[0].reference}
                </p>
                <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
                  "{prayer.recommended_verses.verses[0].text}"
                </p>
                {prayer.recommended_verses.verses.length > 1 && (
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">
                    +{prayer.recommended_verses.verses.length - 1}{language === 'ko' ? '개 더보기' : ' more'}
                  </p>
                )}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 성경 구절 모달 */}
      {showVersesModal && prayer.recommended_verses && (
        <BibleVersesModal
          verses={prayer.recommended_verses}
          onClose={() => setShowVersesModal(false)}
        />
      )}
    </article>
  )
}

export default PrayerArticle
