// 온라인 헌금 안내 등록/수정 — slide-up 컴포저 모달 (안내 문구 · 계좌 두 모드)
//
// 레거시가 HTML에 박아 두던 계좌번호와 안내 문구를 여기서 고친다.
// 한/영은 필드마다 접히는 영문 입력 — 영문은 선택이고 비우면 한국어로 폴백된다.
import { useState, type ReactNode } from 'react'
import { showToast } from '../../../utils/toast'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import {
  useCreateOfferingAccount,
  useUpdateOfferingAccount,
  useUpdateOfferingGuide,
} from '../../../hooks/useOffering'
import type {
  AccountTextField,
  GuideTextField,
  OfferingAccount,
  OfferingGuide,
} from '../../../types/offering'
import { plainAccountNumber } from '../../../types/offering'

type Bilingual = { ko: string; en: string }

const pair = (row: Record<string, unknown> | undefined, field: string): Bilingual => ({
  ko: (row?.[`${field}_ko`] as string | null | undefined) ?? '',
  en: (row?.[`${field}_en`] as string | null | undefined) ?? '',
})

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

export type OfferingComposerTarget =
  | { kind: 'guide'; guide: OfferingGuide }
  | { kind: 'account'; account?: OfferingAccount }

interface Props {
  target: OfferingComposerTarget
  onClose: () => void
  onSuccess: () => void
}

const OfferingComposer = ({ target, onClose, onSuccess }: Props) => {
  useModalBackButton(onClose)
  const title =
    target.kind === 'guide'
      ? '안내 문구 수정'
      : target.account
        ? '계좌 수정'
        : '계좌 추가'

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-soft-strong)] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">ADMIN</p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {target.kind === 'guide' ? (
          <GuideForm guide={target.guide} onClose={onClose} onSuccess={onSuccess} />
        ) : (
          <AccountForm account={target.account} onClose={onClose} onSuccess={onSuccess} />
        )}
      </div>
    </div>
  )
}

