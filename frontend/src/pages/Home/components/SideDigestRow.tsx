// PC 사이드바 압축 모드에서 쓰는 한 줄 행.
//
// 데스크톱 사이드 컬럼은 뷰포트보다 길어지면 sticky 로 잡아 둘 수 없어서,
// 피드를 내려간 뒤 "오늘의 묵상"을 다시 보려면 컬럼 높이만큼 역스크롤해야 했다.
// 그래서 lg+ 에서는 아래쪽 보조 카드들을 이 행으로 접어 한 장의 그룹 리스트로 묶고,
// 컬럼 전체가 한 화면에 들어오게 한다(= useBottomStickyRail 이 단순 top-sticky 로 떨어진다).
//
// 모바일은 기존 풀 카드 그대로다 — 이 행은 데스크톱 전용 표현이다.
import type { ReactNode } from 'react'
import { ChevronRightIcon } from '../../../components/icons/ActionIcons'

interface Props {
  /** 32px 아이콘 타일 안에 들어갈 그림 */
  icon: ReactNode
  label: string
  /** 라벨 아래 한 줄 요약 — 넘치면 말줄임 */
  sub?: ReactNode
  /** 우측 강조값 (7명 · D-12 · 62%) */
  value?: ReactNode
  onClick: () => void
  /** 아이콘 타일 색 — 기본은 브랜드, gold 는 '올해의 말씀'처럼 금색 계열 */
  accent?: 'brand' | 'gold'
  /** 펼침형 행일 때 쉐브론을 아래 방향으로 돌린다 */
  expanded?: boolean
  ariaLabel?: string
}

const SideDigestRow = ({
  icon,
  label,
  sub,
  value,
  onClick,
  accent = 'brand',
  expanded,
  ariaLabel,
}: Props) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel ?? label}
    aria-expanded={expanded}
    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface-inset)] active:scale-[0.995] transition-[background-color,transform] duration-150"
  >
    <span
      className={`w-8 h-8 rounded-[10px] shrink-0 flex items-center justify-center ${
        accent === 'gold'
          ? 'bg-[rgba(217,165,20,0.14)] text-[#d9a514]'
          : 'bg-[var(--brand-soft)] text-brand'
      }`}
      aria-hidden
    >
      {icon}
    </span>

    <span className="min-w-0 flex-1">
      <span className="block text-[13.5px] font-bold text-ink-strong truncate">{label}</span>
      {sub && (
        <span className="block mt-0.5 text-[12px] text-[var(--text-muted)] truncate">{sub}</span>
      )}
    </span>

    {value && (
      <span className="shrink-0 text-[13px] font-bold text-brand tabular-nums">{value}</span>
    )}

    <ChevronRightIcon
      size={15}
      className={`shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
        expanded ? 'rotate-90' : ''
      }`}
    />
  </button>
)

export default SideDigestRow
