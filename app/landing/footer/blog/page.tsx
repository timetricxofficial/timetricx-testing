"use client"

import Link from "next/link"
import { useTheme } from "../../../../contexts/ThemeContext"

export default function BlogPage() {
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
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-600/10 blur-[160px] rounded-full" />
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
            Timetricx Blog
          </p>

          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-6">
            Ideas on attendance, productivity &{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              modern teams
            </span>
          </h1>

          <p
            className={`text-base sm:text-lg max-w-2xl leading-relaxed ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Here you&apos;ll eventually find stories, guides and best practices from how
            teams use Timetricx to manage attendance, projects and remote work.
          </p>
        </header>

        {/* BLOG CARDS */}
        <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {[
            {
              title: "Why face attendance beats manual sheets",
              desc: "A simple breakdown of the errors and friction that disappear when you move from paper or Excel to camera based attendance.",
            },
            {
              title: "Tracking output, not just hours",
              desc: "How combining GitHub activity with attendance can give a fairer view of developer productivity.",
            },
            {
              title: "Designing shifts that actually work for interns",
              desc: "Lessons from teams using Timetricx with college interns and distributed contributors.",
            },
          ].map((post, i) => (
            <article
              key={i}
              className={`group relative rounded-2xl p-6 transition-all duration-500 border backdrop-blur-lg
                ${
                  theme === "dark"
                    ? "bg-white/5 border-white/10 hover:border-blue-500/40"
                    : "bg-white border-gray-200 hover:border-blue-300"
                }
                hover:-translate-y-3 hover:shadow-2xl
              `}
            >
              {/* Hover Glow Layer */}
              <div className="absolute inset-0 rounded-2xl bg-blue-500/0 group-hover:bg-blue-500/5 transition-all duration-500 pointer-events-none" />

              {/* Subtle Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />

              <h2 className="text-lg font-semibold mb-3 group-hover:text-blue-500 transition-colors duration-300">
                {post.title}
              </h2>

              <p
                className={`text-sm leading-relaxed ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {post.desc}
              </p>

              {/* Read More */}
              <div className="mt-4 text-xs font-medium text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Read more →
              </div>
            </article>
          ))}
        </section>

        {/* FOOT NOTE */}
        <p
          className={`mt-16 text-xs ${
            theme === "dark" ? "text-gray-500" : "text-gray-500"
          }`}
        >
          These are sample topics. In a real deployment, this page would be powered by
          a CMS or Markdown files and updated regularly.
        </p>

      </div>
    </main>
  )
}
