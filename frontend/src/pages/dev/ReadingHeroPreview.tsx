/**
 * /dev/reading-hero — 성경 읽기 현황 히어로(전체 진행률) 시안 확인용.
 * 백엔드·로그인 없이 표본 수치로 진행 단계별(초반·중반·완독) 배치를 본다.
 * 실물과 같은 클래스를 쓰므로 book-selector/summary.css 를 고치면 그대로 반영된다.
 */
import { useState } from 'react'
import { BookOpen, ChartPieSlice, MapTrifold, HandsPraying, Scroll, Cross } from '@phosphor-icons/react'
import '../Bible/BibleStudy.css'

const TOTAL = 1189

type Sample = { label: string; read: number; cheerHead: string; cheerTail: string }

const SAMPLES: Sample[] = [
  { label: '초반', read: 37, cheerHead: '좋은 시작이에요, 한 장씩 ', cheerTail: '이어가요' },
  { label: '중반', read: 661, cheerHead: '절반을 넘었어요, 조금만 더 ', cheerTail: '힘내요' },
  { label: '완독', read: TOTAL, cheerHead: '성경 66권을 모두 ', cheerTail: '읽었어요' },
]

function Card({ sample }: { sample: Sample }) {
  const read = sample.read
  const rate = Math.round((read / TOTAL) * 100)
  const left = TOTAL - read

  return (
    <section className="reading-summary" aria-label="성경 읽기 현황">
      <div className="reading-summary__head">
        <div className="reading-summary__heading">
          <span className="reading-summary__badge" aria-hidden="true">
            <BookOpen size="1em" weight="duotone" color="currentColor" />
          </span>
          <span className="reading-summary__heading-text">
            <span className="reading-summary__title">성경 읽기 현황</span>
            <span className="reading-summary__subtitle">말씀을 읽으며 믿음이 자라가요</span>
          </span>
        </div>
        <div className="reading-summary__views">
          <button type="button" className="reading-summary__view active">
            <ChartPieSlice size="1em" weight="duotone" color="currentColor" aria-hidden="true" />
            진행률
          </button>
          <button type="button" className="reading-summary__view">
            <MapTrifold size="1em" weight="duotone" color="currentColor" aria-hidden="true" />
            지도
          </button>
        </div>
      </div>

      <div className="reading-hero" data-done={rate >= 100 ? 'true' : undefined}>
        <div className="reading-hero__top">
          <div className="reading-hero__stat">
            <span className="reading-hero__label">전체 진행률</span>
            <span className="reading-hero__value">
              {rate}
              <small>%</small>
            </span>
            <p className="reading-hero__cheer">
              {sample.cheerHead}
              <span className="reading-hero__cheer-tail">
                {sample.cheerTail}
                <HandsPraying size="1em" weight="duotone" color="currentColor" aria-hidden="true" />
              </span>
            </p>
          </div>
          <span className="reading-hero__art" aria-hidden="true" />
        </div>

        <div className="reading-hero__gauge">
          <span className="reading-hero__track" aria-hidden="true">
            <span className="reading-hero__fill" style={{ width: `${Math.max(rate, 3)}%` }} />
          </span>
          <div className="reading-hero__meta">
            <span className="reading-hero__read">
              {read.toLocaleString()} / {TOTAL.toLocaleString()}장
            </span>
            <span className="reading-hero__left">
              {left > 0 ? `남은 ${left.toLocaleString()}장` : '성경 전체를 완독했어요'}
            </span>
          </div>
        </div>
      </div>

      <div className="reading-tiles">
        <div className="reading-tile" data-stat="ot">
          <div className="reading-tile__head">
            <span className="reading-tile__icon" aria-hidden="true">
              <Scroll size="1em" weight="duotone" color="currentColor" />
            </span>
            <span className="reading-tile__text">
              <span className="reading-tile__label">구약</span>
              <span className="reading-tile__value">
                71<small>%</small>
              </span>
              <span className="reading-tile__detail">661 / 929장</span>
            </span>
          </div>
          <span className="reading-tile__track" aria-hidden="true">
            <span className="reading-tile__fill" style={{ width: '71%' }} />
          </span>
        </div>
        <div className="reading-tile" data-stat="nt">
          <div className="reading-tile__head">
            <span className="reading-tile__icon" aria-hidden="true">
              <Cross size="1em" weight="duotone" color="currentColor" />
            </span>
            <span className="reading-tile__text">
              <span className="reading-tile__label">신약</span>
              <span className="reading-tile__value">
                0<small>%</small>
              </span>
              <span className="reading-tile__detail">0 / 260장</span>
            </span>
          </div>
          <span className="reading-tile__track" aria-hidden="true">
            <span className="reading-tile__fill" style={{ width: '2%' }} />
          </span>
        </div>
      </div>
    </section>
  )
}

export default function ReadingHeroPreview() {
  const [width, setWidth] = useState(420)

  return (
    <div style={{ padding: '1.25rem 1rem 4rem', background: 'var(--ig-secondary-background)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        {[360, 420, 620].map(w => (
          <button
            key={w}
            type="button"
            onClick={() => setWidth(w)}
            style={{
              padding: '0.4rem 0.7rem',
              borderRadius: 10,
              border: '1px solid var(--ig-border)',
              background: width === w ? 'var(--brand-soft-strong)' : 'transparent',
              color: width === w ? 'var(--brand)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {w}px
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1.1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {SAMPLES.map(s => (
          <div key={s.label} style={{ width, maxWidth: '100%' }}>
            <p style={{ margin: '0 0 0.45rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-strong)' }}>
              {s.label}
            </p>
            <div className="bible-books-section" style={{ borderRadius: 16 }}>
              <Card sample={s} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
