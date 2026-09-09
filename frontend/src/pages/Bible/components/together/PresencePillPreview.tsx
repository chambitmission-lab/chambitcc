// /dev/presence-pill — 장 상단 "함께 읽기" 한 줄(캡션형)을 서버·로그인 없이 네 상태로 본다.
// 진짜 ChapterPresencePill 을 그대로 세우므로 여기서 보이는 게 실제 화면이다.
// [data-theme] 은 조상 어디에 있어도 먹으므로 한 화면에서 라이트·다크를 동시에 세운다.
import ChapterPresencePill from './ChapterPresencePill'
import './PresencePillPreview.css'

type Case = { label: string; props: React.ComponentProps<typeof ChapterPresencePill> }

const CASES: Case[] = [
  {
    label: '불러오는 중 — 자리만 잡고 문구는 비운다',
    props: { loading: true, total: undefined, readersToday: undefined, meReadToday: null, meCounted: false, mePending: false },
  },
  {
    label: '지금 함께 읽는 중(나 포함 2명) — 브랜드 색 + 맥박 점',
    props: { loading: false, total: 2, readersToday: 3, meReadToday: true, meCounted: true, mePending: false },
  },
  {
    label: '비로그인·공유 끔 — 나는 카운트 밖이라 남의 수 그대로',
    props: { loading: false, total: 2, readersToday: 3, meReadToday: null, meCounted: false, mePending: false },
  },
  {
    label: '오늘 읽은 성도가 있음(나 포함 3명)',
    props: { loading: false, total: 1, readersToday: 3, meReadToday: true, meCounted: true, mePending: false },
  },
  {
    label: '오늘 독자가 나 하나뿐 — "오늘 1명"이 아니라 첫 독자',
    props: { loading: false, total: 1, readersToday: 1, meReadToday: true, meCounted: true, mePending: false },
  },
  {
    label: '내 하트비트 확정 전 — 남을 셀 수 없어 오늘 기준으로만 말한다',
    props: { loading: false, total: 2, readersToday: 3, meReadToday: false, meCounted: false, mePending: true },
  },
  {
    label: '아직 아무도 없음',
    props: { loading: false, total: 0, readersToday: 0, meReadToday: false, meCounted: false, mePending: false },
  },
]

/** 실제 맥락(진행률 pill → 함께 줄 → 단락 제목 → 절) 안에 얹어 본다 */
const Stage = ({ children }: { children: React.ReactNode }) => (
  <div className="ppv-stage">
    <div className="ppv-stage__progress">
      <span className="ppv-stage__bar"><i /></span>
      <span className="ppv-stage__pct">40%</span>
    </div>
    {children}
    <div className="ppv-stage__heading"><b>하나님이 나를 넘어뜨리심</b> <span>1-12절</span></div>
    <div className="ppv-stage__verse"><span>1</span><p>욥이 대답하여 이르되</p></div>
  </div>
)

const Section = ({ dark }: { dark?: boolean }) => (
  <div className={`ppv-section ${dark ? 'ppv-section--dark' : ''}`} data-theme={dark ? 'dark' : 'light'}>
    <span className="ppv-section__tag">{dark ? '다크' : '라이트'}</span>
    <div className="ppv-card__grid">
      {CASES.map((c) => (
        <div key={c.label} className="ppv-case">
          <span className="ppv-case__label">{c.label}</span>
          <Stage><ChapterPresencePill {...c.props} /></Stage>
        </div>
      ))}
    </div>
  </div>
)

const PresencePillPreview = () => (
  <div className="ppv">
    <div className="ppv__shell">
      <h1 className="ppv__title">함께 읽기 줄 — 캡션형</h1>
      <p className="ppv__sub">
        상자 없는 한 줄. 네 상태 모두 높이가 같아서(1.5rem) 사람이 오가도 본문은 밀리지 않습니다.
      </p>
      <Section />
      <Section dark />
    </div>
  </div>
)

export default PresencePillPreview
