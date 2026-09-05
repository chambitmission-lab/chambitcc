import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarkRoomDayRead, useNudgeDay, useRoomDay } from '../../../hooks/useMeditationRoom'
import type { RoomDetail } from '../../../types/meditationRoom'
import { showToast } from '../../../utils/toast'
import { FaceStack } from '../RoomBits'
import { CheckIcon, ExternalIcon, PokeIcon, SmallHeartIcon } from '../RoomIcons'
import { formatMd } from '../roomCourses'
import { PassageReader } from './PassageReader'

// ── 오늘 카드 — 본문 인라인 읽기 + 읽은 사람 + 콕 찌르기 ──
export const TodayCard = ({ room, day }: { room: RoomDetail; day: number }) => {
  const navigate = useNavigate()
  const dayInfo = room.days.find((d) => d.day_number === day)!
  const { data: detail } = useRoomDay(room.id, day)
  const markDayRead = useMarkRoomDayRead(room.id)
  const nudge = useNudgeDay(room.id, day)
  const [expanded, setExpanded] = useState(false)

  const readerIds = new Set(detail?.reader_ids ?? dayInfo.reader_ids ?? [])
  const readers = room.members.filter((m) => readerIds.has(m.user_id))
  const notYet = room.members.filter((m) => !readerIds.has(m.user_id))
  const isFuture = room.status === 'upcoming' || day > room.current_day
  const canNudge =
    !isFuture && dayInfo.read_by_me && (detail?.unread_count ?? notYet.length) > 0 && !(detail?.nudge_sent ?? false)

  const handleRead = () => {
    if (dayInfo.read_by_me) return
    markDayRead.mutate(day, {
      onSuccess: () => showToast(`${day}일차 읽었어요 ✓`, 'success'),
    })
  }

  const handleNudge = async () => {
    try {
      const res = await nudge.mutateAsync()
      showToast(res.sent_count > 0 ? `${res.sent_count}명을 콕 찔렀어요` : '모두 읽었어요!', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '콕 찌르기에 실패했습니다', 'error')
    }
  }

  const first = dayInfo.passages[0]

  return (
    <section className="mx-4 mt-3 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-400 dark:text-white/45">
              {day}일차{dayInfo.date ? ` · ${formatMd(String(dayInfo.date))}` : ''}
            </p>
            <h3 className="text-[17px] font-bold tracking-[-0.015em] text-ink-strong mt-0.5 break-keep">
              {dayInfo.title ?? '본문 없음'}
            </h3>
          </div>
          {dayInfo.read_by_me ? (
            <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300 text-[12px] font-bold">
              <CheckIcon size={10} /> 읽었어요
            </span>
          ) : (
            !expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="shrink-0 px-3.5 py-2 rounded-full bg-brand text-white text-[12px] font-bold shadow-[0_4px_14px_-4px_var(--brand-glow)] active:scale-95 transition-transform"
              >
                읽기
              </button>
            )
          )}
        </div>

        {/* 읽은 사람 얼굴 */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {room.members.length > 0 && (
              <FaceStack members={[...readers, ...notYet]} size={26} max={7} dimIds={new Set(notYet.map((m) => m.user_id))} />
            )}
            <span className="text-[12px] font-semibold text-gray-500 dark:text-white/55 truncate">
              {isFuture
                ? '아직 오지 않은 날'
                : readers.length === 0
                  ? '아직 아무도 안 읽었어요'
                  : `${readers.length}/${room.members.length}명 읽음`}
            </span>
          </div>
          {canNudge && (
            <button
              type="button"
              onClick={handleNudge}
              disabled={nudge.isPending}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-400/15 text-amber-700 dark:text-amber-300 text-[11.5px] font-bold active:scale-95 transition-transform disabled:opacity-50"
            >
              <PokeIcon size={13} /> 콕 찌르기
            </button>
          )}
          {!isFuture && dayInfo.read_by_me && detail?.nudge_sent && notYet.length > 0 && (
            <span className="shrink-0 text-[11px] text-gray-400 dark:text-white/40">콕 찔렀어요</span>
          )}
        </div>
      </div>

      {/* 본문 — 펼치면 방 안에서 바로 읽는다 */}
      {expanded || dayInfo.read_by_me ? (
        <div className="border-t border-gray-100 dark:border-white/[0.06]">
          {!expanded && dayInfo.read_by_me ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full px-4 py-3 text-left text-[12.5px] font-semibold text-brand"
            >
              본문 다시 펼치기
            </button>
          ) : (
            <PassageReader
              room={room}
              day={day}
              passages={dayInfo.passages}
              detail={detail}
              readByMe={dayInfo.read_by_me}
              onRead={handleRead}
              allowAutoRead={!isFuture}
              marking={markDayRead.isPending}
            />
          )}
        </div>
      ) : null}

      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (!first) return
            const verse = first.verse_start ? `?verse=${first.verse_start}` : ''
            navigate(`/bible/${first.book_number}/${first.chapter_start}${verse}`)
          }}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-gray-500 dark:text-white/50 hover:text-brand"
        >
          <ExternalIcon size={13} /> 성경 화면에서 읽기
        </button>
        {(detail?.verse_marks.length ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-rose-500">
            <SmallHeartIcon filled /> 머문 절 {detail!.verse_marks.length}
          </span>
        )}
      </div>
    </section>
  )
}
