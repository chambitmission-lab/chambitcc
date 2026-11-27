// 섬기는 사람들 관리 (admin, /admin/people)
//
// 교역자·파송선교사·장로·교회직원이 한 명단에 모인다. 화면은 PeopleDesk(목록 + 상세 2단)가
// 그리고, 여기서는 데이터·필터·액션만 쥔다. 같은 분류 안에서 손잡이를 끌거나 ↑↓ 로
// 순서를 잡는다(공개 화면의 표시 순서가 그대로 이 순서다).
// 담임·원로목사의 이름·인사말은 /admin/pastors 가 단일 출처.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { showToast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import { useAllPeople, useDeletePerson, useMovePerson, useUpdatePerson } from '../../hooks/usePeople'
import type { Person } from '../../types/people'
import { can } from '../../utils/access'
import PersonComposer, { type PersonComposerStep } from './components/PersonComposer'
import PeopleDesk, { type CategoryFilter, type PeopleFlag } from './components/PeopleDesk'
import { missingKeyLabels } from './components/peopleChecks'

const PeopleManagement = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const admin = can('admin:access')

  const { data: people = [], isPending, isError, refetch } = useAllPeople(admin)
  const updateMutation = useUpdatePerson()
  const moveMutation = useMovePerson()
  const deleteMutation = useDeletePerson()

  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [flag, setFlag] = useState<PeopleFlag>('none')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // null = 닫힘, 'new' = 등록, { person, step } = 수정
  const [composer, setComposer] = useState<'new' | { person: Person; step: PersonComposerStep } | null>(null)

  useEffect(() => {
    if (!admin) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [admin, navigate])

  useEffect(() => {
    if (isError) showToast('섬기는 사람들 목록을 불러오지 못했습니다', 'error')
  }, [isError])

  // /people 상세 시트의 '인물 정보 수정' 딥링크(?edit=<id>) — 그분을 고르고 수정 폼까지 연다.
  // 처리한 파라미터는 지워, 새로고침·뒤로가기로 폼이 다시 열리지 않게 한다.
  const editParam = searchParams.get('edit')
  useEffect(() => {
    if (!editParam || people.length === 0) return
    const target = people.find((person) => String(person.id) === editParam)
    if (target) {
      setSelectedId(target.id)
      setComposer({ person: target, step: 'basic' })
    } else {
      showToast('해당 인물을 찾을 수 없습니다', 'error')
    }
    setSearchParams({}, { replace: true })
  }, [editParam, people, setSearchParams])

  // 서버가 이미 분류 → 순서로 정렬해 준다. 여기서는 거르기만 한다
  // (정렬을 다시 하면 ↑↓ 이동 결과와 화면이 어긋난다)
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return people.filter((person) => {
      if (category !== 'all' && person.category !== category) return false
      if (flag === 'hidden' && person.is_published) return false
      if (flag === 'missing' && missingKeyLabels(person).length === 0) return false
      if (!q) return true
      return [
        person.name_ko,
        person.name_en ?? '',
        person.role_ko ?? '',
        person.group_ko ?? '',
        person.assignments_ko ?? '',
        person.field_ko ?? '',
        person.org_ko ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [people, searchTerm, category, flag])

  const handleToggleVisibility = async (person: Person) => {
    try {
      await updateMutation.mutateAsync({ id: person.id, data: { is_published: !person.is_published } })
      showToast(person.is_published ? '성도 화면에서 숨겼어요' : '성도 화면에 공개했어요', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '변경에 실패했습니다', 'error')
    }
  }

  const handleMove = async (person: Person, direction: 'up' | 'down') => {
    try {
      await moveMutation.mutateAsync({ id: person.id, direction })
    } catch (err) {
      showToast(err instanceof Error ? err.message : '순서 변경에 실패했습니다', 'error')
    }
  }

  const handleDelete = async (person: Person) => {
    if (
      !(await confirmDialog({
        title: '인물 삭제',
        message: `${person.name_ko} ${person.role_ko ?? ''}님을 명단에서 지울까요?`.replace(/\s+님/, '님'),
        description: '사진·소개·담당 사역이 함께 지워지고 되돌릴 수 없어요. 잠시 감추려면 삭제 대신 공개 스위치를 끄세요.',
        confirmText: '네, 지울게요',
      }))
    )
      return
    try {
      await deleteMutation.mutateAsync(person.id)
      showToast('삭제했어요', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  return (
    <>
      <PeopleDesk
        people={people}
        filtered={filtered}
        loading={isPending && people.length === 0}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        category={category}
        onCategoryChange={setCategory}
        flag={flag}
        onFlagChange={setFlag}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onClearFilters={() => {
          setSearchTerm('')
          setCategory('all')
          setFlag('none')
        }}
        onCreate={() => setComposer('new')}
        onBack={() => navigate(-1)}
        onEdit={(person, step = 'basic') => setComposer({ person, step })}
        onToggleVisibility={handleToggleVisibility}
        onMove={handleMove}
        onDelete={handleDelete}
        onViewPublic={(person) => navigate(`/people?tab=${person.category}`)}
        onGoPastors={() => navigate('/admin/pastors')}
      />

      {composer && (
        <PersonComposer
          // key — 다른 사람을 연속으로 수정할 때 폼 상태가 남지 않도록 재마운트
          key={composer === 'new' ? 'new' : `${composer.person.id}-${composer.step}`}
          person={composer === 'new' ? undefined : composer.person}
          initialStep={composer === 'new' ? 'basic' : composer.step}
          defaultCategory={category === 'all' ? 'pastor' : category}
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

export default PeopleManagement
