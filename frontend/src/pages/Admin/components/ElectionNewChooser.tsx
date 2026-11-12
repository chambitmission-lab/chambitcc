// 새 선거 — 만들기의 첫 질문 하나. "한 날에 여러 직분을 뽑나요?"
//
// 관리자가 '선거'와 '공동의회 명부' 중 어디서 시작할지 고민하지 않게, 입구를 여기 하나로 모은다.
//  · 한 직분만 → 선거 하나(명부도 그 선거에서 고른다)
//  · 여러 직분 → 명부를 한 번 만들고, 이어서 직분마다 선거를 만든다(부모가 화면을 차례로 연다)
//  · 이미 만든 명부가 있으면 → 그 명부에 선거를 더한다
import { useElectionAssemblies } from '../../../hooks/useElections'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { CloseButton } from './SeatEventComposer'

interface Props {
  onClose: () => void
  onSingle: () => void
  onMulti: () => void
  onAssembly: (assemblyId: number) => void
}

const choiceCls =
  'w-full rounded-2xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-card-dark px-4 py-4 text-left transition-colors hover:border-brand'

const ElectionNewChooser = ({ onClose, onSingle, onMulti, onAssembly }: Props) => {
  useModalBackButton(onClose)
  const { data: assemblies } = useElectionAssemblies()

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      <div className="relative w-full sm:max-w-lg max-h-[94dvh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">새 선거</p>
            <h2 className="text-ink-strong text-[18px] font-bold tracking-[-0.015em]">한 날에 여러 직분을 뽑나요?</h2>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          <button type="button" onClick={onSingle} className={choiceCls}>
            <span className="block text-[16px] font-extrabold text-ink-strong">아니요, 한 직분만 뽑아요</span>
            <span className="block mt-1 text-[13px] text-ink-muted leading-relaxed break-keep">
              선거 하나를 만들어요. 후보와 선거인 명부를 한 화면에서 정해요.
            </span>
          </button>
          <button type="button" onClick={onMulti} className={choiceCls}>
            <span className="block text-[16px] font-extrabold text-ink-strong">네, 여러 직분을 뽑아요</span>
            <span className="block mt-1 text-[13px] text-ink-muted leading-relaxed break-keep">
              장로·권사·안수집사처럼요. 선거인 명부를 <b className="text-ink-strong">한 번만</b> 정하고, 이어서 직분마다 후보를 넣어요.
            </span>
          </button>

          {assemblies?.length ? (
            <div className="pt-2">
              <p className="text-[12.5px] font-bold text-ink-muted">이미 만든 명부에 선거 더하기</p>
              <div className="mt-1.5 space-y-1.5">
                {assemblies.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onAssembly(a.id)}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/[0.1] px-3.5 py-3 text-left transition-colors hover:border-brand"
                  >
                    <span className="block text-[14.5px] font-bold text-ink-strong break-keep">{a.title}</span>
                    <span className="block mt-0.5 text-[12.5px] text-ink-muted break-keep tabular-nums">
                      선거인 {a.voter_count + a.offline_voter_count}명
                      {a.elections.length ? ` · ${a.elections.map((e) => e.title).join(' · ')}` : ' · 아직 선거 없음'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ElectionNewChooser
