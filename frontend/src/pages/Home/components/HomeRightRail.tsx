// 홈 PC 우측 위젯 레일 — 넓은 화면에서만 붙는 세 번째 컬럼.
// 기도 현황 · 기도 태그 · 말씀 알림 배너 · 오늘의 일정 · 말씀 카드 배너.
//
// 기도 현황·태그는 /prayers/stats/weekly (이번주 KST 실측 집계, 백엔드 배포 필요)를
// 쓰고, 구버전 백엔드(404)면 기존 누적 통계 + 큐레이션 태그로 자동 폴백한다.
import { useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { API_V1, apiFetch } from '../../../config/api'
import { fetchPrayers } from '../../../api/prayer'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useSituationCategories } from '../../../hooks/useSituation'
import { useEvents } from '../../../hooks/useEvents'
import { getSundayServices, getWeekdayServices } from '../../../api/worship'
import { parseServiceTimes, serviceDays } from '../../../utils/worshipSchedule'
import { CATEGORY_VISUAL } from '../../Events/utils/categoryConfig'
import { CalendarIcon, EmotionGlyph, PrayIcon, TagIcon } from './EmotionIcons'
import type { Language } from '../../../locales'
import type { Event } from '../../../types/event'
import type { SituationCategory } from '../../../types/situation'

// 표시 전용 — 영어 모드에서 _en 값이 있으면 사용, 없으면 한글로 폴백 (Worship.tsx와 같은 규칙).
// 요일·시간 파싱은 항상 한글 원본 필드를 쓴다.
const pick = (language: Language, ko: string | undefined | null, en: string | undefined | null): string =>
  language === 'en' && en ? en : (ko ?? '')

// ── 데이터 훅 ─────────────────────────────────────────────────────────

interface WeeklyPrayerStats {
  week_start: string
  week_end: string
  prayers_today: number
  prayers_week: number
  amens_week: number
  answered_week: number
  emotions: { emotion: string; count: number }[]
}

// 이번주(월~일 KST) 실측 집계 — 구버전 백엔드에는 없으므로 실패 시 폴백 경로를 탄다
const useWeeklyPrayerStats = () =>
  useQuery({
    queryKey: ['prayer-stats', 'weekly'],
    queryFn: async (): Promise<WeeklyPrayerStats> => {
      const res = await apiFetch(`${API_V1}/prayers/stats/weekly`)
      if (!res.ok) throw new Error('주간 기도 현황을 불러오지 못했습니다')
      const json = await res.json()
      return json.data as WeeklyPrayerStats
    },
    // 서버도 5분 캐시라 더 자주 물어봐야 새 숫자가 없다 — 15분이면 충분
    staleTime: 1000 * 60 * 15,
    retry: 1,
  })

interface PrayerStatsSummary {
  total_prayers: number
  active_prayers: number
  prayers_today: number
  total_reactions: number
}

// 폴백용 누적 통계 (구버전 백엔드에도 있는 엔드포인트)
const usePrayerStatsSummary = (enabled: boolean) =>
  useQuery({
    queryKey: ['prayer-stats', 'summary'],
    queryFn: async (): Promise<PrayerStatsSummary> => {
      const res = await apiFetch(`${API_V1}/prayers/stats/summary`)
      if (!res.ok) throw new Error('기도 통계를 불러오지 못했습니다')
      const json = await res.json()
      return json.data as PrayerStatsSummary
    },
    staleTime: 1000 * 60 * 15,
    enabled,
  })

// 폴백용 응답의 전당 총 건수 — 목록 API의 total만 쓴다 (limit=1로 최소 페이로드)
const useAnsweredTotal = (enabled: boolean) =>
  useQuery({
    queryKey: ['prayer-stats', 'answered-total'],
    queryFn: async () => {
      const res = await fetchPrayers(1, 1, 'latest', null, null, true)
      return res.data.total
    },
    staleTime: 1000 * 60 * 15,
    enabled,
  })

const todayStr = () => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// ── 공용 소품 ─────────────────────────────────────────────────────────

// "함께 나누는 은혜" 헤더와 같은 문법의 섹션 라벨
const RailLabel = ({ children }: { children: ReactNode }) => (
  <p className="px-1 mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.05em] text-[var(--text-muted)]">
    {children}
  </p>
)

