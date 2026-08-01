import { Lesson } from './types';
import { PRACTICE_STORIES } from './stories';
import { HINDI_STORIES } from './stories_hindi';

export const WORD_POOL = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there",
  "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no",
  "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then",
  "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well",
  "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us", "world", "life", "hand", "part", "child",
  "eye", "woman", "place", "work", "week", "case", "point", "government", "company", "number", "group", "problem", "fact", "letter",
  "tree", "road", "story", "window", "desk", "answer", "garden", "river", "coffee", "bridge", "pencil", "silver", "ocean", "guitar",
  "planet", "forest", "yellow", "orange", "purple", "circle", "square", "market", "office", "kitchen", "quiet", "bright", "morning",
  "evening", "summer", "winter", "travel", "journey"
];

export const HINDI_WORD_POOL = [
  "नमस्ते", "धन्यवाद", "कृपया", "पानी", "किताब", "विद्यालय", "सरकार", "कार्यालय",
  "समय", "आज", "कल", "मित्र", "परिवार", "शहर", "गांव", "भारत", "भाषा", "शब्द", "वाक्य", "अभ्यास",
  "कर्मचारी", "अधिकारी", "विभाग", "आवेदन", "प्रमाण", "पत्र", "सूचना", "नियम", "परीक्षा", "उत्तर",
  "प्रश्न", "विद्यार्थी", "अध्यापक", "समाचार", "व्यापार", "स्वास्थ्य", "चिकित्सक", "अस्पताल", "यात्रा"
];

export interface InScriptKey {
  base: string;
  shift: string;
}

export const INSCRIPT_MAP: Record<string, InScriptKey> = {
  'q': { base: 'ौ', shift: 'औ' }, 'w': { base: 'ै', shift: 'ऐ' }, 'e': { base: 'ा', shift: 'आ' },
  'r': { base: 'ी', shift: 'ई' }, 't': { base: 'ू', shift: 'ऊ' }, 'y': { base: 'ब', shift: 'भ' },
  'u': { base: 'ह', shift: 'ङ' }, 'i': { base: 'ग', shift: 'घ' }, 'o': { base: 'द', shift: 'ध' },
  'p': { base: 'ज', shift: 'झ' },
  'a': { base: 'ो', shift: 'ओ' }, 's': { base: 'े', shift: 'ए' }, 'd': { base: '्', shift: 'अ' },
  'f': { base: 'ि', shift: 'इ' }, 'g': { base: 'ु', shift: 'उ' }, 'h': { base: 'प', shift: 'फ' },
  'j': { base: 'र', shift: 'ऱ' }, 'k': { base: 'क', shift: 'ख' }, 'l': { base: 'त', shift: 'थ' },
  'z': { base: 'ं', shift: 'ँ' }, 'x': { base: 'म', shift: 'ण' }, 'c': { base: 'न', shift: 'ऩ' },
  'v': { base: 'व', shift: 'ॐ' }, 'b': { base: 'ल', shift: 'ळ' }, 'n': { base: 'स', shift: 'श' },
  'm': { base: ',', shift: 'ष' },
  ';': { base: 'च', shift: 'छ' },
  "'": { base: 'ट', shift: 'ठ' },
  '[': { base: 'ड', shift: 'ढ' },
  ']': { base: 'ृ', shift: 'ऋ' },
  '/': { base: 'य', shift: 'य़' },
  ',': { base: ',', shift: 'ष' },
  '.': { base: '।', shift: '।' }
};

export const EXAM_PASSAGES = [
  "Government offices across the country are increasingly moving their record-keeping systems online. This shift has made it necessary for employees to develop strong typing skills, since most official communication now happens through computers rather than handwritten notes. Typing speed and accuracy have therefore become an important part of recruitment examinations for clerical and administrative posts. Candidates are expected to type a given passage within a fixed time limit while maintaining a high level of accuracy. Practice is the only reliable way to build both speed and confidence for such examinations.",
  "Financial institutions rely heavily on accurate data entry to maintain their records. A single mistyped figure in a ledger or a report can lead to significant errors down the line, which is why accuracy is often weighted as heavily as speed during recruitment tests. Employees preparing for such examinations are advised to practice regularly, focusing not only on how fast they can type but also on reducing careless mistakes. Over time, consistent practice builds muscle memory, allowing the fingers to move correctly without conscious effort, which is the real goal of any typing examination.",
  "Effective communication in any office depends on clarity, patience, and attention to detail. Whether drafting a letter, filing a report, or maintaining a spreadsheet, the person responsible must ensure that the information is correct and presented in an organised manner. Many recruitment boards conduct typing tests as a screening step before the main examination, since basic computer proficiency is now considered essential for almost every administrative role. Preparing well in advance, rather than practicing only in the final days, gives a candidate a much better chance of clearing the required speed and accuracy benchmarks."
];

