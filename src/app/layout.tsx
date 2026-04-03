import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import BackgroundMusic from "./components/BackgroundMusic";

export const metadata: Metadata = {
  title: "Git Battle - Turn Your GitHub Profile Into an RPG Character",
  description: "Git Battle transforms GitHub profiles into RPG characters that fight each other. Choose your class, battle friends, climb the leaderboard!",
  openGraph: {
    title: "Git Battle",
    description: "Turn your GitHub profile into an RPG character and battle other developers!",
    type: "website",
    siteName: "Git Battle",
  },
  twitter: {
    card: "summary_large_image",
    title: "Git Battle",
    description: "Turn your GitHub profile into an RPG character and battle other developers!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Providers>
          <BackgroundMusic />
          {children}
        </Providers>
      </body>
    </html>
  );
}