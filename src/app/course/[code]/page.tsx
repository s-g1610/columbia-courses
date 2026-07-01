import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllCourses,
  getCourseByCode,
  getSimilarCourses,
  termRank,
  type Section,
} from "@/lib/courses";
import { formatTimeRange } from "@/lib/schedule";
import CourseCard from "@/components/CourseCard";
import AddSectionButton from "@/components/AddSectionButton";

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

  // Group sections by term, most-recent term first.
  const byTerm = new Map<string, Section[]>();
  for (const s of course.sections ?? []) {
    if (!byTerm.has(s.term)) byTerm.set(s.term, []);
    byTerm.get(s.term)!.push(s);
  }
  const terms = [...byTerm.keys()].sort((a, b) => termRank(b) - termRank(a));

  return (
    <div>
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-sky-700 hover:underline dark:text-sky-400">
          ← Planner
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
          <Field label="Credits">{course.credits ?? "—"}</Field>
          <Field label="Division">{course.division ?? "—"}</Field>
          <Field label="Degree">{course.degree ?? "—"}</Field>
          <Field label="Curriculum pathway">{course.pathway ?? "—"}</Field>
          {course.program && (
            <div className="col-span-2 sm:col-span-4">
              <Field label="Center / program">{course.program}</Field>
            </div>
          )}
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

        {terms.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Sections &amp; schedule</h2>
            <div className="mt-3 space-y-6">
              {terms.map((term) => (
                <div key={term}>
                  <h3 className="mb-2 text-sm font-semibold text-neutral-500">
                    {term}
                  </h3>
                  <ul className="space-y-2">
                    {byTerm.get(term)!.map((s) => (
                      <li
                        key={s.section}
                        className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800"
                      >
                        <div>
                          <div className="font-medium">{s.section}</div>
                          <div className="mt-0.5 text-xs text-neutral-500">
                            {(s.meetings ?? []).length > 0 ? (
                              (s.meetings ?? []).map((m, i) => (
                                <div key={i}>
                                  {m.days} · {formatTimeRange(m.time)}
                                  {m.room ? ` · ${m.room}` : ""}
                                </div>
                              ))
                            ) : (
                              <div>No meeting time listed</div>
                            )}
                            {s.faculty && <div>{s.faculty}</div>}
                            {s.format && <div>{s.format}</div>}
                          </div>
                        </div>
                        <AddSectionButton
                          code={course.code}
                          term={term}
                          section={s.section}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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
