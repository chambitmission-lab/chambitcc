// 1단계 — 누구에게 보낼까요?
// '소중한 사람에게'는 direct(교인에게 바로)와 invite(초대 링크) 두 방식 —
// 서로 아는 공동체 앱이라 바로 보내기를 기본으로 둔다.
import type { CapsuleRecipient, CapsuleType } from '../../../types/timeCapsule'
import { Icon, LinkGlyph } from '../capsuleIcons'

const ClockGlyph = () => (
  <>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7.6V12l3 2" />
  </>
)
const HeartGlyph = () => (
  <path d="M12 20.2 5.4 13.6a4.7 4.7 0 0 1 0-6.6 4.6 4.6 0 0 1 6.6 0 4.6 4.6 0 0 1 6.6 0 4.7 4.7 0 0 1 0 6.6Z" />
)
const PlaneGlyph = () => <path d="M21 3 10.5 13.5M21 3l-6.6 18-3.9-7.5L3 9.6 21 3Z" />

const Avatar = ({ user, size }: { user: CapsuleRecipient; size: number }) =>
  user.avatar_url ? (
    <img src={user.avatar_url} alt="" className="cw-avatar" style={{ width: size, height: size }} />
  ) : (
    <span className="cw-avatar cw-avatar--initial" style={{ width: size, height: size }}>
      {user.display_name.charAt(0)}
    </span>
  )

const StepRecipient = ({
  capsuleType,
  onTypeChange,
  recipientName,
  onRecipientNameChange,
  recipientQuery,
  onRecipientQueryChange,
  recipientResults,
  recipientSearching,
  selectedRecipient,
  onSelectRecipient,
  sealsPrayer,
  sealsIntercession,
}: {
  capsuleType: CapsuleType
  onTypeChange: (type: CapsuleType) => void
  recipientName: string
  onRecipientNameChange: (v: string) => void
  recipientQuery: string
  onRecipientQueryChange: (v: string) => void
  recipientResults: CapsuleRecipient[]
  recipientSearching: boolean
  selectedRecipient: CapsuleRecipient | null
  onSelectRecipient: (u: CapsuleRecipient | null) => void
  sealsPrayer: boolean
  sealsIntercession: boolean
}) => {
  const isSelf = capsuleType === 'self'

  return (
    <>
      <h2 className="cw-title">이 편지, 누구에게 보낼까요?</h2>

      <div className="cw-tiles" role="radiogroup" aria-label="받는 사람">
        <button
          type="button"
          role="radio"
          aria-checked={isSelf}
          onClick={() => onTypeChange('self')}
          className={`cw-tile ${isSelf ? 'is-on' : ''}`}
        >
          <span className="cw-tile__icon cw-tone--blue">
            <Icon size={26}>
              <ClockGlyph />
            </Icon>
          </span>
          <b>미래의 나</b>
          <span>시간이 흐른 뒤의 나에게</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={!isSelf}
          // 다시 누를 때 고른 전달 방식을 지키도록, 이미 '소중한 사람'이면 그대로 둔다
          onClick={() => isSelf && onTypeChange('direct')}
          className={`cw-tile ${!isSelf ? 'is-on' : ''}`}
        >
          <span className="cw-tile__icon cw-tone--amber">
            <Icon size={26}>
              <HeartGlyph />
            </Icon>
          </span>
          <b>소중한 사람</b>
          <span>가족·친구·교우에게</span>
        </button>
      </div>

      {/* 기도→캡슐 딥링크로 왔다면, 나에게 보낼 때만 그 기도가 함께 봉인된다 */}
      {isSelf && sealsPrayer && (
        <p className="cw-note cw-note--brand">방금의 기도와 붙들었던 말씀이 이 편지와 함께 봉인돼요</p>
      )}
      {isSelf && sealsIntercession && (
        <p className="cw-note cw-note--brand">누군가 함께 기도해 준 지난 한 달(기도제목·등불)이 함께 봉인돼요</p>
      )}

      {!isSelf && (
        <div className="cw-reveal">
          <p className="cw-label">어떻게 전할까요?</p>
          <div className="cw-seg" role="radiogroup" aria-label="전달 방식">
            {(
              [
                { mode: 'direct' as const, label: '앱에서 바로', icon: <PlaneGlyph /> },
                { mode: 'invite' as const, label: '초대 링크로', icon: <LinkGlyph /> },
              ]
            ).map(({ mode, label, icon }) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={capsuleType === mode}
                onClick={() => onTypeChange(mode)}
                className={`cw-seg__item ${capsuleType === mode ? 'is-on' : ''}`}
              >
                <Icon size={16}>{icon}</Icon>
                {label}
              </button>
            ))}
          </div>

          {capsuleType === 'direct' && (
            <div className="mt-3">
              {selectedRecipient ? (
                <div className="cw-picked">
                  <Avatar user={selectedRecipient} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="cw-picked__name">{selectedRecipient.display_name}</p>
                    <p className="cw-picked__sub">@{selectedRecipient.username}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectRecipient(null)
                      onRecipientQueryChange('')
                    }}
                    className="cw-picked__change"
                  >
                    바꾸기
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={recipientQuery}
                    onChange={(e) => onRecipientQueryChange(e.target.value)}
                    maxLength={20}
                    placeholder="받는 분 이름을 검색하세요"
                    className="cw-input"
                    aria-label="받는 분 이름 검색"
                  />
                  {recipientQuery.trim() && (
                    <div className="cw-results">
                      {recipientSearching ? (
                        <p className="cw-results__empty">찾는 중...</p>
                      ) : recipientResults.length === 0 ? (
                        <p className="cw-results__empty">
                          앱에서 찾을 수 없어요. 아직 가입 전이라면 초대 링크로 보내주세요.
                        </p>
                      ) : (
                        recipientResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => onSelectRecipient(u)}
                            className="cw-results__row"
                          >
                            <Avatar user={u} size={34} />
                            <span className="flex-1 min-w-0">
                              <span className="cw-picked__name">{u.display_name}</span>
                              <span className="cw-picked__sub">@{u.username}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
              <p className="cw-note">
                봉인하면 받는 분 캡슐함에 바로 담기고 도착 알림이 가요. 내용은 여는 날까지 아무도 볼 수 없어요.
              </p>
            </div>
          )}

          {capsuleType === 'invite' && (
            <div className="mt-3">
              <input
                type="text"
                value={recipientName}
                onChange={(e) => onRecipientNameChange(e.target.value)}
                maxLength={20}
                placeholder="받는 분 이름이나 애칭 (예: 아들 민준)"
                className="cw-input"
                aria-label="받는 분 이름이나 애칭"
              />
              <p className="cw-note">
                봉인 후 초대 링크를 전하면 받는 분이 자기 캡슐로 등록해요. 아직 앱이 없어도 가입하면 이어져요.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default StepRecipient
