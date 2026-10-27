// R2 공개 버킷(r2.dev)의 파일을 fetch 로 읽을 때 — 같은 출처 /r2/<key> 엣지 프록시로 돌린다.
//
// r2.dev 는 Access-Control-Allow-Origin 을 내주지 않아(2026-10-27 실측, OPTIONS 는 403) 앱에서
// fetch 하면 CORS 로 막힌다. <img> 는 서비스 워커(public/sw.js)가 이미지만 프록시로 돌려 주지만
// JSON(손글씨 획)·텍스트는 destination 이 'image' 가 아니라 그 분기를 타지 않는다.
// functions/r2/[[path]].js 는 같은 출처라 CORS 가 없고 ACAO:* 도 붙이며 서울 엣지에 캐시된다.
// 프록시가 없는 호스트(localhost·GitHub Pages)에선 /r2/* 가 index.html 로 떨어지므로
// 표식 헤더(X-R2-Proxy)가 없으면 원래 주소로 한 번 더 시도한다(거기서 CORS 면 호출자가 폴백).
const R2_PUBLIC_HOST = 'pub-87bb083395694bdf9d778c720a600324.r2.dev'
const R2_PROXY_MARK = 'x-r2-proxy'

let proxyAvailable = true

/** r2.dev 주소면 같은 출처 프록시 주소를, 아니면 null */
export const r2ProxyUrl = (url: string): string | null => {
  try {
    const u = new URL(url, window.location.origin)
    if (u.hostname !== R2_PUBLIC_HOST) return null
    return `${window.location.origin}/r2${u.pathname}${u.search}`
  } catch {
    return null
  }
}

/** r2.dev 파일 fetch — 프록시 먼저, 안 되면 원래 주소. 실패(HTTP 오류·CORS)는 reject */
export const fetchR2 = async (url: string, init?: RequestInit): Promise<Response> => {
  const proxied = proxyAvailable ? r2ProxyUrl(url) : null
  if (proxied) {
    try {
      const res = await fetch(proxied, { ...init, credentials: 'omit' })
      if (res.headers.has(R2_PROXY_MARK)) {
        if (!res.ok) throw new Error(String(res.status))
        return res
      }
      // 표식이 없으면 프록시 없는 호스트 — 이 세션 동안은 원래 주소로
      proxyAvailable = false
    } catch (e) {
      if (e instanceof Error && /^\d{3}$/.test(e.message)) throw e
      // 네트워크 오류(일시 끊김·취소)는 프록시 유무를 말해 주지 않는다 — 이번 한 번만 원래 주소로 가 본다
    }
  }
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(String(res.status))
  return res
}
