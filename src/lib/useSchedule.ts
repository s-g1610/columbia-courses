"use client";

import { useSyncExternalStore } from "react";

/** A chosen section of a course, uniquely identifying one calendar entry. */
export interface Selection {
  code: string;
  term: string;
  section: string;
}

const KEY = "cbs-schedule-v1";

export function selKey(s: Selection): string {
  return `${s.code}|${s.term}|${s.section}`;
}

function load(): Selection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Selection[]) : [];
  } catch {
    return [];
  }
}

let state: Selection[] = load();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
  emit();
}

// Keep multiple tabs in sync.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      state = load();
      emit();
    }
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const EMPTY: Selection[] = [];
function getSnapshot(): Selection[] {
  return state;
}
function getServerSnapshot(): Selection[] {
  return EMPTY;
}

export const scheduleStore = {
  has(sel: Selection): boolean {
    const k = selKey(sel);
    return state.some((s) => selKey(s) === k);
  },
  add(sel: Selection) {
    if (this.has(sel)) return;
    state = [...state, sel];
    persist();
  },
  remove(sel: Selection) {
    const k = selKey(sel);
    state = state.filter((s) => selKey(s) !== k);
    persist();
  },
  toggle(sel: Selection) {
    this.has(sel) ? this.remove(sel) : this.add(sel);
  },
  clearTerm(term: string) {
    state = state.filter((s) => s.term !== term);
    persist();
  },
};

/** Reactive access to the saved schedule. */
export function useSchedule(): Selection[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
