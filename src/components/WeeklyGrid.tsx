"use client";

import {
  GRID_DAYS,
  formatMinutes,
  sectionSlots,
  type ScheduleEntry,
} from "@/lib/schedule";

const HOUR_PX = 44;

// A few distinct, legible block colors keyed by course code.
const PALETTE = [
  { bg: "bg-sky-100 dark:bg-sky-900/50", bar: "bg-sky-500", text: "text-sky-900 dark:text-sky-100" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/50", bar: "bg-emerald-500", text: "text-emerald-900 dark:text-emerald-100" },
  { bg: "bg-violet-100 dark:bg-violet-900/50", bar: "bg-violet-500", text: "text-violet-900 dark:text-violet-100" },
  { bg: "bg-amber-100 dark:bg-amber-900/50", bar: "bg-amber-500", text: "text-amber-900 dark:text-amber-100" },
  { bg: "bg-rose-100 dark:bg-rose-900/50", bar: "bg-rose-500", text: "text-rose-900 dark:text-rose-100" },
  { bg: "bg-teal-100 dark:bg-teal-900/50", bar: "bg-teal-500", text: "text-teal-900 dark:text-teal-100" },
  { bg: "bg-indigo-100 dark:bg-indigo-900/50", bar: "bg-indigo-500", text: "text-indigo-900 dark:text-indigo-100" },
];

function colorFor(code: string) {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function WeeklyGrid({
  entries,
  clashKeys,
}: {
  entries: ScheduleEntry[];
  clashKeys: Set<string>;
}) {
  // Flatten to positioned blocks per weekday.
  const blocks = entries.flatMap((e) =>
    sectionSlots(e.section).map((slot) => ({
      key: `${e.course.code}|${e.section.term}|${e.section.section}`,
      code: e.course.code,
      slot,
    })),
  );

  // Determine the visible time window from the data (clamped to a sensible default).
  let minStart = 8 * 60;
  let maxEnd = 20 * 60;
  for (const b of blocks) {
    minStart = Math.min(minStart, b.slot.start);
    maxEnd = Math.max(maxEnd, b.slot.end);
  }
  const startHour = Math.floor(minStart / 60);
  const endHour = Math.ceil(maxEnd / 60);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const gridHeight = hours.length * HOUR_PX;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        {/* Day headers */}
        <div className="grid" style={{ gridTemplateColumns: "48px repeat(6, 1fr)" }}>
          <div />
          {GRID_DAYS.map((d) => (
            <div
              key={d}
              className="pb-1 text-center text-xs font-semibold text-neutral-500"
            >
              {d.slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="grid" style={{ gridTemplateColumns: "48px repeat(6, 1fr)" }}>
          {/* Hour labels */}
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h, i) => (
              <div
                key={h}
                className="absolute right-1 -translate-y-1/2 text-[10px] text-neutral-400"
                style={{ top: i * HOUR_PX }}
              >
                {formatMinutes(h * 60).replace(":00", "")}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {GRID_DAYS.map((_, dayIdx) => {
            const jsDay = dayIdx + 1; // Monday=1 … Saturday=6
            const dayBlocks = blocks.filter((b) => b.slot.day === jsDay);
            return (
              <div
                key={dayIdx}
                className="relative border-l border-neutral-100 dark:border-neutral-800"
                style={{ height: gridHeight }}
              >
                {/* hour gridlines */}
                {hours.map((h, i) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-neutral-100 dark:border-neutral-800/70"
                    style={{ top: i * HOUR_PX }}
                  />
                ))}
                {dayBlocks.map((b, i) => {
                  const top = ((b.slot.start - startHour * 60) / 60) * HOUR_PX;
                  const height = Math.max(
                    ((b.slot.end - b.slot.start) / 60) * HOUR_PX - 2,
                    16,
                  );
                  const clash = clashKeys.has(b.key);
                  const c = colorFor(b.code);
                  return (
                    <div
                      key={i}
                      className={`absolute inset-x-0.5 overflow-hidden rounded-md px-1.5 py-0.5 text-[10px] leading-tight shadow-sm ${
                        clash
                          ? "bg-red-100 text-red-900 ring-2 ring-red-500 dark:bg-red-950 dark:text-red-100"
                          : `${c.bg} ${c.text}`
                      }`}
                      style={{ top, height }}
                      title={`${b.code} · ${formatMinutes(b.slot.start)}–${formatMinutes(b.slot.end)}${b.slot.room ? " · " + b.slot.room : ""}${clash ? " · CONFLICT" : ""}`}
                    >
                      <span className="font-semibold">{b.code}</span>
                      {height > 28 && (
                        <div className="truncate opacity-80">
                          {formatMinutes(b.slot.start)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
