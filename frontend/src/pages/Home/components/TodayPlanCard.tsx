// 홈 "오늘의 읽기" 카드 — 진행 중인 구독형 읽기 플랜(bible_plans)의 오늘 분량.
// 활성 구독이 없거나 비로그인 시 아무것도 렌더하지 않는다 (홈 클러터 방지).
//
// 진행률은 도넛 링이 아니라 "등불이 걸어온 만큼 밝혀진 길"로 그린다 (시 119:105).
// 365일 여정에서 2% 링은 빈 원처럼 보여 힘이 빠지지만,
// 길 위의 등불은 같은 숫자를 "출발해서 걷는 중"으로 읽게 한다.
import { Fragment, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTodayReadings } from '../../../hooks/useBiblePlan'
import { isAuthenticated } from '../../../utils/auth'
import {
  SERMON_DEFAULT_LABEL,
  formatPlanDay,
  isCalendarPlan,
  sermonSummary,
  todayYmd,
} from '../../Bible/Plans/planSchedule'
import './TodayPlanCard.css'

// 완만하게 굽이치는 오솔길 — 끝은 별(종착지) 앞에서 멈춘다
const TRAIL_W = 340
const TRAIL_D = 'M4 32 C 60 14, 118 42, 178 24 C 232 9, 286 30, 322 15'

