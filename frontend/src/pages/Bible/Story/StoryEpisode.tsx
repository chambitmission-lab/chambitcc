import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBibleChapter } from '../../../api/bible'
import type { BibleVerse } from '../../../types/bible'
import type { StoryVerseRef } from './storyTypes'
import { ALL_EPISODES, STORY_ACTS, TOTAL_EPISODES, findEpisode } from './data'
import { GLOSSARY, parseGlossaryText } from './glossary'
import { useStoryProgress } from './storyProgress'
import { StoryGlyph } from './StoryIcons'
import './Story.css'
import { bibleKeys } from '../../../hooks/queryKeys'
import { placeForEpisode } from '../Atlas/storyPlaces'

// 이 화의 무대를 지도 한 조각으로 보여 주는 카드. 지도 데이터(해안선·장소 사전)가
// 스토리 청크에 딸려 오지 않도록 lazy 로 둔다.
const AtlasPlaceCard = lazy(() => import('../Atlas/components/AtlasPlaceCard'))

// 에피소드 일러스트 — img/{에피소드 id}.webp 파일을 넣기만 하면 자동으로 연결된다.
// 아직 없는 화는 기존 이모지 히어로를 유지한다. eager여도 청크에는 URL 맵만 실리고
// 이미지 바이너리는 해당 화를 열 때 로드된다.
const STORY_IMAGES = import.meta.glob('./img/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>
const storyImage = (id: string) => STORY_IMAGES[`./img/${id}.webp`]

// 원문 맛보기 — 절 본문은 기존 성경 API에서 런타임에 가져온다 (번역본 일치, 데이터 중복 없음)
interface FetchedRef {
  ref: StoryVerseRef
  verses: BibleVerse[]
}

// 절마다 /bible/verse 를 따로 부르지 않고 참조당 장 1회만 받아 필요한 절을 골라낸다.
// 한 화에 같은 장을 두 번 참조하면 그 장은 한 번만 요청한다.
const fetchEpisodeVerses = async (refs: StoryVerseRef[]): Promise<FetchedRef[]> => {
  const chapterKey = (book: number, chapter: number) => `${book}:${chapter}`
  const chapterFetches = new Map<string, ReturnType<typeof getBibleChapter>>()
  for (const ref of refs) {
    const key = chapterKey(ref.book, ref.chapter)
    if (!chapterFetches.has(key)) chapterFetches.set(key, getBibleChapter(ref.book, ref.chapter))
  }

  return Promise.all(
    refs.map(async ref => {
      const chapter = await chapterFetches.get(chapterKey(ref.book, ref.chapter))!
      const byVerse = new Map(chapter.verses.map(v => [v.verse, v]))
      // 병합 구간(신 6:18-19)은 자리표시자 절의 본문이 비어 있다 — 묶음 첫 절로
      // 옮겨 잡고 중복은 걸러낸다(18·19를 함께 인용해도 한 번만 나오게)
      const picked = ref.verses.map(n => {
        const v = byVerse.get(n)
        return v?.merged_into ? byVerse.get(v.merged_into) : v
      })
      const seen = new Set<number>()
      const verses = picked.filter((v): v is BibleVerse => {
        if (!v || seen.has(v.id)) return false
        seen.add(v.id)
        return true
      })
      return { ref, verses }
    })
  )
}

const useEpisodeVerses = (episodeId: string, refs: StoryVerseRef[]) =>
  useQuery<FetchedRef[]>({
    queryKey: bibleKeys.storyVerses(episodeId),
    queryFn: () => fetchEpisodeVerses(refs),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 1,
  })

// 읽는 시간 — 지도 히어로가 "한 편에 3분"이라 약속하므로 화마다 실제 분량으로 보여 준다.
// 본문 400~680자에 원문 맛보기·용어 풋노트까지 천천히 읽는 시간을 분당 200자로 잡는다(2~3분).
const readingMinutes = (paragraphs: string[], why: string) => {
  const chars = [...paragraphs, why].join('').replace(/\s|\{\{[^}]*\}\}/g, '').length
  return Math.max(1, Math.round(chars / 200))
}

