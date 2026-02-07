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

  const startRecording = useCallback(async () => {
    try {
      console.log('Starting recording...')
      setError(null)
      
      // 권한 요청 및 스트림 획득 (중복 요청 방지)
      const { granted, stream, error: permError } = await requestMicrophonePermission()
      
      if (!granted || !stream) {
        setError(permError || '마이크 접근 권한이 필요합니다')
        return
      }
      
      // 브라우저별 지원 형식 확인
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav'
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available, size:', event.data.size)
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, chunks:', chunksRef.current.length)
        const blob = new Blob(chunksRef.current, { type: mimeType })
        console.log('Created blob, size:', blob.size)
        setAudioBlob(blob)
        setRecordingState('stopped')
        
        // 스트림 정리
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setError('녹음 중 오류가 발생했습니다')
      }
      
      // timeslice를 1000ms로 설정하여 1초마다 데이터 수집
      mediaRecorder.start(1000)
      console.log('MediaRecorder started, state:', mediaRecorder.state)
      setRecordingState('recording')
      
      // 타이머 시작
      startTimeRef.current = Date.now()
      pausedTimeRef.current = 0
      timerRef.current = window.setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000))
      }, 1000)
      
    } catch (err) {
      setError('마이크 접근 권한이 필요합니다')
      console.error('Recording error:', err)
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
    console.log('Stop recording called, current state:', recordingState)
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      console.log('Stopping MediaRecorder...')
      mediaRecorderRef.current.stop()
      
      // 타이머 정지
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [recordingState])

  const resetRecording = useCallback(() => {
    console.log('Reset recording called')
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        console.log('Stopping active MediaRecorder during reset')
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
