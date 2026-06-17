import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useChapterCommentaries,
  useCreateCommentary,
  useDeleteCommentary,
  useUpdateCommentary,
} from '../../hooks/useBibleCommentary'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import type {
  BibleCommentary,
  BibleCommentaryCreateRequest,
} from '../../types/bibleCommentary'
import BibleCommentaryEditor from './BibleCommentaryEditor'
import BibleCommentaryItem from './BibleCommentaryItem'

interface BibleCommentaryPanelProps {
  bookNumber: number
  chapter: number
  bookNameKo: string
  /** 패널이 열려있을 때 표시할 절 번호 (이 절을 포함하는 해석만 보여줌). null 이면 장 전체 */
  focusVerse: number | null
  totalVerses?: number
  onClose: () => void
}

const BibleCommentaryPanel = ({
  bookNumber,
  chapter,
  bookNameKo,
  focusVerse,
  totalVerses,
  onClose,
}: BibleCommentaryPanelProps) => {
  const admin = isAdmin()
  const { data, isLoading } = useChapterCommentaries(bookNumber, chapter)

  const createMutation = useCreateCommentary()
  const updateMutation = useUpdateCommentary()
  const deleteMutation = useDeleteCommentary()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<BibleCommentary | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 모바일/브라우저 뒤로가기로 홈까지 나가버리지 않고 이 패널만 닫히도록 처리
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    window.history.pushState({ bibleCommentaryPanel: true }, '')
    const handlePop = () => onCloseRef.current()
    window.addEventListener('popstate', handlePop)
    return () => {
      window.removeEventListener('popstate', handlePop)
      // 버튼/배경 클릭으로 닫혔다면 우리가 쌓은 히스토리 항목을 되돌려 정리
      if (window.history.state?.bibleCommentaryPanel) {
        window.history.back()
      }
    }
  }, [])

  const filtered = useMemo(() => {
    const all = data?.items ?? []
    if (focusVerse == null) return all
    return all.filter(
      (c) => c.verse_start <= focusVerse && c.verse_end >= focusVerse,
    )
  }, [data, focusVerse])

  const headerLabel =
    focusVerse != null
      ? `${bookNameKo} ${chapter}:${focusVerse}`
      : `${bookNameKo} ${chapter}장`

  const handleCreateClick = () => {
    setEditing(null)
    setErrorMessage(null)
    setEditorOpen(true)
  }

  const handleEditClick = (c: BibleCommentary) => {
    setEditing(c)
    setErrorMessage(null)
    setEditorOpen(true)
  }

  const handleDelete = async (c: BibleCommentary) => {
    if (!confirm(`이 해석을 삭제할까요?\n${c.title || c.content.slice(0, 30)}`)) {
      return
    }
    try {
      await deleteMutation.mutateAsync({
        id: c.id,
        bookNumber: c.book_number,
        chapter: c.chapter,
      })
      showToast('해석이 삭제되었습니다', 'success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '삭제 실패'
      showToast(msg, 'error')
    }
  }

  const handleSave = async (payload: BibleCommentaryCreateRequest) => {
    try {
      setErrorMessage(null)
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          payload: {
            verse_start: payload.verse_start,
            verse_end: payload.verse_end,
            title: payload.title,
            category: payload.category,
            content: payload.content,
          },
        })
        showToast('해석이 수정되었습니다', 'success')
      } else {
        await createMutation.mutateAsync(payload)
        showToast('해석이 추가되었습니다', 'success')
      }
      setEditorOpen(false)
      setEditing(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장 실패'
      setErrorMessage(msg)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
        onClick={onClose}
      >
        <section
          className="relative w-full sm:max-w-lg max-h-[85vh] sm:max-h-[88vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_rgba(168,85,247,0.18)] flex flex-col"
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
              <span className="material-icons-round text-[22px]">menu_book</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-purple-600/80 dark:text-purple-300/80 text-[10.5px] font-bold tracking-[0.1em]">
                말씀 해석
              </p>
              <h3 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em] truncate">
                {headerLabel}
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-purple-500 dark:hover:text-purple-300 transition-colors shrink-0"
            >
              <span className="material-icons-round text-[20px]">close</span>
            </button>
          </div>

          {/* 본문 */}
          <div className="relative z-10 flex-1 overflow-y-auto px-5 py-4">
            {isLoading && (
              <div className="text-center py-10 text-gray-400 dark:text-white/45">
                <span className="material-icons-round animate-spin text-[28px]">refresh</span>
                <p className="mt-2 text-[13.5px]">해석 불러오는 중...</p>
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-12 px-4 text-gray-400 dark:text-white/45">
                <span className="material-icons-round text-[40px] opacity-40">auto_stories</span>
                <p className="mt-2 text-[15px] text-gray-500 dark:text-white/55">
                  아직 등록된 해석이 없습니다
                </p>
                {admin && (
                  <p className="mt-1 text-[13px]">
                    아래 버튼으로 첫 해석을 추가해보세요
                  </p>
                )}
              </div>
            )}

            {!isLoading &&
              filtered.map((c) => (
                <BibleCommentaryItem
                  key={c.id}
                  commentary={c}
                  isAdmin={admin}
                  onEdit={handleEditClick}
                  onDelete={handleDelete}
                />
              ))}
          </div>

          {/* 관리자: 해석 추가 */}
          {admin && (
            <div className="relative z-10 px-5 py-3 border-t border-black/[0.04] dark:border-white/[0.06] bg-background-light/95 dark:bg-card-dark/95 backdrop-blur-sm">
              <button
                onClick={handleCreateClick}
                className="w-full inline-flex items-center justify-center gap-1.5 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[14px] font-bold shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(168,85,247,0.7)] transition-all"
              >
                <span className="material-icons-round text-[19px]">add</span>
                해석 추가
              </button>
            </div>
          )}
        </section>
      </div>

      {editorOpen && (
        <BibleCommentaryEditor
          bookNumber={bookNumber}
          chapter={chapter}
          totalVerses={totalVerses}
          initialVerseStart={focusVerse ?? 1}
          initialVerseEnd={focusVerse ?? 1}
          existing={editing}
          saving={createMutation.isPending || updateMutation.isPending}
          errorMessage={errorMessage}
          onSave={handleSave}
          onClose={() => {
            setEditorOpen(false)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

export default BibleCommentaryPanel
