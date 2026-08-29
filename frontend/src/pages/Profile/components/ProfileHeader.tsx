import { useRef } from 'react'
import { TitleGlyph } from '../../../components/titles/TitleGlyph'
import { useNavigate } from 'react-router-dom'
import { useTitleBackdropSrc } from '../../../components/titles/TitleBackdrop'
import { useEquippedTitle } from '../../../hooks/useTitles'
import { localizeTitle } from '../../../components/titles/titleI18n'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useUploadAvatar, useDeleteAvatar } from '../../../hooks/useProfile'
import { resizeImageToBlob } from '../../../utils/imageResize'
import { showToast } from '../../../utils/toast'
import type { GlowLevel } from '../../../types/achievement'
import { confirmDialog } from '../../../utils/confirmDialog'
import './ProfileHeader.css'

interface ProfileHeaderProps {
  username: string
  fullName: string
  avatarUrl?: string | null
  glowLevel: GlowLevel
}

/**
 * 프로필 아이덴티티 — 카드가 아니라 "기록장의 첫 줄".
 *
 * 이전의 트레이딩 카드(시리얼·바코드·플립)는 앱의 목회적 톤과 장르가 달라
 * 걷어냈다. 레벨 색은 아바타 글로우로만 은은하게 쓰고(레벨 글로우 정책),
 * 링 자체는 브랜드 솔리드를 유지한다. 숫자(포인트·스탯)는 아래
 * '신앙의 온도' 카드가 전담한다.
 */
