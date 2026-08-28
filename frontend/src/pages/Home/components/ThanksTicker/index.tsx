import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useAuth } from '../../../../hooks/useAuth'
import { THANKS_EMOTIONS } from '../../../../types/thanks'
import { ThanksIcon } from '../../../../components/icons/ThanksIcons'
import { useThanks } from '../ThanksThread/useThanks'
import ThanksComposer from '../ThanksThread/ThanksComposer'
import { PencilIcon } from '../../../../components/icons/ActionIcons'

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
    // 공동체 그룹 리스트 카드의 한 행(row) — 배경·테두리는 부모 그룹 카드가 담당
    <div>
      <div className="w-full hover:bg-[var(--brand-soft)] transition-colors flex items-stretch">
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
          <div className="flex items-center gap-2.5 pl-3 pr-1.5 py-2.5">
            <span
              className="w-8 h-8 rounded-[10px] bg-[rgba(236,95,143,0.12)] flex items-center justify-center shrink-0"
              aria-hidden
            >
              <span className="material-icons-round text-[17px] text-[#ec5f8f]">
                volunteer_activism
              </span>
            </span>
            <span className="text-xs font-bold text-[var(--text-strong)] whitespace-nowrap shrink-0">
              {language === 'ko' ? '오늘의 감사 한 줄' : "Today's Gratitude"}
            </span>

            <div className="flex-1 overflow-hidden relative h-5">
              {empty ? (
                <span className="block text-[12px] text-[var(--text-muted)] truncate">
                  {language === 'ko'
                    ? '아직 감사가 없어요 — 옆 ✎ 으로 첫 감사를 나눠주세요'
                    : 'No thanks yet — tap ✎ to share the first one'}
                </span>
              ) : loading && items.length === 0 ? (
                <span className="block text-[12px] text-[var(--text-muted)]">···</span>
              ) : (
                <div
                  className="thanks-ticker-track absolute left-0 top-0 flex whitespace-nowrap"
                  style={{ animationDuration: `${durationSec}s` }}
                >
                  {marqueeItems.map((t, i) => (
                    <span
                      key={`${t.id}-${i}`}
                      className="inline-flex items-center gap-1.5 pr-8 text-[12px] text-[var(--text-strong)]"
                    >
                      {t.emotion && (
                        <ThanksIcon
                          name={t.emotion}
                          size={13}
                          strokeWidth={2}
                          style={{ color: THANKS_EMOTIONS[t.emotion].hue }}
                        />
                      )}
                      <span>{t.content}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </button>

        {/* 작성 버튼: 탭하면 작성 모달 (로그인 필요).
            세로 구분선을 쓰면 이 행만 '표의 칸'처럼 보여 아래 두 행과 문법이 갈린다.
            대신 채워진 원형 칩으로 "버튼"임을 보이고, 폭 28px 슬롯은 아래 갈매기와 같은 축 */}
        <button
          type="button"
          onClick={handleOpenComposer}
          className="shrink-0 pl-1 pr-2.5 flex items-center justify-center active:scale-95 transition"
          aria-label={language === 'ko' ? '감사 한 줄 적기' : 'Write a thanks'}
          title={language === 'ko' ? '감사 한 줄 적기' : 'Write a thanks'}
        >
          <span className="w-7 h-7 rounded-full bg-[var(--brand-soft-strong)] text-brand flex items-center justify-center">
            <PencilIcon />
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
    </div>
  )
}

export default ThanksTicker
