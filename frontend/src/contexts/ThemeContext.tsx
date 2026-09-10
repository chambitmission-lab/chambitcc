import { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { isOppositeThemeWarm, warmOppositeTheme } from '../utils/themeAssets'

// 토글 직전 반대 테마 배경 이미지를 기다리는 최대 시간. 캐시에 있으면 0ms 로 지나가고,
// 없어도 이 안에 도착한 파일은 크로스페이드에 함께 실린다 — 그 뒤는 기다리지 않고 전환한다
// (그라데이션만 남았다가 이미지가 뒤따르는 기존 동작). 사람이 "눌렀는데 반응이 없다"고
// 느끼기 전(≈200ms)에 끝나야 한다.
const TOGGLE_ART_WAIT_MS = 150

type Theme = 'light' | 'dark'

// View Transitions API — 아직 TS DOM lib에 없는 환경 대비 선택적 타입
type DocumentWithVT = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> }
}

/** 테마 클래스/속성을 DOM에 직접 반영 — 전환 애니메이션 프레임 안에서 동기 실행돼야 한다 */
const applyDomTheme = (t: Theme) => {
  document.documentElement.setAttribute('data-theme', t)
  document.documentElement.classList.toggle('dark', t === 'dark')
}

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as Theme) || 'light'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    // Tailwind dark class + data-theme (toggleTheme가 이미 반영했어도 멱등)
    applyDomTheme(theme)

    // 상태바(theme-color)를 앱 테마에 맞춤 — index.html의 메타는 OS 설정
    // (prefers-color-scheme) 기준이라, OS 라이트+앱 다크 조합에서 상태바만
    // 흰색으로 어긋난다. 두 메타 모두 앱 테마 색으로 덮어쓴다.
    // 라이트 값은 앱 캔버스(#f1f3f6) — index.html 크리티컬 블록·tailwind background-light 와 동기
    const themeColor = theme === 'dark' ? '#131313' : '#f1f3f6'
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.setAttribute('content', themeColor)
    })
  }, [theme])

  // 요소마다 제각각인 transition(0.1~0.45s)이 테마 색을 서로 다른 속도로
  // 갈아입으면서 "다다다" 물결치듯 바뀌는 체감이 생긴다. 전환 순간에는
  // 트랜지션을 전부 끄고(html.theme-switching, index.css) 한 프레임에 통째로
  // 바꾼 뒤, 지원 브라우저에선 View Transition 크로스페이드 하나로 감싼다.
  //
  // 테마별 배경 이미지(히어로·카드 삽화)는 반대 테마 파일이 아직 없으면 전환 뒤에 한 박자
  // 늦게 뜬다 — 전환 직전에 지금 화면의 반대 테마 파일을 높은 우선순위로 요청하고 아주 짧게
  // 기다렸다가 바꾼다(themeAssets.ts). 이미 받아 둔 경우(유휴 선요청·hover 선요청·두 번째
  // 토글)는 기다림 없이 바로 전환한다.
  const switching = useRef(false)
  const toggleTheme = useCallback(() => {
    if (switching.current) return
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const root = document.documentElement

    const run = () => {
      root.classList.add('theme-switching')
      const done = () => {
        root.classList.remove('theme-switching')
        switching.current = false
      }

      const flip = () => {
        applyDomTheme(next)
        // React 트리(인라인 스타일·조건부 클래스로 theme를 읽는 컴포넌트)도
        // 같은 프레임에 함께 바뀌어야 스냅샷/화면이 반쪽으로 갈라지지 않는다
        flushSync(() => setTheme(next))
      }

      const doc = document as DocumentWithVT
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (typeof doc.startViewTransition === 'function' && !reduceMotion) {
        doc.startViewTransition(flip).finished.finally(done)
      } else {
        flip()
        // 새 색이 그려진 다음 프레임에 트랜지션 복원 (한 프레임 스냅 전환)
        requestAnimationFrame(() => requestAnimationFrame(done))
      }
    }

    if (isOppositeThemeWarm()) {
      run()
      return
    }
    switching.current = true
    const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, TOGGLE_ART_WAIT_MS))
    void Promise.race([warmOppositeTheme('high'), timeout]).then(run)
  }, [theme])

  // value 객체를 theme 변경 시에만 재생성 — 소비자 불필요 재렌더 방지
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
