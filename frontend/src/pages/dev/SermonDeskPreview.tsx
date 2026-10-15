/**
 * /dev/sermon-desk — 설교 본문 작업대 · 원고 쓰기 · 강단 보기를 표본 데이터로 (로그인·백엔드 없이)
 *
 * ?v=study(기본) | manuscript | pulpit
 * 실제 화면 컴포넌트를 그대로 쓴다. 관주 잇기·지우기·원고 시작 버튼은 진짜 API 라 여기선 누르지 말 것.
 */
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { OutlineSection, SermonNote, SermonOutline, SermonStudy } from '../../api/pastor'
import PastorShell from '../Pastor/components/PastorShell'
import { SermonTabs } from '../Pastor/components/sermonNotes'
import ManuscriptEditor from '../Pastor/components/ManuscriptEditor'
import { StudyBody } from '../Pastor/PastorSermonStudy'
import { Stage } from '../Pastor/PastorPulpit'

const JOHN_15 = [
  '나는 참포도나무요 내 아버지는 농부라',
  '무릇 내게 붙어 있어 열매를 맺지 아니하는 가지는 아버지께서 그것을 제거해 버리시고 무릇 열매를 맺는 가지는 더 열매를 맺게 하려 하여 그것을 깨끗하게 하시느니라',
  '너희는 내가 일러준 말로 이미 깨끗하여졌으니',
  '내 안에 거하라 나도 너희 안에 거하리라 가지가 포도나무에 붙어 있지 아니하면 스스로 열매를 맺을 수 없음 같이 너희도 내 안에 있지 아니하면 그러하리라',
  '나는 포도나무요 너희는 가지라 그가 내 안에, 내가 그 안에 거하면 사람이 열매를 많이 맺나니 나를 떠나서는 너희가 아무것도 할 수 없음이라',
  '사람이 내 안에 거하지 아니하면 가지처럼 밖에 버려져 마르나니 사람들이 그것을 모아 불에 던져 사르느니라',
  '너희가 내 안에 거하고 내 말이 너희 안에 거하면 무엇이든지 원하는 대로 구하라 그리하면 이루리라',
  '너희가 열매를 많이 맺으면 내 아버지께서 영광을 받으실 것이요 너희는 내 제자가 되리라',
]

const note = (id: number, kind: SermonNote['kind'], body: string, used_on: string | null = null): SermonNote => ({
  id,
  kind,
  body,
  passage: '요 15:1-8',
  source: null,
  tags: [],
  pinned: false,
  from_visit: false,
  used_on,
  used_sermon: used_on ? { id: 1, title: '열매 맺는 삶', date: used_on } : null,
  created_at: null,
  updated_at: null,
  refs: [],
  topics: [],
  reasons: ['같은 본문'],
})

const NOTES = [
  note(1, 'illustration', '외할머니 포도밭의 가지치기 — 봄마다 잘라 낸 가지가 아까워 울던 기억, "더 맺게 하려고 자르는 거다"', '2025-03-16'),
  note(2, 'question', '2절의 "제거"는 구원 상실인가? 웨민 17장 성도의 견인과 함께 정리. 가짜 가지 vs 참 가지.'),
  note(3, 'life', '청년부 — "붙어 있을 시간이 없다". 야근 많은 직장 청년들의 출퇴근 말씀 듣기 이야기(익명).'),
]

const STUDY: SermonStudy = {
  query: '요 15:1-8',
  found: true,
  label: '요한복음 15:1-8',
  book_number: 43,
  book_name: '요한복음',
  clipped: false,
  verses: JOHN_15.map((text, i) => ({
    id: 1000 + i,
    chapter: 15,
    verse: i + 1,
    text,
    underline_users: i === 4 ? 23 : i === 6 ? 8 : 0,
    favorite_users: i === 4 ? 11 : 0,
    cross_ref_count: i === 0 ? 2 : i === 4 ? 1 : 0,
  })),
  keywords: [
    { word: '열매', count: 6 },
    { word: '거하', count: 6 },
    { word: '가지', count: 5 },
    { word: '포도나무', count: 3 },
    { word: '아버지', count: 3 },
  ],
  book_intro: {
    one_liner: '믿고 생명을 얻게 하려는 복음',
    theme: '예수는 그리스도, 하나님의 아들',
    author_period: '사도 요한 · 1세기 말',
    key_chapters: '1, 3, 11, 13–17, 20장',
    overview: '일곱 표적과 일곱 "나는 …이다"로 예수께서 누구신지를 드러낸다. 13–17장 다락방 강화는 십자가 전날 밤 제자들에게 주신 마지막 가르침이다.',
    christ_connection:
      '구약에서 이스라엘은 하나님이 심으신 포도나무였으나 들포도를 맺었다(사 5장, 시 80편). 예수께서 "참포도나무"로 오셔서 참 이스라엘이 되시고, 그분께 붙은 가지인 교회가 성령의 열매를 맺는다.',
  },
  commentaries: [
    { id: 1, chapter: 15, verse_start: 1, verse_end: 1, scope: 'verse', title: '"참"포도나무', category: '신학적', excerpt: '"참"(알레디노스)은 그림자에 대한 실체를 뜻한다. 옛 이스라엘이 보여 주던 것의 참 실체가 그리스도이시다.' },
    { id: 2, chapter: 15, verse_start: 4, verse_end: 5, scope: 'summary', title: '거함과 열매', category: '적용', excerpt: '열매는 노력의 결과가 아니라 연합의 결과다. "거하라"는 명령은 이미 깨끗하게 된 자(3절)에게 주어진다.' },
  ],
  cross_refs: [
    { id: 1, chapter: 15, verse: 1, label: '이사야 5:1-7', target: { book_number: 23, chapter: 5, verse: 1, verse_end: 7 }, text: '내가 사랑하는 자를 위하여 노래하되 내가 사랑하는 자의 포도원을 노래하리라 …', note: '포도원의 노래 — 열매 없는 이스라엘', author: '김목사', mine: true },
    { id: 2, chapter: 15, verse: 1, label: '시편 80:8', target: { book_number: 19, chapter: 80, verse: 8, verse_end: null }, text: '주께서 한 포도나무를 애굽에서 가져다가 민족들을 쫓아내시고 그것을 심으셨나이다', note: null, author: '이전도사', mine: false },
    { id: 3, chapter: 15, verse: 5, label: '갈라디아서 5:22-23', target: { book_number: 48, chapter: 5, verse: 22, verse_end: 23 }, text: '오직 성령의 열매는 사랑과 희락과 화평과 오래 참음과 자비와 양선과 충성과 …', note: '열매의 내용', author: '김목사', mine: true },
  ],
  notes: NOTES,
  topics: ['낙심될 때'],
  past_sermons: [{ id: 9, title: '서로 사랑하라', date: '2019-05-12', bible_verse: '요 15:9-17', pastor: '김목사' }],
  outlines: [{ id: 7, title: '참포도나무와 가지', passage: '요 15:1-8', preach_on: '2026-10-19', status: 'draft', updated_at: null }],
}

