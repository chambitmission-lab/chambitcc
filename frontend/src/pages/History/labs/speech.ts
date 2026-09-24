// 소리 내어 읽어주기 — 브라우저 내장 음성(Web Speech API). 지원하지 않으면 조용히 무시한다.

const synth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null

export const canSpeak = () => synth() !== null

export const speak = (text: string) => {
  const s = synth()
  if (!s) return
  s.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'
  u.rate = 0.9 // 어르신 기준 — 기본 속도보다 조금 천천히
  s.speak(u)
}

export const stopSpeaking = () => synth()?.cancel()
