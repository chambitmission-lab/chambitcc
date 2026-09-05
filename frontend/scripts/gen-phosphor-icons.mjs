// Phosphor 아이콘 로컬 서브셋 생성기
//
// 왜: @phosphor-icons/react 는 아이콘 하나에 6가지 굵기(thin·light·regular·bold·fill·duotone)의
// SVG 패스를 전부 실어 온다. 이 앱은 duotone·bold 두 굵기만 쓰는데도 엔트리 번들에
// 아이콘 55개 × 6굵기 = 약 180KB 가 들어가 있었다(전체의 25%).
// 이 스크립트는 소스에서 실제로 import 하는 아이콘과 실제로 쓰는 굵기만 골라
// src/components/icons/phosphor/generated/ 에 얇은 컴포넌트로 뽑아낸다.
//
// 사용: node scripts/gen-phosphor-icons.mjs
//   - 새 아이콘이 필요하면 소스에서 `import { X } from '.../components/icons/phosphor'` 로
//     먼저 쓰고 이 스크립트를 다시 돌리면 된다 (없는 아이콘은 타입 에러로 드러난다).
//   - @phosphor-icons/react 는 devDependency 로만 남겨 둔다 (여기서 패스 데이터를 읽는다).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src')
const DEFS = path.join(ROOT, 'node_modules/@phosphor-icons/react/dist/defs')
const OUT = path.join(SRC, 'components/icons/phosphor/generated')
const ALL_WEIGHTS = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone']
const ALWAYS_WEIGHTS = ['duotone'] // IconBase 폴백 순서와 동일 — 최소 한 굵기는 반드시 있어야 한다

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'generated' ? [] : walk(p)
    return /\.(tsx?|mts)$/.test(e.name) ? [p] : []
  })

const files = walk(SRC)
const icons = new Set()
const weights = new Set(ALWAYS_WEIGHTS)
// components/icons/ 안의 파일은 './phosphor' 로 바로 가져오므로 그 형태도 잡는다
const importRe =
  /import\s+(type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]*(?:\/icons\/phosphor|\.\/phosphor|@phosphor-icons\/react))['"]/g
const weightRe = /\bweight\s*[:=]\s*(?:\{\s*)?['"](thin|light|regular|bold|fill|duotone)['"]/g
// make(CaretRight, 'bold') 처럼 아이콘 뒤에 인자로 넘기는 굵기만 잡는다 (테마 'light' 같은 문자열 오탐 방지)
const literalWeightRe = /\(\s*[A-Z]\w*\s*,\s*['"](thin|light|regular|bold|fill|duotone)['"]\s*\)/g

for (const f of files) {
  const code = fs.readFileSync(f, 'utf8')
  let m
  let usesIcons = false
  while ((m = importRe.exec(code))) {
    usesIcons = true
    for (const raw of m[2].split(',')) {
      const name = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()
      if (!name || name === 'Icon' || name === 'IconWeight' || name === 'IconProps') continue
      icons.add(name)
    }
  }
  if (!usesIcons) continue
  while ((m = weightRe.exec(code))) weights.add(m[1])
  while ((m = literalWeightRe.exec(code))) weights.add(m[1])
}

const wantWeights = ALL_WEIGHTS.filter((w) => weights.has(w))
console.log(`icons: ${icons.size}, weights: ${wantWeights.join(', ')}`)

const parseDef = (name) => {
  const file = path.join(DEFS, `${name}.es.js`)
  if (!fs.existsSync(file)) throw new Error(`Phosphor 에 없는 아이콘: ${name}`)
  const src = fs.readFileSync(file, 'utf8')
  const out = {}
  const sectionRe = /\[\s*"(\w+)",\s*([\s\S]*?)\n\s*\]/g
  let s
  while ((s = sectionRe.exec(src))) {
    const [, weight, body] = s
    if (!wantWeights.includes(weight)) continue
    const els = []
    const elRe = /createElement\(\s*"([a-z]+)",\s*\{([\s\S]*?)\}\s*\)/g
    let e
    while ((e = elRe.exec(body))) {
      const [, tag, propsText] = e
      const props = []
      const propRe = /(\w+):\s*"([^"]*)"/g
      let p
      while ((p = propRe.exec(propsText))) props.push(`${p[1]}="${p[2]}"`)
      els.push(`<${tag} ${props.join(' ')} />`)
    }
    if (els.length === 0) throw new Error(`${name}/${weight}: 패스를 찾지 못함`)
    out[weight] = els
  }
  for (const w of wantWeights) if (!out[w]) throw new Error(`${name}: ${w} 굵기 없음`)
  return out
}

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const names = [...icons].sort()
for (const name of names) {
  const def = parseDef(name)
  const entries = wantWeights
    .map((w) => `  ${w}: () => (\n    <>\n${def[w].map((el) => `      ${el}`).join('\n')}\n    </>\n  ),`)
    .join('\n')
  const code = `// 자동 생성 — 직접 수정하지 말고 scripts/gen-phosphor-icons.mjs 를 실행하세요.
import { createIcon } from '../IconBase'

export const ${name} = /* @__PURE__ */ createIcon('${name}', {
${entries}
})
`
  fs.writeFileSync(path.join(OUT, `${name}.tsx`), code)
}

const index = `// 자동 생성 — 직접 수정하지 말고 scripts/gen-phosphor-icons.mjs 를 실행하세요.
${names.map((n) => `export { ${n} } from './${n}'`).join('\n')}
`
fs.writeFileSync(path.join(OUT, 'index.ts'), index)
console.log(`wrote ${names.length} icons → ${path.relative(ROOT, OUT)}`)
