// 공개 페이지 정적 프리렌더 + sitemap.xml 생성 — `npm run build` 뒤에 돈다.
//
// 왜: 앱은 HashRouter 라 /#/about, /#/worship 이 검색엔진 눈에는 전부 루트 한 URL 이다.
// 교회 소개·예배 안내·오시는 길처럼 외부인이 검색할 페이지만 경로 URL(/about, /worship …)에
// 진짜 HTML(제목·설명·본문·OG·JSON-LD)을 둬서 "부천 교회 예배 시간" 같은 검색에 걸리게 한다.
// 네이버(Yeti)는 JS 렌더링이 약해 이 정적 HTML 이 사실상 유일한 색인 경로다.
//
// 동작:
//  - dist/<slug>.html 로 쓴다. Cloudflare Pages 는 /about.html 을 /about 로 서빙하고
//    /about.html, /about/ 요청은 /about 로 301 한다 → canonical 은 확장자 없는 경로.
//  - 사람(일반 브라우저)이 열면 스크립트가 같은 화면의 앱 주소(/#/about)로 바로 넘긴다.
//    크롤러 UA(Googlebot·Yeti·bingbot·kakaotalk-scrap·facebookexternalhit 등)는 넘기지 않고
//    정적 본문을 그대로 읽는다. meta refresh 는 쓰지 않는다 — 구글이 리다이렉트로 취급해
//    색인 대상을 루트로 합쳐 버린다.
//  - 서비스 워커는 홈(/) 응답만 앱 셸로 보관하므로 이 페이지가 오프라인 캐시를 오염시키지 않는다.
//  - 내용은 src/seo/publicPages.json 하나가 단일 출처(RouteMeta 탭 제목·index.html JSON-LD 와 공유).
//
// 수동 실행: node scripts/prerender-seo.mjs  (dist/ 가 있어야 한다)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')
const seo = JSON.parse(readFileSync(join(ROOT, 'src/seo/publicPages.json'), 'utf8'))
const { site, pages, jsonLd } = seo

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const today = new Date().toISOString().slice(0, 10)

// ── 본문 조각 ──────────────────────────────────────────────────────────
const serviceRows = (list) =>
  list
    .map(
      (s) =>
        `<tr><th scope="row">${esc(s.name)}</th><td>${esc(s.time)}${s.place ? ` <span class="muted">· ${esc(s.place)}</span>` : ''}</td></tr>`,
    )
    .join('')

const FACT_BLOCKS = {
  sunday: () => `<section class="card"><h2>주일 예배</h2><table>${serviceRows(site.sundayServices)}</table></section>`,
  weekday: () => `<section class="card"><h2>주중 예배·기도회</h2><table>${serviceRows(site.weekdayServices)}</table></section>`,
  address: () =>
    `<section class="card"><h2>주소</h2><p>${esc(site.address)} <span class="muted">(우 ${esc(site.postcode)})</span></p><p><a href="${esc(jsonLd['@graph'][0].hasMap)}" rel="noopener">카카오맵에서 보기</a></p></section>`,
  subway: () => `<section class="card"><h2>대중교통</h2><p>${esc(site.subway)}</p></section>`,
  phone: () =>
    `<section class="card"><h2>전화</h2><p><a href="tel:${esc(site.phone.replace(/-/g, ''))}">${esc(site.phone)}</a></p></section>`,
}

const navLinks = (current) =>
  pages
    .map((p) =>
      p.path === current
        ? `<a aria-current="page" href="${esc(p.path)}">${esc(p.title)}</a>`
        : `<a href="${esc(p.path)}">${esc(p.title)}</a>`,
    )
    .join('')

// ── 사람 → 앱 리다이렉트 (크롤러 제외) ───────────────────────────────────
// 알려진 크롤러·미리보기 봇은 정적 본문을 읽게 두고, 그 외(실제 사용자)는 즉시 앱으로.
// 주의: "kakao"·"naver"·"facebook" 처럼 넓게 잡으면 카톡·네이버·페북 인앱 브라우저로 링크를 연
// 실제 사용자(UA 에 KAKAOTALK / NAVER(inapp) / FBAN 포함)까지 정적 페이지에 갇힌다.
// 스크래퍼 고유 토큰(kakaotalk-scrap, Yeti, facebookexternalhit, Daumoa)만 잡는다.
const REDIRECT_SCRIPT = String.raw`(function(){try{
var ua=navigator.userAgent||'';
if(/bot|crawl|spider|slurp|yeti|daumoa|daum\/|kakaotalk-scrap|facebookexternalhit|preview|fetch|scrap|embedly|lighthouse|headless/i.test(ua))return;
var h='/#'+location.pathname.replace(/\.html$/,'').replace(/\/+$/,'')+location.search;
location.replace(h);
}catch(e){}})();`

