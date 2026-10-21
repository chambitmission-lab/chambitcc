// 동행 초대 시트 — 새 짝 찾기, 또는 쉬어간 짝에게 '다시 함께 걷자'(같은 동행이 되살아나 기록이 이어진다)
import { useState } from 'react'
import MemberSearchInput from '../../components/common/MemberSearchInput'
import { useInviteCompanion } from '../../hooks/useCompanion'
import type { CompanionGoal, CompanionSummary } from '../../types/companion'
import type { CapsuleRecipient } from '../../types/timeCapsule'
import { showToast } from '../../utils/toast'
import { Avatar, Sheet } from './CompanionParts'
import GoalPicker from './GoalPicker'
import { GOAL_SPECS } from './companionGoals'

const errorText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback)

const InviteSheet = ({
  excludeIds = [],
  resume,
  onClose,
  onSent,
}: {
  excludeIds?: number[]
  /** 쉬어간 짝 — 사람은 고정, 목표는 예전 것으로 시작 */
  resume?: CompanionSummary
  onClose: () => void
  onSent?: () => void
}) => {
  const invite = useInviteCompanion()
  const [picked, setPicked] = useState<CapsuleRecipient | null>(
    resume
      ? { id: resume.partner.id, display_name: resume.partner.name, username: '', avatar_url: resume.partner.avatar_url }
      : null,
  )
  const [goal, setGoal] = useState<CompanionGoal>(
    resume
      ? { goal_type: resume.goal_type, goal_amount: resume.goal_amount }
      : { goal_type: 'reading', goal_amount: GOAL_SPECS.reading.defaultAmount },
  )

  const send = async () => {
    if (!picked) return
    try {
      await invite.mutateAsync({ userId: picked.id, goal })
      showToast(`${picked.display_name}님에게 초대를 보냈어요`, 'success')
      onClose()
      onSent?.()
    } catch (e) {
      showToast(errorText(e, '초대를 보내지 못했어요'), 'error')
    }
  }

  return (
    <Sheet onClose={onClose}>
      <h3 className="text-[17px] font-bold text-ink-strong">{resume ? '다시 함께 걷기' : '함께 걸을 사람'}</h3>
      <p className="text-[12.5px] text-gray-500 dark:text-white/55 mt-1 mb-4 leading-[1.6]">
        {resume
          ? `받으면 예전 길에 이어서 걸어요. 함께 걸은 ${resume.together_weeks}주와 등불 ${resume.lit_weeks}개가 그대로 이어져요.`
          : '우리 교회 성도만 초대할 수 있어요. 받은 분이 수락하면 이번 주부터 함께 채워요.'}
      </p>
      {picked ? (
        <div className="flex items-center gap-3 rounded-xl border border-brand/40 bg-[var(--brand-soft)] px-3.5 py-2.5">
          <Avatar name={picked.display_name} url={picked.avatar_url} tone="you" size={30} />
          <span className="flex-1 text-[14px] font-bold text-ink-strong">{picked.display_name}</span>
          {!resume && (
            <button type="button" onClick={() => setPicked(null)} className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
              바꾸기
            </button>
          )}
        </div>
      ) : (
        <MemberSearchInput
          excludeIds={excludeIds}
          onPick={setPicked}
          placeholder="이름을 검색해요"
          emptyHint="찾을 수 없어요. 우리 교회 앱에 가입한 성도만 초대할 수 있어요."
        />
      )}

      <div className="mt-6 text-[13px] font-bold text-ink-strong">{resume ? '이번엔 무엇을 함께 채울까요?' : '무엇을 함께 채울까요?'}</div>
      <div className="mt-2.5">
        <GoalPicker value={goal} onChange={setGoal} />
      </div>

      <button
        type="button"
        onClick={send}
        disabled={!picked || invite.isPending}
        className="mt-6 w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold disabled:opacity-40"
      >
        {picked ? `${picked.display_name}님에게 ${resume ? '다시 걷자고 하기' : '초대 보내기'}` : '함께할 사람을 골라주세요'}
      </button>
    </Sheet>
  )
}

export default InviteSheet
