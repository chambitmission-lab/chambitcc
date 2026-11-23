import type { ReactNode } from 'react'
import type { ParableArtKind } from '../data/parables'

/**
 * 비유 삽화 — 48×48 단색 선화(currentColor). 도감 카드·입문 코스·시트 머리가 같은 그림을 쓴다.
 * 이모지·래스터 대신 선화로 두는 이유: 라이트/다크에서 주제 색만 바꿔 같은 그림을 쓰려고.
 */
const PATHS: Record<ParableArtKind, ReactNode> = {
  sheep: (
    <>
      <path d="M13 27c-3 0-4-4-1-5-1-3 2-5 4-4 0-3 4-4 6-2 1-2 5-2 6 0 2-1 5 0 5 3 3 0 4 4 2 5 2 2 0 5-2 5-1 2-4 3-6 2-2 2-5 2-7 0-2 1-5 0-5-2-2 0-3-2-2-4z" />
      <path d="M33 22c2-2 6-1 6 2s-2 4-5 4" />
      <path d="M18 33v6M27 33v6" />
    </>
  ),
  flock: (
    <>
      <path d="M8 24c-2 0-3-3-1-4 0-2 2-3 3-2 1-2 4-2 5 0 2 0 3 2 2 4 1 2-1 4-3 3-1 1-3 1-4 0-1 0-2 0-2-1z" />
      <path d="M17 21c1-1 3 0 3 1s-1 2-2 2M10 26v4M15 26v4" />
      <path d="M30 22l2-5 2 3h4l2-3 1 5c1 4-1 7-5 7s-7-3-6-7z" />
      <path d="M33 29v5M38 29v5M24 40h16M8 40h10" />
    </>
  ),
  coin: (
    <>
      <circle cx="22" cy="26" r="9" />
      <circle cx="22" cy="26" r="5" />
      <path d="M35 10c0 3-2 5-2 7a2 2 0 0 0 4 0c0-2-2-4-2-7z" />
      <path d="M33 22v6M29 40h14M36 28v12" />
    </>
  ),
  embrace: (
    <>
      <circle cx="18" cy="11" r="4" />
      <circle cx="30" cy="13" r="3.6" />
      <path d="M18 15v12l-4 12M18 27l4 12M18 19l9 4M30 17v10l3 12M30 27l-3 12M30 20l-8 2" />
    </>
  ),
  grapes: (
    <>
      <path d="M24 8v6M24 10c3-3 8-3 10 0" />
      <circle cx="19" cy="18" r="3.5" />
      <circle cx="26" cy="18" r="3.5" />
      <circle cx="22.5" cy="24" r="3.5" />
      <circle cx="29.5" cy="24" r="3.5" />
      <circle cx="16" cy="24" r="3.5" />
      <circle cx="19.5" cy="30" r="3.5" />
      <circle cx="26.5" cy="30" r="3.5" />
      <circle cx="23" cy="36" r="3.5" />
    </>
  ),
  debt: (
    <>
      <path d="M12 8h20l4 4v28H12z" />
      <path d="M32 8v4h4M17 17h14M17 23h14M17 29h8" />
      <path d="M10 38l28-24" />
    </>
  ),
  sprout: (
    <>
      <path d="M6 38h36M24 38V20M24 27c-5 0-8-3-8-8 5 0 8 3 8 8zM24 24c0-5 3-8 8-8 0 5-3 8-8 8z" />
      <path d="M12 32l1 1M34 31l1 1M30 35l1 .5M17 35l1 .5" />
    </>
  ),
  wheat: (
    <>
      <path d="M18 42V12M30 42V16" />
      <path d="M18 14c-3-1-4-4-3-6 2 1 3 3 3 6zM18 14c3-1 4-4 3-6-2 1-3 3-3 6zM18 21c-3-1-4-4-3-6 2 1 3 3 3 6zM18 21c3-1 4-4 3-6-2 1-3 3-3 6zM18 28c-3-1-4-4-3-6 2 1 3 3 3 6zM18 28c3-1 4-4 3-6-2 1-3 3-3 6z" />
      <path d="M30 20c-4 0-6-3-6-6M30 26c4 0 6-3 6-6M30 32c-4 0-6-3-6-6" />
    </>
  ),
  tree: (
    <>
      <path d="M24 42V22M24 32c-6 0-10-4-10-10M24 27c6 0 9-4 9-9M14 22c-3 0-6-2-6-5M33 18c3 0 6-2 6-6" />
      <path d="M10 14c3-1 5 1 4 3M38 10c-2 2 0 4 2 3" />
      <circle cx="20" cy="12" r="1" />
      <circle cx="28" cy="8" r="1" />
    </>
  ),
  bread: (
    <>
      <path d="M8 30c0-8 7-13 16-13s16 5 16 13c0 3-2 5-5 5H13c-3 0-5-2-5-5z" />
      <path d="M17 22l3 6M24 20v7M31 22l-3 6" />
      <path d="M14 10c0-2 2-2 2-4M24 10c0-2 2-2 2-4M34 10c0-2 2-2 2-4" />
    </>
  ),
  chest: (
    <>
      <path d="M8 22h32v16H8zM8 22c0-6 4-10 16-10s16 4 16 10" />
      <path d="M21 26h6v5h-6zM24 31v2" />
      <path d="M4 42h40M30 8l2-3M35 11l3-2M18 8l-2-3" />
    </>
  ),
  pearl: (
    <>
      <path d="M6 30c4-10 32-10 36 0-6 7-30 7-36 0z" />
      <circle cx="24" cy="27" r="5" />
      <path d="M22 25c1-1 2-1 3 0" />
      <path d="M24 10v4M14 13l2 3M34 13l-2 3" />
    </>
  ),
  net: (
    <>
      <path d="M8 10h32l-6 28H14z" />
      <path d="M11 18h26M12.5 26h23M13.5 33h21M17 10l3 28M24 10v28M31 10l-3 28" />
      <path d="M4 42c4-2 8-2 12 0s8 2 12 0 8-2 12 0" />
    </>
  ),
  door: (
    <>
      <path d="M12 42V8h20v34M12 42h24" />
      <circle cx="27" cy="26" r="1.3" />
      <path d="M38 18c2 2 2 6 0 8M41 15c3 4 3 10 0 14" />
      <path d="M26 6l-2-3" />
    </>
  ),
  scale: (
    <>
      <path d="M24 8v30M14 40h20M10 14h28" />
      <path d="M10 14l-5 12h10zM38 14l-5 12h10z" />
      <path d="M5 26c0 3 2 4 5 4s5-1 5-4M33 26c0 3 2 4 5 4s5-1 5-4" />
    </>
  ),
  hands: (
    <>
      <path d="M24 40V18c0-3-1-6-3-8M24 40V18c0-3 1-6 3-8" />
      <path d="M21 10c-2 2-5 6-6 12l-3 8 6 4M27 10c2 2 5 6 6 12l3 8-6 4" />
      <path d="M24 4v2M16 6l1 2M32 6l-1 2" />
    </>
  ),
  helper: (
    <>
      <path d="M6 40c5-3 10-3 15-1s10 2 15-1" />
      <path d="M10 34h14" />
      <circle cx="31" cy="12" r="4" />
      <path d="M31 16v8l-8 6M31 20l-7 5M31 24l4 10M31 24l-2 10" />
      <path d="M14 34c0-3 3-4 5-2" />
    </>
  ),
  barn: (
    <>
      <path d="M8 40V20l16-10 16 10v20zM8 40h32" />
      <path d="M18 40V28h12v12M18 28l12 12M30 28L18 40" />
      <path d="M20 20h8" />
    </>
  ),
  table: (
    <>
      <path d="M6 24h36M10 24v14M38 24v14" />
      <path d="M14 24c0-4 2-6 4-6s4 2 4 6M26 18h8l-1 6h-6z" />
      <path d="M30 12v6M16 14c0-2 2-2 2-4" />
    </>
  ),
  chair: (
    <>
      <path d="M14 8v30M14 24h18v14M14 24V8M32 24v-4" />
      <path d="M14 30h18" />
      <path d="M38 18v20M34 30h8" />
      <path d="M36 12l4-4M40 12l-4-4" />
    </>
  ),
  house: (
    <>
      <path d="M10 32V20l14-10 14 10v12M20 32v-7h8v7" />
      <path d="M6 32h36l-3 8H9z" />
      <path d="M14 36h4M24 36h4M34 36h0" />
    </>
  ),
  pair: (
    <>
      <circle cx="16" cy="12" r="4" />
      <circle cx="32" cy="12" r="4" />
      <path d="M16 16v12l-4 12M16 28l4 12M16 20l-5 6M32 16v12l-4 12M32 28l4 12M32 20l5-4" />
      <path d="M38 14l3-3" />
    </>
  ),
  fig: (
    <>
      <path d="M24 42V24M24 30l-8-6M24 26l7-7" />
      <path d="M16 24c-6 1-9-3-8-8 5-1 9 2 8 8zM31 19c1-6 6-8 10-6-1 5-5 8-10 6z" />
      <path d="M24 24c-3-4-2-10 2-13 3 4 2 10-2 13z" />
      <path d="M8 42h32" />
    </>
  ),
  tower: (
    <>
      <path d="M16 42V14h16v28M14 14h20v-5h-4v3h-4V9h-4v3h-4V9h-4z" />
      <path d="M22 42v-8h4v8M22 22h4" />
      <path d="M6 42h36" />
    </>
  ),
  wineskin: (
    <>
      <path d="M18 8h8v5c7 2 11 9 11 16 0 8-6 13-13 13s-13-5-13-13c0-7 4-14 11-16z" transform="translate(-2 0)" />
      <path d="M16 13h10" />
      <path d="M38 14c0 2 2 3 2 5a2 2 0 0 1-4 0c0-2 2-3 2-5z" />
    </>
  ),
  lamp: (
    <>
      <path d="M8 30c0-4 7-6 16-6s16 2 16 6-7 5-16 5-16-1-16-5zM40 28l5-3M24 24v-3" />
      <path d="M24 21c-2-3 0-6 0-9 2 3 3 6 0 9z" />
      <path d="M14 40h20" />
    </>
  ),
  talent: (
    <>
      <path d="M16 14h16l-2 4c6 3 10 9 10 15 0 6-7 9-16 9S8 39 8 33c0-6 4-12 10-15z" />
      <path d="M18 18h12" />
      <path d="M24 24v12M21 27c0-2 6-2 6 0s-6 2-6 4 6 2 6 0" />
    </>
  ),
  key: (
    <>
      <circle cx="16" cy="18" r="7" />
      <circle cx="16" cy="18" r="2.5" />
      <path d="M21 23l15 15M30 32l4-4M34 36l3-3" />
      <path d="M8 40h12" />
    </>
  ),
  robe: (
    <>
      <path d="M18 8l6 4 6-4 10 6-4 8-4-2v22H16V20l-4 2-4-8z" />
      <path d="M24 12v8M20 30h8" />
    </>
  ),
}

interface ParableArtProps {
  kind: ParableArtKind
  className?: string
  size?: number | string
}

const ParableArt = ({ kind, className, size = '1em' }: ParableArtProps) => (
  <svg
    viewBox="0 0 48 48"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {PATHS[kind]}
  </svg>
)

export default ParableArt
