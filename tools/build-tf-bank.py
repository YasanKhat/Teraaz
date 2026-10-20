#!/usr/bin/env python3
"""بانک «درست/نادرست» را از ضمیمهٔ کتاب می‌سازد (۴۲۳ عبارت با پاسخ)."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'تاریخ.txt'
OUT = ROOT / 'src/renderer/src/data/tfBank.json'

FA = '۰۱۲۳۴۵۶۷۸۹'
LESSONS = {
    'اول': 1, 'دوم': 2, 'سوم': 3, 'چهارم': 4, 'پنجم': 5, 'ششم': 6, 'هفتم': 7, 'هشتم': 8,
    'نهم': 9, 'دهم': 10, 'یازدهم': 11, 'دوازدهم': 12, 'سیزدهم': 13, 'چهاردهم': 14,
    'پانزدهم': 15, 'شانزدهم': 16,
}


def to_int(text):
    return int(''.join(str(FA.index(c)) if c in FA else c for c in text))


def clean(text):
    text = re.sub(r'[ \t]+', ' ', text).strip()
    text = text.replace('ي', 'ی').replace('ك', 'ک').replace('ﻻ', 'لا')
    text = re.sub(r'\s+([،؛:.!؟])', r'\1', text)
    return text


def main():
    lines = [l.strip() for l in SRC.read_text(encoding='utf-8').replace('\r', '').split('\n')]
    start = next(i for i, l in enumerate(lines) if 'ضمیمه ماجرای بیست تاریخ' in l)
    stm, answers, lesson, order = {}, {}, 1, []
    for i in range(start, len(lines)):
        line = lines[i]
        m = re.search(r'\(تیتر قرمز/صورتی\): درس\s*([۰-۹]+|\S+)', line)
        if m:
            token = m.group(1).strip(':')
            if token in LESSONS:
                lesson = LESSONS[token]
            elif re.fullmatch(r'[۰-۹]+', token):
                lesson = to_int(token)
            else:
                continue
            continue
        ms = re.match(r'^([۰-۹]{1,4})-\s*(.+)$', line)
        if ms:
            n = to_int(ms.group(1))
            if n not in stm and len(ms.group(2)) > 15 and not ms.group(2).startswith('تصویر'):
                stm[n] = clean(ms.group(2))
                lesson_of = lesson
                answers.setdefault('_lesson', {})[n] = lesson_of
            continue
        ma = re.match(r'^([۰-۹]{1,4})\.\s*(درست|نادرست)\s*[؛:]?\s*(.*)$', line)
        if ma:
            n = to_int(ma.group(1))
            if n in answers:
                continue
            body = ma.group(2)
            extra = clean(ma.group(3) or '')
            answers[n] = {'value': body == 'درست', 'note': extra}
    items = []
    for n in sorted(stm):
        a = answers.get(n)
        if not a:
            continue
        items.append({
            'id': f'tf{n}',
            'n': n,
            'lesson': answers['_lesson'].get(n, 0),
            'text': stm[n],
            'value': a['value'],
            'note': a['note'],
        })
    per = {}
    for it in items:
        per[it['lesson']] = per.get(it['lesson'], 0) + 1
    OUT.write_text(json.dumps({'items': items}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('items', len(items), 'per lesson', dict(sorted(per.items())))


if __name__ == '__main__':
    main()
