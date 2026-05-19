import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useMyRabbit,
  useRabbitCatalog,
  useRabbitEvents,
  useEquipTreasure,
  useUnequipSlot,
  useSetRabbitNickname,
} from '../../hooks/useRabbit'
import RabbitAvatar from '../../components/rabbit/RabbitAvatar'
import '../../components/rabbit/rabbit.css'

const SLOT_LABEL: Record<string, string> = {
  feet: '발',
  belt: '허리',
  chest: '가슴',
  shield: '방패',
  helmet: '머리',
  weapon: '무기',
  accessory: '장식',
}

const TREASURE_EMOJI: Record<string, string> = {
  shoes_of_peace: '👟',
  belt_of_truth: '🪢',
  breastplate_of_righteousness: '🛡️',
  shield_of_faith: '🛡️',
  helmet_of_salvation: '⛑️',
  sword_of_spirit: '⚔️',
  crown_of_life: '👑',
}

const STAGE_NAMES: Record<number, string> = {
  1: '꼬맨자국 작은 토끼',
  2: '깨끗한 토끼',
  3: '평안의 발걸음 토끼',
  4: '진리의 띠를 두른 토끼',
  5: '의를 입은 토끼',
  6: '믿음의 방패 토끼',
  7: '빛나는 챔피언 토끼',
}

