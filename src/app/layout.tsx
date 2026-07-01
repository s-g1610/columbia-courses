import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Columbia Business School Course Browser",
  description:
    "Search and explore Columbia Business School courses — credits, terms, prerequisites, instructors, and similar courses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-sky-700 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <header className="border-b border-neutral-200 dark:border-neutral-800">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
            <a href="/" className="flex items-center gap-3 no-underline">
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded bg-sky-700 font-bold text-white"
              >
                CB
              </span>
              <span className="font-semibold tracking-tight">
                Columbia Business School{" "}
                <span className="text-neutral-500">Course Browser</span>
              </span>
            </a>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-neutral-200 py-6 text-center text-sm text-neutral-500 dark:border-neutral-800">
          Unofficial browser. Data sourced from{" "}
          <a
            href="https://courses.business.columbia.edu/"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            courses.business.columbia.edu
          </a>
          .
        </footer>
      </body>
    </html>
  );
}
