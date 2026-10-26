// 오늘 카드 — 히어로 삽화("통독표에 도장 찍는 양") + 오늘 분량 티켓 + 이번 주 도장 7칸.
// 들어오자마자 "오늘 무엇을 읽으면 되는지"가 보이도록 한 덩어리로 묶었다.
// 읽는 플랜이 없으면(비로그인·첫 방문) 예전 소개 문구만 남는 히어로가 된다.
//
// ★삽화는 위쪽 글귀 칸에만 깐다. 티켓까지 덮으면 양이 티켓 뒤로 숨는다.
//   카드·잉크·삽화가 한 세트인 규칙은 그대로다(plan-hero.css · docs/plan-hero-bg-prompts.md).

import type { PlanSummary, TodayReading } from '../../../../types/biblePlan'
import { FlameIcon } from '../PlanIcons'
import { streakAlive, todayInfo, weekStamps } from './planJourney'

const Check = ({ size = 14, width = 3 }: { size?: number; width?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const Chevron = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

// 도장마다 조금씩 다른 기울기 — 손으로 찍은 느낌
const TILT = [-9, 6, -4, 10, -12, 3, -6]

const formatToday = (d: Date) =>
  `${d.getMonth() + 1}월 ${d.getDate()}일 ${'일월화수목금토'[d.getDay()]}요일`

const TodayHero = ({
  plan,
  today,
  artReady,
  onOpen,
}: {
  /** 오늘 카드에 올릴 플랜(읽는 중 플랜 중 오늘 아직 안 읽은 첫 플랜). 없으면 소개 히어로 */
  plan: PlanSummary | null
  today?: TodayReading
  artReady: boolean
  onOpen: () => void
}) => {
  const now = new Date()
  const progress = plan?.progress
  const info = plan ? todayInfo(plan, today) : null
  const showTicket = !!plan && !!info && info.day != null && progress?.status !== 'completed'
  const done = !!info?.doneToday
  const streak = streakAlive(progress, now) ? progress?.streak_count ?? 0 : 0
  const doneDays = progress?.completed_days ?? 0
  const stamps = showTicket ? weekStamps(progress, now) : []

  return (
    <section className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(120deg,#dceefc_0%,#e9f4fd_55%,#eef7ff_100%)] ring-1 ring-[rgba(49,130,246,0.15)] shadow-[0_14px_34px_-18px_rgba(49,130,246,0.6)] dark:bg-[linear-gradient(120deg,#060d1c_0%,#08111f_55%,#0c162e_100%)] dark:ring-white/[0.08] dark:shadow-[0_10px_34px_-12px_rgba(0,0,0,0.6)]">
      {/* 글귀 칸 — 삽화는 여기에만 */}
      <div className={`relative px-5 pt-5 pb-6 lg:px-8 lg:pt-7 lg:pb-8 ${showTicket ? 'min-h-[172px] lg:min-h-[208px]' : 'py-8 lg:py-9'}`}>
        <div className={`plan-hero-art absolute inset-0${artReady ? ' is-ready' : ''}`} aria-hidden />
        <div className="relative z-10">
          {showTicket ? (
            <p className="flex flex-wrap items-center gap-2 text-[12px] lg:text-[14px] font-bold text-[#2563eb] dark:text-white/70">
              {formatToday(now)}
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-white/[0.1] px-2.5 py-1 text-amber-600 dark:text-amber-300 font-extrabold shadow-[0_3px_10px_-5px_rgba(240,140,0,0.6)]">
                  <FlameIcon size={13} />
                  {streak}일 연속
                </span>
              )}
            </p>
          ) : (
            <span className="block text-[11px] font-semibold uppercase tracking-[0.34em] text-[#2563eb] dark:text-white/65">
              Reading&nbsp;Plan
            </span>
          )}
          {/* drop-shadow 는 다크에만 — 밝은 카드 위 남색 글씨에 검은 그림자가 붙으면 지저분하다 */}
          <h2 className="mt-2.5 text-[23px] lg:text-[30px] font-extrabold tracking-[-0.03em] leading-[1.28] text-[#152648] dark:text-white dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] break-keep">
            {!showTicket ? (
              <>
                오늘부터,
                <br />
                함께 읽어요
              </>
            ) : done ? (
              <>
                <em className="not-italic text-brand">{doneDays}번째</em> 도장을
                <br />
                찍었어요
              </>
            ) : (
              <>
                오늘 도장 <em className="not-italic text-brand">한 칸</em>이
                <br />
                기다리고 있어요
              </>
            )}
          </h2>
          {!showTicket && (
            <p className="text-[13px] lg:text-[15px] font-light leading-[1.7] text-[#41527a] dark:text-white/80 mt-3 max-w-[15rem] lg:max-w-[17rem] break-keep">
              계획을 골라 시작하면 매일 분량과 진행률·연속 기록을 챙겨드려요.
            </p>
          )}
        </div>
      </div>

      {showTicket && plan && info && (
        <>
          {/* 오늘 분량 티켓 — 왼쪽 일차 그루터기 | 절취선 | 본문 */}
          <button
            type="button"
            onClick={onOpen}
            className={`group relative flex w-full text-left text-white transition-colors ${
              done ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-brand'
            }`}
          >
            <span className="w-[86px] lg:w-[112px] shrink-0 flex flex-col items-center justify-center gap-0.5 py-4 bg-black/[0.14] border-r-2 border-dashed border-white/40">
              <span className="text-[11px] lg:text-[13px] font-semibold opacity-85">
                {done && !info.calendarAfter ? '다음' : '오늘'}
              </span>
              <span className="text-[28px] lg:text-[34px] font-extrabold leading-none tracking-[-0.04em] tabular-nums">
                {info.calendarAfter ? info.lastDoneDay ?? info.day : info.day}
              </span>
              <span className="text-[11px] lg:text-[13px] font-bold opacity-90">일차</span>
            </span>
            <span className={`flex-1 min-w-0 px-4 py-4 lg:px-6 lg:py-5 ${done ? 'pr-[92px] lg:pr-[120px]' : ''}`}>
              <span className="block text-[12px] lg:text-[14.5px] font-semibold opacity-90 truncate">
                {done
                  ? `오늘 분량 완료${info.lastDoneDay != null ? ` · ${info.lastDoneDay}일차` : ''}`
                  : `${plan.title} · 오늘 읽을 말씀`}
              </span>
              <span className="mt-1 block text-[21px] lg:text-[28px] font-extrabold tracking-[-0.03em] leading-tight line-clamp-2 break-keep">
                {done ? info.calendarAfter ?? `다음은 ${info.headline}` : info.headline}
              </span>
              {!done && info.subline && (
                <span className="mt-0.5 block text-[12px] lg:text-[14.5px] opacity-85 truncate">{info.subline}</span>
              )}
              <span
                className={`pj-shine mt-3 inline-flex items-center gap-1 rounded-full bg-white pl-4 pr-3 py-2.5 text-[13.5px] lg:text-[15.5px] font-extrabold leading-none transition-transform group-hover:scale-[1.04] ${
                  done ? 'text-emerald-600' : 'text-brand-dim'
                }`}
              >
                {done ? '한 칸 더 읽기' : '읽고 도장 찍기'}
                <Chevron />
              </span>
            </span>
            {done && (
              <span
                className="pj-slam absolute right-4 lg:right-7 top-1/2 -mt-[34px] lg:-mt-[42px] w-[68px] h-[68px] lg:w-[84px] lg:h-[84px] rounded-full border-[3px] border-white/90 shadow-[inset_0_0_0_5px_rgba(255,255,255,0.35)] flex flex-col items-center justify-center text-[12px] lg:text-[14px] font-extrabold leading-tight"
                style={{ '--r': '-12deg' } as React.CSSProperties}
                aria-hidden
              >
                <Check size={20} />
                읽음
              </span>
            )}
          </button>

          {/* 이번 주 도장 — 최근 7일, 마지막 칸이 오늘 */}
          <div
            className={`grid grid-cols-7 gap-0.5 px-2.5 pt-2.5 pb-3.5 lg:px-10 lg:pt-3 lg:pb-4 text-white ${
              done ? 'bg-emerald-600 dark:bg-emerald-700' : 'bg-brand-dim'
            }`}
            aria-label={`이번 주 ${stamps.filter((s) => s.stamped).length}일 읽음`}
          >
            {stamps.map((s, i) => (
              <div key={s.key} className="flex flex-col items-center gap-1.5">
                <span className={`text-[10.5px] lg:text-[12.5px] font-bold ${s.isToday ? 'opacity-100' : 'opacity-75'}`}>
                  {s.label}
                </span>
                <span
                  className={`flex items-center justify-center w-8 h-8 lg:w-9 lg:h-9 rounded-full ${
                    s.stamped
                      ? `pj-stamp border-2 border-white bg-white/15 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.28)]${s.isToday ? ' pj-slam' : ''}`
                      : s.isToday
                        ? 'pj-wait border-2 border-white'
                        : 'border-[1.5px] border-dashed border-white/45'
                  }`}
                  style={s.stamped ? ({ '--r': `${TILT[i]}deg` } as React.CSSProperties) : undefined}
                >
                  {s.stamped && <Check size={15} />}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default TodayHero
