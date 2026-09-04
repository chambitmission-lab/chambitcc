// 초대 시트 — 방을 만든 직후(fresh)와 방 안 "초대하기" 양쪽에서 쓴다.
// 순서: 초대 카드 미리보기 → 카톡/문자로 보내기(가장 큰 버튼) → 앱 친구 골라 한 번에 초대 → (접힘) 코드
import { useState } from 'react'
import MemberSearchInput from '../../components/common/MemberSearchInput'
import { useAddRoomMembers } from '../../hooks/useMeditationRoom'
import type { RoomDetail } from '../../types/meditationRoom'
import type { CapsuleRecipient } from '../../types/timeCapsule'
import { showToast } from '../../utils/toast'
import { Avatar, SectionLabel, Sheet, SheetBody, SheetFooter } from './RoomBits'
import { CheckIcon, RoomGlyph, SendIcon } from './RoomIcons'
import { formatMd } from './roomCourses'
import { shareInvite } from './inviteShare'

const InviteSheet = ({
  room,
  fresh,
  onClose,
}: {
  room: RoomDetail
  /** 방금 만든 방 — 제목·버튼 문구가 축하 톤이 된다 */
  fresh?: boolean
  onClose: () => void
}) => {
  const addMembers = useAddRoomMembers(room.id)
  const [picked, setPicked] = useState<CapsuleRecipient[]>([])
  const [codeOpen, setCodeOpen] = useState(false)

  const memberIds = room.members.map((m) => m.user_id)

  const handleInvitePicked = async () => {
    if (picked.length === 0) return
    try {
      const res = await addMembers.mutateAsync(picked.map((p) => p.id))
      showToast(
        res.added_count > 0
          ? `${res.added_count}명을 초대했어요. 알림이 갔어요 📖`
          : '이미 모두 함께하고 있어요',
        res.added_count > 0 ? 'success' : 'info',
      )
      setPicked([])
    } catch (e) {
      showToast(e instanceof Error ? e.message : '초대에 실패했습니다', 'error')
    }
  }

  const handleCopyCode = async () => {
    if (!room.invite_code) return
    try {
      await navigator.clipboard.writeText(room.invite_code)
      showToast('초대 코드를 복사했어요', 'success')
    } catch {
      showToast('복사에 실패했어요: ' + room.invite_code, 'error')
    }
  }

  return (
    <Sheet onClose={onClose} ariaLabel="초대하기">
      <SheetBody className="pt-3">
        <h3 className="text-[19px] font-bold tracking-[-0.02em] text-ink-strong">
          {fresh ? '방이 만들어졌어요!' : '함께할 사람 초대'}
        </h3>
        <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1 leading-[1.6]">
          {fresh
            ? '같이 읽을 사람을 초대하면 여정이 시작돼요. 나중에 방 안에서도 언제든 초대할 수 있어요.'
            : '멤버 누구나 초대할 수 있어요. 아직 앱이 없는 분은 링크로, 앱 친구는 이름으로.'}
        </p>

        {/* 초대 카드 미리보기 — 받는 사람이 보게 될 것 */}
        <div className="relative overflow-hidden rounded-[22px] p-5 mt-4 bg-brand text-white shadow-[0_14px_36px_-14px_var(--brand-glow)]">
          <span className="absolute -right-3 -bottom-6 opacity-[0.16] rotate-12 pointer-events-none">
            <RoomGlyph emoji={room.emoji} size={96} />
          </span>
          <div className="relative z-10">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.3em] text-white/70">
              Invitation
            </p>
            <h4 className="text-[19px] font-extrabold tracking-[-0.02em] leading-[1.3] mt-1.5 break-keep">
              {room.title}
            </h4>
            <p className="text-[12.5px] text-white/80 mt-2">
              {formatMd(room.start_date)}부터 {room.total_days}일
              {room.days[0]?.title ? ` · 첫 본문 ${room.days[0].title}` : ''}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex -space-x-1.5">
                {room.members.slice(0, 4).map((m) => (
                  <Avatar key={m.user_id} name={m.name} avatarUrl={m.avatar_url} size={22} className="!ring-brand" />
                ))}
              </div>
              <span className="text-[11.5px] text-white/75">
                {room.members.length === 1
                  ? `${room.members[0].name}님이 기다려요`
                  : `${room.members.length}명이 함께해요`}
              </span>
            </div>
          </div>
        </div>

        {/* 1순위: 링크 공유 */}
        <button
          type="button"
          onClick={() => shareInvite(room)}
          className="relative mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold seal-chip [--seal-radius:1rem] active:scale-[0.985] transition-transform"
        >
          <SendIcon size={17} />
          카톡·문자로 초대장 보내기
        </button>

        {/* 2순위: 앱 친구 골라서 한 번에 */}
        <div className="mt-6">
          <SectionLabel>앱 친구는 이름으로 바로</SectionLabel>
          <MemberSearchInput
            excludeIds={[...memberIds, ...picked.map((p) => p.id)]}
            onPick={(u) => setPicked((prev) => (prev.some((p) => p.id === u.id) ? prev : [...prev, u]))}
            placeholder="이름을 검색해 담아두세요"
            emptyHint="앱에서 찾을 수 없어요. 아직 가입 전이라면 위의 초대장을 보내주세요."
          />
          {picked.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {picked.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPicked((prev) => prev.filter((x) => x.id !== p.id))}
                  className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-brand text-[12.5px] font-bold"
                  title="빼기"
                >
                  <Avatar name={p.display_name} avatarUrl={p.avatar_url} size={20} />
                  {p.display_name}
                  <span className="text-[14px] leading-none opacity-60">×</span>
                </button>
              ))}
            </div>
          )}
          {picked.length > 0 && (
            <button
              type="button"
              onClick={handleInvitePicked}
              disabled={addMembers.isPending}
              className="mt-3 w-full py-3 rounded-2xl bg-[var(--brand-soft)] text-brand text-[14px] font-bold disabled:opacity-50 active:scale-[0.985] transition-transform"
            >
              {addMembers.isPending ? '초대하는 중...' : `${picked.length}명 초대하기`}
            </button>
          )}
        </div>

        {/* 이미 함께하는 사람 */}
        {room.members.length > 1 && (
          <div className="mt-6">
            <SectionLabel>함께하는 사람 {room.members.length}명</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {room.members.map((m) => (
                <span
                  key={m.user_id}
                  className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/[0.05] text-[12px] font-semibold text-gray-700 dark:text-white/75"
                >
                  <Avatar name={m.name} avatarUrl={m.avatar_url} size={20} />
                  {m.name}
                  {m.is_admin && <CheckIcon size={9} className="text-brand" />}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 접힘: 코드 */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setCodeOpen((v) => !v)}
            className="text-[12px] font-semibold text-gray-400 dark:text-white/40 underline underline-offset-2"
          >
            링크가 안 열리는 분이 있나요?
          </button>
          {codeOpen && (
            <div className="mt-2 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.07]">
              <p className="text-[12px] text-gray-500 dark:text-white/50 leading-[1.6]">
                앱을 열고 <b>공동 묵상방 → 초대 코드로 참여</b>에 이 코드를 입력하면 돼요.
              </p>
              <button
                type="button"
                onClick={handleCopyCode}
                className="mt-2 w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]"
              >
                <span className="text-[15px] font-extrabold tracking-[0.14em] text-ink-strong">
                  {room.invite_code}
                </span>
                <span className="text-[12px] font-bold text-brand">복사</span>
              </button>
            </div>
          )}
        </div>
      </SheetBody>
      <SheetFooter>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gray-100 dark:bg-white/[0.07] text-[14px] font-bold text-gray-700 dark:text-white/80"
        >
          {fresh ? '나중에 할게요 · 방으로 가기' : '닫기'}
        </button>
      </SheetFooter>
    </Sheet>
  )
}

export default InviteSheet
