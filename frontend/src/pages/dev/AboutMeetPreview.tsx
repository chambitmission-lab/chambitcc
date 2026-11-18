import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { CHURCH_SEASON_PHOTO, pairSrc } from '../../utils/themeAssets'
import { getNaturalSeason, type NaturalSeason } from '../../utils/naturalSeason'
import offSpring from '../../assets/hero/church-spring-night-off.webp'
import offSummer from '../../assets/hero/church-summer-night-off.webp'
import offAutumn from '../../assets/hero/church-autumn-night-off.webp'
import offWinter from '../../assets/hero/church-winter-night-off.webp'
import glowSpring from '../../assets/hero/church-spring-night-glow.webp'
import glowSummer from '../../assets/hero/church-summer-night-glow.webp'
import glowAutumn from '../../assets/hero/church-autumn-night-glow.webp'
import glowWinter from '../../assets/hero/church-winter-night-glow.webp'
import { about } from '../../locales/ko/about'
import '../About/styles/index.css'
import './aboutMeetPreview.css'

/**
 * /#/dev/about-meet — /about '다섯 만남' 장 개편 시안.
 *   ?v=now 지금 · a 지워지는 네 줄 (a1 줄이 그어지는 순간 · a2 다섯째 줄 · a3 불이 켜지는 교회 · a4 사진이 판 끝까지) · b 사진 한 장 + 한 문장 · c 손수건이 하는 일 · d 세상의 만남 / 참빛의 만남
 *   &frame=1 은 모바일 폭 iframe 안에서 장 하나만 그린다.
 * 문구는 지금 관리자 문구(locales/ko/about)를 그대로 쓰고, 새로 필요한 문구만 표본으로 넣었다.
 */

const MEET_IMG = import.meta.glob('../About/img/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const img = (k: string) => MEET_IMG[`../About/img/${k}.webp`]

const BAD = [about.aboutMeetingBad1, about.aboutMeetingBad2, about.aboutMeetingBad3, about.aboutMeetingBad4]
const BAD_KEYS = ['fishy', 'wilted', 'worn_out', 'deleted']
const PROMISE = about.aboutPromiseQuote.split('\n')

const usePhoto = () => {
  const { theme } = useTheme()
  return pairSrc(CHURCH_SEASON_PHOTO[getNaturalSeason(new Date())], theme)
}

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="ab-tag">
    <i aria-hidden="true" />
    {children}
  </span>
)

/* ───────── 지금 ───────── */
const Now = () => (
  <section className="ab-meet">
    <header className="ab-meet-head">
      <Tag>다섯 만남</Tag>
      <h2 className="ab-title">{about.aboutMeetingTitle}</h2>
      <p className="ab-lead">세상엔 쓰고 버리는 만남이 많습니다.</p>
    </header>
    <ul className="ab-meet-cards">
      {BAD.map((t, i) => (
        <li key={t} className="ab-meet-card">
          <img src={img(BAD_KEYS[i])} alt="" />
          <span className="ab-meet-label">{t}</span>
        </li>
      ))}
      <li className="ab-meet-card is-good">
        <img src={img('handkerchief')} alt="" />
        <span className="ab-meet-label">
          <small>단 하나의 만남</small>
          {about.aboutMeetingGood.replace('\n', ' ')}
        </span>
      </li>
    </ul>
    <blockquote className="ab-promise">
      <p className="ab-promise-text">
        {PROMISE.map((l, i) => (
          <span key={l} className={`ab-line${i === PROMISE.length - 1 ? ' is-last' : ''}`}>
            {l}
          </span>
        ))}
      </p>
      <span className="ab-promise-author">참빛교회의 약속</span>
    </blockquote>
  </section>
)

