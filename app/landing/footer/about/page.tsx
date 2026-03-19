"use client"

import Link from "next/link"
import { useTheme } from "../../../../contexts/ThemeContext"

export default function AboutPage() {
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
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[140px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* HEADER */}
        <header className="mb-14">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-blue-500/40 px-6 py-3 text-sm font-bold text-white bg-blue-500 hover:bg-blue-500 hover:border-blue-500 hover:translate-x-1 transition-all duration-300"
            >
              ← Back
            </Link>
          </div>

          <p className="text-3xl uppercase tracking-[0.25em] text-blue-500 mb-4">
            About Timetricx
          </p>

          <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-6">
            Making attendance & project tracking{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              actually useful
            </span>
          </h1>

          <p
            className={`text-base sm:text-lg max-w-2xl leading-relaxed ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Timetricx was built to solve a simple problem: time and attendance tools
            usually create more work than they save. We combine face attendance,
            project visibility and GitHub activity into one seamless experience.
          </p>
        </header>

        {/* CONTENT SECTION */}
        <section
          className={`space-y-6 mb-16 text-sm sm:text-base leading-relaxed ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          <p>
            Instead of just tracking who clocked in, Timetricx helps teams understand
            how work is progressing: which projects are moving, where people are stuck
            and how remote or hybrid teams are performing.
          </p>
          <p>
            The product is especially focused on teams working with interns,
            contributors or distributed developers where both time and real output
            matter.
          </p>
        </section>

        {/* FEATURE CARDS */}
        <section className="grid gap-6 md:grid-cols-3 mb-16">

          {[
            {
              title: "Simple for users",
              desc: "Face based check-ins and a clean dashboard keep daily usage light.",
            },
            {
              title: "Useful for admins",
              desc: "Project progress, attendance logs and GitHub activity give a complete picture.",
            },
            {
              title: "Built for modern teams",
              desc: "Works well for startups, internship programs and remote teams experimenting with flexible work.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`group relative rounded-2xl p-6 transition-all duration-500 border backdrop-blur-lg
                ${
                  theme === "dark"
                    ? "bg-white/5 border-white/10 hover:border-blue-500/40"
                    : "bg-white border-gray-200 hover:border-blue-300"
                }
                hover:-translate-y-2 hover:shadow-2xl
              `}
            >
              {/* HOVER GLOW */}
              <div className="absolute inset-0 rounded-2xl bg-blue-500/0 group-hover:bg-blue-500/5 transition-all duration-500 pointer-events-none" />

              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />

              <h2 className="font-semibold text-lg mb-3 group-hover:text-blue-500 transition-colors duration-300">
                {item.title}
              </h2>

              <p
                className={`text-sm leading-relaxed ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {item.desc}
              </p>

              {/* Arrow indicator */}
              <div className="mt-4 text-xs font-medium text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Learn more →
              </div>
            </div>
          ))}
        </section>

        {/* FOOT NOTE */}
        <p
          className={`text-xs leading-relaxed ${
            theme === "dark" ? "text-gray-500" : "text-gray-500"
          }`}
        >
          This deployment is focused on demonstrating product flows. If you are
          interested in using Timetricx in your organisation, please reach out via
          the Contact page.
        </p>
      </div>
    </main>
  )
}
