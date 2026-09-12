// 2. 이번주 기도 태그.

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useSituationCategories } from '../../../../hooks/useSituation'
import { EmotionGlyph, TagIcon } from '../EmotionIcons'
import type { SituationCategory } from '../../../../types/situation'
import { EMOTION_META, pick } from './shared'
import { RailLabel } from './RailLabel'
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

  return (
    <section className="px-4 pt-3">
      <RailLabel>
        <TagIcon size={14} className="shrink-0" />
        {showReal ? t('homeRailTagsWeekTitle') : t('homeRailTagsCuratedTitle')}
      </RailLabel>
      <div className="feed-card rounded-2xl p-3.5">
        {showReal && (
          <p className="px-0.5 mb-2 text-[11.5px] text-gray-400 dark:text-white/45">
            {t('homeRailTagsHint')}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {showReal
            ? weeklyEmotions.map(({ emotion, count }, idx) => {
                const meta = EMOTION_META[emotion]
                if (!meta) return null
                const cat = categoryForEmotion(emotion)
                // 이번주 1위 감정은 브랜드로 채운 히어로 칩 — 통계 카드의 히어로 타일과 같은 문법
                const top = idx === 0
                return (
                  <button
                    key={emotion}
                    type="button"
                    onClick={() =>
                      navigate(cat ? `/bible/situation?c=${cat.id}` : '/bible/situation')
                    }
                    className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1.5 rounded-full text-[12px] font-semibold active:scale-[0.97] transition-[background-color,transform,box-shadow] duration-150 ${
                      top
                        ? 'text-white shadow-[0_6px_14px_-6px_var(--brand-glow)]'
                        : 'bg-[var(--brand-soft)] text-brand hover:bg-[var(--brand-soft-strong)]'
                    }`}
                    style={
                      top
                        ? { background: 'linear-gradient(135deg, var(--brand-dim), var(--brand) 60%, #6cb0ff)' }
                        : undefined
                    }
                  >
                    <EmotionGlyph emotion={emotion} fallback={meta.emoji} size={14} className="shrink-0" />
                    {pick(language, meta.label, meta.labelEn)}
                    {/* --brand는 CSS 변수라 /70 투명도 수식자가 조용히 미생성 → 인라인 알파 배지로 */}
                    <span
                      className={`ml-0.5 min-w-[18px] px-1.5 py-px rounded-full text-[10.5px] font-bold tabular-nums text-center ${
                        top ? 'bg-white/20 text-white' : 'bg-[var(--brand-soft-strong)]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })
            : curated.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => navigate(`/bible/situation?c=${cat.id}`)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--brand-soft)] text-brand text-[12px] font-semibold hover:bg-[var(--brand-soft-strong)] active:scale-[0.97] transition-[background-color,transform] duration-150"
                >
                  {/* icon은 Material Icons 리가처 이름 — 텍스트로 찍히지 않게 아이콘 폰트로 렌더 */}
                  <span className="material-icons-round text-[13px]" aria-hidden>
                    {cat.icon}
                  </span>
                  {cat.name}
                </button>
              ))}
          <button
            type="button"
            onClick={() => navigate('/bible/situation')}
            className="px-2.5 py-1.5 rounded-full border border-[var(--card-border)] text-[12px] font-semibold text-ink-muted hover:text-brand hover:border-[var(--brand-glow)] active:scale-[0.97] transition-colors duration-150"
          >
            {t('homeRailMore')}
          </button>
        </div>
      </div>
    </section>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { SituationTagsWidget }
