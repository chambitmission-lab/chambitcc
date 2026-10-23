import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TitleGlyph } from '../../../components/titles/TitleGlyph'
import { useTitleBackdropPosition, useTitleBackdropSrc } from '../../../components/titles/TitleBackdrop'
import { useEquippedTitle } from '../../../hooks/useTitles'
import { localizeTitle } from '../../../components/titles/titleI18n'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useUploadAvatar, useDeleteAvatar } from '../../../hooks/useProfile'
import { resizeImageToBlob } from '../../../utils/imageResize'
import { showToast } from '../../../utils/toast'
import { ensureFontFamily } from '../../../utils/deferredFonts'
import type { TitleRarity, TitleTier } from '../../../api/titles'
import type { GlowLevel } from '../../../types/achievement'
import { confirmDialog } from '../../../utils/confirmDialog'
import './ProfileHeader.css'

// 칭호 이름·소유자 이름 손글씨 — 아래 기도 수첩과 같은 서체(오기 전엔 Pretendard 폴백)
void ensureFontFamily('gaegu')

interface ProfileHeaderProps {
  username: string
  fullName: string
  avatarUrl?: string | null
  /** 예전 아바타 후광용 — 훈장 수첩에선 쓰지 않지만 호출부 계약은 유지한다 */
  glowLevel: GlowLevel
  /** 직분 — 관리자·교역자가 지정 (예: 장로). 이름 뒤에 붙는다 */
  churchTitle?: string | null
}

const TIER_LABEL: Record<TitleTier, string> = { legendary: 'LEGENDARY', gold: 'GOLD', silver: 'SILVER', bronze: 'BRONZE' }

const pad3 = (n: number) => String(n).padStart(3, '0')

/** 0.7% / 12% — 1% 미만만 소수 한 자리 */
const formatShare = (r: TitleRarity) => {
  const pct = (r.holder_count / r.member_count) * 100
  return pct < 1 ? `${Math.max(pct, 0.1).toFixed(1)}%` : `${Math.round(pct)}%`
}

const formatAwardDate = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 그림이 없거나 색을 아직 못 뽑았을 때의 무대 바탕 — 밤하늘 남색
const DEFAULT_TONE = '#141a2b'
const toneCache = new Map<string, string>()

/**
 * 커버 그림 아랫단 평균색을 어둡게 눌러 무대 바탕색으로 쓴다 — 그림이 아래로 녹아드는 이음새가
 * 칭호마다 맞도록(36종 색표를 따로 들고 다니지 않으려고 런타임에 한 번 뽑아 캐시).
 * 같은 출처(/images/title-bg) 그림이라 캔버스가 오염되지 않는다.
 */
const useArtTone = (src: string | undefined): string => {
  // 색은 모듈 캐시가 정본 — 상태는 뽑기가 끝났을 때 다시 그리게 하는 신호로만 쓴다
  const [, bump] = useState(0)
  useEffect(() => {
    if (!src || toneCache.has(src)) return
    let alive = true
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 24
        canvas.height = 24
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(img, 0, 0, 24, 24)
        const { data } = ctx.getImageData(0, 18, 24, 6) // 아래 1/4
        let r = 0, g = 0, b = 0
        for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2] }
        const n = data.length / 4
        // 가장 밝은 채널을 38 로 맞춰 색조는 살리고 밝기만 밤 수준으로
        const k = 38 / Math.max(r / n, g / n, b / n, 1)
        const c = (v: number) => Math.round(Math.min(255, (v / n) * k))
        const value = `rgb(${c(r)}, ${c(g)}, ${c(b)})`
        toneCache.set(src, value)
        if (alive) bump((n) => n + 1)
      } catch {
        /* 색을 못 뽑아도 기본 남색으로 충분하다 */
      }
    }
    img.src = src
    return () => { alive = false }
  }, [src])
  return (src && toneCache.get(src)) || DEFAULT_TONE
}

/**
 * 프로필 아이덴티티 — '커버 무대 + 수여 훈장'(2026-10-23, 시안 A+D).
 *
 * 장착 칭호 그림을 화면 폭 끝까지 커버로 깔고 아랫단이 그림의 밤색(useArtTone)으로 녹아든다.
 * 그 이음새에 등급 금속 훈장이 반쯤 걸치고(수여식), 아래 가운데로 등급·번호 칩, 손글씨 칭호명,
 * 희소성 막대("n%만 가진 칭호"), 설명, 소유자 줄(사진·이름·수훈일·연필·칭호 바꾸기)이 이어진다.
 * 예전 가죽 수첩·금박 액자는 모바일에서 그림을 네 겹으로 둘러싸 작게 만들어 걷어냈다.
 * 숫자(포인트·스탯)는 아래 '신앙의 온도' 카드가 전담한다. 색 규칙은 ProfileHeader.css 머리말.
 */