// ── 페이지 템플릿 ─────────────────────────────────────────────────────
function render(page) {
  const url = `${site.origin}${page.path}`
  const fullTitle = `${page.title} | ${site.titleSuffix}`
  const facts = (page.facts || []).map((k) => FACT_BLOCKS[k]?.() ?? '').join('')
  const paragraphs = (page.paragraphs || []).map((t) => `<p>${esc(t)}</p>`).join('')
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: site.name, item: `${site.origin}/` },
      { '@type': 'ListItem', position: 2, name: page.title, item: url },
    ],
  }
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: fullTitle,
    description: page.description,
    inLanguage: 'ko-KR',
    isPartOf: { '@id': `${site.origin}/#website` },
    about: { '@id': `${site.origin}/#church` },
  }

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(page.description)}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${esc(url)}" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="apple-touch-icon" href="/pwa-192x192.png" />
<meta name="theme-color" content="#f1f3f6" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${esc(site.name)}" />
<meta property="og:title" content="${esc(fullTitle)}" />
<meta property="og:description" content="${esc(page.description)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${esc(site.origin + site.ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="ko_KR" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(fullTitle)}" />
<meta name="twitter:description" content="${esc(page.description)}" />
<meta name="twitter:image" content="${esc(site.origin + site.ogImage)}" />
<script>${REDIRECT_SCRIPT}</script>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(webPage)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
<style>
  :root{color-scheme:light}
  *{box-sizing:border-box}
  body{margin:0;background:#f1f3f6;color:#191f28;font-family:Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
  a{color:#3182f6}
  header{background:#fff;border-bottom:1px solid #e5e8eb}
  .wrap{max-width:720px;margin:0 auto;padding:0 16px}
  .brand{display:flex;align-items:center;gap:10px;padding:14px 0;font-weight:800;font-size:18px;color:#191f28;text-decoration:none}
  .brand img{width:28px;height:28px;border-radius:8px}
  nav{display:flex;gap:4px 14px;flex-wrap:wrap;padding:0 0 12px;font-size:14px}
  nav a{color:#4e5968;text-decoration:none}
  nav a[aria-current]{color:#3182f6;font-weight:700}
  main{padding:28px 0 48px}
  h1{font-size:28px;line-height:1.3;margin:0 0 10px;font-weight:800;letter-spacing:-.01em}
  .lead{font-size:17px;color:#333d4b;margin:0 0 20px}
  p{margin:0 0 12px}
  .muted{color:#8b95a1}
  .card{background:#fff;border-radius:16px;padding:18px 20px;margin:14px 0;box-shadow:0 1px 2px rgba(0,0,0,.04)}
  .card h2{font-size:15px;margin:0 0 8px;color:#3182f6;font-weight:700}
  table{border-collapse:collapse;width:100%;font-size:15px}
  th{text-align:left;font-weight:600;padding:6px 10px 6px 0;white-space:nowrap;vertical-align:top}
  td{padding:6px 0}
  .cta{display:inline-block;margin-top:22px;background:#3182f6;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:12px}
  footer{padding:20px 0 40px;font-size:13px;color:#8b95a1}
</style>
</head>
<body>
<header>
  <div class="wrap">
    <a class="brand" href="/"><img src="/pwa-192x192.png" alt="" width="28" height="28" />${esc(site.name)}</a>
    <nav aria-label="교회 안내">${navLinks(page.path)}</nav>
  </div>
</header>
<main class="wrap">
  <article>
    <h1>${esc(page.h1)}</h1>
    <p class="lead">${esc(page.lead)}</p>
    ${paragraphs}
    ${facts}
    <a class="cta" href="/#${esc(page.path)}">홈페이지에서 자세히 보기</a>
  </article>
</main>
<footer class="wrap">${esc(site.name)} · ${esc(site.address)} · ${esc(site.phone)}</footer>
</body>
</html>
`
}

// ── sitemap ───────────────────────────────────────────────────────────
function sitemap() {
  const urls = [{ loc: `${site.origin}/`, priority: '1.0' }, ...pages.map((p) => ({ loc: `${site.origin}${p.path}`, priority: '0.8' }))]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${esc(u.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`
}

// ── 실행 ──────────────────────────────────────────────────────────────
if (!existsSync(DIST)) mkdirSync(DIST, { recursive: true })
for (const page of pages) {
  const slug = page.path.replace(/^\//, '')
  writeFileSync(join(DIST, `${slug}.html`), render(page), 'utf8')
}
writeFileSync(join(DIST, 'sitemap.xml'), sitemap(), 'utf8')
console.log(`[prerender-seo] ${pages.length} pages + sitemap.xml → dist/`)
