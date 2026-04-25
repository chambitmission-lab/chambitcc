import { useCallback, useEffect, useRef } from 'react'
import { Howl, Howler } from 'howler'

// 사운드 파일은 public/sounds/ 에 배치
// 파일이 없어도 graceful degradation: 콘솔 경고만 띄우고 무음으로 동작
const SOUND_BASE = '/sounds'

export type SfxKey =
  | 'step'        // 발자취 전진
  | 'reveal'      // 안개 걷힘
  | 'correct'     // 정답
  | 'wrong'       // 오답
  | 'milestone'   // 이정표 도달
  | 'fanfare'     // 완주
  | 'click'       // 버튼 클릭

const SOUND_FILES: Record<SfxKey, { src: string; volume?: number }> = {
  step:      { src: `${SOUND_BASE}/step.mp3`,      volume: 0.5 },
  reveal:    { src: `${SOUND_BASE}/reveal.mp3`,    volume: 0.6 },
  correct:   { src: `${SOUND_BASE}/correct.mp3`,   volume: 0.7 },
  wrong:     { src: `${SOUND_BASE}/wrong.mp3`,     volume: 0.5 },
  milestone: { src: `${SOUND_BASE}/milestone.mp3`, volume: 0.7 },
  fanfare:   { src: `${SOUND_BASE}/fanfare.mp3`,   volume: 0.8 },
  click:     { src: `${SOUND_BASE}/click.mp3`,     volume: 0.4 },
}

const MUTE_KEY = 'bm-sfx-muted'

export const useSfx = () => {
  const cacheRef = useRef<Partial<Record<SfxKey, Howl>>>({})
  const mutedRef = useRef<boolean>(
    typeof window !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1',
  )

  useEffect(() => {
    Howler.volume(0.85)
    return () => {
      Object.values(cacheRef.current).forEach((h) => h?.unload())
      cacheRef.current = {}
    }
  }, [])

  const ensureLoaded = useCallback((key: SfxKey): Howl => {
    let h = cacheRef.current[key]
    if (!h) {
      const cfg = SOUND_FILES[key]
      h = new Howl({
        src: [cfg.src],
        volume: cfg.volume ?? 0.6,
        preload: true,
        html5: false,
        onloaderror: () => {
          // 파일이 없을 때 조용히 무음 처리
        },
        onplayerror: () => {},
      })
      cacheRef.current[key] = h
    }
    return h
  }, [])

  const play = useCallback(
    (key: SfxKey) => {
      if (mutedRef.current) return
      try {
        const h = ensureLoaded(key)
        h.play()
      } catch {
        /* noop */
      }
    },
    [ensureLoaded],
  )

  const setMuted = useCallback((m: boolean) => {
    mutedRef.current = m
    if (typeof window !== 'undefined') {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0')
    }
    Howler.mute(m)
  }, [])

  const isMuted = useCallback(() => mutedRef.current, [])

  return { play, setMuted, isMuted }
}
