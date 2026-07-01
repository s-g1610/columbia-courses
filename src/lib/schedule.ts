import { getCourseByCode, type Course, type Meeting, type Section } from "@/lib/courses";
import type { Selection } from "@/lib/useSchedule";

// ---------------------------------------------------------------------------
// Parsing raw schedule strings into structured, comparable values
// ---------------------------------------------------------------------------

/** Days shown in the weekly grid, in order. (No Sunday classes in the data.) */
export const GRID_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sun: 0,
  mon: 1,
  tue: 2,
  tues: 2,
  wed: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  fri: 5,
  sat: 6,
};

/** "Tuesday, Thursday" -> [2, 4] (Sun=0 … Sat=6). */
export function parseDays(days?: string): number[] {
  if (!days) return [];
  return days
    .split(/[,/&]| and /i)
    .map((d) => DAY_INDEX[d.trim().toLowerCase()])
    .filter((n): n is number => n !== undefined);
}

/** "2:20PM" -> minutes since midnight (860). */
function parseClock(s: string): number | null {
  const m = s.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

/** "2:20PM - 3:50PM" -> { start: 860, end: 950 }. */
export function parseTime(
  time?: string,
): { start: number; end: number } | null {
  if (!time) return null;
  const parts = time.split(/[-–]/);
  if (parts.length !== 2) return null;
  const start = parseClock(parts[0]);
  const end = parseClock(parts[1]);
  if (start === null || end === null || end <= start) return null;
  return { start, end };
}

/** "10/26/2026 - 12/11/2026" -> { start, end } as epoch ms. */
export function parseDates(
  dates?: string,
): { start: number; end: number } | null {
  if (!dates) return null;
  const parts = dates.split(/[-–]/).map((p) => p.trim());
  const toMs = (s: string) => {
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    return new Date(+m[3], +m[1] - 1, +m[2]).getTime();
  };
  const start = toMs(parts[0]);
  const end = parts[1] ? toMs(parts[1]) : start;
  if (start === null || end === null) return null;
  return { start, end };
}

/** "2:20PM - 3:50PM" -> "2:20 PM – 3:50 PM" for display. */
export function formatTimeRange(time?: string): string {
  const t = parseTime(time);
  if (!t) return time ?? "";
  return `${formatMinutes(t.start)} – ${formatMinutes(t.end)}`;
}

/**
 * Distinct "Days · time" labels for a section, collapsing repeated dated
 * sessions (modular courses list each occurrence separately in the source).
 */
export function uniqueMeetingLabels(section: Section): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of section.meetings ?? []) {
    const label = `${m.days ?? ""} · ${formatTimeRange(m.time)}`.trim();
    if (label && !seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
  }
  return out;
}

export function formatMinutes(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ap = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ap}`;
}

// ---------------------------------------------------------------------------
// Time slots and clash detection
// ---------------------------------------------------------------------------

export interface TimeSlot {
  day: number; // 0 (Sun) … 6 (Sat)
  start: number; // minutes since midnight
  end: number;
  dateStart?: number;
  dateEnd?: number;
  room?: string;
}

/** Expand a meeting into one slot per day it meets. */
function meetingSlots(m: Meeting): TimeSlot[] {
  const time = parseTime(m.time);
  if (!time) return [];
  const dates = parseDates(m.dates);
  return parseDays(m.days).map((day) => ({
    day,
    start: time.start,
    end: time.end,
    dateStart: dates?.start,
    dateEnd: dates?.end,
    room: m.room,
  }));
}

/** All time slots a section occupies across its meetings. */
export function sectionSlots(section: Section): TimeSlot[] {
  return (section.meetings ?? []).flatMap(meetingSlots);
}

/** True if a section has any usable meeting time (needed for the calendar). */
export function sectionIsSchedulable(section: Section): boolean {
  return sectionSlots(section).length > 0;
}

function dateRangesOverlap(a: TimeSlot, b: TimeSlot): boolean {
  // If either lacks a date range, be conservative and treat as overlapping.
  if (a.dateStart == null || a.dateEnd == null) return true;
  if (b.dateStart == null || b.dateEnd == null) return true;
  return a.dateStart <= b.dateEnd && b.dateStart <= a.dateEnd;
}

/** Two slots clash if same day, overlapping time, and overlapping dates. */
export function slotsClash(a: TimeSlot, b: TimeSlot): boolean {
  return (
    a.day === b.day &&
    a.start < b.end &&
    b.start < a.end &&
    dateRangesOverlap(a, b)
  );
}

/** Do two sections have any conflicting meeting slot? */
export function sectionsClash(a: Section, b: Section): boolean {
  const sa = sectionSlots(a);
  const sb = sectionSlots(b);
  for (const x of sa) for (const y of sb) if (slotsClash(x, y)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Credits
// ---------------------------------------------------------------------------

export function creditValue(course: Course): number {
  const n = parseFloat(course.credits ?? "");
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// Resolving saved selections into concrete course + section entries
// ---------------------------------------------------------------------------

export interface ScheduleEntry {
  selection: Selection;
  course: Course;
  section: Section;
}

/** Look up the course + section a saved selection points to. */
export function resolveSelection(sel: Selection): ScheduleEntry | null {
  const course = getCourseByCode(sel.code);
  if (!course) return null;
  const section = (course.sections ?? []).find(
    (s) => s.term === sel.term && s.section === sel.section,
  );
  if (!section) return null;
  return { selection: sel, course, section };
}

export function resolveSelections(selections: Selection[]): ScheduleEntry[] {
  return selections
    .map(resolveSelection)
    .filter((e): e is ScheduleEntry => e !== null);
}

/**
 * Given resolved entries, return the set of section keys ("code|term|section")
 * that clash with at least one other entry.
 */
export function findClashes(entries: ScheduleEntry[]): Set<string> {
  const clashing = new Set<string>();
  const key = (e: ScheduleEntry) =>
    `${e.course.code}|${e.section.term}|${e.section.section}`;
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (sectionsClash(entries[i].section, entries[j].section)) {
        clashing.add(key(entries[i]));
        clashing.add(key(entries[j]));
      }
    }
  }
  return clashing;
}

/** Total credits across the courses in a set of entries (counts each course once). */
export function totalCredits(entries: ScheduleEntry[]): number {
  const seen = new Set<string>();
  let sum = 0;
  for (const e of entries) {
    if (seen.has(e.course.code)) continue;
    seen.add(e.course.code);
    sum += creditValue(e.course);
  }
  return sum;
}
