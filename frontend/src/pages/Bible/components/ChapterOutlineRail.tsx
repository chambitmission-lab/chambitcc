import { memo, useEffect, useMemo, useState } from 'react'
import { loadBookOutline, type OutlineSection } from '../data/chapterOutlines'

interface ChapterOutlineRailProps {
  bookNumber: number
  bookNameKo: string
  bookNameEn?: string
  chapter: number
  totalChapters: number
  /** 이 장의 절 수 — 절 번호 격자용. 본문 로드 전엔 undefined */
  totalVerses?: number
  /** 읽음 처리된 절 (격자에 점으로 표시) */
  readVerses?: Set<number>
  onJumpToVerse: (verse: number) => void
  onChapterChange: (chapter: number) => void
}

/**
 * PC 좌측 레일의 장 개요 부분 — BibleSideRail 의 children 으로 들어간다(위치·접기는 그쪽 담당).
 * 절 본문을 한 줄씩 다시 나열하지 않고(옆 본문과 중복), "지금 어디쯤 읽고 있는지"를
 * 단락 소제목(절 범위)으로 보여준다. 아래엔 절 번호 격자만 두어 특정 절로 바로 이동.
 * 스크롤에 따라 현재 단락이 하이라이트된다.
 */
/** 절 번호 격자 — 최대 176개 버튼. activeVerse 가 스크롤마다 바뀌어도 이 격자는
 *  readVerses/onJumpToVerse 가 그대로면 재렌더하지 않는다. */
const VerseGrid = memo(
  ({
    verseNumbers,
    readVerses,
    onJumpToVerse,
  }: {
    verseNumbers: number[]
    readVerses?: Set<number>
    onJumpToVerse: (verse: number) => void
  }) => (
    <>
      <p className="corl-label">절 바로가기</p>
      <div className="corl-grid">
        {verseNumbers.map((v) => (
          <button
            key={v}
            type="button"
            className={`corl-cell${readVerses?.has(v) ? ' read' : ''}`}
            onClick={() => onJumpToVerse(v)}
            aria-label={`${v}절로 이동`}
          >
            {v}
          </button>
        ))}
      </div>
    </>
  ),
)
VerseGrid.displayName = 'VerseGrid'

