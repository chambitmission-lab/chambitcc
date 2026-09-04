import { Info, MapPin } from '../../../components/icons/phosphor'
/* /worship PC 우측 레일 — 본문과 겹치지 않는 것만 놓는다.
   '다음 예배'와 시간표는 본문 히어로·카드가 이미 맡고 있어 여기서 반복하지 않는다(★중복 제거).
   1) 온라인 예배 — 예배 중이면 LIVE 상태, 유튜브 생중계/채널 버튼(어드민 편집 URL)
   2) 이번 주 설교 — 최신 설교(제목·설교자·본문·날짜), 기존 캐시 키 재사용
   3) 처음 오시나요 — /visit CTA
   4) 위치·안내 노트 */
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAboutContent } from '../../../hooks/useAboutContent'
import { EditableText } from '../../../components/AboutEditor'
import { getSermons } from '../../../api/sermon'
import { BookOpenIcon, ChevronRightIcon, MapPinIcon, PlayCircleIcon } from '../../About/icons'

interface Props {
  isAdminUser: boolean
  /** 본문이 판정한 "지금 예배 중" — LIVE 뱃지 상태에만 쓴다 */
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

export default function WorshipRail({ isAdminUser, ongoing }: Props) {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { tx } = useAboutContent()
  const ko = language === 'ko'

  const liveUrl = tx('worshipLiveUrl').trim()
  const hasLive = isHttp(liveUrl)

  // 지난 주일 설교 — 최근 몇 건 중 "3부"(메인 예배) 설교를 우선 고른다.
  // 같은 날 3부·4부가 함께 올라오는데 최신순 첫 건은 4부일 수 있어서, 3부 → 주일 → 최신 순으로 폴백.
  const { data: sermons } = useQuery({
    queryKey: ['sermons', 0, 8, 'light'],
    queryFn: () => getSermons(0, 8, false),
    staleTime: 1000 * 60 * 5,
  })
  const sermon =
    sermons?.find((x) => /3\s*부/.test(x.title)) ??
    sermons?.find((x) => /주일|성수/.test(x.title)) ??
    sermons?.[0]

  const openLive = () => {
    if (hasLive) window.open(liveUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      {/* 온라인 예배 — 방문자에겐 URL 이 있을 때만, 관리자에겐 등록 자리로 항상 */}
      {(hasLive || isAdminUser) && (
        <section className={`worship-rail-card worship-rail-live${ongoing && hasLive ? ' is-live' : ''}`}>
          <p className="worship-rail-title">
            {ongoing && hasLive ? (
              <>
                <span className="worship-live-dot" aria-hidden />
                {t('worshipRailLiveNow')}
              </>
            ) : (
              t('worshipRailLiveTitle')
            )}
          </p>
          <p className="worship-rail-lead">{t('worshipRailLiveDesc')}</p>
          {hasLive && (
            <button type="button" className="worship-rail-cta worship-rail-cta--primary" onClick={openLive}>
              <PlayCircleIcon size={18} />
              <span>{ongoing ? t('worshipRailLiveCta') : t('worshipRailChannelCta')}</span>
            </button>
          )}
          {isAdminUser && (
            <p className="worship-rail-admin">
              <EditableText fieldKey="worshipLiveUrl" isAdmin={isAdminUser}>
                {liveUrl || t('worshipRailAdminLive')}
              </EditableText>
            </p>
          )}
        </section>
      )}

      {/* 이번 주 설교 */}
      {sermon && (
        <section className="worship-rail-card">
          <p className="worship-rail-title">
            <BookOpenIcon size={14} />
            {t('worshipRailSermonTitle')}
          </p>
          <button type="button" className="worship-rail-sermon" onClick={() => navigate('/sermon')}>
            <span className="worship-rail-sermon-meta">
              {fmtDate(sermon.sermon_date, ko)}
              {sermon.pastor ? ` · ${sermon.pastor}` : ''}
            </span>
            <span className="worship-rail-sermon-title">{sermon.title}</span>
            {sermon.bible_verse && (
              <span className="worship-rail-sermon-verse">{sermon.bible_verse}</span>
            )}
          </button>
          <div className="worship-rail-actions">
            <button type="button" className="worship-rail-cta" onClick={() => navigate('/sermon')}>
              <span>{sermon.video_url ? t('worshipRailSermonCta') : t('worshipRailSermonAll')}</span>
              <ChevronRightIcon size={14} />
            </button>
          </div>
        </section>
      )}

      {/* 처음 오시나요 — 본문의 '다음 예배'를 본 사람의 다음 걸음 */}
      <section className="worship-rail-card worship-rail-visit">
        <p className="worship-rail-title">{t('worshipRailVisitTitle')}</p>
        <p className="worship-rail-lead">{t('worshipRailVisitDesc')}</p>
        <button type="button" className="worship-rail-cta" onClick={() => navigate('/visit')}>
          <MapPinIcon size={16} />
          <span>{t('worshipRailVisitCta')}</span>
          <ChevronRightIcon size={14} />
        </button>
      </section>

      <div className="worship-note">
        <p className="worship-note-line">
          <span className="worship-note-key"><MapPin size={14} weight="duotone" aria-hidden="true" /> {t('worshipLocationNote')}</span> {t('worshipLocationText')}
        </p>
        <p className="worship-note-line">
          <span className="worship-note-key"><Info size={14} weight="duotone" aria-hidden="true" /> {t('worshipInfoNote')}</span> {t('worshipInfoText')}
        </p>
      </div>
    </>
  )
}
