// 나만의 플랜 — "함께 읽는 사람들" 섹션
// 개인 플랜의 핵심 가치: 혼자 결심한 플랜을 소그룹과 같이 읽는다.
// 각자 자기 속도(진행률·스트릭)를 보여주고, 소유자/참여자 모두 초대할 수 있다.
// 초대 시트: 앱 사용자는 검색해서 바로 추가(알림·푸시), 외부인은 링크 공유.
import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { PlanParticipant } from '../../../../types/biblePlan'
import type { CapsuleRecipient } from '../../../../types/timeCapsule'
import MemberSearchInput from '../../../../components/common/MemberSearchInput'
import { useAddPlanMembers } from '../../../../hooks/useBiblePlan'
import { showToast } from '../../../../utils/toast'
import { FlameIcon, PartyIcon, PeopleIcon as UsersIcon } from '../PlanIcons'

const numStyle: CSSProperties = { fontVariantNumeric: 'tabular-nums' }

const PlanParticipants = ({
  planId,
  participants,
  grad,
  inviteCode,
  onInvite,
}: {
  planId: number
  participants: PlanParticipant[]
  grad: string
  inviteCode?: string | null
  onInvite: () => void
}) => {
  const count = participants.length
  const [inviteOpen, setInviteOpen] = useState(false)
  const addMembers = useAddPlanMembers(planId)

  const handleInviteUser = async (user: CapsuleRecipient) => {
    try {
      const res = await addMembers.mutateAsync([user.id])
      if (res.added_count > 0) {
        showToast(`${user.display_name}님을 플랜에 초대했어요 📖`, 'success')
      } else {
        showToast(`${user.display_name}님은 이미 함께 읽고 있어요`, 'info')
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : '초대에 실패했습니다', 'error')
    }
  }

  return (
    <>
    <section className="mx-4 mt-3 rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-xl bg-[var(--brand-soft)] text-brand flex items-center justify-center">
          <UsersIcon size={15} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-ink-strong tracking-[-0.01em]">
            함께 읽는 사람들
            <span className="ml-1.5 text-[12px] font-semibold text-gray-400 dark:text-white/40" style={numStyle}>
              {count}명
            </span>
          </p>
          <p className="text-[11px] text-gray-400 dark:text-white/45 mt-0.5">
            각자 자기 속도로 읽어요 · 진행률 순
          </p>
        </div>
        {inviteCode && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="shrink-0 inline-flex items-center gap-1 px-3 h-8 rounded-full bg-brand text-white text-[12px] font-bold shadow-[0_4px_14px_-4px_var(--brand-glow)] active:scale-95 transition-transform"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            초대하기
          </button>
        )}
      </div>

      {count <= 1 ? (
        <div className="mt-3.5 rounded-xl bg-[var(--brand-soft)] px-3.5 py-3">
          <p className="text-[12.5px] font-semibold text-ink-strong">아직 혼자 읽고 있어요</p>
          <p className="text-[11.5px] leading-[1.6] text-gray-500 dark:text-white/55 mt-0.5">
            초대하기에서 이름을 검색해 바로 부르거나, 초대 링크를 단톡방에 올려보세요.
          </p>
        </div>
      ) : (
        <ul className="mt-3.5 space-y-2.5">
          {participants.map((p) => (
            <li key={p.user_id} className="flex items-center gap-2.5">
              <Avatar name={p.name} url={p.avatar_url} grad={grad} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-[13px] font-bold truncate ${p.is_me ? 'text-brand' : 'text-ink-strong'}`}>
                    {p.name}
                  </span>
                  {p.is_me && <Tag>나</Tag>}
                  {p.is_owner && <Tag>만든 이</Tag>}
                  {p.status === 'completed' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                      완주
                      <PartyIcon size={11} />
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-[12px] font-extrabold text-ink-strong" style={numStyle}>
                    {p.percent}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${grad} transition-[width] duration-500`}
                      style={{ width: `${Math.min(100, p.percent)}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[10.5px] font-semibold text-gray-400 dark:text-white/40" style={numStyle}>
                    {p.completed_days}일
                    {p.streak_count > 0 && (
                      <>
                        {' · '}
                        <FlameIcon size={10} className="inline-block -mt-px align-middle" />
                        {p.streak_count}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>

    {/* 초대 시트 — 앱 사용자는 검색해서 바로, 외부인은 링크로 */}
    {inviteOpen && (
      <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
        <div className="absolute inset-0 bg-black/45" onClick={() => setInviteOpen(false)} />
        <div className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-[24px] lg:rounded-[24px] bg-white dark:bg-[#15151d] p-5 pb-8 shadow-2xl">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-4 lg:hidden" />
          <h3 className="text-[17px] font-bold text-ink-strong">함께 읽을 사람 초대</h3>
          <p className="text-[12.5px] text-gray-500 dark:text-white/55 mt-1 mb-4 leading-[1.6]">
            이름을 검색해 고르면 바로 함께 읽게 되고, 그분에게 알림이 가요.
          </p>
          <MemberSearchInput
            excludeIds={participants.map((p) => p.user_id)}
            onPick={handleInviteUser}
            placeholder="이름을 검색해 바로 초대해요"
            emptyHint="앱에서 찾을 수 없어요. 아직 가입 전이라면 아래 초대 링크를 공유해주세요."
          />

          {inviteCode && (
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
              <div className="text-[12px] font-bold text-gray-500 dark:text-white/55 mb-2">
                앱 밖 사람에게는 링크로
              </div>
              <button
                type="button"
                onClick={onInvite}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[13.5px] font-bold text-ink-strong active:scale-[0.98] transition-transform"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                초대 링크 공유 · 코드 {inviteCode}
              </button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  )
}

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="shrink-0 px-1.5 py-[2px] rounded-full bg-[var(--brand-soft-strong)] text-brand text-[9.5px] font-bold leading-none">
    {children}
  </span>
)

const Avatar = ({ name, url, grad }: { name: string; url?: string | null; grad: string }) =>
  url ? (
    <img src={url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-black/[0.05] dark:ring-white/[0.1]" />
  ) : (
    <span className={`w-9 h-9 rounded-full shrink-0 bg-gradient-to-br ${grad} text-white text-[13px] font-bold flex items-center justify-center`}>
      {name.slice(0, 1)}
    </span>
  )

export default PlanParticipants
