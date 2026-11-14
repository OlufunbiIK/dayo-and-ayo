import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morayo & Dayo · 17.04.2027",
  description: "You're invited to the wedding of Morayo & Dayo in Abuja. Open your invitation.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fbf7f3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..500,0..100;1,9..144,300..500,0..100&family=Manrope:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
