// 디지털 주보 — 이번 주 한눈에 (2026-11 개편, 최종 시안 https://claude.ai/artifact/UdeQ3bWUqcVm82pf7N8d51)
//
// 순서: (알림으로 들어오면 NEW 배너) → 꼭 알아둘 3가지 → 새 주보 알림 권유 → 이번 주 챙길 일(한 번에 알림)
//       → 다음 예배 → 주보 미션 + 연속 도장 → 주보 전체(한 줄 목록 → 바텀시트) → 알림 설정
// PC(본문 칸 ≥ 760px)는 오른쪽 칸에 다음 예배·알림 설정·이번 주 받을 알림·미션을 펼친다.
//
// 날짜·시각은 소식 글에서 읽는다(bulletinWeek.ts). 못 읽은 소식은 날짜 없는 안내로 보일 뿐 빠지지 않는다.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useDigitalBulletin, useDigitalBulletinIssue, useDigitalBulletinIssues } from '../../../../hooks/useDigitalBulletin'
import type { BulletinData, BulletinReminder, ExtraBlock } from '../../../../types/digitalBulletin'
import { kstNow } from '../../../../utils/date'
import { safeStorage } from '../../../../utils/safeStorage'
import { showToast } from '../../../../utils/toast'
import {
  bestOption,
  eventStatus,
  formatMinutes,
  fromKstIso,
  itemKey,
  parseBulletinWeek,
  parseSunday,
  REMIND_OPTIONS,
  remindAt,
  reminderBody,
  reminderTitle,
  todoItems,
  toKstIso,
  topThree,
  whenLabel,
  WEEKDAY_KO,
  type RemindOption,
  type TodoItem,
} from './bulletinWeek'
import { useBulletinAlarms } from './useBulletinAlarms'
import { WIcon, type WeeklyIconName } from './WeeklyIcons'
import {
  AlarmPreview,
  BulkSheet,
  EventSheet,
  ExtraSheet,
  LockPreview,
  NewsSheet,
  PushCard,
  SermonSheet,
  SettingsRules,
  StatusChip,
  VerseSheet,
  verseLabel,
  WeekSheet,
  WeeklySheet,
  WorshipSheet,
} from './WeeklySheets'
import {
  dayLabel,
  dayTimeLabel,
  isWeekComplete,
  markMission,
  missionDone,
  missionStreak,
  MISSIONS,
  nextWorship,
  parseAccounts,
  sermonEntries,
  sundayServices,
  weekAlarms,
  weekKeyOf,
  type MissionKey,
} from './weeklyModel'
import './bulletinWeekly.css'

type Sheet =
  | { k: 'event'; index: number }
  | { k: 'extra'; i: number }
  | { k: 'verse' | 'sermon' | 'worship' | 'news' | 'week' | 'bulk' }
  | { k: 'settings'; justOn?: boolean }

const OPTIN_LATER_KEY = 'bw-optin-later'

