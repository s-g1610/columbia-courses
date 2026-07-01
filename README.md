# Columbia Business School Semester Planner

An accessible web app to **plan your semester** from the Columbia Business
School catalog ([courses.business.columbia.edu](https://courses.business.columbia.edu/))
— not just browse it.

- 📅 **Pick a term** and see every course offered that term.
- ➕ **Add / remove specific sections** to build your schedule (saved in your
  browser — no login).
- ⚠️ **Automatic clash detection** — sections are compared by weekday, start/end
  time, *and* date range, so A-term vs B-term and one-off modular sessions are
  handled correctly. Conflicts are outlined in red on the calendar and flagged
  in the list.
- 🗓️ **Weekly calendar grid + list** view of your schedule, with a running
  **credit-load** total.
- 🔎 **Search & filter** courses (code, title, instructor, division) and open a
  **course page** with credits, division, pathway, prerequisites (cross-linked),
  full description, every section with meeting times, and content-based
  **"similar courses"** suggestions.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**. The catalog is
a static JSON snapshot (617 courses, 3000 sections), so every page is
pre-rendered at build time and the app deploys as static output anywhere.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build (pre-renders one static page per course):

```bash
npm run build && npm run start
```

## Project layout

```
src/
  app/
    page.tsx                 # the planner (home)
    course/[code]/page.tsx   # course detail: sections, schedule, recommendations
  components/
    Planner.tsx              # term picker, course finder, my-schedule panel
    WeeklyGrid.tsx           # weekly calendar with clash highlighting
    AddSectionButton.tsx     # add/remove a section from any page
    CourseCard.tsx
  lib/
    courses.ts               # data access, search, similar courses
    schedule.ts              # time parsing, clash detection, credit totals
    useSchedule.ts           # localStorage-backed schedule store
  data/
    courses.json             # catalog snapshot (source of truth)
```

## How clash detection works

Each section's meetings are parsed into time slots `{ day, start, end, dateRange }`.
Two sections clash when any pair of slots share a weekday, their times overlap,
and their date ranges overlap. See `sectionsClash` in
[`src/lib/schedule.ts`](src/lib/schedule.ts).

## Data

`src/data/courses.json` is a snapshot harvested from the official course site
(which is behind a bot-challenge, so it was captured via a real browser session).
Credit hours come from the catalog's data endpoint; per-section meeting times,
rooms, and dates come from each course page. To refresh, replace this file with
an updated array of the same shape and rebuild.

Unofficial, read-only planner. All course data belongs to Columbia Business
School; each course links back to the official listing.
