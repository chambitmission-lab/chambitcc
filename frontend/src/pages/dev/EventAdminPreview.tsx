// /dev/events-admin — 일정 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 EventDesk 를 표본으로 띄운다. 공개 전환·삭제는 이 화면 안에서만 바뀌고
// (서버 호출 없음), 수정·등록은 토스트로만 알린다. 진행 중·주보 초안·비공개·지난 일정 표본 포함.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EventDesk from '../Admin/components/EventDesk'
import { eventPhase, filterEvents, isBulletinDraft, type EventTab } from '../Admin/components/eventDeskUtils'
import type { Event, EventCategory } from '../../types/event'
import { kstNow } from '../../utils/date'
import { showToast } from '../../utils/toast'

const pad = (n: number) => String(n).padStart(2, '0')
/** 오늘(서울)에서 days 만큼 떨어진 날 hh:mm — 서버처럼 오프셋 없는 문자열 */
const at = (days: number, hh: number, mm = 0) => {
  const d = kstNow()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hh)}:${pad(mm)}:00`
}

let seq = 0
const ev = (title: string, category: EventCategory, start: string, end: string, p: Partial<Event> = {}): Event => ({
  id: ++seq,
  title,
  category,
  start_datetime: start,
  end_datetime: end,
  repeat_type: 'none',
  is_published: true,
  attendance_count: 0,
  views: 0,
  created_at: at(-10, 9),
  updated_at: at(-10, 9),
  ...p,
})

const h = kstNow().getHours()
const EVENTS: Event[] = [
  ev('수요 저녁 예배', 'worship', at(0, Math.max(0, h - 1)), at(0, Math.min(23, h + 1)), { location: '본당', attendance_count: 42, views: 130, repeat_type: 'weekly' }),
  ev('성탄 칸타타 연습', 'special', at(3, 19, 30), at(3, 21), { location: '비전홀', attendance_count: 18, views: 64, rsvp_deadline: at(2, 23, 59), description: '성탄 칸타타 2차 연습이에요.\n악보는 첫 시간에 나눠 드려요.' }),
  ev('청년부 연말 모임', 'meeting', at(9, 18), at(9, 21), { location: '카페 참빛', attendance_count: 27, views: 88, group_id: 3, group: { id: 3, name: '청년부', icon: '🌱' } as Event['group'] }),
  ev('김장 나눔 봉사', 'service', at(12, 0), at(12, 23, 59), { is_published: false, source_bulletin_id: 41, location: '교육관 앞마당' }),
  ev('새가족 성경공부', 'education', at(20, 11), at(20, 12, 30), { is_published: false, location: '소예배실' }),
  ev('신년 축복 성회', 'special', at(38, 19), at(40, 21), { location: '본당', views: 12 }),
  ev('추수감사 예배', 'worship', at(-11, 11), at(-11, 12, 30), { location: '본당', attendance_count: 156, views: 402 }),
  ev('교사 세미나', 'education', at(-25, 14), at(-25, 17), { location: '비전홀', attendance_count: 23, views: 71 }),
]

const EventAdminPreview = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState(EVENTS)
  const [tab, setTab] = useState<EventTab>('upcoming')
  const [category, setCategory] = useState<EventCategory | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const filtered = useMemo(() => filterEvents(events, { tab, category, q: searchTerm }), [events, tab, category, searchTerm])
  const past = events.filter((e) => eventPhase(e) === 'past').length
  const counts = { upcoming: events.length - past, past, draft: events.filter((e) => !e.is_published).length, bulletin: events.filter(isBulletinDraft).length }

  return (
    <EventDesk
      events={events}
      filtered={filtered}
      counts={counts}
      loading={false}
      tab={tab}
      onTabChange={setTab}
      category={category}
      onCategoryChange={setCategory}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onCreate={() => showToast('미리보기 — 등록 폼은 실제 화면에서', 'info')}
      onPublishBulletin={() => setEvents((l) => l.map((x) => (isBulletinDraft(x) ? { ...x, is_published: true } : x)))}
      publishingBulletin={false}
      onBack={() => navigate(-1)}
      onEdit={(e) => showToast(`미리보기 — ${e.title} 수정`, 'info')}
      onTogglePublish={(e) => setEvents((l) => l.map((x) => (x.id === e.id ? { ...x, is_published: !x.is_published } : x)))}
      onDelete={(e) => setEvents((l) => l.filter((x) => x.id !== e.id))}
      onView={() => showToast('미리보기 — 성도 화면은 실제 일정에서', 'info')}
    />
  )
}

export default EventAdminPreview