const ChapterOutlineRail = ({
  bookNumber,
  bookNameKo,
  bookNameEn,
  chapter,
  totalChapters,
  totalVerses,
  readVerses,
  onJumpToVerse,
  onChapterChange,
}: ChapterOutlineRailProps) => {
  const [sections, setSections] = useState<OutlineSection[] | null>(null)
  const [activeVerse, setActiveVerse] = useState(1)

  // 책별 lazy import — 읽는 책의 개요만 내려받는다
  useEffect(() => {
    let alive = true
    setSections(null)
    loadBookOutline(bookNumber).then((outline) => {
      if (!alive) return
      setSections(outline?.[chapter] ?? [])
    })
    return () => {
      alive = false
    }
  }, [bookNumber, chapter])

  // 스크롤 위치 → 현재 읽는 절.
  // 이 앱은 스크롤러가 window/body 어느 쪽일지 환경마다 달라 IntersectionObserver의
  // 암묵 root를 믿기 어렵다. 캡처 단계 scroll 리스너 + rAF 스로틀로 직접 잰다.
  // 레일은 layout.css 에서 1024px 미만에 display:none 이다. 그런데 측정 effect 는
  // 화면 폭과 무관하게 돌아 모바일 스크롤마다 절 전체 getBoundingClientRect 를 읽었다
  // (시 119편 176절). 보이지 않는 화면에선 리스너 자체를 달지 않는다.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isDesktop) return
    let raf = 0
    // 절 DOM 목록은 장이 바뀔 때만 달라지므로 스크롤 프레임마다 querySelectorAll 하지 않고
    // 한 번 캐시한다. (본문 늦게 도착 → 빈 목록이면 다음 프레임에 다시 조회)
    let nodes: HTMLElement[] = []
    const collectNodes = () => {
      nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-verse]'))
    }
    // 장이 바뀌면 본문은 맨 위에서 다시 시작한다. 그런데 이 시점엔 이전 장의 절 DOM과
    // 스크롤 위치가 아직 남아 있어 즉시 재면 엉뚱한 단락이 켜진다(예: 7장 진입 직후 "홍수 심판").
    // 그래서 첫 단락으로 리셋하고, 맨 위로 되돌아가는 동안(잠깐)은 측정을 건너뛴다.
    setActiveVerse(1)
    const settledAt = performance.now() + 800
    const measure = () => {
      raf = 0
      if (performance.now() < settledAt) return
      // 본문은 장 안에서도 페이지 단위로 늘어난다 — 절이 다 채워질 때까지는 매번 다시 모은다
      // (querySelectorAll 은 싸다; 비싼 건 절마다 하던 getBoundingClientRect 였다)
      if (!nodes.length || nodes.length < (totalVerses ?? Infinity) || !nodes[0].isConnected) collectNodes()
      if (!nodes.length) return
      // 화면 위쪽 40% 지점을 "읽는 줄"로 본다.
      // 절은 문서 순서대로 놓이므로 이진 탐색 — 176절을 매 프레임 전부 재지 않는다.
      const line = window.innerHeight * 0.4
      let lo = 0
      let hi = nodes.length - 1
      let idx = -1
      while (lo <= hi) {
        const mid = (lo + hi) >> 1
        if (nodes[mid].getBoundingClientRect().top <= line) {
          idx = mid
          lo = mid + 1
        } else {
          hi = mid - 1
        }
      }
      const current = idx >= 0 ? Number(nodes[idx].dataset.verse) || 1 : Number(nodes[0].dataset.verse) || 1
      setActiveVerse((prev) => (prev === current ? prev : current))
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(measure)
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [isDesktop, bookNumber, chapter, totalVerses])

  const activeIndex = useMemo(() => {
    if (!sections) return -1
    return sections.findIndex((s) => activeVerse >= s.v[0] && activeVerse <= s.v[1])
  }, [sections, activeVerse])

  const verseNumbers = useMemo(
    () => (totalVerses ? Array.from({ length: totalVerses }, (_, i) => i + 1) : []),
    [totalVerses]
  )

  return (
    <section className="corl-outline" aria-label="장 개요">
      {/* 책·장 헤더 — 좌우 화살표로 장 이동 */}
      <div className="corl-head">
        <div className="corl-book">
          <span className="corl-book-ko">{bookNameKo}</span>
          {bookNameEn && <span className="corl-book-en">{bookNameEn}</span>}
        </div>
        <div className="corl-chap">
          <button
            type="button"
            className="corl-chap-btn"
            disabled={chapter <= 1}
            onClick={() => onChapterChange(chapter - 1)}
            aria-label="이전 장"
          >
            <span className="material-icons-round">chevron_left</span>
          </button>
          <span className="corl-chap-label">
            {chapter}장 <em>/ {totalChapters}</em>
          </span>
          <button
            type="button"
            className="corl-chap-btn"
            disabled={chapter >= totalChapters}
            onClick={() => onChapterChange(chapter + 1)}
            aria-label="다음 장"
          >
            <span className="material-icons-round">chevron_right</span>
          </button>
        </div>
      </div>

      {/* 단락 개요 */}
      <p className="corl-label">이 장의 흐름</p>
      {sections === null ? (
        <ul className="corl-list" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="corl-item corl-item--skeleton" />
          ))}
        </ul>
      ) : sections.length === 0 ? (
        <p className="corl-empty">이 장의 개요는 준비 중입니다</p>
      ) : (
        <ol className="corl-list">
          {sections.map((s, i) => {
            const state = i === activeIndex ? 'active' : i < activeIndex ? 'passed' : ''
            return (
              <li key={i} className={`corl-item ${state}`}>
                <button type="button" className="corl-item-btn" onClick={() => onJumpToVerse(s.v[0])}>
                  <span className="corl-num">{i + 1}</span>
                  <span className="corl-text">
                    <span className="corl-title">{s.title}</span>
                    <span className="corl-range">
                      {s.v[0] === s.v[1] ? `${s.v[0]}절` : `${s.v[0]}–${s.v[1]}절`}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {/* 절 번호 격자 — 스크롤 따라 움직이는 표시는 시선을 흔들어 일부러 두지 않는다(단락 하이라이트만) */}
      {verseNumbers.length > 0 && (
        <VerseGrid verseNumbers={verseNumbers} readVerses={readVerses} onJumpToVerse={onJumpToVerse} />
      )}
    </section>
  )
}

export default ChapterOutlineRail
