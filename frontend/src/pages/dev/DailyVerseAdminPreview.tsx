// /dev/daily-verse-admin — 오늘의 말씀 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 DailyVerseDesk 를 표본으로 띄운다. 다시 걸기·삭제는 이 화면 안에서만
// 바뀌고(서버 호출 없음), 수정·등록은 토스트로만 알린다. ?empty=1 이면 걸린 말씀 없는 상태.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DailyVerseDesk from '../Admin/components/DailyVerseDesk'
import { archiveOf } from '../Admin/components/dailyVerseDeskUtils'
import type { DailyVerse } from '../../types/dailyVerse'
import { showToast } from '../../utils/toast'

const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString()
const v = (id: number, verse_reference: string, verse_text: string, days: number, active = false): DailyVerse => ({
  id,
  verse_reference,
  verse_text,
  is_active: active ? 1 : 0,
  created_at: ago(days),
  updated_at: ago(days),
})

const build = (empty: boolean): DailyVerse[] => [
  v(6, '에스겔 37:5, 10', '너희 마른 뼈들아, 이제 살아나리라!', 3, !empty),
  v(5, '이사야 40:31', '오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요', 40),
  v(4, '빌립보서 4:6-7', '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라', 95),
  v(3, '시편 23:1', '여호와는 나의 목자시니 내게 부족함이 없으리로다', 160),
  v(2, '여호수아 1:9', '강하고 담대하라 두려워하지 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라', 300),
  v(1, '요한복음 3:16', '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라', 420),
]

const DailyVerseAdminPreview = () => {
  const navigate = useNavigate()
  const [verses, setVerses] = useState<DailyVerse[]>(() =>
    build(new URLSearchParams(window.location.hash.split('?')[1]).get('empty') === '1'),
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const archive = useMemo(() => archiveOf(verses, searchTerm), [verses, searchTerm])

  return (
    <DailyVerseDesk
      verses={verses}
      archive={archive}
      loading={false}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onCreate={() => showToast('미리보기 — 등록 폼은 실제 화면에서', 'info')}
      onBack={() => navigate(-1)}
      onEdit={(x) => showToast(`미리보기 — ${x.verse_reference} 수정`, 'info')}
      onActivate={(x) => setVerses((l) => l.map((y) => ({ ...y, is_active: y.id === x.id ? 1 : 0 })))}
      onDelete={(x) => setVerses((l) => l.filter((y) => y.id !== x.id))}
      onViewHome={() => navigate('/')}
    />
  )
}

export default DailyVerseAdminPreview
