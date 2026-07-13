import { useRef, useState } from 'react'
import { TitleEquippedChip } from '../../../components/titles/TitleEquippedChip'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useUploadAvatar, useDeleteAvatar } from '../../../hooks/useProfile'
import { resizeImageToBlob } from '../../../utils/imageResize'
import { showToast } from '../../../utils/toast'
import type { Achievement, GlowLevel } from '../../../types/achievement'
import './ProfileHeader.css'

// 등급(GLOW_LEVELS)별 플레이어 클래스 — 영문 칭호 · 한글 수식어 · 시리얼 코드 · 엠블럼
const CLASS_BY_LEVEL: Record<
  number,
  { title: string; tagline: string; code: string; icon: string }
> = {
  0: { title: 'SEED PLANTER', tagline: '새싹을 틔우는 자', code: 'SEED', icon: 'spa' },
  1: { title: 'SPARK HOLDER', tagline: '불씨를 지닌 자', code: 'SPARK', icon: 'local_fire_department' },
  2: { title: 'FLAME KEEPER', tagline: '불꽃을 지키는 자', code: 'FLAME', icon: 'local_fire_department' },
  3: { title: 'BLAZE RUNNER', tagline: '불길을 달리는 자', code: 'BLAZE', icon: 'whatshot' },
  4: { title: 'SOUL IGNITER', tagline: '영혼에 불을 붙이는 자', code: 'SOUL', icon: 'whatshot' },
  5: { title: 'LIGHT WALKER', tagline: '빛을 걷는 자', code: 'LIGHT', icon: 'flare' },
  6: { title: 'GLORY BEARER', tagline: '하늘의 광채를 두른 자', code: 'GLORY', icon: 'flare' },
  7: { title: 'LAMP KEEPER', tagline: '꺼지지 않는 등불을 지키는 자', code: 'LAMP', icon: 'lightbulb' },
  8: { title: 'SALVATION STAR', tagline: '구원의 별로 빛나는 자', code: 'STAR', icon: 'auto_awesome' },
}

interface ProfileHeaderProps {
  username: string
  fullName: string
  avatarUrl?: string | null
  glowLevel: GlowLevel
  activityPoints: number
  specialAchievementColor?: string
  thisWeekCount?: number
  totalCount?: number
  streakDays?: number
  pointsToNext?: { needed: number; total: number } | null
  achievements?: Achievement[]
}

