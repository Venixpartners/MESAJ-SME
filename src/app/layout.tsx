import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { MetaPixel } from "@/components/MetaPixel";
import { AttributionCapture } from "@/components/AttributionCapture";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
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
  // Absolute base for share images and canonical links. Without it, the
  // card a link shows in WhatsApp or LinkedIn points at a relative path
  // and silently fails to load.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Bulk SMS for Nigerian businesses`,
    template: `%s \u00b7 ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_NG",
    url: SITE_URL,
    title: `${SITE_NAME} | Bulk SMS for Nigerian businesses`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Bulk SMS for Nigerian businesses`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
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
        <AttributionCapture />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
