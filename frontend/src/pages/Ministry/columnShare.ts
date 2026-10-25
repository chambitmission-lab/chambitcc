// 목양칼럼 보내기 — 편지 전문 대신 '엽서' 카드가 뜨는 링크를 보낸다.
// 컴포넌트가 아닌 순수 함수라 별도 파일 (fast refresh 규칙). 주보 bulletinShare.ts 와 같은 결.
import { isLocalHost, SHARE_ORIGIN } from '../../utils/shareOrigin'
import { showToast } from '../../utils/toast'
import { kakaoShareScrap } from '../../utils/kakaoShare'

/**
 * 칼럼 공유 링크. 운영에서는 짧은 /c/{id} — 백엔드(column_share.py)가 '엽서 뒷면에 쓴 편지'
 * 카드를 og:image 로 붙이고, 사람은 그 편지 읽기 화면으로 곧바로 보낸다.
 * 로컬은 /c/* 프록시가 없어 해시 딥링크로 — /ministry 의 c 파라미터가 편지를 연다.
 */
export const columnLink = (id: number) =>
  isLocalHost()
    ? `${window.location.origin}${window.location.pathname}#/ministry?c=${id}`
    : `${SHARE_ORIGIN}/c/${id}`

const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError'

/** 주소만 보낸다 — title 을 같이 주면 카톡이 "제목 - 주소" 말풍선을 따로 만들어 카드 위에 붙인다 */
export const shareColumnLink = async (id: number, ko: boolean) => {
  const url = columnLink(id)
  if (navigator.share) {
    try {
      await navigator.share({ url })
      return
    } catch (e) {
      if (isAbort(e)) return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    showToast(ko ? '편지 링크를 복사했어요. 카톡에 붙여넣어 보내 주세요' : 'Link copied', 'success')
  } catch {
    showToast(ko ? '보내기에 실패했어요' : 'Could not share', 'error')
  }
}

/**
 * 카카오톡으로 — 링크 말풍선 없이 엽서 카드만 간다. 카톡이 직접 /c/{id} 를 긁어 가므로
 * 로컬에서도 운영 주소로 보낸다. SDK 가 아직 없으면 공유 시트로 넘긴다.
 */
export const shareColumnKakao = async (id: number, ko: boolean) => {
  if (kakaoShareScrap(`${SHARE_ORIGIN}/c/${id}`)) return
  await shareColumnLink(id, ko)
}
