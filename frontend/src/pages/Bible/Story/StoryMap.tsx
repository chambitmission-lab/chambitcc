import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { ALL_EPISODES, STORY_ACTS, TOTAL_EPISODES, nextUnread } from './data'
import { useStoryProgress, hasCelebrated, markCelebrated } from './storyProgress'
import { StoryGlyph } from './StoryIcons'
import { ArrowRight, BookOpen, Sparkle } from '../../../components/icons/phosphor'
import './Story.css'

// 화 번호(1~42) — 맵의 카드 격자와 레일에서 순서를 보여 준다
const EPISODE_NO = new Map(ALL_EPISODES.map((e, i) => [e.id, i + 1]))

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

  // 히어로(진행·이어보기 CTA) — 본문 맨 위. lg+ 에선 가로 배너로 펼쳐진다(Story.css)
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
              {/* lg+ 에선 __main(글)·__side(버튼·진행)가 좌우로 선다 — 모바일은 그대로 위아래 */}
              <div className="story-hero__main">
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
              </div>
              <div className="story-hero__side">
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
            </div>
          )}
    </div>
  )

  // 지금 이어 읽을 화가 속한 막 — 우측 바로가기에서 강조한다
  const currentAct = next ? STORY_ACTS.find(a => a.episodes.some(e => e.id === next.id))?.act : undefined

  return (
    <div className="bg-[var(--app-canvas)] dark:bg-background-dark min-h-screen page-stage">
      {/* lg+: 본문(가변 폭) + 우측 레일 2단. 예전엔 본문을 680px 로 묶고 히어로를 312px 레일에
          넣어 PC 가 휴대폰 화면을 옆에 붙여 둔 듯 답답했다. 이제 히어로는 본문 맨 위 가로 배너,
          화 목록은 번호 붙은 카드 격자(Story.css lg 블록)라 점선 경로 대신 "N화" 번호가 순서를 잇는다.
          폭을 px 로 고정하지 않는 건 헤더 '가' 글씨 크기(zoom)를 키워도 옆으로 넘치지 않게 하려는 것 */}
      <div className="lg:max-w-[1280px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-6 lg:pt-4 lg:pb-16">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-10 lg:max-w-none lg:flex-1 lg:min-w-0 lg:mx-0 lg:min-h-0 lg:pb-12 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden">
        {/* 헤더 */}
        {/* 하단 실선을 두지 않는다 — 예전 #root overflow-x:hidden 시절 sticky 가 붙지 않아 바가 반투명
            앱 헤더 밑을 지날 때 실선만 비쳐 "중간에 끊긴 선"처럼 보였다. 모바일은 헤더 바로 아래(top-14)에 붙는다.
            lg+ 는 static — 카드의 overflow-hidden 이 sticky 기준 상자가 되는데 그 상자는 스크롤하지
            않으니, top-14 만큼 바가 그대로 56px 밀려 내려와 1막 머리글을 덮었다 */}
        <div className="sticky top-14 lg:static z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm lg:rounded-t-3xl">
          <div className="flex items-center gap-3 px-4 h-14 lg:h-20 lg:px-8 lg:gap-4">
            <button
              onClick={() => navigate('/bible')}
              className="w-8 h-8 lg:w-11 lg:h-11 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded-full lg:hover:bg-[var(--brand-soft)] lg:hover:text-brand transition-colors"
              aria-label="성경으로 돌아가기"
            >
              <span className="material-icons-round text-[22px] lg:text-[26px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-[17px] lg:text-[24px] font-bold text-ink-strong">처음 만나는 성경</h1>
              <p className="text-[12px] lg:text-[15px] text-gray-500 dark:text-gray-400 mt-0.5">
                성경 전체를 한 편의 이야기로
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-5 lg:px-8 lg:pt-2">
          {renderStoryHero('')}

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
                          {/* 화 번호 — lg 격자에서 점선 경로 대신 순서를 알려 준다 (모바일은 숨김) */}
                          <span className="story-node__no">
                            {EPISODE_NO.get(ep.id)}화{read ? ' · 읽음' : ''}
                          </span>
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

      {/* 우측 위젯 레일 (lg+) — 42화가 길게 이어지는 화면이라 스크롤해 내려가도
          "지금 어디쯤·이어 읽기"와 10막 바로가기가 계속 보여야 한다. 레일이 화면보다 길어지면
          (글씨 '아주 크게') 레일 안에서만 스크롤한다 */}
      <aside
        className="hidden lg:flex lg:w-[300px] xl:w-[330px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem] lg:overflow-y-auto lg:pb-2"
        style={{ maxHeight: 'calc((100vh - 5.5rem) / var(--az, 1))' }}
      >
        <section className="rounded-2xl p-5 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-none">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[14px] font-bold text-gray-600 dark:text-white/60">전체 여정</span>
            <span className="text-[16px] font-extrabold text-brand tabular-nums">
              {readCount} / {TOTAL_EPISODES}화
            </span>
          </div>
          <div className="mt-2.5 h-2 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {next && (
            <button
              type="button"
              onClick={() => navigate(`/bible/story/${next.id}`)}
              className="mt-4 w-full flex items-center gap-3 rounded-xl px-3.5 py-3 bg-brand text-white text-left shadow-[0_10px_24px_-12px_var(--brand-glow)] hover:brightness-110 transition"
            >
              <span className="shrink-0 w-9 h-9 rounded-full bg-white/20 grid place-items-center">
                <StoryGlyph emoji={next.emoji} size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[12.5px] font-bold text-white/80">
                  {started ? `이어서 읽기 · ${EPISODE_NO.get(next.id)}화` : '1화부터 시작하기'}
                </span>
                <span className="block text-[15.5px] font-bold leading-snug [word-break:keep-all]">
                  {next.title}
                </span>
              </span>
              <span className="material-icons-round shrink-0 text-[22px]">arrow_forward</span>
            </button>
          )}
        </section>

        <section className="rounded-2xl p-3 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-none">
          <p className="px-2 pt-1 pb-2 text-[14px] font-bold text-gray-600 dark:text-white/60">
            10막 바로가기
          </p>
          <div className="flex flex-col">
            {STORY_ACTS.map((act) => {
              const done = act.episodes.filter((e) => readIds.has(e.id)).length
              const allDone = done === act.episodes.length
              const isCurrentAct = act.act === currentAct
              return (
                <button
                  key={act.act}
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(`story-act-${act.act}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  className={`flex items-center gap-3 px-2 py-2.5 rounded-xl text-left transition-colors ${
                    isCurrentAct ? 'bg-[var(--brand-soft)]' : 'hover:bg-[var(--brand-soft)]'
                  }`}
                >
                  <span className="shrink-0 w-9 h-9 rounded-lg grid place-items-center bg-[var(--brand-soft)] text-brand">
                    <StoryGlyph emoji={act.emoji} size={18} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12px] font-bold text-brand">{act.act}막</span>
                    <span className="block text-[15px] font-semibold leading-snug text-ink-strong [word-break:keep-all]">
                      {act.title}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-[13.5px] font-bold tabular-nums ${
                      allDone ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-500 dark:text-white/50'
                    }`}
                  >
                    {allDone ? (
                      <span className="material-icons-round text-[20px] align-middle">check_circle</span>
                    ) : (
                      `${done}/${act.episodes.length}`
                    )}
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
