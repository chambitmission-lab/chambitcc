import { useState } from 'react'
import { TitleEquippedChip } from '../../../components/titles/TitleEquippedChip'
import { LambCharacter } from '../../../components/garden/LambCharacter'
import { calculateLambStage } from '../../../utils/gardenCalculator'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { GlowLevel } from '../../../types/achievement'
import './ProfileHeader.css'

interface ProfileHeaderProps {
  username: string
  fullName: string
  glowLevel: GlowLevel
  activityPoints: number
  specialAchievementColor?: string
  thisWeekCount?: number
  totalCount?: number
  streakDays?: number
  pointsToNext?: { needed: number; total: number } | null
}

const ProfileHeader = ({
  username,
  fullName,
  glowLevel,
  activityPoints,
  specialAchievementColor,
  thisWeekCount = 0,
  totalCount = 0,
  streakDays = 0,
  pointsToNext = null,
}: ProfileHeaderProps) => {
  const { t } = useLanguage()
  const [flipped, setFlipped] = useState(false)
  const auraColor = specialAchievementColor || glowLevel.glowColor
  const serial = `LIGHT-${String(glowLevel.level).padStart(2, '0')}`
  const lambStage = calculateLambStage(activityPoints)
  const nextProgress = pointsToNext
    ? ((pointsToNext.total - pointsToNext.needed) / pointsToNext.total) * 100
    : 100

  const cardFrame = `
    relative w-full overflow-hidden rounded-[20px]
    border border-white/[0.14] bg-[#14111d]
    shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(168,85,247,0.12),0_8px_32px_rgba(168,85,247,0.22)]
  `

  return (
    <div className="flex justify-center px-4 pt-6 pb-3">
      <div className="ph-flip-scene w-full max-w-[310px]">
        <div
          className={`ph-flip-inner ${flipped ? 'ph-flipped' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={flipped ? '카드 앞면 보기' : '카드 뒷면 보기'}
          onClick={() => setFlipped((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setFlipped((v) => !v)
            }
          }}
        >
          {/* ================= 앞면 ================= */}
          <div className={`ph-face ${cardFrame}`}>
            <div className="ph-holo" aria-hidden="true" />
            <span className="ph-shine" aria-hidden="true" />
            <div
              className="pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full blur-3xl opacity-35"
              style={{ background: auraColor }}
              aria-hidden="true"
            />

            {/* 카드 헤더 — 브랜드 + 시리얼 */}
            <div className="relative z-10 flex items-center justify-between px-4 pt-3.5">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
                Chambit
              </span>
              <span
                className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
                style={{ color: auraColor, textShadow: `0 0 10px ${auraColor}` }}
              >
                Serial No. {serial}
              </span>
            </div>

            {/* 메인 그래픽 존 — 유리 질감 패널 */}
            <div className="relative z-10 mx-3 mt-3 overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.05] px-4 pb-5 pt-6 text-center backdrop-blur-sm">
              <span
                className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 select-none text-[110px] font-black italic leading-none text-transparent"
                style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.09)' }}
                aria-hidden="true"
              >
                {String(glowLevel.level).padStart(2, '0')}
              </span>

              <div
                className="relative mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em]"
                style={{ color: auraColor, textShadow: `0 0 12px ${auraColor}` }}
              >
                Lv.{glowLevel.level} · {t(glowLevel.nameKey)}
              </div>

              <h2
                className="relative m-0 bg-gradient-to-b from-white via-white to-purple-200/80 bg-clip-text text-[38px] font-black italic leading-[1.1] tracking-[-0.03em] text-transparent"
                style={{
                  filter: `drop-shadow(0 2px 14px ${auraColor})`,
                  wordBreak: 'keep-all',
                }}
              >
                {fullName}
              </h2>
              <p className="relative mt-1 text-[11.5px] font-semibold tracking-[0.08em] text-white/45">
                @{username}
              </p>

              {/* 칭호 클릭은 플립 대신 칭호 페이지로 */}
              <div
                className="relative mt-2.5 flex justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <TitleEquippedChip variant="slot" />
              </div>
            </div>

            {/* 스탯 라인 */}
            <div className="relative z-10 mx-3 mt-3 grid grid-cols-3 divide-x divide-white/[0.08] rounded-xl border border-white/[0.08] bg-white/[0.03]">
              <CardStat value={totalCount} label={t('totalPrayers')} />
              <CardStat value={thisWeekCount} label={t('profileThisWeek')} />
              <CardStat value={streakDays} label={t('consecutivePrayers')} />
            </div>

            {/* 바코드 + 풋터 */}
            <div className="relative z-10 px-4 pb-2.5 pt-3">
              <div className="flex items-end justify-between gap-3">
                <div className="ph-barcode w-28 opacity-70" aria-hidden="true" />
                <span className="pb-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40 tabular-nums">
                  {activityPoints.toLocaleString()} PTS · @{username}
                </span>
              </div>
              <div className="mt-1.5 text-center text-[8.5px] font-semibold uppercase tracking-[0.28em] text-white/25">
                Tap to flip
              </div>
            </div>
          </div>

          {/* ================= 뒷면 ================= */}
          <div className={`ph-face ph-face-back ${cardFrame}`}>
            <div className="ph-holo" aria-hidden="true" />
            <div
              className="pointer-events-none absolute -bottom-14 -left-14 h-40 w-40 rounded-full blur-3xl opacity-35"
              style={{ background: auraColor }}
              aria-hidden="true"
            />

            <div className="relative z-10 flex h-full flex-col">
              {/* 뒷면 헤더 */}
              <div className="flex items-center justify-between px-4 pt-3.5">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
                  Chambit
                </span>
                <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/35">
                  Official Mascot
                </span>
              </div>

              {/* 마스코트 — 등급 링 안의 어린 양 */}
              <div className="mt-3 flex flex-1 flex-col items-center justify-center px-4">
                <div
                  className="rounded-full p-[3px]"
                  style={{
                    background: `conic-gradient(from 210deg, ${auraColor}, rgba(168,85,247,0.9), rgba(236,72,153,0.9), ${auraColor})`,
                    boxShadow: `0 0 22px ${auraColor}`,
                  }}
                >
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#211d2e]">
                    <LambCharacter
                      stage={lambStage}
                      points={activityPoints}
                      size={78}
                      showInfo={false}
                      variant="avatar"
                    />
                  </div>
                </div>

                <div className="mt-2.5 text-[15px] font-bold tracking-[-0.01em] text-white">
                  {lambStage.name}
                </div>
                <p
                  className="mx-2 mt-1 mb-0 text-center text-[11px] leading-[1.5] text-white/50"
                  style={{ wordBreak: 'keep-all' }}
                >
                  {lambStage.description}
                </p>

                {/* 다음 레벨 게이지 */}
                <div className="mt-3.5 w-full max-w-[220px]">
                  <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.12em]">
                    <span className="text-white/40">Next Level</span>
                    <span style={{ color: auraColor }}>
                      {pointsToNext
                        ? `${pointsToNext.needed.toLocaleString()}P`
                        : 'MAX'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${nextProgress}%`,
                        background: 'linear-gradient(to right, #a855f7, #ec4899)',
                        boxShadow: `0 0 8px ${auraColor}`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 뒷면 풋터 */}
              <div className="px-4 pb-2.5 pt-3">
                <div className="flex items-end justify-between gap-3">
                  <span className="pb-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    Serial No. {serial}
                  </span>
                  <div className="ph-barcode w-28 opacity-70" aria-hidden="true" />
                </div>
                <div className="mt-1.5 text-center text-[8.5px] font-semibold uppercase tracking-[0.28em] text-white/25">
                  Tap to flip
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CardStat = ({ value, label }: { value: number; label: string }) => (
  <div className="px-2 py-2.5 text-center">
    <div className="text-[19px] font-black leading-none text-white">
      {value.toLocaleString()}
    </div>
    <div className="mt-1 text-[9.5px] font-semibold text-white/45 whitespace-nowrap">
      {label}
    </div>
  </div>
)

export default ProfileHeader
