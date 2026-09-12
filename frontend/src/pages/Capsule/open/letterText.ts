// 편지 문구 — 보낸이·수취인·서명·소인·건너온 시간. 앱의 목소리와 편지의 목소리를 가르는 곳.

import type { CapsuleDetail } from '../../../types/timeCapsule'
import { formatKoreanDate } from '../capsuleDates'

const senderLine = (capsule: CapsuleDetail): string => {
  if (capsule.role === 'self') return '과거의 나로부터'
  if (capsule.role === 'recipient') return `${capsule.sender_name}님으로부터`
  return `${capsule.recipient_name || '소중한 분'}에게 보낸 캡슐`
}

/** 봉투에 손글씨로 적히는 수취인 */
const addressTo = (capsule: CapsuleDetail): string => {
  if (capsule.role === 'self') return '미래의 나'
  return capsule.recipient_name || '당신'
}

/** 편지 끝 서명 — 편지는 "~로부터" 머리말이 아니라 손글씨 서명으로 끝난다 */
const signatureFrom = (capsule: CapsuleDetail): string => {
  if (capsule.role === 'self') return '과거의 나'
  if (capsule.role === 'recipient') return capsule.sender_name || '보낸 사람'
  return '그날의 나'
}

/** 소인 각인: 2026-07-29 → { year: "'26", day: "7 · 29" } — 초대장 소인과 같은 규칙 */
const postmark = (dateStr: string): { year: string; day: string } => {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return { year: '', day: '' }
  return {
    year: `'${String(d.getFullYear()).slice(2)}`,
    day: `${d.getMonth() + 1} · ${d.getDate()}`,
  }
}

/** 편지가 여행한 날수 — 봉인일→개봉일. 읽는 시점(오늘)이 아니다:
    도착한 편지를 열흘 뒤에 다시 읽어도 여행이 길어지지 않는다.
    (목록의 "N일을 건너온 마음"과 같은 기준) */
const journeyDays = (sealedAt: string, openAt: string): number => {
  const sealed = new Date(sealedAt)
  const open = new Date(openAt)
  if (Number.isNaN(sealed.getTime()) || Number.isNaN(open.getTime())) return 0
  const a = new Date(sealed.getFullYear(), sealed.getMonth(), sealed.getDate()).getTime()
  const b = new Date(open.getFullYear(), open.getMonth(), open.getDate()).getTime()
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

/** 건너온 시간 — 이 편지의 감정선. 날짜 사실("7월 29일 봉인")보다 먼저 읽혀야 한다. */
const journeyLine = (sealedAt: string, openAt: string): string => {
  const days = journeyDays(sealedAt, openAt)
  if (days === 0) return '오늘 봉인해 오늘 도착한 편지예요'
  if (days < 365) return `${days.toLocaleString()}일을 건너 도착했어요`
  const years = Math.floor(days / 365)
  return `${years}년 ${(days - years * 365).toLocaleString()}일, ${days.toLocaleString()}일을 건너왔어요`
}

/** 편지지 위 밤하늘의 내레이션 — 앱의 목소리는 편지 밖에서만 말한다.
    봉인일 사실은 소인·서명에도 있지만, 여기서 감정선과 한 문장으로 묶는다 */
const arrivalNarration = (sealedAt: string, openAt: string): string => {
  if (journeyDays(sealedAt, openAt) === 0) return journeyLine(sealedAt, openAt)
  return `${formatKoreanDate(sealedAt)}에 봉인되어, ${journeyLine(sealedAt, openAt)}`
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { senderLine, addressTo, signatureFrom, postmark, journeyLine, arrivalNarration }
