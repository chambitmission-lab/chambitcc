// 공지(홈 팝업·알림함) 관리 데스크 규칙 — 실제 화면과 dev 미리보기가 같이 쓴다
import type { Notification } from '../../../types/notification'
import { stripInline } from '../../../utils/noticeMarkup'

export type NoticeSeg = 'all' | 'active' | 'popup' | 'hidden'

/**
 * 홈 팝업 상태
 *   none  팝업 아님 — 알림함에만
 *   live  지금 홈에 뜬다 (공개 + 팝업 + 종료일 전)
 *   ended 종료일이 지나 더는 안 뜬다
 *   off   팝업으로 설정했지만 비공개라 안 뜬다
 */
export type PopupState = 'none' | 'live' | 'ended' | 'off'

export const popupState = (n: Notification, now = new Date()): PopupState => {
  if (!n.is_popup) return 'none'
  if (!n.is_active) return 'off'
  // popup_until 은 KST 벽시계 'YYYY-MM-DDT23:59:59'(타임존 없음) — 로컬 시각으로 읽는다
  if (n.popup_until && new Date(n.popup_until).getTime() < now.getTime()) return 'ended'
  return 'live'
}

/** 팝업 종료일까지 남은 날 (오늘 끝나면 0) — 무기한이면 null */
export const popupDaysLeft = (n: Notification, now = new Date()): number | null => {
  if (!n.popup_until) return null
  const end = new Date(n.popup_until)
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()
  return Math.round((b - a) / 86400000)
}

/** 목록 한 줄 — 마크업 기호를 걷어낸 본문 첫 줄들 */
export const noticePlain = (content: string) =>
  stripInline(content)
    .split('\n')
    .map((l) => l.replace(/^[#>\-*·•\s]+/, '').replace(/^:::\w*\s*/, '').trim())
    .filter((l) => l && !/^:::$/.test(l))
    .join(' ')

export const filterNotices = (list: Notification[], searchTerm: string, seg: NoticeSeg) => {
  const q = searchTerm.trim().toLowerCase()
  return list
    .filter((n) => {
      const matchesSearch = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      const matchesSeg =
        seg === 'all' ||
        (seg === 'active' && n.is_active) ||
        (seg === 'hidden' && !n.is_active) ||
        (seg === 'popup' && popupState(n) === 'live')
      return matchesSearch && matchesSeg
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}
