/**
 * /dev/notice-banner — 홈 공지 배너의 포스터 썸네일 시안 비교.
 *
 * 실물(HomeNotice)과 같은 HomeNotice.css 를 읽으므로 여기서 본 모양이 곧 홈의 모양이다.
 * 백엔드·로그인 없이 보려고 공지 데이터만 표본으로 세웠다.
 *
 * 비교 대상 — 44px 정사각 object-cover 가 A4 포스터를 가운데만 잘라 '깨진 조각'으로
 * 보이던 문제를 어떻게 푸느냐:
 *   현행 : h-11 w-11 object-cover
 *   1안  : 카드 왼쪽 끝 세로 스트립(65×92 ≈ 포스터 원비율) ← 실물에 적용된 안
 *   2안  : 썸네일을 빼고 항상 압정 아이콘
 *   3안  : 44px 유지 + object-contain, 뒤에 같은 이미지 블러 확대
 */
import { useState } from 'react'
import '../Home/components/HomeNotice.css'

/** 표본 포스터 — A4(1:1.414) 세로, 글자가 위쪽에 몰린 전형적인 교회 행사 포스터 */
const POSTER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="594" viewBox="0 0 420 594">
  <rect width="420" height="594" fill="#dff1e6"/>
  <rect x="0" y="0" width="420" height="150" fill="#bde3cd"/>
  <text x="210" y="70" font-family="sans-serif" font-size="44" font-weight="700" fill="#1d5c3a" text-anchor="middle">사랑의</text>
  <text x="210" y="122" font-family="sans-serif" font-size="44" font-weight="700" fill="#1d5c3a" text-anchor="middle">바자회</text>
  <circle cx="210" cy="300" r="86" fill="#ffffff" opacity="0.75"/>
  <path d="M160 330c14-40 36-62 50-62s36 22 50 62z" fill="#e8a13c"/>
  <circle cx="186" cy="268" r="13" fill="#4b3a2a"/>
  <circle cx="234" cy="268" r="13" fill="#4b3a2a"/>
  <rect x="70" y="424" width="280" height="13" rx="6" fill="#1d5c3a" opacity="0.35"/>
  <rect x="96" y="458" width="228" height="13" rx="6" fill="#1d5c3a" opacity="0.28"/>
  <rect x="118" y="492" width="184" height="13" rx="6" fill="#1d5c3a" opacity="0.22"/>
  <text x="210" y="556" font-family="sans-serif" font-size="24" fill="#1d5c3a" text-anchor="middle">10월 24일(토) · 참빛교회</text>
</svg>`)}`

const NOTICE = {
  title: '사랑의 바자회',
  preview: '하나님의 선물 사랑의 바자회 일시: 10월 24일(토) 장소: 참빛교회 1층 & 6층',
  when: '오늘',
  more: 1,
}

const PinIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 17v5" />
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
  </svg>
)

type Variant = 'current' | 'strip' | 'icon' | 'contain'

