// 주보 관리 (admin, /admin/bulletins)
//
// 화면은 BulletinDesk(목록 + 상세 2단, 2026-11-27 개편)가 그리고, 여기서는
// 데이터·필터·AI 다시 읽기 같은 액션만 쥔다.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../utils/toast'
import { useQueryClient } from '@tanstack/react-query'
import {
  getBulletins,
  deleteBulletin,
  getBulletinAiStatus,
  importBulletinDigital,
  importBulletinNews,
  waitForBulletinImportJob,
  getBulletinDetail,
  type BulletinAiStatus,
  type BulletinImportJob,
} from '../../api/bulletin'
import { bulletinKeys } from '../../hooks/useDigitalBulletin'
import type { Bulletin } from '../../types/bulletin'
import BulletinComposer from './components/BulletinComposer'
import BulletinDesk, { type BulletinSeg, type BulletinSort } from './components/BulletinDesk'
import { adminBulletinDetailKey, bulletinDay, overallAi } from './components/bulletinDeskUtils'
import InstagramBulletinViewer from '../News/components/InstagramBulletinViewer'
import { confirmDialog } from '../../utils/confirmDialog'
import { can } from '../../utils/access'
import { useOpenComposerFromUrl } from '../../hooks/useOpenComposerFromUrl'

