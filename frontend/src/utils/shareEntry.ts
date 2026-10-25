// 공유 링크(/b/ 말씀·/w/ 주보·/c/ 목양칼럼)로 들어온 사람 — Pages Function(functions/_lib/shareEntry.js)이 백엔드
// 리다이렉트 페이지를 거치지 않고 앱 셸을 바로 내려준다. 주소는 /b/1/23/4 그대로라 HashRouter 가
// 홈으로 읽으므로, 라우터를 세우기 전에 해시 주소로 바꿔 끼운다. Function 의 deepLink 와 같은 규칙.
//
// ★ index.html 의 인라인 스크립트(경로 → 해시)가 이 모듈보다 먼저 돌아 /w/43 은 이미 /#/w/43 이 되어 있다.
// 2026-10-25 이 점을 놓쳐 pathname('/')만 보다가 주보 공유 링크가 전부 홈으로 떨어졌다 — 해시 쪽도 같이 본다.

const BULLETIN = /^\/w\/(\d+)\/?$/
const COLUMN = /^\/c\/(\d+)\/?$/
const VERSE = /^\/b\/(\d{1,2})\/(\d{1,3})\/(\d{1,3})/

/** 공유 주소를 앱 해시 주소로 — 공유 주소가 아니면 null */
export const shareEntryHash = (pathname: string): string | null => {
  const w = BULLETIN.exec(pathname)
  if (w) return `/#/news?tab=bulletin&b=${w[1]}`
  const c = COLUMN.exec(pathname)
  if (c) return `/#/ministry?c=${c[1]}`
  const b = VERSE.exec(pathname)
  if (b && Number(b[1]) >= 1 && Number(b[1]) <= 66) return `/#/bible/${Number(b[1])}/${Number(b[2])}?verse=${Number(b[3])}`
  return null
}

/** 공유 주소로 볼 경로 — index.html 인라인 스크립트가 /w/43 → /#/w/43 로 먼저 바꿔 두므로 해시 쪽도 본다 */
export const shareEntryPath = (pathname: string, hash: string): string => {
  if (pathname !== '/') return pathname
  // '#/w/43?x' → '/w/43' (인라인 스크립트는 location.search 를 해시 뒤에 붙인다)
  return hash.startsWith('#/') ? hash.slice(1).split('?')[0] : ''
}

/** main.tsx 에서 라우터 생성 전에 한 번 */
export const rewriteShareEntry = () => {
  const hash = shareEntryHash(shareEntryPath(window.location.pathname, window.location.hash))
  if (hash) window.history.replaceState(null, '', hash)
}
