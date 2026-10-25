// 공유 링크(/b/ 말씀·/w/ 주보)로 들어온 사람 — Pages Function(functions/_lib/shareEntry.js)이 백엔드
// 리다이렉트 페이지를 거치지 않고 앱 셸을 바로 내려준다. 주소는 /b/1/23/4 그대로라 HashRouter 가
// 홈으로 읽으므로, 라우터를 세우기 전에 해시 주소로 바꿔 끼운다. Function 의 deepLink 와 같은 규칙.

const BULLETIN = /^\/w\/(\d+)\/?$/
const VERSE = /^\/b\/(\d{1,2})\/(\d{1,3})\/(\d{1,3})/

/** 공유 주소를 앱 해시 주소로 — 공유 주소가 아니면 null */
export const shareEntryHash = (pathname: string): string | null => {
  const w = BULLETIN.exec(pathname)
  if (w) return `/#/news?tab=bulletin&b=${w[1]}`
  const b = VERSE.exec(pathname)
  if (b && Number(b[1]) >= 1 && Number(b[1]) <= 66) return `/#/bible/${Number(b[1])}/${Number(b[2])}?verse=${Number(b[3])}`
  return null
}

/** main.tsx 에서 라우터 생성 전에 한 번 */
export const rewriteShareEntry = () => {
  const hash = shareEntryHash(window.location.pathname)
  if (hash) window.history.replaceState(null, '', hash)
}
