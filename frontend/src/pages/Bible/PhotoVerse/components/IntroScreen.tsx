import type { ReactNode } from 'react'
import type { Language } from '../../../../locales'
import { IntroSamples } from './IntroSamples'
import type { CardPreset } from '../cardPresets'
import type { VerseBackground } from '../photoVerseCanvas'
import type { PickedVerse } from '../recommendedVerses'
import { OCCASIONS } from '../occasions'
import type { CardOccasion } from '../occasions'
import { passageLabel } from '../churchVerses'
import type { SermonPassage } from '../churchVerses'
import type { PhotoVerseDraft } from '../draft'
import type { PhotoVerseTexts } from '../texts'

interface IntroScreenProps {
  t: PhotoVerseTexts
  language: Language
  lang: 'ko' | 'en'
  /** 예시 카드에 그릴 말씀 — 고른 말씀이 없으면 오늘의 말씀 */
  sampleVerse: PickedVerse
  fontsReady: number
  /** 이어서 만들기 제안 — 지난번 말씀과 스타일이 남아 있을 때만 */
  resumeOffer: (PhotoVerseDraft & { verse: PickedVerse }) | null
  sermon: SermonPassage | null
  themeText: string
  themeRef: string
  /** 감성 배경 선택 줄 — 편집 화면과 같은 요소를 공유한다 */
  bgStrip: ReactNode
  onPickPhoto: () => void
  onResume: () => void
  onDismissResume: () => void
  onStartOccasion: (o: CardOccasion) => void
  onStartChurchVerse: (v?: PickedVerse) => void
  onStartSample: (bg: VerseBackground, preset: CardPreset) => void
}

/** 사진 선택 전 인트로 — 사진 고르기·이어서 만들기·상황별·우리 교회 말씀·예시 카드·감성 배경 */
const IntroScreen = ({
  t,
  language,
  lang,
  sampleVerse,
  fontsReady,
  resumeOffer,
  sermon,
  themeText,
  themeRef,
  bgStrip,
  onPickPhoto,
  onResume,
  onDismissResume,
  onStartOccasion,
  onStartChurchVerse,
  onStartSample,
}: IntroScreenProps) => (
  <div className="pv-intro">
    {/* 인트로 그림 — 누르는 자리가 아니라서 버튼처럼 보이는 아이콘 타일 대신,
        이 화면에서 만들게 될 말씀 카드 세 장이 부채처럼 겹친 미니 그림 (intro.css) */}
    <div className="pv-intro__fan" aria-hidden="true">
      <span className="pv-intro__card pv-intro__card--back" />
      <span className="pv-intro__card pv-intro__card--mid" />
      <span className="pv-intro__card pv-intro__card--front">
        <i />
        <i />
        <i />
      </span>
    </div>
    <h2 className="pv-intro__headline">
      {t.introHeadline.split('\n').map((line) => (
        <span key={line}>
          {line}
          <br />
        </span>
      ))}
    </h2>
    <p className="pv-intro__body">{t.introBody}</p>
    <button type="button" className="pv-intro__cta" onClick={onPickPhoto}>
      <span className="material-icons-round">add_photo_alternate</span>
      {/* 글자를 span 으로 감싼다 — 맨 텍스트 노드는 광택·빛줄(절대 위치 가상 요소) 아래에 깔린다 */}
      <span>{t.pickPhoto}</span>
    </button>

    {/* 이어서 만들기 — 지난번 말씀과 스타일이 남아 있을 때만 */}
    {resumeOffer && (
      <div className="pv-resume">
        <button type="button" className="pv-resume__main" onClick={onResume}>
          <span className="material-icons-round pv-resume__icon">history</span>
          <span className="pv-resume__text">
            <span className="pv-resume__title">{t.resumeTitle}</span>
            <span className="pv-resume__ref">{resumeOffer.verse.refLabel}</span>
          </span>
          <span className="material-icons-round pv-resume__chevron">chevron_right</span>
        </button>
        <button type="button" className="pv-resume__dismiss" onClick={onDismissResume}>
          {t.resumeDismiss}
        </button>
      </div>
    )}

    {/* 상황별 카드 — 카드를 만드는 이유는 대개 누군가에게 마음을 보내는 것이다 */}
    <div className="pv-intro__occasions">
      <p className="pv-intro__bg-title">{t.occasionTitle}</p>
      <p className="pv-intro__bg-body">{t.occasionBody}</p>
      <div className="pv-occasions">
        {OCCASIONS.map((o) => (
          <button key={o.id} type="button" className="pv-occasion" onClick={() => onStartOccasion(o)}>
            <span className="material-icons-round pv-occasion__icon" aria-hidden="true">{o.icon}</span>
            <span className="pv-occasion__name">{language === 'ko' ? o.nameKo : o.nameEn}</span>
          </button>
        ))}
      </div>
    </div>

    {/* 우리 교회 말씀 — 이번 주 설교 본문과 올해의 말씀. 온 교회가 같은 말씀으로 카드를 만든다 */}
    {(sermon || themeText) && (
      <div className="pv-intro__church">
        <p className="pv-intro__bg-title">{t.churchTitle}</p>
        <p className="pv-intro__bg-body">{t.churchBody}</p>
        {sermon && (
          <button type="button" className="pv-today pv-today--theme" onClick={() => onStartChurchVerse()}>
            <span className="pv-today__badge">
              <span className="material-icons-round text-[13px]">church</span>
              {sermon.badge ?? (lang === 'en' ? 'Sermon passage' : '설교 본문')}
            </span>
            {sermon.title && <span className="pv-today__text">「{sermon.title}」</span>}
            <span className="pv-today__ref">
              {/* 화살표는 카드 오른쪽 유리 단추(intro.css ::after)가 맡는다 */}
              {passageLabel(sermon.ref)} · {t.sermonPick}
            </span>
          </button>
        )}
        {themeText && (
          <button
            type="button"
            className="pv-today pv-today--theme"
            onClick={() => onStartChurchVerse({ text: themeText, refLabel: themeRef || t.themeBadge })}
          >
            <span className="pv-today__badge">
              <span className="material-icons-round text-[13px]">workspace_premium</span>
              {t.themeBadge}
            </span>
            <span className="pv-today__text">{themeText}</span>
            {themeRef && <span className="pv-today__ref">{themeRef}</span>}
          </button>
        )}
      </div>
    )}

    {/* 예시 카드 — 만들어 보기 전에는 재미를 알 수 없으니 결과물을 먼저 보여준다 */}
    <div className="pv-intro__samples">
      <p className="pv-intro__bg-title">{t.samplesTitle}</p>
      <p className="pv-intro__bg-body">{t.samplesBody}</p>
      <IntroSamples verse={sampleVerse} lang={lang} fontsReady={fontsReady} onPick={onStartSample} />
    </div>

    <div className="pv-intro__bg">
      <p className="pv-intro__bg-title">{t.noPhotoTitle}</p>
      <p className="pv-intro__bg-body">{t.noPhotoBody}</p>
      {bgStrip}
    </div>
    <p className="pv-intro__privacy">
      <span className="material-icons-round text-[14px]">lock</span>
      {t.privacy}
    </p>
  </div>
)

export default IntroScreen
