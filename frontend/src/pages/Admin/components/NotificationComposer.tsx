import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  createNotification,
  updateNotification,
  uploadNotificationImage,
} from '../../../api/notification'
import type {
  CreateNotificationRequest,
  Notification,
} from '../../../types/notification'
import { showToast } from '../../../utils/toast'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import DatePicker from '../../../components/common/DatePicker'
import { confirmDialog } from '../../../utils/confirmDialog'

interface NotificationComposerProps {
  editingNotification: Notification | null
  onClose: () => void
  onSuccess: () => void
}

const DEFAULT_FORM: CreateNotificationRequest = {
  title: '',
  content: '',
  is_active: true,
  is_popup: false,
  popup_until: null,
  image_url: null,
}

const MAX_IMAGE_MB = 10

/** 서버가 준 popup_until(ISO) → date input 값(YYYY-MM-DD) */
const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : '')

/** date input 값 → 그 날 23:59:59 (KST 기준, 타임존 없이 보낸다) */
const toPopupUntil = (date: string) => (date ? `${date}T23:59:59` : null)

/** 오늘(로컬) YYYY-MM-DD — 종료일 하한 */
const todayISO = () => {
  const t = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
}

/** 안내 문구용 한국식 표기 — 2026-08-02 → 2026년 8월 2일 (일) */
const formatKo = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const [y, mo, d] = [+m[1], +m[2], +m[3]]
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][new Date(y, mo - 1, d).getDay()]
  return `${y}년 ${mo}월 ${d}일 (${weekday})`
}