interface StatTile {
  label: string
  value: number | undefined
  unit: string
}

const StatTiles = ({ tiles }: { tiles: StatTile[] }) => (
  <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
    {tiles.map((tile) => (
      <div key={tile.label} className="min-w-0">
        <p className="text-[11.5px] text-gray-400 dark:text-white/45">
          {tile.label}
        </p>
        <p className="mt-0.5 text-[17px] font-bold text-ink-strong tabular-nums tracking-[-0.01em]">
          {tile.value === undefined ? (
            <span className="text-gray-300 dark:text-white/25">—</span>
          ) : (
            <>
              {tile.value.toLocaleString()}
              <span className="ml-0.5 text-[12px] font-semibold text-ink-muted">
                {tile.unit}
              </span>
            </>
          )}
        </p>
      </div>
    ))}
  </div>
)

// ── 1. 기도 현황 ──────────────────────────────────────────────────────

// "8.17 ~ 8.23" — 이번주 범위를 카드 안에서 조용히 밝힌다
const weekRangeLabel = (start: string, end: string) => {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split('-')
    return `${Number(m)}.${Number(d)}`
  }
  return `${fmt(start)} ~ ${fmt(end)}`
}

const PrayerStatsWidget = () => {
  const { t } = useLanguage()
  const weekly = useWeeklyPrayerStats()
  // 주간 API가 없는 구버전 백엔드에서만 누적 통계로 대체
  const { data: summary } = usePrayerStatsSummary(weekly.isError)
  const { data: answeredTotal } = useAnsweredTotal(weekly.isError)

  const count = t('homeRailUnitCount')
  const times = t('homeRailUnitTimes')
  const tiles: StatTile[] = weekly.data
    ? [
        { label: t('homeRailStatToday'), value: weekly.data.prayers_today, unit: count },
        { label: t('homeRailStatWeek'), value: weekly.data.prayers_week, unit: count },
        { label: t('homeRailStatAmen'), value: weekly.data.amens_week, unit: times },
        { label: t('homeRailStatAnswered'), value: weekly.data.answered_week, unit: count },
      ]
    : [
        { label: t('homeRailStatToday'), value: summary?.prayers_today, unit: count },
        { label: t('homeRailStatShared'), value: summary?.active_prayers, unit: count },
        { label: t('homeRailStatAmenTotal'), value: summary?.total_reactions, unit: times },
        { label: t('homeRailStatAnsweredTotal'), value: answeredTotal, unit: count },
      ]

  return (
    <section className="px-4 pt-3">
      <div className="feed-card rounded-2xl p-4">
        <p className="mb-3 flex items-center gap-1.5 text-[12.5px] font-bold text-ink-strong">
          <PrayIcon size={14} className="shrink-0" />
          {weekly.data ? t('homeRailPrayerWeekTitle') : t('homeRailPrayerTitle')}
          {weekly.data && (
            <span className="ml-auto text-[10.5px] font-semibold text-gray-400 dark:text-white/40 tabular-nums">
              {weekRangeLabel(weekly.data.week_start, weekly.data.week_end)}
            </span>
          )}
        </p>
        <StatTiles tiles={tiles} />
      </div>
    </section>
  )
}

// ── 2. 기도 태그 ──────────────────────────────────────────────────────

