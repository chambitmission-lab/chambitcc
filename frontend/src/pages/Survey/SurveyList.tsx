// 설문 목록 — 진행 중인 설문과, 이미 끝난 지난 설문
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSurveys } from '../../hooks/useSurvey'
import { isAuthenticated } from '../../utils/auth'
import { preloadRoute } from '../../utils/routePreload'
import type { SurveySummary } from '../../types/survey'
import { isSurveyHeroWarm, warmSurveyHero } from './heroPrefetch'
import { formatDate, isAcceptingResponses, surveyActionLabel } from './surveyShared'
import {
  CenterNote,
  ChevronRight,
  ClipboardIcon,
  RailCard,
  SectionTitle,
  Spinner,
  SurveyShell,
  SurveyStateChip,
} from './surveyUi'
import './survey-hero.css'

const SurveyCard = ({ survey, onOpen }: { survey: SurveySummary; onOpen: () => void }) => {
  const accepting = isAcceptingResponses(survey)
  const answered = Boolean(survey.my_response_id)
  const primary = accepting && !answered

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => void preloadRoute(`/survey/${survey.id}`)}
      onTouchStart={() => void preloadRoute(`/survey/${survey.id}`)}
      className={`w-full text-left p-4 rounded-2xl bg-white dark:bg-card-dark border shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.985] ${
        primary
          ? 'border-[var(--brand-soft-strong)]'
          : 'border-gray-200/70 dark:border-white/[0.07]'
      } ${accepting ? '' : 'opacity-90'}`}
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-11 h-11 rounded-2xl bg-[var(--brand-soft)] text-brand flex items-center justify-center">
          <ClipboardIcon size={21} />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="flex-1 min-w-0 text-[15px] font-bold text-ink-strong leading-snug tracking-[-0.015em]">
              {survey.title}
            </h3>
            <span className="shrink-0 mt-0.5">
              <SurveyStateChip survey={survey} />
            </span>
          </div>

          {survey.description ? (
            <p className="mt-1 text-[12.5px] text-ink-muted leading-relaxed line-clamp-2">
              {survey.description}
            </p>
          ) : null}

          <p className="mt-1.5 text-[12px] text-gray-400 dark:text-white/45">
            문항 {survey.question_count}개
            {survey.response_count > 0 ? ` · ${survey.response_count}명 참여` : ''}
            {survey.ends_at ? ` · ${formatDate(survey.ends_at)}까지` : ''}
          </p>

          <span
            className={`mt-2 inline-flex items-center gap-0.5 text-[13px] font-bold ${
              primary ? 'text-brand' : 'text-gray-400 dark:text-white/45'
            }`}
          >
            {surveyActionLabel(survey)}
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </button>
  )
}

