import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { pickSituationHero, situationHeroDateSeed, useSituationCategories, useSituationVerses } from '../../hooks/useSituation'
import { useAuth } from '../../hooks/useAuth'
import type { SituationCategory, SituationVerse } from '../../types/situation'
import type { VerseCopyTarget } from './components/verseCopy'
import SituationImmersive, { type ImmersiveOrigin } from './situation/SituationImmersive'
import SituationAsk from './situation/SituationAsk'
import { MOODS, timeGreeting, type Mood } from './situation/situationMoods'
import './SituationBible.css'

const VerseShareSheet = lazy(() => import('./components/VerseShareSheet'))

// 상황별 성구 — 두 갈래로 말씀까지 한 번에 닿는다.
//   A. 마음 체크인: 감정 타일을 누르면 그 색이 화면을 채우고 한 절씩 머무는 몰입 화면
//   C. 말로 꺼내기: 고르기 어려우면 한 문장 → 공감 한 줄 + 말씀 (규칙 기반, 저장 안 함)
// 카테고리 이름을 다 아는 사람을 위해 '상황으로 찾기' 전체 목록은 아래(PC는 우측 레일)에 둔다.

interface ImmersiveState {
  category: SituationCategory
  startIndex: number
  origin: ImmersiveOrigin | null
  breathe: boolean
  sentence: string | null
  /** 감정 타일로 열었으면 같은 감정의 다른 상황을 끝 장면에 먼저 */
  mood: Mood | null
}

