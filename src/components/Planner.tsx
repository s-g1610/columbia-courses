"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getCoursesForTerm,
  getDivisions,
  getTerms,
  searchCourses,
  sectionsInTerm,
  type Course,
  type Section,
} from "@/lib/courses";
import {
  findClashes,
  resolveSelections,
  sectionIsSchedulable,
  sectionsClash,
  totalCredits,
  creditValue,
  uniqueMeetingLabels,
} from "@/lib/schedule";
import { scheduleStore, useSchedule, type Selection } from "@/lib/useSchedule";
import WeeklyGrid from "@/components/WeeklyGrid";

const ALL_TERMS = getTerms();
const DIVISIONS = getDivisions();

export default function Planner() {
  const [term, setTerm] = useState(ALL_TERMS[0] ?? "");
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const selections = useSchedule();

  // Resolve saved selections and split by whether they belong to the active term.
  const allEntries = useMemo(
    () => resolveSelections(selections),
    [selections],
  );
  const termEntries = allEntries.filter((e) => e.section.term === term);
  const clashKeys = useMemo(() => findClashes(termEntries), [termEntries]);
  const credits = totalCredits(termEntries);
  const otherTermCount = allEntries.length - termEntries.length;

  // Courses offered this term, filtered by the finder controls.
  const termCourses = useMemo(() => getCoursesForTerm(term), [term]);
  const finderResults = useMemo(
    () => searchCourses(termCourses, { query, division: division || undefined }),
    [termCourses, query, division],
  );

  const selectedSet = useMemo(
    () => new Set(termEntries.map((e) => e.section.section + "|" + e.course.code)),
    [termEntries],
  );

  function isSelected(course: Course, section: Section) {
    return selectedSet.has(section.section + "|" + course.code);
  }

  // Would adding this section clash with anything already in the schedule?
  function wouldClash(section: Section): boolean {
    return termEntries.some((e) => sectionsClash(e.section, section));
  }

  function toggle(course: Course, section: Section) {
    const sel: Selection = {
      code: course.code,
      term,
      section: section.section,
    };
    scheduleStore.toggle(sel);
  }

  return (
    <div>
      {/* Term + summary bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-end sm:justify-between dark:border-neutral-800 dark:bg-neutral-900/40">
        <div>
          <label
            htmlFor="term-select"
            className="mb-1 block text-xs font-medium text-neutral-500"
          >
            Planning for
          </label>
          <select
            id="term-select"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base font-semibold shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-900"
          >
            {ALL_TERMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span>
            <span className="text-lg font-bold">{termEntries.length}</span>{" "}
            <span className="text-neutral-500">courses</span>
          </span>
          <span>
            <span className="text-lg font-bold">{credits}</span>{" "}
            <span className="text-neutral-500">credits</span>
          </span>
          {clashKeys.size > 0 ? (
            <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
              ⚠ {clashKeys.size / 2} time conflict
              {clashKeys.size / 2 > 1 ? "s" : ""}
            </span>
          ) : termEntries.length > 0 ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              ✓ No conflicts
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Course finder */}
        <section aria-labelledby="finder-heading">
          <h2 id="finder-heading" className="mb-3 text-lg font-semibold">
            Find courses in {term}
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="planner-search" className="sr-only">
              Search courses
            </label>
            <input
              id="planner-search"
              type="search"
              placeholder="Search by code, title, or instructor…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-900"
            />
            <label htmlFor="planner-division" className="sr-only">
              Filter by division
            </label>
            <select
              id="planner-division"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 sm:w-48 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">All divisions</option>
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {finderResults.length} courses offered in {term}
          </p>

          <ul className="mt-3 max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {finderResults.map((course) => {
              const secs = sectionsInTerm(course, term);
              const isOpen = expanded === course.code;
              const anySelected = secs.some((s) => isSelected(course, s));
              return (
                <li
                  key={course.code}
                  className={`rounded-lg border ${
                    anySelected
                      ? "border-sky-400 dark:border-sky-600"
                      : "border-neutral-200 dark:border-neutral-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : course.code)}
                    className="flex w-full items-start justify-between gap-3 rounded-lg p-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    aria-expanded={isOpen}
                  >
                    <span>
                      <span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400">
                        {course.code}
                      </span>
                      <span className="ml-2 font-medium">{course.title}</span>
                      <span className="mt-0.5 block text-xs text-neutral-500">
                        {course.division ?? "—"} ·{" "}
                        {creditValue(course) || "?"} credits · {secs.length}{" "}
                        section{secs.length !== 1 ? "s" : ""}
                        {anySelected ? " · ✓ in schedule" : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-neutral-400">
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {isOpen && (
                    <ul className="space-y-2 border-t border-neutral-100 p-3 dark:border-neutral-800">
                      {secs.map((s) => {
                        const selected = isSelected(course, s);
                        const schedulable = sectionIsSchedulable(s);
                        const clash = !selected && wouldClash(s);
                        return (
                          <li
                            key={s.section}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <div>
                              <div className="font-medium">{s.section}</div>
                              <div className="text-xs text-neutral-500">
                                {schedulable ? (
                                  uniqueMeetingLabels(s).map((label, i) => (
                                    <div key={i}>{label}</div>
                                  ))
                                ) : (
                                  <span>No meeting time listed</span>
                                )}
                                {s.faculty ? (
                                  <div>{s.faculty}</div>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <button
                                type="button"
                                onClick={() => toggle(course, s)}
                                className={`rounded-md px-3 py-1 text-xs font-medium ${
                                  selected
                                    ? "bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-100"
                                    : "bg-sky-600 text-white hover:bg-sky-700"
                                }`}
                              >
                                {selected ? "Remove" : "Add"}
                              </button>
                              {clash && (
                                <span className="text-[10px] font-medium text-red-600 dark:text-red-400">
                                  conflicts
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* My schedule */}
        <section aria-labelledby="schedule-heading" className="lg:sticky lg:top-4 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="schedule-heading" className="text-lg font-semibold">
              My schedule
            </h2>
            {termEntries.length > 0 && (
              <button
                type="button"
                onClick={() => scheduleStore.clearTerm(term)}
                className="text-xs text-neutral-500 hover:text-red-600 hover:underline"
              >
                Clear {term}
              </button>
            )}
          </div>

          {clashKeys.size > 0 && (
            <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              ⚠ Some sections overlap in time — conflicts are outlined in red
              below.
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 p-2 dark:border-neutral-800">
            <WeeklyGrid entries={termEntries} clashKeys={clashKeys} />
          </div>

          {/* List summary */}
          {termEntries.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {termEntries.map((e) => {
                const key = `${e.course.code}|${e.section.term}|${e.section.section}`;
                const clash = clashKeys.has(key);
                return (
                  <li
                    key={key}
                    className={`flex items-start justify-between gap-3 rounded-lg border p-3 text-sm ${
                      clash
                        ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
                        : "border-neutral-200 dark:border-neutral-800"
                    }`}
                  >
                    <div>
                      <Link
                        href={`/course/${e.course.code}`}
                        className="font-medium hover:underline"
                      >
                        <span className="font-mono text-xs text-sky-700 dark:text-sky-400">
                          {e.course.code}
                        </span>{" "}
                        {e.course.title}
                      </Link>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        {e.section.section}
                        {uniqueMeetingLabels(e.section).map((label, i) => (
                          <span key={i}> · {label}</span>
                        ))}
                        {uniqueMeetingLabels(e.section).length === 0 && (
                          <span> · No meeting time listed</span>
                        )}
                      </div>
                      {clash && (
                        <div className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                          ⚠ Time conflict
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => scheduleStore.remove(e.selection)}
                      className="shrink-0 rounded-md bg-neutral-200 px-3 py-1 text-xs font-medium hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">
              No courses added yet. Find courses on the left and click{" "}
              <span className="font-medium">Add</span> to build your {term}{" "}
              schedule.
            </p>
          )}

          {otherTermCount > 0 && (
            <p className="mt-3 text-xs text-neutral-400">
              You also have {otherTermCount} course
              {otherTermCount > 1 ? "s" : ""} saved in other terms — switch terms
              above to see them.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
