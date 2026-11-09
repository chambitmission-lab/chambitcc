import { useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { preloadRoute } from '../../../utils/routePreload'
import { useBibleChapter } from '../../../hooks/useBible'
import { useFeedTextScale, type FeedTextScale } from '../../../utils/feedTextScale'
import { SheetGrabber } from '../../../components/common/SheetGrabber'
import { parseRef } from '../data/crossRefs'
import { KIND_HINT, KIND_LABEL, STORY_EPISODE, THEME_LABEL, type MessiahPromise } from '../data/messiah'
import { ArrowDownIcon, BulbIcon, CrossIcon, CrownIcon, PathIcon, SparkleIcon } from './messiah/PromiseIcons'
import { formatPromiseRef, paintMarks } from './messiah/promiseText'
import '../styles/messiah.css'

// 포털 시트라 <main data-text-scale> 를 상속받지 못한다 — CrossRefSheet 와 같은 값으로 직접 세팅
const TEXT_MUL: Record<FeedTextScale, number> = { base: 1, large: 1.1, xlarge: 1.2 }

/** 한 본문(범위) 인용 — 대상 장은 읽기 화면과 같은 장 캐시(useBibleChapter)를 쓴다 */
const PassageQuote = ({ refStr, marks, tone }: { refStr: string; marks: readonly string[]; tone: 'ot' | 'nt' }) => {
  const r = parseRef(refStr)
  const { data, isLoading } = useBibleChapter(r.b, r.c)
  const verses = (data?.verses ?? []).filter((v) => v.verse >= r.v && v.verse <= r.to && v.text)
  const multi = verses.length > 1
  if (isLoading) return <p className="msh-quote msh-quote--loading">본문을 불러오는 중…</p>
  if (!verses.length) return <p className="msh-quote msh-quote--loading">본문을 불러오지 못했어요.</p>
  return (
    <p className="msh-quote">
      “
      {verses.map((v, i) => (
        <span key={v.id}>
          {i > 0 && ' '}
          {multi && <sup className="msh-quote__num">{v.verse}</sup>}
          {paintMarks(v.text, marks, `msh-mark msh-mark--${tone}`)}
        </span>
      ))}
      ”
    </p>
  )
}

interface MessiahSheetProps {
  /** 이 절에 달린 약속들 (보통 1개) — 여럿이면 위에 고르는 알약이 붙는다 */
  promises: readonly MessiahPromise[]
  /** 지금 읽고 있는 쪽 — 그 카드에 '지금 읽는 곳' 표시. 약속 지도에서 열면 없음 */
  currentSide?: 'ot' | 'nt'
  /** 약속 지도에서 열었으면 '지도 보기' 꼬리 링크를 숨긴다 */
  fromMap?: boolean
  onClose: () => void
}

/**
 * 약속과 성취 시트 — 구약의 약속 카드(금빛) → 화살표 → 신약의 성취 카드(푸른빛) → 핵심 포인트 → 양쪽으로 이동.
 * 초보자에게 "두 구절이 왜 이어지는지"를 먼저 보여 주는 게 목적이라, 종류(직접 예언·신약의 해석·상징과 모형)와
 * 그 뜻을 맨 위에 둔다 — 앱이 임의로 해석한 게 아니라 신약이 직접 이은 곳임을 알 수 있게.
 */
const MessiahSheet = ({ promises, currentSide, fromMap, onClose }: MessiahSheetProps) => {
  useModalBackButton(onClose)
  const navigate = useNavigate()
  const textScale = useFeedTextScale()
  const [activeId, setActiveId] = useState(promises[0]?.id)
  const p = promises.find((x) => x.id === activeId) ?? promises[0]
  if (!p) return null

  const go = (refStr: string) => {
    const r = parseRef(refStr)
    onClose()
    navigate(`/bible/${r.b}/${r.c}?verse=${r.v}`)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 sheet-backdrop sm:p-4"
      style={{ '--text-mul': TEXT_MUL[textScale] } as CSSProperties}
      onClick={onClose}
    >
      <div
        className="msh-panel bg-background-light dark:bg-card-dark relative w-full sm:max-w-md lg:max-w-lg sheet-rise rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_-12px_40px_rgba(0,0,0,0.35)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        role="dialog"
        aria-modal="true"
        aria-label={`약속과 성취 · ${p.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <SheetGrabber onClose={onClose} className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />

        <div className="msh-scroll">
          {/* 머리 */}
          <header className="msh-head">
            <SparkleIcon className="msh-head__spark" />
            <div className="min-w-0 flex-1">
              <h3 className="msh-head__title">약속과 성취</h3>
              <p className="msh-head__sub">구약의 약속이 신약에서 이루어졌어요</p>
            </div>
            <button type="button" onClick={onClose} aria-label="닫기" className="msh-close">
              <span className="material-icons-round text-[20px]">close</span>
            </button>
          </header>

          {promises.length > 1 && (
            <div className="msh-switch" role="tablist" aria-label="이 절에 담긴 약속">
              {promises.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  aria-selected={x.id === p.id}
                  className={x.id === p.id ? 'is-on' : ''}
                  onClick={() => setActiveId(x.id)}
                >
                  {x.title}
                </button>
              ))}
            </div>
          )}

          {/* 종류 — 직접 예언 / 신약의 해석 / 상징과 모형 */}
          <div className="msh-kind">
            <span className={`msh-kind__chip msh-kind__chip--${p.kind}`}>{KIND_LABEL[p.kind]}</span>
            <span className="msh-kind__theme">{THEME_LABEL[p.theme]} · {p.title}</span>
          </div>
          <p className="msh-kind__hint">{KIND_HINT[p.kind]}</p>

          {/* 구약의 약속 */}
          <section className="msh-card msh-card--ot">
            <div className="msh-card__top">
              <span className="msh-badge msh-badge--ot">
                <CrownIcon size={15} />
                구약의 약속
              </span>
              {currentSide === 'ot' && <span className="msh-here">지금 읽는 곳</span>}
            </div>
            <h4 className="msh-card__ref">{formatPromiseRef(p.ot)}</h4>
            <PassageQuote refStr={p.ot} marks={p.otMarks} tone="ot" />
          </section>

          <div className="msh-link" aria-hidden>
            <span className="msh-link__dot">
              <ArrowDownIcon size={16} />
            </span>
          </div>

          {/* 신약의 성취 — 1~3곳 */}
          <section className="msh-card msh-card--nt">
            <div className="msh-card__top">
              <span className="msh-badge msh-badge--nt">
                <CrossIcon size={15} />
                신약의 성취
              </span>
              {currentSide === 'nt' && <span className="msh-here msh-here--nt">지금 읽는 곳</span>}
            </div>
            {p.nt.map((n, i) => (
              <div key={n} className={i > 0 ? 'msh-card__more' : undefined}>
                <h4 className="msh-card__ref">{formatPromiseRef(n)}</h4>
                <PassageQuote refStr={n} marks={p.ntMarks} tone="nt" />
              </div>
            ))}
          </section>

          {/* 핵심 포인트 */}
          <section className="msh-point">
            <p className="msh-point__label">
              <BulbIcon size={17} />
              핵심 포인트
            </p>
            <p className="msh-point__text">{p.point}</p>
          </section>

          <div className="msh-actions">
            <button type="button" className="msh-btn msh-btn--ot" onClick={() => go(p.ot)}>
              <span className="material-icons-round text-[18px]" aria-hidden>auto_stories</span>
              구약 말씀 보기
            </button>
            <button type="button" className="msh-btn msh-btn--nt" onClick={() => go(p.nt[0])}>
              <span className="material-icons-round text-[18px]" aria-hidden>auto_stories</span>
              신약 말씀 보기
            </button>
          </div>

          {STORY_EPISODE[p.id] && (
            <button
              type="button"
              className="msh-maplink"
              onPointerDown={() => void preloadRoute(`/bible/story/${STORY_EPISODE[p.id]}`)}
              onClick={() => {
                onClose()
                navigate(`/bible/story/${STORY_EPISODE[p.id]}`)
              }}
            >
              <span className="material-icons-round text-[18px] msh-maplink__story" aria-hidden>auto_stories</span>
              <span className="flex-1 text-left">이야기로 읽기 · 처음 만나는 성경 ‘약속의 실’</span>
              <span className="material-icons-round text-[18px]" aria-hidden>chevron_right</span>
            </button>
          )}

          {!fromMap && (
            <button
              type="button"
              className="msh-maplink"
              onPointerDown={() => void preloadRoute('/bible/promises')}
              onClick={() => {
                onClose()
                navigate(`/bible/promises?p=${p.id}`)
              }}
            >
              <PathIcon size={17} />
              <span className="flex-1 text-left">창세기부터 이어지는 약속 지도 보기</span>
              <span className="material-icons-round text-[18px]" aria-hidden>chevron_right</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default MessiahSheet
