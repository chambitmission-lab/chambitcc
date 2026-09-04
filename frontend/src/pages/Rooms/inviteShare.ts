// 초대 링크·문구·공유 — 컴포넌트가 아닌 순수 함수라 별도 파일 (fast refresh 규칙)
import type { RoomDetail } from '../../types/meditationRoom'
import { showToast } from '../../utils/toast'
import { formatMd } from './roomCourses'

export const inviteUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/join/${code}`

export const buildInviteText = (room: RoomDetail) => {
  const first = room.days[0]?.title
  return (
    `📖 '${room.title}' 공동 묵상에 초대해요!\n` +
    `${formatMd(room.start_date)}부터 ${room.total_days}일 동안 매일 같은 본문을 읽고 묵상을 나눠요.` +
    (first ? `\n첫 본문은 ${first}.` : '') +
    `\n\n${inviteUrl(room.invite_code ?? '')}`
  )
}

/** 카톡·문자 등 OS 공유 → 안 되면 클립보드 */
export const shareInvite = async (room: RoomDetail) => {
  if (!room.invite_code) return
  const text = buildInviteText(room)
  const url = inviteUrl(room.invite_code)
  if (navigator.share) {
    try {
      await navigator.share({ title: room.title, text, url })
    } catch {
      /* 사용자가 취소 */
    }
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    showToast('초대장을 복사했어요. 카톡에 붙여넣어 보내주세요!', 'success')
  } catch {
    showToast('복사에 실패했어요. 초대 코드를 직접 알려주세요: ' + room.invite_code, 'error')
  }
}

