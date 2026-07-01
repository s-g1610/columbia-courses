import CourseBrowser from "@/components/CourseBrowser";
import {
  getAllCourses,
  getDivisions,
  getTerms,
  getPathways,
  getFormats,
} from "@/lib/courses";

export default function Home() {
  const courses = getAllCourses();
  const options = {
    divisions: getDivisions(),
    terms: getTerms(),
    pathways: getPathways(),
    formats: getFormats(),
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Browse Columbia Business School courses
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Search {courses.length} courses by code, title, instructor, or
          keyword, and filter by division, term, pathway, or format. Open any
          course for terms, prerequisites, instructors, and similar courses.
        </p>
      </div>
      <CourseBrowser courses={courses} options={options} />
    </div>
  );
}
