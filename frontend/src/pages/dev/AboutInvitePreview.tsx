import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { ABOUT_DAWN_MOBILE, ABOUT_DAWN_PC, pairSrc, visitSceneFor } from '../../utils/themeAssets'
import { about } from '../../locales/ko/about'
import { landing } from '../../locales/ko/landing'
import HeroFalling from '../Visit/components/HeroFalling'
import { ChevronRightIcon, ClockIcon, MapPinIcon } from '../About/icons'
import '../About/styles/index.css'
import '../Visit/styles/falling.css'
import './aboutInvitePreview.css'

/**
 * /#/dev/about-invite — /about 맨 아래 '초대' 장 개편 시안.
 *   ?v=now 지금 · a 이번 주일 초대장 · b 주일 아침 미리 걷기 · c 걱정 풀고 오세요 · d 풍경 + 한 줄 정보
 *   &frame=1 은 모바일 폭 iframe 안에서 장 하나만 그린다.
 * 문구는 지금 관리자 문구(about·landing 로캘)를 그대로 쓴다. 사진은 오시는 길 계절 풍경(계절 × 낮/밤).
 */

/* 다음 주일(오늘이 주일이면 오늘) */
const nextSunday = () => {
  const d = new Date()
  const isToday = d.getDay() === 0
  if (!isToday) d.setDate(d.getDate() + (7 - d.getDay()))
  return { label: `${d.getMonth() + 1}월 ${d.getDate()}일`, isToday }
}

const SERVICES = [
  { part: '1부', time: '7:30', ampm: '오전' },
  { part: '2부', time: '9:20', ampm: '오전' },
  { part: '3부', time: '11:20', ampm: '오전', pick: true },
  { part: '4부', time: '1:30', ampm: '오후' },
]

const STORY = [1, 2, 3, 4].map((n) => ({
  time: landing[`landingStory${n}Time` as 'landingStory1Time'],
  label: landing[`landingStory${n}Label` as 'landingStory1Label'],
  title: landing[`landingStory${n}Title` as 'landingStory1Title'],
}))

const WORRIES = [
  { q: landing.landingFaq1Q, a: '안 시킵니다. 새가족실에서 따뜻한 커피 한 잔 드려요.' },
  { q: landing.landingFaq2Q, a: landing.landingFaq2A },
  { q: landing.landingFaq4Q, a: '다들 그렇게 시작했어요. 혼자 앉았다 조용히 가셔도 괜찮아요.' },
]

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="ab-tag">
    <i aria-hidden="true" />
    {children}
  </span>
)

const useScene = () => {
  const { theme } = useTheme()
  return { scene: visitSceneFor(theme), theme }
}

/* 계절 풍경 배경(+ 낮엔 오시는 길과 같은 낙하물) */
const Scene = ({ className = '' }: { className?: string }) => {
  const { scene, theme } = useScene()
  if (!scene) return null
  return (
    <div className={`aip-scene ${className}`} aria-hidden="true">
      <img src={scene.src} alt="" />
      {theme === 'light' && <HeroFalling season={scene.season} />}
    </div>
  )
}

/* ───────── 지금 ───────── */
const Now = () => (
  <section className="ab-invite">
    <img className="ab-invite-bg" src="/images/history/verse-path.webp" alt="" />
    <div className="ab-invite-copy">
      <Tag>초대</Tag>
      <h2 className="ab-title">{about.aboutCtaTitle}</h2>
      <p className="ab-lead">{about.aboutCtaText}</p>
      <div className="ab-invite-actions">
        <button type="button" className="ab-invite-cta">
          이번 주일, 함께 예배드려요
        </button>
      </div>
    </div>
    <div className="ab-info">
      <div className="ab-info-row">
        <ClockIcon size={20} className="ab-info-icon" />
        <span className="ab-info-main">
          <small>주일예배</small>
          <b>{about.aboutInfoWorship}</b>
        </span>
        <ChevronRightIcon size={16} className="ab-info-chevron" />
      </div>
      <div className="ab-info-row">
        <MapPinIcon size={20} className="ab-info-icon" />
        <span className="ab-info-main">
          <small>오시는 길</small>
          <b>{about.aboutAddress}</b>
        </span>
        <ChevronRightIcon size={16} className="ab-info-chevron" />
      </div>
    </div>
  </section>
)

/* ───────── A 이번 주일 초대장 — 날짜가 박힌 초대 + 예배 시간 네 칸 ───────── */
/* 첫 화면과 같은 새벽 하늘 — 좌우를 뒤집어 빛이 오른쪽 아래에서(글은 왼쪽 하늘) */
const Sky = () => {
  const { theme } = useTheme()
  const pair = ABOUT_DAWN_PC.when?.() ? ABOUT_DAWN_PC : ABOUT_DAWN_MOBILE
  return (
    <div className="aip-scene aip-sky" aria-hidden="true">
      <img src={pairSrc(pair, theme)} alt="" />
    </div>
  )
}

type Bg = 'church' | 'sky' | 'none'

