// 홈 '내 그룹' 시트 — 인스타 스토리식 기도방 링
// 오늘 아직 내가 기도(체크인)하지 않은 방에만 방 색 링이 돈다 → "오늘 기도할 곳"이 한눈에.
// 신호는 my-groups 응답의 활동 필드(my_checked_in_today·checkins_today·new_prayers_week)만 쓴다.
// 구버전 백엔드엔 필드가 없으므로(null/undefined) 그땐 링·안내 문구 없이 중립으로 그린다.
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { GroupGlyph } from '../../pages/Groups/GroupIcons'
import type { PrayerGroup } from '../../types/prayer'
import './GroupStoryRings.css'

// 방마다 고유 색 — groupColors 는 부서명 매칭이라 "3구역" 같은 방은 전부 기본 금색이 되어 id 해시로 고른다
const ROOM_COLORS = ['#3182f6', '#12b886', '#f76707', '#d6336c', '#7048e8', '#0c8599', '#e8590c', '#5c7cfa']
const roomColor = (id: number) => ROOM_COLORS[id % ROOM_COLORS.length]

interface GroupStoryRingsProps {
  groups: PrayerGroup[]
  selectedGroupId: number | null
  onSelect: (groupId: number) => void
  onCreate: () => void
  onJoin: () => void
}

const GroupStoryRings = ({ groups, selectedGroupId, onSelect, onCreate, onJoin }: GroupStoryRingsProps) => {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const hasSignal = groups.some((g) => typeof g.my_checked_in_today === 'boolean')
  const waiting = groups.filter((g) => g.my_checked_in_today === false)

  const statusOf = (g: PrayerGroup) => {
    if (g.my_checked_in_today) return t('ringPrayedToday')
    if (g.checkins_today) return t('ringTodayCount').replace('{n}', String(g.checkins_today))
    if (g.checkins_today === 0) return t('ringQuiet')
    return ' '
  }

  return (
    <div className="gsr">
      <div className="gsr-row">
        {groups.map((g) => {
          const color = roomColor(g.id)
          const live = g.my_checked_in_today === false
          const done = g.my_checked_in_today === true
          const selected = selectedGroupId === g.id
          return (
            <button
              key={g.id}
              type="button"
              className={`gsr-item${selected ? ' is-selected' : ''}`}
              style={{ '--gsr-c': color } as React.CSSProperties}
              onClick={() => onSelect(g.id)}
              aria-pressed={selected}
            >
              <span className={`gsr-ring${live ? ' is-live' : ''}${done ? ' is-done' : ''}`}>
                <span className="gsr-gap">
                  <span className="gsr-face">
                    <GroupGlyph emoji={g.icon} size={26} />
                  </span>
                </span>
                {selected && (
                  <span className="gsr-check" aria-hidden="true">
                    <svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 6.5l2.3 2.3L9.5 3.8" />
                    </svg>
                  </span>
                )}
                {!!g.new_prayers_week && (
                  <span className="gsr-badge">
                    {t('ringNewBadge').replace('{n}', String(g.new_prayers_week))}
                  </span>
                )}
              </span>
              <span className="gsr-name">{g.name}</span>
              <span className={`gsr-status${done ? ' is-done' : ''}`}>{statusOf(g)}</span>
            </button>
          )
        })}

        <button type="button" className="gsr-item gsr-add" onClick={onCreate}>
          <span className="gsr-ring">
            <span className="gsr-gap">+</span>
          </span>
          <span className="gsr-name">{t('createGroupShort')}</span>
          <span className="gsr-status">{' '}</span>
        </button>
      </div>

      {hasSignal && (
        <div className="gsr-msg">
          {waiting.length > 0 ? (
            <>
              <p>{t('ringWaiting').replace('{n}', String(waiting.length))}</p>
              {/* 목록이 최근 활동순이라 첫 대기 방이 가장 활발한 방 — 거기서 중보 모드를 바로 연다 */}
              <button type="button" onClick={() => navigate(`/groups/${waiting[0].id}?pray=1`)}>
                {t('ringGoPray')}
              </button>
            </>
          ) : (
            <p>
              <b>{t('ringAllDone')}</b>
              <br />
              {t('ringAllDoneSub')}
            </p>
          )}
        </div>
      )}

      <div className="gsr-foot">
        <button type="button" onClick={onJoin}>{t('joinByInviteCode')}</button>
      </div>
    </div>
  )
}

export default GroupStoryRings
