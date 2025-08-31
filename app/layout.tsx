import type React from "react";
import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import { ResponsiveLayout } from "@/components/layout/responsive-layout";
import { PWAProvider } from "@/components/pwa/pwa-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeSync } from "@/components/theme-sync";
import { ConfirmProvider } from "@/components/confirm/confirm-provider";
import { ClientOnly } from "@/components/clientOnly";

export const metadata: Metadata = {
  title: "v0 Tuition Fee Management",
  description:
    "Admin portal for managing students, fees, payments, invoices, and analytics. Built with Next.js and v0.app.",
  generator: "v0.app",
  manifest: "/manifest.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    title: "v0 Tuition Fee Management",
    description:
      "Admin portal for managing students, fees, payments, invoices, and analytics.",
    url: "https://yourdomain.com",
    siteName: "v0 App",
    images: [
      {
        url: "https://yourdomain.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "v0 Tuition Fee Management Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "v0 Tuition Fee Management",
    description:
      "Admin portal for managing students, fees, payments, invoices, and analytics.",
    images: ["https://yourdomain.com/og-image.png"],
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta
          name="apple-mobile-web-app-title"
          content="v0 Tuition Fee Management"
        />
      </head>
      <body>
        <ClientOnly>
          <PWAProvider />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ThemeSync />
            <ConfirmProvider>
              <ResponsiveLayout>{children}</ResponsiveLayout>
            </ConfirmProvider>
          </ThemeProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
