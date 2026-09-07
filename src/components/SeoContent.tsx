import React from 'react';

export const SeoContent: React.FC = () => {
  const faqs: { q: string; a: string }[] = [
    {
      q: "How is typing speed (WPM) measured?",
      a: "Your words per minute (WPM) is calculated from the characters you type correctly each minute. In Ribbon Typing Coach a standard word is five characters, so a 60-second test with 300 correct characters equals 60 WPM. Accuracy is the share of keystrokes you get right, and it counts toward your score alongside speed.",
    },
    {
      q: "Is the typing speed test free?",
      a: "Yes. The 60-second WPM test, every practice lesson, the weekly challenge, and all arcade mini-games are completely free with no account required. Your progress is saved locally in your browser, and the app works offline as an installable PWA.",
    },
    {
      q: "What typing content can I practice?",
      a: "Ribbon offers English and Hindi (Devanagari) practice, JavaScript code typing with automatic bracket handling, medical and complex terminology drills, custom stories and text you paste yourself, plus timed story races, zen freestyle, and strict exam mode with backspace disabled.",
    },
    {
      q: "How do I improve my words per minute?",
      a: "Practice daily, focus on accuracy before speed, use the on-screen hand guide to build correct finger placement, and retake short timed tests. The app tracks your streaks, XP, and level so you can see steady improvement, and the weekly challenge lets you compare your WPM against other typists on the global leaderboard.",
    },
    {
      q: "Can I compare my typing speed with others?",
      a: "Yes. Finish a session to open the shared weekly leaderboard, where your best score for the current week is stored under your chosen name. You can also generate a challenge link and share it with friends so they can race the same passage and try to beat your WPM.",
    },
    {
      q: "Does Ribbon Typing Coach work on my phone?",
      a: "Ribbon is fully responsive with an on-screen keyboard for tablets and touch devices, and it can be installed as a progressive web app so it runs offline in fullscreen like a native app.",
    },
  ];

  return (
    <>
      {/* ===== Indexable "About" band — compact footer card; full copy stays in the DOM (collapsed) ===== */}
      <section
        id="about-ribbon"
        aria-label="About Ribbon Typing Coach"
        className="w-full shrink-0 px-3 sm:px-4 xl:px-5 pt-1 pb-4 select-text"
      >
        <div className="bg-[#0D0F1A]/90 border border-zinc-800/80 rounded-2xl px-5 sm:px-7 py-5 text-zinc-300 leading-relaxed text-sm">
          <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-amber-100 via-amber-400 to-amber-500 text-transparent bg-clip-text">
            Free Typing Speed Test &amp; Practice — Ribbon Typing Coach
          </h1>
          <p className="mt-2">
            Ribbon is a free online typing speed test and typing coach that measures your
            words per minute (WPM) and accuracy in a fast 60-second test, with structured
            English and Hindi lessons, JavaScript code practice, medical drills, custom
            stories, race modes, and a weekly challenge leaderboard — free, no account
            required.
          </p>

          <details className="group mt-4 border border-zinc-800/70 rounded-xl bg-[#0B0C10]/60">
            <summary className="cursor-pointer list-none font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center justify-between gap-3 marker:hidden px-4 py-3">
              Read the full guide &amp; FAQ
              <span className="text-amber-400 transition-transform group-open:rotate-180">▾</span>
            </summary>
            <div className="px-4 pt-3 pb-4 border-t border-zinc-800/60 space-y-5">
              <p className="text-zinc-300 leading-relaxed">
                Put your results to the test with timed race modes, zen freestyle, strict exam
                mode, arcade typing mini-games, and a weekly challenge that posts your best score
                to the shared leaderboard. Share a challenge link with friends and they can race
                the same text to beat your WPM.
              </p>

              <div>
                <h2 className="font-bold text-white tracking-wide text-sm">How the typing test works</h2>
                <ol className="mt-2 list-decimal pl-5 space-y-1.5">
                  <li>Pick a lesson, duration (60 seconds by default), and language — English or Hindi.</li>
                  <li>Type the highlighted text. Errors and fumbled keys are tracked in real time.</li>
                  <li>See your WPM, accuracy, and benchmark rating at the end, then open the leaderboard or challenge a friend.</li>
                </ol>
              </div>

              <div>
                <h2 className="font-bold text-white tracking-wide text-sm">What you can practice</h2>
                <ul className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 list-disc pl-5">
                  <li>60-second WPM speed test with live accuracy</li>
                  <li>English and Hindi typing practice lessons</li>
                  <li>Code typing practice in JavaScript syntax</li>
                  <li>Medical and complex word drills</li>
                  <li>Custom stories and pasted text</li>
                  <li>Weekly challenge with a global leaderboard</li>
                  <li>Friend challenges via shareable links</li>
                  <li>Streaks, XP, and level progression</li>
                </ul>
              </div>

              <div>
                <h2 className="font-bold text-white tracking-wide text-sm">Frequently asked questions</h2>
                <div className="mt-2 space-y-3">
                  {faqs.map((f) => (
                    <details key={f.q} className="group border border-zinc-800/70 rounded-xl px-4 py-2.5 bg-[#0B0C10]/60">
                      <summary className="cursor-pointer list-none font-semibold text-zinc-100 text-sm flex items-center justify-between gap-3 marker:hidden">
                        {f.q}
                        <span className="text-amber-400 text-xs transition-transform group-open:rotate-180">▾</span>
                      </summary>
                      <p className="mt-2 text-zinc-400 text-[13px] leading-relaxed">{f.a}</p>
                    </details>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 border-t border-zinc-800/70 pt-3">
                Ribbon Typing Coach is a free typing practice app for improving your words-per-minute
                speed and accuracy. It is not affiliated with any typing certification body.
              </p>
            </div>
          </details>
        </div>
      </section>
    </>
  );
};
