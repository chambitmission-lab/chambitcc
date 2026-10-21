// 1. 이번주 기도 현황 — 창가 삽화 머리(한 문장 + 빛 알갱이) · 요일 막대 · 아멘 목표 · 세 수치.

import { useMemo, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { request } from '../../../../api/utils/request'
import { fetchPrayers } from '../../../../api/prayer'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useTheme } from '../../../../contexts/ThemeContext'
import { useThemeArt } from '../../../../hooks/useThemeArt'
import { useCountUp } from '../../../../hooks/useCountUp'
import { pairSrc, PRAYER_WEEK_WINDOW } from '../../../../utils/themeAssets'
import type { Language } from '../../../../locales'
import { prayerStatsKeys } from '../../../../hooks/queryKeys'
import type { WeeklyPrayerStats } from './queries'
import { useWeeklyPrayerStats } from './queries'
import './prayerWeek.css'

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
      const json = await request<{ data: PrayerStatsSummary }>('/prayers/stats/summary', {
        errorMessage: '기도 통계를 불러오지 못했습니다',
      })
      return json.data
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

// ── 빛 알갱이 (숫자 카운트업은 hooks/useCountUp — 1초, 움직임 줄이기 설정이면 바로 최종값) ──────────
// 아멘 수만큼(제곱근으로 눌러 최대 24개) 창턱 빛 웅덩이에서 떠오르는 알갱이.
// 위치·속도는 고정 시드라 리렌더마다 자리가 튀지 않는다.
const makeMotes = (amens: number): CSSProperties[] => {
  const count = Math.min(24, Math.round(Math.sqrt(amens) * 2.2))
  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  return Array.from({ length: count }, () => {
    const size = 2 + rnd() * 3
    return {
      left: `${30 + rnd() * 40}%`,
      width: size,
      height: size,
      animationDuration: `${5 + rnd() * 5}s`,
      animationDelay: `${-rnd() * 8}s`,
      '--pw-dx': `${(rnd() - 0.5) * 40}px`,
    } as CSSProperties
  })
}

const Motes = ({ amens }: { amens: number }) => {
  const motes = useMemo(() => makeMotes(amens), [amens])
  return (
    <>
      {motes.map((style, i) => (
        <span key={i} className="pw-mote" style={style} aria-hidden />
      ))}
    </>
  )
}

// ── 요일별 막대 · 아멘 목표 · 세 수치 ─────────────────────────────────

