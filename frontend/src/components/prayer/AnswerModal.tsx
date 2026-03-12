// 기도 응답 모달 - 간증 작성
import { useState } from 'react'

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
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-background-light dark:bg-background-dark rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border-light dark:border-border-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">기도 응답 간증</h2>
          </div>
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-full relative group transition-all"
            onClick={onClose}
          >
            {/* 빛나는 효과 */}
            <div className="absolute inset-0 rounded-full bg-purple-500/20 dark:bg-yellow-400/20 blur-2xl scale-150 group-hover:scale-[2] animate-pulse transition-transform duration-500"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/50 via-pink-400/50 to-purple-500/50 dark:from-yellow-300/50 dark:via-orange-300/50 dark:to-yellow-400/50 blur-xl scale-125 group-hover:scale-150 animate-pulse transition-transform duration-300"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/70 to-pink-500/70 dark:from-yellow-400/70 dark:to-orange-400/70 blur-lg group-hover:blur-xl animate-pulse"></div>
            <div className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/50 blur-sm animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 dark:from-yellow-400 dark:to-orange-400 opacity-80 group-hover:opacity-100 shadow-[0_0_30px_rgba(168,85,247,0.8)] dark:shadow-[0_0_40px_rgba(250,204,21,0.9)] group-hover:shadow-[0_0_50px_rgba(168,85,247,1)] dark:group-hover:shadow-[0_0_60px_rgba(250,204,21,1)] transition-all"></div>
            
            <span className="relative z-10 text-white text-2xl font-light drop-shadow-[0_0_15px_rgba(255,255,255,1)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,1)] transition-all group-hover:scale-110 group-hover:rotate-90 duration-300">
              ×
            </span>
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              기도 제목
            </label>
            <div className="p-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white">
              {prayerTitle}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              간증 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={testimony}
              onChange={(e) => setTestimony(e.target.value)}
              placeholder="하나님께서 어떻게 응답하셨는지 나눠주세요...&#10;&#10;예시:&#10;- 구체적으로 어떤 일이 일어났나요?&#10;- 언제 응답을 받으셨나요?&#10;- 어떤 마음이 드셨나요?"
              rows={8}
              maxLength={500}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {testimony.length} / 500
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button 
              type="button"
              className="flex-1 px-4 py-2 bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 font-bold text-sm rounded-full border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              onClick={onClose}
            >
              취소
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!testimony.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>✨</span>
              응답 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnswerModal
