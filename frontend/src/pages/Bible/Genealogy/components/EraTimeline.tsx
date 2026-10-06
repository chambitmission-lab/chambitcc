import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BibleFigureSummary, GenealogyLink } from '../../../../types/bibleFigure'
import { StoryGlyph } from '../../Story/StoryIcons'
import { ERAS, FIGURE_HOOK, JESUS_SLUG, MAJOR_GLYPH, MAJOR_REF, type EraInfo } from '../genealogyStory'

interface EraTimelineProps {
  nodes: BibleFigureSummary[]
  links: GenealogyLink[]
  readingProgress: Record<string, number>
  selectedSlug: string | null
  onSelect: (slug: string) => void
  isLoggedIn: boolean
  /** 검색·역할 필터가 걸려 있으면 세대를 접지 않고 여정 지도도 숨긴다 */
  isFiltered: boolean
}

interface EraGroup {
  key: string
  era: EraInfo
  figures: BibleFigureSummary[]
}

/** 레일 위에 한 줄씩 쌓이는 항목 — 위/아래 선분 색을 앞뒤 항목으로 정확히 칠하려고 평평하게 편다 */
type Item =
  | { kind: 'era'; key: string; group: EraGroup; index: number; done: number; total: number; read: boolean; partial: boolean }
  | { kind: 'major' | 'notable'; key: string; figure: BibleFigureSummary; read: boolean }
  | { kind: 'run'; key: string; figures: BibleFigureSummary[]; read: boolean }
  | { kind: 'finale'; key: string; figure: BibleFigureSummary; read: boolean }

const FALLBACK_ERA: EraInfo = { label: '기타', short: '기타', order: 100, meta: '', story: '', match: () => false }
const NT_ERA = ERAS.find((e) => e.order === 8) ?? FALLBACK_ERA

const eraFor = (figure: BibleFigureSummary): EraInfo => {
  const era = figure.era || ''
  if (era) {
    const found = ERAS.find((e) => e.match(era))
    if (found) return found
    return { ...FALLBACK_ERA, label: era, short: era, order: 99 }
  }
  return figure.testament === 'NEW' ? NT_ERA : FALLBACK_ERA
}

const shortName = (name: string) => name.replace(/\s*\(.+\)/, '')

