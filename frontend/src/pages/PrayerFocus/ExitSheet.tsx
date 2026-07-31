// 기도 중 이탈 확인 — OS confirm 대신 무드 팔레트를 따르는 인앱 시트.
// 1분 이상 기도했다면 "여기까지 기록하고 마치기"로 부분 세션을 남길 수 있다.
import { useLanguage } from '../../contexts/LanguageContext'
import type { MoodPalette } from './moodPalette'

interface ExitSheetProps {
  show: boolean
  /** 지금까지 기도한 초 */
  elapsedSeconds: number
  mood: MoodPalette
  /** 조금 더 머물기 (재개) */
  onStay: () => void
  /** 여기까지 기록하고 마치기 — 1분 이상일 때만 노출 */
  onSaveAndFinish: () => void
  /** 기록 없이 나가기 */
  onDiscard: () => void
}

const ExitSheet = ({ show, elapsedSeconds, mood, onStay, onSaveAndFinish, onDiscard }: ExitSheetProps) => {
  const { t } = useLanguage()

  if (!show) return null

  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  const canSave = elapsedMinutes >= 1

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
      {/* 배경 딤 — 탭하면 계속 기도 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onStay} />

      <div className="relative w-full max-w-md mx-auto px-5 pb-8">
        <div className="rounded-3xl p-6 bg-[rgba(20,20,25,0.92)] backdrop-blur-xl border border-white/10 shadow-2xl text-center">
          <p className="text-white/90 text-lg font-semibold">{t('exitSheetTitle')}</p>
          {canSave && (
            <p className="text-white/50 text-sm mt-1.5">
              {(t('exitSheetElapsed') || '지금까지 {minutes}분 머물렀어요').replace('{minutes}', String(elapsedMinutes))}
            </p>
          )}

          <div className="mt-5 space-y-2.5">
            <button
              onClick={onStay}
              className={`w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r ${mood.buttonGradient} transition-all`}
            >
              {t('exitStayMore')}
            </button>
            {canSave && (
              <button
                onClick={onSaveAndFinish}
                className="w-full py-3.5 rounded-xl text-sm font-medium text-white/90 bg-white/10 border border-white/15 hover:bg-white/15 transition-all"
              >
                {t('exitSaveAndFinish')}
              </button>
            )}
            <button
              onClick={onDiscard}
              className="w-full py-3 rounded-xl text-xs font-medium text-white/40 hover:text-white/60 transition-colors"
            >
              {t('exitWithoutSave')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExitSheet
