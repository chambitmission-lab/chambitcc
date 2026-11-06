import type { TimelineEvent } from '../../types/growth'
import ActivityTimeline from '../Growth/components/ActivityTimeline'
import { ymdLocal } from '../Growth/components/timelineMeta'

/**
 * /#/dev/footprints — /growth '하루하루의 발자취' 표본(순간 강조 피드 + 하루 한 문장).
 * 오늘 기준 상대 날짜로 만든다: 조용한 날 접기·응답 기도 골드·순간 접기까지 한 화면에 나오게.
 */
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return ymdLocal(d)
}

let seq = 0
const ev = (ago: number, p: Partial<TimelineEvent> & Pick<TimelineEvent, 'type' | 'domain' | 'title'>): TimelineEvent => {
  const date = daysAgo(ago)
  return {
    id: `s${seq++}`,
    occurred_at: `${date}T${p.time ?? '12:00'}:00`,
    date,
    time: null,
    accent: 'purple',
    meta: {},
    link: '/',
    ...p,
  }
}

const read = (ago: number, title: string, verses: number) =>
  ev(ago, { type: 'read', domain: 'bible', title: `${title} 읽기`, snippet: `${verses}절 읽었어요`, meta: { verse_count: verses }, link: '/bible' })

const SAMPLE: TimelineEvent[] = [
  read(0, '창세기 12장 외 4곳', 77),
  read(1, '창세기 10장 외 2곳', 72),
  ev(1, { type: 'intercession', domain: 'prayer', title: '2개의 기도에 함께했어요', meta: { count: 2 } }),
  ev(1, {
    type: 'prayer', domain: 'prayer', title: '기도를 올렸어요', time: '06:53',
    snippet: '사랑과 은혜가 풍성하신 하나님 아버지, 오늘도 새로운 아침을 주시고 생명과 호흡을 허락해 주셔서 감사합니다. 하루를 시작하며 제 마음을 주님께 드리오니, 걱정보다 믿음으로 걷게 하소서.',
  }),
  read(2, '창세기 8장 외 1곳', 64),
  ev(3, { type: 'meditation', domain: 'devotional', title: '시편 23편 묵상', time: '07:02', snippet: '부족함이 없으리로다. 오늘 내가 부족하다고 느낀 것들을 다시 세어 보았다.' }),
  ev(3, { type: 'thanks', domain: 'thanks', title: '감사를 적었어요', time: '21:10', snippet: '아이가 처음으로 식사 기도를 했어요.' }),
  ev(4, {
    type: 'answered', domain: 'prayer', title: '기도가 응답되었어요: 어머니 수술', time: '15:20',
    snippet: '수술이 잘 끝났어요. 함께 기도해 주신 분들께 감사드립니다.',
  }),
  ev(4, { type: 'thanks', domain: 'thanks', title: '감사를 적었어요', time: '20:00', snippet: '병원 가는 길이 막히지 않았어요.' }),
  ev(4, { type: 'prayer', domain: 'prayer', title: '기도를 올렸어요', time: '22:40', snippet: '회복의 시간도 주님께 맡겨 드립니다.' }),
  read(5, '창세기 6장', 22),
  read(6, '창세기 4장 외 1곳', 58),
  ev(6, { type: 'plan', domain: 'bible', title: "'모세오경 함께 읽기' 6일차 완료" }),
  read(7, '창세기 3장', 24),
  read(8, '창세기 1장 외 1곳', 56),
  ev(8, { type: 'session', domain: 'prayer', title: '15분 기도했어요', time: '05:30', meta: { duration_min: 15 } }),
]

export default function FootprintsPreview() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: 24 }}>
      <ActivityTimeline
        events={SAMPLE}
        pageCount={1}
        hasMore={false}
        isLoadingMore={false}
        onLoadMore={() => {}}
      />
    </div>
  )
}
