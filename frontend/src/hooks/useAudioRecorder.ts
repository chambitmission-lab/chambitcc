// 음성 녹음 커스텀 훅
import { useState, useRef, useCallback } from 'react'
import type { RecordingState } from '../types/sermon'
import { requestMicrophonePermission } from '../utils/permissions'

interface UseAudioRecorderReturn {
  recordingState: RecordingState
  recordingTime: number
  audioBlob: Blob | null
  startRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => void
  resetRecording: () => void
  error: string | null
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const isRequestingPermissionRef = useRef(false)
  const lastRequestTimeRef = useRef(0)

  const startRecording = useCallback(async () => {
    const now = Date.now()
    
    // 1. 이미 녹음 중이면 무시
    if (mediaRecorderRef.current) {
      console.log('[AudioRecorder] Already recording')
      return
    }
    
    // 2. 권한 요청 중이면 무시
    if (isRequestingPermissionRef.current) {
      console.log('[AudioRecorder] Permission request in progress')
      return
    }
    
    // 3. 디바운스: 500ms 이내 중복 클릭 방지
    if (now - lastRequestTimeRef.current < 500) {
      console.log('[AudioRecorder] Click too soon (debounce)')
      return
    }

    try {
      console.log('[AudioRecorder] 🎤 Starting recording...')
      lastRequestTimeRef.current = now
      isRequestingPermissionRef.current = true
      setError(null)
      
      // getUserMedia를 통해 권한 요청 (딱 1번만)
      const { granted, stream, error: permError } = await requestMicrophonePermission()
      
      if (!granted || !stream) {
        console.error('[AudioRecorder] ❌ Permission denied:', permError)
        setError(permError || '마이크 접근 권한이 필요합니다')
        isRequestingPermissionRef.current = false
        return
      }
      
      console.log('[AudioRecorder] ✅ Permission granted')
      
      // MediaRecorder 설정
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav'
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        setRecordingState('stopped')
        
        // 스트림 정리
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.onerror = () => {
        setError('녹음 중 오류가 발생했습니다')
      }
      
      // 녹음 시작 (1초마다 데이터 수집)
      mediaRecorder.start(1000)
      setRecordingState('recording')
      
      // 타이머 시작
      startTimeRef.current = Date.now()
      pausedTimeRef.current = 0
      timerRef.current = window.setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000))
      }, 1000)
      
      console.log('[AudioRecorder] ✅ Recording started')
      isRequestingPermissionRef.current = false
      
    } catch (err) {
      console.error('[AudioRecorder] ❌ Error:', err)
      setError('녹음 시작 중 오류가 발생했습니다')
      isRequestingPermissionRef.current = false
    }
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause()
      setRecordingState('paused')
      
      // 타이머 일시정지
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      pausedTimeRef.current = Date.now() - startTimeRef.current - pausedTimeRef.current
    }
  }, [recordingState])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume()
      setRecordingState('recording')
      
      // 타이머 재개
      startTimeRef.current = Date.now()
      timerRef.current = window.setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000))
      }, 1000)
    }
  }, [recordingState])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop()
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [recordingState])

  const resetRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      mediaRecorderRef.current = null
    }
    
    setRecordingState('idle')
    setRecordingTime(0)
    setAudioBlob(null)
    setError(null)
    chunksRef.current = []
    startTimeRef.current = 0
    pausedTimeRef.current = 0
    isRequestingPermissionRef.current = false
  }, [])

  return {
    recordingState,
    recordingTime,
    audioBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    error,
  }
}
