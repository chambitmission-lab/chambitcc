// 현황 시트 모음 — 확인 명단(교사) · 암송 현황 · 참석 현황(교사) · 투표 현황(교사) · 멤버 목록
import { useState } from 'react'
import {
  useAddClassMembers,
  useClassPollDetail,
  useClassPostChecks,
  useClassPostRecitations,
  useClassPostRsvps,
  useClassStars,
  useMyClassGrowth,
  useRemindClassPost,
  useSetMemberTeacher,
  useUpdateMyChildName,
} from '../../../hooks/useClassRoom'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useProfileDetail } from '../../../hooks/useProfile'
import type { ClassDetail, ClassPost, RemindTarget } from '../../../types/classRoom'
import type { CapsuleRecipient } from '../../../types/timeCapsule'
import { showToast } from '../../../utils/toast'
import { Avatar, memberLabel, timeAgo } from '../classUi'
import MemberSearchInput from '../../../components/common/MemberSearchInput'
import { confirmDialog } from '../../../utils/confirmDialog'

// ── 공용 시트 껍데기 ──
const SheetShell = ({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) => {
  useModalBackButton(onClose)
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/45" />
      <div
        className="relative w-full max-w-md overflow-y-auto rounded-t-[24px] bg-white dark:bg-[#15151d] p-5 pb-8 shadow-2xl"
        style={{ maxHeight: 'calc(var(--vvh, 100dvh) * 0.85)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-4" />
        <h3 className="text-[17px] font-bold text-ink-strong">{title}</h3>
        {subtitle && (
          <p className="text-[12px] text-gray-400 dark:text-white/45 mt-0.5">{subtitle}</p>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

const PersonRow = ({
  name,
  childName,
  right,
}: {
  name: string
  childName?: string | null
  right?: React.ReactNode
}) => (
  <div className="flex items-center gap-2.5 py-2">
    <Avatar name={name} size={30} />
    <span className="flex-1 min-w-0 text-[13.5px] font-semibold text-ink-strong truncate">
      {memberLabel(name, childName)}
    </span>
    {right}
  </div>
)

const EmptyLine = ({ text }: { text: string }) => (
  <p className="text-center text-[12.5px] text-gray-400 dark:text-white/40 py-6">{text}</p>
)

// ── 콕 찌르기 — 미응답자에게만 리마인더 푸시 (교사 전용) ──
const RemindButton = ({
  post,
  target,
  pendingCount,
}: {
  post: ClassPost
  target: RemindTarget
  pendingCount: number
}) => {
  const remind = useRemindClassPost(post.class_id)
  const [sentAt, setSentAt] = useState<string | null>(post.reminded_at ?? null)
  // 1시간 쿨다운 — 서버와 동일 기준으로 버튼 상태만 미리 계산
  const coolingDown =
    sentAt != null && Date.now() - new Date(sentAt).getTime() < 60 * 60 * 1000

  if (pendingCount === 0) return null

  const handleRemind = async () => {
    if (
      !(await confirmDialog({
        title: '콕 찔러 알리기',
        message: `아직 응답하지 않은 ${pendingCount}명에게만 알림을 보낼까요?`,
        description: '이미 응답한 분에게는 가지 않아요.',
        confirmText: '보내기',
        tone: 'brand',
        icon: 'campaign',
      }))
    )
      return
    try {
      const res = await remind.mutateAsync({ postId: post.id, target })
      setSentAt(res.reminded_at)
      showToast(`${res.sent}명에게 콕 찔러 알렸어요 👉`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '리마인더 발송에 실패했습니다', 'error')
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemind}
      disabled={remind.isPending || coolingDown}
      className="w-full mt-3 py-3 rounded-2xl bg-brand text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] active:scale-[0.98] transition-transform disabled:opacity-45 disabled:shadow-none"
    >
      {coolingDown
        ? '✓ 조금 전에 보냈어요 (1시간 후 재발송 가능)'
        : remind.isPending
          ? '보내는 중...'
          : `👉 ${pendingCount}명에게만 콕 찔러 알리기`}
    </button>
  )
}

// ── 확인 명단 (교사 전용) ──
export const CheckStatusSheet = ({
  post,
  onClose,
}: {
  post: ClassPost
  onClose: () => void
}) => {
  const { data, isLoading } = useClassPostChecks(post.class_id, post.id, true)
  return (
    <SheetShell
      title="확인 현황"
      subtitle={post.title || post.content.slice(0, 30)}
      onClose={onClose}
    >
      {isLoading || !data ? (
        <div className="h-32 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
      ) : (
        <>
          <p className="text-[12.5px] font-bold text-emerald-600 dark:text-emerald-300 mb-1">
            ✓ 확인했어요 ({data.checked.length}명)
          </p>
          {data.checked.length === 0 ? (
            <EmptyLine text="아직 확인한 분이 없어요" />
          ) : (
            data.checked.map((p) => (
              <PersonRow
                key={p.user_id}
                name={p.name}
                childName={p.child_name}
                right={
                  p.checked_at && (
                    <span className="shrink-0 text-[11px] text-gray-400 dark:text-white/40">
                      {timeAgo(p.checked_at)}
                    </span>
                  )
                }
              />
            ))
          )}
          <p className="text-[12.5px] font-bold text-gray-400 dark:text-white/45 mt-5 mb-1">
            아직 확인 전 ({data.unchecked.length}명)
          </p>
          {data.unchecked.length === 0 ? (
            <EmptyLine text="모두 확인했어요! 🎉" />
          ) : (
            <>
              {data.unchecked.map((p) => (
                <PersonRow key={p.user_id} name={p.name} childName={p.child_name} />
              ))}
              <RemindButton
                post={post}
                target="unchecked"
                pendingCount={data.unchecked.length}
              />
            </>
          )}
        </>
      )}
    </SheetShell>
  )
}

// ── 암송 현황 (모든 멤버 · 교사는 콕 찌르기 가능) ──
export const RecitationSheet = ({
  post,
  isTeacher = false,
  memberCount = 0,
  onClose,
}: {
  post: ClassPost
  isTeacher?: boolean
  memberCount?: number
  onClose: () => void
}) => {
  const { data, isLoading } = useClassPostRecitations(post.class_id, post.id, true)
  // 작성자(선생님)를 뺀 인원이 암송 대상
  const pending = Math.max(0, memberCount - 1 - (data?.length ?? 0))
  return (
    <SheetShell
      title="🌟 암송 완료"
      subtitle={post.verse?.reference ?? undefined}
      onClose={onClose}
    >
      {isLoading || !data ? (
        <div className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
      ) : data.length === 0 ? (
        <EmptyLine text="아직 암송을 완료한 친구가 없어요. 첫 별을 달아보세요! ⭐" />
      ) : (
        data.map((r) => (
          <PersonRow
            key={r.user_id}
            name={r.name}
            childName={r.child_name}
            right={
              <span className="shrink-0 text-[11px] text-gray-400 dark:text-white/40">
                {timeAgo(r.created_at)}
              </span>
            }
          />
        ))
      )}
      {isTeacher && !isLoading && (
        <RemindButton post={post} target="unrecited" pendingCount={pending} />
      )}
    </SheetShell>
  )
}

// ── 참석 현황 (교사 전용) ──
export const RsvpDetailSheet = ({
  post,
  onClose,
}: {
  post: ClassPost
  onClose: () => void
}) => {
  const { data, isLoading } = useClassPostRsvps(post.class_id, post.id, true)
  const groups = data
    ? ([
        ['✓ 참석', data.attending, 'text-brand'],
        ['? 부분참석', data.maybe, 'text-amber-600 dark:text-amber-300'],
        ['✗ 불참', data.not_attending, 'text-gray-500 dark:text-white/55'],
        ['응답 전', data.no_response, 'text-gray-400 dark:text-white/40'],
      ] as const)
    : []
  return (
    <SheetShell title="참석 현황" subtitle={post.title ?? undefined} onClose={onClose}>
      {isLoading || !data ? (
        <div className="h-32 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
      ) : (
        <>
          {groups.map(([label, people, cls]) => (
            <div key={label} className="mb-4">
              <p className={`text-[12.5px] font-bold mb-1 ${cls}`}>
                {label} ({people.length}명)
              </p>
              {people.length === 0 ? (
                <p className="text-[12px] text-gray-300 dark:text-white/25 py-1">없음</p>
              ) : (
                people.map((p) => (
                  <PersonRow key={p.user_id} name={p.name} childName={p.child_name} />
                ))
              )}
            </div>
          ))}
          <RemindButton
            post={post}
            target="no_rsvp"
            pendingCount={data.no_response.length}
          />
        </>
      )}
    </SheetShell>
  )
}

// ── 투표 현황 (교사 전용) ──
export const PollDetailSheet = ({
  post,
  onClose,
}: {
  post: ClassPost
  onClose: () => void
}) => {
  const { data, isLoading } = useClassPollDetail(post.class_id, post.id, true)
  return (
    <SheetShell
      title="🗳 투표 현황"
      subtitle={post.title || post.content.slice(0, 30)}
      onClose={onClose}
    >
      {isLoading || !data ? (
        <div className="h-32 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
      ) : (
        <>
          {data.options.map((opt) => (
            <div key={opt.option_id} className="mb-4">
              <p className="text-[12.5px] font-bold text-brand mb-1">
                {opt.text} ({opt.voters.length}명)
              </p>
              {opt.voters.length === 0 ? (
                <p className="text-[12px] text-gray-300 dark:text-white/25 py-1">없음</p>
              ) : (
                opt.voters.map((p) => (
                  <PersonRow key={p.user_id} name={p.name} childName={p.child_name} />
                ))
              )}
            </div>
          ))}
          <p className="text-[12.5px] font-bold text-gray-400 dark:text-white/45 mb-1">
            응답 전 ({data.no_response.length}명)
          </p>
          {data.no_response.length === 0 ? (
            <EmptyLine text="모두 투표했어요! 🎉" />
          ) : (
            data.no_response.map((p) => (
              <PersonRow key={p.user_id} name={p.name} childName={p.child_name} />
            ))
          )}
          <RemindButton
            post={post}
            target="no_vote"
            pendingCount={data.no_response.length}
          />
        </>
      )}
    </SheetShell>
  )
}

// ── 암송 별 랭킹 (반 멤버 공개) ──
const RANK_EMOJI = ['🥇', '🥈', '🥉']

export const StarsSheet = ({
  classId,
  onClose,
}: {
  classId: number
  onClose: () => void
}) => {
  const { data, isLoading } = useClassStars(classId, true)
  const starred = data?.filter((r) => r.star_count > 0) ?? []
  const rest = data?.filter((r) => r.star_count === 0) ?? []
  return (
    <SheetShell
      title="⭐ 우리 반 암송 별"
      subtitle="암송을 완료할 때마다 별이 하나씩 쌓여요"
      onClose={onClose}
    >
      {isLoading || !data ? (
        <div className="h-32 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
      ) : starred.length === 0 ? (
        <EmptyLine text="아직 별을 모은 친구가 없어요. 첫 별의 주인공이 되어보세요!" />
      ) : (
        <>
          {starred.map((r, i) => (
            <PersonRow
              key={r.user_id}
              name={r.name}
              childName={r.child_name}
              right={
                <span className="shrink-0 flex items-center gap-1.5">
                  {i < 3 && <span className="text-[15px]">{RANK_EMOJI[i]}</span>}
                  <span className="text-[13px] font-extrabold text-amber-600 dark:text-amber-300 tabular-nums">
                    ⭐ {r.star_count}
                  </span>
                </span>
              }
            />
          ))}
          {rest.length > 0 && (
            <p className="text-[11.5px] text-gray-400 dark:text-white/40 mt-3">
              아직 별이 없는 친구 {rest.length}명 — 함께 응원해주세요!
            </p>
          )}
        </>
      )}
    </SheetShell>
  )
}

// ── 성장 카드 (내/자녀 누적 기록) ──
export const GrowthSheet = ({
  classId,
  onClose,
}: {
  classId: number
  onClose: () => void
}) => {
  const { data, isLoading } = useMyClassGrowth(classId, true)
  return (
    <SheetShell
      title="🌱 성장 카드"
      subtitle={data ? `${data.class_name} · ${data.child_name || '나'}의 걸음` : undefined}
      onClose={onClose}
    >
      {isLoading || !data ? (
        <div className="h-40 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '암송 별', value: data.star_count, emoji: '⭐' },
              { label: '출석', value: data.attend_count, emoji: '📋' },
              { label: '공지 확인', value: data.check_count, emoji: '✅' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-3.5 bg-[var(--brand-soft)] text-center"
              >
                <span className="block text-[20px]">{s.emoji}</span>
                <span className="block text-[20px] font-extrabold text-ink-strong mt-0.5 tabular-nums">
                  {s.value}
                </span>
                <span className="block text-[11px] font-bold text-gray-500 dark:text-white/55 mt-0.5">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          {data.recent_verses.length > 0 && (
            <div className="mt-4">
              <p className="text-[12.5px] font-bold text-amber-600 dark:text-amber-300 mb-1.5">
                최근에 외운 말씀
              </p>
              {data.recent_verses.map((ref) => (
                <p
                  key={ref}
                  className="text-[13px] text-gray-700 dark:text-white/75 py-1 border-b border-gray-100 dark:border-white/[0.05] last:border-0"
                >
                  📖 {ref}
                </p>
              ))}
            </div>
          )}
          {data.joined_at && (
            <p className="text-center text-[11.5px] text-gray-400 dark:text-white/40 mt-4">
              {timeAgo(data.joined_at)}부터 함께하고 있어요
            </p>
          )}
        </>
      )}
    </SheetShell>
  )
}

// ── 멤버 목록 (+ 교사: 공동 교사 지정 / 본인: 자녀 이름 수정) ──
export const MembersSheet = ({
  cls,
  onClose,
}: {
  cls: ClassDetail
  onClose: () => void
}) => {
  const { data: profileDetail } = useProfileDetail()
  const myUserId = profileDetail?.stats.user_id
  const setTeacher = useSetMemberTeacher(cls.id)
  const updateChildName = useUpdateMyChildName(cls.id)
  const addMembers = useAddClassMembers()
  const [editingChild, setEditingChild] = useState(false)
  const me = cls.members.find((m) => m.user_id === myUserId)
  const [childDraft, setChildDraft] = useState(me?.child_name ?? '')

  const handleToggleTeacher = async (userId: number, isTeacher: boolean) => {
    if (
      !(await confirmDialog({
        title: isTeacher ? '공동 교사 지정' : '교사 역할 해제',
        message: isTeacher
          ? '이 멤버를 공동 교사로 지정할까요?'
          : '교사 역할을 해제할까요?',
        description: isTeacher
          ? '알림장 글을 쓸 수 있게 돼요.'
          : '더 이상 알림장 글을 쓸 수 없어요.',
        confirmText: isTeacher ? '지정' : '해제',
        tone: isTeacher ? 'brand' : 'warning',
        icon: 'manage_accounts',
      }))
    )
      return
    try {
      await setTeacher.mutateAsync({ userId, isTeacher })
      showToast('역할을 변경했어요', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '역할 변경에 실패했습니다', 'error')
    }
  }

  const handleSaveChild = async () => {
    try {
      await updateChildName.mutateAsync(childDraft.trim())
      showToast('자녀 이름을 저장했어요', 'success')
      setEditingChild(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '저장에 실패했습니다', 'error')
    }
  }

  const handleAddMember = async (u: CapsuleRecipient) => {
    try {
      await addMembers.mutateAsync({ classId: cls.id, userIds: [u.id] })
      showToast(`${u.display_name}님을 반에 추가했어요`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '멤버 추가에 실패했습니다', 'error')
    }
  }

  const teachers = cls.members.filter((m) => m.is_teacher)
  const parents = cls.members.filter((m) => !m.is_teacher)

  return (
    <SheetShell title="반 멤버" subtitle={`${cls.member_count}명 함께해요`} onClose={onClose}>
      {/* 멤버 바로 추가 — 교사 전용, 앱 사용자를 검색해 즉시 넣는다 */}
      {cls.is_teacher && (
        <div className="mb-5">
          <p className="text-[12.5px] font-bold text-gray-500 dark:text-white/55 mb-1.5">
            멤버 바로 추가
          </p>
          <MemberSearchInput
            excludeIds={cls.members.map((m) => m.user_id)}
            onPick={handleAddMember}
          />
          <p className="px-1 mt-1.5 text-[11px] text-gray-400 dark:text-white/35 leading-[1.6]">
            선택하면 바로 반에 들어오고 초대 알림이 가요. 앱이 없는 분은 초대 링크를 공유해주세요.
          </p>
        </div>
      )}
      {/* 내 자녀 이름 */}
      {me && !me.is_teacher && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[var(--brand-soft)]">
          {editingChild ? (
            <div className="flex items-center gap-2">
              <input
                value={childDraft}
                onChange={(e) => setChildDraft(e.target.value)}
                maxLength={50}
                placeholder="자녀 이름"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] text-[13px] focus:outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={handleSaveChild}
                disabled={updateChildName.isPending}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-brand text-white text-[12px] font-bold disabled:opacity-40"
              >
                저장
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingChild(true)}
              className="w-full flex items-center justify-between text-[13px]"
            >
              <span className="font-semibold text-gray-700 dark:text-white/75">
                👧 내 자녀: {me.child_name || '미입력'}
              </span>
              <span className="font-bold text-brand">수정</span>
            </button>
          )}
        </div>
      )}

      <p className="text-[12.5px] font-bold text-amber-600 dark:text-amber-300 mb-1">
        선생님 ({teachers.length}명)
      </p>
      {teachers.map((m) => (
        <PersonRow
          key={m.user_id}
          name={m.name}
          childName={m.child_name}
          right={
            cls.is_teacher && m.user_id !== myUserId ? (
              <button
                type="button"
                onClick={() => handleToggleTeacher(m.user_id, false)}
                className="shrink-0 text-[11.5px] font-bold text-gray-400 dark:text-white/40 hover:text-red-500"
              >
                교사 해제
              </button>
            ) : undefined
          }
        />
      ))}

      <p className="text-[12.5px] font-bold text-gray-500 dark:text-white/55 mt-5 mb-1">
        학부모·멤버 ({parents.length}명)
      </p>
      {parents.length === 0 ? (
        <EmptyLine text="아직 참여한 학부모님이 없어요. 초대 링크를 보내보세요!" />
      ) : (
        parents.map((m) => (
          <PersonRow
            key={m.user_id}
            name={m.name}
            childName={m.child_name}
            right={
              cls.is_teacher ? (
                <button
                  type="button"
                  onClick={() => handleToggleTeacher(m.user_id, true)}
                  className="shrink-0 text-[11.5px] font-bold text-brand hover:underline"
                >
                  교사 지정
                </button>
              ) : undefined
            }
          />
        ))
      )}
    </SheetShell>
  )
}
