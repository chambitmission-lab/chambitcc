/**
 * API 시각 문자열 → Date.
 *
 * 백엔드 저장 정책(app/core/kst.py)은 "오프셋 없는 KST 벽시계"이고, 응답은 대부분
 * +09:00 / Z 오프셋을 붙여 내려온다. 오프셋이 없으면 KST 로 간주해 '+09:00' 을 붙인다.
 * 기기 타임존으로 해석되는 `new Date(iso)` 를 API 값에 직접 쓰지 말 것.
 */

const OFFSET_RE = /(?:[Zz]|[+-]\d{2}:?\d{2})$/
const KST_OFFSET = '+09:00'

export const pad2 = (n: number): string => String(n).padStart(2, '0')

export const isValidDate = (d: Date): boolean => !Number.isNaN(d.getTime())

/** 'YYYY-MM-DD HH:mm' 처럼 공백으로 이어진 꼴을 ISO 'T' 꼴로 */
const normalize = (value: string): string => value.trim().replace(' ', 'T')

/**
 * 시각 문자열(날짜+시각)을 KST 기준으로 파싱한다.
 * 'YYYY-MM-DD' 날짜 전용 문자열은 그대로 `new Date()` 에 넘긴다(UTC 자정 — 옛 호출부 호환).
 */
export const parseApiDate = (dateString: string): Date => {
  const value = normalize(dateString)
  if (!OFFSET_RE.test(value) && value.includes('T')) {
    return new Date(`${value}${KST_OFFSET}`)
  }
  return new Date(value)
}

/**
 * parseApiDate 와 같되, 'YYYY-MM-DD' 날짜 전용 문자열도 KST 자정으로 못 박는다.
 * RSVP 마감처럼 "실제로 지났는가" 비교에 쓴다.
 */
export const parseKstDate = (value: string): Date => {
  const normalized = normalize(value)
  if (OFFSET_RE.test(normalized)) return new Date(normalized)
  if (normalized.includes('T')) return new Date(`${normalized}${KST_OFFSET}`)
  return new Date(`${normalized}T00:00:00${KST_OFFSET}`)
}
