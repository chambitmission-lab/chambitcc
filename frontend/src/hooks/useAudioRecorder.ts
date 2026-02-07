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
    
    if (mediaRecorderRef.current) return
    if (isRequestingPermissionRef.current) return
    if (now - lastRequestTimeRef.current < 500) return

    try {
      lastRequestTimeRef.current = now
      isRequestingPermissionRef.current = true
      setError(null)
      
      const { granted, stream, error: permError } = await requestMicrophonePermission()
      
      if (!granted || !stream) {
        setError(permError || '마이크 접근 권한이 필요합니다')
        isRequestingPermissionRef.current = false
        return
      }
      
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
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.onerror = () => {
        setError('녹음 중 오류가 발생했습니다')
      }
      
      mediaRecorder.start(1000)
      setRecordingState('recording')
      
      startTimeRef.current = Date.now()
      pausedTimeRef.current = 0
      timerRef.current = window.setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000))
      }, 1000)
      
      isRequestingPermissionRef.current = false
      
    } catch (err) {
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
