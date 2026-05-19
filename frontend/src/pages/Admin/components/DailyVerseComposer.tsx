import { useEffect, useState, type ReactNode } from 'react'
import { createDailyVerse, updateDailyVerse } from '../../../api/dailyVerse'
import type { DailyVerse } from '../../../types/dailyVerse'
import { showToast } from '../../../utils/toast'

interface DailyVerseComposerProps {
  editingVerse: DailyVerse | null
  onClose: () => void
  onSuccess: () => void
}

const pad = (n: number) => n.toString().padStart(2, '0')
const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const DailyVerseComposer = ({ editingVerse, onClose, onSuccess }: DailyVerseComposerProps) => {
  const [verseReference, setVerseReference] = useState('')
  const [verseText, setVerseText] = useState('')
  const [verseDate, setVerseDate] = useState(() => toDateInput(new Date()))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editingVerse) {
      setVerseReference(editingVerse.verse_reference)
      setVerseText(editingVerse.verse_text)
      setVerseDate(editingVerse.verse_date.slice(0, 10))
    } else {
      setVerseReference('')
      setVerseText('')
      setVerseDate(toDateInput(new Date()))
    }
    setError(null)
  }, [editingVerse])

  const handleQuickDate = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    setVerseDate(toDateInput(d))
  }

  const canSubmit =
    verseReference.trim().length > 0 && verseText.trim().length > 0 && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      if (editingVerse) {
        await updateDailyVerse(editingVerse.id, {
          verse_reference: verseReference.trim(),
          verse_text: verseText.trim(),
        })
        showToast('오늘의 말씀이 수정되었습니다', 'success')
      } else {
        await createDailyVerse({
          verse_reference: verseReference.trim(),
          verse_text: verseText.trim(),
          verse_date: verseDate,
        })
        showToast('오늘의 말씀이 등록되었습니다', 'success')
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '작업에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const isToday = verseDate === toDateInput(new Date())
  const isTomorrow = verseDate === toDateInput(new Date(Date.now() + 86400000))

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_rgba(168,85,247,0.18)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 카드 표면 그라데이션 */}
        <div className="hidden dark:block absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/15 to-pink-400/10 dark:from-purple-500/15 dark:to-pink-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-purple-400/10 dark:from-pink-500/10 dark:to-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="hidden absolute left-1/2 -translate-x-1/2 -top-3 sm:block" />
          <div>
            <p className="text-purple-600/80 dark:text-purple-300/80 text-[10.5px] font-bold tracking-[0.12em] uppercase">
              ADMIN
            </p>
            <h2 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em]">
              {editingVerse ? '말씀 수정' : '새 말씀 등록'}
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
            {/* 미리보기 카드 */}
            {(verseReference.trim() || verseText.trim()) && (
              <div
                className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_18px_44px_-18px_rgba(168,85,247,0.6)]"
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.15) 100%)',
                  }}
                />
                <div
                  className="absolute -top-6 -right-6 w-32 h-32 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
                    backgroundSize: '12px 12px',
                  }}
                />
                <div className="relative">
                  <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-white/25 backdrop-blur-sm text-white text-[10.5px] font-bold tracking-[0.05em] mb-2.5">
                    📖 미리보기
                  </span>
                  {verseReference.trim() && (
                    <h3 className="text-white text-[15px] font-bold mb-2 leading-[1.3]">
                      {verseReference}
                    </h3>
                  )}
                  {verseText.trim() && (
                    <p className="text-white/95 text-[13.5px] leading-[1.7] font-medium whitespace-pre-wrap">
                      "{verseText}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 성경 구절 */}
            <FieldGroup label="성경 구절" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/80 pointer-events-none text-[15px]">
                  📖
                </span>
                <input
                  type="text"
                  value={verseReference}
                  onChange={(e) => setVerseReference(e.target.value)}
                  placeholder="예) 에스겔 37:5, 10  /  요한복음 3:16"
                  maxLength={80}
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
                />
              </div>
              <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1.5 pl-0.5">
                개역개정 기준, 책 이름 + 장:절 형식
              </p>
            </FieldGroup>

            {/* 말씀 내용 */}
            <FieldGroup label="말씀 내용" required>
              <textarea
                value={verseText}
                onChange={(e) => setVerseText(e.target.value)}
                placeholder={'말씀을 입력하세요.\n예) 내가 너희 속에 생기를 두리니 너희가 살아나리라'}
                rows={5}
                required
                maxLength={800}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors resize-none leading-[1.7]"
              />
              <div className="flex items-center justify-between mt-1.5 pl-0.5">
                <p className="text-[11px] text-gray-400 dark:text-white/40">
                  큰따옴표는 자동으로 미리보기에 추가됩니다
                </p>
                <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 tabular-nums">
                  {verseText.length}/800
                </p>
              </div>
            </FieldGroup>

            {/* 게시일 — 등록 시만 */}
            {!editingVerse && (
              <FieldGroup label="게시일">
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  <QuickChip active={isToday} onClick={() => handleQuickDate(0)}>
                    오늘
                  </QuickChip>
                  <QuickChip active={isTomorrow} onClick={() => handleQuickDate(1)}>
                    내일
                  </QuickChip>
                  <QuickChip
                    active={verseDate === toDateInput(new Date(Date.now() + 2 * 86400000))}
                    onClick={() => handleQuickDate(2)}
                  >
                    모레
                  </QuickChip>
                </div>
                <input
                  type="date"
                  value={verseDate}
                  onChange={(e) => setVerseDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
                />
                <div className="mt-2.5 px-3 py-2 rounded-xl bg-purple-500/8 dark:bg-purple-500/10 border border-purple-500/20 dark:border-purple-500/25">
                  <p className="text-[11.5px] text-purple-700 dark:text-purple-200 leading-[1.5]">
                    🔄 같은 날짜에 이미 말씀이 있으면 자동으로 덮어쓰여집니다
                  </p>
                </div>
              </FieldGroup>
            )}

            {editingVerse && (
              <div className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]">
                <p className="text-[11.5px] text-gray-500 dark:text-white/55 leading-[1.5]">
                  📅 게시일{' '}
                  <span className="font-semibold text-gray-700 dark:text-white/80">
                    {new Date(editingVerse.verse_date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  {' '}— 수정 시 변경되지 않습니다
                </p>
              </div>
            )}

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
              className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
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
                  저장 중...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {editingVerse ? '수정 저장' : '말씀 등록'}
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

export default DailyVerseComposer
