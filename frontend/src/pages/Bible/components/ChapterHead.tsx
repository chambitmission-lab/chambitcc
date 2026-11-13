import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { genreStyle } from '../../../components/bible/bookGenre'
import BookIntroCard from '../../../components/bible/BookIntroCard'
import { useBookIntro } from '../../../hooks/useBibleBookIntro'
import { canonicalBookName } from '../../Sermon/utils/sermonMeta'
import { actIndexOf } from '../data/bookStorylines'
import type { ChapterKeyword } from '../data/chapterKeywords'
import { getActiveKeyword, setActiveKeyword, subscribeActiveKeyword } from '../data/keywordHighlight'
import { useBookStoryline } from '../hooks/useBookStoryline'
import { useChapterBrief } from '../hooks/useChapterBrief'
import { lazyModal } from '../../../utils/lazyModal'
import KeywordActivePill from './KeywordActivePill'
import { scrollToFirstKeyword } from './keywordScroll'
import './ChapterHead.css'

// 열 때만 받는 시트 — 읽기 화면 청크에서 분리
const ChapterGuideSheet = lazyModal(() => import('./ChapterGuideSheet'))
const KeywordSheet = lazyModal(() => import('./KeywordSheet'))

interface ChapterHeadProps {
  bookNumber: number
  bookName: string
  chapter: number
  totalChapters: number
  onJumpToChapter: (chapter: number) => void
  /** Aa 읽기 설정의 안내 켜고 끄기 — 꺼진 조각은 자리째 빠진다 */
  show: { bookIntro: boolean; story: boolean; brief: boolean }
  /** 제목 줄 오른쪽 '듣기' 버튼 (재생 전에만). 없으면 비운다 */
  listenButton?: ReactNode
  /** 오디오북 띠 — 제목 아래. 리마운트되면 안 되므로 늘 같은 자리에 둔다 */
  audio?: ReactNode
}

/**
 * 장 머리말 (chd-) — 본문 위에는 제목과 한 줄만.
 *
 *   창세기 › 37장                    [▶ 듣기] [길잡이]
 *   팔려 간 요셉 · 아버지의 편애와 꿈 이야기로 …      ← 회색 한 줄
 *   1  야곱이 가나안 땅 …                          ← 바로 본문
 *
 * YouVersion·Apple Books 처럼 장을 열면 제목 → 본문. 지금까지·눈여겨보기·열쇠말·줄거리 지도는
 * Kindle X-Ray·Logos Passage Guide 처럼 '길잡이' 버튼 하나 뒤(ChapterGuideSheet)에 모은다.
 * 권 개관 입구는 셋 — 제목의 책 이름(지름길)·길잡이 맨 위 줄(찾기 쉬운 길)·1장 회색 줄 끝. 2독 '다시 읽는 길' 질문은 다 읽은 뒤 장 끝(VerseList)에 놓인다.
 *
 * 예전(2026-11-13 오전까지)엔 카드 다섯 장 → 머리말 안 펼침 섹션 여러 개였는데,
 * 둘 다 1절보다 먼저 읽을거리가 너무 많아 "뭘 봐야 할지 모르겠다"는 화면이었다.
 */
