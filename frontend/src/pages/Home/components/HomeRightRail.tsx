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
import { fetchNewsList } from '../../../api/news'
import { OPEN_CHATBOT_EVENT } from '../../../components/command/commandEvents'
import chambiAvatar from '../../../components/chatbot/img/default.webp'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useSituationCategories, useSituationVerses } from '../../../hooks/useSituation'
import { useEvents } from '../../../hooks/useEvents'
import { getSundayServices, getWeekdayServices } from '../../../api/worship'
import { parseServiceTimes, serviceDays } from '../../../utils/worshipSchedule'
import { CATEGORY_VISUAL } from '../../Events/utils/categoryConfig'
import { AlarmIcon, CalendarIcon, EmotionGlyph, ImageIcon, PrayIcon, TagIcon } from './EmotionIcons'
import { ArrowUpRight, Megaphone } from '@phosphor-icons/react'
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
  // 아래 둘은 신버전 백엔드에서만 내려온다 — 없으면 차트·진행률을 숨긴다
  daily?: { date: string; prayers: number; amens: number }[]
  amen_goal?: number
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
  // hero: 브랜드 네온 그래디언트 타일(가장 활발한 수치) · tint: 은은한 브랜드 틴트 배지
  accent?: 'hero' | 'tint'
}

// 벤토 2×2 미니 카드 — 숫자 하나가 카드 하나. 히어로 타일은 브랜드 그래디언트 + 은은한 글로우,
// 나머지는 카드 안의 한 단계 깊은 박스(--surface-inset)로 입체감만 준다.
const StatTiles = ({ tiles }: { tiles: StatTile[] }) => (
  <div className="grid grid-cols-2 gap-2">
    {tiles.map((tile) => {
      const hero = tile.accent === 'hero'
      const tint = tile.accent === 'tint'
      return (
        <div
          key={tile.label}
          className={`relative min-w-0 overflow-hidden rounded-xl px-3 py-2.5 transition-transform duration-200 hover:-translate-y-0.5 ${
            hero
              ? 'text-white'
              : tint
                ? 'bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)]'
                : 'bg-[var(--surface-inset)] border border-[var(--card-border)]'
          }`}
          style={
            hero
              ? {
                  background: 'linear-gradient(135deg, var(--brand-dim) 0%, var(--brand) 55%, #6cb0ff 100%)',
                  boxShadow: '0 8px 20px -8px var(--brand-glow), inset 0 1px 0 rgba(255,255,255,0.28)',
                }
              : undefined
          }
        >
          {hero && (
            // 오른쪽 위에 번지는 네온 하이라이트 — 살아 있는 수치라는 신호
            <span
              aria-hidden
              className="pointer-events-none absolute -right-4 -top-5 h-16 w-16 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.45), rgba(255,255,255,0) 70%)' }}
            />
          )}
          <p
            className={`text-[11px] font-semibold tracking-[-0.01em] ${
              hero ? 'text-white/80' : tint ? 'text-[var(--brand)]' : 'text-gray-400 dark:text-white/45'
            }`}
          >
            {tile.label}
          </p>
          <p
            className={`mt-1 text-[19px] font-extrabold tabular-nums leading-none tracking-[-0.02em] ${
              hero ? 'text-white' : 'text-ink-strong'
            }`}
          >
            {tile.value === undefined ? (
              <span className={hero ? 'text-white/50' : 'text-gray-300 dark:text-white/25'}>—</span>
            ) : (
              <>
                {tile.value.toLocaleString()}
                <span
                  className={`ml-0.5 text-[11.5px] font-semibold ${
                    hero ? 'text-white/75' : 'text-ink-muted'
                  }`}
                >
                  {tile.unit}
                </span>
              </>
            )}
          </p>
        </div>
      )
    })}
  </div>
)

// ── 요일별 미니 바 차트 · 아멘 목표 진행률 ─────────────────────────────

