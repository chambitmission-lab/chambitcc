// 공동 묵상방 공용 소품 — 아바타·얼굴 스택·바텀시트 프레임
// RoomHome / RoomList / 위저드 / 초대 시트가 같은 마크업을 공유한다.
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import type { RoomMember } from '../../types/meditationRoom'

const AVATAR_COLORS = ['#3182f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0ea5e9']

export const Avatar = ({
  name,
  avatarUrl,
  size,
  dim,
  className = '',
}: {
  name: string
  avatarUrl?: string | null
  size: number
  /** 아직 안 읽은 사람처럼 흐리게 */
  dim?: boolean
  className?: string
}) => {
  const dimCls = dim ? 'opacity-40 grayscale' : ''
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-card-dark ${dimCls} ${className}`}
      />
    )
  }
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
  return (
    <span
      style={{ width: size, height: size, backgroundColor: `${color}22`, color, fontSize: Math.max(10, size * 0.38) }}
      className={`shrink-0 rounded-full flex items-center justify-center font-extrabold ring-2 ring-white dark:ring-card-dark ${dimCls} ${className}`}
    >
      {name.slice(0, 1)}
    </span>
  )
}

/** 겹친 얼굴 스택 — 읽은 사람은 선명하게, 아직인 사람은 흐리게 */
export const FaceStack = ({
  members,
  size = 28,
  max = 6,
  dimIds,
}: {
  members: RoomMember[]
  size?: number
  max?: number
  /** 이 안에 있는 user_id 는 흐리게 */
  dimIds?: Set<number>
}) => {
  const shown = members.slice(0, max)
  const rest = members.length - shown.length
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((m) => (
          <span key={m.user_id} title={m.name} className="inline-block">
            <Avatar name={m.name} avatarUrl={m.avatar_url} size={size} dim={dimIds?.has(m.user_id)} />
          </span>
        ))}
      </div>
      {rest > 0 && (
        <span className="ml-1.5 text-[11px] font-bold text-gray-400 dark:text-white/45">+{rest}</span>
      )}
    </div>
  )
}

/**
 * 바텀시트 프레임 — 모바일은 아래에서, lg+ 는 가운데 카드로.
 * 뒤로가기는 시트만 닫는다.
 */
export const Sheet = ({
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
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`relative w-full ${wide ? 'lg:max-w-2xl' : 'max-w-md'} ${
          tall ? 'h-[94dvh] lg:h-auto lg:max-h-[88vh]' : 'max-h-[90dvh]'
        } flex flex-col rounded-t-[26px] lg:rounded-[26px] bg-white dark:bg-[#15151d] shadow-2xl overflow-hidden`}
      >
        <div className="shrink-0 w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mt-2.5 mb-1 lg:hidden" />
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

/** 구분선 + 작은 제목 */
export const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-[11.5px] font-bold tracking-[0.04em] text-gray-500 dark:text-white/50 mb-2">
    {children}
  </p>
)
