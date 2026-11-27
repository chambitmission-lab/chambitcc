// 공동 기도제목 관리 (관리자)
// Single Responsibility: 주차 목록 조회·필터와 작성/수정/공개/삭제 액션.
// 화면은 WeeklyPrayerDesk(관리 데스크 — 주차 목록 + 성도 화면 미리보기, 2026-11-27),
// 작성은 WeeklyPrayerComposer(PC 2단 모달)가 그린다.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../utils/toast'
import {
  getAllWeeklyPrayers,
  getWeeklyPrayer,
  createWeeklyPrayer,
  updateWeeklyPrayer,
  deleteWeeklyPrayer,
  parseWeeklyPrayerText,
} from '../../api/weeklyPrayer'
import type { WeeklyPrayerListItem } from '../../types/weeklyPrayer'
import { weeklyPrayerKeys } from '../../hooks/queryKeys'
import { confirmDialog } from '../../utils/confirmDialog'
import { can } from '../../utils/access'
import { useOpenComposerFromUrl } from '../../hooks/useOpenComposerFromUrl'
import WeeklyPrayerDesk from './components/WeeklyPrayerDesk'
import WeeklyPrayerComposer, { type WeeklyPrayerDraft, type WeeklyPrayerSavePayload } from './components/WeeklyPrayerComposer'
import { filterWeeks, nextFreeSunday, weekDateOf, type WpSeg } from './components/weeklyPrayerDeskUtils'

const md = (weekDate: string) => {
  const d = weekDateOf(weekDate)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

const WeeklyPrayerManagement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [list, setList] = useState<WeeklyPrayerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [seg, setSeg] = useState<WpSeg>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<WeeklyPrayerDraft | null>(null)

  const loadList = useCallback(async () => {
    try {
      setList(await getAllWeeklyPrayers())
    } catch {
      showToast('목록을 불러오지 못했습니다', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자만 접근할 수 있습니다', 'error')
      navigate('/')
      return
    }
    void loadList()
  }, [navigate, loadList])

  /** 관리 화면 mutation 뒤 — 홈 배너·/prayer-topics·예배 스크린 캐시까지 최신화 */
  const invalidatePublic = () => queryClient.invalidateQueries({ queryKey: weeklyPrayerKeys.all })

  const fetchDetail = (id: number) =>
    queryClient.fetchQuery({ queryKey: weeklyPrayerKeys.detail(id), queryFn: () => getWeeklyPrayer(id) })

  const openNew = () =>
    setDraft({ editingId: null, weekDate: nextFreeSunday(list), title: '기도제목', isPublished: true, items: [] })

  // 전체 메뉴 > 관리 도구 '빠른 작업' → ?new=1 로 들어오면 등록 창부터 연다
  useOpenComposerFromUrl(openNew)

  const copyToNew = async (from: WeeklyPrayerListItem) => {
    try {
      const p = await fetchDetail(from.id)
      setDraft({
        editingId: null,
        weekDate: nextFreeSunday(list),
        title: p.title,
        isPublished: true,
        items: p.items.map(({ title, body, scripture }) => ({ title, body, scripture })),
        copiedFrom: p.week_date,
      })
    } catch {
      showToast('복사할 내용을 불러오지 못했습니다', 'error')
    }
  }

  const openEdit = async (item: WeeklyPrayerListItem) => {
    try {
      // 수정은 항상 서버의 지금 내용으로 — 캐시가 남아 있어도 다시 받는다
      const p = await getWeeklyPrayer(item.id)
      setDraft({
        editingId: p.id,
        weekDate: p.week_date,
        title: p.title,
        isPublished: p.is_published,
        items: p.items.map(({ title, body, scripture }) => ({ title, body, scripture })),
      })
    } catch {
      showToast('기도제목을 불러오지 못했습니다', 'error')
    }
  }

  const handleSave = async (payload: WeeklyPrayerSavePayload, editingId: number | null) => {
    try {
      const saved = editingId ? await updateWeeklyPrayer(editingId, payload) : await createWeeklyPrayer(payload)
      showToast(editingId ? '수정했어요' : `${md(saved.week_date)} 기도제목을 올렸어요`, 'success')
      setDraft(null)
      setSelectedId(saved.id)
      void invalidatePublic()
      await loadList()
    } catch (e) {
      showToast(
        e instanceof Error && e.message === 'DUPLICATE_WEEK'
          ? `${md(payload.week_date)}에는 이미 기도제목이 있어요`
          : '저장에 실패했습니다',
        'error',
      )
      throw e
    }
  }

  const togglePublished = async (item: WeeklyPrayerListItem) => {
    // 스위치는 바로 바뀌어 보이게(낙관적) — 실패하면 되돌린다
    const next = !item.is_published
    setList((prev) => prev.map((p) => (p.id === item.id ? { ...p, is_published: next } : p)))
    try {
      await updateWeeklyPrayer(item.id, { is_published: next })
      void invalidatePublic()
      showToast(next ? '성도들에게 공개했어요' : '비공개로 돌렸어요', 'success')
    } catch {
      setList((prev) => prev.map((p) => (p.id === item.id ? item : p)))
      showToast('변경에 실패했습니다', 'error')
    }
  }

  const handleDelete = async (item: WeeklyPrayerListItem) => {
    if (
      !(await confirmDialog({
        title: '기도제목 삭제',
        message: `${md(item.week_date)} 기도제목을 지울까요?`,
        description: `항목 ${item.item_count}개와 성도들의 아멘 ${item.amen_total ?? 0}번이 함께 사라지며 되돌릴 수 없어요.`,
        confirmText: '네, 지울게요',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteWeeklyPrayer(item.id)
      setList((prev) => prev.filter((p) => p.id !== item.id))
      void invalidatePublic()
      showToast('삭제했어요', 'success')
    } catch {
      showToast('삭제에 실패했습니다', 'error')
    }
  }

  const openScreen = (item?: WeeklyPrayerListItem) => {
    const hash = item ? `#/prayer-topics/screen?id=${item.id}` : '#/prayer-topics/screen'
    window.open(`${window.location.origin}${window.location.pathname}${hash}`, '_blank')
  }

  const filtered = useMemo(() => filterWeeks(list, seg), [list, seg])
  const latest = useMemo(() => filterWeeks(list, 'all')[0], [list])

  return (
    <>
      <WeeklyPrayerDesk
        list={list}
        filtered={filtered}
        loading={loading}
        seg={seg}
        onSegChange={setSeg}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={openNew}
        onStartThisWeek={() => (latest ? void copyToNew(latest) : openNew())}
        onBack={() => navigate(-1)}
        onViewPublic={() => navigate('/prayer-topics')}
        onEdit={(p) => void openEdit(p)}
        onTogglePublished={(p) => void togglePublished(p)}
        onDelete={(p) => void handleDelete(p)}
        onCopyToNew={(p) => void copyToNew(p)}
        onOpenScreen={openScreen}
      />
      {draft && (
        <WeeklyPrayerComposer
          key={`${draft.editingId ?? 'new'}-${draft.weekDate}-${draft.copiedFrom ?? ''}`}
          draft={draft}
          onClose={() => setDraft(null)}
          onSave={handleSave}
          onParse={parseWeeklyPrayerText}
        />
      )}
    </>
  )
}

export default WeeklyPrayerManagement
