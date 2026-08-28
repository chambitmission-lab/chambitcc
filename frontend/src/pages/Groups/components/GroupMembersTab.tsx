// 그룹 멤버 탭 — 멤버 목록·초대(QR 포함)·가입 신청 처리·리더 케어 신호·권한 이양·내보내기·나가기
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { renderSVG } from 'uqr'
import {
  useGroupMembers,
  useKickMember,
  useTransferAdmin,
  useLeaveGroup,
  useAddGroupMembers,
  useJoinRequests,
  useDecideJoinRequest,
  useGroupCare,
} from '../../../hooks/useGroups'
import MemberSearchInput from '../../../components/common/MemberSearchInput'
import { showToast } from '../../../utils/toast'
import { groupInviteUrl } from '../../../utils/inviteLink'
import { getCurrentUser } from '../../../utils/auth'
import type { CapsuleRecipient } from '../../../types/timeCapsule'
import type { PrayerGroup, GroupMember } from '../../../types/prayer'
import { confirmDialog } from '../../../utils/confirmDialog'
import { TulipIcon } from '../GroupIcons'

interface GroupMembersTabProps {
  group: PrayerGroup
}

const MemberAvatar = ({ member }: { member: GroupMember }) =>
  member.avatar_url ? (
    <img
      src={member.avatar_url}
      alt=""
      className="shrink-0 w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/[0.1]"
    />
  ) : (
    <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--brand-soft-strong)] flex items-center justify-center text-[14px] font-bold text-brand">
      {(member.display_name || '?').charAt(0)}
    </div>
  )

