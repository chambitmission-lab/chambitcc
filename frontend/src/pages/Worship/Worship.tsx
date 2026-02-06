import '../Home/styles/WorshipTimes.css'

const Worship = () => {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">예배 안내</h1>
            <p className="text-gray-600 dark:text-gray-400">함께 모여 하나님께 예배드립니다</p>
          </div>
        </div>

        {/* Worship Schedule */}
        <div className="p-6 space-y-8">
          {/* 주일 예배 Section */}
          <section className="worship-section">
            <h2 className="worship-section-title">예배, 집회안내 (본당)</h2>
            <div className="space-y-3">
              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon-text">1부</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">주일낮예배 1부</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">(이른예배)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">오전 7시 30분</p>
                    <p className="location text-xs">(오르엘 홀)</p>
                  </div>
                </div>
              </div>

              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon-text">2부</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">주일낮예배 2부</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">(밝은예배)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">오전 9시 20분</p>
                  </div>
                </div>
              </div>

              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon-text">3부</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">주일낮예배 3부</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">(길은예배)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">오전 11시 20분</p>
                  </div>
                </div>
              </div>

              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon-text">4부</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">주일낮예배 4부</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">(열린예배)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">오후 1시 30분</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 평일 예배 Section */}
          <section className="worship-section">
            <h2 className="worship-section-title">평일예배 (본당)</h2>
            <div className="space-y-3">
              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon">🌅</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">새벽기도회</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">매주 월~금</p>
                    <p className="location text-sm">오전 5시 30분</p>
                  </div>
                </div>
              </div>

              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon">📖</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">수요기도회</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">수요일</p>
                    <p className="location text-sm">오전 10시 30분 (오르엘 홀)</p>
                    <p className="location text-sm">오후 7시 30분 (본당)</p>
                  </div>
                </div>
              </div>

              <div className="worship-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="card-icon">🙏</div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">금요기도회</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="time text-base">금요일</p>
                    <p className="location text-sm">오후 8시 30분</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Info Note */}
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-gray-800 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-semibold">📍 위치:</span> 모든 예배는 본당에서 진행됩니다.<br/>
              <span className="font-semibold">ℹ️ 안내:</span> 예배 시간은 사정에 따라 변경될 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Worship
