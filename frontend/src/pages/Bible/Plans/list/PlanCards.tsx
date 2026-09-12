// 플랜 카드 — 섹션 제목 · 해시태그 · 비주얼 · 피드 카드 · 대표 카드 · 스켈레톤.

import type { PlanSummary, TodayReading } from '../../../../types/biblePlan'
import { accentGradient, gradientTextStyle, planHashtags } from '../planVisuals'
import { FlameIcon, PartyIcon, PlanGlyph, PeopleIcon as UsersIcon } from '../PlanIcons'

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[15px] font-extrabold text-ink-strong tracking-[-0.02em] mb-5 px-0.5">
    {children}
  </h3>
)

// 해시태그 한 줄 — #7일완성 #입문 #습관
const Hashtags = ({ plan }: { plan: PlanSummary }) => {
  const tags = planHashtags(plan)
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
      {tags.map((t) => (
        <span
          key={t}
          className="text-[11px] font-medium tracking-[-0.02em] text-brand"
        >
          #{t}
        </span>
      ))}
    </div>
  )
}

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

// 피드형 카드 (둘러보기 · 2열 그리드) — 이미지 우선 세로 카드
const FeedPlanCard = ({ plan, onClick }: { plan: PlanSummary; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative flex h-full w-full flex-col text-left overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.97]"
  >
    {/* 정사각 → 5:4로 살짝 낮춰 무게중심을 텍스트 쪽으로 — 글씨가 먼저 읽힌다 */}
    <div className="relative aspect-[5/4] shrink-0">
      <PlanVisual plan={plan} size="feed" />
    </div>
    {/* 텍스트와 화살표를 한 flex 행으로 완전히 분리 — 제목·태그가 길어져도
        겹치지 않고, 배경 없는 맨 화살표라 "카드 전체가 눌린다"로 읽힌다.
        flex-1 로 남는 높이를 흡수해 2열 카드가 항상 같은 높이로 정렬된다 */}
    <div className="flex-1 px-3.5 pt-3.5 pb-[18px] flex items-center gap-1.5">
      <div className="flex-1 min-w-0">
        {/* 제목은 1~2줄로 갈리므로 최소 2줄 높이를 확보해 해시태그 baseline 을 맞춘다 */}
        <h4 className="min-h-[2.5em] text-[14px] font-bold text-ink-strong tracking-[-0.015em] leading-snug line-clamp-2">
          {plan.title}
        </h4>
        <div className="mt-1">
          <Hashtags plan={plan} />
        </div>
        {/* 사회적 증거 — 몇 명이 함께 읽는지 보여 시작 문턱을 낮춘다 */}
        {(plan.participant_count ?? 0) > 0 && (
          <p className="mt-1 text-[11px] font-medium tracking-[-0.01em] text-gray-400 dark:text-white/45">
            <UsersIcon size={12} className="inline-block -mt-px mr-1 align-middle" />
            {(plan.participant_count ?? 0).toLocaleString()}명 참여 중
          </p>
        )}
      </div>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-gray-300 dark:text-white/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  </button>
)

