// 참비 관제실 공용 조각 — 말풍선·참비 얼굴·켜기 스위치·키워드 칩.
import type { ReactNode } from 'react'
import { avatarDefault } from './chatbotTheme'

export const Avatar = ({ src = avatarDefault, size = 32 }: { src?: string; size?: number }) => (
  <img
    src={src}
    alt=""
    width={size}
    height={size}
    className="shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-white/10 shadow"
    style={{ width: size, height: size }}
  />
)

export const UserBubble = ({ children }: { children: ReactNode }) => (
  <div className="flex justify-end">
    <p className="m-0 max-w-[85%] rounded-2xl rounded-br-md bg-brand text-white px-3.5 py-2 text-[14.5px] leading-snug break-words">
      {children}
    </p>
  </div>
)

export const BotBubble = ({
  children,
  avatar,
  variant = 'plain',
}: {
  children: ReactNode
  avatar?: string
  variant?: 'plain' | 'warn' | 'muted'
}) => (
  <div className="flex items-end gap-2">
    <Avatar src={avatar} size={30} />
    <div
      className={`max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2 text-[14.5px] leading-snug whitespace-pre-line break-words ${
        variant === 'warn'
          ? 'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-400/10 dark:text-amber-100 dark:border-amber-400/25'
          : variant === 'muted'
            ? 'bg-gray-100 text-gray-500 dark:bg-white/[0.07] dark:text-white/60'
            : 'bg-white text-gray-800 border border-gray-200 dark:bg-white/[0.08] dark:text-white/90 dark:border-white/10'
      }`}
    >
      {children}
    </div>
  </div>
)

export const Switch = ({ on, onClick, label }: { on: boolean; onClick?: () => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={(e) => {
      e.stopPropagation()
      onClick?.()
    }}
    className={`inline-flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors ${
      on ? 'bg-brand dark:bg-[#5aa2ff]' : 'bg-gray-300 dark:bg-white/15'
    }`}
  >
    <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
  </button>
)

export const KeyChip = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold text-brand dark:text-[#8fc0ff] bg-[var(--brand-soft)] dark:bg-[#5aa2ff]/15">
    {children}
  </span>
)

export const StatusPill = ({ status }: { status: 'open' | 'weak' | 'resolved' }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
      status === 'weak'
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200'
        : status === 'open'
          ? 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200'
    }`}
  >
    {status === 'weak' ? '엉뚱하게 답했을지도' : status === 'open' ? '대답 못 함' : '해결됨'}
  </span>
)
