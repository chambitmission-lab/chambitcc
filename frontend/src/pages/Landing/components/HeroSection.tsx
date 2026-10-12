import { useNavigate } from 'react-router-dom'
import { EditableText } from '../../../components/AboutEditor'
import { useAboutContent } from '../../../hooks/useAboutContent'
import { useLandingStats } from '../../../hooks/useLandingStats'
import { ensureFontFamily } from '../../../utils/deferredFonts'
import { MapPinIcon } from '../../About/icons'
import { fmtNum } from './landingUtils'

// 히어로: 예배당 사진 한 장 + 한 문장. 정보(통계·안내 카드)를 나열하지 않고
// "처음이어도 괜찮다"는 약속 하나만 크게 — 바로 아래 '주일 아침' 타임라인이 그 약속을 증명한다.
// 카피는 about_content.fields 에 저장돼 관리자가 화면에서 바로 고친다.
//
// 모바일: 화면 끝까지 까는 풀블리드. PC(lg+): 사진 원본이 1270px 이라 2000px 로 늘리면 뭉개지므로
// 1240px 라운드 무대 안에 가둔다(원본 폭과 거의 같아 확대되지 않는다).

void ensureFontFamily('gowunBatang')

const HeroSection = ({ isAdmin, ko, onStory }: { isAdmin: boolean; ko: boolean; onStory: () => void }) => {
  const navigate = useNavigate()
  const { tx, heroBackgroundUrl } = useAboutContent()
  const { data: stats } = useLandingStats()

  const titleLines = tx('landingCineTitle').split('\n')

  // 살아있는 숫자는 큰 스트립 대신 사진 하단의 조용한 한 줄로 — 첫인상의 주연은 문장이다
  const pulse = stats
    ? [
        stats.verses_read_year > 0 && (ko ? `올해 함께 읽은 말씀 ${fmtNum(stats.verses_read_year, ko)}절` : `${fmtNum(stats.verses_read_year, ko)} verses read together this year`),
        stats.prayed_together > 0 && (ko ? `서로를 위한 기도 ${fmtNum(stats.prayed_together, ko)}번` : `${fmtNum(stats.prayed_together, ko)} prayers for one another`),
      ].filter(Boolean)
    : []

  return (
    <section className="ld-cine-wrap">
      <div className="ld-cine">
        {heroBackgroundUrl ? (
          <img
            src={heroBackgroundUrl}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
            crossOrigin="anonymous"
            className="ld-cine-photo"
          />
        ) : (
          <div className="ld-cine-photo ld-cine-photo--empty" />
        )}
        <div className="ld-cine-scrim" aria-hidden="true" />

        <div className="ld-cine-copy">
          <p className="text-[13px] lg:text-[14px] font-semibold tracking-[0.02em] text-white/85">
            <EditableText fieldKey="landingCineKicker" isAdmin={isAdmin}>
              <span>{tx('landingCineKicker')}</span>
            </EditableText>
          </p>

          <h1 className="ld-cine-title mt-4 lg:mt-5">
            <EditableText fieldKey="landingCineTitle" isAdmin={isAdmin} multiline>
              <span>
                {titleLines.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < titleLines.length - 1 && <br />}
                  </span>
                ))}
              </span>
            </EditableText>
          </h1>

          <p className="mt-5 lg:mt-6 max-w-[520px] text-[15.5px] lg:text-[18px] leading-[1.7] text-white/90 whitespace-pre-line">
            <EditableText fieldKey="landingCineSub" isAdmin={isAdmin} multiline>
              <span>{tx('landingCineSub')}</span>
            </EditableText>
          </p>

          <div className="mt-7 lg:mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button
              type="button"
              onClick={() => navigate('/visit')}
              className="brand-gradient inline-flex items-center gap-1.5 px-6 py-3.5 lg:px-7 lg:py-4 rounded-2xl text-[15px] lg:text-[16px] font-bold text-white shadow-[0_10px_28px_-8px_rgba(49,130,246,0.65)] active:scale-[0.97] transition-transform duration-150"
            >
              <MapPinIcon size={17} />
              {tx('landingCtaVisit')}
            </button>
            <button type="button" onClick={onStory} className="ld-cine-hint">
              <i aria-hidden="true" />
              {tx('landingCineHint')}
            </button>
          </div>

          {pulse.length > 0 && (
            <p className="mt-8 lg:mt-10 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] lg:text-[13px] font-medium text-white/60">
              {pulse.map((s) => (
                <span key={s as string} className="inline-flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-white/50" aria-hidden="true" />
                  {s}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
