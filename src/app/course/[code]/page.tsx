import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllCourses,
  getCourseByCode,
  getSimilarCourses,
} from "@/lib/courses";
import CourseCard from "@/components/CourseCard";

export function generateStaticParams() {
  return getAllCourses().map((c) => ({ code: c.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const course = getCourseByCode(code);
  if (!course) return { title: "Course not found" };
  return {
    title: `${course.code} · ${course.title}`,
    description: course.description?.slice(0, 160),
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const course = getCourseByCode(code);
  if (!course) notFound();

  const similar = getSimilarCourses(course);
  const prereqSet = new Set(course.prereqCodes ?? []);

  return (
    <div>
      <nav className="mb-6 text-sm">
        <Link
          href="/"
          className="text-sky-700 hover:underline dark:text-sky-400"
        >
          ← All courses
        </Link>
      </nav>

      <article>
        <header>
          <p className="font-mono text-sm font-semibold text-sky-700 dark:text-sky-400">
            {course.code}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {course.title}
          </h1>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 rounded-lg border border-neutral-200 p-5 sm:grid-cols-4 dark:border-neutral-800">
          <Field label="Division">{course.division ?? "—"}</Field>
          <Field label="Format">{course.format ?? "—"}</Field>
          <Field label="Curriculum pathway">{course.pathway ?? "—"}</Field>
          <Field label="Center / program">{course.program ?? "—"}</Field>
          <div className="col-span-2 sm:col-span-4">
            <Field label="When offered">
              {course.terms && course.terms.length > 0
                ? course.terms.join(", ")
                : "—"}
            </Field>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <Field label="Instructor(s)">
              {course.instructors && course.instructors.length > 0
                ? course.instructors.join(", ")
                : "—"}
            </Field>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <Field label="Prerequisites">
              {course.prerequisites && course.prerequisites.length > 0 ? (
                <ul className="space-y-1">
                  {course.prerequisites.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                  {prereqSet.size > 0 && (
                    <li className="flex flex-wrap gap-2 pt-1">
                      {[...prereqSet].map((pc) =>
                        getCourseByCode(pc) ? (
                          <Link
                            key={pc}
                            href={`/course/${pc}`}
                            className="rounded bg-sky-50 px-2 py-0.5 font-mono text-xs text-sky-700 hover:underline dark:bg-sky-950 dark:text-sky-300"
                          >
                            {pc} →
                          </Link>
                        ) : (
                          <span
                            key={pc}
                            className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-500 dark:bg-neutral-800"
                          >
                            {pc}
                          </span>
                        ),
                      )}
                    </li>
                  )}
                </ul>
              ) : (
                "None"
              )}
            </Field>
          </div>
        </dl>

        {course.description && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-neutral-700 dark:text-neutral-300">
              {course.description}
            </p>
          </section>
        )}

        {course.offerings && course.offerings.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Offering history</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                    <th className="py-2 pr-4 font-semibold">Term</th>
                    <th className="py-2 pr-4 font-semibold">Section</th>
                    <th className="py-2 pr-4 font-semibold">Faculty</th>
                    <th className="py-2 pr-4 font-semibold">Part of term</th>
                    <th className="py-2 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {course.offerings.map((o, i) => (
                    <tr
                      key={i}
                      className="border-b border-neutral-100 align-top dark:border-neutral-900"
                    >
                      <td className="py-2 pr-4 whitespace-nowrap">{o.term}</td>
                      <td className="py-2 pr-4 whitespace-nowrap text-neutral-500">
                        {o.section ?? "—"}
                      </td>
                      <td className="py-2 pr-4">{o.faculty ?? "—"}</td>
                      <td className="py-2 pr-4">{o.partOfTerm ?? "—"}</td>
                      <td className="py-2 text-neutral-500">{o.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <p className="mt-8 text-sm">
          <a
            href={course.url}
            target="_blank"
            rel="noreferrer"
            className="text-sky-700 hover:underline dark:text-sky-400"
          >
            View on the official Columbia course site ↗
          </a>
        </p>
      </article>

      {similar.length > 0 && (
        <section className="mt-12" aria-labelledby="similar-heading">
          <h2 id="similar-heading" className="text-lg font-semibold">
            Similar courses
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((c) => (
              <li key={c.code}>
                <CourseCard course={c} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
