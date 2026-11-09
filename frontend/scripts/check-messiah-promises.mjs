// 약속과 성취 데이터 검증 — 로컬 백엔드(localhost:8000)의 개역개정 본문과 대조한다.
//  ✗ 참조(책:장:절)가 본문에 없으면 실패
//  ✗ otMarks 가 구약 본문에 없거나, ntMarks 가 신약 본문 어디에도 없으면 실패
//  ✗ id 중복이면 실패
// 사용: node scripts/check-messiah-promises.mjs   (Node 22.18+ 는 .ts 를 그대로 import)
const { default: promises } = await import(new URL('../src/pages/Bible/data/messiah/promises.ts', import.meta.url))

const cache = new Map()
const passage = async (ref) => {
  const [b, c, vs] = ref.split(':')
  const [v, to = v] = vs.split('-')
  const key = `${b}:${c}`
  if (!cache.has(key)) {
    const res = await fetch(`http://localhost:8000/api/v1/bible/chapter/${b}/${c}`)
    cache.set(key, (await res.json()).verses ?? [])
  }
  const verses = cache.get(key).filter((x) => x.verse >= +v && x.verse <= +to && x.text)
  return verses.length === +to - +v + 1 ? verses.map((x) => x.text).join(' ') : null
}

let bad = 0
const fail = (msg) => {
  bad++
  console.log(`✗ ${msg}`)
}
const ids = new Set()
for (const p of promises) {
  if (ids.has(p.id)) fail(`${p.id}: id 중복`)
  ids.add(p.id)
  const ot = await passage(p.ot)
  if (!ot) {
    fail(`${p.id}: 구약 ${p.ot} 본문 없음`)
    continue
  }
  for (const m of p.otMarks) if (!ot.includes(m)) fail(`${p.id}: 구약 ${p.ot} 에 "${m}" 없음`)
  const nts = []
  for (const r of p.nt) {
    const t = await passage(r)
    if (!t) fail(`${p.id}: 신약 ${r} 본문 없음`)
    else nts.push(t)
  }
  for (const m of p.ntMarks) if (!nts.some((t) => t.includes(m))) fail(`${p.id}: 신약 본문에 "${m}" 없음`)
  if (Number(p.ot.split(':')[0]) > 39) fail(`${p.id}: 구약 자리에 신약 ${p.ot}`)
  for (const r of p.nt) if (Number(r.split(':')[0]) < 40) fail(`${p.id}: 신약 자리에 구약 ${r}`)
}
console.log(`\n${promises.length}쌍 검사 · 실패 ${bad}`)
process.exit(bad ? 1 : 0)
