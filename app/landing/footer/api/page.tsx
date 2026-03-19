"use client"

import Link from "next/link"
import { useTheme } from "../../../../contexts/ThemeContext"

export default function ApiPage() {
  const { theme } = useTheme()

  return (
    <main
      className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${
        theme === "dark"
          ? "bg-black text-white"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-600/10 blur-[160px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* HEADER */}
        <header className="mb-14">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-blue-500 border border-blue-500/40 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500hover:border-blue-500 hover:translate-x-0.5 transition-all duration-300"
            >
              ← Back
            </Link>
          </div>

          <p className="text-3xl uppercase tracking-[0.25em] text-blue-500 mb-4">
            Timetricx API Reference
          </p>

          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-6">
            Integrate attendance & project data{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              into your own tools
            </span>
          </h1>

          <p
            className={`text-base sm:text-lg max-w-2xl leading-relaxed ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            The Timetricx API is designed to keep things simple: read attendance logs,
            project progress and user details so you can build custom dashboards or
            internal tools around your team data.
          </p>
        </header>

        {/* AUTH CARD */}
        <section
          className={`group relative rounded-2xl p-8 mb-10 transition-all duration-500 border backdrop-blur-lg
            ${
              theme === "dark"
                ? "bg-white/5 border-white/10 hover:border-blue-500/40"
                : "bg-white border-gray-200 hover:border-blue-300"
            }
            hover:-translate-y-2 hover:shadow-2xl
          `}
        >
          <h2 className="text-lg font-semibold mb-3">Authentication</h2>

          <p
            className={`text-sm mb-4 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            All API calls are authenticated with a bearer token. In production you
            should store this securely in your backend or environment variables.
          </p>

          <pre
            className={`text-xs rounded-xl p-4 overflow-x-auto border transition-all
              ${
                theme === "dark"
                  ? "bg-black/70 border-gray-800"
                  : "bg-gray-100 border-gray-200"
              }
            `}
          >
            <code>
{`GET /api/attendance
Authorization: Bearer <token>`}
            </code>
          </pre>
        </section>

        {/* KEY RESOURCES */}
        <section
          className={`group relative rounded-2xl p-8 mb-10 transition-all duration-500 border backdrop-blur-lg
            ${
              theme === "dark"
                ? "bg-white/5 border-white/10 hover:border-blue-500/40"
                : "bg-white border-gray-200 hover:border-blue-300"
            }
            hover:-translate-y-2 hover:shadow-2xl
          `}
        >
          <h2 className="text-lg font-semibold mb-4">Key Resources</h2>

          <ul className="space-y-4 text-sm">
            <li className="flex gap-3">
              <span className="text-blue-500 font-semibold">Attendance:</span>
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Fetch IN/OUT records for a user or a date range.
              </span>
            </li>

            <li className="flex gap-3">
              <span className="text-blue-500 font-semibold">Projects:</span>
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Read project information, task counts and progress.
              </span>
            </li>

            <li className="flex gap-3">
              <span className="text-blue-500 font-semibold">Users:</span>
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Get profile information and mapping between emails and projects.
              </span>
            </li>
          </ul>
        </section>

        {/* USE CASES */}
        <section
          className={`group relative rounded-2xl p-8 mb-10 transition-all duration-500 border backdrop-blur-lg
            ${
              theme === "dark"
                ? "bg-white/5 border-white/10 hover:border-blue-500/40"
                : "bg-white border-gray-200 hover:border-blue-300"
            }
            hover:-translate-y-2 hover:shadow-2xl
          `}
        >
          <h2 className="text-lg font-semibold mb-4">Typical Use Cases</h2>

          <ul className="space-y-3 text-sm">
            <li className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
              • Building a custom admin dashboard.
            </li>
            <li className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
              • Exporting attendance and project status into reports.
            </li>
            <li className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
              • Combining Timetricx data with HR or payroll tools.
            </li>
          </ul>
        </section>

        {/* FOOT NOTE */}
        <p
          className={`text-xs ${
            theme === "dark" ? "text-gray-500" : "text-gray-500"
          }`}
        >
          Note: This public instance focuses on product experience. If you need a
          production-grade API contract, rate limits and webhook support, please reach
          out via the Contact page.
        </p>

      </div>
    </main>
  )
}
