import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Arbutus, Jura } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const arbutus = Arbutus({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-arbutus",
})

const jura = Jura({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jura",
})

export const metadata: Metadata = {
  title: "45 Days of Code",
  description: "Master coding with daily challenges and track your progress",
  generator: "v0.app",
  icons: {
    icon: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
  --font-arbutus: ${arbutus.variable};
  --font-jura: ${jura.variable};
}
        `}</style>
      </head>
      <body className={`${arbutus.variable} ${jura.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
