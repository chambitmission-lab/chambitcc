// 카카오톡 공유 — 공유 시트(navigator.share)는 카톡에 "주소 글자"를 넘겨 링크 말풍선이
// 카드 위에 따로 붙는다. 카카오 SDK 의 sendScrap 은 주소의 OG 카드만 보낸다.
//
// 키는 /visit 지도와 같은 JavaScript 키(앱 하나에 키 하나). 개발자센터 > 플랫폼 > Web 에
// 공유하는 주소의 도메인(SHARE_ORIGIN)이 등록돼 있어야 한다.
// SDK 는 누르기 전에 미리 받아 둔다 — PC 는 sendScrap 이 팝업을 띄우는데, 누른 뒤에
// 받으면 '사용자 동작'이 끝나 팝업이 막힌다.

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined
const SDK_VERSION = '2.7.4'
const SDK_SRC = `https://t1.kakaocdn.net/kakao_js_sdk/${SDK_VERSION}/kakao.min.js`
// 카카오 공식 스니펫의 무결성 해시 — CDN 파일이 바뀌면 받지 않는다 (버전을 올리면 함께 바꿀 것)
const SDK_INTEGRITY = 'sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka'

/**
 * 모바일은 받는 중인 SDK 를 이만큼 기다렸다가 보낸다. 사용자 동작(탭)의 효력이 크롬에서 5초라
 * 그 안이면 kakaolink 스킴 전환이 막히지 않는다. PC 는 팝업이라 기다릴 수 없다(동기 경로만).
 */
const MOBILE_SDK_WAIT_MS = 2000

interface KakaoFeedTemplate {
  objectType: 'feed'
  content: {
    title: string
    description?: string
    imageUrl: string
    imageWidth?: number
    imageHeight?: number
    link: { webUrl: string; mobileWebUrl: string }
  }
}

interface KakaoShareSdk {
  init: (key: string) => void
  isInitialized: () => boolean
  Share: {
    sendScrap: (opts: { requestUrl: string }) => void
    sendDefault: (template: KakaoFeedTemplate) => void
  }
}

/** 앱이 직접 채워 보내는 피드 카드 — 주소를 긁게 하지 않으므로 첫 공유도 바로 열린다 */
export interface KakaoFeedCard {
  title: string
  description?: string
  imageUrl: string
  imageWidth?: number
  imageHeight?: number
  /** 카드를 누르면 열리는 주소 */
  link: string
}

let sdkPromise: Promise<KakaoShareSdk> | null = null
let sdk: KakaoShareSdk | null = null

export const canKakaoShare = () => Boolean(KAKAO_JS_KEY)

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

/** SDK 를 받아 init 까지 — 여러 번 불러도 한 번만 받는다 */
export const loadKakaoShare = (): Promise<KakaoShareSdk> => {
  if (!KAKAO_JS_KEY) return Promise.reject(new Error('no kakao key'))
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise<KakaoShareSdk>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SDK_SRC
    script.async = true
    script.crossOrigin = 'anonymous'
    script.integrity = SDK_INTEGRITY
    script.onload = () => {
      const k = (window as unknown as { Kakao?: KakaoShareSdk }).Kakao
      if (!k) return reject(new Error('kakao sdk missing'))
      if (!k.isInitialized()) k.init(KAKAO_JS_KEY)
      sdk = k
      resolve(k)
    }
    script.onerror = () => reject(new Error('kakao sdk load failed'))
    document.head.appendChild(script)
  }).catch(e => {
    sdkPromise = null // 다음에 다시 받아 볼 수 있게
    throw e
  })
  return sdkPromise
}

const trySend = (send: () => void): boolean => {
  try {
    send()
    return true
  } catch {
    return false
  }
}

/**
 * SDK 가 있으면 바로 보낸다. 없으면: 모바일은 받는 중인 것을 잠깐(2초) 기다린다 — 느린 망에서
 * 첫 탭이 공유 시트로 떨어져 "카드만 간다"는 약속과 달리 링크 말풍선이 붙던 것을 막는다.
 * PC 는 팝업이라 기다릴 수 없어 받기만 걸어 두고 false. 부른 쪽은 false 면 공유 시트로 넘긴다.
 * SDK 가 이미 있을 때는 await 없이 동기로 보낸다 — 클릭 핸들러 안이어야 팝업·스킴 전환이 막히지 않는다.
 */
const withSdk = async (send: (k: KakaoShareSdk) => boolean): Promise<boolean> => {
  if (sdk) return send(sdk)
  if (!canKakaoShare()) return false
  const loading = loadKakaoShare().catch(() => null)
  if (!isMobile()) return false
  const timeout = new Promise<null>(resolve => window.setTimeout(() => resolve(null), MOBILE_SDK_WAIT_MS))
  const k = await Promise.race([loading, timeout])
  return k ? send(k) : false
}

/**
 * 주소의 미리보기 카드만 카톡으로 보낸다. 성공하면 true.
 * 누르는 순간 카카오 서버가 주소를 긁으므로 첫 공유는 1~2초 늦다 — 미리 prewarmKakaoScrap 을 불러 두거나,
 * 재료가 있으면 kakaoShareFeed 로 보내는 편이 낫다.
 */
export const kakaoShareScrap = (url: string): Promise<boolean> =>
  withSdk(k => trySend(() => k.Share.sendScrap({ requestUrl: url })))

/** 제목·설명·그림을 앱이 채운 피드 카드를 보낸다 — 카카오가 긁을 것이 없어 언제나 바로 열린다. 성공하면 true */
export const kakaoShareFeed = (card: KakaoFeedCard): Promise<boolean> =>
  withSdk(k =>
    trySend(() =>
      k.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: card.title,
          description: card.description,
          imageUrl: card.imageUrl,
          imageWidth: card.imageWidth,
          imageHeight: card.imageHeight,
          link: { webUrl: card.link, mobileWebUrl: card.link },
        },
      }),
    ),
  )

// ── 스크랩 예열 ──
// sendScrap 은 SDK 가 카카오 API(/talk/template/scrap)에 주소를 넘기고, 카카오가 그 자리에서 페이지와
// og:image 를 긁어 온 뒤에야 카톡을 연다(운영 실측: 첫 0.75초+우리 페이지 렌더, 캐시 뒤 0.07초).
// 같은 요청을 미리 한 번 보내 두면 실제 공유는 카카오 캐시에서 바로 나간다. SDK 와 같은 헤더로 보내며,
// 등록 도메인이 아닌 곳(로컬)에서는 카카오가 거절하므로 조용히 넘어간다. 주소당 한 번만.
const SCRAP_API = 'https://kapi.kakao.com/v2/api/kakaolink/talk/template/scrap'
const prewarmed = new Set<string>()

export const prewarmKakaoScrap = (url: string): void => {
  if (!KAKAO_JS_KEY || prewarmed.has(url)) return
  prewarmed.add(url)
  const ka = [
    `sdk/${SDK_VERSION}`,
    'os/javascript',
    'sdk_type/javascript',
    `lang/${navigator.language}`,
    `device/${navigator.platform.replace(/ /g, '_')}`,
    `origin/${encodeURIComponent(window.location.origin)}`,
  ].join(' ')
  const query = new URLSearchParams({ link_ver: '4.0', request_url: url })
  fetch(`${SCRAP_API}?${query}`, { headers: { Authorization: `KakaoAK ${KAKAO_JS_KEY}`, KA: ka } }).catch(() => {})
}
