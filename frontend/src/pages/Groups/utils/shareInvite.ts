// 기도방 초대 공유 — 방 홈 상단 공유 버튼과 멤버 탭의 초대 카드가 같은 문구·동작을 쓴다
import { groupInviteUrl } from '../../../utils/inviteLink'
import { showToast } from '../../../utils/toast'
import type { PrayerGroup } from '../../../types/prayer'

export const shareGroupInvite = async (group: Pick<PrayerGroup, 'name' | 'invite_code'>) => {
  if (!group.invite_code) return
  const inviteUrl = groupInviteUrl(group.invite_code)
  const text = `🙏 '${group.name}' 기도방에 초대해요!\n함께 기도제목을 나누고, 응답이 쌓이는 걸 지켜봐요.\n\n${inviteUrl}\n\n앱을 설치했다면 [내 그룹 → 초대 코드로 참여]에 코드 ${group.invite_code} 를 입력해도 돼요.`
  if (navigator.share) {
    try {
      await navigator.share({ title: group.name, text, url: inviteUrl })
    } catch {
      /* 사용자가 취소 */
    }
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    showToast('초대 링크를 복사했어요. 카톡에 붙여넣어 보내주세요!', 'success')
  } catch {
    showToast('복사에 실패했어요. 초대 코드를 직접 알려주세요: ' + group.invite_code, 'error')
  }
}