const ProfileHeader = ({
  username,
  fullName,
  avatarUrl = null,
  churchTitle = null,
}: ProfileHeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadAvatar = useUploadAvatar()
  const deleteAvatar = useDeleteAvatar()
  const avatarBusy = uploadAvatar.isPending || deleteAvatar.isPending
  const backdropSrc = useTitleBackdropSrc()
  const backdropPosition = useTitleBackdropPosition()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { data: equipped } = useEquippedTitle()
  const text = equipped ? localizeTitle(equipped, language) : null
  const rarity = equipped?.rarity && equipped.rarity.member_count > 0 ? equipped.rarity : null
  const awardDate = equipped?.earned_at ? formatAwardDate(equipped.earned_at) : ''
  const ownerName = fullName || username
  const tone = useArtTone(backdropSrc)

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
    if (
      !(await confirmDialog({
        title: '프로필 사진 삭제',
        message: '프로필 사진을 삭제할까요?',
        description: '기본 아바타로 되돌아갑니다.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteAvatar.mutateAsync()
      showToast('프로필 사진을 삭제했어요', 'success')
    } catch {
      showToast('사진 삭제에 실패했어요', 'error')
    }
  }

  const goGarden = () => navigate('/garden')

  // 커버 — 칭호 그림 / 그림 없는 칭호는 은은한 문양 / 칭호 없음은 짧은 빈 무대
  const coverContent = !equipped ? null : backdropSrc ? (
    // prefetch.ts 가 진입 즉시 받아 둔 배너 — 캐시에 없더라도 LCP 후보라 우선순위를 올린다
    <img
      src={backdropSrc}
      alt=""
      draggable={false}
      fetchPriority="high"
      decoding="async"
      style={backdropPosition ? { objectPosition: backdropPosition } : undefined}
    />
  ) : (
    <div className="ph-cover__glyph" aria-hidden>
      <TitleGlyph titleKey={equipped.key} fallback={equipped.icon} />
    </div>
  )

  const avatar = (
    <div className="ph-avatar">
      <div className="ph-avatar__pic">
        {avatarUrl ? (
          <img src={avatarUrl} alt="프로필 사진" />
        ) : (
          <span aria-hidden>{ownerName.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <button
        type="button"
        className="ph-avatar__cam"
        onClick={() => fileInputRef.current?.click()}
        disabled={avatarBusy}
        aria-label={avatarUrl ? t('phAvatarChange') : t('phAvatarAdd')}
      >
        <span className={`material-icons-round text-[13px] ${avatarBusy ? 'animate-spin' : ''}`} aria-hidden>
          {avatarBusy ? 'autorenew' : 'photo_camera'}
        </span>
      </button>
      {avatarUrl && !avatarBusy && (
        <button type="button" className="ph-avatar__del" onClick={handleAvatarDelete} aria-label={t('phAvatarDelete')}>
          <span className="material-icons-round text-[11px]" aria-hidden>close</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarFile}
      />
    </div>
  )

  const owner = (
    <div className="ph-owner">
      {avatar}
      <div className="min-w-0 flex-1">
        <div className="ph-owner__name truncate">
          {ownerName}
          {churchTitle && <small>{churchTitle}</small>}
        </div>
        <div className="ph-owner__sub">
          {equipped ? (awardDate ? t('phAwarded').replace('{date}', awardDate) : equipped.category_label) : t('phEmptyLead')}
        </div>
      </div>
      {/* 연필 = 닉네임 변경(/account) — 칭호가 아니라 이름을 고치는 버튼임이 드러나도록 이름 옆에 */}
      <button type="button" onClick={() => navigate('/account')} aria-label={t('profileEdit')} className="ph-pen">
        <span className="material-icons-round text-[13px]" aria-hidden>edit</span>
      </button>
      <button type="button" onClick={goGarden} className="ph-change">
        {equipped ? t('phChangeTitle') : t('phPickTitle')} ›
      </button>
    </div>
  )

  const share = rarity ? (rarity.holder_count / rarity.member_count) * 100 : 0

  return (
    <section
      className={`ph ${equipped && equipped.tier !== 'gold' ? `ph--${equipped.tier}` : ''}`}
      style={{ '--ph-tone': tone } as React.CSSProperties}
    >
      <div className={`ph-cover ${coverContent ? '' : 'ph-cover--empty'}`}>{coverContent}</div>

      <div className="ph-body">
        {/* 수여 훈장 — 커버가 바탕색으로 녹아드는 이음새에 반쯤 걸친다 */}
        <div className={`ph-medal ${equipped ? '' : 'ph-medal--empty'}`} aria-hidden>
          {equipped ? (
            <div className="ph-medal__glyph">
              <TitleGlyph titleKey={equipped.key} fallback={equipped.icon} className="ph-medal__icon" />
              {awardDate && <span className="ph-medal__year">{awardDate.slice(0, 4)}</span>}
            </div>
          ) : (
            <span className="material-icons-round">workspace_premium</span>
          )}
        </div>

        {equipped && text ? (
          <>
            <div className="ph-chip">
              {[equipped.hidden ? 'HIDDEN' : null, TIER_LABEL[equipped.tier], rarity ? `No.${pad3(rarity.holder_rank)}` : null]
                .filter(Boolean)
                .join(' · ')}
            </div>
            <h2 className="ph-title">{text.name}</h2>
            {rarity && (
              <div className="ph-rarity">
                {rarity.holder_count <= 1 ? (
                  <b className="ph-foil ph-rarity__only">{t('phRarityOnly')}</b>
                ) : (
                  <>
                    <b className="ph-foil">{formatShare(rarity)}</b>
                    <span>{t('phRarityShare')}</span>
                  </>
                )}
                <span className="ph-rarity__bar" aria-hidden>
                  <i style={{ width: `${Math.max(share, 3)}%` }} />
                </span>
                <small>
                  {t('phRarityCount')
                    .replace('{m}', String(rarity.member_count))
                    .replace('{h}', String(rarity.holder_count))}
                </small>
              </div>
            )}
            {text.description && <p className="ph-desc">{text.description}</p>}
          </>
        ) : (
          <p className="ph-empty">{t('phEmptyFrame')}</p>
        )}

        {owner}
      </div>
    </section>
  )
}

export default ProfileHeader
