import { useDesktopRailVisible } from './useDesktopRailVisible'

// 레일 청크가 도착하기 전까지 깔아 두는 빈 틀 — 레일과 같은 자리·폭·바탕색.
// 전엔 fallback 이 null 이라 본문 왼쪽 여백(레일 자리)이 캔버스 색으로 비어 있다가
// 레일이 색째로 툭 나타났다. 틀을 먼저 깔면 도착하는 순간 메뉴 글자만 채워진다.
// ★ 클래스는 DesktopNavRail 의 <aside> 와 맞출 것(자리·폭·바탕).
const DesktopNavRailShell = () => {
  const visible = useDesktopRailVisible()
  if (!visible) return null
  return (
    <div
      className="hidden lg:block fixed left-0 top-14 bottom-0 z-40 w-[76px] xl:w-[248px] bg-[var(--desktop-chrome)]"
      aria-hidden
    />
  )
}

export default DesktopNavRailShell
