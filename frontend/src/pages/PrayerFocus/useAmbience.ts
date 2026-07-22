// Ambience(배경음) 재생 훅 — HTML5 <audio> 기반.
// silent 또는 파일이 없는 경우 안전하게 no-op 반환.
// 컴포넌트 언마운트 시 자동 정리.
import { useEffect, useRef, useCallback, useMemo } from 'react'
import { findAmbience } from './ambienceTracks'

interface UseAmbienceReturn {
  play: () => void
  stop: () => void
  pause: () => void
  isReady: boolean
}

export const useAmbience = (ambienceId: string): UseAmbienceReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const track = useMemo(() => findAmbience(ambienceId), [ambienceId])

  // 트랙 변경 시 기존 오디오 정리 + 새로 준비
  useEffect(() => {
    // 기존 정리
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
  }, [track])

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
    // 사용자 인터랙션 후에 호출되므로 autoplay policy 통과
    const p = a.play()
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // 재생 실패는 조용히 무시 — 파일이 없거나 권한이 없을 때
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