const VariantA = ({ bg = 'church' }: { bg?: Bg }) => {
  const sun = nextSunday()
  const { scene, theme } = useScene()
  // 하늘: 라이트는 옅은 새벽(남색 글씨), 다크는 밤하늘(흰 글씨)
  const ink = bg === 'church' ? (scene?.ink ?? 'white') : bg === 'sky' ? (theme === 'dark' ? 'white' : 'navy') : 'plain'
  return (
    <section className={`aip-a ink-${ink} bg-${bg}`}>
      {bg === 'church' && <Scene />}
      {bg === 'sky' && <Sky />}
      {bg !== 'none' && <span className="aip-a-shade" aria-hidden="true" />}
      {bg === 'none' && (
        <p className="aip-a-bigdate" aria-hidden="true">
          {sun.label.replace('월 ', '.').replace('일', '')}
        </p>
      )}
      <div className="aip-a-body">
        <Tag>초대</Tag>
        <p className="aip-a-date">
          <span>{sun.isToday ? '오늘' : '이번 주일'} ·</span>
          <strong>{sun.label}</strong>
        </p>
        <h2 className="aip-a-title">{'자리 하나\n비워둘게요.'}</h2>
        <ul className="aip-times">
          {SERVICES.map((s) => (
            <li key={s.part} className={s.pick ? 'is-pick' : undefined}>
              <small>{s.part}</small>
              <b>
                <em>{s.ampm}</em> {s.time}
              </b>
              {s.pick && <span>처음이라면</span>}
            </li>
          ))}
        </ul>
        <div className="aip-actions">
          <button type="button" className="aip-cta">
            오시는 길 보기
          </button>
          <span className="aip-a-where">
            <MapPinIcon size={16} /> 7호선 상동역 걸어서 5분 · 주차 가능
          </span>
        </div>
      </div>
    </section>
  )
}

/* ───────── B 주일 아침 미리 걷기 — 랜딩 타임라인을 한 줄 노선으로 ───────── */
const VariantB = () => (
  <section className="aip-b">
    <header className="aip-b-head">
      <div>
        <Tag>초대</Tag>
        <h2 className="ab-title">{about.aboutCtaTitle}</h2>
        <p className="ab-lead">이번 주일 아침이 어떻게 흘러가는지 미리 걸어 보세요.</p>
      </div>
      <small className="aip-b-basis">{landing.landingStoryBasis}</small>
    </header>
    <ol className="aip-route">
      {STORY.map((s, i) => (
        <li key={s.time} className={i === STORY.length - 1 ? 'is-last' : undefined}>
          <span className="aip-route-dot" aria-hidden="true" />
          <time>{s.time}</time>
          <small>{s.label}</small>
          <p>{s.title.replace('\n', ' ')}</p>
        </li>
      ))}
    </ol>
    <footer className="aip-b-foot">
      <p>{landing.landingStoryEnd.replace('\n', ' ')}</p>
      <div className="aip-actions">
        <button type="button" className="aip-cta">
          이번 주일, 함께 예배드려요
        </button>
        <span className="aip-b-other">다른 예배 · 7:30 · 9:20 · 오후 1:30</span>
      </div>
    </footer>
  </section>
)

