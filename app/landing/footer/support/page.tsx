"use client"

import Link from "next/link"
import { useTheme } from "../../../../contexts/ThemeContext"

export default function SupportPage() {
  const { theme } = useTheme()
  return (
    <main
      className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${
        theme === 'dark'
          ? 'bg-black text-white'
          : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <header className="mb-14">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-blue-500/40 px-4 py-2 text-xs font-semibold text-blue-500 hover:bg-blue-500/10 hover:border-blue-500 hover:translate-x-0.5 transition-all duration-300"
            >
              ← Back
            </Link>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-blue-500 mb-4">
            Support Center
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
            Need help with Timetricx?
          </h1>
          <p className={`text-base sm:text-lg max-w-2xl leading-relaxed ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Start with the quick answers below. If you still need help, use the
            contact options at the bottom of this page and we'll get back to you as
            soon as possible.
          </p>
        </header>

        {/* FAQ SECTION */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "I can't log in to my account",
                a: "Make sure you are using the correct email and password. If you have forgotten your password, use the \"Forgot Password\" option on the login page to reset it via email."
              },
              {
                q: "My attendance is not getting marked",
                a: "Check that your camera permission is granted to the browser and that you are using the correct shift timings. If the issue continues, share the approximate time and we will review the logs."
              },
              {
                q: "How do I update project progress?",
                a: "Go to your Projects dashboard, open the project and use the task modal to update completed tasks. The progress bar will update automatically."
              }
            ].map((item, i) => (
              <div
                key={i}
                className={`group relative rounded-2xl p-6 transition-all duration-500 border backdrop-blur-lg
                  ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/10 hover:border-blue-500/40'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }
                  hover:-translate-y-1 hover:shadow-2xl
                `}
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />
                
                <p className="font-semibold mb-2 text-sm">{item.q}</p>
                <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* STILL NEED HELP */}
        <section
          className={`group relative rounded-2xl p-8 transition-all duration-500 border backdrop-blur-lg
            ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10 hover:border-blue-500/40'
                : 'bg-white border-gray-200 hover:border-blue-300'
            }
            hover:-translate-y-2 hover:shadow-2xl
          `}
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl" />
          
          <h2 className="text-lg font-semibold mb-4">Still need help?</h2>
          
          <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            You can reach out to the Timetricx team using the contact options below:
          </p>
          
          <ul className={`space-y-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <li>• Use the Contact form from the "Contact Us" page in the footer.</li>
            <li>• Email your admin or HR team if you are part of an organisation.</li>
            <li>• Share screenshots or error messages where possible so we can debug faster.</li>
          </ul>
        </section>
      </div>
    </main>
  )
}

