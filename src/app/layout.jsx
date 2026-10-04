import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Moyo Abiodun",
  description:
    "Moyo Abiodun — Snr. product designer helping founders turn early ideas into shipped products.",
  icons: { icon: "/favicon.ico" },
};

export const viewport = {
  // Light mode only for now (see globals.css).
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
