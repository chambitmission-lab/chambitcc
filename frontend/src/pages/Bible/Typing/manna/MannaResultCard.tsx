import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCountUp } from '../../../../hooks/useCountUp'
import { showToast } from '../../../../utils/toast'
import { formatNumberKo as fmt } from '../../../../utils/formatNumber'
import { shareOrDownload } from '../dailyCard'
import { PLACES } from './mannaEngine'
import { renderMannaCard } from './mannaCard'
import { DropResultHero } from './MannaSkins'
import { modeLabel, type Finished } from './mannaPageShared'

// ── 결과 ─────────────────────────────────────────────

export const MannaResultCard = ({
  finished,
  loggedIn,
  saving,
  onAgain,
  onBack,
}: {
  finished: Finished
  loggedIn: boolean
  saving: boolean
  onAgain: () => void
  onBack: () => void
}) => {
  const { result, saved, set, mode, rival, liveKey } = finished
  const [sharing, setSharing] = useState(false)
  const shownScore = useCountUp(result.score)
  const place = PLACES[Math.min(result.versesDone, PLACES.length - 1)]
  const kindLabel = set.kind === 'daily' ? '오늘의 만나' : '연습'
  const liveLine = saved?.live && saved.live.rank ? `라이브 ${saved.live.players}명 중 ${saved.live.rank}위` : liveKey ? '라이브 순위에 올라갔어요' : null
  const rivalDelta = rival && !rival.is_me ? result.score - rival.score : null

  const share = async () => {
    setSharing(true)
    try {
      const blob = await renderMannaCard({
        dark: document.documentElement.classList.contains('dark'),
        result,
        verses: set.verses.length,
        kindLabel,
        modeLabel: modeLabel(mode),
        date: set.date,
        rank: saved?.kind === 'daily' ? saved.rank : null,
        isBest: !!saved?.is_best,
        rivalName: rival && !rival.is_me ? rival.name : null,
        rivalDelta,
        live: !!liveKey,
      })
      if (!blob) throw new Error('canvas')
      const r = await shareOrDownload(blob, `만나드롭-${set.date}.png`, `만나 내리기 · ${place}까지 ${fmt(result.score)}점`)
      if (r === 'downloaded') showToast('카드 이미지를 저장했어요', 'success')
    } catch {
      showToast('카드를 만들지 못했어요', 'error')
    } finally {
      setSharing(false)
    }
  }

  return (
    <section className="mn-result">
      <DropResultHero
        result={result}
        saved={saved}
        verses={set.verses.length}
        shownScore={shownScore}
        rivalDelta={rivalDelta}
        rivalName={rival && !rival.is_me ? rival.name : null}
        dateLabel={set.date.slice(5).replace('-', '.')}
        live={!!liveKey}
      />

      {(liveLine || saving || (saved && !saved.counted) || saved?.demoted || finished.saveFailed || !loggedIn) && (
        <div className="mn-result__notes">
          {liveLine && <p className="mn-result__note is-live">{liveLine}</p>}
          {saved && saved.overtook.length > 0 && (
            <p className="mn-result__note">{saved.overtook.join(', ')}님을 앞질렀어요 · 알림이 갔어요</p>
          )}
          {saving && <p className="mn-result__note">기록을 남기는 중…</p>}
          {saved && !saved.counted && <p className="mn-result__note">사람이 내기 어려운 기록이라 순위에는 들어가지 않았어요</p>}
          {saved?.demoted && <p className="mn-result__note">어제 날짜의 판이라 연습으로 남겼어요 — 다시 시작하면 오늘 판으로 순위에 올라가요</p>}
          {finished.saveFailed && <p className="mn-result__note">기록을 저장하지 못했어요 — 연결을 확인해 주세요</p>}
          {!loggedIn && (
            <p className="mn-result__note">
              <Link to="/login">로그인</Link>하면 기록이 남고 순위에 올라가요
            </p>
          )}
        </div>
      )}

      {result.refs.length > 0 && (
        <div className="mn-refs">
          <span className="mn-refs__title">오늘 새긴 말씀</span>
          {result.refs.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
      )}

      <div className="mn-result__actions">
        <button type="button" className="mn-cta" onClick={onAgain}>
          <span className="material-icons-round" aria-hidden>
            replay
          </span>
          {rivalDelta !== null && rivalDelta < 0 ? '한 판 더 · 역전하러' : '한 판 더'}
        </button>
        <button type="button" className="bt-btn bt-btn--block" disabled={sharing} onClick={() => void share()}>
          <span className="material-icons-round" aria-hidden>
            ios_share
          </span>
          {sharing ? '만드는 중…' : '스토리로 나누기'}
        </button>
        <button type="button" className="bt-btn bt-btn--block" onClick={onBack}>
          <span className="material-icons-round" aria-hidden>
            tune
          </span>
          판 바꾸기
        </button>
      </div>
    </section>
  )
}
