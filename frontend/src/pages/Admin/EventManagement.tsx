// 일정 관리 (admin, /admin/events)
// Single Responsibility: 일정 목록 조회·거르기와 공개 전환/삭제/주보 초안 일괄 공개 액션.
// 화면은 EventDesk(관리 데스크 — 목록 + 상세 + /events 엽서 미리보기, 2026-11-27),
// 작성·수정은 EventComposer 가 그린다.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../utils/toast'
import { deleteEvent, fetchAllEvents, publishBulletinDrafts, updateEvent } from '../../api/event'
import type { Event, EventCategory } from '../../types/event'
import { eventKeys } from '../../hooks/useEvents'
import EventComposer from './components/EventComposer'
import EventDesk from './components/EventDesk'
import { EVENT_TABS, eventPhase, filterEvents, isBulletinDraft, type EventTab } from './components/eventDeskUtils'
import { confirmDialog } from '../../utils/confirmDialog'
import { can } from '../../utils/access'
import { useOpenComposerFromUrl } from '../../hooks/useOpenComposerFromUrl'
import { kstNow } from '../../utils/date'

const EventManagement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState<EventCategory | 'all'>('all')
  // 관리 메뉴 현황 배지가 ?status=bulletin|draft 로 들어온다(예전 필터 이름 그대로 받는다)
  const [tab, setTab] = useState<EventTab>(() => {
    const s = searchParams.get('status')
    return s && (EVENT_TABS as readonly string[]).includes(s) ? (s as EventTab) : 'upcoming'
  })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [publishingBulletin, setPublishingBulletin] = useState(false)
  // null = 닫힘, 'new' = 등록, Event = 수정
  const [composer, setComposer] = useState<'new' | Event | null>(null)

  const loadEvents = async () => {
    try {
      const response = await fetchAllEvents(0, 200)
      if (response.success) setEvents(response.data.items)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '일정을 불러오지 못했습니다', 'error')
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
    void loadEvents()
  }, [navigate])

  // 전체 메뉴 > 관리 도구 '빠른 작업' → ?new=1 로 들어오면 등록 창부터 연다
  useOpenComposerFromUrl(() => setComposer('new'))

  /** 성도 일정표·홈이 보는 캐시 */
  const invalidatePublic = () => void queryClient.invalidateQueries({ queryKey: eventKeys.all })

  const handleTogglePublish = async (ev: Event) => {
    const next = !ev.is_published
    // 스위치가 바로 넘어가게(낙관적) — 실패하면 되돌린다
    setEvents((l) => l.map((x) => (x.id === ev.id ? { ...x, is_published: next } : x)))
    try {
      await updateEvent(ev.id, { is_published: next })
      invalidatePublic()
      showToast(next ? '성도 일정표에 올렸어요' : '비공개로 내렸어요', 'success')
    } catch (err) {
      setEvents((l) => l.map((x) => (x.id === ev.id ? { ...x, is_published: ev.is_published } : x)))
      showToast(err instanceof Error ? err.message : '바꾸지 못했어요', 'error')
    }
  }

  const handleDelete = async (ev: Event) => {
    if (
      !(await confirmDialog({
        title: '일정 삭제',
        message: `"${ev.title}"을(를) 지울까요?`,
        description:
          ev.attendance_count > 0
            ? `참석하겠다고 한 ${ev.attendance_count}명의 응답과 댓글도 함께 사라져요. 잠시 감추려면 공개 스위치를 끄세요.`
            : '되돌릴 수 없어요. 잠시 감추려면 공개 스위치를 끄세요.',
        confirmText: '네, 지울게요',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteEvent(ev.id)
      setEvents((l) => l.filter((x) => x.id !== ev.id))
      invalidatePublic()
      showToast('삭제했어요', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  const bulletinCount = events.filter(isBulletinDraft).length

  const handlePublishBulletin = async () => {
    if (publishingBulletin) return
    if (
      !(await confirmDialog({
        title: '주보 초안 모두 공개',
        message: `주보 소식에서 만든 일정 초안 ${bulletinCount}건을 한꺼번에 공개할까요?`,
        description: '날짜·시간·장소를 먼저 확인해 주세요. 잘못 읽힌 일정은 고치거나 지운 뒤 공개하면 돼요.',
        confirmText: '모두 공개',
      }))
    )
      return
    setPublishingBulletin(true)
    try {
      const { published } = await publishBulletinDrafts()
      showToast(`일정 ${published}건을 공개했어요`, 'success')
      setTab('upcoming')
      invalidatePublic()
      void loadEvents()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '공개하지 못했어요', 'error')
    } finally {
      setPublishingBulletin(false)
    }
  }

  const filtered = useMemo(() => filterEvents(events, { tab, category, q: searchTerm }), [events, tab, category, searchTerm])
  const counts = useMemo(() => {
    const now = kstNow()
    const past = events.filter((e) => eventPhase(e, now) === 'past').length
    return {
      upcoming: events.length - past,
      past,
      draft: events.filter((e) => !e.is_published).length,
      bulletin: events.filter(isBulletinDraft).length,
    }
  }, [events])

  return (
    <>
      <EventDesk
        events={events}
        filtered={filtered}
        counts={counts}
        loading={loading}
        tab={tab}
        onTabChange={setTab}
        category={category}
        onCategoryChange={setCategory}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setComposer('new')}
        onPublishBulletin={() => void handlePublishBulletin()}
        publishingBulletin={publishingBulletin}
        onBack={() => navigate(-1)}
        onEdit={(ev) => setComposer(ev)}
        onTogglePublish={(ev) => void handleTogglePublish(ev)}
        onDelete={(ev) => void handleDelete(ev)}
        onView={(ev) => navigate(`/events/${ev.id}`)}
      />

      {composer && (
        <EventComposer
          editingEvent={composer === 'new' ? null : composer}
          onClose={() => setComposer(null)}
          onSuccess={() => {
            setComposer(null)
            invalidatePublic()
            void loadEvents()
          }}
        />
      )}
    </>
  )
}

export default EventManagement
