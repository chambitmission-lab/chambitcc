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

// 단계별 컬러 — Lv1 회색 꼬맨자국 → Lv7 황금빛
const STAGE_PALETTE: Record<
  number,
  { fur: string; furShadow: string; cheek: string; outline: string; aura?: string }
> = {
  1: { fur: '#cfcfcf', furShadow: '#9c9c9c', cheek: '#ffb8c4', outline: '#5b5b5b' },
  2: { fur: '#f5f5f5', furShadow: '#cfcfcf', cheek: '#ffb8c4', outline: '#3f3f46' },
  3: { fur: '#fff8e1', furShadow: '#e6dca8', cheek: '#ffb8c4', outline: '#3f3f46' },
  4: { fur: '#e6f1ff', furShadow: '#b8d3f0', cheek: '#ffb8c4', outline: '#1e3a8a' },
  5: { fur: '#f5e6ff', furShadow: '#d4b8f0', cheek: '#ffb8c4', outline: '#581c87' },
  6: { fur: '#ffe6e6', furShadow: '#f0b8b8', cheek: '#ffb8c4', outline: '#7f1d1d' },
  7: {
    fur: '#fff5cc',
    furShadow: '#facc15',
    cheek: '#ffb8c4',
    outline: '#92400e',
    aura: '#fde68a',
  },
}

