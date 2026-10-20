// 이번 주 말씀 따라 살기 — 목사님이 /pastor 개요의 '한 주 묶음'에서 확인하고 공개한 것만 보인다(없으면 그리지 않는다).
// 주보 요약 3줄 · 요일별 가정예배(오늘 요일이 먼저 열림, 주일엔 월요일) · 다음세대와 함께 읽기.
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Sermon } from '../../../types/sermon'
import { getSermonExtras } from '../../../api/sermonTakeaway'
import { sermonKeys } from '../../../hooks/queryKeys'
import { showToast } from '../../../utils/toast'

const DAYS = ['월', '화', '수', '목', '금', '토']
const todayDay = () => {
  const d = new Date().getDay() // 0=일
  return d === 0 ? '월' : DAYS[d - 1]
}

const SermonWeekPackBlock = ({ sermon }: { sermon: Sermon }) => {
  // 나눔 질문 블록과 같은 쿼리 — 설교 한 편에 요청 하나
  const { data: pack } = useQuery({
    queryKey: sermonKeys.extras(sermon.id),
    queryFn: () => getSermonExtras(sermon.id),
    staleTime: 1000 * 60 * 10,
    select: x => x.week_pack,
  })
  const [day, setDay] = useState(todayDay)
  if (!pack || (!pack.summary.length && !pack.kids && !pack.devotions.length)) return null

  const devotion = pack.devotions.find(d => d.day === day) ?? pack.devotions[0]

  const share = async () => {
    if (!devotion) return
    const text = [
      `「${sermon.title}」 ${devotion.day}요일 가정예배`,
      devotion.passage ? `본문: ${devotion.passage}` : null,
      devotion.text ? `“${devotion.text}”` : null,
      '',
      devotion.title,
      devotion.body,
      devotion.prayer ? `\n🙏 ${devotion.prayer}` : null,
    ]
      .filter(l => l !== null)
      .join('\n')
    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      showToast('가정예배를 복사했어요', 'success')
    } catch {
      showToast('복사하지 못했어요', 'error')
    }
  }

  return (
    <div className="sl-discuss sl-week">
      <div className="sl-discuss-head">
        <span className="material-icons-outlined" aria-hidden>date_range</span>
        <b>이번 주 말씀 따라 살기</b>
      </div>

      {pack.summary.length > 0 && (
        <ul className="sl-week-summary">
          {pack.summary.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}

      {pack.devotions.length > 0 && devotion && (
        <div className="sl-week-dev">
          <p className="sl-week-label">가정예배</p>
          <div className="sl-week-days" role="tablist" aria-label="요일">
            {pack.devotions.map(d => (
              <button
                key={d.day}
                type="button"
                role="tab"
                aria-selected={d.day === devotion.day}
                className={d.day === devotion.day ? 'is-on' : undefined}
                onClick={() => setDay(d.day)}
              >
                {d.day}
              </button>
            ))}
          </div>
          <div className="sl-week-card">
            {devotion.passage && <p className="sl-week-ref">{devotion.passage}</p>}
            {devotion.text && <p className="sl-week-verse">“{devotion.text}”</p>}
            {devotion.title && <h4>{devotion.title}</h4>}
            {devotion.body && <p className="sl-week-body">{devotion.body}</p>}
            {devotion.prayer && (
              <p className="sl-week-prayer">
                <b>함께 기도</b>
                {devotion.prayer}
              </p>
            )}
          </div>
          <div className="sl-step-actions">
            <button type="button" className="sl-btn" onClick={share}>
              <span className="material-icons-outlined">ios_share</span>
              가족과 나누기
            </button>
          </div>
        </div>
      )}

      {pack.kids && (
        <details className="sl-week-kids">
          <summary>
            <span className="material-icons-outlined" aria-hidden>child_care</span>
            다음세대와 함께 읽기
          </summary>
          <p>{pack.kids}</p>
        </details>
      )}
    </div>
  )
}

export default SermonWeekPackBlock
