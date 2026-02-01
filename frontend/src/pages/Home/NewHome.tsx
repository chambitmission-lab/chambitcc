// 새로운 메인 페이지 - 익명 기도함 중심
import { useState } from 'react'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import PrayerHero from './components/PrayerHero'
import PrayerComposer from './components/PrayerComposer'
import PrayerList from './components/PrayerList'
import { usePrayers } from '../../hooks/usePrayers'
import './styles/NewHome.css'

const NewHome = () => {
  const [showComposer, setShowComposer] = useState(false)
  const prayerHook = usePrayers('popular')

  return (
    <ErrorBoundary>
      <div className="new-home">
        {/* Hero Section - 미니멀한 타이포그래피 */}
        <PrayerHero onCreateClick={() => setShowComposer(true)} />

        {/* Prayer Composer Modal */}
        {showComposer && (
          <PrayerComposer
            onClose={() => setShowComposer(false)}
            onSuccess={(newPrayer) => {
              prayerHook.addPrayer(newPrayer)
              setShowComposer(false)
            }}
            fingerprint={prayerHook.fingerprint}
          />
        )}

        {/* Prayer List - 고대비 카드 디자인 */}
        <PrayerList {...prayerHook} />
      </div>
    </ErrorBoundary>
  )
}

export default NewHome
