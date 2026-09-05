import { useEffect, useRef } from 'react'
import type { RoomDetail } from '../../../types/meditationRoom'
import { WEEKDAYS_KO, parseYmd } from '../roomCourses'

// ── 요일 스트립 — 날짜·요일·읽음 점 ──
export const DayStrip = ({ room, day, onPick }: { room: RoomDetail; day: number; onPick: (d: number) => void }) => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current?.querySelector(`[data-day="${day}"]`)
    el?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [day])
  return (
    <div
      ref={ref}
      className="flex gap-1.5 overflow-x-auto px-4 pt-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {room.days.map((d) => {
        const active = d.day_number === day
        const isToday = d.day_number === room.current_day
        const future = room.status === 'upcoming' || d.day_number > room.current_day
        const date = d.date ? parseYmd(String(d.date)) : null
        const fullRead = room.member_count > 0 && d.read_count >= room.member_count
        return (
          <button
            key={d.day_number}
            type="button"
            data-day={d.day_number}
            onClick={() => onPick(d.day_number)}
            className={`relative shrink-0 w-[52px] py-2 rounded-2xl flex flex-col items-center gap-0.5 transition-all ${
              active
                ? 'bg-brand text-white shadow-[0_6px_16px_-6px_var(--brand-glow)]'
                : future
                  ? 'bg-gray-50 dark:bg-white/[0.04] text-gray-400 dark:text-white/35'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/65'
            }`}
          >
            <span className="text-[10px] font-semibold opacity-80">
              {date ? WEEKDAYS_KO[date.getDay()] : ''}
            </span>
            <span className="text-[14px] font-extrabold tabular-nums leading-none">
              {date ? date.getDate() : d.day_number}
            </span>
            <span className="text-[9.5px] font-semibold opacity-70">{d.day_number}일차</span>
            {/* 점: 내 읽음 / 나눔 있음 / 전원 읽음 */}
            <span className="flex items-center gap-[3px] h-[6px] mt-0.5">
              {d.read_by_me && <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-emerald-500'}`} />}
              {d.post_count > 0 && <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white/70' : 'bg-brand'}`} />}
              {fullRead && <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-amber-200' : 'bg-orange-400'}`} />}
            </span>
            {isToday && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-background-light dark:ring-background-dark" />
            )}
          </button>
        )
      })}
    </div>
  )
}
