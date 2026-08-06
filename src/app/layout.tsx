import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LocaleProvider } from "@/components/LocaleProvider";
import { isLocale, defaultLocale, dirForLocale } from "@/lib/i18n";
import "@/styles/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrizePath",
  description: "Every task brings a prize closer — parents set them, kids move forward.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("pp_locale")?.value ?? "";
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return (
    <html lang={locale} dir={dirForLocale(locale)}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css"
        />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css" />
      </head>
      <body>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