const ProfileHeader = ({
  username,
  fullName,
  avatarUrl = null,
  glowLevel,
  activityPoints,
  specialAchievementColor,
  thisWeekCount = 0,
  totalCount = 0,
  streakDays = 0,
  pointsToNext = null,
  achievements = [],
}: ProfileHeaderProps) => {
  const { t } = useLanguage()
  const [flipped, setFlipped] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadAvatar = useUploadAvatar()
  const deleteAvatar = useDeleteAvatar()
  const avatarBusy = uploadAvatar.isPending || deleteAvatar.isPending

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일 재선택 허용
    if (!file || avatarBusy) return
    try {
      const resized = await resizeImageToBlob(file, 512)
      await uploadAvatar.mutateAsync(resized)
      showToast('프로필 사진을 등록했어요', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '사진 업로드에 실패했어요', 'error')
    }
  }

  const handleAvatarDelete = async () => {
    if (avatarBusy) return
    if (!window.confirm('프로필 사진을 삭제할까요?')) return
    try {
      await deleteAvatar.mutateAsync()
      showToast('프로필 사진을 삭제했어요', 'success')
    } catch {
      showToast('사진 삭제에 실패했어요', 'error')
    }
  }
  const auraColor = specialAchievementColor || glowLevel.glowColor
  const unlockedBadges = achievements.filter((a) => a.unlocked)
  const playerClass = CLASS_BY_LEVEL[glowLevel.level] ?? CLASS_BY_LEVEL[0]
  const serial = `${playerClass.code}-${String(glowLevel.level).padStart(2, '0')}`
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
                className="ph-code text-[9.5px] uppercase tracking-[0.14em]"
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

              {/* 아바타 — 사진(있으면) / 이니셜(없으면), 카메라 배지로 등록·교체 */}
              <div
                className="relative mb-2 flex justify-center"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <div
                    className="rounded-full p-[2px]"
                    style={{
                      background: `conic-gradient(from 210deg, ${auraColor}, rgba(168,85,247,0.9), rgba(236,72,153,0.9), ${auraColor})`,
                      boxShadow: `0 0 14px ${auraColor}`,
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="프로필 사진"
                        className="block h-16 w-16 rounded-full bg-[#211d2e] object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#211d2e] text-[26px] font-black text-white/85">
                        {(fullName || username).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* 카메라 배지 — 등록/교체 */}
                  <button
                    type="button"
                    className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#2b2638] text-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-transform hover:scale-110 disabled:opacity-60"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarBusy}
                    aria-label={avatarUrl ? '프로필 사진 변경' : '프로필 사진 등록'}
                  >
                    <span
                      className={`material-icons-round text-[13px] ${avatarBusy ? 'animate-spin' : ''}`}
                      aria-hidden
                    >
                      {avatarBusy ? 'autorenew' : 'photo_camera'}
                    </span>
                  </button>

                  {/* 사진이 있을 때만 — 삭제 배지 */}
                  {avatarUrl && !avatarBusy && (
                    <button
                      type="button"
                      className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white/75 transition-colors hover:bg-black/90 hover:text-white"
                      onClick={handleAvatarDelete}
                      aria-label="프로필 사진 삭제"
                    >
                      <span className="material-icons-round text-[11px]" aria-hidden>
                        close
                      </span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarFile}
                />
              </div>

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
                <span className="ph-code pb-0.5 text-[9px] uppercase tracking-[0.1em] text-white/40">
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
                  Official Agent
                </span>
              </div>

              {/* 클래스 스트립 — 엠블럼 + 클래스명 */}
              <div className="mx-4 mt-2.5 flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
                <div
                  className="shrink-0 rounded-full p-[2px]"
                  style={{
                    background: `conic-gradient(from 210deg, ${auraColor}, rgba(168,85,247,0.9), rgba(236,72,153,0.9), ${auraColor})`,
                    boxShadow: `0 0 12px ${auraColor}`,
                  }}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#211d2e]">
                    <span
                      className="material-icons-round text-[19px]"
                      style={{
                        color: auraColor,
                        filter: `drop-shadow(0 0 8px ${auraColor})`,
                      }}
                      aria-hidden="true"
                    >
                      {playerClass.icon}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div
                    className="ph-code truncate text-[12.5px] tracking-[0.05em] text-white"
                    style={{ textShadow: `0 0 12px ${auraColor}` }}
                  >
                    {playerClass.title}
                  </div>
                  <div className="truncate text-[9.5px] text-white/45">
                    {playerClass.tagline} · Lv.{glowLevel.level} {t(glowLevel.nameKey)}
                  </div>
                </div>
              </div>

              {/* SEASON STATS — NBA 카드 뒷면식 스탯 테이블 */}
              <div className="mx-4 mt-2.5 flex-1">
                <div className="text-left text-[8.5px] font-bold uppercase tracking-[0.22em] text-white/35">
                  Season Stats
                </div>
                <div className="mt-1 divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-white/[0.03] px-3">
                  <BackStatRow label={t('totalPrayers')} value={totalCount} />
                  <BackStatRow label={t('profileThisWeek')} value={thisWeekCount} />
                  <BackStatRow
                    label={t('consecutivePrayers')}
                    value={streakDays}
                    suffix={streakDays >= 7 ? '🔥' : undefined}
                  />
                </div>

                {/* BADGES — 획득한 핵심 업적 */}
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[8.5px] font-bold uppercase tracking-[0.22em] text-white/35">
                    Badges
                  </span>
                  <span className="ph-code text-[9px] text-white/40">
                    {unlockedBadges.length}/{achievements.length}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {unlockedBadges.length === 0 ? (
                    <span className="text-[10px] text-white/35">
                      아직 획득한 배지가 없어요 — 첫 배지를 노려보세요!
                    </span>
                  ) : (
                    <>
                      {unlockedBadges.slice(0, 6).map((badge) => (
                        <span
                          key={badge.id}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06] text-[15px]"
                          style={{ boxShadow: `0 0 10px ${badge.glowColor}` }}
                          title={badge.title}
                        >
                          {badge.icon}
                        </span>
                      ))}
                      {unlockedBadges.length > 6 && (
                        <span className="ph-code flex h-8 items-center rounded-full border border-white/[0.12] bg-white/[0.06] px-2 text-[10px] text-white/60">
                          +{unlockedBadges.length - 6}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* NEXT LEVEL 게이지 */}
                <div className="mt-2.5">
                  <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.12em]">
                    <span className="text-white/40">Next Level</span>
                    <span className="ph-code" style={{ color: auraColor }}>
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
                  <span className="ph-code pb-0.5 text-[9px] uppercase tracking-[0.1em] text-white/40">
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

const BackStatRow = ({
  label,
  value,
  suffix,
}: {
  label: string
  value: number
  suffix?: string
}) => (
  <div className="flex items-center justify-between py-[7px]">
    <span className="text-[10.5px] font-semibold text-white/50">{label}</span>
    <span className="ph-stat-num text-[15px] leading-none text-white">
      {value.toLocaleString()}
      {suffix && <span className="ml-0.5 text-[11px]">{suffix}</span>}
    </span>
  </div>
)

const CardStat = ({ value, label }: { value: number; label: string }) => (
  <div className="px-2 py-3 text-center">
    <div className="ph-stat-num text-[23px] leading-none text-white">
      {value.toLocaleString()}
    </div>
    <div className="mt-1.5 text-[9.5px] font-semibold text-white/45 whitespace-nowrap">
      {label}
    </div>
  </div>
)

export default ProfileHeader
