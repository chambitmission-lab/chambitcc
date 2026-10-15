// 다크 테마 — 등불 길. 기도 하나에 등불 하나, 먼 길을 덮은 어둠이 기도할수록 물러난다.
// 삽화는 /growth 저녁 장면(양이 등불을 켜는 언덕길)을 재사용한다.
import { AmenBurst, HoldAmenButton, StepNav, useAmenStep, type PrayerStageProps } from './HoldAmen'

const LanternPath = (props: PrayerStageProps & { art: string; artReady: boolean }) => {
  const { items, weekLabel, idx, setIdx, totalAmen, onUnamen, art, artReady } = props
  const step = useAmenStep(props, 900)
  const { item } = step
  const n = items.length
  const mine = items.filter((i) => i.is_amened).length
  const done = idx >= n
  // 어둠 덮개 폭 — 0개: 양 곁 등불만, 다 마치면 길 끝까지
  const cover = 78 - (mine / n) * 78

  return (
    <section className="wpt-lantern">
      <div className="wpt-lantern-art">
        <div className={`wpt-lantern-img${artReady ? ' is-loaded' : ''}`} style={{ backgroundImage: `url(${art})` }} aria-hidden />
        <div className="wpt-lantern-dark" style={{ width: `${cover}%` }} aria-hidden />
        <div className="absolute left-5 top-4 lg:left-8 lg:top-6">
          <p className="wpt-l-kicker">{weekLabel}</p>
          <h2 className="wpt-l-title">기도 하나에 등불 하나</h2>
        </div>
      </div>

      <div className="relative px-6 pb-6 pt-5 lg:px-12 lg:pb-8 lg:pt-8">
        <div className="flex flex-wrap items-center gap-2.5">
          {items.map((p, i) => (
            <button
              key={p.id ?? i}
              type="button"
              onClick={() => setIdx(i)}
              className={`wpt-lamp ${p.is_amened ? 'is-on' : ''} ${i === idx ? 'is-cur' : ''}`}
              aria-label={`${i + 1}번째 기도`}
            >
              {i + 1}
            </button>
          ))}
          <span className="wpt-l-meta ml-1">{mine}개의 등불이 켜졌어요</span>
        </div>

        {!done && item ? (
          <div key={idx} className="wpt-fade mt-6">
            {item.title && <p className="wpt-l-head">{item.title}</p>}
            <p className="wpt-l-body">{item.body || item.title}</p>
            {item.scripture && <p className="wpt-l-scripture">{item.scripture}</p>}
            <div className="relative mt-8">
              {step.burst && <AmenBurst seed={idx + 3} color="#ffc773" />}
              <HoldAmenButton
                step={step}
                tone="ember"
                onUnamen={() => onUnamen(item.id)}
                hint={`길게 눌러 등불 켜기${item.amen_count ? ` · ${item.amen_count}명이 밝혔어요` : ''}`}
              />
            </div>
            <div className="mt-6">
              <StepNav idx={idx} count={n} setIdx={setIdx} onDark />
            </div>
          </div>
        ) : (
          <div className="wpt-fade mt-8 text-center">
            <p className="wpt-l-end">{mine === n ? '길 끝까지 등불이 켜졌어요' : `${mine}개의 등불을 밝혔어요`}</p>
            <p className="wpt-l-sub mt-2">“주의 말씀은 내 발에 등이요 내 길에 빛이니이다” · 시 119:105</p>
            <p className="wpt-l-meta mt-4">이번 주 성도들이 밝힌 등불 {totalAmen}개</p>
            <button type="button" onClick={() => setIdx(0)} className="mt-6 wpt-nav wpt-nav--dark">
              처음부터 다시
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default LanternPath
