"""레일 하단 삽화 후처리 — 제미나이가 깔아 준 평면 배경을 **레일 배경색과 정확히 같은 값**으로 맞춘다.

왜 투명(알파) 대신 이 길인가 —
  최소 알파로 배경을 키잉하면 연한 워시의 알파가 0.05~0.1 밖에 안 되고, 색은 1/a 로
  되돌리므로 노이즈가 10~50배 증폭된 잡음 벌판이 된다. 손실 압축이 그 잡음을 인코딩하느라
  같은 그림이 **18KB → 455KB** 로 뛴다(실측. 색 번짐 채우기·알파 바닥 처리로도 안 내려간다).
  이 그림은 배경이 완전 평면이고 그 색을 우리가 정할 수 있으므로, 알파를 만들 이유가 없다.
  배경을 레일 색과 **완전히 같은 값**으로 옮겨 놓으면 판(액자)은 원래 생기지 않는다.
★ 단, 레일 배경 토큰(--desktop-chrome)이 바뀌면 이 에셋도 다시 구워야 한다.

    python docs/gemini-unwatermark.py ~/Downloads/1.png 1-clean.png --min-step=2
    python docs/rail-bottom-process.py 1-clean.png fit-light.png f1f3f6 496
    cwebp -q 92 fit-light.png -o public/images/rail/bottom-light.webp

★ webp 손실 압축(4:2:0)은 평면 배경을 1레벨쯤 민다(#f1f3f6 → #f2f3f7). 사전 보정으로는
  정확히 못 맞춘다(크로마 양자화 탓에 값이 진동한다) → 남은 1레벨은 CSS 마스크가
  네 변을 배경으로 녹여서 지운다(DesktopNavRail.css). 그래서 이 스크립트는 "가깝게"만 맞춘다.
"""
import sys
import numpy as np
from PIL import Image

src, dst, target_hex, width = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
target = np.array([int(target_hex[i:i + 2], 16) for i in (0, 2, 4)], float)

a = np.asarray(Image.open(src).convert('RGB')).astype(float)
# 배경색 실측 — 네 귀퉁이는 어느 그림에서도 빈 배경이다
corners = np.concatenate([a[:80, :80].reshape(-1, 3), a[:80, -80:].reshape(-1, 3), a[-60:, -60:].reshape(-1, 3)])
bg = np.median(corners, 0)
a = np.clip(a + (target - bg), 0, 255)

h = round(a.shape[0] * width / a.shape[1])
im = Image.fromarray(a.astype(np.uint8), 'RGB').resize((width, h), Image.LANCZOS)
im.save(dst)
chk = np.asarray(im).astype(int)[:6, :6].reshape(-1, 3)
print(f"{dst}  {width}x{h}  배경 {tuple(bg.round(1))} → {tuple(chk.mean(0).round(2))}  (목표 {tuple(target.astype(int))})")
