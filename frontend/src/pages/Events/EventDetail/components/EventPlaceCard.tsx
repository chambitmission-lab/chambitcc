import type { Translation } from '../../../../locales'
import { showToast } from '../../../../utils/toast'
import { formatEventDateLabel, formatEventTime } from '../../utils/dateGrouping'
import { buildMapSearchUrl } from '../utils/calendarShare'
import { splitLocation } from '../utils/eventDisplay'
import { SectionCard } from './EventAvatar'

interface EventPlaceCardProps {
  location?: string
  startDatetime: string
  t: Translation
}

/** 장식용 지도 타일 — 실제 지도는 카카오맵으로 연다 */
const MapTile = () => (
  <div className="evd-map w-[88px] h-[88px] lg:w-[104px] lg:h-[104px] rounded-[18px] border border-gray-200/70 dark:border-white/[0.06] shrink-0" aria-hidden="true">
    <svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice">
      <path d="M-5 96 C25 86 40 108 70 98 S110 80 125 90 L125 125 L-5 125Z" fill="var(--evd-map-water)" />
      <rect x="10" y="12" width="34" height="26" rx="8" fill="var(--evd-map-park)" />
      <rect x="80" y="18" width="30" height="22" rx="8" fill="var(--evd-map-park)" />
      <path d="M-5 62 L125 52" stroke="var(--evd-map-road)" strokeWidth="8" />
      <path d="M54 -5 L66 125" stroke="var(--evd-map-road)" strokeWidth="7" />
      <path d="M-5 20 L50 66 L125 74" stroke="var(--evd-map-road)" strokeWidth="3.5" fill="none" />
    </svg>
    <div className="evd-pin">
      <div className="evd-pin-dot" />
      <div className="evd-pin-shadow" />
    </div>
  </div>
)

const ghostBtn =
  'inline-flex items-center gap-1 h-9 px-3 rounded-[10px] bg-gray-100 dark:bg-white/[0.07] text-gray-700 dark:text-white/80 text-[13.5px] lg:text-[14px] font-bold hover:bg-[var(--brand-soft-strong)] hover:text-brand transition-colors'

/** 어디서 만나요 — 지도 타일 · 장소명/지역 · 카카오맵 · 주소 복사 */
export const EventPlaceCard = ({ location, startDatetime, t }: EventPlaceCardProps) => {
  if (!location) return null
  const { name, sub } = splitLocation(location)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location)
      showToast(t.addressCopied, 'success')
    } catch {
      // 클립보드 접근 불가 환경 — 조용히 무시
    }
  }

  return (
    <SectionCard title={t.placeTitle}>
      <div className="flex items-center gap-4">
        <MapTile />
        <div className="min-w-0">
          <p className="text-ink-strong text-[17px] lg:text-[18.5px] font-extrabold leading-[1.35] break-keep">{name}</p>
          <p className="mt-0.5 text-gray-500 dark:text-white/55 text-[14px] lg:text-[15px] font-medium">
            {sub ? `${sub} · ` : ''}
            {formatEventDateLabel(startDatetime)} {formatEventTime(startDatetime)}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <a href={buildMapSearchUrl(location)} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6.5-8 12-8 12s-8-5.5-8-12a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {t.openKakaoMap}
            </a>
            <button type="button" onClick={copy} className={ghostBtn}>
              {t.copyAddress}
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
