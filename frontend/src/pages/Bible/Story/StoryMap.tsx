import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { STORY_ACTS, TOTAL_EPISODES, nextUnread } from './data'
import { useStoryProgress, hasCelebrated, markCelebrated } from './storyProgress'
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
              <div className="story-hero__emoji">🎉</div>
              <div className="story-hero__title">완주를 축하합니다!</div>
              <p className="story-hero__text">
                창조에서 새 창조까지, 성경 전체의 이야기를 끝까지 걸으셨어요. 이제 지도를
                손에 쥐었으니, 진짜 말씀 속으로 떠나 볼 차례입니다.
              </p>
              <button className="story-hero__cta" onClick={() => navigate('/bible/plans')}>
                <span className="material-icons-round text-[18px]">menu_book</span>
                이제 진짜 성경으로 — 읽기 플랜 보기
              </button>
              <span className="story-hero__sub">아래에서 언제든 다시 읽을 수 있어요</span>
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
                  {started
                    ? `이어서 읽기 · ${next.emoji} ${next.title}`
                    : '1화부터 시작하기'}
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
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-10 lg:w-[680px] lg:max-w-none lg:mx-0 lg:shrink-0 lg:min-h-0 lg:rounded-3xl lg:border lg:overflow-hidden">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
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
                  <span className="story-act__emoji">{act.emoji}</span>
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
                          {ep.emoji}
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
                  <span className="shrink-0 text-[13px] w-5 text-center">{act.emoji}</span>
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