/* ───────── A 지워지는 네 줄 — 그림 없이 글자만, 오른쪽에 우리 교회 사진 ───────── */
const VariantA = () => {
  const photo = usePhoto()
  return (
    <section className="amp-a">
      <div className="amp-a-txt">
        <Tag>다섯 만남</Tag>
        <h2 className="ab-title">{about.aboutMeetingTitle}</h2>
        <ol className="amp-a-list">
          {BAD.map((t) => (
            <li key={t}>
              <s>{t}</s>
            </li>
          ))}
        </ol>
        <p className="amp-a-good">
          <small>그리고, 단 하나의 만남</small>
          {PROMISE.map((l, i) => (
            <span key={l} className={i === PROMISE.length - 1 ? 'is-last' : undefined}>
              {l}
            </span>
          ))}
        </p>
        <span className="amp-sign">참빛교회의 약속</span>
      </div>
      <figure className="amp-a-pic">
        <img src={photo} alt="참빛교회 전경" />
        <figcaption>부천 상동 · 참빛교회</figcaption>
      </figure>
    </section>
  )
}

/* ───────── A 변형 — A 를 기본으로 조금씩 더한다 ───────── */

// 화면에 들어올 때 한 번 켠다(replay 가 바뀌면 다시)
const useReveal = (replay: number) => {
  const ref = useRef<HTMLElement | null>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    setOn(false)
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    const t = window.setTimeout(() => io.observe(el), 60)
    return () => {
      window.clearTimeout(t)
      io.disconnect()
    }
  }, [replay])
  return { ref, on }
}

// 홈 히어로와 같은 조각 — 704×900 사진 위 (340,90) 364×290 자리에 '불 꺼진 간판·십자가'를 덮는다
const LIGHT_SPRITES: Record<NaturalSeason, { off: string; glow: string }> = {
  spring: { off: offSpring, glow: glowSpring },
  summer: { off: offSummer, glow: glowSummer },
  autumn: { off: offAutumn, glow: glowAutumn },
  winter: { off: offWinter, glow: glowWinter },
}

const PromiseBlock = ({ kicker, num }: { kicker?: string; num?: boolean }) => (
  <div className="amp-a-good">
    {num && <span className="amp-a-num is-gold">05</span>}
    <div>
      <small>{kicker ?? '그리고, 단 하나의 만남'}</small>
      {PROMISE.map((l, i) => (
        <span key={l} className={i === PROMISE.length - 1 ? 'is-last' : undefined}>
          {l}
        </span>
      ))}
      <span className="amp-sign">참빛교회의 약속</span>
    </div>
  </div>
)

type AxProps = { kind: 'a1' | 'a2' | 'a3' | 'a4'; replay: number }

const VariantAx = ({ kind, replay }: AxProps) => {
  const { theme } = useTheme()
  const season = getNaturalSeason(new Date())
  const pair = CHURCH_SEASON_PHOTO[season]
  const animated = kind === 'a1' || kind === 'a3'
  const { ref, on } = useReveal(replay)
  const numbered = kind === 'a2'
  // a3 는 '불이 켜지는' 이야기라 테마와 상관없이 밤 사진
  const photo = kind === 'a3' ? pair.dark : pairSrc(pair, theme)
  const sprite = LIGHT_SPRITES[season]

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`amp-a amp-ax is-${kind}${animated ? ' is-anim' : ''}${on ? ' is-on' : ''}`}
    >
      <div className="amp-a-txt">
        <Tag>다섯 만남</Tag>
        <h2 className="ab-title">{about.aboutMeetingTitle}</h2>
        {numbered && <p className="amp-ax-lead">세상엔 쓰고 버리는 만남이 많습니다.</p>}
        <ol className="amp-a-list">
          {BAD.map((t, i) => (
            <li key={t} style={{ '--i': i } as React.CSSProperties}>
              {numbered && <span className="amp-a-num">0{i + 1}</span>}
              <s>{t}</s>
            </li>
          ))}
        </ol>
        <PromiseBlock num={numbered} kicker={numbered ? '다섯째, 단 하나의 만남' : undefined} />
      </div>

      <figure className="amp-a-pic">
        {kind === 'a3' ? (
          <div className="amp-lit">
            <img className="amp-lit-photo" src={photo} alt="참빛교회 전경" />
            <img className="amp-lit-off" src={sprite.off} alt="" aria-hidden="true" />
            <img className="amp-lit-glow" src={sprite.glow} alt="" aria-hidden="true" />
          </div>
        ) : (
          <img src={photo} alt="참빛교회 전경" />
        )}
        {numbered ? (
          <figcaption className="amp-ax-visit">
            <strong>주일 오전 11시</strong>
            <span>부천 상동 · 7호선 상동역</span>
            <em>오시는 길 →</em>
          </figcaption>
        ) : (
          <figcaption>부천 상동 · 참빛교회</figcaption>
        )}
      </figure>
    </section>
  )
}

