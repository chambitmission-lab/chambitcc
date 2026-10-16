import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import seo from './publicPages.json'

// 라우트별 문서 제목.
// HashRouter 라 검색엔진·카톡 크롤러는 index.html 의 정적 메타만 읽지만, 탭 제목·북마크·
// 방문 기록·공유 시트(모바일 "페이지 공유")는 document.title 을 그대로 쓴다.
// 제목 표는 src/seo/publicPages.json 의 routeTitles 가 단일 출처 — 프리렌더 정적 페이지
// (scripts/prerender-seo.mjs)와 같은 문구를 쓴다.
//
// 패턴 규칙: 정확히 일치하는 경로가 우선, 없으면 가장 긴 `prefix/*` 가 잡는다.
// ("/bible/plans/3" → "/bible/plans/*", "/bible/1/1" → "/bible/*")

type Pattern = [string, string]
const PATTERNS = seo.routeTitles as Pattern[]
const SUFFIX = seo.site.titleSuffix
const DEFAULT_TITLE = seo.site.defaultTitle

const EXACT = new Map<string, string>()
const PREFIX: Array<[string, string]> = []
for (const [pattern, title] of PATTERNS) {
  if (pattern.endsWith('/*')) PREFIX.push([pattern.slice(0, -1), title]) // "/bible/" 꼴로 보관
  else EXACT.set(pattern, title)
}
// 긴 접두사부터 — "/bible/typing/" 이 "/bible/" 보다 먼저 매칭돼야 한다
PREFIX.sort((a, b) => b[0].length - a[0].length)

function titleForPath(pathname: string): string {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (path === '/') return DEFAULT_TITLE
  const exact = EXACT.get(path)
  if (exact) return `${exact} | ${SUFFIX}`
  for (const [prefix, title] of PREFIX) {
    if (path.startsWith(prefix)) return `${title} | ${SUFFIX}`
  }
  return DEFAULT_TITLE
}

export const RouteMeta = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    // 몰입형 화면(성경 본문 등)이 스스로 더 구체적인 제목을 쓰고 싶으면 이 effect 뒤에
    // document.title 을 덮으면 된다 — 라우트가 바뀔 때만 여기서 다시 쓴다.
    document.title = titleForPath(pathname)
  }, [pathname])
  return null
}