export const FINGER_MAP: Record<string, string> = {
  'q': 'L-pinky', 'a': 'L-pinky', 'z': 'L-pinky',
  'w': 'L-ring', 's': 'L-ring', 'x': 'L-ring',
  'e': 'L-middle', 'd': 'L-middle', 'c': 'L-middle',
  'r': 'L-index', 'f': 'L-index', 'v': 'L-index', 't': 'L-index', 'g': 'L-index', 'b': 'L-index',
  'y': 'R-index', 'h': 'R-index', 'n': 'R-index', 'u': 'R-index', 'j': 'R-index', 'm': 'R-index',
  'i': 'R-middle', 'k': 'R-middle',
  'o': 'R-ring', 'l': 'R-ring',
  'p': 'R-pinky',
  ' ': 'Thumb'
};

export const FINGER_LABELS = [
  'L-pinky', 'L-ring', 'L-middle', 'L-index', 'Thumb', 'R-index', 'R-middle', 'R-ring', 'R-pinky'
];

const ENGLISH_LESSONS: Lesson[] = [
  { 
    id: 0, 
    name: "Lesson 0: Home Row Drills (Beginner)", 
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], 
    desc: "Pure home row drills for complete beginners.", 
    category: "Touch Typing Basics",
    customText: "a a a a a s s s s s d d d d d f f f f f j j j j j k k k k k l l l l l ; ; ; ; ; asdf jkl; asdf jkl; a s d f j k l ; asdf jkl; a s d f j k l ; asdf jkl; asdf jkl; a s d f j k l ; asdf jkl; a s d f j k l ; asdf jkl; asdf jkl; a s d f j k l ; asdf jkl; a s d f j k l ; asdf jkl; asdf jkl; a s d f j k l ; asdf jkl; a s d f j k l ; asdf jkl; asdf jkl; a s d f j k l ; asdf jkl;"
  },
  { 
    id: 1, 
    name: "Lesson 1: Home Row Combinations", 
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], 
    desc: "Combined key drills using the home row keys.", 
    category: "Touch Typing Basics",
    customText: "as as df df jk jk l; l; asdf jkl; asdf jkl; as df jk l; asdf jkl; as df jk l; as as df df jk jk l; l; asdf jkl; asdf jkl; as df jk l; asdf jkl; as df jk l; as as df df jk jk l; l; asdf jkl; asdf jkl; as df jk l; asdf jkl; as df jk l; as as df df jk jk l; l; asdf jkl; asdf jkl; as df jk l; asdf jkl;"
  },
  { 
    id: 2, 
    name: "Lesson 2: Top Row Mastery", 
    keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], 
    desc: "Top row letter combinations and short words.", 
    category: "Touch Typing Basics",
    customText: "q w e r t y u i o p q w e r t y u i o p type quite your power quiet write route toy pet proper layout pure out put outer tree root priority query report toy try wire tie q w e r t y u i o p q w e r t y u i o p type quite your power quiet write route toy pet proper"
  },
  { 
    id: 3, 
    name: "Lesson 3: Bottom Row & Numbers", 
    keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 
    desc: "Bottom row keys mixed with standard numbers.", 
    category: "Touch Typing Basics",
    customText: "z x c v b n m 1 2 3 4 5 6 7 8 9 0 zebra box cave voice bun net map zero next move exam exact citizen zone zoom carbon dynamic direct index 1092 2026 500 75 100 z x c v b n m 1 2 3 4 5 6 7 8 9 0 zebra box cave voice bun net map zero next move exam exact citizen zone"
  },
  { 
    id: 4, 
    name: "Lesson 4: Shift Key & Punctuation", 
    keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ':', '?', '"'], 
    desc: "Repetitive practice with Shift and common punctuations.", 
    category: "Touch Typing Basics",
    customText: "A S D F J K L : A S D F J K L : Ask Dad For Jam; Ask Dad For Jam; Dad said: \"Keep practicing!\" Dad said: \"Keep practicing!\" Ask Dad For Jam; Dad said: \"Keep practicing!\" A S D F J K L : Ask Dad For Jam; Dad said: \"Keep practicing!\" Ask Dad For Jam; Dad said: \"Keep practicing!\""
  },
  ...PRACTICE_STORIES.map((story) => {
    const lessonId = story.id >= 100 ? story.id : story.id + 300;
    const cleanText = story.text.replace(/[*_]{3,}/g, '').replace(/[*_]+/g, '').trim();
    return {
      id: lessonId,
      name: `Story ${story.id}: ${story.title}`,
      keys: null,
      desc: `By ${story.author} (${story.wordCount} words)`,
      category: "Practice Stories",
      customText: cleanText
    };
  }),
  {
    id: 200,
    name: "Clerical Exam: Passage 1 (Administrative)",
    keys: null,
    desc: "Standard official communication passage format. Backspace disabled.",
    category: "Clerical Civil Exams",
    customText: EXAM_PASSAGES[0]
  },
  {
    id: 201,
    name: "Clerical Exam: Passage 2 (Financial)",
    keys: null,
    desc: "Accurate ledger entry format. Backspace disabled.",
    category: "Clerical Civil Exams",
    customText: EXAM_PASSAGES[1]
  },
  {
    id: 202,
    name: "Clerical Exam: Passage 3 (Administrative)",
    keys: null,
    desc: "Clerical screening test passage format. Backspace disabled.",
    category: "Clerical Civil Exams",
    customText: EXAM_PASSAGES[2]
  }
];

