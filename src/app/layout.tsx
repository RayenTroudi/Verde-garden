import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verde Garden | Premium Plant Marketplace",
  description:
    "Discover curated botanical treasures — premium plants for your home and garden, thoughtfully grown and ready to find their home with you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
