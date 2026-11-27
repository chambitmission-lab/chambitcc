// /dev/new-family-admin — 새가족 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 NewFamilyDesk 를 표본으로 띄운다. 공개 전환·삭제는 이 화면 안에서만
// 바뀌고(서버 호출 없음), 수정·등록은 토스트로만 알린다. 사진·인사말 빈 소식, 비공개, 지난해 표본 포함.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NewFamilyDesk from '../Admin/components/NewFamilyDesk'
import { filterFamily, type FamilyTab } from '../Admin/components/newFamilyDeskUtils'
import type { NewFamilyPost } from '../../types/newFamily'
import { kstNow } from '../../utils/date'
import { showToast } from '../../utils/toast'

const pad = (n: number) => String(n).padStart(2, '0')
/** 오늘에서 weeks 주 전 주일 */
const sunday = (weeks: number) => {
  const d = kstNow()
  d.setDate(d.getDate() - d.getDay() - weeks * 7)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const IMG = ['/images/events/worship.webp', '/images/events/meeting.webp', '/images/events/service.webp', '/images/events/special.webp']

let seq = 0
const post = (member_name: string, weeks: number, p: Partial<NewFamilyPost> = {}): NewFamilyPost => {
  const photos = (p.photo_count ?? 2) > 0 ? IMG.slice(0, p.photo_count ?? 2).map((image_url, i) => ({ id: seq * 10 + i, image_url, sort_order: i })) : []
  return {
    id: ++seq,
    member_name,
    registered_at: sunday(weeks),
    group_name: null,
    greeting: '참빛교회에 오게 되어 기쁩니다. 따뜻하게 맞아 주셔서 감사해요!',
    photos,
    cover_url: photos[0]?.image_url ?? null,
    photo_count: photos.length,
    welcome_count: 0,
    welcome_breakdown: {},
    my_welcome: null,
    comment_count: 0,
    is_published: true,
    created_at: `${sunday(weeks)}T12:00:00`,
    time_ago: '',
    ...p,
  }
}

const POSTS: NewFamilyPost[] = [
  post('김하늘 가정', 0, { group_name: '3교구', photo_count: 3, welcome_count: 24, welcome_breakdown: { '👋': 10, '❤️': 9, '🎉': 5 }, comment_count: 6 }),
  post('이은혜 자매', 1, { group_name: '청년부', welcome_count: 17, welcome_breakdown: { '👋': 8, '🙌': 9 }, comment_count: 3 }),
  post('박소망 형제', 1, { photo_count: 0, greeting: null }),
  post('최기쁨 성도', 3, { group_name: '2교구', is_published: false, photo_count: 1, greeting: null }),
  post('정빛나 가정', 6, { group_name: '1교구', welcome_count: 31, welcome_breakdown: { '❤️': 20, '🎉': 11 }, comment_count: 9, photo_count: 4 }),
  post('한믿음 형제', 60, { group_name: '청년부', welcome_count: 12, welcome_breakdown: { '👋': 12 } }),
]

const NewFamilyAdminPreview = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState(POSTS)
  const [tab, setTab] = useState<FamilyTab>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const filtered = useMemo(() => filterFamily(posts, tab, searchTerm), [posts, tab, searchTerm])

  return (
    <NewFamilyDesk
      posts={posts}
      filtered={filtered}
      loading={false}
      tab={tab}
      onTabChange={setTab}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onCreate={() => showToast('미리보기 — 등록 폼은 실제 화면에서', 'info')}
      onBack={() => navigate(-1)}
      onEdit={(p) => showToast(`미리보기 — ${p.member_name} 수정`, 'info')}
      onTogglePublish={(p) => setPosts((l) => l.map((x) => (x.id === p.id ? { ...x, is_published: !x.is_published } : x)))}
      onDelete={(p) => setPosts((l) => l.filter((x) => x.id !== p.id))}
      onViewPublic={() => navigate('/news?tab=new-family')}
    />
  )
}

export default NewFamilyAdminPreview