/* ───────── B 사진 한 장 + 한 문장 — 네 만남을 한 문장으로 접는다 ───────── */
const VariantB = () => {
  const photo = usePhoto()
  return (
    <section className="amp-b">
      <img className="amp-b-photo" src={photo} alt="" />
      <span className="amp-b-shade" aria-hidden="true" />
      <div className="amp-b-txt">
        <Tag>다섯 만남</Tag>
        <p className="amp-b-world">
          비린내 나면, 시들면,
          <br />
          힘이 닳으면, 필요 없으면
          <br />
          <em>버려지는 만남</em>이 많은 세상에서
        </p>
        <p className="amp-b-promise">
          {PROMISE.map((l, i) => (
            <span key={l} className={i === PROMISE.length - 1 ? 'is-last' : undefined}>
              {l}
            </span>
          ))}
        </p>
        <span className="amp-sign">참빛교회의 약속</span>
      </div>
    </section>
  )
}

/* ───────── C 손수건이 하는 일 — 은유를 실제 돌봄으로 잇는다 ───────── */
const CARE = [
  {
    kicker: '땀을 닦아 드려요',
    title: '함께 섬기는 목장',
    body: '혼자 지고 가던 짐을 한 주에 한 번, 같은 식탁에서 나눕니다.',
    go: '소그룹 둘러보기',
    icon: 'M4 18h16M6 18v-5a6 6 0 0 1 12 0v5M12 4v3',
  },
  {
    kicker: '눈물을 닦아 드려요',
    title: '함께 드리는 기도',
    body: '말하기 어려운 기도도 이름 없이 올리면, 누군가 끝까지 함께 기도합니다.',
    go: '기도 나누기',
    icon: 'M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z',
  },
  {
    kicker: '처음이어도 괜찮아요',
    title: '새가족 환영',
    body: '처음 오신 주일, 안내 위원이 자리까지 함께 걷고 이름을 기억합니다.',
    go: '오시는 길',
    icon: 'M12 3l8 7v10H4V10l8-7zM10 20v-5h4v5',
  },
]

const VariantC = () => (
  <section className="amp-c">
    <header className="amp-c-head">
      <Tag>다섯 만남</Tag>
      <p className="amp-c-world">세상엔 쓰고 버리는 만남이 많습니다.</p>
      <h2 className="amp-c-promise">
        {PROMISE.map((l, i) => (
          <span key={l} className={i === PROMISE.length - 1 ? 'is-last' : undefined}>
            {l}
          </span>
        ))}
      </h2>
    </header>
    <ul className="amp-c-cards">
      {CARE.map((c) => (
        <li key={c.title}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={c.icon} />
          </svg>
          <small>{c.kicker}</small>
          <strong>{c.title}</strong>
          <p>{c.body}</p>
          <span className="amp-c-go">{c.go} →</span>
        </li>
      ))}
    </ul>
  </section>
)

