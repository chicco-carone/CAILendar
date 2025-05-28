import type React from "react";
import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const exo2 = Exo_2({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CAILendar",
  description: "A calendar app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${exo2.className} transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
