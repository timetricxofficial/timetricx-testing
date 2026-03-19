"use client"

import Link from "next/link"
import { useTheme } from "../../../../contexts/ThemeContext"

export default function CookiesPage() {
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
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-indigo-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* HEADER */}
        <header className="mb-14">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-blue-500/40 px-4 py-2 text-xs font-semibold bg-blue-500 text-white hover:bg-blue-500 hover:border-blue-500 hover:translate-x-0.5 transition-all duration-300"
            >
              ← Back
            </Link>
          </div>

          <p className="text-xs uppercase tracking-[0.25em] text-blue-500 mb-4">
            Cookie Policy
          </p>

          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-6">
            How Timetricx uses{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              cookies
            </span>
          </h1>

          <p
            className={`text-base sm:text-lg max-w-2xl leading-relaxed ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Cookies are small text files stored in your browser. This page explains the
            types of cookies a typical Timetricx deployment might use.
          </p>
        </header>

        {/* TYPES OF COOKIES CARD */}
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

          <h2 className="text-lg font-semibold mb-6">Types of cookies</h2>

          <ul className="space-y-4 text-sm">
            <li>
              <span className="font-semibold text-blue-500">
                Session cookies:
              </span>{" "}
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Keep you logged in as you move between pages.
              </span>
            </li>

            <li>
              <span className="font-semibold text-blue-500">
                Preference cookies:
              </span>{" "}
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Remember things like your selected theme (dark / light).
              </span>
            </li>

            <li>
              <span className="font-semibold text-blue-500">
                Analytics cookies (optional):
              </span>{" "}
              <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                Help admins understand usage patterns in aggregate.
              </span>
            </li>
          </ul>
        </section>

        {/* MANAGING COOKIES CARD */}
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

          <h2 className="text-lg font-semibold mb-4">Managing cookies</h2>

          <p
            className={`text-sm leading-relaxed ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Your browser gives you control over cookies. You can clear them, block
            third-party cookies or use private browsing modes. Blocking some cookies may
            affect features like staying signed in.
          </p>
        </section>

        {/* FOOT NOTE */}
        <p
          className={`text-xs leading-relaxed ${
            theme === "dark" ? "text-gray-500" : "text-gray-500"
          }`}
        >
          This demo uses cookies mainly for authentication and basic preferences. In a
          production environment, your organisation should provide a detailed cookie
          banner and management options if required by local law.
        </p>

      </div>
    </main>
  )
}
