import { useQuery } from '@tanstack/react-query'
import { fetchSuggestions, type SuggestionData } from '../../api/pastor'
import { SectionCard, StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import SuggestionList from './components/SuggestionList'
import { usePastorGate } from './components/pastorUtils'

// 목회 비서 — AI 없이 교회 기록(명부·심방·맡긴 기도·활동·새가족)을 규칙으로 엮어
// '오늘 연락하면 좋은 분'을 이유와 함께 고른다. 규칙은 오른쪽에 그대로 공개한다.

const RULES: Array<{ icon: string; title: string; desc: string }> = [
  { icon: 'flag', title: '기한 지난 후속 할 일', desc: '내 심방 기록에 적은 할 일 중 날짜가 지났거나 오늘인 것' },
  { icon: 'volunteer_activism', title: '답을 기다리는 맡긴 기도', desc: '실명으로 맡긴 기도에 3일 넘게 목회자 답글이 없을 때' },
  { icon: 'local_hospital', title: '병문안 뒤 회복 여쭙기', desc: '병문안 후 1~3주, 그 뒤로 심방 기록이 없을 때' },
  { icon: 'nights_stay', title: '조용해진 분', desc: '최근 1년 기록이 꾸준하던 분이 3주 넘게 소식이 없고, 두 달 안에 심방이 없을 때' },
  { icon: 'waving_hand', title: '첫걸음 전 새가족', desc: '가입 2주가 지났는데 말씀·기도·나눔·그룹 어느 것도 시작 전일 때' },
  { icon: 'cake', title: '생일 · 등록 기념일', desc: '명부에 적힌 생일(3일 안), 교회 등록 기념일(7일 안)' },
  { icon: 'celebration', title: '기도 응답 간증', desc: '최근 7일 안에 실명 공개 기도의 응답을 나눴을 때' },
]

const PastorAssistant = () => {
  const pastor = usePastorGate()
  const { data, isPending } = useQuery<SuggestionData>({
    queryKey: ['pastor-suggestions'],
    queryFn: fetchSuggestions,
    enabled: pastor,
    // 전역 기본(5분 fresh, 만료 시 마운트 재조회)을 따른다 — 'always' 는 방금 본 화면도 매번 서버에 물어
    // 집계 캐시가 식은 순간의 대기를 그대로 노출했다. 심방·할 일 저장은 invalidateQueries 로 즉시 갱신된다.
  })

  return (
    <PastorShell>
      <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="contents lg:block lg:min-w-0">
          <SectionCard
            title="오늘 연락하면 좋은 분"
            action={
              data ? (
                <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-brand">
                  {data.total}명
                </span>
              ) : undefined
            }
          >
            <p className="text-[12px] text-gray-600 dark:text-white/60 leading-relaxed">
              교회 기록을 엮어 급한 순서로 골랐습니다. 심방·전화 기록을 남기거나 할 일을 마치면 다음부터 이유가 풀립니다.
            </p>
            {isPending && !data ? (
              <StatSpinner label="오늘 챙길 분을 고르는 중..." />
            ) : !data ? (
              <p className="py-10 text-center text-[13px] text-gray-600">제안을 불러오지 못했습니다</p>
            ) : (
              <SuggestionList items={data.items} />
            )}
          </SectionCard>
        </div>

        <div className="contents lg:block">
          <SectionCard title="어떻게 고르나요">
            <ul className="space-y-2.5">
              {RULES.map(r => (
                <li key={r.title} className="flex gap-2.5">
                  <span className="material-icons-outlined text-[18px] text-brand shrink-0 mt-0.5">{r.icon}</span>
                  <span>
                    <span className="block text-[12.5px] font-bold text-ink-strong">{r.title}</span>
                    <span className="block text-[12px] text-gray-600 dark:text-white/60 leading-relaxed">{r.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[12px] text-gray-500 dark:text-white/50 leading-relaxed">
              AI를 쓰지 않고 정해진 규칙으로만 고릅니다. 다른 교역자의 심방은 날짜와 방식만 쓰고,
              비밀기도와 익명으로 맡긴 기도는 사람과 연결하지 않습니다.
            </p>
          </SectionCard>
        </div>
      </div>
    </PastorShell>
  )
}

export default PastorAssistant
