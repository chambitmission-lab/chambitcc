// /dev/people-admin — 섬기는 사람들 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 PeopleDesk 를 표본으로 띄운다. 공개 스위치·↑↓ 순서는
// 이 화면 안에서만 바뀌고(서버 호출 없음), 수정·삭제는 토스트로만 알린다.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PeopleDesk, { type CategoryFilter, type PeopleFlag } from '../Admin/components/PeopleDesk'
import { missingKeyLabels } from '../Admin/components/peopleChecks'
import { SAMPLE } from '../People/peopleSample'
import type { Person } from '../../types/people'
import { showToast } from '../../utils/toast'

const PeopleAdminPreview = () => {
  const navigate = useNavigate()
  const [people, setPeople] = useState<Person[]>(SAMPLE.people)
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [flag, setFlag] = useState<PeopleFlag>('none')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = searchTerm.trim()
    return people.filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (flag !== 'hidden' || !p.is_published) &&
        (flag !== 'missing' || missingKeyLabels(p).length > 0) &&
        (!q || `${p.name_ko} ${p.role_ko ?? ''} ${p.assignments_ko ?? ''}`.includes(q)),
    )
  }, [people, searchTerm, category, flag])

  const move = (person: Person, dir: 'up' | 'down') =>
    setPeople((list) => {
      const same = list.filter((p) => p.category === person.category)
      const i = same.findIndex((p) => p.id === person.id)
      const j = dir === 'up' ? i - 1 : i + 1
      if (j < 0 || j >= same.length) return list
      const a = list.indexOf(same[i])
      const b = list.indexOf(same[j])
      const next = [...list]
      ;[next[a], next[b]] = [next[b], next[a]]
      return next
    })

  return (
    <PeopleDesk
      people={people}
      filtered={filtered}
      loading={false}
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
      onCreate={() => showToast('미리보기 — 등록 폼은 실제 화면에서', 'info')}
      onBack={() => navigate(-1)}
      onEdit={(p, step) => showToast(`미리보기 — ${p.name_ko} 수정(${step ?? 'basic'})`, 'info')}
      onToggleVisibility={(p) => setPeople((list) => list.map((x) => (x.id === p.id ? { ...x, is_published: !x.is_published } : x)))}
      onMove={move}
      onDelete={(p) => showToast(`미리보기 — ${p.name_ko} 삭제`, 'info')}
      onViewPublic={(p) => navigate(`/people?tab=${p.category}`)}
      onGoPastors={() => navigate('/admin/pastors')}
    />
  )
}

export default PeopleAdminPreview
