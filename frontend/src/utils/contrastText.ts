/**
 * 배경색 휘도(luminance)에 따라 가독성 있는 텍스트 색 + 그림자를 계산.
 * - 밝은 배경(흰색·금색 계열)에는 어두운 글씨 + 흰 그림자
 * - 어두운 배경에는 흰 글씨 + 검은 그림자
 *
 * 입력은 'rgba(R, G, B, A)' / 'rgb(R, G, B)' 형식 가정 (achievement.ts glowColor 패턴).
 * 파싱 실패 시 안전 기본값(흰 글씨)을 반환.
 */
export interface ReadableTextStyle {
  color: string
  textShadow: string
}

const FALLBACK: ReadableTextStyle = {
  color: '#fff',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
}

/**
 * glowColor(rgba)의 알파를 제거해 불투명 색으로 변환.
 * 레벨 뱃지/칩 배경에 써서, 흰 배경 위에서도 색이 카드에 비쳐 흐려지지 않고
 * getReadableTextStyle 의 RGB 기반 대비 판정과 실제 렌더가 일치하도록 한다.
 */
export function toOpaqueColor(rgbaColor: string): string {
  const m = rgbaColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!m) return rgbaColor
  return `rgb(${m[1]}, ${m[2]}, ${m[3]})`
}

export function getReadableTextStyle(rgbaColor: string): ReadableTextStyle {
  const m = rgbaColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!m) return FALLBACK
  const r = Number(m[1])
  const g = Number(m[2])
  const b = Number(m[3])
  // ITU-R BT.601 휘도 근사 (0~1)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  if (luminance > 0.65) {
    return {
      color: '#1f2937',
      textShadow: '0 1px 2px rgba(255, 255, 255, 0.7)',
    }
  }
  return FALLBACK
}
