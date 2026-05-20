import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { HighlightColor, VerseBookmark } from '../../../api/bibleBookmark'
import { useUpsertBookmark, useDeleteBookmark } from '../../../hooks/useBibleBookmark'
import { showToast } from '../../../utils/toast'

interface VerseBookmarkModalProps {
  verseId: number
  verseReference: string // 예: "요한복음 3:16"
  verseText: string
  existing: VerseBookmark | null
  onClose: () => void
}

const COLORS: { value: HighlightColor; label: string; bg: string }[] = [
  { value: 'yellow', label: '노랑', bg: '#fde68a' },
  { value: 'orange', label: '주황', bg: '#fdba74' },
  { value: 'pink', label: '분홍', bg: '#fbcfe8' },
  { value: 'blue', label: '파랑', bg: '#bfdbfe' },
  { value: 'green', label: '초록', bg: '#bbf7d0' },
]

const VerseBookmarkModal = ({
  verseId,
  verseReference,
  verseText,
  existing,
  onClose,
}: VerseBookmarkModalProps) => {
  const [color, setColor] = useState<HighlightColor | null>(existing?.highlight_color ?? 'yellow')
  const [note, setNote] = useState<string>(existing?.note ?? '')
  const [isFavorite, setIsFavorite] = useState<boolean>(existing?.is_favorite ?? false)

  const upsert = useUpsertBookmark(verseId)
  const del = useDeleteBookmark(verseId)

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        highlight_color: color,
        note: note.trim() || null,
        is_favorite: isFavorite,
      })
      showToast('묵상 노트가 저장되었어요 ✨', 'success')
      onClose()
    } catch (e: any) {
      showToast(e?.message || '저장에 실패했어요', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await del.mutateAsync()
      showToast('북마크가 삭제되었어요', 'success')
      onClose()
    } catch (e: any) {
      showToast(e?.message || '삭제에 실패했어요', 'error')
    }
  }

  const isBusy = upsert.isPending || del.isPending
  const charCount = note.length

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md max-h-[94vh] sm:max-h-[90vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_rgba(168,85,247,0.18)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 카드 표면 그라데이션 + 글로우 */}
        <div className="hidden dark:block absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/15 to-pink-400/10 dark:from-purple-500/15 dark:to-pink-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-purple-400/10 dark:from-pink-500/10 dark:to-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center gap-3 px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500/15 to-pink-500/10 text-purple-600 dark:text-purple-300 shrink-0">
            <span className="material-icons-round text-[22px]">edit_note</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-purple-600/80 dark:text-purple-300/80 text-[10.5px] font-bold tracking-[0.1em]">
              묵상 노트
            </p>
            <h3 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em] truncate">
              {verseReference}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-purple-500 dark:hover:text-purple-300 transition-colors shrink-0"
            aria-label="닫기"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        {/* 본문 */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* 말씀 본문 */}
          <div className="rounded-xl border-l-[3px] border-purple-400/60 dark:border-purple-400/50 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-[14.5px] leading-[1.7] text-gray-700 dark:text-white/80">
            {verseText}
          </div>

          {/* 하이라이트 색상 */}
          <div>
            <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em] mb-2">
              하이라이트 색상
            </p>
            <div className="flex gap-2 flex-wrap items-center">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-9 h-9 rounded-full transition-transform ${
                    color === c.value
                      ? 'ring-2 ring-offset-2 ring-purple-500 dark:ring-offset-card-dark scale-110'
                      : 'ring-1 ring-black/5 dark:ring-white/10'
                  }`}
                  style={{ backgroundColor: c.bg }}
                  title={c.label}
                />
              ))}
              <button
                type="button"
                onClick={() => setColor(null)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  color === null
                    ? 'ring-2 ring-offset-2 ring-purple-500 dark:ring-offset-card-dark bg-gray-100 dark:bg-white/[0.08]'
                    : 'ring-1 ring-black/10 dark:ring-white/15 text-gray-400 dark:text-white/40'
                }`}
                title="색상 제거"
              >
                <span className="material-icons-round text-[18px]">block</span>
              </button>
            </div>
          </div>

          {/* 묵상 메모 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">
                묵상 메모 <span className="font-medium text-gray-400 dark:text-white/40">(선택)</span>
              </p>
              <span className="text-[11px] text-gray-400 dark:text-white/35">{charCount} / 2000</span>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 2000))}
              rows={5}
              placeholder="이 구절이 마음에 와닿은 이유나 받은 은혜를 적어보세요..."
              className="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] leading-[1.65] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 resize-y min-h-[120px] focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
            />
          </div>

          {/* 즐겨찾기 토글 */}
          <div className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-white/80 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08]">
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-gray-900 dark:text-white">
                ⭐ 즐겨찾기에 추가
              </p>
              <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-0.5">
                내 프로필 묵상 노트에서 모아볼 수 있어요
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isFavorite}
              onClick={() => setIsFavorite((v) => !v)}
              className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${
                isFavorite
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                  : 'bg-gray-300 dark:bg-white/[0.1]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  isFavorite ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
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
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(168,85,247,0.7)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
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

export default VerseBookmarkModal

export const HIGHLIGHT_COLOR_BG: Record<HighlightColor, string> = {
  yellow: '#fef08a',
  orange: '#fed7aa',
  pink: '#fbcfe8',
  blue: '#bfdbfe',
  green: '#bbf7d0',
}
