// 공동의회 이어서 투표 — 같은 날 여러 선거(장로·권사·안수집사)가 열려 있을 때, 선거 상세 위에
// "몇 개 중 몇 개를 마쳤는지"와 다음 투표로 가는 길을 보여 준다.
//
// 표는 선거마다 따로 제출된다(무기명 구조 그대로) — 중간에 나가도 낸 표는 유효하다.
// 보는 분이 어르신이라 저절로 넘기지 않는다. 상태는 색이 아니라 글자(투표함·보는 중·투표하기)로 쓴다.
import type { AssemblyProgress } from './electionShared'
import { cardCls } from './electionShared'

interface StepsProps {
  progress: AssemblyProgress
  currentId: number
  onOpen: (id: number) => void
}

export const AssemblySteps = ({ progress, currentId, onOpen }: StepsProps) => {
  const total = progress.ballots.length
  const done = total - progress.left.length
  return (
    <section className={`${cardCls} p-4 lg:p-6`} aria-label={`${progress.title} 투표 진행`}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-bold text-ink-strong break-keep lg:text-[18px]">{progress.title}</p>
        <p className="shrink-0 text-[12.5px] font-bold text-brand tabular-nums lg:text-[16px]">
          {done === total ? `투표 ${total}개 모두 마침` : `투표 ${total}개 중 ${done}개 마침`}
        </p>
      </div>
      <ol className="mt-3 grid gap-2 lg:mt-4 lg:gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(total, 3)}, minmax(0, 1fr))` }}>
        {progress.ballots.map((e, i) => {
          const current = e.id === currentId
          const state = e.has_voted ? '투표함' : current ? '보는 중' : '투표하기'
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onOpen(e.id)}
                disabled={current}
                aria-current={current ? 'step' : undefined}
                className={`w-full h-full text-left rounded-xl border px-3 py-2.5 transition-colors lg:rounded-2xl lg:px-4 lg:py-3.5 ${
                  current
                    ? 'border-brand bg-[var(--brand-soft)]'
                    : 'border-gray-200 dark:border-white/[0.1] hover:border-brand'
                }`}
              >
                <span className="block text-[11px] font-bold text-ink-muted tabular-nums lg:text-[13.5px]">
                  {i + 1}번째 · <span className={e.has_voted ? 'text-emerald-600 dark:text-emerald-300' : 'text-brand'}>{e.has_voted ? '✓ ' : ''}{state}</span>
                </span>
                <span className="mt-0.5 block text-[13.5px] font-bold text-ink-strong leading-snug break-keep lg:text-[17px]">
                  {e.title}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** 방금 마친 선거 아래 — 남은 투표로 가는 큰 버튼, 없으면 "모두 마쳤어요" */
export const AssemblyNext = ({ progress, onOpen }: { progress: AssemblyProgress; onOpen: (id: number) => void }) =>
  progress.next ? (
    <button
      type="button"
      onClick={() => onOpen(progress.next!.id)}
      className="w-full rounded-2xl bg-brand text-white px-5 py-4 text-left transition-[filter] hover:brightness-105 lg:px-7 lg:py-5"
    >
      <span className="block text-[12.5px] font-bold opacity-85 lg:text-[15px]">
        아직 투표가 {progress.left.length}개 남았어요
      </span>
      <span className="mt-0.5 block text-[17px] font-extrabold break-keep lg:text-[23px]">
        다음 투표 — {progress.next.title} →
      </span>
    </button>
  ) : (
    <p className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 px-5 py-4 text-center text-[14.5px] font-bold text-emerald-700 dark:text-emerald-300 break-keep lg:py-5 lg:text-[19px]">
      {progress.title} 투표 {progress.ballots.length}개를 모두 마쳤어요
    </p>
  )
