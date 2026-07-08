import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSituationCategories, useSituationVerses } from '../../hooks/useSituation'
import type { SituationCategory, SituationVerse } from '../../types/situation'
import './SituationBible.css'

// 대분류 그룹 — 씨드 카테고리 이름 기준. 어드민이 새로 추가한 카테고리는 '전체' 탭에서 노출된다.
const GROUPS: { label: string; names: string[] }[] = [
  {
    label: '마음이 힘들 때',
    names: ['우울할 때', '괴로울 때', '슬플 때', '낙심될 때', '고독할 때'],
  },
  {
    label: '불안과 위기',
    names: ['두려울 때', '걱정될 때', '위기일 때', '재난·재해시', '몸이 아플 때'],
  },
  {
    label: '관계와 영성',
    names: [
      '하나님과 멀어졌을 때',
      '하나님을 의심할 때',
      '용서가 어려울 때',
      '인도가 필요할 때',
      '평안이 필요할 때',
      '감사할 때',
    ],
  },
]

// 검색 동의어 + 카드 해시태그 (카테고리 이름 기준)
const KEYWORDS: Record<string, string[]> = {
  '두려울 때': ['불안', '공포', '무서움'],
  '걱정될 때': ['염려', '근심', '불안'],
  '하나님과 멀어졌을 때': ['회복', '돌아옴', '신앙'],
  '괴로울 때': ['고통', '아픔', '힘듦'],
  '위기일 때': ['시련', '환난', '어려움'],
  '우울할 때': ['무기력', '침체', '위로'],
  '재난·재해시': ['재난', '사고', '보호'],
  '낙심될 때': ['실망', '좌절', '용기'],
  '하나님을 의심할 때': ['의심', '믿음', '확신'],
  '고독할 때': ['외로움', '혼자', '동행'],
  '인도가 필요할 때': ['진로', '취업', '결정'],
  '평안이 필요할 때': ['평화', '안식', '쉼'],
  '몸이 아플 때': ['질병', '치유', '건강'],
  '슬플 때': ['눈물', '상실', '위로'],
  '감사할 때': ['찬양', '기쁨', '은혜'],
  '용서가 어려울 때': ['용서', '화해', '관계'],
}

// "오늘 마음이 어떠세요?" 무드 태그 — 감정을 먼저 고르면 맞는 카테고리로 필터링.
// 검색창 아래 추천 태그 형태로 텍스트만 배치해 시각 부담을 줄인다.
const MOODS: { label: string; names: string[] }[] = [
  { label: '힘들어요', names: ['우울할 때', '괴로울 때', '낙심될 때'] },
  { label: '불안해요', names: ['두려울 때', '걱정될 때', '위기일 때', '재난·재해시'] },
  { label: '슬퍼요', names: ['슬플 때', '고독할 때'] },
  { label: '아파요', names: ['몸이 아플 때'] },
  { label: '멀게 느껴져요', names: ['하나님과 멀어졌을 때', '하나님을 의심할 때', '용서가 어려울 때'] },
  { label: '쉬고 싶어요', names: ['평안이 필요할 때', '인도가 필요할 때'] },
  { label: '감사해요', names: ['감사할 때'] },
]

const matchesQuery = (cat: SituationCategory, q: string) => {
  if (cat.name.includes(q)) return true
  return (KEYWORDS[cat.name] ?? []).some((k) => k.includes(q) || q.includes(k))
}

