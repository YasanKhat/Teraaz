#!/usr/bin/env python3
"""ساخت بانک سؤال از متن کتاب (تاریخ.txt).

سؤال‌های امتحانی هر درس و پاسخ‌های تشریحی انتهای کتاب را می‌خواند و
یک فایل JSON تمیز برای برنامه می‌سازد.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'تاریخ.txt'
OUT = ROOT / 'src/renderer/src/data/questionBank.json'

FA = '۰۱۲۳۴۵۶۷۸۹'
LESSON_NAMES = [
    'منابع پژوهش در تاریخ اسلام و ایران',
    'روش پژوهش در تاریخ',
    'اسلام در مکه',
    'امت و حکومت نبوی در مدینه',
    'تثبیت و گسترش اسلام در دوران خلفای نخستین',
    'امویان بر مسند قدرت',
    'جهان اسلام در عصر خلافت عباسی',
    'اسلام در ایران',
    'ظهور و گسترش تمدن ایرانی–اسلامی',
    'ایران در دوران غزنوی، سلجوقی و خوارزمشاهی',
    'حکومت، جامعه و اقتصاد در عصر مغول–تیموری',
    'فرهنگ و هنر در عصر مغول–تیموری',
    'تحولات سیاسی و اقتصادی ایران در دورهٔ صفوی',
    'فرهنگ و تمدن در عصر صفوی',
    'قرون وسطا',
    'رنسانس و عصر جدید',
]

TYPE_PATTERNS = [
    (r'صحیح یا غلط', 'tf'),
    (r'سمت راست', 'match'),
    (r'جاهای خالی', 'blank'),
    (r'گزینه‌های مناسب را انتخاب|گزینه‌هائی مناسب را انتخاب|گزینه‌های صحیح را انتخاب', 'mcq'),
    (r'پاسخ کوتاه', 'short'),
    (r'تعریف اصطلاحات', 'term'),
    (r'مقایسه پدیده', 'compare'),
    (r'اظهار نظر', 'opinion'),
    (r'توصیف، فهرست|فهرست و طبقه', 'list'),
    (r'تشریحی', 'essay'),
]

BAD_FRAGMENTS = (
    '(تصویر', 'تصویر ', 'صفحه ', '(تیتر', '(آیکون', 'پاسخنامه', 'چک می‌کنیم',
    'صبر کنید', 'فایل ارسالی', 'وارونه اسکن',
)


def to_int(text: str) -> int:
    return int(''.join(str(FA.index(c)) if c in FA else c for c in text))


def clean(text: str) -> str:
    text = text.replace('\u200f', ' ').replace('\u200e', ' ')
    text = re.sub(r'[ \t]+', ' ', text).strip()
    text = text.replace('ﻻ', 'لا').replace('ي', 'ی').replace('ك', 'ک')
    text = re.sub(r'\s+([،؛:.!؟])', r'\1', text)
    text = re.sub(r'\.{2,}', '…', text)
    return text.strip()


def is_noise(text: str) -> bool:
    if len(text) < 8:
        return True
    return any(frag in text[:60] for frag in BAD_FRAGMENTS)


def split_options(text: str):
    """گزینه‌های «(۱- ... ۲- ...)» را از متن سؤال جدا می‌کند."""
    m = re.search(r'\((?:۱|1)\s*[-.)]\s*(.+)\)\s*$', text)
    if not m:
        return text, None
    inner = m.group(1)
    parts = re.split(r'\s*[۲۳۴]\s*[-.)]\s*', inner)
    nums = re.findall(r'(\d)\s*[-.)]', inner)
    if len(parts) != 4:
        return text, None
    opts = [clean(p) for p in parts]
    if any(len(o) < 1 for o in opts):
        return text, None
    return clean(text[: m.start()]), opts


def parse_answer(raw: str):
    """نوع پاسخ را تشخیص می‌دهد: درست/نادرست، گزینه، یا متن."""
    ans = clean(raw)
    if re.match(r'^(درست|صحیح)\b', ans) and len(ans) < 6:
        return {'kind': 'tf', 'value': True, 'text': 'درست'}
    m = re.match(r'^نادرست\s*[:؛]?\s*(.*)$', ans)
    if m:
        return {'kind': 'tf', 'value': False, 'text': 'نادرست' + (('؛ ' + m.group(1)) if m.group(1) else '')}
    m = re.match(r'^گزینهٔ?\s*«?([۱-۴1-4])»?\s*(.*)$', ans)
    if m:
        return {'kind': 'option', 'index': to_int(m.group(1)) - 1, 'text': clean(m.group(2))}
    return {'kind': 'text', 'text': ans}


def main():
    lines = [l.strip() for l in SRC.read_text(encoding='utf-8').replace('\r', '').split('\n')]
    num_re = re.compile(r'^([۰-۹]{1,4})[-.)]\s*(.*)$')

    starts = [i for i, l in enumerate(lines) if 'سؤال‌های امتحانی' in l and 'تیتر' in l]
    akey = next(i for i, l in enumerate(lines) if re.match(r'\(تیتر قرمز/صورتی\): درس اول', l))

    answers = {}
    for i in range(akey, len(lines)):
        m = re.match(r'^([۰-۹]{1,4})[.]\s*(.+)$', lines[i])
        if m:
            answers.setdefault(to_int(m.group(1)), m.group(2))

    items = []
    for lesson, (a, b) in enumerate(zip(starts, starts[1:] + [akey]), start=1):
        cur_type = 'short'
        last = 0
        for i in range(a, b):
            line = lines[i]
            if not line:
                continue
            matched_type = None
            for pattern, key in TYPE_PATTERNS:
                if re.search(pattern, line):
                    matched_type = key
                    break
            if matched_type and not num_re.match(line):
                cur_type = matched_type
                continue
            m = num_re.match(line)
            if not m:
                continue
            n = to_int(m.group(1))
            body = clean(m.group(2))
            if n <= last or not body:
                continue
            last = n
            if is_noise(body):
                continue
            qtext, options = split_options(body)
            ans_raw = answers.get(n)
            if not ans_raw:
                continue
            ans = parse_answer(ans_raw)
            item = {
                'id': f'q{n}',
                'n': n,
                'lesson': lesson,
                'type': cur_type,
                'q': qtext,
                'a': ans,
            }
            if options:
                item['options'] = options
                item['type'] = 'mcq'
            items.append(item)

    # حذف تکراری‌ها بر اساس متن سؤال
    seen, uniq = set(), []
    for it in items:
        key = re.sub(r'\s+', ' ', it['q'])
        if key in seen:
            continue
        seen.add(key)
        uniq.append(it)

    payload = {
        'lessons': [{'id': i + 1, 'title': t} for i, t in enumerate(LESSON_NAMES)],
        'items': uniq,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding='utf-8')
    counts = {}
    for it in uniq:
        counts.setdefault(it['lesson'], {}).setdefault(it['type'], 0)
        counts[it['lesson']][it['type']] += 1
    print('items', len(uniq))
    for lesson, c in counts.items():
        print(lesson, sum(c.values()), c)


if __name__ == '__main__':
    main()
