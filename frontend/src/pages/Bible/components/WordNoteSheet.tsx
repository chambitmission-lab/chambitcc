import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { WordNote } from '../../../api/bibleWordNote'
import {
  useCreateWordNote,
  useUpdateWordNote,
  useDeleteWordNote,
} from '../../../hooks/useBibleWordNote'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { showToast } from '../../../utils/toast'

interface WordNoteSheetProps {
  verseId: number
  verseReference: string // 예: "창세기 1:28"
  verseText: string
  /** 선택한 토큰의 원문 (조사 포함) — 단어 입력칸의 초기값 */
  initialWord: string
  /** 선택한 토큰의 절 본문 내 위치. 기존 노트 수정 시엔 노트에 저장된 값 */
  charStart: number | null
  charEnd: number | null
  /** 있으면 수정 모드 */
  existing: WordNote | null
  onClose: () => void
}

/**
 * 단어 뜻/메모 입력 하단 시트 (생성·수정·삭제 겸용).
 * 한국어는 조사가 붙어 선택되므로("긍휼히"→"긍휼") 단어 입력칸을 수정 가능하게 둔다.
 */
const WordNoteSheet = ({
  verseId,
  verseReference,
  verseText,
  initialWord,
  charStart,
  charEnd,
  existing,
  onClose,
}: WordNoteSheetProps) => {
  const [word, setWord] = useState(existing?.word ?? initialWord)
  const [note, setNote] = useState(existing?.note ?? '')

  const create = useCreateWordNote(verseId)
  const update = useUpdateWordNote()
  const del = useDeleteWordNote()
  const isBusy = create.isPending || update.isPending || del.isPending

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  // 뒤로가기 → 시트만 닫기
  useModalBackButton(onClose)

  const handleSave = async () => {
    const trimmed = word.trim()
    if (!trimmed) {
      showToast('단어를 입력해 주세요', 'error')
      return
    }
    try {
      if (existing) {
        await update.mutateAsync({
          noteId: existing.id,
          payload: { word: trimmed, note: note.trim() || null },
        })
      } else {
        await create.mutateAsync({
          word: trimmed,
          note: note.trim() || null,
          char_start: charStart,
          char_end: charEnd,
        })
      }
      showToast('단어장에 저장되었어요 ✨', 'success')
      onClose()
    } catch (e: any) {
      showToast(e?.message || '저장에 실패했어요', 'error')
    }
  }

  const handleDelete = async () => {
    if (!existing) return
    try {
      await del.mutateAsync(existing.id)
      showToast('단어가 삭제되었어요', 'success')
      onClose()
    } catch (e: any) {
      showToast(e?.message || '삭제에 실패했어요', 'error')
    }
  }

  // 본문 미리보기에서 선택한 단어를 강조 (범위가 유효할 때만)
  const start = existing?.char_start ?? charStart
  const end = existing?.char_end ?? charEnd
  const validRange =
    start != null && end != null && start >= 0 && end > start && end <= verseText.length

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md max-h-[94vh] sm:max-h-[90vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 표면 그라데이션 + 글로우 */}
        <div className="hidden dark:block absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-soft)] rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center gap-3 px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand-soft)] text-brand shrink-0">
            <span className="material-icons-round text-[22px]">spellcheck</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-brand text-[10.5px] font-bold tracking-[0.1em]">단어장</p>
            <h3 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em] truncate">
              {verseReference}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors shrink-0"
            aria-label="닫기"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        {/* 본문 */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* 말씀 본문 — 선택한 단어 강조 */}
          <div className="rounded-xl border-l-[3px] border-brand bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-[14.5px] leading-[1.7] text-gray-700 dark:text-white/80">
            {validRange ? (
              <>
                {verseText.slice(0, start!)}
                <span className="font-bold text-brand underline decoration-dotted decoration-2 underline-offset-4">
                  {verseText.slice(start!, end!)}
                </span>
                {verseText.slice(end!)}
              </>
            ) : (
              verseText
            )}
          </div>

          {/* 단어 */}
          <div>
            <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em] mb-2">
              단어 <span className="font-medium text-gray-400 dark:text-white/40">(조사는 지워도 돼요)</span>
            </p>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value.slice(0, 100))}
              placeholder="예: 긍휼"
              className="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[16px] font-bold text-gray-900 dark:text-white placeholder:font-normal placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          {/* 뜻/메모 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">
                뜻 · 메모 <span className="font-medium text-gray-400 dark:text-white/40">(선택)</span>
              </p>
              <span className="text-[11px] text-gray-400 dark:text-white/35">{note.length} / 2000</span>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 2000))}
              rows={4}
              placeholder="찾아본 뜻이나 기억하고 싶은 내용을 적어보세요..."
              className="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] leading-[1.65] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 resize-y min-h-[100px] focus:outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="relative z-10 sticky bottom-0 bg-background-light/95 dark:bg-card-dark/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
          {existing ? (
            <button
              onClick={handleDelete}
              disabled={isBusy}
              className="inline-flex items-center gap-1 px-3 h-11 rounded-full text-[13px] font-bold text-red-600 dark:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <span className="material-icons-round text-[18px]">delete_outline</span>
              삭제
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            disabled={isBusy}
            className="ml-auto px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isBusy || !word.trim()}
            className="inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-brand text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--brand-glow)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <span className="material-icons-round text-[18px]">{isBusy ? 'hourglass_empty' : 'check'}</span>
            {isBusy ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default WordNoteSheet
