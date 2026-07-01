"use client";

import { scheduleStore, useSchedule, selKey } from "@/lib/useSchedule";

export default function AddSectionButton({
  code,
  term,
  section,
}: {
  code: string;
  term: string;
  section: string;
}) {
  const selections = useSchedule();
  const sel = { code, term, section };
  const added = selections.some((s) => selKey(s) === selKey(sel));

  return (
    <button
      type="button"
      onClick={() => scheduleStore.toggle(sel)}
      aria-pressed={added}
      className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium transition ${
        added
          ? "bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-100"
          : "bg-sky-600 text-white hover:bg-sky-700"
      }`}
    >
      {added ? "✓ In schedule" : "Add to schedule"}
    </button>
  );
}
