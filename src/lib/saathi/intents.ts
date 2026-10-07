/**
 * Deterministic intent + slot extraction for Hindi, English, Hinglish and common
 * words in the other pilot languages. Pure functions — unit tested.
 */
import { matchTown } from "@/lib/geo/towns";
import type { HoursBand, JobCategory, JobType, SkillKey } from "@/lib/taxonomy";

export type Intent =
  | "greet"
  | "job"
  | "nearby"
  | "learn"
  | "no_phone"
  | "options"
  | "parchi"
  | "salary"
  | "skill_req"
  | "discover"
  | "report"
  | "help"
  | "thanks"
  | "experience"
  | "unknown";

const norm = (s: string) => s.toLowerCase().normalize("NFC").replace(/[।?!.,]/g, " ").replace(/\s+/g, " ").trim();
const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

const W = {
  greet: ["namaste", "namaskar", "hello", "hii", "hey", "नमस्ते", "नमस्कार", "राम राम", "सत श्री अकाल", "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", "নমস্কার", "வணக்கம்", "నమస్తే", "ನಮಸ್ಕಾರ", "નમસ્તે", "good morning"],
  thanks: ["thank", "dhanyavad", "shukriya", "धन्यवाद", "शुक्रिया", "धन्यवाद", "ধন্যবাদ", "நன்றி", "ధన్యవాదాలు", "ಧನ್ಯವಾದ", "આભાર", "ਧੰਨਵਾਦ"],
  job: ["नौकरी", "naukri", "naukari", "job", "काम चाहिए", "kaam chahiye", "काम ढूंढ", "काम ढूँढ", "रोज़गार", "रोजगार", "work", "employment", "vacanc", "वैकेंसी", "नोकरी", "চাকরি", "কাজ চাই", "வேலை", "ఉద్యోగం", "పని కావాలి", "ಉದ್ಯೋಗ", "ಕೆಲಸ ಬೇಕು", "નોકરી", "કામ જોઈએ", "ਨੌਕਰੀ", "ਕੰਮ ਚਾਹੀਦਾ"],
  nearby: ["आसपास", "आस-पास", "आस पास", "aaspaas", "aas paas", "nearby", "near me", "पास में", "पास के", "around me", "जवळ", "কাছে", "அருகில்", "దగ్గర", "ಹತ್ತಿರ", "નજીક", "ਨੇੜੇ"],
  learn: ["सीख", "sikh", "seekh", "learn", "training", "ट्रेनिंग", "प्रशिक्षण", "कोर्स", "course", "शिकायचे", "শিখ", "கற்", "నేర్చు", "ಕಲಿ", "શીખ", "ਸਿੱਖ"],
  no_phone: ["मोबाइल नहीं", "फ़ोन नहीं", "फोन नहीं", "smartphone नहीं", "no phone", "no mobile", "don't have a phone", "dont have a phone", "mobile nahi", "phone nahi", "without phone", "स्मार्टफोन नहीं"],
  options: ["विकल्प", "options", "कौन-कौन से काम", "कौन कौन से काम", "kaun kaun", "क्या काम कर सकत", "what work can i", "what can i do", "choices", "पर्याय", "বিকল্প", "விருப்ப", "ఎంపిక", "ಆಯ್ಕೆ", "વિકલ્પ", "ਵਿਕਲਪ"],
  parchi: ["पर्ची", "parchi", "parchee", "slip", "print", "प्रिंट", "card निकाल", "पावती", "পর্চি", "சீட்டு", "చీటీ", "ಚೀಟಿ", "પરચી", "ਪਰਚੀ"],
  salary: ["salary", "सैलरी", "वेतन", "तनख्वाह", "तनख़्वाह", "पगार", "kitna paisa", "कितने पैसे", "कितना पैसा", "pay", "kitni salary", "how much", "wage", "मज़दूरी", "बेतन", "বেতন", "சம்பளம்", "జీతం", "ಸಂಬಳ", "પગાર", "ਤਨਖਾਹ"],
  skill_req: ["skill चाहिए", "क्या skill", "कौन सी skill", "कौन-सी skill", "क्या आना चाहिए", "requirement", "skills needed", "what skill", "which skill", "क्या चाहिए इस", "योग्यता"],
  discover: ["मेरी skill", "मेरी skills", "skills खोज", "क्या आता है मुझे", "discover", "my skills", "what am i good", "क्षमता", "हुनर"],
  report: ["fake", "फ़र्ज़ी", "फर्जी", "धोखा", "report", "शिकायत", "fraud", "scam", "पैसे माँग", "पैसे मांग", "asked money", "asking money"],
  help: ["help", "मदद", "सहायता", "क्या कर सकते", "what can you do", "kya kar sakte"],
  experience: ["अनुभव", "experience", "आता है", "आती है", "aata hai", "aati hai", "जानता", "जानती", "कर सकता", "कर सकती", "i know", "i can", "मला येते", "জানি", "தெரியும்", "వచ్చు", "ಬರುತ್ತ", "આવડે", "ਆਉਂਦਾ", "ਆਉਂਦੀ"],
};

