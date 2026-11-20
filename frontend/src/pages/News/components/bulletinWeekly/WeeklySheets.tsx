// 디지털 주보 바텀시트들 — 소식 상세 · 말씀 · 설교 · 예배 시간 · 소식 전체 · 이번 주 일정 · 안내 블록 ·
// 챙길 일 한 번에 고르기 · 알림 설정(PC 에선 같은 패널을 오른쪽 칸에 펼친다).
import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet, SheetBody } from '../../../../components/common/BottomSheet'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { BulletinData, BulletinNotifySettings, ExtraBlock } from '../../../../types/digitalBulletin'
import { copyToClipboard } from '../../../../utils/clipboard'
import { showToast } from '../../../../utils/toast'
import {
  bestOption,
  daysBetween,
  eventStatus,
  formatMinutes,
  remindAt,
  type BulletinWeek,
  type EventStatus,
  type RemindOption,
  type TodoItem,
  type WeekEvent,
  whenLabel,
  WEEKDAY_KO,
} from './bulletinWeek'
import { buildWeekTimeline, countdown, icsFor, type TimelineNext } from './weekTimeline'
import { WIcon } from './WeeklyIcons'
import {
  dayLabel,
  dayTimeLabel,
  parseAccounts,
  sermonEntries,
  sermonForNow,
  bibleLink,
  sundayServices,
  type PreviewAlarm,
} from './weeklyModel'

type T = ReturnType<typeof useLanguage>['t']

/* ── 공용 조각 ─────────────────────────────────────── */

export const StatusChip = ({ st }: { st: EventStatus | null }) => {
  const { t } = useLanguage()
  if (!st) return null
  const cls = { past: 'is-past', now: 'is-now', today: 'is-today', tomorrow: 'is-soon', soon: 'is-soon', later: '' }[st.kind]
  const label =
    st.kind === 'past'
      ? t('bwStPast')
      : st.kind === 'now'
        ? t('bwStNow')
        : st.kind === 'today'
          ? t('bwStToday')
          : st.kind === 'tomorrow'
            ? t('bwStTomorrow')
            : `D-${st.days}`
  return <span className={`bw-chip ${cls}`}>{label}</span>
}

export const PushCard = ({ title, body, time, variant }: { title: string; body: string; time?: string; variant?: 'flat' | 'hl' }) => (
  <div className={`bw-push ${variant === 'flat' ? 'is-flat' : variant === 'hl' ? 'is-flat is-hl' : ''}`}>
    <span className="bw-push-app" aria-hidden="true">참</span>
    <span className="bw-grow">
      {time !== undefined && (
        <span className="bw-push-top">
          <b>참빛교회</b>
          <span>{time}</span>
        </span>
      )}
      <span className="bw-push-t">{title}</span>
      {body && <span className="bw-push-b">{body}</span>}
    </span>
  </div>
)

export const LockPreview = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="bw-lock">
    <p className="bw-lock-label">{label}</p>
    {children}
  </div>
)

