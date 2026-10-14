// '더 알아보기' — 지난 주일 설교 · 온라인 예배 · 처음 오시나요(오시는 길).
// 예전 PC 우측 레일(WorshipRail)을 본문 아래 한 줄로 내렸다. 모바일은 세로로 쌓이고
// lg+ 에선 3칸. 시간표는 위 히어로·평일 카드가 맡으므로 여기선 반복하지 않는다.
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAboutContent } from '../../../hooks/useAboutContent'
import { EditableText } from '../../../components/AboutEditor'
import { getSermons } from '../../../api/sermon'
import { sermonKeys } from '../../../hooks/queryKeys'

interface Props {
  isAdminUser: boolean
  /** 본문이 판정한 "지금 예배 중" — 온라인 예배 카드의 LIVE 표시에만 쓴다 */
  ongoing: boolean
}

const fmtDate = (iso: string, ko: boolean) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return ko
    ? `${d.getMonth() + 1}월 ${d.getDate()}일`
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const isHttp = (u: string) => /^https?:\/\//i.test(u)

export default function WorshipMore({ isAdminUser, ongoing }: Props) {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { tx } = useAboutContent()
  const ko = language === 'ko'

  const liveUrl = tx('worshipLiveUrl').trim()
  const hasLive = isHttp(liveUrl)

  // 지난 주일 설교 — 같은 날 3부·4부가 함께 올라오는데 최신순 첫 건은 4부일 수 있어서,
  // 3부(메인 예배) → 주일 → 최신 순으로 폴백한다.
  const { data: sermons } = useQuery({
    queryKey: sermonKeys.list(0, 8, false),
    queryFn: () => getSermons(0, 8, false),
    staleTime: 1000 * 60 * 5,
  })
  const sermon =
    sermons?.find((x) => /3\s*부/.test(x.title)) ??
    sermons?.find((x) => /주일|성수/.test(x.title)) ??
    sermons?.[0]

  return (
    <div className="worship-more">
      {sermon && (
        <section className="worship-more-card">
          <p className="worship-more-eyebrow">
            {t('worshipRailSermonTitle')} · {fmtDate(sermon.sermon_date, ko)}
          </p>
          <p className="worship-more-title">{sermon.bible_verse || sermon.title}</p>
          <p className="worship-more-sub worship-more-sub--brand">
            {sermon.bible_verse ? sermon.title : ''}
            {sermon.bible_verse && sermon.pastor ? ' · ' : ''}
            {sermon.pastor ?? ''}
          </p>
          <button type="button" className="worship-more-cta" onClick={() => navigate('/sermon')}>
            {sermon.video_url ? t('worshipRailSermonCta') : t('worshipRailSermonAll')}
          </button>
        </section>
      )}

      {/* 온라인 예배 — 방문자에겐 URL 이 있을 때만, 관리자에겐 등록 자리로 항상 */}
      {(hasLive || isAdminUser) && (
        <section className={`worship-more-card${ongoing && hasLive ? ' is-live' : ''}`}>
          <p className="worship-more-eyebrow">
            {ongoing && hasLive && <span className="worship-live-dot" aria-hidden />}
            {ongoing && hasLive ? t('worshipRailLiveNow') : t('worshipRailLiveTitle')}
          </p>
          <p className="worship-more-title">{t('worshipMoreLiveTitle')}</p>
          <p className="worship-more-sub">{t('worshipRailLiveDesc')}</p>
          {hasLive && (
            <button
              type="button"
              className="worship-more-cta"
              onClick={() => window.open(liveUrl, '_blank', 'noopener,noreferrer')}
            >
              {ongoing ? t('worshipRailLiveCta') : t('worshipRailChannelCta')}
            </button>
          )}
          {isAdminUser && (
            <p className="worship-more-admin">
              <EditableText fieldKey="worshipLiveUrl" isAdmin={isAdminUser}>
                {liveUrl || t('worshipRailAdminLive')}
              </EditableText>
            </p>
          )}
        </section>
      )}

      <section className="worship-more-card">
        <p className="worship-more-eyebrow">{t('worshipRailVisitTitle')}</p>
        <p className="worship-more-title">{t('worshipMoreVisitTitle')}</p>
        <p className="worship-more-sub">{t('worshipRailVisitDesc')}</p>
        <button type="button" className="worship-more-cta" onClick={() => navigate('/visit')}>
          {t('worshipRailVisitCta')}
        </button>
      </section>
    </div>
  )
}
