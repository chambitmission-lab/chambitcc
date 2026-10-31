// 기도방 고유 색 — id 해시 팔레트. 홈 '내 그룹' 스토리 링과 /groups 목록 가사 카드가 같은 방에
// 같은 색을 입도록 한 곳에서만 정의한다. (groupColors 는 부서명 매칭이라 대부분 금색이 돼 쓰지 않는다)
export const ROOM_COLORS = ['#3182f6', '#12b886', '#f76707', '#d6336c', '#7048e8', '#0c8599', '#e8590c', '#5c7cfa']

export const roomColor = (id: number) => ROOM_COLORS[Math.abs(id) % ROOM_COLORS.length]
