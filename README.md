# Columbia Business School Course Browser

An accessible, fast website to search and explore all **617 courses** from
[courses.business.columbia.edu](https://courses.business.columbia.edu/).

- 🔎 **Search** by course code, title, instructor, division, or keyword, with a
  division filter and live result counts.
- 📄 **Dedicated course pages** showing division, format, curriculum pathway,
  center/program, when-offered terms, instructors, prerequisites (with
  cross-links to the prerequisite courses), the full description, and the
  complete per-semester **offering history** (term · section · faculty ·
  part-of-term · notes).
- 🧭 **"Similar courses"** suggested automatically from course content — keyword
  cosine similarity on title + description, plus signals for shared curriculum
  pathway, division, center/program, instructor, and prerequisite relationships.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**. The course
catalog is a static JSON file, so every page is pre-rendered at build time and
the site deploys as static output anywhere.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build (pre-renders one static page per course):

```bash
npm run build
npm run start
```

## Project layout

```
src/
  app/
    page.tsx                 # home: search + listing
    course/[code]/page.tsx   # course detail + recommendations (generateStaticParams)
    layout.tsx               # header/footer, skip-link, metadata
  components/
    CourseBrowser.tsx        # client-side search + division filter
    CourseCard.tsx
  lib/
    courses.ts               # data loader, search, getSimilarCourses()
  data/
    courses.json             # the catalog (single source of truth)
```

## Data

`src/data/courses.json` is a snapshot harvested from the official course site.
The site is behind a bot-challenge, so the data was captured through a real
browser session. Each record follows the `Course` interface in
[`src/lib/courses.ts`](src/lib/courses.ts). To refresh, replace this file with an
updated array of the same shape and rebuild.

This is an unofficial, read-only browser. All course data belongs to Columbia
Business School; each course page links back to the official listing.
