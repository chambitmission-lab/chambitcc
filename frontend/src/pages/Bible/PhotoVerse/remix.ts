// 이 스타일로 나도 만들기 — 카드의 룩(필터·프레임·구도·서체·질감·배경)만 링크에 담는다.
// 사진·말씀·인사말은 담지 않는다. 받은 사람은 같은 룩에 자기 사진과 말씀을 넣는다.
// (벤치마크: 인스타 릴스 '템플릿 사용' · CapCut 템플릿 · Canva 공유 템플릿)
//
// 링크로 들어온 값은 남이 만든 문자열이라 전부 허용 목록·범위로 다시 거른다.

import { BACKGROUNDS, CARD_FILTERS, CARD_LAYOUTS } from './photoVerseCanvas'
import type { CardFrameId, CardRatioId, CardTextBg, CardTextureId, VerseCardStyle } from './photoVerseCanvas'
import { CARD_PRESETS } from './cardPresets'
import { SHARE_ORIGIN, isLocalHost } from '../../../utils/shareOrigin'

export const REMIX_PARAM = 'remix'
const VERSION = 1

const FONTS: VerseCardStyle['fontFamily'][] = ['sans', 'serif', 'hand', 'brush']
const ALIGNS: VerseCardStyle['align'][] = ['left', 'center', 'right']
const TEXT_BGS: CardTextBg[] = ['none', 'soft', 'scrim', 'marker']
const FRAMES: CardFrameId[] = ['none', 'season', 'polaroid', 'film']
const TEXTURES: CardTextureId[] = ['grain', 'leak', 'vignette', 'stamp']
const RATIOS: CardRatioId[] = ['original', '1:1', '4:5', '9:16', 'lock']

/** 링크를 짧게 — 키를 한두 글자로 줄인다 */
interface RemixPayload {
  v: number
  c?: string // color
  s?: number // fontScale
  f?: string // fontFamily
  a?: string // align
  b?: string // textBg
  r?: number // showRef 0/1
  x?: number // pos.x
  y?: number // pos.y
  fi?: string // filter
  fr?: string // frame
  l?: string // layout
  t?: string[] // textures
  ra?: string // ratio
  sg?: number // signature 0/1
  p?: string // preset id
  bg?: string // 감성 배경 id — 사진 대신 배경으로 만든 카드일 때만
}

export interface RemixStyle {
  style: Partial<VerseCardStyle>
  presetId: string | null
  bgId: string | null
}

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d

const toBase64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const fromBase64Url = (s: string) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)))
}

export const encodeRemix = (style: VerseCardStyle, presetId: string | null, bgId: string | null): string => {
  const p: RemixPayload = {
    v: VERSION,
    c: style.color,
    s: round(style.fontScale, 4),
    f: style.fontFamily,
    a: style.align,
    b: style.textBg,
    r: style.showRef ? 1 : 0,
    x: round(style.pos.x),
    y: round(style.pos.y),
    fi: style.filter,
    fr: style.frame,
    l: style.layout,
    t: style.textures,
    ra: style.ratio,
    sg: style.signature ? 1 : 0,
  }
  if (presetId) p.p = presetId
  if (bgId) p.bg = bgId
  return toBase64Url(JSON.stringify(p))
}

/** 받은 사람이 여는 주소 — 앱 화면으로 곧장 (해시 라우터) */
export const buildRemixLink = (style: VerseCardStyle, presetId: string | null, bgId: string | null): string => {
  const base = isLocalHost() ? `${window.location.origin}${window.location.pathname}` : `${SHARE_ORIGIN}/`
  return `${base}#/bible/photo-verse?${REMIX_PARAM}=${encodeRemix(style, presetId, bgId)}`
}

const pick = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : undefined

const num = (v: unknown, min: number, max: number): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : undefined

const bool = (v: unknown): boolean | undefined => (v === 0 || v === 1 ? v === 1 : undefined)

/** 링크 값 → 스타일. 깨졌거나 알아볼 수 없으면 null */
export const decodeRemix = (raw: string | null | undefined): RemixStyle | null => {
  if (!raw || raw.length > 1200) return null
  let p: Partial<RemixPayload>
  try {
    p = JSON.parse(fromBase64Url(raw))
  } catch {
    return null
  }
  if (!p || typeof p !== 'object' || p.v !== VERSION) return null

  const style: Partial<VerseCardStyle> = {}
  if (typeof p.c === 'string' && /^#[0-9a-fA-F]{6}$/.test(p.c)) style.color = p.c.toLowerCase()
  const s = num(p.s, 0.03, 0.09)
  if (s !== undefined) style.fontScale = s
  const f = pick(p.f, FONTS)
  if (f) style.fontFamily = f
  const a = pick(p.a, ALIGNS)
  if (a) style.align = a
  const b = pick(p.b, TEXT_BGS)
  if (b) style.textBg = b
  const r = bool(p.r)
  if (r !== undefined) style.showRef = r
  const x = num(p.x, 0.05, 0.95)
  const y = num(p.y, 0.05, 0.95)
  if (x !== undefined && y !== undefined) style.pos = { x, y }
  const fi = pick(p.fi, CARD_FILTERS.map((it) => it.id))
  if (fi) style.filter = fi
  const fr = pick(p.fr, FRAMES)
  if (fr) style.frame = fr
  const l = pick(p.l, CARD_LAYOUTS.map((it) => it.id))
  if (l) style.layout = l
  if (Array.isArray(p.t)) style.textures = [...new Set(p.t.map((it) => pick(it, TEXTURES)).filter((it): it is CardTextureId => !!it))]
  const ra = pick(p.ra, RATIOS)
  if (ra) style.ratio = ra
  const sg = bool(p.sg)
  if (sg !== undefined) style.signature = sg

  if (!Object.keys(style).length) return null
  const presetId = pick(p.p, CARD_PRESETS.map((it) => it.id)) ?? null
  const bgId = pick(p.bg, BACKGROUNDS.map((it) => it.id)) ?? null
  return { style, presetId, bgId }
}
