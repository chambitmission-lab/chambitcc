import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMessianicGenealogy } from '../../../hooks/useBibleFigure'
import GenealogyTree from './components/GenealogyTree'
import FigureDetailPanel from './components/FigureDetailPanel'

/**
 * 메시아 구속사 가계도.
 * 아담 → 노아 → 아브라함 → 다윗 → … → 예수 그리스도까지의
 * 메시아 직계 라인을 D3 트리로 시각화한다.
 *
 * 로그인 사용자는 인물별 키 구절 통독 진도에 따라
 * 노드의 안개가 걷히는 연출이 적용된다.
 */
export const Genealogy = () => {
  const { data, isLoading, error } = useMessianicGenealogy()
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  const isLoggedIn = !!localStorage.getItem('access_token')

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <Link to="/bible" className="hover:text-primary">
            성경
          </Link>
          <span>›</span>
          <span>믿음의 가계도</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          믿음의 가계도 — 메시아 구속사 라인
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          아담부터 예수 그리스도까지, 하나님이 친히 보존하신 메시아 약속의 계보입니다.
          노드를 클릭하면 인물의 이야기와 대표 구절을 볼 수 있어요.
          {isLoggedIn ? (
            <>
              {' '}
              통독한 구절이 늘어날수록 인물 카드가 또렷해집니다.
            </>
          ) : (
            <>
              {' '}
              <Link to="/login" className="text-primary hover:underline">
                로그인
              </Link>
              하면 통독한 구절에 따라 가계도의 안개가 걷히는 연출을 보실 수 있습니다.
            </>
          )}
        </p>

        {/* 범례 */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
          <Legend color="#fef3c7" border="#f59e0b" label="메시아" />
          <Legend color="#dbeafe" border="#60a5fa" label="왕" />
          <Legend color="#ede9fe" border="#a78bfa" label="선지자" />
          <Legend color="#fce7f3" border="#f472b6" label="여인 (마 1장)" />
          <Legend color="#f3f4f6" border="#9ca3af" label="족장" />
        </div>
      </header>

      {isLoading && (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          가계도를 불러오는 중...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-300">
          가계도 데이터를 불러오지 못했습니다.
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GenealogyTree
              nodes={data.nodes}
              links={data.links}
              readingProgress={data.reading_progress}
              selectedSlug={selectedSlug}
              onSelect={setSelectedSlug}
              isLoggedIn={isLoggedIn}
            />
            <p className="mt-2 text-xs text-gray-400 text-center">
              스크롤로 위아래 탐색하세요. 확대/축소는 Ctrl(⌘)+휠 또는 두 손가락 핀치로 가능합니다.
            </p>
          </div>
          <div className="lg:col-span-1">
            <FigureDetailPanel
              slug={selectedSlug}
              onSelect={setSelectedSlug}
              onClose={() => setSelectedSlug(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

const Legend = ({
  color,
  border,
  label,
}: {
  color: string
  border: string
  label: string
}) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      className="inline-block w-4 h-4 rounded"
      style={{ backgroundColor: color, border: `1.5px solid ${border}` }}
    />
    {label}
  </span>
)

export default Genealogy