const originOf = (el: Element | null): ImmersiveOrigin | null => {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

const verseRef = (v: SituationVerse) => `${v.book_name_ko} ${v.chapter}:${v.verse}`

const SituationBible = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { requireAuth } = useAuth()
  const [immersive, setImmersive] = useState<ImmersiveState | null>(null)
  const [shareVerse, setShareVerse] = useState<SituationVerse | null>(null)
  const [heroNonce, setHeroNonce] = useState(0)

  const { data: categories = [], isLoading } = useSituationCategories()
  const byName = useMemo(() => new Map(categories.map((c) => [c.name, c])), [categories])

  // 감정 타일 — 해당 카테고리가 하나도 없거나 구절이 비면 타일을 숨긴다
  const moodTiles = useMemo(
    () =>
      MOODS.map((mood) => {
        const cats = mood.names
          .map((n) => byName.get(n))
          .filter((c): c is SituationCategory => !!c && c.verse_count > 0)
        const count = cats.reduce((sum, c) => sum + c.verse_count, 0)
        return { mood, cats, count }
      }).filter((t) => t.cats.length > 0),
    [byName],
  )
  const listCategories = useMemo(() => categories.filter((c) => c.verse_count > 0), [categories])

  const openCategory = useCallback(
    (category: SituationCategory, opts: Partial<Omit<ImmersiveState, 'category'>> = {}) =>
      setImmersive({
        category,
        startIndex: opts.startIndex ?? 0,
        origin: opts.origin ?? null,
        breathe: opts.breathe ?? false,
        sentence: opts.sentence ?? null,
        mood: opts.mood ?? null,
      }),
    [],
  )

  // 홈 우측 레일 태그 칩 딥링크 — ?c=<카테고리ID> 로 진입하면 해당 상황을 바로 연다.
  // 카테고리 로드 후 최초 1회만 적용 (뒤로가기·직접 탐색을 덮어쓰지 않도록)
  const deepLinkApplied = useRef(false)
  useEffect(() => {
    if (deepLinkApplied.current || categories.length === 0) return
    deepLinkApplied.current = true
    const raw = new URLSearchParams(location.search).get('c')
    const id = raw ? Number(raw) : NaN
    if (!Number.isFinite(id)) return
    const cat = categories.find((c) => c.id === id)
    if (cat) openCategory(cat)
  }, [categories, location.search, openCategory])

  // ── 오늘의 위로 말씀 (날짜 기반 + 새로고침 버튼) ──────────────────
  // 카테고리 선택 로직은 훅 파일과 공유 — 라우트 진입 선요청(prefetchSituation)이 같은
  // 카테고리의 구절을 미리 받아 두므로 첫 화면에서 곧바로 그려진다
  const dateSeed = useMemo(situationHeroDateSeed, [])
  const heroCat = useMemo(
    () => pickSituationHero(categories, heroNonce, dateSeed),
    [categories, heroNonce, dateSeed],
  )
  const { data: heroDetail } = useSituationVerses(heroCat?.id ?? 0, !!heroCat)
  const heroIndex = heroDetail?.verses.length ? (dateSeed + heroNonce * 13) % heroDetail.verses.length : 0
  const heroVerse = heroDetail?.verses[heroIndex] ?? null

  // ── 몰입 화면·대답 카드 공통 동작 ────────────────────────────────
  const goRead = (v: SituationVerse) => {
    // 상황별 성구는 "그 한 절"을 보여준 카드라, 장 첫머리가 아니라 그 절로 데려간다.
    // BibleStudy가 ?verse=N 을 받아 스크롤+하이라이트한다.
    navigate(`/bible/${v.book_number}/${v.chapter}${v.verse > 0 ? `?verse=${v.verse}` : ''}`)
  }

  const goPray = (v: SituationVerse, sentence?: string | null) => {
    const said = sentence?.trim()
    const draft = `${said ? `${said}\n\n` : ''}“${v.text}” (${verseRef(v)})\n\n`
    requireAuth(() => navigate('/', { state: { openComposer: true, composerPrefill: draft } }))
  }

  const shareTarget: VerseCopyTarget | null = shareVerse
    ? {
        bookNameKo: shareVerse.book_name_ko,
        bookNumber: shareVerse.book_number,
        chapter: shareVerse.chapter,
        verses: [{ verse: shareVerse.verse, text: shareVerse.text }],
      }
    : null

  const related = useMemo(() => {
    if (!immersive) return []
    const cur = immersive.category.id
    const siblings = (immersive.mood?.names ?? [])
      .map((n) => byName.get(n))
      .filter((c): c is SituationCategory => !!c && c.id !== cur && c.verse_count > 0)
    const rest = listCategories.filter((c) => c.id !== cur && !siblings.includes(c))
    // 같은 감정의 다른 상황 먼저, 나머지는 날마다 조금씩 다르게
    const offset = rest.length ? dateSeed % rest.length : 0
    return [...siblings, ...rest.slice(offset), ...rest.slice(0, offset)].slice(0, 4)
  }, [immersive, byName, listCategories, dateSeed])

  // 오늘의 위로 말씀 — 본문(모바일)과 우측 레일(lg+)이 같은 마크업을 공유한다
  const renderComfort = (cls: string) =>
    heroCat && (
      <div className={cls}>
        {heroVerse ? (
          <div
            className="sb-comfort"
            role="button"
            tabIndex={0}
            onClick={(e) =>
              openCategory(heroCat, { startIndex: heroIndex, origin: originOf(e.currentTarget) })
            }
            onKeyDown={(e) => e.key === 'Enter' && openCategory(heroCat, { startIndex: heroIndex })}
          >
            <div className="sb-comfort__top">
              <span className="sb-comfort__label">
                <span className="material-icons-round">wb_twilight</span>
                오늘의 위로 말씀
              </span>
              <button
                type="button"
                className="sb-comfort__shuffle"
                aria-label="다른 말씀 보기"
                onClick={(e) => {
                  e.stopPropagation()
                  setHeroNonce((n) => n + 1)
                }}
              >
                <span className="material-icons-round">refresh</span>
              </button>
            </div>
            <p className="sb-comfort__text">{heroVerse.text}</p>
            <div className="sb-comfort__foot">
              <span>{verseRef(heroVerse)}</span>
              <span className="sb-comfort__cat">{heroCat.name}</span>
            </div>
          </div>
        ) : (
          <div className="sb-comfort sb-comfort--skeleton" />
        )}
      </div>
    )

  const renderAllSituations = (variant: 'chips' | 'list') => (
    <section className={`sb-all sb-all--${variant}`} aria-label="상황으로 찾기">
      <h2 className="sb-section-title">상황으로 찾기</h2>
      <div className="sb-all__items">
        {listCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className="sb-all__item"
            onClick={(e) => openCategory(cat, { origin: originOf(e.currentTarget) })}
          >
            <span className="material-icons-round" aria-hidden="true">
              {cat.icon}
            </span>
            <span className="sb-all__name">{cat.name}</span>
            {variant === 'list' && <span className="sb-all__count">{cat.verse_count}</span>}
          </button>
        ))}
      </div>
    </section>
  )

  return (
    <div className="situation-bible bg-[var(--app-canvas)] dark:bg-background-dark min-h-screen page-stage">
      {/* lg+: 좁은 셸을 풀고 본문 + 우측 레일 2단 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:min-h-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-clip">
          <div className="sb-page">
            {/* 인사 + 질문 하나 — 화면의 첫 문장 */}
            <header className="sb-hello">
              <p className="sb-hello__time">{timeGreeting()}</p>
              <h1>
                지금 마음이
                <br />
                <em>어떤가요?</em>
              </h1>
            </header>

            {isLoading ? (
              <div className="sb-moods" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i} className="sb-mood sb-mood--skeleton" style={{ animationDelay: `${i * 40}ms` }} />
                ))}
              </div>
            ) : (
              <>
                <div className="sb-moods">
                  {moodTiles.map(({ mood, cats, count }) => (
                    <button
                      key={mood.label}
                      type="button"
                      className={`sb-mood sb-tone--${mood.tone}`}
                      onClick={(e) =>
                        openCategory(cats[0], { origin: originOf(e.currentTarget), breathe: true, mood })
                      }
                    >
                      <span className="sb-mood__orb" aria-hidden="true" />
                      <span className="sb-mood__label">{mood.label}</span>
                      <span className="sb-mood__count">말씀 {count}</span>
                    </button>
                  ))}
                </div>

                <SituationAsk
                  categories={categories}
                  onMore={(cat, sentence, from) => openCategory(cat, { startIndex: from, sentence })}
                  onPray={goPray}
                  onShare={setShareVerse}
                  onRead={goRead}
                />

                {renderComfort('sb-block lg:hidden')}
                <div className="lg:hidden">{renderAllSituations('chips')}</div>
              </>
            )}
          </div>
        </div>

        {/* 우측 위젯 레일 (lg+) — 오늘의 위로 말씀 + 상황 전체 목록 */}
        <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
          {renderComfort('')}
          {listCategories.length > 0 && <div className="sb-rail-card">{renderAllSituations('list')}</div>}
        </aside>
      </div>

      {immersive && (
        <SituationImmersive
          key={immersive.category.id}
          category={immersive.category}
          startIndex={immersive.startIndex}
          origin={immersive.origin}
          breathe={immersive.breathe}
          sentence={immersive.sentence}
          related={related}
          paused={!!shareVerse}
          onClose={() => setImmersive(null)}
          onSwitch={(cat) =>
            setImmersive((prev) => prev && { ...prev, category: cat, startIndex: 0, sentence: null, breathe: false, origin: null })
          }
          onPray={(v) => goPray(v, immersive.sentence)}
          onShare={setShareVerse}
          onRead={goRead}
        />
      )}

      {shareTarget && (
        <Suspense fallback={null}>
          <VerseShareSheet target={shareTarget} onClose={() => setShareVerse(null)} />
        </Suspense>
      )}
    </div>
  )
}

export default SituationBible