/* ───────── D 세상의 만남 / 참빛의 만남 — 네 쌍을 마주 놓는다 ───────── */
const PAIRS = [
  ['비린내 나면 떠나는 만남', '흠이 보여도 곁에 남는 만남'],
  ['시들면 버리는 만남', '시들 때 물을 주는 만남'],
  ['힘 닳으면 버리는 만남', '지칠 때 쉬게 하는 만남'],
  ['필요 없으면 지우는 만남', '끝까지 이름을 기억하는 만남'],
]

const VariantD = () => (
  <section className="amp-d">
    <header className="amp-d-head">
      <Tag>다섯 만남</Tag>
      <h2 className="ab-title">{about.aboutMeetingTitle}</h2>
    </header>
    <div className="amp-d-table" role="table">
      <div className="amp-d-row is-head" role="row">
        <span role="columnheader">세상의 만남</span>
        <i aria-hidden="true" />
        <span role="columnheader">참빛의 만남</span>
      </div>
      {PAIRS.map(([w, c]) => (
        <div className="amp-d-row" role="row" key={w}>
          <span className="is-world" role="cell">
            {w}
          </span>
          <i aria-hidden="true">→</i>
          <span className="is-church" role="cell">
            {c}
          </span>
        </div>
      ))}
    </div>
    <p className="amp-d-promise">
      {PROMISE.map((l, i) => (
        <span key={l} className={i === PROMISE.length - 1 ? 'is-last' : undefined}>
          {l}
        </span>
      ))}
    </p>
    <span className="amp-sign">참빛교회의 약속</span>
  </section>
)

const VARIANTS = [
  { key: 'now', label: '지금', note: '흑백 동물 삽화 4장 + 컬러 손수건 1장. 캐릭터(고양이·플라밍고·오소리)가 인위적이라는 반응.' },
  {
    key: 'a',
    label: 'A 지워지는 네 줄',
    note: '그림을 전부 걷고 글자만. 네 만남은 옅은 회색 줄 위에 가는 취소선, 그 아래 약속이 또렷하게. 오른쪽엔 지금 계절의 실제 교회 사진 한 장. 가장 조용하고 관리자 문구(4줄·약속)를 그대로 쓴다.',
  },
  {
    key: 'a1',
    label: 'A1 줄이 그어지는 순간',
    note: 'A 그대로 + 장이 화면에 들어오면 네 줄에 차례로 취소선이 그어지고(한 줄 0.5초), 글자가 옅어진 뒤 약속이 제자리에서 떠오른다. 자리 이동 없이 선·투명도만 — 어르신 어지러움 없음. 위 "다시 보기"로 재생.',
  },
  {
    key: 'a2',
    label: 'A2 다섯째 줄',
    note: "A + 01~04 번호를 달고 약속을 '05'(금빛)로 같은 목록에 이어 붙여 '다섯 만남'이 정말 다섯 줄로 읽힌다. 사진 아래 꼬리표는 주일 오전 11시 · 오시는 길 → 로 바꿔 사진이 바로 방문 안내가 된다.",
  },
  {
    key: 'a3',
    label: 'A3 불이 켜지는 교회',
    note: "A1 흐름 + 마지막에 사진 속 교회 간판 '참빛교회'와 십자가에 불이 조용히 켜진다(홈 히어로와 같은 조각 사진, 번개 없음). '참 빛'이라는 이름과 손수건 약속이 한 장면에서 만난다. 이야기상 라이트에서도 밤 사진.",
  },
  {
    key: 'a4',
    label: 'A4 사진이 판 끝까지',
    note: 'A의 사진을 판 오른쪽·위·아래 끝까지 붙이고 글 쪽 가장자리를 판 색으로 부드럽게 녹였다. 사진 액자가 아니라 판 자체가 교회 앞에 서 있는 느낌. 모바일은 사진이 위쪽 가장자리까지.',
  },
  {
    key: 'b',
    label: 'B 사진 한 장 + 한 문장',
    note: '실제 교회 사진을 판 전체에 깔고, 네 만남을 "…버려지는 만남이 많은 세상에서" 한 문장으로 접은 뒤 약속으로 끝맺는다. 잡지 표지 같은 한 장면. 사진은 계절·라이트/다크를 따라 바뀐다.',
  },
  {
    key: 'c',
    label: 'C 손수건이 하는 일',
    note: '비유를 설명하는 대신 "그래서 실제로 무엇을 해 주나"를 보여 준다 — 목장·중보기도·새가족 세 카드가 각 화면으로 이어진다. 처음 온 분에게 가장 쓸모 있음. 카드 문구는 표본(사역 이름 확인 필요).',
  },
  {
    key: 'd',
    label: 'D 세상의 만남 / 참빛의 만남',
    note: '네 만남을 지우지 않고 짝을 지어 준다 — 왼쪽 회색 "버리는 만남", 오른쪽 금빛 "남는 만남". 표처럼 읽혀 어르신도 한눈에. 모바일은 짝마다 위아래로.',
  },
] as const