const ChapterHead = ({
  bookNumber,
  bookName,
  chapter,
  totalChapters,
  onJumpToChapter,
  show,
  listenButton,
  audio,
}: ChapterHeadProps) => {
  const { story: loadedStory } = useBookStoryline(bookNumber)
  const story = show.story ? loadedStory : null
  const { pending: briefPending, brief, labels, keywords, catchUpLines } = useChapterBrief(bookNumber, chapter, show.brief)
  const [guideOpen, setGuideOpen] = useState(false)
  // 권 개관 — 제목의 책 이름·길잡이 맨 위·1장 안내 줄, 세 입구가 같은 시트를 연다
  const { data: intro } = useBookIntro(bookNumber, show.bookIntro)
  const introReady = show.bookIntro && !!intro
  const [introOpen, setIntroOpen] = useState(false)

  // 열쇠말 밝히기 — 시트를 닫아도 본문 밝히기·끄기 알약은 남아야 하므로 머리말이 쥔다
  const [sheetKeyword, setSheetKeyword] = useState<ChapterKeyword | null>(null)
  const active = useSyncExternalStore(subscribeActiveKeyword, getActiveKeyword)
  const activeHere = active && active.book === bookNumber && active.chapter === chapter ? active.keyword : null
  // 장을 옮기거나 읽기 화면을 떠나면 밝히기를 끈다 — 다른 장으로 따라가지 않게
  useEffect(() => {
    return () => setActiveKeyword(null)
  }, [bookNumber, chapter])
  const toggleHighlight = (kw: ChapterKeyword) => {
    setSheetKeyword(null)
    if (activeHere === kw) {
      setActiveKeyword(null)
      return
    }
    setActiveKeyword({ book: bookNumber, chapter, keyword: kw })
    scrollToFirstKeyword()
  }

  const nowIdx = story ? actIndexOf(story.acts, chapter) : -1
  // 이 장이 줄거리의 이름 붙은 장면이면 한 줄 맨 앞에 ("팔려 간 요셉 · …")
  const scene = nowIdx >= 0 ? (story!.acts[nowIdx].scenes.find((s) => s.ch === chapter)?.label ?? null) : null
  const hasGuide = introReady || !!brief || keywords.length > 0 || nowIdx >= 0
  // 책을 처음 펼치는 1장 — 소개가 가장 필요한 때라 회색 한 줄 끝에 개관 입구를 붙인다
  const introLink = introReady && chapter === 1

  return (
    <section className="chd" style={genreStyle(bookNumber)} aria-label={`${bookName} ${chapter}장`}>
      <div className="chd-pad">
        <div className="chd-title-row">
          <h2 className="chd-title">
            {show.bookIntro ? (
              <BookIntroCard
                bookNumber={bookNumber}
                bookNameKo={bookName}
                totalChapters={totalChapters}
                currentChapter={chapter}
                onJumpToChapter={onJumpToChapter}
                sheetOpen={introOpen}
                onSheetOpenChange={setIntroOpen}
              />
            ) : (
              <span className="chd-book">{bookName}</span>
            )}
            <span>{chapter}장</span>
          </h2>
          <div className="chd-actions">
            {listenButton}
            {hasGuide && (
              <button
                type="button"
                className="chd-btn"
                onClick={() => setGuideOpen(true)}
                onPointerEnter={() => void ChapterGuideSheet.preload()}
                onTouchStart={() => void ChapterGuideSheet.preload()}
                aria-haspopup="dialog"
              >
                <span className="material-icons-round" aria-hidden>explore</span>
                길잡이
                {/* 오랜만에 왔으면 지난 이야기가 있다는 표시만 — 펼쳐 놓지는 않는다 */}
                {catchUpLines.length > 0 && <span className="chd-btn__dot" aria-label="지난 이야기 있음" />}
              </button>
            )}
          </div>
        </div>

        {(scene || brief || introLink) && (
          <p className="chd-sub">
            {scene && <b>{scene}</b>}
            {scene && brief && <span aria-hidden> · </span>}
            {brief?.now}
            {introLink && (
              <button type="button" className="chd-intro-link" onClick={() => setIntroOpen(true)} aria-haspopup="dialog">
                이 책 소개 보기
                <span className="material-icons-round" aria-hidden>chevron_right</span>
              </button>
            )}
          </p>
        )}
        {!scene && !brief && briefPending && <div className="chd-sub-placeholder" aria-hidden />}
      </div>

      {audio}

      {guideOpen && (
        <ChapterGuideSheet
          bookNumber={bookNumber}
          bookName={bookName}
          chapter={chapter}
          brief={brief}
          labels={labels}
          catchUpLines={catchUpLines}
          keywords={keywords}
          activeKeyword={activeHere}
          story={story}
          introOneLiner={introReady ? intro!.one_liner : null}
          onOpenIntro={() => {
            setGuideOpen(false)
            setIntroOpen(true)
          }}
          onPickKeyword={(kw) => {
            setGuideOpen(false)
            setSheetKeyword(kw)
          }}
          onJumpToChapter={onJumpToChapter}
          onClose={() => setGuideOpen(false)}
        />
      )}
      {sheetKeyword && (
        <KeywordSheet
          keyword={sheetKeyword}
          where={`${canonicalBookName(bookNumber)} ${chapter}장`}
          active={activeHere === sheetKeyword}
          onToggleHighlight={() => toggleHighlight(sheetKeyword)}
          onClose={() => setSheetKeyword(null)}
        />
      )}
      {activeHere && <KeywordActivePill keyword={activeHere} onOff={() => setActiveKeyword(null)} />}
    </section>
  )
}

export default ChapterHead
