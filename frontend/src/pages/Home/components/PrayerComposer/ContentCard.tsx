import { useState, useRef, useCallback } from 'react'
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
  const lastTitleRef = useRef<string>('')
  const lastContentRef = useRef<string>('')
  const isVoiceInputActiveRef = useRef<boolean>(false)  // 음성 입력 활성 상태

  // 안정적인 콜백 (메모이제이션)
  const handleTitleResult = useCallback((transcript: string, _isFinal: boolean) => {
    // useSpeechRecognition 훅에서 이미 중복 체크를 하므로 여기서는 바로 업데이트
    console.log('ContentCard: Title result:', transcript)
    lastTitleRef.current = transcript
    onTitleChange(transcript)
  }, [onTitleChange])

  const handleContentResult = useCallback((transcript: string, _isFinal: boolean) => {
    // useSpeechRecognition 훅에서 이미 중복 체크를 하므로 여기서는 바로 업데이트
    console.log('ContentCard: Content result:', transcript)
    lastContentRef.current = transcript
    onContentChange(transcript)
  }, [onContentChange])

  const handleError = useCallback((error: string) => {
    setVoiceError(error)
    setTimeout(() => setVoiceError(''), 3000)
  }, [])

  // 제목 음성 인식
  const titleVoice = useSpeechRecognition({
    onResult: handleTitleResult,
    onError: handleError,
    continuous: true,
  })

  // 내용 음성 인식
  const contentVoice = useSpeechRecognition({
    onResult: handleContentResult,
    onError: handleError,
    continuous: true,
  })

  const handleTitleStart = () => {
    // 내용 음성 인식이 실행 중이면 중지
    if (contentVoice.isListening) {
      contentVoice.stopListening()
      isVoiceInputActiveRef.current = false
    }
    
    // ref를 현재 값으로 설정 (중복 체크 초기화)
    lastTitleRef.current = ''
    isVoiceInputActiveRef.current = true
    
    // 제목 음성 인식 시작 - 현재 제목 텍스트를 전달
    titleVoice.startListening(title)
  }

  const handleTitleStop = () => {
    titleVoice.stopListening()
    lastTitleRef.current = ''
    isVoiceInputActiveRef.current = false
  }

  const handleContentStart = () => {
    // 제목 음성 인식이 실행 중이면 중지
    if (titleVoice.isListening) {
      titleVoice.stopListening()
      isVoiceInputActiveRef.current = false
    }
    
    // ref를 빈 문자열로 초기화 (중복 체크 방지)
    lastContentRef.current = ''
    isVoiceInputActiveRef.current = true
    
    // 내용 음성 인식 시작 - 현재 내용 텍스트를 전달
    contentVoice.startListening(content)
  }

  const handleContentStop = () => {
    contentVoice.stopListening()
    lastContentRef.current = ''
    isVoiceInputActiveRef.current = false
  }

  // 수동 입력 핸들러 (음성 입력 중이 아닐 때만 작동)
  const handleManualTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isVoiceInputActiveRef.current) {
      console.log('Ignoring manual title change during voice input')
      return
    }
    onTitleChange(e.target.value)
  }, [onTitleChange])

  const handleManualContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isVoiceInputActiveRef.current) {
      console.log('Ignoring manual content change during voice input')
      return
    }
    onContentChange(e.target.value)
  }, [onContentChange])
  
  return (
    <div className="relative mb-4">
      {/* 음성 인식 에러 메시지 */}
      {voiceError && (
        <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <span className="material-icons-outlined text-base">error</span>
          {voiceError}
        </div>
      )}

      {/* 기도 카드 — 카드 시스템과 동일 토큰 (#1c1c26 솔리드 + 그라데이션 한 겹 + 1px 상단 빛줄, 보라/핑크 글로우) */}
      <div className="relative bg-white/60 dark:bg-[#23232e] backdrop-blur-xl rounded-2xl p-5 border border-black/[0.04] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(168,85,247,0.10)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),0_8px_24px_rgba(168,85,247,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
        {/* 다크모드 카드 표면 그라데이션 */}
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl"></div>

        {/* 보랏빛/핑크 글로우 — 무채색 금지 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-purple-300/25 to-transparent dark:from-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/15 to-pink-400/15 dark:from-pink-500/15 dark:to-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        {/* Title with Voice Input — 한글 제목: uppercase 금지, 20px/700, leading 1.3 */}
        <div className="mb-4 relative z-20">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={handleManualTitleChange}
              placeholder={t('prayerComposerTitlePlaceholder')}
              maxLength={100}
              className={`
                flex-1 min-w-0 bg-transparent border-none text-[20px] font-bold tracking-[-0.015em] leading-[1.3] text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none py-1
                ${titleVoice.isListening ? 'animate-pulse' : ''}
              `}
            />
            <div className="flex items-center gap-1 flex-shrink-0">
              {!titleVoice.isListening ? (
                <button
                  type="button"
                  onClick={handleTitleStart}
                  disabled={!titleVoice.isSupported}
                  className="w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-[0_4px_12px_rgba(168,85,247,0.35)] hover:shadow-[0_6px_18px_rgba(168,85,247,0.5)] hover:scale-105 active:scale-95 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  title={titleVoice.isSupported ? (t('startVoiceInput') || '음성 입력 시작') : '음성 인식 미지원'}
                >
                  🎤
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTitleStop}
                  className="w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50 animate-pulse transition-all relative text-lg"
                  title={t('stopVoiceInput') || '음성 입력 중지'}
                >
                  ⏹️
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
                </button>
              )}
            </div>
          </div>
          {titleVoice.isListening && (
            <div className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1 animate-pulse">
              <span className="material-icons-outlined text-xs">mic</span>
              {t('listeningTitle') || '제목 음성 인식 중...'}
            </div>
          )}
        </div>

        {/* 제목/본문 구분선 — 카드 시스템과 동일한 미세 라인 */}
        <div className="h-px bg-black/[0.06] dark:bg-white/[0.06] mb-4 relative z-10" />

        {/* Content with Voice Input — 본문 15px/leading 1.7 */}
        <div className="relative z-10">
          <div className="flex items-start gap-2">
            <textarea
              value={content}
              onChange={handleManualContentChange}
              placeholder={t('prayerComposerContentPlaceholder')}
              rows={4}
              maxLength={1000}
              required
              className={`
                flex-1 bg-transparent border-none text-[15px] tracking-[-0.01em] text-gray-700 dark:text-gray-300
                placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none
                leading-[1.7] py-1
                ${contentVoice.isListening ? 'animate-pulse' : ''}
              `}
            />
            <div className="flex items-center gap-1 mt-1 flex-shrink-0">
              {!contentVoice.isListening ? (
                <button
                  type="button"
                  onClick={handleContentStart}
                  disabled={!contentVoice.isSupported}
                  className="w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-[0_4px_12px_rgba(168,85,247,0.35)] hover:shadow-[0_6px_18px_rgba(168,85,247,0.5)] hover:scale-105 active:scale-95 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  title={contentVoice.isSupported ? (t('startVoiceInput') || '음성 입력 시작') : '음성 인식 미지원'}
                >
                  🎤
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleContentStop}
                  className="w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50 animate-pulse transition-all relative text-lg"
                  title={t('stopVoiceInput') || '음성 입력 중지'}
                >
                  ⏹️
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
                </button>
              )}
            </div>
          </div>
          {contentVoice.isListening && (
            <div className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1 animate-pulse">
              <span className="material-icons-outlined text-xs">mic</span>
              {t('listeningContent') || '내용 음성 인식 중... (중지 버튼을 클릭하세요)'}
            </div>
          )}
          <div className="text-[11px] text-gray-400 dark:text-gray-500 text-right mt-1">
            {content.length}/1000
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentCard
