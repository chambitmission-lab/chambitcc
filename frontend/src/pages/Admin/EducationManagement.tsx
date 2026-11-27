// 교육과 훈련 관리 (admin, /admin/education)
// Single Responsibility: 카테고리·프로그램 트리 조회·필터와 공개/순서/삭제 액션.
// 화면은 EducationDesk(관리 데스크 — 트리 + 상세, 2026-11-27), 작성·수정은 EducationComposer.
// 레거시가 이미지로 박아 두던 시간·담당·장소를 여기서 데이터로 고친다 — 담당자가
// 바뀌어도 포토샵이 필요 없다. 순서는 ↑↓ 로 이웃과 맞바꾼다.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import {
  useAdminEducationTree,
  useDeleteCategory,
  useDeleteProgram,
  useMoveCategory,
  useMoveProgram,
  useUpdateCategory,
  useUpdateProgram,
} from '../../hooks/useEducation'
import type { EducationCategory, EducationProgram } from '../../types/education'
import EducationComposer, { type ComposerTarget } from './components/EducationComposer'
import EducationDesk from './components/EducationDesk'
import { filterEducation, type EduSeg, type EduSel } from './components/educationDeskUtils'
import { can } from '../../utils/access'

const EducationManagement = () => {
  const navigate = useNavigate()
  const admin = can('admin:access')

  const { data, isPending, isError, refetch } = useAdminEducationTree(admin)
  const categories = useMemo(() => data?.categories ?? [], [data])
  const moveCategory = useMoveCategory()
  const moveProgram = useMoveProgram()
  const updateCategory = useUpdateCategory()
  const updateProgram = useUpdateProgram()
  const deleteCategory = useDeleteCategory()
  const deleteProgram = useDeleteProgram()

  const [searchTerm, setSearchTerm] = useState('')
  const [seg, setSeg] = useState<EduSeg>('all')
  const [selected, setSelected] = useState<EduSel | null>(null)
  const [composer, setComposer] = useState<ComposerTarget | null>(null)

  useEffect(() => {
    if (!admin) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [admin, navigate])

  useEffect(() => {
    if (isError) showToast('교육과 훈련 목록을 불러오지 못했습니다', 'error')
  }, [isError])

  const filtered = useMemo(() => filterEducation(categories, searchTerm, seg), [categories, searchTerm, seg])

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn()
      if (ok) showToast(ok, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '실패했습니다', 'error')
    }
  }

  const handleDeleteCategory = async (c: EducationCategory) => {
    if (
      !(await confirmDialog({
        title: '카테고리 삭제',
        message: `"${c.name_ko}"를 지울까요?`,
        description: `아래 프로그램 ${c.programs.length}개도 함께 사라지며 되돌릴 수 없어요. 화면에서만 감추려면 공개 스위치를 끄세요.`,
        confirmText: '네, 지울게요',
        icon: 'delete_outline',
      }))
    )
      return
    await run(() => deleteCategory.mutateAsync(c.id), '삭제했어요')
  }

  const handleDeleteProgram = async (p: EducationProgram) => {
    if (
      !(await confirmDialog({
        title: '프로그램 삭제',
        message: `"${p.name_ko}"를 지울까요?`,
        description: '되돌릴 수 없어요. 화면에서만 감추려면 공개 스위치를 끄세요.',
        confirmText: '네, 지울게요',
        icon: 'delete_outline',
      }))
    )
      return
    await run(() => deleteProgram.mutateAsync(p.id), '삭제했어요')
  }

  return (
    <>
      <EducationDesk
        categories={categories}
        filtered={filtered}
        loading={isPending && categories.length === 0}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        seg={seg}
        onSegChange={setSeg}
        selected={selected}
        onSelect={setSelected}
        onCreateCategory={() => setComposer({ kind: 'category' })}
        onBack={() => navigate(-1)}
        onClearFilters={() => {
          setSearchTerm('')
          setSeg('all')
        }}
        onEditCategory={(c) => setComposer({ kind: 'category', category: c })}
        onEditProgram={(p) => setComposer({ kind: 'program', categoryId: p.category_id, program: p })}
        onAddProgram={(c) => setComposer({ kind: 'program', categoryId: c.id })}
        onToggleCategory={(c) =>
          run(
            () => updateCategory.mutateAsync({ id: c.id, data: { is_active: !c.is_active } }),
            c.is_active ? '숨겼어요' : '성도들에게 공개했어요',
          )
        }
        onToggleProgram={(p) =>
          run(
            () => updateProgram.mutateAsync({ id: p.id, data: { is_active: !p.is_active } }),
            p.is_active ? '숨겼어요' : '성도들에게 공개했어요',
          )
        }
        onMoveCategory={(c, d) => run(() => moveCategory.mutateAsync({ id: c.id, direction: d }))}
        onMoveProgram={(p, d) => run(() => moveProgram.mutateAsync({ id: p.id, direction: d }))}
        onDeleteCategory={handleDeleteCategory}
        onDeleteProgram={handleDeleteProgram}
        onViewPublic={(c) => navigate(c ? `/education?cat=${encodeURIComponent(c.key)}` : '/education')}
      />

      {composer && (
        <EducationComposer
          key={
            composer.kind === 'category'
              ? `c-${composer.category?.id ?? 'new'}`
              : `p-${composer.program?.id ?? `new-${composer.categoryId}`}`
          }
          target={composer}
          categories={categories}
          onClose={() => setComposer(null)}
          onSuccess={() => {
            setComposer(null)
            void refetch()
          }}
        />
      )}
    </>
  )
}

export default EducationManagement
