"use client"

import Link from "next/link"
import { useTheme } from "../../../../contexts/ThemeContext"

export default function TermsPage() {
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
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-600/10 blur-[150px] rounded-full" />
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
            Terms & Conditions
          </p>

          <h1 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
            Using Timetricx{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              responsibly
            </span>
          </h1>

          <p
            className={`text-base sm:text-lg max-w-2xl leading-relaxed ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            These notes describe how Timetricx is intended to be used and the
            responsibilities of both users and administrators.
          </p>
        </header>

        {/* CONTENT SECTIONS */}
        <div className="space-y-10">

          {/* ACCEPTABLE USE */}
          <section
            className={`group relative rounded-2xl p-8 transition-all duration-500 border backdrop-blur-lg
              ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 hover:border-indigo-500/40"
                  : "bg-white border-gray-200 hover:border-indigo-300"
              }
              hover:-translate-y-2 hover:shadow-2xl
            `}
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />

            <h2 className="text-lg font-semibold mb-4">
              Acceptable use
            </h2>

            <ul className="space-y-2 text-sm">
              <li>• Use Timetricx only for genuine attendance and project tracking.</li>
              <li>• Do not attempt to bypass or fake attendance logs.</li>
              <li>• Do not misuse other people’s data or access accounts that are not yours.</li>
            </ul>
          </section>

          {/* RESPONSIBILITY */}
          <section
            className={`group relative rounded-2xl p-8 transition-all duration-500 border backdrop-blur-lg
              ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 hover:border-indigo-500/40"
                  : "bg-white border-gray-200 hover:border-indigo-300"
              }
              hover:-translate-y-2 hover:shadow-2xl
            `}
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />

            <h2 className="text-lg font-semibold mb-4">
              Accuracy & responsibility
            </h2>

            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              While Timetricx helps maintain accurate logs, final responsibility
              for how data is interpreted and used rests with your organisation.
              Important decisions should not rely on a single dashboard alone.
            </p>
          </section>

          {/* NO WARRANTY */}
          <section
            className={`group relative rounded-2xl p-8 transition-all duration-500 border backdrop-blur-lg
              ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 hover:border-indigo-500/40"
                  : "bg-white border-gray-200 hover:border-indigo-300"
              }
              hover:-translate-y-2 hover:shadow-2xl
            `}
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />

            <h2 className="text-lg font-semibold mb-4">
              No warranty (demo)
            </h2>

            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              This instance of Timetricx is a demo / portfolio project and is
              provided “as is” without uptime or support guarantees.
              Production deployments should run in a properly maintained
              environment.
            </p>
          </section>

        </div>

        {/* FOOTNOTE */}
        <p className="mt-14 text-xs text-gray-500">
          These terms are simplified and not a formal legal contract.
          A real-world deployment should include legally reviewed terms
          tailored to your jurisdiction.
        </p>

      </div>
    </main>
  )
}
