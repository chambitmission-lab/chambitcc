// 오디오북 듣기-보기 동기화 — 재생 시각 ↔ 낭독 중인 절.
// BibleAudioPlayer 에서 분리: 플레이어는 재생(로드·재생·정지)만 다루고, "지금 몇 절인지"
// 판정과 절로 점프(+준비 전 요청 보관)는 여기서 담당한다.
import { useEffect, useRef, useState, type RefObject } from 'react'
import type { VerseTiming } from '../../../api/bibleTts'

interface UseVerseSyncOptions {
  audioRef: RefObject<HTMLAudioElement | null>
  /** 절별 타이밍(useTtsTimings). 아직 없으면 null */
  timings: VerseTiming[] | null
  /** 지금 낭독 중인 절이 바뀔 때마다 호출 (재생 전/머리말 구간은 null). 언마운트 시 null 로 한 번 더 */
  onActiveVerseChange?: (verse: number | null) => void
  /** 절 점프로 재생 위치를 옮긴 직후 — 플레이어의 시간 표시를 맞춘다 */
  onSeeked: (time: number) => void
}

export const useVerseSync = ({ audioRef, timings, onActiveVerseChange, onSeeked }: UseVerseSyncOptions) => {
  const [activeVerse, setActiveVerse] = useState<number | null>(null)
  const activeVerseRef = useRef<number | null>(null)
  // '여기부터 듣기'로 요청됐지만 아직 점프하지 못한 절.
  // 타이밍/총길이가 준비되는 즉시(타이밍 도착·메타데이터 로드 등) 점프를 재시도한다.
  // 플레이어가 직접 쓰고 지운다(요청 등록·수동 탐색 시 취소·장 이동/종료 시 소멸).
  const pendingVerseRef = useRef<number | null>(null)
  // 부모 콜백은 ref로 보관 — 렌더마다 바뀌어도 이펙트/핸들러를 재구성하지 않는다
  const onActiveVerseChangeRef = useRef(onActiveVerseChange)
  onActiveVerseChangeRef.current = onActiveVerseChange

  // 재생 시각 → 지금 낭독 중인 절 (마지막으로 start를 지난 절)
  const syncActiveVerse = (time: number | null) => {
    let v: number | null = null
    if (time !== null && timings && timings.length > 0) {
      for (const t of timings) {
        if (time >= t.start) v = t.verse
        else break
      }
    }
    if (v !== activeVerseRef.current) {
      activeVerseRef.current = v
      setActiveVerse(v)
      onActiveVerseChangeRef.current?.(v)
    }
  }

  // 해당 절의 시작 시각으로 점프. 절별 타이밍과 총길이(캐시 mp3)가 있어야 가능 —
  // 첫 스트리밍 생성 중엔 둘 다 없어 실패하고, 준비되면 tryPendingSeek로 재시도된다.
  const trySeekToVerse = (verse: number): boolean => {
    const audio = audioRef.current
    if (!audio || !timings) return false
    const t = timings.find((x) => x.verse === verse)
    if (!t) return false
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return false
    audio.currentTime = t.start
    onSeeked(t.start)
    syncActiveVerse(t.start)
    return true
  }

  const tryPendingSeek = () => {
    const v = pendingVerseRef.current
    if (v == null) return
    if (trySeekToVerse(v)) pendingVerseRef.current = null
  }

  // 타이밍이 재생 도중(첫 스트리밍 완료 후) 늦게 도착하면 즉시 한 번 동기화.
  // 대기 중인 절 점프가 있으면 그 절로 이동하는 것이 곧 동기화다.
  useEffect(() => {
    if (!timings) return
    const v = pendingVerseRef.current
    if (v != null && trySeekToVerse(v)) {
      pendingVerseRef.current = null
      return
    }
    syncActiveVerse(audioRef.current?.currentTime ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timings])

  // 장 이동 등으로 언마운트되면 본문 하이라이트도 해제
  useEffect(
    () => () => {
      onActiveVerseChangeRef.current?.(null)
    },
    []
  )

  return { activeVerse, pendingVerseRef, syncActiveVerse, trySeekToVerse, tryPendingSeek }
}
