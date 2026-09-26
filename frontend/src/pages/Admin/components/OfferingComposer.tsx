// 온라인 헌금 안내 등록/수정 — slide-up 컴포저 모달 (안내 문구 · 계좌 두 모드)
//
// 레거시가 HTML에 박아 두던 계좌번호와 안내 문구를 여기서 고친다.
// 한/영은 필드마다 접히는 영문 입력 — 영문은 선택이고 비우면 한국어로 폴백된다.
import { useState } from 'react'
import { showToast } from '../../../utils/toast'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { FieldGroup } from '../../../components/common/ComposerFields'
import AdminComposerShell, { AdminComposerBody } from './AdminComposerShell'
import { BlockFooter, Toggle, inputCls } from './AdminFormBits'
import BilingualField, { type Bilingual } from './BilingualField'
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

const pair = (row: Record<string, unknown> | undefined, field: string): Bilingual => ({
  ko: (row?.[`${field}_ko`] as string | null | undefined) ?? '',
  en: (row?.[`${field}_en`] as string | null | undefined) ?? '',
})

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
    <AdminComposerShell title={title} onClose={onClose} width="md" bare>
      {target.kind === 'guide' ? (
        <GuideForm guide={target.guide} onClose={onClose} onSuccess={onSuccess} />
      ) : (
        <AccountForm account={target.account} onClose={onClose} onSuccess={onSuccess} />
      )}
    </AdminComposerShell>
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
    <AdminComposerBody
      as="form"
      onSubmit={handleSubmit}
      footer={<BlockFooter onClose={onClose} canSubmit={canSubmit} submitting={submitting} label="저장" />}
    >
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
    </AdminComposerBody>
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
    <AdminComposerBody
      as="form"
      onSubmit={handleSubmit}
      footer={<BlockFooter onClose={onClose} canSubmit={canSubmit} submitting={submitting} label={account ? '저장' : '추가'} />}
    >
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
    </AdminComposerBody>
  )
}

export default OfferingComposer
