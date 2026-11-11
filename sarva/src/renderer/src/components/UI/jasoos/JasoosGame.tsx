"use client";

import { useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useGuestRounds } from "@/lib/guest/use-guest-rounds";
import GuestLimitModal from "@/components/UI/GuestLimitModal";
import { apiPost } from "@/lib/api/client";
import { useSetReportTarget } from "@/lib/reports/target";
import { useRoundGuard } from "@/lib/games/round-guard";
import GameSetup from "@/components/UI/games/GameSetup";
import LessonPicker from "@/components/UI/games/LessonPicker";
import HuntRun from "./HuntRun";
import HuntHero from "./HuntHero";
import { lessonsOf, levelsForLessons } from "@/lib/jasoos-bank";
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
  /** پرونده‌یِ رویِ میز — برایِ گزارشِ اشکال و ذخیره‌یِ پاسخ. */
  const [current, setCurrent] = useState<HuntLevel | null>(null);
  const [guestPrompt, setGuestPrompt] = useState(false);

  const { user } = useCurrentUser();
  const guest = useGuestRounds("jasoos");

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

  const start = () => {
    if (guest.blocked) {
      setGuestPrompt(true);
      return;
    }
    setRunLevels(pickedLevels);
    setScreen("play");
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
          <GuestLimitModal section="jasoos" onDismiss={() => setGuestPrompt(false)} />
        )}
        <HuntRun
          levels={runLevels}
          onShot={onShot}
          onLevel={setCurrent}
          onFinish={onFinish}
          onAgain={() => setRunLevels([...runLevels])}
          onChangeLessons={backToSetup}
        />
      </>
    );
  }

  return (
    <>
      {guestPrompt && (
        <GuestLimitModal section="jasoos" onDismiss={() => setGuestPrompt(false)} />
      )}
      <GameSetup
        title="جاسوسِ نقش‌ها"
        lede="چند مظنون، یک جاسوس. نقشی را بزن که در متن نیست."
        hero={<HuntHero />}
        summary={
          pickedLessons.size === 0
            ? "یک یا چند درس انتخاب کن."
            : `${pickedLessons.size.toLocaleString("fa-IR")} درس · ${pickedLevels.length.toLocaleString("fa-IR")} پرونده`
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
