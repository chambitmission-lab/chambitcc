// Ambience(배경음) 재생 훅 — HTML5 <audio> 기반.
// silent 또는 파일이 없는 경우 안전하게 no-op 반환.
// 컴포넌트 언마운트 시 자동 정리.
import { useEffect, useRef, useCallback, useMemo } from 'react'
import { findAmbience } from '../data/ambienceTracks'

interface UseAmbienceReturn {
  play: () => void
  stop: () => void
  pause: () => void
  isReady: boolean
}

export const useAmbience = (
  ambienceId: string,
  opts?: { autoplay?: boolean },
): UseAmbienceReturn => {
  const autoplay = opts?.autoplay ?? false
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const track = useMemo(() => findAmbience(ambienceId), [ambienceId])

  // 트랙 변경 시 기존 오디오 정리 + 새로 준비
  useEffect(() => {
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
    audio.preload = 'auto'
    audioRef.current = audio

    if (autoplay) {
      const p = audio.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // autoplay 정책 차단 또는 파일 없음 — 조용히 무시
        })
      }
    }

    return () => {
      audio.pause()
      audio.src = ''
      audio.load()
    }
  }, [track, autoplay])

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
    const p = a.play()
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // 재생 실패는 조용히 무시 — 파일이 없거나 autoplay 차단
      })
    }
  }, [])

  const stop = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.pause()
    try {
      a.currentTime = 0
    } catch {
      // 일부 브라우저는 미디어 미준비 상태에서 currentTime 설정 시 throw 가능
    }
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  return {
    play,
    stop,
    pause,
    isReady: !!audioRef.current,
  }
}
