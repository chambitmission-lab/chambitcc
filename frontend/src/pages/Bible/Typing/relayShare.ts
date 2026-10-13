// 릴레이 필사 초대 링크·공유 — 컴포넌트가 아닌 순수 함수라 별도 파일 (fast refresh 규칙)
import { showToast } from '../../../utils/toast'

export const relayInviteUrl = (code: string) => `${window.location.origin}${window.location.pathname}#/bible/typing/relay/join/${code}`

export const shareRelayInvite = async (relay: { title: string; book_name: string; chapter: number; total: number; invite_code: string }) => {
  const url = relayInviteUrl(relay.invite_code)
  const unit = relay.book_name === '시편' ? '편' : '장'
  const text =
    `✍️ '${relay.title}' 릴레이 필사에 초대해요!\n` +
    `${relay.book_name} ${relay.chapter}${unit} ${relay.total}절을 함께 나눠 써요. 한 절씩 쓰면 한 칸씩 채워져요.\n\n${url}`
  if (navigator.share) {
    try {
      await navigator.share({ title: relay.title, text, url })
    } catch {
      /* 사용자가 취소 */
    }
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    showToast('초대장을 복사했어요. 카톡에 붙여넣어 보내주세요!', 'success')
  } catch {
    showToast('복사에 실패했어요. 링크를 직접 알려주세요: ' + url, 'error')
  }
}