const ProfileHeader = ({
  username,
  fullName,
  avatarUrl = null,
  glowLevel,
}: ProfileHeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadAvatar = useUploadAvatar()
  const deleteAvatar = useDeleteAvatar()
  const avatarBusy = uploadAvatar.isPending || deleteAvatar.isPending
  const auraColor = glowLevel.glowColor
  const backdropSrc = useTitleBackdropSrc()
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { data: equipped } = useEquippedTitle()
  const titleName = equipped ? localizeTitle(equipped, language).name : null
  // 이름 아래 한 줄 성구 — 오늘의 말씀을 그대로 빌려 쓴다(별도 요청 없음, 캐시 공유)

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

  return (
    <div className="ph flex flex-col items-center pb-2 text-center">
      {/* 장착 칭호 커버 배너 — 장면(양·해돋이·닭)을 마스크 없이 온전히 보여준다 */}
      {backdropSrc && (
        <div className="relative w-full aspect-video overflow-hidden" aria-hidden>
          <img
            src={backdropSrc}
            alt=""
            draggable={false}
            className="h-full w-full select-none object-cover"
          />
          {/* 하단 구름 — 직선 그라데이션 대신 페이지색 구름 뭉치가 그림을 삼키며
              아바타를 받친다. 색은 아래 정보 영역 시작색과 동일(라이트 페이지색 / 다크 네이비 이음색) */}
          <div className="ph-cloud" aria-hidden>
            <span className="ph-cloud__haze" />
            <span className="ph-cloud__puffs ph-cloud__puffs--back" />
            <span className="ph-cloud__puffs ph-cloud__puffs--front" />
            <span className="ph-cloud__seam" />
          </div>
        </div>
      )}

      {/* 정보 영역 — 다크 모드에선 그림 하단 네이비를 이어받아 서서히 페이지 배경으로 녹인다 */}
      <div
        className={`flex w-full flex-col items-center ${
          backdropSrc ? 'bg-background-light dark:bg-transparent dark:bg-gradient-to-b dark:from-[#0c1322] dark:to-transparent' : ''
        }`}
      >
      {/* 아바타 — 배너가 있으면 커버 사진처럼 하단에 걸친다 */}
      <div className={`relative z-[1] ${backdropSrc ? '-mt-14' : 'mt-7'}`}>
          {/* 배너 위에 걸칠 때는 이음색 테두리로 오려낸 듯한 커버 스타일 */}
          <div
            className={`rounded-full ${backdropSrc ? 'bg-background-light dark:bg-[#0c1322] p-[3px]' : ''}`}
          >
          <div
            className="rounded-full"
            style={{
              // 색 링 없이 후광 4겹만 — 레벨 색 후광이 사진을 직접 감싼다
              // (파란 링은 주황/금빛 후광 레벨과 색 충돌해 제거. spread 로 빛무리 확산)
              boxShadow: `0 0 8px 1px ${auraColor}, 0 0 24px 4px ${auraColor}, 0 0 52px 10px ${auraColor}, 0 0 92px 18px ${auraColor}`,
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="프로필 사진"
                className="block h-[81px] w-[81px] rounded-full border border-black/[0.06] bg-gray-100 object-cover dark:border-white/10 dark:bg-card-dark"
              />
            ) : (
              <div className="flex h-[81px] w-[81px] items-center justify-center rounded-full border border-black/[0.06] bg-gray-100 text-[30px] font-bold text-gray-500 dark:border-white/10 dark:bg-card-dark dark:text-white/80">
                {(fullName || username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          </div>

          {/* 카메라 배지 — 등록/교체 */}
          <button
            type="button"
            className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/60 dark:border-white/15 bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-white/85 shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-transform hover:scale-110 disabled:opacity-60"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarBusy}
            aria-label={avatarUrl ? '프로필 사진 변경' : '프로필 사진 등록'}
          >
            <span
              className={`material-icons-round text-[14px] ${avatarBusy ? 'animate-spin' : ''}`}
              aria-hidden
            >
              {avatarBusy ? 'autorenew' : 'photo_camera'}
            </span>
          </button>

          {/* 사진이 있을 때만 — 삭제 배지 */}
          {avatarUrl && !avatarBusy && (
            <button
              type="button"
              className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/40 dark:border-white/15 bg-black/60 text-white/80 transition-colors hover:bg-black/85 hover:text-white"
              onClick={handleAvatarDelete}
              aria-label="프로필 사진 삭제"
            >
              <span className="material-icons-round text-[11px]" aria-hidden>
                close
              </span>
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

      {/* 아이덴티티 블록 — '내 칭호' 필 → 칭호 헤드라인 → 이름 → 오늘의 성구.
          오른쪽 연필은 /account(프로필 편집). */}
      <div className="relative w-full px-5">
        <button
          type="button"
          onClick={() => navigate('/garden')}
          className="ph-title-pill"
          aria-label={
            titleName
              ? language === 'en' ? `Equipped title ${titleName} — change` : `장착한 칭호 ${titleName} — 변경하기`
              : t('titleChipEmpty')
          }
        >
          <span aria-hidden>{equipped ? <TitleGlyph titleKey={equipped.key} fallback={equipped.icon} /> : '✝'}</span>
          {titleName ? t('profileMyTitle') : t('titleChipEmpty')}
        </button>

        <h2
          className="m-0 mt-2 max-w-full truncate text-[24px] font-bold leading-tight tracking-[-0.02em] text-ink-strong"
          style={{ wordBreak: 'keep-all' }}
        >
          {titleName ?? fullName}
        </h2>
        {/* 닉네임 + 연필(닉네임 변경 → /account) — 칭호가 아니라 이름을 고치는 버튼임이 드러나도록 이름 바로 옆에 */}
        <div className={`flex items-center justify-center gap-1 ${titleName ? 'mt-1' : 'mt-1.5'}`}>
          {titleName && (
            <p className="m-0 text-[13px] font-semibold text-gray-500 dark:text-white/55">{fullName}</p>
          )}
          <button
            type="button"
            onClick={() => navigate('/account')}
            aria-label={t('profileEdit')}
            className="ph-edit"
          >
            <span className="material-icons-round text-[13px]" aria-hidden>edit</span>
          </button>
        </div>

      </div>
      </div>
    </div>
  )
}

export default ProfileHeader
