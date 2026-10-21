// 숫자 카운트업은 공용 hooks/useCountUp 을 쓴다 (랜딩은 active 로 화면에 들어온 뒤 시작)

export const fmtNum = (n: number, ko: boolean) =>
  ko ? n.toLocaleString('ko-KR') : n.toLocaleString('en-US')
