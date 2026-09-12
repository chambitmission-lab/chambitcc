// 1. 이번주 기도 현황 — 통계 타일 · 요일 바 · 아멘 목표.

import { useQuery } from '@tanstack/react-query'
import { API_V1, apiFetch } from '../../../../config/api'
import { fetchPrayers } from '../../../../api/prayer'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { PrayIcon } from '../EmotionIcons'
import type { Language } from '../../../../locales'
import { prayerStatsKeys } from '../../../../hooks/queryKeys'
import type { WeeklyPrayerStats } from './queries'
import { useWeeklyPrayerStats } from './queries'

// ── 데이터 훅 ─────────────────────────────────────────────────────────


interface PrayerStatsSummary {
  total_prayers: number
  active_prayers: number
  prayers_today: number
  total_reactions: number
}

// 폴백용 누적 통계 (구버전 백엔드에도 있는 엔드포인트)
const usePrayerStatsSummary = (enabled: boolean) =>
  useQuery({
    queryKey: prayerStatsKeys.summary(),
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
    queryKey: prayerStatsKeys.answeredTotal(),
    queryFn: async () => {
      const res = await fetchPrayers(1, 1, 'latest', null, null, true)
      return res.data.total
    },
    staleTime: 1000 * 60 * 15,
    enabled,
  })

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
          {/* 라벨(11px/600) → 숫자(27px/800) → 단위(11px/700, 흐리게) 로 세 단계를 벌린다.
              라벨·숫자·단위가 모두 11~19px 안에 몰려 있으면 "숫자가 주인공"이 읽히지 않는다. */}
          <p
            className={`text-[11px] font-semibold tracking-[0.01em] ${
              hero ? 'text-white/75' : tint ? 'text-[var(--brand)]' : 'text-gray-400 dark:text-white/45'
            }`}
          >
            {tile.label}
          </p>
          <p
            className={`mt-1.5 text-[27px] font-extrabold tabular-nums leading-none tracking-[-0.035em] ${
              hero ? 'text-white' : 'text-ink-strong'
            }`}
          >
            {tile.value === undefined ? (
              <span className={hero ? 'text-white/50' : 'text-gray-300 dark:text-white/25'}>—</span>
            ) : (
              <>
                {tile.value.toLocaleString()}
                <span
                  className={`ml-1 align-baseline text-[11px] font-bold tracking-[0] ${
                    hero ? 'text-white/70' : 'text-gray-400 dark:text-white/40'
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
      {/* pt는 막대 위 숫자 라벨이 앉을 자리(border-box라 h-full 막대 높이는 그대로 44px) */}
      <div className="grid grid-cols-7 items-end gap-1.5 pt-[14px]" style={{ height: 58 }}>
        {daily.slice(0, 7).map((d, i) => {
          const isToday = i === todayIndex
          const isFuture = i > todayIndex
          const v = value(d)
          const pct = Math.round((v / max) * 100)
          // 몇 명이 참여했는지 한눈에 읽힐 수 있게 모든 막대 위에 수치를 올린다
          const countLabel = (
            <span
              className={`absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] font-bold leading-none tabular-nums ${
                isToday
                  ? 'text-brand'
                  : v > 0
                    ? 'text-ink-muted'
                    : 'text-gray-300 dark:text-white/25'
              }`}
            >
              {v}
            </span>
          )
          return (
            <div
              key={d.date}
              className="relative flex h-full items-end"
              title={`${labels[i]} · ${d.prayers} / ${d.amens}`}
            >
              {isFuture ? (
                <span className="relative w-full h-[6px] rounded-full border border-dashed border-[var(--card-border)]">
                  {countLabel}
                </span>
              ) : (
                <span
                  className={`relative w-full rounded-full transition-[height] duration-500 ease-out ${
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
                >
                  {countLabel}
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
        <p className={`text-[16px] font-extrabold tabular-nums leading-none tracking-[-0.03em] ${done ? 'text-brand' : 'text-ink-strong'}`}>
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
        <p className="mb-3 flex items-center gap-1.5 text-[13.5px] font-bold tracking-[-0.02em] text-ink-strong">
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

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { PrayerStatsWidget }
