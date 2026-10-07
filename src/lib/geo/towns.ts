import type { L10n } from "@/lib/i18n/config";

/**
 * Pilot geography (Shekhawati region, Rajasthan + nearby). Location search is
 * town-based for now; live GPS snaps to the nearest pilot town.
 */
export type Town = { id: string; name: L10n; district: string; lat: number; lng: number };

export const TOWNS: Town[] = [
  { id: "pilani", name: { en: "Pilani", hi: "पिलानी", mr: "पिलानी", gu: "પિલાની", pa: "ਪਿਲਾਨੀ", bn: "পিলানি", ta: "பிலானி", te: "పిలానీ", kn: "ಪಿಲಾನಿ" }, district: "Jhunjhunu", lat: 28.3670, lng: 75.6040 },
  { id: "chirawa", name: { en: "Chirawa", hi: "चिड़ावा", mr: "चिडावा", gu: "ચિડાવા", pa: "ਚਿੜਾਵਾ", bn: "চিড়াওয়া", ta: "சிராவா", te: "చిరావా", kn: "ಚಿರಾವಾ" }, district: "Jhunjhunu", lat: 28.2400, lng: 75.6500 },
  { id: "jhunjhunu", name: { en: "Jhunjhunu", hi: "झुंझुनूं", mr: "झुंझुनू", gu: "ઝુંઝુનુ", pa: "ਝੁੰਝੁਨੂ", bn: "ঝুনঝুনু", ta: "ஜுன்ஜுனு", te: "ఝుంఝును", kn: "ಝುಂಝುನು" }, district: "Jhunjhunu", lat: 28.1290, lng: 75.3990 },
  { id: "surajgarh", name: { en: "Surajgarh", hi: "सूरजगढ़", mr: "सूरजगड", gu: "સૂરજગઢ", pa: "ਸੂਰਜਗੜ੍ਹ", bn: "সুরজগড়", ta: "சூரஜ்கர்", te: "సూరజ్‌గఢ్", kn: "ಸೂರಜ್‌ಗಢ" }, district: "Jhunjhunu", lat: 28.3100, lng: 75.7400 },
  { id: "loharu", name: { en: "Loharu", hi: "लोहारू", mr: "लोहारू", gu: "લોહારુ", pa: "ਲੋਹਾਰੂ", bn: "লোহারু", ta: "லோஹாரு", te: "లోహారు", kn: "ಲೋಹಾರು" }, district: "Bhiwani", lat: 28.4300, lng: 75.8100 },
  { id: "sikar", name: { en: "Sikar", hi: "सीकर", mr: "सीकर", gu: "સીકર", pa: "ਸੀਕਰ", bn: "সীকর", ta: "சீகர்", te: "సీకర్", kn: "ಸೀಕರ್" }, district: "Sikar", lat: 27.6094, lng: 75.1399 },
  { id: "jaipur", name: { en: "Jaipur", hi: "जयपुर", mr: "जयपूर", gu: "જયપુર", pa: "ਜੈਪੁਰ", bn: "জয়পুর", ta: "ஜெய்ப்பூர்", te: "జైపూర్", kn: "ಜೈಪುರ" }, district: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { id: "hisar", name: { en: "Hisar", hi: "हिसार", mr: "हिसार", gu: "હિસાર", pa: "ਹਿਸਾਰ", bn: "হিসার", ta: "ஹிசார்", te: "హిసార్", kn: "ಹಿಸಾರ್" }, district: "Hisar", lat: 29.1492, lng: 75.7217 },
];

export function townById(id: string | undefined | null) {
  return TOWNS.find((t) => t.id === id);
}

/** Great-circle distance in km. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function nearestTown(p: { lat: number; lng: number }) {
  return TOWNS.reduce((best, t) => (haversineKm(p, t) < haversineKm(p, best) ? t : best), TOWNS[0]);
}

/** Fuzzy match a spoken/typed place name to a town id (any script). */
export function matchTown(text: string): Town | undefined {
  const q = text.toLowerCase();
  return TOWNS.find((t) => Object.values(t.name).some((n) => n && q.includes(n.toLowerCase())) || q.includes(t.id));
}
