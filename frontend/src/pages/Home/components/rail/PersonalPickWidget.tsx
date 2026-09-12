// 2.5 참비의 오늘 추천 (맞춤 말씀·기도).

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchPrayers } from '../../../../api/prayer'
import chambiAvatar from '../../../../components/chatbot/img/default.webp'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useSituationCategories, useSituationVerses } from '../../../../hooks/useSituation'
import { EmotionGlyph } from '../EmotionIcons'
import type { SituationCategory } from '../../../../types/situation'
import { tokenStore } from '../../../../utils/tokenStore'
import { prayerKeys } from '../../../../hooks/usePrayersQuery'
import { EMOTION_META, pick } from './shared'
import { useWeeklyPrayerStats } from './queries'

// ── 2.5 참비의 오늘 추천 (맞춤 말씀·기도) ───────────────────────────────
//
// 개인화 근거 우선순위: ① 내 최근 기도의 감정 태그 → ② 이번주 성도들 1위 감정 → ③ 기본 카테고리.
// 감정은 상황별 성구 카테고리(emotion_keys)로 이어지고, 그 카테고리 구절 중 하나를
// 날짜 기준으로 고정 선택해 하루 동안 같은 말씀이 유지되게 한다. 백엔드 무변경.

// 내 최근 기도 1건 — 로그인 사용자만. 감정 태그만 쓴다.
const useMyLatestPrayer = (enabled: boolean) =>
  useQuery({
    queryKey: prayerKeys.mineLatest(),
    queryFn: async () => {
      const res = await fetchPrayers(1, 1, 'latest', null, 'my_prayers')
      return res.data.items[0] ?? null
    },
    enabled,
    staleTime: 1000 * 60 * 10,
  })

const dayOfYear = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000)
}

const PersonalPickWidget = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const loggedIn = !!tokenStore.getAccess()
  const { data: myPrayer } = useMyLatestPrayer(loggedIn)
  const weekly = useWeeklyPrayerStats()
  const { data: categories = [] } = useSituationCategories()

  // 근거 결정 — 어떤 감정으로 추천했는지 카드에 그대로 밝힌다(블랙박스 금지)
  const basis = useMemo<{ emotion: string | null; source: 'mine' | 'week' | 'default' }>(() => {
    if (myPrayer?.emotion) return { emotion: myPrayer.emotion, source: 'mine' }
    const top = weekly.data?.emotions?.[0]?.emotion
    if (top) return { emotion: top, source: 'week' }
    return { emotion: null, source: 'default' }
  }, [myPrayer, weekly.data])

  const category = useMemo<SituationCategory | undefined>(() => {
    const withVerses = categories.filter((c) => c.verse_count > 0)
    if (basis.emotion) {
      const hit = withVerses.find((c) => c.emotion_keys?.includes(basis.emotion!))
      if (hit) return hit
    }
    return withVerses.find((c) => c.is_default) ?? withVerses[0]
  }, [categories, basis])

  const { data: withVerses, isLoading } = useSituationVerses(category?.id ?? 0, !!category)
  const verse = useMemo(() => {
    const list = withVerses?.verses ?? []
    if (list.length === 0) return null
    return list[dayOfYear() % list.length]
  }, [withVerses])

  if (!category) return null

  const meta = basis.emotion ? EMOTION_META[basis.emotion] : undefined
  const emotionLabel = meta ? pick(language, meta.label, meta.labelEn) : ''
  const reason =
    basis.source === 'mine'
      ? t('homeRailPickReasonMine').replace('{e}', emotionLabel)
      : basis.source === 'week'
        ? t('homeRailPickReasonWeek').replace('{e}', emotionLabel)
        : t('homeRailPickReasonDefault')
  const ref = verse ? `${verse.book_name_ko} ${verse.chapter}:${verse.verse}` : ''

  return (
    <section className="px-4 pt-3">
      <div
        className="relative overflow-hidden rounded-2xl border border-[var(--brand-soft-strong)] p-4"
        style={{
          background:
            'linear-gradient(160deg, var(--brand-soft) 0%, var(--surface-container) 45%, var(--surface-container) 100%)',
        }}
      >
        {/* 우상단 오로라 — 추천 카드를 은은하게 띄워주는 장식 */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full"
          style={{ background: 'radial-gradient(circle, var(--brand-glow), rgba(0,0,0,0) 70%)', opacity: 0.6 }}
        />
        <div className="relative flex items-center gap-2">
          <img src={chambiAvatar} alt="" className="h-7 w-7 rounded-full ring-2 ring-white/70 dark:ring-white/10" draggable={false} />
          <p className="text-[13.5px] font-bold tracking-[-0.02em] text-ink-strong">{t('homeRailPickTitle')}</p>
        </div>

        <p className="relative mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] font-semibold text-brand">
          {meta && <EmotionGlyph emotion={basis.emotion!} fallback={meta.emoji} size={12} className="shrink-0" />}
          {reason}
        </p>

        {isLoading || !verse ? (
          <div className="relative mt-3 space-y-2" aria-hidden>
            <div className="h-3 w-11/12 animate-pulse rounded-full bg-[var(--surface-inset)]" />
            <div className="h-3 w-9/12 animate-pulse rounded-full bg-[var(--surface-inset)]" />
            <div className="h-3 w-4/12 animate-pulse rounded-full bg-[var(--surface-inset)]" />
          </div>
        ) : (
          <>
            <p className="font-serif-kr relative mt-3 text-[15px] font-normal leading-[1.7] text-ink-strong line-clamp-3 break-keep">
              “{verse.text}”
            </p>
            <p className="relative mt-1 text-[11.5px] font-bold text-brand tabular-nums">{ref}</p>
            {verse.message && (
              <p className="relative mt-1.5 text-[11.5px] leading-relaxed text-ink-muted line-clamp-2 break-keep">
                {verse.message}
              </p>
            )}
          </>
        )}

        <div className="relative mt-3">
          <button
            type="button"
            onClick={() => verse && navigate(`/bible/${verse.book_number}/${verse.chapter}`)}
            disabled={!verse}
            className="w-full rounded-full bg-[var(--brand)] px-3 py-1.5 text-[12px] font-bold text-white shadow-[0_6px_14px_-6px_var(--brand-glow)] active:scale-[0.97] transition-transform duration-150 disabled:opacity-50"
          >
            {t('homeRailPickRead')}
          </button>
        </div>
      </div>
    </section>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { PersonalPickWidget }
