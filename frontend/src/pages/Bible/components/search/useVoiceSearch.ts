import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// 음성 검색 — Web Speech API. 크롬·사파리(iOS 14.5+)만 있고 파이어폭스엔 없어서,
// 없으면 supported=false 로 버튼 자체를 그리지 않는다.

interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
}

interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: SpeechResultEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type RecognitionCtor = new () => Recognition

const getCtor = (): RecognitionCtor | null => {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * onInterim — 말하는 동안 입력창에 받아 적을 글자, onFinal — 말을 마친 문장(이걸로 검색).
 * 실패(권한 거부·무음)는 조용히 듣기 상태만 푼다.
 */
export const useVoiceSearch = (
  lang: 'ko' | 'en',
  onInterim: (text: string) => void,
  onFinal: (text: string) => void
) => {
  const [listening, setListening] = useState(false)
  const recRef = useRef<Recognition | null>(null)
  const handlers = useRef({ onInterim, onFinal })
  useLayoutEffect(() => {
    handlers.current = { onInterim, onFinal }
  })
  const supported = getCtor() !== null

  useEffect(() => () => recRef.current?.abort(), [])

  const toggle = useCallback(() => {
    if (recRef.current) {
      recRef.current.stop()
      return
    }
    const Ctor = getCtor()
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = lang === 'ko' ? 'ko-KR' : 'en-US'
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1]
      const text = last?.[0]?.transcript?.trim() ?? ''
      if (!text) return
      if (last.isFinal) handlers.current.onFinal(text)
      else handlers.current.onInterim(text)
    }
    const done = () => {
      recRef.current = null
      setListening(false)
    }
    rec.onend = done
    rec.onerror = done
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      done()
    }
  }, [lang])

  return { supported, listening, toggle }
}
