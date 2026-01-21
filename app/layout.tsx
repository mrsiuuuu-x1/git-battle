import "./globals.css";

export const metadata = {
  title: "Git Battle",
  description: "Retro Code Arena",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}