import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const switzer = localFont({
  src: "../../public/fonts/Switzer-Variable.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "100 900",
});

const sourceSerif = localFont({
  src: [
    {
      path: "../../public/fonts/SourceSerif4-VariableFont_opsz,wght.ttf",
      style: "normal",
      weight: "200 900",
    },
    {
      path: "../../public/fonts/SourceSerif4-Italic-VariableFont_opsz,wght.ttf",
      style: "italic",
      weight: "200 900",
    },
  ],
  variable: "--font-serif",
  display: "swap",
});

const sourceCode = localFont({
  src: "../../public/fonts/SourceCodePro-VariableFont_wght.ttf",
  variable: "--font-mono",
  display: "swap",
  weight: "200 900",
});

export const metadata: Metadata = {
  title: {
    default: "Brent Walbolt | Senior Design Engineer",
    template: "%s | Brent Walbolt",
  },
  description:
    "A senior design engineer portfolio focused on hand-crafted interfaces, accessibility, performance, and AI-accelerated workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${switzer.variable} ${sourceSerif.variable} ${sourceCode.variable}`}
    >
      <body>
        <a className="skipLink" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
