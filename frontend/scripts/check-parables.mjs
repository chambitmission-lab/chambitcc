// 예수님의 비유 데이터 검증 — 로컬 백엔드(localhost:8000)의 개역개정 본문과 대조한다.
//  ✗ 참조(passage·quote·parallels)가 본문에 없으면 실패
//  ✗ quote 가 passage 범위 밖이면 실패
//  ✗ marks.text 가 quote 본문에 없으면 실패
//  ✗ 큰따옴표 "…" 인용이 passage·parallels 본문에 그대로 없으면 실패 (풀이·낱말 언급은 ‘…’)
//  ✗ id 중복·필수 필드 누락·입문 코스 id 누락이면 실패
// 사용: node scripts/check-parables.mjs   (Node 22.18+ 는 .ts 를 그대로 import)
const { PARABLES, INTRO_COURSE } = await import(new URL('../src/pages/Bible/data/parables/index.ts', import.meta.url))

const cache = new Map()
const parse = (ref) => {
  const [b, c, vs] = ref.split(':')
  const [v, to = v] = vs.split('-')
  return { b: +b, c: +c, v: +v, to: +to }
}
const passage = async (ref) => {
  const r = parse(ref)
  const key = `${r.b}:${r.c}`
  if (!cache.has(key)) {
    const res = await fetch(`http://localhost:8000/api/v1/bible/chapter/${r.b}/${r.c}`)
    cache.set(key, (await res.json()).verses ?? [])
  }
  const verses = cache.get(key).filter((x) => x.verse >= r.v && x.verse <= r.to && x.text)
  return verses.length === r.to - r.v + 1 ? verses.map((x) => x.text).join(' ') : null
}

let bad = 0
const fail = (msg) => {
  bad++
  console.log(`✗ ${msg}`)
}
const REQUIRED = ['id', 'title', 'gist', 'summary', 'topic', 'art', 'passage', 'quote', 'audience', 'trigger', 'context', 'shock', 'ask']
const ids = new Set()
for (const p of PARABLES) {
  for (const k of REQUIRED) if (!p[k] || typeof p[k] !== 'string') fail(`${p.id ?? '?'}: ${k} 없음`)
  if (ids.has(p.id)) fail(`${p.id}: id 중복`)
  ids.add(p.id)
  if (!/^\d+:\d+:\d+(-\d+)?$/.test(p.passage) || !/^\d+:\d+:\d+(-\d+)?$/.test(p.quote)) {
    fail(`${p.id}: 참조 형식은 b:c:v 또는 b:c:v-to`)
    continue
  }
  const body = await passage(p.passage)
  if (!body) {
    fail(`${p.id}: passage ${p.passage} 본문 없음`)
    continue
  }
  const pr = parse(p.passage)
  const qr = parse(p.quote)
  if (qr.b !== pr.b || qr.c !== pr.c || qr.v < pr.v || qr.to > pr.to) fail(`${p.id}: quote ${p.quote} 가 passage ${p.passage} 밖`)
  if (qr.to - qr.v > 5) fail(`${p.id}: quote 는 6절 이하로`)
  const quote = await passage(p.quote)
  if (!quote) fail(`${p.id}: quote ${p.quote} 본문 없음`)
  if (!Array.isArray(p.marks) || p.marks.length < 2) fail(`${p.id}: marks 2개 이상`)
  for (const m of p.marks ?? []) {
    if (!m.text || !m.meaning) fail(`${p.id}: mark 필드 누락`)
    else if (quote && !quote.includes(m.text)) fail(`${p.id}: quote ${p.quote} 에 "${m.text}" 없음`)
  }
  const bodies = [body]
  for (const r of p.parallels ?? []) {
    const t = await passage(r)
    if (!t) fail(`${p.id}: 평행 본문 ${r} 없음`)
    else bodies.push(t)
  }
  const texts = [p.gist, p.summary, p.audience, p.trigger, p.context, p.shock, p.ask, ...(p.marks ?? []).map((m) => m.meaning)]
  for (const t of texts) {
    if (typeof t !== 'string') continue
    for (const [, q] of t.matchAll(/"([^"]+)"/g)) {
      if (!bodies.some((b) => b.includes(q))) fail(`${p.id}: 큰따옴표 인용 "${q}" 가 본문에 없음 — 원문 그대로 고치거나 ‘…’ 로`)
    }
    if (/[“”]/.test(t)) fail(`${p.id}: 둥근 큰따옴표 “” 대신 곧은 "…"(원문 인용) 또는 ‘…’(풀이)`)
  }
}
for (const id of INTRO_COURSE) if (!ids.has(id)) fail(`입문 코스 id ${id} 가 데이터에 없음`)
console.log(`\n비유 ${PARABLES.length}편 검사 · 실패 ${bad}`)
process.exit(bad ? 1 : 0)
