// 교회소식 관리 (관리자)
// Single Responsibility: 소식 목록 조회·필터와 등록/수정/공개·고정/삭제 액션.
// 화면은 NewsDesk(편집 데스크 — 목록 + 성도 화면 미리보기, 2026-11-27 A안)가 그린다.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import { deleteNews, fetchNewsList, patchNews } from '../../api/news'
import type { NewsItem } from '../../types/news'
import { useInvalidateNews } from '../../hooks/useNews'
import NewsComposer from './components/NewsComposer'
import NewsDesk, { type NewsSeg } from './components/NewsDesk'
import { can } from '../../utils/access'

const timeOf = (news: NewsItem) => new Date(news.published_at ?? news.created_at ?? 0).getTime()

const NewsManagement = () => {
  const navigate = useNavigate()
  const invalidateNews = useInvalidateNews()

  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [seg, setSeg] = useState<NewsSeg>('all')
  const [category, setCategory] = useState<string | null>(null)
  // null = 닫힘, 'new' = 등록, NewsItem = 수정
  const [composer, setComposer] = useState<'new' | NewsItem | null>(null)

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    loadNews()
  }, [navigate])

  const loadNews = async () => {
    try {
      // 관리자는 비공개 글도 함께 내려받는다 (백엔드에서 is_admin으로 분기)
      const response = await fetchNewsList(1, 50)
      setItems(response.data.items)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '목록을 불러오지 못했습니다', 'error')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  /** 관리 화면 mutation 뒤 — /news 목록(비활성 캐시)까지 최신화 */
  const refreshEverywhere = () => {
    invalidateNews()
    loadNews()
  }

  const handleDelete = async (news: NewsItem) => {
    if (
      !(await confirmDialog({
        title: '소식 삭제',
        message: `"${news.title}"을(를) 지울까요?`,
        description: '첨부한 사진과 파일도 함께 지워져요. 되돌릴 수 없어요.',
        confirmText: '네, 지울게요',
      }))
    )
      return
    try {
      await deleteNews(news.id)
      showToast('삭제했어요', 'success')
      refreshEverywhere()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  const applyPatch = async (
    news: NewsItem,
    patch: { is_published?: boolean; is_pinned?: boolean },
    message: string,
  ) => {
    // 스위치는 바로 바뀌어 보이게(낙관적) — 실패하면 되돌린다
    setItems((prev) => prev.map((n) => (n.id === news.id ? { ...n, ...patch } : n)))
    try {
      const updated = await patchNews(news.id, patch)
      setItems((prev) => prev.map((n) => (n.id === news.id ? { ...n, ...updated } : n)))
      invalidateNews()
      showToast(message, 'success')
    } catch (err) {
      setItems((prev) => prev.map((n) => (n.id === news.id ? news : n)))
      showToast(err instanceof Error ? err.message : '변경에 실패했습니다', 'error')
    }
  }

  const categories = useMemo(
    () => Array.from(new Set(items.map((n) => n.category).filter((c): c is string => !!c))).sort(),
    [items],
  )

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return items
      .filter((n) => {
        const matchesSearch =
          !q || n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q)
        const matchesSeg =
          seg === 'all' ||
          (seg === 'published' && n.is_published) ||
          (seg === 'hidden' && !n.is_published) ||
          (seg === 'pinned' && n.is_pinned)
        return matchesSearch && matchesSeg && (!category || n.category === category)
      })
      // 고정글은 위로 (성도 화면과 같은 감각), 그다음 최신순
      .sort((a, b) => (a.is_pinned !== b.is_pinned ? (a.is_pinned ? -1 : 1) : timeOf(b) - timeOf(a)))
  }, [items, searchTerm, seg, category])

  return (
    <>
      <NewsDesk
        items={items}
        filtered={filtered}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        seg={seg}
        onSegChange={setSeg}
        category={category}
        categories={categories}
        onCategoryChange={setCategory}
        onClearFilters={() => {
          setSearchTerm('')
          setSeg('all')
          setCategory(null)
        }}
        onCreate={() => setComposer('new')}
        onBack={() => navigate(-1)}
        onEdit={(news) => setComposer(news)}
        onViewPublic={(news) => navigate(`/news?tab=news&post=${news.id}`)}
        onTogglePublished={(news) =>
          applyPatch(
            news,
            { is_published: !news.is_published },
            news.is_published ? '비공개로 돌렸어요' : '성도들에게 공개했어요',
          )
        }
        onTogglePinned={(news) =>
          applyPatch(
            news,
            { is_pinned: !news.is_pinned },
            news.is_pinned ? '고정을 풀었어요' : '맨 위에 고정했어요',
          )
        }
        onDelete={handleDelete}
      />

      {composer && (
        <NewsComposer
          // key — 다른 글을 연속으로 수정할 때 폼 상태가 남지 않도록 재마운트
          key={composer === 'new' ? 'new' : composer.id}
          news={composer === 'new' ? undefined : composer}
          onClose={() => setComposer(null)}
          onSuccess={() => {
            setComposer(null)
            refreshEverywhere()
          }}
        />
      )}
    </>
  )
}

export default NewsManagement
