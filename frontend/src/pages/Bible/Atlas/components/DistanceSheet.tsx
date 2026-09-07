import { createPortal } from 'react-dom'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import type { AtlasPlace } from '../atlasTypes'
import { placeLabel } from '../data/places'
import {
  CHURCH,
  comparisonSentence,
  distanceFeelOf,
  formatKm,
  kmToUnits,
  miniProject,
} from '../distanceFeel'

interface DistanceSheetProps {
  from: AtlasPlace
  to: AtlasPlace
  /** 바닷길이면 걸어서가 아니라 배로 며칠인지 센다 */
  bySea: boolean
  color: string
  onClose: () => void
}

/**
 * 거리 체감 카드.
 *
 * 이 화면에서 사람들이 가장 놀라는 지점이다. "하란에서 세겜까지 700km"는
 * 그냥 숫자지만, 같은 거리를 우리 교회에서 그려 보면 그제야 몸으로 들어온다.
 * 그래서 숫자·일수보다 한국 지도 위의 원을 더 크게 보여 준다.
 *
 * 원은 등거리선의 근사다(메르카토르는 위도에 따라 축척이 달라진다).
 * 정확한 지리 도구가 아니라 감을 잡는 장치이므로 화면에도 "어림"이라고 밝힌다.
 */
const DistanceSheet = ({ from, to, bySea, color, onClose }: DistanceSheetProps) => {
  useModalBackButton(onClose)

  const feel = distanceFeelOf(from, to, bySea)
  const { map } = feel
  const center = miniProject(map, CHURCH.lat, CHURCH.lng)
  const radius = kmToUnits(map, feel.km, CHURCH.lat)
  const refPoint = miniProject(map, feel.nearest.lat, feel.nearest.lng)

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 sheet-backdrop sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md sheet-rise max-h-[88vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

        {/* 헤더 — 어디에서 어디까지 */}
        <div className="relative z-10 px-5 pt-5 pb-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <p className="atl-dist__route">
              <span>{placeLabel(from)}</span>
              <span className="atl-dist__arrow" style={{ color }} aria-hidden>
                →
              </span>
              <span>{placeLabel(to)}</span>
            </p>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 shrink-0"
              aria-label="닫기"
            >
              <span className="material-icons-round text-[20px]">close</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5">
          {/* 숫자 */}
          <div className="atl-dist__figures">
            <div>
              <span className="atl-dist__value" style={{ color }}>
                {formatKm(feel.km)}
              </span>
              <span className="atl-dist__unit">km</span>
            </div>
            <div className="atl-dist__days">
              <span className="material-icons-round text-[16px]">
                {feel.mode === 'sail' ? 'sailing' : 'directions_walk'}
              </span>
              {feel.mode === 'sail' ? '뱃길로' : '걸어서'} 약 {feel.days}일
            </div>
          </div>

          {/* 한국 지도 겹쳐 보기 */}
          <p className="atl-dist__label">참빛교회에서 같은 거리면</p>
          <div className="atl-dist__mini">
            <svg viewBox={`0 0 ${map.width} ${map.height}`} className="atl-dist__svg" aria-hidden>
              <path d={map.path} className="atl-dist__land" fillRule="evenodd" />
              <circle
                cx={center.x}
                cy={center.y}
                r={radius}
                fill={color}
                fillOpacity={0.1}
                stroke={color}
                strokeWidth={1.2}
                strokeDasharray="4 3"
              />
              {/* 비교 지점 */}
              <circle cx={refPoint.x} cy={refPoint.y} r={2.6} fill={color} />
              <text
                x={refPoint.x}
                y={refPoint.y - 6}
                textAnchor="middle"
                fontSize={9.5}
                fontWeight={800}
                className="atl-dist__ref"
              >
                {feel.nearest.name}
              </text>
              {/* 기준점 — 우리 교회 */}
              <circle cx={center.x} cy={center.y} r={3.2} fill="#fff" stroke={color} strokeWidth={2} />
              <text
                x={center.x}
                y={center.y + 12}
                textAnchor="middle"
                fontSize={9}
                fontWeight={700}
                className="atl-dist__ref"
              >
                참빛교회
              </text>
            </svg>
          </div>

          <p className="atl-dist__sentence">
            {comparisonSentence(feel)}를 <b>{feel.mode === 'sail' ? '배로' : '걸어서'}</b> 갔습니다.
          </p>
          <p className="atl-dist__note">
            직선거리 기준 어림값입니다. 실제로는 산과 사막을 돌아가야 해서 더 오래 걸렸습니다.
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default DistanceSheet
