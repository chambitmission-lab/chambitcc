import { useEffect, useMemo, useRef, useState } from 'react'
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
 * PC 좌측 장 개요 레일.
 * 절 본문을 한 줄씩 다시 나열하지 않고(옆 본문과 중복), "지금 어디쯤 읽고 있는지"를
 * 단락 소제목(절 범위)으로 보여준다. 아래엔 절 번호 격자만 두어 특정 절로 바로 이동.
 * 스크롤에 따라 현재 단락이 하이라이트된다.
 */
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
  // 이 앱은 #root/body overflow 구조 탓에 position: sticky가 먹지 않는다.
  // 폭만 차지하는 슬롯을 flex에 두고, 실제 레일은 fixed로 띄워 슬롯의 left를 따라간다.
  const slotRef = useRef<HTMLDivElement>(null)
  const [slotLeft, setSlotLeft] = useState<number | null>(null)

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
  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      const nodes = document.querySelectorAll<HTMLElement>('[data-verse]')
      if (!nodes.length) return
      // 화면 위쪽 40% 지점을 "읽는 줄"로 본다
      const line = window.innerHeight * 0.4
      let current = Number(nodes[0].dataset.verse) || 1
      for (const el of nodes) {
        if (el.getBoundingClientRect().top <= line) {
          current = Number(el.dataset.verse) || current
        } else {
          break
        }
      }
      setActiveVerse(current)
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        measure()
        const rect = slotRef.current?.getBoundingClientRect()
        if (rect) setSlotLeft(rect.left)
      })
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [bookNumber, chapter, totalVerses])

  const activeIndex = useMemo(() => {
    if (!sections) return -1
    return sections.findIndex((s) => activeVerse >= s.v[0] && activeVerse <= s.v[1])
  }, [sections, activeVerse])

  const verseNumbers = useMemo(
    () => (totalVerses ? Array.from({ length: totalVerses }, (_, i) => i + 1) : []),
    [totalVerses]
  )

  return (
    <div className="corl-slot" ref={slotRef}>
    <nav
      className="corl"
      aria-label="장 개요"
      style={slotLeft != null ? { left: slotLeft } : undefined}
    >
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

      {/* 절 번호 격자 */}
      {verseNumbers.length > 0 && (
        <>
          <p className="corl-label">절 바로가기</p>
          <div className="corl-grid">
            {verseNumbers.map((v) => (
              <button
                key={v}
                type="button"
                className={`corl-cell${v === activeVerse ? ' active' : ''}${readVerses?.has(v) ? ' read' : ''}`}
                onClick={() => onJumpToVerse(v)}
                aria-label={`${v}절로 이동`}
              >
                {v}
              </button>
            ))}
          </div>
        </>
      )}
    </nav>
    </div>
  )
}

export default ChapterOutlineRail
