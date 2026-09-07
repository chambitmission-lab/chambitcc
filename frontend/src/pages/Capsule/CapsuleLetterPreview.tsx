// /dev/capsule-letter — 개봉 후 편지 화면(아침 하늘 + 우표 + 종이테이프)을 로그인·서버 없이 본다.
// DEV 전용 라우트라 App.tsx가 import.meta.env.DEV일 때만 lazy import 한다.
import type { CapsuleDetail } from '../../types/timeCapsule'
import CapsuleOpen from './CapsuleOpen'

const iso = (daysAgo: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(9, 12, 0, 0)
  return d.toISOString().slice(0, 19)
}

const MOCK: CapsuleDetail = {
  id: 30,
  capsule_type: 'direct',
  role: 'recipient',
  sender_name: '그날의 나',
  recipient_name: '유주희',
  title: '주희에게',
  open_at: iso(0),
  open_label: null,
  sealed_at: iso(1),
  opened_at: iso(0),
  openable: true,
  has_audio: false,
  has_message: true,
  photo_count: 0,
  claimed: true,
  invite_code: null,
  content: {
    title: '주희에게',
    message:
      '주희야 생일 축하해. 편지를 미리 못 써서 미안해. 하지만 지금 썼으니 들어주려고.\n고맙다 아이들 키우느라 고생 많이 했지. 정말 언제나 감사하다고 인사했었나?\n\n우리 조금 더 노력하면 더 잘 살아보자.\n\n사랑해.',
    audio_url: null,
    audio_duration: null,
    photos: [],
    snapshot: {
      season_label: '연중',
      verse_reference: '에스겔 37장 5,10절',
      verse_text: '너희 마른 뼈들아, 이제 살아나리라!',
      stats: { meditation_streak: 11, verses_read: 250, prayers: 17, thanks: 17 },
    },
  },
}

const CapsuleLetterPreview = () => <CapsuleOpen preview={MOCK} />

export default CapsuleLetterPreview
