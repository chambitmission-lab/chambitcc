// 예배 스크린용 공동 기도제목 전체화면 뷰 — PPT 슬라이드 대체
// /prayer-topics/screen (최신) 또는 /prayer-topics/screen?id=3 (특정 주차)
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCurrentWeeklyPrayer, getWeeklyPrayer } from '../../api/weeklyPrayer'
import type { WeeklyPrayer } from '../../types/weeklyPrayer'

const WeeklyPrayerScreen = () => {
  const [searchParams] = useSearchParams()
  const [prayer, setPrayer] = useState<WeeklyPrayer | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const idParam = searchParams.get('id')
    const load = async () => {
      try {
        const data = idParam
          ? await getWeeklyPrayer(Number(idParam))
          : await getCurrentWeeklyPrayer()
        setPrayer(data)
      } catch {
        setError(true)
      }
    }
    void load()
  }, [searchParams])

  // 스크린 모드 동안 전역 스크롤 배경을 어둡게
  useEffect(() => {
    const prev = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#1a2420'
    return () => {
      document.body.style.backgroundColor = prev
    }
  }, [])

  // F키로 전체화면 토글 (예배 송출 편의)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) {
          void document.exitFullscreen()
        } else {
          void document.documentElement.requestFullscreen()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] overflow-auto"
      style={{
        // 예배당 스크린 톤 — 짙은 청록빛 차콜 (기존 PPT와 동일한 분위기)
        background: 'radial-gradient(ellipse at 50% 0%, #223028 0%, #1a2420 55%, #141c19 100%)',
        color: '#f3efe4',
        fontFamily:
          "'Noto Serif KR', 'Nanum Myeongjo', 'Apple SD Gothic Neo', serif",
      }}
    >
      {!prayer ? (
        <div className="h-full flex items-center justify-center text-[2.5vmin] opacity-60">
          {error ? '등록된 기도제목이 없습니다' : '불러오는 중...'}
        </div>
      ) : (
        <div className="min-h-full flex flex-col px-[7vw] py-[5vh]">
          {/* 타이틀 */}
          <h1
            className="text-center font-bold tracking-[0.35em] mb-[5vh]"
            style={{ fontSize: 'clamp(28px, 4.2vmin, 64px)' }}
          >
            {prayer.title}
          </h1>

          {/* 항목 */}
          <div className="flex-1 flex flex-col justify-center gap-[4.5vh] pb-[4vh]">
            {prayer.items.map((item, i) => (
              <div key={item.id ?? i}>
                {item.title ? (
                  <p
                    className="font-bold leading-[1.55]"
                    style={{ fontSize: 'clamp(20px, 3.1vmin, 44px)' }}
                  >
                    {i + 1}. {item.title}
                  </p>
                ) : (
                  // 제목 없는 통문단 형태 — 번호 + 기도문 전문
                  <p
                    className="leading-[1.75]"
                    style={{ fontSize: 'clamp(18px, 2.8vmin, 40px)' }}
                  >
                    <span className="font-bold">{i + 1}.</span> {item.body}
                  </p>
                )}
                {item.title && item.body && (
                  <p
                    className="mt-[1.2vh] pl-[2.2vw] leading-[1.75]"
                    style={{
                      fontSize: 'clamp(17px, 2.6vmin, 38px)',
                      color: '#ddd6c4',
                    }}
                  >
                    “{item.body}”
                  </p>
                )}
                {item.scripture && (
                  <p
                    className="mt-[0.8vh] pl-[2.2vw] opacity-70"
                    style={{ fontSize: 'clamp(14px, 2vmin, 28px)' }}
                  >
                    ({item.scripture})
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default WeeklyPrayerScreen
