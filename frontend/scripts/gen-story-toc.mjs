// 처음 만나는 성경 — 목차(data/toc.ts) 생성기.
//
// 지도(/bible/story)는 화의 id·이모지·제목·한 줄 훅만 쓰는데, 예전엔 본문까지 든
// data/act01~10.ts·promise.ts(약 120KB)가 지도 청크에 통째로 실렸다. 본문 파일은 그대로
// 두고(집필 단일 출처), 여기서 목차만 뽑아 toc.ts 로 굳힌다. 본문은 막 단위로 읽을 때만 받는다.
//
// 본문 파일을 고친 뒤엔 `npm run gen:story-toc` 를 다시 돌린다 — 잊으면
// src/pages/Bible/Story/data/toc.test.ts 가 어긋난 항목을 짚어 준다.
import { build } from 'esbuild'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(here, '../src/pages/Bible/Story/data')
const outFile = path.join(dataDir, 'toc.ts')

const ACT_FILES = Array.from({ length: 10 }, (_, i) => `act${String(i + 1).padStart(2, '0')}`)

// 본문 파일(TS)을 esbuild 로 한 번 묶어 임시 ESM 으로 불러온다 — ts-node 없이 돈다
const loadActs = async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'story-toc-'))
  const entry = path.join(tmp, 'entry.mjs')
  try {
    await build({
      stdin: {
        contents: [
          ...ACT_FILES.map((f) => `export { ${f} } from './${f}'`),
          `export { promiseAct } from './promise'`,
        ].join('\n'),
        resolveDir: dataDir,
        loader: 'ts',
      },
      bundle: true,
      format: 'esm',
      platform: 'node',
      outfile: entry,
      logLevel: 'silent',
    })
    return await import(pathToFileURL(entry).href)
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
}

const q = (s) => JSON.stringify(s)

const episodeLine = (e) => {
  const kind = e.promise ? `, promiseKind: ${q(e.promise.kind)}` : ''
  return `    { id: ${q(e.id)}, emoji: ${q(e.emoji)}, title: ${q(e.title)}, hook: ${q(e.hook)}${kind} },`
}

const actBlock = (name, act) => {
  const badge = act.badge !== undefined ? `\n  badge: ${q(act.badge)},` : ''
  return [
    `export const ${name}: StoryActToc = {`,
    `  act: ${act.act},${badge}`,
    `  title: ${q(act.title)},`,
    `  subtitle: ${q(act.subtitle)},`,
    `  emoji: ${q(act.emoji)},`,
    `  range: ${q(act.range)},`,
    `  episodes: [`,
    ...act.episodes.map(episodeLine),
    `  ],`,
    `}`,
  ].join('\n')
}

const mod = await loadActs()
const acts = ACT_FILES.map((f) => mod[f])
const ids = new Set()
for (const e of [...acts.flatMap((a) => a.episodes), ...mod.promiseAct.episodes]) {
  if (ids.has(e.id)) throw new Error(`중복 화 id: ${e.id}`)
  ids.add(e.id)
}

const out = [
  `// 생성 파일 — 손으로 고치지 않는다. 본문(act01~10.ts·promise.ts)을 고친 뒤 \`npm run gen:story-toc\`.`,
  `// 지도·완주 벽화·에피소드 히어로가 쓰는 목차만 담아, 본문 120KB 가 지도 청크에 실리지 않게 한다.`,
  `import type { StoryActToc } from '../storyTypes'`,
  ``,
  ...ACT_FILES.map((f, i) => actBlock(`${f}Toc`, acts[i]) + '\n'),
  actBlock('promiseToc', mod.promiseAct),
  ``,
  `export const STORY_TOC: StoryActToc[] = [${ACT_FILES.map((f) => `${f}Toc`).join(', ')}]`,
  ``,
]
const text = out.join('\n')
const prev = await readFile(outFile, 'utf8').catch(() => null)
await writeFile(outFile, text)
console.log(`${prev === text ? '변경 없음' : '갱신'}: ${path.relative(process.cwd(), outFile)} (${acts.length}막 ${acts.reduce((n, a) => n + a.episodes.length, 0)}화 + 특별편 ${mod.promiseAct.episodes.length}편)`)
