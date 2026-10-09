// 만들던 카드 기억 — 스타일은 다음에 와도 그대로, 말씀·감성 배경은 '이어서 만들기'로 되살린다.
// 사진 자체는 저장하지 않는다(기기 밖으로도, 브라우저 저장소에도). 기억만 못 할 뿐 동작은 그대로다.

import type { VerseCardStyle } from './photoVerseCanvas'
import type { PickedVerse } from './recommendedVerses'

const KEY = 'chambit.photoVerse.draft.v1'
/** 이보다 오래된 말씀은 '이어서 만들기'로 권하지 않는다 */
const RESUME_TTL_MS = 14 * 24 * 60 * 60 * 1000

export interface PhotoVerseDraft {
  style: VerseCardStyle
  activePreset: string | null
  verse: PickedVerse | null
  /** 감성 배경으로 만들던 중이면 그 배경 — 사진이었으면 null */
  bgId: string | null
  slideCount: number
  /** 상황별 카드의 인사말 · 상황 — 이어서 만들기로 함께 되살린다 */
  greeting?: string
  occasionId?: string | null
  savedAt: number
}

export const loadDraft = (): PhotoVerseDraft | null => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as Partial<PhotoVerseDraft>
    if (!d || typeof d !== 'object' || !d.style || typeof d.style !== 'object') return null
    return {
      style: d.style,
      activePreset: d.activePreset ?? null,
      verse: d.verse && d.verse.text && d.verse.refLabel ? d.verse : null,
      bgId: d.bgId ?? null,
      slideCount: typeof d.slideCount === 'number' ? d.slideCount : 1,
      greeting: typeof d.greeting === 'string' ? d.greeting : '',
      occasionId: typeof d.occasionId === 'string' ? d.occasionId : null,
      savedAt: typeof d.savedAt === 'number' ? d.savedAt : 0,
    }
  } catch {
    return null
  }
}

export const saveDraft = (d: Omit<PhotoVerseDraft, 'savedAt'>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...d, savedAt: Date.now() }))
  } catch {
    /* 사파리 프라이빗 모드 등 */
  }
}

export const isResumable = (d: PhotoVerseDraft | null, nowMs: number): d is PhotoVerseDraft & { verse: PickedVerse } =>
  !!d?.verse && nowMs - d.savedAt < RESUME_TTL_MS
