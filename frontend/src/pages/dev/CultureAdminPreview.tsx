// /dev/culture-admin — 문화교실 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 CultureDesk 를 표본으로 띄운다. 모집·숨김·신청 상태·공지 공개는 이 화면 안에서만
// 바뀌고(서버 호출 없음), 만들기·수정은 토스트로만 알린다. 정원 찬 강좌·숨긴 강좌·정원 없는 강좌·취소 신청 포함.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CultureDesk from '../Admin/components/CultureDesk'
import type { CultureApplication, CultureClassAdmin, CultureNotice } from '../../types/culture'
import { showToast } from '../../utils/toast'

const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString()

const cls = (id: number, title: string, p: Partial<CultureClassAdmin> = {}): CultureClassAdmin => ({
  id,
  title,
  description: null,
  instructor: null,
  schedule: null,
  fee: null,
  capacity: null,
  location: null,
  quarter: '2027 1분기',
  detail: null,
  is_open: true,
  is_active: true,
  display_order: id,
  created_at: ago(30),
  updated_at: ago(3),
  application_count: 0,
  ...p,
})

const CLASSES: CultureClassAdmin[] = [
  cls(1, '수채화 교실', { instructor: '김미술', schedule: '매주 화 10:00', fee: '월 3만원', capacity: 12, location: '교육관 201호', description: '처음 붓을 잡는 분도 함께해요.', detail: { target: '성인 누구나', duration: '12주', curriculum: [{ title: '색 섞기', note: '' }], sections: [] } }),
  cls(2, '바리스타 기초', { instructor: '이커피', schedule: '매주 목 19:30', fee: '재료비 2만원', capacity: 6 }),
  cls(3, '기타 찬양반', { instructor: '박찬양', schedule: '매주 토 14:00' }),
  cls(4, '실버 스마트폰 교실', { schedule: '매주 수 11:00', capacity: 20, is_open: false }),
  cls(5, '어린이 영어 동화', { capacity: 10, is_active: false, is_open: false }),
]

const NAMES = ['김은혜', '박소망', '이믿음', '최사랑', '정평화', '한기쁨', '오온유', '윤충성', '장자비', '신양선']
let seq = 0
const app = (class_id: number, status: CultureApplication['status'], days: number): CultureApplication => {
  const n = NAMES[seq % NAMES.length]
  return {
    id: ++seq,
    class_id,
    name: n,
    phone: `0101234${String(1000 + seq).slice(-4)}`,
    birth_date: `19${60 + seq}-0${(seq % 9) + 1}-1${seq % 9}`,
    gender: seq % 2 ? '여' : '남',
    memo: seq % 4 === 0 ? '첫 주는 늦을 수 있어요' : null,
    status,
    created_at: ago(days),
    class_title: CLASSES.find((c) => c.id === class_id)?.title ?? null,
  }
}

const APPS: CultureApplication[] = [
  ...Array.from({ length: 9 }, (_, i) => app(1, i < 3 ? 'pending' : 'confirmed', i)),
  app(1, 'cancelled', 12),
  ...Array.from({ length: 6 }, (_, i) => app(2, i === 0 ? 'pending' : 'confirmed', i + 1)),
  app(3, 'pending', 0),
  app(3, 'confirmed', 4),
  ...Array.from({ length: 14 }, (_, i) => app(4, 'confirmed', 20 + i)),
]

/** 신청 수는 서버처럼 취소 제외로 맞춘다 */
const withCounts = (list: CultureClassAdmin[], apps: CultureApplication[]) =>
  list.map((c) => ({ ...c, application_count: apps.filter((a) => a.class_id === c.id && a.status !== 'cancelled').length }))

const NOTICES: CultureNotice[] = [
  { id: 1, title: '2027 1분기 수강 신청 안내', content: '1월 2일부터 선착순으로 받아요.\n정원이 차면 신청 버튼이 잠겨요.', is_active: true, created_at: ago(2), updated_at: ago(1) },
  { id: 2, title: '설 연휴 휴강', content: '설 연휴 주간은 모든 강좌가 쉬어요.', is_active: true, created_at: ago(20), updated_at: ago(20) },
  { id: 3, title: '(초안) 여름 특강', content: '아직 다듬는 중이에요.', is_active: false, created_at: ago(1), updated_at: ago(1) },
]

const CultureAdminPreview = () => {
  const navigate = useNavigate()
  const [apps, setApps] = useState(APPS)
  const [classes, setClasses] = useState(() => withCounts(CLASSES, APPS))
  const [notices, setNotices] = useState(NOTICES)
  const say = (m: string) => () => showToast(`미리보기 — ${m}`, 'info')

  return (
    <CultureDesk
      classes={classes}
      applications={apps}
      notices={notices}
      loading={false}
      onBack={() => navigate(-1)}
      onCreateClass={say('새 강좌 창이 열려요')}
      onEditClass={(c) => showToast(`미리보기 — '${c.title}' 수정 창이 열려요`, 'info')}
      onDeleteClass={(c) => setClasses((l) => l.filter((x) => x.id !== c.id))}
      onToggleOpen={(c) => setClasses((l) => l.map((x) => (x.id === c.id ? { ...x, is_open: !x.is_open } : x)))}
      onToggleActive={(c) => setClasses((l) => l.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)))}
      onSetAppStatus={(a, status) => {
        const next = apps.map((x) => (x.id === a.id ? { ...x, status } : x))
        setApps(next)
        setClasses((l) => withCounts(l, next))
      }}
      onCreateNotice={say('새 공지 창이 열려요')}
      onEditNotice={(n) => showToast(`미리보기 — '${n.title}' 수정 창이 열려요`, 'info')}
      onDeleteNotice={(n) => setNotices((l) => l.filter((x) => x.id !== n.id))}
      onToggleNotice={(n) => setNotices((l) => l.map((x) => (x.id === n.id ? { ...x, is_active: !x.is_active } : x)))}
      onViewPublic={say('/culture 로 가요')}
    />
  )
}

export default CultureAdminPreview
