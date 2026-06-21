import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Space_Mono, Press_Start_2P } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AudioPlayerLoader } from "@/components/audio-player"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "block",
  variable: "--font-space-mono",
})

const pressStart2P = Press_Start_2P({
  weight: ["400"],
  subsets: ["latin"],
  display: "block",
  variable: "--font-press-start-2p",
})

const siteUrl = "https://robmclaughl.in"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Rob McLaughlin | Engineering Manager",
    template: "%s | Rob McLaughlin",
  },
  description:
    "Personal website of Rob McLaughlin — Engineering Manager, problem-solver, and dad based in Austin, TX.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Rob McLaughlin",
    title: "Rob McLaughlin | Engineering Manager",
    description:
      "Personal website of Rob McLaughlin — Engineering Manager, problem-solver, and dad based in Austin, TX.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rob McLaughlin | Engineering Manager",
    description:
      "Personal website of Rob McLaughlin — Engineering Manager, problem-solver, and dad based in Austin, TX.",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceMono.variable} ${pressStart2P.variable} dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="font-sans bg-background text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring focus:outline-none font-mono text-sm"
        >
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
          <AudioPlayerLoader />
        </ThemeProvider>
      </body>
    </html>
  )
}