// Cloudflare Pages Function — /w/* 주보 공유 링크 프록시.
//
// /b/* 말씀 링크와 같은 구조다 (functions/b/[[path]].js 참고).
// 백엔드(bulletin_share.py)가 og:* 메타와 앨범 커버 카드를 붙여 응답해야 카톡
// 미리보기에 그 주보가 뜬다 — 이 프록시가 빠지면 카드가 조용히 홈으로 떨어진다.
const BACKEND_ORIGIN = 'https://port-0-chambit-ml1vrmry20fb0cc0.sel3.cloudtype.app'

export async function onRequest({ request }) {
  const url = new URL(request.url)
  const upstream = new Request(BACKEND_ORIGIN + url.pathname + url.search, request)
  return fetch(upstream)
}
