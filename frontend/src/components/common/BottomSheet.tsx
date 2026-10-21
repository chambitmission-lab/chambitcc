// 앱 공용 바텀시트 — 모바일은 아래에서 올라오고, lg+ 는 가운데 카드로 뜬다.
// 묵상방(RoomBits)에서 쓰던 프레임을 그대로 올린 것. 뒤로가기는 시트만 닫는다(useModalBackButton).
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { useFeedTextScale } from '../../utils/feedTextScale'
import { SheetGrabber } from './SheetGrabber'
import './bottom-sheet.css'

/**
 * 바텀시트 프레임 — 모바일은 아래에서, lg+ 는 가운데 카드로.
 * 뒤로가기는 시트만 닫는다.
 */
export const BottomSheet = ({
  onClose,
  children,
  wide,
  tall,
  ariaLabel,
}: {
  onClose: () => void
  children: ReactNode
  /** lg+ 에서 넓게 (위저드) */
  wide?: boolean
  /** 화면 높이를 거의 다 쓴다 (위저드) */
  tall?: boolean
  ariaLabel?: string
}) => {
  useModalBackButton(onClose)
  // 시트는 body 포털이라 페이지 zoom 밖 — 헤더 '가' 배율은 패널 zoom 으로 따라간다(bottom-sheet.css)
  const textScale = useFeedTextScale()
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        data-scale={textScale}
        className={`bottom-sheet-panel relative w-full ${wide ? 'lg:max-w-2xl' : 'max-w-md'} ${
          tall ? 'h-[94dvh]' : 'max-h-[90dvh]'
        } flex flex-col rounded-t-[26px] lg:rounded-[26px] bg-white dark:bg-[#15151d] shadow-2xl overflow-hidden`}
      >
        <SheetGrabber onClose={onClose} className="shrink-0 w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mt-2.5 mb-1 lg:hidden" />
        {children}
      </div>
    </div>,
    document.body,
  )
}

/** 시트 안의 스크롤 본문 */
export const SheetBody = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`flex-1 min-h-0 overflow-y-auto px-5 pb-6 ${className}`}>{children}</div>
)

/** 시트 하단 고정 CTA 줄 */
export const SheetFooter = ({ children }: { children: ReactNode }) => (
  <div className="shrink-0 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#15151d]">
    {children}
  </div>
)
