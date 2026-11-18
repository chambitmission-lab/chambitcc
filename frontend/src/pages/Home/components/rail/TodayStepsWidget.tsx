// 3. 오늘의 한 걸음 (말씀 읽기 · 기도 · 말씀 카드) — 숫자 타일 3칸 + 말씀 알림 안내 한 줄.
//
// 늘 같은 광고 타일 2칸을 대신한다 — 마친 걸음은 추천 포스터와 같은 색면으로 채워지고, 남은 걸음은 윤곽 숫자로 남는다.
// 기도는 서버 값(내 최근 기도가 오늘인지), 읽기·카드는 이 기기에서 누른 기록(todaySteps)으로 판정한다.
// 알림 안내는 알림이 하나도 없는 사람에게만 보이고, 닫으면 다시 나오지 않는다.

import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useVerseAlarms } from '../../../../hooks/useVerseAlarms'
import { kstDateKey } from '../../../../utils/date'
import { preloadRoute } from '../../../../utils/routePreload'
import { AlarmIcon } from './railIcons'
import { dismissAlarmNudge, useTodaySteps } from './todaySteps'
import { goMakeCard, goReadPick, useMyLatestPrayer, useTodayPick } from './useTodayPick'
import './pickPoster.css'

interface Step {
  key: string
  /** 타일에 보이는 짧은 이름 */
  label: string
  /** 아직 안 했을 때 타일 아랫줄 */
  go: string
  /** 스크린리더·툴팁용 온전한 이름 */
  full: string
  done: boolean
  onClick: () => void
  /** 목적지 경로 — 호버·누르는 순간 청크를 미리 받는다 */
  path?: string
}

const AlarmNudge = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  return (
    <div className="mt-2 flex items-center gap-1 rounded-2xl border border-[var(--card-border)] bg-[var(--surface-container)] py-1 pl-1 pr-1.5">
      <button
        type="button"
        onClick={() => navigate('/bible/alarm')}
        onPointerEnter={() => void preloadRoute('/bible/alarm')}
        onPointerDown={() => void preloadRoute('/bible/alarm')}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors duration-150 hover:bg-[var(--surface-inset)]"
      >
        <span className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center text-brand">
          <AlarmIcon size={17} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink-strong">
          {t('homeRailAlarmNudge')}
        </span>
        <span className="shrink-0 text-[11.5px] font-bold text-brand">{t('homeRailAlarmCta')}</span>
      </button>
      <button
        type="button"
        onClick={dismissAlarmNudge}
        aria-label={t('homeRailAlarmNudgeDismiss')}
        title={t('homeRailAlarmNudgeDismiss')}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-150 hover:bg-[var(--surface-inset)]"
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M2 2l8 8M10 2l-8 8" />
        </svg>
      </button>
    </div>
  )
}

const TodayStepsWidget = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { verse } = useTodayPick()
  const { data: myPrayer } = useMyLatestPrayer()
  const { readDone, cardDone, alarmNudgeDismissed } = useTodaySteps()
  const { data: alarms } = useVerseAlarms()

  const prayedToday = !!myPrayer?.created_at && kstDateKey(myPrayer.created_at) === kstDateKey(new Date())

  const steps: Step[] = [
    {
      key: 'read',
      label: t('homeRailTileRead'),
      go: t('homeRailTileReadGo'),
      full: t('homeRailStepRead'),
      done: readDone,
      onClick: () => (verse ? goReadPick(navigate, verse) : navigate('/bible')),
    },
    {
      key: 'pray',
      label: t('homeRailTilePray'),
      go: t('homeRailTilePrayGo'),
      full: t('homeRailStepPray'),
      done: prayedToday,
      // 홈 안에서 작성 시트를 연다 — 좌측 레일 '기도 쓰기'와 같은 통로
      onClick: () => navigate('/', { state: { openComposer: true }, replace: true }),
    },
    {
      key: 'card',
      label: t('homeRailTileCard'),
      go: t('homeRailTileCardGo'),
      full: t('homeRailStepCard'),
      done: cardDone,
      path: '/bible/photo-verse',
      onClick: () => goMakeCard(navigate, verse),
    },
  ]
  // 알림 목록을 받아 "하나도 없음"이 확인된 뒤에만 안내한다(로딩 중·비로그인은 숨김)
  const showAlarmNudge = !alarmNudgeDismissed && Array.isArray(alarms) && alarms.length === 0

  return (
    <section className="pp px-4 pt-2">
      <div className="pp-tiles" role="group" aria-label={t('homeRailStepsTitle')}>
        {steps.map((step, i) => {
          const sub = step.done ? t('homeRailStepDone') : step.go
          return (
            <button
              key={step.key}
              type="button"
              onClick={step.onClick}
              onPointerEnter={step.path ? () => void preloadRoute(step.path!) : undefined}
              onPointerDown={step.path ? () => void preloadRoute(step.path!) : undefined}
              data-done={step.done ? '' : undefined}
              aria-label={`${step.full} — ${sub}`}
              title={step.full}
              className="pp-tile text-ink-strong"
            >
              <span className="pp-tile-num" aria-hidden>
                {i + 1}
              </span>
              <span className="pp-tile-label">{step.label}</span>
              <span className="pp-tile-sub">{sub}</span>
            </button>
          )
        })}
      </div>
      {showAlarmNudge && <AlarmNudge />}
    </section>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { TodayStepsWidget }
