import { useId } from 'react'
import { motion } from 'framer-motion'

export type RabbitMood = 'idle' | 'happy' | 'sad' | 'excited' | 'sleep'

export interface RabbitAvatarProps {
  /** 1 ~ 7 단계. 단계가 높을수록 색이 화사하고 큼직해짐 */
  stage?: number
  /** 장착 슬롯 → 보물 코드 */
  equipped?: Record<string, string>
  /** 표정/동작 */
  mood?: RabbitMood
  /** SVG 픽셀 크기 (정사각형) */
  size?: number
  /** idle 호흡 애니메이션 비활성화 */
  staticPose?: boolean
  className?: string
}

// 단계별 컬러 — Lv1 잿빛 꼬맨자국 → Lv7 황금빛.
// 외곽선은 검정 대신 털색을 짙게 낮춘 따뜻한 톤: 수채화 지도 위에서 스티커처럼 뜨지 않게.
const STAGE_PALETTE: Record<
  number,
  { fur: string; furShadow: string; outline: string; aura?: string }
> = {
  1: { fur: '#ddd7ce', furShadow: '#b3a99c', outline: '#857a6d' },
  2: { fur: '#fbf8f3', furShadow: '#ddd3c6', outline: '#a39482' },
  3: { fur: '#fff6dc', furShadow: '#ecd9a6', outline: '#b38f55' },
  4: { fur: '#eef5ff', furShadow: '#c3d7f2', outline: '#6f8fc0' },
  5: { fur: '#f6edff', furShadow: '#d9c4f0', outline: '#9578bd' },
  6: { fur: '#fff0f1', furShadow: '#f1c6cc', outline: '#c27c88' },
  7: { fur: '#fff5cf', furShadow: '#f4cf62', outline: '#b9822a', aura: '#fde68a' },
}

const INK = '#3b2a24' // 눈·입 — 단계와 무관하게 같은 짙은 밤색
const NOSE = '#e8899a'

function getPalette(stage: number) {
  const s = Math.max(1, Math.min(7, stage))
  return STAGE_PALETTE[s]
}

// 몸통 — 아래가 통통한 서양배 모양(머리 뒤로 들어가 이음선이 안 보인다)
const BODY_D =
  'M 100 102 C 132 102 146 128 145 150 C 144 170 126 179 100 179 C 74 179 56 170 55 150 C 54 128 68 102 100 102 Z'

