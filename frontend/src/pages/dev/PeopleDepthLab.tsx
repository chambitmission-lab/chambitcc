// /dev/people-depth — 섬기는 사람들 사진 카드 '입체감' 시안 비교 (DEV 전용)
//
// 실제 /people 카드(.ppl-card) 위에 시안별 정적 효과만 얹는다. 움직임·기울기·확대 없음
// (어르신 어지러움 — 카드와 사진은 제자리, 빛·그림자·겹으로만 깊이를 낸다).
// 모든 시안을 한 화면에 줄로 늘어놓아 바로 비교한다. 데이터는 usePeopleDirectory 그대로.
import { useState } from 'react'
import { usePeopleDirectory } from '../../hooks/usePeople'
import { useTheme } from '../../contexts/ThemeContext'
import { CATEGORY_LABEL, PERSON_CATEGORIES, personInitial, personText } from '../../types/people'
import type { Person, PersonCategory } from '../../types/people'
import '../People/people.css'
import './peopleDepthLab.css'

const VARIANTS = [
  { key: 'base', name: '지금 화면', idea: '방금 넣은 세 겹 그림자만. 비교 기준이에요.' },
  {
    key: 'a',
    name: '창문 깊이',
    idea: '사진 위쪽 가장자리에 안쪽 그림자를 넣어 사진이 카드 안으로 한 단 들어가 보여요. 창문 너머를 보는 느낌.',
  },
  {
    key: 'b',
    name: '인화지 광택',
    idea: '왼쪽 위에서 비스듬히 비치는 옅은 광택 + 아래 모서리 비네트. 막 뽑은 유광 사진처럼 면이 살아나요.',
  },
  {
    key: 'c',
    name: '액자 매트',
    idea: '사진 둘레에 흰 여백(매트)을 두고 사진을 그 안에 파묻었어요. 액자에 끼운 인물 사진처럼 한 겹 깊어요.',
  },
  {
    key: 'd',
    name: '사진 겹쳐 쌓기',
    idea: '카드 뒤에 종이 두 장이 살짝 비껴 깔려 있어요(고정, 움직이지 않음). 사진첩에서 꺼낸 묶음 느낌.',
  },
  {
    key: 'e',
    name: '두께 있는 타일',
    idea: '카드 아래에 얇은 옆면(두께)을 그려 실물 카드·명패처럼 보여요. 위 모서리엔 빛 한 줄.',
  },
  {
    key: 'f',
    name: '이름판 띄우기',
    idea: '이름판이 사진 아래쪽에 겹쳐 한 단 더 떠 있어요. 사진 → 이름판 → 그림자, 세 층으로 깊이가 생겨요.',
  },
] as const

const PeopleDepthLab = () => {
  const [cat, setCat] = useState<PersonCategory>('pastor')
  const { people, isLoading } = usePeopleDirectory()
  const { theme, toggleTheme } = useTheme()

  const inCat = people.filter((p) => p.category === cat)
  const withPhoto = inCat.filter((p) => p.photo_url)
  const list = (withPhoto.length >= 4 ? withPhoto : inCat).slice(0, 4)

  return (
    <div className="dl-page">
      <header className="dl-head">
        <p className="dl-kicker">/people 사진 카드 입체감 시안 · DEV</p>
        <h1 className="dl-title">사진을 좀 더 입체적으로</h1>
        <p className="dl-sub">모두 정적 효과예요 — 카드·사진은 움직이지 않아요.</p>
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
        </div>
        <nav className="dl-jump">
          {VARIANTS.map((v) => (
            <a key={v.key} href={`#dl-${v.key}`} onClick={(e) => {
              e.preventDefault()
              document.getElementById(`dl-${v.key}`)?.scrollIntoView({ block: 'start' })
            }}>
              {v.key === 'base' ? '기준' : v.key.toUpperCase()} {v.name}
            </a>
          ))}
        </nav>
      </header>

      {isLoading ? (
        <p className="dl-empty">불러오는 중…</p>
      ) : list.length === 0 ? (
        <p className="dl-empty">표시할 분이 없어요</p>
      ) : (
        VARIANTS.map((v) => (
          <section key={v.key} id={`dl-${v.key}`} className="dl-section">
            <div className="dl-note">
              <strong>
                {v.key === 'base' ? '기준' : v.key.toUpperCase()}. {v.name}
              </strong>
              <p>{v.idea}</p>
            </div>
            <div className={`ppl-grid dl-grid dl-v-${v.key}`}>
              {list.map((p) => (
                <DepthCard key={p.id} person={p} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

const DepthCard = ({ person }: { person: Person }) => {
  const name = personText(person, 'name', 'ko')
  const role = personText(person, 'role', 'ko')
  const field = personText(person, 'field', 'ko')
  const group = personText(person, 'group', 'ko')
  return (
    <div className="dl-stack">
      <button type="button" className="ppl-card is-static dl-card">
        <span className="ppl-card-photo">
          {person.photo_url ? (
            <img src={person.photo_url} alt={name} />
          ) : (
            <span className="ppl-card-initial">{personInitial(name)}</span>
          )}
          <span className="dl-fx" aria-hidden />
        </span>
        <span className="ppl-card-body">
          <span className="ppl-card-name">
            {name}
            {role && <span className="ppl-card-role">{role}</span>}
          </span>
          {(field || group) && <span className="ppl-card-sub">{field || group}</span>}
        </span>
      </button>
    </div>
  )
}

export default PeopleDepthLab
