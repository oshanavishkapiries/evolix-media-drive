import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Evolix | Your Personal Media Library",
    template: "%s | Evolix",
  },
  description: "Stream your Google Drive media library with a premium viewing experience",
  keywords: ["media", "streaming", "google drive", "movies", "tv shows", "evolix"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Navbar />
        <main className="min-h-screen pb-16 lg:pb-0">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}

