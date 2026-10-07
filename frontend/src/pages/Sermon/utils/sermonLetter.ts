// 말씀 편지 화면용 표기 유틸 — 소인 날짜 · 예배 부 · 손글씨 서명 · 요일 인사 · 동행 단계 기록
import type { Sermon } from '../../../types/sermon'

/** 제목 관례("주일 3부 예배")에서 예배 부를 읽는다. 없으면 null */
export const worshipSlot = (title: string): string | null => {
  const n = title.match(/(\d)\s*부/)?.[1]
  return n ? `${n}부` : null
}

/** 손글씨 서명 — "안동철 담임목사님" → "안동철 목사". 직함 앞 '담임'은 서명에서 뺀다 */
export const signatureName = (pastor: string): string =>
  pastor.trim().replace(/님$/, '').replace(/\s*담임\s*목사$/, ' 목사')

/** 좁은 자리용 설교자 이름 — "안동철 담임목사님" → "안동철" */
export const pastorShortName = (pastor: string): string => pastor.trim().split(/\s+/)[0] ?? pastor

export interface StampParts { year: number; md: string; day: string }

/** 소인 — 2026 / 10.04 / 주일 */
export const stampParts = (dateString: string): StampParts => {
  const d = new Date(dateString)
  const md = `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`
  const day = d.getDay() === 0 ? '주일' : d.toLocaleDateString('ko-KR', { weekday: 'short' })
  return { year: d.getFullYear(), md, day }
}

/** 요일마다 다른 첫 인사 — 주일엔 '오늘', 주중엔 '주일에 들은 말씀'을 다시 불러온다 */
export const weekdayGreeting = (now = new Date()): { lead: string; emphasis: string } => {
  const day = now.getDay()
  if (day === 0) return { lead: '주일이에요. 오늘 전해진 말씀,', emphasis: '한 줄로 붙잡아 볼까요?' }
  if (day === 6) return { lead: '토요일이에요. 내일 예배를 앞두고', emphasis: '지난 말씀을 한 번 더 펼쳐 봐요.' }
  const name = now.toLocaleDateString('ko-KR', { weekday: 'long' })
  return { lead: `${name}이에요. 주일에 들은 말씀,`, emphasis: '아직 마음에 남아 있나요?' }
}

/* ── 동행 단계(본문 읽기·설교 듣기) — 기기별 편의 기록이라 localStorage.
 *    서버에 남는 건 3단계 '한 줄'뿐이다. ── */
export interface WalkState { read: boolean; watch: boolean }
const walkKey = (sermonId: number) => `sermon-walk:${sermonId}`

export const readWalk = (sermonId: number): WalkState => {
  try {
    const raw = window.localStorage.getItem(walkKey(sermonId))
    if (!raw) return { read: false, watch: false }
    const v = JSON.parse(raw)
    return { read: !!v?.read, watch: !!v?.watch }
  } catch {
    return { read: false, watch: false }
  }
}

export const writeWalk = (sermonId: number, state: WalkState) => {
  try {
    window.localStorage.setItem(walkKey(sermonId), JSON.stringify(state))
  } catch {
    /* 저장 불가(사생활 보호 모드 등) — 이번 방문 동안만 기억 */
  }
}

/** 영상·음성 중 먼저 열 미디어 — 영상 우선 */
export const primaryMedia = (sermon: Sermon): 'video' | 'audio' | null =>
  sermon.video_url ? 'video' : sermon.audio_url ? 'audio' : null
