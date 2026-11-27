// 설문조사 관리 (admin, /admin/surveys)
// Single Responsibility: 설문 목록 조회와 상태 전환/삭제/수정 열기 액션.
// 화면은 SurveyDesk(관리 데스크 — 상태별 목록 + 상세·설정 + 결과를 그 자리에서, 2026-11-27),
// 결과는 SurveyResultsPanel, 작성·수정은 SurveyComposer 가 그린다.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSurvey } from '../../api/survey'
import { useAdminSurveys, useDeleteSurvey, useUpdateSurveyStatus } from '../../hooks/useSurvey'
import { confirmDialog } from '../../utils/confirmDialog'
import { showToast, toastFeedback } from '../../utils/toast'
import { can } from '../../utils/access'
import SurveyComposer from './components/SurveyComposer'
import SurveyDesk from './components/SurveyDesk'
import SurveyResultsPanel from './components/SurveyResultsPanel'
import { filterSurveys } from './components/surveyDeskUtils'
import type { SurveyDetail, SurveyStatus, SurveySummary } from '../../types/survey'

const STATUS_TOAST: Record<SurveyStatus, string> = {
  draft: '작성 중으로 돌렸어요 — 성도에게 안 보여요',
  open: '설문을 열었어요',
  closed: '설문을 마감했어요',
}

const SurveyManagement = () => {
  const navigate = useNavigate()
  const { data: surveys = [], isLoading } = useAdminSurveys()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // undefined = 닫힘, null = 새 설문, SurveyDetail = 수정
  const [composerTarget, setComposerTarget] = useState<SurveyDetail | null | undefined>(undefined)
  const [loadingEdit, setLoadingEdit] = useState<number | null>(null)

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자만 접근할 수 있습니다', 'error')
      navigate('/')
    }
  }, [navigate])

  const setStatus = useUpdateSurveyStatus(
    toastFeedback<unknown, { id: number; status: SurveyStatus }>({ success: (_d, v) => STATUS_TOAST[v.status], error: '상태를 바꾸지 못했어요' }),
  )
  const remove = useDeleteSurvey(toastFeedback({ success: '설문을 지웠어요' }))

  const openEdit = async (s: SurveySummary) => {
    try {
      setLoadingEdit(s.id)
      // 목록에는 문항이 없으므로 편집 전에 상세를 받아온다
      setComposerTarget(await getSurvey(s.id))
    } catch {
      showToast('설문을 불러오지 못했습니다', 'error')
    } finally {
      setLoadingEdit(null)
    }
  }

  const confirmDelete = async (s: SurveySummary) => {
    const ok = await confirmDialog({
      title: '설문을 지울까요?',
      message: `'${s.title}'`,
      description:
        s.response_count > 0 ? `이미 들어온 응답 ${s.response_count}건도 함께 사라져요. 되돌릴 수 없어요. 그만 받으려면 마감을 쓰세요.` : '되돌릴 수 없어요.',
      confirmText: '네, 지울게요',
      tone: 'danger',
    })
    if (ok) remove.mutate(s.id)
  }

  const filtered = useMemo(() => filterSurveys(surveys, searchTerm), [surveys, searchTerm])

  return (
    <>
      <SurveyDesk
        surveys={surveys}
        filtered={filtered}
        loading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={() => setComposerTarget(null)}
        onBack={() => navigate(-1)}
        editingId={loadingEdit}
        renderResults={(s) => <SurveyResultsPanel key={s.id} survey={s} />}
        onEdit={(s) => void openEdit(s)}
        onSetStatus={(s, status) => setStatus.mutate({ id: s.id, status })}
        onDelete={(s) => void confirmDelete(s)}
        onView={(s) => navigate(`/survey/${s.id}`)}
      />

      {composerTarget !== undefined && (
        <SurveyComposer survey={composerTarget} onClose={() => setComposerTarget(undefined)} onSaved={() => setComposerTarget(undefined)} />
      )}
    </>
  )
}

export default SurveyManagement
