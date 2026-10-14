import { useState } from 'react'
import type { TypingRelayDetail } from '../../../api/bibleTyping'
import MemberSearchInput from '../../../components/common/MemberSearchInput'
import { useAddTypingRelayMembers } from '../../../hooks/useBibleTyping'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { CapsuleRecipient } from '../../../types/timeCapsule'
import { showToast } from '../../../utils/toast'
import { shareRelayInvite } from './relayShare'

/**
 * 릴레이 초대 시트 — 앱 성도는 이름으로 골라 바로 넣고(알림이 간다),
 * 아직 앱이 없는 분에겐 카톡·문자 초대장을 보낸다.
 */
const RelayInviteSheet = ({ relay, onClose }: { relay: TypingRelayDetail; onClose: () => void }) => {
  useModalBackButton(onClose)
  const add = useAddTypingRelayMembers(relay.id)
  const [picked, setPicked] = useState<CapsuleRecipient[]>([])
  const unit = relay.book_number === 19 ? '편' : '장'

  const onInvite = () => {
    if (!picked.length) return
    add.mutate(
      picked.map((p) => p.id),
      {
        onSuccess: (count) => {
          showToast(
            count > 0 ? `${count}명을 초대했어요. 바로 함께 쓸 수 있게 알림이 갔어요 ✍️` : '이미 모두 함께하고 있어요',
            count > 0 ? 'success' : 'info',
          )
          onClose()
        },
        onError: (e) => showToast(e instanceof Error ? e.message : '초대하지 못했어요', 'error'),
      },
    )
  }

  return (
    <div className="bt-summary" role="dialog" aria-modal="true" aria-labelledby="bt-invite-title" onClick={onClose}>
      <div className="bt-summary__card bt-invite" onClick={(e) => e.stopPropagation()}>
        <span className="bt-summary__seal" aria-hidden>
          <span className="material-icons-round">person_add</span>
        </span>
        <h2 id="bt-invite-title" className="bt-summary__title">
          함께 쓸 사람 초대
        </h2>
        <p className="bt-invite__sub">
          {relay.book_name} {relay.chapter}
          {unit}을 함께 나눠 써요. 우리 교회 성도는 이름으로 찾아 바로 넣을 수 있어요.
        </p>

        <div className="bt-invite__search">
          <MemberSearchInput
            excludeIds={[...relay.members.map((m) => m.user_id), ...picked.map((p) => p.id)]}
            onPick={(u) => setPicked((prev) => (prev.some((p) => p.id === u.id) ? prev : [...prev, u]))}
            placeholder="이름으로 찾기"
            emptyHint="앱에서 찾을 수 없어요. 아직 가입 전이라면 아래 초대장을 보내 주세요."
          />
          {picked.length > 0 && (
            <div className="bt-invite__picked">
              {picked.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPicked((prev) => prev.filter((x) => x.id !== p.id))}
                  title="빼기"
                >
                  <span className="bt-invite__av">
                    {p.avatar_url ? <img src={p.avatar_url} alt="" loading="lazy" /> : p.display_name.slice(0, 1)}
                  </span>
                  {p.display_name}
                  <span className="material-icons-round" aria-label="빼기">
                    close
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bt-summary__actions">
          <button
            type="button"
            className="bt-btn bt-btn--primary bt-btn--block"
            disabled={!picked.length || add.isPending}
            onClick={onInvite}
          >
            {add.isPending ? '초대하는 중…' : picked.length ? `${picked.length}명 바로 초대하기` : '초대할 사람을 골라 주세요'}
          </button>
          <p className="bt-invite__or">아직 앱이 없는 분에게는</p>
          <button type="button" className="bt-btn bt-btn--block" onClick={() => void shareRelayInvite(relay)}>
            <span className="material-icons-round" aria-hidden>
              send
            </span>
            카톡·문자로 초대장 보내기
          </button>
          <button type="button" className="bt-btn bt-btn--ghost bt-btn--block" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

export default RelayInviteSheet
