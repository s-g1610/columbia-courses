"use client";

import { useMemo, useState } from "react";
import { searchCourses, type Course } from "@/lib/courses";
import CourseCard from "@/components/CourseCard";

export interface FilterOptions {
  divisions: string[];
  terms: string[];
  pathways: string[];
  formats: string[];
}

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-neutral-500"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <option value="">All {label.toLowerCase()}s</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CourseBrowser({
  courses,
  options,
}: {
  courses: Course[];
  options: FilterOptions;
}) {
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState("");
  const [term, setTerm] = useState("");
  const [pathway, setPathway] = useState("");
  const [format, setFormat] = useState("");

  const results = useMemo(
    () =>
      searchCourses(courses, {
        query,
        division: division || undefined,
        term: term || undefined,
        pathway: pathway || undefined,
        format: format || undefined,
      }),
    [courses, query, division, term, pathway, format],
  );

  const activeFilters = [division, term, pathway, format].filter(
    Boolean,
  ).length;
  const hasQuery = query.trim().length > 0;

  function clearAll() {
    setQuery("");
    setDivision("");
    setTerm("");
    setPathway("");
    setFormat("");
  }

  return (
    <div>
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
        <form role="search" onSubmit={(e) => e.preventDefault()}>
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
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-base shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950"
          />

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FilterSelect
              id="filter-division"
              label="Division"
              value={division}
              options={options.divisions}
              onChange={setDivision}
            />
            <FilterSelect
              id="filter-term"
              label="Term"
              value={term}
              options={options.terms}
              onChange={setTerm}
            />
            <FilterSelect
              id="filter-pathway"
              label="Pathway"
              value={pathway}
              options={options.pathways}
              onChange={setPathway}
            />
            <FilterSelect
              id="filter-format"
              label="Format"
              value={format}
              options={options.formats}
              onChange={setFormat}
            />
          </div>
        </form>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-500" aria-live="polite">
          {results.length} {results.length === 1 ? "course" : "courses"}
          {hasQuery || activeFilters > 0 ? " match" : " available"}
        </p>
        {(hasQuery || activeFilters > 0) && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md px-2 py-1 text-sm text-sky-700 hover:bg-sky-50 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-sky-400 dark:hover:bg-sky-950"
          >
            Clear all
            {activeFilters > 0 ? ` (${activeFilters})` : ""}
          </button>
        )}
      </div>

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
          No courses match. Try a different keyword or clear some filters.
        </p>
      )}
    </div>
  );
}
