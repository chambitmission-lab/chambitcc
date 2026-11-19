// 담임목사 이름 → 가위로 오린 인물 사진(public/images/greeting). 없으면 photo_url 을 쓴다.
// Greeting.tsx(그리기)와 prefetch.ts(선요청)가 같은 표를 봐야 미리 받은 파일이 실제로 쓰인다.
// 회전·축소를 그림에 미리 구워(480×661, Lanczos, webp q85) 브라우저 재샘플링 흐림을 없앴다.
export const CUT_PORTRAITS: Record<string, string> = {
  안동철: '/images/greeting/pastor-greeting.webp',
}

/** 그림의 고유 크기 — <img width/height> 로 넘겨 디코딩 전에도 비율을 알게 한다 */
export const CUT_PORTRAIT_SIZE = { width: 480, height: 661 } as const

export const cutPortraitFor = (nameKo: string | null | undefined): string =>
  CUT_PORTRAITS[nameKo?.trim() ?? ''] ?? ''

const warmed = new Set<string>()

/** 브라우저 HTTP 캐시에 사진을 넣어 둔다 (같은 주소는 한 번만) */
export const warmImage = (url: string | null | undefined): void => {
  const src = url?.trim()
  if (!src || warmed.has(src) || typeof Image === 'undefined') return
  warmed.add(src)
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

/**
 * 지금 담임목사의 오린 사진을 응답을 기다리지 않고 데운다.
 * 지난 방문 캐시에 이름이 있으면 그 사람 것만, 첫 방문(캐시 없음)이면 표의 사진을 모두
 * 데운다 — 표는 현직 한 분만 두므로 실제로는 한 장(약 42KB)이다.
 */
export const warmCutPortraits = (cachedNameKo: string | null | undefined): void => {
  if (cachedNameKo !== undefined) {
    warmImage(cutPortraitFor(cachedNameKo))
    return
  }
  Object.values(CUT_PORTRAITS).forEach(warmImage)
}
