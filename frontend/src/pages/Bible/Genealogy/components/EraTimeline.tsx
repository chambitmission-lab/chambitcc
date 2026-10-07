import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { BibleFigureSummary, GenealogyLink } from '../../../../types/bibleFigure'
import { StoryGlyph } from '../../Story/StoryIcons'
import {
  Check,
  Crown,
  Flame,
  FlowerLotus,
  Grains,
  Medal,
  MoonStars,
  Scroll,
  StarFour,
  Tent,
  TreasureChest,
  Tree,
  User,
  Wall,
  type Icon,
} from '../../../../components/icons/phosphor'
import chambiJoy from '../../../../components/chatbot/img/joy.webp'
import { smoothScrollToElement } from '../../../../utils/scrollTo'
import { ERAS, FIGURE_HOOK, JESUS_SLUG, MAJOR_GLYPH, MAJOR_REF, type EraInfo } from '../genealogyStory'

/**
 * 시대순 = "말씀 오솔길" — 듀오링고 학습 경로처럼 시대마다 색 배너를 세우고,
 * 인물을 누르는 동그란 버튼으로 지그재그로 잇는다. 읽은 길은 시대 색 실선, 남은 길은 점선.
 * 위쪽 시대 징검다리(9칸)는 시대별 진도·현재 위치를 보여 주고 누르면 그 시대로 건너뛴다.
 */

interface EraTimelineProps {
  nodes: BibleFigureSummary[]
  links: GenealogyLink[]
  readingProgress: Record<string, number>
  selectedSlug: string | null
  onSelect: (slug: string) => void
  isLoggedIn: boolean
  /** 검색·역할 필터가 걸려 있으면 세대를 접지 않고 시대 징검다리도 숨긴다 */
  isFiltered: boolean
}

interface EraGroup {
  key: string
  era: EraInfo
  figures: BibleFigureSummary[]
}

/** 오솔길 위 한 칸 — x 는 지그재그 가로 위치(-1.5~1.5, CSS 에서 진폭을 곱한다) */
type Step =
  | { kind: 'figure'; key: string; x: number; figure: BibleFigureSummary; major: boolean }
  | { kind: 'run'; key: string; x: number; figures: BibleFigureSummary[] }
  | { kind: 'finale'; key: string; x: number; figure: BibleFigureSummary }
  | { kind: 'chest'; key: string; x: number }

interface Section {
  group: EraGroup
  index: number
  steps: Step[]
  done: number
  total: number
}

const FALLBACK_ERA: EraInfo = { label: '기타', short: '기타', order: 100, color: '#8b95a1', deep: '#6b7684', meta: '', story: '', match: () => false }
const NT_ERA = ERAS.find((e) => e.order === 8) ?? FALLBACK_ERA

/** 시대 배너·징검다리 아이콘 (ERAS.order 기준) */
const ERA_ICON: Record<number, Icon> = {
  0: Tree,
  1: Tent,
  2: Flame,
  3: Grains,
  4: Crown,
  5: Scroll,
  6: Wall,
  7: MoonStars,
  8: StarFour,
}

