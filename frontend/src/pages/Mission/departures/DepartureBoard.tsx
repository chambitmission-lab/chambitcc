import { memo } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { regionMeta } from '../missionData'
import { SplitFlap } from './SplitFlap'
import { localHM, seoulHM } from './missionTime'
import type { PrayerRoute } from './routes'

// 출발 안내판 — 노선(선교사) 한 줄에 현지 시각·도시·선교사·기도 상태.
// 행을 누르면 그 노선의 탑승권이 열린다.

const cityLabel = (r: PrayerRoute, ko: boolean) =>
  ko ? r.detail.city : r.detail.cityEn.toUpperCase().slice(0, 10)

const BoardRow = memo(function BoardRow({
  route,
  nowMs,
  selected,
  boarded,
  ko,
  onSelect,
  statusWait,
  statusDone,
}: {
  route: PrayerRoute
  nowMs: number
  selected: boolean
  boarded: boolean
  ko: boolean
  onSelect: (key: string) => void
  statusWait: string
  statusDone: string
}) {
  const city = cityLabel(route, ko)
  const time = localHM(route.detail.tz, nowMs).replace(':', '')
  return (
    <button
      type="button"
      className={`dep-row${selected ? ' is-selected' : ''}`}
      style={{ ['--rc' as string]: regionMeta[route.region].color }}
      onClick={() => onSelect(route.key)}
      aria-pressed={selected}
    >
      <SplitFlap text={time} />
      <SplitFlap text={city} tight={city.length > (ko ? 4 : 6)} />
      <SplitFlap text={route.missionary.name} tight={route.missionary.name.length > 3} />
      <span className={`dep-status${boarded ? ' is-done' : ''}`}>{boarded ? statusDone : statusWait}</span>
    </button>
  )
})

export function DepartureBoard({
  routes,
  nowMs,
  selectedKey,
  boarded,
  onSelect,
}: {
  routes: PrayerRoute[]
  nowMs: number
  selectedKey: string | null
  boarded: ReadonlySet<string>
  onSelect: (key: string) => void
}) {
  const { t, language } = useLanguage()
  const ko = language === 'ko'
  return (
    <section className="dep-board" aria-label={t('missionBoardTitle')}>
      <header className="dep-board__head">
        <div>
          <div className="dep-board__title">PRAYER DEPARTURES</div>
          <div className="dep-board__sub">{t('missionBoardSub')}</div>
        </div>
        <div className="dep-board__clock">
          <small>SEOUL</small>
          <span>{seoulHM(nowMs)}</span>
        </div>
      </header>
      <div className="dep-cols" aria-hidden="true">
        <span>{t('missionBoardColLocal')}</span>
        <span>{t('missionBoardColCity')}</span>
        <span>{t('missionBoardColMissionary')}</span>
        <span>{t('missionBoardColStatus')}</span>
      </div>
      <div className="dep-rows">
        {routes.map(r => (
          <BoardRow
            key={r.key}
            route={r}
            nowMs={nowMs}
            selected={r.key === selectedKey}
            boarded={boarded.has(r.key)}
            ko={ko}
            onSelect={onSelect}
            statusWait={t('missionStatusWaiting')}
            statusDone={t('missionStatusPrayed')}
          />
        ))}
      </div>
    </section>
  )
}
