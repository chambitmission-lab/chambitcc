import { useMemo, useState } from 'react'
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

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  zIndex: 1000,
}

const panel: React.CSSProperties = {
  width: '100%',
  maxWidth: '560px',
  maxHeight: '85vh',
  background: 'var(--ig-primary-background, #fff)',
  color: 'var(--ig-primary-text, #111)',
  borderTopLeftRadius: '1rem',
  borderTopRightRadius: '1rem',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 -8px 28px rgba(0,0,0,0.25)',
  overflow: 'hidden',
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

  const filtered = useMemo(() => {
    const all = data?.items ?? []
    if (focusVerse == null) return all
    return all.filter(
      (c) => c.verse_start <= focusVerse && c.verse_end >= focusVerse,
    )
  }, [data, focusVerse])

  const headerLabel =
    focusVerse != null
      ? `${bookNameKo} ${chapter}:${focusVerse} 해석`
      : `${bookNameKo} ${chapter}장 해석`

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
      <div style={overlay} onClick={onClose}>
        <section style={panel} onClick={(e) => e.stopPropagation()}>
          <header
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--ig-border, rgba(0,0,0,0.08))',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06))',
            }}
          >
            <span className="material-icons-round" style={{ color: '#6366f1' }}>
              menu_book
            </span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, flex: 1 }}>
              {headerLabel}
            </h3>
            <button
              onClick={onClose}
              aria-label="닫기"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                color: 'var(--ig-secondary-text, #666)',
              }}
            >
              <span className="material-icons-round">close</span>
            </button>
          </header>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.875rem 1rem 1rem',
            }}
          >
            {isLoading && (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#888' }}>
                <span className="material-icons-round spinning">refresh</span>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  해석 불러오는 중...
                </p>
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2.5rem 1rem',
                  color: 'var(--ig-secondary-text, #888)',
                }}
              >
                <span
                  className="material-icons-round"
                  style={{ fontSize: '2.25rem', opacity: 0.35 }}
                >
                  auto_stories
                </span>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9375rem' }}>
                  아직 등록된 해석이 없습니다
                </p>
                {admin && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>
                    아래 + 버튼으로 첫 해석을 추가해보세요
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

          {admin && (
            <div
              style={{
                padding: '0.625rem 1rem',
                borderTop: '1px solid var(--ig-border, rgba(0,0,0,0.08))',
                background: 'var(--ig-primary-background, #fff)',
              }}
            >
              <button
                onClick={handleCreateClick}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  borderRadius: '0.625rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                }}
              >
                <span className="material-icons-round" style={{ fontSize: '1.125rem' }}>
                  add
                </span>
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
