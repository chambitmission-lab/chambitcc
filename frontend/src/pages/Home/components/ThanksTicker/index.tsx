import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useAuth } from '../../../../hooks/useAuth'
import { THANKS_EMOTIONS } from '../../../../types/thanks'
import { useThanks } from '../ThanksThread/useThanks'
import ThanksComposer from '../ThanksThread/ThanksComposer'

const ThanksTicker = () => {
  const { language } = useLanguage()
  const { requireAuth } = useAuth()
  const navigate = useNavigate()
  const { items, loading, add } = useThanks({ limit: 20 })
  const [showComposer, setShowComposer] = useState(false)

  const handleOpenList = () => {
    navigate('/thanks')
  }

  const handleOpenComposer = () => {
    requireAuth(() => setShowComposer(true))
  }

  const empty = !loading && items.length === 0
  const marqueeItems = useMemo(
    () => (items.length > 0 ? [...items, ...items] : []),
    [items]
  )
  const durationSec = Math.max(20, items.length * 6)

  return (
    <section className="px-4 py-1.5">
      <div className="w-full rounded-2xl overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-700/30 hover:shadow-md transition-shadow flex items-stretch">
        {/* 본문 영역: 탭하면 /thanks 목록으로 이동 */}
        <button
          type="button"
          onClick={handleOpenList}
          className="flex-1 min-w-0 text-left active:scale-[0.99] transition-transform"
          aria-label={
            language === 'ko'
              ? '오늘의 감사 한 줄 전체 보기'
              : "See all today's gratitude"
          }
        >
          <div className="flex items-center gap-2 pl-3 pr-2 py-2.5">
            <span className="text-base shrink-0" aria-hidden>🙏</span>
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 whitespace-nowrap shrink-0">
              {language === 'ko' ? '오늘의 감사 한 줄' : "Today's Gratitude"}
            </span>

            <div className="flex-1 overflow-hidden relative h-5">
              {empty ? (
                <span className="block text-xs text-amber-800/80 dark:text-amber-200/80 truncate">
                  {language === 'ko'
                    ? '아직 감사가 없어요 — 옆 ✎ 으로 첫 감사를 ✨'
                    : 'No thanks yet — tap ✎ to share the first ✨'}
                </span>
              ) : loading && items.length === 0 ? (
                <span className="block text-xs text-amber-700/60 dark:text-amber-300/60">···</span>
              ) : (
                <div
                  className="thanks-ticker-track absolute left-0 top-0 flex whitespace-nowrap"
                  style={{ animationDuration: `${durationSec}s` }}
                >
                  {marqueeItems.map((t, i) => (
                    <span
                      key={`${t.id}-${i}`}
                      className="inline-flex items-center gap-1.5 pr-8 text-xs text-amber-900 dark:text-amber-100"
                    >
                      {t.emotion && (
                        <span aria-hidden>{THANKS_EMOTIONS[t.emotion].emoji}</span>
                      )}
                      <span>{t.content}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </button>

        {/* 작성 버튼: 탭하면 작성 모달 (로그인 필요) */}
        <button
          type="button"
          onClick={handleOpenComposer}
          className="shrink-0 px-3 flex items-center justify-center border-l border-amber-200/70 dark:border-amber-800/40 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 active:scale-95 transition"
          aria-label={language === 'ko' ? '감사 한 줄 적기' : 'Write a thanks'}
          title={language === 'ko' ? '감사 한 줄 적기' : 'Write a thanks'}
        >
          <span
            className="material-icons-outlined text-amber-600 dark:text-amber-400 text-xl"
            aria-hidden
          >
            edit_note
          </span>
        </button>
      </div>

      <style>{`
        @keyframes thanks-ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .thanks-ticker-track {
          animation-name: thanks-ticker-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .thanks-ticker-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .thanks-ticker-track { animation: none; }
        }
      `}</style>

      {showComposer && (
        <ThanksComposer onClose={() => setShowComposer(false)} onSubmit={add} />
      )}
    </section>
  )
}

export default ThanksTicker
