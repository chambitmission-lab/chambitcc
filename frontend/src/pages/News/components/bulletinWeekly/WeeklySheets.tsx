// 디지털 주보 바텀시트들 — 소식 상세 · 말씀 · 설교 · 예배 시간 · 소식 전체 · 이번 주 일정 · 안내 블록 ·
// 챙길 일 한 번에 고르기 · 알림 설정(PC 에선 같은 패널을 오른쪽 칸에 펼친다).
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet, SheetBody } from '../../../../components/common/BottomSheet'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { BulletinData, BulletinNotifySettings, ExtraBlock } from '../../../../types/digitalBulletin'
import { copyToClipboard } from '../../../../utils/clipboard'
import { showToast } from '../../../../utils/toast'
import {
  bestOption,
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
import { WIcon } from './WeeklyIcons'
import {
  dayLabel,
  dayTimeLabel,
  parseAccounts,
  sermonEntries,
  bibleLink,
  sundayServices,
  weekdayIndex,
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
  /** lg+ 에서 넓은 카드로 (소식 전체) */
  wide?: boolean
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
      {(when || ev.place) && (
        <div className="bw-row" style={{ marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <StatusChip st={eventStatus(ev, now)} />
          <span className="bw-cap">{[when, ev.place].filter(Boolean).join(' · ')}</span>
        </div>
      )}
      {ev.body && <p className="bw-body">{ev.body}</p>}
      {ev.phone && (
        <div className="bw-kv" style={{ borderTop: '1px solid var(--bw-line)' }}>
          <span className="bw-kv-v">
            {t('bwContact')} {ev.contact ?? ''}
            <br />
            <b className="bw-tnum">{ev.phone}</b>
          </span>
          <a className="bw-btn is-sm is-soft" href={`tel:${ev.phone.replace(/-/g, '')}`}>
            <WIcon name="phone" />
            {t('bwCall')}
          </a>
          <button type="button" className="bw-btn is-sm" onClick={() => copy(ev.phone!, t('bwPhone'), t)}>
            {t('bwCopy')}
          </button>
        </div>
      )}
    </WeeklySheet>
  )
}

/* ── 말씀 · 설교 · 예배 ─────────────────────────────── */

export const VerseSheet = ({ data, onClose, onRead }: { data: BulletinData; onClose: () => void; onRead: () => void }) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const link = bibleLink(data.subtitle)
  return (
    <WeeklySheet title={t('bwVerse')} onClose={onClose}>
      <p style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.45, margin: 0, whiteSpace: 'pre-line', textWrap: 'balance' }}>
        {data.title.replace(/^\d{4}\s*표어\s*\n?/, '')}
      </p>
      <p className="bw-cap" style={{ margin: '8px 0 18px' }}>
        {data.subtitle}
      </p>
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
          {t('bwReadChapter')}
        </button>
      )}
    </WeeklySheet>
  )
}

export const SermonSheet = ({ data, onClose, onRead }: { data: BulletinData; onClose: () => void; onRead: () => void }) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const sermons = sermonEntries(data)
  return (
    <WeeklySheet title={t('bwSermon')} onClose={onClose}>
      {sermons.map((s, i) => (
        <div className="bw-kv" key={i}>
          <span className="bw-kv-v">
            <b style={{ fontSize: 15 }}>{s.title || t('bwSermon')}</b>
            {s.ref && (
              <>
                <br />
                {s.ref}
              </>
            )}
          </span>
          {s.link && (
            <button
              type="button"
              className="bw-btn is-sm is-soft"
              onClick={() => {
                onRead()
                navigate(s.link!)
              }}
            >
              {t('bwText')}
            </button>
          )}
        </div>
      ))}
      {data.worship.offering && (
        <div className="bw-kv">
          <span className="bw-kv-l">{t('bwHymn')}</span>
          <span className="bw-kv-v bw-tnum">{data.worship.offering}</span>
        </div>
      )}
      {data.worship.prayer && (
        <div className="bw-kv">
          <span className="bw-kv-l">{t('bwPrayer')}</span>
          <span className="bw-kv-v">{data.worship.prayer}</span>
        </div>
      )}
    </WeeklySheet>
  )
}

