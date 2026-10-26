// 카카오톡 공유 — 공유 시트(navigator.share)는 카톡에 "주소 글자"를 넘겨 링크 말풍선이
// 카드 위에 따로 붙는다. 카카오 SDK 의 sendScrap 은 주소의 OG 카드만 보낸다.
//
// 키는 /visit 지도와 같은 JavaScript 키(앱 하나에 키 하나). 개발자센터 > 플랫폼 > Web 에
// 공유하는 주소의 도메인(SHARE_ORIGIN)이 등록돼 있어야 한다.
// SDK 는 누르기 전에 미리 받아 둔다 — PC 는 sendScrap 이 팝업을 띄우는데, 누른 뒤에
// 받으면 '사용자 동작'이 끝나 팝업이 막힌다.

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined
const SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js'
// 카카오 공식 스니펫의 무결성 해시 — CDN 파일이 바뀌면 받지 않는다 (버전을 올리면 함께 바꿀 것)
const SDK_INTEGRITY = 'sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka'

/**
 * 모바일은 받는 중인 SDK 를 이만큼 기다렸다가 보낸다. 사용자 동작(탭)의 효력이 크롬에서 5초라
 * 그 안이면 kakaolink 스킴 전환이 막히지 않는다. PC 는 팝업이라 기다릴 수 없다(동기 경로만).
 */
const MOBILE_SDK_WAIT_MS = 2000

interface KakaoShareSdk {
  init: (key: string) => void
  isInitialized: () => boolean
  Share: { sendScrap: (opts: { requestUrl: string }) => void }
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

const sendScrap = (url: string): boolean => {
  if (!sdk) return false
  try {
    sdk.Share.sendScrap({ requestUrl: url })
    return true
  } catch {
    return false
  }
}

/**
 * 주소의 미리보기 카드만 카톡으로 보낸다. 성공하면 true, 부른 쪽은 false 면 공유 시트로 넘긴다.
 * SDK 가 아직 없으면: 모바일은 받는 중인 것을 잠깐(2초) 기다린다 — 느린 망에서 첫 탭이
 * 공유 시트로 떨어져 "카드만 간다"는 약속과 달리 링크 말풍선이 붙던 것을 막는다.
 * PC 는 팝업이라 기다릴 수 없어 받기만 걸어 두고 false.
 */
export const kakaoShareScrap = async (url: string): Promise<boolean> => {
  if (sdk) return sendScrap(url)
  if (!canKakaoShare()) return false
  const loading = loadKakaoShare().catch(() => null)
  if (!isMobile()) return false
  const timeout = new Promise<null>(resolve => window.setTimeout(() => resolve(null), MOBILE_SDK_WAIT_MS))
  if (!(await Promise.race([loading, timeout]))) return false
  return sendScrap(url)
}
