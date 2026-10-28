/**
 * /dev/reading-hero — 성경 읽기 현황 히어로(전체 진행률) 시안 확인용.
 * 백엔드·로그인 없이 표본 수치로 진행 단계별(초반·중반·완독) 배치를 본다.
 * 실물과 같은 클래스를 쓰므로 book-selector/summary.css 를 고치면 그대로 반영된다.
 * 배경 장면은 시간대로 갈린다(낮 "함께 걷는 길" / 저녁·밤 "함께 읽기") — 위 토글로 둘 다 본다.
 */
import { useState } from 'react'
import { BookOpen, ChartPieSlice, MapTrifold, HandsPraying } from '../../components/icons/phosphor'
import '../Bible/BibleStudy.css'
import { readingSceneFor, type ReadingScene } from '../../utils/themeAssets'

const TOTAL = 1189
const OT_TOTAL = 929
const NT_TOTAL = TOTAL - OT_TOTAL

type Sample = { label: string; read: number; cheerHead: string; cheerTail: string }

const SAMPLES: Sample[] = [
  { label: '초반', read: 37, cheerHead: '좋은 시작이에요, 한 장씩 ', cheerTail: '이어가요' },
  { label: '중반', read: 661, cheerHead: '절반을 넘었어요, 조금만 더 ', cheerTail: '힘내요' },
  { label: '완독', read: TOTAL, cheerHead: '성경 66권을 모두 ', cheerTail: '읽었어요' },
]

function Card({ sample, scene }: { sample: Sample; scene: ReadingScene }) {
  const read = sample.read
  const rate = Math.round((read / TOTAL) * 100)
  const left = TOTAL - read
  // 표본은 창세기부터 차례로 읽었다고 가정 — 구약을 다 채운 뒤 신약으로 넘어간다
  const otRead = Math.min(read, OT_TOTAL)
  const parts = [
    { id: 'ot', label: '구약', total: OT_TOTAL, rate: Math.round((otRead / OT_TOTAL) * 100) },
    { id: 'nt', label: '신약', total: NT_TOTAL, rate: Math.round(((read - otRead) / NT_TOTAL) * 100) },
  ]

  return (
    <section className="reading-summary" data-scene={scene} aria-label="성경 읽기 현황">
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
        </div>

        <div className="reading-hero__gauge">
          <div className="reading-hero__meta">
            <span className="reading-hero__read">
              {read.toLocaleString()} / {TOTAL.toLocaleString()}장
            </span>
            <span className="reading-hero__left">
              {left > 0 ? `남은 ${left.toLocaleString()}장` : '성경 전체를 완독했어요'}
            </span>
          </div>
          <span className="reading-hero__track" aria-hidden="true">
            {parts.map(p => (
              <span
                key={p.id}
                className="reading-hero__seg"
                data-full={p.rate >= 100 ? 'true' : undefined}
                style={{ flex: `${p.total} 1 0` }}
              >
                <span className="reading-hero__fill" style={{ width: `${Math.max(p.rate, 3)}%` }} />
              </span>
            ))}
          </span>
          <div className="reading-hero__parts">
            {parts.map(p => (
              <span key={p.id} className="reading-hero__part" style={{ flex: `${p.total} 1 0` }}>
                <span className="reading-hero__part-label">{p.label}</span>
                <span className="reading-hero__part-value">
                  {p.rate}
                  <small>%</small>
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* 완독한 회차 — 실물(BookSelector)은 서버의 cycle.current_completed 일 때만 보인다 */}
        {left === 0 && (
          <div className="reading-hero__cycle">
            <span className="reading-hero__cycle-done">성경 통독 1회 완료</span>
            <button type="button" className="reading-hero__cycle-btn">2독 시작하기</button>
          </div>
        )}
      </div>

    </section>
  )
}

export default function ReadingHeroPreview() {
  const [width, setWidth] = useState(420)
  const [scene, setScene] = useState<ReadingScene>(() => readingSceneFor(new Date().getHours()))

  return (
    <div style={{ padding: '1.25rem 1rem 4rem', background: 'var(--ig-secondary-background)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {(['day', 'evening'] as const).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setScene(n)}
            style={{
              padding: '0.4rem 0.7rem',
              borderRadius: 10,
              border: '1px solid var(--ig-border)',
              background: scene === n ? 'var(--brand-soft-strong)' : 'transparent',
              color: scene === n ? 'var(--brand)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {n === 'day' ? '낮 · 함께 걷는 길' : '저녁 · 함께 읽기'}
          </button>
        ))}
        <span style={{ width: 1, height: 18, background: 'var(--ig-border)', margin: '0 0.25rem' }} />
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
              <Card sample={s} scene={scene} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
