import { useState } from 'react'
import { createPortal } from 'react-dom'
import DatePicker from '../../components/common/DatePicker'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { showToast } from '../../utils/toast'
import { writeToClipboard } from '../Bible/components/verseCopy'
import { createCultureApplication } from '../../api/culture'
import type { CultureClass, CultureApplication } from '../../types/culture'
import { getCultureAccent, withAlpha } from './cultureAccents'

// 수강료 입금 계좌 — 문의 섹션과 신청 완료 화면에서 함께 사용
export const BANK_ACCOUNT = {
  bank: '농협',
  number: '301-0254-9469-31',
  holder: '대한예수교장로회 참빛교회',
}

const inputClass =
  'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

const labelClass =
  'text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block'

/** 숫자만 남기고 010-1234-5678 형태로 하이픈 자동 삽입 */
const formatPhoneInput = (value: string): string => {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length < 4) return d
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`
  if (d.length < 11) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

/** 계좌번호 복사 버튼 — 어르신들이 손으로 옮겨 적지 않도록 */
export const AccountCopyRow = () => {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    // iOS 사파리는 제스처와 같은 태스크에서 클립보드를 써야 하므로 await 없이 호출
    writeToClipboard(`${BANK_ACCOUNT.bank} ${BANK_ACCOUNT.number}`).then((ok) => {
      if (ok) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        showToast('복사에 실패했습니다', 'error')
      }
    })
  }
  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]">
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-gray-800 dark:text-white/85">
          {BANK_ACCOUNT.bank} {BANK_ACCOUNT.number}
        </p>
        <p className="text-[11.5px] text-gray-400 dark:text-white/40 mt-0.5">
          {BANK_ACCOUNT.holder}
        </p>
      </div>
      <button
        onClick={copy}
        className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-[12px] font-bold rounded-lg border transition-colors ${
          copied
            ? 'border-emerald-200 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
            : 'border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] text-brand hover:opacity-80'
        }`}
      >
        <span className="material-icons-round text-[14px]">
          {copied ? 'check' : 'content_copy'}
        </span>
        {copied ? '복사됨' : '복사'}
      </button>
    </div>
  )
}

interface ApplySheetProps {
  cultureClass: CultureClass
  onClose: () => void
  onSubmitted: (application: CultureApplication) => void
}

/**
 * 강좌 카드에서 바로 올라오는 수강신청 바텀시트.
 * 선택한 강좌 요약을 상단에 고정해 "무엇을 신청하는지" 맥락을 잃지 않게 한다.
 * 제출 후에는 같은 시트 안에서 완료 화면(계좌 복사 포함)으로 전환.
 */
const ApplySheet = ({ cultureClass, onClose, onSubmitted }: ApplySheetProps) => {
  // 뒤로가기 → 시트만 닫기
  useModalBackButton(onClose)
  const accent = getCultureAccent(cultureClass.title)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    birth_date: '',
    gender: '',
    memo: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<CultureApplication | null>(null)

  const handleSubmit = async () => {
    if (!form.name.trim()) return showToast('이름을 입력해주세요', 'error')
    if (!form.birth_date.trim()) return showToast('생년월일을 선택해주세요', 'error')
    if (!form.phone.trim()) return showToast('전화번호를 입력해주세요', 'error')

    try {
      setSubmitting(true)
      const result = await createCultureApplication({
        class_id: cultureClass.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        birth_date: form.birth_date.trim(),
        gender: form.gender || undefined,
        memo: form.memo.trim() || undefined,
      })
      setSubmitted(result)
      onSubmitted(result)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '수강신청에 실패했습니다', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md max-h-[90vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 액센트 글로우 */}
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: withAlpha(accent.color, 0.16) }}
        />

        {/* 헤더 — 선택한 강좌 요약 고정 */}
        <div className="relative z-10 flex items-center gap-3 px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-[22px] shrink-0"
            style={{
              background: withAlpha(accent.color, 0.14),
              border: `1px solid ${withAlpha(accent.color, 0.22)}`,
            }}
          >
            {accent.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold tracking-[0.1em]" style={{ color: accent.color }}>
              수강신청
            </p>
            <h3 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em] truncate">
              {cultureClass.title}
            </h3>
            {cultureClass.schedule && (
              <p className="text-[11.5px] text-gray-400 dark:text-white/40 truncate mt-0.5">
                {cultureClass.schedule}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label="닫기"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        {/* 본문 */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5">
          {submitted ? (
            /* ── 신청 완료 ── */
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center animate-scale-in">
                <span className="material-icons-round text-[34px] text-emerald-500">check</span>
              </div>
              <h2 className="text-[17px] font-bold text-ink-strong mt-4">
                수강신청이 접수되었습니다
              </h2>
              <p className="text-[13.5px] text-gray-500 dark:text-white/55 mt-1.5 leading-relaxed">
                {submitted.name}님, {cultureClass.title}에서 만나요 {accent.emoji}
              </p>

              <div className="mt-5 text-left space-y-2.5">
                <p className="text-[12.5px] text-gray-600 dark:text-white/60 leading-relaxed">
                  아래 계좌로 수강료를 입금하시면 등록이 완료됩니다.
                  <br />
                  12회 일괄 또는 5회 분할 입금이 가능합니다.
                </p>
                <AccountCopyRow />
              </div>

              <button
                onClick={onClose}
                className="mt-5 w-full py-3 text-sm font-bold bg-brand hover:bg-brand-dim text-white rounded-xl transition-colors"
              >
                확인
              </button>
            </div>
          ) : (
            /* ── 신청 폼 ── */
            <div className="space-y-4">
              <div>
                <label className={labelClass}>이름 (수강생) *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="성함을 입력해주세요"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>생년월일 *</label>
                <DatePicker
                  value={form.birth_date}
                  onChange={(date) => setForm((f) => ({ ...f, birth_date: date }))}
                  placeholder="생년월일을 선택해주세요"
                  birthMode
                  className={`${inputClass} flex items-center justify-between gap-2 text-left hover:border-brand`}
                />
              </div>

              <div>
                <label className={labelClass}>성별</label>
                <div className="flex gap-2">
                  {['남', '여'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, gender: f.gender === g ? '' : g }))
                      }
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                        form.gender === g
                          ? 'border-brand bg-[var(--brand-soft)] text-brand'
                          : 'border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/50 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>전화번호 *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: formatPhoneInput(e.target.value) }))
                  }
                  placeholder="010-0000-0000"
                  className={inputClass}
                />
                <p className="text-[11.5px] text-gray-400 dark:text-white/35 mt-1.5">
                  신청 확인과 취소 시 본인 확인에 사용됩니다
                </p>
              </div>

              <div>
                <label className={labelClass}>남기실 말씀</label>
                <textarea
                  value={form.memo}
                  onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                  placeholder="문의사항이 있으시면 남겨주세요 (선택)"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          )}
        </div>

        {/* 푸터 — 제출 버튼 (완료 화면에서는 숨김) */}
        {!submitted && (
          <div className="relative z-10 bg-background-light/95 dark:bg-card-dark/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 text-sm font-bold bg-brand hover:bg-brand-dim text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              {submitting ? '신청 중...' : `${cultureClass.title} 신청하기`}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default ApplySheet
