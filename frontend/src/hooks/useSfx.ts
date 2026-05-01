import { useCallback, useRef } from 'react'

// Web Audio API 로 즉석 합성 — 외부 mp3 파일 불필요.
// 첫 사용자 제스처 이후에 AudioContext 가 생성/resume 됩니다.

export type SfxKey =
  | 'step'        // 발자취 전진
  | 'reveal'      // 안개 걷힘
  | 'correct'     // 정답
  | 'wrong'       // 오답
  | 'milestone'   // 이정표 도달
  | 'fanfare'     // 완주
  | 'click'       // 버튼 클릭
  | 'select'      // 선택지 고를 때
  | 'hint'        // 힌트 펼침
  | 'submit'      // 제출 두근

const MUTE_KEY = 'bm-sfx-muted'

let sharedCtx: AudioContext | null = null

const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  if (!sharedCtx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    try {
      sharedCtx = new AC()
    } catch {
      return null
    }
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {})
  }
  return sharedCtx
}

interface ToneOpts {
  type?: OscillatorType
  volume?: number
  delay?: number
  attack?: number
  release?: number
  freqEnd?: number
}

const playTone = (ctx: AudioContext, freq: number, duration: number, opts: ToneOpts = {}) => {
  const {
    type = 'sine',
    volume = 0.18,
    delay = 0,
    attack = 0.005,
    release = 0.06,
    freqEnd,
  } = opts
  const start = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), start + duration)
  }
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + attack)
  const sustainEnd = Math.max(start + attack + 0.001, start + duration - release)
  gain.gain.setValueAtTime(volume, sustainEnd)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.04)
}

const playNoiseBurst = (ctx: AudioContext, duration: number, volume = 0.1, delay = 0) => {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * 0.6
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const gain = ctx.createGain()
  const start = ctx.currentTime + delay
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  noise.connect(gain).connect(ctx.destination)
  noise.start(start)
  noise.stop(start + duration + 0.02)
}

const SOUNDS: Record<SfxKey, (ctx: AudioContext) => void> = {
  click: (ctx) => {
    playTone(ctx, 720, 0.06, { type: 'square', volume: 0.07, release: 0.04 })
  },
  select: (ctx) => {
    playTone(ctx, 660, 0.07, { type: 'triangle', volume: 0.14 })
    playTone(ctx, 988, 0.08, { type: 'sine', volume: 0.1, delay: 0.04 })
  },
  hint: (ctx) => {
    // 빛나는 "딩"
    playTone(ctx, 1320, 0.32, { type: 'sine', volume: 0.14, release: 0.28 })
    playTone(ctx, 1760, 0.32, { type: 'sine', volume: 0.08, release: 0.28, delay: 0.02 })
    playTone(ctx, 2640, 0.32, { type: 'sine', volume: 0.05, release: 0.28, delay: 0.04 })
  },
  submit: (ctx) => {
    // 두근 — 제출 직전 긴장감
    playTone(ctx, 220, 0.1, { type: 'sine', volume: 0.18, release: 0.08 })
    playTone(ctx, 180, 0.14, { type: 'sine', volume: 0.16, delay: 0.12, release: 0.1 })
  },
  step: (ctx) => {
    playNoiseBurst(ctx, 0.07, 0.05)
    playTone(ctx, 240, 0.06, { type: 'sine', volume: 0.1, freqEnd: 140 })
  },
  reveal: (ctx) => {
    // 안개가 걷히는 듯한 상승 스윕
    playTone(ctx, 420, 0.45, {
      type: 'sine',
      volume: 0.16,
      freqEnd: 1200,
      attack: 0.05,
      release: 0.25,
    })
    playTone(ctx, 600, 0.45, {
      type: 'triangle',
      volume: 0.08,
      freqEnd: 1800,
      attack: 0.05,
      release: 0.25,
      delay: 0.05,
    })
  },
  correct: (ctx) => {
    // 도-미-솔-도 상승 아르페지오 (C5 → C6)
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((f, i) => {
      playTone(ctx, f, 0.2, {
        type: 'triangle',
        volume: 0.18,
        delay: i * 0.07,
        release: 0.14,
      })
      // 옥타브 위 sparkle
      playTone(ctx, f * 2, 0.2, {
        type: 'sine',
        volume: 0.06,
        delay: i * 0.07,
        release: 0.14,
      })
    })
    // 종소리 꼬리
    playTone(ctx, 1567.98, 0.7, {
      type: 'sine',
      volume: 0.1,
      delay: 0.3,
      release: 0.55,
    })
    playTone(ctx, 2093.0, 0.7, {
      type: 'sine',
      volume: 0.05,
      delay: 0.32,
      release: 0.55,
    })
  },
  wrong: (ctx) => {
    // 부드러운 하강 (기죽지 않게)
    playTone(ctx, 392, 0.18, { type: 'triangle', volume: 0.16 })
    playTone(ctx, 311.13, 0.32, {
      type: 'triangle',
      volume: 0.16,
      delay: 0.13,
      release: 0.22,
    })
  },
  milestone: (ctx) => {
    // 도-솔-도 짧은 강조
    playTone(ctx, 523.25, 0.13, { type: 'triangle', volume: 0.18 })
    playTone(ctx, 783.99, 0.13, { type: 'triangle', volume: 0.18, delay: 0.1 })
    playTone(ctx, 1046.5, 0.28, {
      type: 'triangle',
      volume: 0.2,
      delay: 0.2,
      release: 0.2,
    })
  },
  fanfare: (ctx) => {
    // 도-도-솔-도 + 화음
    const seq: Array<[number, number]> = [
      [523.25, 0],
      [523.25, 0.1],
      [783.99, 0.22],
      [1046.5, 0.38],
    ]
    seq.forEach(([f, d]) => {
      playTone(ctx, f, 0.26, { type: 'triangle', volume: 0.18, delay: d, release: 0.18 })
      playTone(ctx, f * 1.5, 0.26, { type: 'sine', volume: 0.07, delay: d, release: 0.18 })
    })
    // 마지막 종소리 잔향
    playTone(ctx, 1318.51, 0.85, { type: 'sine', volume: 0.11, delay: 0.6, release: 0.7 })
    playTone(ctx, 1975.53, 0.85, { type: 'sine', volume: 0.07, delay: 0.6, release: 0.7 })
  },
}

export const useSfx = () => {
  const mutedRef = useRef<boolean>(
    typeof window !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1',
  )

  const play = useCallback((key: SfxKey) => {
    if (mutedRef.current) return
    const ctx = getCtx()
    if (!ctx) return
    try {
      SOUNDS[key]?.(ctx)
    } catch {
      /* noop */
    }
  }, [])

  const setMuted = useCallback((m: boolean) => {
    mutedRef.current = m
    if (typeof window !== 'undefined') {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0')
    }
  }, [])

  const isMuted = useCallback(() => mutedRef.current, [])

  return { play, setMuted, isMuted }
}
