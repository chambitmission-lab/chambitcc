import type { PrayerEmotion } from '../../../types/prayer'

// /profile 기도 수첩의 톤·낙서·날짜 규칙 (컴포넌트는 PrayerNotebook.tsx)

export type NotebookTone = 'rose' | 'sage' | 'mustard' | 'sky' | 'clay' | 'plain'
export type DoodleName =
  | 'heart' | 'sprout' | 'sun' | 'drop' | 'cloud' | 'moon' | 'swirl'
  | 'lock' | 'church' | 'bubble' | 'book' | 'pencil'

// 감정 → 바랜 파스텔 톤 + 낙서. 감정이 없으면 id 로 톤을 돌려 낱장마다 색이 고정되게 한다.
const EMOTION_LOOK: Record<PrayerEmotion, { tone: NotebookTone; doodle: DoodleName }> = {
  grateful: { tone: 'mustard', doodle: 'sun' },
  hopeful: { tone: 'sage', doodle: 'sprout' },
  tired: { tone: 'sky', doodle: 'moon' },
  sad: { tone: 'sky', doodle: 'drop' },
  lonely: { tone: 'rose', doodle: 'heart' },
  anxious: { tone: 'clay', doodle: 'cloud' },
  angry: { tone: 'clay', doodle: 'cloud' },
  confused: { tone: 'mustard', doodle: 'swirl' },
}
export const ROTATION: { tone: NotebookTone; doodle: DoodleName }[] = [
  { tone: 'rose', doodle: 'heart' },
  { tone: 'sage', doodle: 'sprout' },
  { tone: 'mustard', doodle: 'sun' },
  { tone: 'sky', doodle: 'drop' },
  { tone: 'clay', doodle: 'cloud' },
]

export const pickLook = (seed: number, emotion?: PrayerEmotion | null) =>
  (emotion && EMOTION_LOOK[emotion]) || ROTATION[Math.abs(seed) % ROTATION.length]

/** "10월 18일 (일)" / "Oct 18 (Sun)" */
export const notebookDate = (iso: string, language: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const locale = language === 'ko' ? 'ko-KR' : 'en-US'
  const md = d.toLocaleDateString(locale, { month: language === 'ko' ? 'long' : 'short', day: 'numeric' })
  const wd = d.toLocaleDateString(locale, { weekday: 'short' })
  return `${md} (${wd})`
}

/** 응답 도장 날짜 "10.15" */
export const stampDate = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`
}

/** 본문 공통 클래스 — 줄 노트 괘선에 맞춘 행간 + 잉크색 '더보기' */
export const RULED_TEXT = 'nb-ruled'
export const RULED_TOGGLE = 'nb-more'
