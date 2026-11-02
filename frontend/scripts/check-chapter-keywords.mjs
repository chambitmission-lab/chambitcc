// 열쇠말 데이터 검증 — 로컬 백엔드(localhost:8000)의 개역개정 본문과 대조한다.
//  ✗ count 가 실제 match 등장 횟수와 다르면 실패
//  ✗ match 가 본문에 아예 없으면 실패
//  ⚠ why·meaning 의 큰따옴표 인용("…")이 이 장 본문에 없으면 경고 (… 로 나뉜 조각마다 확인)
//    — 본문 인용이 아닌 풀이용 따옴표("참 좋다" 등)도 잡히니 눈으로 걸러 낸다
// 사용: node scripts/check-chapter-keywords.mjs [책번호...]   (Node 22.18+ 는 .ts 를 그대로 import)
import { readdirSync } from 'node:fs'

const dir = new URL('../src/pages/Bible/data/chapterKeywords/', import.meta.url)
const books = process.argv.slice(2).map(Number).filter(Boolean)
// 시편처럼 나눠 쓴 책(book19a.ts·book19b.ts)은 조각을 검사하고, 합치기만 하는 book19.ts 는 건너뛴다
const all = readdirSync(dir)
const files = all.filter(
  (f) => /^book\d+[a-z]?\.ts$/.test(f) && !(/^book\d+\.ts$/.test(f) && all.includes(f.replace('.ts', 'a.ts')))
)
const squash = (s) => s.replace(/[\s,.;:!?'"“”‘’·]/g, '')
let bad = 0
let warn = 0
for (const f of files.sort()) {
  const book = Number(f.slice(4, 6))
  if (books.length && !books.includes(book)) continue
  const { default: data } = await import(new URL(f, dir))
  for (const [ch, list] of Object.entries(data)) {
    const res = await fetch(`http://localhost:8000/api/v1/bible/chapter/${book}/${ch}`)
    const { verses } = await res.json()
    const whole = squash(verses.map((v) => v.text).join(' '))
    for (const kw of list) {
      const n = verses.reduce((sum, v) => sum + kw.match.reduce((s, m) => s + v.text.split(m).length - 1, 0), 0)
      if (n !== kw.count) {
        bad++
        console.log(`✗ ${book}:${ch} "${kw.word}" count=${kw.count} 실제=${n}`)
      }
      if (n === 0) {
        bad++
        console.log(`✗ ${book}:${ch} "${kw.word}" 본문에 없음: ${kw.match.join(', ')}`)
      }
      for (const text of [kw.meaning, kw.why]) {
        for (const [, q] of text.matchAll(/"([^"]+)"/g)) {
          const pieces = q.split('…').map(squash).filter((p) => p.length >= 4)
          const missing = pieces.filter((p) => !whole.includes(p))
          if (missing.length) {
            warn++
            console.log(`⚠ ${book}:${ch} "${kw.word}" 인용 불일치: "${q}"`)
          }
        }
      }
    }
  }
  console.log(`${f}: ${Object.keys(data).length}장 확인`)
}
console.log(`실패 ${bad} · 경고 ${warn}`)
if (bad) process.exit(1)
