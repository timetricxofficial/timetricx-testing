"use client"

import Link from "next/link"
import { useTheme } from "../../../../contexts/ThemeContext"

export default function PrivacyPage() {
  const { theme } = useTheme()

  return (
    <main
      className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${
        theme === "dark"
          ? "bg-black text-white"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* HEADER */}
        <header className="mb-14">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-blue-500/40 px-4 py-2 text-xs font-semibold bg-blue-500 text-white hover:bg-blue-500/10 hover:border-blue-500 hover:translate-x-0.5 transition-all duration-300"
            >
              ← Back
            </Link>
          </div>

          <p className="text-3xl uppercase tracking-[0.25em] text-blue-500 mb-4">
            Privacy Policy
          </p>

          <h1 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
            Your data &{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              privacy
            </span>
          </h1>

          <p
            className={`text-base sm:text-lg max-w-2xl leading-relaxed ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            This page explains in simple language what kind of data Timetricx
            works with and how it would typically be used in a production setup.
          </p>
        </header>

        {/* SECTIONS */}
        <div className="space-y-10">

          {/* DATA SECTION */}
          <section
            className={`group relative rounded-2xl p-8 transition-all duration-500 border backdrop-blur-lg
              ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 hover:border-blue-500/40"
                  : "bg-white border-gray-200 hover:border-blue-300"
              }
              hover:-translate-y-2 hover:shadow-2xl
            `}
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />

            <h2 className="text-lg font-semibold mb-4">
              What data we work with
            </h2>

            <p className={`text-sm mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Timetricx is an attendance and project tracking tool, so most data is
              related to your work account and activity.
            </p>

            <ul className="space-y-2 text-sm">
              <li>• Basic profile details (name, email, profile picture).</li>
              <li>• Attendance events (check-in / check-out time and status).</li>
              <li>• Project metadata (project names, deadlines, task counts).</li>
              <li>• Optional GitHub identifiers for activity tracking.</li>
            </ul>
          </section>

          {/* USAGE SECTION */}
          <section
            className={`group relative rounded-2xl p-8 transition-all duration-500 border backdrop-blur-lg
              ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 hover:border-blue-500/40"
                  : "bg-white border-gray-200 hover:border-blue-300"
              }
              hover:-translate-y-2 hover:shadow-2xl
            `}
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />

            <h2 className="text-lg font-semibold mb-4">
              How this data is used
            </h2>

            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              In a real deployment, your organisation would use this information
              to generate attendance reports, understand project progress and
              support internal reviews. Timetricx itself is not intended to sell
              or share this data externally.
            </p>
          </section>

          {/* USER RIGHTS SECTION */}
          <section
            className={`group relative rounded-2xl p-8 transition-all duration-500 border backdrop-blur-lg
              ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 hover:border-blue-500/40"
                  : "bg-white border-gray-200 hover:border-blue-300"
              }
              hover:-translate-y-2 hover:shadow-2xl
            `}
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />

            <h2 className="text-lg font-semibold mb-4">
              Your choices
            </h2>

            <p className={`text-sm mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              If you are using Timetricx through your organisation, most settings
              around retention and export will be controlled by your admin.
            </p>

            <ul className="space-y-2 text-sm">
              <li>• See your attendance and project history.</li>
              <li>• Request corrections if something is incorrect.</li>
              <li>• Ask about retention periods for logs and reports.</li>
            </ul>
          </section>

        </div>

        {/* FOOTNOTE */}
        <p className="mt-14 text-xs text-gray-500">
          This demo does not represent a full legal document. Any production
          rollout of Timetricx should include a legally reviewed privacy policy.
        </p>

      </div>
    </main>
  )
}
