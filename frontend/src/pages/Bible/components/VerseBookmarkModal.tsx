import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { createPortal } from 'react-dom'
import type { HighlightColor, VerseBookmark } from '../../../api/bibleBookmark'
import { useUpsertBookmark, useDeleteBookmark } from '../../../hooks/useBibleBookmark'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { showToast } from '../../../utils/toast'
import { SheetGrabber } from '../../../components/common/SheetGrabber'

interface VerseBookmarkModalProps {
  verseId: number
  verseReference: string // 예: "요한복음 3:16"
  verseText: string
  existing: VerseBookmark | null
  onClose: () => void
}

/** 형광펜 색 → CSS 변수. 실제 값은 theme.css의 --hl-* 토큰이 라이트/다크로 분기한다.
    hex가 아니므로 알파 이어붙이기(`${bg}26`) 대신 color-mix로 투명도를 섞어야 한다. */
export const HIGHLIGHT_COLOR_BG: Record<HighlightColor, string> = {
  yellow: 'var(--hl-yellow)',
  orange: 'var(--hl-orange)',
  pink: 'var(--hl-pink)',
  blue: 'var(--hl-blue)',
  green: 'var(--hl-green)',
}

const COLORS: { value: HighlightColor; label: string; bg: string }[] = [
  { value: 'yellow', label: '노랑', bg: HIGHLIGHT_COLOR_BG.yellow },
  { value: 'orange', label: '주황', bg: HIGHLIGHT_COLOR_BG.orange },
  { value: 'pink', label: '분홍', bg: HIGHLIGHT_COLOR_BG.pink },
  { value: 'blue', label: '파랑', bg: HIGHLIGHT_COLOR_BG.blue },
  { value: 'green', label: '초록', bg: HIGHLIGHT_COLOR_BG.green },
]

