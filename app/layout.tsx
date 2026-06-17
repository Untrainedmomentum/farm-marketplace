import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "My Farm Express",
  description: "Fresh from the farm to your table",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body style={{ margin: 0, background: '#FFFDF5', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
        <Header />
        {children}
      </body>
    </html>
  )
}