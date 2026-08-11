import { useRef } from 'react'
import { TitleEquippedChip } from '../../../components/titles/TitleEquippedChip'
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
    <div className="px-5 pt-6 pb-2">
      <div className="flex items-center gap-4">
        {/* 아바타 — 링은 브랜드 솔리드, 레벨 색은 글로우로만 */}
        <div className="relative shrink-0">
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

        {/* 이름 · 아이디 · 단계 이름 */}
        <div className="min-w-0 flex-1">
          <h2
            className="m-0 truncate text-[20px] font-bold leading-tight tracking-[-0.02em] text-ink-strong"
            style={{ wordBreak: 'keep-all' }}
          >
            {fullName}
          </h2>
          <p className="mt-0.5 text-[12.5px] font-medium text-gray-400 dark:text-white/45">
            @{username}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
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
          </div>
        </div>
      </div>

      {/* 장착한 칭호 — 클릭 시 /garden 컬렉션으로 */}
      <div className="mt-3.5 flex">
        <TitleEquippedChip variant="pill" />
      </div>
    </div>
  )
}

export default ProfileHeader
