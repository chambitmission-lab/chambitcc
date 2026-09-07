// 처음 만나는 성경(42화) ↔ 지도여행 연결.
//
// 스토리 데이터(Story/data/act*.ts) 를 건드리지 않고 여기 한 곳에서 잇는다.
// 두 기능은 각자 완결되어야 하고(한쪽이 없어도 다른 쪽이 동작해야 한다),
// 42개 파일에 필드를 흩뿌리면 나중에 지도 슬러그가 바뀔 때 추적이 어렵다.
//
// 무대가 여럿인 화(광야의 40년, 선지자들의 외침 등)는 그 화에서 가장 상징적인
// 한 곳을 고른다. 지도에 찍을 자리가 마땅치 않은 화(창조·타락·계시록 등)는
// 넣지 않는다 — 억지로 이으면 오히려 이상해진다.
export const STORY_PLACE: Record<string, string> = {
  babel: 'ur', // 시날 평지 — 지도에는 같은 메소포타미아의 우르로 대신한다
  abraham: 'haran',
  isaac: 'jerusalem', // 모리아 산
  jacob: 'bethel',
  joseph: 'egypt',
  'burning-bush': 'sinai',
  exodus: 'red-sea',
  sinai: 'sinai',
  wilderness: 'kadesh-barnea',
  jericho: 'jericho',
  saul: 'gibeah',
  david: 'bethlehem',
  solomon: 'jerusalem',
  divided: 'shechem', // 북이스라엘이 갈라져 나온 자리
  exile: 'jerusalem',
  return: 'jerusalem',
  nativity: 'bethlehem',
  baptism: 'jordan',
  sermon: 'capernaum', // 산상수훈의 무대인 갈릴리 — 사역의 본거지로 잇는다
  miracles: 'capernaum',
  jerusalem: 'jerusalem',
  lastsupper: 'olivet', // 겟세마네가 이 산 기슭에 있다
  cross: 'jerusalem',
  resurrection: 'jerusalem',
  pentecost: 'jerusalem',
  paul: 'antioch-syria',
  missions: 'philippi', // 유럽으로 건너간 자리
  letters: 'ephesus',
  revelation: 'ephesus', // 일곱 교회의 첫 교회
}

/** 이 화에 이어 줄 지도 장소가 있는가 */
export const placeForEpisode = (episodeId: string): string | undefined =>
  STORY_PLACE[episodeId]
