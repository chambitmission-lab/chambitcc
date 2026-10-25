// 카카오톡 공유 — 공유 시트(navigator.share)는 카톡에 "주소 글자"를 넘겨 링크 말풍선이
// 카드 위에 따로 붙는다. 카카오 SDK 의 sendScrap 은 주소의 OG 카드만 보낸다.
//
// 키는 /visit 지도와 같은 JavaScript 키(앱 하나에 키 하나). 개발자센터 > 플랫폼 > Web 에
// 공유하는 주소의 도메인(SHARE_ORIGIN)이 등록돼 있어야 한다.
// SDK 는 누르기 전에 미리 받아 둔다 — PC 는 sendScrap 이 팝업을 띄우는데, 누른 뒤에
// 받으면 '사용자 동작'이 끝나 팝업이 막힌다.

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined
const SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js'

interface KakaoShareSdk {
  init: (key: string) => void
  isInitialized: () => boolean
  Share: { sendScrap: (opts: { requestUrl: string }) => void }
}

let sdkPromise: Promise<KakaoShareSdk> | null = null
let sdk: KakaoShareSdk | null = null

export const canKakaoShare = () => Boolean(KAKAO_JS_KEY)

/** SDK 를 받아 init 까지 — 여러 번 불러도 한 번만 받는다 */
export const loadKakaoShare = (): Promise<KakaoShareSdk> => {
  if (!KAKAO_JS_KEY) return Promise.reject(new Error('no kakao key'))
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise<KakaoShareSdk>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SDK_SRC
    script.async = true
    script.crossOrigin = 'anonymous'
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

/**
 * 주소의 미리보기 카드만 카톡으로 보낸다. 성공하면 true.
 * SDK 가 아직 없으면(받는 중·실패) 기다리지 않고 false — 부른 쪽이 공유 시트로 넘긴다.
 */
export const kakaoShareScrap = (url: string): boolean => {
  if (!sdk) {
    loadKakaoShare().catch(() => {})
    return false
  }
  try {
    sdk.Share.sendScrap({ requestUrl: url })
    return true
  } catch {
    return false
  }
}
