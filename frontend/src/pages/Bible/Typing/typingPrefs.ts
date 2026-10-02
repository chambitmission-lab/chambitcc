import { useCallback, useState } from 'react'
import type { TypingMode } from '../../../api/bibleTyping'

// 기기별 편의 설정 — 저장소가 막혀도(사생활 보호 모드 등) 기본값으로 동작한다
const PUNCT_KEY = 'bt-ignore-punct'
const MODE_KEY = 'bt-mode'

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* noop */
  }
}

/** 문장부호 무시(기본 켬) */
export const useIgnorePunct = (): [boolean, (v: boolean) => void] => {
  const [value, setValue] = useState(() => read(PUNCT_KEY) !== '0')
  const set = useCallback((v: boolean) => {
    setValue(v)
    write(PUNCT_KEY, v ? '1' : '0')
  }, [])
  return [value, set]
}

/** 허브에서 고른 쓰기 방식(따라 쓰기/암송) */
export const useTypingMode = (): [TypingMode, (v: TypingMode) => void] => {
  const [value, setValue] = useState<TypingMode>(() => (read(MODE_KEY) === 'memorize' ? 'memorize' : 'copy'))
  const set = useCallback((v: TypingMode) => {
    setValue(v)
    write(MODE_KEY, v)
  }, [])
  return [value, set]
}

export const sessionPath = (bookNumber: number, chapter: number, mode: TypingMode, verse?: number) =>
  `/bible/typing/${bookNumber}/${chapter}?mode=${mode}${verse ? `&v=${verse}` : ''}`

export const formatDuration = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 100) / 10)
  if (s < 60) return `${s.toFixed(1)}초`
  const m = Math.floor(s / 60)
  const rest = Math.round(s - m * 60)
  return `${m}분 ${rest}초`
}
