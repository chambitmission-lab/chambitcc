// 음성 녹음 컴포넌트
import { useRef } from 'react'
import { useAudioRecorder } from '../../../hooks/useAudioRecorder'

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void
  onCancel: () => void
}

const AudioRecorder = ({ onRecordingComplete, onCancel }: AudioRecorderProps) => {
  const {
    recordingState,
    recordingTime,
    audioBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    error,
  } = useAudioRecorder()

  // 녹음 시작 여부를 추적하는 ref
  const hasStartedRef = useRef(false)
  const isStartingRef = useRef(false)
  const lastClickTimeRef = useRef(0)

  const handleStart = async () => {
    const now = Date.now()
    
    // 500ms 이내 중복 클릭 방지 (디바운스)
    if (now - lastClickTimeRef.current < 500) {
      return
    }
    
    // 이미 시작했거나 시작 중이면 무시
    if (hasStartedRef.current || isStartingRef.current || recordingState !== 'idle') {
      return
    }
    
    lastClickTimeRef.current = now
    isStartingRef.current = true
    hasStartedRef.current = true
    
    await startRecording()
    
    isStartingRef.current = false
  }

  const handleReset = () => {
    hasStartedRef.current = false
    isStartingRef.current = false
    lastClickTimeRef.current = 0
    resetRecording()
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleComplete = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob)
      resetRecording()
    }
  }

  const handleCancel = () => {
    resetRecording()
    onCancel()
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">음성 녹음</h3>
        <button
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span className="material-icons-outlined">close</span>
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 녹음 상태 표시 */}
      <div className="flex flex-col items-center justify-center py-8">
        {/* 녹음 아이콘 */}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
          recordingState === 'recording' 
            ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' 
            : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          <span className={`material-icons-outlined text-5xl ${
            recordingState === 'recording' 
              ? 'text-red-500' 
              : 'text-gray-400 dark:text-gray-500'
          }`}>
            mic
          </span>
        </div>

        {/* 녹음 시간 */}
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {formatTime(recordingTime)}
        </div>

        {/* 상태 텍스트 */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {recordingState === 'idle' && '녹음을 시작하세요'}
          {recordingState === 'recording' && '녹음 중...'}
          {recordingState === 'paused' && '일시정지됨'}
          {recordingState === 'stopped' && '녹음 완료'}
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex items-center justify-center gap-4">
        {recordingState === 'idle' && (
          <button
            onClick={handleStart}
            disabled={hasStartedRef.current || isStartingRef.current}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:shadow-lg transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-icons-outlined text-2xl">mic</span>
            녹음 시작
          </button>
        )}

        {recordingState === 'recording' && (
          <>
            <button
              onClick={pauseRecording}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white font-bold rounded-full hover:shadow-lg transition-all"
            >
              <span className="material-icons-outlined">pause</span>
              일시정지
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-bold rounded-full hover:shadow-lg transition-all"
            >
              <span className="material-icons-outlined">stop</span>
              정지
            </button>
          </>
        )}

        {recordingState === 'paused' && (
          <>
            <button
              onClick={resumeRecording}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-full hover:shadow-lg transition-all"
            >
              <span className="material-icons-outlined">play_arrow</span>
              재개
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-bold rounded-full hover:shadow-lg transition-all"
            >
              <span className="material-icons-outlined">stop</span>
              정지
            </button>
          </>
        )}

        {recordingState === 'stopped' && audioBlob && (
          <>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white font-bold rounded-full hover:shadow-lg transition-all"
            >
              <span className="material-icons-outlined">refresh</span>
              다시 녹음
            </button>
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:shadow-lg transition-all"
            >
              <span className="material-icons-outlined">check</span>
              완료
            </button>
          </>
        )}
      </div>

      {/* 오디오 미리듣기 */}
      {recordingState === 'stopped' && audioBlob && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">미리듣기</p>
          <audio
            controls
            src={URL.createObjectURL(audioBlob)}
            className="w-full"
          />
        </div>
      )}
    </div>
  )
}

export default AudioRecorder
