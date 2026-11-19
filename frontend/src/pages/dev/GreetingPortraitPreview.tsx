import type { CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { VISIT_HERO, VISIT_SCENE_PAIR } from '../../utils/themeAssets'
import { ensureFontFamily } from '../../utils/deferredFonts'
import './greetingPortraitPreview.css'

ensureFontFamily('nanumPen')

/**
 * /#/dev/greeting-portrait — /greeting 담임목사 사진 연출 시안.
 *   ?v=fun(기본) 유머 4안 E~H | 3d 입체 4안 A~D | 또는 a~h 하나만
 * 실제 인사말 머리(224px 폭)와 같은 크기. 움직임 없는 정적 효과만(어르신 어지러움).
 * 유머는 "반갑게 인사하는 장난기"까지 — 캐리커처(큰 머리 등)는 목회자 톤에 맞지 않아 뺀다.
 */

const PERSON = '/images/greeting/pastor-cutout.webp'
// 제미나이 '가위로 오린 종이 사진'(흰 여백+칼선) — 종이 윤곽까지 누끼, 그림자는 CSS
const SCISSOR = '/images/greeting/pastor-scissor.webp'

interface Variant {
  key: string
  label: string
  note: string
}

const FUN: Variant[] = [
  { key: 'e', label: 'E. 빼꼼', note: '액자 옆에서 몸을 기울여 빼꼼 — "어서 오세요!" 말풍선' },
  { key: 'f', label: 'F. 다이컷 스티커', note: '두꺼운 흰 테두리 스티커가 수첩에 붙어 있고, 작은 스티커들이 함께' },
  { key: 'g', label: 'G. 폴라로이드 탈출', note: '폴라로이드 밖으로 머리와 책이 삐져나온다. 마스킹테이프 + 손글씨' },
  { key: 'h', label: 'H. HELLO 이름표', note: '가슴에 "HELLO 나는 복있는 사람" 이름표가 붙어 있다' },
]

// E 빼꼼 개선 — 가짜 문 대신 "실제로 있을 법한 것" 뒤에서 내다본다
// 가위로 오린 사진(SCISSOR) × 빼꼼 구도
const CUT: Variant[] = [
  { key: 's1', label: 'S1. 오린 사진 한 장', note: '가위로 오린 사진만 살짝 기울여 올려 둔다 + 말풍선' },
  { key: 's2', label: 'S2. 오린 사진 × 교회 사진', note: 'E1 구도 — 교회 사진 액자 뒤에서 빼꼼' },
  { key: 's3', label: 'S3. 오린 사진 × 편지', note: 'E3 구도 — 편지지 위로 빼꼼' },
  { key: 's4', label: 'S4. 오린 사진 × 폴라로이드', note: 'E4 구도 — 폴라로이드 뒤에서 빼꼼' },
]

const CUT_BASE: Record<string, string> = { s2: 'e1', s3: 'e3', s4: 'e4' }

const PEEK: Variant[] = [
  { key: 'e1', label: 'E1. 교회 사진 뒤에서', note: '참빛교회 실사 사진 액자 오른쪽 모서리 뒤에서 빼꼼' },
  { key: 'e2', label: 'E2. 창틀 밖에서 슬쩍', note: '하늘 창 밖에 서 있다가 몸을 기울여 들여다본다 — 소품 없이 틀 가장자리만' },
  { key: 'e3', label: 'E3. 편지 위로 빼꼼', note: '인사말 편지지 위로 고개를 내밀고, 편지에 손글씨 인사' },
  { key: 'e4', label: 'E4. 스티커 빼꼼 (E+F)', note: '오려 붙인 스티커 목사님이 교회 폴라로이드 뒤에서 빼꼼' },
]

const THREE_D: Variant[] = [
  { key: 'a', label: 'A. 원형 메달', note: '동그란 메달 위로 머리가 솟는다' },
  { key: 'b', label: 'B. 교회 앞 심도', note: '참빛교회 실사를 흐리게 깔고 인물만 또렷' },
  { key: 'c', label: 'C. 비스듬한 액자', note: '실물 액자처럼 기울고 두께·바닥 그림자' },
  { key: 'd', label: 'D. 종이 겹 디오라마', note: '아치 종이 여러 겹 사이에 인물' },
]

function Head() {
  return (
    <div className="gpp-head-text">
      <span className="gpp-chip">담임목사</span>
      <strong className="gpp-title">인생은 만남입니다</strong>
      <span className="gpp-name">담임목사 · 안동철</span>
    </div>
  )
}

function Portrait({ v, src = PERSON }: { v: string; src?: string }) {
  if (v === 's1')
    return (
      <div className="gpp-pk gpp-cut gpp-s1">
        <img className="gpp-person" src={SCISSOR} alt="" />
        <span className="gpp-pk-bubble">어서 오세요!</span>
      </div>
    )
  if (CUT_BASE[v])
    return (
      <div className="gpp-cut">
        <Portrait v={CUT_BASE[v]} src={SCISSOR} />
      </div>
    )
  const img = <img className="gpp-person" src={src} alt="" />
  switch (v) {
    case 'a':
      return (
        <div className="gpp-a">
          <span className="gpp-a-disc" />
          <span className="gpp-a-clip">{img}</span>
        </div>
      )
    case 'b':
      return (
        <div className="gpp-b">
          <span className="gpp-b-bg" />
          <span className="gpp-b-floor" />
          {img}
          <span className="gpp-b-vignette" />
        </div>
      )
    case 'c':
      return (
        <div className="gpp-c">
          <div className="gpp-c-frame">
            <span className="gpp-c-wall" />
            <span className="gpp-c-clip">{img}</span>
          </div>
          <span className="gpp-c-floor" />
        </div>
      )
    case 'd':
      return (
        <div className="gpp-d">
          <span className="gpp-d-layer gpp-d-l1" />
          <span className="gpp-d-layer gpp-d-l2" />
          <span className="gpp-d-clip">{img}</span>
          <span className="gpp-d-front" />
        </div>
      )
    case 'e':
      return (
        <div className="gpp-e">
          <span className="gpp-e-peek">{img}</span>
          <span className="gpp-e-wall">
            <span className="gpp-e-cross" />
          </span>
          <span className="gpp-e-bubble">어서 오세요!</span>
        </div>
      )
    case 'e1':
      return (
        <div className="gpp-pk gpp-e1">
          <span className="gpp-pk-clip">{img}</span>
          <span className="gpp-e1-photo" />
          <span className="gpp-pk-bubble">어서 오세요!</span>
        </div>
      )
    case 'e2':
      return (
        <div className="gpp-pk gpp-e2">
          <span className="gpp-e2-win" />
          <span className="gpp-e2-clip">{img}</span>
          <span className="gpp-pk-bubble gpp-pk-bubble--left">반가워요~</span>
        </div>
      )
    case 'e3':
      return (
        <div className="gpp-pk gpp-e3">
          <span className="gpp-pk-clip">{img}</span>
          <span className="gpp-e3-paper">
            <span className="gpp-e3-hello">어서 오세요!</span>
            <span className="gpp-e3-sign">— 참빛교회에서</span>
          </span>
        </div>
      )
    case 'e4':
      return (
        <div className="gpp-pk gpp-e4">
          <span className="gpp-pk-clip">{img}</span>
          <span className="gpp-e4-polaroid">
            <span className="gpp-e4-photo" />
            <span className="gpp-e4-caption">참빛교회</span>
          </span>
          <span className="gpp-e4-s">반가워요</span>
        </div>
      )
    case 'f':
      return (
        <div className="gpp-f">
          <span className="gpp-f-paper" />
          <span className="gpp-f-sticker">{img}</span>
          <span className="gpp-f-s gpp-f-s1">반가워요</span>
          <span className="gpp-f-s gpp-f-s2">♥</span>
          <span className="gpp-f-s gpp-f-s3">말씀 한 스푼</span>
        </div>
      )
    case 'g':
      return (
        <div className="gpp-g">
          <span className="gpp-g-tape" />
          <span className="gpp-g-polaroid">
            <span className="gpp-g-photo" />
            <span className="gpp-g-caption">복있는 사람 :)</span>
          </span>
          <span className="gpp-g-clip">{img}</span>
        </div>
      )
    default:
      return (
        <div className="gpp-h">
          <span className="gpp-h-bg" />
          <span className="gpp-h-clip">{img}</span>
          <span className="gpp-h-tag">
            <b>HELLO</b>
            <small>나는</small>
            <i>복있는 사람</i>
          </span>
        </div>
      )
  }
}

