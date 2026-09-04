// 소개 히어로 LQIP (Low Quality Image Placeholder)
//
// 히어로 사진이 도착하기 전에는 .about-hero 의 브랜드 블루 그라데이션이 그대로 보이다가
// 사진으로 바뀐다 — 파란 화면이 번쩍 스쳤다 사라지는 그 현상.
// 사진을 32px 짜리로 줄여 data URL 로 저장해 두면, 다음 진입부터는 첫 프레임에
// 사진과 같은 색·구도가 이미 깔려 있어 파란 점프 자체가 없어진다.
//
// 빌드 타임에 썸네일을 굽지 않는 이유: 히어로는 관리자가 화면에서 교체하는 이미지라
// 구워 넣으면 교체 즉시 옛 색이 남는다. 원본 URL을 키로 함께 저장해, 배경을 바꾸면
// (파일명에 timestamp+uuid 가 들어가 URL 이 달라진다) 자동으로 무효화되게 한다.
const STORAGE_KEY = 'about_hero_lqip_v1'

/** 가로 32px — 색·구도만 남고 얼굴 등 식별 가능한 형체는 남지 않는 크기 */
const LQIP_WIDTH = 32

type StoredLqip = {
  /** 이 LQIP 를 뽑아낸 원본 사진 URL */
  url: string
  /** data:image/... 형태의 축소본 */
  data: string
}

/**
 * 저장해 둔 LQIP — 지금 배경 URL 에서 뽑은 것일 때만 돌려준다.
 * 배경이 교체되면 URL 이 달라져 자동으로 버려진다(옛 사진 색이 깔리지 않는다).
 */
export const readAboutHeroLqip = (url: string | null): string | null => {
  if (!url) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredLqip
    if (!parsed || parsed.url !== url || typeof parsed.data !== 'string') return null
    return parsed.data
  } catch {
    return null
  }
}

/**
 * 로드가 끝난 히어로 <img> 에서 축소본을 떠 저장한다 (다음 진입용).
 *
 * 이미 같은 URL 의 LQIP 가 있으면 캔버스 작업을 건너뛴다 — 매 진입마다 할 이유가 없다.
 * 실패해도(캔버스 오염, 저장소 가득) 조용히 넘어간다: 없으면 예전처럼 파란 폴백이 보일 뿐이다.
 */
export const captureAboutHeroLqip = (img: HTMLImageElement, url: string): void => {
  try {
    if (!url || readAboutHeroLqip(url)) return
    const w = img.naturalWidth
    const h = img.naturalHeight
    if (!w || !h) return

    const canvas = document.createElement('canvas')
    canvas.width = LQIP_WIDTH
    canvas.height = Math.max(1, Math.round((h / w) * LQIP_WIDTH))
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // crossOrigin="anonymous" + ACAO 응답이라 캔버스가 오염되지 않아 추출이 가능하다.
    // (오염됐다면 toDataURL 이 SecurityError 를 던지고 아래 catch 로 빠진다)
    // webp 인코딩을 지원하지 않는 브라우저(구형 Safari 등)는 조용히 PNG 로 떨어진다.
    // 32px 짜리라 PNG 여도 몇 백 바이트 수준이므로 그대로 쓴다 — 형식만 확인한다.
    const data = canvas.toDataURL('image/webp', 0.7)
    if (!data.startsWith('data:image/')) return

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, data } satisfies StoredLqip))
  } catch {
    // LQIP 는 부가 기능 — 실패해도 화면은 그대로 동작한다
  }
}
