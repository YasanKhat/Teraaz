"use client";

import "./lesson-picker.css";

const G = "lesson-picker-module__g8CuTa__";

/** یک کارتِ درس: شماره‌اش، نامش و این‌که چند پرونده دارد. */
export type LessonOption = {
  lesson: number;
  title: string;
  count: number;
};

/** یک پایه: کلید، نام (دهم) و نامِ کتاب (فارسی ۱). */
export type GradeOption = {
  key: string;
  label: string;
  book: string;
};

export default function LessonPicker({
  grades,
  grade,
  onGrade,
  lessons,
  selected,
  onToggle,
  onToggleAll,
  idPrefix = "lp",
}: {
  grades: readonly GradeOption[];
  /** کلیدِ پایهٔ برگزیده. */
  grade: string;
  onGrade: (key: string) => void;
  lessons: readonly LessonOption[];
  /** شمارهٔ درس‌های برگزیده. */
  selected: ReadonlySet<number>;
  onToggle: (lesson: number) => void;
  onToggleAll: () => void;
  idPrefix?: string;
}) {
  const allPicked = lessons.length > 0 && lessons.every((l) => selected.has(l.lesson));

  return (
    <div className={G + "root"}>
      <div className={G + "grades"} role="radiogroup" aria-label="پایه" data-tour="grade">
        {grades.map((g) => {
          const on = g.key === grade;
          return (
            <button
              key={g.key}
              type="button"
              role="radio"
              aria-checked={on}
              data-on={on ? "true" : "false"}
              className={G + "grade"}
              onClick={() => onGrade(g.key)}
            >
              {/* تکهٔ لغزانِ انتخاب: سایت آن را فقط رویِ پایهٔ برگزیده می‌سازد. */}
              {on && <span className={G + "thumb"} aria-hidden="true" />}
              <span className={G + "gradeName"}>{g.label}</span>
              <span className={G + "gradeBook"}>{g.book}</span>
            </button>
          );
        })}
      </div>

      <div className={G + "head"}>
        <span>درس‌ها</span>
        <button type="button" className={G + "all"} onClick={onToggleAll}>
          {allPicked ? "برداشتن همه" : "انتخاب همه"}
        </button>
      </div>

      <div className={G + "lessons"} data-tour="lessons">
        {lessons.map((l, i) => {
          const on = selected.has(l.lesson);
          return (
            <button
              key={l.lesson}
              type="button"
              data-on={on ? "true" : "false"}
              aria-pressed={on}
              className={G + "lesson"}
              /* همان توقفِ سایت: شاخص برای ستونی کردنِ انیمیشن در ۱۲ می‌ایستد. */
              style={{ ["--i" as string]: Math.min(i, 12) }}
              title={l.title}
              onClick={() => onToggle(l.lesson)}
            >
              <span className={G + "num"} aria-hidden="true">
                {l.lesson.toLocaleString("fa-IR")}
              </span>
              <span className={G + "mark"}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  aria-hidden="true"
                  className={G + "check"}
                >
                  <path
                    pathLength={1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m5.5 12.5 4.2 4.2 8.8-9.4"
                  />
                </svg>
              </span>
              <span className={G + "title"}>
                {/* «درس ۱، » برای خوانندهٔ صفحه؛ دیدنی نیست. */}
                <span className="sr-only">درس {l.lesson.toLocaleString("fa-IR")}، </span>
                {l.title}
              </span>
              <span className={G + "meta"}>{l.count.toLocaleString("fa-IR")} پرونده</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
