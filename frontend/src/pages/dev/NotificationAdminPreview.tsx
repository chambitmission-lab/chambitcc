// /dev/notifications-admin — 공지(홈 팝업·알림함) 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 NotificationDesk 를 표본으로 띄운다. 공개 스위치·삭제는
// 이 화면 안에서만 바뀌고(서버 호출 없음), 수정·등록은 토스트로만 알린다.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationDesk from '../Admin/components/NotificationDesk'
import { filterNotices, type NoticeSeg } from '../Admin/components/notificationDeskUtils'
import type { Notification } from '../../types/notification'
import { showToast } from '../../utils/toast'

const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString()
const untilIn = (days: number) => {
  const d = new Date(Date.now() + days * 86400000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T23:59:59`
}

const SAMPLE: Notification[] = [
  {
    id: 6,
    title: '성탄 칸타타 연습 안내',
    content: '#### 일시\n- 일시: 매주 토요일 오후 3시\n- 장소: 본당\n\n찬양대원은 **꼭** 참석해 주세요.',
    created_at: ago(1),
    is_active: true,
    is_popup: true,
    popup_until: untilIn(4),
  },
  {
    id: 5,
    title: '김장 나눔에 함께해요',
    content: '11월 28일(토) 오전 9시, 교육관 식당에서 김장 나눔을 합니다.\n앞치마와 고무장갑을 챙겨 주세요.',
    created_at: ago(3),
    is_active: true,
    is_popup: true,
    popup_until: null,
  },
  {
    id: 4,
    title: '11월 22일 주보 소식',
    content: '추수감사절 연합예배 · 김장 나눔 외 3건',
    created_at: ago(5),
    is_active: true,
    link_url: '/news/12',
  },
  {
    id: 3,
    title: '청년부 수련회 신청',
    content: '11월 30일(주일)까지 청년부실에서 받습니다.',
    created_at: ago(10),
    is_active: true,
    is_popup: true,
    popup_until: untilIn(-2),
  },
  {
    id: 2,
    title: '주차장 공사 안내 (초안)',
    content: '12월 첫째 주 동안 교회 앞 주차장 공사가 있습니다.',
    created_at: ago(12),
    is_active: false,
    is_popup: true,
  },
  {
    id: 1,
    title: '가을 바자회 감사 인사',
    content: '함께해 주신 모든 성도님께 감사드립니다.',
    created_at: ago(26),
    updated_at: ago(25),
    is_active: true,
  },
]

const NotificationAdminPreview = () => {
  const navigate = useNavigate()
  const [notices, setNotices] = useState<Notification[]>(SAMPLE)
  const [searchTerm, setSearchTerm] = useState('')
  const [seg, setSeg] = useState<NoticeSeg>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const filtered = useMemo(() => filterNotices(notices, searchTerm, seg), [notices, searchTerm, seg])

  return (
    <NotificationDesk
      notices={notices}
      filtered={filtered}
      loading={false}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      seg={seg}
      onSegChange={setSeg}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onCreate={() => showToast('미리보기 — 등록 폼은 실제 화면에서', 'info')}
      onBack={() => navigate(-1)}
      onClearFilters={() => {
        setSearchTerm('')
        setSeg('all')
      }}
      onGoNews={() => navigate('/dev/news-admin')}
      onEdit={(n) => showToast(`미리보기 — ${n.title} 수정`, 'info')}
      onTogglePublished={(n) => setNotices((l) => l.map((x) => (x.id === n.id ? { ...x, is_active: !x.is_active } : x)))}
      onDelete={(n) => setNotices((l) => l.filter((x) => x.id !== n.id))}
      onOpenLink={(n) => showToast(`미리보기 — ${n.link_url} 로 이동`, 'info')}
    />
  )
}

export default NotificationAdminPreview
