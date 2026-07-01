import Planner from "@/components/Planner";

export default function Home() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Plan your semester
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Pick a term, find Columbia Business School courses, and add sections to
          your schedule. The calendar flags any time conflicts and tracks your
          credit load. Your schedule is saved in this browser.
        </p>
      </div>
      <Planner />
    </div>
  );
}
