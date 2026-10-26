// 주보 보내기 — 한 쪽 이미지는 파일로(카톡이 사진으로 받는다), 안 되면 미리보기 카드가 뜨는 링크로.
// 컴포넌트가 아닌 순수 함수라 별도 파일 (fast refresh 규칙). 칼럼 columnShare.ts 와 같은 결 — 공통은 utils/shareLink.ts.
import { isLocalHost, SHARE_ORIGIN } from '../../../utils/shareOrigin'
import { isAbortError, shareKakaoOrUrl, shareUrl } from '../../../utils/shareLink'

/**
 * 주보 공유 링크. 운영에서는 짧은 /w/{id} — 백엔드(bulletin_share.py)가 앨범 커버
 * 카드(표지 + 이번 호 목차)를 og:image 로 붙이고, 사람은 그 주보 뷰어로 곧바로 보낸다.
 * (해시 딥링크는 크롤러가 앱 셸만 읽어 어느 주보든 홈 카드가 떴다)
 * 로컬은 /w/* 프록시가 없어 해시 딥링크로 — /news 의 b 파라미터가 뷰어를 띄운다.
 */
export const bulletinLink = (id: number) =>
  isLocalHost()
    ? `${window.location.origin}${window.location.pathname}#/news?tab=bulletin&b=${id}`
    : `${SHARE_ORIGIN}/w/${id}`

/** 공유 시트(없으면 클립보드)로 주소만 보낸다 */
export const shareBulletinLink = (id: number, ko: boolean) =>
  shareUrl(bulletinLink(id), {
    copied: ko ? '주보 링크를 복사했어요. 카톡에 붙여넣어 보내 주세요' : 'Link copied',
    failed: ko ? '보내기에 실패했어요' : 'Could not share',
  })

/** 카카오톡으로 — 앨범 커버 카드만 간다. SDK 가 없으면 공유 시트로 */
export const shareBulletinKakao = (id: number, ko: boolean) =>
  shareKakaoOrUrl(`${SHARE_ORIGIN}/w/${id}`, () => shareBulletinLink(id, ko))

/**
 * 한 쪽을 사진으로 보낸다. file 은 미리 받아 둔 것 — 누른 뒤에 받으면 iOS 사파리가
 * '사용자 동작'이 끝났다며 공유 시트를 막는다. 파일 공유가 안 되는 기기는 링크로.
 */
export const shareBulletinPage = async (file: File | undefined, title: string, id: number, ko: boolean) => {
  if (file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return
    } catch (e) {
      if (isAbortError(e)) return
    }
  }
  await shareBulletinLink(id, ko)
}

/**
 * 쪽 이미지를 공유용 파일로 받아 둔다 — 파일 공유를 못 하는 기기(대부분 PC)는 받지 않는다.
 * baseName 에 확장자는 붙이지 않는다(읽기용 WebP·옛 주보 PNG 를 받은 형식대로).
 * force-cache: 뷰어의 <img> 가 이미 받은 바이트를 그대로 쓴다 — Supabase 는 no-cache 로 응답해
 * 기본값이면 쪽마다 재검증(304) 왕복이 하나 더 나갔다. 파일명이 업로드마다 고유해 묵은 그림이 올 일은 없다.
 */
export const prefetchPageFile = async (src: string, baseName: string): Promise<File | undefined> => {
  if (!navigator.canShare) return undefined
  try {
    const res = await fetch(src, { cache: 'force-cache' })
    if (!res.ok) return undefined
    const blob = await res.blob()
    const type = blob.type || 'image/png'
    const file = new File([blob], `${baseName}.${type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'}`, { type })
    return navigator.canShare({ files: [file] }) ? file : undefined
  } catch {
    return undefined
  }
}