/** Work words → (skill, category). Order matters: more specific first. */
const WORK: { words: string[]; skill: SkillKey; category: JobCategory }[] = [
  { words: ["सिलाई", "silai", "sewing", "tailor", "stitch", "दर्जी", "darzi", "कढ़ाई", "शिवण", "সেলাই", "தையல்", "కుట్టు", "ಹೊಲಿಗೆ", "સિલાઈ", "ਸਿਲਾਈ"], skill: "sewing", category: "tailoring_assistant" },
  { words: ["रसोइया", "cook ", "chef", "बावर्ची"], skill: "cooking", category: "cook" },
  { words: ["खाना", "khana", "cooking", "cook", "रसोई", "kitchen", "किचन", "स्वयंपाक", "রান্না", "சமையல்", "వంట", "ಅಡುಗೆ", "રસોઈ", "ਖਾਣਾ"], skill: "cooking", category: "kitchen_helper" },
  { words: ["नर्सरी", "nursery", "पौध", "plant", "बागवानी", "garden", "माली"], skill: "plant_care", category: "nursery_worker" },
  { words: ["खेती", "kheti", "farm", "खेत", "शेती", "চাষ", "விவசாய", "వ్యవసాయ", "ಕೃಷಿ", "ખેતી", "ਖੇਤੀ"], skill: "gardening", category: "farm_worker" },
  { words: ["मरम्मत", "repair", "मिस्त्री", "mistri", "mechanic", "ठीक कर", "बिजली", "electric", "दुरुस्ती"], skill: "repair", category: "repair_helper" },
  { words: ["औज़ार", "औजार", "tools", "tool"], skill: "tools", category: "repair_helper" },
  { words: ["सफ़ाई", "सफाई", "safai", "clean", "झाड़ू", "housekeeping", "हाउसकीपिंग", "स्वच्छता"], skill: "cleaning", category: "housekeeping" },
  { words: ["पैकिंग", "packing", "pack", "पैक", "sorting", "छँटाई"], skill: "packing", category: "packing_helper" },
  { words: ["बेच", "sales", "selling", "दुकान", "shop", "ग्राहक", "customer"], skill: "sales", category: "sales_assistant" },
  { words: ["देखभाल", "care", "बुज़ुर्ग", "बुजुर्ग", "elder", "मरीज़", "nurse"], skill: "caregiving", category: "caregiver" },
  { words: ["कला", "craft", "art", "हस्तकला", "painting", "पेंटिंग"], skill: "craft", category: "craft_artisan" },
  { words: ["computer", "कंप्यूटर", "कम्प्यूटर", "typing", "टाइपिंग", "data entry", "डेटा"], skill: "digital_basics", category: "data_entry" },
];

export function detectWork(text: string): { skill: SkillKey; category: JobCategory } | undefined {
  const t = ` ${norm(text)} `;
  const hit = WORK.find((w) => has(t, w.words));
  return hit ? { skill: hit.skill, category: hit.category } : undefined;
}

export function detectTown(text: string) {
  return matchTown(norm(text));
}

export function detectDistance(text: string): number | undefined {
  const t = norm(text);
  const m = t.match(/(\d{1,3})\s*(km|किमी|किलोमीटर|kilometer|किलो मीटर)?/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 300) return n;
  }
  if (has(t, ["पास", "near", "walking", "पैदल", "थोड़ा", "little"])) return 5;
  if (has(t, ["दूर", "far", "anywhere", "कहीं भी", "कोई भी"])) return 100;
  return undefined;
}

export function detectJobType(text: string): JobType | undefined {
  const t = norm(text);
  if (has(t, ["part", "पार्ट", "आधा", "कुछ घंटे", "few hours", "half"])) return "part_time";
  if (has(t, ["full", "फुल", "फ़ुल", "पूरा दिन", "पूरे दिन", "whole day"])) return "full_time";
  return undefined;
}

export function detectHours(text: string): HoursBand | undefined {
  const t = norm(text);
  if (has(t, ["सुबह", "morning", "subah", "सकाळ"])) return "morning";
  if (has(t, ["शाम", "evening", "shaam", "रात", "night", "संध्याकाळ"])) return "evening";
  if (has(t, ["कभी भी", "flexible", "कोई भी समय", "any time", "anytime"])) return "flexible";
  if (has(t, ["दिन", "day", "दोपहर", "din"])) return "day";
  return undefined;
}

export function detectYesNo(text: string): "yes" | "no" | undefined {
  const t = ` ${norm(text)} `;
  if (has(t, ["नहीं", " nahi", "नही", " no ", "never", "नाही", "fresher", "पहली बार"])) return "no";
  if (has(t, ["हाँ", "हां", "haan", " han ", "yes", " जी ", "हाँजी", "किया है", "साल", "year", "अनुभव है"])) return "yes";
  return undefined;
}

/** Primary intent, by priority. Multiple may apply; the first match wins. */
export function detectIntent(text: string): Intent {
  const t = norm(text);
  if (has(t, W.report)) return "report";
  if (has(t, W.no_phone)) return "no_phone";
  if (has(t, W.parchi)) return "parchi";
  if (has(t, W.salary)) return "salary";
  if (has(t, W.skill_req)) return "skill_req";
  if (has(t, W.nearby)) return "nearby";
  if (has(t, W.options)) return "options";
  if (has(t, W.learn)) return "learn";
  if (has(t, W.job)) return "job";
  if (has(t, W.discover)) return "discover";
  if (has(t, W.experience) && detectWork(t)) return "experience";
  if (has(t, W.thanks)) return "thanks";
  if (has(t, W.help)) return "help";
  if (has(t, W.greet)) return "greet";
  return "unknown";
}