const Variant = ({ v, replay = 0 }: { v: string; replay?: number }) => {
  if (v === 'a1' || v === 'a2' || v === 'a3' || v === 'a4') return <VariantAx key={replay} kind={v} replay={replay} />
  if (v === 'a') return <VariantA />
  if (v === 'b') return <VariantB />
  if (v === 'c') return <VariantC />
  if (v === 'd') return <VariantD />
  return <Now />
}

export default function AboutMeetPreview() {
  const [params, setParams] = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const meta = VARIANTS.find((x) => x.key === params.get('v')) ?? VARIANTS[1]
  const frame = params.get('frame') === '1'
  const [replay, setReplay] = useState(0)
  const animated = meta.key === 'a1' || meta.key === 'a3'

  useEffect(() => {
    void ensureFontFamily('gowunDodum')
    void ensureFontFamily('gowunBatang')
  }, [])

  if (frame) {
    return (
      <div className="about-page amp-frame">
        <div className="ab-body">
          <Variant v={meta.key} replay={replay} />
        </div>
      </div>
    )
  }

  const pill = (on: boolean) =>
    `text-[13px] px-3.5 py-1.5 rounded-full border ${
      on ? 'bg-[var(--brand)] text-white border-transparent font-bold' : 'text-gray-600 dark:text-white/70 border-gray-200 dark:border-white/[0.1]'
    }`

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
      <div className="mx-auto max-w-[1200px] px-5 pt-6">
        <h1 className="text-[18px] font-bold text-ink-strong">/about 다섯 만남 — 개편 시안</h1>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {VARIANTS.map((x) => (
            <button key={x.key} onClick={() => setParams({ v: x.key }, { replace: true })} className={pill(x.key === meta.key)}>
              {x.label}
            </button>
          ))}
          <button onClick={toggleTheme} className="ml-2 text-[13px] underline text-gray-500 dark:text-white/55">
            {theme === 'dark' ? '라이트로' : '다크로'}
          </button>
          {animated && (
            <button onClick={() => setReplay((n) => n + 1)} className="ml-2 text-[13px] underline text-[var(--brand)]">
              다시 보기
            </button>
          )}
        </div>
        <p className="mt-2 text-[13px] leading-[1.6] text-gray-500 dark:text-white/55 break-keep">{meta.note}</p>
      </div>

      <div className="mx-auto mt-2 max-w-[1280px]">
        <div className="about-page amp-pc">
          <div className="ab-body">
            <Variant v={meta.key} replay={replay} />
          </div>
        </div>
        <figure className="px-5">
          <figcaption className="mb-2 text-[12px] text-gray-400">모바일 (390)</figcaption>
          <iframe
            key={`${meta.key}-${theme}-${replay}`}
            title="모바일"
            src={`${window.location.pathname}#/dev/about-meet?v=${meta.key}&frame=1`}
            className="amp-phone"
          />
        </figure>
      </div>
    </div>
  )
}