const BulletinManagement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  // 주보별 AI 읽기 상태 — 자동으로 읽히는 중인지, 3번 실패해 손을 봐야 하는지
  const [aiStatus, setAiStatus] = useState<Record<string, BulletinAiStatus>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [seg, setSeg] = useState<BulletinSeg>('all')
  const [sortKey, setSortKey] = useState<BulletinSort>('recent')
  /** 쪽을 눌러 연 성도 뷰어 — 상세(쪽 목록)가 있어야 열린다 */
  const [viewer, setViewer] = useState<{ bulletin: Bulletin; page: number } | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  /** 수정 모드로 열 주보 — null 이면 새 주보 등록 */
  const [editing, setEditing] = useState<Bulletin | null>(null)

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    loadBulletins()
  }, [navigate])

  const loadBulletins = async () => {
    try {
      setLoading(true)
      // 관리자 목록은 캐시를 건너뛴다 — 수정 직후 옛 내용이 보이면 안 된다
      const data = await getBulletins(0, 100, true)
      const list = Array.isArray(data) ? data : []
      setBulletins(list)
      void loadAiStatus(list.map(b => b.id))
    } catch (err) {
      showToast(err instanceof Error ? err.message : '주보를 불러오는데 실패했습니다', 'error')
      setBulletins([])
    } finally {
      setLoading(false)
    }
  }

  // 읽기 상태는 목록과 따로 — 실패해도 목록은 보여야 한다
  const loadAiStatus = async (ids: number[]) => {
    try {
      setAiStatus(await getBulletinAiStatus(ids))
    } catch {
      /* 상태 칩만 빠진다 */
    }
  }
  // 아직 읽는 중인 주보가 있으면 30초마다 다시 묻는다(자동 읽기는 1~2분)
  const hasActiveReading = useMemo(
    () =>
      Object.values(aiStatus).some(per =>
        Object.values(per).some(r => r.state === 'queued' || r.state === 'running' || r.state === 'pending'),
      ),
    [aiStatus],
  )
  useEffect(() => {
    if (!hasActiveReading || bulletins.length === 0) return
    const ids = bulletins.map(b => b.id)
    const timer = window.setInterval(() => void loadAiStatus(ids), 30_000)
    return () => window.clearInterval(timer)
  }, [hasActiveReading, bulletins])

  const handleDelete = async (bulletin: Bulletin) => {
    if (
      !(await confirmDialog({
        title: '주보 삭제',
        message: `"${bulletin.title}" 주보를 지울까요?`,
        description: `쪽 이미지 ${bulletin.page_count ?? 0}장도 함께 지워지고 되돌릴 수 없어요.`,
        confirmText: '네, 지울게요',
      }))
    )
      return
    try {
      await deleteBulletin(bulletin.id)
      showToast('주보가 삭제되었습니다', 'success')
      loadBulletins()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  const openCreate = () => {
    setEditing(null)
    setComposerOpen(true)
  }

  // 전체 메뉴 > 관리 도구 '빠른 작업' → ?new=1 로 들어오면 등록 창부터 연다
  useOpenComposerFromUrl(openCreate)

  const openEdit = (bulletin: Bulletin) => {
    setEditing(bulletin)
    setComposerOpen(true)
  }

  // 소식 쪽 → 일정 (AI 1~2분, 바로 공개). 자동 등록을 놓친 주보나 직접 올린 주보용
  const [importingId, setImportingId] = useState<number | null>(null)
  // state는 다음 렌더에야 반영되므로, 확인창 전후 빠른 연타까지 막는 동기 잠금
  const importLockRef = useRef(false)
  const handleImportNews = async (bulletin: Bulletin) => {
    if (importLockRef.current) return
    importLockRef.current = true
    try {
      await runImportNews(bulletin)
    } finally {
      importLockRef.current = false
    }
  }
  const handleImportDigital = async (bulletin: Bulletin) => {
    if (importLockRef.current) return
    importLockRef.current = true
    try {
      await runImportDigital(bulletin)
    } finally {
      importLockRef.current = false
    }
  }
  // 서버는 읽기를 대기열에 넣고 바로 job 을 돌려준다 — 끝날 때까지 몇 초마다 묻는다.
  // 앞에 줄 선 읽기가 있으면 '대기 중' 토스트로 알려 준다
  const waitImport = (job: BulletinImportJob) => {
    let queuedToldAt = 0
    return waitForBulletinImportJob(job.job_id, j => {
      if (j.state === 'queued' && Date.now() - queuedToldAt > 30_000) {
        queuedToldAt = Date.now()
        showToast('앞의 읽기가 끝나기를 기다리는 중이에요…', 'info')
      }
    })
  }
  // 주보 전체 → 디지털 주보 (AI 1~2분). 읽으면 바로 공개 — 공개본이 더 새 주보일 때만 초안으로 남는다
  const runImportDigital = async (bulletin: Bulletin) => {
    if (
      !(await confirmDialog({
        title: '디지털 주보 다시 읽기',
        message:
          '등록된 주보는 서버가 알아서 읽어 바로 공개해요. 다시 읽히고 싶거나 읽기가 3번 실패했을 때만 쓰세요. 1~2분 걸리고, 지금 공개된 디지털 주보를 덮어써요(손으로 고친 내용도 사라져요). 지난 주보를 읽히면 공개본은 그대로 두고 초안으로만 남아요.',
        confirmText: '다시 읽기',
      }))
    )
      return
    setImportingId(bulletin.id)
    showToast('주보를 읽는 중이에요… (1~2분)', 'info')
    try {
      const job = await waitImport(await importBulletinDigital(bulletin.id))
      const r = job.result.digital
      // 공개본·초안·보관본이 바뀌었으니 소식 탭이 옛 캐시를 보여 주지 않게(all 이 draft·issues 의 앞머리)
      void queryClient.invalidateQueries({ queryKey: bulletinKeys.all, refetchType: 'all' })
      if (!r) {
        showToast('주보를 읽지 못했어요. 잠시 후 다시 시도해 주세요', 'error')
        return
      }
      if (!r.found) {
        showToast('이 이미지를 주보로 읽지 못했어요', 'info')
        return
      }
      const summary = `소식 ${r.announcements}건 · 안내 ${r.extras}개 · 일정 ${r.schedule}개`
      showToast(
        r.published
          ? `디지털 주보를 공개했어요 — ${summary}. 잘못 읽힌 곳이 있으면 고쳐 주세요`
          : `초안 완성 — ${summary}. 지금 공개본이 더 새 주보라 초안으로 뒀어요. 소식 탭에서 검토 후 적용해 주세요`,
        'success',
      )
      navigate('/news?tab=bulletin')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '주보를 읽지 못했어요', 'error')
    } finally {
      setImportingId(null)
      void loadAiStatus(bulletins.map(b => b.id))
    }
  }
  const runImportNews = async (bulletin: Bulletin) => {
    if (
      !(await confirmDialog({
        title: '소식 → 일정 다시 만들기',
        message:
          '등록된 주보는 서버가 알아서 소식 쪽을 읽어 일정을 바로 공개해요. 다시 읽히고 싶거나 읽기가 3번 실패했을 때만 쓰세요. 1~2분 걸리고, 이미 있는 일정은 건너뜁니다. 교회소식 글은 디지털 주보가 공개될 때 함께 만들어져요.',
        confirmText: '다시 만들기',
      }))
    )
      return
    setImportingId(bulletin.id)
    showToast('주보 소식을 읽는 중이에요… (1~2분)', 'info')
    try {
      const job = await waitImport(await importBulletinNews(bulletin.id))
      const r = job.result.news
      if (!r) {
        showToast('주보 소식을 읽지 못했어요. 잠시 후 다시 시도해 주세요', 'error')
        return
      }
      if (!r.found) {
        showToast('이 주보에서 소식 쪽을 찾지 못했어요', 'info')
        return
      }
      const parts = [`일정 ${r.events}건 공개`]
      if (r.skipped_duplicates) parts.push(`중복 ${r.skipped_duplicates}건 건너뜀`)
      showToast(`${parts.join(' · ')} — 잘못 읽힌 곳이 있으면 일정 관리에서 고쳐 주세요`, 'success')
      if (r.events) navigate('/admin/events')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '주보 소식을 읽지 못했어요', 'error')
    } finally {
      setImportingId(null)
      void loadAiStatus(bulletins.map(b => b.id))
    }
  }

  const handleComposerClose = () => {
    setComposerOpen(false)
    setEditing(null)
  }

  const handleComposerSuccess = () => {
    handleComposerClose()
    // 쪽을 바꿨을 수 있으니 상세 미리보기도 다시 받는다
    void queryClient.invalidateQueries({ queryKey: ['admin', 'bulletin-detail'] })
    loadBulletins()
  }

  const openViewer = async (bulletin: Bulletin, page: number) => {
    try {
      const detail = await queryClient.fetchQuery({
        queryKey: adminBulletinDetailKey(bulletin.id),
        queryFn: () => getBulletinDetail(bulletin.id, false),
        staleTime: 60_000,
      })
      setViewer({ bulletin: { ...bulletin, ...detail }, page })
    } catch (err) {
      showToast(err instanceof Error ? err.message : '주보를 열지 못했어요', 'error')
    }
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const thisYear = new Date().getFullYear()
    const arr = bulletins.filter(b => {
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        (b.description?.toLowerCase().includes(q) ?? false)
      const matchesSeg =
        seg === 'all' ||
        (seg === 'year' && bulletinDay(b.bulletin_date).getFullYear() === thisYear) ||
        (seg === 'attention' && overallAi(aiStatus[String(b.id)]) === 'attention')
      return matchesSearch && matchesSeg
    })
    return [...arr].sort((a, b) => {
      if (sortKey === 'views') return (b.views ?? 0) - (a.views ?? 0)
      const at = new Date(a.bulletin_date).getTime()
      const bt = new Date(b.bulletin_date).getTime()
      return sortKey === 'recent' ? bt - at : at - bt
    })
  }, [bulletins, searchTerm, seg, sortKey, aiStatus])

  return (
    <BulletinDesk
      bulletins={bulletins}
      filtered={filtered}
      loading={loading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      seg={seg}
      onSegChange={setSeg}
      sort={sortKey}
      onSortChange={setSortKey}
      onClearFilters={() => {
        setSearchTerm('')
        setSeg('all')
      }}
      onCreate={openCreate}
      onBack={() => navigate(-1)}
      onEdit={openEdit}
      onDelete={handleDelete}
      onViewPublic={b => navigate(`/news?tab=bulletin&b=${b.id}`)}
      onOpenViewer={(b, page) => void openViewer(b, page)}
      onImportNews={handleImportNews}
      onImportDigital={handleImportDigital}
      importingId={importingId}
      aiStatus={aiStatus}
    >
      {composerOpen && (
        <BulletinComposer
          key={editing?.id ?? 'new'}
          bulletin={editing}
          existing={bulletins}
          onClose={handleComposerClose}
          onSuccess={handleComposerSuccess}
        />
      )}
      {viewer && (
        <InstagramBulletinViewer
          key={viewer.bulletin.id}
          bulletin={viewer.bulletin}
          initialPage={viewer.page}
          onClose={() => setViewer(null)}
        />
      )}
    </BulletinDesk>
  )
}

export default BulletinManagement
