import { useEffect, useMemo, useState } from 'react'
import type { BibleBook } from '../../../../types/bible'
import type { ReadingProgressResponse } from '../../../../api/bibleReading'
import { isApiError } from '../../../../api/utils/request'
import { useStartReadingCycle } from '../../../../hooks/useBibleReading'
import { alertDialog, confirmDialog } from '../../../../utils/confirmDialog'
import { preloadBudget, scheduleAfterFirstScreen } from '../../../../utils/idlePreload'
import { lazyModal } from '../../../../utils/lazyModal'
import { readingSceneFor } from '../../../../utils/themeAssets'
import { BookOpen, ChartPieSlice, HandsPraying, MapTrifold } from '../../../../components/icons/phosphor'
import { gaugeWidth, pctLabel, type BookInfoMap } from '../readingProgressInfo'
import type { BookSelectorTexts } from './bookSelectorTexts'
import { buildSummaryStats, cheerKeyFor, splitLastWord } from './readingPosition'

// 지도 보기는 토글해야 나온다 — 기본 뷰(진행률)만 정적으로 둔다.
// 단, 청크는 요약 카드가 뜬 뒤 유휴 시간에(그리고 버튼에 손이 닿는 순간) 미리 받아 둔다 —
// 예전엔 "지도"를 누른 뒤에야 청크 왕복이 시작돼 fallback(null) 빈 화면이 한 박자 끼었다
const BibleProgressMap = lazyModal(() => import('../BibleProgressMap'))
const preloadProgressMap = () => void BibleProgressMap.preload()

interface ReadingSummaryCardProps {
  books: BibleBook[]
  infoMap: BookInfoMap
  /** 읽기 진행률 원본 — 없으면(비로그인·로딩 전) 카드를 그리지 않는다 */
  progress: ReadingProgressResponse['data'] | undefined
  /** progress 쿼리가 로딩 중(로그인 상태 한정) — 카드 자리에 스켈레톤을 세운다 */
  progressPending: boolean | undefined
  currentBookNumber: number | undefined
  /** 지도에서 책을 골랐을 때 */
  onMapSelect: (book: BibleBook) => void
  t: BookSelectorTexts
}

/**
 * 읽기 진행 요약 — 히어로(전체 진행률·격려·구약/신약으로 쪼갠 게이지), 지도 보기면 66권 지도가 아래에.
 * 링 3개 대신 "숫자 하나가 먼저 읽히고" 그 아래 구약/신약이 나뉘는 위계로 재구성했다.
 * 탭 안에 %를 넣지 않는 이유: 탭은 선택 컨트롤이고, 비활성 탭의 수치는 가려지기 때문
 */
