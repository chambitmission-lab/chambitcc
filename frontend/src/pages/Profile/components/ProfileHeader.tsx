import { useRef } from 'react'
import { TitleEquippedChip } from '../../../components/titles/TitleEquippedChip'
import { useTitleBackdropSrc } from '../../../components/titles/TitleBackdrop'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useUploadAvatar, useDeleteAvatar } from '../../../hooks/useProfile'
import { resizeImageToBlob } from '../../../utils/imageResize'
import { showToast } from '../../../utils/toast'
import type { GlowLevel } from '../../../types/achievement'
import { confirmDialog } from '../../../utils/confirmDialog'

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
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadAvatar = useUploadAvatar()
  const deleteAvatar = useDeleteAvatar()
  const avatarBusy = uploadAvatar.isPending || deleteAvatar.isPending
  const auraColor = glowLevel.glowColor
  const backdropSrc = useTitleBackdropSrc()

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
    <div className="flex flex-col items-center pb-2 text-center">
      {/* 장착 칭호 커버 배너 — 장면(양·해돋이·닭)을 마스크 없이 온전히 보여준다 */}
      {backdropSrc && (
        <div className="relative w-full aspect-video overflow-hidden" aria-hidden>
          <img
            src={backdropSrc}
            alt=""
            draggable={false}
            className="h-full w-full select-none object-cover"
          />
          {/* 하단을 공통 네이비(--title-bg-seam)로 수렴 — 아래 정보 영역 그라데이션과
              정확히 같은 색에서 만나므로 20장 어떤 그림이든 이음새가 사라진다 */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background-light dark:to-[#0c1322]" />
        </div>
      )}

      {/* 정보 영역 — 다크 모드에선 그림 하단 네이비를 이어받아 서서히 페이지 배경으로 녹인다 */}
      <div
        className={`flex w-full flex-col items-center ${
          backdropSrc ? 'dark:bg-gradient-to-b dark:from-[#0c1322] dark:to-transparent' : ''
        }`}
      >
      {/* 아바타 — 배너가 있으면 커버 사진처럼 하단에 걸친다 */}
      <div className={`relative ${backdropSrc ? '-mt-10' : 'mt-7'}`}>
          {/* 배너 위에 걸칠 때는 이음색 테두리로 오려낸 듯한 커버 스타일 */}
          <div
            className={`rounded-full ${backdropSrc ? 'bg-background-light dark:bg-[#0c1322] p-[3px]' : ''}`}
          >
          <div
            className="rounded-full p-[2.5px]"
            style={{
              background: 'var(--brand)',
              boxShadow: `0 0 20px ${auraColor}`,
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="프로필 사진"
                className="block h-[76px] w-[76px] rounded-full bg-gray-100 dark:bg-card-dark object-cover"
              />
            ) : (
              <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gray-100 dark:bg-card-dark text-[30px] font-bold text-gray-500 dark:text-white/80">
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

      {/* 이름 + 아이디 — 한 줄로 묶어 세로 스택을 줄인다 */}
      <div className="mt-3 flex max-w-full items-baseline justify-center gap-1.5 px-5">
        <h2
          className="m-0 truncate text-[20px] font-bold leading-tight tracking-[-0.02em] text-ink-strong"
          style={{ wordBreak: 'keep-all' }}
        >
          {fullName}
        </h2>
        <p className="m-0 shrink-0 text-[12.5px] font-medium text-gray-400 dark:text-white/45">
          @{username}
        </p>
      </div>

      {/* 단계 이름 · 장착한 칭호 — 한 줄, 좁은 화면에선 자연스럽게 줄바꿈 */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 px-5">
        <span className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: 'var(--brand)',
              boxShadow: `0 0 8px ${auraColor}`,
            }}
            aria-hidden="true"
          />
          <span className="text-[12.5px] font-semibold text-brand">
            {t(glowLevel.nameKey)}
          </span>
        </span>
        <span className="text-[12px] text-gray-300 dark:text-white/25" aria-hidden>
          ·
        </span>
        {/* 클릭 시 /garden 컬렉션으로 */}
        <TitleEquippedChip variant="pill" />
      </div>
      </div>
    </div>
  )
}

export default ProfileHeader
