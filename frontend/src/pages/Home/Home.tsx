import './Home.css'
import HeroSection from './components/HeroSection'
import DailyMeditationCard from './components/DailyMeditationCard'
import InfoCards from './components/InfoCards'
import WorshipTimes from './components/WorshipTimes'
import LatestSermon from './components/LatestSermon'
import CommunityFeed from './components/CommunityFeed'
import CTASection from './components/CTASection'

const Home = () => {
  return (
    <div className="home">
      <HeroSection />
      <DailyMeditationCard />
      <InfoCards />
      <WorshipTimes />
      <LatestSermon />
      <CommunityFeed />
      <CTASection />
    </div>
  )
}

export default Home
