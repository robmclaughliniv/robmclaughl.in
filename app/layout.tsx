import type React from "react"
import type { Metadata } from "next"
import { Inter, Space_Mono, Press_Start_2P } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

// Load Inter as the body font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

// Load Space Mono for secondary headings
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
})

// Load Press Start 2P for the main heading - pixelated retro font
const pressStart2P = Press_Start_2P({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-press-start-2p",
})

export const metadata: Metadata = {
  title: "Rob McLaughlin | Senior Software Engineer",
  description: "Personal website of Rob McLaughlin, Senior Software Engineer",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceMono.variable} ${pressStart2P.variable} font-sans bg-zinc-950 text-zinc-100 antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'