// Cloudflare Pages Function — /b/* 말씀 공유 링크.
//
// vercel.json 의 `/b/:path*` rewrite 를 대체한다. Pages 의 _redirects 파일은
// 외부 도메인으로의 200 프록시를 지원하지 않으므로 Function 으로 처리해야 한다.
// 사람/크롤러 분기는 _lib/shareEntry.js 한 곳 — 크롤러·card.png·형식이 어긋난 주소는 백엔드(share_preview.py)로,
// 사람은 앱 셸을 바로 받고 src/utils/shareEntry.ts 가 #/bible/{책}/{장}?verse={첫 절} 로 바꿔 읽는다.
import { handleShareEntry } from '../_lib/shareEntry.js'

/** /b/{책}/{장}/{절 명세} — 절 명세는 백엔드 VERSE_SPEC_RE 와 같은 형식('16-17,20') */
const SHARE_PATH = /^\/b\/(\d{1,2})\/(\d{1,3})\/(\d{1,3}(?:-\d{1,3})?(?:,\d{1,3}(?:-\d{1,3})?)*)\/?$/

export async function onRequest(context) {
  const url = new URL(context.request.url)
  const m = SHARE_PATH.exec(url.pathname)
  const book = m ? Number(m[1]) : 0
  // 자리표시자(합쳐진) 절로 온 링크는 앱의 절 목록이 본문이 있는 절로 옮겨 잡는다 (VerseList index.anchorVerse)
  const deepLink =
    m && book >= 1 && book <= 66 && m[3].length <= 64
      ? `${url.origin}/#/bible/${book}/${Number(m[2])}?verse=${parseInt(m[3], 10)}`
      : null
  return handleShareEntry(context, deepLink, {
    title: '부천참빛교회 성경',
    heading: '참빛교회 성경',
    description: '함께 읽는 말씀 — 성경 본문과 해설을 참빛교회 성경에서 만나보세요.',
  })
}
