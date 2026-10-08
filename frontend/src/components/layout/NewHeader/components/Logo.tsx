import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'

const LIGHT_CHAR = '빛'

/* "빛" 위 햇살 — 앱 아이콘 엠블럼의 햇살을 다섯 가닥으로 줄였다.
   금빛은 엠블럼에서 온 장식이라 --amber-icon(장식용 토큰)을 쓴다. */
const LightRays = () => (
  <svg
    aria-hidden
    viewBox="0 0 30 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    className="pointer-events-none absolute left-1/2 -top-[9px] h-[14px] w-[30px] -translate-x-1/2 text-[var(--amber-icon)]"
  >
    <path d="M15 1.2v4.2M7.2 4l2.2 3.4M22.8 4l-2.2 3.4M1.8 9.6l3.6 1.6M28.2 9.6l-3.6 1.6" />
  </svg>
)

const Logo = () => {
  const location = useLocation()
  const { t } = useLanguage()
  const name = t('churchName')
  // 영문 등 '빛'이 없는 언어는 장식 없이 이름만
  const lightIdx = name.indexOf(LIGHT_CHAR)

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  }

  /* shrink-0·nowrap — 아이콘 폰트 로드 전 우측 액션이 리가처 원문 텍스트 폭으로
     벌어져도 로고가 짓눌려 세로로 꺾이지 않게 한다 */
  return (
    <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 relative shrink-0">
      {/* 주변 빛 확산 — 브랜드 블루 (theme.css 토큰).
          사각 blur 박스가 아니라 타원 radial-gradient 인 이유: blur 박스는 다크에서
          글자 뒤에 밝은 판때기 모서리가 그대로 보인다. 맥동(animate-pulse)도 뺐다 —
          헤더는 늘 떠 있는 요소라 무한 애니메이션이 눈에 걸린다. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-4 -inset-y-3"
        style={{ background: 'radial-gradient(ellipse at center, var(--brand-glow) 0%, transparent 68%)' }}
      />

      {/* 워드마크 — "빛" 한 글자만 브랜드 블루, 그 위로 교회 엠블럼의 햇살 다섯 가닥.
          심볼 없이 이름의 뜻(요 8:12 세상의 빛)이 그림이 된다.
          서체는 G마켓 산스를 직접 지정 — 모바일에서도 같은 얼굴이어야 해서 .chrome-type(lg+)
          상속에 기대지 않는다. 서브셋에 "참빛교회" 글자가 들어 있다(Bold 한 벌만 받음).
          자간: 전역 -0.02em 은 한글 네 글자를 한 덩어리로 붙여서 로고에서만 되돌린다.
          라이트 글자는 차콜 그레이 — 새까만 글자는 푸른 빛무리 위에서 딱딱해 보인다. */}
      <h1
        className="flex text-[1.3rem] font-bold select-none text-[#2b3542] dark:text-ink-strong relative z-10 whitespace-nowrap pt-1"
        style={{ fontFamily: "'Gmarket Sans', 'Pretendard Variable', 'Pretendard', sans-serif", letterSpacing: '-0.005em' }}
      >
        {lightIdx >= 0 ? (
          <>
            {name.slice(0, lightIdx)}
            <span className="relative text-brand">
              <LightRays />
              {LIGHT_CHAR}
            </span>
            {name.slice(lightIdx + 1)}
          </>
        ) : (
          name
        )}
      </h1>
    </Link>
  )
}

export default Logo
