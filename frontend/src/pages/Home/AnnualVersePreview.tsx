// /dev/annual-verse — 홈 "올해의 말씀" 명판 카드를 로그인·서버 없이 라이트/다크 나란히 본다.
// [data-theme] 은 조상 어디에 있어도 먹으므로 한 화면에서 두 테마를 동시에 세울 수 있다.
import { useEffect } from 'react'
import AnnualThemeVerse from './components/AnnualThemeVerse'
import { ensureDeferredFontsNow } from '../../utils/deferredFonts'
import './AnnualVersePreview.css'

const MOCK = {
  verse_text: '너희 마른 뼈들아, 이제 살아나리라!',
  verse_reference: '에스겔 37장 5,10절',
}

const AnnualVersePreview = () => {
  useEffect(() => {
    ensureDeferredFontsNow()
  }, [])

  return (
    <div className="avp">
      <div className="avp__shell">
        <h1 className="avp__title">올해의 말씀 — 금박 명판</h1>
        <p className="avp__sub">라벨 줄을 누르면 접힌다(접힘 상태는 기기에 기억). 두 카드는 각각 접어 볼 수 있다.</p>

        <div className="avp__stage">
          <span className="avp__tag">라이트</span>
          <AnnualThemeVerse preview={MOCK} />
        </div>

        <div className="avp__stage avp__stage--dark" data-theme="dark">
          <span className="avp__tag">다크</span>
          <AnnualThemeVerse preview={MOCK} />
        </div>
      </div>
    </div>
  )
}

export default AnnualVersePreview
