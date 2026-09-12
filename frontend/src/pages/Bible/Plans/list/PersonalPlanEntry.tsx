// 나만의 플랜 만들기 진입 카드.

import type { PlanSummary } from '../../../../types/biblePlan'
import { KeyIcon, PlanGlyph } from '../PlanIcons'

// 나만의 플랜 진입 카드 — 만들기(또는 내 플랜으로 가기) + 초대 코드로 함께하기
const PersonalPlanEntry = ({
  ownedPlan,
  codeOpen,
  codeValue,
  onCreate,
  onToggleCode,
  onCodeChange,
  onSubmitCode,
}: {
  ownedPlan: PlanSummary | null
  codeOpen: boolean
  codeValue: string
  onCreate: () => void
  onToggleCode: () => void
  onCodeChange: (v: string) => void
  onSubmitCode: () => void
}) => (
  <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm overflow-hidden">
    <button
      type="button"
      onClick={onCreate}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--brand-soft)]"
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
        <span className="block text-[14px] font-bold text-ink-strong tracking-[-0.015em] truncate">
          {ownedPlan ? ownedPlan.title : '나만의 플랜 만들기'}
        </span>
        <span className="block text-[11.5px] text-gray-400 dark:text-white/45 mt-0.5 truncate">
          {ownedPlan
            ? `내가 만든 플랜 · ${(ownedPlan.participant_count ?? 1)}명이 함께 읽어요`
            : '읽을 범위와 기간을 정하고, 소그룹과 함께 읽어요'}
        </span>
      </span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-300 dark:text-white/30">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
    <div className="border-t border-gray-100 dark:border-white/[0.06] px-4 py-2">
      {codeOpen ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmitCode()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={codeValue}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
            placeholder="초대 코드 8자리"
            maxLength={8}
            autoFocus
            autoCapitalize="characters"
            className="flex-1 min-w-0 h-9 px-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] font-bold tracking-[0.12em] text-ink-strong placeholder:font-medium placeholder:tracking-normal placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="shrink-0 h-9 px-3.5 rounded-full bg-brand text-white text-[12px] font-bold"
          >
            함께하기
          </button>
          <button
            type="button"
            onClick={onToggleCode}
            aria-label="닫기"
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={onToggleCode}
          className="w-full flex items-center justify-between text-[12px] font-semibold text-gray-500 dark:text-white/55 hover:text-brand py-1"
        >
          <span className="inline-flex items-center gap-1.5">
            <KeyIcon size={15} />
            초대 코드로 함께하기
          </span>
          <span className="text-brand">입력</span>
        </button>
      )}
    </div>
  </div>
)

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { PersonalPlanEntry }
