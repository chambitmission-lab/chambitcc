/** 업적 glowColor(rgba, 반투명) → 글리프 잉크용 불투명 색 */
export const achievementInk = (glow: string): string =>
  glow.replace(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*[\d.]+\s*)?\)/, 'rgb($1, $2, $3)')
