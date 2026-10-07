import type { Metadata, Viewport } from "next";
import {
  Hanken_Grotesk, Instrument_Serif, JetBrains_Mono, Noto_Sans_Bengali, Noto_Sans_Devanagari, Noto_Sans_Gujarati,
  Noto_Sans_Gurmukhi, Noto_Sans_Kannada, Noto_Sans_Tamil, Noto_Sans_Telugu, Noto_Serif_Devanagari,
} from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getTranslator } from "@/lib/i18n/server";
import { Providers } from "@/components/shell/Providers";

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", preload: false });
const deva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-noto-deva", display: "swap", preload: false });
const devaSerif = Noto_Serif_Devanagari({ subsets: ["devanagari"], variable: "--font-noto-serif-deva", display: "swap", preload: false });
const beng = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-noto-beng", display: "swap", preload: false });
const taml = Noto_Sans_Tamil({ subsets: ["tamil"], variable: "--font-noto-taml", display: "swap", preload: false });
const telu = Noto_Sans_Telugu({ subsets: ["telugu"], variable: "--font-noto-telu", display: "swap", preload: false });
const knda = Noto_Sans_Kannada({ subsets: ["kannada"], variable: "--font-noto-knda", display: "swap", preload: false });
const gujr = Noto_Sans_Gujarati({ subsets: ["gujarati"], variable: "--font-noto-gujr", display: "swap", preload: false });
const guru = Noto_Sans_Gurmukhi({ subsets: ["gurmukhi"], variable: "--font-noto-guru", display: "swap", preload: false });

const fontVars = [hanken, instrument, mono, deva, devaSerif, beng, taml, telu, knda, gujr, guru].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  title: { default: "KAABIL — Turning Ability into Opportunity", template: "%s · KAABIL" },
  description: "हर हुनर को मिले सही दिशा. Discover your abilities, learn a skill, and connect with verified work.",
  applicationName: "KAABIL",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "KAABIL", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060b1a" },
    { media: "(prefers-color-scheme: light)", color: "#f4eee2" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Applies persisted theme/mode before paint to avoid a flash.
const boot = `try{var s=JSON.parse(localStorage.getItem('kaabil')||'{}').state||{};var st=s.settings||{};var d=document.documentElement;d.dataset.theme=st.theme||'dark';d.dataset.simple=st.simpleMode?'1':'0';d.dataset.motion=st.animations===false?'off':'on';d.dataset.kiosk=(s.kiosk&&s.kiosk.active)?'1':'0';}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, messages } = await getTranslator();
  return (
    <html lang={locale} data-theme="dark" className={`${fontVars} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        <Script id="kaabil-boot" strategy="beforeInteractive">
          {boot}
        </Script>
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