/** 빈 메모에서 첫 문장을 열어 주는 말머리 — 누르면 그 말로 시작한다 */
const STARTERS: { label: string; text: string }[] = [
  { label: '마음에 남은 말', text: '마음에 남은 말: ' },
  { label: '오늘 나에게', text: '오늘 나에게 주시는 말씀은 ' },
  { label: '기도로 바꾸면', text: '주님, ' },
]

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

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

  useEscapeKey(onClose)

  // 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        highlight_color: color,
        note: note.trim() || null,
        is_favorite: isFavorite,
      })
      showToast('묵상 노트가 저장되었어요 ✨', 'success')
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '저장에 실패했어요', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      // undefined = 통째 삭제 (프로필 탭별 삭제와 달리 여기선 형광펜·노트·즐겨찾기 전부)
      await del.mutateAsync(undefined)
      showToast('북마크가 삭제되었어요', 'success')
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '삭제에 실패했어요', 'error')
    }
  }

  const isBusy = upsert.isPending || del.isPending
  const charCount = note.length
  // 아무것도 고르지 않은 새 노트는 저장할 게 없다
  const isEmpty = color === null && !note.trim() && !isFavorite
  const canSave = !isBusy && (!!existing || !isEmpty)
  // 쓰던 메모가 있으면 바깥을 잘못 눌러도 닫히지 않는다(닫기·취소·Esc 로만)
  const noteDirty = note !== (existing?.note ?? '')

  const noteRef = useRef<HTMLTextAreaElement>(null)
  // PC 에서는 열자마자 바로 쓸 수 있게 — 모바일은 키보드가 말씀을 가리므로 그대로 둔다
  useEffect(() => {
    if (!window.matchMedia?.('(min-width: 1024px)').matches) return
    const el = noteRef.current
    if (!el) return
    el.focus({ preventScroll: true })
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])

  // Ctrl/⌘+Enter 저장 — 메모 칸 밖(색을 고른 직후 등)에서도 듣는다
  const saveRef = useRef<() => void>(() => {})
  useEffect(() => {
    saveRef.current = () => {
      if (canSave) void handleSave()
    }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        saveRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 삭제는 형광펜·메모·즐겨찾기를 통째로 지운다 — 한 번 더 눌러야 실행
  const [confirmDelete, setConfirmDelete] = useState(false)
  useEffect(() => {
    if (!confirmDelete) return
    const t = setTimeout(() => setConfirmDelete(false), 3500)
    return () => clearTimeout(t)
  }, [confirmDelete])

  const startWith = (text: string) => {
    setNote(text)
    requestAnimationFrame(() => {
      const el = noteRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(text.length, text.length)
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 sheet-backdrop sm:p-4 overflow-hidden"
      onClick={noteDirty ? undefined : onClose}
    >
      <div
        className="pc-scale-sheet relative w-full sm:max-w-md lg:max-w-[880px] lg:h-[540px] sheet-rise max-h-[94dvh] sm:max-h-[90dvh] bg-surface-container rounded-t-[28px] sm:rounded-[28px] overflow-hidden border border-[var(--card-border)] shadow-[0_-12px_40px_rgba(0,0,0,0.35)] sm:shadow-[0_24px_64px_rgba(0,0,0,0.45)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${verseReference} 묵상 노트`}
      >
        {/* 헤더 — 장식 없이 어느 절인지만 */}
        <div className="relative shrink-0 flex items-center gap-3 pl-6 pr-4 pt-5 pb-3 lg:pl-8 lg:pr-5 lg:pt-6">
          <SheetGrabber onClose={onClose} className="w-9 h-1 rounded-full bg-[var(--text-muted)]/40 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="min-w-0 flex-1">
            <p className="text-brand text-[11px] font-bold tracking-[0.14em]">묵상 노트</p>
            <h3 className="text-ink-strong text-[19px] lg:text-[21px] font-bold tracking-[-0.025em] truncate">
              {verseReference}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-ink-muted hover:bg-[var(--surface-inset)] transition-colors shrink-0"
            aria-label="닫기"
          >
            <span className="material-icons-round text-[22px]">close</span>
          </button>
        </div>

        {/* 본문 — PC(lg+)는 2단: 왼쪽은 말씀과 표시(형광펜·즐겨찾기), 오른쪽은 메모가 높이 전체.
            모바일은 말씀 → 표시 → 메모 순서로 한 줄기 */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-2 pb-5 flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-x-7 lg:gap-y-5 lg:px-8 lg:pb-6 lg:overflow-hidden">
          {/* 말씀 — 고른 형광펜 색이 그 자리에서 칠해진다(본문에 보일 모습 그대로) */}
          <blockquote
            className="m-0 rounded-[20px] bg-[var(--surface-inset)] px-5 py-4 text-[16px] leading-[1.9] text-ink lg:col-start-1 lg:row-start-1 lg:px-6 lg:py-5 lg:text-[18px] lg:leading-[2] lg:overflow-y-auto"
            style={{ fontFamily: "var(--bible-font-family, 'Noto Serif KR', 'Nanum Myeongjo', serif)" }}
          >
            <span
              className="rounded-[4px] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] px-0.5 transition-colors duration-300"
              style={{
                backgroundColor: color
                  ? `color-mix(in srgb, ${HIGHLIGHT_COLOR_BG[color]} 38%, transparent)`
                  : 'transparent',
              } as CSSProperties}
            >
              {verseText}
            </span>
          </blockquote>

          {/* 표시 — 형광펜 색과 즐겨찾기를 한 줄에 */}
          <div className="flex items-center justify-between gap-3 flex-wrap lg:col-start-1 lg:row-start-2">
            <div className="flex items-center gap-2.5" role="group" aria-label="형광펜 색">
              {COLORS.map((c) => {
                const on = color === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    aria-label={`형광펜 ${c.label}`}
                    aria-pressed={on}
                    title={c.label}
                    className={`w-9 h-9 rounded-full grid place-items-center transition-transform duration-200 ${
                      on ? 'scale-[1.14] ring-2 ring-black/20 dark:ring-white/45' : 'ring-1 ring-black/[0.06] dark:ring-white/10 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.bg }}
                  >
                    <span
                      className={`material-icons-round text-[18px] text-black/60 transition-opacity ${on ? 'opacity-100' : 'opacity-0'}`}
                      aria-hidden
                    >
                      check
                    </span>
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setColor(null)}
                aria-label="형광펜 없이"
                aria-pressed={color === null}
                title="형광펜 없이"
                className={`w-9 h-9 rounded-full grid place-items-center transition-colors ${
                  color === null
                    ? 'bg-[var(--surface-inset)] text-ink ring-2 ring-black/20 dark:ring-white/45'
                    : 'text-ink-muted ring-1 ring-black/10 dark:ring-white/15 hover:bg-[var(--surface-inset)]'
                }`}
              >
                <span className="material-icons-round text-[18px]" aria-hidden>block</span>
              </button>
            </div>

            <button
              type="button"
              aria-pressed={isFavorite}
              onClick={() => setIsFavorite((v) => !v)}
              title="내 프로필 묵상 노트에서 모아볼 수 있어요"
              className={`inline-flex items-center gap-1 h-9 pl-2.5 pr-3.5 rounded-full text-[13px] font-bold transition-colors ${
                isFavorite
                  ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300'
                  : 'bg-[var(--surface-inset)] text-ink-muted hover:text-ink'
              }`}
            >
              <span
                className={`material-icons-round text-[18px] transition-transform duration-200 ${
                  isFavorite ? 'text-amber-500 scale-110' : 'opacity-50'
                }`}
                aria-hidden
              >
                star
              </span>
              {isFavorite ? '즐겨찾기에 담음' : '즐겨찾기'}
            </button>
          </div>

          {/* 메모 */}
          <div className="relative flex flex-col lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:min-h-0">
            <textarea
              ref={noteRef}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 2000))}
              rows={5}
              aria-label="묵상 메모"
              placeholder="이 말씀이 마음에 닿은 까닭을 적어 보세요"
              className="w-full px-4 pt-3.5 pb-12 rounded-[20px] border border-[var(--card-border)] bg-transparent text-[15px] leading-[1.75] text-ink-strong placeholder:text-ink-muted resize-none min-h-[150px] focus:outline-none focus:border-brand transition-colors lg:flex-1 lg:min-h-0 lg:px-5 lg:pt-4 lg:text-[16.5px] lg:leading-[1.85]"
            />
            {/* 칸 아래쪽 — 비어 있으면 말머리, 쓰기 시작하면 글자 수 */}
            <div className="absolute inset-x-3 bottom-2.5 flex items-center gap-1.5 pointer-events-none">
              {note.trim() === '' &&
                STARTERS.map((st) => (
                  <button
                    key={st.label}
                    type="button"
                    onClick={() => startWith(st.text)}
                    className="pointer-events-auto h-8 px-3 rounded-full bg-[var(--surface-inset)] text-[12.5px] font-semibold text-ink-muted hover:text-brand transition-colors whitespace-nowrap"
                  >
                    {st.label}
                  </button>
                ))}
              {note.trim() !== '' && (
                <span
                  className={`ml-auto pr-1.5 text-[11.5px] tabular-nums ${
                    charCount >= 1900 ? 'text-red-500 font-bold' : 'text-ink-muted'
                  }`}
                >
                  {charCount} / 2000
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="shrink-0 border-t border-[var(--card-border)] px-5 py-3 lg:px-7 flex items-center gap-2">
          {existing && (
            <button
              onClick={confirmDelete ? handleDelete : () => setConfirmDelete(true)}
              disabled={isBusy}
              className={`inline-flex items-center gap-1 px-3 h-11 rounded-full text-[13px] font-bold transition-colors disabled:opacity-50 ${
                confirmDelete
                  ? 'bg-red-500/12 text-red-600 dark:text-red-300'
                  : 'text-ink-muted hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/10'
              }`}
            >
              <span className="material-icons-round text-[18px]">delete_outline</span>
              {confirmDelete ? '한 번 더 누르면 지워져요' : '삭제'}
            </button>
          )}
          <span className="hidden lg:inline text-[12px] text-ink-muted ml-auto mr-1">
            {IS_MAC ? '⌘' : 'Ctrl'} + Enter 로 저장
          </span>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="ml-auto lg:ml-0 px-4 h-11 rounded-full text-ink text-[14px] font-semibold hover:bg-[var(--surface-inset)] transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center gap-1.5 px-6 h-11 rounded-full bg-brand text-white text-[14px] font-bold transition-opacity disabled:opacity-35 disabled:cursor-not-allowed"
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
