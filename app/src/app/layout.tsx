import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import Navbar from "../components/Navbar";
import Particles from "../components/Particles";

export const metadata: Metadata = {
  title: "NZ Travel Journal",
  description: "紐西蘭旅行記錄網站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        <ThemeProvider>
          <Particles />
          <Navbar />
          <main className="page-wrapper">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
