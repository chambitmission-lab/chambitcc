// Cloudflare Pages Function — /r2/* R2 미디어 엣지 캐시 프록시.
//
// R2 버킷의 공개 주소(pub-*.r2.dev)는 국내 통신사에서 서울이 아닌 미국(LAX) 엣지로
// 라우팅되고(실측 연결 145ms · TTFB 600ms), 엣지 캐시도 없어 요청마다 버킷 원본까지
// 다녀온다. 반면 이 Pages 사이트는 서울(ICN) 엣지에서 13ms 에 응답한다.
// 그래서 같은 파일을 이 오리진의 /r2/<key> 로도 내주고, 한 번 받은 파일은 엣지 캐시에
// 넣어 다음 요청부터는 서울에서 바로 나가게 한다.
//
// DB 에 저장된 URL(r2.dev)은 그대로 둔다 — 서비스 워커(public/sw.js 의 R2 이미지 분기)가
// 이미지 요청만 이 경로로 돌린다. 백엔드 R2_PUBLIC_URL 과 아래 오리진은 같은 버킷이어야 한다.
const R2_ORIGIN = 'https://pub-87bb083395694bdf9d778c720a600324.r2.dev'

// 업로드 key 에는 timestamp+uuid 가 들어가 같은 URL 의 내용이 바뀌지 않는다
// (r2.dev 원본 응답도 동일한 헤더). 고정 key 를 쓰는 파일은 ?v= 쿼리로 갱신하므로
// 캐시 키에 쿼리를 포함해 둔다.
const CACHE_CONTROL = 'public, max-age=31536000, immutable'

// 서비스 워커가 "이 호스트에 프록시가 있다"를 알아보는 표식 (sw.js 의 R2_PROXY_MARK).
// 없는 호스트(localhost·GitHub Pages)에선 /r2/* 가 index.html 로 떨어지므로 헤더로 구분한다.
const PROXY_MARK = { 'X-R2-Proxy': '1' }

export async function onRequest({ request, waitUntil }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD', ...PROXY_MARK } })
  }

  const url = new URL(request.url)
  const key = url.pathname.replace(/^\/r2\/+/, '')
  if (!key) return new Response('Not Found', { status: 404, headers: PROXY_MARK })

  const upstreamUrl = `${R2_ORIGIN}/${key}${url.search}`

  // Range(오디오·영상 탐색)는 캐시를 거치지 않고 그대로 통과 — 부분 응답(206)은 cache.put 이 안 된다
  if (request.headers.has('range')) {
    return fetch(upstreamUrl, { method: request.method, headers: { Range: request.headers.get('range') } })
  }

  const cache = caches.default
  const cacheKey = new Request(url.toString(), { method: 'GET' })

  const cached = await cache.match(cacheKey)
  if (cached) return cached

  const upstream = await fetch(upstreamUrl)
  // 404 등 실패 응답은 캐시하지 않는다 — 방금 올린 파일이 1년간 404 로 굳는 일을 막는다
  if (!upstream.ok) {
    return new Response(upstream.body, { status: upstream.status, headers: { 'Cache-Control': 'no-store', ...PROXY_MARK } })
  }

  const response = new Response(upstream.body, upstream)
  response.headers.set('Cache-Control', CACHE_CONTROL)
  response.headers.set('X-R2-Proxy', '1')
  // <img crossorigin>·canvas(말씀 카드) 가 다른 도메인(kro.kr ↔ pages.dev)에서 불러도 막히지 않게
  response.headers.set('Access-Control-Allow-Origin', '*')

  if (request.method === 'GET') waitUntil(cache.put(cacheKey, response.clone()))
  return response
}
