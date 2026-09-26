import { useEffect, useState } from 'react'
import { createDailyVerse, updateDailyVerse } from '../../../api/dailyVerse'
import type { DailyVerse } from '../../../types/dailyVerse'
import { showToast } from '../../../utils/toast'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import DatePicker from '../../../components/common/DatePicker'
import { FieldGroup, QuickChip, dateTriggerClass } from '../../../components/common/ComposerFields'
import AdminComposerShell from './AdminComposerShell'
import { ComposerFooter } from './AdminFormBits'

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

  // 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  useEffect(() => {
    if (editingVerse) {
      setVerseReference(editingVerse.verse_reference)
      setVerseText(editingVerse.verse_text)
      setVerseDate(
        editingVerse.verse_date ? editingVerse.verse_date.slice(0, 10) : toDateInput(new Date())
      )
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

  // 날짜는 DatePicker로 옮기며 네이티브 required가 없어졌으니 여기서 직접 확인한다
  const canSubmit =
    verseReference.trim().length > 0 &&
    verseText.trim().length > 0 &&
    verseDate.length > 0 &&
    !submitting

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
  const hasPreview = verseReference.trim().length > 0 || verseText.trim().length > 0
  // 미리보기 카드는 한 번만 마운트한다 — 모바일은 입력 위에(내용이 있을 때만), PC는 우측 열에 상시
  const isLg = useMediaQuery('(min-width: 1024px)')

  const previewCard = (
    <div
      className="relative overflow-hidden rounded-2xl p-4 bg-brand shadow-[0_18px_44px_-18px_var(--brand-glow)]"
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
  )

  // PC에선 좌(입력) / 우(미리보기) 2단
  return (
    <AdminComposerShell
      title={editingVerse ? '말씀 수정' : '새 말씀 등록'}
      onClose={onClose}
      width="md"
      as="form"
      onSubmit={handleSubmit}
      gridCols="lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]"
      rightFirstOnMobile
      footer={
        <ComposerFooter
          onClose={onClose}
          canSubmit={canSubmit}
          submitting={submitting}
          submitLabel={editingVerse ? '수정 저장' : '말씀 등록'}
        />
      }
      columns={[
        <>
            {/* 성경 구절 */}
            <FieldGroup label="성경 구절" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[15px]">
                  📖
                </span>
                <input
                  type="text"
                  value={verseReference}
                  onChange={(e) => setVerseReference(e.target.value)}
                  placeholder="예) 에스겔 37:5, 10  /  요한복음 3:16"
                  maxLength={80}
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-bold text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors resize-none leading-[1.7] lg:min-h-[200px]"
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
                {/* 네이티브 date 입력은 mm/dd/yyyy·OS 달력이라 앱 공통 DatePicker로 */}
                <DatePicker
                  value={verseDate}
                  onChange={setVerseDate}
                  className={dateTriggerClass}
                />
                <div className="mt-2.5 px-3 py-2 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-glow)]">
                  <p className="text-[11.5px] text-brand leading-[1.5]">
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
                    {editingVerse.verse_date
                      ? new Date(editingVerse.verse_date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '날짜 없음'}
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
        </>,
        // 우 — 미리보기: 모바일은 내용이 있을 때만 입력 위에, PC는 상시(빈 자리 안내 포함)
        isLg ? (
          <div className="sticky top-0">
            <div className="flex items-baseline gap-1.5 mb-2">
              <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">미리보기</p>
              <span className="text-[11px] text-gray-400 dark:text-white/35">입력하는 대로 반영됩니다</span>
            </div>
            {hasPreview ? (
              previewCard
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/[0.14] px-4 py-10 text-center text-[12.5px] text-gray-400 dark:text-white/40">
                성경 구절과 말씀을 입력하면 여기에 카드가 보여요
              </div>
            )}
          </div>
        ) : hasPreview ? (
          previewCard
        ) : null,
      ]}
    />
  )
}

export default DailyVerseComposer
