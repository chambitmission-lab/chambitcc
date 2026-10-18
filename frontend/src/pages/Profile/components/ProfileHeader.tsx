import { useRef } from 'react'
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

// 액자 모서리 덩굴 장식 — 네 귀퉁이는 CSS 로 뒤집어 같은 그림을 쓴다
const Ornament = ({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) => (
  <svg className={`ph-orn ph-orn--${corner}`} viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden>
    <path d="M3 3c8 0 12 3 12 9M3 3c0 8 3 12 9 12" />
    <circle cx="9" cy="9" r="2" />
    <path d="M15 12c2-2 5-2 6 0M12 15c-2 2-2 5 0 6" />
  </svg>
)

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

/**
 * 프로필 아이덴티티 — '훈장을 단 수첩'(2026-10-18).
 *
 * 낡은 가죽 수첩 표지에 장착 칭호 그림을 금박 액자로 걸고(황동 명판에 발급 번호),
 * 오른쪽엔 등급별 금속·리본의 훈장과 희소성(“성도 중 n%만 가진 칭호”),
 * 아래 바랜 종이 카드에 칭호 이름·설명·소유자(사진·이름·수훈일)를 적는다.
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

  // 액자 속 — 칭호 그림 / 그림 없는 칭호는 문양 / 칭호 없음은 빈 액자 안내
  const frameContent = !equipped ? (
    <div className="ph-film ph-film--empty">
      <div>
        <p className="m-0 whitespace-pre-line">{t('phEmptyFrame')}</p>
        <button type="button" onClick={goGarden} className="ph-change ph-change--on-mat">
          {t('phPickTitle')} ›
        </button>
      </div>
    </div>
  ) : backdropSrc ? (
    <div className="ph-film">
      {/* prefetch.ts 가 진입 즉시 받아 둔 배너 — 캐시에 없더라도 LCP 후보라 우선순위를 올린다 */}
      <img
        src={backdropSrc}
        alt=""
        draggable={false}
        fetchPriority="high"
        decoding="async"
        style={backdropPosition ? { objectPosition: backdropPosition } : undefined}
      />
    </div>
  ) : (
    <div className="ph-film ph-film--glyph" aria-hidden>
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
    <div className={`ph-owner ${equipped ? '' : 'ph-owner--solo'}`}>
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

  return (
    <div className={`ph px-4 pt-3 ${equipped && equipped.tier !== 'gold' ? `ph--${equipped.tier}` : ''}`}>
      <section className="ph-leather">
        <span className="ph-brass ph-brass--tl" aria-hidden />
        <span className="ph-brass ph-brass--bl" aria-hidden />
        <span className="ph-band" aria-hidden />

        <div className={equipped ? 'ph-grid' : undefined}>
          <div>
            <div className="ph-frame">
              <Ornament corner="tl" />
              <Ornament corner="tr" />
              <Ornament corner="bl" />
              <Ornament corner="br" />
              <div className="ph-mat">
                <div className="ph-bevel">{frameContent}</div>
              </div>
            </div>
            {text && (
              <div className="ph-plaque">
                {rarity ? `No.${pad3(rarity.holder_rank)} · ${text.name}` : text.name}
              </div>
            )}
          </div>

          {equipped && (
            <div className="ph-side">
              <div className="ph-medal" aria-hidden>
                <div className="ph-medal__pin" />
                <div className="ph-medal__ribbon" />
                <div className="ph-medal__ring" />
                <div className="ph-medal__face">
                  <div className="ph-medal__glyph">
                    <TitleGlyph titleKey={equipped.key} fallback={equipped.icon} className="ph-medal__icon" />
                    {awardDate && <span className="ph-medal__year">{awardDate.slice(0, 4)}</span>}
                  </div>
                </div>
              </div>
              {rarity && (
                <div className="ph-stat">
                  {rarity.holder_count <= 1 ? (
                    <b className="ph-foil" style={{ fontSize: 17 }}>{t('phRarityOnly')}</b>
                  ) : (
                    <>
                      <b className="ph-foil">{formatShare(rarity)}</b>
                      <span>{t('phRarityShare')}</span>
                    </>
                  )}
                  <small>
                    {t('phRarityCount')
                      .replace('{m}', String(rarity.member_count))
                      .replace('{h}', String(rarity.holder_count))}
                  </small>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="ph-card">
          {equipped && text ? (
            <>
              <div className="ph-card__cat">
                {[equipped.hidden ? 'HIDDEN' : null, TIER_LABEL[equipped.tier], rarity ? `No.${pad3(rarity.holder_rank)}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              <h2 className="ph-card__title m-0">{text.name}</h2>
              {text.description && <p className="ph-card__desc m-0">{text.description}</p>}
              {owner}
            </>
          ) : (
            owner
          )}
        </div>
      </section>
    </div>
  )
}

export default ProfileHeader
