import type { Metadata } from "next";
import { Navbar } from "./components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnimeCards — Card Game RPG",
  description: "Monte seu deck, dispute duelos táticos e suba no ranking de AnimeCards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
