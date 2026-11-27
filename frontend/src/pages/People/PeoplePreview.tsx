// /dev/people — 백엔드 없이 섬기는 사람들 화면을 확인하는 미리보기 (DEV 전용)
//
// 마이그레이션 전이나 사진을 아직 못 받은 단계에서도 배치·간격·다크모드를 볼 수 있게
// React Query 캐시에 표본을 심고 실제 화면(People)을 그대로 렌더한다.
// 표본은 가상의 인물이다 — 실제 성도 정보를 코드에 남기지 않는다.
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { peopleKeys } from '../../hooks/usePeople'
import { SAMPLE } from './peopleSample'
import People from './People'

const PeoplePreview = () => {
  const queryClient = useQueryClient()
  // 렌더 전에 심어야 첫 프레임부터 표본이 보인다 (useState 초기화 = 1회만 실행)
  useState(() => {
    queryClient.setQueryData(peopleKeys.all, SAMPLE)
    return null
  })

  return <People />
}

export default PeoplePreview
