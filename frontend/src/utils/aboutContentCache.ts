// 소개 페이지 컨텐츠 localStorage 캐시
//
// 히어로 배경 URL은 /about-content API 응답 안에 들어있다. 캐시가 없으면
//   라우트 청크 → API 왕복 → React 렌더 → 그제서야 이미지 요청
// 순서라 배경이 눈에 띄게 늦게 뜬다. 지난 방문의 응답을 저장해 두면
//   (a) 라우트 진입 즉시 <img>를 렌더해 API 왕복을 기다리지 않고,
//   (b) 새로고침 진입은 index.html 인라인 스크립트가 <link rel="preload">로 더 앞당긴다.
//
// ⚠️ STORAGE_KEY 는 index.html 의 프리로드 스크립트에도 같은 문자열로 하드코딩되어 있다.
//    (인라인 스크립트는 번들 이전에 실행되므로 이 모듈을 import 할 수 없다) — 함께 수정할 것.
import type { AboutContent } from '../types/aboutContent'

export const ABOUT_CONTENT_STORAGE_KEY = 'about_content_cache'

export const readAboutContentCache = (): AboutContent | undefined => {
  try {
    const raw = localStorage.getItem(ABOUT_CONTENT_STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as AboutContent
    // 형태가 깨진 값(구버전·수동 편집)이 placeholder 로 들어가면 렌더가 터진다.
    if (!parsed || typeof parsed !== 'object' || typeof parsed.fields !== 'object') return undefined
    return parsed
  } catch {
    return undefined
  }
}

export const writeAboutContentCache = (content: AboutContent): void => {
  try {
    localStorage.setItem(ABOUT_CONTENT_STORAGE_KEY, JSON.stringify(content))
  } catch {
    // 용량 초과·프라이빗 모드 — 캐시는 부가 기능이므로 조용히 넘어간다
  }
}