/** 1분마다 다시 그려 상태 칩(오늘·진행 중·지남)이 저절로 바뀌게 */
const useMinuteNow = () => {
  const [now, setNow] = useState(kstNow)
  useEffect(() => {
    const id = window.setInterval(() => setNow(kstNow()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

const issueTitle = (date: string, fallback: string) => {
  const d = parseSunday(date)
  return d ? `${d.getMonth() + 1}월 ${d.getDate()}일 주보` : fallback
}

const extraIcon = (b: ExtraBlock): WeeklyIconName => {
  if (/계좌|헌금/.test(b.title)) return 'card'
  if (/결정|당회|회의/.test(b.title)) return 'gavel'
  if (/봉사|섬기|기도|주방/.test(b.title)) return 'people'
  return 'list'
}

export interface BulletinWeeklyProps {
  /** 종이 주보 원본 열기 — bulletinId 가 없으면 최신 주보 */
  onOpenPaper: (bulletinId: number | null) => void
}

const BulletinWeekly = ({ onOpenPaper }: BulletinWeeklyProps) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const now = useMinuteNow()

  /* ── 어느 주보를 보나 ── */
  const latest = useDigitalBulletin()
  const issuesQ = useDigitalBulletinIssues()
  const issues = useMemo(() => issuesQ.data ?? [], [issuesQ.data])
  const [pickedId, setPickedId] = useState<number | null>(null)
  const pastQ = useDigitalBulletinIssue(pickedId)
  const isLatest = pickedId == null || pickedId === latest.bulletinId
  const data: BulletinData | undefined = isLatest ? latest.data : pastQ.data?.data
  const currentId = isLatest ? latest.bulletinId : pickedId
  const idx = issues.findIndex(i => i.bulletin_id === currentId)
  const older = idx >= 0 ? issues[idx + 1] : isLatest ? issues.find(i => i.bulletin_id !== latest.bulletinId) : undefined
  const newer = idx > 0 ? issues[idx - 1] : undefined
  const goIssue = (id: number | null) => {
    setPickedId(id == null || id === latest.bulletinId || id === issues[0]?.bulletin_id ? null : id)
    setSheet(null)
  }

  /* ── 알림으로 들어왔나 ── */
  const [arrived, setArrived] = useState(false)
  useEffect(() => {
    if (searchParams.get('from') !== 'push') return
    setArrived(true)
    setPickedId(null)
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete('from')
        return next
      },
      { replace: true },
    )
  }, [searchParams, setSearchParams])

  const [sheet, setSheet] = useState<Sheet | null>(null)
  const alarms = useBulletinAlarms()

  const week = useMemo(() => (data ? parseBulletinWeek(data) : null), [data])
  const weekKey = data ? weekKeyOf(week?.sunday ?? null, data.date) : ''
  const keyPrefix = `${weekKey}:`

  /* ── 챙길 일 + 내가 고른 알림 ── */
  const todos: TodoItem[] = useMemo(() => (week && isLatest ? todoItems(week, now) : []), [isLatest, now, week])
  const mine = useMemo(() => alarms.reminders.filter(r => r.item_key.startsWith(keyPrefix)), [alarms.reminders, keyPrefix])
  const chosen = useMemo(() => {
    const map = new Map<number, RemindOption>()
    for (const item of todos) {
      const r = mine.find(x => x.item_key === itemKey(data!, item.ev))
      if (!r) continue
      const at = fromKstIso(r.remind_at).getTime()
      const opt = REMIND_OPTIONS.find(o => remindAt(item, o, now)?.getTime() === at) ?? bestOption(item, now)
      if (opt) map.set(item.ev.index, opt)
    }
    return map
  }, [data, mine, now, todos])

  const buildReminder = useCallback(
    (item: TodoItem, opt: RemindOption): BulletinReminder | null => {
      const at = remindAt(item, opt, now)
      if (!at || !data) return null
      return { item_key: itemKey(data, item.ev), title: reminderTitle(item, opt), body: reminderBody(item), remind_at: toKstIso(at) }
    },
    [data, now],
  )

  const saveItems = async (picked: { item: TodoItem; opt: RemindOption }[]) => {
    const items = picked.map(p => buildReminder(p.item, p.opt)).filter((x): x is BulletinReminder => !!x)
    if (await alarms.setReminders(keyPrefix, items)) {
      setSheet(null)
      showToast(items.length ? t('bwBulkDone').replace('{n}', String(items.length)) : t('bwBulkCleared'), 'success')
    }
  }

  const toggleItem = async (item: TodoItem) => {
    const current = [...chosen.entries()]
      .map(([index, opt]) => ({ item: todos.find(x => x.ev.index === index)!, opt }))
      .filter(p => p.item)
    const has = chosen.has(item.ev.index)
    const opt = bestOption(item, now)
    const next = has ? current.filter(p => p.item.ev.index !== item.ev.index) : opt ? [...current, { item, opt }] : current
    const items = next.map(p => buildReminder(p.item, p.opt)).filter((x): x is BulletinReminder => !!x)
    if (await alarms.setReminders(keyPrefix, items)) showToast(has ? t('bwItemOff') : t('bwItemOn'), 'success')
  }

  /* ── 새 주보 알림 권유 ── */
  const [optinLater, setOptinLater] = useState(() => safeStorage.get(OPTIN_LATER_KEY))
  const showOptin = isLatest && alarms.ready && !alarms.settings.new_bulletin && optinLater !== weekKey
  const enableNew = async () => {
    if (await alarms.setSettings({ new_bulletin: true }, true)) setSheet({ k: 'settings', justOn: true })
  }

  /* ── 미션 ── */
  // 기록은 이 기기 localStorage(safeStorage) — tick 은 저장 후 다시 읽게 하는 신호
  const [missionTick, setMissionTick] = useState(0)
  const [stamped, setStamped] = useState(false)
  // '알림 켜기'는 알림이 하나라도 켜져 있으면 저절로 된 것으로 본다
  const alarmOn = isLatest && alarms.loggedIn && (alarms.settings.new_bulletin || mine.length > 0 || alarms.settings.service || alarms.settings.dawn)
  const mission = useMemo(() => {
    void missionTick
    const s = missionDone(weekKey)
    if (alarmOn) s.add('alarm')
    return s
  }, [alarmOn, missionTick, weekKey])
  useEffect(() => {
    if (alarmOn && weekKey) markMission(weekKey, 'alarm')
  }, [alarmOn, weekKey])
  const mark = useCallback(
    (k: MissionKey) => {
      if (!isLatest || !weekKey || mission.has(k)) return
      markMission(weekKey, k)
      setMissionTick(n => n + 1)
      if (MISSIONS.every(m => m === k || mission.has(m))) {
        setStamped(true)
        showToast(t('bwMissionStamp'), 'success')
      }
    },
    [isLatest, mission, t, weekKey],
  )

  const streakWeeks = useMemo(() => {
    const keys = issues.map(i => weekKeyOf(parseSunday(i.date), i.date))
    if (weekKey && !keys.includes(weekKey)) keys.unshift(weekKey)
    return keys.sort().slice(-6)
  }, [issues, weekKey])

  if (!data || !week || (!isLatest && pastQ.isLoading) || latest.isLoading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="h-[520px] rounded-3xl bg-gray-200/70 dark:bg-white/[0.06] animate-pulse" />
      </div>
    )
  }

  const top = isLatest ? topThree(week, now) : week.events.slice(0, 3)
  const next = isLatest ? nextWorship(data, now) : null
  const services = sundayServices(data)
  const sermons = sermonEntries(data)
  const extras = data.extras ?? []
  const preview = weekAlarms(data, alarms.settings, alarms.reminders, now)
  const firstMine = [...chosen.entries()]
    .map(([index, opt]) => {
      const item = todos.find(x => x.ev.index === index)!
      return { item, opt, at: item ? remindAt(item, opt, now) : null }
    })
    .filter(x => x.at)
    .sort((a, b) => a.at!.getTime() - b.at!.getTime())[0]
  const streak = missionStreak(streakWeeks, weekKey)
  const allDone = MISSIONS.every(m => mission.has(m))
  const title = issueTitle(data.date, t('bwThisBulletin'))

  /* ── 블록 ── */

  const topBlock = (
    <section className="bw-blk">
      <p className="bw-kicker">{title}</p>
      <h2 className="bw-h1">{isLatest ? t('bwTop3') : t('bwTop3Past')}</h2>
      <div style={{ marginTop: 10 }}>
        {top.map((ev, i) => (
          <button key={ev.index} type="button" className="bw-r bw-press" onClick={() => setSheet({ k: 'event', index: ev.index })}>
            <span className="bw-num">{i + 1}</span>
            <span className="bw-m">
              <span className="bw-tt">{ev.title}</span>
              <span className="bw-ss">{[whenLabel(ev), ev.place].filter(Boolean).join(' · ') || ev.body.split('\n')[0]}</span>
            </span>
            {isLatest && <StatusChip st={eventStatus(ev, now)} />}
          </button>
        ))}
        {top.length === 0 && <p className="bw-cap">{t('bwNoNews')}</p>}
      </div>
    </section>
  )

  const optinBlock = alarms.settings.new_bulletin ? (
    <section className="bw-blk bw-only-mobile" style={{ paddingBlock: 14 }}>
      <div className="bw-r" style={{ padding: 0 }}>
        <span className="bw-ic is-brand">
          <WIcon name="bell" />
        </span>
        <span className="bw-m">
          <span className="bw-tt">{t('bwNewOn')}</span>
          <span className="bw-ss">{t('bwNewOnSub')}</span>
        </span>
        <button type="button" className="bw-btn is-sm" onClick={() => setSheet({ k: 'settings' })}>
          {t('bwSettings')}
        </button>
      </div>
    </section>
  ) : showOptin ? (
    <section className="bw-blk bw-optin">
      <div className="bw-row" style={{ alignItems: 'flex-start' }}>
        <span className="bw-optin-ic">
          <WIcon name="bell" />
        </span>
        <div className="bw-grow">
          <p className="bw-h2" style={{ whiteSpace: 'pre-line' }}>
            {t('bwOptinTitle')}
          </p>
          <p className="bw-cap" style={{ marginTop: 4 }}>
            {t('bwOptinSub')}
          </p>
        </div>
      </div>
      <div style={{ margin: '14px 0' }}>
        <PushCard title={t('bwOptinPushTitle').replace('{title}', title)} body={`꼭 알아둘 3가지 · ${top.map(e => e.title).join(' · ')}`} time={t('bwNow')} />
      </div>
      <div className="bw-row" style={{ gap: 8 }}>
        <button
          type="button"
          className="bw-btn"
          style={{ flex: 1 }}
          onClick={() => {
            safeStorage.set(OPTIN_LATER_KEY, weekKey)
            setOptinLater(weekKey)
          }}
        >
          {t('bwLater2')}
        </button>
        <button type="button" className="bw-btn is-pri" style={{ flex: 2 }} disabled={alarms.busy} onClick={enableNew}>
          {t('bwOptinCta')}
        </button>
      </div>
    </section>
  ) : null

  const todoBlock =
    isLatest && todos.length > 0 ? (
      <section className="bw-blk">
        <h2 className="bw-h1">{t('bwTodoTitle').replace('{n}', String(todos.length))}</h2>
        {todos.map((item, i) => {
          const label = dayLabel(item.at, now)
          const prevLabel = i > 0 ? dayLabel(todos[i - 1].at, now) : ''
          const near = label === '오늘' || label === '내일'
          const opt = chosen.get(item.ev.index)
          return (
            <div key={item.ev.index}>
              {label !== prevLabel && <div className={`bw-day ${near ? 'is-near' : ''}`}>{near ? `${label} · ${WEEKDAY_KO[item.at.getDay()]}` : label}</div>}
              <button type="button" className="bw-r bw-press" style={{ padding: '10px 0' }} onClick={() => setSheet({ k: 'event', index: item.ev.index })}>
                <span className="bw-m">
                  <span className="bw-tt">{item.ev.title}</span>
                  <span className="bw-ss">{[item.ev.minutes != null ? formatMinutes(item.ev.minutes) : '', item.ev.place].filter(Boolean).join(' · ')}</span>
                </span>
                {opt ? (
                  <span className="bw-chip is-soon">
                    <WIcon name="bell" className="!w-3 !h-3" />
                    {{ eve: t('bwOptEve'), morn: t('bwOptMornShort'), h1: t('bwOptH1'), m30: t('bwOptM30') }[opt]}
                  </span>
                ) : (
                  <StatusChip st={eventStatus(item.ev, now)} />
                )}
              </button>
            </div>
          )
        })}
        <div style={{ marginTop: 14 }}>
          {chosen.size > 0 ? (
            <div className="bw-done">
              <div className="bw-row">
                <span className="bw-okc">
                  <WIcon name="check" />
                </span>
                <b className="bw-grow">{t('bwTodoBooked').replace('{n}', String(chosen.size))}</b>
                <button type="button" className="bw-btn is-sm" style={{ background: 'var(--bw-card)' }} onClick={() => setSheet({ k: 'bulk' })}>
                  {t('bwChange')}
                </button>
              </div>
              {firstMine && (
                <div style={{ marginTop: 12 }}>
                  <LockPreview label={t('bwFirstAlarm')}>
                    <PushCard title={reminderTitle(firstMine.item, firstMine.opt)} body={reminderBody(firstMine.item)} time={dayTimeLabel(firstMine.at!, now)} />
                  </LockPreview>
                </div>
              )}
            </div>
          ) : (
            <>
              <button type="button" className="bw-btn is-pri is-full is-big" onClick={() => setSheet({ k: 'bulk' })}>
                <WIcon name="bell" />
                {t('bwTodoCta')}
              </button>
              <p className="bw-cap" style={{ textAlign: 'center', marginTop: 8 }}>
                {t('bwTodoCtaSub')}
              </p>
            </>
          )}
        </div>
      </section>
    ) : null

  const serviceOn = next?.serviceName ? alarms.settings.service && alarms.settings.services.includes(next.serviceName) : false
  const nextBlock = next ? (
    <section className="bw-blk" style={{ paddingBlock: 18 }}>
      <div className="bw-r" style={{ padding: 0 }}>
        <span className="bw-ic is-brand">
          <WIcon name="clock" />
        </span>
        <span className="bw-m">
          <span className="bw-ss" style={{ margin: '0 0 1px' }}>
            {next.live ? t('bwLive') : next.serviceName ? t('bwSundayWorship') : t('bwNextWorship')}
          </span>
          <span className="bw-tt">
            {next.live ? next.title : `${dayTimeLabel(next.at, now)} ${next.title}`}
          </span>
          {next.sub && <span className="bw-ss">{next.sub}</span>}
        </span>
        {next.serviceName && !next.live && (
          <button
            type="button"
            className={`bw-bell ${serviceOn ? 'is-on' : ''}`}
            disabled={alarms.busy}
            onClick={() => {
              const name = next.serviceName!
              const list = serviceOn ? alarms.settings.services.filter(s => s !== name) : [...new Set([...alarms.settings.services, name])]
              void alarms.setSettings({ service: list.length > 0, services: list }, !serviceOn).then(ok => {
                if (ok) showToast(serviceOn ? t('bwServiceOff') : t('bwServiceOn').replace('{name}', name), 'success')
              })
            }}
          >
            <WIcon name={serviceOn ? 'check' : 'bell'} />
            {serviceOn ? t('bwBellOn') : t('bwBell')}
          </button>
        )}
      </div>
    </section>
  ) : null

  const bibleTarget = sermons.find(s => s.link)?.link ?? null
  const missionBlock = isLatest ? (
    <section className="bw-blk">
      <div className="bw-row" style={{ justifyContent: 'space-between' }}>
        <h2 className="bw-h2">{t('bwMission')}</h2>
        <span className={`bw-chip bw-tnum ${allDone ? 'is-now' : 'is-soon'}`}>{MISSIONS.filter(m => mission.has(m)).length}/3</span>
      </div>
      <p className="bw-cap" style={{ margin: '2px 0 6px' }}>
        {allDone ? t('bwMissionDone') : t('bwMissionSub')}
      </p>
      {MISSIONS.map(k => {
        const on = mission.has(k)
        const label = { alarm: t('bwMisAlarm'), bible: t('bwMisBible'), news: t('bwMisNews') }[k]
        return (
          <button
            key={k}
            type="button"
            className={`bw-mis ${on ? 'is-on' : ''}`}
            onClick={() => {
              if (k === 'alarm') setSheet({ k: 'settings' })
              else if (k === 'news') {
                mark('news')
                setSheet({ k: 'news' })
              } else if (bibleTarget) {
                mark('bible')
                navigate(bibleTarget)
              } else setSheet({ k: 'sermon' })
            }}
          >
            <span className="bw-mis-c">
              <WIcon name="check" />
            </span>
            <span className="bw-mis-t">{label}</span>
            <WIcon name="chev" className="bw-chev" />
          </button>
        )
      })}
      {streakWeeks.length > 1 && (
        <>
          <div className="bw-streak" aria-hidden="true">
            {streakWeeks.map(k => {
              const done = k === weekKey ? allDone : isWeekComplete(k)
              const cur = k === weekKey
              return (
                <i key={k} className={`${done ? 'is-on' : cur ? 'is-now' : ''} ${done && cur && stamped ? 'is-stamp' : ''}`}>
                  {done ? '✓' : Number(k.slice(-2))}
                </i>
              )
            })}
          </div>
          <p className="bw-cap" style={{ marginTop: 8 }}>
            {streak > 0 ? t('bwStreak').replace('{n}', String(streak)) : t('bwStreakStart')}
          </p>
        </>
      )}
    </section>
  ) : null

  type Row = { key: string; icon: WeeklyIconName; label: string; value: string; open: () => void }
  const rows: Row[] = [
    data.title && { key: 'verse', icon: 'book' as const, label: verseLabel(data.title, t), value: data.subtitle.replace(/[()]/g, ''), open: () => setSheet({ k: 'verse' }) },
    sermons.length > 0 && { key: 'sermon', icon: 'mega' as const, label: t('bwSermon'), value: sermons[0].title, open: () => setSheet({ k: 'sermon' }) },
    services.length > 0 && {
      key: 'worship',
      icon: 'clock' as const,
      label: t('bwWorship'),
      value: t('bwWorshipValue').replace('{n}', String(services.length)).replace('{time}', formatMinutes(services[0].minutes).replace('오전 ', '')),
      open: () => setSheet({ k: 'worship' }),
    },
    week.events.length > 0 && {
      key: 'news',
      icon: 'cal' as const,
      label: t('bwNews'),
      value: t('bwCount').replace('{n}', String(week.events.length)),
      open: () => {
        mark('news')
        setSheet({ k: 'news' })
      },
    },
    (data.weeklySchedule.length > 0 || week.later.length > 0) && {
      key: 'week',
      icon: 'walk' as const,
      label: t('bwWeek'),
      value: week.later.length ? t('bwWeekValue') : '',
      open: () => setSheet({ k: 'week' }),
    },
    ...extras.map((b, i) => ({
      key: `x${i}`,
      icon: extraIcon(b),
      label: b.title.replace(/\s*\([^)]*\)\s*$/, ''),
      value:
        b.kind === 'list'
          ? t('bwCount').replace('{n}', String(b.items.length))
          : b.kind === 'note' && parseAccounts(b.content)
            ? t('bwTapCopy')
            : b.kind === 'table'
              ? t('bwPlaces').replace('{n}', String(b.columns.length))
              : '',
      open: () => setSheet({ k: 'extra', i }),
    })),
  ].filter(Boolean) as Row[]

  const listBlock = (
    <section className="bw-blk" style={{ paddingBlock: '10px 12px' }}>
      <h2 className="bw-h2" style={{ padding: '10px 0 4px' }}>
        {t('bwAll')}
      </h2>
      {rows.map(r => (
        <button key={r.key} type="button" className="bw-r bw-press" onClick={r.open}>
          <span className="bw-ic">
            <WIcon name={r.icon} />
          </span>
          <span className="bw-m">
            <span className="bw-tt">{r.label}</span>
          </span>
          {r.value && <span className="bw-vv">{r.value}</span>}
          <WIcon name="chev" className="bw-chev" />
        </button>
      ))}
    </section>
  )

  const settingsRow = isLatest ? (
    <section className="bw-blk bw-only-mobile" style={{ paddingBlock: 6 }}>
      <button type="button" className="bw-r bw-press" onClick={() => setSheet({ k: 'settings' })}>
        <span className="bw-ic">
          <WIcon name="bell" />
        </span>
        <span className="bw-m">
          <span className="bw-tt">{t('bwSettingsTitle')}</span>
        </span>
        <span className="bw-vv">
          {[alarms.settings.new_bulletin && t('bwSumNew'), mine.length > 0 && t('bwSumItems').replace('{n}', String(mine.length))].filter(Boolean).join(' · ')}
        </span>
        <WIcon name="chev" className="bw-chev" />
      </button>
    </section>
  ) : null

  const rules = (
    <SettingsRules
      data={data}
      settings={alarms.settings}
      itemCount={mine.length}
      busy={alarms.busy}
      onChange={(patch, on) => void alarms.setSettings(patch, on)}
      onPickItems={() => setSheet({ k: 'bulk' })}
    />
  )

  const settingsPanel = isLatest ? (
    <>
      <section className="bw-blk">
        <h2 className="bw-h2">{t('bwSettingsPanel')}</h2>
        <p className="bw-cap" style={{ margin: '2px 0 6px' }}>
          {t('bwSettingsPanelSub')}
        </p>
        {alarms.loggedIn ? (
          rules
        ) : (
          <button type="button" className="bw-btn is-pri is-full" style={{ marginTop: 8 }} onClick={() => navigate('/login')}>
            {t('bwLoginForAlarm')}
          </button>
        )}
      </section>
      {alarms.loggedIn && (
        <section className="bw-blk">
          <AlarmPreview alarms={preview} now={now} />
        </section>
      )}
    </>
  ) : null

  /* ── 시트 ── */
  const sheetEvent = sheet?.k === 'event' ? week.events.find(e => e.index === sheet.index) : undefined
  const sheetTodo = sheetEvent ? todos.find(x => x.ev.index === sheetEvent.index) ?? null : null

  return (
    <div className="bw-root px-0 lg:px-6">
      <header className="bw-head">
        <button type="button" className="bw-navbtn" aria-label={t('bwOlder')} disabled={!older} onClick={() => older && goIssue(older.bulletin_id)}>
          <WIcon name="left" />
        </button>
        <span className="bw-head-title">{title}</span>
        <button type="button" className="bw-navbtn" aria-label={t('bwNewer')} disabled={isLatest} onClick={() => goIssue(newer?.bulletin_id ?? null)}>
          <WIcon name="right" />
        </button>
        <span className="bw-grow">
          {arrived && isLatest && <span className="bw-chip is-new">NEW</span>}
          <span className="bw-head-sub">{isLatest ? t('bwAutoMade') : t('bwPastIssue')}</span>
        </span>
        <button type="button" className="bw-btn is-sm" onClick={() => onOpenPaper(currentId)}>
          <WIcon name="paper" />
          {t('bwPaper')}
        </button>
      </header>

      {arrived && isLatest && (
        <div className="bw-arrived" style={{ marginBottom: 10 }}>
          <span className="bw-chip is-new">NEW</span>
          <span className="bw-grow">{t('bwArrived')}</span>
          <button type="button" className="bw-x" aria-label={t('bwClose')} onClick={() => setArrived(false)}>
            ×
          </button>
        </div>
      )}

      <div className="bw-cols">
        <div className="bw-col">
          {topBlock}
          <div className="bw-only-mobile">{optinBlock}</div>
          {todoBlock}
          <div className="bw-only-mobile bw-col">
            {nextBlock}
            {missionBlock}
          </div>
          {listBlock}
          {settingsRow}
        </div>
        <div className="bw-col is-side bw-only-pc">
          <div className="bw-col">
            {nextBlock}
            {!alarms.settings.new_bulletin && optinBlock}
            {settingsPanel}
            {missionBlock}
          </div>
        </div>
      </div>

      <p className="bw-src">
        {t('bwSource')}{' '}
        <button type="button" className="bw-link" onClick={() => onOpenPaper(currentId)}>
          {t('bwSourceOpen')}
        </button>
      </p>

      {sheetEvent && (
        <EventSheet
          ev={sheetEvent}
          now={now}
          todo={sheetTodo}
          alarmOpt={chosen.get(sheetEvent.index) ?? null}
          onToggleAlarm={sheetTodo ? () => void toggleItem(sheetTodo) : null}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.k === 'verse' && <VerseSheet data={data} onClose={() => setSheet(null)} onRead={() => mark('bible')} />}
      {sheet?.k === 'sermon' && <SermonSheet data={data} onClose={() => setSheet(null)} onRead={() => mark('bible')} />}
      {sheet?.k === 'worship' && <WorshipSheet data={data} now={now} onClose={() => setSheet(null)} />}
      {sheet?.k === 'news' && <NewsSheet week={week} now={now} onOpen={index => setSheet({ k: 'event', index })} onClose={() => setSheet(null)} />}
      {sheet?.k === 'week' && <WeekSheet data={data} week={week} now={now} onClose={() => setSheet(null)} />}
      {sheet?.k === 'extra' && extras[sheet.i] && <ExtraSheet block={extras[sheet.i]} onClose={() => setSheet(null)} />}
      {sheet?.k === 'bulk' && (
        <BulkSheet todos={todos} now={now} chosen={chosen} busy={alarms.busy} onSubmit={p => void saveItems(p)} onClose={() => setSheet(null)} />
      )}
      {sheet?.k === 'settings' && (
        <WeeklySheet title={sheet.justOn ? t('bwJustOnTitle') : t('bwSettingsTitle')} onClose={() => setSheet(null)}>
          {sheet.justOn && (
            <p className="bw-cap" style={{ margin: '-4px 0 8px' }}>
              {t('bwJustOnSub')}
            </p>
          )}
          {alarms.loggedIn ? (
            <>
              {rules}
              <div className="bw-hr" />
              <AlarmPreview alarms={preview} now={now} />
            </>
          ) : (
            <button type="button" className="bw-btn is-pri is-full" onClick={() => navigate('/login')}>
              {t('bwLoginForAlarm')}
            </button>
          )}
          <button type="button" className="bw-btn is-full" style={{ marginTop: 16 }} onClick={() => setSheet(null)}>
            {t('bwDone')}
          </button>
        </WeeklySheet>
      )}
    </div>
  )
}

export default BulletinWeekly
