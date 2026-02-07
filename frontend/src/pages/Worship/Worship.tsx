import { useLanguage } from '../../contexts/LanguageContext'
import '../Home/styles/WorshipTimes.css'

const Worship = () => {
  const { t } = useLanguage()
  
  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(234,179,8,0.1),transparent_50%)]"></div>
          <div className="relative px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full shadow-lg">
              <span className="text-4xl">🙌</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('worshipTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('worshipSubtitle')}</p>
          </div>
        </div>

        {/* Worship Schedule */}
        <div className="p-6 space-y-8">
          {/* 주일 예배 Section */}
          <section className="worship-section">
            <h2 className="worship-section-title">{t('worshipScheduleTitle')}</h2>
            <div className="space-y-3">
              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon-text">1</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('worship1stService')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('worship1stServiceSub')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">{t('worshipTime1st')}</p>
                    <p className="location text-xs">{t('worshipLocation1st')}</p>
                  </div>
                </div>
              </div>

              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon-text">2</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('worship2ndService')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('worship2ndServiceSub')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">{t('worshipTime2nd')}</p>
                  </div>
                </div>
              </div>

              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon-text">3</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('worship3rdService')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('worship3rdServiceSub')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">{t('worshipTime3rd')}</p>
                  </div>
                </div>
              </div>

              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon-text">4</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('worship4thService')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('worship4thServiceSub')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">{t('worshipTime4th')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 평일 예배 Section */}
          <section className="worship-section">
            <h2 className="worship-section-title">{t('worshipWeekdayTitle')}</h2>
            <div className="space-y-3">
              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon">🌅</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('worshipDawnPrayer')}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">{t('worshipDawnTime')}</p>
                    <p className="location text-sm">{t('worshipDawnTimeDetail')}</p>
                  </div>
                </div>
              </div>

              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon">📖</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('worshipWednesday')}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">{t('worshipWednesdayDay')}</p>
                    <p className="location text-sm">{t('worshipWednesdayTime1')}</p>
                    <p className="location text-sm">{t('worshipWednesdayTime2')}</p>
                  </div>
                </div>
              </div>

              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon">🙏</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('worshipFriday')}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">{t('worshipFridayDay')}</p>
                    <p className="location text-sm">{t('worshipFridayTime')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Info Note */}
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-gray-800 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-semibold">📍 {t('worshipLocationNote')}</span> {t('worshipLocationText')}<br/>
              <span className="font-semibold">ℹ️ {t('worshipInfoNote')}</span> {t('worshipInfoText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Worship
