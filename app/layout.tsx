import type { Metadata } from "next";
import "./globals.css";
import { PreferencesProvider } from "@/lib/preferences";
import { Experience } from "./experience";
export const metadata: Metadata = {
  title: "Folio BookTracker — A life in books",
  description:
    "Your personal reading companion. Track, reflect on, and collect the books that stay with you.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PreferencesProvider>
          <Experience>{children}</Experience>
        </PreferencesProvider>
      </body>
    </html>
  );
}
