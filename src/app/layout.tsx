import type { Metadata } from "next";
import { Sofia_Sans } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

// Brand type from the PCE Website design project:
// Burbank Big (display, self-hosted) + Sofia Sans (body, Google Fonts).
const burbank = localFont({
  src: "../fonts/BurbankBig-Bold.woff2",
  weight: "700",
  variable: "--font-burbank",
  display: "swap",
});

const sofia = Sofia_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-sofia",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Perfect Catch Rewards",
  description:
    "Customer rewards, referrals, and reviews for Perfect Catch Electric.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${burbank.variable} ${sofia.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
