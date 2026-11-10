// /dev/people-hover — 섬기는 사람들 인물 카드 '마우스 오버' 시안 비교 (DEV 전용)
//
// 실제 /people 카드(.ppl-card) 생김새를 그대로 쓰고, 시안마다 겹(빛·말풍선·패널·뒷면)만 얹는다.
// 데이터는 usePeopleDirectory 그대로 — 프록시로 운영 API 를 붙이면 실제 사진으로 본다.
// 포인터 좌표는 리렌더 없이 CSS 변수(--mx/--my 0~1)로만 흘린다.
import { useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePeopleDirectory } from '../../hooks/usePeople'
import { ensureFontFamily } from '../../utils/deferredFonts'
import {
  CATEGORY_LABEL,
  PERSON_CATEGORIES,
  assignmentList,
  personInitial,
  personText,
} from '../../types/people'
import type { Person, PersonCategory } from '../../types/people'
import '../People/people.css'
import './peopleHoverLab.css'

void ensureFontFamily('nanumPen')

interface Variant {
  key: string
  /** 인사 + 새벽빛 묶음 — 그리드에 .lab-lit 빛을 같이 입힌다 */
  lit?: boolean
  name: string
  bench: string
  idea: string
}

const VARIANTS: Variant[] = [
  {
    key: 'a',
    name: '홀로그램 틸트',
    bench: 'Apple TV 포스터 · 포켓몬 카드 홀로',
    idea: '마우스 따라 카드가 3D로 기울고, 사진 위로 빛 반사가 미끄러져요. 사진은 반대로 살짝 움직여 깊이감.',
  },
  {
    key: 'b',
    name: '새벽빛 손전등',
    bench: 'Linear · Vercel 스포트라이트 카드',
    idea: '커서 자리에 따뜻한 빛이 비추고 테두리도 그 자리만 빛나요. 나머지 카드는 살짝 어두워져 한 분에게 시선이 모여요.',
  },
  {
    key: 'c',
    name: '폴라로이드 인사',
    bench: '히어로 사진첩 · Notion 손글씨 말풍선',
    idea: '카드가 살짝 기울며 테이프로 붙은 사진이 되고, 손글씨 말풍선으로 "샬롬!" 인사가 톡 튀어나와요.',
  },
  {
    key: 'd',
    name: '사역 펼침',
    bench: 'Netflix 썸네일 · Dribbble 샷',
    idea: '사진 위로 패널이 올라오며 담당 사역 칩이 하나씩 등장하고, 한 줄 소개와 "자세히" 화살표가 나와요.',
  },
  {
    key: 'e',
    name: '뒤집어 보는 카드',
    bench: '야구 카드 뒷면 · 명함',
    idea: '카드가 휙 뒤집혀 뒷면에 삶의 말씀·섬긴 햇수·담당 사역이 적혀 있어요. (90° 바꿔 끼우기 방식)',
  },
  {
    key: 'f',
    name: '자석 + 빛 링',
    bench: 'Awwwards 마그네틱 버튼 · 인스타 스토리 링',
    idea: '카드가 커서 쪽으로 자석처럼 끌려오고, 사진 둘레에 브랜드 빛 링이 돌며 이름 밑줄이 그어져요.',
  },
  {
    key: 'g',
    lit: true,
    name: '폴라로이드 + 새벽빛',
    bench: 'C + B',
    idea: 'C 폴라로이드 인사에 B 손전등 빛을 더했어요. 커서 자리에 새벽빛이 비추고, 나머지 카드는 한발 물러나요.',
  },
  {
    key: 'h',
    lit: true,
    name: '꾸벅 인사',
    bench: '한국식 인사 · 카카오 이모티콘 모션',
    idea: '사진 속 분이 고개를 꾸벅 숙였다 들며 인사하고, 머리 위로 "꾸벅~ 반갑습니다"가 떠요.',
  },
  {
    key: 'i',
    lit: true,
    name: '채팅 인사',
    bench: '아이메시지 · 카톡 입력 중 표시',
    idea: '점 세 개가 "입력 중…"처럼 통통 튀다가, "안녕하세요! ○○○ 목사예요" 말풍선이 톡 도착해요.',
  },
  {
    key: 'j',
    lit: true,
    name: '이름표 스티커',
    bench: 'HELLO my name is 명찰 · 새가족 환영 스티커',
    idea: '새가족 환영 명찰처럼 "반가워요" 이름표가 사진 위에 탁 붙어요. 이름은 손글씨로.',
  },
  {
    key: 'k',
    lit: true,
    name: '쪽지 인사',
    bench: '주보 사이 손편지 · 포스트잇',
    idea: '사진 아래에서 줄 노트 쪽지가 쏙 올라와, 그분의 한 줄 소개(없으면 기본 인사)를 손글씨로 건네요.',
  },
]

