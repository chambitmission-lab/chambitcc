// 관리자 작성 모달이 공통으로 쓰는 작은 조각 — 푸터 두 종·토글·입력 클래스.
// 라벨 그룹(FieldGroup)·빠른 선택 칩(QuickChip)·날짜 트리거는 components/common/ComposerFields 에 있다.
import type { ReactNode } from 'react'

/* 텍스트 입력 — 작성 모달 공통 결(14px). 그룹장 폼과 공유하는 textInputClass(14.5px 세미볼드)와는 다르다 */
export const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

const Spinner = () => (
  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

interface ComposerFooterProps {
  onClose: () => void
  canSubmit: boolean
  submitting: boolean
  /** 평소 제출 버튼 글자 — 예) '등록하기' · '수정 저장' */
  submitLabel: ReactNode
  /** 저장 중 글자. 기본 '저장 중...' */
  submittingLabel?: ReactNode
  /** 저장 중엔 취소도 막기 */
  cancelDisabled?: boolean
  /** 스피너·체크 아이콘 없이 글자만 */
  plain?: boolean
  /** 취소 왼쪽에 놓을 보조 조작 */
  leading?: ReactNode
}

/** 표준 푸터 — 취소(왼쪽) · 제출 알약(오른쪽). 배경·윗선을 포함한 완성 블록 */
export const ComposerFooter = ({
  onClose,
  canSubmit,
  submitting,
  submitLabel,
  submittingLabel = '저장 중...',
  cancelDisabled = false,
  plain = false,
  leading,
}: ComposerFooterProps) => (
  <div className="shrink-0 bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 lg:px-7 py-3 flex items-center gap-2">
    {leading}
    <button
      type="button"
      onClick={onClose}
      disabled={cancelDisabled && submitting}
      className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
    >
      취소
    </button>
    <button
      type="submit"
      disabled={!canSubmit}
      className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
    >
      {submitting ? (
        <>
          {!plain && <Spinner />}
          {submittingLabel}
        </>
      ) : (
        <>
          {!plain && <Check />}
          {submitLabel}
        </>
      )}
    </button>
  </div>
)

/** 가로로 꽉 채우는 푸터 — 취소 1 : 제출 2 (교육·헌금처럼 모드별 하위 폼) */
export const BlockFooter = ({
  onClose,
  canSubmit,
  submitting,
  label,
}: {
  onClose: () => void
  canSubmit: boolean
  submitting: boolean
  label: string
}) => (
  <div className="shrink-0 px-5 lg:px-7 py-3.5 border-t border-black/[0.04] dark:border-white/[0.06] bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm flex gap-2">
    <button
      type="button"
      onClick={onClose}
      className="flex-1 h-11 rounded-xl text-[13.5px] font-semibold text-gray-600 dark:text-white/65 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors"
    >
      취소
    </button>
    <button
      type="submit"
      disabled={!canSubmit}
      className="flex-[2] h-11 rounded-xl text-[13.5px] font-bold text-white bg-brand hover:bg-brand-dim disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
    >
      {submitting ? '저장 중…' : label}
    </button>
  </div>
)

/** 라벨·설명이 있는 카드형 토글 */
export const Toggle = ({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  desc: string
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] text-left"
    aria-pressed={checked}
  >
    <div>
      <p className="text-[13px] font-bold text-ink-strong">{label}</p>
      <p className="text-[11px] text-gray-400 dark:text-white/40 mt-0.5">{desc}</p>
    </div>
    <span
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        checked ? 'bg-gradient-to-r from-brand to-[var(--brand-light,#4593fc)]' : 'bg-gray-300 dark:bg-white/15'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </span>
  </button>
)
