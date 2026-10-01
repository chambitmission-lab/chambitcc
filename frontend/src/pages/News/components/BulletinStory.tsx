// 디지털 주보 — 넘겨보기(스토리) 화면. 한 장에 한 가지씩, 음미하며 넘겨 보는 주보.
// PC: 왼쪽 목차 + 큰 무대(← → 키) / 모바일: 진행 막대 + 화면 좌우 탭·스와이프.
// 장 구성은 BulletinData 에서 그때그때 만든다 — 비어 있는 섹션은 장을 만들지 않는다.
// 편집은 기존 DigitalBulletin(인라인 편집·PC 편집기)이 맡는다.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { BulletinData, ExtraBlock } from '../../../types/digitalBulletin'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useTheme } from '../../../contexts/ThemeContext'
import { useThemeArt } from '../../../hooks/useThemeArt'
import { WORSHIP_HERO } from '../../../utils/themeAssets'
import { getNaturalSeason, type NaturalSeason } from '../../../utils/naturalSeason'
import { copyToClipboard } from '../../../utils/clipboard'
import { showToast } from '../../../utils/toast'
import { HandHeartIcon } from '../../../components/icons/ActionIcons'
import { CalendarIcon, ChurchIcon, CopyIcon, MegaphoneIcon, PeopleIcon, SparkleIcon } from './NewsIcons'
import { extrasOf } from './bulletinExtras'
import { bulletinCoverArt, bulletinSeasonArt, bulletinSeasonThumb } from './bulletinSeasonArt'
import coverSpring from '../../../assets/hero/spring-morning.webp'
import coverSummer from '../../../assets/hero/morning.webp'
import coverAutumn from '../../../assets/hero/autumn-morning.webp'
import coverWinter from '../../../assets/hero/winter-morning.webp'
import './bulletinStory.css'

const COVER: Record<NaturalSeason, string> = {
  spring: coverSpring,
  summer: coverSummer,
  autumn: coverAutumn,
  winter: coverWinter,
}

type Tone = 'cover' | 'blue' | 'deep' | 'paper' | 'end'

interface Slide {
  key: string
  title: string
  tone: Tone
  body: ReactNode
}

/* ── 데이터 다듬기 ─────────────────────────────── */

/** "오전 9:30" · "오후 1:30" · "13:30" → 자정부터 분 */
const toMinutes = (time: string): number | null => {
  const m = time.match(/(오전|오후)?\s*(\d{1,2}):(\d{2})/)
  if (!m) return null
  let h = Number(m[2])
  if (m[1]) h = (h % 12) + (m[1] === '오후' ? 12 : 0)
  return h * 60 + Number(m[3])
}

/** 예배 한 번을 이만큼(분)으로 본다 — '예배 중' 표시 구간 */
const SERVICE_SPAN = 75

/** 종이 주보에서 옮겨 온 "1. " 같은 머리 번호 — 장에서 번호를 따로 붙이므로 뗀다 */
const stripLeadingNo = (s: string) => s.replace(/^\s*(\d+\s*[.)]|[①-⑳])\s*/, '')

const splitSlash = (s: string) =>
  s
    .split('/')
    .map(x => x.trim())
    .filter(Boolean)

/** 계좌처럼 보이는 줄 — "감사 / 농협 301-0252-3538-91" */
const ACCOUNT_LINE = /\d{2,}[-\s]\d{2,}/
interface AccountLine {
  label: string
  value: string
}
const parseAccountLines = (content: string): AccountLine[] | null => {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0 || !lines.every(l => ACCOUNT_LINE.test(l))) return null
  return lines.map(l => {
    const [head, ...rest] = l.split('/')
    return rest.length ? { label: head.trim(), value: rest.join('/').trim() } : { label: '', value: l }
  })
}

/** 찬송 "456장 / 15장" → [456, 15]. 숫자가 없으면 빈 배열 */
const hymnNumbers = (offering: string): number[] =>
  splitSlash(offering)
    .map(h => Number(h.match(/\d+/)?.[0]))
    .filter(n => Number.isFinite(n) && n > 0)

