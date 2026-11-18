// 2.5 참비의 오늘 추천 (맞춤 말씀) — '한 단어 포스터'.
//
// 추천 근거인 감정 단어가 카드의 주인공이다: 색면 위에 큰 글자로 세우고, 말씀은 그 아래 명조로 놓는다.
// 근거가 없으면(감정 태그 없음) 단어 자리에 '오늘'이 선다.
// 말씀 카드 만들기는 별도 타일 대신 이 카드의 보조 액션으로 붙어, 지금 보는 절을 그대로 얹어 연다.

import { useNavigate } from 'react-router-dom'
import chambiAvatar from '../../../../components/chatbot/img/default.webp'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { preloadRoute } from '../../../../utils/routePreload'
import { ImageIcon } from '../EmotionIcons'
import { EMOTION_META, pick } from './shared'
import { goMakeCard, goReadPick, useTodayPick, verseRef } from './useTodayPick'
import './pickPoster.css'

const PersonalPickWidget = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { basis, category, verse, isLoading } = useTodayPick()

  if (!category) return null

  const meta = basis.emotion ? EMOTION_META[basis.emotion] : undefined
  const word = meta ? pick(language, meta.label, meta.labelEn) : t('homeRailPickWordDefault')
  const sub = !meta
    ? t('homeRailPickSubDefault')
    : basis.source === 'mine'
      ? t('homeRailPickSubMine')
      : t('homeRailPickSubWeek')

  return (
    <section className="pp px-4 pt-3">
      <div className="pp-card">
        <span className="pp-ghost" aria-hidden>
          {word}
        </span>
        <div className="pp-head">
          <img src={chambiAvatar} alt="" className="pp-ava" draggable={false} />
          <span>{t('homeRailPickTitle')}</span>
        </div>
        {/* 한글 3자까지는 큰 크기, 그보다 길면(영어 등) 한 단계 줄인다 */}
        <h3 className="pp-word" data-long={word.length > 4 ? '' : undefined}>
          {word}
        </h3>
        <p className="pp-sub">{sub}</p>

        <div className="pp-body">
          {isLoading || !verse ? (
            <div className="pp-skel animate-pulse" aria-hidden>
              <span style={{ width: '92%' }} />
              <span style={{ width: '74%' }} />
              <span style={{ width: '34%' }} />
            </div>
          ) : (
            <>
              <p className="pp-verse font-serif-kr line-clamp-4">{verse.text}</p>
              <p className="pp-ref">{verseRef(verse)}</p>
              {verse.message && <p className="pp-msg line-clamp-2">{verse.message}</p>}
            </>
          )}
        </div>

        <div className="pp-acts">
          <button
            type="button"
            onClick={() => verse && goReadPick(navigate, verse)}
            disabled={!verse}
            className="pp-btn pp-btn--pri"
          >
            {t('homeRailPickRead')}
          </button>
          <button
            type="button"
            onClick={() => goMakeCard(navigate, verse)}
            onPointerEnter={() => void preloadRoute('/bible/photo-verse')}
            onPointerDown={() => void preloadRoute('/bible/photo-verse')}
            disabled={!verse}
            aria-label={t('homeRailPickCardAria')}
            title={t('homeRailPickCardAria')}
            className="pp-btn pp-btn--sec"
          >
            <ImageIcon size={15} />
            {t('homeRailPickCard')}
          </button>
        </div>
      </div>
    </section>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { PersonalPickWidget }
