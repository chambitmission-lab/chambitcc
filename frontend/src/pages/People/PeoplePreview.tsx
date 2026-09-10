// /dev/people — 백엔드 없이 섬기는 사람들 화면을 확인하는 미리보기 (DEV 전용)
//
// 마이그레이션 전이나 사진을 아직 못 받은 단계에서도 배치·간격·다크모드를 볼 수 있게
// React Query 캐시에 표본을 심고 실제 화면(People)을 그대로 렌더한다.
// 표본은 가상의 인물이다 — 실제 성도 정보를 코드에 남기지 않는다.
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { peopleKeys } from '../../hooks/usePeople'
import type { PeopleDirectory, Person } from '../../types/people'
import People from './People'

const person = (id: number, data: Partial<Person> & { name_ko: string }): Person => ({
  id,
  category: 'pastor',
  sort_order: id,
  is_published: true,
  ...data,
})

const SAMPLE: PeopleDirectory = {
  // 서버와 같은 순서 — 원로목사가 왼쪽, 담임목사가 그 다음 (레거시 예우 순서)
  leaders: [
    {
      pastor_id: 2,
      name_ko: '이은혜',
      role_ko: '원로목사',
      headline_ko: '한 영혼을 천하보다 귀히 여긴 목회',
      status: 'emeritus',
    },
    {
      pastor_id: 1,
      name_ko: '김참빛',
      role_ko: '담임목사',
      headline_ko: '복있는 사람으로 불리는 것을 가장 좋아합니다',
      status: 'current',
    },
  ],
  people: [
    person(11, {
      name_ko: '박요한',
      role_ko: '목사',
      group_ko: '부목사',
      phone: '032-000-1001',
      assignments_ko: '2교구\n2청년부\n참빛선교회\n장립집사회',
      bio_ko: '청년들과 함께 말씀을 읽고 삶을 나눕니다.',
      verse_ko: '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라 (빌 4:13)',
      started_on: '2019-03-01',
    }),
    person(12, {
      name_ko: '최다니엘',
      role_ko: '목사',
      group_ko: '부목사',
      phone: '032-000-1002',
      assignments_ko: '1교구\n찬양위원회',
    }),
    person(13, {
      name_ko: '정한나',
      role_ko: '전도사',
      group_ko: '전도사',
      phone: '032-000-1003',
      assignments_ko: '유치부\n교육위원회',
    }),
    person(14, {
      name_ko: '오사무엘',
      role_ko: '전도사',
      group_ko: '전도사',
      assignments_ko: '중고등부',
    }),
    person(21, {
      category: 'missionary',
      name_ko: '한믿음',
      role_ko: '선교사',
      group_ko: '파송선교사',
      field_ko: '캄보디아 프놈펜',
      country_code: 'kh',
      org_ko: 'GMS',
      started_on: '2016-09-01',
      bio_ko: '현지 교회 개척과 어린이 사역을 섬기고 있습니다.',
    }),
    person(22, {
      category: 'missionary',
      name_ko: '서소망',
      role_ko: '선교사',
      group_ko: '파송선교사',
      field_ko: '베트남 하노이',
      country_code: 'vn',
    }),
    person(31, {
      category: 'elder',
      name_ko: '강든든',
      role_ko: '장로',
      group_ko: '시무장로',
      assignments_ko: '재정위원회\n건축위원회',
      started_on: '2012-11-04',
    }),
    person(32, {
      category: 'elder',
      name_ko: '윤평강',
      role_ko: '장로',
      group_ko: '시무장로',
      assignments_ko: '예배위원회',
    }),
    person(33, {
      category: 'elder',
      name_ko: '조기쁨',
      role_ko: '장로',
      group_ko: '은퇴장로',
    }),
    person(41, {
      category: 'staff',
      name_ko: '남살림',
      role_ko: '관리집사',
      group_ko: '교회직원',
      phone: '032-000-2001',
      assignments_ko: '시설 관리',
    }),
    person(42, {
      category: 'staff',
      name_ko: '문사랑',
      role_ko: '사무간사',
      group_ko: '교회직원',
      phone: '032-000-2002',
      email: 'office@example.org',
      assignments_ko: '행정 · 주보',
    }),
  ],
}

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
