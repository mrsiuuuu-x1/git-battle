import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import BackgroundMusic from "./components/BackgroundMusic";

export const metadata: Metadata = {
  title: "Git Battle",
  description: "Battle your GitHub profile",
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