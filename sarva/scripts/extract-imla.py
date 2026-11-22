#!/usr/bin/env python3
"""Extract the public spelling bank and locked counts from a captured page.

No protected content is accessed. Usage: python3 extract-imla.py CAPTURE.html OUT.json
"""
import json
import re
import sys
from pathlib import Path

source = Path(sys.argv[1]).read_text(encoding='utf-8')
blocks = re.findall(r'<script>self\.__next_f\.push\((.*?)\)</script>', source)
for raw in blocks:
    item = json.loads(raw)
    if len(item) < 2 or not isinstance(item[1], str) or '"bank":[' not in item[1]:
        continue
    payload = item[1]
    start = payload.index('"bank":[') + len('"bank":')
    bank, consumed = json.JSONDecoder().raw_decode(payload[start:])
    locked_start = payload.index('"locked":{', start + consumed) + len('"locked":')
    locked, _ = json.JSONDecoder().raw_decode(payload[locked_start:])
    if not isinstance(bank, list) or not isinstance(locked, dict) or not bank:
        raise ValueError('Unexpected spelling payload')
    if len({entry['id'] for entry in bank}) != len(bank):
        raise ValueError('Duplicate spelling IDs')
    output = {'bank': bank, 'locked': locked}
    Path(sys.argv[2]).write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"{len(bank)} public words, {len(locked)} locked lesson counts ({sum(locked.values())} words not present)")
    break
else:
    raise ValueError('Spelling bank not found in captured RSC payload')
