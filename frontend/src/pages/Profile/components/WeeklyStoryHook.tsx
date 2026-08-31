import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useGrowthRecentDays } from '../../../hooks/useGrowth'
import { buildWeekCells, weekNarrative, WEEKDAY_KO, WEEKDAY_EN } from './growthFootprints'
import { DomainGlyph } from '../../../components/icons/GrowthIcons'
import './WeeklyStoryHook.css'

interface WeeklyStoryHookProps {
  /** 요약 데이터가 오기 전 헤드라인 폴백용 */
  thisWeekCount: number
}

/**
 * 프로필 → 주간 스토리(/weekly-story) 진입 카드.
 *
 * 인스타그램 스토리 트레이를 벤치마크했다. 예전엔 "이번 주 N번 기도했어요"
 * 한 줄이었는데, 바로 위 활동 통계 카드가 같은 숫자를 이미 크게 보여주고 있어
 * 세 번째 반복이었다. 대신 요일 7칸 트레이로 "어떤 리듬의 한 주였는지"를
 * 보여주고, 헤드라인은 활동 종류에 따라 문장이 바뀌게 했다.
 */
const WeeklyStoryHook = ({ thisWeekCount }: WeeklyStoryHookProps) => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const hasToken = !!localStorage.getItem('access_token')
  const { data: recent } = useGrowthRecentDays(14, hasToken)

  const loaded = !!recent?.data
  const cells = buildWeekCells(recent?.data?.events)
  const activeDays = cells.filter(c => c.count > 0).length
  const weekdays = language === 'en' ? WEEKDAY_EN : WEEKDAY_KO

  const headline = !loaded
    ? thisWeekCount > 0
      ? (language === 'en'
          ? `You prayed ${thisWeekCount} time${thisWeekCount > 1 ? 's' : ''} this week`
          : `이번 주 ${thisWeekCount}번 기도했어요`)
      : t('storyHookEmpty')
    : activeDays > 0
      ? weekNarrative(cells, language)
      : t('storyHookEmpty')

  return (
    <div className="px-4 py-3">
      <button
        type="button"
        onClick={() => navigate('/weekly-story')}
        className="
          group relative w-full overflow-hidden text-left
          rounded-2xl px-5 py-4
          bg-gradient-to-br from-[#1b6ef3] via-[#3182f6] to-[#5ba3ff]
          shadow-[0_4px_16px_rgba(0,0,0,0.10),0_8px_24px_var(--brand-glow)]
          dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),0_12px_28px_var(--brand-glow),inset_0_1px_0_rgba(255,255,255,0.10)]
          transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl
          active:scale-[0.99]
        "
      >
        {/* 글로우 장식 — 예전의 ✨ 이모지 2개와 하이라이트 스윕은 걷어냈다.
            트레이가 들어오면서 장식이 4겹이 되어 정작 내용이 안 읽혔다. */}
        <div
          className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-sky-300/25 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-8 w-28 h-28 rounded-full bg-blue-300/25 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              STORY
            </span>
            <span className="text-[11px] font-semibold text-white/80">
              {t('storyHookLabel')}
            </span>
          </div>

          <div className="text-[17px] font-bold text-white leading-snug tracking-[-0.015em]">
            {headline}
          </div>

          {/* 요일 트레이 — 활동한 날은 그라데이션 링 + 그날의 대표 아이콘,
              비어 있는 날은 점선 링. 오늘 칸은 한 단계 크고 밝다.
              대표 마크는 백엔드가 주는 이모지 대신 그날의 대표 도메인(기도·말씀·
              묵상 …)을 duotone 아이콘으로 그린다 — 파란 카드 위에서 컬러 이모지는
              채도가 부딪히고 기기마다 모양이 달랐다. */}
          <div className="mt-3.5 flex items-start justify-between gap-1">
            {cells.map((cell, i) => (
              <span
                key={cell.date}
                className="wsh-day"
                data-active={cell.count > 0}
                data-today={cell.isToday}
                data-future={cell.isFuture}
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <span className="wsh-ring" aria-hidden="true">
                  <span className="wsh-ring__inner">
                    {cell.count > 0 &&
                      (cell.domains.length ? (
                        <DomainGlyph domain={cell.domains[0]} size={18} />
                      ) : (
                        '·'
                      ))}
                  </span>
                </span>
                <span className="wsh-day__label">
                  {cell.isToday
                    ? (language === 'en' ? 'Today' : '오늘')
                    : weekdays[cell.weekday]}
                </span>
              </span>
            ))}
          </div>

          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-brand shadow-md transition-transform group-hover:scale-[1.03] group-active:scale-95">
            <span className="material-icons-round text-[15px]">
              play_arrow
            </span>
            {t('storyHookCta')}
          </span>
        </div>
      </button>
    </div>
  )
}

export default WeeklyStoryHook
