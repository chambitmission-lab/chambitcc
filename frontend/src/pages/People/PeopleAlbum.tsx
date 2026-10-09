// 섬기는 사람들 히어로의 사진첩 — 마스킹테이프로 붙인 폴라로이드 + 선교지 엽서
//
// 사진 고르는 규칙(백엔드 무변경, 전부 클라이언트에서):
// - 담임목사(대표 카드 첫 분)는 늘 가운데 맨 앞에 고정 — 매일 바뀌면 사진첩이 산만하다
// - 나머지는 교역자 2 · 장로 2 · 교회직원 1 을 '오늘 날짜(KST)'로 섞어 뽑는다.
//   새로고침해도 그날은 같은 얼굴, 다음 날은 다른 얼굴 — 사진 있는 분들이 돌아가며 걸린다.
//   어느 분류가 모자라면 다른 분류 사진으로 채운다.
// - 선교사는 폴라로이드에 걸지 않는다. 보안 지역 사역자는 일부러 사진을 비워 두므로
//   얼굴 대신 '선교지에서 온 엽서'(국기 우표 + 나라 수 소인) 한 장으로 사진첩에 들어온다.
import { useMemo } from 'react'
import CountryFlag from '../../components/common/CountryFlag'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { kstDateKey } from '../../utils/kstTime'
import { leaderText, personText } from '../../types/people'
import type { LeaderSlot, Person, PersonCategory } from '../../types/people'

// 캡션·엽서·'늘 고맙습니다' 손글씨 — 이 화면 청크가 평가될 때 붙인다
void ensureFontFamily('nanumPen')

interface Polaroid {
  key: string
  photo: string
  name: string
  caption: string
  person: Person | null
  lead?: boolean
}

// 분류별 몫 — 합이 5, 담임목사까지 6장(모바일은 CSS 가 앞 4장만 보인다)
const QUOTA: [PersonCategory, number][] = [
  ['pastor', 2],
  ['elder', 2],
  ['staff', 1],
]
const ROTATING_SLOTS = QUOTA.reduce((sum, [, n]) => sum + n, 0)

// 날짜 + id 로 정해지는 순서 — Math.random 이면 리렌더마다 사진이 바뀐다
const dailyRank = (day: string, id: number): number => {
  let h = 2166136261
  const s = `${day}:${id}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

interface PeopleAlbumProps {
  leaderSlots: LeaderSlot[]
  people: Person[]
  language: 'ko' | 'en'
  onOpenPerson: (person: Person) => void
  onOpenMissionaries: () => void
}

const PeopleAlbum = ({
  leaderSlots,
  people,
  language,
  onOpenPerson,
  onOpenMissionaries,
}: PeopleAlbumProps) => {
  const ko = language === 'ko'

  const polaroids = useMemo<Polaroid[]>(() => {
    const day = kstDateKey(new Date())
    const list: Polaroid[] = []

    const leader = leaderSlots.find((slot) => slot.status === 'current' && slot.photo_url)
    if (leader) {
      list.push({
        key: leader.key,
        photo: leader.photo_url as string,
        name: leaderText(leader, 'name', language),
        caption: leaderText(leader, 'role', language),
        person: leader.person,
        lead: true,
      })
    }

    const pool = people
      .filter((p) => p.photo_url && p.category !== 'missionary')
      .sort((a, b) => dailyRank(day, a.id) - dailyRank(day, b.id))

    const picked = new Set<number>()
    QUOTA.forEach(([category, n]) => {
      pool
        .filter((p) => p.category === category)
        .slice(0, n)
        .forEach((p) => picked.add(p.id))
    })
    // 모자란 몫은 남은 사진으로
    pool.forEach((p) => {
      if (picked.size < ROTATING_SLOTS) picked.add(p.id)
    })

    pool
      .filter((p) => picked.has(p.id))
      .forEach((p) =>
        list.push({
          key: `p-${p.id}`,
          photo: p.photo_url as string,
          name: personText(p, 'name', language),
          caption: personText(p, 'role', language) || personText(p, 'group', language),
          person: p,
        }),
      )
    return list
  }, [leaderSlots, people, language])

  const countries = useMemo(() => {
    const codes = people
      .filter((p) => p.category === 'missionary' && p.country_code)
      .map((p) => (p.country_code as string).toLowerCase())
    return [...new Set(codes)]
  }, [people])
  const missionaryCount = people.filter((p) => p.category === 'missionary').length

  if (polaroids.length === 0 && missionaryCount === 0) return null

  return (
    <div className="ppl-album" aria-label={ko ? '섬기는 분들 사진첩' : 'Photo album'}>
      {polaroids.map((item, index) => {
        const inner = (
          <>
            <span className="ppl-pola-tape" aria-hidden />
            <span className="ppl-pola-photo">
              <img src={item.photo} alt="" decoding="async" />
            </span>
            <span className="ppl-pola-cap">
              {item.name} {item.caption}
            </span>
          </>
        )
        const className = `ppl-pola ${item.lead ? 'is-lead' : ''}`
        const style = { animationDelay: `${index * 70}ms` }
        return item.person ? (
          <button
            key={item.key}
            type="button"
            data-slot={index}
            className={className}
            style={style}
            onClick={() => onOpenPerson(item.person as Person)}
            aria-label={`${item.name} ${item.caption}`}
          >
            {inner}
          </button>
        ) : (
          <div key={item.key} data-slot={index} className={className} style={style}>
            {inner}
          </div>
        )
      })}

      {missionaryCount > 0 && (
        <button
          type="button"
          className="ppl-postcard"
          style={{ animationDelay: `${polaroids.length * 70}ms` }}
          onClick={onOpenMissionaries}
          aria-label={
            ko
              ? `파송 선교사 ${missionaryCount}명 보기`
              : `See ${missionaryCount} missionaries`
          }
        >
          <span className="ppl-postcard-stamp" aria-hidden>
            {countries[0] && <CountryFlag code={countries[0]} />}
          </span>
          {countries.length > 0 && (
            <span className="ppl-postcard-mark" aria-hidden>
              {ko ? `${countries.length}개 나라` : `${countries.length} lands`}
            </span>
          )}
          <span className="ppl-postcard-hand">
            {ko ? '선교지에서 온 편지' : 'Letters from the field'}
          </span>
          <span className="ppl-postcard-flags" aria-hidden>
            {countries.slice(1, 5).map((code) => (
              <CountryFlag key={code} code={code} />
            ))}
          </span>
          <span className="ppl-postcard-sub">
            {ko ? `파송 선교사 ${missionaryCount}명` : `${missionaryCount} missionaries`}
          </span>
        </button>
      )}
    </div>
  )
}

export default PeopleAlbum
