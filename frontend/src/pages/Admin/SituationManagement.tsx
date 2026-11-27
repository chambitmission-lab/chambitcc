// 상황별 성구 관리 (admin, /admin/situations)
// Single Responsibility: 상황(카테고리)·구절·추천 방식 조회와 변경 액션.
// 화면은 SituationDesk(관리 데스크 — 목록 + 추천 규칙/시험기 + 상황 상세·구절 편집, 2026-11-27),
// 상황 만들기·고치기는 SituationCategoryComposer, 구절 편집은 SituationVerseEditor 가 그린다.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../utils/toast'
import {
  situationKeys,
  useAddSituationVerse,
  useAdminSituationCategories,
  useCreateSituationCategory,
  useDeleteSituationCategory,
  useRemoveSituationVerse,
  useSeedSituations,
  useSituationVerses,
  useUpdateSituationCategory,
  useUpdateSituationVerseMessage,
} from '../../hooks/useSituation'
import { getAdminSettings, updateAdminSettings } from '../../api/user'
import { adminKeys } from '../../hooks/queryKeys'
import type { SituationCategory, SituationCategoryCreate, SituationVerse } from '../../types/situation'
import { confirmDialog } from '../../utils/confirmDialog'
import { can } from '../../utils/access'
import SituationDesk from './components/SituationDesk'
import SituationCategoryComposer from './components/SituationCategoryComposer'
import SituationVerseEditor, { type VerseRef } from './components/SituationVerseEditor'
import type { RecommendMode, SituationSel } from './components/situationDeskUtils'

