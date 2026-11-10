import { useState } from 'react'
import PrayerDetailView from '../Home/components/PrayerDetail/PrayerDetailView'
import type { Prayer, PrayerEmotion, Reply } from '../../types/prayer'

/**
 * /#/dev/prayer-detail — 기도 상세(감정 풍경 + 대화처럼) 표본 화면. 백엔드 없이 배치·다크를 확인한다.
 * ?emotion=grateful|anxious|sad|lonely|tired|angry|confused|hopeful|none (기본 grateful)
 * ?mode=private|pastoral|empty (나만 보기 / 목사님과 함께(작성자) / 쪽지 없음)
 */
const CONTENT = `사랑의 하나님 아버지,

오늘도 새로운 하루를 선물해 주셔서 감사합니다.

오늘은 조금 더 많이 웃고, 조금 더 따뜻하게 사랑하며 살아가고 싶어요.

내 마음속에 예수님의 사랑이 가득 채워지게 해주시고, 친구들에게는 다정한 말 한마디를, 가족에게는 따뜻한 미소를, 소중한 사람들에게는 진심 어린 사랑을 전할 수 있게 해주세요.

때로는 서운하고 속상한 일이 생기더라도 미워하기보다는 이해하게 하시고, 누군가의 작은 실수도 너그럽게 안아줄 수 있는 예쁜 마음을 주세요.

사랑받기만을 바라기보다 먼저 사랑할 줄 알게 하시고, 작은 친절 하나로 누군가의 하루를 행복하게 만들어 주는 사람이 되게 해주세요.

오늘도 주님 안에서 설레고 행복한 하루 보내게 해주세요.

예수님의 이름으로 기도드립니다.

아멘. 💗`

const reply = (id: number, name: string, content: string, ago: string, extra: Partial<Reply> = {}): Reply => ({
  id,
  display_name: name,
  content,
  created_at: '',
  time_ago: ago,
  ...extra,
})

const SAMPLE_REPLIES: Reply[] = [
  reply(1, '익명', '아멘', '방금 전'),
  reply(2, '김은혜', '사랑 님의 오늘 하루를 위해 함께 기도했어요.', '3분 전'),
  reply(3, '이사랑', '함께 기도해 주셔서 고마워요.', '4분 전', { is_owner: true }),
  reply(4, '박요한', '저도 오늘 같은 마음으로 기도합니다. 따뜻한 하루 되세요.', '8분 전', { is_edited: true }),
  reply(5, '익명', '🙏', '12분 전'),
]

export default function PrayerDetailPreview() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
  const emotionParam = params.get('emotion') ?? 'grateful'
  const mode = params.get('mode')
  const [open, setOpen] = useState(true)
  const [prayed, setPrayed] = useState(false)
  const [replies, setReplies] = useState<Reply[]>(mode === 'empty' ? [] : SAMPLE_REPLIES)

  const prayer: Prayer = {
    id: 7,
    display_name: '이사랑',
    content: CONTENT,
    prayer_count: 11 + (prayed ? 1 : 0),
    reply_count: replies.length,
    is_prayed: prayed,
    is_owner: true,
    emotion: emotionParam === 'none' ? undefined : (emotionParam as PrayerEmotion),
    created_at: '',
    time_ago: '방금 전',
    is_private: mode === 'private' || mode === 'pastoral',
    shared_with_pastor: mode === 'pastoral',
  }

  return (
    <div style={{ padding: 24 }}>
      <button type="button" onClick={() => setOpen(true)}>
        기도 상세 다시 열기
      </button>
      {open && (
        <PrayerDetailView
          prayer={prayer}
          displayContent={prayer.content}
          hasTranslation={false}
          showTranslation={false}
          nextLanguage="en"
          onTranslationToggle={() => {}}
          canDelete
          onClose={() => setOpen(false)}
          onDeleteClick={() => {}}
          isToggling={false}
          onPrayerToggle={() => setPrayed((v) => !v)}
          replies={replies}
          repliesLoading={false}
          isCreating={false}
          isUpdating={false}
          hasNextPage={false}
          isFetchingNextPage={false}
          onReplySubmit={(content, name) =>
            setReplies((list) => [reply(Date.now(), name, content, '방금 전', { is_owner: true }), ...list])
          }
          onReplyUpdate={(id, content) =>
            setReplies((list) => list.map((r) => (r.id === id ? { ...r, content, is_edited: true } : r)))
          }
          onReplyDelete={(id) => setReplies((list) => list.filter((r) => r.id !== id))}
          onLoadMore={() => {}}
          onMakePublic={() => {}}
          onShareWithPastor={() => {}}
          onUnshareWithPastor={() => {}}
          isSwitchingVisibility={false}
        />
      )}
    </div>
  )
}
