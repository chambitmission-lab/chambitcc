/**
 * 공지 포스터 확대 보기 미리보기 (개발 전용 · /#/dev/notice-poster)
 *
 * 실제 공지 팝업은 관리자가 올린 포스터가 있어야 재현되므로,
 * 잔글씨가 많은 가짜 포스터로 팝업 안 '크게 보기' → 라이트박스 동선을 확인한다.
 */
import { useState } from 'react'
import ImageLightbox from '../../../components/common/ImageLightbox'

/** 확대해야 읽히는 잔글씨가 들어간 가짜 포스터 (A4 비율) */
const POSTER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="744" height="1052" viewBox="0 0 744 1052">
  <rect width="744" height="1052" fill="#f6c98a"/>
  <rect x="28" y="28" width="688" height="996" rx="18" fill="#fdf3e3"/>
  <text x="372" y="150" text-anchor="middle" font-size="34" font-weight="700" fill="#8a5a20">경기예고 라이징 콘서트</text>
  <text x="372" y="280" text-anchor="middle" font-size="96" font-weight="800" fill="#2f6bd8">가을 오르엘</text>
  <text x="372" y="380" text-anchor="middle" font-size="96" font-weight="800" fill="#2f6bd8">콘서트</text>
  <text x="372" y="470" text-anchor="middle" font-size="44" fill="#3b3b3b">2026.9.19 (토) 오후 5시</text>
  <text x="372" y="530" text-anchor="middle" font-size="38" fill="#3b3b3b">부천 참빛교회 오르엘홀</text>
  <text x="372" y="760" text-anchor="middle" font-size="19" fill="#5a5a5a">실내악 앙상블 · 색소폰 · 클래식기타 · 비올라 트리오</text>
  <text x="372" y="792" text-anchor="middle" font-size="19" fill="#5a5a5a">플루트 듀오 · 목관 5중주 · 금관 5중주</text>
  <text x="372" y="900" text-anchor="middle" font-size="15" fill="#7a7a7a">주최 부천 참빛교회 · 주관 경기예술고등학교 · 전석 무료</text>
  <text x="372" y="930" text-anchor="middle" font-size="15" fill="#7a7a7a">경기 부천시 원미구 심대뜰로265번길 29 · 032-323-1004</text>
  <text x="372" y="968" text-anchor="middle" font-size="12" fill="#9a9a9a">※ 이 줄은 확대해야 읽히는 잔글씨입니다 — 라이트박스 확인용</text>
</svg>`)}`

const NoticePosterPreview = () => {
  const [zoom, setZoom] = useState(false)

  return (
    <div className="min-h-screen p-4" style={{ background: 'var(--surface-page)' }}>
      <div
        className="mx-auto w-full max-w-md lg:max-w-lg rounded-3xl overflow-hidden"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="px-5 pt-4 pb-3">
          <p className="text-[10.5px] font-bold tracking-[0.12em]" style={{ color: 'var(--brand)' }}>
            공지사항
          </p>
          <h2
            className="mt-1 text-[18px] font-bold leading-snug tracking-[-0.015em]"
            style={{ color: 'var(--text-strong)' }}
          >
            가을 오르엘 콘서트
          </h2>
        </div>

        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={() => setZoom(true)}
            aria-label="포스터 크게 보기"
            className="group/poster relative mb-3.5 block w-full overflow-hidden rounded-2xl"
            style={{ background: 'var(--surface-inset)' }}
          >
            <img
              src={POSTER}
              alt=""
              className="notice-poster-img w-full object-contain transition-transform duration-200 group-hover/poster:scale-[1.02]"
              style={{ maxHeight: '46vh', filter: 'var(--media-dim)' }}
            />
            <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-[2px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.2-3.2M11 8.5v5M8.5 11h5" />
              </svg>
              크게 보기
            </span>
          </button>
          <p className="text-[14.5px] leading-[1.75]" style={{ color: 'var(--text-body)' }}>
            부천 참빛교회 오르엘홀
          </p>
        </div>
      </div>

      {zoom && (
        <ImageLightbox
          src={POSTER}
          caption="가을 오르엘 콘서트"
          onClose={() => setZoom(false)}
        />
      )}
    </div>
  )
}

export default NoticePosterPreview
