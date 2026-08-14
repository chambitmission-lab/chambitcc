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

/** RGB(0~255) → HSL. h 는 0~360, s·l 은 0~1 */
const rgbToHsl = (r: number, g: number, b: number) => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === rn) h = ((gn - bn) / d) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  h = Math.round(h * 60)
  if (h < 0) h += 360
  return { h, s, l }
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
    // RGB 일괄 감산은 색조가 죽어 검정처럼 읽힌다(골드 → 거의 블랙).
    // 색상(hue)은 지키고 채도를 살린 채 명도만 낮춰 '같은 색의 짙은 잉크'로 —
    // 골드 배경이면 딥 앰버, 핑크 배경이면 딥 로즈 글자가 된다.
    // 명도 21%는 가장 밝은 배경(흰색·골드)에서도 WCAG 4.5:1 을 지키는 상한 근처.
    const { h, s } = rgbToHsl(r, g, b)
    const sat = s > 0.2 ? Math.min(1, s * 1.15) : s
    return {
      color: `hsl(${h}, ${Math.round(sat * 100)}%, 21%)`,
      textShadow: '0 1px 1px rgba(255, 255, 255, 0.35)',
    }
  }
  return FALLBACK
}
