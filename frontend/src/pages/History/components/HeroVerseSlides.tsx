import { useEffect, useState } from 'react'

/* 히어로 우측 말씀 슬라이드 — 빛·길 사진(public/images/history/) 위에
   '빛'을 주제로 한 말씀을 얹는다. 6초 자동 전환, 도트로 수동 이동. */
const SLIDES = [
  {
    key: 'lamp',
    scene: 'hvs-scene-forest',
    ko: ['주의 말씀은', '내 발에 등이요', '내 길에 빛이니이다'],
    en: ['Your word is a lamp to my feet', 'and a light to my path.'],
    ref: { ko: '시편 119:105', en: 'Psalm 119:105' },
  },
  {
    key: 'truelight',
    scene: 'hvs-scene-dawn',
    ko: ['참 빛 곧 세상에 와서', '각 사람에게 비추는', '빛이 있었나니'],
    en: ['The true light that gives light', 'to everyone was coming into the world.'],
    ref: { ko: '요한복음 1:9', en: 'John 1:9' },
  },
  {
    key: 'world',
    scene: 'hvs-scene-path',
    ko: ['나는 세상의 빛이니', '나를 따르는 자는', '생명의 빛을 얻으리라'],
    en: ['I am the light of the world.', 'Whoever follows me will have the light of life.'],
    ref: { ko: '요한복음 8:12', en: 'John 8:12' },
  },
]

const INTERVAL = 6000

export default function HeroVerseSlides({ ko }: { ko: boolean }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), INTERVAL)
    return () => window.clearInterval(t)
  }, [idx])

  return (
    <div className="hvs" aria-roledescription="carousel">
      {SLIDES.map((s, i) => (
        <figure
          key={s.key}
          className={`hvs-slide ${s.scene}${i === idx ? ' is-active' : ''}`}
          aria-hidden={i !== idx}
        >
          <div className="hvs-scrim" />
          <blockquote className="hvs-verse">
            {(ko ? s.ko : s.en).map((line) => (
              <span key={line}>{line}</span>
            ))}
            <cite>{ko ? s.ref.ko : s.ref.en}</cite>
          </blockquote>
        </figure>
      ))}
      <div className="hvs-dots">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={`hvs-dot${i === idx ? ' is-active' : ''}`}
            aria-label={`${i + 1} / ${SLIDES.length}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </div>
  )
}