/* ───────── C 걱정 풀고 오세요 — 왼쪽 초대 · 오른쪽 세 가지 걱정 ───────── */
const VariantC = () => {
  const [open, setOpen] = useState(0)
  return (
    <section className="aip-c">
      <div className="aip-c-copy">
        <Tag>초대</Tag>
        <h2 className="ab-title">{landing.landingCineTitle}</h2>
        <p className="ab-lead">{about.aboutCtaText}</p>
        <div className="aip-c-info">
          <p>
            <ClockIcon size={18} />
            <span>
              <b>주일 오전 11:20</b> 외 7:30 · 9:20 · 오후 1:30
            </span>
          </p>
          <p>
            <MapPinIcon size={18} />
            <span>
              <b>7호선 상동역</b> 걸어서 5분 · 주차 가능
            </span>
          </p>
        </div>
        <button type="button" className="aip-cta">
          이번 주일, 함께 예배드려요
        </button>
      </div>
      <div className="aip-c-faq">
        <small className="aip-c-kicker">솔직히, 걱정되는 것들</small>
        {WORRIES.map((w, i) => (
          <div key={w.q} className={`aip-q${open === i ? ' is-open' : ''}`}>
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{w.q}</span>
              <i aria-hidden="true">{open === i ? '−' : '+'}</i>
            </button>
            {open === i && <p>{w.a}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────── D 풍경 + 한 줄 정보 — 지금 구조 그대로, 사진만 우리 교회로 ───────── */
const VariantD = () => {
  const { scene } = useScene()
  return (
    <section className={`aip-d ink-${scene?.ink ?? 'white'}`}>
      <Scene />
      <span className="aip-d-shade" aria-hidden="true" />
      <div className="aip-d-copy">
        <Tag>초대</Tag>
        <h2 className="aip-d-title">{about.aboutCtaTitle}</h2>
        <p className="aip-d-lead">{about.aboutCtaText}</p>
        <button type="button" className="aip-cta">
          이번 주일, 함께 예배드려요
        </button>
      </div>
      <div className="aip-d-strip">
        <span>
          <ClockIcon size={18} />
          <b>주일예배</b> 오전 7:30 · 9:20 · 11:20 · 오후 1:30
        </span>
        <span>
          <MapPinIcon size={18} />
          <b>오시는 길</b> 7호선 상동역 5분
        </span>
        <em>
          길 안내 <ChevronRightIcon size={14} />
        </em>
      </div>
    </section>
  )
}

const VARIANTS = [
  { key: 'now', label: '지금', note: 'AI로 만든 풀밭 사진 + 흰 정보 카드. "우리 동네가 아니라 어색"한 스톡 느낌, 위의 사진 장들과도 결이 다르다.' },
  {
    key: 'a',
    label: 'A 이번 주일 초대장(교회 풍경)',
    note: "오시는 길 계절 풍경(낮/밤 + 꽃잎·낙엽·눈) 위에 '이번 주일 · 다음 주일 날짜' 를 박고 '자리 하나 비워둘게요.'. 예배 시간은 네 칸 타일, 3부엔 '처음이라면'. 받는 순간 날짜가 정해진 초대라 가장 구체적.",
  },
  {
    key: 'a2',
    label: 'A2 처음 하늘로 돌아오기',
    note: '교회 전경 대신 /about 첫 화면의 새벽 하늘(이 페이지에서만 쓰는 사진)을 좌우로 뒤집어 깔았다. 페이지가 "참 빛" 하늘로 열리고 같은 하늘의 빛 쪽에서 "자리 하나 비워둘게요"로 닫힌다. 다른 화면에서 돌려 쓰지 않는 사진.',
  },
  {
    key: 'a3',
    label: 'A3 사진 없이 날짜만',
    note: '사진을 아예 빼고 큰 날짜(11.22)를 배경 글자처럼 옅게 깔았다. 위 다섯 만남·담임목사 사진이 이미 있어 마지막은 글자만으로 조용히 마무리. 토스식, 가장 가볍고 계절·테마와 상관없이 늘 같다.',
  },
  {
    key: 'b',
    label: 'B 주일 아침 미리 걷기',
    note: '랜딩의 주일 아침 타임라인(11:05 상동역 → 11:10 입구 → 11:20 예배 → 12:30 커피)을 한 줄 노선도로. 처음 오는 분의 "가면 어떻게 되지?"를 바로 풀어 준다. 사진 없이 흰 판.',
  },
  {
    key: 'c',
    label: 'C 걱정 풀고 오세요',
    note: "왼쪽 '처음이어도, 괜찮아요' 초대 + 시간·길 두 줄, 오른쪽 '솔직히, 걱정되는 것들' 세 가지(자기소개·옷차림·아는 사람)를 눌러 펼친다. 랜딩 문구 재사용, 유머는 한 스푼.",
  },
  {
    key: 'd',
    label: 'D 풍경 + 한 줄 정보',
    note: '지금 구조를 거의 그대로 두고 사진만 우리 교회 계절 풍경으로. 흰 정보 카드는 아래 반투명 한 줄 띠로 접었다. 가장 적은 변화.',
  },
] as const

const Variant = ({ v }: { v: string }) => {
  if (v === 'a') return <VariantA />
  if (v === 'a2') return <VariantA bg="sky" />
  if (v === 'a3') return <VariantA bg="none" />
  if (v === 'b') return <VariantB />
  if (v === 'c') return <VariantC />
  if (v === 'd') return <VariantD />
  return <Now />
}

export default function AboutInvitePreview() {
  const [params, setParams] = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const meta = VARIANTS.find((x) => x.key === params.get('v')) ?? VARIANTS[1]
  const frame = params.get('frame') === '1'

  useEffect(() => {
    void ensureFontFamily('gowunDodum')
  }, [])

  if (frame) {
    return (
      <div className="about-page aip-frame">
        <div className="ab-body">
          <Variant v={meta.key} />
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
        <h1 className="text-[18px] font-bold text-ink-strong">/about 초대 — 개편 시안</h1>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {VARIANTS.map((x) => (
            <button key={x.key} onClick={() => setParams({ v: x.key }, { replace: true })} className={pill(x.key === meta.key)}>
              {x.label}
            </button>
          ))}
          <button onClick={toggleTheme} className="ml-2 text-[13px] underline text-gray-500 dark:text-white/55">
            {theme === 'dark' ? '라이트로' : '다크로'}
          </button>
        </div>
        <p className="mt-2 text-[13px] leading-[1.6] text-gray-500 dark:text-white/55 break-keep">{meta.note}</p>
      </div>

      <div className="mx-auto mt-2 max-w-[1280px]">
        <div className="about-page aip-pc">
          <div className="ab-body">
            <Variant v={meta.key} />
          </div>
        </div>
        <figure className="px-5">
          <figcaption className="mb-2 text-[12px] text-gray-400">모바일 (390)</figcaption>
          <iframe
            key={`${meta.key}-${theme}`}
            title="모바일"
            src={`${window.location.pathname}#/dev/about-invite?v=${meta.key}&frame=1`}
            className="aip-phone"
          />
        </figure>
      </div>
    </div>
  )
}
