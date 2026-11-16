// 공동 기도제목 — '시네마 포스터' (2026-11-16, 시안 I-1 채택)
// 이번 주 계절의 교회 전경 사진 한 장이 선명한 세로 포스터와 화면 전체의 흐린 배경을 겸한다.
// 라이트 = 낮 사진 + 계절 색(봄 벚꽃·여름 신록·가을 단풍·겨울 눈), 다크 = 밤 사진 + 등불 금색.
// 색은 전부 weeklyTopics.css 의 .wpt-cine 토큰(data-season)에서 온다 — 여기서 색을 쓰지 말 것.
// 계절은 '그 주일 날짜' 기준이라, 지난 주를 열면 그 주의 계절 사진·색으로 바뀐다(지난 기도제목 목록의 도장 색도 그 주 계절).
import { useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WeeklyPrayerItem, WeeklyPrayerListItem } from '../../../types/weeklyPrayer'
import { getNaturalSeason, type NaturalSeason } from '../../../utils/naturalSeason'
import { CHURCH_SEASON_PHOTO } from '../../../utils/themeAssets'
import { useThemeArt } from '../../../hooks/useThemeArt'
import { AmenBurst, CheckIcon, HOLD_MS, useAmenStep, type PrayerStageProps } from './HoldAmen'

const COUNT_WORD = ['한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열']

/** 'YYYY-MM-DD' → 로컬 자정 Date (UTC 파싱으로 하루 밀리지 않게) */
const parseDay = (ymd: string): Date => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/** 주일~토요일 범위 — "11월 15일 ~ 21일" / 달이 넘어가면 "11월 29일 ~ 12월 5일" */
const weekRange = (ymd: string): string => {
  const start = parseDay(ymd)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const head = `${start.getMonth() + 1}월 ${start.getDate()}일`
  const tail = end.getMonth() === start.getMonth() ? `${end.getDate()}일` : `${end.getMonth() + 1}월 ${end.getDate()}일`
  return `${head} ~ ${tail}`
}

/** 접힌 줄에 보일 한 문장 — 제목이 있으면 제목, 없으면 본문 첫 문장 */
const summaryOf = (item: WeeklyPrayerItem): string => {
  const title = item.title?.trim()
  if (title) return title
  const body = item.body?.trim() ?? ''
  const first = body.match(/^(.+?[.!?])(\s|$)/)
  return (first ? first[1] : body).replace(/[.]$/, '')
}

const isGenericTitle = (title: string) => !title.trim() || title.trim() === '기도제목'

export interface CinemaPosterProps extends PrayerStageProps {
  weekDate: string
  title: string
  prayedCount: number
  archive: WeeklyPrayerListItem[]
  isDark: boolean
  onSelectWeek: (id: number) => void
}

