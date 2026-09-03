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
      {/* ===== Indexable "About" band — visible when the app column scrolls ===== */}
      <section
        id="about-ribbon"
        aria-label="About Ribbon Typing Coach"
        className="w-full shrink-0 px-3 sm:px-4 xl:px-5 pb-4 select-text"
      >
        <div className="bg-[#0D0F1A]/90 border border-zinc-800/80 rounded-2xl px-5 sm:px-7 py-6 text-zinc-300 leading-relaxed text-sm">
          <h2 className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-amber-100 via-amber-400 to-amber-500 text-transparent bg-clip-text">
            Free Typing Speed Test &amp; Practice — Ribbon Typing Coach
          </h2>
          <p className="mt-3">
            Ribbon is a free online typing speed test and typing coach that measures your
            words per minute (WPM) and accuracy in a fast 60-second test. Beyond the timer,
            it is a full practice studio: structured English lessons, Hindi (Devanagari)
            typing practice, JavaScript code typing with auto-bracket completion, medical
            terminology drills, and unlimited custom stories you paste yourself. Every run is
            scored for speed and accuracy, earns XP toward your level, and keeps your practice
            streak alive.
          </p>
          <p className="mt-2">
            Put your results to the test with timed race modes, zen freestyle, strict exam
            mode, arcade typing mini-games, and a weekly challenge that posts your best score
            to the shared leaderboard. Share a challenge link with friends and they can race
            the same text to beat your WPM.
          </p>

          <h3 className="mt-6 font-bold text-white tracking-wide text-sm">How the typing test works</h3>
          <ol className="mt-2 list-decimal pl-5 space-y-1.5">
            <li>Pick a lesson, duration (60 seconds by default), and language — English or Hindi.</li>
            <li>Type the highlighted text. Errors and fumbled keys are tracked in real time.</li>
            <li>See your WPM, accuracy, and benchmark rating at the end, then open the leaderboard or challenge a friend.</li>
          </ol>

          <h3 className="mt-6 font-bold text-white tracking-wide text-sm">What you can practice</h3>
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

          <h3 className="mt-6 font-bold text-white tracking-wide text-sm">Frequently asked questions</h3>
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

          <p className="mt-5 text-[11px] text-zinc-500 border-t border-zinc-800/70 pt-3">
            Ribbon Typing Coach is a free typing practice app for improving your words-per-minute
            speed and accuracy. It is not affiliated with any typing certification body.
          </p>
        </div>
      </section>

      {/* ===== Long-form indexable copy — kept off-screen so the app UI stays clean ===== */}
      <div
        className="absolute top-0 select-text"
        style={{ left: -9999, width: 860, color: "#C5C6C7", background: "#0D0F1A", fontFamily: "sans-serif", fontSize: 14, lineHeight: 1.6 }}
      >
        <div style={{ padding: 24 }}>
          <h1>Ribbon Typing Coach — free typing speed test, WPM tester, and typing practice app</h1>
          <p>
            Ribbon Typing Coach is a free typing speed test that measures how many words per minute
            (WPM) you can type and how accurately you type them. Take a 60-second WPM test, or use
            longer 2, 5, 10, and 15 minute sessions, and get an instant result with your net speed,
            accuracy percentage, and a benchmark of how you compare to average typing speeds. Because
            a typical office worker types around 40 WPM and a good speed typist reaches 60 to 80 WPM,
            Ribbon gives everyone a clear target to practice toward.
          </p>
          <h2>Practice lessons that build real typing skills</h2>
          <p>
            The best way to raise your typing speed is daily, focused practice, and Ribbon makes that
            easy with free English typing lessons that progress through home-row, common words, and
            full sentences. For learners typing in Indian languages, Ribbon includes Hindi typing
            practice using the Devanagari script with proper keyboard mapping. Programmers can train
            with JavaScript code practice where brackets are completed automatically, and students in
            health fields can drill medical typing practice with complex terminology.
          </p>
          <h2>Modes for every kind of typing session</h2>
          <p>
            A classic timed test measures your words per minute, but Ribbon also includes race mode
            against AI opponents, zen freestyle for uninterrupted flow, and strict exam mode which
            disables the backspace key to simulate a real exam environment. Arcade typing mini-games
            make practice playful, while the weekly challenge posts your best score to a shared
            leaderboard so you can measure your WPM against typists around the world. Progress is
            tracked with daily streaks, XP, and levels, keeping motivation high.
          </p>
          <h2>Challenge friends and track performance</h2>
          <p>
            Every completed session can be shared as a challenge link. A friend who opens the link
            types the exact same passage for the same duration, and the person with the higher WPM
            wins. Ribbon saves your personal bests locally, works offline, and can be installed as a
            progressive web app, so your free typing speed test and practice sessions are always one
            tap away.
          </p>
          <h2>Why accuracy matters as much as speed</h2>
          <p>
            Speed without accuracy produces error-filled text that must be corrected, which slows
            real typing down. Ribbon scores accuracy on every keystroke and highlights fumbled keys,
            so practice builds clean, confident touch typing rather than careless speed. Beginners
            who keep accuracy above 95% while gradually increasing WPM see the fastest long-term
            improvement.
          </p>
          <h2>Start your free typing test</h2>
          <p>
            Open Ribbon Typing Coach in any browser, choose English or Hindi, select a passage or
            custom story, and begin typing. In under a minute you will know your words per minute
            and accuracy, and you can immediately join the weekly challenge or challenge a friend to
            beat your score. No sign-up, no cost, and no downloads are required.
          </p>
        </div>
      </div>
    </>
  );
};
