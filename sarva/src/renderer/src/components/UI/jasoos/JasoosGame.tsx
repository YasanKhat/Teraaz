"use client";

import { useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useGuestRounds } from "@/lib/guest/use-guest-rounds";
import AccessSheet, { type AccessState } from "./AccessSheet";
import { apiPost } from "@/lib/api/client";
import { useSetReportTarget } from "@/lib/reports/target";
import { useRoundGuard } from "@/lib/games/round-guard";
import { usePlusGate } from "@/lib/plus/use-plus-gate";
import GameSetup from "@/components/UI/games/GameSetup";
import LessonPicker from "@/components/UI/games/LessonPicker";
import HuntRun from "./HuntRun";
import HuntHero from "./HuntHero";
import { JASOOS_FREE_HAND, JASOOS_HAND, lessonsOf, levelsForLessons, pickJasoosLevels } from "@/lib/jasoos-bank";
import { GRADE_META, LESSON_TITLES } from "@/lib/doroos/catalog";
import type { GradeKey } from "@/lib/doroos/types";
import type { HuntLevel, HuntSuspect } from "./HuntCase";

/** «جاسوسِ نقش‌ها» — بازسازیِ تختِ `/game/jasoos`.
 *
 *  این یک بازیِ دیگر است، نه بازیِ پیشینِ برنامه با ظاهری تازه. آن یکی
 *  نقشه و در و جان و زمان‌سنج داشت؛ سایت هیچ‌کدام را ندارد. برای همین این
 *  پرونده از نو نوشته شد و آن مؤلفه‌ها (نقشه، صحنه، مظنون، تفنگ، معرفی،
 *  تنظیمات) دیگر در اینجا به‌کار نمی‌روند و پاک شدند.
 *
 *  گردش، همانِ سایت: پایه و درس → کیسِ پنجره‌ای (یک شلیک، یک پرونده) →
 *  دی‌بریف → پروندهٔ بعد → کارنامه و «جاسوس‌هایی که در رفتند». */

type Screen = "setup" | "play";

