// Ambience(배경음) 재생 훅 — HTML5 <audio> 기반.
// silent 또는 파일이 없는 경우 안전하게 no-op 반환.
// 컴포넌트 언마운트 시 자동 정리.
import { useEffect, useRef, useCallback, useMemo } from 'react'
import { findAmbience } from './ambienceTracks'

interface UseAmbienceReturn {
  play: () => void
  stop: () => void
  pause: () => void
  /** 설정 화면에서 트랙을 고를 때 2.5초 맛보기 재생 (끝에서 페이드아웃) */
  preview: () => void
  isReady: boolean
}

const PREVIEW_MS = 2500
const PREVIEW_FADE_MS = 700

export const useAmbience = (ambienceId: string): UseAmbienceReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previewTimersRef = useRef<number[]>([])
  const track = useMemo(() => findAmbience(ambienceId), [ambienceId])

  const clearPreviewTimers = useCallback(() => {
    previewTimersRef.current.forEach((id) => clearInterval(id))
    previewTimersRef.current = []
  }, [])

  // 트랙 변경 시 기존 오디오 정리 + 새로 준비
  useEffect(() => {
    // 기존 정리
    clearPreviewTimers()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current.load()
      audioRef.current = null
    }

    if (!track?.src) return

    // GitHub Pages 등 서브경로 호스팅 호환을 위해 BASE_URL 을 prepend. http(s)/blob URL 은 그대로.
    const resolvedSrc = /^(https?:|blob:|data:)/.test(track.src)
      ? track.src
      : `${import.meta.env.BASE_URL.replace(/\/$/, '')}${track.src}`
    const audio = new Audio(resolvedSrc)
    audio.loop = true
    audio.volume = track.volume ?? 0.4
    // 'auto' 면 트랙을 고르기만 해도 수 MB MP3를 즉시 내려받는다.
    // 실제 재생(play()) 시점에 브라우저가 알아서 로드하므로 선로딩은 끈다.
    audio.preload = 'none'
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
      audio.load()
    }
  }, [track, clearPreviewTimers])

  // 페이지 떠날 때 정리
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  const play = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    // 미리듣기 페이드 중이었다면 원래 볼륨으로 복원
    clearPreviewTimers()
    a.volume = track?.volume ?? 0.4
    // 사용자 인터랙션 후에 호출되므로 autoplay policy 통과
    const p = a.play()
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // 재생 실패는 조용히 무시 — 파일이 없거나 권한이 없을 때
      })
    }
  }, [clearPreviewTimers, track])

  // 트랙 선택 직후 짧게 들려주는 맛보기 — 재생 후 페이드아웃하며 멈춘다
  const preview = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    clearPreviewTimers()
    const baseVolume = track?.volume ?? 0.4
    a.volume = baseVolume
    try {
      a.currentTime = 0
    } catch {
      // 미디어 미준비 상태 무시
    }
    const p = a.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})

    const fadeStart = window.setTimeout(() => {
      const steps = 10
      let step = 0
      const fade = window.setInterval(() => {
        step += 1
        a.volume = Math.max(0, baseVolume * (1 - step / steps))
        if (step >= steps) {
          clearInterval(fade)
          a.pause()
          a.volume = baseVolume
          try {
            a.currentTime = 0
          } catch {
            // ignore
          }
        }
      }, PREVIEW_FADE_MS / steps)
      previewTimersRef.current.push(fade)
    }, PREVIEW_MS - PREVIEW_FADE_MS)
    previewTimersRef.current.push(fadeStart)
  }, [clearPreviewTimers, track])

  const stop = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    clearPreviewTimers()
    a.pause()
    a.volume = track?.volume ?? 0.4
    try {
      a.currentTime = 0
    } catch {
      // 일부 브라우저는 미디어 미준비 상태에서 currentTime 설정 시 throw 가능
    }
  }, [clearPreviewTimers, track])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  return {
    play,
    stop,
    pause,
    preview,
    isReady: !!audioRef.current,
  }
}
