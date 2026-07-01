import rawCourses from "@/data/courses.json";

/**
 * Canonical shape for a single course. The harvester writes this exact shape to
 * src/data/courses.json, so the whole app reads from one source of truth.
 * Most fields are optional because the source pages are inconsistent — render
 * defensively and only show what exists.
 */
/** A single scheduled offering of a course in one term. */
export interface Offering {
  term: string;
  section?: string;
  faculty?: string;
  partOfTerm?: string;
  format?: string;
  notes?: string;
}

export interface Course {
  /** Course code, e.g. "B7692". Unique; used as the route param. */
  code: string;
  title: string;
  description?: string;
  /** Academic division / department, e.g. "Finance". */
  division?: string;
  /** Center or program affiliation, e.g. "Healthcare & Pharmaceutical Management Program". */
  program?: string;
  /** Curriculum pathway, e.g. "AI and Data Analytics". */
  pathway?: string;
  /** Terms the course runs, most recent first, e.g. ["Fall 2026", "Spring 2026"]. */
  terms?: string[];
  /** Distinct instructors across all offerings. */
  instructors?: string[];
  /** Course format from the most recent offering, e.g. "A Term", "Full Term". */
  format?: string;
  /** Prerequisite/corequisite statements as shown on the page. */
  prerequisites?: string[];
  /** Course codes referenced by the prerequisites (for cross-linking). */
  prereqCodes?: string[];
  /** Full per-term offering history. */
  offerings?: Offering[];
  /** Canonical URL of the source page. */
  url: string;
}

const courses = rawCourses as Course[];

/** All courses, sorted by code for stable listing. */
export function getAllCourses(): Course[] {
  return [...courses].sort((a, b) => a.code.localeCompare(b.code));
}

export function getCourseByCode(code: string): Course | undefined {
  return courses.find((c) => c.code.toLowerCase() === code.toLowerCase());
}

/** Distinct divisions present in the data, sorted, for the filter UI. */
export function getDivisions(): string[] {
  const set = new Set<string>();
  for (const c of courses) if (c.division) set.add(c.division);
  return [...set].sort();
}

// ---------------------------------------------------------------------------
// Text utilities (shared by search and similarity)
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "with", "is",
  "are", "be", "this", "that", "as", "at", "by", "from", "will", "we", "you",
  "their", "they", "it", "its", "course", "students", "student", "class",
  "introduction", "intro", "topics", "topic", "study", "studies", "use",
  "using", "based", "how", "such", "these", "also", "may", "can", "which",
  "into", "but", "not", "have", "has", "all", "each", "other", "than", "then",
  "our", "your", "about", "more", "most", "some", "any", "one", "two",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/** Build a term-frequency map for a course's title + description. */
function termFreq(course: Course): Map<string, number> {
  const tokens = tokenize(`${course.title} ${course.description ?? ""}`);
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

/** Cosine similarity between two term-frequency maps. */
function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  for (const [term, av] of a) {
    const bv = b.get(term);
    if (bv) dot += av * bv;
  }
  if (dot === 0) return 0;
  let amag = 0;
  for (const v of a.values()) amag += v * v;
  let bmag = 0;
  for (const v of b.values()) bmag += v * v;
  return dot / (Math.sqrt(amag) * Math.sqrt(bmag));
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

/**
 * Suggest courses similar to `course`, scored from content alone:
 *  - keyword overlap on title + description (cosine TF), the dominant signal
 *  - same curriculum pathway (+0.30)
 *  - same division (+0.20)
 *  - same center/program (+0.15)
 *  - shared instructor (+0.15)
 *  - listed as a prerequisite of / shares a prerequisite with (+0.10)
 * Returns the top `limit` by score, excluding the course itself.
 */
export function getSimilarCourses(course: Course, limit = 6): Course[] {
  const base = termFreq(course);
  const baseInstructors = new Set(
    (course.instructors ?? []).map((i) => i.toLowerCase()),
  );
  const basePrereqs = new Set(course.prereqCodes ?? []);

  const scored = courses
    .filter((c) => c.code !== course.code)
    .map((c) => {
      let score = cosine(base, termFreq(c));
      if (course.pathway && c.pathway === course.pathway) score += 0.3;
      if (course.division && c.division === course.division) score += 0.2;
      if (course.program && c.program === course.program) score += 0.15;
      if (
        baseInstructors.size > 0 &&
        (c.instructors ?? []).some((i) => baseInstructors.has(i.toLowerCase()))
      ) {
        score += 0.15;
      }
      // Prerequisite relationship in either direction, or a shared prerequisite.
      if (
        basePrereqs.has(c.code) ||
        (c.prereqCodes ?? []).includes(course.code) ||
        (c.prereqCodes ?? []).some((p) => basePrereqs.has(p))
      ) {
        score += 0.1;
      }
      return { course: c, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.course);
}

// ---------------------------------------------------------------------------
// Search (client-side, runs over the full dataset)
// ---------------------------------------------------------------------------

export interface SearchFilters {
  query?: string;
  division?: string;
}

/**
 * Rank courses against a free-text query. A course matches if every query token
 * appears somewhere in its searchable text; results are ranked so that code and
 * title hits outrank description hits.
 */
export function searchCourses(all: Course[], filters: SearchFilters): Course[] {
  let results = all;

  if (filters.division) {
    results = results.filter((c) => c.division === filters.division);
  }

  const q = filters.query?.trim().toLowerCase();
  if (!q) return results;

  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = results
    .map((c) => {
      const code = c.code.toLowerCase();
      const title = c.title.toLowerCase();
      const haystack = [
        c.code,
        c.title,
        c.division ?? "",
        (c.instructors ?? []).join(" "),
        c.description ?? "",
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      for (const tok of tokens) {
        if (!haystack.includes(tok)) return null; // require all tokens
        if (code.includes(tok)) score += 5;
        if (title.includes(tok)) score += 3;
        score += 1;
      }
      // Exact-ish code or title match floats to the top.
      if (code === q) score += 20;
      if (title.includes(q)) score += 4;
      return { course: c, score };
    })
    .filter((s): s is { course: Course; score: number } => s !== null)
    .sort((a, b) => b.score - a.score);

  return scored.map((s) => s.course);
}
