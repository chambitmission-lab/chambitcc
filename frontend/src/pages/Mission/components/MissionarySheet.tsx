// 선교사 상세 바텀시트 — 현지 시간·시차·거리로 그곳과의 연결감을 만든다.

import { useEffect, useState } from 'react'
import { countryDetail, SEOUL_GEO, type Missionary } from '../missionData'
import CountryFlag from '../CountryFlag'
import { useLanguage } from '../../../contexts/LanguageContext'
import { PinIcon, ClockIcon, HourglassIcon, PlaneIcon, CheckIcon, HandHeartIcon } from '../MissionIcons'

/** 해당 타임존의 UTC 오프셋(ms). 지원하지 않는 타임존이면 null */
const tzOffsetMs = (tz: string, at: Date): number | null => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at)
    const get = (type: string) => Number(parts.find(p => p.type === type)?.value)
    const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
    return asUTC - Math.floor(at.getTime() / 1000) * 1000
  } catch {
    return null
  }
}

/** 두 지점 사이 대권 거리(km) */
const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

/** 선교사 상세 바텀시트 — 현지 시간·시차·거리로 "그곳"과의 연결감을 만든다 */
const MissionarySheet = ({
  missionary,
  color,
  prayedToday,
  onPray,
  onLocate,
  onClose,
}: {
  missionary: Missionary
  color: string
  prayedToday: boolean
  onPray: () => void
  onLocate: () => void
  onClose: () => void
}) => {
  const { t, language } = useLanguage()
  const detail = countryDetail[missionary.country]
  const [now, setNow] = useState(() => new Date())

  // 시트가 열려 있는 동안 현지 시간을 30초마다 갱신
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  // 배경 스크롤 잠금 — PC(lg+)에선 .mission-page 가 스스로 스크롤하는 상자라
  // body 만 잠그면 시트 뒤가 그대로 굴러간다. 둘 다 잠근다.
  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.mission-page')
    const prev = document.body.style.overflow
    const prevPage = page?.style.overflow
    document.body.style.overflow = 'hidden'
    if (page) page.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      if (page) page.style.overflow = prevPage ?? ''
    }
  }, [])

  const isKo = language === 'ko'
  const city = detail ? (isKo ? detail.city : detail.cityEn) : null

  let localTime: string | null = null
  if (detail) {
    try {
      localTime = new Intl.DateTimeFormat(isKo ? 'ko-KR' : 'en-US', {
        timeZone: detail.tz,
        hour: 'numeric',
        minute: '2-digit',
      }).format(now)
    } catch {
      localTime = null
    }
  }

  let diffText: string | null = null
  if (detail) {
    const there = tzOffsetMs(detail.tz, now)
    const seoul = tzOffsetMs('Asia/Seoul', now)
    if (there !== null && seoul !== null) {
      const diffMin = Math.round((there - seoul) / 60000)
      const h = Math.floor(Math.abs(diffMin) / 60)
      const m = Math.abs(diffMin) % 60
      const span = isKo
        ? `${h ? `${h}시간` : ''}${h && m ? ' ' : ''}${m ? `${m}분` : ''}`
        : `${h ? `${h}h` : ''}${h && m ? ' ' : ''}${m ? `${m}m` : ''}`
      diffText =
        diffMin === 0
          ? isKo ? '서울과 같은 시간이에요' : 'Same time as Seoul'
          : isKo
            ? `서울보다 ${span} ${diffMin < 0 ? '느려요' : '빨라요'}`
            : `${span} ${diffMin < 0 ? 'behind' : 'ahead of'} Seoul`
    }
  }

  const distText = detail
    ? (() => {
        const km = Math.round(haversineKm(SEOUL_GEO, detail) / 10) * 10
        const s = km.toLocaleString()
        return isKo ? `서울에서 약 ${s}km` : `About ${s}km from Seoul`
      })()
    : null

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet-panel"
        onClick={e => e.stopPropagation()}
        style={{
          ['--fc' as string]: color,
        }}
      >
        <div className="sheet-grabber" />
        <div className="sheet-head">
          <CountryFlag className="sheet-flag" country={missionary.country} />
          <div className="sheet-titles">
            <div className="sheet-name">
              {missionary.name}
              {isKo && <span className="sheet-suffix"> 선교사</span>}
            </div>
            <div className="sheet-country">
              {missionary.country}
              {city && city !== missionary.country && ` · ${city}`}
              {missionary.note && <span className="sheet-note">{missionary.note}</span>}
            </div>
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="close">
            ✕
          </button>
        </div>

        {(localTime || diffText || distText) && (
          <div className="sheet-rows">
            {localTime && (
              <div className="sheet-row">
                <span className="sheet-row-label">
                  <ClockIcon className="mi-inline" width={13} height={13} />
                  {t('missionSheetLocalTime')}
                </span>
                <span className="sheet-row-value strong">{localTime}</span>
              </div>
            )}
            {diffText && (
              <div className="sheet-row">
                <span className="sheet-row-label">
                  <HourglassIcon className="mi-inline" width={13} height={13} />
                  {t('missionSheetTimeDiff')}
                </span>
                <span className="sheet-row-value">{diffText}</span>
              </div>
            )}
            {distText && (
              <div className="sheet-row">
                <span className="sheet-row-label">
                  <PlaneIcon className="mi-inline" width={13} height={13} />
                  {t('missionSheetDistance')}
                </span>
                <span className="sheet-row-value">{distText}</span>
              </div>
            )}
          </div>
        )}

        <div className="sheet-actions">
          <button type="button" className="sheet-locate-btn" onClick={onLocate}>
            <PinIcon className="mi-inline" width={14} height={14} />
            {t('missionTodayLocate')}
          </button>
          <button
            type="button"
            className={`mission-pray-btn in-sheet ${prayedToday ? 'done' : ''}`}
            onClick={onPray}
            disabled={prayedToday}
          >
            {prayedToday ? (
              <>
                <CheckIcon className="mi-inline" width={15} height={15} />
                {t('missionPrayDone')}
              </>
            ) : (
              <>
                <HandHeartIcon size={16} className="mi-inline" />
                {t('missionPrayCta')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { MissionarySheet }