const ReadingSummaryCard = ({
  books,
  infoMap,
  progress,
  progressPending,
  currentBookNumber,
  onMapSelect,
  t,
}: ReadingSummaryCardProps) => {
  const [showMap, setShowMap] = useState(false)
  // 진행률 카드 배경 장면 — 낮은 "함께 걷는 길", 저녁·밤은 "함께 읽기"(진입 시각 기준, 머무는 동안 고정)
  const [readingScene] = useState(() => readingSceneFor(new Date().getHours()))

  // 지도 청크 선로드 — 요약 카드(토글 버튼)가 보이는 동안 3G 이하가 아니면 유휴 시간에 받는다
  useEffect(() => {
    if (preloadBudget() !== 'full') return
    return scheduleAfterFirstScreen(preloadProgressMap, { settleMs: 1000 })
  }, [])

  // 전체/구약/신약 요약 — 링 색은 셋을 구분하는 용도라 전체=브랜드, 구약=딥 틸(선지서 토큰),
  // 신약=로얄 퍼플(계시록 토큰)로 고정
  const summaryStats = useMemo(() => buildSummaryStats(progress, t), [progress, t])
  const overallStat = summaryStats[0]
  const testamentStats = useMemo(() => summaryStats.filter(stat => stat.id !== 'all'), [summaryStats])

  // 통독 회차 — 진행률은 현재 회차 기준. 완독한 뒤에만 다음 회차를 열 수 있다(서버도 409 로 막는다)
  const cycle = progress?.cycle
  const startCycle = useStartReadingCycle()
  const handleStartCycle = async () => {
    if (!cycle || startCycle.isPending) return
    const next = cycle.current_cycle + 1
    const ok = await confirmDialog({
      title: t.cycleConfirmTitle(next),
      message: t.cycleConfirmMessage,
      description: t.cycleConfirmDescription,
      confirmText: t.cycleConfirmOk,
      tone: 'brand',
    })
    if (!ok) return
    try {
      await startCycle.mutateAsync(undefined)
    } catch (error) {
      // 409 면 mutation onError 가 이미 읽기 캐시를 다시 맞췄다 — 버튼도 새 진행률에 따라 사라진다
      await alertDialog({ message: isApiError(error, 409) ? t.cycleStartConflict : t.cycleStartFailed })
    }
  }

  if (summaryStats.length === 0 || !overallStat) {
    if (!progressPending) return null
    return (
      <div className="reading-summary" data-scene={readingScene} aria-hidden="true">
        <div className="reading-summary__head">
          <div className="reading-summary__heading">
            <span className="bib-skel bib-skel--badge" />
            <span className="reading-summary__heading-text">
              <span className="bib-skel bib-skel--title" />
              <span className="bib-skel bib-skel--subtitle" />
            </span>
          </div>
          <span className="bib-skel bib-skel--toggle" />
        </div>
        <div className="reading-hero">
          <div className="reading-hero__top">
            <div className="reading-hero__stat">
              <span className="bib-skel bib-skel--label" />
              <span className="bib-skel bib-skel--number" />
              <span className="bib-skel bib-skel--cheer" />
            </div>
          </div>
          <div className="reading-hero__gauge">
            <span className="reading-hero__track">
              <span className="reading-hero__seg" />
            </span>
          </div>
        </div>
      </div>
    )
  }

  // 격려 문구 — 진행률 구간별 한 줄. 숫자만 있는 대시보드가 아니라 "함께 읽는" 톤을 만든다.
  // "앞부분 + 마지막 어절"로 나눈다 — 마지막 어절은 아이콘과 묶여 함께 줄바꿈된다
  const { head: cheerHead, tail: cheerTail } = splitLastWord(t[cheerKeyFor(overallStat.rate)])

  return (
    <section className="reading-summary" data-scene={readingScene} aria-label={t.summaryTitle}>
      <div className="reading-summary__head">
        <div className="reading-summary__heading">
          <span className="reading-summary__badge" aria-hidden="true">
            <BookOpen size="1em" weight="duotone" color="currentColor" />
          </span>
          <span className="reading-summary__heading-text">
            <span className="reading-summary__title">{t.summaryTitle}</span>
            <span className="reading-summary__subtitle">{t.summarySubtitle}</span>
          </span>
        </div>

        {/* 보기 전환 — 진행률(히어로만, 구약/신약은 게이지 안) ↔ 지도(히어로 + 66권 히트맵) */}
        <div className="reading-summary__views" role="tablist" aria-label={t.summaryTitle}>
          <button
            type="button"
            role="tab"
            aria-selected={!showMap}
            className={`reading-summary__view${!showMap ? ' active' : ''}`}
            onClick={() => setShowMap(false)}
          >
            <ChartPieSlice size="1em" weight="duotone" color="currentColor" aria-hidden="true" />
            {t.statsToggle}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={showMap}
            className={`reading-summary__view${showMap ? ' active' : ''}`}
            onClick={() => setShowMap(true)}
            onPointerEnter={preloadProgressMap}
            onTouchStart={preloadProgressMap}
            onFocus={preloadProgressMap}
          >
            <MapTrifold size="1em" weight="duotone" color="currentColor" aria-hidden="true" />
            {t.mapToggle}
          </button>
        </div>
      </div>

      {/* 히어로 — 위는 "숫자 + 격려 | 삽화" 두 칸, 아래는 폭 전체를 쓰는 게이지.
          삽화를 배경으로 깔고 글자에 padding-right 를 주던 방식은 책이 오른쪽에서 잘리고
          글줄 폭이 눈에 안 보이는 규칙에 묶여 어색했다 — 삽화에 자기 칸을 주어 겹침을 없앴다.
          장 수는 게이지 양 끝(읽은 만큼 / 남은 만큼)으로 내려, 막대가 그 두 숫자의 그림이 된다 */}
      <div className="reading-hero" data-done={overallStat.rate >= 100 ? 'true' : undefined}>
        <div className="reading-hero__top">
          <div className="reading-hero__stat">
            <span className="reading-hero__label">
              {cycle && cycle.current_cycle > 1 ? t.cycleLabel(cycle.current_cycle) : t.overallLabel}
            </span>
            <span
              className="reading-hero__value"
              aria-label={`${t.overallLabel} ${pctLabel(overallStat.rate)}%`}
            >
              {pctLabel(overallStat.rate)}
              <small>%</small>
            </span>
            {/* 마지막 어절 + 손모양 아이콘을 nowrap 한 덩어리로 — 크롬은 NBSP 뒤의 인라인 SVG 앞에서도
                줄을 바꾸므로, 아이콘만 다음 줄로 떨어지지 않게 어절과 함께 움직이게 한다 */}
            <p className="reading-hero__cheer">
              {cheerHead}
              <span className="reading-hero__cheer-tail">
                {cheerTail}
                <HandsPraying size="1em" weight="duotone" color="currentColor" aria-hidden="true" />
              </span>
            </p>
          </div>
        </div>

        {/* 게이지 — 막대 하나를 구약·신약 장 수 비율(929 : 260)로 쪼갠다(2026-10-28, 구약/신약 타일 대체).
            전체 진행률이 "구약 얼마 + 신약 얼마"로 막대 하나에 그대로 보여 같은 정보를 두 번 그리지 않는다.
            칸 이름은 같은 flex 비율로 칸 바로 아래에 선다 — 책 이름 캡션(창세기·마태복음…)은 칸 이름과
            겹치는 정보라 넣지 않는다 */}
        <div className="reading-hero__gauge">
          <div className="reading-hero__meta">
            <span className="reading-hero__read">{overallStat.detail}</span>
            <span className="reading-hero__left">
              {overallStat.total - overallStat.read > 0
                ? `${t.remaining} ${(overallStat.total - overallStat.read).toLocaleString()}${overallStat.unit}`
                : t.allComplete}
            </span>
          </div>
          <span className="reading-hero__track" aria-hidden="true">
            {testamentStats.map(stat => (
              <span
                key={stat.id}
                className="reading-hero__seg"
                data-full={stat.rate >= 100 ? 'true' : undefined}
                style={{ flex: `${stat.total} 1 0` }}
              >
                <span className="reading-hero__fill" style={{ width: `${gaugeWidth(stat.rate)}%` }} />
              </span>
            ))}
          </span>
          <div className="reading-hero__parts">
            {testamentStats.map(stat => (
              <span
                key={stat.id}
                className="reading-hero__part"
                style={{ flex: `${stat.total} 1 0` }}
                aria-label={`${stat.label} ${pctLabel(stat.rate)}% · ${stat.detail}`}
              >
                <span className="reading-hero__part-label" aria-hidden="true">
                  {stat.id === 'ot' ? t.otShort : t.ntShort}
                </span>
                <span className="reading-hero__part-value" aria-hidden="true">
                  {pctLabel(stat.rate)}
                  <small>%</small>
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* 완독한 회차 — 통독 횟수와 다음 회차 시작. 버튼은 휴지 상태라 중립색 */}
        {cycle?.current_completed && (
          <div className="reading-hero__cycle">
            <span className="reading-hero__cycle-done">{t.cycleDone(cycle.completed_count)}</span>
            <button
              type="button"
              className="reading-hero__cycle-btn"
              onClick={handleStartCycle}
              disabled={startCycle.isPending}
            >
              {t.cycleStart(cycle.current_cycle + 1)}
            </button>
          </div>
        )}
      </div>

      {showMap && (
        <BibleProgressMap
          books={books}
          infoMap={infoMap}
          onBookSelect={onMapSelect}
          currentBookNumber={currentBookNumber}
        />
      )}
    </section>
  )
}

export default ReadingSummaryCard