const Switch = ({ on, onToggle, label, disabled }: { on: boolean; onToggle: () => void; label: string; disabled?: boolean }) => (
  <button type="button" className={`bw-sw ${on ? 'is-on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={onToggle} disabled={disabled}>
    <i />
  </button>
)

/** 시트 틀 — 제목 + 닫기 + 스크롤 본문 */
export const WeeklySheet = ({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** lg+ 에서 넓은 카드로 (소식 전체) · 'md' 는 560px */
  wide?: boolean | 'md'
}) => {
  const { t } = useLanguage()
  return (
    <BottomSheet onClose={onClose} ariaLabel={title} wide={wide}>
      <div className="bw-sheet flex flex-col min-h-0 flex-1">
        <div className="bw-sheet-head">
          <p className="bw-h2">{title}</p>
          <button type="button" className="bw-btn is-sm" onClick={onClose}>
            {t('bwClose')}
          </button>
        </div>
        <SheetBody>{children}</SheetBody>
        {footer && <div className="shrink-0 px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </BottomSheet>
  )
}

const copy = async (text: string, label: string, t: T) => {
  const ok = await copyToClipboard(text)
  showToast(ok ? t('bwCopied').replace('{label}', label) : t('bwCopyFailed'), ok ? 'success' : 'error')
}

/* ── 소식 하나 ─────────────────────────────────────── */

export const EventSheet = ({
  ev,
  now,
  todo,
  alarmOpt,
  onToggleAlarm,
  onClose,
}: {
  ev: WeekEvent
  now: Date
  /** 아직 오지 않은 일이면 챙길 일 */
  todo: TodoItem | null
  alarmOpt: RemindOption | null
  onToggleAlarm: (() => void) | null
  onClose: () => void
}) => {
  const { t } = useLanguage()
  const when = whenLabel(ev)
  const st = eventStatus(ev, now)
  const suggested = todo ? bestOption(todo, now) : null
  const suggestedAt = todo && suggested ? remindAt(todo, suggested, now) : null
  const setAt = todo && alarmOpt ? remindAt(todo, alarmOpt, now) : null
  return (
    <WeeklySheet
      title={ev.title}
      onClose={onClose}
      footer={
        onToggleAlarm && (alarmOpt || suggestedAt) ? (
          <button type="button" className={`bw-btn is-full ${alarmOpt ? '' : 'is-pri'}`} onClick={onToggleAlarm}>
            <WIcon name="bell" />
            {alarmOpt
              ? t('bwAlarmOffAt').replace('{when}', setAt ? dayTimeLabel(setAt, now) : '')
              : t('bwAlarmOnAt').replace('{when}', suggestedAt ? dayTimeLabel(suggestedAt, now) : '')}
          </button>
        ) : undefined
      }
    >
      {(ev.start || ev.place) && (
        // 언제 · 어디서 — 소식 카드와 같은 날짜 칸 + 옅은 상자
        <div className={`bw-nc is-info ${st && st.kind !== 'past' && st.kind !== 'later' ? 'is-near' : ''}`}>
          <NewsDate ev={ev} />
          <span className="bw-nc-m">
            {when && <span className="bw-nc-t">{when}</span>}
            {ev.place && <span className="bw-nc-s">{ev.place}</span>}
          </span>
          <StatusChip st={st} />
        </div>
      )}
      {ev.body && <p className="bw-body">{ev.body}</p>}
      {ev.phone && (
        <>
          <p className="bw-tl-sec">{t('bwContact')}</p>
          <div className="bw-nc is-info">
            <span className="bw-ic is-brand" aria-hidden="true">
              <WIcon name="phone" />
            </span>
            <span className="bw-nc-m">
              {ev.contact && <span className="bw-nc-s" style={{ marginTop: 0 }}>{ev.contact}</span>}
              <span className="bw-nc-t bw-tnum">{ev.phone}</span>
            </span>
            <a className="bw-btn is-sm is-soft" href={`tel:${ev.phone.replace(/-/g, '')}`}>
              {t('bwCall')}
            </a>
            <button type="button" className="bw-btn is-sm" onClick={() => copy(ev.phone!, t('bwPhone'), t)}>
              {t('bwCopy')}
            </button>
          </div>
        </>
      )}
    </WeeklySheet>
  )
}

/* ── 말씀 · 설교 · 예배 ─────────────────────────────── */

/** 주보 제목 첫 줄의 "2026 표어" → "2026 표어 말씀". 연도가 없으면 "교회 표어 말씀"(매주 바뀌는 말씀이 아니라 연간 표어다) */
export const verseLabel = (title: string, t: (k: 'bwVerse' | 'bwVerseYear') => string) => {
  const year = title.match(/^\s*(\d{4})\s*표어/)?.[1]
  return year ? t('bwVerseYear').replace('{n}', year) : t('bwVerse')
}

export const VerseSheet = ({ data, onClose, onRead }: { data: BulletinData; onClose: () => void; onRead: () => void }) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const link = bibleLink(data.subtitle)
  // "(에스겔 37:5, 10)" → 괄호를 벗겨 출처 줄로, 버튼은 "에스겔 37장 읽기"
  const ref = data.subtitle.replace(/[()（）]/g, '').trim()
  const chapter = ref.match(/^(.+?)\s*(\d+)\s*[:장]/)
  return (
    <WeeklySheet title={verseLabel(data.title, t)} onClose={onClose}>
      <figure className="bw-verse">
        <blockquote>{data.title.replace(/^\d{4}\s*표어\s*\n?/, '')}</blockquote>
        {ref && <figcaption>{ref}</figcaption>}
      </figure>
      {link && (
        <button
          type="button"
          className="bw-btn is-soft is-full"
          onClick={() => {
            onRead()
            navigate(link)
          }}
        >
          <WIcon name="book" />
          {chapter ? t('bwReadChapterOf').replace('{book}', chapter[1].trim()).replace('{n}', chapter[2]) : t('bwReadChapter')}
        </button>
      )}
    </WeeklySheet>
  )
}

/** 옅은 상자 안 이름-값 줄들(헌금 찬송 · 대표기도 등) */
const InfoBox = ({ title, rows }: { title?: string; rows: [string, string][] }) => {
  const shown = rows.filter(([, v]) => v.trim())
  if (!shown.length) return null
  return (
    <>
      {title && <p className="bw-tl-sec">{title}</p>}
      <div className="bw-ib">
        {shown.map(([k, v]) => (
          <div className="bw-ib-r" key={k}>
            <span className="bw-ib-k">{k}</span>
            <span className="bw-ib-v">{v}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export const SermonSheet = ({ data, now, onClose, onRead }: { data: BulletinData; now: Date; onClose: () => void; onRead: () => void }) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const sermons = sermonEntries(data)
  // 설교가 여럿이면 지금 예배 것을 강조(주일만 정해짐)
  const current = sermons.length > 1 ? sermonForNow(data, now) : null
  return (
    <WeeklySheet title={t('bwSermon')} onClose={onClose}>
      <div className="bw-ng" style={{ display: 'flex' }}>
        {sermons.map((s, i) => {
          const on = !!current && current.title === s.title && current.ref === s.ref
          return (
            <div className={`bw-nc is-sermon ${on ? 'is-near' : ''}`} key={i}>
              <span className="bw-nc-m">
                {on && <span className="bw-nc-k">{t('bwSermonNow')}</span>}
                <span className="bw-nc-t is-lg">{s.title || t('bwSermon')}</span>
                {s.ref && <span className="bw-nc-ref">{s.ref.replace(/[()（）]/g, '').replace(/\s*((?:신약|구약)\s*\d+\s*쪽)/, ' · $1')}</span>}
                {s.link && (
                  <button
                    type="button"
                    className="bw-btn is-sm is-soft"
                    style={{ alignSelf: 'flex-start', marginTop: 12 }}
                    onClick={() => {
                      onRead()
                      navigate(s.link!)
                    }}
                  >
                    <WIcon name="book" />
                    {t('bwReadText')}
                  </button>
                )}
              </span>
            </div>
          )
        })}
      </div>
      <InfoBox
        title={t('bwWorshipOrder')}
        rows={[
          [t('bwHymn'), data.worship.offering ?? ''],
          [t('bwPrayer'), data.worship.prayer ?? ''],
        ]}
      />
    </WeeklySheet>
  )
}

export const WorshipSheet = ({ data, now, onClose }: { data: BulletinData; now: Date; onClose: () => void }) => {
  const { t } = useLanguage()
  const slots = sundayServices(data)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const sunday = now.getDay() === 0
  // 주일엔 드리는 중인 예배, 없으면 다음 예배를 강조
  const liveName = sunday ? slots.find(s => s.minutes <= nowMin && nowMin < s.minutes + 75)?.name : undefined
  const nextName = sunday && !liveName ? slots.filter(s => s.minutes > nowMin).sort((a, b) => a.minutes - b.minutes)[0]?.name : undefined
  return (
    <WeeklySheet title={t('bwWorship')} onClose={onClose}>
      <p className="bw-tl-sec" style={{ paddingTop: 0 }}>
        {t('bwSundayWorship')}
      </p>
      <div className="bw-ng" style={{ display: 'flex' }}>
        {data.worship.schedule.map((s, i) => {
          const slot = slots.find(x => x.name === s.name.trim())
          const done = sunday && slot && slot.minutes + 75 <= nowMin
          const live = slot?.name === liveName
          const near = live || slot?.name === nextName
          const time = slot ? formatMinutes(slot.minutes) : s.time
          const [ap, hm] = time.includes(' ') ? time.split(' ') : ['', time]
          return (
            <div key={i} className={`bw-nc is-info ${done ? 'is-past' : ''} ${near ? 'is-near' : ''}`}>
              <span className="bw-nd is-time" aria-hidden="true">
                <b className="bw-tnum">{hm.replace('시', ':00')}</b>
                <span>{ap}</span>
              </span>
              <span className="bw-nc-m">
                <span className="bw-nc-t">{s.name}</span>
                {s.preacher && <span className="bw-nc-s">{s.preacher}</span>}
              </span>
              {live ? <span className="bw-chip is-now">{t('bwLive')}</span> : near ? <span className="bw-chip is-soon">{t('bwNextChip')}</span> : null}
            </div>
          )
        })}
      </div>
      <InfoBox rows={[[t('bwPrayer'), data.worship.prayer ?? '']]} />
    </WeeklySheet>
  )
}

/* ── 소식 전체 · 이번 주 일정 ───────────────────────── */

/** 소식 카드 왼쪽 날짜 칸 — "23 월" · 기간이면 "23–27 월–금" */
const NewsDate = ({ ev }: { ev: WeekEvent }) => {
  if (!ev.start) return null
  const s = ev.start
  const e = ev.end
  const sun = !e && s.getDay() === 0
  return (
    <span className={`bw-nd ${sun ? 'is-sun' : ''} ${e ? 'is-range' : ''}`} aria-hidden="true">
      <b className="bw-tnum">{e ? `${s.getDate()}–${e.getDate()}` : s.getDate()}</b>
      <span>{e ? `${WEEKDAY_KO[s.getDay()]}–${WEEKDAY_KO[e.getDay()]}` : WEEKDAY_KO[s.getDay()]}</span>
    </span>
  )
}

export const NewsSheet = ({
  week,
  now,
  onOpen,
  onOpenWeek,
  onClose,
}: {
  week: BulletinWeek
  now: Date
  onOpen: (index: number) => void
  /** '이번 주 일정' 시트로 — 다가오는 일정은 거기서 타임라인으로 본다 */
  onOpenWeek: () => void
  onClose: () => void
}) => {
  const { t } = useLanguage()
  const withSt = week.events.map(ev => ({ ev, st: eventStatus(ev, now) }))
  const upcoming = withSt.filter(x => x.ev.start && x.st?.kind !== 'past').sort((a, b) => a.ev.start!.getTime() - b.ev.start!.getTime())
  const notices = withSt.filter(x => !x.ev.start)
  const past = withSt.filter(x => x.st?.kind === 'past')
  const later = week.later.filter(x => x.date && daysBetween(now, x.date) >= 0).sort((a, b) => a.date!.getTime() - b.date!.getTime())
  // 가장 가까운 하나만 파란 테두리
  const nearest = upcoming[0]?.ev.index

  const card = ({ ev, st }: (typeof withSt)[number]) => {
    const time = ev.minutes != null ? formatMinutes(ev.minutes) : ''
    // 날짜 칸이 있으니 부제는 시각·장소만. 날짜 없는 안내는 본문 첫 줄
    const sub = ev.start ? [time, ev.place].filter(Boolean).join(' · ') : ''
    const preview = ev.body.replace(/\s*\n\s*/g, ' ').trim()
    return (
      <button
        type="button"
        key={ev.index}
        className={`bw-nc ${ev.start ? '' : 'is-plain'} ${st?.kind === 'past' ? 'is-past' : ''} ${ev.index === nearest ? 'is-near' : ''}`}
        onClick={() => onOpen(ev.index)}
      >
        <NewsDate ev={ev} />
        <span className="bw-nc-m">
          <span className="bw-nc-t">{ev.title}</span>
          {sub && <span className="bw-nc-s">{sub}</span>}
          {preview && <span className="bw-nc-b">{preview}</span>}
        </span>
        {st && st.kind !== 'past' && st.kind !== 'later' && <StatusChip st={st} />}
      </button>
    )
  }

  return (
    <WeeklySheet title={t('bwNewsCount').replace('{n}', String(week.events.length))} onClose={onClose} wide>
      {upcoming.length > 0 && (
        <>
          <p className="bw-tl-sec">{t('bwNcUpcoming')}</p>
          <div className="bw-ng">{upcoming.map(card)}</div>
        </>
      )}
      {notices.length > 0 && (
        <>
          <p className="bw-tl-sec">{t('bwNcNotice')}</p>
          <div className="bw-ng">{notices.map(card)}</div>
        </>
      )}
      {past.length > 0 && (
        <>
          <p className="bw-tl-sec">{t('bwNcPast')}</p>
          <div className="bw-ng">{past.map(card)}</div>
        </>
      )}
      {later.length > 0 && (
        <button type="button" className="bw-nc-week" onClick={onOpenWeek}>
          <span className="bw-ic is-brand" aria-hidden="true">
            <WIcon name="cal" />
          </span>
          <span className="bw-nc-m">
            <span className="bw-nc-t">{t('bwNcLater').replace('{n}', String(later.length))}</span>
            <span className="bw-nc-s">
              {later
                .slice(0, 2)
                .map(x => `${x.date!.getMonth() + 1}/${x.date!.getDate()} ${x.text.split(/\s*\*\s*/)[0]}`)
                .join(' · ')}
              {later.length > 2 ? ` ${t('bwNcMore').replace('{n}', String(later.length - 2))}` : ''}
            </span>
          </span>
          <WIcon name="chev" className="bw-chev" />
        </button>
      )}
    </WeeklySheet>
  )
}

/* 이번 주 일정 — 맨 위 '다음 일정' 카드 + 날짜·점·내용 타임라인 (2026-11 개편 최종 시안) */

/** 새벽 일정 알림 — 알림 설정의 '새벽기도 30분 전'(요일별)을 그 일정의 요일만큼 켜고 끈다 */
export interface WeekDawnAlarm {
  settings: BulletinNotifySettings
  busy: boolean
  onChange: (patch: Partial<BulletinNotifySettings>, turningOn: boolean) => void
}

const downloadIcs = (next: TimelineNext) => {
  const blob = new Blob([icsFor(next, new Date())], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${next.entry.title.slice(0, 30)}-${next.at.getMonth() + 1}${String(next.at.getDate()).padStart(2, '0')}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const NextCard = ({ next, now, dawn }: { next: TimelineNext; now: Date; dawn: WeekDawnAlarm | null }) => {
  const { t } = useLanguage()
  const { entry, at, live, dayIndex, total } = next
  const cd = countdown(next, now)
  const liveMin = Math.max(1, Math.floor((now.getTime() - at.getTime()) / 60_000))
  const timeLabel = entry.minutes != null ? ` ${formatMinutes(entry.minutes)}` : ''
  const kicker = live
    ? `● ${t('bwTlLive')}${entry.place ? ` · ${entry.place}` : ''}`
    : `${t('bwTlNext')} · ${dayLabel(at, now)}${timeLabel}`
  const title = total > 1 && dayIndex > 0 ? `${entry.title} ${t('bwTlDayN').replace('{n}', String(dayIndex + 1))}` : entry.title
  const sub = live
    ? entry.minutes != null
      ? t('bwTlStarted').replace('{time}', formatMinutes(entry.minutes))
      : ''
    : [entry.place, total > 1 && dayIndex === 0 ? t('bwTlDaily').replace('{n}', String(total)) : ''].filter(Boolean).join(' · ')

  // 새벽(7시 전) 이번 주 일정만 — 알림 설정의 새벽기도 요일과 같은 규칙
  const dawnIdx =
    dawn && entry.section === 'week' && entry.minutes != null && entry.minutes < 7 * 60
      ? (entry.days.length ? entry.days.map(d => d.date) : entry.start ? [entry.start] : []).map(d => (d.getDay() + 6) % 7)
      : []
  const dawnOn = !!dawn && dawnIdx.length > 0 && dawn.settings.dawn && dawnIdx.every(i => dawn.settings.dawn_days[i] === '1')
  const toggleDawn = () => {
    if (!dawn) return
    const days = dawn.settings.dawn_days.padEnd(7, '0').split('')
    for (const i of dawnIdx) days[i] = dawnOn ? '0' : '1'
    const nextDays = days.join('')
    dawn.onChange({ dawn_days: nextDays, dawn: nextDays.includes('1') }, !dawnOn)
  }

  return (
    <div className={`bw-next ${live ? 'is-live' : ''}`}>
      <p className="bw-next-k">{kicker}</p>
      <p className="bw-next-t">{title}</p>
      {sub && <p className="bw-next-m">{sub}</p>}
      <div className="bw-next-cd bw-tnum" aria-hidden="true">
        <b>{live ? 'LIVE' : t(cd.unit === 'day' ? 'bwTlDays' : cd.unit === 'hour' ? 'bwTlHours' : 'bwTlMins').replace('{n}', String(cd.value))}</b>
        <span>{live ? t('bwTlMinIn').replace('{n}', String(liveMin)) : t('bwTlLeft')}</span>
      </div>
      {total > 1 && (
        <div className="bw-next-prog" aria-hidden="true">
          {entry.days.map((d, i) => (
            <i key={i} className={d.state === 'done' ? 'is-done' : live && i === dayIndex ? 'is-now' : ''} />
          ))}
        </div>
      )}
      {!live && (
        <div className="bw-next-acts">
          {dawnIdx.length > 0 && (
            <button type="button" className={`bw-next-btn ${dawnOn ? 'is-on' : ''}`} disabled={dawn!.busy} onClick={toggleDawn}>
              <WIcon name={dawnOn ? 'check' : 'bell'} />
              {dawnOn ? t('bwTlAlarmOn') : t('bwTlAlarm')}
            </button>
          )}
          <button type="button" className="bw-next-btn" onClick={() => downloadIcs(next)}>
            <WIcon name="cal" />
            {t('bwTlCal')}
          </button>
        </div>
      )}
    </div>
  )
}

export const WeekSheet = ({
  data,
  week,
  now,
  dawn,
  onClose,
}: {
  data: BulletinData
  week: BulletinWeek
  now: Date
  /** 지난 주보이거나 로그인 전이면 null — 알림 버튼을 숨긴다 */
  dawn: WeekDawnAlarm | null
  onClose: () => void
}) => {
  const { t } = useLanguage()
  const tl = useMemo(() => buildWeekTimeline(data, week, now), [data, week, now])
  const sunday = week.sunday
  const range = sunday
    ? (() => {
        const mon = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 1)
        const sun = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 7)
        return `${mon.getMonth() + 1}/${mon.getDate()}(월) – ${sun.getMonth() !== mon.getMonth() ? `${sun.getMonth() + 1}/` : ''}${sun.getDate()}(주일)`
      })()
    : ''
  const lastOf = (i: number) => i === tl.entries.length - 1 || tl.entries[i + 1].section !== tl.entries[i].section

  return (
    <WeeklySheet title={t('bwWeek')} onClose={onClose} wide="md">
      {range && <p className="bw-cap bw-tl-range">{range}</p>}
      {tl.next && <NextCard next={tl.next} now={now} dawn={dawn} />}
      <div className="bw-tl">
        {tl.entries.map((e, i) => {
          const firstOfSection = i === 0 || tl.entries[i - 1].section !== e.section
          const laterIdx = typeof e.section === 'number' ? tl.entries.findIndex(x => typeof x.section === 'number') : -1
          const head = !firstOfSection
            ? null
            : e.section === 'week'
              ? t('bwTlThisWeek')
              : i === laterIdx
                ? t('bwTlUpcoming').replace('{m}', String(e.section))
                : t('bwTlMonth').replace('{m}', String(e.section))
          const dday = e.start && !e.past && e.section !== 'week' ? daysBetween(now, e.start) : null
          const meta = [[e.timeText, e.place].filter(Boolean).join(' · '), dday != null && dday > 0 ? `D-${dday}` : ''].filter(Boolean).join(' · ')
          const isNext = tl.next?.entry.key === e.key
          return (
            <Fragment key={e.key}>
              {tl.todayAt === i && <TodayLine />}
              {head && <p className="bw-tl-sec">{head}</p>}
              <div className={`bw-tl-it ${firstOfSection ? 'is-first' : ''} ${lastOf(i) ? 'is-last' : ''} ${isNext ? 'is-hl' : ''} ${e.past ? 'is-past' : ''}`}>
                <div className={`bw-tl-d ${e.sunday ? 'is-sun' : ''}`}>
                  <b className="bw-tnum">{e.start ? e.start.getDate() : ''}</b>
                  <span>{e.dayText}</span>
                </div>
                <div className="bw-tl-rail" aria-hidden="true">
                  <i />
                </div>
                <div className="bw-tl-c">
                  <p className={`bw-tl-t ${e.muted ? 'is-muted' : ''}`}>
                    {e.title}
                    {e.section === 'week' && isNext && !tl.next!.live && e.start && daysBetween(now, tl.next!.at) > 0 && (
                      <span className="bw-chip is-soon">D-{daysBetween(now, tl.next!.at)}</span>
                    )}
                  </p>
                  {meta && <p className="bw-tl-m">{meta}</p>}
                  {e.days.length > 0 && !e.past && (
                    <div className="bw-tl-wk" aria-hidden="true">
                      {e.days.map((d, k) => (
                        <span key={k} className={`is-${d.state}`}>
                          {WEEKDAY_KO[d.date.getDay()].replace('주일', '일')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Fragment>
          )
        })}
        {tl.todayAt === tl.entries.length && tl.entries.length > 0 && <TodayLine />}
      </div>
      {tl.notes.length > 0 && (
        <div className="bw-tl-note">
          <span className="bw-tl-note-h">{t('bwTlNote')}</span>
          <span>
            {tl.notes.map((n, i) => (
              <span key={i} className="bw-tl-note-i">
                {n.label && <b>{n.label} </b>}
                {n.text.replace(/[,，]\s*$/, '')}
              </span>
            ))}
          </span>
        </div>
      )}
    </WeeklySheet>
  )
}

const TodayLine = () => {
  const { t } = useLanguage()
  return (
    <div className="bw-tl-now" role="separator" aria-label={t('bwTlToday')}>
      <b>{t('bwTlToday')}</b>
      <i />
      <span />
    </div>
  )
}

/* ── 안내 블록(당회 결정·헌금 계좌·봉사표) ─────────────── */

export const ExtraSheet = ({ block, onClose }: { block: ExtraBlock; onClose: () => void }) => {
  const { t } = useLanguage()
  const accounts = block.kind === 'note' ? parseAccounts(block.content) : null
  return (
    <WeeklySheet title={block.title} onClose={onClose} wide>
      {block.kind === 'list' && (
        <ol className="bw-xl">
          {block.items.map((x, i) => (
            <li key={i}>
              <span className="bw-xl-n bw-tnum" aria-hidden="true">
                {i + 1}
              </span>
              <span className="bw-xl-t">{x}</span>
            </li>
          ))}
        </ol>
      )}
      {block.kind === 'note' &&
        (accounts ? (
          <>
            {accounts.intro && <p className="bw-xnote">{accounts.intro}</p>}
            <div className="bw-xacc">
              {accounts.lines.map((a, i) => (
                <div className="bw-xacc-i" key={i}>
                  <span className="bw-grow">
                    <span className="bw-xacc-l">{a.label}</span>
                    <span className="bw-xacc-n bw-tnum">{a.number}</span>
                    <span className="bw-xacc-b">{a.bank}</span>
                  </span>
                  <button type="button" className="bw-btn is-sm is-soft" onClick={() => copy(`${a.bank} ${a.number}`, t('bwAccountOf').replace('{label}', a.label), t)}>
                    {t('bwCopy')}
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="bw-body">{block.content}</p>
        ))}
      {block.kind === 'table' &&
        (block.rows.length === 1 ? (
          <div className="bw-xtiles">
            {block.columns.map((c, i) => (
              <div className="bw-xtile" key={i}>
                <span className="bw-xtile-l">{c}</span>
                <b className="bw-xtile-v">{block.rows[0][i] ?? ''}</b>
              </div>
            ))}
          </div>
        ) : (
          <div className="bw-tablewrap">
            <table className="bw-table">
              <thead>
                <tr>
                  {block.columns.map((c, i) => (
                    <th key={i}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </WeeklySheet>
  )
}

/* ── 챙길 일 한 번에 고르기 ─────────────────────────── */

const BULK_OPTS: RemindOption[] = ['eve', 'morn', 'h1']

export const BulkSheet = ({
  todos,
  now,
  chosen,
  busy,
  onSubmit,
  onClose,
}: {
  todos: TodoItem[]
  now: Date
  chosen: Map<number, RemindOption>
  busy: boolean
  onSubmit: (picked: { item: TodoItem; opt: RemindOption }[]) => void
  onClose: () => void
}) => {
  const { t } = useLanguage()
  const first = chosen.values().next().value as RemindOption | undefined
  const [opt, setOpt] = useState<RemindOption>(first && BULK_OPTS.includes(first) ? first : 'eve')
  const [sel, setSel] = useState<Set<number>>(() => new Set(chosen.size ? [...chosen.keys()] : todos.map(x => x.ev.index)))
  const plan = useMemo(
    () =>
      todos.map(item => {
        const o = bestOption(item, now, opt)
        return { item, opt: o, at: o ? remindAt(item, o, now) : null }
      }),
    [now, opt, todos],
  )
  const picked = plan.filter(p => sel.has(p.item.ev.index) && p.opt && p.at) as { item: TodoItem; opt: RemindOption; at: Date }[]
  const label = { eve: t('bwOptEve'), morn: t('bwOptMorn'), h1: t('bwOptH1'), m30: t('bwOptM30') }
  return (
    <WeeklySheet
      title={t('bwBulkTitle')}
      onClose={onClose}
      footer={
        <button type="button" className="bw-btn is-pri is-full" disabled={busy || (!picked.length && !chosen.size)} onClick={() => onSubmit(picked)}>
          {picked.length ? t('bwBulkSubmit').replace('{n}', String(picked.length)) : t('bwBulkClear')}
        </button>
      }
    >
      <div className="bw-seg" role="group" aria-label={t('bwBulkWhen')}>
        {BULK_OPTS.map(o => (
          <button key={o} type="button" aria-pressed={opt === o} onClick={() => setOpt(o)}>
            {label[o]}
          </button>
        ))}
      </div>
      <p className="bw-cap" style={{ margin: '8px 0 6px' }}>
        {t('bwBulkHint')}
      </p>
      {plan.map(({ item, at }) => {
        const on = sel.has(item.ev.index) && !!at
        return (
          <button
            key={item.ev.index}
            type="button"
            className={`bw-todo ${on ? 'is-on' : ''}`}
            aria-pressed={on}
            disabled={!at}
            onClick={() =>
              setSel(prev => {
                const next = new Set(prev)
                if (next.has(item.ev.index)) next.delete(item.ev.index)
                else next.add(item.ev.index)
                return next
              })
            }
          >
            <span className="bw-todo-c">
              <WIcon name="check" />
            </span>
            <span className="bw-grow">
              <span className="bw-tt">{item.ev.title}</span>
              <span className="bw-ss">
                {at && on ? t('bwAlarmAt').replace('{when}', dayTimeLabel(at, now)) : `${dayLabel(item.at, now)} ${item.ev.minutes != null ? formatMinutes(item.ev.minutes) : ''}`}
                {!at && ` · ${t('bwBulkTooLate')}`}
              </span>
            </span>
          </button>
        )
      })}
    </WeeklySheet>
  )
}

/* ── 알림 설정 ─────────────────────────────────────── */

const WEEKDAYS_MON_FIRST = [1, 2, 3, 4, 5, 6] // 월~토 (주일 새벽은 개인 묵상)

export const SettingsRules = ({
  data,
  settings,
  itemCount,
  busy,
  onChange,
  onPickItems,
}: {
  data: BulletinData
  settings: BulletinNotifySettings
  itemCount: number
  busy: boolean
  onChange: (patch: Partial<BulletinNotifySettings>, turningOn: boolean) => void
  onPickItems: () => void
}) => {
  const { t } = useLanguage()
  const services = sundayServices(data)
  const toggleService = (name: string) => {
    const has = settings.services.includes(name)
    const next = has ? settings.services.filter(s => s !== name) : [...settings.services, name]
    onChange({ services: next, service: next.length > 0 }, !has)
  }
  const toggleDay = (wd: number) => {
    const i = (wd + 6) % 7
    const days = settings.dawn_days.split('')
    days[i] = days[i] === '1' ? '0' : '1'
    const next = days.join('')
    onChange({ dawn_days: next, dawn: next.includes('1') }, days[i] === '1')
  }
  return (
    <div>
      <div className="bw-set">
        <span className="bw-grow">
          <b>{t('bwRuleNew')}</b> <span className="bw-chip is-soon" style={{ marginLeft: 4 }}>{t('bwRecommended')}</span>
          <span className="bw-cap" style={{ display: 'block' }}>
            {t('bwRuleNewSub')}
          </span>
        </span>
        <Switch label={t('bwRuleNew')} on={settings.new_bulletin} disabled={busy} onToggle={() => onChange({ new_bulletin: !settings.new_bulletin }, !settings.new_bulletin)} />
      </div>
      <div className="bw-set">
        <span className="bw-grow">
          <b>{t('bwRuleItems')}</b>
          <span className="bw-cap" style={{ display: 'block' }}>
            {itemCount > 0 && `${t('bwRuleItemsCount').replace('{n}', String(itemCount))} · `}
            <button type="button" className="bw-link" onClick={onPickItems}>
              {itemCount ? t('bwChange') : t('bwPick')}
            </button>
          </span>
        </span>
        <Switch label={t('bwRuleItems')} on={settings.item_reminders} disabled={busy} onToggle={() => onChange({ item_reminders: !settings.item_reminders }, !settings.item_reminders)} />
      </div>
      {services.length > 0 && (
        <>
          <div className="bw-set">
            <span className="bw-grow">
              <b>{t('bwRuleService')}</b>
              <span className="bw-cap" style={{ display: 'block' }}>
                {t('bwRuleServiceSub')}
              </span>
            </span>
            <Switch
              label={t('bwRuleService')}
              on={settings.service}
              disabled={busy}
              onToggle={() =>
                onChange(
                  settings.service ? { service: false } : { service: true, services: settings.services.length ? settings.services : [services[0].name] },
                  !settings.service,
                )
              }
            />
          </div>
          {settings.service && (
            <div className="bw-chips">
              {services.map(s => (
                <button key={s.name} type="button" aria-pressed={settings.services.includes(s.name)} disabled={busy} onClick={() => toggleService(s.name)}>
                  {s.name.replace(/\s*예배$/, '')} {formatMinutes(s.minutes).replace('오전 ', '')}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <div className="bw-set">
        <span className="bw-grow">
          <b>{t('bwRuleDawn')}</b>
          <span className="bw-cap" style={{ display: 'block' }}>
            {t('bwRuleDawnSub')}
          </span>
        </span>
        <Switch
          label={t('bwRuleDawn')}
          on={settings.dawn}
          disabled={busy}
          onToggle={() =>
            onChange(settings.dawn ? { dawn: false } : { dawn: true, dawn_days: settings.dawn_days.includes('1') ? settings.dawn_days : '1111110' }, !settings.dawn)
          }
        />
      </div>
      {settings.dawn && (
        <div className="bw-chips">
          {WEEKDAYS_MON_FIRST.map(wd => (
            <button key={wd} type="button" aria-pressed={settings.dawn_days[(wd + 6) % 7] === '1'} disabled={busy} onClick={() => toggleDay(wd)}>
              {WEEKDAY_KO[wd]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export const AlarmPreview = ({ alarms, now }: { alarms: PreviewAlarm[]; now: Date }) => {
  const { t } = useLanguage()
  return (
    <div>
      <p className="bw-h2" style={{ fontSize: 16 }}>
        {t('bwPreviewTitle').replace('{n}', String(alarms.length))}
      </p>
      {alarms.length ? (
        <div className="bw-tl">
          {alarms.map((a, i) => (
            <div className="bw-tli" key={i}>
              <div className="bw-tlt">
                {a.at ? (
                  <>
                    <b>{dayLabel(a.at, now)}</b>
                    <span className="bw-tnum">{formatMinutes(a.at.getHours() * 60 + a.at.getMinutes())}</span>
                  </>
                ) : (
                  <>
                    <b>{t('bwPreviewNewWhen')}</b>
                    <span>{t('bwPreviewNewWhen2')}</span>
                  </>
                )}
              </div>
              <div className="bw-grow">
                <PushCard title={a.title} body={a.body} variant={a.kind === 'new' ? 'hl' : 'flat'} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="bw-cap" style={{ marginTop: 4 }}>
          {t('bwPreviewEmpty')}
        </p>
      )}
    </div>
  )
}
