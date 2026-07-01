"use client";

import { useMemo, useState } from "react";
import { searchCourses, type Course } from "@/lib/courses";
import CourseCard from "@/components/CourseCard";

export default function CourseBrowser({
  courses,
  divisions,
}: {
  courses: Course[];
  divisions: string[];
}) {
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState("");

  const results = useMemo(
    () => searchCourses(courses, { query, division: division || undefined }),
    [courses, query, division],
  );

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <label htmlFor="course-search" className="sr-only">
            Search courses by code, title, instructor, or keyword
          </label>
          <input
            id="course-search"
            type="search"
            autoComplete="off"
            placeholder="Search courses — e.g. “valuation”, “B7692”, an instructor…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-base shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label htmlFor="division-filter" className="sr-only">
            Filter by division
          </label>
          <select
            id="division-filter"
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 sm:w-56 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">All divisions</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </form>

      <p className="mt-4 text-sm text-neutral-500" aria-live="polite">
        {results.length} {results.length === 1 ? "course" : "courses"}
        {query || division ? " match your search" : " available"}
      </p>

      {results.length > 0 ? (
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <li key={c.code}>
              <CourseCard course={c} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-center text-neutral-500">
          No courses match. Try a different keyword or clear the division
          filter.
        </p>
      )}
    </div>
  );
}
