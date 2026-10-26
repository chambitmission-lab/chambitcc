// 나만의 플랜 진입 — 만들기(또는 내 플랜으로 가기) 카드 + 초대 코드 입력 카드.
// 초대 코드는 접어 두지 않고 늘 펴 둔다 — 친구에게 코드를 받은 사람이 '어디에 넣지?'를 찾지 않게.

import type { PlanSummary } from '../../../../types/biblePlan'
import { KeyIcon, PlanGlyph } from '../PlanIcons'

const PersonalPlanEntry = ({
  ownedPlan,
  codeValue,
  onCreate,
  onCodeChange,
  onSubmitCode,
}: {
  ownedPlan: PlanSummary | null
  codeValue: string
  onCreate: () => void
  onCodeChange: (v: string) => void
  onSubmitCode: () => void
}) => (
  <>
    <button
      type="button"
      onClick={onCreate}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[20px] bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.985]"
    >
      <span className="shrink-0 w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-[0_6px_16px_-6px_var(--brand-glow)]">
        {ownedPlan ? (
          <PlanGlyph emoji={ownedPlan.emoji} size={19} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] lg:text-[17px] font-extrabold text-ink-strong tracking-[-0.015em] truncate">
          {ownedPlan ? ownedPlan.title : '나만의 플랜 만들기'}
        </span>
        <span className="block text-[12px] lg:text-[13.5px] text-gray-400 dark:text-white/45 mt-0.5 truncate">
          {ownedPlan
            ? `내가 만든 플랜 · ${ownedPlan.participant_count ?? 1}명이 함께 읽어요`
            : '범위와 기간을 정해 소그룹과 함께 읽어요'}
        </span>
      </span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-300 dark:text-white/30">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>

    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmitCode()
      }}
      className="rounded-[20px] bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm px-4 py-3.5"
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-brand flex items-center justify-center">
          <KeyIcon size={20} />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] lg:text-[17px] font-extrabold text-ink-strong tracking-[-0.015em]">
            초대 코드로 함께
          </span>
          <span className="block text-[12px] lg:text-[13.5px] text-gray-400 dark:text-white/45 mt-0.5">
            친구가 보낸 코드를 넣어요
          </span>
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={codeValue}
          onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
          placeholder="초대 코드 8자리"
          maxLength={8}
          autoCapitalize="characters"
          aria-label="초대 코드"
          className="flex-1 min-w-0 h-11 px-3 rounded-xl border-[1.5px] border-dashed border-gray-300 dark:border-white/[0.14] bg-transparent text-center text-[15px] font-extrabold tracking-[0.28em] text-ink-strong placeholder:font-medium placeholder:tracking-normal placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-solid focus:border-brand focus:bg-[var(--brand-soft)]"
        />
        <button
          type="submit"
          className="shrink-0 h-11 px-4 rounded-xl bg-brand text-white text-[13.5px] font-bold transition-transform active:scale-95"
        >
          함께하기
        </button>
      </div>
    </form>
  </>
)

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { PersonalPlanEntry }
