import { useState } from 'react'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useSpeechRecognition } from '../../../../hooks/useSpeechRecognition'

interface ContentCardProps {
  title: string
  content: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
}

const ContentCard = ({ title, content, onTitleChange, onContentChange }: ContentCardProps) => {
  const { t } = useLanguage()
  const [voiceError, setVoiceError] = useState<string>('')
  const [titlePreview, setTitlePreview] = useState<string>('')
  const [contentPreview, setContentPreview] = useState<string>('')

  // 제목 음성 인식
  const titleVoice = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        // 최종 결과만 실제로 반영
        onTitleChange(transcript)
        setTitlePreview('')
      } else {
        // 중간 결과는 미리보기만
        setTitlePreview(transcript)
      }
    },
    onError: (error) => {
      setVoiceError(error)
      setTimeout(() => setVoiceError(''), 3000)
    },
    continuous: true,
  })

  // 내용 음성 인식
  const contentVoice = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        // 최종 결과만 실제로 반영
        onContentChange(transcript)
        setContentPreview('')
      } else {
        // 중간 결과는 미리보기만
        setContentPreview(transcript)
      }
    },
    onError: (error) => {
      setVoiceError(error)
      setTimeout(() => setVoiceError(''), 3000)
    },
    continuous: true,
  })

  const handleTitleStart = () => {
    // 내용 음성 인식이 실행 중이면 중지
    if (contentVoice.isListening) {
      contentVoice.stopListening()
    }
    
    // 제목 음성 인식 시작 - 현재 제목 텍스트를 전달
    setTitlePreview('')
    titleVoice.startListening(title)
  }

  const handleTitleStop = () => {
    titleVoice.stopListening()
    setTitlePreview('')
  }

  const handleContentStart = () => {
    // 제목 음성 인식이 실행 중이면 중지
    if (titleVoice.isListening) {
      titleVoice.stopListening()
    }
    
    // 내용 음성 인식 시작 - 현재 내용 텍스트를 전달
    setContentPreview('')
    contentVoice.startListening(content)
  }

  const handleContentStop = () => {
    contentVoice.stopListening()
    setContentPreview('')
  }
  
  return (
    <div className="relative mb-4">
      {/* 음성 인식 에러 메시지 */}
      {voiceError && (
        <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <span className="material-icons-outlined text-base">error</span>
          {voiceError}
        </div>
      )}

      {/* 기도 카드 - 글래스모피즘 */}
      <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-4 border border-white/60 dark:border-white/20 relative shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
        {/* 내부 빛 효과 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-2xl pointer-events-none -z-10"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-white/10 dark:to-white/5 rounded-full blur-2xl pointer-events-none -z-10"></div>
        
        {/* Title with Voice Input */}
        <div className="mb-3 relative z-20">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={titleVoice.isListening && titlePreview ? titlePreview : title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={t('prayerComposerTitlePlaceholder')}
              maxLength={100}
              required
              className={`
                flex-1 min-w-0 bg-transparent border-none text-sm font-extrabold text-gray-900 dark:text-white 
                placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none 
                drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] 
                uppercase py-1
                ${titleVoice.isListening ? 'animate-pulse' : ''}
              `}
            />
            <div className="flex items-center gap-1 flex-shrink-0">
              {!titleVoice.isListening ? (
                <button
                  type="button"
                  onClick={handleTitleStart}
                  disabled={!titleVoice.isSupported}
                  className="w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  title={titleVoice.isSupported ? (t('startVoiceInput') || '음성 입력 시작') : '음성 인식 미지원'}
                >
                  🎤
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTitleStop}
                  className="w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50 animate-pulse transition-all relative text-xl"
                  title={t('stopVoiceInput') || '음성 입력 중지'}
                >
                  ⏹️
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
                </button>
              )}
            </div>
          </div>
          {titleVoice.isListening && (
            <div className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1 animate-pulse">
              <span className="material-icons-outlined text-xs">mic</span>
              {t('listeningTitle') || '제목 음성 인식 중...'}
            </div>
          )}
        </div>

        {/* Content with Voice Input */}
        <div className="relative z-10">
          <div className="flex items-start gap-2">
            <textarea
              value={contentVoice.isListening && contentPreview ? contentPreview : content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder={t('prayerComposerContentPlaceholder')}
              rows={4}
              maxLength={1000}
              required
              className={`
                flex-1 bg-transparent border-none text-sm text-gray-600 dark:text-gray-400 
                placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none 
                leading-[1.5] drop-shadow-[0_0_6px_rgba(168,85,247,0.2)] 
                dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.25)] py-1
                ${contentVoice.isListening ? 'animate-pulse' : ''}
              `}
            />
            <div className="flex items-center gap-1 mt-1 flex-shrink-0">
              {!contentVoice.isListening ? (
                <button
                  type="button"
                  onClick={handleContentStart}
                  disabled={!contentVoice.isSupported}
                  className="w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  title={contentVoice.isSupported ? (t('startVoiceInput') || '음성 입력 시작') : '음성 인식 미지원'}
                >
                  🎤
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleContentStop}
                  className="w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50 animate-pulse transition-all relative text-xl"
                  title={t('stopVoiceInput') || '음성 입력 중지'}
                >
                  ⏹️
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
                </button>
              )}
            </div>
          </div>
          {contentVoice.isListening && (
            <div className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1 animate-pulse">
              <span className="material-icons-outlined text-xs">mic</span>
              {t('listeningContent') || '내용 음성 인식 중... (중지 버튼을 클릭하세요)'}
            </div>
          )}
          <div className="text-xs text-gray-400 dark:text-gray-500 text-right mt-0.5">
            {(contentVoice.isListening && contentPreview ? contentPreview : content).length}/1000
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentCard
