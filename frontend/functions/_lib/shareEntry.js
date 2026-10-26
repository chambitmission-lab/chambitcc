// 공유 링크(/b/ 말씀·/w/ 주보·/c/ 목양칼럼) Pages Function 공통 — 사람과 크롤러를 가른다.
//
// 크롤러(카톡 스크래퍼 등)는 백엔드(share_preview.py·bulletin_share.py·column_share.py)의 og:* 메타와 카드를 읽어야
// 미리보기에 그 구절·그 주보가 뜬다 — 이 프록시가 빠지면 카드가 조용히 홈으로 떨어진다.
//
// 사람은 다르다. 백엔드 페이지는 사람에게 '빈 화면 → location.replace → 앱' 왕복 하나를 더 끼우고,
// 백엔드가 자고 있으면(콜드 스타트) 그 빈 화면이 수 초였다. 그래서 사람 브라우저로 보이면
//   - 카카오톡 인앱: 외부 브라우저로 바로 내보낸다 (앱이 인앱에서 한 번 뜬 뒤 탈출하던 것을 생략)
//   - 그 외: 앱 셸(index.html)을 바로 내려준다 — src/utils/shareEntry.ts 가 /b/·/w/ 주소를 해시 주소로 바꿔 읽는다
// 판별이 애매하면 예전처럼 백엔드로 보낸다 — 그 페이지도 사람을 앱으로 보내므로 틀려도 느려질 뿐 막히지 않는다.
// (백엔드는 UA 로 봇을 가려내지 않는다는 원칙을 유지한다 — 분기는 여기 한 곳에만 둔다)
export const BACKEND_ORIGIN = 'https://port-0-chambit-ml1vrmry20fb0cc0.sel3.cloudtype.app'

/** 백엔드 응답을 기다리는 상한 — 카톡 스크래퍼는 몇 초 안에 포기하므로 그 전에 엣지 폴백 카드라도 준다 */
const BACKEND_TIMEOUT_MS = 6000

/**
 * 미리보기 크롤러·스크립트 — 카톡은 "facebookexternalhit/1.1; kakaotalk-scrap/1.0", 라인은 "...;line-poker/1.0".
 * `bot` 은 뒤에 '/', '-', ';', ')' 가 오거나 끝일 때만 — Mozilla 호환 크롤러는 전부 "Googlebot/2.1"·"PetalBot;"·
 * "DuckDuckBot-Https" 꼴이고, 그냥 `bot\b` 로 두면 CUBOT 폰("CUBOT X30 Build/...")이 크롤러로 묶여 느린 경로를 탔다.
 */
const CRAWLER_UA =
  /kakaotalk-scrap|facebookexternalhit|facebot|twitterbot|slackbot|discordbot|telegrambot|whatsapp|linkedinbot|pinterest|embedly|quora link preview|skypeuripreview|vkshare|googlebot|bingbot|yeti|daumoa|daum\/|naverbot|applebot|duckduckbot|baiduspider|yandex|bot(?=[\/\-;)]|$)|crawler|spider|scrap|preview|curl|wget|python|httpx|go-http|java\//i

/** 카카오톡 인앱 브라우저 — 스크래퍼(kakaotalk-scrap)는 위에서 먼저 걸러진다 */
const KAKAO_INAPP_UA = /KAKAOTALK/i

export const isHumanBrowser = (ua) => /Mozilla\/5\.0/.test(ua) && !CRAWLER_UA.test(ua)

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const PAGE_STYLE = `
  html { background:#f1f3f6; color:#191f28; color-scheme:light dark; }
  @media (prefers-color-scheme: dark) { html { background:#131313; color:#e5e2e1; } }
  body { margin:0; padding:2.5rem 1.5rem; font-family:-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif; line-height:1.7; }
  main { max-width:34rem; margin:0 auto; opacity:0; animation:reveal .3s ease 1s forwards; }
  @keyframes reveal { to { opacity:1; } }
  h1 { font-size:1rem; font-weight:700; color:#4593fc; margin:0 0 .75rem; }
  p { margin:0 0 1.25rem; font-size:1.0625rem; }
  a { color:#4593fc; }`

const htmlResponse = (html, status = 200) =>
  new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  })

