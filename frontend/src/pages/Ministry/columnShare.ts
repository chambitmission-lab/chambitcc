// 목양칼럼 보내기 — 편지 전문 대신 '엽서' 카드가 뜨는 링크를 보낸다.
// 컴포넌트가 아닌 순수 함수라 별도 파일 (fast refresh 규칙). 주보 bulletinShare.ts 와 같은 결 — 공통은 utils/shareLink.ts.
import { isLocalHost, SHARE_ORIGIN } from '../../utils/shareOrigin'
import { shareKakaoOrUrl, shareUrl } from '../../utils/shareLink'

/**
 * 칼럼 공유 링크. 운영에서는 짧은 /c/{id} — 백엔드(column_share.py)가 '엽서 뒷면에 쓴 편지'
 * 카드를 og:image 로 붙이고, 사람은 그 편지 읽기 화면으로 곧바로 보낸다.
 * 로컬은 /c/* 프록시가 없어 해시 딥링크로 — /ministry 의 c 파라미터가 편지를 연다.
 */
export const columnLink = (id: number) =>
  isLocalHost()
    ? `${window.location.origin}${window.location.pathname}#/ministry?c=${id}`
    : `${SHARE_ORIGIN}/c/${id}`

/** 공유 시트(없으면 클립보드)로 주소만 보낸다 */
export const shareColumnLink = (id: number, ko: boolean) =>
  shareUrl(columnLink(id), {
    copied: ko ? '편지 링크를 복사했어요. 카톡에 붙여넣어 보내 주세요' : 'Link copied',
    failed: ko ? '보내기에 실패했어요' : 'Could not share',
  })

/** 카카오톡으로 — 엽서 카드만 간다. SDK 가 없으면 공유 시트로 */
export const shareColumnKakao = (id: number, ko: boolean) =>
  shareKakaoOrUrl(`${SHARE_ORIGIN}/c/${id}`, () => shareColumnLink(id, ko))
