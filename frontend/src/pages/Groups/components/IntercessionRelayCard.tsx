// 중보 릴레이 — 매주 멤버 한 명이 "이번 주 중보 대상"이 되어 자동 순환
// 서버 상태 없이 결정적으로 계산: 같은 주엔 모두에게 같은 사람이 보인다
// (가입순 정렬 → ISO 주차 % 인원수)
import { useMemo } from 'react'
import type { GroupMember } from '../../../types/prayer'

interface IntercessionRelayCardProps {
  members: GroupMember[]
  myUsername?: string | null
}

// KST 기준 주차 인덱스 — 연도 경계에서도 연속 증가하는 epoch 주 번호
// (1970-01-01이 목요일이라 +3일 보정하면 월요일 시작 주가 된다)
const kstWeekIndex = (): number => {
  const kstMs = Date.now() + 9 * 3600 * 1000
  const days = Math.floor(kstMs / 86400000)
  return Math.floor((days + 3) / 7)
}

const IntercessionRelayCard = ({ members, myUsername }: IntercessionRelayCardProps) => {
  const { current, next } = useMemo(() => {
    if (members.length < 2) return { current: null, next: null }
    const sorted = [...members].sort((a, b) => {
      const t = new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
      return t !== 0 ? t : a.user_id - b.user_id
    })
    const week = kstWeekIndex()
    return {
      current: sorted[week % sorted.length],
      next: sorted[(week + 1) % sorted.length],
    }
  }, [members])

  if (!current) return null

  const isMe = !!myUsername && current.username === myUsername

  return (
    <div className="mx-4 mb-3 relative overflow-hidden rounded-2xl p-4 bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />
      <p className="text-[11.5px] font-bold text-gray-500 dark:text-white/55 mb-2.5">
        🔁 이번 주 중보 릴레이
      </p>
      <div className="flex items-center gap-3">
        {current.avatar_url ? (
          <img
            src={current.avatar_url}
            alt=""
            className="shrink-0 w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-white/[0.1]"
          />
        ) : (
          <div className="shrink-0 w-11 h-11 rounded-full bg-[var(--brand-soft-strong)] flex items-center justify-center text-[16px] font-bold text-brand">
            {(current.display_name || '?').charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[14.5px] font-bold text-ink-strong truncate">
            {current.display_name}
            {isMe && <span className="ml-1.5 text-[11px] font-bold text-brand">(나예요!)</span>}
          </p>
          <p className="text-[12px] text-gray-500 dark:text-white/55 leading-[1.5]">
            {isMe
              ? '이번 주엔 멤버들이 나를 위해 기도해요'
              : '이번 주엔 이분을 위해 함께 기도해요'}
          </p>
        </div>
      </div>
      {next && next.user_id !== current.user_id && (
        <p className="text-[11px] text-gray-400 dark:text-white/40 mt-2.5 pl-14">
          다음 주는 {next.display_name}님 차례예요
        </p>
      )}
    </div>
  )
}

export default IntercessionRelayCard
