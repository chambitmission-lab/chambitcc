import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSituationCategories } from '../../../../hooks/useSituation'
import { passageLabel, usePassageVerses, useRecentSermonPassage } from '../../PhotoVerse/churchVerses'
import { parseBibleReference } from '../../../Sermon/utils/sermonMeta'
import floodImg from '../../Story/img/flood.webp'
import exodusImg from '../../Story/img/exodus.webp'
import davidImg from '../../Story/img/david.webp'
import jonahImg from '../../Story/img/jonah.webp'
import miraclesImg from '../../Story/img/miracles.webp'
import lostImg from '../../Story/img/lost.webp'
import resurrectionImg from '../../Story/img/resurrection.webp'
import paulImg from '../../Story/img/paul.webp'

// 검색 시작 화면의 탐색 블록 — 빈 검색창 앞에서 "무엇을 칠지" 고민하지 않게 길을 몇 개 열어 둔다.
//  1) 이번 주일 설교 본문  (최근 검색어)  2) 지금 내 마음은(상황별 성구 → 검색 탭의 마음 답변)  3) 이야기로 찾기(스토리 모드 삽화)

interface StoryTile {
  title: string
  label: string
  img: string
  book: number
  chapter: number
  verse?: number
}

const STORIES: StoryTile[] = [
  { title: '노아의 방주', label: '창세기 6-9장', img: floodImg, book: 1, chapter: 6, verse: 9 },
  { title: '홍해를 건너다', label: '출애굽기 14장', img: exodusImg, book: 2, chapter: 14 },
  { title: '다윗과 골리앗', label: '사무엘상 17장', img: davidImg, book: 9, chapter: 17 },
  { title: '요나와 큰 물고기', label: '요나 1-2장', img: jonahImg, book: 32, chapter: 1 },
  { title: '폭풍을 잠재우심', label: '마가복음 4장', img: miraclesImg, book: 41, chapter: 4, verse: 35 },
  { title: '잃은 아들 비유', label: '누가복음 15장', img: lostImg, book: 42, chapter: 15, verse: 11 },
  { title: '빈 무덤', label: '누가복음 24장', img: resurrectionImg, book: 42, chapter: 24 },
  { title: '다메섹 도상의 사울', label: '사도행전 9장', img: paulImg, book: 44, chapter: 9 },
]

const MOOD_LIMIT = 6

/** '2026-11-01' → { md: '11.1', day: '주일' } — 날짜 인장용 */
const stampOf = (ymd?: string): { md: string; day: string } | null => {
  if (!ymd) return null
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return null
  const dow = new Date(y, m - 1, d).getDay()
  return { md: `${m}.${d}`, day: dow === 0 ? '주일' : `${'일월화수목금토'[dow]}요일` }
}

const SearchExploreHome = ({
  onSearch,
  onOpen,
  recent,
}: {
  onSearch: (q: string) => void
  onOpen: (book: number, chapter: number, verse?: number) => void
  /** 최근 검색어 칩 묶음 — 설교 본문 바로 아래(가장 자주 누르는 자리)에 끼운다 */
  recent?: ReactNode
}) => {
  const navigate = useNavigate()
  const sermon = useRecentSermonPassage('ko')
  const sermonRef = sermon ? parseBibleReference(sermon.ref) : null
  // 본문 첫 구절을 쪽지에 옮겨 적는다 — 성경 화면과 같은 장 캐시라 펼칠 때 다시 받지 않는다
  const { verses: sermonVerses } = usePassageVerses(sermon?.ref, !!sermonRef?.bookNumber)
  const sermonExcerpt = sermonVerses.slice(0, 3).map(v => v.text.trim()).join(' ')
  const stamp = stampOf(sermon?.date)
  const { data: categories } = useSituationCategories()
  const moods = (categories ?? []).filter(c => c.is_active && c.verse_count > 0).slice(0, MOOD_LIMIT)

  return (
    <>
      {sermon && sermonRef?.bookNumber && (
        <button
          type="button"
          className="search-sermon"
          onClick={() => onOpen(sermonRef.bookNumber!, sermonRef.chapter, sermonRef.verse ?? undefined)}
        >
          <span className="search-sermon__head">
            <span className="search-sermon__badge">{sermon.badge}</span>
            {stamp && (
              <span className="search-sermon__stamp" aria-hidden="true">
                <b>{stamp.md}</b>
                <span>{stamp.day}</span>
              </span>
            )}
          </span>
          <span className={`search-sermon__quote${sermonExcerpt ? '' : ' search-sermon__quote--wait'}`}>
            {sermonExcerpt || '\u00a0'}
          </span>
          <span className="search-sermon__foot">
            <span className="search-sermon__ref">
              <b>{passageLabel(sermon.ref)}</b>
              {sermon.title && <span className="search-sermon__title">{sermon.title}</span>}
            </span>
            <span className="search-sermon__open">
              본문 펼치기
              <span className="material-icons-round" aria-hidden="true">arrow_forward</span>
            </span>
          </span>
        </button>
      )}

      {recent}

      {moods.length > 0 && (
        <section className="search-chip-group">
          <div className="search-chip-group-header">
            <span>지금 내 마음은</span>
            <button type="button" className="search-chip-clear" onClick={() => navigate('/bible/situation')}>
              상황별 말씀
            </button>
          </div>
          <div className="search-moods">
            {moods.map(c => (
              <button key={c.id} type="button" className="search-mood" onClick={() => onSearch(c.name)}>
                <span className="material-icons-round" aria-hidden="true">{c.icon}</span>
                <span className="search-mood__name">{c.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="search-chip-group">
        <div className="search-chip-group-header">
          <span>이야기로 찾기</span>
        </div>
        <div className="search-stories">
          {STORIES.map(s => (
            <button
              key={s.title}
              type="button"
              className="search-story"
              onClick={() => onOpen(s.book, s.chapter, s.verse)}
            >
              <img src={s.img} alt="" loading="lazy" decoding="async" className="search-story__img" />
              <span className="search-story__title">{s.title}</span>
              <span className="search-story__label">{s.label}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

export default SearchExploreHome
