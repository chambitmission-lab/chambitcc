// 행사 앨범 관리 (admin, /admin/event-albums)
//
// 화면은 EventAlbumDesk(목록 + 상세 2단, 2026-11-27 개편)가 그리고, 여기서는
// 데이터·필터·액션만 쥔다. 미리보기 속 반응·댓글은 성도 화면과 같은 실제 동작이다.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../utils/toast'
import {
  deleteEventAlbumPost,
  fetchEventAlbumPosts,
  toggleEventAlbumReaction,
  updateEventAlbumPost,
} from '../../api/eventAlbum'
import { invalidateEventAlbum } from '../../hooks/useEventAlbum'
import type { EventAlbumPost } from '../../types/eventAlbum'
import EventAlbumComposer from './components/EventAlbumComposer'
import EventAlbumDesk, { type AlbumSeg, type AlbumSort } from './components/EventAlbumDesk'
import EventAlbumViewer from '../News/components/EventAlbumViewer'
import { confirmDialog } from '../../utils/confirmDialog'
import { can } from '../../utils/access'
import { useOpenComposerFromUrl } from '../../hooks/useOpenComposerFromUrl'

const PAGE = 50

const EventAlbumManagement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [posts, setPosts] = useState<EventAlbumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [seg, setSeg] = useState<AlbumSeg>('all')
  const [tag, setTag] = useState<string | null>(null)
  const [sort, setSort] = useState<AlbumSort>('recent')
  // null = 닫힘, 'new' = 등록, EventAlbumPost = 수정
  const [composer, setComposer] = useState<'new' | EventAlbumPost | null>(null)
  const [viewer, setViewer] = useState<{ post: EventAlbumPost; index: number } | null>(null)

  // 전체 메뉴 > 관리 도구 '빠른 작업' → ?new=1 로 들어오면 등록 창부터 연다
  useOpenComposerFromUrl(() => setComposer('new'))

  const loadPosts = useCallback(async () => {
    try {
      // 관리자는 비공개 앨범도 함께 내려받는다(백엔드가 is_admin 으로 분기).
      // 한 쪽에 50개씩 — 연도별로 되돌아보려면 전부 있어야 해서 끝까지 넘긴다
      const all: EventAlbumPost[] = []
      for (let page = 1; page <= 20; page++) {
        const res = await fetchEventAlbumPosts(page, PAGE)
        all.push(...res.data.items)
        if (res.data.items.length < PAGE || all.length >= res.data.total) break
      }
      setPosts(all)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '목록을 불러오지 못했습니다', 'error')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    void loadPosts()
  }, [navigate, loadPosts])

  /** 관리 화면 mutation 뒤 — /news 목록(비활성 캐시)까지 최신화 */
  const refreshEverywhere = () => {
    invalidateEventAlbum(queryClient)
    void loadPosts()
  }

  const patch = (id: number, next: Partial<EventAlbumPost>) =>
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...next } : p)))

  const handleDelete = async (post: EventAlbumPost) => {
    if (
      !(await confirmDialog({
        title: '행사 앨범 삭제',
        message: `"${post.title}" 앨범을 지울까요?`,
        description: `사진 ${post.photo_count}장과 댓글 ${post.comment_count}개도 함께 지워지고 되돌릴 수 없어요. 잠시 감추려면 공개 스위치를 끄세요.`,
        confirmText: '네, 지울게요',
      }))
    )
      return
    try {
      await deleteEventAlbumPost(post.id)
      showToast('삭제했어요', 'success')
      refreshEverywhere()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  const handleToggleVisibility = async (post: EventAlbumPost) => {
    try {
      const updated = await updateEventAlbumPost(post.id, { is_published: !post.is_published })
      patch(post.id, updated)
      invalidateEventAlbum(queryClient)
      showToast(updated.is_published ? '성도들에게 공개했어요' : '비공개로 돌렸어요', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '변경에 실패했습니다', 'error')
    }
  }

  const handleToggleReaction = async (post: EventAlbumPost, emoji: string) => {
    try {
      const res = await toggleEventAlbumReaction(post.id, emoji)
      patch(post.id, {
        my_reaction: res.my_reaction,
        reaction_count: res.reaction_count,
        reaction_breakdown: res.reaction_breakdown,
      })
      invalidateEventAlbum(queryClient)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '반응을 남기지 못했습니다', 'error')
    }
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return posts
      .filter((p) => {
        if (seg === 'published' && !p.is_published) return false
        if (seg === 'hidden' && p.is_published) return false
        if (tag && p.tag !== tag) return false
        return !q || p.title.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q) || (p.caption?.toLowerCase().includes(q) ?? false)
      })
      .sort((a, b) => {
        if (sort === 'reaction') return b.reaction_count - a.reaction_count || b.event_date.localeCompare(a.event_date)
        return sort === 'recent' ? b.event_date.localeCompare(a.event_date) : a.event_date.localeCompare(b.event_date)
      })
  }, [posts, searchTerm, seg, tag, sort])

  return (
    <EventAlbumDesk
      posts={posts}
      filtered={filtered}
      loading={loading}
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
      onCreate={() => setComposer('new')}
      onBack={() => navigate(-1)}
      onEdit={(post) => setComposer(post)}
      onToggleVisibility={handleToggleVisibility}
      onDelete={handleDelete}
      onViewPublic={(post) => navigate(`/news?tab=event-album&post=${post.id}`)}
      onToggleReaction={handleToggleReaction}
      onOpenViewer={(post, index) => setViewer({ post, index })}
      onOpenEvent={(eventId) => navigate(`/events/${eventId}`)}
    >
      {composer && (
        <EventAlbumComposer
          // key — 다른 앨범을 연속으로 수정할 때 폼 상태가 남지 않도록 재마운트
          key={composer === 'new' ? 'new' : composer.id}
          post={composer === 'new' ? undefined : composer}
          onClose={() => setComposer(null)}
          onSuccess={() => {
            setComposer(null)
            refreshEverywhere()
          }}
        />
      )}
      {viewer && <EventAlbumViewer post={viewer.post} initialIndex={viewer.index} onClose={() => setViewer(null)} />}
    </EventAlbumDesk>
  )
}

export default EventAlbumManagement