/** 버튼이 좌우로 흔들리는 순서 — 듀오링고 경로의 완만한 S자 */
const ZIGZAG = [0, 1, 1.5, 1, 0, -1, -1.5, -1]

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
const eraNo = (i: number) => String(i + 1).padStart(2, '0')

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

  // 아내·어머니는 남편이 화면에 있으면 남편 버튼 아래 칩으로 붙고, 없으면(필터 등) 제 버튼으로 선다
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

  const sections = useMemo<Section[]>(() => {
    let k = 0
    const nextX = () => ZIGZAG[k++ % ZIGZAG.length]
    return groups.map((group, index) => {
      const steps: Step[] = []
      let run: BibleFigureSummary[] = []
      const flush = () => {
        if (!run.length) return
        steps.push({ kind: 'run', key: `run-${run[0].slug}`, x: nextX(), figures: run })
        run = []
      }
      let hasFinale = false
      for (const f of group.figures) {
        if (attachedWives.has(f.slug)) continue
        if (f.slug === JESUS_SLUG) {
          flush()
          steps.push({ kind: 'finale', key: f.slug, x: 0, figure: f })
          hasFinale = true
          continue
        }
        // 이름만 남은 세대 — 필터 중이면 찾은 사람을 접어 숨기지 않는다
        if (!isFiltered && f.is_messianic_line && !FIGURE_HOOK[f.slug]) {
          run.push(f)
          continue
        }
        flush()
        steps.push({ kind: 'figure', key: f.slug, x: nextX(), figure: f, major: !!MAJOR_GLYPH[f.slug] })
      }
      flush()
      // 시대 끝 보물상자 — 로그인해야 진도가 있고, 예수님이 있는 마지막 시대는 피날레가 끝을 맺는다
      if (isLoggedIn && !hasFinale && !isFiltered) steps.push({ kind: 'chest', key: `chest-${group.key}`, x: nextX() })
      const done = isLoggedIn ? group.figures.filter((f) => isRead(f.slug)).length : 0
      return { group, index, steps, done, total: group.figures.length }
    })
    // isRead 는 readingProgress·isLoggedIn 에서만 파생된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, attachedWives, isFiltered, isLoggedIn, readingProgress])

  // 시대 징검다리 — 지금 보고 있는 시대를 스크롤로 따라간다
  const sectionRefs = useRef<(HTMLElement | null)[]>([])
  const barRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [viewEra, setViewEra] = useState(0)
  const showStones = !isFiltered && sections.length > 1
  useEffect(() => {
    if (!showStones) return
    let frame = 0
    const measure = () => {
      frame = 0
      const limit = (barRef.current?.getBoundingClientRect().bottom ?? 120) + 48
      let cur = 0
      // 바닥에 닿으면 마지막 시대는 위까지 못 올라오므로, 화면 안에 들어온 시대 중 마지막을 고른다
      const atBottom = (rootRef.current?.getBoundingClientRect().bottom ?? Infinity) <= window.innerHeight + 8
      sectionRefs.current.forEach((el, i) => {
        const top = el?.getBoundingClientRect().top ?? Infinity
        if (top <= limit || (atBottom && top < window.innerHeight * 0.6)) cur = i
      })
      setViewEra(cur)
    }
    // 실제 스크롤 요소가 body 라 캡처 단계로 받는다
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }
    measure()
    document.addEventListener('scroll', onScroll, true)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      document.removeEventListener('scroll', onScroll, true)
    }
  }, [showStones, sections.length])

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
  const hereEra = hereSlug ? sections.findIndex((s) => s.group.figures.some((f) => f.slug === hereSlug)) : -1

  // scrollIntoView(smooth) 는 body 스크롤 구조에서 모바일이 조용히 실패한다 — 스크롤러를 직접 민다.
  // 배너가 붙은 징검다리 바로 아래(헤더 56 + 간격 8 + 바 높이 + 12)에 오게 한다
  const jumpTo = (i: number) =>
    smoothScrollToElement(sectionRefs.current[i], {
      offset: 64 + (barRef.current?.getBoundingClientRect().height ?? 100) + 12,
    })

  return (
    <div ref={rootRef} className="gtr">
      {showStones && (
        <div ref={barRef} className="gtr-stones-bar">
          <div className="gtr-stones-bar__top">
            <b>아담에서 예수까지</b>
            <span>
              {isLoggedIn ? (
                <>
                  <em>{lineDone}</em> / {lineAll.length}명 만났어요
                </>
              ) : (
                <>{lineAll.length}명의 약속의 계보</>
              )}
            </span>
          </div>
          <div className="gtr-stones">
            {sections.map((s, i) => {
              const ratio = s.total ? s.done / s.total : 0
              const full = isLoggedIn && ratio >= 1
              return (
                <button
                  key={s.group.key}
                  type="button"
                  onClick={() => jumpTo(i)}
                  title={`${s.group.era.label}${isLoggedIn ? ` · ${s.done}/${s.total}명` : ''}`}
                  aria-label={`${s.group.era.label}로 이동`}
                  className={['gtr-stone', full ? 'is-full' : '', i === viewEra ? 'is-view' : ''].join(' ')}
                  style={
                    {
                      '--era': s.group.era.color,
                      '--era-deep': s.group.era.deep,
                      '--p': `${(isLoggedIn ? ratio : 0) * 100}%`,
                    } as CSSProperties
                  }
                >
                  <span className="gtr-stone__fill" />
                  <span className="gtr-stone__label">
                    {full && <Check size={10} weight="bold" />}
                    {s.group.era.short}
                  </span>
                  {/* 채움이 덮은 구간만 흰 글자로 — 시대 색 위 회색 글자 대비 보정 */}
                  <span className="gtr-stone__label is-on" aria-hidden>
                    {full && <Check size={10} weight="bold" />}
                    {s.group.era.short}
                  </span>
                  {i === hereEra && <span className="gtr-stone__me">나</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {sections.map((s, i) => {
        const { era } = s.group
        const EraIcon = ERA_ICON[era.order] ?? StarFour
        const complete = isLoggedIn && s.done >= s.total
        return (
          <section
            key={s.group.key}
            ref={(el) => {
              sectionRefs.current[i] = el
            }}
            className="gtr-era"
            style={{ '--era': era.color, '--era-deep': era.deep } as CSSProperties}
          >
            <header className="gtr-banner">
              <span className="gtr-banner__pill">
                {isLoggedIn ? (complete ? '완주 ✓' : `${s.done}/${s.total}명`) : `${s.total}명`}
              </span>
              <small>
                ERA {eraNo(i)}
                {era.meta ? ` · ${era.meta}` : ''}
              </small>
              <h3>{era.label}</h3>
              {era.story && <p>{era.story}</p>}
              <EraIcon className="gtr-banner__art" size={104} weight="duotone" aria-hidden />
            </header>

            <TrailPath>
              {s.steps.map((step) => {
                const style = { '--x': step.x } as CSSProperties
                if (step.kind === 'chest') {
                  return (
                    <div key={step.key} className="gtr-node" style={style} data-lit={complete || undefined}>
                      <span className={`gtr-chest gtr-anchor${complete ? ' is-open' : ''}`} aria-hidden>
                        {complete ? <Medal size={34} weight="duotone" /> : <TreasureChest size={34} weight="duotone" />}
                      </span>
                      <span className="gtr-label gtr-label--muted">
                        {complete ? '시대 완주!' : `${s.total - s.done}명 더 만나면 완주`}
                      </span>
                    </div>
                  )
                }

                if (step.kind === 'finale') {
                  const f = step.figure
                  return (
                    <div key={step.key} className="gtr-node gtr-node--finale" style={style} data-lit={!isLoggedIn || isRead(f.slug) || f.slug === hereSlug || undefined}>
                      <div className={`gtr-finale${f.slug === selectedSlug ? ' is-selected' : ''}`}>
                        <button type="button" className="gtr-finale__star gtr-anchor" onClick={() => onSelect(f.slug)} aria-label={shortName(f.name_ko)}>
                          <StarFour size={44} weight="duotone" />
                        </button>
                        <small>이 계보가 향하던 곳</small>
                        <span className="gtr-finale__name">{shortName(f.name_ko)}</span>
                        <p>
                          “여자의 후손이 네 머리를 상하게 할 것이요”(창 3:15) — 에덴에서 하신 첫 약속이
                          세대를 지나 마침내 이루어졌어요.
                        </p>
                        <Link to="/bible/40/1" className="gtr-finale__cta">
                          마태복음 1장 읽기 →
                        </Link>
                      </div>
                    </div>
                  )
                }

                if (step.kind === 'run') {
                  const read = step.figures.every((f) => isRead(f.slug))
                  const here = step.figures.find((f) => f.slug === hereSlug)
                  const open = openRuns.has(step.key)
                  const lit = !isLoggedIn || read || !!here
                  return (
                    <div key={step.key} className="gtr-node" style={style} data-lit={lit || undefined}>
                      {here && <HereTip name={shortName(here.name_ko)} />}
                      <button
                        type="button"
                        className={`gtr-btn gtr-btn--run gtr-anchor${lit ? '' : ' is-locked'}${here ? ' is-here' : ''}`}
                        onClick={() => toggleRun(step.key)}
                        aria-expanded={open}
                      >
                        +{step.figures.length}대
                      </button>
                      <span className="gtr-label gtr-label--muted gtr-label--wrap">
                        {step.figures.map((f) => shortName(f.name_ko)).join(' · ')}
                      </span>
                      {here && <Mascot left={step.x > 0} />}
                      {open && (
                        <div className="gtr-run-list">
                          {step.figures.map((f) => (
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
                  )
                }

                const f = step.figure
                const read = isRead(f.slug)
                const here = f.slug === hereSlug
                const lit = !isLoggedIn || read || here
                const progress = isLoggedIn ? Math.min(1, readingProgress[f.slug] ?? 0) : 0
                const isWoman = !f.is_messianic_line && f.gender === 'female'
                const wives = wivesByHusband.get(f.slug) ?? []
                const hook = FIGURE_HOOK[f.slug] ?? f.role ?? ''
                const ref = MAJOR_REF[f.slug]
                return (
                  <div key={step.key} className={`gtr-node${step.major ? ' gtr-node--major' : ''}`} style={style} data-lit={lit || undefined}>
                    {here && <HereTip />}
                    <button
                      type="button"
                      onClick={() => onSelect(f.slug)}
                      aria-label={shortName(f.name_ko)}
                      className={[
                        'gtr-btn gtr-anchor',
                        step.major ? 'gtr-btn--major' : '',
                        lit ? '' : 'is-locked',
                        here ? 'is-here' : '',
                        f.slug === selectedSlug ? 'is-selected' : '',
                      ].join(' ')}
                      style={!lit && progress > 0 ? ({ '--p': `${progress * 360}deg` } as CSSProperties) : undefined}
                    >
                      {!lit && progress > 0 && <span className="gtr-btn__ring" aria-hidden />}
                      {step.major ? (
                        <StoryGlyph emoji={MAJOR_GLYPH[f.slug]} size={36} />
                      ) : isWoman ? (
                        <FlowerLotus size={28} weight="duotone" />
                      ) : (
                        <User size={28} weight="duotone" />
                      )}
                      {read && step.major && (
                        <span className="gtr-btn__check" aria-hidden>
                          <Check size={13} weight="bold" />
                        </span>
                      )}
                    </button>
                    <span className={`gtr-label${isWoman ? ' is-woman' : ''}`}>
                      {shortName(f.name_ko)}
                      {step.major && hook && <small>{hook}</small>}
                      {step.major && ref && <small className="gtr-label__ref">{ref}</small>}
                    </span>
                    {wives.length > 0 && (
                      <span className="gtr-wives">
                        {wives.map((w) => (
                          <button
                            key={w.slug}
                            type="button"
                            onClick={() => onSelect(w.slug)}
                            className={w.slug === selectedSlug ? 'is-selected' : ''}
                          >
                            ♥ {shortName(w.name_ko)}
                            {isRead(w.slug) ? ' ✓' : ''}
                          </button>
                        ))}
                      </span>
                    )}
                    {here && <Mascot left={step.x > 0} />}
                  </div>
                )
              })}
            </TrailPath>
          </section>
        )
      })}
    </div>
  )
}

/** 참비 — 지금 여기 버튼 옆, 지그재그 바깥쪽으로 비켜 선다 */
const Mascot = ({ left }: { left: boolean }) => (
  <img className={`gtr-mascot${left ? ' is-left' : ''}`} src={chambiJoy} alt="" aria-hidden width={64} height={64} />
)

/** 지금 여기 말풍선 — 버튼 위에 통통 뜬다 */
const HereTip = ({ name }: { name?: string }) => (
  <span className="gtr-here">
    지금 여기{name ? ` · ${name}` : ''} · 이어 읽기
  </span>
)

/**
 * 오솔길 — 자식 .gtr-node 의 .gtr-anchor 중심끼리 굽은 선으로 잇는다.
 * 좌표는 offset* 로 잰다(getBoundingClientRect 는 PC 글씨 크기 zoom 배율이 섞인다).
 * 다음 버튼이 밝혀졌으면(data-lit) 시대 색 실선, 아니면 점선.
 */
const TrailPath = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [segs, setSegs] = useState<{ d: string; lit: boolean }[]>([])

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const centerOf = (el: HTMLElement) => {
      let x = el.offsetWidth / 2
      let y = el.offsetHeight / 2
      let cur: HTMLElement | null = el
      while (cur && cur !== root) {
        x += cur.offsetLeft
        y += cur.offsetTop
        cur = cur.offsetParent as HTMLElement | null
      }
      return { x, y }
    }
    const draw = () => {
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(':scope > .gtr-node'))
      const pts = nodes.flatMap((n) => {
        const a = n.querySelector<HTMLElement>('.gtr-anchor')
        return a ? [{ ...centerOf(a), lit: n.dataset.lit !== undefined }] : []
      })
      const next: { d: string; lit: boolean }[] = []
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]
        const b = pts[i + 1]
        const m = (b.y - a.y) / 2
        next.push({ d: `M${a.x},${a.y} C${a.x},${a.y + m} ${b.x},${b.y - m} ${b.x},${b.y}`, lit: b.lit })
      }
      setSegs(next)
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(root)
    return () => ro.disconnect()
  }, [children])

  return (
    <div ref={ref} className="gtr-path">
      <svg className="gtr-path__svg" aria-hidden>
        {segs.map((s, i) =>
          s.lit ? (
            <path key={i} d={s.d} className="gtr-seg gtr-seg--lit" />
          ) : (
            <path key={i} d={s.d} className="gtr-seg" />
          ),
        )}
      </svg>
      {children}
    </div>
  )
}

export default EraTimeline
