// 설교 시범 화면 — /sermon/new
// 성도 의견을 받는 동안 기본 /sermon(빛 히어로)은 그대로 두고, 영상 히어로 갈래를 따로 띄운다.
// 의견 수렴이 끝나면 고른 쪽만 남기고 이 파일·라우트·배너를 정리한다.
import Sermon from './Sermon'

const SermonLab = () => <Sermon variant="video" />

export default SermonLab