const NotificationComposer = ({
  editingNotification,
  onClose,
  onSuccess,
}: NotificationComposerProps) => {
  const [form, setForm] = useState<CreateNotificationRequest>(DEFAULT_FORM)
  const [popupUntilDate, setPopupUntilDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  useEffect(() => {
    if (editingNotification) {
      setForm({
        title: editingNotification.title,
        content: editingNotification.content,
        is_active: editingNotification.is_active,
        is_popup: !!editingNotification.is_popup,
        popup_until: editingNotification.popup_until ?? null,
        image_url: editingNotification.image_url ?? null,
      })
      setPopupUntilDate(toDateInput(editingNotification.popup_until))
    } else {
      setForm(DEFAULT_FORM)
      setPopupUntilDate('')
    }
    setError(null)
  }, [editingNotification])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // 같은 파일을 다시 골라도 change가 발생하도록 값을 비운다
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일만 첨부할 수 있습니다', 'error')
      return
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      showToast(`이미지는 최대 ${MAX_IMAGE_MB}MB까지 첨부할 수 있습니다`, 'error')
      return
    }

    setUploading(true)
    try {
      const url = await uploadNotificationImage(file)
      setForm((prev) => ({ ...prev, image_url: url }))
      showToast('이미지를 첨부했습니다. 저장해야 공지에 반영됩니다', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다', 'error')
    } finally {
      setUploading(false)
    }
  }

  // 지난 날짜를 종료일로 고르면 팝업이 곧바로 사라진다 — 오늘부터만 고르게 한다.
  // 다만 이미 지난 종료일이 저장된 공지를 수정할 때는 그 값이 달력에서
  // 비활성으로 보이지 않도록 하한을 그 날짜까지 열어 둔다.
  const minPopupDate =
    popupUntilDate && popupUntilDate < todayISO() ? popupUntilDate : todayISO()

  const canSubmit =
    form.title.trim().length > 0 &&
    form.content.trim().length > 0 &&
    !submitting &&
    !uploading

  // 배경 탭 한 번에 작성 내용(특히 방금 올린 이미지)이 통째로 날아가지 않게 한다.
  // 첨부는 업로드가 끝나도 "저장"을 눌러야 공지에 반영되므로 여기서 유실되면 원인을 알기 어렵다.
  const hasDraft =
    form.title.trim().length > 0 ||
    form.content.trim().length > 0 ||
    !!form.image_url

  const handleClose = async () => {
    if (
      hasDraft &&
      !(await confirmDialog({
        title: '작성 중인 내용이 있어요',
        message: '지금 닫으면 작성 중인 내용이 사라집니다.',
        description: '닫으시겠습니까?',
        confirmText: '닫기',
        cancelText: '계속 쓰기',
        tone: 'warning',
        icon: 'edit_note',
      }))
    )
      return
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      // 팝업을 끄면 노출 기간은 의미가 없으므로 함께 비운다
      const payload: CreateNotificationRequest = {
        ...form,
        popup_until: form.is_popup ? toPopupUntil(popupUntilDate) : null,
      }
      if (editingNotification) {
        await updateNotification(editingNotification.id, payload)
        showToast('공지사항이 수정되었습니다', 'success')
      } else {
        await createNotification(payload)
        showToast('공지사항이 등록되었습니다', 'success')
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '작업에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={handleClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-soft-strong)] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-[var(--brand-soft)] rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-1 rounded-full bg-white/15 absolute left-1/2 -translate-x-1/2 -top-3 sm:hidden" />
          <div>
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">
              ADMIN
            </p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
              {editingNotification ? '공지사항 수정' : '새 공지사항 작성'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-5 py-5 space-y-5">
            <FieldGroup label="제목" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예) 5월 청년부 헌신예배 안내"
                maxLength={120}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-semibold text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
              />
              <p className="mt-1 text-right text-[11px] text-gray-400 dark:text-white/35">
                {form.title.length} / 120
              </p>
            </FieldGroup>

            <FieldGroup label="내용" required>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="공지사항 내용을 입력해주세요. 일시·장소·준비물 등 성도들이 알아야 할 정보를 명확하게 적어주세요."
                rows={8}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors resize-none leading-[1.7]"
              />
            </FieldGroup>

            {/* 이미지 첨부 — 포스터·안내문을 그대로 보여줄 때 */}
            <FieldGroup label="이미지 (선택)">
              {form.image_url ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/[0.08]">
                  <img
                    src={form.image_url}
                    alt="첨부 이미지 미리보기"
                    className="w-full max-h-64 object-contain bg-gray-50 dark:bg-white/[0.03]"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image_url: null })}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/75 transition-colors"
                    aria-label="이미지 삭제"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="absolute left-2 bottom-2 px-2 py-1 rounded-lg bg-black/60 text-white text-[10.5px] font-semibold">
                    아래 저장 버튼을 눌러야 반영됩니다
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-6 rounded-xl border border-dashed border-gray-300 dark:border-white/[0.14] flex flex-col items-center gap-1.5 text-gray-500 dark:text-white/50 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      <span className="text-[12.5px] font-semibold">업로드 중...</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span className="text-[12.5px] font-semibold">이미지 첨부하기</span>
                      <span className="text-[11px]">JPG·PNG·WebP · 최대 {MAX_IMAGE_MB}MB</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </FieldGroup>

            {/* 팝업 노출 — 홈(기도 목록) 진입 시 전면 팝업 */}
            <div className="rounded-xl bg-white/80 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-3.5 py-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-ink-strong">
                    홈 팝업으로 띄우기
                  </p>
                  <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-0.5">
                    기도 목록 진입 시 전면 팝업 + 상단 배너로 노출
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!form.is_popup}
                  onClick={() => setForm({ ...form, is_popup: !form.is_popup })}
                  className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${
                    form.is_popup
                      ? 'bg-brand shadow-[0_0_16px_var(--brand-glow)]'
                      : 'bg-gray-300 dark:bg-white/[0.1]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                      form.is_popup ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {form.is_popup && (
                <div className="px-3.5 pb-3.5 pt-0.5 border-t border-gray-200 dark:border-white/[0.08]">
                  <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 mt-3 mb-2">
                    팝업 종료일
                  </p>
                  <div className="flex items-center gap-2">
                    {/* 네이티브 date 입력은 브라우저 로케일을 따라 08/02/2026처럼 보인다 —
                        앱 전역에서 쓰는 한국식 달력(요일·주말 색)으로 통일한다 */}
                    <div className="flex-1 min-w-0">
                      <DatePicker
                        value={popupUntilDate}
                        onChange={setPopupUntilDate}
                        placeholder="종료일을 선택하세요"
                        minDate={minPopupDate}
                      />
                    </div>
                    {popupUntilDate && (
                      <button
                        type="button"
                        onClick={() => setPopupUntilDate('')}
                        className="px-3 h-11 rounded-xl text-[12.5px] font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                      >
                        지우기
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-gray-500 dark:text-white/50">
                    {popupUntilDate
                      ? `${formatKo(popupUntilDate)} 자정까지 팝업으로 노출됩니다`
                      : '비워두면 팝업을 끌 때까지 계속 노출됩니다'}
                  </p>
                </div>
              )}
            </div>

            {/* 공개 여부 */}
            <div className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-white/80 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08]">
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-ink-strong">
                  공개하기
                </p>
                <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-0.5">
                  끄면 비활성 (성도들에게 보이지 않음)
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!form.is_active}
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${
                  form.is_active
                    ? 'bg-brand shadow-[0_0_16px_var(--brand-glow)]'
                    : 'bg-gray-300 dark:bg-white/[0.1]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    form.is_active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 text-[12.5px] font-medium">
                {error}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="sticky bottom-0 bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
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
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  저장 중...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {editingNotification ? '수정 저장' : '등록하기'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface FieldGroupProps {
  label: string
  required?: boolean
  children: ReactNode
}

const FieldGroup = ({ label, required, children }: FieldGroupProps) => (
  <div>
    <div className="flex items-center gap-1 mb-2">
      <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">
        {label}
      </p>
      {required && <span className="text-brand text-[12px] font-bold">*</span>}
    </div>
    {children}
  </div>
)

export default NotificationComposer
