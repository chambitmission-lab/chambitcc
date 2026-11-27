// 공지(홈 팝업·알림함) 관리 (관리자, /admin/notifications)
// Single Responsibility: 공지 목록 조회·필터와 공개/삭제 액션.
// 화면은 NotificationDesk(관리 데스크 — 목록 + 팝업 상태·성도 화면 미리보기, 2026-11-27),
// 작성·수정은 NotificationComposer(2단 모달)가 그린다.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminNotifications, deleteNotification, updateNotification } from '../../api/notification'
import { showToast } from '../../utils/toast'
import type { Notification } from '../../types/notification'
import NotificationComposer from './components/NotificationComposer'
import NotificationDesk from './components/NotificationDesk'
import { filterNotices, type NoticeSeg } from './components/notificationDeskUtils'
import { confirmDialog } from '../../utils/confirmDialog'
import { can } from '../../utils/access'
import { useOpenComposerFromUrl } from '../../hooks/useOpenComposerFromUrl'

const NotificationManagement = () => {
  const navigate = useNavigate()
  const [notices, setNotices] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [seg, setSeg] = useState<NoticeSeg>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // null = 닫힘, 'new' = 등록, Notification = 수정
  const [composer, setComposer] = useState<'new' | Notification | null>(null)

  const loadNotices = async () => {
    try {
      // 관리 전용 목록 — 비공개 공지 포함, 개인 알림(시스템 발송) 제외
      const data = await getAdminNotifications({ limit: 1000 })
      setNotices(data.notifications || [])
    } catch (error) {
      showToast(error instanceof Error ? error.message : '공지사항을 불러오는데 실패했습니다', 'error')
      setNotices([])
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
    void loadNotices()
  }, [navigate])

  // 전체 메뉴 > 관리 도구 '빠른 작업' → ?new=1 로 들어오면 등록 창부터 연다
  useOpenComposerFromUrl(() => setComposer('new'))

  const handleDelete = async (n: Notification) => {
    if (
      !(await confirmDialog({
        title: '공지 삭제',
        message: `"${n.title}"을(를) 지울까요?`,
        description: '알림함과 홈 팝업에서 함께 사라지며 되돌릴 수 없어요.',
        confirmText: '네, 지울게요',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteNotification(n.id)
      setNotices((prev) => prev.filter((x) => x.id !== n.id))
      showToast('삭제했어요', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  const togglePublished = async (n: Notification) => {
    // 스위치는 바로 바뀌어 보이게(낙관적) — 실패하면 되돌린다
    const next = !n.is_active
    setNotices((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_active: next } : x)))
    try {
      const updated = await updateNotification(n.id, { is_active: next })
      setNotices((prev) => prev.map((x) => (x.id === n.id ? { ...x, ...updated } : x)))
      showToast(next ? (n.is_popup ? '공개했어요 — 홈 팝업에도 떠요' : '공개했어요') : '비공개로 돌렸어요', 'success')
    } catch (err) {
      setNotices((prev) => prev.map((x) => (x.id === n.id ? n : x)))
      showToast(err instanceof Error ? err.message : '변경에 실패했습니다', 'error')
    }
  }

  const filtered = useMemo(() => filterNotices(notices, searchTerm, seg), [notices, searchTerm, seg])

  return (
    <>
      <NotificationDesk
        notices={notices}
        filtered={filtered}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        seg={seg}
        onSegChange={setSeg}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setComposer('new')}
        onBack={() => navigate(-1)}
        onClearFilters={() => {
          setSearchTerm('')
          setSeg('all')
        }}
        onGoNews={() => navigate('/admin/news')}
        onEdit={(n) => setComposer(n)}
        onTogglePublished={(n) => void togglePublished(n)}
        onDelete={(n) => void handleDelete(n)}
        onOpenLink={(n) => n.link_url && navigate(n.link_url)}
      />

      {composer && (
        <NotificationComposer
          editingNotification={composer === 'new' ? null : composer}
          onClose={() => setComposer(null)}
          onSuccess={() => {
            setComposer(null)
            void loadNotices()
          }}
        />
      )}
    </>
  )
}

export default NotificationManagement
