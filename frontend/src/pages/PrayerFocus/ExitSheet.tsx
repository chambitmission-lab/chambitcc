// 기도 중 이탈 확인 — OS confirm 대신 촛불 톤을 따르는 인앱 시트.
// 1분 이상 기도했다면 "여기까지 기록하고 마치기"로 부분 세션을 남길 수 있다.
import { useLanguage } from '../../contexts/LanguageContext'
import { CANDLE_CLASS } from './candleTone'

interface ExitSheetProps {
  show: boolean
  /** 지금까지 기도한 초 */
  elapsedSeconds: number
  /** 조금 더 머물기 (재개) */
  onStay: () => void
  /** 여기까지 기록하고 마치기 — 1분 이상일 때만 노출 */
  onSaveAndFinish: () => void
  /** 기록 없이 나가기 */
  onDiscard: () => void
}

const ExitSheet = ({ show, elapsedSeconds, onStay, onSaveAndFinish, onDiscard }: ExitSheetProps) => {
  const { t } = useLanguage()

  if (!show) return null

  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  const canSave = elapsedMinutes >= 1

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
      {/* 배경 딤 — 탭하면 계속 기도 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onStay} />

      <div className="relative w-full max-w-md lg:max-w-lg mx-auto px-5 pb-8">
        <div className="rounded-3xl p-6 lg:p-8 bg-[rgba(20,20,25,0.92)] backdrop-blur-xl border border-white/10 shadow-2xl text-center">
          <p className="text-white/90 text-lg lg:text-[22px] font-semibold">{t('exitSheetTitle')}</p>
          {canSave && (
            <p className="text-white/50 text-sm lg:text-[16px] lg:text-white/70 mt-1.5">
              {(t('exitSheetElapsed') || '지금까지 {minutes}분 머물렀어요').replace('{minutes}', String(elapsedMinutes))}
            </p>
          )}

          <div className="mt-5 space-y-2.5">
            <button
              onClick={onStay}
              className={`w-full py-3.5 lg:py-4 lg:text-[17px] rounded-xl font-semibold ${CANDLE_CLASS.primary} hover:brightness-105 transition-all`}
            >
              {t('exitStayMore')}
            </button>
            {canSave && (
              <button
                onClick={onSaveAndFinish}
                className="w-full py-3.5 lg:py-4 rounded-xl text-sm lg:text-[16px] font-medium text-white/90 bg-white/10 border border-white/15 hover:bg-white/15 transition-all"
              >
                {t('exitSaveAndFinish')}
              </button>
            )}
            <button
              onClick={onDiscard}
              className="w-full py-3 lg:min-h-[48px] rounded-xl text-xs lg:text-[15px] font-medium text-white/40 lg:text-white/60 hover:text-white/60 lg:hover:text-white/80 transition-colors"
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
