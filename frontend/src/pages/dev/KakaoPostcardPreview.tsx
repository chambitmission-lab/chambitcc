import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { CHURCH_SEASON_PHOTO } from '../../utils/themeAssets'
import { getNaturalSeason } from '../../utils/naturalSeason'
import { drawKakaoPostcard } from '../Bible/PhotoVerse/canvas/postcard'
import './kakaoPostcardPreview.css'

/**
 * /#/dev/kakao-postcard — 말씀 카드 '카카오톡으로 보내기' 피드 카드 전면 개편 시안.
 *   ?v=all(기본) | now | a 은혜 영수증 | b 말씀 편지 봉투 | c 말씀 승차권 | d 큰 글씨 사진 | e 말씀 반창고
 * 카톡 대화방 모양 안에 실제 캔버스로 그린 그림 + 카드 제목·설명·버튼을 그대로 놓는다. 표본 데이터만 쓴다.
 */

const S = 800
const VERSE = {
  text: '수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라',
  ref: '마태복음 11:28',
  book: '마태복음',
  seat: '11:28',
  key: '내가 너희를 쉬게 하리라',
}
const SENDER = '김집사'
const RECIPIENT = '엄마'
const NOTE = '오늘 이 말씀이 생각났어요'

const F = {
  sans: '"Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", sans-serif',
  serif: '"Noto Serif KR", serif',
  batang: '"Gowun Batang", "Noto Serif KR", serif',
  hand: '"Nanum Pen Script", cursive',
}

// ── 그리기 도구 ──
const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

const cover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, fy = 0.5) => {
  const s = Math.max(w / img.width, h / img.height)
  const sw = w / s
  const sh = h / s
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) * fy, sw, sh, x, y, w, h)
}

const wrap = (ctx: CanvasRenderingContext2D, text: string, max: number): string[] => {
  const out: string[] = []
  let line = ''
  for (const w of text.split(/\s+/)) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width <= max || !line) line = t
    else {
      out.push(line)
      line = w
    }
  }
  if (line) out.push(line)
  return out
}

const dash = (ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color = 'rgba(40,40,40,0.35)') => {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([8, 7])
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
  ctx.restore()
}

const barcode = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, vertical = false) => {
  let seed = 1128
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  let p = 0
  while (p < w) {
    const bw = 2 + Math.floor(rnd() * 4)
    if (rnd() > 0.38) {
      if (vertical) ctx.fillRect(x, y + p, h, bw)
      else ctx.fillRect(x + p, y, bw, h)
    }
    p += bw + 2
  }
}

