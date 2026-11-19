// 만들던 카드 기억 — 스타일은 다음에 와도 그대로, 말씀·감성 배경은 '이어서 만들기'로 되살린다.
// 사진 자체는 저장하지 않는다(기기 밖으로도, 브라우저 저장소에도). 기억만 못 할 뿐 동작은 그대로다.

import type { VerseCardStyle } from './photoVerseCanvas'
import type { PickedVerse } from './recommendedVerses'
import { safeStorage } from '../../../utils/safeStorage'
import { isInkPageEmpty, parseInkPageFile, toInkPageFile } from '../../Capsule/ink/inkModel'
import type { InkPage } from '../../Capsule/ink/inkModel'

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
  const d = safeStorage.getJson(KEY) as Partial<PhotoVerseDraft> | null | undefined
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
}

/* 사파리 프라이빗 모드 등 저장 실패는 무시 */
export const saveDraft = (d: Omit<PhotoVerseDraft, 'savedAt'>) => {
  safeStorage.setJson(KEY, { ...d, savedAt: Date.now() })
}

export const isResumable = (d: PhotoVerseDraft | null, nowMs: number): d is PhotoVerseDraft & { verse: PickedVerse } =>
  !!d?.verse && nowMs - d.savedAt < RESUME_TTL_MS

// ── 직접 쓴 손글씨 — 획이 수십 KB라 스타일 초안과 따로 둔다. 사진처럼 이 기기 밖으로는 나가지 않는다 ──
const INK_KEY = 'chambit.photoVerse.ink.v1'

export interface PhotoVerseInkDraft {
  /** 이 글씨가 따라 쓴 말씀 — 같은 말씀을 이어 만들 때만 되살린다 */
  refLabel: string
  page: InkPage
  /** 손글씨로 보고 있었는지(서체로 돌려 둔 채 나갔으면 false) */
  on: boolean
}

export const loadInkDraft = (): PhotoVerseInkDraft | null => {
  const d = safeStorage.getJson(INK_KEY) as { refLabel?: unknown; page?: unknown; on?: unknown } | null | undefined
  if (!d || typeof d !== 'object' || typeof d.refLabel !== 'string') return null
  const page = parseInkPageFile(d.page)
  if (!page || isInkPageEmpty(page)) return null
  return { refLabel: d.refLabel, page, on: d.on !== false }
}

export const saveInkDraft = (d: PhotoVerseInkDraft | null) => {
  if (!d || isInkPageEmpty(d.page)) {
    safeStorage.remove(INK_KEY)
    return
  }
  safeStorage.setJson(INK_KEY, { refLabel: d.refLabel, page: toInkPageFile(d.page), on: d.on })
}