// 기도 작성 시트의 감정 옵션과 같은 키·이모지·라벨 (PrayerComposer와 동기화)
const EMOTION_META: Record<string, { emoji: string; label: string; labelEn: string }> = {
  anxious: { emoji: '😟', label: '불안', labelEn: 'Anxious' },
  tired: { emoji: '😮‍💨', label: '지침', labelEn: 'Weary' },
  sad: { emoji: '😢', label: '슬픔', labelEn: 'Sad' },
  lonely: { emoji: '🥺', label: '외로움', labelEn: 'Lonely' },
  angry: { emoji: '😠', label: '분노', labelEn: 'Angry' },
  confused: { emoji: '😵‍💫', label: '혼란', labelEn: 'Lost' },
  hopeful: { emoji: '🌱', label: '소망', labelEn: 'Hopeful' },
  grateful: { emoji: '🙏', label: '감사', labelEn: 'Grateful' },
}

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
            ? weeklyEmotions.map(({ emotion, count }) => {
                const meta = EMOTION_META[emotion]
                if (!meta) return null
                const cat = categoryForEmotion(emotion)
                return (
                  <button
                    key={emotion}
                    type="button"
                    onClick={() =>
                      navigate(cat ? `/bible/situation?c=${cat.id}` : '/bible/situation')
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--brand-soft)] text-brand text-[12px] font-semibold hover:bg-[var(--brand-soft-strong)] active:scale-[0.97] transition-[background-color,transform] duration-150"
                  >
                    <EmotionGlyph emotion={emotion} fallback={meta.emoji} size={14} className="shrink-0" />
                    {pick(language, meta.label, meta.labelEn)}
                    {/* --brand는 CSS 변수라 /70 투명도 수식자가 조용히 미생성 → opacity로 */}
                    <span className="text-[11px] font-bold opacity-70 tabular-nums">
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

// ── 3. 말씀 알림 배너 ─────────────────────────────────────────────────

const AlarmBanner = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  return (
    <section className="px-4 pt-3">
      <div className="rounded-2xl p-4 border border-[var(--card-border)] bg-gradient-to-br from-[#eef4ff] to-[#e3edff] dark:from-[#141d30] dark:to-[#101828] relative overflow-hidden">
        <span className="absolute -right-3 -bottom-4 text-[64px] opacity-20 select-none" aria-hidden>
          🔔
        </span>
        <p className="text-[14.5px] font-bold text-ink-strong leading-snug">
          {t('homeRailAlarmTitle1')}
          <br />
          {t('homeRailAlarmTitle2')}
        </p>
        <p className="mt-1 text-[12px] text-ink-muted leading-relaxed">
          {t('homeRailAlarmBody1')}
          <br />
          {t('homeRailAlarmBody2')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/bible/alarm')}
          className="mt-3 px-3.5 py-1.5 rounded-full brand-gradient text-[12.5px] font-bold active:scale-[0.97] transition-transform duration-150"
        >
          {t('homeRailAlarmCta')}
        </button>
      </div>
    </section>
  )
}

// ── 4. 오늘의 일정 ────────────────────────────────────────────────────

// 예배 시간표(/worship과 같은 데이터·파서) — 오늘 요일에 열리는 고정 예배를
// 일정 위젯에 자동 합류시킨다. 관리자가 일정으로 따로 등록할 필요 없음.
const useWorshipServicesAll = () =>
  useQuery({
    queryKey: ['worship-services', 'all'],
    queryFn: async () => {
      const [sunday, weekday] = await Promise.all([
        getSundayServices(),
        getWeekdayServices(),
      ])
      return [...sunday, ...weekday]
    },
    // 예배 시간표는 사실상 고정 데이터
    staleTime: 1000 * 60 * 30,
  })

const minutesToLabel = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

const isoToMinutes = (iso: string): number | null => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.getHours() * 60 + d.getMinutes()
}

// 예배와 등록 일정을 한 타임라인으로 합치기 위한 공통 행 모델
interface ScheduleItem {
  key: string
  startMin: number
  title: string
  location?: string | null
  dot: string
  onClick: () => void
}

const TodayScheduleWidget = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const today = useMemo(todayStr, [])
  const { events, loading: eventsLoading } = useEvents(today, today)
  const { data: services, isLoading: worshipLoading } = useWorshipServicesAll()

  const sorted = useMemo<ScheduleItem[]>(() => {
    const todayDow = new Date().getDay()

    // 고정 예배 — 오늘 요일에 열리는 회차만 (수요기도회처럼 복수 시간이면 회차별 행)
    const worshipItems: ScheduleItem[] = (services ?? [])
      .filter((s) => s.is_active)
      .flatMap((s) => {
        const days = serviceDays(s)
        if (!days || !days.includes(todayDow)) return []
        return parseServiceTimes(s.time).map((startMin) => ({
          key: `worship-${s.id}-${startMin}`,
          startMin,
          title: pick(language, s.name, s.name_en),
          location: pick(language, s.location, s.location_en) || null,
          dot: CATEGORY_VISUAL.worship.dot,
          onClick: () => navigate('/worship'),
        }))
      })

    // 관리자가 등록한 오늘 일정
    const eventItems: ScheduleItem[] = events.flatMap((ev: Event) => {
      const startMin = isoToMinutes(ev.start_datetime)
      if (startMin === null) return []
      const visual = CATEGORY_VISUAL[ev.category] ?? CATEGORY_VISUAL.other
      return [{
        key: `event-${ev.id}`,
        startMin,
        title: ev.title,
        location: ev.location,
        dot: visual.dot,
        onClick: () => navigate(`/events/${ev.id}`),
      }]
    })

    return [...worshipItems, ...eventItems].sort((a, b) => a.startMin - b.startMin)
  }, [services, events, navigate, language])

  const visible = sorted.slice(0, 5)
  const restCount = sorted.length - visible.length
  const loading = (eventsLoading || worshipLoading) && sorted.length === 0

  return (
    <section className="px-4 pt-3">
      <div className="px-1 mb-1.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.05em] text-[var(--text-muted)]">
          <CalendarIcon size={14} className="shrink-0" /> {t('homeRailTodayTitle')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/events')}
          className="text-[11.5px] font-semibold text-ink-muted hover:text-brand transition-colors"
        >
          {t('homeRailViewAll')}
        </button>
      </div>
      <div className="feed-card rounded-2xl p-4">
        {loading ? (
          <p className="text-[12.5px] text-gray-400 dark:text-white/40 text-center py-2">
            {t('homeRailScheduleLoading')}
          </p>
        ) : visible.length === 0 ? (
          <p className="text-[12.5px] text-gray-400 dark:text-white/40 text-center py-2">
            {t('homeRailScheduleEmpty')}
          </p>
        ) : (
          <ul className="space-y-3">
            {visible.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={item.onClick}
                  className="w-full flex items-start gap-2.5 text-left group"
                >
                  <span
                    className={`mt-[5px] w-2 h-2 rounded-full shrink-0 ${item.dot}`}
                    aria-hidden
                  />
                  <span className="text-[12.5px] font-bold text-ink-muted tabular-nums shrink-0 mt-px">
                    {minutesToLabel(item.startMin)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-ink-strong truncate group-hover:text-brand transition-colors">
                      {item.title}
                    </span>
                    {item.location && (
                      <span className="block text-[11.5px] text-gray-400 dark:text-white/45 truncate">
                        {item.location}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
            {restCount > 0 && (
              <li className="pl-[18px] text-[11.5px] text-gray-400 dark:text-white/40">
                {t('homeRailScheduleMore').replace('{n}', String(restCount))}
              </li>
            )}
          </ul>
        )}
      </div>
    </section>
  )
}

// ── 5. 말씀 카드 배너 ─────────────────────────────────────────────────

const VerseCardBanner = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  return (
    <section className="px-4 pt-3 pb-1">
      <div className="rounded-2xl p-4 border border-[var(--card-border)] bg-gradient-to-br from-[#f3efff] to-[#eae6fb] dark:from-[#1c1730] dark:to-[#151226] relative overflow-hidden">
        <span className="absolute -right-2 -bottom-3 text-[58px] opacity-20 select-none rotate-[8deg]" aria-hidden>
          🖼️
        </span>
        <p className="text-[14.5px] font-bold text-ink-strong leading-snug">
          {t('homeRailVerseCardTitle')}
        </p>
        <p className="mt-1 text-[12px] text-ink-muted leading-relaxed">
          {t('homeRailVerseCardBody1')}
          <br />
          {t('homeRailVerseCardBody2')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/bible/photo-verse')}
          className="mt-3 px-3.5 py-1.5 rounded-full bg-[#7c66d9] text-white text-[12.5px] font-bold active:scale-[0.97] transition-transform duration-150"
        >
          {t('railShareVerseCard')}
        </button>
      </div>
    </section>
  )
}

// ── 레일 본체 ─────────────────────────────────────────────────────────

const HomeRightRail = () => (
  <>
    <PrayerStatsWidget />
    <SituationTagsWidget />
    <AlarmBanner />
    <TodayScheduleWidget />
    <VerseCardBanner />
  </>
)

export default HomeRightRail