const DOW_KO = ['월', '화', '수', '목', '금', '토', '일']
const DOW_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// 이번주 월~일 참여도(기도 등록 + 아멘)를 7개 막대로. 기도 등록만으로는 하루 0~2건이라
// 막대가 비어 보여서 아멘을 합산한다. 오늘은 브랜드 그래디언트, 지난 날은 틴트,
// 아직 오지 않은 날은 빈 슬롯(점선)으로 남겨 "채워 가는 한 주"가 읽히게 한다.
const WeekdayBars = ({
  daily,
  todayIndex,
  language,
  title,
}: {
  daily: NonNullable<WeeklyPrayerStats['daily']>
  todayIndex: number
  language: Language
  title: string
}) => {
  const value = (d: { prayers: number; amens: number }) => d.prayers + d.amens
  const max = Math.max(1, ...daily.map(value))
  const labels = language === 'en' ? DOW_EN : DOW_KO
  return (
    <div className="mt-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface-inset)] px-3 pt-2.5 pb-2">
      <p className="mb-2 text-[11px] font-semibold text-gray-400 dark:text-white/45">{title}</p>
      <div className="grid grid-cols-7 items-end gap-1.5" style={{ height: 44 }}>
        {daily.slice(0, 7).map((d, i) => {
          const isToday = i === todayIndex
          const isFuture = i > todayIndex
          const v = value(d)
          const pct = Math.round((v / max) * 100)
          return (
            <div
              key={d.date}
              className="relative flex h-full items-end"
              title={`${labels[i]} · ${d.prayers} / ${d.amens}`}
            >
              {isFuture ? (
                <span className="w-full h-[6px] rounded-full border border-dashed border-[var(--card-border)]" />
              ) : (
                <span
                  className={`w-full rounded-full transition-[height] duration-500 ease-out ${
                    isToday ? 'text-white' : 'bg-[var(--brand-soft-strong)]'
                  }`}
                  style={{
                    height: `${Math.max(v > 0 ? 14 : 6, pct)}%`,
                    ...(isToday
                      ? {
                          background: 'linear-gradient(180deg, #6cb0ff, var(--brand))',
                          boxShadow: '0 4px 10px -4px var(--brand-glow)',
                        }
                      : {}),
                  }}
                />
              )}
              {isToday && v > 0 && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] font-bold text-brand tabular-nums">
                  {v}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {labels.map((l, i) => (
          <span
            key={`${l}-${i}`}
            className={`text-center text-[10px] font-semibold ${
              i === todayIndex ? 'text-brand' : 'text-gray-400 dark:text-white/40'
            }`}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

// "이번주 공동 목표 300회 아멘 중 86%" — 진행률 바. 달성 시 바가 꽉 차고 문구가 바뀐다.
const AmenGoalBar = ({ amens, goal }: { amens: number; goal: number }) => {
  const { t } = useLanguage()
  const ratio = Math.min(1, amens / goal)
  const pct = Math.round(ratio * 100)
  const done = amens >= goal
  return (
    <div className="mt-2.5 px-0.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-white/45">
          {t('homeRailAmenGoalLabel')}{' '}
          <span className="text-ink-muted tabular-nums">
            {t('homeRailAmenGoalOf').replace('{n}', goal.toLocaleString())}
          </span>
        </p>
        <p className={`text-[12px] font-extrabold tabular-nums ${done ? 'text-brand' : 'text-ink-strong'}`}>
          {done ? t('homeRailAmenGoalDone') : `${pct}%`}
        </p>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--surface-inset)] border border-[var(--card-border)]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${Math.max(pct, amens > 0 ? 3 : 0)}%`,
            background: 'linear-gradient(90deg, var(--brand-dim), var(--brand) 60%, #6cb0ff)',
            boxShadow: '0 0 10px var(--brand-glow)',
          }}
        />
      </div>
    </div>
  )
}

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
  const { t, language } = useLanguage()
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
        { label: t('homeRailStatAmen'), value: weekly.data.amens_week, unit: times, accent: 'hero' },
        { label: t('homeRailStatAnswered'), value: weekly.data.answered_week, unit: count, accent: 'tint' },
      ]
    : [
        { label: t('homeRailStatToday'), value: summary?.prayers_today, unit: count },
        { label: t('homeRailStatShared'), value: summary?.active_prayers, unit: count },
        { label: t('homeRailStatAmenTotal'), value: summary?.total_reactions, unit: times, accent: 'hero' },
        { label: t('homeRailStatAnsweredTotal'), value: answeredTotal, unit: count, accent: 'tint' },
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
        {weekly.data?.daily && weekly.data.daily.length === 7 && (
          <WeekdayBars
            daily={weekly.data.daily}
            todayIndex={(new Date().getDay() + 6) % 7}
            language={language}
            title={t('homeRailWeekdayChartTitle')}
          />
        )}
        {weekly.data && (
          <AmenGoalBar amens={weekly.data.amens_week} goal={weekly.data.amen_goal ?? 300} />
        )}
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

// ── 2.5 참비의 오늘 추천 (맞춤 말씀·기도) ───────────────────────────────
//
// 개인화 근거 우선순위: ① 내 최근 기도의 감정 태그 → ② 이번주 성도들 1위 감정 → ③ 기본 카테고리.
// 감정은 상황별 성구 카테고리(emotion_keys)로 이어지고, 그 카테고리 구절 중 하나를
// 날짜 기준으로 고정 선택해 하루 동안 같은 말씀이 유지되게 한다. 백엔드 무변경.

// 내 최근 기도 1건 — 로그인 사용자만. 감정 태그만 쓴다.
const useMyLatestPrayer = (enabled: boolean) =>
  useQuery({
    queryKey: ['prayers', 'mine', 'latest-one'],
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
  const loggedIn = !!localStorage.getItem('access_token')
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

  const askChambi = () => {
    window.dispatchEvent(
      new CustomEvent(OPEN_CHATBOT_EVENT, {
        detail: { message: t('homeRailPickAskMessage').replace('{ref}', ref) },
      }),
    )
  }

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
          <p className="text-[12.5px] font-bold text-ink-strong">{t('homeRailPickTitle')}</p>
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
            <p className="relative mt-3 text-[13.5px] font-medium leading-[1.6] text-ink-strong line-clamp-3 tracking-[-0.01em]">
              “{verse.text}”
            </p>
            <p className="relative mt-1 text-[11.5px] font-bold text-brand tabular-nums">{ref}</p>
            {verse.message && (
              <p className="relative mt-1.5 text-[11.5px] leading-relaxed text-ink-muted line-clamp-2">
                {verse.message}
              </p>
            )}
          </>
        )}

        <div className="relative mt-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => verse && navigate(`/bible/${verse.book_number}/${verse.chapter}`)}
            disabled={!verse}
            className="flex-1 rounded-full bg-[var(--brand)] px-3 py-1.5 text-[12px] font-bold text-white shadow-[0_6px_14px_-6px_var(--brand-glow)] active:scale-[0.97] transition-transform duration-150 disabled:opacity-50"
          >
            {t('homeRailPickRead')}
          </button>
          <button
            type="button"
            onClick={askChambi}
            disabled={!verse}
            className="flex-1 rounded-full border border-[var(--brand-soft-strong)] bg-[var(--surface-container)] px-3 py-1.5 text-[12px] font-bold text-brand hover:bg-[var(--brand-soft)] active:scale-[0.97] transition-[background-color,transform] duration-150 disabled:opacity-50"
          >
            {t('homeRailPickAsk')}
          </button>
        </div>
      </div>
    </section>
  )
}

// ── 3. 액션 벤토 (말씀 알림 · 말씀 카드) ───────────────────────────────

// 두 배너를 나란한 2칸 타일로 압축 — 타일 전체가 버튼, 이모지 대신 Phosphor 선화.
// 알림 타일은 브랜드 그래디언트(주 행동), 말씀 카드 타일은 라벤더 틴트(보조 행동).
interface ActionTile {
  key: string
  title: string
  body: string
  cta: string
  icon: ReactNode
  tone: 'brand' | 'lavender'
  onClick: () => void
}

const ActionBento = ({ tiles }: { tiles: ActionTile[] }) => (
  <div className="grid grid-cols-2 gap-2">
    {tiles.map((tile) => {
      const brand = tile.tone === 'brand'
      return (
        <button
          key={tile.key}
          type="button"
          onClick={tile.onClick}
          className={`group relative flex min-h-[132px] flex-col overflow-hidden rounded-2xl p-3.5 text-left transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
            brand
              ? 'text-white hover:shadow-[0_14px_28px_-12px_var(--brand-glow)]'
              : 'border border-[var(--card-border)] bg-[#f3efff] text-ink-strong dark:bg-[#1c1730]'
          }`}
          style={
            brand
              ? {
                  background: 'linear-gradient(150deg, var(--brand-dim) 0%, var(--brand) 55%, #6cb0ff 100%)',
                  boxShadow: '0 8px 20px -10px var(--brand-glow), inset 0 1px 0 rgba(255,255,255,0.28)',
                }
              : undefined
          }
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full"
            style={{
              background: brand
                ? 'radial-gradient(circle, rgba(255,255,255,0.4), rgba(255,255,255,0) 70%)'
                : 'radial-gradient(circle, rgba(124,102,217,0.28), rgba(124,102,217,0) 70%)',
            }}
          />
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${
              brand ? 'bg-white/20 text-white' : 'bg-[#7c66d9]/15 text-[#7c66d9] dark:text-[#b7a8f2]'
            }`}
          >
            {tile.icon}
          </span>
          <span className="mt-auto pt-3">
            <span className="block text-[13px] font-bold leading-snug tracking-[-0.02em]">
              {tile.title}
            </span>
            <span className={`mt-0.5 block text-[11px] leading-snug ${brand ? 'text-white/75' : 'text-ink-muted'}`}>
              {tile.body}
            </span>
          </span>
          <span
            className={`mt-2 inline-flex items-center gap-0.5 text-[11.5px] font-bold ${
              brand ? 'text-white' : 'text-[#7c66d9] dark:text-[#b7a8f2]'
            }`}
          >
            {tile.cta}
            <ArrowUpRight
              size={13}
              weight="bold"
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </span>
        </button>
      )
    })}
  </div>
)

const ActionBentoWidget = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const tiles: ActionTile[] = [
    {
      key: 'alarm',
      title: `${t('homeRailAlarmTitle1')} ${t('homeRailAlarmTitle2')}`,
      body: t('homeRailAlarmBody1'),
      cta: t('homeRailAlarmCta'),
      icon: <AlarmIcon size={18} />,
      tone: 'brand',
      onClick: () => navigate('/bible/alarm'),
    },
    {
      key: 'verse-card',
      title: t('homeRailVerseCardTitle'),
      body: t('homeRailVerseCardBody1'),
      cta: t('railShareVerseCard'),
      icon: <ImageIcon size={18} />,
      tone: 'lavender',
      onClick: () => navigate('/bible/photo-verse'),
    },
  ]
  return (
    <section className="px-4 pt-3">
      <ActionBento tiles={tiles} />
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

// 일정이 없는 날의 플레이스홀더 — "없어요" 한 줄 대신 최신 교회소식 카드로 채운다.
// 소식도 없으면 그때만 빈 문구로 돌아간다. (이번 주 설교 카드는 사용자 요청으로 제외)
const useLatestNewsOne = (enabled: boolean) =>
  useQuery({
    queryKey: ['news', 'rail-latest-one'],
    queryFn: async () => (await fetchNewsList(1, 1)).data.items[0] ?? null,
    enabled,
    staleTime: 1000 * 60 * 15,
    retry: 0,
  })

const shortDate = (iso: string | null | undefined) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}.${d.getDate()}`
}

const PlaceholderSkeleton = () => (
  <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface-inset)] p-3" aria-hidden>
    <div className="h-2.5 w-14 animate-pulse rounded-full bg-[var(--card-border)]" />
    <div className="mt-2 h-3 w-10/12 animate-pulse rounded-full bg-[var(--card-border)]" />
    <div className="mt-1.5 h-3 w-7/12 animate-pulse rounded-full bg-[var(--card-border)]" />
  </div>
)

const EmptySchedulePlaceholders = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const news = useLatestNewsOne(true)
  const item = news.data ?? null

  if (!news.isLoading && !item) {
    return (
      <p className="py-2 text-center text-[12.5px] text-gray-400 dark:text-white/40">
        {t('homeRailScheduleEmpty')}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="px-0.5 text-[11px] text-gray-400 dark:text-white/45">{t('homeRailScheduleEmptyLead')}</p>
      {news.isLoading ? (
        <PlaceholderSkeleton />
      ) : item ? (
        <button
          type="button"
          onClick={() => navigate('/news?tab=news')}
          className="group flex w-full items-start gap-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--surface-inset)] p-3 text-left transition-colors hover:bg-[var(--brand-soft)]"
        >
          <span className="mt-px inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-brand">
            <Megaphone size={15} weight="duotone" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-brand">
              {t('homeRailPlaceholderNews')}
              <span className="font-semibold text-gray-400 dark:text-white/40 tabular-nums">{shortDate(item.published_at)}</span>
            </span>
            <span className="mt-0.5 block truncate text-[13px] font-semibold text-ink-strong group-hover:text-brand">{item.title}</span>
            {item.summary && (
              <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-muted line-clamp-2">{item.summary}</span>
            )}
          </span>
        </button>
      ) : null}
    </div>
  )
}

const TodayScheduleWidget = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const today = useMemo(() => todayStr(), [])
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

  // 현재 시각 기준 — 지난 일정은 흐리게, 다음 일정 하나는 브랜드 틴트 행으로 띄운다
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const nextKey = sorted.find((i) => i.startMin >= nowMin)?.key ?? null
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
          <EmptySchedulePlaceholders />
        ) : (
          <ul className="space-y-1">
            {visible.map((item) => {
              const isNext = item.key === nextKey
              const isPast = nextKey !== null ? item.startMin < nowMin && !isNext : item.startMin < nowMin
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className={`group flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-150 ${
                      isNext
                        ? 'bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)]'
                        : 'border border-transparent hover:bg-[var(--surface-inset)]'
                    } ${isPast ? 'opacity-50' : ''}`}
                  >
                    <span className="relative mt-[5px] h-2 w-2 shrink-0" aria-hidden>
                      <span className={`absolute inset-0 rounded-full ${item.dot}`} />
                      {isNext && (
                        <span className={`absolute inset-0 animate-ping rounded-full ${item.dot} opacity-60`} />
                      )}
                    </span>
                    <span
                      className={`mt-px shrink-0 text-[12.5px] font-bold tabular-nums ${
                        isNext ? 'text-brand' : 'text-ink-muted'
                      }`}
                    >
                      {minutesToLabel(item.startMin)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink-strong transition-colors group-hover:text-brand">
                        {item.title}
                      </span>
                      {item.location && (
                        <span className="block truncate text-[11.5px] text-gray-400 dark:text-white/45">
                          {item.location}
                        </span>
                      )}
                    </span>
                    {isNext && (
                      <span className="mt-0.5 shrink-0 rounded-full bg-[var(--brand)] px-1.5 py-px text-[10px] font-bold text-white">
                        {t('homeRailScheduleNext')}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
            {restCount > 0 && (
              <li className="pl-[26px] pt-1 text-[11.5px] text-gray-400 dark:text-white/40">
                {t('homeRailScheduleMore').replace('{n}', String(restCount))}
              </li>
            )}
          </ul>
        )}
      </div>
    </section>
  )
}

// ── 레일 본체 ─────────────────────────────────────────────────────────

const HomeRightRail = () => (
  <>
    <PrayerStatsWidget />
    <SituationTagsWidget />
    <PersonalPickWidget />
    <ActionBentoWidget />
    <TodayScheduleWidget />
  </>
)

export default HomeRightRail
