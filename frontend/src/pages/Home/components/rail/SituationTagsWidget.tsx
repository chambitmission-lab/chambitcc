// 2. 이번주 기도 태그.

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useSituationCategories } from '../../../../hooks/useSituation'
import type { SituationCategory } from '../../../../types/situation'
import { EMOTION_META, pick } from './shared'
import { useWeeklyPrayerStats } from './queries'

// ── 2. 기도 태그 ──────────────────────────────────────────────────────

const SituationTagsWidget = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const weekly = useWeeklyPrayerStats()
  const { data: categories = [] } = useSituationCategories()

  // 이번주 성도들이 기도 작성 때 실제로 고른 감정 태그 (많이 고른 순)
  const weeklyEmotions = weekly.data?.emotions ?? []

  // 감정 → 상황별 성구 카테고리 (emotion_keys 매핑, 없으면 목록으로)
  const categoryForEmotion = (emotion: string): SituationCategory | undefined =>
    categories.find((c) => c.emotion_keys?.includes(emotion) && c.verse_count > 0)

  // 폴백: 이번주 데이터가 없으면(주 초반·구버전 백엔드) 상황별 성구 큐레이션을
  // "인기"라는 이름 없이 정직하게 보여준다
  const curated = useMemo(
    () =>
      [...categories]
        .filter((c) => c.verse_count > 0)
        .sort((a, b) => b.verse_count - a.verse_count)
        .slice(0, 8),
    [categories],
  )

  const showReal = weeklyEmotions.length > 0

  if (!showReal && curated.length === 0) return null

  // 이번주 실측이면 감정 이름 + 위첨자 횟수, 폴백이면 큐레이션 카테고리 이름만
  const words = showReal
    ? weeklyEmotions.flatMap(({ emotion, count }) => {
        const meta = EMOTION_META[emotion]
        if (!meta) return []
        const cat = categoryForEmotion(emotion)
        return [
          {
            key: emotion,
            label: pick(language, meta.label, meta.labelEn),
            count: count as number | undefined,
            to: cat ? `/bible/situation?c=${cat.id}` : '/bible/situation',
          },
        ]
      })
    : curated.map((cat) => ({
        key: String(cat.id),
        label: cat.name,
        count: undefined as number | undefined,
        to: `/bible/situation?c=${cat.id}`,
      }))

  return (
    <section className="px-4 pt-3">
      <div className="feed-card rounded-2xl px-[18px] pt-4 pb-4">
        <p className="text-[12px] font-semibold text-[var(--text-muted)]">
          {showReal ? t('homeRailTagsWeekTitle') : t('homeRailTagsCuratedTitle')}
        </p>
        {/* 태그를 칩이 아니라 한 문장으로 읽힌다 — "혼란¹, 감사¹, 외로움¹ 의 마음이 모였어요".
            단어마다 밑줄 링크라 누르면 그 마음에 맞는 상황별 말씀으로 간다 */}
        <p className="mt-2 break-keep text-[16.5px] font-bold leading-[1.7] tracking-[-0.02em] text-ink-strong">
          {words.map((w, i) => (
            <span key={w.key}>
              {i > 0 && ', '}
              {/* 단어와 위첨자 횟수는 한 덩어리 — 줄이 바뀌어도 숫자만 떨어지지 않게 */}
              <span className="whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => navigate(w.to)}
                  className="border-b-[1.5px] border-[var(--brand-soft-strong)] pb-px text-brand transition-colors duration-150 hover:border-[var(--brand)]"
                >
                  {w.label}
                </button>
                {w.count !== undefined && (
                  <sup className="ml-0.5 text-[10px] font-bold tabular-nums text-[var(--text-muted)]">
                    {w.count}
                  </sup>
                )}
              </span>
            </span>
          ))}
          {showReal && <span className="ml-1 whitespace-nowrap">{t('homeRailTagsSentenceTail')}</span>}
        </p>
        <button
          type="button"
          onClick={() => navigate('/bible/situation')}
          className="mt-3 flex w-full items-center justify-between rounded-xl bg-[var(--brand-soft)] px-3.5 py-[11px] text-[13px] font-bold text-brand transition-colors duration-150 hover:bg-[var(--brand-soft-strong)] active:scale-[0.99]"
        >
          {t('homeRailTagsCta')}
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { SituationTagsWidget }