/** 퀴즈 보기 — 정답 둘레의 그럴듯한 번호 두 개를 섞는다(날짜로 고정해 다시 열어도 같은 순서) */
const quizChoices = (answer: number, seed: string): number[] => {
  const pool = [answer + 12, answer - 9, answer + 27, answer - 21, answer + 5].filter(n => n > 0 && n <= 645 && n !== answer)
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const picks = [pool[h % pool.length], pool[(h + 2) % pool.length]]
  const uniq = [...new Set(picks)]
  while (uniq.length < 2) uniq.push(answer + 3 + uniq.length)
  const all = [answer, ...uniq]
  const rot = h % 3
  return [...all.slice(rot), ...all.slice(0, rot)]
}

const DONE_KEY = 'bulletin-story-done'
const readDone = (): string | null => {
  try {
    return localStorage.getItem(DONE_KEY)
  } catch {
    return null
  }
}
const writeDone = (date: string) => {
  try {
    localStorage.setItem(DONE_KEY, date)
  } catch {
    // 사생활 보호 모드 등 — 완독 표시만 못 남길 뿐
  }
}

const isInteractive = (el: EventTarget | null) =>
  el instanceof Element && el.closest('button, a, input, textarea, select, [role="button"]') != null

/* ── 컴포넌트 ─────────────────────────────────── */

interface BulletinStoryProps {
  data: BulletinData
}

