import { useEffect, useState } from 'react'
import { Markdown } from '../../utils/markdown'
import {
  COMMENTARY_CATEGORIES,
  type BibleCommentary,
  type BibleCommentaryCategory,
  type BibleCommentaryCreateRequest,
} from '../../types/bibleCommentary'
import './BibleCommentaryPanel.css'

interface BibleCommentaryEditorProps {
  bookNumber: number
  chapter: number
  bookNameKo?: string
  totalVerses?: number
  initialVerseStart: number
  initialVerseEnd?: number
  existing?: BibleCommentary | null
  saving?: boolean
  errorMessage?: string | null
  onSave: (payload: BibleCommentaryCreateRequest) => void
  onClose: () => void
}

const CATEGORY_ICONS: Record<BibleCommentaryCategory, string> = {
  신학적: 'church',
  역사적: 'account_balance',
  원어: 'translate',
  적용: 'eco',
  묵상: 'self_improvement',
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(11, 11, 18, 0.78)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  zIndex: 1100,
  animation: 'commentary-overlay-in 0.22s ease-out',
}

const panel: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '560px',
  background: '#1c1c26',
  color: '#f5f3ff',
  borderTopLeftRadius: '24px',
  borderTopRightRadius: '24px',
  padding: '18px 20px 22px',
  maxHeight: '94vh',
  overflowY: 'auto',
  boxShadow:
    '0 -16px 60px rgba(168, 85, 247, 0.18), inset 0 1px 0 rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderBottom: 'none',
  animation: 'commentary-panel-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
}

const BibleCommentaryEditor = ({
  bookNumber,
  chapter,
  bookNameKo,
  totalVerses,
  initialVerseStart,
  initialVerseEnd,
  existing,
  saving,
  errorMessage,
  onSave,
  onClose,
}: BibleCommentaryEditorProps) => {
  const [verseStart, setVerseStart] = useState<number>(
    existing?.verse_start ?? initialVerseStart,
  )
  const [verseEnd, setVerseEnd] = useState<number>(
    existing?.verse_end ?? initialVerseEnd ?? initialVerseStart,
  )
  const [title, setTitle] = useState<string>(existing?.title ?? '')
  const [category, setCategory] = useState<string>(existing?.category ?? '')
  const [content, setContent] = useState<string>(existing?.content ?? '')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (verseEnd < verseStart) {
      setVerseEnd(verseStart)
    }
  }, [verseStart, verseEnd])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const isEditing = !!existing

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    onSave({
      book_number: bookNumber,
      chapter,
      verse_start: verseStart,
      verse_end: verseEnd,
      title: title.trim() || undefined,
      category: category || undefined,
      content: content.trim(),
    })
  }

  const referenceLine = bookNameKo
    ? `${bookNameKo} ${chapter}장 · ${verseStart}${verseEnd !== verseStart ? `-${verseEnd}` : ''}절`
    : `${chapter}장 · ${verseStart}${verseEnd !== verseStart ? `-${verseEnd}` : ''}절`

  return (
    <div style={overlay} onClick={onClose}>
      <form
        style={panel}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 38,
            height: 4,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.18)',
          }}
        />

        {/* 헤더 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 18,
            marginTop: 6,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '3px 9px',
                borderRadius: 999,
                background: 'rgba(168, 85, 247, 0.18)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                color: '#e9d5ff',
                marginBottom: 6,
              }}
            >
              {isEditing ? 'EDIT' : 'COMPOSE'}
            </span>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.015em',
                color: '#f5f3ff',
              }}
            >
              {isEditing ? '해설 수정' : '함께 묵상 해설 추가'}
            </h3>
            <p
              style={{
                fontSize: 12.5,
                color: 'rgba(196, 181, 253, 0.75)',
                margin: '4px 0 0',
              }}
            >
              {referenceLine}
            </p>
          </div>
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

        {/* 절 범위 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div>
            <label className="commentary-label">시작 절</label>
            <input
              type="number"
              min={1}
              max={totalVerses}
              value={verseStart}
              onChange={(e) =>
                setVerseStart(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="commentary-input"
              required
            />
          </div>
          <div>
            <label className="commentary-label">끝 절</label>
            <input
              type="number"
              min={verseStart}
              max={totalVerses}
              value={verseEnd}
              onChange={(e) =>
                setVerseEnd(
                  Math.max(verseStart, parseInt(e.target.value) || verseStart),
                )
              }
              className="commentary-input"
              required
            />
          </div>
        </div>

        {/* 제목 */}
        <div style={{ marginBottom: 14 }}>
          <label className="commentary-label">제목 (선택)</label>
          <input
            type="text"
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 창조의 시작 — 만물의 근원"
            className="commentary-input"
          />
        </div>

        {/* 카테고리 pill grid */}
        <div style={{ marginBottom: 14 }}>
          <label className="commentary-label">카테고리</label>
          <div className="commentary-cat-pill-grid">
            <button
              type="button"
              className={`commentary-cat-pill${category === '' ? ' is-selected' : ''}`}
              onClick={() => setCategory('')}
            >
              <span className="material-icons-round">remove_circle_outline</span>
              없음
            </button>
            {COMMENTARY_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`commentary-cat-pill${category === c ? ' is-selected' : ''}`}
                onClick={() => setCategory(c)}
              >
                <span className="material-icons-round">{CATEGORY_ICONS[c]}</span>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 본문 */}
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <label className="commentary-label" style={{ marginBottom: 0 }}>
              본문 (마크다운 지원)
            </label>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              style={{
                background: showPreview
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.28), rgba(236,72,153,0.18))'
                  : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: 999,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                color: '#e9d5ff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                className="material-icons-round"
                style={{ fontSize: 14 }}
              >
                {showPreview ? 'edit' : 'visibility'}
              </span>
              {showPreview ? '편집' : '미리보기'}
            </button>
          </div>

          {showPreview ? (
            <div
              className="commentary-item-body"
              style={{
                minHeight: 220,
                padding: 14,
                border: '1px solid rgba(168, 85, 247, 0.28)',
                borderRadius: 12,
                background: 'rgba(168, 85, 247, 0.05)',
              }}
            >
              {content.trim() ? (
                <Markdown source={content} />
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>
                  미리보기할 내용이 없습니다
                </span>
              )}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              required
              placeholder={`# 제목\n\n**핵심 단어**, *원어 분석*\n\n- 요점 1\n- 요점 2\n\n> 적용 묵상`}
              className="commentary-input commentary-textarea"
            />
          )}
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
              marginTop: 6,
            }}
          >
            지원: # 제목 / **굵게** / *기울임* / - 리스트 / &gt; 인용 / 빈 줄로 문단
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              background: 'rgba(239,68,68,0.12)',
              color: '#fca5a5',
              padding: '10px 12px',
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 12,
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* 액션 */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            marginTop: 4,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              cursor: saving ? 'not-allowed' : 'pointer',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving || !content.trim()}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              border: 'none',
              background:
                'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: 14,
              cursor: saving || !content.trim() ? 'not-allowed' : 'pointer',
              opacity: saving || !content.trim() ? 0.55 : 1,
              boxShadow: '0 6px 18px rgba(168, 85, 247, 0.45)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              className="material-icons-round"
              style={{ fontSize: 17 }}
            >
              {saving ? 'hourglass_empty' : isEditing ? 'check' : 'add'}
            </span>
            {saving ? '저장 중...' : isEditing ? '수정 저장' : '해설 추가'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default BibleCommentaryEditor