const SECTIONS: OutlineSection[] = [
  {
    id: 'intro',
    label: '서론',
    text: '가지치기 예화로 시작',
    manuscript:
      '봄이 되면 포도밭 농부는 가위를 듭니다. 멀쩡해 보이는 가지를 잘라 냅니다. 왜일까요?\n\n저희 외할머니 포도밭에서 저는 그 가위질이 너무 아까웠습니다. 그런데 할머니는 늘 "더 맺게 하려고 자르는 거다" 하셨습니다.',
    note_ids: [1],
  },
  {
    id: 'body',
    label: '1. 참포도나무이신 그리스도',
    text: '1절 — 이스라엘과 대조',
    manuscript:
      '“나는 참포도나무요 내 아버지는 농부라” (요한복음 15:1)\n\n이스라엘은 하나님이 심으신 포도나무였지만 들포도를 맺었습니다. 이제 예수님이 말씀하십니다. "내가 참포도나무다." 그리스도께서 참 이스라엘이 되셔서, 우리가 하지 못한 순종을 이루셨습니다.',
    note_ids: [],
  },
  {
    id: 'apply',
    label: '2. 거하라 — 열매의 비밀',
    text: '4-8절',
    manuscript:
      '예수님은 "열매를 맺으라"고 명령하지 않으십니다. "내 안에 거하라"고 하십니다. 열매는 가지가 애써서 짜내는 것이 아니라, 붙어 있는 가지에 자연스럽게 맺히는 것이기 때문입니다.\n\n“나는 포도나무요 너희는 가지라 그가 내 안에, 내가 그 안에 거하면 사람이 열매를 많이 맺나니 나를 떠나서는 너희가 아무것도 할 수 없음이라” (요한복음 15:5)\n\n이 말씀은 우리를 낙심시키려는 말이 아닙니다. 오히려 짐을 내려놓게 하는 복음입니다. 열매의 책임이 내게 있지 않고, 포도나무 되신 그리스도께 있다는 복된 소식입니다.',
    note_ids: [3],
  },
  { id: 'close', label: '결론', text: '출근길 10분', manuscript: '', note_ids: [] },
]

const SermonDeskPreview = () => {
  const [params, setParams] = useSearchParams()
  const v = params.get('v') ?? 'study'
  const [sections, setSections] = useState(SECTIONS)
  const notes = Object.fromEntries(NOTES.map(n => [n.id, n]))
  const draft = { title: '참포도나무와 가지', passage: '요 15:1-8', preach_on: '2026-10-19', sections }
  const outline: SermonOutline = {
    id: 7,
    title: draft.title,
    passage: draft.passage,
    preach_on: draft.preach_on,
    status: 'draft',
    sermon_id: null,
    note_count: 2,
    updated_at: null,
    sections,
    notes: NOTES,
  }

  if (v === 'pulpit') {
    return (
      <div className="fixed inset-0 z-[130]">
        <Stage outline={outline} />
      </div>
    )
  }
  return (
    <PastorShell>
      <SermonTabs />
      <div className="px-4 pt-3 flex gap-2 text-[13px] font-bold">
        {['study', 'manuscript', 'pulpit'].map(x => (
          <button key={x} type="button" onClick={() => setParams({ v: x })} className={`px-3 py-1.5 rounded-full ${v === x ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-white/10'}`}>
            {x}
          </button>
        ))}
      </div>
      {v === 'manuscript' ? (
        <ManuscriptEditor
          outlineId={7}
          draft={draft}
          status="draft"
          notes={notes}
          onChange={(sid, manuscript) => setSections(list => list.map(s => (s.id === sid ? { ...s, manuscript } : s)))}
        />
      ) : (
        <StudyBody data={STUDY} />
      )}
    </PastorShell>
  )
}

export default SermonDeskPreview
