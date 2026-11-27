// /dev/event-albums-admin — 행사 앨범 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 EventAlbumDesk 를 표본으로 띄운다. 사진은 public/ 의 교회 사진을
// 빌려 쓴다. 공개 스위치·반응은 이 화면 안에서만 바뀌고, 수정·삭제는 토스트로만 알린다.
// (미리보기 속 댓글 목록은 API 를 부르므로 백엔드 없이는 비어 보인다)
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EventAlbumDesk, { type AlbumSeg, type AlbumSort } from '../Admin/components/EventAlbumDesk'
import EventAlbumViewer from '../News/components/EventAlbumViewer'
import type { EventAlbumPost } from '../../types/eventAlbum'
import { showToast } from '../../utils/toast'

const IMG = [
  '/images/visit/scene-autumn-day.webp',
  '/images/visit/church-day.webp',
  '/images/events/worship.webp',
  '/images/visit/scene-spring-day.webp',
  '/images/events/special.webp',
  '/images/visit/scene-summer-day.webp',
  '/images/events/meeting.webp',
  '/images/visit/scene-winter-day.webp',
  '/images/events/service.webp',
]

let pid = 1
const album = (id: number, data: Partial<EventAlbumPost> & { title: string; event_date: string; tag: string; n: number }): EventAlbumPost => {
  const photos = Array.from({ length: data.n }, (_, i) => ({ id: pid++, url: IMG[(id + i) % IMG.length], sort_order: i }))
  return {
    id,
    caption: null,
    event_id: null,
    photos,
    cover_url: photos[0]?.url ?? null,
    photo_count: photos.length,
    reaction_count: 0,
    reaction_breakdown: {},
    my_reaction: null,
    comment_count: 0,
    is_published: true,
    created_at: data.event_date,
    time_ago: '',
    ...data,
  }
}

const SAMPLE: EventAlbumPost[] = [
  album(1, { title: '2026 추수감사주일', event_date: '2026-11-15', tag: '추수감사', n: 9, caption: '한 해 거두게 하신 은혜에 감사드리며 함께 예배했습니다.', reaction_count: 24, reaction_breakdown: { '🙏': 12, '❤️': 8, '🎉': 4 }, comment_count: 6, event_id: 31 }),
  album(2, { title: '청년부 가을 수련회', event_date: '2026-10-03', tag: '수련회', n: 14, reaction_count: 18, reaction_breakdown: { '🎉': 10, '🙌': 8 }, comment_count: 3 }),
  album(3, { title: '전교인 가을 야유회', event_date: '2026-09-20', tag: '야유회', n: 6, reaction_count: 31, reaction_breakdown: { '❤️': 20, '🎉': 11 }, comment_count: 12, event_id: 22 }),
  album(4, { title: '여름성경학교', event_date: '2026-07-26', tag: '수련회', n: 4, is_published: false }),
  album(5, { title: '부활절 연합예배', event_date: '2026-04-05', tag: '부활절', n: 1, reaction_count: 9, reaction_breakdown: { '🙏': 9 } }),
  album(6, { title: '임직 감사예배', event_date: '2026-03-08', tag: '예배', n: 0 }),
  album(7, { title: '성탄 축하 발표회', event_date: '2025-12-24', tag: '성탄', n: 11, reaction_count: 40, reaction_breakdown: { '🎉': 25, '❤️': 15 }, comment_count: 9 }),
  album(8, { title: '2025 추수감사주일', event_date: '2025-11-16', tag: '추수감사', n: 5, reaction_count: 14, reaction_breakdown: { '🙏': 14 } }),
]

const EventAlbumAdminPreview = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState(SAMPLE)
  const [searchTerm, setSearchTerm] = useState('')
  const [seg, setSeg] = useState<AlbumSeg>('all')
  const [tag, setTag] = useState<string | null>(null)
  const [sort, setSort] = useState<AlbumSort>('recent')
  const [viewer, setViewer] = useState<{ post: EventAlbumPost; index: number } | null>(null)

  const filtered = useMemo(
    () =>
      posts
        .filter((p) => (seg === 'all' || p.is_published === (seg === 'published')) && (!tag || p.tag === tag) && (!searchTerm || p.title.includes(searchTerm)))
        .sort((a, b) =>
          sort === 'reaction' ? b.reaction_count - a.reaction_count : sort === 'recent' ? b.event_date.localeCompare(a.event_date) : a.event_date.localeCompare(b.event_date),
        ),
    [posts, seg, tag, searchTerm, sort],
  )

  return (
    <EventAlbumDesk
      posts={posts}
      filtered={filtered}
      loading={false}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      seg={seg}
      onSegChange={setSeg}
      tag={tag}
      onTagChange={setTag}
      sort={sort}
      onSortChange={setSort}
      onClearFilters={() => {
        setSearchTerm('')
        setSeg('all')
        setTag(null)
      }}
      onCreate={() => showToast('미리보기 — 등록 폼은 실제 화면에서', 'info')}
      onBack={() => navigate(-1)}
      onEdit={(p) => showToast(`미리보기 — ${p.title} 수정`, 'info')}
      onToggleVisibility={(p) => setPosts((l) => l.map((x) => (x.id === p.id ? { ...x, is_published: !x.is_published } : x)))}
      onDelete={(p) => showToast(`미리보기 — ${p.title} 삭제`, 'info')}
      onViewPublic={() => navigate('/news?tab=event-album')}
      onToggleReaction={(p, emoji) =>
        setPosts((l) => l.map((x) => (x.id === p.id ? { ...x, my_reaction: x.my_reaction === emoji ? null : emoji } : x)))
      }
      onOpenViewer={(post, index) => setViewer({ post, index })}
      onOpenEvent={(id) => showToast(`미리보기 — 일정 #${id}`, 'info')}
    >
      {viewer && <EventAlbumViewer post={viewer.post} initialIndex={viewer.index} onClose={() => setViewer(null)} />}
    </EventAlbumDesk>
  )
}

export default EventAlbumAdminPreview
