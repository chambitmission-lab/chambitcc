// 공유 링크 보내기 공통 — 목양칼럼(columnShare.ts)·주보(bulletinShare.ts)가 토스트 문구만 다르게 쓴다.
//
// 공유 시트(navigator.share)에는 주소만 넘긴다 — title 을 같이 주면 카톡이 "제목 - 주소" 말풍선을
// 따로 만들어 카드 위에 붙인다. 시트가 없거나 실패하면 클립보드로.
import { showToast } from './toast'
import { kakaoShareScrap } from './kakaoShare'

export const isAbortError = (e: unknown) => e instanceof DOMException && e.name === 'AbortError'

export interface ShareLinkMessages {
  /** 클립보드로 복사했을 때 */
  copied: string
  /** 시트도 클립보드도 안 됐을 때 */
  failed: string
}

/** 주소 하나를 공유 시트로, 안 되면 클립보드로. 사용자가 시트를 닫은 것은 실패가 아니다 */
export const shareUrl = async (url: string, messages: ShareLinkMessages): Promise<void> => {
  if (navigator.share) {
    try {
      await navigator.share({ url })
      return
    } catch (e) {
      if (isAbortError(e)) return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    showToast(messages.copied, 'success')
  } catch {
    showToast(messages.failed, 'error')
  }
}

/**
 * 카카오톡으로 — 링크 말풍선 없이 미리보기 카드만 간다. 카톡이 직접 주소를 긁어 가므로
 * 로컬에서도 운영 주소(kakaoUrl)를 보낸다. SDK 가 끝내 없으면 공유 시트(fallback)로 넘긴다.
 */
export const shareKakaoOrUrl = async (kakaoUrl: string, fallback: () => Promise<void>): Promise<void> => {
  if (await kakaoShareScrap(kakaoUrl)) return
  await fallback()
}
