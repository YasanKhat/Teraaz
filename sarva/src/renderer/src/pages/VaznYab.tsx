import { useEffect, useRef, useState } from "react";
import VaznYabHero3D from "@/components/UI/vazn-yab/VaznYabHero3D";
import MasterChallenge from "@/components/UI/vazn-yab/MasterChallenge";
import FamousMeters, { type FamousMeter } from "@/components/UI/vazn-yab/FamousMeters";
import RhythmControls from "@/components/UI/vazn-yab/RhythmControls";
import VaznYabSection from "@/components/UI/guide/VaznYabSection";
import { ARKAN } from "@/lib/aruz/meters";
import {
  playRhythm,
  stopRhythm,
  type RhythmMode,
  type SpeedId,
} from "@/lib/vazn-yab/rhythm";

/**
 * وزن‌یاب — همان بخش‌های صفحهٔ سایت.
 *
 * تفاوتِ این نسخه با وب در یک چیز است و آن هم به نفعِ آفلاین: اگر اینترنت
 * وصل باشد، وزن از گنجور تأیید می‌شود (نشانِ «ثبت‌شده در گنجور»)؛ اگر نباشد،
 * همان موتورِ عروضِ خودِ سروا پاسخ می‌دهد. کاربر در هر دو حال جواب می‌گیرد.
 *
 * «وزن‌های مشهور» و کنترل‌های ریتم افزودهٔ این نسخه‌اند؛ پیش از این نبودند و
 * ترتیبشان همان است که در صفحهٔ زنده دیده می‌شود.
 */
export default function VaznYab() {
  const [mode, setMode] = useState<RhythmMode>("shur");
  const [speed, setSpeed] = useState<SpeedId>("normal");
  const [current, setCurrent] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const token = useRef(0);

  const patternOf = (feet: string) =>
    feet
      .split(/\s+/)
      .filter(Boolean)
      .map((f) => ARKAN[f] ?? "")
      .join("");

  const pick = async (m: FamousMeter) => {
    // زدنِ دوباره روی همان وزن یعنی توقف.
    if (current === m.feet && playing) {
      stopRhythm();
      setPlaying(false);
      return;
    }
    const mine = ++token.current;
    setCurrent(m.feet);
    setPlaying(true);
    const ok = await playRhythm(patternOf(m.feet), { mode, speed });
    if (mine !== token.current) return;
    setPlaying(ok ? true : false);
    // پایانِ پخش را هم رد می‌کنیم تا نشانِ «در حال پخش» خاموش شود.
    if (ok) {
      const expected = Math.round(
        (patternOf(m.feet).split("").filter((c) => c === "-" || c === "U").length + 4) *
          0.27 *
          (speed === "slow" ? 1.25 : speed === "fast" ? 0.78 : 1) *
          1000,
      );
      window.setTimeout(() => {
        if (mine === token.current) setPlaying(false);
      }, expected + 400);
    }
  };

  useEffect(() => () => stopRhythm(), []);

  return (
    <>
      <VaznYabHero3D />
      <MasterChallenge />
      <div className=" relative z-20 mx-auto mt-10 w-full max-w-6xl px-4 sm:px-6">
        <RhythmControls
          mode={mode}
          speed={speed}
          onMode={setMode}
          onSpeed={setSpeed}
        />
      </div>
      <FamousMeters current={current} playing={playing} onPick={pick} />
      <VaznYabSection />
    </>
  );
}