const GREETINGS = ['샬롬!', '안녕하세요', '반가워요 :)', '함께해요', '축복합니다', '주님 안에서!']

const yearsServed = (started?: string | null): number | null => {
  if (!started) return null
  const y = new Date(started).getFullYear()
  if (!Number.isFinite(y)) return null
  return Math.max(0, new Date().getFullYear() - y)
}

// 포인터 → CSS 변수. 리렌더 없음
const track = (e: ReactPointerEvent<HTMLElement>) => {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  el.style.setProperty('--mx', String((e.clientX - r.left) / r.width))
  el.style.setProperty('--my', String((e.clientY - r.top) / r.height))
}
const reset = (e: ReactPointerEvent<HTMLElement>) => {
  const el = e.currentTarget
  el.style.setProperty('--mx', '0.5')
  el.style.setProperty('--my', '0.5')
}

const PeopleHoverLab = () => {
  const [params, setParams] = useSearchParams()
  const vKey = params.get('v') ?? 'a'
  const variant = VARIANTS.find((v) => v.key === vKey) ?? VARIANTS[0]
  const [cat, setCat] = useState<PersonCategory>('pastor')
  const { people, isLoading } = usePeopleDirectory()

  const inCat = people.filter((p) => p.category === cat)
  // 사진 있는 분 먼저 — 시안은 사진 위 효과를 보는 게 목적. 이니셜 카드도 두 장은 섞어 둔다
  const withPhoto = inCat.filter((p) => p.photo_url)
  const noPhoto = inCat.filter((p) => !p.photo_url)
  const list = [...withPhoto.slice(0, 10), ...noPhoto.slice(0, 2)]

  return (
    <div className="lab-page">
      <header className="lab-head">
        <p className="lab-kicker">/people 카드 호버 시안 · DEV</p>
        <h1 className="lab-title">사진에 마우스를 올려 보세요</h1>
        {[false, true].map((lit) => (
        <div key={String(lit)} className="lab-switch" role="tablist">
          <span className="lab-switch-group">{lit ? '인사 + 새벽빛' : '처음 시안'}</span>
          {VARIANTS.filter((v) => !!v.lit === lit).map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={v.key === variant.key}
              className={`lab-switch-btn ${v.key === variant.key ? 'is-on' : ''}`}
              onClick={() => setParams({ v: v.key }, { replace: true })}
            >
              <span className="lab-switch-letter">{v.key.toUpperCase()}</span>
              {v.name}
            </button>
          ))}
        </div>
        ))}
        <div className="lab-note">
          <strong>
            {variant.key.toUpperCase()}. {variant.name}
          </strong>
          <span className="lab-bench">참고: {variant.bench}</span>
          <p>{variant.idea}</p>
        </div>
        <div className="lab-cats">
          {PERSON_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`lab-cat ${c === cat ? 'is-on' : ''}`}
              onClick={() => setCat(c)}
            >
              {CATEGORY_LABEL[c].ko}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <p className="lab-empty">불러오는 중…</p>
      ) : list.length === 0 ? (
        <p className="lab-empty">이 분류에 표시할 분이 없어요 (프록시로 운영 API를 붙였는지 확인)</p>
      ) : (
        <div className={`ppl-grid lab-grid lab-v-${variant.key} ${variant.key === 'b' || variant.lit ? 'lab-lit' : ''}`} key={variant.key + cat}>
          {list.map((person, i) => (
            <LabCard key={person.id} person={person} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

const LabCard = ({ person, index }: { person: Person; index: number }) => {
  const name = personText(person, 'name', 'ko')
  const role = personText(person, 'role', 'ko')
  const field = personText(person, 'field', 'ko')
  const bio = personText(person, 'bio', 'ko')
  const verse = personText(person, 'verse', 'ko')
  const assignments = assignmentList(person, 'ko')
  const years = yearsServed(person.started_on)
  const greet = GREETINGS[person.id % GREETINGS.length]
  // 쪽지 — 소개 첫 문장, 없으면 분류에 맞는 기본 인사
  const slipLine =
    (bio || verse).split(/(?<=[.!?。])\s/)[0]?.slice(0, 44) ||
    (person.category === 'missionary' ? '기도로 함께해 주셔서 고맙습니다' : '늘 기도로 함께할게요')

  const photo = (
    <span className="ppl-card-photo">
      {person.photo_url ? (
        <img src={person.photo_url} alt={name} loading="lazy" />
      ) : (
        <span className="ppl-card-initial">{personInitial(name)}</span>
      )}
      {/* 시안별 겹 — CSS 가 해당 시안에서만 켠다 */}
      <span className="lab-glare" aria-hidden />
      <span className="lab-light" aria-hidden />
      <span className="lab-ring" aria-hidden />
      <span className="lab-bow-tag" aria-hidden>
        꾸벅~ <b>반갑습니다</b>
      </span>
      <span className="lab-chat" aria-hidden>
        <span className="lab-chat-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="lab-chat-msg">
          안녕하세요! <em>{name}</em> {role || '입니다'}{role ? '예요' : ''} :)
        </span>
      </span>
      <span className="lab-tag" aria-hidden>
        <span className="lab-tag-top">
          HELLO
          <small>반가워요, 저는</small>
        </span>
        <span className="lab-tag-name">{name}</span>
      </span>
      <span className="lab-slip" aria-hidden>
        {slipLine}
        <span className="lab-slip-sign">- {name} 드림</span>
      </span>
      <span className="lab-panel">
        {bio && <span className="lab-panel-bio">{bio}</span>}
        {assignments.length > 0 && (
          <span className="lab-panel-chips">
            {assignments.slice(0, 4).map((a, k) => (
              <span key={a} className="lab-panel-chip" style={{ transitionDelay: `${90 + k * 55}ms` }}>
                {a}
              </span>
            ))}
          </span>
        )}
        <span className="lab-panel-more">자세히 보기 →</span>
      </span>
    </span>
  )

  const body = (
    <span className="ppl-card-body">
      <span className="ppl-card-name">
        <span className="lab-name">{name}</span>
        {role && <span className="ppl-card-role">{role}</span>}
      </span>
      {field ? (
        <span className="ppl-card-sub">{field}</span>
      ) : (
        assignments.length > 0 && (
          <span className="ppl-chips">
            {assignments.slice(0, 2).map((item) => (
              <span key={item} className="ppl-chip">
                {item}
              </span>
            ))}
            {assignments.length > 2 && <span className="ppl-chip is-more">+{assignments.length - 2}</span>}
          </span>
        )
      )}
    </span>
  )

  return (
    <button
      type="button"
      className="ppl-card lab-card"
      style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
      onPointerMove={track}
      onPointerLeave={reset}
    >
      <span className="lab-tape" aria-hidden />
      <span className="lab-bubble" aria-hidden>
        {greet}
      </span>

      <span className="lab-front">
        {photo}
        {body}
      </span>

      {/* E 시안 뒷면 */}
      <span className="lab-back" aria-hidden>
        <span className="lab-back-head">
          {person.photo_url ? (
            <img src={person.photo_url} alt="" />
          ) : (
            <span className="lab-back-initial">{personInitial(name)}</span>
          )}
          <span>
            <span className="lab-back-name">{name}</span>
            <span className="lab-back-role">{role}</span>
          </span>
        </span>
        {verse ? (
          <span className="lab-back-verse">“{verse}”</span>
        ) : bio ? (
          <span className="lab-back-verse">{bio}</span>
        ) : (
          <span className="lab-back-verse is-soft">참빛교회와 함께 섬기고 있어요</span>
        )}
        {years !== null && years > 0 && (
          <span className="lab-back-years">
            <strong>{years}</strong>년째 함께
          </span>
        )}
        {assignments.length > 0 && (
          <span className="lab-back-list">
            {assignments.slice(0, 4).map((a) => (
              <span key={a}>· {a}</span>
            ))}
          </span>
        )}
        <span className="lab-back-more">눌러서 자세히</span>
      </span>
    </button>
  )
}

export default PeopleHoverLab
