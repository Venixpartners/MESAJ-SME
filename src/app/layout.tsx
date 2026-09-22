import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { MetaPixel } from "@/components/MetaPixel";
import "./globals.css";

// Inter is the brand's digital typeface. next/font downloads it at build
// time and serves it from this domain, so visitors never call Google.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mesaj for SMEs | Bulk SMS for Nigerian businesses",
    template: "%s · Mesaj for SMEs",
  },
  description:
    "Bulk SMS for Nigerian businesses. Get your Sender ID approved, top up your wallet and send campaigns to your customers from your own account.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MetaPixel />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
