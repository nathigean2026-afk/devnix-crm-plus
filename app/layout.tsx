import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import { PwaInstallPrompt } from "@/components/pwa-banner"

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
  preload: false,
})
// Inter é usada nas páginas públicas para alinhar com o visual do elevanthe.com
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
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
  manifest: "/manifest.json",
  robots: {
    index: false,
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
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* DNS prefetch para Cloudflare Turnstile — reduz latência do script */}
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" crossOrigin="anonymous" />

        {/* PWA — splash screen e configurações iOS */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Elevanthe" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/pwa-icon-512.png" />

        {/* Splash screens iOS — fundo navy + ícone centralizado */}
        {/* iPhone 14 Pro Max */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/splash/splash-1290x2796.png" />
        {/* iPhone 14 Pro */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/splash/splash-1179x2556.png" />
        {/* iPhone 14 Plus / 13 Pro Max */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" href="/splash/splash-1284x2778.png" />
        {/* iPhone 14 / 13 / 12 */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/splash/splash-1170x2532.png" />
        {/* iPhone SE / 8 */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/splash/splash-750x1334.png" />
      </head>
      <body className="font-sans antialiased bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          scriptProps={{ "data-cfasync": "false" }}
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
          <PwaInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  )
}
