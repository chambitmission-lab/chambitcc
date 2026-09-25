// 선거 화면 공통 UI — 성도 투표 화면·홈 배너·관리자 현황판이 같은 조각을 쓴다
import type { ElectionCandidate, ElectionRoundResult } from '../../types/election'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { turnoutPercent } from './electionShared'

/** 투표함 — 목록 카드·홈 배너·빈 상태가 함께 쓰는 상징 */
export const BallotIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11.5h16V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
    <path d="M8.5 11.5V5A1.5 1.5 0 0 1 10 3.5h4A1.5 1.5 0 0 1 15.5 5v6.5" />
    <polyline points="10.3 7.6 11.6 8.9 13.9 6.4" />
    <path d="M9.5 15.5h5" />
  </svg>
)

/** 후보 사진 — 없으면 이름 첫 글자. 기호는 좌상단 배지 */
export const CandidateAvatar = ({
  candidate,
  size = 56,
  showNumber = true,
}: {
  candidate: ElectionCandidate
  size?: number
  showNumber?: boolean
}) => (
  <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
    {candidate.photo_url ? (
      <img
        src={candidate.photo_url}
        alt=""
        loading="lazy"
        className="w-full h-full rounded-2xl object-cover bg-gray-100 dark:bg-white/[0.06]"
      />
    ) : (
      <span
        className="w-full h-full rounded-2xl bg-[var(--brand-soft)] text-brand flex items-center justify-center font-extrabold"
        style={{ fontSize: size * 0.38 }}
      >
        {candidate.name.charAt(0)}
      </span>
    )}
    {showNumber ? (
      <span className="absolute -top-1.5 -left-1.5 min-w-[1.35rem] h-[1.35rem] px-1 rounded-full bg-ink-strong text-white dark:bg-white dark:text-[#16161d] text-[11px] font-extrabold flex items-center justify-center tabular-nums ring-2 ring-white dark:ring-card-dark">
        {candidate.number}
      </span>
    ) : null}
  </span>
)

/** 투표율 막대 — 득표를 가려도 이것만은 늘 보인다. large: 성도 상세 화면 PC(lg+)에서 크게 */
export const TurnoutBar = ({ voted, total, large = false }: { voted: number; total: number; large?: boolean }) => {
  const percent = turnoutPercent(voted, total)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-[12px] font-semibold text-ink-muted ${large ? 'lg:text-[15px]' : ''}`}>투표율</span>
        <span className={`text-[12.5px] font-bold text-ink-strong tabular-nums ${large ? 'lg:text-[17px]' : ''}`}>
          {voted}
          <span className="text-ink-muted font-semibold"> / {total}명 · {percent}%</span>
        </span>
      </div>
      <div className={`mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden ${large ? 'lg:mt-2.5 lg:h-3' : ''}`}>
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

/**
 * 후보별 득표 막대 + 당선 기준선.
 * 막대 길이의 분모는 당선 기준의 분모(base)라, 기준선(required/base)을 넘는 순간이 곧 기준 통과다.
 * 프로젝터에 띄우는 발표 화면은 이걸 쓰지 않고 자기 크기로 다시 그린다
 * (Admin/components/ElectionStage.tsx) — 식은 같으니 한쪽만 고치지 말 것.
 * large: 성도 상세 화면 PC(lg+)에서 글씨·막대를 키운다(관리자 현황판은 촘촘한 그대로).
 */
export const TallyBars = ({
  result,
  candidates,
  large = false,
}: {
  result: ElectionRoundResult
  candidates: ElectionCandidate[]
  large?: boolean
}) => {
  const isLg = useMediaQuery('(min-width: 1024px)')
  const big = large && isLg
  const avatar = big ? 52 : 40
  const byId = new Map(candidates.map((c) => [c.id, c]))
  const base = Math.max(result.base, 1)
  const linePercent = result.base > 0 ? Math.min(100, (result.required / base) * 100) : null

  return (
    <div className={big ? 'space-y-5' : 'space-y-3'}>
      {result.tallies.map((row) => {
        const cand = byId.get(row.candidate_id)
        if (!cand) return null
        const percent = Math.min(100, (row.votes / base) * 100)
        const tone = row.elected
          ? 'bg-brand'
          : row.passed
            ? 'bg-[color-mix(in_srgb,var(--brand)_60%,transparent)]'
            : 'bg-gray-300 dark:bg-white/25'
        return (
          <div key={row.candidate_id} className={`flex items-center ${big ? 'gap-4' : 'gap-3'}`}>
            <CandidateAvatar candidate={cand} size={avatar} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className={`font-bold text-ink-strong truncate ${big ? 'text-[19px]' : 'text-[14px]'}`}>
                  {cand.name}
                  {row.elected ? (
                    <span className={`ml-1.5 align-middle font-bold text-brand ${big ? 'text-[14px]' : 'text-[11px]'}`}>
                      {result.is_final ? '당선' : '기준 통과'}
                    </span>
                  ) : row.tied ? (
                    <span className={`ml-1.5 align-middle font-bold text-amber-600 dark:text-amber-300 ${big ? 'text-[14px]' : 'text-[11px]'}`}>
                      동률
                    </span>
                  ) : null}
                </span>
                <span className={`shrink-0 font-extrabold text-ink-strong tabular-nums ${big ? 'text-[22px]' : 'text-[15px]'}`}>
                  {row.votes}
                  <span className={`font-semibold text-ink-muted ${big ? 'text-[14px]' : 'text-[11px]'}`}>표</span>
                </span>
              </div>
              <div className={`relative rounded-full bg-gray-100 dark:bg-white/[0.08] ${big ? 'mt-2 h-3' : 'mt-1.5 h-2'}`}>
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${tone}`}
                  style={{ width: `${percent}%` }}
                />
                {linePercent !== null ? (
                  <span
                    className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full bg-amber-500"
                    style={{ left: `${linePercent}%` }}
                    aria-hidden
                  />
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
      {/* 기준선 이름표 — 막대와 같은 좌표계(아바타 폭만큼 들여쓰기)에 놓아 선 바로 아래에 붙는다.
          선에 설명이 없으면 막대 위의 정체 모를 눈금처럼 보인다 */}
      {linePercent !== null ? (
        <div className="flex items-start gap-3" aria-hidden>
          <span className="shrink-0" style={{ width: avatar }} />
          <div className={`relative flex-1 ${big ? 'h-8' : 'h-6'}`}>
            <span
              className={`absolute top-0 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25 font-bold tabular-nums ${
                big ? 'px-3 py-1 text-[14px]' : 'px-2 py-0.5 text-[11px]'
              }`}
              style={
                // 끝에 붙은 기준선(예: 9/10)에서도 이름표가 밖으로 넘치지 않게 정렬을 바꾼다
                linePercent > 85
                  ? { right: `${100 - linePercent}%` }
                  : linePercent < 15
                    ? { left: `${linePercent}%` }
                    : { left: `${linePercent}%`, transform: 'translateX(-50%)' }
              }
            >
              ▲ 당선 기준 {result.required}표
            </span>
          </div>
        </div>
      ) : null}
      <p className={`text-ink-muted ${big ? 'text-[15px]' : 'text-[11.5px]'}`}>
        {result.base > 0
          ? `주황색 선을 넘으면 당선 기준 통과예요${result.is_final ? '' : ' — 투표가 들어오면 기준선도 함께 움직여요'}`
          : '아직 표가 없어요 — 첫 표가 들어오면 당선 기준선이 나타나요'}
      </p>
    </div>
  )
}
