// 플랜 카드 — 섹션 제목 · 비주얼 · 둘러보기 쿠폰 카드 · 스켈레톤.
// 읽는 중 플랜은 JourneyBoard(말씀 오솔길), 오늘 분량은 TodayHero 가 맡는다.

import type { PlanSummary } from '../../../../types/biblePlan'
import { accentGradient } from '../planVisuals'
import { PlanGlyph, PeopleIcon as UsersIcon } from '../PlanIcons'

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[15px] lg:text-[20px] lg:mb-6 font-extrabold text-ink-strong tracking-[-0.02em] mb-5 px-0.5">
    {children}
  </h3>
)

// 카드 비주얼(감성 그래픽): accent 그라데이션 + 글로우 + 선화 표식.
// size: feed = 격자 카드의 5:4 커버 / thumb = 가로형 카드의 정사각 썸네일.
// (가로형에 쓰던 104px 세로 띠는 3:2 사진의 빈 여백만 잘려 '반쪽'으로 보여 폐기했다.
//  사진은 온전한 비율로 보일 때만 사진으로 읽힌다.)
const PlanVisual = ({
  plan,
  size,
}: {
  plan: PlanSummary
  size: 'feed' | 'thumb'
}) => {
  const grad = accentGradient(plan.accent)

  // accent 그라데이션 + 선화 표식. (플랜별 수채 커버 사진은 화면마다 배경이 바뀌는
  // 인상을 줘 폐기했다 — 사진 대신 블루 패밀리 안에서만 톤을 변주한다)
  // 격자(feed)에서는 오브젝트를 작게 두고 그라데이션 여백을 넉넉히 남긴다
  const mainGlyph = size === 'feed' ? 34 : 24
  const markGlyph = size === 'feed' ? 78 : 46
  const markOpacity = size === 'feed' ? 'opacity-[0.16]' : 'opacity-[0.2]'

  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${grad} text-white`}>
      {/* 밝은 하이라이트 글로우 — 카드가 '눌러도 되는 활성 상태'로 읽히도록 충분히 밝게 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.48),transparent_60%)]" />
      {/* 하단 살짝 어둡게 (표식 입체감) — 과하면 비활성처럼 보여 최소한만 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      {/* 워터마크 표식 — 같은 선화를 크게 눕혀 배경 결로 쓴다 */}
      <span
        className={`absolute -right-3 -bottom-5 ${markOpacity} rotate-12 pointer-events-none`}
      >
        <PlanGlyph emoji={plan.emoji} size={markGlyph} />
      </span>
      {/* 중앙 표식 */}
      <span className="absolute inset-0 flex items-center justify-center drop-shadow-[0_5px_14px_rgba(0,0,0,0.3)]">
        <PlanGlyph emoji={plan.emoji} size={mainGlyph} />
      </span>
    </div>
  )
}

// 난이도 점 — 입문·초급 1 / 중급 2 / 고급 3. 모르는 값이면 점 없이 글자만
const LEVEL_DOTS: Record<string, number> = { 입문: 1, 초급: 1, 중급: 2, 고급: 3 }

// 도장 기울기 — 격자에서 카드마다 조금씩 달라야 손으로 찍은 쿠폰처럼 보인다
const COUPON_TILT = [-10, 6, -4, 9, -7, 3]

// 둘러보기 카드 — "새 도장판" 쿠폰. 표지에 기간 도장(90일) + 절취선 + 제목·난이도·해시태그.
// (예전 정사각 피드 카드의 선화 표식은 왼쪽 아래 작은 표식으로 남겼다)
const CouponPlanCard = ({
  plan,
  index,
  onClick,
}: {
  plan: PlanSummary
  index: number
  onClick: () => void
}) => {
  const people = plan.participant_count ?? 0
  const dots = plan.level ? LEVEL_DOTS[plan.level] : undefined
  const tags = [plan.category].filter(Boolean) as string[]
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-full w-full flex-col text-left overflow-hidden rounded-[20px] bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.97]"
    >
      <div className={`relative aspect-[4/3] shrink-0 overflow-hidden bg-gradient-to-br ${accentGradient(plan.accent)} text-white`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.42),transparent_60%)]" />
        {/* 사회적 증거 — 몇 명이 함께 읽는지 보여 시작 문턱을 낮춘다 */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/[0.18] px-2 py-1 text-[10.5px] lg:text-[12.5px] font-bold leading-none">
          {people > 0 ? (
            <>
              <UsersIcon size={12} />
              {people.toLocaleString()}명 함께
            </>
          ) : (
            '첫 번째로 시작'
          )}
        </span>
        <span className="absolute left-3 bottom-3 drop-shadow-[0_3px_8px_rgba(0,0,0,0.25)]">
          <PlanGlyph emoji={plan.emoji} size={22} />
        </span>
        {/* 기간 도장 */}
        <span
          className="pj-stamp absolute right-3 top-1/2 -mt-[36px] lg:-mt-[42px] flex w-[72px] h-[72px] lg:w-[84px] lg:h-[84px] flex-col items-center justify-center rounded-full border-[2.5px] border-white/95 shadow-[inset_0_0_0_5px_rgba(255,255,255,0.35)] leading-none transition-transform duration-300 group-hover:scale-105"
          style={{ '--r': `${COUPON_TILT[index % COUPON_TILT.length]}deg` } as React.CSSProperties}
        >
          <b className="text-[24px] lg:text-[28px] font-extrabold tracking-[-0.04em] tabular-nums">{plan.total_days}</b>
          <small className="mt-1 text-[9.5px] lg:text-[11px] font-bold opacity-90">일 도장판</small>
        </span>
      </div>
      {/* 절취선 — 양쪽 홈은 페이지 배경색으로 파낸다(plan-journey.css .pj-perf) */}
      <div className="pj-perf relative mx-3 border-t-2 border-dashed border-gray-200 dark:border-white/[0.1]" aria-hidden />
      <div className="flex-1 px-3.5 pt-3 pb-4 lg:px-4">
        <h4 className="min-h-[2.6em] text-[14.5px] lg:text-[17px] font-extrabold text-ink-strong tracking-[-0.02em] leading-snug line-clamp-2 break-keep">
          {plan.title}
        </h4>
        <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] lg:text-[13.5px] font-semibold text-gray-500 dark:text-white/50">
          {dots != null && (
            <span className="inline-flex gap-[3px]" aria-hidden>
              {[1, 2, 3].map((n) => (
                <i key={n} className={`block w-[5px] h-[5px] rounded-full ${n <= dots ? 'bg-brand' : 'bg-gray-200 dark:bg-white/[0.15]'}`} />
              ))}
            </span>
          )}
          {plan.level && <span>{plan.level}</span>}
        </p>
        <p className="mt-1.5 flex flex-wrap gap-x-2 text-[11.5px] lg:text-[13.5px] font-medium tracking-[-0.02em] text-brand">
          <span>#{plan.total_days}일완성</span>
          {tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </p>
      </div>
    </button>
  )
}

const PlanSkeletons = () => (
  <div className="px-4 pt-9 lg:px-7">
    <div className="h-4 w-24 rounded bg-gray-100 dark:bg-white/[0.06] animate-pulse mb-5" />
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] lg:gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse overflow-hidden"
        >
          <div className="aspect-[4/3]" />
          <div className="p-3 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-gray-200/70 dark:bg-white/[0.06]" />
            <div className="h-2.5 w-1/2 rounded bg-gray-200/70 dark:bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { SectionTitle, CouponPlanCard, PlanSkeletons, PlanVisual }
