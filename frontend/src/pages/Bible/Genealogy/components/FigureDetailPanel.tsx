import { useEffect, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useBibleFigureDetail, usePrefetchBibleFigure } from '../../../../hooks/useBibleFigure'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import type { BibleFigureSummary, KeyVerseRef } from '../../../../types/bibleFigure'
import { ERAS, FIGURE_HOOK } from '../genealogyStory'

interface FigureDetailPanelProps {
  slug: string | null
  onSelect: (slug: string) => void
  onClose: () => void
  /** 'card' (기본): 우측 사이드 카드 / 'sheet': 모바일 슬라이드업 시트 */
  variant?: 'card' | 'sheet'
  /** 가계도에서 이미 알고 있는 요약 — 상세 로딩 전 헤더·한 줄 소개를 즉시 그린다 */
  summary?: BibleFigureSummary | null
}

export const FigureDetailPanel = ({
  slug,
  onSelect,
  onClose,
  variant = 'card',
  summary,
}: FigureDetailPanelProps) => {
  const { data, isLoading, error, isPlaceholderData } = useBibleFigureDetail(slug, summary)
  const prefetch = usePrefetchBibleFigure()

  // 상세가 오면 부모·배우자·자녀(다음 클릭 후보)를 미리 받아둔다
  useEffect(() => {
    if (!data || isPlaceholderData) return
    ;[...data.parents, ...data.spouses, ...data.children].forEach((f) => prefetch(f.slug))
  }, [data, isPlaceholderData, prefetch])

  // 모바일 시트로 열린 경우만 뒤로가기 → 시트 닫기 (데스크탑 사이드 카드는 제외)
  useModalBackButton(onClose, variant === 'sheet' && !!slug)

  const shellBase =
    'relative rounded-2xl border bg-white dark:bg-card-dark border-gray-200 dark:border-white/[0.08] overflow-hidden'
  const shellShadow = variant === 'card' ? 'shadow-[var(--card-shadow)]' : ''

  if (!slug) {
    return (
      <div className={`${shellBase} ${shellShadow} p-6`}>
        <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none bg-gradient-to-br from-white/[0.05] via-transparent to-white/[0.02]" />
        <div className="relative text-center text-gray-500 dark:text-white/55 text-[13px] py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--brand-soft)] mb-3">
            <span className="material-icons-round text-brand" style={{ fontSize: 22 }}>
              touch_app
            </span>
          </div>
          <p>가계도에서 인물을 선택하면</p>
          <p>이야기와 대표 구절을 볼 수 있어요.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`${shellBase} ${shellShadow} p-6 animate-pulse`}>
        <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none bg-gradient-to-br from-white/[0.05] via-transparent to-white/[0.02]" />
        <div className="relative space-y-3">
          <div className="h-6 w-1/3 bg-gray-100 dark:bg-white/[0.06] rounded-lg" />
          <div className="h-4 w-2/3 bg-gray-100 dark:bg-white/[0.06] rounded" />
          <div className="h-4 w-full bg-gray-100 dark:bg-white/[0.06] rounded" />
          <div className="h-4 w-5/6 bg-gray-100 dark:bg-white/[0.06] rounded" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-5 text-[14px] text-red-700 dark:text-red-300">
        인물 정보를 불러오지 못했습니다.
      </div>
    )
  }

  const era = data.era ? ERAS.find((e) => e.match(data.era as string)) : undefined
  const eraStyle = (era ? { '--era': era.color, '--era-deep': era.deep } : {}) as CSSProperties
  const deck = FIGURE_HOOK[data.slug] ?? data.description_short
  const name = splitName(data.name_ko)
  const loggedIn = data.reading_progress !== null
  const verses = data.key_verses ?? []
  const readCount = verses.filter((kv) => kv.is_read).length
  // 가장 긴 본문을 가진 구절을 풀쿼트로 세우고, 나머지는 각주 목록으로
  const pullIdx = verses.reduce((best, kv, i) => ((kv.text?.length ?? 0) > (verses[best]?.text?.length ?? 0) ? i : best), 0)
  const pull = verses[pullIdx]?.text ? verses[pullIdx] : null
  const notes = verses.filter((_, i) => !pull || i !== pullIdx)
  const [lead, rest] = splitStory(data.description_long)
  const hasFamily = data.parents.length + data.spouses.length + data.children.length > 0
  const anyLine = [...data.parents, ...data.children].some((f) => f.is_messianic_line)
  const meta = [
    era && { v: era.short, k: '시대' },
    data.children.length > 0 && { v: `${data.children.length}명`, k: '자녀' },
    loggedIn && verses.length > 0 && { v: `${readCount}/${verses.length}`, k: '읽은 구절' },
  ].filter(Boolean) as { v: string; k: string }[]

  const chunk = (f: BibleFigureSummary) => (
    <button
      key={f.slug}
      type="button"
      onClick={() => onSelect(f.slug)}
      className={`gfd-chunk${f.is_messianic_line ? ' is-line' : ''}`}
    >
      {f.name_ko}
    </button>
  )

  return (
    <div className={`gfd gfd-paper ${variant === 'card' ? 'is-card' : 'is-sheet'}`} style={eraStyle}>
      <button type="button" onClick={onClose} aria-label="닫기" className="gfd-x">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div
        className={`gfd-scroll${variant === 'card' ? '' : ' max-h-[82vh]'}`}
        // PC 사이드 카드는 sticky(top 4.5rem) 아래 화면을 채운다 — 글씨 크기 zoom 배율로 나눈다
        style={variant === 'card' ? { maxHeight: 'calc((100vh - 6rem) / var(--az, 1))' } : undefined}
      >
        {/* 표지 — 명조 제목 + 히브리어 워터마크 */}
        <header className="gfd-cover">
          {data.name_hebrew && (
            <div className="gfd-heb" aria-hidden>
              {data.name_hebrew}
            </div>
          )}
          <div className="gfd-kicker">
            {[era?.label ?? data.era, data.is_messianic_line ? '메시아 라인' : null].filter(Boolean).join(' — ')}
          </div>
          <h2 className="gfd-title font-serif-kr">
            {name.base}
            {name.qualifier && <small>{name.qualifier}</small>}
          </h2>
          {(data.name_en || data.role) && (
            <div className="gfd-en">{[data.name_en, data.role].filter(Boolean).join(' · ')}</div>
          )}
          {deck && <p className="gfd-deck font-serif-kr">{deck}</p>}
          {meta.length > 0 && (
            <div className="gfd-meta">
              {meta.map((m) => (
                <div key={m.k}>
                  <b>{m.v}</b>
                  {m.k}
                </div>
              ))}
            </div>
          )}
        </header>
        {loggedIn && (
          <div className="gfd-progress" aria-label={`키 구절 통독 ${Math.round((data.reading_progress || 0) * 100)}%`}>
            <i style={{ width: `${(data.reading_progress || 0) * 100}%` }} />
          </div>
        )}

        {isPlaceholderData ? (
          <div className="gfd-art fig-body-in">
            {data.description_short && <p className="is-drop">{data.description_short}</p>}
            <div className="space-y-2.5 animate-pulse mt-4" aria-hidden>
              <div className="h-3.5 w-full bg-black/[0.05] dark:bg-white/[0.06] rounded" />
              <div className="h-3.5 w-11/12 bg-black/[0.05] dark:bg-white/[0.06] rounded" />
              <div className="h-3.5 w-4/5 bg-black/[0.05] dark:bg-white/[0.06] rounded" />
            </div>
            <p className="mt-6 text-[11.5px] gfd-faint">이야기와 대표 구절을 불러오는 중…</p>
          </div>
        ) : (
          <div className="fig-body-in">
            {lead && (
              <div className="gfd-art">
                <p className="is-drop">{lead}</p>
              </div>
            )}

            {pull && (
              <figure className="gfd-pull">
                <blockquote className="font-serif-kr">“{pull.text}”</blockquote>
                <figcaption>
                  <Link to={verseLink(pull)}>{verseRef(pull)} ›</Link>
                  {pull.label && <span> — {pull.label}</span>}
                  {pull.is_read && <span className="gfd-read"> · ✓ 읽음</span>}
                </figcaption>
              </figure>
            )}

            {rest && (
              <div className="gfd-art">
                <p>{rest}</p>
              </div>
            )}

            {/* 계보 — 부모 → 나 + 배우자 → 자녀 미니 가계도. 파란 버튼이 메시아 줄기 */}
            {hasFamily && (
              <>
                <div className="gfd-h">계보</div>
                <div className="gfd-tree">
                  {data.parents.length > 0 && (
                    <>
                      <div className="gfd-lvl">{data.parents.map(chunk)}</div>
                      <div className="gfd-stem" />
                    </>
                  )}
                  <div className="gfd-lvl">
                    <span className="gfd-chunk is-me">{data.name_ko}</span>
                    {data.spouses.length > 0 && <span className="gfd-plus">+</span>}
                    {data.spouses.map(chunk)}
                  </div>
                  {data.children.length > 0 && (
                    <>
                      <div className="gfd-stem" />
                      <div className="gfd-lvl">{data.children.map(chunk)}</div>
                    </>
                  )}
                </div>
                {anyLine && (
                  <p className="gfd-legend">
                    <b>파란 이름</b>을 따라가면 예수님까지 이어져요
                  </p>
                )}
              </>
            )}

            {notes.length > 0 && (
              <>
                <div className="gfd-h">대표 구절</div>
                <ol className="gfd-notes">
                  {notes.map((kv, idx) => (
                    <li key={`${kv.book_number}-${kv.chapter}-${kv.verse ?? 0}-${idx}`} className="gfd-note">
                      <span className="gfd-no">{idx + 1}</span>
                      <div className="min-w-0">
                        <div className="gfd-note__ref font-serif-kr">
                          <Link to={verseLink(kv)}>{verseRef(kv)} ›</Link>
                          {loggedIn && (kv.is_read ? <span className="gfd-read">✓ 읽음</span> : <span className="gfd-faint">아직</span>)}
                        </div>
                        {kv.label && <div className="gfd-note__label">{kv.label}</div>}
                        {kv.text && <p className="font-serif-kr">{kv.text}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}
            <div className="h-6" />
          </div>
        )}
      </div>
    </div>
  )
}

/** "요셉 (예수의 양부)" → 큰 제목은 이름만, 괄호 속 구분어는 옆에 작게 */
const splitName = (full: string) => {
  const m = full.match(/^(.+?)\s*\((.+)\)\s*$/)
  return m ? { base: m[1], qualifier: m[2] } : { base: full, qualifier: '' }
}

const verseRef = (kv: KeyVerseRef) => {
  const cv = `${kv.chapter}${kv.verse ? `:${kv.verse}` : '장'}`
  return kv.book_name_ko ? `${kv.book_name_ko} ${cv}` : cv
}
const verseLink = (kv: KeyVerseRef) => (kv.book_number ? `/bible/${kv.book_number}/${kv.chapter}` : '#')

/** 본문을 풀쿼트 앞·뒤 두 덩이로 — 문단이 여럿이면 첫 문단, 한 문단이면 문장 절반에서 자른다 */
const splitStory = (text: string | null): [string, string] => {
  if (!text) return ['', '']
  const paras = text.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  if (paras.length > 1) return [paras[0], paras.slice(1).join('\n\n')]
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map((t) => t.trim()).filter(Boolean) ?? [text]
  if (sentences.length < 3) return [text.trim(), '']
  const mid = Math.ceil(sentences.length / 2)
  return [sentences.slice(0, mid).join(' '), sentences.slice(mid).join(' ')]
}

export default FigureDetailPanel
