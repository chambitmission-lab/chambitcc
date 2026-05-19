import { useEffect, useMemo, useState } from 'react'
import {
  useChapterCommentaries,
  useCreateCommentary,
  useDeleteCommentary,
  useUpdateCommentary,
} from '../../hooks/useBibleCommentary'
import { useTextToSpeech } from '../../hooks/useTextToSpeech'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import type {
  BibleCommentary,
  BibleCommentaryCreateRequest,
} from '../../types/bibleCommentary'
import type { BibleVerse } from '../../types/bible'
import BibleCommentaryEditor from './BibleCommentaryEditor'
import BibleCommentaryItem from './BibleCommentaryItem'
import './BibleCommentaryPanel.css'

interface BibleCommentaryPanelProps {
  bookNumber: number
  chapter: number
  bookNameKo: string
  /** 패널이 열려있을 때 포커스할 절 번호. null 이면 장 전체 */
  focusVerse: number | null
  totalVerses?: number
  /** 장 전체 절 데이터 — Hero 영역에 본문 표시 용도 */
  verses?: BibleVerse[]
  onClose: () => void
}

const BibleCommentaryPanel = ({
  bookNumber,
  chapter,
  bookNameKo,
  focusVerse,
  totalVerses,
  verses,
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

  // Hero TTS
  const heroTTS = useTextToSpeech({ rate: 0.95 })

  // Esc 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // 언마운트 시 TTS 중지
  const heroTTSStop = heroTTS.stop
  useEffect(() => {
    return () => {
      heroTTSStop()
    }
  }, [heroTTSStop])

  const allCommentaries = data?.items ?? []

  const filtered = useMemo(() => {
    if (focusVerse == null) return allCommentaries
    return allCommentaries.filter(
      (c) => c.verse_start <= focusVerse && c.verse_end >= focusVerse,
    )
  }, [allCommentaries, focusVerse])

  // Hero에 표시할 본문: focusVerse가 있으면 해당 절, 없으면 장 첫 절
  const heroVerseText = useMemo(() => {
    if (!verses || verses.length === 0) return null
    if (focusVerse != null) {
      const v = verses.find((vv) => vv.verse === focusVerse)
      return v?.text ?? null
    }
    return null
  }, [verses, focusVerse])

  const heroLabel = focusVerse != null ? '함께 묵상' : '장 전체 해설'
  const heroReference =
    focusVerse != null
      ? `${bookNameKo} ${chapter}:${focusVerse}`
      : `${bookNameKo} ${chapter}장`

  const handleHeroTTS = () => {
    if (!heroVerseText) return
    if (heroTTS.isPlaying) {
      heroTTS.stop()
    } else {
      heroTTS.speak(`${heroReference}. ${heroVerseText}`)
    }
  }

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
    if (!confirm(`이 해설을 삭제할까요?\n${c.title || c.content.slice(0, 30)}`)) {
      return
    }
    try {
      await deleteMutation.mutateAsync({
        id: c.id,
        bookNumber: c.book_number,
        chapter: c.chapter,
      })
      showToast('해설이 삭제되었습니다', 'success')
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
        showToast('해설이 수정되었습니다', 'success')
      } else {
        await createMutation.mutateAsync(payload)
        showToast('해설이 추가되었습니다', 'success')
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
      <div className="commentary-overlay" onClick={onClose}>
        <section
          className="commentary-panel"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={`${heroReference} 해설`}
        >
          <div className="commentary-drag-handle" />

          <div className="commentary-header">
            <button
              type="button"
              className="commentary-close-btn"
              onClick={onClose}
              aria-label="닫기"
            >
              <span className="material-icons-round" style={{ fontSize: 20 }}>
                close
              </span>
            </button>
          </div>

          {/* Hero — 절 본문 + 메타 */}
          <div className="commentary-hero">
            <div className="commentary-hero-top">
              <div className="commentary-hero-emblem">
                <span className="material-icons-round">auto_stories</span>
              </div>
              <div className="commentary-hero-meta">
                <span className="commentary-hero-label">{heroLabel}</span>
                <h2 className="commentary-hero-reference">{heroReference}</h2>
              </div>
            </div>

            {heroVerseText ? (
              <blockquote className="commentary-hero-quote">
                <span className="commentary-hero-quote-mark">“</span>
                <p className="commentary-hero-quote-text">{heroVerseText}</p>
              </blockquote>
            ) : (
              <p
                className="commentary-hero-quote-text"
                style={{ paddingLeft: 6 }}
              >
                이 장의 해설을 함께 묵상해봅니다.
              </p>
            )}

            <div className="commentary-hero-footer">
              <span className="commentary-hero-stat">
                <span
                  className="material-icons-round"
                  style={{ fontSize: 14, color: 'rgba(196,181,253,0.7)' }}
                >
                  menu_book
                </span>
                <span className="commentary-hero-stat-number">
                  {filtered.length}
                </span>
                개의 해설
              </span>
              {heroVerseText && heroTTS.isSupported && (
                <button
                  type="button"
                  className={`commentary-hero-tts-btn${heroTTS.isPlaying ? ' is-playing' : ''}`}
                  onClick={handleHeroTTS}
                  aria-label={heroTTS.isPlaying ? '낭독 정지' : '말씀 듣기'}
                >
                  <span className="material-icons-round">
                    {heroTTS.isPlaying ? 'stop_circle' : 'volume_up'}
                  </span>
                  {heroTTS.isPlaying ? '정지' : '말씀 듣기'}
                </button>
              )}
            </div>
          </div>

          {/* 본문 */}
          <div className="commentary-body">
            {isLoading && (
              <div className="commentary-loading">
                <span className="material-icons-round commentary-spinning">
                  refresh
                </span>
                <p style={{ marginTop: 10, fontSize: 13 }}>해설 불러오는 중...</p>
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="commentary-empty">
                <div className="commentary-empty-icon">
                  <span className="material-icons-round">menu_book</span>
                </div>
                <p className="commentary-empty-title">
                  아직 등록된 해설이 없습니다
                </p>
                <p className="commentary-empty-desc">
                  {admin
                    ? '아래 + 버튼으로 이 절의 첫 해설을 더해보세요.'
                    : '곧 목회자·교사가 해설을 더해드릴 거예요.'}
                </p>
              </div>
            )}

            {!isLoading &&
              filtered.map((c) => (
                <BibleCommentaryItem
                  key={c.id}
                  commentary={c}
                  bookNameKo={bookNameKo}
                  isAdmin={admin}
                  onEdit={handleEditClick}
                  onDelete={handleDelete}
                />
              ))}
          </div>

          {/* Compose FAB — 관리자 전용 */}
          {admin && (
            <button
              type="button"
              className="commentary-fab"
              onClick={handleCreateClick}
              title="해설 추가"
              aria-label="해설 추가"
            >
              <span className="material-icons-round">add</span>
            </button>
          )}
        </section>
      </div>

      {editorOpen && (
        <BibleCommentaryEditor
          bookNumber={bookNumber}
          chapter={chapter}
          bookNameKo={bookNameKo}
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
