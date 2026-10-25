// 공유 링크(/b/ 말씀·/w/ 주보) Pages Function 공통 — 사람과 크롤러를 가른다.
//
// 크롤러(카톡 스크래퍼 등)는 백엔드(share_preview.py·bulletin_share.py)의 og:* 메타와 카드를 읽어야
// 미리보기에 그 구절·그 주보가 뜬다 — 이 프록시가 빠지면 카드가 조용히 홈으로 떨어진다.
//
// 사람은 다르다. 백엔드 페이지는 사람에게 '빈 화면 → location.replace → 앱' 왕복 하나를 더 끼우고,
// 백엔드가 자고 있으면(콜드 스타트) 그 빈 화면이 수 초였다. 그래서 사람 브라우저로 보이면
//   - 카카오톡 인앱: 외부 브라우저로 바로 내보낸다 (앱이 인앱에서 한 번 뜬 뒤 탈출하던 것을 생략)
//   - 그 외: 앱 셸(index.html)을 바로 내려준다 — src/utils/shareEntry.ts 가 /b/·/w/ 주소를 해시 주소로 바꿔 읽는다
// 판별이 애매하면 예전처럼 백엔드로 보낸다 — 그 페이지도 사람을 앱으로 보내므로 틀려도 느려질 뿐 막히지 않는다.
// (백엔드는 UA 로 봇을 가려내지 않는다는 원칙을 유지한다 — 분기는 여기 한 곳에만 둔다)
export const BACKEND_ORIGIN = 'https://port-0-chambit-ml1vrmry20fb0cc0.sel3.cloudtype.app'

/** 미리보기 크롤러·스크립트 — 카톡은 "facebookexternalhit/1.1; kakaotalk-scrap/1.0", 라인은 "...;line-poker/1.0" */
const CRAWLER_UA =
  /kakaotalk-scrap|facebookexternalhit|facebot|twitterbot|slackbot|discordbot|telegrambot|whatsapp|linkedinbot|pinterest|embedly|quora link preview|skypeuripreview|vkshare|googlebot|bingbot|yeti|daumoa|naverbot|applebot|duckduckbot|baiduspider|yandex|bot\b|crawler|spider|scrap|preview|curl|wget|python|httpx|go-http|java\//i

/** 카카오톡 인앱 브라우저 — 스크래퍼(kakaotalk-scrap)는 위에서 먼저 걸러진다 */
const KAKAO_INAPP_UA = /KAKAOTALK/i

export const isHumanBrowser = (ua) => /Mozilla\/5\.0/.test(ua) && !CRAWLER_UA.test(ua)

/** 카카오톡 인앱 → 외부 브라우저로. src/utils/inappBrowser.ts 의 escapeKakaoInApp 과 같은 스킴 */
const kakaoEscapePage = (target, { title, heading }) => {
  const href = JSON.stringify(target)
  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${title}</title>
<script>
  // 외부 브라우저(안드로이드는 설치된 PWA)로 넘긴다. 스킴이 막힌 환경이면 인앱에서 그대로 앱을 연다.
  location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(${href});
  setTimeout(function () { location.replace(${href}); }, 1500);
</script>
<style>
  html { background:#f1f3f6; color:#191f28; color-scheme:light dark; }
  @media (prefers-color-scheme: dark) { html { background:#131313; color:#e5e2e1; } }
  body { margin:0; padding:2.5rem 1.5rem; font-family:-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif; line-height:1.7; }
  main { max-width:34rem; margin:0 auto; opacity:0; animation:reveal .3s ease 2s forwards; }
  @keyframes reveal { to { opacity:1; } }
  h1 { font-size:1rem; font-weight:700; color:#4593fc; margin:0 0 .75rem; }
  p { margin:0 0 1.25rem; font-size:1.0625rem; }
  a { color:#4593fc; }
</style>
</head>
<body>
<main>
  <h1>${heading}</h1>
  <p>열고 있어요. 화면이 바뀌지 않으면 아래를 눌러 주세요.</p>
  <a href="${target.replace(/"/g, '&quot;')}">${heading} 열기</a>
</main>
</body>
</html>`
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  })
}

/** 앱 셸 그대로 — 주소는 /b/·/w/ 로 남고, 앱이 라우터를 세우기 전에 해시 주소로 바꿔 끼운다 */
const appShell = async (env, url, request) => {
  const shell = await env.ASSETS.fetch(new Request(new URL('/', url), { headers: request.headers }))
  return new Response(shell.body, {
    status: shell.status,
    headers: { ...Object.fromEntries(shell.headers), 'cache-control': 'no-store' },
  })
}

/** 경로·쿼리·헤더 그대로 백엔드 OG 라우트로 */
const proxyBackend = (url, request) => fetch(new Request(BACKEND_ORIGIN + url.pathname + url.search, request))

/**
 * 공유 링크 응답.
 * @param deepLink 사람이 열 앱 주소(해시) — null 이면 사람이 열 주소가 아니다(card.png·형식 오류) → 백엔드
 * @param labels 카카오 인앱 탈출 페이지의 제목·머리말
 */
export const handleShareEntry = async ({ request, env }, deepLink, labels) => {
  const url = new URL(request.url)
  const ua = request.headers.get('user-agent') || ''
  if (deepLink && request.method === 'GET' && isHumanBrowser(ua)) {
    if (KAKAO_INAPP_UA.test(ua)) return kakaoEscapePage(deepLink, labels)
    return appShell(env, url, request)
  }
  return proxyBackend(url, request)
}
