// 오시는 길(/visit) 번역 — 모든 키가 관리자 인라인 편집 대상이다.
// (types/aboutContent.ts 의 AboutFieldKey 가 이 객체의 키를 그대로 포함한다)
//
// 빈 문자열('')로 둔 값은 "아직 확인되지 않은 사실"이라는 뜻이다.
// 화면은 빈 값을 지어내지 않고 해당 줄을 감추며, 관리자에게만 채우라는 힌트를 띄운다.
export const visit = {
  visitLabel: 'VISIT',
  visitTitle: '참빛교회 오시는 길',
  visitSubtitle: '지하철 7호선 상동역에서 도보 5분',

  // ── 히어로 경로 요약(역 → 골목 → 교회) — 제목을 비우면 해당 칸이 숨겨진다 ──
  visitRouteStep1Title: '상동역',
  visitRouteStep1Desc: '7호선',
  visitRouteStep2Title: '송내대로265번길',
  visitRouteStep2Desc: '편의점 골목',
  visitRouteStep3Title: '참빛교회',
  visitRouteStep3Desc: '도보 약 5분',
  visitRouteDone: '완료',
  visitRouteArrive: '도착',

  // ── 기본 정보 ─────────────────────────
  visitAddress: '경기도 부천시 송내대로265번길 29 (상동, 참빛교회)',
  visitPostcode: '14542',
  visitPhone: '032-323-1004',
  visitMapQuery: '부천 참빛교회',
  /** "위도,경도" — 지도 중심과 마커 위치. 카카오 지오코더로 확인한 실좌표.
   *  비우면 지도 대신 안내 카드가 보인다 */
  visitCoords: '37.50705,126.75687',
  /** 지도 마커 옆에 붙는 짧은 이름 */
  visitMapPinLabel: '참빛교회',

  // ── 지도 ──────────────────────────────
  visitOpenBigMap: '지도 크게 보기',
  visitMapUnavailable: '지도를 불러오지 못했어요. 아래 길찾기를 이용해 주세요.',

  // ── 오시는 방법(접이식) ───────────────
  visitTransitTitle: '대중교통',
  visitTransitDesc: '지하철 · 버스',
  visitDriveTitle: '자가용 · 주차',
  visitDriveDesc: '내비게이션 · 주차 안내',

  visitSubwayTitle: '지하철로 오실 때',
  visitSubwayBody: '7호선 상동역에서 내리시면 도보 약 5분 거리입니다.\n큰길을 따라 걷다 편의점 골목으로 들어오시면 교회 건물이 보입니다.',
  /** 출구 번호 — 확인되면 채운다. 비어 있으면 출구 줄 자체가 숨겨진다 */
  visitSubwayExit: '',

  visitBusTitle: '버스로 오실 때',
  /** 정차 노선·정류장명 — 확인되면 채운다 */
  visitBusBody: '',

  visitCarTitle: '자가용으로 오실 때',
  visitCarBody: '내비게이션에 「참빛교회」 또는 「송내대로265번길 29」를 입력하시면 됩니다.\n위 길찾기 버튼을 누르면 쓰시던 지도 앱이 바로 열립니다.',

  visitParkingTitle: '주차 안내',
  /** 주차 가능 대수·이용 방법 — 확인되면 채운다 */
  visitParkingBody: '',
  /** 주일 혼잡 시간대 등 현실적인 팁 — 확인되면 채운다 */
  visitParkingTip: '',
  // 주차 카드 3종 — 비워 두면 방문자에게는 숨겨진다
  visitParkingCapacityLabel: '주차 가능',
  visitParkingCapacity: '',
  visitParkingCapacityUnit: '대',
  visitParkingTipLabel: '무료 주차 꿀팁',
  visitParkingNearbyLabel: '주변 공영주차장',
  visitParkingNearby: '',
  visitNavLabel: '내비게이션',
  visitFirstTabLabel: '처음 오시는 분',

  // ── 처음 오시는 분 ────────────────────
  visitFirstTitle: '처음 오시는 분께',
  visitFirstBody: '예배 15분 전쯤 도착하시면 가장 여유롭습니다.\n입구에서 「처음 왔어요」라고 말씀해 주시면 안내해 드립니다.\n복장은 편하신 대로 오셔도 괜찮습니다.',
  visitFirstCta: '처음 오시나요?',

  // ── 공통 UI 문구 ──────────────────────
  visitOpenKakao: '카카오맵',
  visitOpenNaver: '네이버지도',
  visitOpenTmap: 'T맵',
  visitCopyAddress: '주소 복사',
  visitCopied: '주소를 복사했습니다',
  visitCopyFailed: '복사에 실패했습니다',
  visitCall: '전화하기',
  visitExitLabel: '출구',

  // ── 지금 출발하면 ─────────────────────
  visitNowTitle: '지금 출발하면',
  visitLocateCta: '내 위치에서 얼마나 걸릴까요?',
  visitLocating: '위치를 확인하는 중…',
  visitLocateDenied: '위치 권한이 없어 거리를 계산할 수 없어요. 아래 길찾기를 이용해 주세요.',
  visitDistanceLabel: '직선거리',
  visitEtaCar: '차로 약',
  visitEtaWalk: '걸어서 약',
  visitEtaNote: '직선거리로 어림한 값이에요. 정확한 시간은 길찾기에서 확인해 주세요.',
  visitLeaveOk: '지금 출발하시면 여유 있게 도착하십니다',
  visitLeaveTight: '지금 바로 출발하셔야 합니다',
  visitLeaveLate: '예배가 이미 시작되었어요. 조용히 들어오셔도 괜찮습니다',
  visitNextService: '다음 예배',
  visitNextServiceIn: '까지',
  visitMinuteUnit: '분',
  visitHourUnit: '시간',

  // ── 초대 ──────────────────────────────
  visitInviteTitle: '함께 오실 분에게',
  visitInviteDesc: '이 안내를 그대로 보내드릴 수 있어요.',
  visitInviteCopy: '초대 링크 복사',
  visitInviteCopied: '초대 링크를 복사했습니다',
  visitInviteQr: 'QR로 보여주기',

  visitAdminHint: '✏️ 아이콘을 눌러 주소·출구·주차 안내를 바로 수정할 수 있습니다. 비워 두면 화면에서 숨겨집니다.',
} as const
