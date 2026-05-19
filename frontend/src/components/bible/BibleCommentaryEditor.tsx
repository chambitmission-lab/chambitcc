import { useEffect, useState } from 'react'
import { Markdown } from '../../utils/markdown'
import {
  COMMENTARY_CATEGORIES,
  type BibleCommentary,
  type BibleCommentaryCreateRequest,
} from '../../types/bibleCommentary'

interface BibleCommentaryEditorProps {
  bookNumber: number
  chapter: number
  totalVerses?: number
  initialVerseStart: number
  initialVerseEnd?: number
  existing?: BibleCommentary | null
  saving?: boolean
  errorMessage?: string | null
  onSave: (payload: BibleCommentaryCreateRequest) => void
  onClose: () => void
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.55)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  zIndex: 1100,
}

const panel: React.CSSProperties = {
  width: '100%',
  maxWidth: '560px',
  background: 'var(--ig-primary-background, #fff)',
  color: 'var(--ig-primary-text, #111)',
  borderTopLeftRadius: '1rem',
  borderTopRightRadius: '1rem',
  padding: '1rem 1rem 1.25rem',
  maxHeight: '92vh',
  overflowY: 'auto',
  boxShadow: '0 -8px 28px rgba(0,0,0,0.25)',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--ig-secondary-text, #666)',
  marginBottom: '0.25rem',
  display: 'block',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.625rem',
  border: '1px solid var(--ig-border, #ddd)',
  borderRadius: '0.5rem',
  background: 'var(--ig-secondary-background, #fafafa)',
  color: 'inherit',
  fontSize: '0.9375rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const BibleCommentaryEditor = ({
  bookNumber,
  chapter,
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

  return (
    <div style={overlay} onClick={onClose}>
      <form
        style={panel}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>
            {isEditing ? '해석 수정' : '해석 추가'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              color: 'var(--ig-secondary-text, #666)',
            }}
            aria-label="닫기"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.625rem',
            marginBottom: '0.625rem',
          }}
        >
          <div>
            <label style={labelStyle}>시작 절</label>
            <input
              type="number"
              min={1}
              max={totalVerses}
              value={verseStart}
              onChange={(e) => setVerseStart(Math.max(1, parseInt(e.target.value) || 1))}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>끝 절</label>
            <input
              type="number"
              min={verseStart}
              max={totalVerses}
              value={verseEnd}
              onChange={(e) => setVerseEnd(Math.max(verseStart, parseInt(e.target.value) || verseStart))}
              style={inputStyle}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '0.625rem' }}>
          <label style={labelStyle}>제목 (선택)</label>
          <input
            type="text"
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 창조의 시작 — 만물의 근원"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '0.625rem' }}>
          <label style={labelStyle}>카테고리 (선택)</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
          >
            <option value="">선택 안 함</option>
            {COMMENTARY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.25rem',
            }}
          >
            <label style={{ ...labelStyle, marginBottom: 0 }}>본문 (마크다운 지원)</label>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              style={{
                background: 'transparent',
                border: '1px solid var(--ig-border, #ddd)',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.625rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                color: 'var(--ig-secondary-text, #666)',
              }}
            >
              {showPreview ? '편집' : '미리보기'}
            </button>
          </div>

          {showPreview ? (
            <div
              style={{
                minHeight: '200px',
                padding: '0.75rem',
                border: '1px solid var(--ig-border, #ddd)',
                borderRadius: '0.5rem',
                background: 'var(--ig-secondary-background, #fafafa)',
              }}
            >
              {content.trim() ? (
                <Markdown source={content} />
              ) : (
                <span style={{ color: '#aaa' }}>미리보기할 내용이 없습니다</span>
              )}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              required
              placeholder={`# 제목\n\n**핵심 단어**, *원어 분석*\n\n- 요점 1\n- 요점 2\n\n> 적용 묵상`}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: '200px',
                fontFamily: 'ui-monospace, "Cascadia Code", "Consolas", monospace',
                fontSize: '0.875rem',
                lineHeight: 1.55,
              }}
            />
          )}
          <div
            style={{
              fontSize: '0.6875rem',
              color: 'var(--ig-secondary-text, #888)',
              marginTop: '0.25rem',
            }}
          >
            지원: # 제목 / **굵게** / *기울임* / - 리스트 / &gt; 인용 / 빈 줄로 문단
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              background: 'rgba(220,38,38,0.08)',
              color: '#b91c1c',
              padding: '0.5rem 0.625rem',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              marginBottom: '0.5rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--ig-border, #ddd)',
              background: 'transparent',
              cursor: saving ? 'not-allowed' : 'pointer',
              color: 'var(--ig-secondary-text, #666)',
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving || !content.trim()}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              fontWeight: 600,
              cursor: saving || !content.trim() ? 'not-allowed' : 'pointer',
              opacity: saving || !content.trim() ? 0.6 : 1,
            }}
          >
            {saving ? '저장 중...' : isEditing ? '수정 저장' : '추가'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default BibleCommentaryEditor