export default function JasoosGame() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [grade, setGrade] = useState<GradeKey>("dahom");
  const [pickedLessons, setPickedLessons] = useState<Set<number>>(new Set());
  const [runLevels, setRunLevels] = useState<HuntLevel[]>([]);
  /** هر دور یک شماره می‌گیرد تا HuntRun از نو ساخته شود. */
  const [runId, setRunId] = useState(0);
  /** پرونده‌یِ رویِ میز — برایِ گزارشِ اشکال و ذخیره‌یِ پاسخ. */
  const [current, setCurrent] = useState<HuntLevel | null>(null);
  const [guestPrompt, setGuestPrompt] = useState(false);

  const { user } = useCurrentUser();
  const guest = useGuestRounds("jasoos");
  /* همان `ee.limited`ِ سایت: کاربری که پلاس ندارد. سایت به او پنج پرونده
     می‌دهد و به پلاسی ده تا — ما همیشه ده می‌دادیم. */
  const plusGate = usePlusGate();
  const limited = plusGate.ready && !plusGate.unlocked;
  const hand = limited ? JASOOS_FREE_HAND : JASOOS_HAND;

  const access: AccessState = guest.blocked
    ? { kind: "quota", perDay: true }
    : { kind: "plus" };

  useRoundGuard(screen === "play");
  useSetReportTarget(
    current
      ? {
          area: "jasoos",
          targetId: String(current.id),
          snapshot: [current.title, ...(current.verseLines ?? [])]
            .filter(Boolean)
            .join("\n"),
          targetRef: { category: current.category ?? null },
        }
      : null,
  );

  /** درس‌هایی که در این پایه پرونده دارند — سایت درس‌های بی‌پرونده را نمی‌آورد. */
  const lessonOptions = useMemo(
    () =>
      lessonsOf(grade).map((l) => ({
        lesson: l.lesson,
        title: LESSON_TITLES[grade][l.lesson] ?? `درس ${l.lesson}`,
        count: l.count,
      })),
    [grade],
  );

  const pickedLevels = useMemo(
    () => levelsForLessons(grade, [...pickedLessons]),
    [grade, pickedLessons],
  );

  const changeGrade = (key: string) => {
    setGrade(key as GradeKey);
    setPickedLessons(new Set());
  };

  const toggleLesson = (lesson: number) => {
    setPickedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lesson)) next.delete(lesson);
      else next.add(lesson);
      return next;
    });
  };

  const toggleAllLessons = () => {
    const all = lessonOptions.map((l) => l.lesson);
    setPickedLessons((prev) => (prev.size === all.length ? new Set() : new Set(all)));
  };

  /** اندازه‌یِ دست — همان `ec`ِ سایت: `Math.min(ed.length, eu)`. */
  const dealCount = Math.min(pickedLevels.length, hand);

  /** یک دست تازه — درهم‌زنی و بریدن به اندازه‌یِ دست، همان `pickJasoosLevels`.
   *
   *  `runId` بالا می‌رود تا `HuntRun` از نو ساخته شود: حالتِ دور (شمارنده،
   *  نتیجه‌ها، فرصت‌ها) درونِ خودِ آن کامپوننت است و بدونِ این کلید هیچ‌کدام
   *  پاک نمی‌شدند — برای همین «یک دست دیگر» هیچ کاری نمی‌کرد. */
  const deal = () => {
    setRunLevels(pickJasoosLevels(pickedLevels, hand));
    setRunId((n) => n + 1);
    setScreen("play");
  };

  const start = () => {
    if (guest.blocked) {
      setGuestPrompt(true);
      return;
    }
    deal();
  };

  /** سایت پس از هر شلیک پاسخ را به سرور می‌فرستد. */
  const onShot = (level: HuntLevel, suspect: HuntSuspect) => {
    setCurrent(level);
    if (!user) return;
    void apiPost("/api/v1/jasoos/answer", {
      levelId: level.id,
      chosenRole: suspect.role,
    }).then((result) => {
      if (!result.ok) {
        console.error("jasoos answer save failed:", result.errors.join(" "));
      }
    });
  };

  const onFinish = () => {
    guest.recordRound();
    setCurrent(null);
  };

  const backToSetup = () => {
    setCurrent(null);
    setScreen("setup");
  };

  if (screen === "play") {
    return (
      <>
        {guestPrompt && (
          <AccessSheet
            sectionTitle="جاسوسِ نقش‌ها"
            sectionPlus="دسترسیِ بی‌پایان به همهٔ پرونده‌ها"
            perks={["همهٔ پرونده‌های هر سه پایه", "بدون محدودیتِ روزانه", "گزارشِ پیشرفت"]}
            state={access}
            onClose={() => setGuestPrompt(false)}
          />
        )}
        <HuntRun
          key={runId}
          levels={runLevels}
          onShot={onShot}
          onLevel={setCurrent}
          onFinish={onFinish}
          onAgain={deal}
          onChangeLessons={backToSetup}
        />
      </>
    );
  }

  return (
    <>
      {guestPrompt && (
        <AccessSheet
          sectionTitle="جاسوسِ نقش‌ها"
          sectionPlus="دسترسیِ بی‌پایان به همهٔ پرونده‌ها"
          perks={["همهٔ پرونده‌های هر سه پایه", "بدون محدودیتِ روزانه", "گزارشِ پیشرفت"]}
          state={access}
          onClose={() => setGuestPrompt(false)}
        />
      )}
      <GameSetup
        title="جاسوسِ نقش‌ها"
        lede="چند مظنون، یک جاسوس. نقشی را بزن که در متن نیست."
        hero={<HuntHero />}
        summary={
          pickedLessons.size === 0
            ? "یک یا چند درس انتخاب کن."
            : `${pickedLessons.size.toLocaleString("fa-IR")} درس · ${dealCount.toLocaleString("fa-IR")} پرونده · ${(3).toLocaleString("fa-IR")} جان`
        }
        startLabel="شروع شکار"
        canStart={pickedLessons.size > 0}
        startTour="start"
        onStart={start}
      >
        <LessonPicker
          grades={GRADE_META}
          grade={grade}
          onGrade={changeGrade}
          lessons={lessonOptions}
          selected={pickedLessons}
          onToggle={toggleLesson}
          onToggleAll={toggleAllLessons}
        />
      </GameSetup>
    </>
  );
}
