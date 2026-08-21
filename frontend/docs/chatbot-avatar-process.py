# 챗봇 아바타 가공: 제미나이 워터마크 제거(좌우 미러 패치) + 192px webp 변환
import os
from PIL import Image

SRC = r"C:\Users\k1988\Downloads"
DST = r"C:\Users\k1988\idea\chambitcc-main\frontend\src\components\chatbot\img"
NAMES = ["default", "talking", "thinking", "joy", "comfort", "sorry", "praying"]

os.makedirs(DST, exist_ok=True)

for name in NAMES:
    im = Image.open(os.path.join(SRC, f"{name}.png")).convert("RGB")
    w, h = im.size
    # 워터마크는 우하단 (1024 기준 대략 x 840~980, y 840~960).
    # 배경 라디얼 그라데이션이 좌우 대칭이므로, 세로 중심축 기준 미러 위치의
    # 패치를 좌우 반전해 덮으면 이음새 없이 지워진다.
    x1, y1, x2, y2 = 840, 840, 985, 965
    if (w, h) != (1024, 1024):
        sx, sy = w / 1024, h / 1024
        x1, x2 = int(x1 * sx), int(x2 * sx)
        y1, y2 = int(y1 * sy), int(y2 * sy)
    mx1, mx2 = w - x2, w - x1
    patch = im.crop((mx1, y1, mx2, y2)).transpose(Image.FLIP_LEFT_RIGHT)
    im.paste(patch, (x1, y1))

    # ── 줌 크롭: 어두운 외곽을 걷어내고 캐릭터(밝은 원형 비네트)가 꽉 차게 ──
    # 16x16 블록 평균 밝기로 '밝은 영역' 바운딩박스를 찾는다 (별 몇 개는 블록
    # 평균에 묻혀 무시됨). 그 박스를 8% 더 파고들어 얼굴을 키운다.
    gray = im.convert("L")
    small = gray.resize((64, 64), Image.BOX)  # 64x64 = 16px 블록 평균
    px = small.load()
    bg_level = max(px[1, 1], px[62, 1], px[1, 62], px[62, 62])
    thresh = bg_level + 14
    xs, ys = [], []
    for by in range(64):
        for bx in range(64):
            if px[bx, by] > thresh:
                xs.append(bx)
                ys.append(by)
    if xs:
        sx, sy = w / 64, h / 64
        bx1, bx2 = min(xs) * sx, (max(xs) + 1) * sx
        by1, by2 = min(ys) * sy, (max(ys) + 1) * sy
        cx, cy = (bx1 + bx2) / 2, (by1 + by2) / 2
        side = max(bx2 - bx1, by2 - by1) * 0.86  # 6~8% 더 줌 인
        half = side / 2
        cx = min(max(cx, half), w - half)
        cy = min(max(cy, half), h - half)
        im = im.crop((int(cx - half), int(cy - half), int(cx + half), int(cy + half)))

    out = im.resize((192, 192), Image.LANCZOS)
    path = os.path.join(DST, f"{name}.webp")
    out.save(path, "WEBP", quality=82, method=6)
    print(f"{name}: {w}x{h} crop={im.size} -> 192x192, {os.path.getsize(path)/1024:.1f}KB")
