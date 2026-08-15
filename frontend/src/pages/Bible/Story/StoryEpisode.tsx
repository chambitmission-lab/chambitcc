import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBibleVerse } from '../../../api/bible'
import type { BibleVerse } from '../../../types/bible'
import type { StoryVerseRef } from './storyTypes'
import { ALL_EPISODES, TOTAL_EPISODES, findEpisode } from './data'
import { GLOSSARY, parseGlossaryText } from './glossary'
import { useStoryProgress } from './storyProgress'
import './Story.css'

// 원문 맛보기 — 절 본문은 기존 성경 API에서 런타임에 가져온다 (번역본 일치, 데이터 중복 없음)
interface FetchedRef {
  ref: StoryVerseRef
  verses: BibleVerse[]
}

const useEpisodeVerses = (episodeId: string, refs: StoryVerseRef[]) =>
  useQuery<FetchedRef[]>({
    queryKey: ['bible', 'story-verses', episodeId],
    queryFn: () =>
      Promise.all(
        refs.map(async ref => ({
          ref,
          verses: await Promise.all(ref.verses.map(v => getBibleVerse(ref.book, ref.chapter, v))),
        }))
      ),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 1,
  })

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

  const { data: fetchedRefs, isLoading: versesLoading } = useEpisodeVerses(
    episodeId,
    found?.episode.verseRefs ?? []
  )

  if (!found) return null
  const { episode, act, index } = found
  const isRead = readIds.has(episode.id)
  const nextEp = index + 1 < ALL_EPISODES.length ? ALL_EPISODES[index + 1] : null

  const goRead = () => {
    const { book, chapter, verse } = episode.readLink
    navigate(`/bible/${book}/${chapter}${verse ? `?verse=${verse}` : ''}`)
  }

  const goNext = () => {
    markRead(episode.id)
    if (nextEp) navigate(`/bible/story/${nextEp.id}`)
    else navigate('/bible/story')
  }

  return (
    <div className="bg-gray-50 dark:bg-background-dark min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen pb-32">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3 px-4 h-14">
            <button
              onClick={() => navigate('/bible/story')}
              className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded-full"
              aria-label="여정 지도로 돌아가기"
            >
              <span className="material-icons-round text-[22px]">arrow_back</span>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[15px] font-bold text-ink-strong truncate">
                {act.act}막 · {act.title}
              </h1>
            </div>
            <span className="flex-shrink-0 text-[12px] font-bold tabular-nums text-gray-400 dark:text-white/45">
              {index + 1} / {TOTAL_EPISODES}
            </span>
          </div>
        </div>

        {/* 타이틀 */}
        <div className="story-ep__hero">
          <div className="story-ep__emoji">{episode.emoji}</div>
          <div className="story-ep__hook">{episode.hook}</div>
          <h2 className="story-ep__title">{episode.title}</h2>
          {isRead && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2.5 py-0.5 text-[11px] font-bold text-brand">
              <span className="material-icons-round text-[13px]">check_circle</span>
              읽은 이야기
            </div>
          )}
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
                  {verses.map(v => (
                    <span key={v.verse}>
                      {v.text}
                      {verses.length > 1 && v !== verses[verses.length - 1] ? ' ' : ''}
                    </span>
                  ))}
                </p>
                <span className="story-verse__ref">{ref.label}</span>
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

        {/* 다음 화 예고 */}
        {episode.teaser && nextEp && (
          <div className="story-ep__teaser">
            <span className="story-ep__teaser-label">다음 이야기 · {nextEp.emoji} {nextEp.title}</span>
            <p className="story-ep__teaser-text">{episode.teaser}</p>
          </div>
        )}

        {/* 하단 고정 바 */}
        <div className="story-ep__bar">
          <div className="story-ep__bar-inner">
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
    </div>
  )
}

export default StoryEpisode
