import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
})
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Mono só é usado em campos de código — não precisa de preload
})

export const metadata: Metadata = {
  title: {
    default: "Elevanthe CRM",
    template: "%s | Elevanthe CRM",
  },
  description:
    "Gestão de relacionamento que eleva resultados. Gerencie clientes, orçamentos e financeiro em um só lugar.",
  applicationName: "Elevanthe CRM",
  metadataBase: new URL("https://crm.elevanthe.com"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://crm.elevanthe.com",
    siteName: "Elevanthe CRM",
    title: "Elevanthe CRM — Gestão de Relacionamento que Eleva Resultados",
    description:
      "Gerencie clientes, orçamentos, ordens de serviço e financeiro em um só lugar.",
  },
  robots: {
    index: false, // App autenticado — não indexar internamente
    follow: false,
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon-32.png",
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d1526" },
    { media: "(prefers-color-scheme: light)", color: "#f8f9fc" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Preload da imagem LCP — carrossel desktop (hidden em mobile) */}
        <link
          rel="preload"
          as="image"
          href="/_next/image?url=%2Fscreenshots%2Fdashboard.png&w=960&q=75"
          media="(min-width: 1024px)"
        />
        {/* DNS prefetch para Cloudflare Turnstile — reduz latência do script */}
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster
            theme="system"
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
        </ThemeProvider>
      </body>
    </html>
  )
}
