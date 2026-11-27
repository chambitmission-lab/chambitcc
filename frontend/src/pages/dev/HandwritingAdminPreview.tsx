// /dev/handwriting-admin — 손글씨 필사대회 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 HandwritingDesk 를 표본으로 띄운다. 보이기·발표·삭제·작품 숨기기는 이 화면 안에서만
// 바뀌고(서버 호출 없음), 고치기·새 대회는 토스트로만 알린다. 발표 기다림·진행 중·시작 전·발표 끝·숨긴 대회 표본 포함.
// 작품 글씨 PNG 는 없어 종이만 보인다.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HandwritingDesk, { ContestEntriesGrid } from '../Admin/components/HandwritingDesk'
import { filterContests } from '../Admin/components/handwritingDeskUtils'
import type { ContestEntry, ContestPhase, ContestSummary } from '../../types/handwritingContest'
import { showToast } from '../../utils/toast'

const at = (days: number) => {
  const d = new Date(Date.now() + days * 86_400_000 + 9 * 3_600_000)
  return `${d.toISOString().slice(0, 10)}T00:00:00+09:00`
}

let seq = 0
const contest = (title: string, phase: ContestPhase, start: number, end: number, p: Partial<ContestSummary> = {}): ContestSummary => ({
  id: ++seq,
  title,
  description: null,
  starts_at: at(start),
  ends_at: at(end),
  phase,
  votes_per_user: 3,
  show_ranking: false,
  results_published_at: phase === 'announced' ? at(end + 2) : null,
  is_active: true,
  entry_count: 0,
  voter_count: 0,
  ...p,
})

const SEED: ContestSummary[] = [
  contest('제2회 참빛 손글씨 성경 필사대회', 'closed', -33, -3, { entry_count: 24, voter_count: 61, description: '한 달 동안 마음에 닿는 말씀을 손으로 써 주세요.' }),
  contest('대림절 시편 필사', 'open', -5, 20, { entry_count: 9, voter_count: 14, show_ranking: true }),
  contest('2027 신년 잠언 필사', 'upcoming', 35, 65, { is_active: false }),
  contest('제1회 참빛 손글씨 성경 필사대회', 'announced', -120, -90, { entry_count: 31, voter_count: 88 }),
]

const VERSES = ['시편 23:1', '요한복음 3:16', '빌립보서 4:13', '이사야 40:31', '잠언 3:5', '로마서 8:28', '마태복음 11:28']
const NAMES = ['김은혜', '박소망', '이믿음', '최사랑', '정평안', '한기쁨', '오온유']

const entriesFor = (c: ContestSummary): ContestEntry[] =>
  Array.from({ length: Math.min(7, c.entry_count) }, (_, i) => ({
    id: c.id * 100 + i,
    contest_id: c.id,
    author: { id: i + 1, name: NAMES[i], avatar_url: null },
    verse_ref: VERSES[i],
    verse_text: '',
    comment: null,
    image_url: null,
    width: 600,
    height: 600,
    has_ink: false,
    card_consent: true,
    vote_count: Math.max(0, 18 - i * 3),
    voted_by_me: false,
    is_mine: false,
    rank: c.phase === 'announced' && i < 3 ? i + 1 : null,
    can_make_card: false,
    is_hidden: i === 5,
    created_at: at(-10 + i),
  }))

const PreviewEntries = ({ c }: { c: ContestSummary }) => {
  const [entries, setEntries] = useState(() => entriesFor(c))
  return (
    <ContestEntriesGrid
      contest={c}
      entries={entries}
      total={c.entry_count}
      loading={false}
      hasMore={c.entry_count > entries.length}
      loadingMore={false}
      onLoadMore={() => showToast('미리보기 — 다음 작품을 불러와요', 'info')}
      busyId={null}
      onToggleHidden={(e) => setEntries((l) => l.map((x) => (x.id === e.id ? { ...x, is_hidden: !x.is_hidden } : x)))}
    />
  )
}

const HandwritingAdminPreview = () => {
  const navigate = useNavigate()
  const [contests, setContests] = useState(SEED)
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const filtered = useMemo(() => filterContests(contests, q), [contests, q])
  const patch = (id: number, p: Partial<ContestSummary>) => setContests((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)))

  return (
    <HandwritingDesk
      contests={contests}
      filtered={filtered}
      loading={false}
      searchTerm={q}
      onSearchChange={setQ}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onCreate={() => showToast('미리보기 — 새 대회 창이 열려요', 'info')}
      onBack={() => navigate(-1)}
      publishing={false}
      renderEntries={(c) => <PreviewEntries key={`${c.id}-${c.phase}`} c={c} />}
      onEdit={(c) => showToast(`미리보기 — '${c.title}' 고치기 창이 열려요`, 'info')}
      onToggleActive={(c) => patch(c.id, { is_active: !c.is_active })}
      onPublish={(c) => patch(c.id, { phase: 'announced', results_published_at: at(0) })}
      onUnpublish={(c) => patch(c.id, { phase: 'closed', results_published_at: null })}
      onDelete={(c) => setContests((l) => l.filter((x) => x.id !== c.id))}
      onView={(c) => showToast(`미리보기 — /handwriting/${c.id} 로 가요`, 'info')}
    />
  )
}

export default HandwritingAdminPreview