// ── 안내 문구 폼 ──────────────────────────────────────
const GuideForm = ({
  guide,
  onClose,
  onSuccess,
}: {
  guide: OfferingGuide
  onClose: () => void
  onSuccess: () => void
}) => {
  const updateMutation = useUpdateOfferingGuide()
  const row = guide as unknown as Record<string, unknown>
  const field = (f: GuideTextField) => pair(row, f)

  const [title, setTitle] = useState<Bilingual>(field('title'))
  const [intro, setIntro] = useState<Bilingual>(field('intro'))
  const [methodTitle, setMethodTitle] = useState<Bilingual>(field('method_title'))
  const [depositFormat, setDepositFormat] = useState<Bilingual>(field('deposit_format'))
  const [depositDesc, setDepositDesc] = useState<Bilingual>(field('deposit_desc'))
  const [note, setNote] = useState<Bilingual>(field('note'))
  const [verseText, setVerseText] = useState<Bilingual>(field('verse_text'))
  const [verseRef, setVerseRef] = useState<Bilingual>(field('verse_ref'))
  const [error, setError] = useState<string | null>(null)

  const submitting = updateMutation.isPending
  const canSubmit = title.ko.trim().length > 0 && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    try {
      await updateMutation.mutateAsync({
        title_ko: title.ko.trim(),
        title_en: title.en.trim(),
        intro_ko: intro.ko,
        intro_en: intro.en,
        method_title_ko: methodTitle.ko,
        method_title_en: methodTitle.en,
        deposit_format_ko: depositFormat.ko,
        deposit_format_en: depositFormat.en,
        deposit_desc_ko: depositDesc.ko,
        deposit_desc_en: depositDesc.en,
        note_ko: note.ko,
        note_en: note.en,
        verse_text_ko: verseText.ko,
        verse_text_en: verseText.en,
        verse_ref_ko: verseRef.ko,
        verse_ref_en: verseRef.en,
      })
      showToast('수정되었습니다', 'success')
      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장에 실패했습니다'
      setError(message)
      showToast(message, 'error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0">
      <div className="px-5 py-5 space-y-5 flex-1">
        <BilingualField label="제목" required value={title} onChange={setTitle} placeholder="온라인 헌금" />
        <BilingualField
          label="안내 문구"
          value={intro}
          onChange={setIntro}
          multiline
          rows={3}
          placeholder="교회에 오셔서 직접 헌금하실 수 없는 성도의 헌금과 편의를 위해…"
        />

        <div className="rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-gray-50/60 dark:bg-white/[0.02] p-4 space-y-4">
          <p className="text-[11px] font-bold tracking-[0.08em] text-gray-500 dark:text-white/45">
            헌금 방법
          </p>
          <BilingualField label="섹션 제목" value={methodTitle} onChange={setMethodTitle} placeholder="온라인 헌금방법" />
          <BilingualField
            label="입금자명 형식"
            value={depositFormat}
            onChange={setDepositFormat}
            placeholder="헌금자명 + 핸드폰 뒷번호 4자리"
            hint="파란 강조 칩으로 표시됩니다"
          />
          <BilingualField
            label="형식 설명"
            value={depositDesc}
            onChange={setDepositDesc}
            multiline
            rows={2}
            placeholder="위와 같이 입금자명을 적어 헌금해 주시기 바랍니다."
          />
          <BilingualField
            label="유의사항"
            value={note}
            onChange={setNote}
            multiline
            rows={3}
            placeholder="헌금을 계좌로 이체하실 경우 배우자 성함 포함 또는 핸드폰 뒷번호 4자리를 함께 기록해주십시오."
          />
        </div>

        <BilingualField label="말씀 구절" value={verseText} onChange={setVerseText} multiline rows={2} placeholder="섹션 끝에 놓일 성구 본문 (개역개정)" />
        <BilingualField label="말씀 출처" value={verseRef} onChange={setVerseRef} placeholder="고린도후서 9:7" />

        <p className="text-[11px] text-gray-400 dark:text-white/40 leading-[1.5]">
          비워둔 항목은 화면에서 그 줄이 통째로 숨겨집니다. 확인되지 않은 내용은 지어내지 않습니다.
        </p>

        {error && <p className="text-[12.5px] text-red-500">{error}</p>}
      </div>
      <Footer onClose={onClose} canSubmit={canSubmit} submitting={submitting} label="저장" />
    </form>
  )
}

// ── 계좌 폼 ───────────────────────────────────────────
const AccountForm = ({
  account,
  onClose,
  onSuccess,
}: {
  account?: OfferingAccount
  onClose: () => void
  onSuccess: () => void
}) => {
  const createMutation = useCreateOfferingAccount()
  const updateMutation = useUpdateOfferingAccount()
  const row = account as unknown as Record<string, unknown> | undefined
  const field = (f: AccountTextField) => pair(row, f)

  const [label, setLabel] = useState<Bilingual>(field('label'))
  const [bank, setBank] = useState<Bilingual>(field('bank'))
  const [number, setNumber] = useState(account?.account_number ?? '')
  const [holder, setHolder] = useState<Bilingual>(field('holder'))
  const [note, setNote] = useState<Bilingual>(field('note'))
  const [isActive, setIsActive] = useState(account?.is_active ?? true)
  const [error, setError] = useState<string | null>(null)

  const submitting = createMutation.isPending || updateMutation.isPending
  const digits = plainAccountNumber(number)
  const canSubmit =
    label.ko.trim().length > 0 && bank.ko.trim().length > 0 && digits.length > 0 && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    const payload = {
      label_ko: label.ko.trim(),
      label_en: label.en.trim(),
      bank_ko: bank.ko.trim(),
      bank_en: bank.en.trim(),
      account_number: number.trim(),
      holder_ko: holder.ko,
      holder_en: holder.en,
      note_ko: note.ko,
      note_en: note.en,
      is_active: isActive,
    }
    try {
      if (account) {
        await updateMutation.mutateAsync({ id: account.id, data: payload })
        showToast('수정되었습니다', 'success')
      } else {
        await createMutation.mutateAsync(payload)
        showToast('추가되었습니다', 'success')
      }
      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장에 실패했습니다'
      setError(message)
      showToast(message, 'error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0">
      <div className="px-5 py-5 space-y-5 flex-1">
        <BilingualField label="헌금 종류" required value={label} onChange={setLabel} placeholder="예: 주정헌금 · 십일조 · 건축" />
        <BilingualField label="은행" required value={bank} onChange={setBank} placeholder="농협" />

        <FieldGroup label="계좌번호" required>
          <input
            type="text"
            inputMode="numeric"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="301-0270-5923-91"
            className={`${inputCls} tabular-nums`}
          />
          <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1 leading-[1.5]">
            하이픈은 화면에 그대로 보이고, 복사 버튼은 숫자만
            {digits ? <span className="font-mono text-brand"> {digits}</span> : ' '}
            복사합니다.
          </p>
        </FieldGroup>

        <BilingualField label="예금주" value={holder} onChange={setHolder} placeholder="대한예수교장로회 참빛교회 (모르면 비워두세요)" />
        <BilingualField label="부연 설명" value={note} onChange={setNote} placeholder="예: 부활절 감사헌금 전용" hint="계좌 아래 한 줄로 표시됩니다" />

        <Toggle checked={isActive} onChange={setIsActive} label="공개" desc="끄면 목록에서 사라집니다 (데이터는 보존)" />

        {error && <p className="text-[12.5px] text-red-500">{error}</p>}
      </div>
      <Footer onClose={onClose} canSubmit={canSubmit} submitting={submitting} label={account ? '저장' : '추가'} />
    </form>
  )
}

// ── Helpers ───────────────────────────────────────────
const Footer = ({
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
  <div className="sticky bottom-0 px-5 py-3.5 border-t border-black/[0.04] dark:border-white/[0.06] bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm flex gap-2">
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

const Toggle = ({
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

const FieldGroup = ({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) => (
  <div>
    <div className="flex items-center gap-1 mb-2">
      <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">{label}</p>
      {required && <span className="text-brand text-[12px] font-bold">*</span>}
    </div>
    {children}
  </div>
)

const BilingualField = ({
  label,
  required,
  value,
  onChange,
  multiline,
  rows = 4,
  placeholder,
  hint,
}: {
  label: string
  required?: boolean
  value: Bilingual
  onChange: (next: Bilingual) => void
  multiline?: boolean
  rows?: number
  placeholder?: string
  hint?: string
}) => {
  const [showEn, setShowEn] = useState(value.en.trim().length > 0)
  const render = (lang: 'ko' | 'en') =>
    multiline ? (
      <textarea
        value={value[lang]}
        onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
        rows={rows}
        placeholder={lang === 'ko' ? placeholder : 'English (optional)'}
        className={`${inputCls} resize-none leading-[1.7]`}
      />
    ) : (
      <input
        type="text"
        value={value[lang]}
        onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
        placeholder={lang === 'ko' ? placeholder : 'English (optional)'}
        className={inputCls}
      />
    )
  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">{label}</p>
        {required && <span className="text-brand text-[12px] font-bold">*</span>}
        <button
          type="button"
          onClick={() => setShowEn((prev) => !prev)}
          className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
            showEn
              ? 'bg-[var(--brand-soft-strong)] text-brand'
              : 'text-gray-400 dark:text-white/35 hover:text-brand hover:bg-[var(--brand-soft)]'
          }`}
        >
          EN
        </button>
      </div>
      {render('ko')}
      {showEn && <div className="mt-1.5">{render('en')}</div>}
      {hint && <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1 leading-[1.5]">{hint}</p>}
    </div>
  )
}

export default OfferingComposer
