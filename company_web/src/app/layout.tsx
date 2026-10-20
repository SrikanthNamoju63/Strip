import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dr Strip | Digital Healthcare for Everyone",
  description: "Dr Strip is a leading healthcare technology company building digital platforms for patients, doctors, and hospitals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${outfit.className} bg-[var(--background)] text-[var(--text-main)]`}>
        <Navbar />
        <main className="min-h-screen pt-20 fade-in">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
