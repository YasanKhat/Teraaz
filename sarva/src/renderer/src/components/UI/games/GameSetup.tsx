"use client";

import "./game-setup.css";

const S = "game-setup-module__3IIroq__";

/** قابِ صفحهٔ «پایه و درس» که سایت پیش از هر بازیِ درس‌محور می‌آورد:
 *  یک سربرگ، یک قهرمانِ ویژهٔ همان بازی، یک تابلو برای گزینش، و یک نوارِ
 *  پایانی با دکمهٔ شروع. نشانه‌گذاری همانِ `game-setup-module`ِ سایت است. */
export default function GameSetup({
  title,
  lede,
  hero,
  children,
  summary,
  startLabel,
  canStart,
  onStart,
  startTour,
}: {
  title: string;
  lede: string;
  /** تصویرِ بالایِ تابلو — برایِ جاسوس، چهار مظنونِ پشتِ پنجره. */
  hero?: React.ReactNode;
  children: React.ReactNode;
  summary: string;
  startLabel: string;
  canStart: boolean;
  onStart: () => void;
  /** سایت رویِ دکمهٔ شروع یک لنگرِ آموزش می‌گذارد. */
  startTour?: string;
}) {
  return (
    <div tabIndex={-1} className={S + "page"} dir="rtl">
      <header className={S + "head"}>
        <h2 className={"game-display " + S + "title"}>{title}</h2>
        <p className={S + "lede"}>{lede}</p>
      </header>

      {hero}

      <section className={S + "panel"} aria-label="پایه و درس">
        {children}
      </section>

      <div className={S + "bar"}>
        <span className={S + "summary"}>{summary}</span>
        <button
          type="button"
          className={S + "primary"}
          data-tour={startTour}
          disabled={!canStart}
          onClick={onStart}
        >
          {startLabel}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-arrow-left size-4"
            aria-hidden="true"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
