// dev 전용 — 서브셋에 없는 Material Icons 이름을 화면에서 잡아낸다.
//
// 아이콘 폰트를 실제로 쓰는 글리프만 남긴 서브셋으로 서빙하므로(scripts/gen-material-icons.py),
// 새 아이콘을 쓰고 `npm run gen:material-icons` 를 잊으면 아이콘 자리에 리가처 원문
// ("new_icon_name")이 글자로 보인다. 프로덕션에서 발견되기 전에 콘솔로 알린다.
// import.meta.env.DEV 분기 안에서만 불려 프로덕션 번들에는 들어가지 않는다.

let known: Set<string> | null = null
const warned = new Set<string>()

const scan = () => {
  if (!known) return
  const nodes = document.querySelectorAll<HTMLElement>('.material-icons-outlined, .material-icons-round')
  for (const el of nodes) {
    const name = el.textContent?.trim() ?? ''
    if (!name || known.has(name) || warned.has(name)) continue
    warned.add(name)
    console.warn(
      `[material-icons] "${name}" 은 서브셋에 없습니다 — 아이콘 대신 글자가 보입니다. ` +
        '`npm run gen:material-icons` 를 실행하세요.',
      el,
    )
  }
}

export const startMaterialIconsCheck = async (): Promise<void> => {
  const manifest = await import('../styles/material-icons.manifest.json')
  known = new Set(manifest.default.icons)
  scan()
  // 라우트 전환·모달 열림 등 뒤늦게 나타나는 아이콘도 잡되, 관찰 비용은 디바운스로 억제
  let timer: number | null = null
  const observer = new MutationObserver(() => {
    if (timer !== null) return
    timer = window.setTimeout(() => {
      timer = null
      scan()
    }, 500)
  })
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
}
