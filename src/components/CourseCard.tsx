import Link from "next/link";
import type { Course } from "@/lib/courses";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/course/${course.code}`}
      className="group block rounded-lg border border-neutral-200 p-4 no-underline transition hover:border-sky-500 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-neutral-800 dark:hover:border-sky-500"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-sm font-semibold text-sky-700 dark:text-sky-400">
          {course.code}
        </span>
        {course.credits && (
          <span className="shrink-0 text-xs text-neutral-500">
            {course.credits} cr
          </span>
        )}
      </div>
      <h3 className="mt-1 font-medium leading-snug group-hover:text-sky-700 dark:group-hover:text-sky-400">
        {course.title}
      </h3>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-500">
        {course.division && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
            {course.division}
          </span>
        )}
        {course.terms?.slice(0, 2).map((t) => (
          <span
            key={t}
            className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800"
          >
            {t}
          </span>
        ))}
      </div>
    </Link>
  );
}
