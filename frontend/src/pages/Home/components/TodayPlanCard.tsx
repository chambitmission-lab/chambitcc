// 홈 "오늘의 읽기" 카드 — 진행 중인 구독형 읽기 플랜(bible_plans)의 오늘 분량.
// 활성 구독이 없거나 비로그인 시 아무것도 렌더하지 않는다 (홈 클러터 방지).
//
// 진행률은 도넛 링이 아니라 "등불이 걸어온 만큼 밝혀진 길"로 그린다 (시 119:105).
// 365일 여정에서 2% 링은 빈 원처럼 보여 힘이 빠지지만,
// 길 위의 등불은 같은 숫자를 "출발해서 걷는 중"으로 읽게 한다.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTodayReadings } from '../../../hooks/useBiblePlan'
import { isAuthenticated } from '../../../utils/auth'
import './TodayPlanCard.css'

// 완만하게 굽이치는 오솔길 — 끝은 별(종착지) 앞에서 멈춘다
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
  const journeyLine =
    today.completed_days > 0
      ? `총 ${today.total_days}일 여정 · ${today.completed_days}일 함께 걸었어요`
      : `총 ${today.total_days}일의 여정, 오늘 첫 걸음이에요`

  return (
    <section className="px-4 pt-3">
      <button
        type="button"
        onClick={() => navigate(`/bible/plans/${today.plan_id}`)}
        className="glass-card w-full text-left rounded-2xl p-4"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-bold tracking-[0.08em] text-brand">
                {/* 오늘 분량을 마쳤으면 카드의 본문은 "다음 분량"이므로 라벨도 맞춘다
                    — "오늘의 읽기 + 완료 배지"가 위 본문을 읽은 것처럼 오독되는 것 방지 */}
                {today.done_today ? '다음 읽기' : '오늘의 읽기'}
              </span>
              <span className="text-[11.5px] text-gray-400 dark:text-white/45 truncate">
                · {today.plan_title}
              </span>
            </div>
            {today.streak_count > 0 && (
              <span
                className="plan-streak"
                title={`${today.streak_count}일째 이어 읽고 있어요`}
              >
                <svg
                  className="plan-streak__flame"
                  width="10"
                  height="13"
                  viewBox="0 0 12 15"
                  aria-hidden
                >
                  <path
                    d="M6 0.8 C 6.6 3.4, 10.4 5.6, 10.4 9.4 A4.4 4.4 0 0 1 1.6 9.4 C 1.6 6.6, 4.4 4.6, 6 0.8 Z"
                    fill="var(--amber-icon)"
                  />
                  <path
                    d="M6 6.4 C 6.4 8, 8 8.8, 8 10.6 A2 2 0 0 1 4 10.6 C 4 9.2, 5.2 8.2, 6 6.4 Z"
                    fill="#fff3d6"
                  />
                </svg>
                {today.streak_count}일
              </span>
            )}
          </div>

          <div className="mt-3 min-w-0">
            <p className="text-[15.5px] font-bold text-ink-strong tracking-[-0.01em]">
              {today.day_number}일차
              {titleDupsRefs
                ? refs ? ` · ${refs}` : ''
                : ` · ${today.day_title}`}
            </p>
            {titleDupsRefs ? (
              <p className="text-[12px] text-gray-400 dark:text-white/45 mt-0.5">
                {journeyLine}
              </p>
            ) : (
              refs && <p className="text-[12.5px] text-brand mt-0.5">{refs}</p>
            )}
          </div>

          {/* 밝혀진 길 — 걸어온 구간은 등불빛, 남은 길은 점점이, 끝엔 별 */}
          <div className="plan-trail" aria-hidden>
            <svg viewBox="0 0 340 44" preserveAspectRatio="none" className="plan-trail__svg">
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
            {percent > 0 && <span className="plan-trail__pct">{percent}%</span>}
          </div>

          <div className="mt-2">
            {today.done_today ? (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-300">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                오늘 읽기 완료!
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full brand-gradient text-[12.5px] font-bold"
              >
                지금 읽기
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            )}
            {items.length > 1 && (
              <span className="ml-2 text-[11.5px] text-gray-400 dark:text-white/45">
                외 {items.length - 1}개 플랜
              </span>
            )}
          </div>
        </div>
      </button>
    </section>
  )
}

export default TodayPlanCard
