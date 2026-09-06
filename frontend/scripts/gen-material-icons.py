#!/usr/bin/env python3
"""Material Icons 서브셋 생성기 — `npm run gen:material-icons`

왜: Google Fonts 에서 받던 Material Icons Outlined/Round 두 벌(152KB+170KB, 2,200 글리프)을
    실제로 쓰는 수십 개 아이콘만 남겨 self-host 한다. 외부 오리진 2개의 차단 CSS 와
    "React 첫 렌더 뒤에야 시작되던" 폰트 요청이 사라지고, index.html 의 preload 로
    문서 파싱 시점에 받는다(느린 4G 실측: 아이콘 도착 7~11s → 0.5s 미만).

어떻게:
  1. src/**/*.{ts,tsx} 를 훑어 Material Icons 코드포인트 목록에 있는 이름과 일치하는
     문자열 리터럴·JSX 텍스트를 전부 모은다 (과포함은 KB 단위라 무해, 누락만 없으면 된다).
     DB 에서 오는 아이콘 이름(상황별 성구 카테고리 등)도 어드민이 코드의 고정 목록에서
     고르므로 같은 스캔에 잡힌다.
  2. fontTools 서브셋: 글자(a-z, 0-9, _)와 선택한 아이콘의 PUA 코드포인트만 남기고
     `rlig`(원본 폰트의 리가처 피처) 룩업을 유지하되 GSUB 클로저는 끈다(켜면 글자만으로 2,200개 리가처가 전부 닫혀
     원본 크기로 되돌아간다).
  3. 결과 폰트의 GSUB 리가처를 다시 읽어 요청한 이름이 전부 살아 있는지 검증한다.

새 아이콘을 쓰면 반드시 이 스크립트를 다시 돌릴 것 — 서브셋에 없는 이름은
아이콘 대신 리가처 원문(글자)이 그대로 보인다. dev 콘솔의 경고(utils/materialIconsCheck.ts)로도 잡힌다.

필요: python3 + `pip3 install fonttools brotli`
"""
from __future__ import annotations

import io
import json
import re
import sys
from pathlib import Path

try:
    from fontTools import subset
    from fontTools.ttLib import TTFont
except ImportError:  # pragma: no cover
    sys.exit("fontTools 가 필요합니다: pip3 install fonttools brotli")

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "src"
FONT_SRC = ROOT / "scripts" / "material-icons"
OUT_DIR = ROOT / "src" / "assets" / "fonts"
MANIFEST = ROOT / "src" / "styles" / "material-icons.manifest.json"

FAMILIES = {
    "outlined": "MaterialIconsOutlined-Regular",
    "round": "MaterialIconsRound-Regular",
}

# 아이콘 이름이 아닐 확률이 높은 흔한 영단어라도 코드포인트 목록에 있으면 포함한다.
# (과포함은 글리프 하나에 100~300B 라 무해하고, 누락은 화면에 글자가 그대로 보인다)
NAME_RE = re.compile(r"^[a-z][a-z0-9_]{1,40}$")
LITERAL_RE = re.compile(r"""(?:'([a-z][a-z0-9_]{1,40})'|"([a-z][a-z0-9_]{1,40})"|`([a-z][a-z0-9_]{1,40})`)""")
# <span className="material-icons-round ...">  name  </span> — 여러 줄·공백 허용
JSX_TEXT_RE = re.compile(r"material-icons[^>]*>\s*([a-z][a-z0-9_]{1,40})\s*<", re.S)


def load_codepoints(family: str) -> dict[str, int]:
    table: dict[str, int] = {}
    for line in (FONT_SRC / f"{family}.codepoints").read_text().splitlines():
        parts = line.split()
        if len(parts) == 2:
            table[parts[0]] = int(parts[1], 16)
    return table


def scan_names(valid: set[str]) -> set[str]:
    found: set[str] = set()
    for path in SRC_DIR.rglob("*"):
        if path.suffix not in {".ts", ".tsx"} or "generated" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        for m in JSX_TEXT_RE.finditer(text):
            found.add(m.group(1))
        for m in LITERAL_RE.finditer(text):
            name = next(g for g in m.groups() if g)
            if name in valid:
                found.add(name)
    return {n for n in found if NAME_RE.match(n)}


def ligature_names(font: TTFont) -> set[str]:
    """서브셋 결과의 GSUB 리가처를 문자열로 되돌려 실제로 살아남은 아이콘 이름을 얻는다."""
    cmap = font.getBestCmap()
    glyph_to_char = {g: chr(cp) for cp, g in cmap.items() if cp < 0xE000}
    names: set[str] = set()
    gsub = font["GSUB"].table
    for lookup in gsub.LookupList.Lookup:
        subtables = lookup.SubTable
        for st in subtables:
            # Extension 룩업은 한 겹 더 벗긴다
            if getattr(st, "ExtSubTable", None) is not None:
                st = st.ExtSubTable
            ligs = getattr(st, "ligatures", None)
            if not ligs:
                continue
            for first, entries in ligs.items():
                for lig in entries:
                    chars = [glyph_to_char.get(first, "?")] + [glyph_to_char.get(c, "?") for c in lig.Component]
                    names.add("".join(chars))
    return names


def build(family_key: str, names: set[str]) -> tuple[Path, int, set[str]]:
    family = FAMILIES[family_key]
    codepoints = load_codepoints(family)
    missing = sorted(n for n in names if n not in codepoints)
    wanted = {n: codepoints[n] for n in names if n in codepoints}

    unicodes = ["U+0030-0039", "U+005F", "U+0061-007A"] + [f"U+{cp:04X}" for cp in wanted.values()]
    args = [
        str(FONT_SRC / f"{family}.woff2"),
        f"--unicodes={','.join(unicodes)}",
        "--layout-features=rlig,liga",
        "--no-layout-closure",
        "--flavor=woff2",
        "--no-hinting",
        "--desubroutinize",
        "--name-IDs=*",
        f"--output-file={OUT_DIR / f'material-icons-{family_key}.woff2'}",
    ]
    subset.main(args)

    out = OUT_DIR / f"material-icons-{family_key}.woff2"
    survived = ligature_names(TTFont(io.BytesIO(out.read_bytes())))
    lost = sorted(n for n in wanted if n not in survived)
    if lost:
        sys.exit(f"[{family_key}] 서브셋에서 리가처가 사라진 아이콘: {lost}")
    return out, out.stat().st_size, set(missing)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    valid = set(load_codepoints(FAMILIES["outlined"])) | set(load_codepoints(FAMILIES["round"]))
    names = scan_names(valid)
    if not names:
        sys.exit("아이콘 이름을 하나도 찾지 못했습니다 — 스캔 정규식을 확인하세요")

    report: dict[str, object] = {"icons": sorted(names)}
    for key in FAMILIES:
        out, size, missing = build(key, names)
        report[key] = {"file": out.name, "bytes": size}
        if missing:
            # 한쪽 스타일에만 없는 이름(예: outlined 전용) — 참고용으로만 남긴다
            report[key]["notInFamily"] = sorted(missing)
        print(f"{key:8s} {size/1024:6.1f} KB  ({len(names) - len(missing)} icons) → {out.relative_to(ROOT)}")

    MANIFEST.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"manifest → {MANIFEST.relative_to(ROOT)} ({len(names)} names)")


if __name__ == "__main__":
    main()
