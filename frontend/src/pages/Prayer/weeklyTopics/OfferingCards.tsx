// 라이트 테마 — 올려드리는 카드. 풍경 사진 카드 한 장씩 읽고, 길게 눌러 아멘하면 카드가 하늘로 날아오른다.
import type { CSSProperties } from 'react'
import { AmenBurst, HoldAmenButton, ORDINAL, StepNav, useAmenStep, type PrayerStageProps } from './HoldAmen'

const OfferingCards = (props: PrayerStageProps & { arts: string[] }) => {
  const { items, weekLabel, idx, setIdx, totalAmen, onUnamen, arts } = props
  const step = useAmenStep(props, 950)
  const n = items.length
  const mine = items.filter((i) => i.is_amened).length
  const done = idx >= n
  const artOf = (i: number) => arts[i % arts.length]

  return (
    <section>
      <p className="text-[13px] font-bold text-brand lg:text-[16px]">{weekLabel}</p>
      <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-ink-strong lg:text-[30px]">한 장씩, 하나님께 올려드려요</h2>

      <div className="wpt-deck mt-6">
        {done ? (
          <div className="wpt-deck-done wpt-fade">
            <div className="wpt-deck-thumbs">
              {items.slice(0, 5).map((p, i, arr) => (
                <span
                  key={p.id ?? i}
                  style={{ backgroundImage: `url(${artOf(i)})`, ['--r' as string]: `${(i - (arr.length - 1) / 2) * 8}deg` } as CSSProperties}
                  className={p.is_amened ? '' : 'is-off'}
                />
              ))}
            </div>
            <p className="mt-6 text-[22px] font-extrabold text-ink-strong lg:text-[28px]">
              {mine === n ? `${n}장 모두 올려드렸어요` : `${mine}장을 올려드렸어요`}
            </p>
            <p className="mt-2 text-[14px] text-gray-500 lg:text-[17px]">이번 주 성도들과 {totalAmen}번 함께 기도했어요</p>
            <button type="button" onClick={() => setIdx(0)} className="mt-6 wpt-nav">
              처음부터 다시
            </button>
          </div>
        ) : (
          items.map((p, i) => {
            const depth = i - idx
            // 앞 카드 하나(날아가는 중)와 뒤로 두 장까지만 그린다
            if (depth < -1 || depth > 2) return null
            const flying = depth === -1 || (depth === 0 && p.is_amened && step.burst)
            return (
              <article
                key={p.id ?? i}
                className={`wpt-card ${flying ? 'is-flying' : ''}`}
                style={{ ['--k' as string]: Math.max(depth, 0), zIndex: 10 - depth } as CSSProperties}
                aria-hidden={depth !== 0}
              >
                <div className="wpt-card-photo" style={{ backgroundImage: `url(${artOf(i)})` }}>
                  <span className="wpt-card-badge">
                    {ORDINAL[i] ?? `${i + 1}번째`} 기도 · {i + 1}/{n}
                  </span>
                </div>
                <div className="wpt-card-body">
                  {p.title && <p className="mb-1.5 text-[17px] font-bold leading-[1.55] text-ink-strong break-keep lg:text-[22px]">{p.title}</p>}
                  <p className="text-[17px] font-semibold leading-[1.75] tracking-[-0.02em] text-ink-strong break-keep lg:text-[22px]">
                    {p.body || p.title}
                  </p>
                  {p.scripture && <p className="mt-2.5 text-[13px] font-bold text-brand lg:text-[15.5px]">{p.scripture}</p>}
                  {depth === 0 && (
                    <div className="relative mt-6 flex items-end justify-between gap-4">
                      <p className="pb-8 text-[12.5px] text-gray-500 lg:text-[15px]">
                        {p.amen_count ? (
                          <>
                            <b className="text-brand">{p.amen_count}명</b>이 올려드렸어요
                          </>
                        ) : (
                          '첫 기도를 올려 주세요'
                        )}
                      </p>
                      <div className="relative">
                        {step.burst && <AmenBurst seed={i} color="#ffd79a" />}
                        <HoldAmenButton step={step} tone="brand" onUnamen={() => onUnamen(p.id)} hint="길게 눌러 올려드리기" />
                      </div>
                    </div>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
      {!done && (
        <div className="mt-5">
          <StepNav idx={idx} count={n} setIdx={setIdx} />
        </div>
      )}
    </section>
  )
}

export default OfferingCards
