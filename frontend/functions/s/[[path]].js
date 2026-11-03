// Cloudflare Pages Function — /s/* 상황별 말씀 공유 링크 (/bible/situation 몰입 화면의 '보내기').
//
// /b/ 말씀 링크와 같은 구조에 감정 키가 앞에 붙는다: /s/{감정}/{책}/{장}/{절}.
// 크롤러·card.png 는 백엔드(situation_share.py)로 — 감정 삽화 위에 말씀을 얹은 카드를 그린다.
// 사람은 앱 셸을 바로 받고 src/utils/shareEntry.ts 가 #/bible/{책}/{장}?verse={절} 로 바꿔 읽는다.
import { handleShareEntry } from '../_lib/shareEntry.js'

/** 백엔드 situation_share 의 경로와 같은 형식 — 감정 키는 소문자 영문 */
const SHARE_PATH = /^\/s\/([a-z]{1,16})\/(\d{1,2})\/(\d{1,3})\/(\d{1,3})\/?$/

export async function onRequest(context) {
  const url = new URL(context.request.url)
  const m = SHARE_PATH.exec(url.pathname)
  const book = m ? Number(m[2]) : 0
  const deepLink =
    m && book >= 1 && book <= 66 ? `${url.origin}/#/bible/${book}/${Number(m[3])}?verse=${Number(m[4])}` : null
  return handleShareEntry(context, deepLink, {
    title: '부천참빛교회 성경',
    heading: '참빛교회 성경',
    description: '마음에 닿는 말씀 한 구절 — 참빛교회 성경에서 만나보세요.',
  })
}
