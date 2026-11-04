import { useLayoutEffect, useRef, useState } from 'react'
import { CAMP_SIDES, TRIBE_BY_ID, TRIBE_COLOR, type CampSideId, type TribeId } from '../../tribes'
import { useThemeArt } from '../../../../../hooks/useThemeArt'
import { TABERNACLE_ART } from '../../../../../utils/themeAssets'

// 민수기 2장 광야 진영 배치도 — 가운데 회막(낮 구름 / 밤 불기둥 삽화), 사방에 세 지파씩.
// 336×352 고정 좌표로 그리고 컨테이너 폭에 맞춰 통째로 확대·축소한다(최대 1.6배).
// 위가 북쪽, 오른쪽이 해 뜨는 동쪽.

const BASE_W = 336
const BASE_H = 352
const H_TILE = { w: 82, h: 50 }
const V_TILE = { w: 64, h: 74 }

/** 방향별 자리 — 북/남은 가로 한 줄, 동/서는 세로 한 줄. 가운데 칸에 기수가 선다. */
const SLOTS: Record<CampSideId, { x: number; y: number; w: number; h: number }[]> = {
  north: [127, 41, 213].map((x) => ({ x, y: 0, ...H_TILE })),
  south: [127, 41, 213].map((x) => ({ x, y: 302, ...H_TILE })),
  east: [139, 220, 58].map((y) => ({ x: 272, y, ...V_TILE })),
  west: [139, 220, 58].map((y) => ({ x: 0, y, ...V_TILE })),
}

const SHORT: Record<CampSideId, string> = { east: '동', south: '남', west: '서', north: '북' }

const useContainerWidth = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(BASE_W)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

interface Props {
  selectedId: TribeId | null
  onPick: (id: TribeId) => void
}

const TribeCampMap = ({ selectedId, onPick }: Props) => {
  useThemeArt(TABERNACLE_ART)
  const [ref, width] = useContainerWidth()
  const k = Math.max(0.7, Math.min(width / BASE_W, 1.6))

  return (
    <div ref={ref} className="w-full">
      <div className="relative mx-auto" style={{ width: BASE_W * k, height: BASE_H * k }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: BASE_W, height: BASE_H, transform: `scale(${k})`, transformOrigin: '0 0' }}
        >
          {CAMP_SIDES.flatMap((side) =>
            side.members.map((id, i) => {
              const slot = SLOTS[side.id][i]
              const tribe = TRIBE_BY_ID.get(id)!
              const color = TRIBE_COLOR[id]
              const lead = i === 0
              const on = id === selectedId
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onPick(id)}
                  aria-pressed={on}
                  aria-label={`${tribe.name} 지파 — ${side.label} 진영${lead ? ' 기수' : ''}`}
                  className={[
                    'absolute rounded-[14px] flex flex-col items-center justify-center gap-[3px] transition-[background-color,transform,box-shadow] duration-200',
                    on
                      ? 'text-white scale-[1.06]'
                      : lead
                        ? 'bg-[var(--brand-soft)] text-ink-strong hover:brightness-[0.97]'
                        : 'bg-gray-100 dark:bg-white/[0.05] text-ink-strong hover:bg-gray-200/70 dark:hover:bg-white/[0.09]',
                  ].join(' ')}
                  style={{
                    left: slot.x,
                    top: slot.y,
                    width: slot.w,
                    height: slot.h,
                    ...(on ? { backgroundColor: color, boxShadow: `0 8px 18px ${color}55` } : null),
                  }}
                >
                  <span className="text-[14px] font-extrabold tracking-[-0.02em]">{tribe.name}</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: on ? '#fff' : color }} />
                    <span
                      className={[
                        'text-[10.5px] font-bold',
                        on ? 'text-white/90' : lead ? 'text-brand' : 'text-gray-500 dark:text-white/55',
                      ].join(' ')}
                    >
                      {SHORT[side.id]}
                      {lead && ' · 기수'}
                    </span>
                  </span>
                </button>
              )
            }),
          )}

          {/* 가운데 회막 — 낮엔 구름, 밤엔 불이 성막 위에 있었다(민 9:16). 삽화가 테마를 따라간다. */}
          <div
            className="absolute rounded-[18px] overflow-hidden border border-[#e3dccd] dark:border-white/[0.1] bg-[#f4f1ea] dark:bg-[#12161d] bg-cover bg-center"
            style={{ left: 72, top: 56, width: 192, height: 240, backgroundImage: 'var(--tabernacle-image)' }}
            role="img"
            aria-label="회막 — 세마포 울타리 안 서쪽에 성막, 동쪽 문 앞에 번제단과 물두멍. 낮에는 구름이, 밤에는 불이 성막 위에 있었어요."
          >
            <span className="absolute top-2 inset-x-0 text-center text-[10.5px] font-bold text-gray-500 dark:text-white/55">
              레위 자손이 둘러 지켜요
            </span>
            <div className="absolute bottom-2.5 inset-x-0 text-center">
              <span className="block font-serif-kr text-[17px] font-bold text-ink-strong">회막</span>
              <span className="block mt-0.5 text-[10.5px] text-[#5f5848] dark:text-white/60">
                <span className="dark:hidden">낮에는 구름이 덮었어요</span>
                <span className="hidden dark:inline">밤이면 불 모양이 있었어요</span>
                {' · '}
                <b className="text-brand">민 9:16</b>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TribeCampMap
