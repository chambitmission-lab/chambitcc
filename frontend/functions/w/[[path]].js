// Cloudflare Pages Function — /w/* 주보 공유 링크.
// 사람/크롤러 분기는 _lib/shareEntry.js 한 곳 — 크롤러·card.png 는 백엔드(bulletin_share.py)로,
// 사람은 앱 셸을 바로 받고 src/utils/shareEntry.ts 가 #/news?tab=bulletin&b={id} 로 바꿔 읽는다.
import { handleShareEntry } from '../_lib/shareEntry.js'

/** 사람이 열 주소 — /w/{id} 만. card.png 등 나머지는 전부 백엔드로 */
const SHARE_PATH = /^\/w\/(\d+)\/?$/

export async function onRequest(context) {
  const url = new URL(context.request.url)
  const match = SHARE_PATH.exec(url.pathname)
  const deepLink = match ? `${url.origin}/#/news?tab=bulletin&b=${match[1]}` : null
  return handleShareEntry(context, deepLink, { title: '부천참빛교회 주보', heading: '참빛교회 주보' })
}
