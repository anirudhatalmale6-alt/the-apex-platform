import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["300", "400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["400", "600", "700", "900"] });

export const metadata: Metadata = {
  title: "THE APEX | Where the Elite Converge",
  description: "An exclusive, invitation-only network for the world's most distinguished individuals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-inter antialiased`}>{children}</body>
    </html>
  );
}
