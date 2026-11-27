// 상황별 성구 관리 데스크 규칙 — 실제 화면·작성 창·dev 미리보기가 같이 쓴다
import type { SituationCategory } from '../../../types/situation'

/** 왼쪽 목록에서 고른 것 — 맨 위 '추천 규칙' 한 장 또는 카테고리 하나 */
export type SituationSel = { kind: 'rules' } | { kind: 'cat'; id: number }

export type RecommendMode = 'ai' | 'admin'

// 카테고리 아이콘(Material 이름 그대로 DB 저장) — 서브셋에 이미 든 이름만
export const ICON_OPTIONS = [
  'shield', 'cloud_off', 'favorite_border', 'sentiment_very_dissatisfied',
  'crisis_alert', 'wb_cloudy', 'storm', 'trending_down', 'help_outline',
  'person', 'explore', 'spa', 'healing', 'water_drop', 'favorite', 'handshake',
  'menu_book', 'church', 'star', 'bolt',
]
export const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444',
  '#64748b', '#0ea5e9', '#10b981', '#f97316', '#a78bfa',
  '#14b8a6', '#22c55e', '#f43f5e', '#3b82f6', '#84cc16',
]

// 기도 감정 태그 (backend prayer.emotion 키와 동일)
export const EMOTION_OPTIONS = [
  { key: 'tired', label: '지칠 때' },
  { key: 'anxious', label: '불안할 때' },
  { key: 'grateful', label: '감사할 때' },
  { key: 'sad', label: '슬플 때' },
  { key: 'lonely', label: '외로울 때' },
  { key: 'angry', label: '화날 때' },
  { key: 'hopeful', label: '희망이 필요할 때' },
  { key: 'confused', label: '혼란스러울 때' },
] as const

export const emotionLabel = (key: string) => EMOTION_OPTIONS.find((o) => o.key === key)?.label ?? key

/** 기도 추천 후보 — 서버도 '활성 + 구절 1개 이상'만 본다 */
export const isRecommendable = (c: SituationCategory) => c.is_active && c.verse_count > 0

export type MatchBy = 'emotion' | 'keyword' | 'default' | 'random'
export interface MatchResult {
  by: MatchBy
  /** 같은 순위 후보들 — 서버는 이 중 하나를 무작위로 고른다 */
  cats: SituationCategory[]
  /** keyword 매칭일 때 카테고리별 걸린 단어 */
  hits: Record<number, string[]>
}

/**
 * 기도 한 건에 어떤 카테고리 구절이 갈지 — backend situation_service._pick_category 와 같은 순서.
 * 감정 태그 → 제목·내용 키워드(많이 걸린 순) → 기본 카테고리 → 아무 카테고리.
 * (서버 규칙이 바뀌면 여기도 같이 고친다)
 */
export const matchPrayer = (all: SituationCategory[], emotion: string | null, text: string): MatchResult | null => {
  const cats = all.filter(isRecommendable)
  if (cats.length === 0) return null
  if (emotion) {
    const m = cats.filter((c) => (c.emotion_keys ?? []).includes(emotion))
    if (m.length) return { by: 'emotion', cats: m, hits: {} }
  }
  if (text.trim()) {
    const hits: Record<number, string[]> = {}
    for (const c of cats) {
      const h = (c.keywords ?? []).filter((kw) => kw && text.includes(kw))
      if (h.length) hits[c.id] = h
    }
    const ids = Object.keys(hits).map(Number)
    if (ids.length) {
      const best = Math.max(...ids.map((id) => hits[id].length))
      return { by: 'keyword', cats: cats.filter((c) => hits[c.id]?.length === best), hits }
    }
  }
  const defaults = cats.filter((c) => c.is_default)
  if (defaults.length) return { by: 'default', cats: defaults, hits: {} }
  return { by: 'random', cats, hits: {} }
}
