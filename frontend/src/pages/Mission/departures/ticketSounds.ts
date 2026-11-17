// 탑승권 검표 소리 — 바코드 인식 "삑"과 펀치 "찰칵". 파일 없이 WebAudio 로 합성한다.
// 사용자 탭 안에서만 불리므로 자동 재생 정책에 걸리지 않는다. 실패해도 조용히 넘어간다.

let ctx: AudioContext | null = null
const audio = (): AudioContext | null => {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx ??= new Ctor()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** 바코드 인식음 — 짧은 두 음 */
export const playScanBeep = () => {
  const A = audio()
  if (!A) return
  ;[0, 0.09].forEach((t, i) => {
    const o = A.createOscillator()
    const g = A.createGain()
    o.type = 'square'
    o.frequency.value = i ? 1760 : 1320
    const at = A.currentTime + t
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(0.05, at + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.08)
    o.connect(g).connect(A.destination)
    o.start(at)
    o.stop(at + 0.09)
  })
}

/** 펀치 "찰칵" — 누를 때·놓을 때 짧은 잡음 두 번 */
export const playPunchClack = () => {
  const A = audio()
  if (!A) return
  ;[0, 0.07].forEach((t, k) => {
    const n = Math.floor(A.sampleRate * 0.035)
    const buf = A.createBuffer(1, n, A.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4)
    const src = A.createBufferSource()
    const f = A.createBiquadFilter()
    const g = A.createGain()
    src.buffer = buf
    f.type = 'bandpass'
    f.frequency.value = k ? 2600 : 1700
    f.Q.value = 1.2
    g.gain.value = k ? 0.25 : 0.5
    src.connect(f).connect(g).connect(A.destination)
    src.start(A.currentTime + t)
  })
}
