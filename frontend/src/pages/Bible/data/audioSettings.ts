// 오디오북 플레이어 설정 — 배속·연속 재생·카드 접힘·음성.
// 기기별로 localStorage에 기억하고, 저장·전파 방식은 readerLayout과 같다.
// 플레이어는 이 모듈만 알면 되고, 저장 매체가 바뀌어도 UI는 손대지 않는다.

import { useSyncExternalStore } from 'react'
import type { BibleTTSVoice } from '../../../types/bible'

export const RATE_OPTIONS = [0.75, 1, 1.25, 1.5]

export interface AudioSettings {
  voice: BibleTTSVoice
  rate: number
  /** 장이 끝나면 다음 장을 자동 재생 (기본 켬) */
  autoNext: boolean
  /** 플레이어 카드 접힘 — 기본은 펼침(기능 발견성). 한 번 접으면 장을 옮겨도 기억 */
  collapsed: boolean
}

const KEYS = {
  voice: 'bible-tts-voice',
  rate: 'bible-tts-rate',
  autoNext: 'bible-tts-autonext',
  collapsed: 'bible-tts-collapsed',
} as const

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
    /* 사파리 프라이빗 모드 등 — 이번 세션만 반영 */
  }
}

// 현재는 음성 선택 UI를 숨기고 남성으로 고정한다(여성/남성 토글은 코드만 보존).
// 나중에 다시 노출하려면 아래 한 줄을 예전 로직으로 되돌리면 된다.
//   const v = read(KEYS.voice); return v === 'male' ? 'male' : 'female'
const loadVoice = (): BibleTTSVoice => 'male'

const loadRate = (): number => {
  const r = Number(read(KEYS.rate))
  return RATE_OPTIONS.includes(r) ? r : 1
}

const load = (): AudioSettings => ({
  voice: loadVoice(),
  rate: loadRate(),
  autoNext: read(KEYS.autoNext) !== 'off',
  collapsed: read(KEYS.collapsed) === 'on',
})

let cache: AudioSettings | null = null
const listeners = new Set<() => void>()

export const getAudioSettings = (): AudioSettings => {
  if (cache === null) cache = load()
  return cache
}

const update = (patch: Partial<AudioSettings>) => {
  cache = { ...getAudioSettings(), ...patch }
  listeners.forEach((fn) => fn())
}

export const setAudioVoice = (voice: BibleTTSVoice) => {
  write(KEYS.voice, voice)
  update({ voice })
}

/** 허용 목록(RATE_OPTIONS) 밖의 값은 무시한다 */
export const setAudioRate = (rate: number): boolean => {
  if (!RATE_OPTIONS.includes(rate)) return false
  write(KEYS.rate, String(rate))
  update({ rate })
  return true
}

export const setAudioAutoNext = (on: boolean) => {
  write(KEYS.autoNext, on ? 'on' : 'off')
  update({ autoNext: on })
}

export const setAudioCollapsed = (on: boolean) => {
  write(KEYS.collapsed, on ? 'on' : 'off')
  update({ collapsed: on })
}

const subscribe = (fn: () => void): (() => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** 플레이어(및 설정 메뉴)가 구독하는 훅 — 어디서 바꿔도 즉시 반영 */
export const useAudioSettings = (): AudioSettings => useSyncExternalStore(subscribe, getAudioSettings, getAudioSettings)
