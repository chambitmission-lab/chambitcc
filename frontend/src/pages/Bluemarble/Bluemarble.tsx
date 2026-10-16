// 바이블 퀘스트 — 두 탭: 발자취 여행(수채화 지도, 하루 5걸음) / 말씀 리그(부서 대항 60초 라운드).
// 발자취 게임 상태 전이는 useBluemarbleGame 훅, 리그는 useBibleLeague 쿼리가 맡는다.
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useBluemarbleGame } from './useBluemarbleGame'
import JourneyView from './journey/JourneyView'
import LeagueView from './league/LeagueView'
import BmIcon from './components/BluemarbleIcons'
import './Bluemarble.css'
import './quest.css'

type Tab = 'journey' | 'league'

export default function Bluemarble() {
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const tab: Tab = sp.get('tab') === 'league' ? 'league' : 'journey'
  const game = useBluemarbleGame()
  const setTab = (t: Tab) => setSp(t === 'league' ? { tab: 'league' } : {}, { replace: true })

  const tabs = (
    <div className={`quest-tabs ${tab === 'journey' ? 'is-on-map' : ''}`} role="tablist" aria-label="바이블 퀘스트">
      <button type="button" role="tab" aria-selected={tab === 'journey'} className={tab === 'journey' ? 'is-on' : ''} onClick={() => setTab('journey')}>
        <BmIcon name="footprints" size={16} /> 발자취 여행
      </button>
      <button type="button" role="tab" aria-selected={tab === 'league'} className={tab === 'league' ? 'is-on' : ''} onClick={() => setTab('league')}>
        <BmIcon name="bolt" size={16} /> 말씀 리그
      </button>
    </div>
  )

  if (!game.isAuthenticated) {
    return (
      <div className="quest">
        <div className="quest-gate">
          <BmIcon name="footprints" size={34} strokeWidth={1.6} />
          <h2>바이블 퀘스트</h2>
          <p>예수님의 발자취를 매일 다섯 걸음씩 걷고, 부서와 함께 말씀 리그에 도전해요.</p>
          <button type="button" className="qj-go" onClick={() => navigate('/login')}>
            로그인하고 시작하기
          </button>
        </div>
      </div>
    )
  }

  if (tab === 'league') {
    return (
      <div className="quest quest--league">
        {tabs}
        <LeagueView />
      </div>
    )
  }

  if (game.stateQuery.isLoading || game.startMutation.isPending || !game.session) {
    return (
      <div className="quest">
        {tabs}
        <div className="quest-gate">
          {game.stateQuery.isLoading || game.startMutation.isPending ? (
            <p>발자취를 준비하고 있어요…</p>
          ) : (
            <>
              <h2>예수님의 발자취</h2>
              <button type="button" className="qj-go" onClick={() => game.startMutation.mutate(false)}>
                여행 시작하기
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="quest quest--journey">
      <JourneyView game={game} onGoLeague={() => setTab('league')} header={tabs} />
    </div>
  )
}
