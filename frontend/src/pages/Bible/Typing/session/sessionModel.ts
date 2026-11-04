/**
 * 필사 세션 모델 — TypingSession 이 쓰는 타입·상수·순수 계산(화면 없음)
 *
 * TypingSession.tsx(1,430줄)에서 분리. 절 목록 변환, 다음 절 찾기, 릴레이 빈칸 찾기, 결과 요약처럼
 * 상태를 건드리지 않는 계산은 여기 두고 본체는 흐름만 맡는다.
 */
import type { TypingRelayDetail } from '../../../../api/bibleTyping'
import type { BibleVerse } from '../../../../types/bible'
import { cpmOf } from '../hangulTyping'
import { safeStorage } from '../../../../utils/safeStorage'

export interface SessionVerse {
  id: number
  verse: number
  label: string
  text: string
  /** 병합 구간의 딸린 절 id — 함께 읽음 처리한다 */
  extraIds: number[]
}

export interface Outcome {
  status: 'passed' | 'failed'
  /** 저장 응답이 늦게 와도 지금 이 절의 결과에만 붙이도록 */
  verseId: number
  accuracy: number
  cpm: number
  newlyRead?: boolean
  personalBest?: boolean
  note?: string
}

export interface SessionResult {
  verseId: number
  accuracy: number
  keystrokes: number
  durationMs: number
  maxCombo: number
}

export interface CheerFloat {
  id: number
  text: string
  hue: number
}

// PC 무대 아래로 미리 보여 줄 다음 절 수
export const STAGE_AHEAD = 2
// 장 지도 링 — r=44 원의 둘레
export const RING_C = 2 * Math.PI * 44
// 릴레이 소식 띠에 잠깐 띄우는 소식(칸 채움·바통·응원 보냄)이 머무는 시간
export const FLASH_MS = 6000
// 주소로 정해진 절에 처음 내려앉은 뒤, 늦게 도착한 내용에 밀려도 자리를 다시 맞추는 시간
export const LAND_HOLD_MS = 1500
// 방 소식에 남겨 두는 개수
export const FEED_MAX = 8
// '내 이름 숨기고 쓰기' — 기기별 기억
const ANON_KEY = 'bt-together-anon'
export const readAnon = () => safeStorage.get(ANON_KEY) === '1'
export const writeAnon = (v: boolean) => safeStorage.set(ANON_KEY, v ? '1' : '0')

export const toSessionVerses = (verses: BibleVerse[]): SessionVerse[] => {
  const byNumber = new Map(verses.map((v) => [v.verse, v.id]))
  return verses
    .filter((v) => !v.merged_into)
    .map((v) => ({
      id: v.id,
      verse: v.verse,
      label: v.verse_label || String(v.verse),
      text: v.text,
      extraIds: (v.merged_verses ?? [])
        .filter((n) => n !== v.verse)
        .map((n) => byNumber.get(n))
        .filter((id): id is number => typeof id === 'number'),
    }))
}

/** from 다음의 안 쓴 절(없으면 앞쪽에서) — 다 썼으면 null */
export const nextIndex = (verses: SessionVerse[], from: number, doneSet: Set<number>): number | null => {
  for (let i = from + 1; i < verses.length; i++) if (!doneSet.has(verses[i].id)) return i
  for (let i = 0; i < from; i++) if (!doneSet.has(verses[i].id)) return i
  return null
}

/**
 * 방금 쓴 칸 다음의 릴레이 빈칸(없으면 앞쪽 빈칸) → 세션 절 인덱스. 바통이 가리키는 칸이기도 하다.
 * 방 정보가 아직 새로 오기 전일 수 있어 이번에 쓴 칸(written)은 직접 뺀다
 */
export const relayNextIndex = (
  room: TypingRelayDetail | null,
  verses: SessionVerse[],
  fromId: number,
  written: Set<number>,
): number | null => {
  if (!room) return null
  const slots = room.verses
  const at = slots.findIndex((v) => v.id === fromId)
  const ordered = [...slots.slice(at + 1), ...slots.slice(0, Math.max(at, 0))]
  const slot = ordered.find((v) => !v.by && !written.has(v.id))
  if (!slot) return null
  const i = verses.findIndex((v) => v.id === slot.id)
  return i < 0 ? null : i
}

export interface SessionSummary {
  count: number
  totalMs: number
  cpm: number
  acc: number
  bestCombo: number
}

/** 마무리 화면 숫자 — 이번 세션에 통과한 절들의 합 */
export const summarize = (results: SessionResult[]): SessionSummary => {
  const totalMs = results.reduce((s, r) => s + r.durationMs, 0)
  const keys = results.reduce((s, r) => s + r.keystrokes, 0)
  const acc = results.length ? results.reduce((s, r) => s + r.accuracy, 0) / results.length : 0
  const bestCombo = results.reduce((m, r) => Math.max(m, r.maxCombo), 0)
  return { count: results.length, totalMs, cpm: cpmOf(keys, totalMs), acc, bestCombo }
}

/** 암송 모드에서 아직 안 쓴 절은 글자를 점으로 가린다 */
export const maskText = (text: string) => text.replace(/[^\s]/g, '·')
