import { useState, useRef } from 'react'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useSpeechRecognition } from '../../../../hooks/useSpeechRecognition'
import VoiceInputButton from '../../../../components/common/VoiceInputButton'

interface ContentCardProps {
  title: string
  content: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
}

const ContentCard = ({ title, content, onTitleChange, onContentChange }: ContentCardProps) => {
  const { t } = useLanguage()
  const [voiceError, setVoiceError] = useState<string>('')
  
  // 음성 인식 시작 시점의 텍스트 저장
  const titleStartTextRef = useRef<string>('')
  const contentStartTextRef = useRef<string>('')

  // 제목 음성 인식
  const titleVoice = useSpeechRecognition({
    onResult: (transcript) => {
      // 시작 시점 텍스트 + 새로운 음성 인식 결과
      onTitleChange(titleStartTextRef.current + transcript)
    },
    onError: (error) => {
      setVoiceError(error)
      setTimeout(() => setVoiceError(''), 3000)
    },
    continuous: false,
  })

  // 내용 음성 인식
  const contentVoice = useSpeechRecognition({
    onResult: (transcript) => {
      // 시작 시점 텍스트 + 새로운 음성 인식 결과
      onContentChange(contentStartTextRef.current + transcript)
    },
    onError: (error) => {
      setVoiceError(error)
      setTimeout(() => setVoiceError(''), 3000)
    },
    continuous: true,
  })

  const handleTitleVoiceClick = () => {
    if (contentVoice.isListening) {
      contentVoice.stopListening()
    }
    
    if (!titleVoice.isListening) {
      // 시작할 때 현재 텍스트 저장
      titleStartTextRef.current = title
    }
    
    titleVoice.toggleListening()
  }

  const handleContentVoiceClick = () => {
    if (titleVoice.isListening) {
      titleVoice.stopListening()
    }
    
    if (!contentVoice.isListening) {
      // 시작할 때 현재 텍스트 저장
      contentStartTextRef.current = content
    }
    
    contentVoice.toggleListening()
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
      <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-4 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
        {/* 내부 빛 효과 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-2xl"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-white/10 dark:to-white/5 rounded-full blur-2xl"></div>
        
        {/* Title with Voice Input */}
        <div className="mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={t('prayerComposerTitlePlaceholder')}
              maxLength={100}
              required
              className={`
                flex-1 bg-transparent border-none text-sm font-extrabold text-gray-900 dark:text-white 
                placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none 
                drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] 
                uppercase py-1
                ${titleVoice.isListening ? 'animate-pulse' : ''}
              `}
            />
            <VoiceInputButton
              isListening={titleVoice.isListening}
              isSupported={titleVoice.isSupported}
              onClick={handleTitleVoiceClick}
              size="sm"
            />
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
              value={content}
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
            <VoiceInputButton
              isListening={contentVoice.isListening}
              isSupported={contentVoice.isSupported}
              onClick={handleContentVoiceClick}
              size="md"
              className="mt-1"
            />
          </div>
          {contentVoice.isListening && (
            <div className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1 animate-pulse">
              <span className="material-icons-outlined text-xs">mic</span>
              {t('listeningContent') || '내용 음성 인식 중... (다시 클릭하면 중지)'}
            </div>
          )}
          <div className="text-xs text-gray-400 dark:text-gray-500 text-right mt-0.5">
            {content.length}/1000
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentCard
