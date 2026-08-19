import { createContext, useCallback, useContext, useMemo, useState, useEffect, type ReactNode } from 'react'
import { flushSync } from 'react-dom'

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
    return (saved as Theme) || 'dark'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    // Tailwind dark class + data-theme (toggleTheme가 이미 반영했어도 멱등)
    applyDomTheme(theme)

    // 상태바(theme-color)를 앱 테마에 맞춤 — index.html의 메타는 OS 설정
    // (prefers-color-scheme) 기준이라, OS 라이트+앱 다크 조합에서 상태바만
    // 흰색으로 어긋난다. 두 메타 모두 앱 테마 색으로 덮어쓴다.
    const themeColor = theme === 'dark' ? '#131313' : '#ffffff'
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.setAttribute('content', themeColor)
    })
  }, [theme])

  // 요소마다 제각각인 transition(0.1~0.45s)이 테마 색을 서로 다른 속도로
  // 갈아입으면서 "다다다" 물결치듯 바뀌는 체감이 생긴다. 전환 순간에는
  // 트랜지션을 전부 끄고(html.theme-switching, index.css) 한 프레임에 통째로
  // 바꾼 뒤, 지원 브라우저에선 View Transition 크로스페이드 하나로 감싼다.
  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const root = document.documentElement
    root.classList.add('theme-switching')
    const done = () => root.classList.remove('theme-switching')

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
