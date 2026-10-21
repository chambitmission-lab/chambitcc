// 공동 묵상방 공용 소품 — 아바타·얼굴 스택·바텀시트 프레임
// RoomHome / RoomList / 위저드 / 초대 시트가 같은 마크업을 공유한다.
// 바텀시트 프레임은 앱 공용(components/common/BottomSheet)으로 올라갔고, 여기서는 같은 이름으로 다시 내보낸다.
import type { ReactNode } from 'react'
import type { RoomMember } from '../../types/meditationRoom'

export { BottomSheet as Sheet, SheetBody, SheetFooter } from '../../components/common/BottomSheet'

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

/** 구분선 + 작은 제목 */
export const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-[11.5px] font-bold tracking-[0.04em] text-gray-500 dark:text-white/50 mb-2">
    {children}
  </p>
)
