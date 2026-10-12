import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EditableText } from '../../../components/AboutEditor'
import { useAboutContent } from '../../../hooks/useAboutContent'
import type { AboutFieldKey } from '../../../types/aboutContent'
import { ChevronRightIcon, ClockIcon, MapPinIcon } from '../../About/icons'
import churchDay from '../../../assets/landing/church-day.webp'
import churchNight from '../../../assets/landing/church-night.webp'
import morningField from '../../../assets/hero/autumn-morning.webp'
import eveningField from '../../../assets/hero/autumn-evening.webp'

// 주일 아침, 한 장면씩 — 처음 오는 사람이 가장 두려운 건 '모르는 것'이라
// 정보 대신 도착부터 커피까지의 90분을 미리 겪게 한다.
// PC: 왼쪽 큰 시계가 sticky 로 머물고 오른쪽 장면이 지나가며 시각이 바뀐다.
// 모바일: 시계가 헤더 아래 얇은 띠로 붙고 장면은 세로로 쌓인다.
//
// 활성 장면 판정은 IntersectionObserver 대신 캡처 단계 scroll 리스너 —
// 이 앱은 body 가 스크롤 컨테이너라 IO 암묵 root 가 스크롤을 놓친다.

type Scene = {
  time: AboutFieldKey
  label: AboutFieldKey
  title: AboutFieldKey
  body: AboutFieldKey
  link?: { to: string; ko: string; en: string }
}

const SCENES: Scene[] = [
  { time: 'landingStory1Time', label: 'landingStory1Label', title: 'landingStory1Title', body: 'landingStory1Body', link: { to: '/visit', ko: '오시는 길 보기', en: 'Directions' } },
  { time: 'landingStory2Time', label: 'landingStory2Label', title: 'landingStory2Title', body: 'landingStory2Body' },
  { time: 'landingStory3Time', label: 'landingStory3Label', title: 'landingStory3Title', body: 'landingStory3Body', link: { to: '/sermon', ko: '지난 설교 들어보기', en: 'Listen to a sermon' } },
  { time: 'landingStory4Time', label: 'landingStory4Label', title: 'landingStory4Title', body: 'landingStory4Body' },
]

const SceneArt = ({ index, heroUrl }: { index: number; heroUrl?: string | null }) => {
  const cls = 'absolute inset-0 w-full h-full object-cover'
  if (index === 0) {
    return (
      <>
        <img src={churchDay} alt="" loading="lazy" decoding="async" className={`${cls} object-center dark:hidden`} />
        <img src={churchNight} alt="" loading="lazy" decoding="async" className={`${cls} object-center hidden dark:block`} />
      </>
    )
  }
  if (index === 1) return <img src="/images/history/verse-path.webp" alt="" loading="lazy" decoding="async" className={cls} />
  if (index === 2) {
    return heroUrl
      ? <img src={heroUrl} alt="" loading="lazy" decoding="async" crossOrigin="anonymous" className={`${cls} object-[70%_center]`} />
      : <img src={morningField} alt="" loading="lazy" decoding="async" className={cls} />
  }
  return <img src={eveningField} alt="" loading="lazy" decoding="async" className={cls} />
}

