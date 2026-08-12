// 개발 전용 미리보기 (/dev/profile-header, DEV 빌드에서만 라우팅) —
// 백엔드 없이 프로필 헤더의 아바타 후광/칭호 칩/배너 구도를 레벨별로 확인한다.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { TitleStatus } from '../../../api/titles'
import { titleKeys } from '../../../hooks/useTitles'
import { GLOW_LEVELS } from '../../../types/achievement'
import ProfileHeader from './ProfileHeader'

const SAMPLE_TITLE: TitleStatus = {
  key: 'night_owl',
  name: '한밤의 올빼미',
  icon: '🦉',
  category: 'time',
  category_label: '시간과 꾸준함',
  tier: 'silver',
  description: '다들 잠든 깊은 밤, 이불 속 그 빛은 폰이 아니라 말씀!',
  hint: '밤 11시~새벽 2시 사이에 성경 읽기',
  hidden: false,
  earned: true,
  earned_at: '2026-06-17T00:00:00',
  equipped: true,
  progress: null,
}

const ProfileHeaderPreview = () => {
  const qc = useQueryClient()
  const [levelIdx, setLevelIdx] = useState(5) // 기본: 신앙의 빛(블루)

  // 렌더 전에 장착 칭호 캐시를 시드 — 칩/배너가 백엔드 없이 뜬다 (idempotent)
  if (!qc.getQueryData(titleKeys.equipped())) {
    qc.setQueryData(titleKeys.equipped(), SAMPLE_TITLE)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark">
      <ProfileHeader
        username="admin"
        fullName="탕자복귀완료"
        avatarUrl={null}
        glowLevel={GLOW_LEVELS[levelIdx]}
      />

      <div className="mx-auto mt-6 flex max-w-sm flex-wrap justify-center gap-2 px-4 pb-10">
        {GLOW_LEVELS.map((lv, i) => (
          <button
            key={lv.nameKey}
            onClick={() => setLevelIdx(i)}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              i === levelIdx
                ? 'border-brand bg-brand text-white'
                : 'border-gray-200 bg-white text-ink-strong dark:border-white/10 dark:bg-card-dark'
            }`}
          >
            Lv.{i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ProfileHeaderPreview
