import type { Metadata } from "next";
import { Anuphan, Mitr } from "next/font/google";
import "./globals.css";
import "./accordion.css";
import "./typography.css";
import "./tracker.css";
import "./nav-overrides.css";
import "./hero-refresh.css";
import "./settings-controls.css";
import "./saved-starters.css";
import "./milestone-timer.css";
import "./multi-loaf.css";
import "./bake-planner.css";
import "./recipe-library.css";
import "./levain-tracker.css";
import "./readability.css";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  display: "swap",
});

const mitr = Mitr({
  variable: "--font-mitr",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DoughGarden — Adaptive Sourdough Assistant",
  description: "กระดุ๊กกระดิ๊ก กระจุ๊กกระจิ๊กหัวใจ — ผู้ช่วยทำซาวโดว์และ Day Tracker หัวเชื้อ",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${anuphan.variable} ${mitr.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
