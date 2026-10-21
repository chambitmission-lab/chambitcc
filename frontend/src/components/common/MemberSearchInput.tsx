// 앱 사용자 검색 인풋 — 반 만들기(여러 명 담기)·멤버 시트(즉시 추가)·기도방·릴레이·동행 초대가 함께 쓴다.
// 어느 도메인에도 묶이지 않는다: 결과 모양은 types/member.MemberHit, 검색 함수는 search 로 바꿔 끼울 수 있다.
import { useEffect, useState } from 'react'
import { searchMembers } from '../../api/user'
import type { MemberHit } from '../../types/member'

const MemberSearchInput = ({
  excludeIds,
  onPick,
  placeholder = '이름을 검색해 앱 사용자를 바로 넣어요',
  emptyHint = '앱에서 찾을 수 없어요. 아직 가입 전이라면 초대 코드를 공유해주세요.',
  search = searchMembers,
}: {
  excludeIds: number[]
  onPick: (user: MemberHit) => void
  placeholder?: string
  emptyHint?: string
  /** 검색 함수 — 기본은 앱 사용자 전체. 범위를 좁히려면(같은 반·같은 그룹) 다른 함수를 넘긴다 */
  search?: (q: string) => Promise<MemberHit[]>
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MemberHit[]>([])
  const [searching, setSearching] = useState(false)

  // 300ms 디바운스, 응답 역전 방지 (캡슐과 동일 패턴)
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    let stale = false
    const timer = setTimeout(async () => {
      try {
        const found = await search(q)
        if (!stale) setResults(found)
      } catch {
        if (!stale) setResults([])
      } finally {
        if (!stale) setSearching(false)
      }
    }, 300)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [query, search])

  const visible = results.filter((u) => !excludeIds.includes(u.id))

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={20}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[14px] focus:outline-none focus:border-brand placeholder:text-gray-400 dark:placeholder:text-white/35"
      />
      {query.trim() && (
        <div className="mt-1.5 rounded-xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] overflow-hidden">
          {searching ? (
            <p className="px-4 py-3 text-[12.5px] text-gray-400 dark:text-white/40">찾는 중...</p>
          ) : visible.length === 0 ? (
            <p className="px-4 py-3 text-[12.5px] text-gray-400 dark:text-white/40 leading-[1.6]">
              {emptyHint}
            </p>
          ) : (
            visible.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setQuery('')
                  setResults([])
                  onPick(u)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b last:border-b-0 border-gray-100 dark:border-white/[0.05] active:bg-gray-50 dark:active:bg-white/[0.04]"
              >
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-[var(--brand-soft)] text-brand text-[13.5px] font-extrabold flex items-center justify-center shrink-0">
                    {u.display_name.charAt(0)}
                  </span>
                )}
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-bold text-ink-strong truncate">
                    {u.display_name}
                  </span>
                  <span className="block text-[11px] text-gray-400 dark:text-white/40 truncate">
                    @{u.username}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </>
  )
}

export default MemberSearchInput
