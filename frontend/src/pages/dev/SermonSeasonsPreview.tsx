// /#/dev/sermon-seasons — 설교 극장(SermonDetail)의 사계절 색 시안
//   ?s=none|spring|summer|autumn|winter   none = 지금(계절 없이 금빛 하나)
//   &fx=1   재생 전 표지 위 계절 입자(꽃잎·반딧불·단풍·눈)
// 실제 SermonDetail 을 그대로 띄운다 — 운영 설교(11/15 마태복음 14장)를 날짜만 계절별로 바꿔 넣는다.
// 성구·본문·이어서 들을 말씀은 실제 API 에서 온다(로컬 dev 서버에서 /sermon 이 뜨는 환경이면 그대로).

import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import SermonDetail from '../Sermon/components/SermonDetail'
import { useInfiniteSermons } from '../../hooks/useSermons'
import type { Sermon } from '../../types/sermon'
import '../Sermon/components/SermonLetter.css'

const SEASONS = [
  { k: 'none', label: '지금(계절 없음)', date: '2026-11-15' },
  { k: 'spring', label: '봄 · 벚꽃 새벽', date: '2026-04-12' },
  { k: 'summer', label: '여름 · 밤 숲', date: '2026-07-19' },
  { k: 'autumn', label: '가을 · 금빛 단풍', date: '2026-11-15' },
  { k: 'winter', label: '겨울 · 눈 내린 밤', date: '2026-12-27' },
] as const

const BASE: Sermon = {
  id: 45,
  title: '주일 3부 예배',
  pastor: '안동철 담임목사님',
  bible_verse: '마태복음 14장 13~21절',
  sermon_date: '2026-11-15',
  content: '',
  audio_url: null,
  video_url: 'https://www.youtube.com/watch?v=n9lDc82zOwQ',
  thumbnail_url: null,
  views: 0,
  is_published: 1,
  created_at: '2026-11-15T18:21:01+09:00',
  updated_at: '2026-11-15T18:21:01+09:00',
}

const SermonSeasonsPreview = () => {
  const [params, setParams] = useSearchParams()
  const k = params.get('s') ?? 'spring'
  const fx = params.get('fx') === '1'
  const cur = SEASONS.find((x) => x.k === k) ?? SEASONS[1]
  const { data } = useInfiniteSermons()
  const others = useMemo(() => (data?.pages.flat() ?? []).filter((s) => s.id !== BASE.id).slice(0, 8), [data])
  const sermon = useMemo(() => ({ ...BASE, sermon_date: cur.date }), [cur.date])

  const set = (key: string, val: string) => {
    const next = new URLSearchParams(params)
    next.set(key, val)
    setParams(next, { replace: true })
  }

  return (
    <div className="sl-page">
      {/* 시안 전환 바 — 극장(z-100) 위, 화면 아래 가운데 */}
      <div
        style={{
          position: 'fixed',
          zIndex: 120,
          left: '50%',
          bottom: 16,
          transform: 'translateX(-50%)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 6,
          padding: 6,
          maxWidth: 'calc(100% - 24px)',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.94)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {SEASONS.map((x) => (
          <button
            key={x.k}
            type="button"
            onClick={() => set('s', x.k)}
            style={{
              border: 0,
              borderRadius: 999,
              padding: '8px 14px',
              cursor: 'pointer',
              background: x.k === cur.k ? '#191722' : 'transparent',
              color: x.k === cur.k ? '#fff' : '#3a3744',
            }}
          >
            {x.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => set('fx', fx ? '0' : '1')}
          style={{
            border: '1px solid #ccc',
            borderRadius: 999,
            padding: '8px 14px',
            cursor: 'pointer',
            background: fx ? '#3182f6' : '#fff',
            color: fx ? '#fff' : '#3a3744',
          }}
        >
          계절 입자 {fx ? '켬' : '끔'}
        </button>
      </div>

      <SermonDetail
        key={`${cur.k}-${fx}`}
        sermon={sermon}
        others={others}
        onOpenSermon={() => {}}
        onClose={() => {}}
        seasonTheme={cur.k !== 'none'}
        seasonFx={fx && cur.k !== 'none'}
      />
    </div>
  )
}

export default SermonSeasonsPreview
