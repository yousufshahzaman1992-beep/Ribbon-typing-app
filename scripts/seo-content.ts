/**
 * seo-content.ts
 * ---------------------------------------------------------------------------
 * Content for the programmatic SEO landing pages. Rendering lives in
 * scripts/generate-seo-pages.ts; URLs, groups and lastmod dates live in
 * scripts/seo-config.ts. Each slug here must have a matching entry there.
 */

import type { SeoPage } from './seo-config.ts';

export const PAGES: SeoPage[] = [
  {
    slug: 'ssc-chsl-hindi-typing-test',
    title: 'SSC CHSL Hindi Typing Test — Free Practice & Exam Mode | Ribbon',
    description:
      'Free SSC CHSL Hindi typing test with Devanagari passages, live WPM and accuracy, and a strict exam mode that disables backspace. No sign-up required.',
    eyebrow: 'Devanagari · Exam mode · Free',
    h1Lead: 'SSC CHSL Hindi Typing Test with',
    h1Accent: 'Real Exam Conditions',
    lede:
      'Practise the Hindi (Devanagari) passages that clerical exams use, see your words per minute and accuracy in real time, and switch on strict exam mode so backspace is disabled exactly like the real test.',
    sections: [
      {
        h2: 'What the SSC CHSL Hindi typing test measures',
        paragraphs: [
          'A Hindi typing test is not only a speed test. It measures how many words per minute you can produce while keeping the error rate low enough to pass. In exam conditions, every wrong character costs you, and there is no grammar checker to save a sloppy passage.',
          'Ribbon tracks speed and accuracy together, so a fast but inaccurate run is reported honestly instead of being hidden behind a single inflated number.',
        ],
        cards: [
          { h3: 'Devanagari input', p: 'Practise matras, half-letters and conjuncts in the same script the exam expects.' },
          { h3: 'Strict exam mode', p: 'Disable backspace so you type forward-only, the way many government typing tests are conducted.' },
          { h3: 'Live WPM and accuracy', p: 'Watch both numbers update as you type, then review the characters you missed.' },
          { h3: 'Repeatable passages', p: 'Retake the same passage to measure improvement instead of guessing.' },
        ],
      },
      {
        h2: 'How to practise for the exam',
        steps: [
          'Warm up with a short Hindi lesson so your fingers find the matras before the timer starts.',
          'Run one timed passage at normal speed and note both WPM and accuracy.',
          'Review the missed characters, then repeat the same passage once.',
          'Only after accuracy is stable should you push for higher speed.',
        ],
      },
      {
        h2: 'Speed versus accuracy',
        paragraphs: [
          'Most candidates lose marks by chasing speed too early. A clean run at a moderate speed scores better than a fast run with a high error rate, and it builds the muscle memory that makes speed possible later.',
          'Aim to keep accuracy high and let words per minute rise gradually. Short, daily sessions beat one long session each week.',
        ],
      },
      {
        h2: 'Common Hindi typing mistakes',
        list: [
          'Missing or misplacing a matra because the base letter was typed first.',
          'Confusing similar-looking conjuncts under time pressure.',
          'Rushing the space bar and merging two words.',
          'Losing rhythm after a single error instead of typing through it.',
        ],
        note: 'Use exam mode once your accuracy is steady. It exposes bad habits that backspace quietly hides.',
      },
    ],
    faq: [
      {
        q: 'Is this SSC CHSL Hindi typing test free?',
        a: 'Yes. The Hindi passages, strict exam mode, timed test and progress tracking are free and require no account.',
      },
      {
        q: 'Does exam mode disable backspace?',
        a: 'Yes. Strict exam mode prevents you from correcting characters, which matches the forward-only format used by many government typing tests.',
      },
      {
        q: 'Can I practise Devanagari if I am a beginner?',
        a: 'Yes. Start with the Hindi typing lessons to learn matras and conjuncts, then move to full exam-style passages.',
      },
    ],
    related: [
      { href: '/hindi-typing-lessons', label: 'Hindi typing lessons' },
      { href: '/clerical-civil-exam-practice', label: 'Clerical & civil exam practice' },
      { href: '/typing-practice-for-beginners', label: 'Typing practice for beginners' },
      { href: '/', label: 'Free WPM test' },
    ],
  },
  {
    slug: 'clerical-civil-exam-practice',
    title: 'Clerical & Civil Exam Typing Practice — Hindi and English | Ribbon',
    description:
      'Prepare for clerical and civil service typing tests with timed Hindi and English passages, strict exam mode, and clear WPM and accuracy feedback. Free, no sign-up.',
    eyebrow: 'Hindi · English · Timed',
    h1Lead: 'Clerical and Civil Exam Typing Practice in',
    h1Accent: 'Hindi and English',
    lede:
      'Government typing tests reward steady accuracy under pressure. Practise timed passages in both scripts, review your errors, and build a routine you can repeat before exam day.',
    sections: [
      {
        h2: 'Who this practice is for',
        paragraphs: [
          'This guide is aimed at candidates preparing for clerical and civil service roles that include a typing or data-entry component. The exact format varies by exam and authority, so always confirm the current rules for your specific notification.',
        ],
        list: [
          'Candidates building speed before a Hindi or English typing test.',
          'Anyone who needs to practise without backspace in strict mode.',
          'Typists returning to practice after a break and rebuilding rhythm.',
        ],
      },
      {
        h2: 'A simple weekly routine',
        cards: [
          { h3: 'Day 1-2: accuracy', p: 'Slow timed passages with exam mode on. Do not chase WPM yet.' },
          { h3: 'Day 3-4: speed', p: 'Same passages, slightly faster, while keeping errors low.' },
          { h3: 'Day 5: mixed script', p: 'Alternate Hindi and English so neither layout feels unfamiliar.' },
          { h3: 'Day 6: full test', p: 'One uninterrupted run, then review every missed character.' },
        ],
      },
      {
        h2: 'What to track',
        paragraphs: [
          'Track two numbers only: words per minute and accuracy. Progress in one without the other is not progress. If accuracy drops, slow down for a session. If accuracy is high but speed is flat, add short bursts at a slightly faster pace.',
        ],
        note: 'Consistency beats intensity. Four short sessions a week will move your score further than one long session.',
      },
    ],
    faq: [
      {
        q: 'Can I practise both Hindi and English here?',
        a: 'Yes. Ribbon includes English and Devanagari Hindi passages, so you can alternate scripts in the same session.',
      },
      {
        q: 'Is strict exam mode available?',
        a: 'Yes. Strict mode disables backspace so you practise forward-only typing, similar to many government tests.',
      },
      {
        q: 'Does this guarantee a pass?',
        a: 'No. It is practice software, not an official exam. Always check your exam authority for the current pattern and scoring rules.',
      },
    ],
    related: [
      { href: '/ssc-chsl-hindi-typing-test', label: 'SSC CHSL Hindi test' },
      { href: '/hindi-typing-lessons', label: 'Hindi typing lessons' },
      { href: '/offline-typing-test', label: 'Offline typing test' },
      { href: '/ad-free-typing-test', label: 'Ad-free typing test' },
    ],
  },
  {
    slug: 'hindi-typing-lessons',
    title: 'Hindi Typing Lessons — Learn Devanagari Step by Step | Ribbon',
    description:
      'Learn Hindi typing with structured Devanagari lessons covering the home row, matras, conjuncts and full words. Free practice with live accuracy feedback.',
    eyebrow: 'Devanagari · Beginner friendly',
    h1Lead: 'Hindi Typing Lessons for',
    h1Accent: 'Devanagari Beginners',
    lede:
      'Devanagari is not harder to type, it is just less forgiving of skipped steps. These lessons start at the home row and build up to matras, conjuncts and full passages at a comfortable pace.',
    sections: [
      {
        h2: 'Why Hindi typing feels difficult at first',
        paragraphs: [
          'English typing is mostly one key, one letter. Devanagari adds matras that attach around the base character and conjuncts that combine letters. If you rush into full words, you spend your time hunting for marks instead of building rhythm.',
          'The fix is sequencing: learn the base letters, then the matras, then the conjuncts, and only then move to sentences.',
        ],
      },
      {
        h2: 'The learning path',
        steps: [
          'Home row first: build finger placement without looking down.',
          'Base consonants: add letters one group at a time.',
          'Matras: practise each vowel mark until it attaches automatically.',
          'Conjuncts and half-letters: introduce the common combinations.',
          'Full words and sentences: move to timed passages only when the marks feel natural.',
        ],
      },
      {
        h2: 'Practice habits that work',
        list: [
          'Keep sessions short and frequent rather than long and rare.',
          'Watch accuracy before speed; wrong matras are expensive to unlearn.',
          'Repeat a lesson until it feels boring, then move on.',
          'Use the on-screen hand guide to confirm finger placement.',
        ],
        note: 'Once the basics are comfortable, switch to the SSC CHSL style passages to practise under exam-like conditions.',
      },
    ],
    faq: [
      {
        q: 'Do I need a special keyboard to type Hindi?',
        a: 'No. Ribbon supports Devanagari practice so you can learn the layout and build muscle memory with your existing keyboard.',
      },
      {
        q: 'How long does it take to learn Hindi typing?',
        a: 'It depends on your starting point and consistency. Short daily practice with accuracy as the priority is the fastest reliable route.',
      },
      {
        q: 'Should I learn matras before full words?',
        a: 'Yes. Learning matras in isolation first makes full words far less frustrating later.',
      },
    ],
    related: [
      { href: '/ssc-chsl-hindi-typing-test', label: 'SSC CHSL Hindi test' },
      { href: '/clerical-civil-exam-practice', label: 'Clerical & civil exam practice' },
      { href: '/typing-practice-for-beginners', label: 'Typing practice for beginners' },
      { href: '/', label: 'Free WPM test' },
    ],
  },
  {
    slug: 'javascript-syntax-practice',
    title: 'JavaScript Typing Practice — Code Speed Test with Brackets | Ribbon',
    description:
      'Practise typing JavaScript with real syntax: brackets, quotes, operators and indentation. Improve code speed and accuracy with live feedback. Free.',
    eyebrow: 'Code · Symbols · Accuracy',
    h1Lead: 'JavaScript Typing Practice for',
    h1Accent: 'Real Code Speed',
    lede:
      'Typing prose and typing code are different skills. JavaScript adds brackets, quotes, semicolons and indentation, and a single misplaced symbol can break a line. Practise the syntax you actually write.',
    sections: [
      {
        h2: 'Why code typing is harder than prose',
        cards: [
          { h3: 'Symbol density', p: 'Braces, brackets, parentheses and operators make every line a precision exercise.' },
          { h3: 'Paired characters', p: 'Opening and closing symbols must match, so errors compound quickly.' },
          { h3: 'Indentation', p: 'Tabs and spaces carry meaning, and sloppy indentation slows review later.' },
          { h3: 'Mixed case', p: 'camelCase and PascalCase ask your fingers to switch rhythm mid-word.' },
        ],
      },
      {
        h2: 'A practical JavaScript drill',
        steps: [
          'Start with short snippets: variable declarations, arrow functions and template strings.',
          'Practise bracket pairs until open and close happen without hesitation.',
          'Add indentation and keep it consistent across the whole snippet.',
          'Move to slightly longer functions and review every symbol error.',
        ],
      },
      {
        h2: 'Accuracy rules for code',
        paragraphs: [
          'In prose, a typo is usually still readable. In code, a wrong quote or brace changes behaviour. Treat symbol accuracy as the primary metric and let raw speed follow.',
          'Enable auto-bracket handling if you want to focus on structure, or turn it off to train precise manual entry.',
        ],
        note: 'Short, correct snippets build better habits than long, sloppy ones.',
      },
    ],
    faq: [
      {
        q: 'Does Ribbon support bracket pairing?',
        a: 'Yes. The code practice modes track brackets and symbols so you can train both automatic pairing and precise manual entry.',
      },
      {
        q: 'Can I practise JavaScript as a beginner?',
        a: 'Yes. Start with short declarations and simple functions before moving to longer snippets.',
      },
      {
        q: 'Is code practice different from normal typing lessons?',
        a: 'Yes. Code sessions weight symbols, brackets and indentation more heavily than prose passages.',
      },
    ],
    related: [
      { href: '/python-speed-test', label: 'Python speed test' },
      { href: '/html-css-tag-drills', label: 'HTML & CSS tag drills' },
      { href: '/offline-typing-test', label: 'Offline typing test' },
      { href: '/', label: 'Free WPM test' },
    ],
  },
  {
    slug: 'python-speed-test',
    title: 'Python Speed Test — Typing Practice for Python Code | Ribbon',
    description:
      'Measure your Python typing speed with indentation, snake_case, f-strings and punctuation. Live WPM and accuracy for real code practice. Free, no sign-up.',
    eyebrow: 'Python · Indentation · Speed',
    h1Lead: 'Python Speed Test for',
    h1Accent: 'Clean, Accurate Code',
    lede:
      'Python looks simple until indentation and punctuation decide whether the code runs. Practise the patterns you write every day and measure speed without sacrificing correctness.',
    sections: [
      {
        h2: 'What makes Python typing distinctive',
        list: [
          'Indentation is syntax, so spaces matter.',
          'snake_case asks for steady underscore placement.',
          'f-strings combine quotes, braces and expressions.',
          'Colons and commas appear in almost every block.',
        ],
      },
      {
        h2: 'Drills that transfer to real work',
        cards: [
          { h3: 'Function signatures', p: 'Practise def lines, parameters and return annotations.' },
          { h3: 'Comprehensions', p: 'Train bracket and loop patterns in compact expressions.' },
          { h3: 'Dictionaries and lists', p: 'Build fluency with braces, keys and trailing commas.' },
          { h3: 'String formatting', p: 'Repeat f-string patterns until the braces feel natural.' },
        ],
      },
      {
        h2: 'How to measure progress',
        paragraphs: [
          'Run short snippets at a controlled pace and record both speed and accuracy. If accuracy falls, reduce speed for the next session. If accuracy stays high, add a longer snippet rather than typing faster immediately.',
        ],
        note: 'Consistent indentation is part of the exercise, not an afterthought.',
      },
    ],
    faq: [
      {
        q: 'Is this a real Python editor?',
        a: 'No. It is a typing practice environment for Python-style text. Use your editor for running code.',
      },
      {
        q: 'Does indentation count toward accuracy?',
        a: 'Yes. Python practice tracks the characters you type, including spaces used for indentation.',
      },
      {
        q: 'Can beginners use the Python speed test?',
        a: 'Yes. Start with short snippets and simple function signatures before longer blocks.',
      },
    ],
    related: [
      { href: '/javascript-syntax-practice', label: 'JavaScript typing practice' },
      { href: '/html-css-tag-drills', label: 'HTML & CSS tag drills' },
      { href: '/ad-free-typing-test', label: 'Ad-free typing test' },
      { href: '/', label: 'Free WPM test' },
    ],
  },
  {
    slug: 'html-css-tag-drills',
    title: 'HTML & CSS Typing Drills — Tags, Selectors and Attributes | Ribbon',
    description:
      'Practise typing HTML tags, attributes and CSS selectors with accurate angle brackets, quotes and braces. Improve markup speed and precision. Free.',
    eyebrow: 'Markup · Selectors · Precision',
    h1Lead: 'HTML and CSS Typing Drills for',
    h1Accent: 'Precise Markup',
    lede:
      'Markup rewards precision. Angle brackets, quotes and braces appear constantly, and a missing slash or quote changes the result. Drill the patterns until they are automatic.',
    sections: [
      {
        h2: 'The characters that slow you down',
        cards: [
          { h3: 'Angle brackets', p: 'Opening and closing tags require a consistent rhythm on the same keys.' },
          { h3: 'Quotes', p: 'Attribute values depend on matching single or double quotes.' },
          { h3: 'Equals signs', p: 'Attributes pair a name, an equals sign and a value every time.' },
          { h3: 'Curly braces', p: 'CSS rules wrap declarations in braces that must balance.' },
        ],
      },
      {
        h2: 'A markup practice sequence',
        steps: [
          'Practise simple tags with one attribute until the bracket pattern is automatic.',
          'Add nested elements and keep indentation consistent.',
          'Move to CSS rules with selectors, properties and values.',
          'Finish with a short full snippet that combines HTML and CSS.',
        ],
      },
      {
        h2: 'Precision before speed',
        paragraphs: [
          'A fast but malformed tag costs more time than a steady correct one, because you have to go back and fix it. Treat balanced brackets and matching quotes as the goal, then increase speed once the structure is reliable.',
        ],
        note: 'Review every mismatched quote or brace after each drill; that review is where most improvement happens.',
      },
    ],
    faq: [
      {
        q: 'Can I practise HTML and CSS together?',
        a: 'Yes. Drills cover tags, attributes, selectors and declaration blocks so you can practise both in one session.',
      },
      {
        q: 'Do I need a code editor for this?',
        a: 'No. The drills are typing practice. Use your own editor when you want to build and preview real pages.',
      },
      {
        q: 'Is this suitable for beginners?',
        a: 'Yes. Start with single tags and simple selectors, then add nesting and longer rules.',
      },
    ],
    related: [
      { href: '/javascript-syntax-practice', label: 'JavaScript typing practice' },
      { href: '/python-speed-test', label: 'Python speed test' },
      { href: '/offline-typing-test', label: 'Offline typing test' },
      { href: '/', label: 'Free WPM test' },
    ],
  },
  {
    slug: 'alice-in-wonderland',
    title: 'Alice in Wonderland Typing Practice — Classic Passages | Ribbon',
    description:
      'Practise typing with Alice in Wonderland passages. Build rhythm and punctuation accuracy on classic public-domain text. Free typing practice with live WPM.',
    eyebrow: 'Classic literature · Punctuation',
    h1Lead: 'Alice in Wonderland',
    h1Accent: 'Typing Practice',
    lede:
      'Classic prose is excellent typing practice. Dialogue, punctuation and changing sentence length force you to keep rhythm instead of memorising a pattern. Work through public-domain Alice in Wonderland passages at your own pace.',
    sections: [
      {
        h2: 'Why literature makes good typing practice',
        paragraphs: [
          'Repetitive drills build finger placement, but literature builds endurance. Real paragraphs mix short and long sentences, punctuation and dialogue, which is closer to the typing you do outside a test.',
        ],
        list: [
          'Varied sentence length keeps you from falling into a mechanical rhythm.',
          'Dialogue trains quotation marks and commas in context.',
          'Longer passages build stamina for timed tests.',
        ],
      },
      {
        h2: 'How to use the passages',
        steps: [
          'Read one sentence ahead before you start typing it.',
          'Type at a pace you can sustain without stopping.',
          'Finish the passage even if you make a mistake.',
          'Review the words and marks you missed, then repeat once.',
        ],
      },
      {
        h2: 'Getting more from classic text',
        paragraphs: [
          'Do not chase speed on the first run. Use the first pass to learn the punctuation pattern, then run it again with a timer. Repeating the same passage is a legitimate way to measure improvement because the content is held constant.',
        ],
        note: 'Public-domain literature is free to practise and safe to share, which makes it ideal for daily drills.',
      },
    ],
    faq: [
      {
        q: 'Is the Alice in Wonderland text public domain?',
        a: 'Yes. Alice in Wonderland is public domain, which is why it is commonly used for typing practice.',
      },
      {
        q: 'Can I use these passages for a timed test?',
        a: 'Yes. Run the passage in timed mode and track both words per minute and accuracy.',
      },
      {
        q: 'Is literature practice better than random words?',
        a: 'They serve different purposes. Random drills build keys; literature builds rhythm, punctuation accuracy and endurance.',
      },
    ],
    related: [
      { href: '/sherlock-holmes-paragraphs', label: 'Sherlock Holmes paragraphs' },
      { href: '/moby-dick-excerpts', label: 'Moby Dick excerpts' },
      { href: '/typing-practice-for-beginners', label: 'Typing practice for beginners' },
      { href: '/', label: 'Free WPM test' },
    ],
  },
  {
    slug: 'sherlock-holmes-paragraphs',
    title: 'Sherlock Holmes Typing Practice — Paragraph Speed Drills | Ribbon',
    description:
      'Practise typing with Sherlock Holmes paragraphs. Train punctuation accuracy and steady rhythm on classic detective prose. Free with live WPM and accuracy.',
    eyebrow: 'Classic literature · Long sentences',
    h1Lead: 'Sherlock Holmes Typing Practice with',
    h1Accent: 'Long-Form Paragraphs',
    lede:
      'Sherlock Holmes stories are full of long, clause-heavy sentences. That makes them ideal for training punctuation accuracy and the kind of sustained focus a longer typing test demands.',
    sections: [
      {
        h2: 'What these passages train',
        cards: [
          { h3: 'Commas and clauses', p: 'Long sentences depend on accurate comma placement to stay readable.' },
          { h3: 'Semicolons and dashes', p: 'Victorian prose uses punctuation that shorter modern text often skips.' },
          { h3: 'Sustained attention', p: 'Longer paragraphs build the focus needed for multi-minute tests.' },
          { h3: 'Vocabulary rhythm', p: 'Less familiar words force you to read ahead instead of guessing.' },
        ],
      },
      {
        h2: 'A repeatable drill',
        steps: [
          'Run the paragraph once untimed to learn its punctuation.',
          'Run it again timed, keeping errors low.',
          'Note the exact words where your rhythm broke.',
          'Repeat the same paragraph once more to confirm the improvement.',
        ],
      },
      {
        h2: 'Punctuation is the real test',
        paragraphs: [
          'Speed on simple words can hide weak punctuation accuracy. Dense prose exposes it. If you consistently miss commas or quotation marks, slow down until those characters are reliable, then rebuild speed.',
        ],
        note: 'Read ahead by a few words so punctuation does not arrive as a surprise.',
      },
    ],
    faq: [
      {
        q: 'Are the Sherlock Holmes passages public domain?',
        a: 'The original stories are public domain in many countries and are commonly used for typing practice. Check your local rules if you plan to republish them.',
      },
      {
        q: 'Why practise with long paragraphs?',
        a: 'Long paragraphs train endurance and punctuation accuracy, which short word drills cannot replicate.',
      },
      {
        q: 'Can I repeat the same passage?',
        a: 'Yes. Repeating a passage while changing only your speed is a reliable way to measure progress.',
      },
    ],
    related: [
      { href: '/alice-in-wonderland', label: 'Alice in Wonderland practice' },
      { href: '/moby-dick-excerpts', label: 'Moby Dick excerpts' },
      { href: '/typing-practice-for-beginners', label: 'Typing practice for beginners' },
      { href: '/', label: 'Free WPM test' },
    ],
  },
  {
    slug: 'moby-dick-excerpts',
    title: 'Moby Dick Typing Excerpts — Long Paragraph Speed Practice | Ribbon',
    description:
      'Type Moby Dick excerpts to build stamina, punctuation accuracy and steady rhythm. Long classic passages with live WPM and accuracy. Free practice.',
    eyebrow: 'Classic literature · Stamina',
    h1Lead: 'Moby Dick Typing Excerpts for',
    h1Accent: 'Endurance and Rhythm',
    lede:
      'Moby Dick is built from long, rolling sentences. Use the excerpts to train the two things short drills cannot teach: sustained concentration and consistent rhythm across a long passage.',
    sections: [
      {
        h2: 'Why long passages matter',
        paragraphs: [
          'Anyone can hold speed for a sentence. A timed test asks you to hold it for minutes. Long passages expose where your rhythm collapses and give you a chance to practise recovering without stopping.',
        ],
        list: [
          'Builds stamina for multi-minute typing tests.',
          'Trains punctuation in dense, clause-heavy sentences.',
          'Teaches you to keep going after a mistake.',
        ],
      },
      {
        h2: 'How to practise without burning out',
        cards: [
          { h3: 'Split the excerpt', p: 'Do one short section at a time instead of the whole passage.' },
          { h3: 'Keep a steady pace', p: 'A sustainable rhythm beats bursts followed by stalls.' },
          { h3: 'Type through errors', p: 'Do not stop for every mistake; finish the section first.' },
          { h3: 'Review afterwards', p: 'List the words that broke your rhythm and repeat them.' },
        ],
      },
      {
        h2: 'Reading ahead',
        paragraphs: [
          'Long sentences reward readers who look ahead. Keep your eyes a few words in front of your fingers so punctuation and difficult vocabulary do not interrupt the flow.',
        ],
        note: 'If a passage feels exhausting, shorten the section rather than lowering your standards.',
      },
    ],
    faq: [
      {
        q: 'Is Moby Dick public domain?',
        a: 'Yes, Moby Dick is public domain in most countries and is widely used for typing practice.',
      },
      {
        q: 'Are long excerpts suitable for beginners?',
        a: 'Beginners should start with shorter sections and gradually increase length as rhythm improves.',
      },
      {
        q: 'What does a long excerpt train that drills do not?',
        a: 'Endurance, sustained rhythm and the ability to recover from mistakes without stopping.',
      },
    ],
    related: [
      { href: '/alice-in-wonderland', label: 'Alice in Wonderland practice' },
      { href: '/sherlock-holmes-paragraphs', label: 'Sherlock Holmes paragraphs' },
      { href: '/offline-typing-test', label: 'Offline typing test' },
      { href: '/', label: 'Free WPM test' },
    ],
  },
  {
    slug: 'medical-terminology-drills',
    title: 'Medical Terminology Typing Drills — Speed and Accuracy | Ribbon',
    description:
      'Practise typing medical terminology with long terms, suffixes and precise spelling. Build accuracy for clinical, transcription and study work. Free.',
    eyebrow: 'Terminology · Accuracy first',
    h1Lead: 'Medical Terminology Typing Drills for',
    h1Accent: 'Precise Clinical Text',
    lede:
      'Medical terms are long, similar-looking and unforgiving of typos. These drills train the suffixes, capitalization and spelling patterns that clinical, transcription and study work depend on.',
    sections: [
      {
        h2: 'Why medical typing is its own skill',
        cards: [
          { h3: 'Long terms', p: 'Multi-syllable words reward rhythm rather than letter-by-letter hunting.' },
          { h3: 'Similar suffixes', p: '-itis, -osis and -ectomy differ by a few characters.' },
          { h3: 'Capitalization', p: 'Eponyms and abbreviations often carry specific casing.' },
          { h3: 'Consequences of errors', p: 'A wrong letter can change meaning, so accuracy outranks raw speed.' },
        ],
      },
      {
        h2: 'A drill plan',
        steps: [
          'Start with short suffixes and prefixes to build the letter patterns.',
          'Move to full terms and type them slowly enough to spell correctly.',
          'Add abbreviations and eponyms with their intended capitalization.',
          'Finish with short clinical phrases rather than isolated words.',
        ],
      },
      {
        h2: 'Accuracy is the metric that matters',
        paragraphs: [
          'In clinical text, a typo is not cosmetic. Train at a pace where spelling is reliable, then increase speed gradually. When you miss a term, repeat that term several times before moving on.',
        ],
        note: 'This is typing practice, not medical training or advice. Always verify clinical text against an authoritative source.',
      },
    ],
    faq: [
      {
        q: 'Who are medical terminology drills for?',
        a: 'They are useful for students, transcriptionists and anyone who types clinical vocabulary and wants better speed and spelling accuracy.',
      },
      {
        q: 'Should I prioritise speed or accuracy?',
        a: 'Accuracy. In medical text a wrong letter can change meaning, so reliable spelling comes first.',
      },
      {
        q: 'Is this medical advice?',
        a: 'No. It is a typing practice tool only. Always verify clinical information against an authoritative source.',
      },
    ],
    related: [
      { href: '/javascript-syntax-practice', label: 'JavaScript typing practice' },
      { href: '/typing-practice-for-beginners', label: 'Typing practice for beginners' },
      { href: '/ad-free-typing-test', label: 'Ad-free typing test' },
      { href: '/', label: 'Free WPM test' },
    ],
  },
];