const SundayStory = ({ isAdmin, ko }: { isAdmin: boolean; ko: boolean }) => {
  const navigate = useNavigate()
  const { tx, heroBackgroundUrl } = useAboutContent()
  const [active, setActive] = useState(0)
  const sceneRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      // 화면 가운데에 가장 가까운 장면이 활성
      const mid = window.innerHeight * 0.5
      let best = 0
      let bestDist = Infinity
      sceneRefs.current.forEach((el, i) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        const d = Math.abs(r.top + r.height / 2 - mid)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      })
      setActive(best)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    document.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    measure()
    return () => {
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const cur = SCENES[active]

  return (
    <section id="sunday" className="ld-story scroll-mt-14">
      <div className="ld-story-grid">
        {/* 시계 — PC 는 왼쪽 sticky, 모바일은 헤더 아래 띠 */}
        <div className="ld-clock">
          <p className="ld-clock-basis">
            <EditableText fieldKey="landingStoryBasis" isAdmin={isAdmin}>
              <span>{tx('landingStoryBasis')}</span>
            </EditableText>
          </p>
          <div className="ld-clock-row">
            <span key={active} className="ld-clock-time">{tx(cur.time)}</span>
            <span className="ld-clock-label">{tx(cur.label)}</span>
          </div>
          <div className="ld-clock-bar" aria-hidden="true">
            <i style={{ width: `${((active + 1) / SCENES.length) * 100}%` }} />
          </div>
          <ol className="ld-clock-steps" aria-hidden="true">
            {SCENES.map((s, i) => (
              <li key={s.time} className={i === active ? 'is-on' : i < active ? 'is-past' : ''}>
                <span>{tx(s.time)}</span>
                {tx(s.label)}
              </li>
            ))}
          </ol>
        </div>

        <div>
          {SCENES.map((s, i) => (
            <article
              key={s.time}
              ref={(el) => {
                sceneRefs.current[i] = el
              }}
              className={`ld-scene${i === active ? ' is-on' : ''}`}
            >
              <div className={`ld-scene-art${i === 0 ? ' ld-scene-art--tall' : ''}`}>
                <SceneArt index={i} heroUrl={heroBackgroundUrl} />
              </div>
              {/* 모바일에선 시계 띠가 이미 시각을 보여주지만, 장면마다 작은 꼬리표로 한 번 더 */}
              <p className="ld-scene-tag">
                <EditableText fieldKey={s.time} isAdmin={isAdmin}>
                  <span>{tx(s.time)}</span>
                </EditableText>
                <span aria-hidden="true">·</span>
                <EditableText fieldKey={s.label} isAdmin={isAdmin}>
                  <span>{tx(s.label)}</span>
                </EditableText>
              </p>
              <h3 className="ld-scene-title">
                <EditableText fieldKey={s.title} isAdmin={isAdmin} multiline>
                  <span>{tx(s.title)}</span>
                </EditableText>
              </h3>
              <p className="ld-scene-body">
                <EditableText fieldKey={s.body} isAdmin={isAdmin} multiline>
                  <span>{tx(s.body)}</span>
                </EditableText>
              </p>
              {s.link && (
                <button type="button" onClick={() => navigate(s.link!.to)} className="ld-scene-link">
                  {ko ? s.link.ko : s.link.en}
                  <ChevronRightIcon size={15} />
                </button>
              )}
            </article>
          ))}
        </div>
      </div>

      {/* 장면이 끝나면 — 이번 주일 초대 */}
      <div className="ld-story-end">
        <h2 className="ld-story-end-title">
          <EditableText fieldKey="landingStoryEnd" isAdmin={isAdmin} multiline>
            <span>{tx('landingStoryEnd')}</span>
          </EditableText>
        </h2>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] text-brand px-4 py-2 text-[14px] font-bold">
          <ClockIcon size={16} />
          {tx('aboutInfoWorship')}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/visit')}
            className="brand-gradient inline-flex items-center gap-1.5 px-6 py-3.5 rounded-2xl text-[15px] font-bold text-white shadow-[0_10px_28px_-10px_rgba(49,130,246,0.6)] active:scale-[0.97] transition-transform"
          >
            <MapPinIcon size={17} />
            {tx('landingCtaVisit')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/worship')}
            className="inline-flex items-center gap-1 px-6 py-3.5 rounded-2xl text-[15px] font-bold text-ink-strong ring-1 ring-inset ring-black/10 dark:ring-white/15 hover:bg-[var(--brand-soft)] hover:text-brand transition-colors"
          >
            {ko ? '예배 안내' : 'Service info'}
            <ChevronRightIcon size={15} />
          </button>
        </div>
      </div>
    </section>
  )
}

export default SundayStory