const SituationBible = () => {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<SituationCategory | null>(null)
  const [query, setQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState('전체')
  const [mood, setMood] = useState<string | null>(null)
  const [heroNonce, setHeroNonce] = useState(0)

  const { data: categories = [], isLoading } = useSituationCategories()
  const { data: detail, isLoading: versesLoading } = useSituationVerses(
    selected?.id ?? 0,
    !!selected,
  )

  const q = query.trim()

  // ── 오늘의 추천 성구 (날짜 기반 + 새로고침 버튼) ──────────────────
  const dateSeed = useMemo(() => {
    const d = new Date()
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  }, [])

  const heroPool = useMemo(
    () => categories.filter((c) => c.verse_count > 0),
    [categories],
  )
  const heroCat = heroPool.length
    ? heroPool[(dateSeed + heroNonce) % heroPool.length]
    : null

  const { data: heroDetail } = useSituationVerses(
    heroCat?.id ?? 0,
    !!heroCat && !selected,
  )
  const heroVerse = heroDetail?.verses.length
    ? heroDetail.verses[(dateSeed + heroNonce * 13) % heroDetail.verses.length]
    : null

  // ── 검색 / 그룹 필터 ───────────────────────────────────────────────
  const visibleCategories = useMemo(() => {
    if (q) return categories.filter((c) => matchesQuery(c, q))
    if (mood) {
      const m = MOODS.find((x) => x.label === mood)
      if (m) return categories.filter((c) => m.names.includes(c.name))
    }
    if (activeGroup === '전체') return categories
    const group = GROUPS.find((g) => g.label === activeGroup)
    return group ? categories.filter((c) => group.names.includes(c.name)) : categories
  }, [categories, q, mood, activeGroup])

  const handleVerseClick = (v: SituationVerse) => {
    navigate(`/bible/${v.book_number}/${v.chapter}`)
  }

  return (
    <div className="situation-bible bg-gray-50 dark:bg-background-dark min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">

        {/* Header */}
        <div className="situation-header sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3 px-4 h-14">
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 rounded-full transition-colors"
              >
                <span className="material-icons-round text-[22px]">arrow_back</span>
              </button>
            )}
            <div>
              <h1 className="text-[17px] font-bold text-gray-900 dark:text-gray-50">
                {selected ? selected.name : '상황별 성구'}
              </h1>
              {!selected && (
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">
                  지금 내 마음에 맞는 말씀을 찾아보세요
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 카테고리 화면 */}
        {!selected && (
          <div className="pb-8">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-gray-400 dark:border-t-gray-300 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* 오늘의 위로 말씀 — 화면의 중심. 최상단에 크고 여유 있게 (검색 중에는 숨김) */}
                {!q && heroCat && (
                  <div className="px-4 pt-5">
                    {heroVerse ? (
                      <div
                        className="situation-hero"
                        onClick={() => handleVerseClick(heroVerse)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerseClick(heroVerse)}
                      >
                        <div className="situation-hero__top">
                          <span className="situation-hero__label">
                            <span className="material-icons-round text-[14px]">auto_awesome</span>
                            오늘의 위로 말씀
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setHeroNonce((n) => n + 1)
                            }}
                            className="situation-hero__shuffle"
                            aria-label="다른 말씀 보기"
                          >
                            <span className="material-icons-round text-[16px]">refresh</span>
                          </button>
                        </div>
                        <p className="situation-hero__text">{heroVerse.text}</p>
                        <div className="situation-hero__bottom">
                          <span className="situation-hero__ref">
                            {heroVerse.book_name_ko} {heroVerse.chapter}:{heroVerse.verse}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelected(heroCat)
                            }}
                            className="situation-hero__cat"
                            aria-label={`${heroCat.name} 말씀 전체 보기`}
                          >
                            {heroCat.name}
                            <span className="material-icons-round text-[13px]">chevron_right</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="situation-hero situation-hero--skeleton" />
                    )}
                  </div>
                )}

                {/* 검색창 */}
                <div className="px-4 pt-5">
                  <div className="situation-search">
                    <span className="material-icons-round situation-search__icon">search</span>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="외로움, 취업, 위로… 마음을 검색해보세요"
                      className="situation-search__input"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery('')}
                        className="situation-search__clear"
                        aria-label="검색어 지우기"
                      >
                        <span className="material-icons-round text-[16px]">close</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 오늘 마음이 어떠세요? — 검색창 아래 추천 태그 (한 줄 스크롤) */}
                {!q && (
                  <div className="situation-mood">
                    <span className="situation-mood__label">오늘 마음이 어떠세요?</span>
                    <div className="situation-mood__row">
                      {MOODS.map((m) => (
                        <button
                          key={m.label}
                          onClick={() => {
                            setMood((prev) => (prev === m.label ? null : m.label))
                            setActiveGroup('전체')
                          }}
                          className={`situation-mood-chip${
                            mood === m.label ? ' is-active' : mood ? ' is-dimmed' : ''
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 그룹 탭 (검색·무드 선택 중에는 숨김) */}
                {!q && !mood && (
                  <div className="situation-tabs">
                    {['전체', ...GROUPS.map((g) => g.label)].map((label) => (
                      <button
                        key={label}
                        onClick={() => setActiveGroup(label)}
                        className={`situation-tab${activeGroup === label ? ' is-active' : ''}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* 카테고리 리스트 */}
                <div className="px-4 pt-2">
                  {visibleCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                      <span className="material-icons-outlined text-[44px] text-gray-300 dark:text-gray-600 mb-3">
                        search_off
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {q ? `'${q}'에 맞는 상황을 찾지 못했어요` : '표시할 상황이 없습니다'}
                      </p>
                    </div>
                  ) : (
                    <div className="situation-list" key={`${q}|${mood ?? ''}|${activeGroup}`}>
                      {visibleCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelected(cat)}
                          className="situation-row"
                        >
                          <span className="situation-row__icon-wrap">
                            <span className="material-icons-round situation-row__icon">
                              {cat.icon}
                            </span>
                          </span>
                          <span className="situation-row__name">{cat.name}</span>
                          <span className="material-icons-round situation-row__chevron">
                            chevron_right
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* 구절 목록 */}
        {selected && (
          <div className="pb-8">
            {versesLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-gray-400 dark:border-t-gray-300 rounded-full animate-spin" />
              </div>
            ) : !detail || detail.verses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <span className="material-icons-outlined text-[48px] text-gray-300 dark:text-gray-600 mb-3">
                  menu_book
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  아직 등록된 구절이 없습니다
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {detail.verses.map((v, idx) => (
                  <li key={v.id}>
                    <button
                      onClick={() => handleVerseClick(v)}
                      className="w-full text-left px-5 py-5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                    >
                      {/* 참조 배지 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="situation-verse__badge">
                          {v.book_name_ko} {v.chapter}:{v.verse}
                        </span>
                        <span className="text-[11px] text-gray-300 dark:text-gray-600 tabular-nums">
                          {idx + 1}/{detail.verses.length}
                        </span>
                      </div>

                      {/* 구절 텍스트 */}
                      <p className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 break-words">
                        {v.text}
                      </p>

                      {/* 성경 바로가기 */}
                      <div className="situation-verse__more flex items-center gap-1 mt-3 text-[12px] font-medium transition-colors">
                        <span>본문 보기</span>
                        <span className="material-icons-outlined text-[14px]">chevron_right</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SituationBible