// 원문 맛보기 한 참조의 절들을 평문으로 — 창 1:1, 31 처럼 떨어진 절은 "…"으로 끊어
// 한 문장처럼 읽히지 않게 한다(말씀 카드로 넘길 때 사용)
const joinVerseText = (verses: BibleVerse[]) =>
  verses
    .map((v, i) => {
      const gap = i > 0 && v.verse > verses[i - 1].verse + 1
      return `${gap ? '… ' : ''}${v.text}`
    })
    .join(' ')

// {{용어}} 풋노트가 섞인 문단 렌더
const GlossaryText = ({ text, onTerm }: { text: string; onTerm: (term: string) => void }) => (
  <>
    {parseGlossaryText(text).map((seg, i) =>
      seg.term ? (
        <button key={i} type="button" className="story-term" onClick={() => onTerm(seg.term!)}>
          {seg.text}
        </button>
      ) : (
        <span key={i}>{seg.text}</span>
      )
    )}
  </>
)

/**
 * 처음 만나는 성경 — 에피소드 읽기 화면.
 * 이야기 → 왜 중요할까 → 원문 맛보기(실제 성경 절 + 본문 딥링크) → 다음 화 예고.
 * 하단 "다음 이야기" CTA가 현재 화를 읽음 처리하고 다음 화로 넘어간다.
 */
