// dev 전용 — 서브셋에 없는 글자가 PC 크롬(헤더·좌측 레일)·로그인/회원가입에 뜨는지 잡아낸다.
//
// G마켓 산스는 헤더·레일에 실제로 뜨는 글자만 남긴 서브셋으로 서빙한다
// (scripts/gen-gmarket-sans.py). 메뉴 문구를 바꾸고 `npm run gen:gmarket-sans` 를
// 잊으면 그 글자만 Pretendard 로 떨어져 한 단어 안에서 서체가 섞인다 — 눈으로는
// 알아채기 어려우므로 콘솔로 알린다.
// import.meta.env.DEV 분기 안에서만 불려 프로덕션 번들에는 들어가지 않는다.

let known: Set<string> | null = null
const warned = new Set<string>()

// 서체가 적용되는 폭(lg+)에서만 의미가 있다 — 모바일은 애초에 Pretendard 로 그린다
const LG = 1024

const scan = () => {
  if (!known) return
  // 로그인·회원가입(.auth-type)은 모바일에서도 G마켓 산스라 폭과 무관하게 검사한다
  const selector = window.innerWidth >= LG ? '.chrome-type, .auth-type' : '.auth-type'
  for (const root of document.querySelectorAll<HTMLElement>(selector)) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) {
      const parent = node.parentElement
      // 아이콘 폰트(리가처 원문)와 본문 폰트로 되돌린 자리는 대상이 아니다
      if (parent?.closest('[class*="material-icons"], .chrome-type-off, .auth-type-off, .auth-msg--error')) continue
      for (const ch of node.textContent ?? '') {
        if (ch.trim() === '' || known.has(ch) || warned.has(ch)) continue
        warned.add(ch)
        console.warn(
          `[gmarket-sans] "${ch}" 는 서브셋에 없습니다 — 이 글자만 Pretendard 로 보입니다. ` +
            '`npm run gen:gmarket-sans` 를 실행하세요.',
          parent,
        )
      }
    }
  }
}

export const startGmarketSansCheck = async (): Promise<void> => {
  const manifest = await import('../styles/gmarket-sans.manifest.json')
  known = new Set(manifest.default.chars)
  scan()
  // 드롭다운·라우트 전환으로 뒤늦게 나타나는 문구도 잡되, 관찰 비용은 디바운스로 억제
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