function getPalette(stage: number) {
  const s = Math.max(1, Math.min(7, stage))
  return STAGE_PALETTE[s]
}

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
  const dirty = stage === 1 // Lv1만 더러운 얼룩

  // 표정
  const eyesClosed = mood === 'sleep'
  const happyMouth = mood === 'happy' || mood === 'excited'
  const sadMouth = mood === 'sad'

  // 입력 mood에 맞춘 idle 변형
  const breath = staticPose
    ? {}
    : { y: mood === 'excited' ? [0, -5, 0] : [0, -2, 0] }
  const breathDuration = mood === 'excited' ? 0.45 : 1.6

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
        aria-label={`전신갑주 토끼 Lv${stage}`}
      >
        {/* 그림자 */}
        <ellipse cx="100" cy="180" rx="48" ry="6" fill="rgba(0,0,0,0.28)" />

        {/* Lv7 후광 */}
        {palette.aura && (
          <motion.circle
            cx="100"
            cy="90"
            r="80"
            fill={palette.aura}
            opacity="0.35"
            animate={{ opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
        )}

        {/* 귀 (뒤) */}
        <Ear side="left" palette={palette} mood={mood} />
        <Ear side="right" palette={palette} mood={mood} />

        {/* 몸통 */}
        <ellipse
          cx="100"
          cy="135"
          rx="48"
          ry="42"
          fill={palette.fur}
          stroke={palette.outline}
          strokeWidth="2"
        />
        {/* 몸통 그림자 */}
        <ellipse cx="100" cy="155" rx="40" ry="18" fill={palette.furShadow} opacity="0.45" />

        {/* 가슴 갑옷 (chest 슬롯) */}
        {equipped.chest === 'breastplate_of_righteousness' && <Breastplate stage={stage} />}

        {/* 허리띠 (belt) */}
        {equipped.belt === 'belt_of_truth' && <Belt />}

        {/* 발 (feet) */}
        <Foot side="left" palette={palette} />
        <Foot side="right" palette={palette} />
        {equipped.feet === 'shoes_of_peace' && <Shoes />}

        {/* 머리 */}
        <circle
          cx="100"
          cy="85"
          r="48"
          fill={palette.fur}
          stroke={palette.outline}
          strokeWidth="2"
        />

        {/* 꼬맨자국 (Lv1~2) */}
        {showStitch && (
          <g stroke={palette.outline} strokeWidth="1.5" fill="none">
            <path d="M 60 70 Q 65 65 70 70" />
            <line x1="62" y1="70" x2="64" y2="66" />
            <line x1="65" y1="71" x2="67" y2="67" />
            <line x1="68" y1="71" x2="70" y2="67" />
          </g>
        )}
        {/* 얼룩 (Lv1) */}
        {dirty && (
          <>
            <ellipse cx="135" cy="100" rx="6" ry="4" fill={palette.furShadow} opacity="0.6" />
            <ellipse cx="80" cy="130" rx="4" ry="3" fill={palette.furShadow} opacity="0.5" />
          </>
        )}

        {/* 얼굴 안쪽 */}
        <ellipse cx="100" cy="98" rx="22" ry="20" fill="#fde4cf" opacity="0.85" />

        {/* 눈 */}
        {eyesClosed ? (
          <>
            <path
              d="M 82 92 Q 87 96 92 92"
              stroke={palette.outline}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 108 92 Q 113 96 118 92"
              stroke={palette.outline}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <ellipse cx="87" cy="93" rx="3.5" ry="5" fill={palette.outline} />
            <ellipse cx="113" cy="93" rx="3.5" ry="5" fill={palette.outline} />
            <circle cx="88" cy="91" r="1.2" fill="#fff" />
            <circle cx="114" cy="91" r="1.2" fill="#fff" />
          </>
        )}

        {/* 코 */}
        <path d="M 96 102 L 104 102 L 100 107 Z" fill={palette.outline} />

        {/* 입 */}
        {sadMouth ? (
          <path
            d="M 92 117 Q 100 110 108 117"
            stroke={palette.outline}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        ) : happyMouth ? (
          <path
            d="M 90 110 Q 100 122 110 110"
            stroke={palette.outline}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M 92 112 Q 100 116 108 112"
            stroke={palette.outline}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* 볼 */}
        <ellipse cx="78" cy="108" rx="4" ry="2.5" fill={palette.cheek} opacity="0.7" />
        <ellipse cx="122" cy="108" rx="4" ry="2.5" fill={palette.cheek} opacity="0.7" />

        {/* 방패 (shield) */}
        {equipped.shield === 'shield_of_faith' && <Shield />}

        {/* 검 (weapon) */}
        {equipped.weapon === 'sword_of_spirit' && <Sword />}

        {/* 투구 (helmet) */}
        {equipped.helmet === 'helmet_of_salvation' && <Helmet />}

        {/* 면류관 (accessory) */}
        {equipped.accessory === 'crown_of_life' && <Crown />}
      </svg>
    </motion.div>
  )
}

// ----------------- 부위/장비 컴포넌트 -----------------

function Ear({
  side,
  palette,
  mood,
}: {
  side: 'left' | 'right'
  palette: ReturnType<typeof getPalette>
  mood: RabbitMood
}) {
  const isLeft = side === 'left'
  const baseRotate = isLeft ? -10 : 10
  const wiggle = mood === 'idle' ? [baseRotate, baseRotate + 6, baseRotate] : [baseRotate]

  return (
    <motion.g
      style={{ transformOrigin: isLeft ? '78px 65px' : '122px 65px' }}
      animate={{ rotate: wiggle }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ellipse
        cx={isLeft ? 78 : 122}
        cy={45}
        rx={11}
        ry={32}
        fill={palette.fur}
        stroke={palette.outline}
        strokeWidth="2"
      />
      {/* 귓속 분홍 */}
      <ellipse cx={isLeft ? 78 : 122} cy={45} rx={5} ry={22} fill="#fbcfe8" opacity="0.7" />
    </motion.g>
  )
}

function Foot({
  side,
  palette,
}: {
  side: 'left' | 'right'
  palette: ReturnType<typeof getPalette>
}) {
  const x = side === 'left' ? 78 : 122
  return (
    <ellipse
      cx={x}
      cy={172}
      rx={14}
      ry={6}
      fill={palette.fur}
      stroke={palette.outline}
      strokeWidth="1.5"
    />
  )
}

function Shoes() {
  return (
    <>
      <ellipse cx="78" cy="172" rx="15" ry="6" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="1.5" />
      <ellipse cx="122" cy="172" rx="15" ry="6" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="1.5" />
      {/* 작은 빛 */}
      <circle cx="74" cy="170" r="1.5" fill="#fff" opacity="0.8" />
      <circle cx="118" cy="170" r="1.5" fill="#fff" opacity="0.8" />
    </>
  )
}

function Belt() {
  return (
    <g>
      <rect x="62" y="148" width="76" height="8" fill="#a16207" stroke="#451a03" strokeWidth="1.2" />
      <rect x="95" y="146" width="10" height="12" fill="#facc15" stroke="#92400e" strokeWidth="1" />
      <text
        x="100"
        y="156"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="#451a03"
      >
        眞
      </text>
    </g>
  )
}

function Breastplate({ stage }: { stage: number }) {
  const color = stage >= 6 ? '#fbbf24' : '#cbd5e1'
  const stroke = stage >= 6 ? '#92400e' : '#475569'
  return (
    <g>
      <path
        d="M 70 110 Q 100 100 130 110 L 130 150 Q 100 158 70 150 Z"
        fill={color}
        stroke={stroke}
        strokeWidth="2"
      />
      {/* 십자가 엠블럼 */}
      <rect x="97" y="118" width="6" height="22" fill={stroke} />
      <rect x="91" y="125" width="18" height="6" fill={stroke} />
    </g>
  )
}

function Shield() {
  return (
    <g>
      {/* 왼쪽 손에 든 방패 */}
      <path
        d="M 38 130 Q 30 120 38 108 Q 50 105 60 110 Q 65 120 60 138 Q 50 145 38 130 Z"
        fill="#dc2626"
        stroke="#7f1d1d"
        strokeWidth="2"
      />
      <rect x="44" y="118" width="3" height="14" fill="#fde68a" />
      <rect x="40" y="123" width="11" height="3" fill="#fde68a" />
    </g>
  )
}

function Sword() {
  return (
    <g>
      {/* 오른쪽 손에 든 검 — 위로 치켜듦 */}
      <line x1="160" y1="50" x2="160" y2="140" stroke="#e5e7eb" strokeWidth="6" />
      <line
        x1="160"
        y1="50"
        x2="160"
        y2="140"
        stroke="#94a3b8"
        strokeWidth="2"
        opacity="0.7"
      />
      {/* 손잡이 가드 */}
      <rect x="148" y="138" width="24" height="5" fill="#a16207" />
      {/* 손잡이 */}
      <rect x="156" y="143" width="8" height="14" fill="#451a03" />
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
        d="M 56 75 Q 100 28 144 75 L 144 90 Q 100 78 56 90 Z"
        fill="#94a3b8"
        stroke="#1f2937"
        strokeWidth="2"
      />
      {/* 가운데 능선 */}
      <rect x="98" y="38" width="4" height="50" fill="#475569" />
      {/* 빨간 깃털 장식 */}
      <path
        d="M 100 38 Q 110 22 100 8 Q 90 22 100 38"
        fill="#dc2626"
        stroke="#7f1d1d"
        strokeWidth="1"
      />
    </g>
  )
}

function Crown() {
  return (
    <g>
      {/* 면류관 — 머리 꼭대기 */}
      <path
        d="M 70 50 L 80 30 L 90 48 L 100 22 L 110 48 L 120 30 L 130 50 L 130 60 L 70 60 Z"
        fill="#facc15"
        stroke="#a16207"
        strokeWidth="2"
      />
      <circle cx="100" cy="40" r="3" fill="#dc2626" />
      <circle cx="83" cy="45" r="2" fill="#10b981" />
      <circle cx="117" cy="45" r="2" fill="#10b981" />
    </g>
  )
}