export default function RabbitAvatar({
  stage = 1,
  equipped = {},
  mood = 'idle',
  size = 64,
  staticPose = false,
  className,
}: RabbitAvatarProps) {
  const palette = getPalette(stage)
  const showStitch = stage <= 2 // 꼬맨자국은 Lv1~2만
  const dirty = stage === 1 // Lv1만 얼룩
  const uid = useId().replace(/:/g, '')
  const furId = `rb-fur-${uid}`
  const cheekId = `rb-cheek-${uid}`
  const shadowId = `rb-shadow-${uid}`
  const auraId = `rb-aura-${uid}`
  const bodyClipId = `rb-body-${uid}`

  // 표정
  const eyesClosed = mood === 'sleep'
  const happyMouth = mood === 'happy' || mood === 'excited'
  const sadMouth = mood === 'sad'

  // 입력 mood에 맞춘 idle 변형
  const breath = staticPose
    ? {}
    : { y: mood === 'excited' ? [0, -5, 0] : [0, -2, 0] }
  const breathDuration = mood === 'excited' ? 0.45 : 1.6

  const furFill = `url(#${furId})`
  const line = { stroke: palette.outline, strokeWidth: 3 }

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size, display: 'inline-block' }}
      animate={breath}
      transition={{ duration: breathDuration, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-label={`전신갑주 토끼 Lv${stage}`}
      >
        <defs>
          {/* 왼쪽 위에서 빛이 드는 털 — 가운데 밝고 가장자리로 갈수록 은은한 그늘 */}
          <radialGradient id={furId} cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor={palette.fur} />
            <stop offset="100%" stopColor={palette.furShadow} />
          </radialGradient>
          <radialGradient id={cheekId}>
            <stop offset="0%" stopColor="#ff9fb2" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ff9fb2" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={shadowId}>
            <stop offset="0%" stopColor="#5a4126" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#5a4126" stopOpacity="0" />
          </radialGradient>
          {palette.aura && (
            <radialGradient id={auraId}>
              <stop offset="0%" stopColor={palette.aura} stopOpacity="0.9" />
              <stop offset="100%" stopColor={palette.aura} stopOpacity="0" />
            </radialGradient>
          )}
          <clipPath id={bodyClipId}>
            <path d={BODY_D} />
          </clipPath>
        </defs>

        {/* 그림자 — 가장자리가 번지는 둥근 그늘 */}
        <ellipse cx="100" cy="182" rx="54" ry="9" fill={`url(#${shadowId})`} />

        {/* Lv7 후광 */}
        {palette.aura && (
          <motion.circle
            cx="100"
            cy="92"
            r="88"
            fill={`url(#${auraId})`}
            animate={{ opacity: [0.45, 0.85, 0.45] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
        )}

        {/* 등 뒤 장비 — 몸통/머리 뒤에 그려 살짝 보이게 */}
        {equipped.back === 'golden_cross' && <GoldenCross />}
        {equipped.banner === 'trumpet_of_faith' && <Banner />}

        {/* 귀 (뒤) */}
        <Ear side="left" palette={palette} mood={mood} furFill={furFill} />
        <Ear side="right" palette={palette} mood={mood} furFill={furFill} />

        {/* 몸통 + 하얀 배 */}
        <path d={BODY_D} fill={furFill} {...line} />
        <ellipse cx="100" cy="152" rx="27" ry="21" fill="#ffffff" opacity="0.55" />

        {/* 가슴 갑옷·허리띠 — 몸 실루엣 안으로 잘라 둥근 몸을 따라가게 */}
        <g clipPath={`url(#${bodyClipId})`}>
          {equipped.chest === 'breastplate_of_righteousness' && <Breastplate stage={stage} />}
          {equipped.belt === 'belt_of_truth' && <Belt />}
        </g>
        {equipped.belt === 'belt_of_truth' && <BeltBuckle />}

        {/* 앞발 */}
        <ellipse cx="66" cy="140" rx="9" ry="12" transform="rotate(18 66 140)" fill={furFill} {...line} strokeWidth={2.5} />
        <ellipse cx="134" cy="140" rx="9" ry="12" transform="rotate(-18 134 140)" fill={furFill} {...line} strokeWidth={2.5} />

        {/* 뒷발 */}
        <Foot side="left" palette={palette} furFill={furFill} />
        <Foot side="right" palette={palette} furFill={furFill} />
        {equipped.feet === 'shoes_of_peace' && <Shoes />}

        {/* 머리 — 가로로 살짝 넓은 찹쌀떡 */}
        <ellipse cx="100" cy="86" rx="53" ry="46" fill={furFill} {...line} />

        {/* 꼬맨자국 (Lv1~2) */}
        {showStitch && (
          <g stroke={palette.outline} strokeWidth="1.8" fill="none" opacity="0.8">
            <path d="M 60 70 Q 66 64 72 69" />
            <line x1="62" y1="70" x2="64" y2="65" />
            <line x1="66" y1="69" x2="67" y2="64" />
            <line x1="70" y1="69" x2="71" y2="65" />
          </g>
        )}
        {/* 얼룩 (Lv1) */}
        {dirty && (
          <>
            <ellipse cx="134" cy="102" rx="7" ry="4.5" fill={palette.furShadow} opacity="0.55" />
            <ellipse cx="82" cy="164" rx="5" ry="3.5" fill={palette.furShadow} opacity="0.5" />
          </>
        )}

        {/* 볼 — 번지는 분홍 */}
        <ellipse cx="74" cy="104" rx="11" ry="7" fill={`url(#${cheekId})`} />
        <ellipse cx="126" cy="104" rx="11" ry="7" fill={`url(#${cheekId})`} />

        {/* 눈 */}
        {eyesClosed ? (
          <>
            <path d="M 78 92 Q 84 97 90 92" stroke={INK} strokeWidth="2.6" fill="none" />
            <path d="M 110 92 Q 116 97 122 92" stroke={INK} strokeWidth="2.6" fill="none" />
          </>
        ) : happyMouth ? (
          // 웃는 눈 — 반달
          <>
            <path d="M 78 94 Q 84 86 90 94" stroke={INK} strokeWidth="2.8" fill="none" />
            <path d="M 110 94 Q 116 86 122 94" stroke={INK} strokeWidth="2.8" fill="none" />
          </>
        ) : (
          <>
            <ellipse cx="84" cy="92" rx="5.5" ry="7" fill={INK} />
            <ellipse cx="116" cy="92" rx="5.5" ry="7" fill={INK} />
            <circle cx="86" cy="89" r="2.2" fill="#fff" />
            <circle cx="118" cy="89" r="2.2" fill="#fff" />
            <circle cx="82.5" cy="95" r="1" fill="#fff" opacity="0.8" />
            <circle cx="114.5" cy="95" r="1" fill="#fff" opacity="0.8" />
            {sadMouth && (
              <>
                <path d="M 76 82 Q 81 79 87 81" stroke={INK} strokeWidth="1.8" fill="none" opacity="0.7" />
                <path d="M 113 81 Q 119 79 124 82" stroke={INK} strokeWidth="1.8" fill="none" opacity="0.7" />
              </>
            )}
          </>
        )}

        {/* 코 — 둥근 하트 */}
        <path d="M 95.5 100.5 Q 100 98.5 104.5 100.5 Q 105 103.5 100 106 Q 95 103.5 95.5 100.5 Z" fill={NOSE} />

        {/* 입 */}
        {sadMouth ? (
          <path d="M 94 113 Q 100 108.5 106 113" stroke={INK} strokeWidth="2" fill="none" />
        ) : happyMouth ? (
          <path d="M 93.5 108 Q 100 108.5 106.5 108 Q 105 117 100 117 Q 95 117 93.5 108 Z" fill="#c95c6e" stroke={INK} strokeWidth="1.6" />
        ) : (
          // ω
          <path d="M 93 108 Q 96.5 112 100 108 Q 103.5 112 107 108" stroke={INK} strokeWidth="1.9" fill="none" />
        )}

        {/* 방패 (shield) */}
        {equipped.shield === 'shield_of_faith' && <Shield />}

        {/* 검 (weapon) */}
        {equipped.weapon === 'sword_of_spirit' && <Sword />}

        {/* 투구 (helmet) */}
        {equipped.helmet === 'helmet_of_salvation' && <Helmet />}

        {/* 면류관 (accessory) */}
        {equipped.accessory === 'crown_of_life' && <Crown />}

        {/* 두루마리 (scroll) — 허리 옆에 매달림 */}
        {equipped.scroll === 'scroll_of_wisdom' && <Scroll />}

        {/* 등불 (lamp) — 토끼 왼쪽 옆에 떠있는 등잔 */}
        {equipped.lamp === 'lamp_of_word' && <Lamp />}

        {/* 비둘기 (companion) — 우상단 작게 */}
        {equipped.companion === 'dove_of_spirit' && <Dove />}
      </svg>
    </motion.div>
  )
}

// ----------------- 부위/장비 컴포넌트 -----------------

// 귀 — 끝이 둥근 물방울. 오른쪽은 왼쪽을 좌우 반전해 같은 모양을 쓴다.
const EAR_D = 'M 80 70 C 64 66 55 36 60 17 C 63 5 77 3 84 15 C 93 31 93 57 88 68 Z'
const EAR_INNER_D = 'M 79 60 C 70 55 65 36 68 23 C 70 15 77 15 80 23 C 85 35 85 52 83 59 Z'

function Ear({
  side,
  palette,
  mood,
  furFill,
}: {
  side: 'left' | 'right'
  palette: ReturnType<typeof getPalette>
  mood: RabbitMood
  furFill: string
}) {
  const isLeft = side === 'left'
  // 슬플 땐 귀가 바깥으로 축 처진다
  const tilt = mood === 'sad' ? 24 : 8
  const baseRotate = isLeft ? -tilt : tilt
  const wiggle = mood === 'idle' ? [baseRotate, baseRotate + (isLeft ? 5 : -5), baseRotate] : [baseRotate]

  return (
    <motion.g
      style={{ transformOrigin: isLeft ? '82px 66px' : '118px 66px' }}
      animate={{ rotate: wiggle }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <g transform={isLeft ? undefined : 'translate(200 0) scale(-1 1)'}>
        <path d={EAR_D} fill={furFill} stroke={palette.outline} strokeWidth="3" />
        {/* 귓속 분홍 */}
        <path d={EAR_INNER_D} fill="#f9c6d6" opacity="0.85" />
      </g>
    </motion.g>
  )
}

function Foot({
  side,
  palette,
  furFill,
}: {
  side: 'left' | 'right'
  palette: ReturnType<typeof getPalette>
  furFill: string
}) {
  const x = side === 'left' ? 78 : 122
  return (
    <g>
      <ellipse cx={x} cy={173} rx={16} ry={9} fill={furFill} stroke={palette.outline} strokeWidth="2.5" />
      {/* 발바닥 젤리 */}
      <ellipse cx={x} cy={175} rx={5} ry={3} fill="#f9c6d6" opacity="0.8" />
    </g>
  )
}

function Shoes() {
  return (
    <>
      <ellipse cx="78" cy="173" rx="17" ry="9.5" fill="#5bb8ea" stroke="#2f7fb0" strokeWidth="2.5" />
      <ellipse cx="122" cy="173" rx="17" ry="9.5" fill="#5bb8ea" stroke="#2f7fb0" strokeWidth="2.5" />
      {/* 작은 빛 */}
      <ellipse cx="72" cy="169.5" rx="4" ry="2" fill="#fff" opacity="0.75" />
      <ellipse cx="116" cy="169.5" rx="4" ry="2" fill="#fff" opacity="0.75" />
    </>
  )
}

// 띠는 몸 실루엣으로 잘리고(clipPath), 버클만 그 위에 따로 얹는다
function Belt() {
  return (
    <path d="M 40 146 Q 100 154 160 146 L 160 157 Q 100 165 40 157 Z" fill="#b7843f" stroke="#7a5320" strokeWidth="2" />
  )
}

function BeltBuckle() {
  return (
    <g>
      <rect x="92" y="145" width="16" height="15" rx="4.5" fill="#f6cf4a" stroke="#a86e14" strokeWidth="2" />
      <rect x="97" y="149.5" width="6" height="6" rx="1.8" fill="none" stroke="#a86e14" strokeWidth="1.6" />
    </g>
  )
}

function Breastplate({ stage }: { stage: number }) {
  const color = stage >= 6 ? '#f7c948' : '#d5dde8'
  const stroke = stage >= 6 ? '#a86e14' : '#6b7a8f'
  return (
    <g>
      <path
        d="M 64 116 Q 100 104 136 116 Q 142 136 136 152 Q 100 162 64 152 Q 58 136 64 116 Z"
        fill={color}
        stroke={stroke}
        strokeWidth="2.5"
      />
      {/* 광택 */}
      <path d="M 72 120 Q 84 115 92 115" stroke="#fff" strokeWidth="3" fill="none" opacity="0.6" />
      {/* 십자가 엠블럼 */}
      <rect x="97" y="120" width="6" height="22" rx="2.5" fill={stroke} />
      <rect x="90" y="126" width="20" height="6" rx="2.5" fill={stroke} />
    </g>
  )
}

function Shield() {
  return (
    <g>
      {/* 왼쪽 앞발에 든 방패 — 둥근 문장형 */}
      <path
        d="M 34 112 Q 47 104 62 112 Q 66 132 48 148 Q 30 132 34 112 Z"
        fill="#e05a50"
        stroke="#9b2c26"
        strokeWidth="2.5"
      />
      <path d="M 40 115 Q 47 111 54 114" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
      <rect x="45.5" y="117" width="5" height="20" rx="2" fill="#fde68a" />
      <rect x="39" y="123" width="18" height="5" rx="2" fill="#fde68a" />
    </g>
  )
}

function Sword() {
  return (
    <g>
      {/* 오른쪽 앞발에 든 검 — 위로 치켜듦 */}
      <path d="M 155 136 L 155 60 Q 160 48 165 60 L 165 136 Z" fill="#eef1f5" stroke="#8a97a8" strokeWidth="2.2" />
      <line x1="160" y1="62" x2="160" y2="132" stroke="#b9c3cf" strokeWidth="1.6" />
      {/* 손잡이 가드 */}
      <rect x="146" y="135" width="28" height="7" rx="3.5" fill="#c99a3e" stroke="#7a5320" strokeWidth="1.8" />
      {/* 손잡이 */}
      <rect x="156" y="142" width="8" height="15" rx="3" fill="#7a5320" />
      <circle cx="160" cy="159" r="3.5" fill="#c99a3e" stroke="#7a5320" strokeWidth="1.5" />
      {/* 빛 반짝 */}
      <motion.circle
        cx="160"
        cy="80"
        r="3"
        fill="#fde68a"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
    </g>
  )
}

function Helmet() {
  return (
    <g>
      {/* 머리 위 둥근 투구 */}
      <path
        d="M 50 84 Q 48 36 100 34 Q 152 36 150 84 Q 100 72 50 84 Z"
        fill="#aab6c6"
        stroke="#5c6b80"
        strokeWidth="2.5"
      />
      <path d="M 64 62 Q 74 46 92 42" stroke="#fff" strokeWidth="3" fill="none" opacity="0.55" />
      {/* 가운데 능선 */}
      <rect x="97" y="36" width="6" height="40" rx="3" fill="#7d8ba0" />
      {/* 빨간 깃털 장식 */}
      <path d="M 100 38 Q 113 22 101 6 Q 88 22 100 38 Z" fill="#e05a50" stroke="#9b2c26" strokeWidth="1.8" />
    </g>
  )
}

function Crown() {
  return (
    <g transform="translate(0 -6)">
      {/* 면류관 — 머리 꼭대기. 봉우리 끝은 작은 구슬로 둥글게 */}
      <path
        d="M 70 52 L 79 32 L 90 47 L 100 25 L 110 47 L 121 32 L 130 52 Q 131 60 124 60 L 76 60 Q 69 60 70 52 Z"
        fill="#f9d04a"
        stroke="#b07a18"
        strokeWidth="2.5"
      />
      <circle cx="79" cy="31" r="3" fill="#f9d04a" stroke="#b07a18" strokeWidth="1.8" />
      <circle cx="100" cy="24" r="3.4" fill="#f9d04a" stroke="#b07a18" strokeWidth="1.8" />
      <circle cx="121" cy="31" r="3" fill="#f9d04a" stroke="#b07a18" strokeWidth="1.8" />
      <circle cx="100" cy="47" r="3.2" fill="#e05a50" />
      <circle cx="84" cy="52" r="2.2" fill="#34b98a" />
      <circle cx="116" cy="52" r="2.2" fill="#34b98a" />
    </g>
  )
}

function GoldenCross() {
  return (
    <g>
      {/* 등 뒤에서 솟는 후광 */}
      <motion.circle
        cx="100"
        cy="60"
        r="40"
        fill="#fde68a"
        opacity="0.3"
        animate={{ opacity: [0.18, 0.42, 0.18] }}
        transition={{ duration: 2.6, repeat: Infinity }}
      />
      {/* 황금 십자가 — 몸/머리 뒤로 살짝 솟음 */}
      <rect x="95" y="16" width="10" height="84" rx="4" fill="#f9d04a" stroke="#b07a18" strokeWidth="2" />
      <rect x="76" y="38" width="48" height="10" rx="4" fill="#f9d04a" stroke="#b07a18" strokeWidth="2" />
      {/* 빛 반짝 */}
      <motion.circle
        cx="100"
        cy="43"
        r="2.5"
        fill="#fff7d6"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
    </g>
  )
}

function Banner() {
  return (
    <g>
      {/* 깃대 */}
      <line x1="180" y1="170" x2="180" y2="50" stroke="#451a03" strokeWidth="2.4" />
      {/* 끝 장식 (별) */}
      <path
        d="M 180 42 L 182 48 L 188 48 L 183 52 L 185 58 L 180 54 L 175 58 L 177 52 L 172 48 L 178 48 Z"
        fill="#facc15"
        stroke="#a16207"
        strokeWidth="0.8"
      />
      {/* 깃발 — 바람에 흔들림 */}
      <motion.path
        d="M 180 60 L 200 65 L 196 75 L 200 85 L 180 80 Z"
        fill="#dc2626"
        stroke="#7f1d1d"
        strokeWidth="1.2"
        animate={{ x: [0, 1.5, 0, -1.5, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* 깃발 십자가 */}
      <rect x="187" y="66" width="2" height="14" fill="#fff" />
      <rect x="183" y="71" width="10" height="2.5" fill="#fff" />
    </g>
  )
}

function Scroll() {
  return (
    <g>
      {/* 두루마리 — 허리 오른쪽에 매달림 */}
      <ellipse cx="148" cy="148" rx="3" ry="11" fill="#fef3c7" stroke="#92400e" strokeWidth="1.2" />
      <rect x="146" y="140" width="6" height="16" fill="#fef9d3" stroke="#92400e" strokeWidth="1" />
      <line x1="146" y1="144" x2="152" y2="144" stroke="#92400e" strokeWidth="0.5" />
      <line x1="146" y1="148" x2="152" y2="148" stroke="#92400e" strokeWidth="0.5" />
      <line x1="146" y1="152" x2="152" y2="152" stroke="#92400e" strokeWidth="0.5" />
      {/* 빨간 끈 */}
      <ellipse cx="149" cy="158" rx="4" ry="1.5" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.6" />
    </g>
  )
}

function Lamp() {
  return (
    <g>
      {/* 등잔 본체 (머리 옆 좌측 떠있는 등) */}
      <ellipse cx="28" cy="98" rx="10" ry="5" fill="#a16207" stroke="#451a03" strokeWidth="1.2" />
      <path d="M 18 98 L 38 98 L 36 103 L 20 103 Z" fill="#92400e" stroke="#451a03" strokeWidth="1" />
      {/* 손잡이 */}
      <path d="M 36 96 Q 44 92 38 102" fill="none" stroke="#451a03" strokeWidth="1.2" />
      {/* 심지 구멍 */}
      <rect x="14" y="93" width="6" height="5" fill="#a16207" stroke="#451a03" strokeWidth="0.8" />
      {/* 불꽃 */}
      <motion.path
        d="M 17 92 Q 12 84 17 76 Q 22 84 17 92 Z"
        fill="#fbbf24"
        stroke="#dc2626"
        strokeWidth="0.6"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '17px 92px' }}
      />
      <motion.circle
        cx="17"
        cy="84"
        r="2.5"
        fill="#fff7d6"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.7, repeat: Infinity }}
      />
      {/* 따뜻한 빛 */}
      <motion.circle
        cx="17"
        cy="84"
        r="14"
        fill="#fde68a"
        opacity="0.18"
        animate={{ opacity: [0.1, 0.28, 0.1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
    </g>
  )
}

function Dove() {
  return (
    <g>
      {/* 후광 */}
      <motion.circle
        cx="172"
        cy="32"
        r="14"
        fill="#fde68a"
        opacity="0.3"
        animate={{ opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* 날개 위로 펄럭 */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* 몸 */}
        <ellipse cx="170" cy="35" rx="11" ry="6" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
        {/* 머리 */}
        <circle cx="180" cy="32" r="4.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
        {/* 부리 */}
        <path d="M 184 32 L 188 33 L 184 34 Z" fill="#fbbf24" stroke="#a16207" strokeWidth="0.4" />
        {/* 눈 */}
        <circle cx="181" cy="31" r="0.9" fill="#1f2937" />
        {/* 날개 (위로 들린) */}
        <path
          d="M 168 33 Q 162 22 158 30 Q 162 32 168 33 Z"
          fill="#f1f5f9"
          stroke="#94a3b8"
          strokeWidth="1"
        />
        {/* 꼬리 깃 */}
        <path d="M 159 35 L 152 33 L 158 38 Z" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
        {/* 올리브 가지 */}
        <line x1="188" y1="33" x2="196" y2="34" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" />
        <ellipse cx="191" cy="33" rx="1.6" ry="0.8" fill="#16a34a" />
        <ellipse cx="194" cy="34" rx="1.6" ry="0.8" fill="#16a34a" />
      </motion.g>
    </g>
  )
}
