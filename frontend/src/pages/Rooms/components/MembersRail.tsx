import type { RoomDetail } from '../../../types/meditationRoom'
import { Avatar } from '../RoomBits'

// lg 레일 — 멤버 목록 + 초대
export const MembersRail = ({ room, onInvite }: { room: RoomDetail; onInvite: () => void }) => (
  <section className="rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none">
    <div className="flex items-center justify-between mb-2.5">
      <p className="text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
        함께하는 사람 {room.members.length}명
      </p>
      <button type="button" onClick={onInvite} className="text-[11.5px] font-bold text-brand">
        + 초대
      </button>
    </div>
    <div className="flex flex-col gap-1.5">
      {room.members.slice(0, 12).map((m) => (
        <div key={m.user_id} className="flex items-center gap-2">
          <Avatar name={m.name} avatarUrl={m.avatar_url} size={24} />
          <span className="text-[12.5px] font-semibold text-ink-strong truncate">{m.name}</span>
          {m.is_admin && <span className="text-[10px] font-bold text-brand">방장</span>}
        </div>
      ))}
    </div>
  </section>
)