const StoryEpisode = () => {
  const navigate = useNavigate()
  const { episodeId = '' } = useParams<{ episodeId: string }>()
  const { readIds, markRead } = useStoryProgress()
  // 열린 용어 풋노트 — 화 id에 묶어 두면 다른 화로 이동할 때 자연히 닫힌다 (이펙트 리셋 불필요)
  const [openTermFor, setOpenTermFor] = useState<{ id: string; term: string } | null>(null)
  const openTerm = openTermFor?.id === episodeId ? openTermFor.term : null
  const setOpenTerm = (term: string | null) =>
    setOpenTermFor(term ? { id: episodeId, term } : null)

  const found = findEpisode(episodeId)

  // 잘못된 id로 진입하면 지도(목차)로
  useEffect(() => {
    if (!found) navigate('/bible/story', { replace: true })
  }, [found, navigate])

  // 화가 바뀌면 맨 위부터 (여러 스크롤 컨테이너 모두 처리)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [episodeId])

  // 다음(과 이전) 화 일러스트를 미리 받아 둔다 — 화를 넘길 때 히어로가 한 박자 늦게
  // 나타나던 원인. 그림 한 장이 20~70KB라 앞뒤 한 장씩이면 충분히 가볍다.
  useEffect(() => {
    const idx = found?.index
    if (idx === undefined) return
    const timer = window.setTimeout(() => {
      for (const step of [1, -1]) {
        const neighbor = ALL_EPISODES[idx + step]
        const url = neighbor && storyImage(neighbor.id)
        if (url) new Image().src = url
      }
    }, 200)
    return () => window.clearTimeout(timer)
  }, [found?.index])

  // PC 키보드 넘기기 — ← 이전 화, → 다음 화(다음 이야기 버튼과 같이 읽음 처리), Esc 용어 닫기.
  // 입력 중이거나 조합키를 누른 경우엔 건드리지 않는다
  const prevId = found && found.index > 0 ? ALL_EPISODES[found.index - 1].id : null
  const nextId =
    found && found.index + 1 < ALL_EPISODES.length ? ALL_EPISODES[found.index + 1].id : null
  const foundId = found?.episode.id
  useEffect(() => {
    if (!foundId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (e.key === 'Escape') {
        setOpenTermFor(null)
      } else if (e.key === 'ArrowLeft' && prevId) {
        navigate(`/bible/story/${prevId}`)
      } else if (e.key === 'ArrowRight') {
        markRead(foundId)
        navigate(nextId ? `/bible/story/${nextId}` : '/bible/story')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [foundId, prevId, nextId, markRead, navigate])

  // 끝까지 읽으면 자동 읽음 — 예전엔 '다음 이야기' 버튼에만 묶여 있어 다 읽고 뒤로가기·지도로
  // 나가면 기록이 안 남았고, 42화는 '완주하기'를 눌러야만 완주로 잡혔다. 본문 끝 표식이
  // 화면에 1.2초 머물면 읽음으로 본다(스크롤이 휙 지나가는 건 제외)
  const endRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = endRef.current
    if (!foundId || !el || typeof IntersectionObserver === 'undefined') return
    let timer = 0
    const io = new IntersectionObserver(
      entries => {
        const visible = entries.some(e => e.isIntersecting)
        if (visible && !timer) {
          timer = window.setTimeout(() => {
            markRead(foundId)
            io.disconnect()
          }, 1200)
        } else if (!visible && timer) {
          window.clearTimeout(timer)
          timer = 0
        }
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => {
      window.clearTimeout(timer)
      io.disconnect()
    }
  }, [foundId, markRead])

  const { data: fetchedRefs, isLoading: versesLoading } = useEpisodeVerses(
    episodeId,
    found?.episode.verseRefs ?? []
  )

  if (!found) return null
  const { episode, act, index } = found
  // 이 화의 무대 — 지도에 찍을 자리가 있는 화에만 값이 있다 (storyPlaces.ts)
  const atlasPlaceId = placeForEpisode(episode.id)
  const isRead = readIds.has(episode.id)
  const nextEp = index + 1 < ALL_EPISODES.length ? ALL_EPISODES[index + 1] : null
  const prevEp = index > 0 ? ALL_EPISODES[index - 1] : null

  const goRead = () => {
    const { book, chapter, verse } = episode.readLink
    // 출처를 붙여 보낸다 — 장 화면이 '처음 만나는 성경으로 돌아가기' 칩을 띄운다
    const q = new URLSearchParams({ from: 'story', ep: episode.id })
    if (verse) q.set('verse', String(verse))
    navigate(`/bible/${book}/${chapter}?${q}`)
  }

  // 원문 맛보기 절을 말씀 카드로 — 검색 결과 카드와 같은 presetVerse 경로를 탄다
  const goCard = (label: string, verses: BibleVerse[]) => {
    navigate('/bible/photo-verse', {
      state: { presetVerse: { text: joinVerseText(verses), refLabel: label } },
    })
  }

  const minutes = readingMinutes(episode.story, episode.why)

  const goNext = () => {
    markRead(episode.id)
    if (nextEp) navigate(`/bible/story/${nextEp.id}`)
    else navigate('/bible/story')
  }

  return (
    <div className="bg-[var(--app-canvas)] dark:bg-background-dark min-h-screen page-stage">
      {/* lg+: 읽는 화면. 본문은 한 줄이 너무 길어지지 않게 760px 까지만 넓히고(글씨는 Story.css lg
          블록에서 19px 로 키운다), 옆에 여정 목차 레일을 둔다. 폭을 px 로 못박지 않는 건 헤더 '가'
          글씨 크기(zoom)를 키워도 옆으로 넘치지 않게 하려는 것.
          overflow-hidden은 주지 않는다 — 하단 CTA 바가 sticky로 붙어야 하기 때문 */}
      <div className="lg:max-w-[1180px] lg:mx-auto lg:flex lg:items-start lg:justify-center lg:gap-6 lg:px-6 lg:pt-4 lg:pb-12">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-32 lg:max-w-[760px] lg:flex-1 lg:min-w-0 lg:mx-0 lg:min-h-0 lg:pb-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark">
        {/* 헤더 */}
        {/* 하단 실선을 두지 않는다 — 예전 #root overflow-x:hidden 시절 sticky 가 붙지 않아 바가 반투명
            앱 헤더 밑을 지날 때 실선만 비쳐 "중간에 끊긴 선"처럼 보였다. 이제 헤더 바로 아래(top-14)에 붙는다 */}
        <div className="sticky top-14 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm lg:rounded-t-3xl">
          <div className="flex items-center gap-3 px-4 h-14 lg:h-16 lg:px-6">
            <button
              onClick={() => navigate('/bible/story')}
              className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded-full lg:hover:bg-[var(--brand-soft)] lg:hover:text-brand transition-colors"
              aria-label="여정 지도로 돌아가기"
            >
              <span className="material-icons-round text-[22px] lg:text-[24px]">arrow_back</span>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[15px] lg:text-[18px] font-bold text-ink-strong truncate">
                {act.act}막 · {act.title}
              </h1>
            </div>
            <span className="flex-shrink-0 text-[12px] lg:text-[15px] font-bold tabular-nums text-gray-400 dark:text-white/45 lg:text-gray-500">
              {index + 1} / {TOTAL_EPISODES}
              <span className="hidden lg:inline">화</span>
            </span>
          </div>
        </div>

        {/* 타이틀 — 일러스트가 있는 화는 이모지 대신 장면 그림이 히어로가 된다 */}
        <div className="story-ep__hero">
          {storyImage(episode.id) ? (
            <img
              key={episode.id}
              className="story-ep__img"
              src={storyImage(episode.id)}
              alt=""
              decoding="async"
              fetchPriority="high"
            />
          ) : (
            <div className="story-ep__emoji"><StoryGlyph emoji={episode.emoji} size={40} /></div>
          )}
          <div className="story-ep__hook">{episode.hook}</div>
          <h2 className="story-ep__title">{episode.title}</h2>
          <div className="story-ep__meta">
            <span className="story-ep__meta-item">
              <span className="material-icons-round text-[13px]">schedule</span>약 {minutes}분
            </span>
            <span className="story-ep__meta-item">
              <span className="material-icons-round text-[13px]">menu_book</span>{act.range}
            </span>
            {isRead && (
              <span className="story-ep__meta-item story-ep__meta-item--read">
                <span className="material-icons-round text-[13px]">check_circle</span>읽은 이야기
              </span>
            )}
          </div>
        </div>

        {/* 지금 성경 어디쯤 — 모바일은 "1 / 42화" 숫자뿐이라 위치감이 없었다. 10막 점 띠로
            이 화가 성경 전체의 어느 구간인지 보여 준다(PC 는 오른쪽 레일이 같은 역할) */}
        <div className="story-ep__acts" role="group" aria-label={`전체 ${STORY_ACTS.length}막 중 ${act.act}막 ${act.title}`}>
          {STORY_ACTS.map(a => {
            const state = a.act < act.act ? 'past' : a.act === act.act ? 'now' : 'next'
            return (
              <button
                key={a.act}
                type="button"
                className={`story-ep__act story-ep__act--${state}`}
                onClick={() => navigate(`/bible/story/${a.episodes[0].id}`)}
                title={`${a.act}막 · ${a.title}`}
                aria-current={state === 'now' ? 'step' : undefined}
              >
                <span className="story-ep__act-dot" />
                {state === 'now' && <span className="story-ep__act-label">{a.act}막 · {a.title}</span>}
              </button>
            )
          })}
        </div>

        {/* 이야기 본문 */}
        <div className="story-ep__body">
          {episode.story.map((para, i) => (
            <p key={i} className="story-ep__para">
              <GlossaryText text={para} onTerm={setOpenTerm} />
            </p>
          ))}
        </div>

        {/* 왜 중요할까 */}
        <div className="story-ep__why">
          <span className="story-ep__why-label">
            <span className="material-icons-round text-[14px]">lightbulb</span>왜 중요할까
          </span>
          <p className="story-ep__why-text">
            <GlossaryText text={episode.why} onTerm={setOpenTerm} />
          </p>
        </div>

        {/* 원문 맛보기 */}
        <div className="story-ep__verses">
          <span className="story-ep__verses-label">
            <span className="material-icons-round text-[14px]">format_quote</span>원문 맛보기
          </span>
          {versesLoading ? (
            <div className="story-verse story-verse--skeleton" />
          ) : fetchedRefs && fetchedRefs.length > 0 ? (
            fetchedRefs.map(({ ref, verses }) => (
              <div key={ref.label} className="story-verse">
                <p className="story-verse__text">
                  {verses.map((v, i) => {
                    // 떨어진 절(창 1:1, 31) 사이에는 "…" — 두 절이 한 문장처럼 읽히지 않게
                    const gap = i > 0 && v.verse > verses[i - 1].verse + 1
                    return (
                      <span key={v.verse}>
                        {i > 0 && ' '}
                        {gap && <span className="story-verse__gap" aria-label="중략">…</span>}
                        <sup className="story-verse__no">{v.verse}</sup>
                        {v.text}
                      </span>
                    )
                  })}
                </p>
                <div className="story-verse__foot">
                  <span className="story-verse__ref">{ref.label}</span>
                  {verses.length > 0 && (
                    <button
                      type="button"
                      className="story-verse__card"
                      onClick={() => goCard(ref.label, verses)}
                      title="이 말씀으로 카드 만들기"
                    >
                      <span className="material-icons-round text-[15px]">image</span>
                      말씀 카드
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            // 절 로드 실패 — 출처 표기만 남기고 본문 읽기로 안내
            episode.verseRefs.map(ref => (
              <div key={ref.label} className="story-verse">
                <span className="story-verse__ref">{ref.label}</span>
              </div>
            ))
          )}
          <button className="story-ep__readlink" onClick={goRead}>
            <span className="material-icons-round text-[17px]">menu_book</span>
            성경에서 직접 읽기 · {episode.readLink.label}
            <span className="material-icons-round text-[15px]">chevron_right</span>
          </button>
        </div>

        {/* 이 이야기가 일어난 곳 — 지도에 찍을 자리가 있는 화에만 붙는다 */}
        {atlasPlaceId && (
          <div className="story-ep__where">
            <p className="story-ep__where-label">이 이야기가 일어난 곳</p>
            <Suspense fallback={null}>
              <AtlasPlaceCard placeId={atlasPlaceId} />
            </Suspense>
          </div>
        )}

        {/* 다음 화 예고 */}
        {episode.teaser && nextEp && (
          <div className="story-ep__teaser">
            <span className="story-ep__teaser-label">
              다음 이야기 · <StoryGlyph emoji={nextEp.emoji} size={14} /> {nextEp.title}
            </span>
            <p className="story-ep__teaser-text">{episode.teaser}</p>
          </div>
        )}

        {/* 본문 끝 표식 — 자동 읽음 관찰 대상 (예고 카드 아래, 바 위) */}
        <div ref={endRef} className="story-ep__end" aria-hidden />

        {/* 하단 고정 바 */}
        <div className="story-ep__bar">
          <div className="story-ep__bar-inner">
            {/* 이전 이야기 — PC 에서만. 모바일은 지도로 돌아가 고르는 흐름을 유지한다 */}
            {prevEp && (
              <button
                className="story-ep__bar-prev"
                onClick={() => navigate(`/bible/story/${prevEp.id}`)}
                title={`이전 이야기 · ${prevEp.title}`}
              >
                <span className="material-icons-round text-[20px]">arrow_back</span>
                이전
              </button>
            )}
            <button
              className="story-ep__bar-map"
              onClick={() => navigate('/bible/story')}
              aria-label="여정 지도"
            >
              <span className="material-icons-round text-[20px]">map</span>
            </button>
            <button className="story-ep__bar-next" onClick={goNext}>
              {nextEp ? (
                <>
                  다음 이야기
                  {/* PC 는 바가 넓어 다음 화 제목까지 보여 준다 */}
                  <span className="story-ep__bar-next-title">· {nextEp.title}</span>
                  <span className="material-icons-round text-[18px]">arrow_forward</span>
                </>
              ) : (
                <>
                  여정 완주하기
                  <span className="material-icons-round text-[18px]">celebration</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 용어 풋노트 */}
        {openTerm && GLOSSARY[openTerm] && (
          <>
            <div className="story-gloss-backdrop" onClick={() => setOpenTerm(null)} />
            <div className="story-gloss" role="dialog" aria-label={`${openTerm} 뜻`}>
              <div className="story-gloss__term">{openTerm}</div>
              <p className="story-gloss__def">{GLOSSARY[openTerm]}</p>
            </div>
          </>
        )}
      </div>

      {/* 우측 위젯 레일 (lg+) — 전자책 목차처럼 이 막의 화 목록과 여정 진행을 옆에 둔다.
          글씨 '아주 크게'에서 화면보다 길어지면 레일 안에서만 스크롤한다 */}
      <aside
        className="hidden lg:flex lg:w-[300px] xl:w-[320px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem] lg:overflow-y-auto lg:pb-2"
        style={{ maxHeight: 'calc((100vh - 5.5rem) / var(--az, 1))' }}
      >
        <section className="rounded-2xl p-5 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-none">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[14px] font-bold text-gray-600 dark:text-white/60">
              전체 여정
            </span>
            <span className="text-[16px] font-extrabold text-brand tabular-nums">
              {readIds.size} / {TOTAL_EPISODES}화
            </span>
          </div>
          <div className="mt-2.5 h-2 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${Math.round((readIds.size / TOTAL_EPISODES) * 100)}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => navigate('/bible/story')}
            className="mt-4 w-full h-11 rounded-xl border border-[var(--card-border)] text-[15px] font-bold text-ink-strong hover:text-brand hover:border-[var(--brand-soft-strong)] hover:bg-[var(--brand-soft)] transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <span className="material-icons-round text-[19px]">map</span>
            여정 지도 보기
          </button>
        </section>

        <section className="rounded-2xl p-3 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-none">
          <p className="px-2 pt-1 pb-2 text-[14px] font-bold text-gray-600 dark:text-white/60 [word-break:keep-all]">
            {act.act}막 · {act.title}
          </p>
          <div className="flex flex-col">
            {act.episodes.map((ep) => {
              const current = ep.id === episode.id
              const read = readIds.has(ep.id)
              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => navigate(`/bible/story/${ep.id}`)}
                  aria-current={current ? 'page' : undefined}
                  className={`flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-left transition-colors ${
                    current ? 'bg-[var(--brand-soft-strong)]' : 'hover:bg-[var(--brand-soft)]'
                  }`}
                >
                  <span className="shrink-0 w-6 grid place-items-center text-brand"><StoryGlyph emoji={ep.emoji} size={18} /></span>
                  <span
                    className={`flex-1 min-w-0 text-[15px] leading-snug [word-break:keep-all] ${
                      current ? 'font-bold text-brand' : 'font-semibold text-ink-strong'
                    }`}
                  >
                    {ep.title}
                  </span>
                  {read && !current && (
                    <span className="material-icons-round shrink-0 text-[18px] text-emerald-500">
                      check
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* 키보드 넘기기 안내 — 마우스 없이도 한 화씩 넘길 수 있다는 걸 알려 준다 */}
        <p className="px-2 text-[13px] leading-relaxed text-gray-500 dark:text-white/50 flex items-center gap-1.5 flex-wrap">
          <kbd className="px-1.5 py-0.5 rounded-md border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 font-sans text-[12px] font-bold">←</kbd>
          <kbd className="px-1.5 py-0.5 rounded-md border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 font-sans text-[12px] font-bold">→</kbd>
          키로 이전·다음 이야기
        </p>
      </aside>
      </div>
    </div>
  )
}

export default StoryEpisode
