// 오늘의 말씀 관리 (관리자, /admin/daily-verse)
// Single Responsibility: 말씀 목록 조회·검색과 다시 걸기/삭제 액션.
// 화면은 DailyVerseDesk(관리 데스크 — 지금 걸린 말씀 + 보관함 + 홈 명판 미리보기, 2026-11-27),
// 작성·수정은 DailyVerseComposer(2단 모달)가 그린다.
//
// 서버 구조: 한 번에 하나만 걸린다(is_active). 새로 등록하면 그 말씀이 바로 걸리고,
// 지난 말씀은 PUT /daily-verse/{id}/activate 로 다시 건다. 날짜별 예약은 없다.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../utils/toast'
import { activateDailyVerse, deleteDailyVerse, getAllDailyVerses } from '../../api/dailyVerse'
import type { DailyVerse } from '../../types/dailyVerse'
import DailyVerseComposer from './components/DailyVerseComposer'
import DailyVerseDesk from './components/DailyVerseDesk'
import { archiveOf, isLiveVerse } from './components/dailyVerseDeskUtils'
import { confirmDialog } from '../../utils/confirmDialog'
import { dailyVerseKeys } from '../../hooks/queryKeys'
import { homeKeys } from '../../hooks/useHomeSummary'
import { can } from '../../utils/access'
import { useOpenComposerFromUrl } from '../../hooks/useOpenComposerFromUrl'

const DailyVerseManagement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [verses, setVerses] = useState<DailyVerse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // null = 닫힘, 'new' = 등록, DailyVerse = 수정
  const [composer, setComposer] = useState<'new' | DailyVerse | null>(null)

  const loadVerses = async () => {
    try {
      const data = await getAllDailyVerses()
      setVerses(Array.isArray(data) ? data : [])
    } catch (err) {
      showToast(err instanceof Error ? err.message : '오늘의 말씀을 불러오는데 실패했습니다', 'error')
      setVerses([])
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
    void loadVerses()
  }, [navigate])

  // 전체 메뉴 > 관리 도구 '빠른 작업' → ?new=1 로 들어오면 등록 창부터 연다
  useOpenComposerFromUrl(() => setComposer('new'))

  /** 홈 명판·참비·집중 기도·⌘K 가 보는 캐시까지 — 홈 묶음(summary)도 말씀을 실어 온다 */
  const invalidatePublic = () => {
    void queryClient.invalidateQueries({ queryKey: dailyVerseKeys.all })
    void queryClient.invalidateQueries({ queryKey: dailyVerseKeys.current() })
    void queryClient.invalidateQueries({ queryKey: homeKeys.summary() })
  }

  const handleActivate = async (v: DailyVerse) => {
    // 바로 바뀌어 보이게(낙관적) — 실패하면 되돌린다
    const prev = verses
    setVerses((list) => list.map((x) => ({ ...x, is_active: x.id === v.id ? 1 : 0 })))
    try {
      await activateDailyVerse(v.id)
      invalidatePublic()
      showToast(`${v.verse_reference}을(를) 다시 걸었어요`, 'success')
    } catch (err) {
      setVerses(prev)
      showToast(err instanceof Error ? err.message : '다시 걸기에 실패했습니다', 'error')
    }
  }

  const handleDelete = async (v: DailyVerse) => {
    const live = isLiveVerse(v)
    if (
      !(await confirmDialog({
        title: '말씀 삭제',
        message: `${v.verse_reference}을(를) 지울까요?`,
        description: live
          ? '지금 홈에 걸린 말씀이라, 지우면 홈 명판이 비어요. 보관함의 다른 말씀을 먼저 거는 걸 권해요.'
          : '되돌릴 수 없어요.',
        confirmText: '네, 지울게요',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteDailyVerse(v.id)
      setVerses((list) => list.filter((x) => x.id !== v.id))
      if (live) invalidatePublic()
      showToast('삭제했어요', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  const archive = useMemo(() => archiveOf(verses, searchTerm), [verses, searchTerm])
  const live = verses.find(isLiveVerse) ?? null

  return (
    <>
      <DailyVerseDesk
        verses={verses}
        archive={archive}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setComposer('new')}
        onBack={() => navigate(-1)}
        onEdit={(v) => setComposer(v)}
        onActivate={(v) => void handleActivate(v)}
        onDelete={(v) => void handleDelete(v)}
        onViewHome={() => navigate('/')}
      />

      {composer && (
        <DailyVerseComposer
          editingVerse={composer === 'new' ? null : composer}
          currentVerse={live}
          onClose={() => setComposer(null)}
          onSuccess={(saved) => {
            setComposer(null)
            setSelectedId(saved.id)
            invalidatePublic()
            void loadVerses()
          }}
        />
      )}
    </>
  )
}

export default DailyVerseManagement
