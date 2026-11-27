// 새가족 소식 관리 (admin, /admin/new-family)
// Single Responsibility: 새가족 소식 목록 조회·거르기와 공개 전환/삭제 액션.
// 화면은 NewFamilyDesk(관리 데스크 — 목록 + 상세 + /news 카드 미리보기, 2026-11-27),
// 작성·수정(사진 순서 포함)은 NewFamilyComposer 가 그린다.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../utils/toast'
import { deleteNewFamilyPost, fetchNewFamilyPosts, updateNewFamilyPost } from '../../api/newFamily'
import type { NewFamilyPost } from '../../types/newFamily'
import { invalidateNewFamily } from '../../hooks/useNewFamily'
import NewFamilyComposer from './components/NewFamilyComposer'
import NewFamilyDesk from './components/NewFamilyDesk'
import { filterFamily, type FamilyTab } from './components/newFamilyDeskUtils'
import { confirmDialog } from '../../utils/confirmDialog'
import { can } from '../../utils/access'

/** 서버 한 번 최대 50건 — 예전 화면은 첫 50명에서 끊겼다. 전부 이어 받는다(안전하게 20쪽까지) */
const PAGE = 50
const fetchAllPosts = async (): Promise<NewFamilyPost[]> => {
  const all: NewFamilyPost[] = []
  for (let page = 1; page <= 20; page++) {
    const { data } = await fetchNewFamilyPosts(page, PAGE)
    all.push(...data.items)
    if (data.items.length < PAGE || all.length >= data.total) break
  }
  return all
}

const NewFamilyManagement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [posts, setPosts] = useState<NewFamilyPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tab, setTab] = useState<FamilyTab>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // null = 닫힘, 'new' = 등록, NewFamilyPost = 수정
  const [composer, setComposer] = useState<'new' | NewFamilyPost | null>(null)

  const loadPosts = async () => {
    try {
      // 관리자는 비공개 소식도 함께 내려받는다 (백엔드에서 is_admin으로 분기)
      setPosts(await fetchAllPosts())
    } catch (err) {
      showToast(err instanceof Error ? err.message : '목록을 불러오지 못했습니다', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    void loadPosts()
  }, [navigate])

  const handleTogglePublish = async (post: NewFamilyPost) => {
    const next = !post.is_published
    // 스위치가 바로 넘어가게(낙관적) — 실패하면 되돌린다
    setPosts((l) => l.map((p) => (p.id === post.id ? { ...p, is_published: next } : p)))
    try {
      const updated = await updateNewFamilyPost(post.id, { is_published: next })
      setPosts((l) => l.map((p) => (p.id === post.id ? { ...p, ...updated } : p)))
      invalidateNewFamily(queryClient)
      showToast(next ? '교회소식에 올렸어요' : '비공개로 내렸어요', 'success')
    } catch (err) {
      setPosts((l) => l.map((p) => (p.id === post.id ? { ...p, is_published: post.is_published } : p)))
      showToast(err instanceof Error ? err.message : '바꾸지 못했어요', 'error')
    }
  }

  const handleDelete = async (post: NewFamilyPost) => {
    const extra = [post.photo_count > 0 && `사진 ${post.photo_count}장`, post.welcome_count > 0 && `환영 ${post.welcome_count}`, post.comment_count > 0 && `댓글 ${post.comment_count}개`].filter(Boolean)
    if (
      !(await confirmDialog({
        title: '새가족 소식 삭제',
        message: `${post.member_name} 님 소식을 지울까요?`,
        description: `${extra.length ? `${extra.join('·')}도 함께 사라져요. ` : ''}잠시 감추려면 공개 스위치를 끄세요.`,
        confirmText: '네, 지울게요',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteNewFamilyPost(post.id)
      setPosts((l) => l.filter((p) => p.id !== post.id))
      invalidateNewFamily(queryClient)
      showToast('삭제했어요', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  const filtered = useMemo(() => filterFamily(posts, tab, searchTerm), [posts, tab, searchTerm])

  return (
    <>
      <NewFamilyDesk
        posts={posts}
        filtered={filtered}
        loading={loading}
        tab={tab}
        onTabChange={setTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setComposer('new')}
        onBack={() => navigate(-1)}
        onEdit={(p) => setComposer(p)}
        onTogglePublish={(p) => void handleTogglePublish(p)}
        onDelete={(p) => void handleDelete(p)}
        onViewPublic={() => navigate('/news?tab=new-family')}
      />

      {composer && (
        <NewFamilyComposer
          post={composer === 'new' ? undefined : composer}
          onClose={() => setComposer(null)}
          onSuccess={() => {
            setComposer(null)
            invalidateNewFamily(queryClient)
            void loadPosts()
          }}
        />
      )}
    </>
  )
}

export default NewFamilyManagement