const GroupMembersTab = ({ group }: GroupMembersTabProps) => {
  const navigate = useNavigate()
  const groupId = group.id
  const { data: membersData, isLoading, isError } = useGroupMembers(groupId, group.is_member)
  const members = membersData?.data.items ?? []

  const kick = useKickMember()
  const transfer = useTransferAdmin()
  const leave = useLeaveGroup()
  const addMembers = useAddGroupMembers()
  const decideRequest = useDecideJoinRequest()

  // 승인제 그룹의 가입 신청 (관리자만 조회)
  const { data: requestsData } = useJoinRequests(
    groupId,
    group.is_admin && group.visibility === 'approval',
  )
  const joinRequests = requestsData?.data.items ?? []

  // 리더 케어 신호 (관리자만)
  const { data: careData } = useGroupCare(groupId, group.is_admin)
  const careMembers = careData?.data.items ?? []

  const [invitedIds, setInvitedIds] = useState<number[]>([])
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const myUsername = getCurrentUser().username

  const inviteUrl = group.invite_code ? groupInviteUrl(group.invite_code) : null
  const qrSvg = useMemo(
    () => (inviteUrl && showQR ? renderSVG(inviteUrl, { ecc: 'M', border: 2 }) : null),
    [inviteUrl, showQR],
  )

  const handleCopy = async () => {
    if (!group.invite_code) return
    try {
      await navigator.clipboard.writeText(group.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      showToast('복사에 실패했어요. 코드를 직접 알려주세요: ' + group.invite_code, 'error')
    }
  }

  const handleShare = async () => {
    if (!group.invite_code || !inviteUrl) return
    const text = `🙏 '${group.name}' 기도방에 초대해요!\n함께 기도제목을 나누고, 응답이 쌓이는 걸 지켜봐요.\n\n${inviteUrl}\n\n앱을 설치했다면 [내 그룹 → 초대 코드로 참여]에 코드 ${group.invite_code} 를 입력해도 돼요.`
    if (navigator.share) {
      try {
        await navigator.share({ title: group.name, text, url: inviteUrl })
      } catch {
        /* 사용자가 취소 */
      }
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      showToast('초대 링크를 복사했어요. 카톡에 붙여넣어 보내주세요!', 'success')
    } catch {
      showToast('복사에 실패했어요. 초대 코드를 직접 알려주세요: ' + group.invite_code, 'error')
    }
  }

  const handleInviteUser = async (user: CapsuleRecipient) => {
    try {
      const res = await addMembers.mutateAsync({ groupId, userIds: [user.id] })
      setInvitedIds((prev) => [...prev, user.id])
      if (res.data.added_count > 0) {
        showToast(`${user.display_name}님을 기도방에 초대했어요 🙏`, 'success')
      } else {
        showToast(`${user.display_name}님은 이미 멤버예요`, 'info')
      }
    } catch {
      /* 토스트는 훅에서 처리 */
    }
  }

  const handleKick = async (member: GroupMember) => {
    if (
      !(await confirmDialog({
        title: '멤버 내보내기',
        message: `${member.display_name}님을 그룹에서 내보낼까요?`,
        description: '다시 들어오려면 초대 코드가 필요해요.',
        confirmText: '내보내기',
        icon: 'person_remove',
      }))
    )
      return
    kick.mutate({ groupId, userId: member.user_id })
  }

  const handleTransfer = async (member: GroupMember) => {
    if (
      !(await confirmDialog({
        title: '관리자 권한 이양',
        message: `${member.display_name}님에게 관리자 권한을 이양할까요?`,
        description:
          '이양하면 나는 일반 멤버가 되고, 초대 코드·멤버 관리는 새 관리자만 할 수 있어요.',
        confirmText: '이양',
        tone: 'warning',
        icon: 'admin_panel_settings',
      }))
    )
      return
    transfer.mutate({ groupId, newAdminUserId: member.user_id })
  }

  const handleLeave = async () => {
    if (group.is_admin) {
      showToast('먼저 다른 멤버에게 관리자 권한을 이양해주세요', 'info')
      return
    }
    if (
      !(await confirmDialog({
        title: '기도방 나가기',
        message: '이 기도방에서 나가시겠어요?',
        description: '다시 들어오려면 초대 코드가 필요해요.',
        confirmText: '나가기',
        icon: 'logout',
      }))
    )
      return
    try {
      await leave.mutateAsync(groupId)
      navigate('/groups')
    } catch {
      /* 토스트는 훅에서 처리 */
    }
  }

  if (!group.is_member) {
    return (
      <p className="px-4 py-10 text-[12.5px] text-gray-500 dark:text-white/50 text-center leading-[1.6]">
        멤버만 볼 수 있어요.
        <br />
        관리자에게 초대 링크나 초대 코드를 받아 참여해주세요.
      </p>
    )
  }

  return (
    <div className="px-4 pt-3 pb-6 space-y-3">
      {/* 가입 신청 (관리자 + 승인제 방) */}
      {group.is_admin && joinRequests.length > 0 && (
        <div className="rounded-2xl p-4 bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)]">
          <p className="text-[12px] font-bold text-brand mb-2.5">
            🙋 가입 신청 {joinRequests.length}건
          </p>
          <div className="space-y-2.5">
            {joinRequests.map((req) => (
              <div key={req.id} className="flex items-center gap-2.5">
                {req.avatar_url ? (
                  <img
                    src={req.avatar_url}
                    alt=""
                    className="shrink-0 w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-white/[0.1]"
                  />
                ) : (
                  <div className="shrink-0 w-9 h-9 rounded-full bg-white dark:bg-white/[0.08] flex items-center justify-center text-[13px] font-bold text-brand">
                    {(req.display_name || '?').charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-ink-strong truncate">
                    {req.display_name}
                  </p>
                  {req.message && (
                    <p className="text-[11.5px] text-gray-500 dark:text-white/55 truncate">
                      “{req.message}”
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={decideRequest.isPending}
                  onClick={() => decideRequest.mutate({ groupId, requestId: req.id, approve: true })}
                  className="shrink-0 px-3 h-8 rounded-full bg-brand text-white text-[11.5px] font-bold disabled:opacity-50"
                >
                  승인
                </button>
                <button
                  type="button"
                  disabled={decideRequest.isPending}
                  onClick={() => decideRequest.mutate({ groupId, requestId: req.id, approve: false })}
                  className="shrink-0 px-3 h-8 rounded-full bg-white dark:bg-white/[0.08] border border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/65 text-[11.5px] font-bold disabled:opacity-50"
                >
                  거절
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 리더 케어 신호 (관리자만 — 외부 비노출 목양 힌트) */}
      {group.is_admin && careMembers.length > 0 && (
        <div className="rounded-2xl p-4 bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
          <p className="text-[12px] font-bold text-gray-500 dark:text-white/55 mb-1 inline-flex items-center gap-1">
            <TulipIcon size={14} className="text-brand" /> 조용한 멤버 <span className="font-normal">(리더에게만 보여요)</span>
          </p>
          <p className="text-[11.5px] text-gray-400 dark:text-white/40 mb-2.5 leading-[1.5]">
            한동안 소식이 없는 멤버예요. 안부 연락 한 번 어떠세요?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {careMembers.map((m) => (
              <span
                key={m.user_id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-[11.5px] font-semibold text-gray-600 dark:text-white/65"
              >
                {m.display_name}
                <span className="text-gray-400 dark:text-white/35 font-normal">
                  {m.days_inactive != null ? `${m.days_inactive}일` : '기록 없음'}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 멤버 목록 */}
      <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] overflow-hidden">
        <p className="px-4 pt-3.5 pb-1 text-[12px] font-bold text-gray-500 dark:text-white/55">
          멤버 {members.length > 0 ? members.length : group.member_count}명
        </p>
        {isLoading ? (
          <div className="px-4 pb-4 space-y-2 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <p className="px-4 pb-4 pt-1 text-[12px] text-gray-500 dark:text-white/50 leading-[1.6]">
            멤버 목록을 불러오지 못했어요. 잠시 후 다시 열어주세요.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {members.map((m) => {
              const isMe = !!myUsername && m.username === myUsername
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <MemberAvatar member={m} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold text-ink-strong truncate">
                      {m.display_name}
                      {isMe && (
                        <span className="ml-1.5 text-[10.5px] font-bold text-gray-400 dark:text-white/40">나</span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-white/40">
                      {m.is_admin ? '관리자' : '멤버'}
                    </p>
                  </div>
                  {m.is_admin && (
                    <span className="shrink-0 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand tracking-[0.05em]">
                      ADMIN
                    </span>
                  )}
                  {group.is_admin && !isMe && !m.is_admin && (
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTransfer(m)}
                        disabled={transfer.isPending}
                        className="px-2.5 h-7 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[10.5px] font-bold text-gray-600 dark:text-white/65 hover:bg-[var(--brand-soft)] hover:text-brand transition-colors disabled:opacity-50"
                      >
                        관리자 이양
                      </button>
                      <button
                        type="button"
                        onClick={() => handleKick(m)}
                        disabled={kick.isPending}
                        className="px-2.5 h-7 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[10.5px] font-bold text-gray-500 dark:text-white/50 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        내보내기
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 초대 (관리자만) */}
      {group.is_admin && group.invite_code && (
        <div className="rounded-2xl p-4 bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] text-center">
          <div className="text-xs text-gray-500 dark:text-white/55 mb-1">초대 코드</div>
          <div className="text-2xl font-bold text-ink-strong tracking-widest font-mono mb-3 select-all">
            {group.invite_code}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 h-10 rounded-full bg-gray-100 dark:bg-white/[0.06] text-ink-strong text-[12.5px] font-bold hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
            >
              {copied ? '✓ 복사됨' : '코드 복사'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 h-10 rounded-full bg-brand text-white text-[12.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] transition-all"
            >
              🔗 링크 공유
            </button>
            <button
              type="button"
              onClick={() => setShowQR((v) => !v)}
              className={`flex-1 h-10 rounded-full text-[12.5px] font-bold transition-colors ${
                showQR
                  ? 'bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand'
                  : 'bg-gray-100 dark:bg-white/[0.06] text-ink-strong hover:bg-gray-200 dark:hover:bg-white/[0.1]'
              }`}
            >
              QR 초대
            </button>
          </div>

          {/* QR — 모임 자리에서 화면을 보여주면 그 자리에서 바로 가입 */}
          {qrSvg && (
            <div className="mt-3 flex flex-col items-center">
              <div
                className="w-44 h-44 p-2 rounded-2xl bg-white border border-gray-200 [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <p className="text-[11px] text-gray-400 dark:text-white/40 mt-2 leading-[1.5]">
                모임 자리에서 이 화면을 보여주세요.
                <br />
                카메라로 찍으면 바로 초대장이 열려요
              </p>
            </div>
          )}

          {/* 앱 사용자 바로 초대 */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06] text-left">
            <div className="text-xs font-bold text-gray-500 dark:text-white/55 mb-2">
              앱 사용자 바로 초대
            </div>
            <MemberSearchInput
              excludeIds={invitedIds}
              onPick={handleInviteUser}
              placeholder="이름을 검색해 바로 초대해요"
              emptyHint="앱에서 찾을 수 없어요. 아직 가입 전이라면 위 초대 링크를 공유해주세요."
            />
          </div>
        </div>
      )}

      {/* 나가기 */}
      <div className="text-center pt-1">
        {group.is_admin ? (
          <p className="text-[11.5px] text-gray-400 dark:text-white/40 leading-[1.6]">
            방을 나가려면 먼저 위에서 다른 멤버에게 관리자 권한을 이양해주세요
          </p>
        ) : (
          <button
            type="button"
            onClick={handleLeave}
            disabled={leave.isPending}
            className="text-[12px] text-gray-400 dark:text-white/40 underline underline-offset-2 hover:text-gray-600 dark:hover:text-white/60 transition-colors disabled:opacity-50"
          >
            기도방 나가기
          </button>
        )}
      </div>
    </div>
  )
}

export default GroupMembersTab
