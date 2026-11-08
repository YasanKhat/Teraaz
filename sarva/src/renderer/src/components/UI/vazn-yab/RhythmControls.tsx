"use client";

import { motion } from "motion/react";
import {
  RHYTHM_MODES,
  RHYTHM_SPEEDS,
  type RhythmMode,
  type SpeedId,
} from "@/lib/vazn-yab/rhythm";

/**
 * دو دستهٔ کشوییِ بالای پخشِ ریتم: دستگاه و سرعت.
 *
 * ⚠️ ساختار و کلاس‌ها از کامپوننتِ زندهٔ سایت آمده‌اند (۲۰۲۶-۱۱-۰۸) — همان
 *    دکمهٔ لغزان که با `layoutId` جابه‌جا می‌شود. پیش از این در این پورت نبود.
 */

type Option<T extends string> = { id: T; label: string };

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  layoutId,
  disabled,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (id: T) => void;
  layoutId: string;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className=" relative inline-flex rounded-full border border-border bg-secondary/60 p-1 text-xs font-semibold sm:text-sm"
    >
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.id)}
            className={` relative rounded-full px-3.5 py-1.5 transition-colors disabled:cursor-not-allowed ${
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className=" absolute inset-0 rounded-full bg-card shadow-sm"
              />
            )}
            <span className=" relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function RhythmControls({
  mode,
  speed,
  onMode,
  onSpeed,
  disabled,
}: {
  mode: RhythmMode;
  speed: SpeedId;
  onMode: (m: RhythmMode) => void;
  onSpeed: (s: SpeedId) => void;
  disabled?: boolean;
}) {
  return (
    <div dir="rtl" className=" flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className=" text-xs text-muted-foreground">دستگاه</span>
      <Segmented
        label="دستگاه"
        options={RHYTHM_MODES}
        value={mode}
        onChange={onMode}
        layoutId="vy-mode-pill"
        disabled={disabled}
      />
      <span className=" me-2 text-xs text-muted-foreground">سرعت</span>
      <Segmented
        label="سرعت"
        options={RHYTHM_SPEEDS}
        value={speed}
        onChange={onSpeed}
        layoutId="vy-speed-pill"
        disabled={disabled}
      />
    </div>
  );
}