const SurveyList = () => {
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const { data, isLoading } = useSurveys(loggedIn)

  // 히어로 삽화는 CSS 배경이라 이 엘리먼트가 렌더된 뒤에야 요청이 나간다(heroPrefetch.ts 참고).
  // 메뉴에서 청크를 미리 받았으면 첫 렌더부터 보이고, 아니면 도착에 맞춰 페이드인.
  const [artReady, setArtReady] = useState(isSurveyHeroWarm)
  useEffect(() => {
    if (artReady) return
    let alive = true
    void warmSurveyHero().then(() => {
      if (alive) setArtReady(true)
    })
    return () => {
      alive = false
    }
  }, [artReady])

  const { ongoing, past, pending, answered, closingSoon } = useMemo(() => {
    const list = data ?? []
    const ongoing = list.filter(isAcceptingResponses)
    const pendingList = ongoing.filter((s) => !s.my_response_id)
    // 마감이 정해진 것 중 가장 임박한 것 하나 — 레일에서 다시 눌러 들어갈 수 있게
    const closingSoon = pendingList
      .filter((s) => s.ends_at)
      .sort((a, b) => new Date(a.ends_at!).getTime() - new Date(b.ends_at!).getTime())[0]
    return {
      ongoing,
      past: list.filter((s) => !isAcceptingResponses(s)),
      pending: pendingList.length,
      answered: list.filter((s) => s.my_response_id).length,
      closingSoon,
    }
  }, [data])

  const open = (id: number) => navigate(`/survey/${id}`)

  const rail = loggedIn ? (
    <>
      <RailCard title="한눈에">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
              참여를 기다리는 설문
            </span>
            <span className="text-[16px] font-bold text-brand tabular-nums">{pending}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
              참여한 설문
            </span>
            <span className="text-[16px] font-bold text-ink-strong tabular-nums">{answered}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
              지난 설문
            </span>
            <span className="text-[16px] font-bold text-ink-strong tabular-nums">{past.length}</span>
          </div>
        </div>

        {closingSoon ? (
          <button
            type="button"
            onMouseEnter={() => void preloadRoute(`/survey/${closingSoon.id}`)}
            onClick={() => open(closingSoon.id)}
            className="mt-3 w-full flex items-center gap-2 px-3 h-10 rounded-xl border border-[var(--card-border)] text-left hover:border-[var(--brand-soft-strong)] hover:bg-[var(--brand-soft)] transition-colors"
          >
            <span className="shrink-0 text-brand">
              <ClipboardIcon size={14} />
            </span>
            <span className="flex-1 min-w-0 truncate text-[12.5px] font-bold text-ink-strong">
              {closingSoon.title}
            </span>
            <span className="shrink-0 text-[11px] text-gray-400 dark:text-white/40">
              {formatDate(closingSoon.ends_at)}까지
            </span>
          </button>
        ) : null}
      </RailCard>

      <RailCard title="설문 안내">
        <ul className="space-y-2 text-[12.5px] text-gray-500 dark:text-white/55 leading-relaxed">
          <li>· 한 분이 한 번만 참여할 수 있어요.</li>
          <li>· 마감 전이라면 제출한 답을 다시 고칠 수 있어요.</li>
          <li>· 결과를 공개한 설문은 참여 후 바로 확인할 수 있어요.</li>
        </ul>
      </RailCard>
    </>
  ) : undefined

  return (
    <SurveyShell onBack={() => navigate('/')} title="설문조사" rail={rail}>
      {/* Hero — 지금 해야 할 일(참여 대기 수)을 첫 화면에서 바로 말한다.
          배경은 "의견함에 쪽지를 넣는 양" 삽화(라이트/다크 한 장씩, docs/survey-hero-bg-prompts.md).
          ★삽화가 카드 전면을 불투명하게 덮는다. 아래 카드 그라데이션은 **삽화 도착 전 자리끼움**일
          뿐이고, 색은 삽화 하늘색을 실측해 맞춰 뒀다. 카드·잉크·삽화는 한 세트다 —
          하나만 바꾸면 글씨가 죽는다. 안내문 폭(max-w-[14rem])도 밝기 실측의 일부다. */}
      <section className="relative overflow-hidden mx-4 mt-5 px-6 py-8 rounded-[26px] bg-[linear-gradient(120deg,#d4eafc_0%,#dff1ff_58%,#ebf5ff_125%)] ring-1 ring-[rgba(49,130,246,0.15)] shadow-[0_10px_30px_-14px_rgba(49,130,246,0.45)] dark:bg-[linear-gradient(120deg,#071222_0%,#0a1a35_58%,#0b1730_125%)] dark:ring-white/[0.08] dark:shadow-[0_10px_34px_-12px_rgba(0,0,0,0.6)]">
        <div className={`survey-hero-art absolute inset-0${artReady ? ' is-ready' : ''}`} aria-hidden />
        <div className="relative z-10">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.34em] text-[#2563eb] dark:text-white/65">
            Survey
          </span>
          {/* drop-shadow 는 다크에만 — 밝은 카드 위 남색 글씨에 검은 그림자가 붙으면 지저분하다 */}
          <h2 className="text-[26px] font-extrabold tracking-[-0.02em] leading-[1.25] mt-3 whitespace-pre-line text-[#152648] dark:text-white dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            {!loggedIn
              ? '성도님의 의견을\n들려주세요'
              : pending > 0
                ? `참여를 기다리는\n설문 ${pending}개`
                : ongoing.length > 0
                  ? '진행 중인 설문에\n모두 참여했어요'
                  : '지금은 열린\n설문이 없어요'}
          </h2>
          <p className="text-[13px] font-light leading-[1.7] text-[#41527a] dark:text-white/80 mt-3 max-w-[14rem] break-keep">
            {pending > 0
              ? '잠깐이면 끝나요. 남겨주신 답이 교회의 결정이 됩니다.'
              : '새 설문이 열리면 홈 화면에서 먼저 알려드릴게요.'}
          </p>
        </div>
      </section>

      <div className="px-4 pt-6">
        {!loggedIn ? (
          <CenterNote
            title="로그인 후 참여할 수 있습니다"
            hint="설문은 한 분이 한 번만 참여할 수 있어, 로그인이 필요해요."
            actionLabel="로그인하기"
            onAction={() => navigate('/login')}
          />
        ) : isLoading ? (
          <Spinner />
        ) : ongoing.length === 0 && past.length === 0 ? (
          <CenterNote
            title="아직 등록된 설문이 없습니다"
            hint="새 설문이 열리면 홈에서 알려드릴게요."
          />
        ) : (
          <>
            {ongoing.length > 0 ? (
              <section>
                <SectionTitle count={ongoing.length}>진행 중</SectionTitle>
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 lg:items-start">
                  {ongoing.map((survey) => (
                    <SurveyCard key={survey.id} survey={survey} onOpen={() => open(survey.id)} />
                  ))}
                </div>
              </section>
            ) : null}

            {past.length > 0 ? (
              <section className={ongoing.length > 0 ? 'pt-8' : ''}>
                <SectionTitle count={past.length}>지난 설문</SectionTitle>
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 lg:items-start">
                  {past.map((survey) => (
                    <SurveyCard key={survey.id} survey={survey} onOpen={() => open(survey.id)} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </SurveyShell>
  )
}

export default SurveyList
