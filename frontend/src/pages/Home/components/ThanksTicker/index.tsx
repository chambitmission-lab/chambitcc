import { useMemo, useState } from 'react'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useAuth } from '../../../../hooks/useAuth'
import { THANKS_EMOTIONS } from '../../../../types/thanks'
import { useThanks } from '../ThanksThread/useThanks'
import ThanksComposer from '../ThanksThread/ThanksComposer'

const ThanksTicker = () => {
  const { language } = useLanguage()
  const { requireAuth } = useAuth()
  const { items, loading, add } = useThanks({ limit: 20 })
  const [showComposer, setShowComposer] = useState(false)

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
    <section className="px-4 pt-3 pb-1">
      <button
        type="button"
        onClick={handleOpenComposer}
        className="w-full text-left rounded-2xl overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/25 dark:via-orange-900/20 dark:to-amber-900/25 border border-amber-200/70 dark:border-amber-800/40 hover:shadow-md transition-shadow active:scale-[0.99]"
        aria-label={language === 'ko' ? '오늘의 감사 한 줄 적기' : "Write today's gratitude"}
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="text-base shrink-0" aria-hidden>🙏</span>
          <span className="text-xs font-bold text-amber-900 dark:text-amber-200 whitespace-nowrap shrink-0">
            {language === 'ko' ? '오늘의 감사 한 줄' : "Today's Gratitude"}
          </span>

          <div className="flex-1 overflow-hidden relative h-5">
            {empty ? (
              <span className="block text-xs text-amber-800/80 dark:text-amber-200/80 truncate">
                {language === 'ko'
                  ? '탭해서 첫 감사를 적어주세요 ✨'
                  : 'Tap to share your first thanks ✨'}
              </span>
            ) : loading && items.length === 0 ? (
              <span className="block text-xs text-amber-700/60 dark:text-amber-300/60">···</span>
            ) : (
              <div
                className="thanks-ticker-track absolute left-0 top-0 flex gap-8 whitespace-nowrap"
                style={{ animationDuration: `${durationSec}s` }}
              >
                {marqueeItems.map((t, i) => (
                  <span
                    key={`${t.id}-${i}`}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-100"
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

          <span
            className="material-icons-outlined text-amber-600 dark:text-amber-400 text-lg shrink-0"
            aria-hidden
          >
            edit_note
          </span>
        </div>
      </button>

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