/** 상황 상세 안의 구절 — 고른 상황의 구절만 불러온다 */
const ConnectedVerses = ({ category }: { category: SituationCategory }) => {
  const qc = useQueryClient()
  const { data, isLoading } = useSituationVerses(category.id)
  const addVerse = useAddSituationVerse()
  const removeVerse = useRemoveSituationVerse()
  const updateMessage = useUpdateSituationVerseMessage()
  const verses = data?.verses ?? []

  // 목록의 구절 수(verse_count)도 같이 맞춘다 — 구절 훅은 해당 상황 구절만 되살린다
  const refreshCounts = () => void qc.invalidateQueries({ queryKey: situationKeys.adminCategories() })

  const onAdd = async (refs: VerseRef[], message: string) => {
    let added = 0
    try {
      for (const r of refs) {
        await addVerse.mutateAsync({ categoryId: category.id, data: { ...r, order: verses.length + added, message: message || undefined } })
        added++
      }
      showToast(added > 1 ? `${added}절을 넣었어요` : '구절을 넣었어요', 'success')
      return true
    } catch (e) {
      showToast(`${added > 0 ? `${added}절까지 넣고 ` : ''}${e instanceof Error ? e.message : '넣지 못했어요'}`, 'error')
      return false
    } finally {
      if (added) refreshCounts()
    }
  }

  const onSaveMessage = async (v: SituationVerse, message: string) => {
    try {
      await updateMessage.mutateAsync({ situationVerseId: v.id, message: message || null, categoryId: category.id })
      showToast('위로 한마디를 저장했어요', 'success')
      return true
    } catch (e) {
      showToast(e instanceof Error ? e.message : '저장에 실패했습니다', 'error')
      return false
    }
  }

  const onRemove = async (v: SituationVerse) => {
    if (
      !(await confirmDialog({
        title: '구절 빼기',
        message: `${v.book_name_ko} ${v.chapter}:${v.verse}을(를) "${category.name}"에서 뺄까요?`,
        confirmText: '빼기',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await removeVerse.mutateAsync({ situationVerseId: v.id, categoryId: category.id })
      refreshCounts()
      showToast('뺐어요', 'success')
    } catch {
      showToast('빼지 못했어요', 'error')
    }
  }

  return <SituationVerseEditor verses={verses} loading={isLoading} adding={addVerse.isPending} onAdd={onAdd} onSaveMessage={onSaveMessage} onRemove={(v) => void onRemove(v)} />
}

const SituationManagement = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: categories = [], isLoading } = useAdminSituationCategories()
  const createCat = useCreateSituationCategory()
  const updateCat = useUpdateSituationCategory()
  const deleteCat = useDeleteSituationCategory()
  const seed = useSeedSituations()

  const { data: settings } = useQuery({ queryKey: adminKeys.settings(), queryFn: getAdminSettings, staleTime: 0 })
  const modeMutation = useMutation({
    mutationFn: (mode: RecommendMode) => updateAdminSettings({ verse_recommendation_mode: mode }),
    onSuccess: (data) => {
      qc.setQueryData(adminKeys.settings(), data)
      showToast(data.verse_recommendation_mode === 'ai' ? 'AI 우선으로 바꿨어요' : '관리자 지정으로 바꿨어요 — AI 없이 상황 구절만 써요', 'success')
    },
    onError: (e) => showToast(e instanceof Error ? e.message : '변경 실패', 'error'),
  })

  const [selected, setSelected] = useState<SituationSel | null>(null)
  // null = 닫힘, 'new' = 만들기, 카테고리 = 고치기
  const [composer, setComposer] = useState<'new' | SituationCategory | null>(null)

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [navigate])

  const handleSave = async (payload: SituationCategoryCreate) => {
    try {
      if (composer && composer !== 'new') {
        await updateCat.mutateAsync({ id: composer.id, data: payload })
        showToast('저장했어요', 'success')
      } else {
        const created = await createCat.mutateAsync(payload)
        if (created?.id) setSelected({ kind: 'cat', id: created.id })
        showToast('상황을 만들었어요 — 이제 구절을 넣어 주세요', 'success')
      }
      setComposer(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '저장에 실패했습니다', 'error')
    }
  }

  const handleToggle = async (c: SituationCategory) => {
    // 스위치가 바로 넘어가게(낙관적) — 실패하면 되돌린다
    const key = situationKeys.adminCategories()
    const prev = qc.getQueryData<SituationCategory[]>(key)
    if (prev) qc.setQueryData<SituationCategory[]>(key, prev.map((x) => (x.id === c.id ? { ...x, is_active: !c.is_active } : x)))
    try {
      await updateCat.mutateAsync({ id: c.id, data: { is_active: !c.is_active } })
      showToast(c.is_active ? '숨겼어요' : '성도에게 다시 보여요', 'success')
    } catch (e) {
      if (prev) qc.setQueryData(key, prev)
      showToast(e instanceof Error ? e.message : '바꾸지 못했어요', 'error')
    }
  }

  const handleDelete = async (c: SituationCategory) => {
    if (
      !(await confirmDialog({
        title: '상황 삭제',
        message: `"${c.name}"을(를) 지울까요?`,
        description: `넣어 둔 구절 ${c.verse_count}개도 함께 사라져요. 잠시 감추려면 스위치를 끄세요.`,
        confirmText: '네, 지울게요',
        icon: 'delete_forever',
      }))
    )
      return
    try {
      await deleteCat.mutateAsync(c.id)
      showToast('삭제했어요', 'success')
    } catch {
      showToast('삭제에 실패했습니다', 'error')
    }
  }

  const handleSeed = async () => {
    try {
      const res = await seed.mutateAsync()
      showToast(res.message, res.seeded ? 'success' : 'error')
    } catch {
      showToast('기본 상황을 넣지 못했어요', 'error')
    }
  }

  return (
    <>
      <SituationDesk
        categories={categories}
        loading={isLoading}
        mode={settings?.verse_recommendation_mode ?? null}
        modePending={modeMutation.isPending}
        selected={selected}
        onSelect={setSelected}
        onCreate={() => setComposer('new')}
        onSeed={() => void handleSeed()}
        seeding={seed.isPending}
        onBack={() => navigate(-1)}
        renderVerses={(c) => <ConnectedVerses key={c.id} category={c} />}
        onEdit={(c) => setComposer(c)}
        onToggleActive={(c) => void handleToggle(c)}
        onDelete={(c) => void handleDelete(c)}
        onModeChange={(m) => modeMutation.mutate(m)}
        onViewPublic={() => navigate('/bible/situation')}
      />

      {composer && (
        <SituationCategoryComposer
          editing={composer === 'new' ? null : composer}
          nextOrder={categories.reduce((m, c) => Math.max(m, c.order), -1) + 1}
          pending={createCat.isPending || updateCat.isPending}
          onClose={() => setComposer(null)}
          onSave={(p) => void handleSave(p)}
        />
      )}
    </>
  )
}

export default SituationManagement
