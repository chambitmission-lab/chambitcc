// /dev/education-admin — 교육과 훈련 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 EducationDesk 를 표본으로 띄운다. 공개 스위치·↑↓·삭제는
// 이 화면 안에서만 바뀌고(서버 호출 없음), 수정·추가는 토스트로만 알린다.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EducationDesk from '../Admin/components/EducationDesk'
import { filterEducation, type EduSeg, type EduSel } from '../Admin/components/educationDeskUtils'
import type { EducationCategory, EducationProgram } from '../../types/education'
import { showToast } from '../../utils/toast'

let pid = 0
const prog = (category_id: number, name_ko: string, f: Partial<EducationProgram> = {}): EducationProgram => ({
  id: ++pid,
  category_id,
  name_ko,
  sort_order: pid,
  is_active: true,
  ...f,
})

const SAMPLE: EducationCategory[] = [
  {
    id: 1,
    key: 'sunday-school',
    name_ko: '주일학교',
    tagline_ko: '말씀 안에서 자라는 다음 세대',
    description_ko: '영유아부부터 고등부까지, 나이에 맞는 예배와 공과로 아이들이 하나님을 알아 가요.',
    emoji: '🌱',
    verse_text_ko: '마땅히 행할 길을 아이에게 가르치라 그리하면 늙어도 그것을 떠나지 아니하리라',
    verse_ref_ko: '잠언 22:6',
    sort_order: 1,
    is_active: true,
    programs: [
      prog(1, '영유아부', { target_ko: '0~4세', meeting_time_ko: '주일 오전 11:20', leader_ko: '김OO 전도사', location_ko: '교육관 1층' }),
      prog(1, '유치부', { target_ko: '5~7세', meeting_time_ko: '주일 오전 11:20', leader_ko: '이OO 전도사', location_ko: '교육관 2층' }),
      prog(1, '유년부', { target_ko: '초1~3' }),
      prog(1, '중고등부', { target_ko: '중1~고3', meeting_time_ko: '주일 예배 후', leader_ko: '박OO 목사', location_ko: '비전홀', notice_ko: '12월 수련회 신청을 받고 있어요.' }),
    ],
  },
  {
    id: 2,
    key: 'youth',
    name_ko: '청년부',
    tagline_ko: '함께 걷는 청춘',
    emoji: '🔥',
    sort_order: 2,
    is_active: true,
    programs: [
      prog(2, '1청년부', { target_ko: '20대', meeting_time_ko: '주일 오후 2:00', leader_ko: '최OO 목사', location_ko: '본당 3층' }),
      prog(2, '2청년부', { target_ko: '30대', is_active: false }),
    ],
  },
  {
    id: 3,
    key: 'training',
    name_ko: '참빛 훈련 과정',
    tagline_ko: '제자로 세워지는 길',
    emoji: '📖',
    sort_order: 3,
    is_active: true,
    programs: [
      prog(3, '1단계) 새가족반', { meeting_time_ko: '주일 오후 1:30', leader_ko: '새가족부', location_ko: '새가족실', description_ko: '4주 과정 · 교회를 소개하고 신앙의 기초를 함께 나눠요.' }),
      prog(3, '2단계) 성경공부', { meeting_time_ko: '목요일 19:00-20:30', leader_ko: '정OO 목사', location_ko: '소예배실', description_ko: '· 오전반: 금요일 11:00-12:00\n· 저녁반: 목요일 19:00-20:30' }),
      prog(3, '큐티 나눔', { link_url: 'https://example.com', link_label_ko: '복있는 사람 바로 가기' }),
    ],
  },
  {
    id: 4,
    key: 'senior',
    name_ko: '장년 교육',
    emoji: '🏠',
    sort_order: 4,
    is_active: false,
    programs: [],
  },
]

const swap = <T,>(list: T[], i: number, j: number) => {
  if (j < 0 || j >= list.length) return list
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

const EducationAdminPreview = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<EducationCategory[]>(SAMPLE)
  const [searchTerm, setSearchTerm] = useState('')
  const [seg, setSeg] = useState<EduSeg>('all')
  const [selected, setSelected] = useState<EduSel | null>(null)
  const filtered = useMemo(() => filterEducation(categories, searchTerm, seg), [categories, searchTerm, seg])

  const mapProgram = (id: number, fn: (list: EducationProgram[], i: number) => EducationProgram[]) =>
    setCategories((cs) =>
      cs.map((c) => {
        const i = c.programs.findIndex((p) => p.id === id)
        return i < 0 ? c : { ...c, programs: fn(c.programs, i) }
      }),
    )
  const toast = (m: string) => showToast(`미리보기 — ${m}`, 'info')

  return (
    <EducationDesk
      categories={categories}
      filtered={filtered}
      loading={false}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      seg={seg}
      onSegChange={setSeg}
      selected={selected}
      onSelect={setSelected}
      onCreateCategory={() => toast('카테고리 추가')}
      onBack={() => navigate(-1)}
      onClearFilters={() => {
        setSearchTerm('')
        setSeg('all')
      }}
      onEditCategory={(c) => toast(`${c.name_ko} 수정`)}
      onEditProgram={(p) => toast(`${p.name_ko} 수정`)}
      onAddProgram={(c) => toast(`${c.name_ko}에 프로그램 추가`)}
      onToggleCategory={(c) => setCategories((cs) => cs.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)))}
      onToggleProgram={(p) => mapProgram(p.id, (l, i) => l.map((x, j) => (j === i ? { ...x, is_active: !x.is_active } : x)))}
      onMoveCategory={(c, d) => setCategories((cs) => { const i = cs.findIndex((x) => x.id === c.id); return swap(cs, i, d === 'up' ? i - 1 : i + 1) })}
      onMoveProgram={(p, d) => mapProgram(p.id, (l, i) => swap(l, i, d === 'up' ? i - 1 : i + 1))}
      onDeleteCategory={(c) => setCategories((cs) => cs.filter((x) => x.id !== c.id))}
      onDeleteProgram={(p) => mapProgram(p.id, (l, i) => l.filter((_, j) => j !== i))}
      onViewPublic={(c) => navigate(c ? `/education?cat=${c.key}` : '/education')}
    />
  )
}

export default EducationAdminPreview
