// 개발 전용 미리보기 (/dev/verse-share, DEV 빌드에서만 라우팅) —
// 백엔드 없이 공유 시트의 한 절 / 여러 절 / 아주 많은 절(접힘) 케이스를 바로 확인한다.
import { useState } from 'react'
import VerseShareSheet from './VerseShareSheet'
import { buildCopyText, buildFullText, type VerseCopyTarget } from './verseCopy'

const NUMBERS_2: VerseCopyTarget = {
  bookNameKo: '민수기',
  bookNumber: 4,
  chapter: 2,
  verses: [
    {
      verse: 17,
      text: '그 다음에 회막이 레위인의 진영과 함께 모든 진영의 중앙에 있어 행진하되 그들의 진 친 순서대로 각 사람은 자기의 위치에서 자기들의 기를 따라 앞으로 행진할지니라',
    },
    {
      verse: 18,
      text: '서쪽에는 에브라임의 군대의 진영의 군기가 있을 것이니 에브라임 자손의 지휘관은 암미훗의 아들 엘리사마요',
    },
    { verse: 19, text: '그의 군대로 계수된 자가 사만 오백 명이며' },
  ],
}

const ONE_VERSE: VerseCopyTarget = {
  bookNameKo: '요한복음',
  bookNumber: 43,
  chapter: 3,
  verses: [
    {
      verse: 16,
      text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라',
    },
  ],
}

// 8절 — 채팅 말풍선이 접히기 시작하는 구간(FOLD_OVER=6 초과)
const MANY: VerseCopyTarget = {
  bookNameKo: '시편',
  bookNumber: 19,
  chapter: 119,
  verses: [
    { verse: 1, text: '행위가 온전하여 여호와의 율법을 따라 행하는 자들은 복이 있음이여' },
    { verse: 2, text: '여호와의 증거들을 지키고 전심으로 여호와를 구하는 자는 복이 있도다' },
    { verse: 3, text: '참으로 그들은 불의를 행하지 아니하고 주의 도를 행하는도다' },
    { verse: 4, text: '주께서 명령하사 주의 법도를 잘 지키게 하셨나이다' },
    { verse: 5, text: '내 길을 굳게 정하사 주의 율례를 지키게 하소서' },
    { verse: 6, text: '내가 주의 모든 계명에 주의할 때에는 부끄럽지 아니하리이다' },
    { verse: 7, text: '내가 주의 의로운 판단을 배울 때에는 정직한 마음으로 주께 감사하리이다' },
    { verse: 8, text: '내가 주의 율례들을 지키오리니 나를 아주 버리지 마옵소서' },
  ],
}

const SAMPLES: { label: string; target: VerseCopyTarget }[] = [
  { label: '한 절 · 요 3:16', target: ONE_VERSE },
  { label: '세 절 · 민 2:17-19 (스크린샷 케이스)', target: NUMBERS_2 },
  { label: '여덟 절 · 시 119:1-8 (접힘)', target: MANY },
]

const VerseSharePreview = () => {
  const [target, setTarget] = useState<VerseCopyTarget | null>(null)

  return (
    <div style={{ minHeight: '100vh', padding: '1.5rem', background: 'var(--ig-secondary-background)' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ig-primary-text)', marginBottom: '1rem' }}>
        구절 공유 시트 미리보기 (dev)
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '24rem' }}>
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            onClick={() => setTarget(s.target)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              textAlign: 'left',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: 'var(--ig-primary-background)',
              border: '1px solid var(--ig-border)',
              color: 'var(--ig-primary-text)',
              cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 실제로 나가는 문자열을 그대로 — 시트를 열지 않고도 포맷을 확인한다 */}
      <div style={{ marginTop: '1.5rem', maxWidth: '32rem' }}>
        {SAMPLES.map((s) => (
          <pre
            key={s.label}
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.75rem',
              lineHeight: 1.6,
              padding: '0.75rem',
              marginBottom: '0.75rem',
              borderRadius: '10px',
              background: 'var(--ig-primary-background)',
              border: '1px solid var(--ig-border)',
              color: 'var(--ig-secondary-text)',
            }}
          >
            {buildFullText(buildCopyText(s.target))}
          </pre>
        ))}
      </div>

      {target && <VerseShareSheet target={target} onClose={() => setTarget(null)} />}
    </div>
  )
}

export default VerseSharePreview