const HINDI_LESSONS: Lesson[] = [
  {
    id: 500,
    name: "Hindi Stage 1: Home Row Drills",
    keys: null,
    desc: "होम रो के बुनियादी अक्षरों का अभ्यास।",
    category: "Touch Typing Basics (Hindi)",
    customText: "र क त च ट र क त च ट प र क त च ट प र क त च ट र क त च ट र क त च ट प र क त च ट प र क त च ट"
  },
  {
    id: 501,
    name: "Hindi Stage 2: Home Row Combinations",
    keys: null,
    desc: "होम रो के अक्षरों को मिलाकर शब्द बनाना।",
    category: "Touch Typing Basics (Hindi)",
    customText: "कर तर पर चर टर कर तर पर चर टर कार तार पार चार टार कर तर पर चर टर कार तार पार चार टार"
  },
  {
    id: 502,
    name: "Hindi Stage 3: Top Row Mastery",
    keys: null,
    desc: "ऊपरी पंक्ति के अक्षरों का अभ्यास।",
    category: "Touch Typing Basics (Hindi)",
    customText: "ौ ै ा ी ू ब ह ग द ज ड ढ ौ ै ा ी ू ब ह ग द ज ड ढ ब ह ग द ज ड ढ ब ह ग द ज ड ढ"
  },
  {
    id: 503,
    name: "Hindi Stage 4: Bottom Row Mastery",
    keys: null,
    desc: "निचली पंक्ति के अक्षरों का अभ्यास।",
    category: "Touch Typing Basics (Hindi)",
    customText: "ं म न व ल स ं म न व ल स म न व ल स म न व ल स म न व ल स म न व ल स म न व ल स"
  },
  {
    id: 504,
    name: "Hindi Stage 5: Shift Key & Matras",
    keys: null,
    desc: "शिफ्ट की तथा अन्य मात्राओं का अभ्यास।",
    category: "Touch Typing Basics (Hindi)",
    customText: "औ ऐ आ ई ऊ भ ङ घ ध झ औ ऐ आ ई ऊ भ ङ घ ध झ भ ङ घ ध झ भ ङ घ ध झ"
  },
  {
    id: 600,
    name: "Story 1: कछुआ और खरगोश",
    keys: null,
    desc: "पंचतंत्र की प्रसिद्ध कहानी (120 शब्द)",
    category: "Practice Stories (Hindi)",
    customText: "एक वन में एक खरगोश और एक कछुआ रहते थे। खरगोश को अपनी तेज गति पर बहुत घमंड था। वह कछुए की धीमी चाल का मजाक उड़ाता था। एक दिन कछुए ने खरगोश को दौड़ लगाने की चुनौती दी। खरगोश ने हंसते हुए चुनौती स्वीकार कर ली। दौड़ शुरू हुई। खरगोश तेजी से भागा और कछुए से बहुत आगे निकल गया। उसने सोचा कि कछुआ तो बहुत धीमा है, क्यों न थोड़ा आराम कर लिया जाए। वह एक पेड़ की छांव में सो गया। दूसरी ओर, कछुआ बिना रुके लगातार चलता रहा। जब खरगोश की नींद खुली, तब तक कछुआ जीत की रेखा पार कर चुका था। इस तरह कछुआ दौड़ जीत गया। सीख: निरंतर प्रयास करने वाला हमेशा सफल होता है।"
  },
  {
    id: 601,
    name: "Story 2: शेर और चूहा",
    keys: null,
    desc: "मित्रता और दया की कहानी (135 शब्द)",
    category: "Practice Stories (Hindi)",
    customText: "एक समय की बात है, एक शेर जंगल में सो रहा था। एक छोटा चूहा उसके शरीर पर खेलने लगा, जिससे शेर की नींद टूट गई। शेर ने गुस्से में चूहे को अपने पंजे में पकड़ लिया और उसे मारने ही वाला था। चूहे ने विनती की, 'कृपया मुझे छोड़ दें, मैं किसी दिन आपकी मदद करूंगा।' शेर चूहे की बात सुनकर हँसा लेकिन उसने उसे छोड़ दिया। कुछ दिनों बाद, शेर शिकारियों के जाल में फंस गया। वह जोर-जोर से दहाड़ने लगा। चूहे ने शेर की दहाड़ सुनी और वहां पहुंचा। उसने अपने नुकीले दांतों से जाल को काटना शुरू किया और जल्द ही शेर को आजाद कर दिया। शेर ने चूहे को धन्यवाद दिया और वे मित्र बन गए। सीख: कोई भी प्राणी छोटा या कमजोर नहीं होता, हर किसी का अपना महत्व होता है।"
  },
  {
    id: 602,
    name: "Story 3: प्यासा कौआ",
    keys: null,
    desc: "बुद्धिमानी और सूझबूझ की कहानी (105 शब्द)",
    category: "Practice Stories (Hindi)",
    customText: "गर्मियों के एक दिन, एक कौआ बहुत प्यासा था। वह पानी की तलाश में इधर-उधर उड़ रहा था, लेकिन उसे कहीं पानी नहीं मिला। अंत में, वह एक बगीचे में पहुंचा जहां उसे एक घड़ा दिखाई दिया। घड़े में बहुत कम पानी था और कौवे की चोंच वहां तक नहीं पहुंच पा रही थी। उसने एक उपाय सोचा। उसने आसपास पड़े छोटे-छोटे कंकड़ उठाए और एक-एक करके घड़े में डालने लगा। जैसे-जैसे कंकड़ घड़े में गिरते गए, पानी का स्तर ऊपर उठता गया। जल्द ही पानी घड़े के मुंह तक आ गया। कौवे ने भरपेट पानी पिया और खुशी-खुशी उड़ गया। सीख: जहां चाह, वहां राह।"
  },
  {
    id: 603,
    name: "Story 4: एकता में बल",
    keys: null,
    desc: "एकता की शक्ति दर्शाती कहानी (120 शब्द)",
    category: "Practice Stories (Hindi)",
    customText: "एक किसान के चार बेटे थे जो हमेशा आपस में लड़ते रहते थे। किसान बहुत चिंतित रहता था। उसने उन्हें एकता का पाठ सिखाने का फैसला किया। उसने अपने बेटों को लकड़ियों का एक गट्ठर लाने को कहा। उसने प्रत्येक बेटे को उस गट्ठर को तोड़ने के लिए कहा। चारों में से कोई भी उसे नहीं तोड़ सका। फिर किसान ने गट्ठर को खोला और एक-एक लकड़ी अपने बेटों को दी। उन्होंने आसानी से उन लकड़ियों को तोड़ दिया। किसान ने कहा, 'देखा बच्चों! अगर तुम एक साथ रहोगे तो कोई तुम्हें नुकसान नहीं पहुंचा पाएगा। लेकिन अगर तुम अलग रहोगे तो आसानी से टूट जाओगे। सीख: एकता में ही वास्तविक शक्ति है।"
  },
  {
    id: 604,
    name: "Story 5: लालची कुत्ता",
    keys: null,
    desc: "संतोष का महत्व बताने वाली कहानी (110 शब्द)",
    category: "Practice Stories (Hindi)",
    customText: "एक कुत्ता मुंह में हड्डी का टुकड़ा दबाकर नदी के पुल से गुजर रहा था। नदी के साफ पानी में उसने अपनी ही परछाई देखी। उसने सोचा कि पानी में दूसरा कुत्ता है जिसके पास उससे भी बड़ा हड्डी का टुकड़ा है। उसने उस टुकड़े को भी पाने का लालच किया। जैसे ही उसने भौंकने के लिए अपना मुंह खोला, उसके मुंह का टुकड़ा पानी में गिर गया और बह गया। लालच के कारण उसने अपना भोजन भी खो दिया और भूखा रह गया। सीख: लालच का फल हमेशा बुरा होता है और जो कुछ हमारे पास है, हमें उसी में संतोष करना चाहिए।"
  },
  ...HINDI_STORIES.map(story => ({
    id: story.id,
    name: `Story ${story.id - 599}: ${story.title}`,
    keys: null,
    desc: `${story.author} (${story.wordCount} शब्द)`,
    category: "Practice Stories (Hindi)",
    customText: story.text
  })),
  {
    id: 700,
    name: "Hindi Clerical Exam: Passage 1 (Administrative)",
    keys: null,
    desc: "सरकारी कार्यालयों में कंप्यूटर और डिजिटल कार्यशैली। बैकस्पेस वर्जित।",
    category: "Clerical Civil Exams (Hindi)",
    customText: "भारत सरकार के विभिन्न मंत्रालयों और विभागों में कंप्यूटर का उपयोग दिन-प्रतिदिन बढ़ता जा रहा है। प्रशासनिक कार्यों में गति और पारदर्शिता लाने के लिए डिजिटल इंडिया अभियान के अंतर्गत सभी कार्यालयों के रिकॉर्ड ऑनलाइन किए जा रहे हैं। इसी कारण सरकारी नौकरियों में लिपिकीय और प्रशासनिक पदों के लिए हिंदी टंकण अर्थात टाइपिंग कौशल परीक्षा को अनिवार्य कर दिया गया है। सरकारी परीक्षाओं में अभ्यर्थियों से अपेक्षा की जाती है कि वे निर्धारित समय सीमा में कम से कम तीस शब्द प्रति मिनट की गति से सही टाइपिंग कर सकें। नियमित अभ्यास ही परीक्षा में सफलता प्राप्त करने का एकमात्र मार्ग है।"
  },
  {
    id: 701,
    name: "Hindi Clerical Exam: Passage 2 (Financial)",
    keys: null,
    desc: "वित्तीय एवं बैंकिंग क्षेत्र में टाइपिंग शुद्धता का महत्व। बैकस्पेस वर्जित।",
    category: "Clerical Civil Exams (Hindi)",
    customText: "वित्तीय संस्थानों और बैंकों में डेटा प्रविष्टि की शुद्धता अत्यंत महत्वपूर्ण होती है। बही-खातों या वित्तीय रिपोर्टों में एक छोटी सी त्रुटि भी भविष्य में बड़े नुकसान का कारण बन सकती है। यही कारण है कि भर्ती परीक्षाओं में गति के साथ-साथ शुद्धता को भी समान महत्व दिया जाता है। टाइपिंग परीक्षा की तैयारी करने वाले उम्मीदवारों को सलाह दी जाती है कि वे प्रतिदिन कम से कम एक घंटा एकाग्रता के साथ अभ्यास करें। उंगलियों की सही स्थिति और निरंतर अभ्यास से मांसपेशी स्मृति विकसित होती है, जो बिना देखे सटीक टाइपिंग में सहायक होती है।"
  }
];

export const LESSONS: Lesson[] = [
  ...ENGLISH_LESSONS,
  ...HINDI_LESSONS
];

export const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"]
];
