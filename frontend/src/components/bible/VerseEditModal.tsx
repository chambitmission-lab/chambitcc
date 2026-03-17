import { useState } from 'react'
import type { BibleVerse } from '../../types/bible'
import './VerseEditModal.css'

interface VerseEditModalProps {
  verse: BibleVerse
  onSave: (verseId: number, newText: string) => Promise<void>
  onClose: () => void
}

const VerseEditModal = ({ verse, onSave, onClose }: VerseEditModalProps) => {
  const [text, setText] = useState(verse.text)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    // 빈 텍스트 방지
    if (!text.trim()) {
      setError('구절 내용을 입력해주세요')
      return
    }

    // 변경사항 없음
    if (text === verse.text) {
      onClose()
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(verse.id, text)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="verse-edit-modal-overlay" onClick={onClose}>
      <div className="verse-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="verse-edit-modal-header">
          <h3>성경 구절 수정</h3>
          <button 
            className="verse-edit-modal-close"
            onClick={onClose}
            disabled={isSaving}
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="verse-edit-modal-body">
          <div className="verse-edit-info">
            <span className="verse-edit-reference">
              {verse.book_name_ko} {verse.chapter}:{verse.verse}
            </span>
          </div>

          <div className="verse-edit-form-group">
            <label htmlFor="verse-text">구절 내용</label>
            <textarea
              id="verse-text"
              className="verse-edit-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              disabled={isSaving}
              placeholder="구절 내용을 입력하세요"
            />
          </div>

          {error && (
            <div className="verse-edit-error">
              <span className="material-icons-round">error</span>
              {error}
            </div>
          )}

          <div className="verse-edit-warning">
            <span className="material-icons-round">warning</span>
            <span>관리자 권한으로 성경 구절을 수정합니다. 신중하게 입력해주세요.</span>
          </div>
        </div>

        <div className="verse-edit-modal-footer">
          <button
            className="verse-edit-btn verse-edit-btn-cancel"
            onClick={onClose}
            disabled={isSaving}
          >
            취소
          </button>
          <button
            className="verse-edit-btn verse-edit-btn-save"
            onClick={handleSave}
            disabled={isSaving || !text.trim()}
          >
            {isSaving ? (
              <>
                <span className="verse-edit-spinner"></span>
                저장 중...
              </>
            ) : (
              <>
                <span className="material-icons-round">save</span>
                저장
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerseEditModal
