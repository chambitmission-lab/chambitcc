import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'

const Logo = () => {
  const location = useLocation()
  const { t } = useLanguage()

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

      {/* 서체를 지정하지 않는다 — 헤더 루트의 .chrome-type(G마켓 산스, lg+)을 상속받아
          우측 인라인 메뉴와 같은 획으로 읽힌다. 모바일은 지금처럼 Pretendard 로 떨어진다.
          자간: 전역 -0.02em / tracking-tighter(-0.05em) 는 한글 네 글자를 한 덩어리로
          붙여버려서 로고에서만 되돌린다.
          라이트 글자는 차콜 그레이 — 새까만 글자는 푸른 빛무리 위에서 딱딱해 보인다. */}
      <h1
        className="text-[1.34rem] font-bold select-none text-[#2b3542] dark:text-ink-strong relative z-10 whitespace-nowrap"
        style={{ letterSpacing: '-0.012em' }}
      >
        {t('churchName')}
      </h1>
    </Link>
  )
}

export default Logo
