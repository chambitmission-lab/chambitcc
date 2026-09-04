// 방 설정 시트 — 아침 알림(관리자)·이름·표식·소개, 멤버 목록, 나가기
import { useState } from 'react'
import TimePicker from '../../components/common/TimePicker'
import { useUpdateRoom } from '../../hooks/useMeditationRoom'
import type { RoomDetail } from '../../types/meditationRoom'
import { showToast } from '../../utils/toast'
import { Avatar, SectionLabel, Sheet, SheetBody, SheetFooter } from './RoomBits'
import { BellIcon, CheckIcon, LogoutIcon, RoomGlyph } from './RoomIcons'
import { EMOJI_PRESETS } from './roomCourses'

const RoomSettingsSheet = ({
  room,
  onClose,
  onLeave,
}: {
  room: RoomDetail
  onClose: () => void
  onLeave: () => void
}) => {
  const update = useUpdateRoom(room.id)
  const [title, setTitle] = useState(room.title)
  const [emoji, setEmoji] = useState(room.emoji ?? '🕊️')
  const [description, setDescription] = useState(room.description ?? '')
  const [reminderOn, setReminderOn] = useState(!!room.reminder_time)
  const [reminderTime, setReminderTime] = useState(room.reminder_time ?? '07:00')

  const dirty =
    title.trim() !== room.title ||
    emoji !== (room.emoji ?? '🕊️') ||
    description.trim() !== (room.description ?? '') ||
    (reminderOn ? reminderTime : '') !== (room.reminder_time ?? '')

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        title: title.trim() || room.title,
        emoji,
        description: description.trim(),
        reminder_time: reminderOn ? reminderTime : '',
      })
      showToast('설정을 저장했어요', 'success')
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '저장에 실패했습니다', 'error')
    }
  }

  return (
    <Sheet onClose={onClose} ariaLabel="방 설정">
      <SheetBody className="pt-3">
        <h3 className="text-[19px] font-bold tracking-[-0.02em] text-ink-strong">방 설정</h3>

        {/* 아침 알림 */}
        <div className="mt-4 p-4 rounded-2xl bg-[var(--brand-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-white/70 dark:bg-white/[0.1] text-brand flex items-center justify-center shrink-0">
                <BellIcon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-ink-strong">아침 알림</p>
                <p className="text-[11.5px] text-gray-600 dark:text-white/60 leading-[1.5]">
                  정한 시각에 아직 안 읽은 사람에게만 오늘 본문을 알려줘요
                </p>
              </div>
            </div>
            {room.is_admin ? (
              <button
                type="button"
                role="switch"
                aria-checked={reminderOn}
                onClick={() => setReminderOn((v) => !v)}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                  reminderOn ? 'bg-brand' : 'bg-gray-300 dark:bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    reminderOn ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            ) : (
              <span className="text-[12.5px] font-bold text-brand shrink-0">
                {room.reminder_time ? room.reminder_time : '꺼짐'}
              </span>
            )}
          </div>
          {room.is_admin && reminderOn && (
            <div className="mt-3 flex items-center gap-2">
              <TimePicker value={reminderTime} onChange={setReminderTime} className="!rounded-xl" />
              <span className="text-[12px] text-gray-500 dark:text-white/50">매일 이 시각에</span>
            </div>
          )}
          {!room.is_admin && (
            <p className="text-[11.5px] text-gray-500 dark:text-white/45 mt-2">알림 시각은 방장이 정해요</p>
          )}
        </div>

        {room.is_admin && (
          <>
            <div className="mt-5">
              <SectionLabel>방 이름</SectionLabel>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[14px] font-semibold focus:outline-none focus:border-brand"
              />
              <div className="flex gap-2 mt-2.5">
                {EMOJI_PRESETS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      emoji === e
                        ? 'bg-[var(--brand-soft)] ring-2 ring-[var(--brand-soft-strong)] text-brand scale-105'
                        : 'bg-gray-50 dark:bg-white/[0.05] text-gray-500 dark:text-white/60'
                    }`}
                    aria-label={e}
                  >
                    <RoomGlyph emoji={e} size={18} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <SectionLabel>한 줄 소개 (선택)</SectionLabel>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                placeholder="예: 청년부 수요 모임 함께 읽기"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[14px] focus:outline-none focus:border-brand"
              />
            </div>
          </>
        )}

        {/* 멤버 */}
        <div className="mt-6">
          <SectionLabel>함께하는 사람 {room.members.length}명</SectionLabel>
          <div className="rounded-2xl border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
            {room.members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-2.5 px-3.5 py-2.5">
                <Avatar name={m.name} avatarUrl={m.avatar_url} size={28} />
                <span className="flex-1 min-w-0 text-[13.5px] font-semibold text-ink-strong truncate">{m.name}</span>
                {m.is_admin && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand">
                    <CheckIcon size={9} /> 방장
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onLeave}
          className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-400 dark:text-white/40 hover:text-red-500"
        >
          <LogoutIcon size={15} /> 이 방 나가기
        </button>
      </SheetBody>
      <SheetFooter>
        {room.is_admin ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || update.isPending}
            className="w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold disabled:opacity-40"
          >
            {update.isPending ? '저장하는 중...' : '저장'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-gray-100 dark:bg-white/[0.07] text-[14px] font-bold text-gray-700 dark:text-white/80"
          >
            닫기
          </button>
        )}
      </SheetFooter>
    </Sheet>
  )
}

export default RoomSettingsSheet
