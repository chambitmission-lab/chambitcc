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
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">묵상 노트</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{verseReference}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="닫기"
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {verseText}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
              하이라이트 색상
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-9 h-9 rounded-full border-2 transition-transform ${
                    color === c.value
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.bg }}
                  title={c.label}
                />
              ))}
              <button
                type="button"
                onClick={() => setColor(null)}
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${
                  color === null
                    ? 'border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-700'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                title="색상 제거"
              >
                <span className="material-icons-outlined text-sm text-gray-500">block</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
              묵상 메모 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 2000))}
              rows={5}
              placeholder="이 구절이 마음에 와닿은 이유나 받은 은혜를 적어보세요..."
              className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <div className="text-right text-xs text-gray-400 mt-1">{charCount} / 2000</div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="w-4 h-4 accent-pink-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">⭐ 즐겨찾기에 추가</span>
          </label>
        </div>

        <div className="px-5 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-between gap-2">
          {existing ? (
            <button
              onClick={handleDelete}
              disabled={isBusy}
              className="px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              삭제
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isBusy}
              className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isBusy}
              className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow hover:shadow-md transition-all disabled:opacity-50"
            >
              {isBusy ? '저장 중...' : '저장'}
            </button>
          </div>
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
