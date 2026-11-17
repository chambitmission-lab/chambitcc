// /dev/people-motion — 섬기는 사람들 사진 카드 '재미있는 움직임' 시안 비교 (DEV 전용)
//
// 원칙(어르신 어지러움 피드백): 카드·사진 자체는 제자리. 위에 얹은 빛·스티커·낙서·유리판만
// 한 번씩 움직이고 반복하지 않는다. prefers-reduced-motion 이면 전부 끈다.
import { useEffect, useRef, useState } from 'react'
import { usePeopleDirectory } from '../../hooks/usePeople'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { CATEGORY_LABEL, PERSON_CATEGORIES, personInitial, personText } from '../../types/people'
import type { Person, PersonCategory } from '../../types/people'
import '../People/people.css'
import './peopleDepthLab.css'
import './peopleMotionLab.css'

void ensureFontFamily('nanumPen')

const VARIANTS = [
  {
    key: 'a',
    name: '폴라로이드 현상',
    bench: '인스탁스 · 레트로 필름 감성',
    how: '화면에 들어올 때 한 번',
    idea: '하얗게 바랜 사진이 천천히 색을 찾으며 선명해져요. 사진은 움직이지 않고 "현상"만 돼요.',
  },
  {
    key: 'b',
    name: '보더 빔',
    bench: 'Magic UI Border Beam · Linear',
    how: '마우스 올리면 한 바퀴',
    idea: '카드 테두리를 따라 금빛→블루 빛줄기가 한 바퀴 돌고 사라져요.',
  },
  {
    key: 'c',
    name: '빛 스윕',
    bench: 'Apple Wallet 카드 · 홀로그램 스티커',
    how: '마우스 올리면 한 번',
    idea: '사진 위로 비스듬한 광택이 "샥" 지나가요. 유광 인화지에 빛이 스치는 느낌.',
  },
  {
    key: 'd',
    name: '손글씨 낙서',
    bench: 'Rough Notation · 다이어리 꾸미기',
    how: '마우스 올리면 그려짐',
    idea: '이름 밑에 펜으로 밑줄이 쓱 그어지고, 옆에 작은 하트가 그려져요.',
  },
  {
    key: 'e',
    name: '스티커 팝',
    bench: '인스타 스토리 스티커 · 카톡 반응',
    how: '마우스 올리면 톡톡톡',
    idea: '사진 모서리에 하트·반짝이·새싹 스티커가 차례로 톡톡 붙어요. 사진은 그대로.',
  },
  {
    key: 'f',
    name: '리퀴드 글래스 인사판',
    bench: 'iOS 26 Liquid Glass',
    how: '마우스 올리면 올라옴',
    idea: '사진 아래쪽에서 반투명 유리판이 올라와 "샬롬! 반가워요" 인사와 사역을 보여줘요.',
  },
] as const

const PeopleMotionLab = () => {
  const [cat, setCat] = useState<PersonCategory>('pastor')
  const [replay, setReplay] = useState(0)
  const { people, isLoading } = usePeopleDirectory()
  const { theme, toggleTheme } = useTheme()

  const inCat = people.filter((p) => p.category === cat)
  const withPhoto = inCat.filter((p) => p.photo_url)
  const list = (withPhoto.length >= 4 ? withPhoto : inCat).slice(0, 4)

  return (
    <div className="dl-page">
      <header className="dl-head">
        <p className="dl-kicker">/people 사진 카드 움직임 시안 · DEV</p>
        <h1 className="dl-title">사진에 마우스를 올려 보세요</h1>
        <p className="dl-sub">카드·사진은 제자리 — 위에 얹은 빛·스티커·낙서만 한 번씩 움직여요.</p>
        <div className="dl-tools">
          {PERSON_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`dl-chip ${c === cat ? 'is-on' : ''}`}
              onClick={() => setCat(c)}
            >
              {CATEGORY_LABEL[c].ko}
            </button>
          ))}
          <button type="button" className="dl-chip" onClick={toggleTheme}>
            {theme === 'dark' ? '라이트로 보기' : '다크로 보기'}
          </button>
          <button type="button" className="dl-chip is-on" onClick={() => setReplay((n) => n + 1)}>
            A 현상 다시 보기
          </button>
        </div>
      </header>

      {isLoading ? (
        <p className="dl-empty">불러오는 중…</p>
      ) : list.length === 0 ? (
        <p className="dl-empty">표시할 분이 없어요</p>
      ) : (
        VARIANTS.map((v) => (
          <section key={v.key} className="dl-section">
            <div className="dl-note">
              <strong>
                {v.key.toUpperCase()}. {v.name}
              </strong>
              <span className="mo-how">{v.how}</span>
              <span className="mo-bench">참고: {v.bench}</span>
              <p>{v.idea}</p>
            </div>
            <div className={`ppl-grid dl-grid mo-v-${v.key}`} key={v.key === 'a' ? `a${replay}` : v.key}>
              {list.map((p, i) => (
                <MotionCard key={p.id} person={p} index={i} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

// 화면에 들어오면 .is-in — A 현상은 이때 한 번 재생
const useInView = () => {
  const ref = useRef<HTMLButtonElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, inView }
}

const MotionCard = ({ person, index }: { person: Person; index: number }) => {
  const name = personText(person, 'name', 'ko')
  const role = personText(person, 'role', 'ko')
  const field = personText(person, 'field', 'ko')
  const group = personText(person, 'group', 'ko')
  const { ref, inView } = useInView()

  return (
    <div className="dl-stack">
      <button
        ref={ref}
        type="button"
        className={`ppl-card is-static mo-card ${inView ? 'is-in' : ''}`}
        style={{ ['--i' as string]: index }}
      >
        <span className="ppl-card-photo">
          {person.photo_url ? (
            <img src={person.photo_url} alt={name} />
          ) : (
            <span className="ppl-card-initial">{personInitial(name)}</span>
          )}
          <span className="mo-develop" aria-hidden />
          <span className="mo-sweep" aria-hidden />
          <span className="mo-stickers" aria-hidden>
            <span className="mo-sticker is-heart">
              <svg viewBox="0 0 24 24">
                <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
              </svg>
            </span>
            <span className="mo-sticker is-spark">
              <svg viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
              </svg>
            </span>
            <span className="mo-sticker is-sprout">
              <svg viewBox="0 0 24 24">
                <path d="M12 22v-9M12 13c0-4-3-7-8-7 0 4 3 7 8 7zM12 11c0-4 3-7 8-7 0 4-3 7-8 7z" />
              </svg>
            </span>
          </span>
          <span className="mo-glass" aria-hidden>
            <span className="mo-glass-hi">샬롬! 반가워요</span>
            <span className="mo-glass-sub">{field || group || role}</span>
          </span>
        </span>
        <span className="ppl-card-body">
          <span className="ppl-card-name">
            <span className="mo-name">
              {name}
              <svg className="mo-underline" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden>
                <path pathLength={1} d="M2 8 C 20 3, 40 11, 60 6 S 90 4, 98 7" />
              </svg>
            </span>
            {role && <span className="ppl-card-role">{role}</span>}
            <svg className="mo-doodle-heart" viewBox="0 0 24 24" aria-hidden>
              <path
                pathLength={1}
                d="M12 20c-5-3.5-8-6.5-8-10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 3.5-3 6.5-8 10z"
              />
            </svg>
          </span>
          {(field || group) && <span className="ppl-card-sub">{field || group}</span>}
        </span>
        <span className="mo-beam" aria-hidden />
      </button>
    </div>
  )
}

export default PeopleMotionLab
