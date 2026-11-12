// 결과 받기 — 결과서 인쇄와 결과 파일(CSV)을 한 곳에서 고른다.
//
// 예전에는 '결과서'(상단) · '결과 CSV'(아래 도구) · '전체 결과서' · '전체 CSV'(공동의회 탭 줄)가
// 화면 세 군데에 흩어져 있었다. 버튼 하나로 모으고, 무엇을 받는지 글로 풀어 적는다.
interface Item {
  key: string
  label: string
  hint: string
  onPick: () => void
}

interface Props {
  /** 지금 보고 있는 선거 */
  electionTitle: string
  /** 이 선거에 회차가 하나라도 있으면 */
  canThis: boolean
  onPrintThis: () => void
  onCsvThis: () => void
  /** 공동의회 소속이고 시작한 선거가 있으면 — 그 이름 */
  groupTitle?: string | null
  onPrintAll?: () => void
  onCsvAll?: () => void
  onClose: () => void
}

const Row = ({ item }: { item: Item }) => (
  <button
    type="button"
    onClick={item.onPick}
    className="w-full rounded-xl border border-gray-200 dark:border-white/[0.1] px-3.5 py-3 text-left transition-colors hover:border-brand"
  >
    <span className="block text-[15px] font-bold text-ink-strong">{item.label}</span>
    <span className="block mt-0.5 text-[12.5px] text-ink-muted break-keep">{item.hint}</span>
  </button>
)

export const ResultExportSheet = ({ electionTitle, canThis, onPrintThis, onCsvThis, groupTitle, onPrintAll, onCsvAll, onClose }: Props) => {
  const pick = (fn?: () => void) => () => {
    onClose()
    fn?.()
  }
  const mine: Item[] = canThis
    ? [
        { key: 'print', label: '결과서 인쇄', hint: '회의록에 붙이는 한 장이에요. 인쇄 창이 열려요.', onPick: pick(onPrintThis) },
        { key: 'csv', label: '결과 파일 받기 (엑셀용)', hint: '회차별 득표를 엑셀에서 열 수 있는 파일로 받아요.', onPick: pick(onCsvThis) },
      ]
    : []
  const all: Item[] = groupTitle
    ? [
        { key: 'print-all', label: '전체 결과서 인쇄', hint: '선거마다 한 장씩 이어서 인쇄해요.', onPick: pick(onPrintAll) },
        { key: 'csv-all', label: '전체 결과 파일 받기 (엑셀용)', hint: '모든 선거의 결과를 파일 하나로 받아요.', onPick: pick(onCsvAll) },
      ]
    : []

  return (
    <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label="결과 받기"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background-light dark:bg-[#1c1c26] border border-black/[0.04] dark:border-white/[0.08] px-5 py-5 space-y-4"
      >
        <h3 className="text-[18px] font-extrabold text-ink-strong tracking-[-0.02em]">결과 받기</h3>
        {mine.length ? (
          <div className="space-y-2">
            <p className="text-[12.5px] font-bold text-ink-muted break-keep">이 선거 — {electionTitle}</p>
            {mine.map((item) => (
              <Row key={item.key} item={item} />
            ))}
          </div>
        ) : null}
        {all.length ? (
          <div className="space-y-2">
            <p className="text-[12.5px] font-bold text-ink-muted break-keep">{groupTitle} 전체</p>
            {all.map((item) => (
              <Row key={item.key} item={item} />
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[14px] font-semibold text-ink"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
