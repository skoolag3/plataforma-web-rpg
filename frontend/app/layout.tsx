import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Navbar } from "./components/navbar";
import { NotificacoesGlobais } from "./components/notificacoesGlobais";
import "./globals.css";

const fontePrincipal = Outfit({
  subsets: ["latin"],
  variable: "--fonte-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AnimeCards - Card Game RPG",
  description:
    "Monte seu deck, dispute duelos táticos e suba no ranking de AnimeCards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={fontePrincipal.variable}>
      <body>
        <Navbar />
        <NotificacoesGlobais />
        {children}
      </body>
    </html>
  );
}
