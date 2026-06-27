"use client"

import {
  LayoutDashboard,
  Users,
  Wrench,
  FileText,
  DollarSign,
  BarChart2,
  Settings,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LifeBuoy,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const navItems = [
  {
    group: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/clientes", label: "Clientes", icon: Users },
    ],
  },
  {
    group: "Comercial",
    items: [
      { href: "/dashboard/servicos", label: "Serviços", icon: Wrench },
      { href: "/dashboard/orcamentos", label: "Orçamentos", icon: FileText },
      { href: "/dashboard/ordens-servico", label: "Ordens de Serviço", icon: ClipboardList },
    ],
  },
  {
    group: "Financeiro",
    items: [
      { href: "/dashboard/financeiro", label: "Financeiro", icon: DollarSign },
      { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart2 },
    ],
  },
  {
    group: "Ajuda",
    items: [
      { href: "/dashboard/suporte", label: "Suporte", icon: LifeBuoy },
    ],
  },
]

interface AppSidebarProps {
  user: { name: string; email: string }
}

// Componente interno da nav reutilizado em desktop e mobile
function SidebarNav({
  collapsed,
  onNavClick,
}: {
  collapsed: boolean
  onNavClick?: () => void
}) {
  const pathname = usePathname()
  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
      {navItems.map((group) => (
        <div key={group.group} className="mb-1">
          {!collapsed && (
            <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 select-none">
              {group.group}
            </p>
          )}
          {collapsed && <div className="mt-3" />}
          <ul className="flex flex-col gap-0.5 px-2">
            {group.items.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    onClick={onNavClick}
                    className={cn(
                      "flex items-center rounded-md text-sm transition-colors w-full",
                      collapsed ? "justify-center size-10 mx-auto" : "gap-3 px-3 py-2.5",
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function SidebarFooter({
  user,
  collapsed,
  onNavClick,
}: {
  user: { name: string; email: string }
  collapsed: boolean
  onNavClick?: () => void
}) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isDark = mounted ? theme === "dark" : false
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleSignOut = async () => {
    await authClient.signOut()
    toast.success("Sessão encerrada")
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <div className="border-t border-sidebar-border p-2 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center rounded-md text-sm text-sidebar-foreground w-full transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            collapsed ? "justify-center p-1.5" : "gap-2 px-2 py-2"
          )}
        >
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex flex-col flex-1 min-w-0 text-left">
                <span className="text-sm font-medium text-sidebar-accent-foreground truncate">{user.name}</span>
                <span className="text-xs text-sidebar-foreground/60 truncate">{user.email}</span>
              </div>
              <ChevronDown className="size-3.5 shrink-0 text-sidebar-foreground/60" />
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align={collapsed ? "center" : "start"} className="w-56 bg-popover border-border">
          <DropdownMenuItem asChild>
            <Link href="/dashboard/configuracoes" onClick={onNavClick} className="flex items-center gap-2 cursor-pointer">
              <Settings className="size-4" />
              Configurações
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => { if (mounted) setTheme(isDark ? "light" : "dark") }}
            className="flex items-center gap-2 cursor-pointer"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span suppressHydrationWarning>
              {mounted ? (isDark ? "Mudar para Claro" : "Mudar para Escuro") : "Aparência"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex items-center gap-2 text-destructive cursor-pointer focus:text-destructive"
          >
            <LogOut className="size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarHeader = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn(
      "flex items-center border-b border-sidebar-border shrink-0",
      (!isMobile && collapsed) ? "justify-center px-2 py-3 h-[60px]" : "gap-3 px-4 py-3 h-[60px]"
    )}>
      <div className="size-8 shrink-0 flex items-center justify-center rounded-lg bg-primary">
        <Image
          src="/elevanthe-logo.png"
          alt="Elevanthe CRM"
          width={24}
          height={24}
          className="object-contain"
        />
      </div>
      {(isMobile || !collapsed) && (
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-bold text-sidebar-accent-foreground leading-tight truncate">Elevanthe CRM</p>
          <p className="text-xs text-sidebar-foreground/60 truncate">Gestão que eleva resultados</p>
        </div>
      )}
      {isMobile ? (
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto shrink-0 size-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          aria-label="Fechar menu"
        >
          <X className="size-4" />
        </button>
      ) : (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto shrink-0 size-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* ─── Mobile: hamburger button no header ─── */}
      <button
        className="md:hidden fixed top-0 left-0 z-50 h-[60px] w-[60px] flex items-center justify-center text-foreground"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </button>

      {/* ─── Mobile: overlay backdrop ─── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Mobile: drawer sidebar ─── */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarHeader isMobile />
        <SidebarNav collapsed={false} onNavClick={() => setMobileOpen(false)} />
        <SidebarFooter user={user} collapsed={false} onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* ─── Desktop: sidebar estática ─── */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-[width] duration-200 ease-in-out shrink-0",
          collapsed ? "w-[60px]" : "w-[240px]"
        )}
      >
        <SidebarHeader />
        <SidebarNav collapsed={collapsed} />
        <SidebarFooter user={user} collapsed={collapsed} />
      </aside>
    </>
  )
}
