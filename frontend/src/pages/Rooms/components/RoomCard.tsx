import type { RoomDetail } from '../../../types/meditationRoom'
import { CheckIcon, FlameIcon, PartyIcon, RoomGlyph } from '../RoomIcons'
import { formatMd } from '../roomCourses'

// ── 방 카드 — 정체성·공동 스트릭·내 여정 ──
export const RoomCard = ({
  room,
  compact,
  showCompletion,
  onCompletion,
}: {
  room: RoomDetail
  compact?: boolean
  showCompletion: boolean
  onCompletion: () => void
}) => {
  const streak = room.group_streak ?? 0
  const todayRead = room.today_read_count ?? 0
  const statusLine =
    room.status === 'upcoming'
      ? `${formatMd(room.start_date)} 시작`
      : room.status === 'finished'
        ? '여정 마침'
        : `${room.current_day} / ${room.total_days}일차`
  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-blue-200/60 dark:border-white/[0.08] bg-gradient-to-br from-blue-50 to-sky-50 dark:from-[#172554]/60 dark:to-[#1e3a8a]/35 ${
        compact ? 'mx-4 mt-4 p-4' : 'p-5'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0 w-11 h-11 rounded-2xl bg-white/70 dark:bg-white/[0.08] text-brand flex items-center justify-center">
          <RoomGlyph emoji={room.emoji} size={23} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-bold tracking-[0.08em] text-blue-600 dark:text-blue-300">
            {statusLine} · {room.member_count}명
          </p>
          {!compact && (
            <h2 className="text-[18px] font-bold tracking-[-0.015em] leading-[1.3] text-ink-strong mt-0.5 break-keep">
              {room.title}
            </h2>
          )}
          {room.description && !compact && (
            <p className="text-[12px] text-gray-600 dark:text-white/60 mt-0.5">{room.description}</p>
          )}
          {compact && (
            <p className="text-[13px] font-semibold text-ink-strong mt-0.5 truncate">
              {room.status === 'active'
                ? todayRead > 0
                  ? `오늘 ${todayRead}명이 읽었어요`
                  : '오늘 아직 아무도 안 읽었어요. 첫 발자국을 남겨요'
                : room.status === 'upcoming'
                  ? '시작 전이에요. 친구를 초대해두세요'
                  : '수고했어요, 모두'}
            </p>
          )}
        </div>
        {streak > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-orange-500/[0.12] text-orange-600 dark:text-orange-300 text-[11.5px] font-bold">
            <FlameIcon size={13} /> 전원 {streak}일째
          </span>
        )}
      </div>

      {/* 내 여정 */}
      <div className="mt-3.5">
        {room.my_read_count >= room.total_days ? (
          <button
            type="button"
            onClick={onCompletion}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-500/[0.12] active:scale-[0.985] transition-transform"
          >
            <span className="inline-flex items-center gap-2 text-[12.5px] font-bold text-emerald-600 dark:text-emerald-300">
              <PartyIcon size={15} /> 내 몫 완주! {room.total_days}일치를 모두 읽었어요
            </span>
            <span className="text-[11.5px] font-bold text-emerald-700 dark:text-emerald-200 underline underline-offset-2">
              기념 카드
            </span>
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between text-[11.5px] font-semibold mb-1.5">
              <span className="text-gray-500 dark:text-white/55">내 여정</span>
              <span className="text-brand">
                <CheckIcon size={10} className="inline-block -mt-px mr-0.5 align-middle" />
                {room.my_read_count} / {room.total_days}일
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/70 dark:bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${Math.min(100, Math.round((room.my_read_count / Math.max(1, room.total_days)) * 100))}%` }}
              />
            </div>
          </>
        )}
        {showCompletion && room.status === 'finished' && room.my_read_count < room.total_days && (
          <button
            type="button"
            onClick={onCompletion}
            className="mt-2 text-[11.5px] font-bold text-brand underline underline-offset-2"
          >
            우리 방 완주 기념 카드 보기
          </button>
        )}
      </div>
    </section>
  )
}