/** 카카오톡 인앱 → 외부 브라우저로. src/utils/inappBrowser.ts 의 escapeKakaoInApp 과 같은 스킴 */
const kakaoEscapePage = (target, { title, heading }) => {
  const href = JSON.stringify(target)
  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${escapeHtml(title)}</title>
<script>
  // 외부 브라우저(안드로이드는 설치된 PWA)로 넘긴다. 스킴이 막힌 환경이면 인앱에서 그대로 앱을 연다.
  // 이 웹뷰에서 탈출을 시도했다는 표식 — 폴백·아래 링크로 인앱에 뜬 앱(main.tsx)이 다시 openExternal 을
  // 부르지 않게 한다 (★ src/utils/inappBrowser.ts 의 KAKAO_ESCAPE_KEY 와 같은 키).
  try { sessionStorage.setItem('kakaoEscapeAttempted', '1'); } catch (e) {}
  var ua = navigator.userAgent;
  // 카톡 비공식이지만 널리 쓰이는 '인앱 창 닫기' 스킴 — ★ src/utils/inappBrowser.ts 의 closeKakaoInApp 과 같은 문자열
  var closeScheme = /ipad|iphone|ipod/i.test(ua) ? 'kakaoweb://closeBrowser' : 'kakaotalk://inappbrowser/close';
  var fallback = setTimeout(function () { location.replace(${href}); }, 1500);
  var cancel = function () { clearTimeout(fallback); };
  // 외부 브라우저가 실제로 열려 이 웹뷰가 가려졌을 때만 폴백을 거두고 인앱 창을 닫는다.
  // 예전엔 300ms 뒤 무조건 닫았는데, openExternal 은 조용히 실패하고 닫기만 먹는 환경이면
  // 창이 닫혀 사용자가 아무것도 못 보고 폴백도 영영 돌지 않았다 — 가려졌다는 증거가 있을 때만 닫는다.
  // (안 닫으면 카톡에 빈 화면이 하나 남아 "여기저기 들락거리는" 느낌이 되므로, 증거가 있으면 꼭 닫는다)
  var closed = false;
  var closeIfHidden = function () {
    if (closed || document.visibilityState !== 'hidden') return;
    closed = true;
    cancel();
    location.href = closeScheme;
  };
  document.addEventListener('visibilitychange', closeIfHidden);
  window.addEventListener('pagehide', cancel);
  location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(${href});
  setTimeout(closeIfHidden, 300);
</script>
<style>${PAGE_STYLE}</style>
</head>
<body>
<main>
  <h1>${escapeHtml(heading)}</h1>
  <p>열고 있어요. 화면이 바뀌지 않으면 아래를 눌러 주세요.</p>
  <a href="${escapeHtml(target)}">${escapeHtml(heading)} 열기</a>
</main>
</body>
</html>`
  return htmlResponse(html)
}

/**
 * 백엔드가 자고 있거나(콜드 스타트) 죽었을 때 크롤러에게 주는 최소 OG 페이지 — 그 구절·그 주보 카드는
 * 못 그려도 교회 이름 카드는 뜨게 한다 (예전엔 5xx·타임아웃이 그대로 나가 카드가 빈 채 떨어졌다).
 * 사람(판별이 애매해 백엔드로 보낸 경우)은 meta refresh 로 그대로 앱에 도착한다.
 * no-store — 다음 긁기에서는 백엔드의 진짜 카드를 받아 가야 한다.
 */
const fallbackOgPage = (url, deepLink, { title, heading, description }) => {
  const t = escapeHtml(title)
  const d = escapeHtml(description || '부천참빛교회 공식 홈페이지')
  const canonical = escapeHtml(url.origin + url.pathname)
  const target = escapeHtml(deepLink)
  const image = escapeHtml(url.origin + '/pwa-512x512.png')
  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${t}</title>
<meta name="description" content="${d}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="부천참빛교회" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${image}" />
<meta property="og:locale" content="ko_KR" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${image}" />
<link rel="canonical" href="${canonical}" />
<meta http-equiv="refresh" content="0; url=${target}" />
<script>location.replace(${JSON.stringify(deepLink)});</script>
<style>${PAGE_STYLE}</style>
</head>
<body>
<main>
  <h1>${escapeHtml(heading)}</h1>
  <p>열고 있어요. 화면이 바뀌지 않으면 아래를 눌러 주세요.</p>
  <a href="${target}">${escapeHtml(heading)} 열기</a>
</main>
</body>
</html>`
  return htmlResponse(html)
}

/** 앱 셸 그대로 — 주소는 /b/·/w/ 로 남고, 앱이 라우터를 세우기 전에 해시 주소로 바꿔 끼운다 */
const appShell = async (env, url, request) => {
  const shell = await env.ASSETS.fetch(new Request(new URL('/', url), { headers: request.headers }))
  return new Response(shell.body, {
    status: shell.status,
    headers: { ...Object.fromEntries(shell.headers), 'cache-control': 'no-store' },
  })
}

/**
 * 경로·쿼리·헤더 그대로 백엔드 OG 라우트로.
 * 사람이 열 주소(deepLink 있음)의 HTML 은 백엔드가 5xx·타임아웃·연결 실패면 엣지 폴백 카드로 대신한다.
 * card.png 등(deepLink 없음)은 백엔드 응답을 그대로 — 이미지는 대신 그릴 수 없고, 없으면 크롤러가 제목만 쓴다.
 */
const proxyBackend = async (url, request, deepLink, labels) => {
  const upstream = new Request(BACKEND_ORIGIN + url.pathname + url.search, request)
  try {
    const res = await fetch(upstream, { signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS) })
    if (deepLink && res.status >= 500) return fallbackOgPage(url, deepLink, labels)
    return res
  } catch (e) {
    if (deepLink) return fallbackOgPage(url, deepLink, labels)
    return new Response(null, { status: 502, headers: { 'cache-control': 'no-store' } })
  }
}

/**
 * 공유 링크 응답.
 * @param deepLink 사람이 열 앱 주소(해시) — null 이면 사람이 열 주소가 아니다(card.png·형식 오류) → 백엔드
 * @param labels { title, heading, description } — 카카오 인앱 탈출 페이지·엣지 폴백 카드의 문구
 */
export const handleShareEntry = async ({ request, env }, deepLink, labels) => {
  const url = new URL(request.url)
  const ua = request.headers.get('user-agent') || ''
  if (deepLink && request.method === 'GET' && isHumanBrowser(ua)) {
    if (KAKAO_INAPP_UA.test(ua)) return kakaoEscapePage(deepLink, labels)
    return appShell(env, url, request)
  }
  return proxyBackend(url, request, deepLink, labels)
}
