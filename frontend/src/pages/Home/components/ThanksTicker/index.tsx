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
      <div className="w-full rounded-2xl overflow-hidden bg-gradient-to-r from-purple-50/80 via-pink-50/60 to-purple-50/80 dark:from-purple-500/[0.08] dark:via-pink-500/[0.06] dark:to-purple-500/[0.08] border border-purple-200/60 dark:border-purple-400/20 shadow-[0_2px_12px_rgba(168,85,247,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-md transition-shadow flex items-stretch">
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
            <span className="material-icons-round text-[18px] shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent" aria-hidden>
              volunteer_activism
            </span>
            <span className="text-[12px] font-bold tracking-[-0.01em] text-purple-700 dark:text-purple-200 whitespace-nowrap shrink-0">
              {language === 'ko' ? '오늘의 감사 한 줄' : "Today's Gratitude"}
            </span>

            <div className="flex-1 overflow-hidden relative h-5">
              {empty ? (
                <span className="block text-[12px] text-purple-700/80 dark:text-purple-200/80 truncate">
                  {language === 'ko'
                    ? '아직 감사가 없어요 — 옆 ✎ 으로 첫 감사를 나눠주세요'
                    : 'No thanks yet — tap ✎ to share the first one'}
                </span>
              ) : loading && items.length === 0 ? (
                <span className="block text-[12px] text-purple-600/60 dark:text-purple-300/60">···</span>
              ) : (
                <div
                  className="thanks-ticker-track absolute left-0 top-0 flex whitespace-nowrap"
                  style={{ animationDuration: `${durationSec}s` }}
                >
                  {marqueeItems.map((t, i) => (
                    <span
                      key={`${t.id}-${i}`}
                      className="inline-flex items-center gap-1.5 pr-8 text-[12px] text-purple-900 dark:text-purple-100"
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
          className="shrink-0 px-3 flex items-center justify-center border-l border-purple-200/60 dark:border-purple-400/20 hover:bg-purple-100/50 dark:hover:bg-purple-500/10 active:scale-95 transition"
          aria-label={language === 'ko' ? '감사 한 줄 적기' : 'Write a thanks'}
          title={language === 'ko' ? '감사 한 줄 적기' : 'Write a thanks'}
        >
          <span
            className="material-icons-outlined text-purple-600 dark:text-purple-300 text-xl"
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