export const WorshipSheet = ({ data, now, onClose }: { data: BulletinData; now: Date; onClose: () => void }) => {
  const { t } = useLanguage()
  const slots = sundayServices(data)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const sunday = now.getDay() === 0
  return (
    <WeeklySheet title={t('bwWorship')} onClose={onClose}>
      {data.worship.schedule.map((s, i) => {
        const slot = slots.find(x => x.name === s.name.trim())
        const done = sunday && slot && slot.minutes + 75 <= nowMin
        const live = sunday && slot && slot.minutes <= nowMin && !done
        return (
          <div className="bw-kv" key={i} style={done ? { opacity: 0.45 } : undefined}>
            <span className={`bw-kv-l bw-tnum ${live ? 'is-brand' : ''}`} style={{ fontSize: 16, minWidth: 76 }}>
              {slot ? formatMinutes(slot.minutes) : s.time}
            </span>
            <span className="bw-kv-v">
              <b>{s.name}</b>
              <br />
              {s.preacher}
            </span>
            {live && <span className="bw-chip is-now">{t('bwLive')}</span>}
          </div>
        )
      })}
      {data.worship.prayer && (
        <p className="bw-cap" style={{ marginTop: 10 }}>
          {t('bwPrayer')} · {data.worship.prayer}
        </p>
      )}
    </WeeklySheet>
  )
}

/* ── 소식 전체 · 이번 주 일정 ───────────────────────── */

export const NewsSheet = ({ week, now, onOpen, onClose }: { week: BulletinWeek; now: Date; onOpen: (index: number) => void; onClose: () => void }) => {
  const { t } = useLanguage()
  return (
    <WeeklySheet title={t('bwNewsCount').replace('{n}', String(week.events.length))} onClose={onClose} wide>
      {/* 모바일은 한 줄 목록, lg+ 는 2열 카드(본문 두 줄 미리보기) — bw-nl */}
      <div className="bw-nl">
        {week.events.map(ev => {
          const st = eventStatus(ev, now)
          const when = whenLabel(ev)
          const preview = when ? ev.body.replace(/\s*\n\s*/g, ' ').trim() : ''
          return (
            <button type="button" key={ev.index} className={`bw-nl-item ${st?.kind === 'past' ? 'is-past' : ''}`} onClick={() => onOpen(ev.index)}>
              <span className="bw-m">
                <span className="bw-tt">{ev.title}</span>
                <span className="bw-ss">{when || ev.body.split('\n')[0]}</span>
                {preview && <span className="bw-nl-body">{preview}</span>}
              </span>
              <StatusChip st={st} />
            </button>
          )
        })}
      </div>
      {week.later.length > 0 && <LaterList week={week} />}
    </WeeklySheet>
  )
}

const LaterList = ({ week }: { week: BulletinWeek }) => {
  const { t } = useLanguage()
  return (
    <>
      <p className="bw-h2 bw-later-h" style={{ fontSize: 16, margin: '20px 0 4px' }}>
        {t('bwLater')}
      </p>
      <div className="bw-later">
      {week.later.map((x, i) => (
        <div className="bw-kv" key={i}>
          <span className="bw-kv-l is-brand bw-tnum" style={{ minWidth: 76 }}>
            {x.date ? `${x.date.getMonth() + 1}/${x.date.getDate()}(${WEEKDAY_KO[x.date.getDay()]})` : x.label}
          </span>
          <span className="bw-kv-v">{x.text}</span>
        </div>
      ))}
      </div>
    </>
  )
}

export const WeekSheet = ({ data, week, now, onClose }: { data: BulletinData; week: BulletinWeek; now: Date; onClose: () => void }) => {
  const { t } = useLanguage()
  const sunday = week.sunday
  return (
    <WeeklySheet title={t('bwWeek')} onClose={onClose}>
      {data.weeklySchedule.map((w, i) => {
        const wd = weekdayIndex(w.day)
        // 주보 주일 다음 날(월)부터 다음 주일까지
        const date = sunday && wd != null ? new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + (wd === 0 ? 7 : wd)) : null
        const isToday = date ? dayLabel(date, now) === '오늘' : false
        return (
          <div className="bw-kv" key={i}>
            <span className={`bw-kv-l ${isToday ? 'is-brand' : ''}`} style={{ minWidth: 64 }}>
              {w.day}
              {date ? ` ${date.getDate()}일` : ''}
            </span>
            <span className="bw-kv-v">
              <b>{w.event}</b>
              <br />
              {[w.time, w.location].filter(Boolean).join(' · ')}
            </span>
            {isToday && <span className="bw-chip is-today">{t('bwStToday')}</span>}
          </div>
        )
      })}
      {week.later.length > 0 && <LaterList week={week} />}
    </WeeklySheet>
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
          <div style={{ overflowX: 'auto' }}>
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
