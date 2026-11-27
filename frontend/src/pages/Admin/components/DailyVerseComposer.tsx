// 오늘의 말씀 등록·수정 모달 — 관리자 작성 모달 PC 2단 표준(AdminComposerShell)
//   좌: 성경 구절·말씀 / 우: 홈 명판 미리보기(AnnualThemeVerse 그대로)
//
// 백엔드는 날짜별 예약이 없다 — 등록하는 순간 이 말씀이 홈에 걸리고 지금 말씀은 보관함으로
// 내려간다(2026-11-27, 예전 '게시일' 선택은 서버가 무시하던 값이라 뺐다).
import { useState } from 'react'
import { createDailyVerse, updateDailyVerse } from '../../../api/dailyVerse'
import type { DailyVerse } from '../../../types/dailyVerse'
import { showToast } from '../../../utils/toast'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { FieldGroup } from '../../../components/common/ComposerFields'
import AdminComposerShell from './AdminComposerShell'
import { ComposerFooter } from './AdminFormBits'
import AnnualThemeVerse from '../../Home/components/AnnualThemeVerse'

interface DailyVerseComposerProps {
  editingVerse: DailyVerse | null
  /** 지금 걸린 말씀 — 새로 등록하면 이 말씀이 내려간다고 알려 준다 */
  currentVerse?: DailyVerse | null
  onClose: () => void
  onSuccess: (saved: DailyVerse) => void
}

const DailyVerseComposer = ({ editingVerse, currentVerse, onClose, onSuccess }: DailyVerseComposerProps) => {
  const [verseReference, setVerseReference] = useState(editingVerse?.verse_reference ?? '')
  const [verseText, setVerseText] = useState(editingVerse?.verse_text ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  const canSubmit = verseReference.trim().length > 0 && verseText.trim().length > 0 && !submitting
  const hasPreview = verseReference.trim().length > 0 || verseText.trim().length > 0
  const editingLive = !!editingVerse && !!editingVerse.is_active

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      const payload = { verse_reference: verseReference.trim(), verse_text: verseText.trim() }
      const saved = editingVerse ? await updateDailyVerse(editingVerse.id, payload) : await createDailyVerse(payload)
      showToast(editingVerse ? '수정했어요' : '홈에 새 말씀을 걸었어요', 'success')
      onSuccess(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminComposerShell
      title={editingVerse ? '말씀 수정' : '새 말씀 걸기'}
      onClose={onClose}
      width="md"
      as="form"
      onSubmit={handleSubmit}
      gridCols="lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]"
      rightFirstOnMobile
      footer={
        <ComposerFooter
          onClose={onClose}
          canSubmit={canSubmit}
          submitting={submitting}
          submitLabel={editingVerse ? '수정 저장' : '등록하고 홈에 걸기'}
        />
      }
      columns={[
        <>
          <FieldGroup label="성경 구절" required>
            <input
              type="text"
              value={verseReference}
              onChange={(e) => setVerseReference(e.target.value)}
              placeholder="예) 에스겔 37:5, 10"
              maxLength={80}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[15px] font-bold text-ink-strong placeholder:font-medium placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
            />
            <p className="text-[12px] text-gray-400 dark:text-white/40 mt-1.5 pl-0.5">개역개정 기준 · 책 이름 + 장:절</p>
          </FieldGroup>

          <FieldGroup label="말씀" required>
            <textarea
              value={verseText}
              onChange={(e) => setVerseText(e.target.value)}
              placeholder={'예) 너희 마른 뼈들아, 이제 살아나리라!'}
              rows={6}
              required
              maxLength={800}
              className="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[15px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors resize-none leading-[1.75] lg:min-h-[200px]"
            />
            <div className="flex items-center justify-between mt-1.5 pl-0.5 text-[12px] text-gray-400 dark:text-white/40">
              <span>마지막 어절에 금박 밑줄이 그어져요</span>
              <span className="font-semibold tabular-nums">{verseText.length}/800</span>
            </div>
          </FieldGroup>

          {!editingVerse ? (
            <p className="rounded-xl bg-[var(--brand-soft)] px-3.5 py-3 text-[13px] leading-[1.6] text-brand font-medium break-keep">
              등록하면 바로 홈 맨 위 명판·참비·집중 기도에 걸려요.
              {currentVerse && (
                <>
                  {' '}
                  지금 걸린 <b className="font-bold">{currentVerse.verse_reference}</b>는 보관함으로 내려가고, 언제든 다시 걸 수 있어요.
                </>
              )}
            </p>
          ) : (
            <p className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-3.5 py-3 text-[13px] leading-[1.6] text-gray-600 dark:text-white/60 break-keep">
              {editingLive ? '지금 홈에 걸린 말씀이라 저장하면 바로 바뀌어요.' : '보관함의 말씀이에요 — 고쳐도 홈에는 다시 걸기 전까지 안 보여요.'}
            </p>
          )}

          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 text-[13px] font-medium">
              {error}
            </div>
          )}
        </>,
        // 우 — 홈 명판 그대로. 모바일은 내용이 있을 때만 입력 위에
        <div className={hasPreview ? '' : 'hidden lg:block'}>
          <p className="mb-2 text-[13px] font-bold text-gray-500 dark:text-white/55">홈에 이렇게 보여요</p>
          {hasPreview ? (
            <AnnualThemeVerse preview={{ verse_reference: verseReference, verse_text: verseText }} />
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/[0.14] px-4 py-12 text-center text-[13px] text-gray-400 dark:text-white/40">
              구절과 말씀을 쓰면 홈 명판이 여기 그대로 보여요
            </div>
          )}
        </div>,
      ]}
    />
  )
}

export default DailyVerseComposer
