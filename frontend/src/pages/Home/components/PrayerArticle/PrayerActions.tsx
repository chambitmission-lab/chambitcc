import React from 'react'
import TextToSpeechButton from '../../../../components/common/TextToSpeechButton'

interface PrayerActionsProps {
  isPrayed: boolean
  isPraying: boolean
  onPray: (e: React.MouseEvent) => void
  prayerText: string // 제목 + 내용
}

const PrayerActions = ({
  isPrayed,
  isPraying,
  onPray,
  prayerText
}: PrayerActionsProps) => {
  return (
    <div className="px-4 flex items-center gap-3 mb-2">
      <button
        onClick={onPray}
        disabled={isPraying}
        className={`group flex items-center gap-1 transition-colors ${
          isPrayed ? 'text-ig-red' : 'text-gray-800 dark:text-white hover:opacity-70'
        }`}
      >
        <span className={`text-[24px] ${isPrayed ? 'material-icons-round' : 'material-icons-outlined'}`}>
          volunteer_activism
        </span>
      </button>
      
      {/* 음성 재생 버튼 */}
      <TextToSpeechButton 
        text={prayerText}
        size="md"
      />
    </div>
  )
}

export default PrayerActions
