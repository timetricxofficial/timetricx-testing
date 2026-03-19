"use client"

import Link from "next/link"
import { useTheme } from "../../../../contexts/ThemeContext"

export default function DocsPage() {
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
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[750px] h-[750px] bg-blue-600/10 blur-[160px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* HEADER */}
        <header className="mb-16">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-blue-500/40 px-4 py-2 text-xs font-semibold bg-blue-500 text-white hover:bg-blue-500 hover:border-blue-500 hover:translate-x-0.5 transition-all duration-300"
            >
              ← Back
            </Link>
          </div>

          <p className="text-3xl uppercase tracking-[0.25em] text-blue-500 mb-4">
            Timetricx Documentation
          </p>

          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-6">
            Build better attendance & project workflows{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              with Timetricx
            </span>
          </h1>

          <p
            className={`text-base sm:text-lg max-w-2xl leading-relaxed ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Timetricx connects face attendance, GitHub activity and project tracking in
            one place. This page gives you a high level overview so you can understand
            how the pieces fit together before diving into the app.
          </p>
        </header>

        {/* FEATURE GRID */}
        <div className="grid gap-8 md:grid-cols-2 mb-16">

          {[
            {
              title: "Face Attendance",
              desc: "Camera based face recognition to mark IN / OUT automatically.",
              points: [
                "Simple check-in / check-out from dashboard.",
                "Shift based validation system.",
                "Automatic logs for attendance reports.",
              ],
            },
            {
              title: "GitHub Tracking",
              desc: "Track real coding activity alongside attendance.",
              points: [
                "Track commits and contributions.",
                "Combine time + output visibility.",
                "Perfect for interns & remote teams.",
              ],
            },
          ].map((section, i) => (
            <section
              key={i}
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

              <h2 className="text-lg font-semibold mb-3">
                {section.title}
              </h2>

              <p className={`text-sm mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {section.desc}
              </p>

              <ul className="space-y-2 text-sm">
                {section.points.map((point, idx) => (
                  <li
                    key={idx}
                    className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  >
                    • {point}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* PROJECTS SECTION */}
        <section
          className={`group relative rounded-2xl p-8 mb-14 transition-all duration-500 border backdrop-blur-lg
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
            Projects, Tasks & Teams
          </h2>

          <p className={`text-sm mb-6 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Projects are the main container for work. Admins assign users,
            define tasks and track progress from one dashboard.
          </p>

          <div className="grid gap-6 md:grid-cols-3 text-sm">
            {[
              {
                title: "Projects",
                desc: "Define name, deadline and task counts.",
              },
              {
                title: "Tasks & Progress",
                desc: "Update completed tasks and refresh progress instantly.",
              },
              {
                title: "Teams",
                desc: "Add members by email and manage workload distribution.",
              },
            ].map((item, i) => (
              <div key={i}>
                <h3 className="font-semibold mb-2 text-blue-500">
                  {item.title}
                </h3>
                <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* GETTING STARTED */}
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
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />

          <h2 className="text-lg font-semibold mb-4">
            Getting started in 4 steps
          </h2>

          <ol className="space-y-3 text-sm">
            {[
              "Create account & complete profile.",
              "Connect GitHub (and Google if needed).",
              "Join or create projects and define tasks.",
              "Use daily Face Attendance + GitHub data.",
            ].map((step, i) => (
              <li key={i} className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                {i + 1}. {step}
              </li>
            ))}
          </ol>
        </section>

        {/* FOOT NOTE */}
        <p className="text-xs text-gray-500">
          For detailed flows (login, attendance rules, admin configuration),
          explore API Reference, Support and Privacy Policy.
        </p>

      </div>
    </main>
  )
}
