import { createPortal } from 'react-dom'
import type { VerseBookmark } from '../../../api/bibleBookmark'
import { useModalBackButton } from '../../../hooks/useModalBackButton'

interface VerseNoteSheetProps {
  verseReference: string // 예: "창세기 1:1"
  verseText: string
  bookmark: VerseBookmark
  onEdit: () => void
  onClose: () => void
}

/**
 * 묵상 노트 읽기 전용 하단 시트.
 * 본문 흐름을 어지럽히지 않도록 메모를 인라인으로 늘어놓는 대신, 절의 작은 칩을
 * 눌렀을 때만 이 시트가 올라와 메모를 또렷하게 보여준다. 수정은 기존 편집 모달로 위임.
 */
const VerseNoteSheet = ({ verseReference, verseText, bookmark, onEdit, onClose }: VerseNoteSheetProps) => {
  // 뒤로가기 → 시트만 닫기
  useModalBackButton(onClose)

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md max-h-[90vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 표면 그라데이션 + 글로우 */}
        <div className="hidden dark:block absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-soft)] rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center gap-3 px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand-soft)] text-brand shrink-0">
            <span className="material-icons-round text-[22px]">menu_book</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-brand text-[10.5px] font-bold tracking-[0.1em]">
              내 묵상 노트
            </p>
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
        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* 말씀 본문 (참고용, 톤다운) */}
          <div className="rounded-xl border-l-[3px] border-brand bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-[13.5px] leading-[1.7] text-gray-600 dark:text-white/65">
            {verseText}
          </div>

          {/* 내가 적은 묵상 */}
          <div className="rounded-2xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] px-4 py-4">
            <div className="flex items-center gap-1.5 mb-2 text-brand">
              <span className="material-icons-round text-[16px]">format_quote</span>
              <span className="text-[11.5px] font-bold tracking-[0.04em]">나의 묵상</span>
            </div>
            <p className="whitespace-pre-wrap text-[15px] leading-[1.75] text-gray-800 dark:text-white/90">
              {bookmark.note}
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="relative z-10 sticky bottom-0 bg-background-light/95 dark:bg-card-dark/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            닫기
          </button>
          <button
            onClick={onEdit}
            className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-brand text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--brand-glow)] transition-all"
          >
            <span className="material-icons-round text-[18px]">edit</span>
            수정
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default VerseNoteSheet