/** 배너 본체 — thumb 모양만 갈아 끼우고 나머지 DOM·클래스는 HomeNotice 와 동일 */
function Banner({ variant }: { variant: Variant }) {
  const strip = variant === 'strip'

  return (
    <button
      type="button"
      className="notice-banner feed-card group relative w-full overflow-hidden rounded-2xl text-left transition-[transform,border-color,box-shadow] duration-150 hover:border-[var(--brand-glow)] hover:shadow-[0_6px_18px_-6px_var(--brand-glow)] active:scale-[0.985]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full blur-2xl"
        style={{ background: 'var(--brand-soft-strong)' }}
      />

      {strip && (
        <img
          src={POSTER}
          alt=""
          aria-hidden
          className="notice-banner__strip pointer-events-none absolute left-0 top-0 h-full w-[65px] object-cover object-top"
          style={{ background: 'var(--surface-inset)', filter: 'var(--media-dim)' }}
        />
      )}

      <div className={`relative flex items-center gap-3 py-3 pr-3 ${strip ? 'pl-[77px]' : 'pl-3.5'}`}>
        {variant === 'current' && (
          <img
            src={POSTER}
            alt=""
            className="h-11 w-11 shrink-0 rounded-[13px] object-cover"
            style={{ background: 'var(--surface-inset)', filter: 'var(--media-dim)' }}
          />
        )}

        {variant === 'icon' && (
          <span
            aria-hidden
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px]"
            style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
          >
            <PinIcon />
          </span>
        )}

        {variant === 'contain' && (
          <span
            className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[13px]"
            style={{ background: 'var(--surface-inset)' }}
          >
            <img
              src={POSTER}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-150 object-cover opacity-70 blur-[6px]"
            />
            <img
              src={POSTER}
              alt=""
              className="relative h-full w-full object-contain"
              style={{ filter: 'var(--media-dim)' }}
            />
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="text-[10.5px] font-bold tracking-[0.1em]" style={{ color: 'var(--brand)' }}>
              공지
            </span>
            <span aria-hidden className="h-2.5 w-px" style={{ background: 'var(--card-border)' }} />
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {NOTICE.when}
            </span>
            <span
              className="ml-0.5 rounded-full px-1.5 py-[1.5px] text-[10px] font-bold leading-none"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
            >
              +{NOTICE.more}
            </span>
          </span>
          <span
            className="mt-1 block truncate text-[14.5px] font-bold tracking-[-0.01em]"
            style={{ color: 'var(--text-strong)' }}
          >
            {NOTICE.title}
          </span>
          <span className="mt-[1px] block truncate text-[12px] leading-snug" style={{ color: 'var(--text-muted)' }}>
            {NOTICE.preview}
          </span>
        </span>

        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          style={{ color: 'var(--text-faint)' }}
          aria-hidden
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </button>
  )
}

const CASES: { variant: Variant; label: string; note: string }[] = [
  { variant: 'current', label: '현행', note: '44px 정사각 object-cover — A4 포스터 가운데만 잘려 글자 조각만 남는다' },
  { variant: 'strip', label: '1안 · 세로 포스터 스트립 (적용됨)', note: '카드 왼쪽 끝 65×92 ≈ 포스터 원비율(A4). 크롭이 거의 없어 포스터가 포스터로 읽힌다' },
  { variant: 'icon', label: '2안 · 썸네일 없이 압정 아이콘', note: '포스터 유무와 무관하게 같은 아이콘. 배너가 한 줄 소식으로만 읽힌다' },
  { variant: 'contain', label: '3안 · 44px + contain + 블러 배경', note: '크롭은 없지만 포스터가 작아 내용은 여전히 안 읽힌다' },
]

const NoticeBannerPreview = () => {
  const [width, setWidth] = useState<'pc' | 'mobile'>('pc')

  return (
    <div className="min-h-screen pb-24 pt-6" style={{ background: 'var(--surface-page)' }}>
      <div className="mx-auto max-w-5xl px-4">
        <h1 className="text-[20px] font-bold" style={{ color: 'var(--text-strong)' }}>
          홈 공지 배너 — 포스터 썸네일 시안
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          실물과 같은 HomeNotice.css 를 씁니다. 폭을 바꿔 PC(넓은 배너)·모바일(좁은 배너) 양쪽을 확인하세요.
        </p>

        <div className="mt-4 flex gap-2">
          {(['pc', 'mobile'] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWidth(w)}
              className="rounded-full px-3.5 py-1.5 text-[12.5px] font-bold"
              style={
                width === w
                  ? { background: 'var(--brand)', color: '#fff' }
                  : { background: 'var(--surface-inset)', color: 'var(--text-muted)' }
              }
            >
              {w === 'pc' ? 'PC 폭' : '모바일 폭 (390px)'}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-7">
          {CASES.map((c) => (
            <section key={c.variant}>
              <h2 className="text-[13.5px] font-bold" style={{ color: 'var(--text-strong)' }}>
                {c.label}
              </h2>
              <p className="mb-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {c.note}
              </p>
              <div style={{ maxWidth: width === 'mobile' ? 390 : undefined }}>
                <div className="px-4 pt-3">
                  <Banner variant={c.variant} />
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NoticeBannerPreview
