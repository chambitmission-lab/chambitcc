// 손글씨 필사대회 관리 (admin, /admin/handwriting)
// Single Responsibility: 대회 목록 조회와 보이기 전환·발표/발표 취소·삭제 액션.
// 화면은 HandwritingDesk(관리 데스크 — 단계별 목록 + 상세·발표 + 표 많은 순 출품작 숨기기, 2026-11-27),
// 열기·고치기 창은 HandwritingContestComposer 가 그린다.
// 작품 숨기기는 대회 화면(작품 열기)에서도 여전히 된다 — 관리자에게만 보이는 버튼.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  contestKeys,
  useAdminContests,
  useContestEntries,
  useDeleteContest,
  useHideEntry,
  usePublishContest,
  useSaveContest,
} from '../../hooks/useHandwritingContest'
import type { ContestSummary } from '../../types/handwritingContest'
import { can } from '../../utils/access'
import { confirmDialog } from '../../utils/confirmDialog'
import { showToast, toastFeedback } from '../../utils/toast'
import HandwritingDesk, { ContestEntriesGrid } from './components/HandwritingDesk'
import HandwritingContestComposer from './components/HandwritingContestComposer'
import { contestToWrite, filterContests } from './components/handwritingDeskUtils'

/** 상세 아래 출품작 — 관리자는 표 수가 늘 보여 '표 많은 순'이 그대로 먹는다 */
const ContestEntries = ({ contest }: { contest: ContestSummary }) => {
  const q = useContestEntries(contest.id, 'popular')
  const [busyId, setBusyId] = useState<number | null>(null)
  const hide = useHideEntry(contest.id, toastFeedback({ success: (_d, v) => ((v as { hidden: boolean }).hidden ? '작품을 숨겼어요 — 갤러리·순위에서 빠져요' : '작품을 다시 보이게 했어요'), error: '바꾸지 못했어요' }))
  const entries = q.data?.pages.flatMap((p) => p.items) ?? []
  return (
    <ContestEntriesGrid
      contest={contest}
      entries={entries}
      total={q.data?.pages[0]?.total ?? 0}
      loading={q.isPending}
      error={q.isError}
      hasMore={!!q.hasNextPage}
      loadingMore={q.isFetchingNextPage}
      onLoadMore={() => void q.fetchNextPage()}
      busyId={busyId}
      onToggleHidden={(e) => {
        setBusyId(e.id)
        hide.mutate({ entryId: e.id, hidden: !e.is_hidden }, { onSettled: () => setBusyId(null) })
      }}
    />
  )
}

const HandwritingContestManagement = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading } = useAdminContests()
  const contests = useMemo(() => data?.items ?? [], [data])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // undefined = 닫힘, null = 새 대회, ContestSummary = 고치기
  const [composer, setComposer] = useState<ContestSummary | null | undefined>(undefined)

  const publish = usePublishContest(
    toastFeedback({ success: (_d, v) => ((v as { on: boolean }).on ? '결과를 발표했어요 · 입상자와 참가자에게 알림을 보냈어요' : '발표를 취소했어요') }),
  )
  const remove = useDeleteContest(toastFeedback({ success: '대회를 지웠어요' }))
  const save = useSaveContest()

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자만 접근할 수 있습니다', 'error')
      navigate('/')
    }
  }, [navigate])

  // 보이기 스위치 — 바로 넘어가게(낙관적), 실패하면 되돌린다. PUT 은 전체 본문을 받으므로 나머지를 그대로 싣는다
  const toggleActive = (c: ContestSummary) => {
    const next = !c.is_active
    const key = contestKeys.adminList()
    const prev = qc.getQueryData<{ items: ContestSummary[] }>(key)
    qc.setQueryData<{ items: ContestSummary[] }>(key, (d) => (d ? { items: d.items.map((x) => (x.id === c.id ? { ...x, is_active: next } : x)) } : d))
    save.mutate(
      { id: c.id, payload: contestToWrite(c, { is_active: next }) },
      {
        onSuccess: () => showToast(next ? '성도에게 보이게 했어요' : '숨겼어요 — 관리자만 봐요', 'success'),
        onError: (e) => {
          qc.setQueryData(key, prev)
          showToast(e instanceof Error && e.message ? e.message : '바꾸지 못했어요', 'error')
        },
      },
    )
  }

  const confirmPublish = async (c: ContestSummary) => {
    const ok = await confirmDialog({
      title: '결과를 발표할까요?',
      message: `'${c.title}'`,
      description: '표를 많이 받은 1~3등을 확정하고, 입상자와 참가자에게 알림을 보내요. 표가 같으면 먼저 낸 작품이 앞서요.',
      confirmText: '발표하기',
      tone: 'brand',
    })
    if (ok) publish.mutate({ id: c.id, on: true })
  }

  const confirmUnpublish = async (c: ContestSummary) => {
    const ok = await confirmDialog({
      title: '발표를 취소할까요?',
      message: '입상 순위가 풀리고 집계 중 상태로 돌아가요. 이미 보낸 알림은 되돌릴 수 없어요.',
      confirmText: '발표 취소',
      tone: 'warning',
    })
    if (ok) publish.mutate({ id: c.id, on: false })
  }

  const confirmDelete = async (c: ContestSummary) => {
    const ok = await confirmDialog({
      title: '대회를 지울까요?',
      message: `'${c.title}'`,
      description: `숨긴 작품까지 출품작 전부와 모든 표, 글씨 파일이 함께 사라져요. 복구할 수 없어요. 잠시 감추려면 보이기 스위치를 끄세요.`,
      confirmText: '네, 지울게요',
      tone: 'danger',
    })
    if (ok) remove.mutate(c.id)
  }

  const filtered = useMemo(() => filterContests(contests, searchTerm), [contests, searchTerm])

  return (
    <>
      <HandwritingDesk
        contests={contests}
        filtered={filtered}
        loading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setComposer(null)}
        onBack={() => navigate(-1)}
        publishing={publish.isPending}
        renderEntries={(c) => <ContestEntries key={c.id} contest={c} />}
        onEdit={setComposer}
        onToggleActive={toggleActive}
        onPublish={(c) => void confirmPublish(c)}
        onUnpublish={(c) => void confirmUnpublish(c)}
        onDelete={(c) => void confirmDelete(c)}
        onView={(c) => navigate(`/handwriting/${c.id}`)}
      />

      {composer !== undefined && <HandwritingContestComposer target={composer} onClose={() => setComposer(undefined)} />}
    </>
  )
}

export default HandwritingContestManagement
