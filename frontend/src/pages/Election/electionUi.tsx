// 선거 화면 공통 UI — 성도 투표 화면·홈 배너·관리자 현황판이 같은 조각을 쓴다
import type { ElectionCandidate, ElectionRoundResult, ThresholdBasis } from '../../types/election'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { turnoutPercent } from './electionShared'

/** 투표함 — electionIcons.tsx 로 뗐다(홈 배너가 이 파일 전체를 끌지 않도록). 여기서 재수출 */
export { BallotIcon } from './electionIcons'

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
 * 기준은 선 하나에 맡기지 않는다 — 맨 위 요약 줄이 "몇 표면 통과인지"를 말하고,
 * 후보마다 "n표 더 필요 / 기준 통과"를 글로 붙인다(모바일에서 막대 끝 눈금은 읽히지 않는다).
 * 프로젝터에 띄우는 발표 화면은 이걸 쓰지 않고 자기 크기로 다시 그린다
 * (Admin/components/ElectionStage.tsx) — 식은 같으니 한쪽만 고치지 말 것.
 * large: 성도 상세 화면 PC(lg+)에서 글씨·막대를 키운다(관리자 현황판은 촘촘한 그대로).
 */
export const TallyBars = ({
  result,
  candidates,
  basis = 'ballots',
  large = false,
}: {
  result: ElectionRoundResult
  candidates: ElectionCandidate[]
  /** 기준의 분모 — 투표수면 표가 들어올수록 기준도 올라간다 */
  basis?: ThresholdBasis
  large?: boolean
}) => {
  const isLg = useMediaQuery('(min-width: 1024px)')
  const big = large && isLg
  const avatar = big ? 52 : 40
  const byId = new Map(candidates.map((c) => [c.id, c]))
  const base = Math.max(result.base, 1)
  const hasBase = result.base > 0
  const rawLine = hasBase ? Math.min(100, (result.required / base) * 100) : null
  // 기준이 막대 끝(=모든 표)이면 선은 트랙 끝 눈금일 뿐이라 그리지 않는다 — "꽉 차면 통과"로 충분
  const linePercent = rawLine !== null && rawLine < 97 ? rawLine : null
  const moving = basis === 'ballots' && !result.is_final
  const tagCls = `ml-1.5 align-middle font-bold ${big ? 'text-[14px]' : 'text-[11px]'}`

  return (
    <div className={big ? 'space-y-5' : 'space-y-3'}>
      {/* 기준 요약 — 선을 해석하게 두지 않고 숫자로 먼저 말한다 */}
      {hasBase ? (
        <div
          className={`flex items-center gap-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 dark:bg-amber-500/[0.07] dark:border-amber-500/20 ${
            big ? 'px-4 py-3' : 'px-3 py-2.5'
          }`}
        >
          {linePercent !== null ? (
            <span className={`shrink-0 w-1 rounded-full bg-amber-500 ${big ? 'h-7' : 'h-5'}`} aria-hidden />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className={`font-bold text-ink-strong ${big ? 'text-[17px]' : 'text-[13.5px]'}`}>
              <span className="text-amber-700 dark:text-amber-300 tabular-nums">{result.required}표</span> 이상 받으면
              당선 기준 통과
            </p>
            <p className={`mt-0.5 text-ink-muted tabular-nums ${big ? 'text-[14px]' : 'text-[11.5px]'}`}>
              {basis === 'voters' ? `재적 선거인 ${result.base}명 기준` : `지금까지 투표 ${result.base}표 기준`}
              {moving ? ' · 표가 늘면 기준도 함께 올라가요' : ''}
              {linePercent !== null ? ' · 주황 선이 기준선' : ''}
            </p>
          </div>
        </div>
      ) : null}

      {result.tallies.map((row) => {
        const cand = byId.get(row.candidate_id)
        if (!cand) return null
        const percent = Math.min(100, (row.votes / base) * 100)
        const short = hasBase && !row.passed ? Math.max(result.required - row.votes, 0) : 0
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
                    <span className={`${tagCls} text-brand`}>{result.is_final ? '당선' : '기준 통과'}</span>
                  ) : row.tied ? (
                    <span className={`${tagCls} text-amber-600 dark:text-amber-300`}>동률</span>
                  ) : row.passed ? (
                    <span className={`${tagCls} text-[color-mix(in_srgb,var(--brand)_70%,transparent)]`}>기준 통과</span>
                  ) : short > 0 ? (
                    <span className={`${tagCls} font-semibold text-ink-muted tabular-nums`}>{short}표 더 필요</span>
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
      {!hasBase ? (
        <p className={`text-ink-muted ${big ? 'text-[15px]' : 'text-[11.5px]'}`}>
          아직 표가 없어요 — 첫 표가 들어오면 몇 표면 통과인지 알려드려요
        </p>
      ) : null}
    </div>
  )
}
