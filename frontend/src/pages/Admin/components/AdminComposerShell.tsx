// 관리자 작성 모달의 공용 껍데기 — 오버레이·카드·장식·헤더·닫기·본문 스크롤·푸터 자리.
//
// 15개 작성 모달이 같은 200자 클래스 문자열을 각자 들고 있다가 폭·높이를 고칠 때마다
// 어긋나던 것을 한 곳으로 모은다. 규격은 두 가지뿐:
//   width  'md' 880px(짧은 폼) · 'lg' 1060px(2단 폼)
//   height PC에선 항상 calc(100dvh-4rem)·최대 860px — 2단 열별 스크롤이 이 높이를 기준으로 선다.
//          아주 짧은 폼(필드 3~4개)만 'auto' 로 내용 높이에 맞춘다.
// 모바일(<sm)은 아래에서 올라오는 시트(92vh)로 모든 모달이 같다.
//
// 본문은 두 가지 모드:
//   columns=[left, right]  PC 2단(열별 스크롤, 좌측 세로선) · 모바일은 위아래로 이어진 한 스크롤
//   children               한 열 스크롤
// 하위 폼이 <form> 을 직접 갖는 경우(교육·헌금처럼 모드별 하위 폼)는 bare 로 껍데기만 받고
// 안에서 AdminComposerBody 를 쓴다.
//
// 어드민 화면은 PC 글씨 배율(zoom) 대상이 아니라 vh 를 --az 로 나누지 않는다
// (utils/textScaleRoutes.ts). 어드민을 zoom 대상에 넣게 되면 여기 한 곳만 보정하면 된다.
import type { FormEvent, ReactNode } from 'react'

type Density = 'normal' | 'compact'

interface BodyProps {
  /** 'form' 이면 onSubmit 을 받는 <form> 으로 감싼다 */
  as?: 'form' | 'div'
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void
  /** PC 2단 — [좌, 우]. 없으면 children 한 열 */
  columns?: [ReactNode, ReactNode]
  /** 2단 비율 — Tailwind grid-cols 클래스. 기본 1:1 */
  gridCols?: string
  /** 여백·간격 — compact 는 py-4/space-y-4(설문 빌더처럼 빽빽한 폼) */
  density?: Density
  /** 푸터 — 자기 배경·테두리를 가진 완성된 블록(ComposerFooter 등) */
  footer?: ReactNode
  /**
   * 모바일에서 우측 열을 먼저(위에) 놓는다 — 미리보기처럼 입력보다 결과가 위에 있어야 하는 폼.
   * 우측 열이 비어 있으면(모바일에서 null 을 넘기면) 자리도 차지하지 않는다.
   */
  rightFirstOnMobile?: boolean
  children?: ReactNode
}

const PAD = {
  normal: {
    single: 'px-5 py-5 space-y-5 lg:px-7 lg:py-6',
    left: 'px-5 py-5 space-y-5 lg:px-7 lg:py-6',
    right: 'px-5 pb-5 space-y-5 lg:px-7 lg:py-6',
  },
  compact: {
    single: 'px-5 py-4 space-y-4 lg:px-7 lg:py-6',
    left: 'px-5 py-4 space-y-4 lg:px-7 lg:py-6',
    right: 'px-5 pb-4 space-y-4 lg:px-7 lg:py-6',
  },
} as const

const COLUMN = 'lg:min-h-0 lg:overflow-y-auto'
const COLUMN_DIVIDER = 'lg:border-r lg:border-black/[0.04] dark:lg:border-white/[0.06]'

/** 본문 + 푸터 — 모바일은 한 스크롤, PC 2단이면 열마다 따로 스크롤 */
export const AdminComposerBody = ({
  as = 'div',
  onSubmit,
  columns,
  gridCols = 'lg:grid-cols-2',
  density = 'normal',
  footer,
  rightFirstOnMobile = false,
  children,
}: BodyProps) => {
  const pad = PAD[density]
  const scroller = [
    'flex-1 min-h-0 overflow-y-auto overflow-x-hidden',
    columns ? `lg:overflow-hidden lg:grid ${gridCols}` : '',
    columns && rightFirstOnMobile ? 'flex flex-col' : '',
  ].join(' ')
  const rightPad = rightFirstOnMobile
    ? 'px-5 pt-5 space-y-5 lg:px-7 lg:py-6 order-first lg:order-none empty:hidden'
    : pad.right
  const inner = columns ? (
    <>
      <div className={`${pad.left} ${COLUMN} ${COLUMN_DIVIDER}`}>{columns[0]}</div>
      <div className={`${rightPad} ${COLUMN}`}>{columns[1]}</div>
    </>
  ) : (
    <div className={pad.single}>{children}</div>
  )
  const wrapperClass = 'relative z-10 flex-1 min-h-0 flex flex-col'

  if (as === 'form') {
    return (
      <form onSubmit={onSubmit} className={wrapperClass}>
        <div className={scroller}>{inner}</div>
        {footer}
      </form>
    )
  }
  return (
    <div className={wrapperClass}>
      <div className={scroller}>{inner}</div>
      {footer}
    </div>
  )
}

interface ShellProps extends BodyProps {
  title: ReactNode
  /** 헤더 위 작은 라벨. 기본 'ADMIN' */
  eyebrow?: ReactNode
  onClose: () => void
  /** 'md' 880px · 'lg' 1060px (PC) */
  width?: 'md' | 'lg'
  /** 태블릿(sm~lg) 폭 — 설문 빌더처럼 넓은 폼만 '2xl' */
  smWidth?: 'lg' | '2xl'
  /** PC 높이 — 'fill' calc(100dvh-4rem)·max 860px(기본) · 'auto' 내용 높이(아주 짧은 폼만) */
  height?: 'fill' | 'auto'
  /** 헤더 아래 고정 띠(단계 탭 등) — 스크롤되지 않는다 */
  subheader?: ReactNode
  /** 바깥 어두운 영역 클릭으로 닫기. 기본 true */
  closeOnBackdrop?: boolean
  /** 껍데기만 — children 이 본문·푸터 배치를 직접 맡는다(AdminComposerBody 사용) */
  bare?: boolean
}

const AdminComposerShell = ({
  title,
  eyebrow = 'ADMIN',
  onClose,
  width = 'lg',
  smWidth = 'lg',
  height = 'fill',
  subheader,
  closeOnBackdrop = true,
  bare = false,
  children,
  ...body
}: ShellProps) => {
  const card = [
    'relative w-full',
    smWidth === '2xl' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
    width === 'lg' ? 'lg:max-w-[1060px]' : 'lg:max-w-[880px]',
    'max-h-[92vh] sm:max-h-[90vh]',
    height === 'fill' ? 'lg:h-[calc(100dvh-4rem)]' : '',
    'lg:max-h-[860px]',
    'bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden',
    'border border-black/[0.04] dark:border-white/[0.08]',
    'shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow)]',
    'flex flex-col',
  ].join(' ')

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 lg:p-8 overflow-hidden"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div className={card} onClick={(e) => e.stopPropagation()}>
        {/* 카드 표면 장식 */}
        <div className="hidden dark:block absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-soft-strong)] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-[var(--brand-soft)] rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between px-5 lg:px-7 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">{eyebrow}</p>
            )}
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {subheader && (
          <div className="relative z-10 shrink-0 border-b border-black/[0.04] dark:border-white/[0.06]">
            {subheader}
          </div>
        )}

        {bare ? children : <AdminComposerBody {...body}>{children}</AdminComposerBody>}
      </div>
    </div>
  )
}

export default AdminComposerShell
