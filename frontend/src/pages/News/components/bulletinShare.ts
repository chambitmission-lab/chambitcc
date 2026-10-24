// 주보 보내기 — 한 쪽 이미지는 파일로(카톡이 사진으로 받는다), 안 되면 바로 열리는 링크로.
// 컴포넌트가 아닌 순수 함수라 별도 파일 (fast refresh 규칙)
import { showToast } from '../../../utils/toast'

/** /news 가 이 링크로 열리면 그 주보 뷰어를 바로 띄운다 (News.tsx 의 b 파라미터) */
export const bulletinLink = (id: number) =>
  `${window.location.origin}${window.location.pathname}#/news?tab=bulletin&b=${id}`

const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError'

export const shareBulletinLink = async (title: string, id: number, ko: boolean) => {
  const url = bulletinLink(id)
  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      return
    } catch (e) {
      if (isAbort(e)) return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    showToast(ko ? '주보 링크를 복사했어요. 카톡에 붙여넣어 보내 주세요' : 'Link copied', 'success')
  } catch {
    showToast(ko ? '보내기에 실패했어요' : 'Could not share', 'error')
  }
}

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
      if (isAbort(e)) return
    }
  }
  await shareBulletinLink(title, id, ko)
}

/** 쪽 이미지를 공유용 파일로 받아 둔다 — 파일 공유를 못 하는 기기(대부분 PC)는 받지 않는다 */
export const prefetchPageFile = async (src: string, name: string): Promise<File | undefined> => {
  if (!navigator.canShare) return undefined
  try {
    const res = await fetch(src)
    if (!res.ok) return undefined
    const blob = await res.blob()
    const file = new File([blob], name, { type: blob.type || 'image/png' })
    return navigator.canShare({ files: [file] }) ? file : undefined
  } catch {
    return undefined
  }
}
