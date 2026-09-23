// 목회자 영역 공용 컴포넌트 — 아바타 · slide-up 모달 · 버튼 (훅·날짜 헬퍼는 ./pastorUtils)
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { pastorScaleProps, usePastorTextScale } from './textScale'

export const Avatar = ({
  name,
  url,
  size = 'md',
}: {
  name: string
  url: string | null | undefined
  size?: 'sm' | 'md' | 'lg'
}) => {
  const cls =
    size === 'sm' ? 'w-7 h-7 text-[12px]' : size === 'lg' ? 'w-16 h-16 text-[22px]' : 'w-9 h-9 text-[13px]'
  return url ? (
    <img src={url} alt="" loading="lazy" className={`${cls} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`${cls} shrink-0 rounded-full bg-brand text-white font-bold flex items-center justify-center`}>
      {(name || '?').slice(0, 1)}
    </span>
  )
}

export const FieldLabel = ({ children, hint }: { children: ReactNode; hint?: string }) => (
  <span className="flex items-baseline justify-between gap-2 mb-1.5">
    <span className="text-[12.5px] font-bold text-ink-strong">{children}</span>
    {hint && <span className="text-[12px] text-gray-500 dark:text-white/50">{hint}</span>}
  </span>
)

/** 어드민 컴포저와 같은 slide-up 모달 껍데기 (모바일: 아래에서 / sm+: 가운데)
 *
 * body 로 포털한다 — 카드(SectionCard)가 relative + z-10 으로 쌓임 맥락을 만들어서,
 * 카드 안에서 연 모달은 fixed 여도 그 층에 갇히고 뒤따르는 카드가 모달 위로 비쳐 보였다.
 */
export const PastorModal = ({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer: ReactNode
}) => {
  useModalBackButton(onClose)
  // body 로 포털하면 셸의 zoom 밖이라 모달만 작아진다 — 같은 글씨 크기를 따로 건다
  const scale = usePastorTextScale()
  return createPortal(
    <div
      {...pastorScaleProps(scale)}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[calc(90vh/var(--pz,1))] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow)] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-brand text-[12px] font-bold tracking-[0.12em]">PASTOR</p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
            aria-label="닫기"
          >
            <span className="material-icons-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">{children}</div>
        <div className="relative z-10 px-5 py-3.5 border-t border-black/[0.04] dark:border-white/[0.06] flex gap-2">
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export const PrimaryButton = ({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="flex-1 py-3 rounded-xl bg-brand text-white text-[14px] font-bold disabled:opacity-40 transition-opacity"
  >
    {children}
  </button>
)

export const GhostButton = ({ children, onClick, danger }: { children: ReactNode; onClick: () => void; danger?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-3 rounded-xl border text-[14px] font-semibold transition-colors ${
      danger
        ? 'border-red-200 dark:border-red-400/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
        : 'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand hover:text-brand'
    }`}
  >
    {children}
  </button>
)