export default function RabbitGallery() {
  const navigate = useNavigate()
  const isAuthenticated = !!localStorage.getItem('access_token')
  const meQuery = useMyRabbit(isAuthenticated)
  const catalogQuery = useRabbitCatalog()
  const eventsQuery = useRabbitEvents(isAuthenticated, 30)
  const equipMut = useEquipTreasure()
  const unequipMut = useUnequipSlot()
  const nicknameMut = useSetRabbitNickname()

  const [editing, setEditing] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const heroRef = useRef<HTMLDivElement>(null)

  if (!isAuthenticated) {
    return (
      <div className="rg-page">
        <h2 className="rg-title">🐰 내 토끼</h2>
        <p>로그인이 필요합니다.</p>
        <button className="rg-back" onClick={() => navigate('/login')}>로그인</button>
      </div>
    )
  }

  if (meQuery.isLoading) return <div className="rg-page">토끼를 부르고 있어요…</div>
  if (meQuery.isError || !meQuery.data) {
    return <div className="rg-page">토끼 정보를 불러오지 못했습니다.</div>
  }

  const { rabbit, next_stage_at, next_treasure } = meQuery.data
  const treasures = catalogQuery.data?.treasures ?? []
  const ownedCodes = new Set(Object.keys(rabbit.inventory || {}))
  const equippedCodes = new Set(Object.values(rabbit.equipped || {}))

  const stagePctTo = (target: number) =>
    target > 0
      ? Math.min(100, Math.round((rabbit.total_correct / target) * 100))
      : 100

  const handleEquip = (code: string) => equipMut.mutate(code)
  const handleUnequip = (slot: string) => unequipMut.mutate(slot)

  const handleSaveNickname = async () => {
    await nicknameMut.mutateAsync(nicknameInput.trim())
    setEditing(false)
  }

  const handleShare = async () => {
    // 간단한 공유: 텍스트 + URL
    const text = `${rabbit.nickname || '내 토끼'} (Lv${rabbit.stage} ${
      STAGE_NAMES[rabbit.stage]
    }) - ${rabbit.total_treasures}개 보물 획득! #참빛교회 #예수님의발자취`
    if (navigator.share) {
      try {
        await navigator.share({ title: '내 전신갑주 토끼', text })
      } catch {
        /* 사용자 취소 */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        alert('공유 텍스트를 클립보드에 복사했습니다!')
      } catch {
        alert(text)
      }
    }
  }

  return (
    <div className="rg-page">
      <div className="rg-header">
        <button className="rg-back" onClick={() => navigate('/bluemarble')}>
          ← 발자취로
        </button>
        <h1 className="rg-title">🐰 내 전신갑주 토끼</h1>
        <div className="rg-actions">
          <button className="rg-share-btn" onClick={handleShare}>공유</button>
        </div>
      </div>

      <div className="rg-hero" ref={heroRef}>
        <div className="rg-hero-avatar">
          <RabbitAvatar
            stage={rabbit.stage}
            equipped={rabbit.equipped}
            mood="idle"
            size={200}
          />
        </div>
        <div className="rg-hero-info">
          {editing ? (
            <div className="rg-nickname-edit">
              <input
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="토끼 별명"
                maxLength={30}
                className="rg-nickname-input"
              />
              <button className="rg-back" onClick={handleSaveNickname}>저장</button>
              <button className="rg-back" onClick={() => setEditing(false)}>취소</button>
            </div>
          ) : (
            <h2
              onClick={() => {
                setNicknameInput(rabbit.nickname || '')
                setEditing(true)
              }}
              className="rg-nickname-display"
              title="클릭해서 별명 수정"
            >
              {rabbit.nickname || '내 토끼'}
              <span className="rg-nickname-edit-icon">✏️</span>
            </h2>
          )}
          <div className="rg-hero-stage">
            Lv {rabbit.stage} · {STAGE_NAMES[rabbit.stage]}
          </div>

          <div className="rg-progress">
            {next_stage_at !== null && (
              <div className="rg-progress-row">
                <div className="rg-progress-label">
                  다음 진화까지 — {rabbit.total_correct} / {next_stage_at} 정답
                </div>
                <div className="rg-progress-bar">
                  <div
                    className="rg-progress-fill"
                    style={{ width: `${stagePctTo(next_stage_at)}%` }}
                  />
                </div>
              </div>
            )}
            {next_treasure && (
              <div className="rg-progress-row">
                <div className="rg-progress-label">
                  다음 보물: {next_treasure.name} ({next_treasure.scripture}) — {next_treasure.remaining}개 정답 남음
                </div>
                <div className="rg-progress-bar">
                  <div
                    className="rg-progress-fill"
                    style={{ width: `${stagePctTo(next_treasure.threshold)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rg-stat-row">
            <div className="rg-stat">정답 <strong>{rabbit.total_correct}</strong></div>
            <div className="rg-stat">보물 <strong>{rabbit.total_treasures}</strong></div>
            <div className="rg-stat">단계 <strong>{rabbit.stage}/7</strong></div>
          </div>
        </div>
      </div>

      <section className="rg-section">
        <h3 className="rg-section-title">⚔️ 전신갑주 컬렉션</h3>
        <div className="rg-grid">
          {treasures.map((t) => {
            const owned = ownedCodes.has(t.code)
            const equipped = equippedCodes.has(t.code)
            return (
              <div
                key={t.code}
                className={`rg-treasure ${owned ? '' : 'locked'} ${equipped ? 'equipped' : ''}`}
              >
                {equipped && <span className="rg-treasure-equipped-badge">장착중</span>}
                <div className="rg-treasure-icon">{TREASURE_EMOJI[t.code] || '✨'}</div>
                <div className="rg-treasure-name">{t.name}</div>
                <div className="rg-treasure-scripture">{t.scripture}</div>
                <div className="rg-treasure-slot">
                  {SLOT_LABEL[t.slot] || t.slot}
                  {t.threshold ? ` · ${t.threshold}정답` : ''}
                </div>
                {owned && !equipped && (
                  <button
                    className="rg-treasure-action"
                    onClick={() => handleEquip(t.code)}
                    disabled={equipMut.isPending}
                  >
                    장착
                  </button>
                )}
                {owned && equipped && (
                  <button
                    className="rg-treasure-action"
                    onClick={() => handleUnequip(t.slot)}
                    disabled={unequipMut.isPending}
                  >
                    해제
                  </button>
                )}
                {!owned && (
                  <div className="rg-treasure-locked-text">잠김 🔒</div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="rg-section">
        <h3 className="rg-section-title">📜 토끼 일지</h3>
        <div className="rg-events">
          {(eventsQuery.data || []).length === 0 && (
            <div className="rg-events-empty">아직 이벤트가 없어요.</div>
          )}
          {(eventsQuery.data || []).map((ev) => (
            <div key={ev.id} className="rg-event">
              <span>
                {ev.event_type === 'treasure' && '⚔️ '}
                {ev.event_type === 'evolve' && '✨ '}
                {ev.event_type === 'equip' && '🎽 '}
                {ev.event_type === 'unequip' && '🧺 '}
                {ev.note || ev.event_type}
              </span>
              <span className="rg-event-date">
                {new Date(ev.created_at).toLocaleString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
