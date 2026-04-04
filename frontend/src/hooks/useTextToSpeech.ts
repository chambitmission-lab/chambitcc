import { useState, useEffect, useCallback, useRef } from 'react'

interface UseTextToSpeechOptions {
  lang?: string
  rate?: number // 속도 (0.1 ~ 10, 기본 1)
  pitch?: number // 음높이 (0 ~ 2, 기본 1)
  volume?: number // 볼륨 (0 ~ 1, 기본 1)
}

export const useTextToSpeech = (options: UseTextToSpeechOptions = {}) => {
  const {
    lang = 'ko-KR',
    rate = 1,
    pitch = 1,
    volume = 1,
  } = options

  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // 브라우저 지원 확인
  useEffect(() => {
    setIsSupported('speechSynthesis' in window)
    
    // iOS Safari: 음성 목록 미리 로드 (첫 실행 지연 방지)
    if ('speechSynthesis' in window) {
      // iOS에서 getVoices()가 비동기로 로드되므로 이벤트 리스너 등록
      const loadVoices = () => {
        window.speechSynthesis.getVoices()
      }
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
      
      // 즉시 한 번 호출
      loadVoices()
    }
  }, [])

  // 음성 재생
  const speak = useCallback((text: string) => {
    if (!isSupported) {
      console.warn('Text-to-Speech is not supported in this browser')
      return
    }

    // 이미 재생 중이면 중지
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    // iOS Safari: 한국어 음성 명시적으로 선택
    const voices = window.speechSynthesis.getVoices()
    const koreanVoice = voices.find(voice => voice.lang.startsWith('ko'))
    if (koreanVoice) {
      utterance.voice = koreanVoice
    }

    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      setIsPlaying(false)
      setIsPaused(false)
    }

    utteranceRef.current = utterance
    
    // iOS Safari: 약간의 지연 후 재생 (안정성 향상)
    setTimeout(() => {
      window.speechSynthesis.speak(utterance)
    }, 100)
  }, [isSupported, lang, rate, pitch, volume])

  // 일시정지
  const pause = useCallback(() => {
    if (isSupported && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }, [isSupported])

  // 재개
  const resume = useCallback(() => {
    if (isSupported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }, [isSupported])

  // 정지
  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      setIsPaused(false)
    }
  }, [isSupported])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return {
    speak,
    pause,
    resume,
    stop,
    isPlaying,
    isPaused,
    isSupported,
  }
}
