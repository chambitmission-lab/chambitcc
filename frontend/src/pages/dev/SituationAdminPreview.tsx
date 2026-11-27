// /dev/situations-admin — 상황별 성구 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 SituationDesk 를 표본으로 띄운다. 스위치·삭제·추천 방식·구절 넣기/빼기는
// 이 화면 안에서만 바뀐다(서버 호출 없음). 구절 넣기는 본문 없이 참조만 보인다.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SituationDesk from '../Admin/components/SituationDesk'
import SituationVerseEditor from '../Admin/components/SituationVerseEditor'
import type { RecommendMode, SituationSel } from '../Admin/components/situationDeskUtils'
import type { SituationCategory, SituationVerse } from '../../types/situation'
import { showToast } from '../../utils/toast'

const cat = (id: number, name: string, icon: string, color: string, p: Partial<SituationCategory> = {}): SituationCategory => ({
  id,
  name,
  icon,
  color,
  order: id,
  is_active: true,
  emotion_keys: [],
  keywords: [],
  is_default: false,
  verse_count: 0,
  created_at: '2026-01-01T00:00:00',
  ...p,
})

const CATS: SituationCategory[] = [
  cat(1, '두려울 때', 'shield', '#6366f1', { emotion_keys: ['anxious'], keywords: ['두려', '무서', '겁이'], verse_count: 3 }),
  cat(2, '걱정될 때', 'cloud_off', '#0ea5e9', { emotion_keys: ['anxious'], keywords: ['걱정', '염려', '불안'], verse_count: 2 }),
  cat(3, '지치고 힘들 때', 'spa', '#10b981', { emotion_keys: ['tired', 'sad'], keywords: ['괴로', '고통', '힘들'], verse_count: 2, is_default: true }),
  cat(4, '외로울 때', 'favorite_border', '#ec4899', { emotion_keys: ['lonely'], keywords: ['혼자', '외로'], verse_count: 0 }),
  cat(5, '재난을 만났을 때', 'storm', '#64748b', { keywords: ['재난', '사고'], verse_count: 1, is_active: false }),
]

const sv = (id: number, category_id: number, book_name_ko: string, chapter: number, verse: number, text: string, message?: string): SituationVerse => ({
  id,
  category_id,
  verse_id: id,
  order: id,
  book_number: 0,
  book_name_ko,
  chapter,
  verse,
  text,
  message,
})

const VERSES: SituationVerse[] = [
  sv(1, 1, '이사야', 41, 10, '두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라', '두려움 속에서도 혼자가 아니에요.'),
  sv(2, 1, '시편', 56, 3, '내가 두려워하는 날에는 주를 의지하리이다'),
  sv(3, 1, '여호수아', 1, 9, '강하고 담대하라 두려워하지 말며 놀라지 말라'),
  sv(4, 2, '빌립보서', 4, 6, '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로'),
  sv(5, 2, '베드로전서', 5, 7, '너희 염려를 다 주께 맡기라 이는 그가 너희를 돌보심이라'),
  sv(6, 3, '마태복음', 11, 28, '수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라', '오늘은 잠시 내려놓아도 괜찮아요.'),
  sv(7, 3, '이사야', 40, 31, '오직 여호와를 앙망하는 자는 새 힘을 얻으리니'),
  sv(8, 5, '시편', 46, 1, '하나님은 우리의 피난처시요 힘이시니 환난 중에 만날 큰 도움이시라'),
]

const SituationAdminPreview = () => {
  const navigate = useNavigate()
  const [cats, setCats] = useState(CATS)
  const [verses, setVerses] = useState(VERSES)
  const [mode, setMode] = useState<RecommendMode>('ai')
  const [selected, setSelected] = useState<SituationSel | null>(null)

  const recount = (next: SituationVerse[]) => {
    setVerses(next)
    setCats((l) => l.map((c) => ({ ...c, verse_count: next.filter((v) => v.category_id === c.id).length })))
  }

  return (
    <SituationDesk
      categories={cats}
      loading={false}
      mode={mode}
      modePending={false}
      selected={selected}
      onSelect={setSelected}
      onCreate={() => showToast('미리보기 — 상황 만들기는 실제 화면에서', 'info')}
      onSeed={() => {}}
      seeding={false}
      onBack={() => navigate(-1)}
      renderVerses={(c) => (
        <SituationVerseEditor
          key={c.id}
          verses={verses.filter((v) => v.category_id === c.id)}
          loading={false}
          adding={false}
          onAdd={async (refs, message) => {
            const base = Math.max(0, ...verses.map((v) => v.id)) + 1
            recount([...verses, ...refs.map((r, i) => sv(base + i, c.id, `책 ${r.book_number}`, r.chapter, r.verse, '(미리보기 — 본문은 서버에서 채워져요)', message || undefined))])
            return true
          }}
          onSaveMessage={async (v, message) => {
            setVerses((l) => l.map((x) => (x.id === v.id ? { ...x, message: message || null } : x)))
            return true
          }}
          onRemove={(v) => recount(verses.filter((x) => x.id !== v.id))}
        />
      )}
      onEdit={(c) => showToast(`미리보기 — ${c.name} 고치기`, 'info')}
      onToggleActive={(c) => setCats((l) => l.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)))}
      onDelete={(c) => setCats((l) => l.filter((x) => x.id !== c.id))}
      onModeChange={setMode}
      onViewPublic={() => navigate('/bible/situation')}
    />
  )
}

export default SituationAdminPreview
