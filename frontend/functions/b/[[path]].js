// Cloudflare Pages Function — /b/* 말씀 공유 링크 프록시.
//
// vercel.json 의 `/b/:path*` rewrite 를 대체한다. Pages 의 _redirects 파일은
// 외부 도메인으로의 200 프록시를 지원하지 않으므로 Function 으로 처리해야 한다.
// 백엔드(share_preview.py)가 og:* 메타를 붙여 응답해야 카톡 미리보기 카드에
// 실제 구절이 뜬다 — 이 프록시가 빠지면 공유 카드가 조용히 홈으로 떨어진다.
const BACKEND_ORIGIN = 'https://port-0-chambit-ml1vrmry20fb0cc0.sel3.cloudtype.app'

export async function onRequest({ request }) {
  const url = new URL(request.url)
  // 경로·쿼리는 그대로, 헤더(User-Agent 등)도 그대로 전달 —
  // 백엔드가 크롤러/사람을 UA 로 구분해 OG 응답과 앱 리다이렉트를 가른다.
  const upstream = new Request(BACKEND_ORIGIN + url.pathname + url.search, request)
  return fetch(upstream)
}
