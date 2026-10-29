/**
 * Desktop demo chrome in the planned editions (D.2.5.11: English, Hindi).
 * DRAFT translations — final copy needs review before publication (DEC 13).
 */
export type Lang = "en" | "hi";

export const LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिन्दी" },
];

type Strings = {
  menus: string[];
  ask: string;
  suggestions: string;
  topHit: string;
  local: string;
  clarify: string;
  unsupported: string;
  refused: string;
  negated: string;
  demo: string;
  control: string;
  opened: (what: string) => string;
  closed: (what: string) => string;
  minimized: (what: string) => string;
  arranged: string;
  verified: string;
  examples: string[];
};

export const STRINGS: Record<Lang, Strings> = {
  en: {
    menus: ["Workspace", "Apps", "Window", "Help"],
    ask: "Ask AFVAR or type a command",
    suggestions: "Try",
    topHit: "Top Hit",
    local: "Resolved on this device · no AI model used",
    clarify: "Which one do you mean?",
    unsupported: "That isn't supported in this demo.",
    refused: "AFVAR never places, modifies or closes orders.",
    negated: "Nothing was done — the request says not to.",
    demo: "Demo playing · click or type to take over",
    control: "You're in control",
    opened: (w) => `Opened ${w}`,
    closed: (w) => `Closed ${w}`,
    minimized: (w) => `Minimized ${w}`,
    arranged: "Windows arranged",
    verified: "verified",
    examples: ["Open my Gold chart 1D", "Show this week's economic events", "Open the trade journal", "Open the dollar chart", "Arrange my windows"],
  },
  hi: {
    menus: ["वर्कस्पेस", "ऐप्स", "विंडो", "मदद"],
    ask: "AFVAR से पूछें या कमांड लिखें",
    suggestions: "आज़माएँ",
    topHit: "सबसे सही",
    local: "इसी डिवाइस पर समझा गया · कोई AI मॉडल नहीं",
    clarify: "आपका मतलब कौन-सा है?",
    unsupported: "यह इस डेमो में उपलब्ध नहीं है।",
    refused: "AFVAR कभी ऑर्डर नहीं लगाता, बदलता या बंद करता।",
    negated: "कुछ नहीं किया गया — अनुरोध में मना है।",
    demo: "डेमो चल रहा है · खुद चलाने के लिए क्लिक करें",
    control: "अब नियंत्रण आपके हाथ में",
    opened: (w) => `${w} खोला गया`,
    closed: (w) => `${w} बंद किया गया`,
    minimized: (w) => `${w} छोटा किया गया`,
    arranged: "विंडो सजा दी गईं",
    verified: "सत्यापित",
    examples: ["सोना का चार्ट 1D खोलो", "इस हफ़्ते का कैलेंडर दिखाओ", "जर्नल खोलो", "डॉलर चार्ट खोलो", "विंडो सजाओ"],
  },
};