// 피처형 카드 (이어서 읽기 · 가로형)
// 정보 위계: ① 무슨 플랜인지(제목·기간) ② 얼마나 왔는지(진행률 한 줄) ③ 오늘 뭘 읽을지(패널+CTA)
// 예전 카드는 33%·불꽃·해시태그·"119/365일 · 118일차 진행 중"·"118일차 · 역대하"·"117일차 완료"가
// 각자 떠 있어 숫자 세 개(119·118·117)가 서로 다른 뜻으로 읽혔다. 이제 진행 숫자는 게이지 아래
// 한 줄로만 모으고, 일차 번호는 "오늘 읽을 말씀" 패널 안에서만 말한다. 해시태그는 둘러보기(발견)용이라
// 내 진행 카드에서는 뺀다. 상태 색 규칙은 유지: 진행 중 = 브랜드 블루, 완료 = 에메랄드.
const formatStartLabel = (value?: string | null): string | null => {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getMonth() + 1}월 ${d.getDate()}일부터`
}

const CheckMark = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const Chevron = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const FeaturedPlanCard = ({
  plan,
  today,
  onClick,
}: {
  plan: PlanSummary
  today?: TodayReading
  onClick: () => void
}) => {
  const progress = plan.progress
  const subscribed = !!progress?.subscribed
  const completed = progress?.status === 'completed'
  const streak = progress?.streak_count ?? 0
  const doneToday = today?.done_today ?? progress?.completed_today ?? false
  const lastDoneDay = today?.last_completed_day ?? progress?.last_completed_day ?? null
  const todayRefs = (today?.passages ?? [])
    .map((p) => p.reference)
    .filter(Boolean)
    .join(' · ')
  // day_number = 아직 안 읽은 첫 일차(다음에 읽을 분량). 오늘 이미 읽었어도 이 값은 그 다음 일차다.
  const todayDay = today?.day_number ?? progress?.current_day
  const totalDays = progress?.total_days || plan.total_days
  const doneDays = progress?.completed_days ?? 0
  const remainDays = Math.max(0, totalDays - doneDays)
  const percent = Math.min(100, progress?.percent ?? 0)
  const startLabel = formatStartLabel(progress?.start_date)
  // 일차 제목이 본문 참조와 같으면(대부분의 통독 플랜) 한 번만 보여준다
  const dayTitle = today?.day_title?.trim() || ''
  const headline = dayTitle || todayRefs || (todayDay != null ? `${todayDay}일차` : '')
  const subline = dayTitle && todayRefs && dayTitle !== todayRefs ? todayRefs : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block w-full text-left overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.985]"
    >
      <div className="p-4">
        {/* ① 헤더 — 썸네일 · 제목/기간 · 진행률 숫자 하나 */}
        <div className="flex items-center gap-3">
          <span className="relative block w-12 h-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/[0.06] dark:ring-white/10">
            <PlanVisual plan={plan} size="thumb" />
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="text-[16px] font-bold text-ink-strong tracking-[-0.02em] leading-snug truncate">
              {plan.title}
            </h4>
            <p className="mt-0.5 flex items-center gap-1.5 flex-wrap text-[12px] tracking-[-0.01em] text-gray-500 dark:text-white/50">
              {plan.is_personal && (
                <span className="inline-flex items-center px-1.5 py-[2px] rounded-md bg-[var(--brand-soft-strong)] text-brand text-[10.5px] font-bold leading-none">
                  {plan.is_owner ? '내 플랜' : `${plan.owner_name ?? '친구'}님의 플랜`}
                  {(plan.participant_count ?? 0) > 1 && ` · ${plan.participant_count}명`}
                </span>
              )}
              <span>{totalDays}일 플랜</span>
              {startLabel && (
                <>
                  <span aria-hidden className="text-gray-300 dark:text-white/20">·</span>
                  <span>{startLabel}</span>
                </>
              )}
            </p>
          </div>
          {subscribed && progress && (
            completed ? (
              <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300 text-[12px] font-extrabold leading-none">
                <CheckMark size={11} />
                완주
              </span>
            ) : (
              <span
                className="shrink-0 text-[24px] font-extrabold leading-none tracking-[-0.03em]"
                style={gradientTextStyle}
              >
                {percent}
                <span className="text-[13px] font-bold ml-px">%</span>
              </span>
            )
          )}
        </div>

        {/* ② 진행 — 게이지 + 숫자는 이 한 줄에만 */}
        {subscribed && progress && (
          <div className="mt-3.5">
            <div
              className={`h-2 rounded-full overflow-hidden ${
                completed ? 'bg-emerald-500/[0.12]' : 'bg-[var(--brand-soft-strong)]'
              }`}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${
                  completed ? 'bg-emerald-400/80 dark:bg-emerald-400/70' : 'bg-brand'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2 text-[11.5px] tracking-[-0.01em] tabular-nums text-gray-500 dark:text-white/50">
              {completed ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300 font-semibold">
                  <PartyIcon size={12} />
                  {totalDays}일을 모두 읽었어요
                </span>
              ) : (
                <span>
                  <b className="font-bold text-gray-700 dark:text-white/75">{doneDays}일</b> 읽음
                  <span aria-hidden className="mx-1 text-gray-300 dark:text-white/20">·</span>
                  {remainDays}일 남음
                </span>
              )}
              {!completed && streak > 0 && (
                <span className="inline-flex items-center gap-0.5 font-bold text-amber-600 dark:text-amber-300">
                  <FlameIcon size={12} />
                  {streak}일 연속
                </span>
              )}
            </div>
          </div>
        )}

        {/* ③ 오늘 패널 — "지금 뭘 읽으면 되는지"만 크게. 읽었으면 완료 확인 + 다음 분량 예고 */}
        {subscribed && !completed && todayDay != null && (
          doneToday ? (
            <div className="mt-3.5 rounded-xl bg-emerald-500/[0.07] dark:bg-emerald-400/[0.08] px-3.5 py-3">
              <p className="inline-flex items-center gap-1.5 text-[12.5px] font-bold tracking-[-0.02em] text-emerald-600 dark:text-emerald-300">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white">
                  <CheckMark size={9} />
                </span>
                오늘 분량을 읽었어요
                {lastDoneDay != null && (
                  <span className="font-medium opacity-80">· {lastDoneDay}일차</span>
                )}
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <p className="min-w-0 text-[12.5px] tracking-[-0.02em] text-gray-500 dark:text-white/50 truncate">
                  다음 {todayDay}일차
                  {headline && (
                    <span className="text-gray-700 dark:text-white/75"> · {headline}</span>
                  )}
                </p>
                <span className="shrink-0 inline-flex items-center gap-0.5 text-[12px] font-bold tracking-[-0.02em] text-brand transition-transform group-hover:translate-x-0.5">
                  더 읽기
                  <Chevron size={11} />
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-3.5 rounded-xl bg-[var(--brand-soft)] px-3.5 py-3">
              <p className="text-[11px] font-bold tracking-[-0.01em] text-brand">
                오늘 읽을 말씀 · {todayDay}일차
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-extrabold tracking-[-0.03em] leading-tight text-ink-strong line-clamp-2">
                    {headline}
                  </p>
                  {subline && (
                    <p className="mt-0.5 text-[12px] tracking-[-0.02em] text-gray-500 dark:text-white/50 truncate">
                      {subline}
                    </p>
                  )}
                </div>
                <span className="relative seal-chip shrink-0 inline-flex items-center gap-1 pl-3.5 pr-2.5 py-2 rounded-full bg-brand text-white text-[12.5px] font-bold tracking-[-0.02em] leading-none transition-transform group-hover:scale-[1.04]">
                  읽기
                  <Chevron size={12} />
                </span>
              </div>
            </div>
          )
        )}
      </div>
    </button>
  )
}

const PlanSkeletons = () => (
  <div className="px-4 pt-9">
    <div className="h-4 w-24 rounded bg-gray-100 dark:bg-white/[0.06] animate-pulse mb-5" />
    <div className="grid grid-cols-2 gap-3.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse overflow-hidden"
        >
          <div className="aspect-[5/4]" />
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
export { SectionTitle, FeedPlanCard, FeaturedPlanCard, PlanSkeletons }