const CinemaPoster = (props: CinemaPosterProps) => {
  const { items, idx, setIdx, totalAmen, onUnamen, weekDate, title, prayedCount, archive, isDark, onSelectWeek, weekId } = props
  const navigate = useNavigate()
  const step = useAmenStep(props, 950)
  const season = getNaturalSeason(parseDay(weekDate))
  const pair = CHURCH_SEASON_PHOTO[season]
  const ready = useThemeArt(pair)
  const photo = isDark ? pair.dark : pair.light
  const n = items.length
  const mine = items.filter((i) => i.is_amened).length
  const done = idx >= n
  const day = parseDay(weekDate)
  const range = weekRange(weekDate)
  const headline = isGenericTitle(title) ? `이번 주 함께 드리는 ${COUNT_WORD[n - 1] ?? n}가지 기도` : title
  const meta =
    prayedCount > 0 ? (
      <>
        <b>{prayedCount}명</b>이 함께하는 중 · 아멘 {totalAmen}
      </>
    ) : (
      '이번 주 첫 아멘을 올려 주세요'
    )

  const stageStyle = { ['--wpt-photo' as string]: `url(${photo})` } as CSSProperties

  const archiveBlock = (className: string) =>
    archive.length > 1 ? <PastPrayers className={className} archive={archive} activeId={weekId} onSelect={onSelectWeek} /> : null

  return (
    <section className="wpt-cine" data-season={season} style={stageStyle}>
      <div className={`wpt-cine-back${ready ? ' is-loaded' : ''}`} aria-hidden />
      <div className="wpt-cine-veil" aria-hidden />

      <div className="wpt-cine-inner">
        <div className="wpt-cine-bar">
          <button type="button" onClick={() => navigate(-1)} className="wpt-c-icon" aria-label="뒤로">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <p className="wpt-c-bar-title">공동 기도제목</p>
          <span className="w-11" aria-hidden />
        </div>

        <div className="wpt-cine-grid">
          <aside className="wpt-cine-side">
            <div className={`wpt-poster${ready ? ' is-loaded' : ''}`}>
              <span className="wpt-seal" aria-hidden>
                <span>{day.getMonth() + 1}월</span>
                <b>{day.getDate()}</b>
              </span>
              <div className="wpt-poster-cap">
                <p>참빛교회 공동 기도</p>
                <p className="wpt-poster-title">
                  이번 주,
                  <br />
                  함께 기도해요
                </p>
              </div>
            </div>
            {/* 모바일: 포스터 옆 머리말 */}
            <div className="wpt-c-head-m lg:hidden">
              <p className="wpt-c-kicker">{range}</p>
              <h2 className="wpt-c-title-m">
                이번 주,
                <br />
                함께 기도해요
              </h2>
              <p className="wpt-c-meta">{meta}</p>
            </div>
            {archiveBlock('hidden lg:block mt-5')}
          </aside>

          <div className="wpt-cine-main">
            <div className="hidden lg:block">
              <p className="wpt-c-kicker">{range} 주일</p>
              <h2 className="wpt-c-title">{headline}</h2>
              <p className="wpt-c-meta mt-[1rem]">{meta}</p>
            </div>
            {!isGenericTitle(title) && <p className="wpt-c-sub lg:hidden">{title}</p>}

            <ol className="wpt-c-list">
              {items.map((item, i) =>
                i === idx && !done ? (
                  <li key={item.id ?? i}>
                    <CurrentCard
                      item={item}
                      index={i}
                      count={n}
                      step={step}
                      onUnamen={() => onUnamen(item.id)}
                      onNext={() => setIdx(i + 1)}
                    />
                  </li>
                ) : (
                  <li key={item.id ?? i}>
                    <button type="button" className={`wpt-c-row${item.is_amened ? ' is-done' : ''}`} onClick={() => setIdx(i)}>
                      <Badge done={!!item.is_amened}>{i + 1}</Badge>
                      <span className="wpt-c-row-text">{summaryOf(item)}</span>
                      {!!item.amen_count && <span className="wpt-c-row-count">{item.amen_count}명</span>}
                    </button>
                  </li>
                ),
              )}
            </ol>

            {done && (
              <div className="wpt-c-card wpt-fade text-center">
                <p className="wpt-c-end">{mine === n ? `이번 주 기도를 모두 드렸어요` : `${n}개 중 ${mine}개를 드렸어요`}</p>
                <p className="wpt-c-meta mt-[0.5rem]">성도들과 함께 {totalAmen}번 아멘했어요</p>
                <button type="button" onClick={() => setIdx(0)} className="wpt-c-ghost mt-5">
                  처음부터 다시 보기
                </button>
              </div>
            )}

            {archiveBlock('lg:hidden mt-7')}
          </div>
        </div>
      </div>
    </section>
  )
}

const Badge = ({ done, children }: { done: boolean; children: ReactNode }) => (
  <span className={`wpt-c-badge${done ? ' is-done' : ''}`}>{done ? <CheckIcon size={13} /> : children}</span>
)