export const EraTimeline = ({
  nodes,
  links,
  readingProgress,
  selectedSlug,
  onSelect,
  isLoggedIn,
  isFiltered,
}: EraTimelineProps) => {
  const [openRuns, setOpenRuns] = useState<Set<string>>(() => new Set())

  const isRead = (slug: string) => isLoggedIn && (readingProgress[slug] ?? 0) >= 0.999

  const groups = useMemo<EraGroup[]>(() => {
    const map = new Map<string, EraGroup>()
    for (const figure of nodes) {
      const era = eraFor(figure)
      let group = map.get(era.label)
      if (!group) {
        group = { key: era.label, era, figures: [] }
        map.set(era.label, group)
      }
      group.figures.push(figure)
    }
    const arr = Array.from(map.values())
    for (const g of arr) g.figures.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    arr.sort((a, b) => a.era.order - b.era.order || (a.figures[0]?.sort_order ?? 0) - (b.figures[0]?.sort_order ?? 0))
    return arr
  }, [nodes])

  // 아내·어머니는 남편이 화면에 있으면 남편 줄의 칩으로 붙고, 없으면(필터 등) 제 줄로 선다
  const { wivesByHusband, attachedWives } = useMemo(() => {
    const shown = new Map(nodes.map((n) => [n.slug, n]))
    const byHusband = new Map<string, BibleFigureSummary[]>()
    const attached = new Set<string>()
    for (const l of links) {
      if (l.type !== 'spouse') continue
      const wife = shown.get(l.target)
      if (!wife || wife.is_messianic_line || !shown.has(l.source)) continue
      byHusband.set(l.source, [...(byHusband.get(l.source) ?? []), wife])
      attached.add(wife.slug)
    }
    return { wivesByHusband: byHusband, attachedWives: attached }
  }, [nodes, links])

  // 이어 읽을 자리 — 시대순으로 처음 만나는 아직 다 읽지 않은 메시아 라인 인물
  const hereSlug = useMemo(() => {
    if (!isLoggedIn) return null
    const line = groups.flatMap((g) => g.figures).filter((f) => f.is_messianic_line)
    return line.find((f) => (readingProgress[f.slug] ?? 0) < 0.999)?.slug ?? null
  }, [groups, readingProgress, isLoggedIn])

  const items = useMemo<Item[]>(() => {
    const out: Item[] = []
    groups.forEach((group, index) => {
      const figs = group.figures.filter((f) => !attachedWives.has(f.slug))
      const done = isLoggedIn ? group.figures.filter((f) => isRead(f.slug)).length : 0
      const total = group.figures.length
      out.push({ kind: 'era', key: `era-${group.key}`, group, index, done, total, read: isLoggedIn && done === total, partial: done > 0 && done < total })
      let run: BibleFigureSummary[] = []
      const flush = () => {
        if (!run.length) return
        out.push({ kind: 'run', key: `run-${run[0].slug}`, figures: run, read: run.every((f) => isRead(f.slug)) })
        run = []
      }
      for (const f of figs) {
        if (f.slug === JESUS_SLUG) {
          flush()
          out.push({ kind: 'finale', key: f.slug, figure: f, read: isRead(f.slug) })
          continue
        }
        // 이름만 남은 세대 — 필터 중이면 찾은 사람을 접어 숨기지 않는다
        if (!isFiltered && f.is_messianic_line && !FIGURE_HOOK[f.slug]) {
          run.push(f)
          continue
        }
        flush()
        out.push({ kind: MAJOR_GLYPH[f.slug] ? 'major' : 'notable', key: f.slug, figure: f, read: isRead(f.slug) })
      }
      flush()
    })
    return out
    // isRead 는 readingProgress·isLoggedIn 에서만 파생된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, attachedWives, isFiltered, isLoggedIn, readingProgress])

  if (nodes.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-card-dark py-16 text-center text-gray-500 dark:text-white/50 text-[14px]">
        조건에 맞는 인물이 없습니다.
      </div>
    )
  }

  const toggleRun = (key: string) =>
    setOpenRuns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const lineAll = nodes.filter((n) => n.is_messianic_line)
  const lineDone = lineAll.filter((n) => isRead(n.slug)).length
  const hereEra = hereSlug ? groups.findIndex((g) => g.figures.some((f) => f.slug === hereSlug)) : groups.length - 1

  return (
    <div>
      {!isFiltered && groups.length > 1 && (
        <JourneyMap
          groups={groups}
          hereEra={isLoggedIn ? hereEra : null}
          done={lineDone}
          total={lineAll.length}
          isLoggedIn={isLoggedIn}
        />
      )}

      {items.map((it, i) => {
        const next = items[i + 1]
        const topOn = it.read || (it.kind === 'era' && it.partial)
        const botOn = !!next && (next.read || (next.kind === 'era' && next.partial))
        const isHere = 'figure' in it && it.figure.slug === hereSlug
        return (
          <div
            key={it.key}
            className={[
              'gtl-item',
              `gtl-item--${it.kind}`,
              it.read ? 'is-read' : '',
              it.kind === 'era' && it.partial ? 'is-partial' : '',
              isHere ? 'is-here' : '',
            ].join(' ')}
          >
            <div className="gtl-rail" aria-hidden>
              {i > 0 && <span className={`gtl-rail__top${topOn ? ' is-on' : ''}`} />}
              {next && <span className={`gtl-rail__bot${botOn ? ' is-on' : ''}`} />}
              <span className="gtl-dot">
                {it.kind === 'era' ? it.index + 1 : it.kind === 'finale' ? '✦' : null}
              </span>
            </div>
            <div className="gtl-body">
              {it.kind === 'era' && <EraHead item={it} isLoggedIn={isLoggedIn} />}

              {it.kind === 'run' && (
                <div className="gtl-run">
                  <span>
                    ⋯ <b>{it.figures.length}대</b>가 더 이어져요
                  </span>
                  <span>{it.figures.map((f) => shortName(f.name_ko)).join(' · ')}</span>
                  <button type="button" onClick={() => toggleRun(it.key)} aria-expanded={openRuns.has(it.key)}>
                    {openRuns.has(it.key) ? '접기' : '펼치기'}
                  </button>
                  {openRuns.has(it.key) && (
                    <div className="gtl-run__list">
                      {it.figures.map((f) => (
                        <button
                          key={f.slug}
                          type="button"
                          onClick={() => onSelect(f.slug)}
                          className={f.slug === selectedSlug ? 'is-selected' : ''}
                        >
                          {shortName(f.name_ko)}
                          {isRead(f.slug) ? ' ✓' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(it.kind === 'major' || it.kind === 'notable') && (
                <>
                  {isHere && (
                    <div>
                      <button type="button" className="gtl-here" onClick={() => onSelect(it.figure.slug)}>
                        지금 여기 · 이어 읽기
                      </button>
                    </div>
                  )}
                  <FigureEntry
                    figure={it.figure}
                    major={it.kind === 'major'}
                    read={it.read}
                    progress={isLoggedIn ? readingProgress[it.figure.slug] ?? 0 : 0}
                    wives={wivesByHusband.get(it.figure.slug) ?? []}
                    selectedSlug={selectedSlug}
                    onSelect={onSelect}
                  />
                </>
              )}

              {it.kind === 'finale' && (
                <div className={`gtl-finale${it.figure.slug === selectedSlug ? ' is-selected' : ''}`}>
                  <button type="button" className="gtl-finale__main" onClick={() => onSelect(it.figure.slug)}>
                    <small>이 계보가 향하던 곳</small>
                    <span className="gtl-finale__name">{shortName(it.figure.name_ko)}</span>
                    <p>
                      “여자의 후손이 네 머리를 상하게 할 것이요”(창 3:15) — 에덴에서 하신 첫 약속이
                      세대를 지나 마침내 이루어졌어요.
                    </p>
                  </button>
                  <Link to="/bible/40/1" className="gtl-finale__cta">
                    마태복음 1장 읽기 →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const JourneyMap = ({
  groups,
  hereEra,
  done,
  total,
  isLoggedIn,
}: {
  groups: EraGroup[]
  hereEra: number | null
  done: number
  total: number
  isLoggedIn: boolean
}) => {
  const pos = (i: number) => (groups.length > 1 ? (i / (groups.length - 1)) * 100 : 0)
  return (
    <div className="gtl-map">
      <div className="gtl-map__top">
        <b>아담에서 예수까지</b>
        <span>
          {isLoggedIn ? (
            <>
              <em>{done}</em> / {total}명 만났어요
            </>
          ) : (
            <>{total}명의 약속의 계보</>
          )}
        </span>
      </div>
      <div className="gtl-track">
        <span className="gtl-track__base" />
        {hereEra !== null && <span className="gtl-track__fill" style={{ width: `${pos(hereEra)}%` }} />}
        {groups.map((g, i) => (
          <span
            key={g.key}
            className={`gtl-tick${hereEra !== null && i <= hereEra ? ' is-on' : ''}`}
            style={{ left: `${pos(i)}%` }}
          >
            <i />
            <span>{g.era.short}</span>
          </span>
        ))}
        {hereEra !== null && (
          <span className="gtl-you" style={{ left: `${pos(hereEra)}%` }}>
            나
          </span>
        )}
      </div>
    </div>
  )
}

const EraHead = ({ item, isLoggedIn }: { item: Extract<Item, { kind: 'era' }>; isLoggedIn: boolean }) => {
  const { era } = item.group
  return (
    <>
      <div className="gtl-era__over">
        ERA {String(item.index + 1).padStart(2, '0')}
        {era.meta ? ` · ${era.meta}` : ''}
      </div>
      <h3 className="gtl-era__title">{era.label}</h3>
      {era.story && <p className="gtl-era__story">{era.story}</p>}
      {isLoggedIn ? (
        <div className="gtl-era__prog">
          <span className="gtl-era__bar">
            <i style={{ width: `${item.total ? (item.done / item.total) * 100 : 0}%` }} />
          </span>
          <span>
            {item.total}명 중 {item.done}명 읽음
          </span>
        </div>
      ) : (
        <div className="gtl-era__prog">
          <span>{item.total}명</span>
        </div>
      )}
    </>
  )
}

interface FigureEntryProps {
  figure: BibleFigureSummary
  major: boolean
  read: boolean
  progress: number
  wives: BibleFigureSummary[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
}

const FigureEntry = ({ figure, major, read, progress, wives, selectedSlug, onSelect }: FigureEntryProps) => {
  const isWoman = !figure.is_messianic_line && figure.gender === 'female'
  const hook = FIGURE_HOOK[figure.slug] ?? figure.role ?? ''
  const ref = MAJOR_REF[figure.slug]
  const selected = figure.slug === selectedSlug

  const tags = (
    <>
      {read ? (
        <span className="gtl-tag gtl-tag--ok">✓ 읽음</span>
      ) : progress > 0 ? (
        <span className="gtl-tag gtl-tag--ok">진도 {Math.round(progress * 100)}%</span>
      ) : null}
      {isWoman && <span className="gtl-tag gtl-tag--w">아내·어머니</span>}
      {ref && <span className="gtl-tag">{ref}</span>}
    </>
  )
  // 아내 칩은 카드 버튼 안에 중첩할 수 없어 카드 밖 별도 줄로 둔다
  const wifeChips = wives.length > 0 && (
    <div className={`gtl-wives${major ? ' gtl-wives--card' : ''}`}>
      {wives.map((w) => (
        <button
          key={w.slug}
          type="button"
          onClick={() => onSelect(w.slug)}
          className={`gtl-tag gtl-tag--w${w.slug === selectedSlug ? ' is-selected' : ''}`}
        >
          ♥ {shortName(w.name_ko)}
        </button>
      ))}
    </div>
  )
  const hasTags = read || progress > 0 || isWoman || !!ref

  const names = (
    <span className="gtl-name-row">
      <span className="gtl-name">{shortName(figure.name_ko)}</span>
      {figure.name_en && <span className="gtl-en">{figure.name_en}</span>}
    </span>
  )

  if (major) {
    return (
      <div className={`gtl-card${selected ? ' is-selected' : ''}`}>
        <button type="button" className="gtl-card__main" onClick={() => onSelect(figure.slug)}>
          <span className="gtl-glyph">
            <StoryGlyph emoji={MAJOR_GLYPH[figure.slug]} size={28} />
          </span>
          <span className="min-w-0 flex-1">
            {names}
            {hook && <span className="gtl-hook">{hook}</span>}
            {hasTags && <span className="gtl-tags">{tags}</span>}
          </span>
        </button>
        {wifeChips}
      </div>
    )
  }

  return (
    <div className="gtl-row-wrap">
      <button
        type="button"
        className={`gtl-row${selected ? ' is-selected' : ''}${isWoman ? ' is-woman' : ''}`}
        onClick={() => onSelect(figure.slug)}
      >
        {names}
        {hook && <span className="gtl-hook">{hook}</span>}
        {hasTags && <span className="gtl-tags">{tags}</span>}
      </button>
      {wifeChips}
    </div>
  )
}

export default EraTimeline
