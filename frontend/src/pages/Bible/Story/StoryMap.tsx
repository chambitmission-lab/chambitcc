import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { STORY_ACTS, TOTAL_EPISODES, nextUnread } from './data'
import { useStoryProgress, hasCelebrated, markCelebrated } from './storyProgress'
import { StoryGlyph } from './StoryIcons'
import { ArrowRight, BookOpen, Sparkle } from '../../../components/icons/phosphor'
import './Story.css'

/**
 * 처음 만나는 성경 — 여정 맵.
 * 성경 전체를 10막 42화의 연속극처럼 훑는 스토리 모드의 목차 화면.
 * 진행 상태는 계정에 저장(비로그인은 기기 로컬), 순서는 권장일 뿐 잠금은 없다.
 */
const StoryMap = () => {
  const navigate = useNavigate()
  const { readIds } = useStoryProgress()

  const readCount = useMemo(
    () => STORY_ACTS.reduce((n, a) => n + a.episodes.filter(e => readIds.has(e.id)).length, 0),
    [readIds]
  )
  const next = useMemo(() => nextUnread(readIds), [readIds])
  const started = readCount > 0
  const completed = readCount >= TOTAL_EPISODES
  const pct = Math.round((readCount / TOTAL_EPISODES) * 100)

  // 완주 축하 — 최초 1회만 컨페티
  useEffect(() => {
    if (!completed || hasCelebrated()) return
    markCelebrated()
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#3182f6', '#4593fc', '#60a5fa', '#facc15'],
    })
  }, [completed])

  // 히어로(진행·이어보기 CTA) — 본문(모바일)과 우측 레일(lg+)이 같은 마크업을 공유한다
  const renderStoryHero = (cls: string) => (
    <div className={cls}>
          {/* 히어로 — 진행 상태에 따라 3가지 얼굴 */}
          {completed ? (
            <div className="story-hero story-hero--done">
              {/* 배경 광원·잔별 — 장식이라 스크린리더에서 숨긴다 */}
              <div className="story-done__glow" aria-hidden />
              <span className="story-done__spark story-done__spark--1" aria-hidden>
                <Sparkle size={18} weight="duotone" />
              </span>
              <span className="story-done__spark story-done__spark--2" aria-hidden>
                <Sparkle size={12} weight="duotone" />
              </span>
              <span className="story-done__spark story-done__spark--3" aria-hidden>
                <Sparkle size={14} weight="duotone" />
              </span>

              <span className="story-done__eyebrow">처음 만나는 성경 · 완주</span>

              {/* 완주 인장 — 통독표 도장과 같은 문법, 열릴 때 꾹 눌러 찍힌다 */}
              <div className="story-done__seal" aria-label="완주 인장">
                <span className="story-done__seal-ring" aria-hidden />
                <span className="story-done__seal-text">완주</span>
                <span className="story-done__seal-meta">{TOTAL_EPISODES}화</span>
              </div>

              <h3 className="story-done__title">
                성경 한 편을
                <br />
                끝까지 걸었어요
              </h3>
              <p className="story-done__text">
                창조에서 새 창조까지, 하나로 이어진 이야기의 지도를 손에 쥐었어요.
                이제 진짜 말씀 속으로 떠날 차례입니다.
              </p>

              <dl className="story-done__stats">
                <div className="story-done__stat">
                  <dt>막</dt>
                  <dd>{STORY_ACTS.length}</dd>
                </div>
                <div className="story-done__stat">
                  <dt>이야기</dt>
                  <dd>{TOTAL_EPISODES}</dd>
                </div>
                <div className="story-done__stat">
                  <dt>다음은</dt>
                  <dd>66권</dd>
                </div>
              </dl>

              <button className="story-done__cta" onClick={() => navigate('/bible/plans')}>
                <BookOpen size={18} weight="duotone" />
                진짜 성경으로 떠나기
                <ArrowRight size={16} weight="bold" className="story-done__cta-arrow" />
              </button>
              <span className="story-done__sub">아래에서 언제든 다시 읽을 수 있어요</span>
            </div>
          ) : (
            <div className="story-hero">
              <span className="story-hero__eyebrow">
                <span className="material-icons-round text-[14px]">auto_stories</span>
                성경이 처음이신가요?
              </span>
              <div className="story-hero__title">
                {started
                  ? '이야기가 이어지고 있어요'
                  : '창세기부터 읽다가 포기해 보셨나요?'}
              </div>
              <p className="story-hero__text">
                {started
                  ? `지금까지 ${readCount}화를 읽으셨어요. 하나로 이어지는 이야기라, 순서대로 읽으면 더 재미있어요.`
                  : '성경은 66권의 책이 모인 도서관이자, 처음과 끝이 이어지는 한 편의 거대한 이야기입니다. 본문을 펴기 전에, 그 줄거리를 42개의 짧은 이야기로 먼저 만나 보세요. 한 편에 3분이면 충분해요.'}
              </p>
              {next && (
                <button
                  className="story-hero__cta"
                  onClick={() => navigate(`/bible/story/${next.id}`)}
                >
                  <span className="material-icons-round text-[18px]">
                    {started ? 'play_arrow' : 'flag'}
                  </span>
                  {started ? (
                    <>
                      이어서 읽기 · <StoryGlyph emoji={next.emoji} size={16} /> {next.title}
                    </>
                  ) : (
                    '1화부터 시작하기'
                  )}
                </button>
              )}
              <div className="story-progress">
                <div className="story-progress__row">
                  <span className="story-progress__label">전체 여정</span>
                  <span className="story-progress__count">
                    {readCount} / {TOTAL_EPISODES}화
                  </span>
                </div>
                <div className="story-progress__track">
                  <div className="story-progress__fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          )}
    </div>
  )

  return (
    <div className="bg-[var(--app-canvas)] dark:bg-background-dark min-h-screen page-stage">
      {/* lg+: 본문 + 우측 레일 2단. 본문은 680px 고정 — 화(에피소드)를 잇는 세로 점선
          경로가 이 화면의 메타포라 2열로 쪼개거나 폭을 늘리면 길이 끊긴다 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:justify-center lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-10 lg:w-[680px] lg:max-w-none lg:mx-0 lg:shrink-0 lg:min-h-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden">
        {/* 헤더 */}
        {/* 하단 실선을 두지 않는다 — #root 의 overflow-x:hidden 때문에 sticky 가 실제로는 붙지 않아
            이 바는 본문과 함께 스크롤되고, 반투명 앱 헤더 밑을 지날 때 실선만 카드 폭만큼 비쳐
            "중간에 끊긴 선"처럼 보였다. sticky 가 살아나면 헤더 바로 아래(top-14)에 붙는다 */}
        <div className="sticky top-14 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm lg:rounded-t-3xl">
          <div className="flex items-center gap-3 px-4 h-14">
            <button
              onClick={() => navigate('/bible')}
              className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded-full"
              aria-label="성경으로 돌아가기"
            >
              <span className="material-icons-round text-[22px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-[17px] font-bold text-ink-strong">처음 만나는 성경</h1>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                성경 전체를 한 편의 이야기로
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-5">
          {renderStoryHero('lg:hidden')}

          {/* 10막 여정 */}
          {STORY_ACTS.map(act => {
            const done = act.episodes.filter(e => readIds.has(e.id)).length
            return (
              <section key={act.act} id={`story-act-${act.act}`} className="story-act scroll-mt-20">
                <div className="story-act__head">
                  <span className="story-act__emoji"><StoryGlyph emoji={act.emoji} size={20} /></span>
                  <div className="story-act__titles">
                    <span className="story-act__no">{act.act}막</span>
                    <span className="story-act__title">{act.title}</span>
                    <span className="story-act__range">
                      {act.subtitle} · {act.range}
                    </span>
                  </div>
                  <span
                    className={`story-act__count ${
                      done === act.episodes.length ? 'story-act__count--done' : ''
                    }`}
                  >
                    {done}/{act.episodes.length}
                  </span>
                </div>

                <div className="story-path">
                  {act.episodes.map(ep => {
                    const read = readIds.has(ep.id)
                    const isCurrent = next?.id === ep.id
                    return (
                      <button
                        key={ep.id}
                        className={`story-node ${read ? 'story-node--read' : ''} ${
                          isCurrent ? 'story-node--current' : ''
                        }`}
                        onClick={() => navigate(`/bible/story/${ep.id}`)}
                      >
                        <span className="story-node__dot">
                          <StoryGlyph emoji={ep.emoji} size={20} />
                          {read && (
                            <span className="story-node__check">
                              <span className="material-icons-round">check</span>
                            </span>
                          )}
                        </span>
                        <span className="story-node__body">
                          <span className="story-node__title">{ep.title}</span>
                          <span className="story-node__hook">{ep.hook}</span>
                        </span>
                        {isCurrent ? (
                          <span className="story-node__here">여기부터</span>
                        ) : (
                          <span className="material-icons-round story-node__chevron">
                            chevron_right
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {/* 우측 위젯 레일 (lg+) — 진행·이어보기와 10막 인덱스를 옆에 고정한다.
          42화가 세로로 길게 이어지는 화면이라 "지금 어디쯤"이 계속 보여야 한다 */}
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
        {renderStoryHero('')}

        <section className="rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-none">
          <p className="mb-1.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
            10막 여정
          </p>
          <div className="flex flex-col -mx-1">
            {STORY_ACTS.map((act) => {
              const done = act.episodes.filter((e) => readIds.has(e.id)).length
              const allDone = done === act.episodes.length
              return (
                <button
                  key={act.act}
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(`story-act-${act.act}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  className="flex items-center gap-2 px-1 py-2 rounded-lg text-left hover:bg-[var(--brand-soft)] transition-colors"
                >
                  <span className="shrink-0 w-5 grid place-items-center text-brand"><StoryGlyph emoji={act.emoji} size={15} /></span>
                  <span className="flex-1 min-w-0 truncate text-[12.5px] font-semibold text-ink-strong">
                    {act.title}
                  </span>
                  <span
                    className={`shrink-0 text-[11px] font-bold tabular-nums ${
                      allDone ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-400 dark:text-white/40'
                    }`}
                  >
                    {done}/{act.episodes.length}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </aside>
      </div>
    </div>
  )
}

export default StoryMap
