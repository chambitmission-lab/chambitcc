// 방어적 정규화 — 백엔드가 이미 정리하지만, 혹시 캐시에 남은 <br> 등 HTML 이 흘러와도
// 화면에 태그가 그대로 노출되지 않도록 줄바꿈으로 바꾸고 잔여 태그를 제거한다.
export const normalizeReflection = (s: string): string =>
  (s || '')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/?\s*(p|div|li|ul|ol)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
