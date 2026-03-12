// 기도 응답 모달 - 간증 작성
import { useState } from 'react'
import './AnswerModal.css'

interface AnswerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (testimony: string) => void
  prayerTitle: string
}

const AnswerModal = ({ isOpen, onClose, onSubmit, prayerTitle }: AnswerModalProps) => {
  const [testimony, setTestimony] = useState('')
  
  if (!isOpen) return null
  
  const handleSubmit = () => {
    if (testimony.trim()) {
      onSubmit(testimony)
      setTestimony('')
      onClose()
    }
  }
  
  return (
    <div className="answer-modal-overlay" onClick={onClose}>
      <div className="answer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="answer-modal-header">
          <div className="header-icon">✨</div>
          <h2>기도 응답 간증</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="answer-modal-body">
          <div className="prayer-title-section">
            <label>기도 제목</label>
            <p className="prayer-title-display">{prayerTitle}</p>
          </div>
          
          <div className="testimony-section">
            <label htmlFor="testimony">
              간증 내용 <span className="required">*</span>
            </label>
            <textarea
              id="testimony"
              value={testimony}
              onChange={(e) => setTestimony(e.target.value)}
              placeholder="하나님께서 어떻게 응답하셨는지 나눠주세요...&#10;&#10;예시:&#10;- 구체적으로 어떤 일이 일어났나요?&#10;- 언제 응답을 받으셨나요?&#10;- 어떤 마음이 드셨나요?"
              rows={8}
              maxLength={500}
            />
            <div className="char-count">
              {testimony.length} / 500
            </div>
          </div>
        </div>
        
        <div className="answer-modal-footer">
          <button className="cancel-button" onClick={onClose}>
            취소
          </button>
          <button 
            className="submit-button" 
            onClick={handleSubmit}
            disabled={!testimony.trim()}
          >
            <span className="button-icon">✨</span>
            응답 등록
          </button>
        </div>
      </div>
    </div>
  )
}

export default AnswerModal
