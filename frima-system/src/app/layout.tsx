import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { getLocale } from "@/lib/i18n/server";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// A serif for the public site's headings. The admin stays on Inter.
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FRIMA Guest Suites · Ntoun, Yaoundé",
    template: "%s · FRIMA Guest Suites",
  },
  description:
    "FRIMA Guest Suites · votre havre de paix et de confort à Ntoun, à proximité de l'aéroport international de Nsimalen, Yaoundé.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* Reveal animations are driven by JavaScript. With scripting off the
            hidden starting state is lifted so the page is still readable.
            Done with <noscript> rather than a class the client would strip,
            which would leave the server and client markup disagreeing. */}
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