const BulletinStory = ({ data }: BulletinStoryProps) => {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  useThemeArt(WORSHIP_HERO)
  const sheepChurch = isDark ? WORSHIP_HERO.dark : WORSHIP_HERO.light

  const [cur, setCur] = useState(0)
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]))
  const [openNews, setOpenNews] = useState<number | null>(0)
  const [prayed, setPrayed] = useState<Set<number>>(() => new Set())
  const [quiz, setQuiz] = useState<{ wrong: number | null; solved: boolean }>({ wrong: null, solved: false })
  const [doneDate, setDoneDate] = useState<string | null>(readDone)
  const rootRef = useRef<HTMLDivElement>(null)
  // 장 수는 아래 slides 에서 정해진다 — go 가 늘 최신 장 수로 자르도록 ref 로 건넨다
  const totalRef = useRef(1)
  const go = useCallback((n: number) => {
    setCur(prev => {
      const next = Math.max(0, Math.min(totalRef.current - 1, n))
      if (next !== prev) setSeen(s => new Set(s).add(next))
      return next
    })
  }, [])

  const now = new Date()
  const season = getNaturalSeason(now)
  // 설교 장에 계절 배경이 깔리면 양 교회 삽화는 뺀다 — 배경 장면과 한 화면에서 부딪친다
  const sermonArt = bulletinSeasonArt(season, 'sermon', isDark)
  const isSunday = now.getDay() === 0
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const copy = async (text: string, label: string) => {
    const ok = await copyToClipboard(text)
    showToast(ok ? t('newsStoryCopied').replace('{label}', label) : t('newsStoryCopyFailed'), ok ? 'success' : 'error')
  }

  const motto = data.title.replace(/^\s*\d{4}\s*표어\s*\n/, '')
  const verseRef = data.subtitle.replace(/^\s*\(|\)\s*$/g, '')
  const hymns = hymnNumbers(data.worship.offering)
  const prayers = splitSlash(data.worship.prayer)
  const choices = hymns.length ? quizChoices(hymns[0], data.date) : []

  // 예배 시간 — 주일에만 '예배 중'·'다음' 표시
  const schedule = data.worship.schedule
  let liveIdx = -1
  let nextIdx = -1
  if (isSunday) {
    schedule.forEach((s, i) => {
      const st = toMinutes(s.time)
      if (st == null) return
      if (nowMin >= st && nowMin < st + SERVICE_SPAN) liveIdx = i
      else if (st > nowMin && nextIdx === -1) nextIdx = i
    })
  }
  const worshipHeading =
    liveIdx >= 0
      ? t('newsStoryWorshipLive').replace('{name}', schedule[liveIdx].name)
      : nextIdx >= 0
        ? t('newsStoryWorshipNext').replace('{name}', schedule[nextIdx].name)
        : t('newsStoryWorshipDefault')

  const renderExtra = (block: ExtraBlock) => {
    if (block.kind === 'list') {
      return (
        <ol className="bs-list">
          {block.items.filter(Boolean).map((item, i) => (
            <li key={i} className="bs-item">
              <span className="bs-no">{i + 1}</span>
              <span className="bs-item-text">{stripLeadingNo(item)}</span>
            </li>
          ))}
        </ol>
      )
    }
    if (block.kind === 'table') {
      // 한 줄짜리 표(봉사표)는 열마다 카드로, 여러 줄이면 표로
      if (block.rows.length === 1) {
        return (
          <div className="bs-cells">
            {block.columns.map((col, i) => (
              <div key={i} className="bs-cell">
                <span className="bs-cell-label">{col}</span>
                <b className="bs-cell-value">{block.rows[0][i] || '—'}</b>
              </div>
            ))}
          </div>
        )
      }
      return (
        <div className="bs-table-wrap">
          <table className="bs-table">
            <thead>
              <tr>
                {block.columns.map((c, i) => (
                  <th key={i}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, ri) => (
                <tr key={ri}>
                  {block.columns.map((_, ci) => (
                    <td key={ci}>{r[ci]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    const accounts = parseAccountLines(block.content)
    if (accounts) {
      return (
        <div className="bs-list">
          {accounts.map((a, i) => (
            <button key={i} type="button" className="bs-account" onClick={() => copy(a.value, a.label || a.value)}>
              {a.label && <span className="bs-account-label">{a.label}</span>}
              <span className="bs-account-value">{a.value}</span>
              <span className="bs-account-copy">
                <CopyIcon width={14} height={14} />
                {t('newsStoryCopy')}
              </span>
            </button>
          ))}
        </div>
      )
    }
    return <p className="bs-note">{block.content}</p>
  }

  const slides: Slide[] = useMemo(() => {
    const out: Slide[] = []

    out.push({
      key: 'cover',
      title: t('newsStoryCover'),
      tone: 'cover',
      body: (
        <>
          <span className="bs-kicker">{t('newsStoryCoverKicker').replace('{date}', data.date)}</span>
          <h2 className="bs-motto">{motto}</h2>
          {verseRef && <p className="bs-verse-ref">{verseRef}</p>}
          <button type="button" className="bs-start" onClick={() => go(1)}>
            {t('newsStoryStart')} <span aria-hidden="true">→</span>
          </button>
        </>
      ),
    })

    if (schedule.length) {
      out.push({
        key: 'worship',
        title: t('newsStoryWorship'),
        tone: 'blue',
        body: (
          <>
            <span className="bs-kicker">
              <ChurchIcon width={16} height={16} /> {t('newsStoryWorship')}
            </span>
            <h2 className="bs-heading">{worshipHeading}</h2>
            <div className="bs-times">
              {schedule.map((s, i) => (
                <div
                  key={i}
                  className={['bs-time', i === liveIdx && 'is-live', i === nextIdx && liveIdx < 0 && 'is-next']
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className="bs-time-name">
                    {s.name}
                    {i === liveIdx && <span className="bs-live">{t('newsStoryLive')}</span>}
                    {i === nextIdx && liveIdx < 0 && <span className="bs-next">{t('newsStoryNextBadge')}</span>}
                  </div>
                  <div className="bs-time-at">{s.time}</div>
                  <div className="bs-time-by">{s.preacher}</div>
                </div>
              ))}
            </div>
          </>
        ),
      })
    }

    const sermon = data.worship.sermon
    if (sermon.title || hymns.length || data.worship.offering) {
      out.push({
        key: 'sermon',
        title: t('newsStorySermon'),
        tone: 'paper',
        body: (
          <>
            <span className="bs-kicker">
              <SparkleIcon width={16} height={16} /> {t('newsStorySermon')}
            </span>
            {sermon.title && <h2 className="bs-heading bs-serif">{sermon.title}</h2>}
            {sermon.subtitle && <p className="bs-sub">{sermon.subtitle}</p>}
            {!sermonArt && <img className="bs-sermon-art" src={sheepChurch} alt="" aria-hidden="true" />}
            {hymns.length > 0 ? (
              <div className="bs-hymns" aria-label={t('newsStoryHymnTitle')}>
                <span className="bs-hymns-label">{t('newsStoryHymnTitle')}</span>
                <div className="bs-hymns-row">
                  {hymns.map((n, i) => (
                    <div key={i} className="bs-hymn">
                      <b>{n}</b>
                      <span>{t('newsStoryHymnUnit')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              data.worship.offering && <p className="bs-sub">{data.worship.offering}</p>
            )}
          </>
        ),
      })
    }

    if (prayers.length) {
      out.push({
        key: 'prayer',
        title: t('newsStoryPrayer'),
        tone: 'deep',
        body: (
          <>
            <span className="bs-kicker">
              <HandHeartIcon size={16} /> {t('newsStoryPrayer')}
            </span>
            <h2 className="bs-heading">{t('newsStoryPrayerTitle')}</h2>
            <div className="bs-people">
              {prayers.map((p, i) => (
                <div key={i} className="bs-person">
                  <span className="bs-avatar" aria-hidden="true">
                    {p[0]}
                  </span>
                  <b className="bs-person-name">{p}</b>
                  <button
                    type="button"
                    className={`bs-pray${prayed.has(i) ? ' is-on' : ''}`}
                    aria-pressed={prayed.has(i)}
                    onClick={() => setPrayed(prev => new Set(prev).add(i))}
                  >
                    <HandHeartIcon size={16} filled={prayed.has(i)} />
                    {prayed.has(i) ? t('newsStoryPrayed') : t('newsStoryPrayWith')}
                  </button>
                </div>
              ))}
            </div>
          </>
        ),
      })
    }

    if (data.announcements.length) {
      out.push({
        key: 'news',
        title: t('newsStoryNews'),
        tone: 'paper',
        body: (
          <>
            <span className="bs-kicker">
              <MegaphoneIcon width={16} height={16} /> {t('newsStoryNews')} ·{' '}
              {t('newsStoryCount').replace('{n}', String(data.announcements.length))}
            </span>
            <h2 className="bs-heading">{t('newsStoryNewsTitle')}</h2>
            <div className="bs-list">
              {data.announcements.map((a, i) => {
                const open = openNews === i
                return (
                  <div key={i} className={`bs-item bs-acc${open ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      className="bs-acc-head"
                      aria-expanded={open}
                      onClick={() => setOpenNews(open ? null : i)}
                    >
                      <span className="bs-no">{i + 1}</span>
                      <span className="bs-item-text bs-strong">{stripLeadingNo(a.title)}</span>
                      {a.content && <span className="bs-chev" aria-hidden="true" />}
                    </button>
                    {a.content && <div className="bs-acc-body">{a.content}</div>}
                  </div>
                )
              })}
            </div>
          </>
        ),
      })
    }

    extrasOf(data)
      .filter(b => b.title || b.items.some(Boolean) || b.rows.length || b.content)
      .forEach((block, i) => {
        out.push({
          key: `extra-${i}`,
          title: block.title || t('newsStoryNews'),
          tone: 'paper',
          body: (
            <>
              <span className="bs-kicker">
                <MegaphoneIcon width={16} height={16} /> {t('newsStoryNews')}
              </span>
              <h2 className="bs-heading">{block.title}</h2>
              {renderExtra(block)}
            </>
          ),
        })
      })

    if (data.weeklySchedule.length) {
      out.push({
        key: 'week',
        title: t('newsStoryWeek'),
        tone: 'blue',
        body: (
          <>
            <span className="bs-kicker">
              <CalendarIcon width={16} height={16} /> {t('newsStoryWeek')}
            </span>
            <h2 className="bs-heading">{t('newsStoryWeekTitle')}</h2>
            <div className="bs-week">
              {data.weeklySchedule.map((w, i) => (
                <div key={i} className="bs-day">
                  <span className="bs-day-d">{w.day}</span>
                  <b>{w.event}</b>
                  <span className="bs-day-meta">
                    {[w.time, w.location].filter(Boolean).join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          </>
        ),
      })
    }

    if (data.groups.length) {
      out.push({
        key: 'groups',
        title: t('newsStoryGroups'),
        tone: 'paper',
        body: (
          <>
            <span className="bs-kicker">
              <PeopleIcon width={16} height={16} /> {t('newsStoryGroups')}
            </span>
            <h2 className="bs-heading">{t('newsStoryGroupsTitle')}</h2>
            <div className="bs-cells">
              {data.groups.map((g, i) => (
                <div key={i} className="bs-cell">
                  <b className="bs-cell-value">{g.name}</b>
                  <span className="bs-cell-label">
                    {[g.leader, g.members ? t('newsStoryMembers').replace('{n}', String(g.members)) : '', g.meeting]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          </>
        ),
      })
    }

    const solved = quiz.solved || choices.length === 0
    out.push({
      key: 'end',
      title: t('newsStoryEnd'),
      tone: 'end',
      body: (
        <div className={`bs-end${solved ? ' is-won' : ''}`}>
          <div className="bs-medal" aria-hidden="true">
            {/* 찬송 퀴즈 메달 — 금화 위에 돋을새김한 음표 */}
            <span className="bs-medal-face">
              <svg viewBox="0 0 64 64" width="58%" height="58%">
                <path
                  d="M24 46.5V17.2c0-1.3.9-2.4 2.2-2.7l22-5c1.7-.4 3.3.9 3.3 2.7v28.3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M24 24.5l27.5-6.2" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <ellipse cx="17.5" cy="47" rx="7.5" ry="6" fill="currentColor" />
                <ellipse cx="45" cy="41" rx="7.5" ry="6" fill="currentColor" />
              </svg>
            </span>
          </div>
          {!solved ? (
            <>
              <span className="bs-kicker bs-gold">{t('newsStoryQuizKicker')}</span>
              <h2 className="bs-heading">{t('newsStoryQuizQ')}</h2>
              <div className="bs-choices">
                {choices.map(n => (
                  <button
                    key={`${n}-${quiz.wrong === n ? 'w' : ''}`}
                    type="button"
                    className={`bs-choice${quiz.wrong === n ? ' is-wrong' : ''}`}
                    onClick={() => {
                      if (n === hymns[0]) {
                        setQuiz({ wrong: null, solved: true })
                        writeDone(data.date)
                        setDoneDate(data.date)
                      } else setQuiz({ wrong: n, solved: false })
                    }}
                  >
                    {n}
                    {t('newsStoryHymnUnit')}
                  </button>
                ))}
              </div>
              <p className="bs-quiz-msg" aria-live="polite">
                {quiz.wrong != null ? t('newsStoryQuizWrong') : ' '}
              </p>
            </>
          ) : (
            <>
              {choices.length > 0 && (
                <span className="bs-kicker bs-gold">{t('newsStoryQuizRight').replace('{n}', String(hymns[0]))}</span>
              )}
              <h2 className="bs-heading">{t('newsStoryDoneTitle')}</h2>
              <p className="bs-sub">{t('newsStoryDoneSub')}</p>
              <button type="button" className="bs-start bs-restart" onClick={() => go(0)}>
                {t('newsStoryRestart')}
              </button>
            </>
          )}
        </div>
      ),
    })
    return out
    // 아래 값들은 모두 data·t 에서 매 렌더 다시 계산되는 파생값이다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, t, sheepChurch, sermonArt, openNews, prayed, quiz, liveIdx, nextIdx, worshipHeading, go])

  const total = slides.length
  totalRef.current = total

  // 데이터가 바뀌어 장 수가 줄면 범위 안으로
  useEffect(() => {
    if (cur > total - 1) setCur(total - 1)
  }, [cur, total])

  // 마지막 장에 퀴즈가 없으면 도착만으로 완독
  useEffect(() => {
    if (cur === total - 1 && choices.length === 0 && doneDate !== data.date) {
      writeDone(data.date)
      setDoneDate(data.date)
    }
  }, [cur, total, choices.length, doneDate, data.date])

  // ← → 키 — 무대가 화면에 보이고 입력창에 있지 않을 때만
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      const root = rootRef.current
      if (!root) return
      const r = root.getBoundingClientRect()
      if (r.bottom < 80 || r.top > window.innerHeight - 80) return
      e.preventDefault()
      setCur(prev => {
        const next = Math.max(0, Math.min(totalRef.current - 1, prev + (e.key === 'ArrowRight' ? 1 : -1)))
        if (next !== prev) setSeen(s => new Set(s).add(next))
        return next
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 터치 — 좌우 스와이프, 버튼 밖을 톡: 왼쪽 30%는 이전, 나머지는 다음 (인스타 스토리 문법)
  const touch = useRef<{ x: number; y: number; t: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const p = e.touches[0]
    touch.current = { x: p.clientX, y: p.clientY, t: Date.now() }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current
    touch.current = null
    if (!start) return
    const p = e.changedTouches[0]
    const dx = p.clientX - start.x
    const dy = p.clientY - start.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(cur + (dx < 0 ? 1 : -1))
      return
    }
    const isTap = Math.abs(dx) < 10 && Math.abs(dy) < 10 && Date.now() - start.t < 350
    if (!isTap || isInteractive(e.target) || cur === 0 || cur === total - 1) return
    const box = e.currentTarget.getBoundingClientRect()
    go(cur + (p.clientX - box.left < box.width * 0.3 ? -1 : 1))
  }

  const coverArt = bulletinCoverArt(season, isDark)
  const coverImg = coverArt ?? COVER[season]
  /** 목차 썸네일 — 계절 썸네일이 있으면 그것, 없으면 표지만 사진, 나머지는 톤 색 */
  const thumbStyle = (s: Slide) => {
    const thumb = bulletinSeasonThumb(season, s.key, isDark)
    if (thumb) return { backgroundImage: `url(${thumb})` }
    return s.tone === 'cover' ? { backgroundImage: `url(${coverImg})` } : undefined
  }
  /** 장 배경 — 지금 장 ±1 과 이미 본 장만 붙인다(16장을 한꺼번에 받지 않게) */
  const slideStyle = (s: Slide, i: number) => {
    // 표지 삽화는 장면을 위쪽에 두고 아래로 들판을 늘려 구웠다 — 위 기준으로 깔아야 글줄 위로 양이 올라온다
    if (s.tone === 'cover') return { backgroundImage: `url(${coverImg})`, backgroundPosition: coverArt ? 'center top' : undefined }
    if (Math.abs(i - cur) > 1 && !seen.has(i)) return undefined
    const art = bulletinSeasonArt(season, s.key, isDark)
    return art ? { backgroundImage: `url(${art})` } : undefined
  }
  const isDone = doneDate === data.date

  return (
    <div className="bs-root" ref={rootRef}>
      {/* PC 목차 */}
      <nav className="bs-rail" aria-label={t('newsStoryToc')}>
        <div className="bs-rail-head">
          <b>{t('newsStoryToc')}</b>
          <span>
            {data.date} · {t('newsStoryPages').replace('{n}', String(total))}
          </span>
        </div>
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={['bs-ch', i === cur && 'is-on', seen.has(i) && i !== cur && 'is-seen'].filter(Boolean).join(' ')}
            aria-current={i === cur ? 'step' : undefined}
            onClick={() => go(i)}
          >
            <span
              className={`bs-thumb bs-tone-${s.tone}`}
              style={thumbStyle(s)}
            />
            <span className="bs-ch-text">
              <span className="bs-ch-no">{i + 1}</span>
              <span className="bs-ch-title">{s.title}</span>
            </span>
            {s.key === 'end' && isDone && <span className="bs-done-chip">{t('newsStoryDoneBadge')}</span>}
          </button>
        ))}
      </nav>

      <div className="bs-stage">
        <div className="bs-bars">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`bs-bar${i <= cur ? ' is-done' : ''}`}
              aria-label={t('newsStoryGoTo').replace('{n}', String(i + 1))}
              onClick={() => go(i)}
            >
              <i />
            </button>
          ))}
        </div>
        <div className="bs-pos">
          <b>{slides[cur]?.title}</b>
          <span>
            {cur + 1} / {total}
          </span>
        </div>

        <div className="bs-deck" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {slides.map((s, i) => (
            <section
              key={s.key}
              className={[
                'bs-slide',
                `bs-tone-${s.tone}`,
                s.tone !== 'cover' && bulletinSeasonArt(season, s.key, isDark) && 'has-art',
                s.tone === 'cover' && coverArt && !isDark && 'bs-cover-light',
                i === cur ? 'is-on' : i < cur ? 'is-past' : 'is-ahead',
              ]
                .filter(Boolean)
                .join(' ')}
              style={slideStyle(s, i)}
              aria-hidden={i !== cur}
              inert={i !== cur}
            >
              <div className="bs-slide-inner">{s.body}</div>
            </section>
          ))}
          <button
            type="button"
            className="bs-nav bs-nav-prev"
            aria-label={t('newsStoryPrev')}
            onClick={() => go(cur - 1)}
            disabled={cur === 0}
          >
            ‹
          </button>
          <button
            type="button"
            className="bs-nav bs-nav-next"
            aria-label={t('newsStoryNext')}
            onClick={() => go(cur + 1)}
            disabled={cur === total - 1}
          >
            ›
          </button>
        </div>
        <p className="bs-hint">{t('newsStoryHint')}</p>
      </div>
    </div>
  )
}

export default BulletinStory
