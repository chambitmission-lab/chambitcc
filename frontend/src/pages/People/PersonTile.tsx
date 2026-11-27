// 섬기는 사람들 인물 카드 — /people 격자와 관리 화면(/admin/people) 미리보기가 함께 쓴다
import { MapPin } from '../../components/icons/phosphor'
import CountryFlag from '../../components/common/CountryFlag'
import { assignmentList, personInitial, personText } from '../../types/people'
import type { Person } from '../../types/people'

// 카드 호버 인사 — 같은 분은 늘 같은 인사(이름으로 고른다, 리렌더마다 바뀌지 않게)
const HELLO_KO = ['샬롬!', '안녕하세요', '반가워요 :)', '함께해요', '축복합니다', '주님 안에서!']
const HELLO_EN = ['Shalom!', 'Hello!', 'Nice to meet you', 'Welcome!', 'Blessings!', 'In Christ!']

export const helloFor = (seed: string, language: 'ko' | 'en'): string => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const list = language === 'ko' ? HELLO_KO : HELLO_EN
  return list[h % list.length]
}

// 사진 위 새벽빛 + 인사 말풍선 — 마우스 기기에서만 CSS 가 켠다(장식이라 스크린리더엔 숨김)
export const CardHoverLayers = ({ hello }: { hello: string }) => (
  <>
    <span className="ppl-card-dawn" aria-hidden />
    <span className="ppl-card-hello" aria-hidden>
      {hello}
    </span>
  </>
)

// ── 인물 카드 ─────────────────────────────────────────
const PersonTile = ({
  person,
  index,
  language,
  onOpen,
}: {
  person: Person
  index: number
  language: 'ko' | 'en'
  /** 없으면 눌리지 않는 카드(관리 화면 미리보기) */
  onOpen?: () => void
}) => {
  const name = personText(person, 'name', language)
  const role = personText(person, 'role', language)
  const field = personText(person, 'field', language)
  const assignments = assignmentList(person, language)
  // 선교사는 사역지가 곧 정체성 — 담당 사역보다 먼저 보여준다
  const sub = person.category === 'missionary' ? field : ''

  const inner = (
    <>
      <span className="ppl-card-photo">
        {person.photo_url ? (
          <img src={person.photo_url} alt={name} loading="lazy" />
        ) : (
          <span className="ppl-card-initial">{personInitial(name)}</span>
        )}
        {person.country_code && (
          <span className="ppl-card-flag">
            <CountryFlag code={person.country_code} />
          </span>
        )}
        {onOpen && <CardHoverLayers hello={helloFor(person.name_ko, language)} />}
      </span>

      <span className="ppl-card-body">
        <span className="ppl-card-name">
          {name}
          {role && <span className="ppl-card-role">{role}</span>}
        </span>

        {sub ? (
          <span className="ppl-card-sub">
            <MapPin size={11} weight="duotone" className="inline-block mr-0.5 -mt-0.5" />
            {sub}
          </span>
        ) : (
          assignments.length > 0 && (
            <span className="ppl-chips">
              {assignments.slice(0, 2).map((item) => (
                <span key={item} className="ppl-chip">
                  {item}
                </span>
              ))}
              {assignments.length > 2 && (
                <span className="ppl-chip is-more">+{assignments.length - 2}</span>
              )}
            </span>
          )
        )}
      </span>
    </>
  )

  if (!onOpen) return <div className="ppl-card is-static">{inner}</div>

  return (
    <button
      type="button"
      onClick={onOpen}
      className="ppl-card"
      // 카드가 순서대로 떠오르게 — 6장까지만 지연을 준다(그 뒤는 스크롤 밖)
      style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
    >
      {inner}
    </button>
  )
}

export default PersonTile
