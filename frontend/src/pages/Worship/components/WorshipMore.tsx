// 오시기 어려우면 — 사진 카드 두 장(2026-11 개편).
//  - 지난 주일 설교: 그 주일 실제 예배 영상 첫 장면(유튜브 썸네일). 재생 버튼은 오른쪽 아래 — 매주 바뀌는 표지 글씨를 가리지 않게
//  - 온라인 예배: 불 켜진 밤 교회(히어로와 같은 계절). 방문자에겐 URL 이 있을 때만, 관리자에겐 등록 자리로 항상
// 오시는 길은 위 "길찾기" 버튼이 맡아 여기서 반복하지 않는다.
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAboutContent } from '../../../hooks/useAboutContent'
import { EditableText } from '../../../components/AboutEditor'
import { getSermons } from '../../../api/sermon'
import { sermonKeys } from '../../../hooks/queryKeys'
import { formatMonthDay } from '../../../utils/date'
import type { NaturalSeason } from '../../../utils/naturalSeason'
import { extractYouTubeVideoId, youtubeThumbnailUrl } from '../../Sermon/utils/sermonMeta'

interface Props {
  isAdminUser: boolean
  /** 본문이 판정한 "지금 예배 중" — 온라인 예배 카드의 LIVE 표시에만 쓴다 */
  ongoing: boolean
  season: NaturalSeason
}

const isHttp = (u: string) => /^https?:\/\//i.test(u)

export default function WorshipMore({ isAdminUser, ongoing, season }: Props) {
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
  const vid = sermon?.video_url ? extractYouTubeVideoId(sermon.video_url) : null
  const thumb = sermon?.thumbnail_url || (vid ? youtubeThumbnailUrl(vid) : null)

  const showOnline = hasLive || isAdminUser
  if (!sermon && !showOnline) return null

  return (
    <div className="worship-mo">
      {sermon && (
        <button type="button" className="worship-mo-card" onClick={() => navigate('/sermon')}>
          <div className="worship-mo-photo">
            {thumb ? (
              <img src={thumb} alt="" aria-hidden="true" loading="lazy" className="worship-mo-thumb" />
            ) : (
              <img src={`/images/visit/scene-${season}-day.webp`} alt="" aria-hidden="true" loading="lazy" className="worship-mo-church" />
            )}
            <span className="worship-mo-veil" aria-hidden="true" />
            {sermon.video_url && (
              <span className="worship-mo-play" aria-hidden="true">
                <span className="material-icons-round">play_arrow</span>
              </span>
            )}
            <span className="worship-mo-tag">
              {t('worshipSermonTag').replace('{date}', formatMonthDay(sermon.sermon_date, { lang: ko ? 'ko' : 'en' }) || sermon.sermon_date)}
            </span>
          </div>
          <div className="worship-mo-body">
            <p className="worship-mo-kicker">{t('worshipSermonKicker')}</p>
            <p className="worship-mo-title">{sermon.bible_verse || sermon.title}</p>
            <p className="worship-mo-sub">
              {sermon.bible_verse ? sermon.title : ''}
              {sermon.bible_verse && sermon.pastor ? ' · ' : ''}
              {sermon.pastor ?? ''}
            </p>
            <span className="worship-mo-cta">
              {sermon.video_url ? t('worshipRailSermonCta') : t('worshipRailSermonAll')}
              <span className="material-icons-round" aria-hidden="true">chevron_right</span>
            </span>
          </div>
        </button>
      )}

      {showOnline && (
        <div className={`worship-mo-card${ongoing && hasLive ? ' is-live' : ''}`}>
          <button
            type="button"
            className="worship-mo-hit"
            disabled={!hasLive}
            onClick={() => hasLive && window.open(liveUrl, '_blank', 'noopener,noreferrer')}
          >
            <div className="worship-mo-photo">
              <img src={`/images/visit/scene-${season}-night.webp`} alt="" aria-hidden="true" loading="lazy" className="worship-mo-church" />
              <span className="worship-mo-veil worship-mo-veil--night" aria-hidden="true" />
              <span className="worship-mo-tag">
                {ongoing && hasLive ? (
                  <>
                    <span className="worship-live-dot" aria-hidden />
                    {t('worshipRailLiveNow')}
                  </>
                ) : (
                  <>
                    <span className="material-icons-round worship-mo-yt" aria-hidden="true">smart_display</span>
                    {t('worshipOnlineTag')}
                  </>
                )}
              </span>
              <p className="worship-mo-photo-line whitespace-pre-line">{t('worshipOnlinePhoto')}</p>
            </div>
            <div className="worship-mo-body">
              <p className="worship-mo-kicker">{t('worshipRailLiveTitle')}</p>
              <p className="worship-mo-title">{t('worshipMoreLiveTitle')}</p>
              <p className="worship-mo-sub">{t('worshipOnlineDesc')}</p>
              {hasLive && (
                <span className="worship-mo-cta">
                  {ongoing ? t('worshipRailLiveCta') : t('worshipRailChannelCta')}
                  <span className="material-icons-round" aria-hidden="true">chevron_right</span>
                </span>
              )}
            </div>
          </button>
          {isAdminUser && (
            <p className="worship-more-admin">
              <EditableText fieldKey="worshipLiveUrl" isAdmin={isAdminUser}>
                {liveUrl || t('worshipRailAdminLive')}
              </EditableText>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
