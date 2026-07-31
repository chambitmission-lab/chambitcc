// 구간 전환/완료 차임 — WebAudio 로 합성한 잔잔한 종소리 (오디오 파일 불필요)
// AudioContext 는 사용자 제스처 이후에만 생성/재개 가능하므로
// 진입 의식(터치) 시점에 warmupChime() 을 한 번 호출해 둔다.

let ctx: AudioContext | null = null

const getContext = (): AudioContext | null => {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {})
    }
    return ctx
  } catch {
    return null
  }
}

/** 사용자 제스처 핸들러 안에서 호출해 AudioContext 를 미리 깨워둔다 */
export const warmupChime = (): void => {
  getContext()
}

/** 싱잉볼 느낌의 부드러운 단일 타종 */
export const playChime = (volume = 0.16): void => {
  const ac = getContext()
  if (!ac) return

  const now = ac.currentTime
  const master = ac.createGain()
  master.gain.value = volume
  master.connect(ac.destination)

  // 기음 + 살짝 어긋난 배음 두 개 — 금속성 울림
  const partials: Array<{ freq: number; gain: number; decay: number }> = [
    { freq: 523.25, gain: 1.0, decay: 2.4 },   // C5
    { freq: 1046.5, gain: 0.35, decay: 1.6 },  // C6
    { freq: 1567.98, gain: 0.12, decay: 1.1 }, // G6
  ]

  partials.forEach(({ freq, gain, decay }) => {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(gain, now + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay)
    osc.connect(g)
    g.connect(master)
    osc.start(now)
    osc.stop(now + decay + 0.1)
  })
}
