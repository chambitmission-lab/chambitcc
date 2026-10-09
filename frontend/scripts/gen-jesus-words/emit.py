import json, sys, os, re
d = json.load(open(sys.argv[1]))['res']; outdir = sys.argv[2]
names = {40: '마태복음', 41: '마가복음', 42: '누가복음', 43: '요한복음', 44: '사도행전', 66: '요한계시록'}
by = {}
for k, v in d.items():
    b, c, vv = map(int, k.split(':'))
    by.setdefault(b, {}).setdefault(c, []).append((vv, v))
for b, chs in sorted(by.items()):
    lines = ["import type { BookJesusWords } from './types'", '', f'// {names[b]} — 예수님 말씀 (WEB \\wj 표시를 개역개정 어절에 맞춘 생성 데이터)', 'const words: BookJesusWords = {']
    for c in sorted(chs):
        items, run = [], None
        for vv, v in sorted(chs[c]):
            if v == 'all':
                if run and run[1] == vv - 1: run[1] = vv; continue
                if run: items.append(run)
                run = [vv, vv]; continue
            if run: items.append(run); run = None
            for a, e in v: items.append((vv, a, e))
        if run: items.append(run)
        enc = []
        for it in items:
            if isinstance(it, list): enc.append(f"'{it[0]}'" if it[0] == it[1] else f"'{it[0]}-{it[1]}'")
            else: enc.append(f'[{it[0]}, {it[1]}, {it[2]}]')
        lines.append(f'  {c}: [{", ".join(enc)}],')
    lines += ['}', '', 'export default words', '']
    open(os.path.join(outdir, f'book{b:02d}.ts'), 'w').write('\n'.join(lines))
    print(b, len(chs))
