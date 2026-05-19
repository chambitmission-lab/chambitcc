import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createBulletin } from '../../../api/bulletin'
import { showToast } from '../../../utils/toast'

interface BulletinComposerProps {
  onClose: () => void
  onSuccess: () => void
}

const pad = (n: number) => n.toString().padStart(2, '0')
const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const getLastSunday = (): string => {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return toDateInput(d)
}

const getNextSunday = (): string => {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() + (7 - day))
  return toDateInput(d)
}

const BulletinComposer = ({ onClose, onSuccess }: BulletinComposerProps) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [bulletinDate, setBulletinDate] = useState(getNextSunday())
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 미리보기 URL은 unmount 시 해제 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected || selected.length === 0) return

    const accepted: File[] = []
    const newPreviews: string[] = []
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i]
      if (!file.type.startsWith('image/')) {
        showToast(`${file.name}은(는) 이미지 파일이 아닙니다`, 'error')
        continue
      }
      accepted.push(file)
      newPreviews.push(URL.createObjectURL(file))
    }

    setFiles(prev => [...prev, ...accepted])
    setPreviews(prev => [...prev, ...newPreviews])
    if (accepted.length > 0) {
      showToast(`${accepted.length}개의 페이지가 추가되었습니다`, 'success')
    }
    // 같은 파일 재선택 가능하도록 input 리셋
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemove = (idx: number) => {
    URL.revokeObjectURL(previews[idx])
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleMove = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= files.length) return
    const swap = <T,>(arr: T[]) => {
      const next = [...arr]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    }
    setFiles(swap)
    setPreviews(swap)
  }

  const canSubmit = title.trim().length > 0 && files.length > 0 && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      const isoDate = new Date(bulletinDate).toISOString()
      await createBulletin(title.trim(), isoDate, description.trim(), files)
      showToast('주보가 등록되었습니다', 'success')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '주보 등록에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickDate = (which: 'thisWeek' | 'nextWeek') => {
    setBulletinDate(which === 'thisWeek' ? getLastSunday() : getNextSunday())
  }

  const isThisWeek = bulletinDate === getLastSunday()
  const isNextWeek = bulletinDate === getNextSunday()

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_rgba(168,85,247,0.18)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/15 to-pink-400/10 dark:from-purple-500/15 dark:to-pink-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-purple-400/10 dark:from-pink-500/10 dark:to-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-purple-600/80 dark:text-purple-300/80 text-[10.5px] font-bold tracking-[0.12em] uppercase">
              ADMIN
            </p>
            <h2 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em]">
              새 주보 등록
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
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
            {/* 제목 */}
            <FieldGroup label="제목" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 2026년 5월 셋째 주 주보"
                maxLength={120}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
              />
            </FieldGroup>

            {/* 주보 날짜 */}
            <FieldGroup label="주보 날짜" required>
              <div className="flex gap-1.5 mb-2 flex-wrap">
                <QuickChip active={isThisWeek} onClick={() => handleQuickDate('thisWeek')}>
                  이번 주 일요일
                </QuickChip>
                <QuickChip active={isNextWeek} onClick={() => handleQuickDate('nextWeek')}>
                  다음 주 일요일
                </QuickChip>
              </div>
              <input
                type="date"
                value={bulletinDate}
                onChange={(e) => setBulletinDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
              />
            </FieldGroup>

            {/* 설명 */}
            <FieldGroup label="설명">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이번 주 주보의 핵심 메시지나 안내사항을 적어주세요."
                rows={3}
                maxLength={400}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors resize-none leading-[1.6]"
              />
              <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 mt-1 text-right tabular-nums">
                {description.length}/400
              </p>
            </FieldGroup>

            {/* 페이지 업로드 */}
            <FieldGroup label="주보 페이지" required>
              <p className="text-[11px] text-gray-400 dark:text-white/40 mb-2">
                선택한 순서대로 페이지가 구성됩니다. 화살표로 순서 변경, ✕ 로 제거할 수 있어요.
              </p>

              {/* 드롭존 */}
              <label
                className="relative block rounded-2xl border-2 border-dashed border-purple-300/50 dark:border-purple-400/30 bg-purple-500/5 dark:bg-purple-500/8 hover:bg-purple-500/10 dark:hover:bg-purple-500/15 transition-colors cursor-pointer p-5 text-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={submitting}
                />
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500 dark:text-purple-300">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-[13px] font-bold text-gray-800 dark:text-white">
                  이미지 페이지 추가
                </p>
                <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-0.5">
                  여러 장 선택 가능
                </p>
              </label>

              {/* 페이지 미리보기 grid */}
              {previews.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-gray-700 dark:text-white/80">
                      등록된 페이지
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 h-5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-[10.5px] font-bold">
                      {files.length}장
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {previews.map((src, idx) => (
                      <PagePreviewItem
                        key={src}
                        src={src}
                        index={idx}
                        canMoveLeft={idx > 0}
                        canMoveRight={idx < previews.length - 1}
                        onRemove={() => handleRemove(idx)}
                        onMoveLeft={() => handleMove(idx, -1)}
                        onMoveRight={() => handleMove(idx, 1)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </FieldGroup>

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
              onClick={onClose}
              disabled={submitting}
              className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(168,85,247,0.7)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  업로드 중...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  주보 등록
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────
const FieldGroup = ({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) => (
  <div>
    <div className="flex items-center gap-1 mb-2">
      <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">
        {label}
      </p>
      {required && <span className="text-pink-500 text-[12px] font-bold">*</span>}
    </div>
    {children}
  </div>
)

const QuickChip = ({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'inline-flex items-center px-3 h-8 rounded-full text-[11.5px] font-bold border transition-colors',
      active
        ? 'bg-purple-500/15 dark:bg-purple-500/20 border-purple-500/30 text-purple-700 dark:text-purple-300'
        : 'bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/15 dark:border-purple-500/20 text-purple-600 dark:text-purple-300/80 hover:bg-purple-500/12 dark:hover:bg-purple-500/18',
    ].join(' ')}
  >
    {children}
  </button>
)

interface PagePreviewItemProps {
  src: string
  index: number
  canMoveLeft: boolean
  canMoveRight: boolean
  onRemove: () => void
  onMoveLeft: () => void
  onMoveRight: () => void
}

const PagePreviewItem = ({
  src,
  index,
  canMoveLeft,
  canMoveRight,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: PagePreviewItemProps) => (
  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] group">
    <img src={src} alt={`페이지 ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
    {/* 그라데이션 오버레이 */}
    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/65 to-transparent pointer-events-none" />

    {/* 페이지 번호 */}
    <span className="absolute bottom-1.5 left-1.5 inline-flex items-center px-2 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10.5px] font-bold tracking-wide">
      P.{index + 1}
    </span>

    {/* 제거 버튼 */}
    <button
      type="button"
      onClick={onRemove}
      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
      aria-label={`페이지 ${index + 1} 제거`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>

    {/* 순서 이동 버튼 */}
    <div className="absolute bottom-1.5 right-1.5 flex gap-0.5">
      <button
        type="button"
        onClick={onMoveLeft}
        disabled={!canMoveLeft}
        className="w-6 h-6 rounded-full bg-black/55 hover:bg-purple-500/80 text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/55"
        aria-label="앞으로"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onMoveRight}
        disabled={!canMoveRight}
        className="w-6 h-6 rounded-full bg-black/55 hover:bg-purple-500/80 text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/55"
        aria-label="뒤로"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  </div>
)

export default BulletinComposer