const CurrentCard = ({
  item,
  index,
  count,
  step,
  onUnamen,
  onNext,
}: {
  item: WeeklyPrayerItem
  index: number
  count: number
  step: ReturnType<typeof useAmenStep>
  onUnamen: () => void
  onNext: () => void
}) => {
  const on = !!item.is_amened
  const head = item.title && item.body && item.body.trim() !== item.title.trim() ? item.title : null
  return (
    <article key={index} className="wpt-c-card wpt-fade">
      <div className="wpt-c-card-top">
        <Badge done={on}>{index + 1}</Badge>
        <span className="wpt-c-card-label">
          {index + 1} / {count} · {on ? '함께 드린 기도' : '지금 드릴 기도'}
        </span>
        {!!item.amen_count && <span className="wpt-c-row-count">{item.amen_count}명 함께</span>}
      </div>
      {head && <p className="wpt-c-card-head">{head}</p>}
      <p className="wpt-c-card-body">{item.body || item.title}</p>
      {item.scripture && <p className="wpt-c-scripture">{item.scripture}</p>}

      <div className="relative mt-5 lg:mt-6">
        {step.burst && <AmenBurst seed={index + 5} color="var(--c-spark)" />}
        {on ? (
          <div className="wpt-c-after">
            <span className="wpt-c-amened">
              <CheckIcon size={15} /> 아멘했어요
            </span>
            <button type="button" onClick={onUnamen} className="wpt-c-cancel">
              취소
            </button>
            <span className="flex-1" />
            <button type="button" onClick={onNext} className="wpt-c-ghost">
              {index === count - 1 ? '마치기' : '다음 기도'} →
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onPointerDown={step.start}
              onPointerUp={step.cancel}
              onPointerLeave={step.cancel}
              onPointerCancel={step.cancel}
              onKeyDown={(e) => {
                if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                  e.preventDefault()
                  step.start()
                }
              }}
              onKeyUp={step.cancel}
              onContextMenu={(e) => e.preventDefault()}
              className={`wpt-c-hold${step.holding ? ' is-holding' : ''}`}
              style={{ ['--hold' as string]: `${HOLD_MS}ms` } as CSSProperties}
              aria-label="길게 눌러 아멘"
            >
              <span className="wpt-c-hold-fill" aria-hidden />
              <span className="relative">{step.holding ? '마음을 모아…' : '꾹 눌러 아멘'}</span>
            </button>
            <p className="wpt-c-hint">길게 누르고 있으면 아멘이 돼요 · 다 읽고 눌러 주세요</p>
          </>
        )}
      </div>
    </article>
  )
}

const SEASON_WORD: Record<NaturalSeason, string> = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' }
const PAST_FIRST = 4
const PAST_STEP = 8

/** 지난 기도제목 — 주마다 같은 사진 대신 "무슨 기도였는지": 계절 색 날짜 도장 + 첫 기도 한 줄 + 기도 수·아멘 합계.
 *  색은 그 주일의 계절(.wpt-c-past[data-season]). 처음엔 4주만, 더 보기로 8주씩 편다. */
const PastPrayers = ({
  className,
  archive,
  activeId,
  onSelect,
}: {
  className: string
  archive: WeeklyPrayerListItem[]
  activeId: number
  onSelect: (id: number) => void
}) => {
  const [shown, setShown] = useState(PAST_FIRST)
  const rest = archive.length - shown
  return (
    <div className={className}>
      <p className="wpt-c-label">지난 기도제목</p>
      <ul className="wpt-c-pasts">
        {archive.slice(0, shown).map((w, i) => {
          const d = parseDay(w.week_date)
          const season = getNaturalSeason(d)
          const active = w.id === activeId
          const line = w.preview?.trim() || (isGenericTitle(w.title) ? `기도제목 ${w.item_count}개` : w.title)
          return (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => onSelect(w.id)}
                className={`wpt-c-past${active ? ' is-active' : ''}`}
                data-season={season}
                aria-current={active ? 'true' : undefined}
              >
                <span className="wpt-c-past-seal" aria-hidden>
                  <span>{d.getMonth() + 1}월</span>
                  <b>{d.getDate()}</b>
                </span>
                <span className="wpt-c-past-body">
                  <span className="wpt-c-past-line">{line}</span>
                  <span className="wpt-c-past-meta">
                    <i>{i === 0 ? '이번 주' : SEASON_WORD[season]}</i>
                    기도 {w.item_count}개{w.amen_total ? ` · 아멘 ${w.amen_total}` : ''}
                    {active && <em> · 보는 중</em>}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {rest > 0 && (
        <button type="button" onClick={() => setShown((n) => n + PAST_STEP)} className="wpt-c-more">
          지난 기도제목 더 보기 · {rest}주
        </button>
      )}
    </div>
  )
}

export default CinemaPoster