const TodayPlanCard = () => {
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const { data } = useTodayReadings(authed)

  const items = data?.items ?? []
  const percent = Math.max(0, Math.min(100, items[0]?.percent ?? 0))

  // 등불 좌표 — 경로 위 진행률 지점. SVG 좌표계 안에서 계산하므로
  // preserveAspectRatio로 늘어나도 함께 따라간다
  const trailRef = useRef<SVGPathElement>(null)
  const [lamp, setLamp] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const el = trailRef.current
    if (!el) return
    const p = el.getPointAtLength((percent / 100) * el.getTotalLength())
    setLamp({ x: p.x, y: p.y })
  }, [percent, items.length])

  if (!authed || items.length === 0) return null

  const today = items[0]
  const refs = today.passages.map((p) => p.reference).filter(Boolean).join(' · ')

  // 성경 일독처럼 day_title이 본문 범위와 같으면 제목·부제가 중복되므로
  // 부제를 "여정 문구"로 바꿔 카드에 온기를 더한다
  const titleDupsRefs = !today.day_title || today.day_title.trim() === refs.trim()
  const daysLeft = Math.max(0, today.total_days - today.completed_days)
  // 주요 CTA는 플랜 상세를 거치지 않고 첫 본문 장으로 바로 — 읽음 기록은 플랜과 서버 동기화됨
  const first = today.passages[0]
  const readTarget = first ? `/bible/${first.book_number}/${first.chapter_start}` : `/bible/plans/${today.plan_id}`
  const readLabel = first?.book_name_ko
    ? `${first.book_name_ko} ${first.chapter_start}장 바로 읽기`
    : '바로 읽기'
  const journeyLine =
    today.completed_days > 0
      ? `총 ${today.total_days}일 여정 · ${today.completed_days}일 함께 걸었어요`
      : `총 ${today.total_days}일의 여정, 오늘 첫 걸음이에요`
  // 교회 달력 고정 — 카드의 본문은 "다음 분량"이 아니라 오늘 날짜의 분량(없으면 밀린 첫 일차)
  const calendar = isCalendarPlan(today)
  const calendarIsToday = calendar && today.scheduled_date?.slice(0, 10) === todayYmd()
  const behindDays = calendar ? today.behind_days ?? 0 : 0
  const dateLabel = calendar ? formatPlanDay(today.scheduled_date) : null
  const sermonText = sermonSummary(today.sermon)
  const kicker = calendar
    ? calendarIsToday ? '오늘의 읽기' : '밀린 읽기'
    : today.done_today ? '다음 읽기' : '오늘의 읽기'
  const doneLine = calendar ? '오늘 읽기 완료' : '오늘 분량 완료'
  const readBase = readLabel.replace(' 바로 읽기', '')
  // 완료 뒤 보조 링크는 짧게("2장 미리 읽기") — 책 이름은 바로 위 제목에 이미 있다
  const aheadLabel = first
    ? `${first.chapter_start}장 ${calendar ? '다시' : '미리'} 읽기`
    : `${calendar ? '다시' : '미리'} 읽기`
  const ctaLabel = `${readBase} 읽기`
  const pinLabel = `${today.day_number}일차${dateLabel ? ` · ${dateLabel}` : ''}`
  // 말풍선은 등불 x 비율만큼 왼쪽으로 밀어 양 끝에서도 카드 밖으로 넘치지 않게 한다
  // (0%면 왼쪽 정렬, 100%면 오른쪽 정렬, 꼬리는 늘 등불 위)
  const pinRatio = lamp ? Math.max(0, Math.min(1, lamp.x / TRAIL_W)) : 0

  // 보조 정보는 알약 대신 조용한 텍스트 한 줄 — 카드 안 강조는 제목·등불·CTA뿐
  const meta: React.ReactNode[] = []
  if (today.streak_count > 0) {
    meta.push(
      <span key="streak" className="inline-flex items-center gap-1" title={`${today.streak_count}일째 이어 읽고 있어요`}>
        <svg className="plan-meta__flame" width="10" height="13" viewBox="0 0 12 15" aria-hidden>
          <path d="M6 0.8 C 6.6 3.4, 10.4 5.6, 10.4 9.4 A4.4 4.4 0 0 1 1.6 9.4 C 1.6 6.6, 4.4 4.6, 6 0.8 Z" />
          <path d="M6 6.4 C 6.4 8, 8 8.8, 8 10.6 A2 2 0 0 1 4 10.6 C 4 9.2, 5.2 8.2, 6 6.4 Z" />
        </svg>
        연속 <b>{today.streak_count}일</b>
      </span>,
    )
  }
  if (daysLeft > 0) meta.push(<span key="left">완주까지 {daysLeft}일</span>)
  if (calendarIsToday && behindDays > 0) meta.push(<span key="behind">밀린 읽기 {behindDays}일</span>)
  if (items.length > 1) meta.push(<span key="more">외 {items.length - 1}개 플랜</span>)

  const goRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(readTarget)
  }

  return (
    <section className="px-4 pt-3">
      <div
        role="link"
        tabIndex={0}
        onClick={() => navigate(`/bible/plans/${today.plan_id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            navigate(`/bible/plans/${today.plan_id}`)
          }
        }}
        className="plan-card w-full text-left p-4 cursor-pointer"
      >
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-bold tracking-[0.08em] text-brand">
              {/* 오늘 분량을 마쳤으면 카드의 본문은 "다음 분량"이므로 라벨도 맞춘다
                  (달력 고정은 본문이 늘 오늘 날짜 분량이라 예외) */}
              {kicker}
            </span>
            <span className="text-[11px] font-medium text-gray-400 dark:text-white/40 truncate">
              · {today.plan_title}
            </span>
          </div>
          <span className="plan-pct shrink-0">
            <small>진행</small>
            {percent}%
          </span>
        </div>

        {/* 본문 범위(예레미야애가 2-4장)가 카드의 주인공 — 일차는 길 위 말풍선으로 */}
        <div className="mt-2.5 min-w-0">
          <p className="text-[22px] font-extrabold text-ink-strong tracking-[-0.035em] leading-[1.25]">
            {titleDupsRefs ? refs || today.plan_title : today.day_title}
          </p>
          {titleDupsRefs ? (
            <p className="text-[12px] font-medium text-gray-400 dark:text-white/45 mt-1.5">
              {journeyLine}
            </p>
          ) : (
            refs && <p className="text-[13px] font-semibold text-brand mt-1.5">{refs}</p>
          )}
          {sermonText && (
            <p className="mt-1 text-[12px] text-gray-500 dark:text-white/50 truncate">
              <span className="font-semibold text-gray-600 dark:text-white/65">
                {today.sermon?.label || SERMON_DEFAULT_LABEL}
              </span>
              {' · '}
              {sermonText}
            </p>
          )}
        </div>

        {/* 밝혀진 길 — 걸어온 구간은 등불빛, 남은 길은 점점이, 끝엔 별.
            지금 선 자리엔 일차 말풍선(지도 앱의 현재 위치 핀), 양 끝엔 출발·완주 */}
        <div className="plan-trail">
          <svg viewBox={`0 0 ${TRAIL_W} 44`} preserveAspectRatio="none" className="plan-trail__svg" aria-hidden>
            <path d={TRAIL_D} className="plan-trail__base" />
            <path
              d={TRAIL_D}
              ref={trailRef}
              pathLength={100}
              strokeDasharray={`${percent} 100`}
              className="plan-trail__lit"
            />
            <path
              d="M331 8 L332.4 11.6 L336 13 L332.4 14.4 L331 18 L329.6 14.4 L326 13 L329.6 11.6 Z"
              className={`plan-trail__star${percent >= 100 ? ' plan-trail__star--reached' : ''}`}
            />
            {lamp && (
              <>
                <circle cx={lamp.x} cy={lamp.y} r="7.5" className="plan-trail__lamp-glow" />
                <circle cx={lamp.x} cy={lamp.y} r="2.6" className="plan-trail__lamp" />
              </>
            )}
          </svg>
          {lamp && (
            <span
              className="plan-pin"
              style={{
                left: `${pinRatio * 100}%`,
                top: `${lamp.y}px`,
                ['--pin-r' as string]: pinRatio,
              }}
            >
              {pinLabel}
            </span>
          )}
        </div>
        <div className="plan-trail__ends" aria-hidden>
          <span>1일</span>
          <span>{today.total_days}일</span>
        </div>

        {meta.length > 0 && (
          <div className="plan-meta">
            {meta.map((m, i) => (
              <Fragment key={i}>
                {i > 0 && <span className="plan-meta__dot" aria-hidden />}
                {m}
              </Fragment>
            ))}
          </div>
        )}

        {today.done_today ? (
          // 오늘 분량을 마쳤으면 — 완료 확인 + 다음 일차 미리 읽기는 조용한 텍스트 링크
          <div className="plan-foot">
            <span className="plan-foot__done">
              <i aria-hidden>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </i>
              {doneLine}
            </span>
            <button type="button" onClick={goRead} className="plan-foot__link">
              {aheadLabel}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        ) : (
          // 주요 액션 — 카드 전폭 플랫 프라이머리 버튼
          <button type="button" onClick={goRead} className="plan-cta">
            <span className="truncate">{ctaLabel}</span>
            <svg className="plan-cta__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}

export default TodayPlanCard