export default function GreetingPortraitPreview() {
  const [params] = useSearchParams()
  const v = params.get('v') ?? 'cut'
  const all = [...CUT, ...PEEK, ...FUN, ...THREE_D]
  const list =
    v === 'cut' ? CUT : v === 'peek' ? PEEK : v === 'fun' ? FUN : v === '3d' ? THREE_D : all.filter((x) => x.key === v)
  return (
    <div
      className="gpp-page"
      style={
        {
          '--gpp-church-day': `url(${VISIT_HERO.light})`,
          '--gpp-church-night': `url(${VISIT_HERO.dark})`,
          '--gpp-scene-day': `url(${VISIT_SCENE_PAIR.light})`,
          '--gpp-scene-night': `url(${VISIT_SCENE_PAIR.dark})`,
        } as CSSProperties
      }
    >
      <h1 className="gpp-h1">담임목사 사진 시안</h1>
      <p className="gpp-sub">
        가위로 오린 사진 4안(기본) · 빼꼼 4안 <code>?v=peek</code> · 유머 4안 <code>?v=fun</code> · 입체 4안 <code>?v=3d</code>. 왼쪽 아래 야간 모드로 다크도 비교해 보세요.
      </p>
      <div className="gpp-grid">
        {list.map((x) => (
          <section key={x.key} className="gpp-card">
            <header className="gpp-card-h">
              <b>{x.label}</b>
              <span>{x.note}</span>
            </header>
            <div className="gpp-stage">
              <Portrait v={x.key} />
              <Head />
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