const fmtDate = (d: Date) => {
  const wd = '일월화수목금토'[d.getDay()]
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}(${wd})`
}

// ── A 은혜 영수증 ──
const drawReceipt = (ctx: CanvasRenderingContext2D, date: Date) => {
  const g = ctx.createLinearGradient(0, 0, 0, S)
  g.addColorStop(0, '#dfe9f5')
  g.addColorStop(1, '#eef2f7')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)

  const x = 150
  const w = 500
  const top = 26
  const bottom = 776
  ctx.save()
  ctx.translate(S / 2, S / 2)
  ctx.rotate((-1.6 * Math.PI) / 180)
  ctx.translate(-S / 2, -S / 2)
  // 종이 + 아래 톱니
  ctx.beginPath()
  ctx.moveTo(x, top)
  ctx.lineTo(x + w, top)
  ctx.lineTo(x + w, bottom)
  const tooth = 20
  for (let i = w; i > 0; i -= tooth) {
    ctx.lineTo(x + i - tooth / 2, bottom + 10)
    ctx.lineTo(x + i - tooth, bottom)
  }
  ctx.closePath()
  ctx.shadowColor = 'rgba(30,50,80,0.22)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 10
  ctx.fillStyle = '#fffefb'
  ctx.fill()
  ctx.shadowColor = 'transparent'

  const L = x + 36
  const R = x + w - 36
  const C = x + w / 2
  const ink = '#2b2b2b'
  const sub = '#8a8a8a'
  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.font = `800 40px ${F.sans}`
  ctx.fillText('참빛 은혜상회', C, top + 62)
  ctx.font = `500 19px ${F.sans}`
  ctx.fillStyle = sub
  ctx.fillText('연중무휴 · 언제나 영업 · 값없이 드림', C, top + 92)
  dash(ctx, L, R, top + 116)

  const row = (y: number, l: string, r: string, font = `500 21px ${F.sans}`, color = ink) => {
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = 'left'
    ctx.fillText(l, L, y)
    ctx.textAlign = 'right'
    ctx.fillText(r, R, y)
  }
  row(top + 148, '일시', `${fmtDate(date)} 09:32`)
  row(top + 178, '보낸 분', SENDER)
  row(top + 208, '받는 분', `${RECIPIENT} 님`)
  dash(ctx, L, R, top + 232)
  row(top + 262, '품목', '금액', `600 19px ${F.sans}`, sub)
  row(top + 296, `말씀 · ${VERSE.ref}`, '0원')
  row(top + 330, '쉼 (무제한 리필)', '0원')
  row(top + 364, '무거운 짐 대신 들어 드림', '0원')
  dash(ctx, L, R, top + 390)
  ctx.font = `800 30px ${F.sans}`
  ctx.fillStyle = ink
  ctx.textAlign = 'left'
  ctx.fillText('합계', L, top + 436)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#3182f6'
  ctx.font = `900 52px ${F.sans}`
  ctx.fillText('0원', R, top + 440)
  ctx.font = `500 17px ${F.sans}`
  ctx.fillStyle = sub
  ctx.fillText('하나님의 은혜로 값없이 (롬 3:24)', R, top + 470)

  // 결제 도장 — '다 이루었다'
  ctx.save()
  ctx.translate(L + 150, top + 430)
  ctx.rotate((-12 * Math.PI) / 180)
  ctx.globalAlpha = 0.85
  ctx.strokeStyle = '#d2453a'
  ctx.fillStyle = '#d2453a'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.roundRect(-82, -34, 164, 62, 10)
  ctx.stroke()
  ctx.font = `800 27px ${F.batang}`
  ctx.textAlign = 'center'
  ctx.fillText('다 이루었다', 0, 2)
  ctx.font = `600 13px ${F.sans}`
  ctx.fillText('결제 완료 · 요 19:30', 0, 21)
  ctx.restore()

  dash(ctx, L, R, top + 494)
  // 본문
  ctx.fillStyle = '#f3f6fb'
  ctx.beginPath()
  ctx.roundRect(L, top + 510, R - L, 142, 14)
  ctx.fill()
  ctx.fillStyle = '#1d2a3f'
  ctx.textAlign = 'center'
  ctx.font = `600 25px ${F.serif}`
  const lines = wrap(ctx, VERSE.text, R - L - 44)
  const lh = 38
  const y0 = top + 510 + 71 - ((lines.length - 1) * lh) / 2 + 8
  lines.forEach((l, i) => ctx.fillText(l, C, y0 + i * lh))

  ctx.fillStyle = ink
  barcode(ctx, C - 150, top + 672, 300, 40)
  ctx.font = `500 16px ${F.sans}`
  ctx.fillStyle = sub
  ctx.textAlign = 'center'
  ctx.fillText('11 28 0000 · 영수증은 마음에 보관하세요', C, top + 736)
  ctx.restore()
}

// ── B 말씀 편지 봉투 ──
const drawEnvelope = (ctx: CanvasRenderingContext2D, church: HTMLImageElement, date: Date) => {
  const g = ctx.createLinearGradient(0, 0, 0, S)
  g.addColorStop(0, '#9fc3ef')
  g.addColorStop(0.5, '#f5d6cf')
  g.addColorStop(1, '#fff3e6')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  const sun = ctx.createRadialGradient(620, 150, 10, 620, 150, 320)
  sun.addColorStop(0, 'rgba(255,248,225,0.95)')
  sun.addColorStop(1, 'rgba(255,248,225,0)')
  ctx.fillStyle = sun
  ctx.fillRect(0, 0, S, S)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#24324d'
  ctx.font = `700 42px ${F.batang}`
  ctx.fillText('말씀 한 통이 도착했어요', S / 2, 112)
  ctx.font = `500 22px ${F.sans}`
  ctx.fillStyle = 'rgba(36,50,77,0.7)'
  ctx.fillText('어떤 말씀일지는 열어 봐야 알아요', S / 2, 152)

  const w = 600
  const h = 400
  ctx.save()
  ctx.translate(S / 2, 470)
  ctx.rotate((-3 * Math.PI) / 180)
  const x = -w / 2
  const y = -h / 2
  ctx.shadowColor = 'rgba(90,60,40,0.28)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 16
  ctx.fillStyle = '#fffaf1'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 14)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  // 아래 접힘
  ctx.strokeStyle = 'rgba(150,120,90,0.25)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x + 8, y + h - 6)
  ctx.lineTo(0, y + h * 0.48)
  ctx.lineTo(x + w - 8, y + h - 6)
  ctx.stroke()
  // 덮개
  ctx.fillStyle = '#f6ecdc'
  ctx.beginPath()
  ctx.moveTo(x, y + 10)
  ctx.lineTo(0, y + h * 0.56)
  ctx.lineTo(x + w, y + 10)
  ctx.lineTo(x + w, y)
  ctx.lineTo(x, y)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(150,120,90,0.3)'
  ctx.beginPath()
  ctx.moveTo(x, y + 10)
  ctx.lineTo(0, y + h * 0.56)
  ctx.lineTo(x + w, y + 10)
  ctx.stroke()
  // 밀랍 봉인 — 브랜드 블루
  const sx = 0
  const sy = y + h * 0.56
  const wax = ctx.createRadialGradient(sx - 14, sy - 14, 6, sx, sy, 58)
  wax.addColorStop(0, '#6aa8ff')
  wax.addColorStop(1, '#1f5fc9')
  ctx.fillStyle = wax
  ctx.beginPath()
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2
    const r = 52 + (i % 2 ? 4 : -2)
    ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r)
  }
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(sx, sy, 36, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = `700 30px ${F.batang}`
  ctx.textAlign = 'center'
  ctx.fillText('빛', sx, sy + 11)

  // 우표 — 교회 사진
  const px = x + w - 150
  const py = y + 34
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.rect(px, py, 112, 136)
  ctx.fill()
  ctx.fillStyle = '#fffaf1'
  for (let i = 0; i <= 8; i++) {
    for (const [cx, cy] of [
      [px + i * 14, py],
      [px + i * 14, py + 136],
    ]) {
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  for (let i = 0; i <= 9; i++) {
    for (const [cx, cy] of [
      [px, py + i * 15],
      [px + 112, py + i * 15],
    ]) {
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.save()
  ctx.beginPath()
  ctx.rect(px + 9, py + 9, 94, 118)
  ctx.clip()
  cover(ctx, church, px + 9, py + 9, 94, 118, 0.4)
  ctx.restore()
  // 소인
  ctx.save()
  ctx.strokeStyle = 'rgba(60,70,90,0.55)'
  ctx.fillStyle = 'rgba(60,70,90,0.6)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(px - 22, py + 92, 44, 0, Math.PI * 2)
  ctx.stroke()
  ctx.font = `700 20px ${F.sans}`
  ctx.fillText(`${date.getMonth() + 1}.${date.getDate()}`, px - 22, py + 92)
  ctx.font = `600 12px ${F.sans}`
  ctx.fillText('참빛교회', px - 22, py + 110)
  for (let k = 0; k < 3; k++) {
    ctx.beginPath()
    ctx.moveTo(px + 30, py + 150 + k * 12)
    ctx.bezierCurveTo(px + 60, py + 140 + k * 12, px + 90, py + 160 + k * 12, px + 120, py + 150 + k * 12)
    ctx.stroke()
  }
  ctx.restore()

  // 손글씨
  ctx.fillStyle = '#2c3550'
  ctx.textAlign = 'left'
  ctx.font = `400 72px ${F.hand}`
  ctx.fillText(`To. ${RECIPIENT}께`, x + 44, y + 98)
  ctx.textAlign = 'right'
  ctx.font = `400 46px ${F.hand}`
  ctx.fillStyle = 'rgba(44,53,80,0.8)'
  ctx.fillText(`From. ${SENDER}`, x + w - 40, y + h - 34)
  ctx.restore()
}

// ── C 말씀 승차권 ──
const drawTicket = (ctx: CanvasRenderingContext2D, church: HTMLImageElement, date: Date) => {
  cover(ctx, church, 0, 0, S, S, 0.45)
  ctx.fillStyle = 'rgba(14,28,56,0.42)'
  ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.font = `700 30px ${F.sans}`
  ctx.fillText(`${RECIPIENT} 님 앞으로 승차권 1매`, S / 2, 110)

  const x = 50
  const y = 170
  const w = 700
  const h = 460
  const cut = x + 520
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 14
  ctx.fillStyle = '#fdfcf8'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 26)
  ctx.fill()
  ctx.restore()
  // 머리띠
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, w, 70, [26, 26, 0, 0])
  ctx.clip()
  ctx.fillStyle = '#3182f6'
  ctx.fillRect(x, y, w, 70)
  ctx.restore()
  // 노치 — 배경을 다시 칠해 뚫린 듯
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  for (const cy of [y, y + h]) {
    ctx.beginPath()
    ctx.arc(cut, cy, 22, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  ctx.save()
  ctx.globalCompositeOperation = 'destination-over'
  cover(ctx, church, 0, 0, S, S, 0.45)
  ctx.restore()
  // 노치 자리 어둡게 맞추기
  for (const cy of [y, y + h]) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cut, cy, 22, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = 'rgba(14,28,56,0.42)'
    ctx.fillRect(cut - 30, cy - 30, 60, 60)
    ctx.restore()
  }
  ctx.save()
  ctx.strokeStyle = 'rgba(60,60,60,0.3)'
  ctx.setLineDash([8, 8])
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cut, y + 30)
  ctx.lineTo(cut, y + h - 30)
  ctx.stroke()
  ctx.restore()

  ctx.fillStyle = '#fff'
  ctx.textAlign = 'left'
  ctx.font = `800 26px ${F.sans}`
  ctx.fillText('참빛 말씀선', x + 34, y + 45)
  ctx.font = `600 18px ${F.sans}`
  ctx.globalAlpha = 0.85
  ctx.fillText('BOARDING PASS', x + 190, y + 44)
  ctx.globalAlpha = 1
  ctx.textAlign = 'right'
  ctx.font = `700 20px ${F.sans}`
  ctx.fillText('유효기간 없음', x + w - 30, y + 44)

  // 출발 → 도착
  const L = x + 40
  const ink = '#1d2433'
  const sub = '#8b93a3'
  ctx.textAlign = 'left'
  ctx.fillStyle = sub
  ctx.font = `600 18px ${F.sans}`
  ctx.fillText('출발', L, y + 120)
  ctx.fillText('도착', L + 290, y + 120)
  ctx.fillStyle = ink
  ctx.font = `700 50px ${F.batang}`
  ctx.fillText('지친 오늘', L, y + 182)
  ctx.font = `700 76px ${F.batang}`
  ctx.fillStyle = '#3182f6'
  ctx.fillText('쉼', L + 290, y + 186)
  // 점선 화살
  ctx.save()
  ctx.strokeStyle = '#b7c0cf'
  ctx.lineWidth = 3
  ctx.setLineDash([4, 8])
  ctx.beginPath()
  ctx.moveTo(L + 226, y + 162)
  ctx.lineTo(L + 272, y + 162)
  ctx.stroke()
  ctx.restore()
  ctx.fillStyle = '#b7c0cf'
  ctx.beginPath()
  ctx.moveTo(L + 280, y + 162)
  ctx.lineTo(L + 266, y + 154)
  ctx.lineTo(L + 266, y + 170)
  ctx.fill()

  // 정보 칸
  const info: [string, string][] = [
    ['승객', `${RECIPIENT} 님`],
    ['보낸 분', SENDER],
    ['노선', VERSE.book],
    ['탑승일', `${date.getMonth() + 1}월 ${date.getDate()}일`],
  ]
  info.forEach(([k, v], i) => {
    const cx = L + (i % 2) * 230
    const cy = y + 240 + Math.floor(i / 2) * 62
    ctx.fillStyle = sub
    ctx.font = `600 16px ${F.sans}`
    ctx.fillText(k, cx, cy)
    ctx.fillStyle = ink
    ctx.font = `700 24px ${F.sans}`
    ctx.fillText(v, cx, cy + 30)
  })
  // 본문
  ctx.fillStyle = '#3a4252'
  ctx.font = `500 19px ${F.serif}`
  wrap(ctx, `“${VERSE.text}”`, 440).forEach((l, i) => ctx.fillText(l, L, y + 392 + i * 30))

  // 꼬리표
  const sx = cut + 90
  ctx.textAlign = 'center'
  ctx.fillStyle = sub
  ctx.font = `600 16px ${F.sans}`
  ctx.fillText('좌석', sx, y + 120)
  ctx.fillStyle = ink
  ctx.font = `800 48px ${F.sans}`
  ctx.fillText(VERSE.seat, sx, y + 176)
  ctx.fillStyle = ink
  barcode(ctx, sx - 30, y + 210, 170, 60, true)
  ctx.fillStyle = sub
  ctx.font = `600 15px ${F.sans}`
  ctx.fillText('언제든 탑승', sx, y + 420)
}

// ── D 큰 글씨 사진 ──
const drawBigVerse = (ctx: CanvasRenderingContext2D, church: HTMLImageElement, date: Date) => {
  cover(ctx, church, 0, 0, S, S, 0.3)
  const g = ctx.createLinearGradient(0, S * 0.28, 0, S)
  g.addColorStop(0, 'rgba(8,16,34,0)')
  g.addColorStop(0.55, 'rgba(8,16,34,0.62)')
  g.addColorStop(1, 'rgba(8,16,34,0.86)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  // 위 띠
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.beginPath()
  ctx.roundRect(48, 48, 268, 52, 26)
  ctx.fill()
  ctx.fillStyle = '#1b2b48'
  ctx.font = `700 22px ${F.sans}`
  ctx.textAlign = 'left'
  ctx.fillText(`${SENDER} 님의 오늘 말씀`, 72, 82)

  ctx.fillStyle = '#fff'
  ctx.font = `700 54px ${F.serif}`
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 12
  const lines = wrap(ctx, VERSE.text, S - 120)
  const lh = 80
  const base = S - 140 - (lines.length - 1) * lh
  lines.forEach((l, i) => ctx.fillText(l, 60, base + i * lh))
  ctx.shadowBlur = 0
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillRect(60, S - 92, 36, 3)
  ctx.font = `600 28px ${F.sans}`
  ctx.fillText(VERSE.ref, 110, S - 80)
  ctx.textAlign = 'right'
  ctx.font = `500 22px ${F.sans}`
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText(`참빛교회 · ${date.getMonth() + 1}.${date.getDate()}`, S - 60, S - 80)
}

// ── E 말씀 반창고 ──
const drawBandage = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#fdebe4'
  ctx.fillRect(0, 0, S, S)
  ctx.fillStyle = 'rgba(232,140,120,0.14)'
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++) {
      ctx.beginPath()
      ctx.arc(45 + i * 90 + (j % 2) * 45, 45 + j * 90, 4, 0, Math.PI * 2)
      ctx.fill()
    }

  ctx.fillStyle = '#c4554a'
  ctx.textAlign = 'left'
  ctx.font = `400 76px ${F.hand}`
  ctx.fillText('마음 아픈 데 붙이세요', 56, 128)

  const len = 700
  const hh = 230
  ctx.save()
  ctx.translate(S / 2, 430)
  ctx.rotate((-14 * Math.PI) / 180)
  ctx.shadowColor = 'rgba(150,70,50,0.25)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 12
  const tan = ctx.createLinearGradient(0, -hh / 2, 0, hh / 2)
  tan.addColorStop(0, '#f6cfae')
  tan.addColorStop(1, '#eab48d')
  ctx.fillStyle = tan
  ctx.beginPath()
  ctx.roundRect(-len / 2, -hh / 2, len, hh, hh / 2)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  // 숨구멍
  ctx.fillStyle = 'rgba(160,95,60,0.28)'
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 3; j++) {
        ctx.beginPath()
        ctx.arc(side * (200 + i * 34), -40 + j * 40, 5, 0, Math.PI * 2)
        ctx.fill()
      }
  }
  // 패드
  ctx.fillStyle = '#fffaf4'
  ctx.beginPath()
  ctx.roundRect(-170, -88, 340, 176, 18)
  ctx.fill()
  ctx.strokeStyle = 'rgba(230,170,140,0.6)'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  ctx.roundRect(-158, -76, 316, 152, 12)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = '#5a3a32'
  ctx.textAlign = 'center'
  ctx.font = `700 36px ${F.batang}`
  ctx.fillText('내가 너희를', 0, -12)
  ctx.fillText('쉬게 하리라', 0, 36)
  ctx.font = `600 18px ${F.sans}`
  ctx.fillStyle = '#b07862'
  ctx.fillText(VERSE.ref, 0, 68)
  ctx.restore()

  // 용법
  ctx.fillStyle = '#6b4a42'
  ctx.textAlign = 'right'
  ctx.font = `400 44px ${F.hand}`
  ctx.fillText('용법: 하루 몇 번이든 · 효과: 쉼', S - 56, 690)
  ctx.font = `400 50px ${F.hand}`
  ctx.fillStyle = '#c4554a'
  ctx.fillText(`From. ${SENDER}`, S - 56, 752)
}

// ── 표본 '내가 만든 말씀 카드' — 사용자가 고른 사진 위에 말씀을 올린 세로 카드 ──
const makeCard = (photo: HTMLImageElement) => {
  const card = document.createElement('canvas')
  card.width = 540
  card.height = 960
  const c = card.getContext('2d')!
  cover(c, photo, 0, 0, 540, 960, 0.5)
  const g = c.createLinearGradient(0, 0, 0, 520)
  g.addColorStop(0, 'rgba(0,0,0,0.5)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = g
  c.fillRect(0, 0, 540, 520)
  c.fillStyle = '#fff'
  c.textAlign = 'center'
  c.shadowColor = 'rgba(0,0,0,0.4)'
  c.shadowBlur = 10
  c.font = `600 38px ${F.serif}`
  const lines = wrap(c, VERSE.text, 440)
  lines.forEach((l, i) => c.fillText(l, 270, 130 + i * 60))
  c.font = `500 24px ${F.sans}`
  c.fillText(VERSE.ref, 270, 130 + lines.length * 60 + 20)
  return card
}

// ── 지금 (운영 엽서) — 표본 카드를 실제 drawKakaoPostcard 로 굽는다 ──
const drawNow = (target: HTMLCanvasElement, card: HTMLCanvasElement, date: Date) => {
  // 운영은 이제 P1 — 비교용으로 옛 엽서 대신 운영 함수를 그대로 부른다
  drawKakaoPostcard(target, card, { sender: SENDER, date, lang: 'ko' })
}

/** 카드 자체를 흐리게 늘려 바탕으로 — 작은 캔버스로 줄였다 키우는 방식이라 ctx.filter 없는 사파리도 같다 */
const blurredBackdrop = (ctx: CanvasRenderingContext2D, card: HTMLCanvasElement, dim: number) => {
  const tiny = document.createElement('canvas')
  tiny.width = 18
  tiny.height = 18
  const t = tiny.getContext('2d')!
  t.drawImage(card, 0, card.height * 0.15, card.width, card.width, 0, 0, 18, 18)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(tiny, -40, -40, S + 80, S + 80)
  ctx.fillStyle = `rgba(0,0,0,${dim})`
  ctx.fillRect(0, 0, S, S)
}

const placeCard = (ctx: CanvasRenderingContext2D, card: HTMLCanvasElement, cx: number, cy: number, h: number, rot = 0, radius = 18) => {
  const w = (card.width / card.height) * h
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((rot * Math.PI) / 180)
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 14
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.roundRect(-w / 2, -h / 2, w, h, radius)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.clip()
  ctx.drawImage(card, -w / 2, -h / 2, w, h)
  ctx.restore()
  return w
}

// ── P1 카드 그대로 — 바탕은 카드의 색을 흐리게 ──
const drawHeroPlain = (ctx: CanvasRenderingContext2D, card: HTMLCanvasElement, date: Date) => {
  blurredBackdrop(ctx, card, 0.18)
  const w = placeCard(ctx, card, S / 2, S / 2, S * 0.9)
  ctx.save()
  ctx.translate(S / 2 + w / 2 + 34, S - 60)
  ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.textAlign = 'left'
  ctx.font = `600 20px ${F.sans}`
  ctx.fillText(`From. ${SENDER} · ${date.getMonth() + 1}.${date.getDate()}`, 0, 0)
  ctx.restore()
}

// ── P2 카드 + 손글씨 쪽지 ──
const drawHeroNote = (ctx: CanvasRenderingContext2D, card: HTMLCanvasElement) => {
  blurredBackdrop(ctx, card, 0.08)
  placeCard(ctx, card, S * 0.42, S / 2, S * 0.88, -2.5)
  ctx.save()
  ctx.translate(S * 0.74, S * 0.72)
  ctx.rotate((5 * Math.PI) / 180)
  ctx.shadowColor = 'rgba(0,0,0,0.3)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 10
  ctx.fillStyle = '#fff6c9'
  ctx.fillRect(-130, -110, 260, 220)
  ctx.shadowColor = 'transparent'
  ctx.save()
  ctx.rotate((-8 * Math.PI) / 180)
  ctx.fillStyle = 'rgba(160,200,255,0.75)'
  ctx.fillRect(-55, -130, 110, 34)
  ctx.restore()
  ctx.fillStyle = '#3b3326'
  ctx.textAlign = 'left'
  ctx.font = `400 50px ${F.hand}`
  ;['오늘 이 말씀이', '생각났어요'].forEach((l, i) => ctx.fillText(l, -108, -30 + i * 54))
  ctx.textAlign = 'right'
  ctx.font = `400 40px ${F.hand}`
  ctx.fillStyle = 'rgba(59,51,38,0.75)'
  ctx.fillText(`— ${SENDER}`, 108, 84)
  ctx.restore()
}

// ── P3 봉투에서 쑥 — 카드 위쪽(말씀 자리)이 보이게 꺼내 든 모습 ──
const drawHeroEnvelope = (ctx: CanvasRenderingContext2D, card: HTMLCanvasElement) => {
  blurredBackdrop(ctx, card, 0.12)
  placeCard(ctx, card, S / 2, S * 0.47, S * 0.86, 0, 14)
  const top = S * 0.68
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.3)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = -6
  ctx.fillStyle = '#fbf6ec'
  ctx.beginPath()
  ctx.moveTo(60, top)
  ctx.lineTo(S / 2, top + 90)
  ctx.lineTo(S - 60, top)
  ctx.lineTo(S - 60, S + 10)
  ctx.lineTo(60, S + 10)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = 'rgba(150,120,90,0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(60, top)
  ctx.lineTo(S / 2, top + 90)
  ctx.lineTo(S - 60, top)
  ctx.stroke()
  ctx.fillStyle = '#2c3550'
  ctx.textAlign = 'left'
  ctx.font = `400 56px ${F.hand}`
  ctx.fillText(`To. ${RECIPIENT}께`, 100, S - 40)
  ctx.textAlign = 'right'
  ctx.font = `400 40px ${F.hand}`
  ctx.fillStyle = 'rgba(44,53,80,0.75)'
  ctx.fillText(`From. ${SENDER}`, S - 100, S - 40)
}

// ── 시안 목록 ──
type Key = 'now' | 'p1' | 'p2' | 'p3' | 'a' | 'b' | 'c' | 'd' | 'e'
interface Variant {
  key: Key
  name: string
  pitch: string
  title: string
  desc: string
  buttons: string[]
  why: string[]
  landing: string
}

const VARIANTS: Variant[] = [
  {
    key: 'now',
    name: '지금',
    pitch: '종이 엽서 + 인화 사진',
    title: `${SENDER} 님이 보낸 말씀 엽서`,
    desc: `${VERSE.ref} · 11월 19일 수요일`,
    buttons: ['말씀 읽기', '답장 엽서 쓰기'],
    why: ['말씀 글씨가 사진 안에서 너무 작아 카톡에서 안 읽힘', '두 장 연달아 오면 똑같아 보임', '“답장 엽서 쓰기”가 두 줄로 꺾임'],
    landing: '—',
  },
  {
    key: 'p1',
    name: 'P1 · 카드 그대로',
    pitch: '내가 만든 카드가 전부 — 꾸밈 0',
    title: NOTE,
    desc: `${SENDER} 님이 만든 말씀 카드 · ${VERSE.ref}`,
    buttons: ['말씀 읽기', '나도 만들기'],
    why: ['카드를 판 높이의 90%로 — 지금(약 70%·기울임·인화지 테두리)보다 크고 반듯하게', '남는 양옆은 카드 자기 색을 흐리게 번져 채움(인스타 스토리 공유 방식)', '보낸 사람 한마디는 그림 대신 카드 제목(굵은 글씨)으로'],
    landing: '카드 원본을 크게 보여 주고, 아래 “이 말씀 읽기 / 이 사진으로 나도 만들기”',
  },
  {
    key: 'p2',
    name: 'P2 · 카드 + 쪽지',
    pitch: '카드는 크게, 마음은 쪽지 한 장으로',
    title: `${SENDER} 님이 말씀 카드를 보냈어요`,
    desc: `${VERSE.ref} · 11월 19일`,
    buttons: ['말씀 읽기', '답장하기'],
    why: ['카드가 주인공, 손글씨 쪽지가 모서리에 살짝 붙음 — 손으로 건넨 느낌', '한마디를 비우면 쪽지가 안 붙음 → P1과 같아짐', '쪽지 색·테이프만 바꿔 계절감'],
    landing: '쪽지를 톡 누르면 떨어지며 카드 전체가 보임',
  },
  {
    key: 'p3',
    name: 'P3 · 봉투에서 쑥',
    pitch: '꺼내 드는 순간 — 카드 윗부분이 먼저',
    title: `${RECIPIENT}께, 말씀 카드가 왔어요`,
    desc: `${SENDER} 님이 보냈어요 · ${VERSE.ref}`,
    buttons: ['꺼내 보기', '답장하기'],
    why: ['카드 아래 1/4만 봉투가 가려 궁금함 + 카드는 그대로 주인공', '카드 스타일이 글 위치를 알고 있으니 말씀을 가리지 않게 봉투 높이를 맞춤', '받는 사람 이름 칸 “To. 엄마께”'],
    landing: '카드가 봉투에서 쑥 올라와 화면 가득',
  },
  {
    key: 'a',
    name: 'A · 은혜 영수증',
    pitch: '피식 웃게 — 합계 0원',
    title: `${SENDER} 님이 은혜 영수증을 보냈어요`,
    desc: '합계 0원 · 결제는 이미 끝났대요',
    buttons: ['영수증 받기', '나도 보내기'],
    why: ['요즘 유행하는 “영수증 감성” — 단톡방에서 한 번 더 보게 됨', '“다 이루었다” 결제 도장 + 롬 3:24 값없이 — 웃기면서 복음이 그대로', '품목은 말씀마다 2~3개 고르게(쉼·위로·용기…)'],
    landing: '누르면 영수증이 프린터에서 “지이잉” 올라오듯 내려오며 말씀 본문 강조',
  },
  {
    key: 'b',
    name: 'B · 말씀 편지 봉투',
    pitch: '궁금해서 누르게 — 아직 안 뜯은 편지',
    title: `${RECIPIENT}께, 말씀 편지 한 통이 왔어요`,
    desc: `${SENDER} 님이 보냈어요 · 무슨 말씀일까요?`,
    buttons: ['봉투 열기', '답장하기'],
    why: ['그림에서 말씀을 일부러 숨김 → 누를 이유가 생김', '“To. 엄마께” 받는 사람 이름 칸을 새로 둠 — 나한테 온 것 같은 흐뭇함', '우표 안에 계절 교회 사진, 밀랍 봉인은 브랜드 블루 “빛”'],
    landing: '봉인을 톡 누르면 덮개가 열리고 편지지가 쑥 올라옴(타임캡슐 빛 봉투 연출 재사용)',
  },
  {
    key: 'c',
    name: 'C · 말씀 승차권',
    pitch: '모으고 싶게 — 출발 “지친 오늘” → 도착 “쉼”',
    title: `${RECIPIENT}, 쉼으로 가는 승차권이 왔어요`,
    desc: `${VERSE.ref} · 유효기간 없음`,
    buttons: ['탑승하기', '나도 보내기'],
    why: ['좌석 = 장:절, 노선 = 책 이름 — 말씀 정보가 표 정보로 자연스럽게', '도착지는 보낼 때 고름(쉼·평안·용기·소망·기쁨·감사)', '/mission 탑승권과 같은 세계관, 배경은 교회 사진'],
    landing: '표를 위로 밀면 “탑승 완료” 펀칭 + 받은 승차권 모음(내 지갑)에 쌓임',
  },
  {
    key: 'd',
    name: 'D · 큰 글씨 사진',
    pitch: '어르신도 바로 읽게 — 군더더기 없이',
    title: NOTE,
    desc: `${SENDER} · ${VERSE.ref}`,
    buttons: ['말씀 읽기', '답장하기'],
    why: ['카톡 작은 화면에서도 말씀이 그대로 읽힘(지금 대비 글씨 약 4배)', '보낸 사람이 쓴 한마디가 카드 제목(굵은 글씨)으로 올라감', '사진은 계절 교회 전경 — 그 주 계절이 저절로 바뀜'],
    landing: '바로 장 화면으로, 그 절에 은은한 등불 강조',
  },
  {
    key: 'e',
    name: 'E · 말씀 반창고',
    pitch: '흐뭇하게 — 아픈 데 붙이는 말씀',
    title: `${SENDER} 님이 말씀 반창고를 보냈어요`,
    desc: `마음 아픈 데 붙이세요 · ${VERSE.ref}`,
    buttons: ['붙여 보기', '나도 보내기'],
    why: ['위로가 필요한 사람에게 보내기 좋은 귀여운 한 장', '패드에는 절의 “핵심 한 구절”만 크게 — 보낼 때 구절을 고름', '용법·효과 손글씨로 피식'],
    landing: '반창고를 떼어 화면에 “착” 붙이는 손맛 + 전체 본문',
  },
]

const KakaoBubble = ({ v, src }: { v: Variant; src: string | null }) => (
  <div className="kpp-chat">
    <div className="kpp-msg">
      <div className="kpp-avatar">{SENDER.slice(0, 1)}</div>
      <div className="kpp-msg__col">
        <div className="kpp-name">{SENDER}</div>
        <div className="kpp-row">
          <div className="kpp-card">
            <div className="kpp-card__img">{src ? <img src={src} alt="" /> : <div className="kpp-card__ph" />}</div>
            <div className="kpp-card__text">
              <div className="kpp-card__title">{v.title}</div>
              <div className="kpp-card__desc">{v.desc}</div>
            </div>
            <div className="kpp-card__btns">
              {v.buttons.map((b) => (
                <span key={b} className="kpp-card__btn">
                  {b}
                </span>
              ))}
            </div>
            <div className="kpp-card__foot">
              <span className="kpp-card__app">참</span>
              참빛교회
              <span className="kpp-card__chev">›</span>
            </div>
          </div>
          <span className="kpp-time">오전 9:32</span>
        </div>
      </div>
    </div>
  </div>
)

const KakaoPostcardPreview = () => {
  const [params, setParams] = useSearchParams()
  const pick = (params.get('v') ?? 'all') as Key | 'all'
  const [srcs, setSrcs] = useState<Partial<Record<Key, string>>>({})
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    const run = async () => {
      await Promise.all([ensureFontFamily('nanumPen'), ensureFontFamily('gowunBatang')])
      await Promise.all(
        ['400 40px "Nanum Pen Script"', '700 40px "Gowun Batang"', '700 40px "Noto Serif KR"', '600 40px "Noto Serif KR"'].map((f) =>
          document.fonts.load(f).catch(() => null),
        ),
      )
      const church = await loadImg(CHURCH_SEASON_PHOTO[getNaturalSeason(new Date())].light)
      const card = makeCard(await loadImg('/images/visit/scene-autumn-day.webp'))
      const date = new Date()
      const make = (fn: (ctx: CanvasRenderingContext2D) => void) => {
        const c = document.createElement('canvas')
        c.width = S
        c.height = S
        fn(c.getContext('2d')!)
        return c.toDataURL('image/jpeg', 0.9)
      }
      const now = document.createElement('canvas')
      drawNow(now, card, date)
      setSrcs({
        now: now.toDataURL('image/jpeg', 0.9),
        p1: make((c) => drawHeroPlain(c, card, date)),
        p2: make((c) => drawHeroNote(c, card)),
        p3: make((c) => drawHeroEnvelope(c, card)),
        a: make((c) => drawReceipt(c, date)),
        b: make((c) => drawEnvelope(c, church, date)),
        c: make((c) => drawTicket(c, church, date)),
        d: make((c) => drawBigVerse(c, church, date)),
        e: make((c) => drawBandage(c)),
      })
    }
    void run()
  }, [])

  const shown = pick === 'all' ? VARIANTS : VARIANTS.filter((v) => v.key === pick)

  return (
    <div className="kpp">
      <header className="kpp-head">
        <h1>카카오톡 말씀 카드 시안</h1>
        <p>카톡 대화방에서 받는 사람 눈에 보이는 그대로 — 그림은 실제 캔버스로 구웠어요(표본 데이터).</p>
        <nav className="kpp-tabs">
          {(['all', ...VARIANTS.map((v) => v.key)] as const).map((k) => (
            <button
              key={k}
              type="button"
              className={pick === k ? 'is-on' : ''}
              onClick={() => setParams(k === 'all' ? {} : { v: k })}
            >
              {k === 'all' ? '전체' : VARIANTS.find((v) => v.key === k)!.name}
            </button>
          ))}
        </nav>
      </header>
      <div className={`kpp-grid ${pick !== 'all' ? 'is-single' : ''}`}>
        {shown.map((v) => (
          <section key={v.key} className={`kpp-col ${v.key === 'now' ? 'is-now' : ''}`}>
            <div className="kpp-col__head">
              <h2>{v.name}</h2>
              <p>{v.pitch}</p>
            </div>
            <KakaoBubble v={v} src={srcs[v.key] ?? null} />
            <ul className="kpp-why">
              {v.why.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            {v.key !== 'now' && (
              <p className="kpp-landing">
                <b>눌렀을 때</b> {v.landing}
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

export default KakaoPostcardPreview
