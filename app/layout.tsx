import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Devnix CRM Plus",
    template: "%s | Devnix CRM Plus",
  },
  description:
    "CRM profissional para agências web. Gerencie clientes, orçamentos e financeiro em um só lugar.",
  applicationName: "Devnix CRM Plus",
}

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b1120",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            },
          }}
        />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