const DOW_KO = ['월', '화', '수', '목', '금', '토', '일']
const DOW_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// 이번주 월~일 참여도(기도 등록 + 아멘). 기도 등록만으로는 하루 0~2건이라 막대가 비어
// 보여서 아멘을 합산한다. 오늘은 브랜드, 지난 날은 틴트, 아직 오지 않은 날은 점선 빈 칸.
const WeekdayBars = ({
  daily,
  todayIndex,
  language,
  todayLabel,
}: {
  daily: NonNullable<WeeklyPrayerStats['daily']>
  todayIndex: number
  language: Language
  todayLabel: string
}) => {
  const value = (d: { prayers: number; amens: number }) => d.prayers + d.amens
  const max = Math.max(1, ...daily.map(value))
  const labels = language === 'en' ? DOW_EN : DOW_KO
  return (
    <div>
      <div className="grid grid-cols-7 gap-2.5" style={{ height: 72 }}>
        {daily.slice(0, 7).map((d, i) => {
          const isToday = i === todayIndex
          const isFuture = i > todayIndex
          const v = value(d)
          const pct = isFuture ? 12 : Math.max(v > 0 ? 10 : 5, Math.round((v / max) * 70))
          return (
            <div
              key={d.date}
              className="flex h-full flex-col items-center justify-end"
              title={`${labels[i]} · ${d.prayers} / ${d.amens}`}
            >
              {!isFuture && (
                <span
                  className={`mb-1 text-[10.5px] leading-none tabular-nums ${
                    isToday ? 'font-extrabold text-brand' : 'font-bold text-[var(--text-muted)]'
                  }`}
                >
                  {v}
                </span>
              )}
              <span
                className={`pw-bar w-full max-w-[20px] ${
                  isFuture
                    ? 'rounded-t-md border-[1.5px] border-b-0 border-dashed border-[var(--card-border)]'
                    : `rounded-t-md rounded-b ${isToday ? '' : 'bg-[var(--brand-soft-strong)]'}`
                }`}
                style={{
                  height: `${pct}%`,
                  animationDelay: `${i * 60}ms`,
                  ...(isToday ? { background: 'linear-gradient(180deg, #6cb0ff, var(--brand))' } : {}),
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-2.5">
        {labels.map((l, i) => (
          <span
            key={`${l}-${i}`}
            className={`text-center text-[11px] ${
              i === todayIndex ? 'font-extrabold text-brand' : 'font-semibold text-[var(--text-muted)]'
            }`}
          >
            {i === todayIndex ? todayLabel : l}
          </span>
        ))}
      </div>
    </div>
  )
}

// "공동 목표 300번까지 256번 남았어요 · 15%" — 달성하면 문구가 바뀐다.
const AmenGoalBar = ({ amens, goal }: { amens: number; goal: number }) => {
  const { t } = useLanguage()
  const pct = Math.round(Math.min(1, amens / goal) * 100)
  const done = amens >= goal
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-2 text-[12.5px] font-semibold text-[var(--text-body)]">
        <span>
          {t('homeRailGoalUntil').replace('{n}', goal.toLocaleString())}{' '}
          {!done && (
            <b className="font-extrabold text-brand tabular-nums">
              {t('homeRailGoalLeft').replace('{n}', (goal - amens).toLocaleString())}
            </b>
          )}
        </span>
        <b className="font-extrabold text-brand tabular-nums">{done ? t('homeRailAmenGoalDone') : `${pct}%`}</b>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-inset)]">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{
            width: `${Math.max(pct, amens > 0 ? 2 : 0)}%`,
            background: 'linear-gradient(90deg, var(--brand-dim), #6cb0ff)',
          }}
        />
      </div>
    </div>
  )
}

interface TrioItem {
  label: string
  value: number | undefined
  unit: string
}

// 하단 세 수치 — 0은 흐리게 눌러 "아직 없음"이 주인공(아멘)과 경쟁하지 않게 한다
const StatTrio = ({ items }: { items: TrioItem[] }) => (
  <div className="mt-3.5 grid grid-cols-3 border-t border-[var(--card-border)] pt-3">
    {items.map((it, i) => (
      <div key={it.label} className={`min-w-0 text-center ${i ? 'border-l border-[var(--card-border)]' : ''}`}>
        <p className="truncate px-1 text-[11px] font-semibold text-[var(--text-muted)]">{it.label}</p>
        <p
          className={`mt-1 text-[17px] font-extrabold leading-none tracking-[-0.03em] tabular-nums ${
            it.value ? 'text-ink-strong' : 'text-gray-300 dark:text-white/25'
          }`}
        >
          {it.value === undefined ? '—' : it.value.toLocaleString()}
          {it.unit && <span className="ml-0.5 text-[11px] font-bold text-[var(--text-muted)]">{it.unit}</span>}
        </p>
      </div>
    ))}
  </div>
)

// ── 1. 기도 현황 ──────────────────────────────────────────────────────

// "8.17 – 8.23" — 이번주 범위를 카드 안에서 조용히 밝힌다
const weekRangeLabel = (start: string, end: string) => {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split('-')
    return `${Number(m)}.${Number(d)}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

const PrayerStatsWidget = () => {
  const { t, language } = useLanguage()
  const { theme } = useTheme()
  const artReady = useThemeArt(PRAYER_WEEK_WINDOW)
  const weekly = useWeeklyPrayerStats()
  // 주간 API가 없는 구버전 백엔드에서만 누적 통계로 대체
  const { data: summary } = usePrayerStatsSummary(weekly.isError)
  const { data: answeredTotal } = useAnsweredTotal(weekly.isError)

  const amens = weekly.data ? weekly.data.amens_week : summary?.total_reactions
  const shownAmens = useCountUp(amens, { durationMs: 1000 })

  const count = t('homeRailUnitCount')
  const trio: TrioItem[] = weekly.data
    ? [
        { label: t('homeRailStatToday'), value: weekly.data.prayers_today, unit: count },
        { label: t('homeRailStatWeek'), value: weekly.data.prayers_week, unit: count },
        { label: t('homeRailStatAnswered'), value: weekly.data.answered_week, unit: count },
      ]
    : [
        { label: t('homeRailStatToday'), value: summary?.prayers_today, unit: count },
        { label: t('homeRailStatShared'), value: summary?.active_prayers, unit: count },
        { label: t('homeRailStatAnsweredTotal'), value: answeredTotal, unit: count },
      ]

  // 한 문장 제목 — 아멘이 0인 주 초반엔 "첫 아멘을 기다려요"로 비어 보이지 않게
  const waiting = amens === 0
  const lead = waiting ? t('homeRailWeekEmptyLead') : weekly.data ? t('homeRailWeekLead') : t('homeRailTotalLead')

  return (
    <section className="px-4 pt-3">
      <div className="feed-card overflow-hidden rounded-2xl">
        {/* 창가 삽화 — 위쪽 빈 하늘에 한 문장, 창턱 빛 웅덩이에서 아멘만큼 빛 알갱이가 떠오른다 */}
        <div className="pw-art">
          <div
            className={`pw-art-img${artReady ? ' is-loaded' : ''}`}
            style={{ backgroundImage: `url(${pairSrc(PRAYER_WEEK_WINDOW, theme)})` }}
            aria-hidden
          />
          {!!amens && <Motes amens={amens} />}
          <div className="absolute inset-x-4 top-3.5">
            <p className="flex items-center text-[11.5px] font-bold text-gray-500 dark:text-white/55">
              {weekly.data ? t('homeRailPrayerWeekTitle') : t('homeRailPrayerTitle')}
              {weekly.data && (
                <span className="ml-auto font-semibold tabular-nums">
                  {weekRangeLabel(weekly.data.week_start, weekly.data.week_end)}
                </span>
              )}
            </p>
            <h3 className="mt-1.5 text-[20px] font-bold leading-[1.38] tracking-[-0.035em] text-ink-strong">
              {lead}
              <br />
              {waiting ? (
                <strong className="font-extrabold text-brand">{t('homeRailWeekEmptyAmen')}</strong>
              ) : (
                <>
                  <strong className="font-extrabold text-brand tabular-nums">
                    {amens === undefined ? '—' : t('homeRailAmenCount').replace('{n}', shownAmens.toLocaleString())}
                  </strong>
                  {t('homeRailAmenTail')}
                </>
              )}
            </h3>
          </div>
        </div>
        <div className="px-4 pb-4 pt-1">
          {weekly.data?.daily && weekly.data.daily.length === 7 && (
            <WeekdayBars
              daily={weekly.data.daily}
              todayIndex={(new Date().getDay() + 6) % 7}
              language={language}
              todayLabel={t('homeRailToday')}
            />
          )}
          {weekly.data && <AmenGoalBar amens={weekly.data.amens_week} goal={weekly.data.amen_goal ?? 300} />}
          <StatTrio items={trio} />
        </div>
      </div>
    </section>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { PrayerStatsWidget }
