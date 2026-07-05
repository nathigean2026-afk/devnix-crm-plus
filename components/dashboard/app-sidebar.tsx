"use client"

import {
  LayoutDashboard,
  UsersRound, // equipe / clientes
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

type NavPermKey = "canClients" | "canServices" | "canQuotes" | "canOrders" | "canFinanceiro" | "canRelatorios"

const allNavItems = [
  {
    group: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permKey: null },
      { href: "/dashboard/clientes", label: "Clientes", icon: UsersRound, permKey: "canClients" as NavPermKey },
    ],
  },
  {
    group: "Comercial",
    items: [
      { href: "/dashboard/servicos", label: "Serviços", icon: Wrench, permKey: "canServices" as NavPermKey },
      { href: "/dashboard/orcamentos", label: "Orçamentos", icon: FileText, permKey: "canQuotes" as NavPermKey },
      { href: "/dashboard/ordens-servico", label: "Ordens de Serviço", icon: ClipboardList, permKey: "canOrders" as NavPermKey },
    ],
  },
  {
    group: "Financeiro",
    items: [
      { href: "/dashboard/financeiro", label: "Financeiro", icon: DollarSign, permKey: "canFinanceiro" as NavPermKey },
      { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart2, permKey: "canRelatorios" as NavPermKey },
    ],
  },
  {
    group: "Ajuda",
    items: [
      { href: "/dashboard/suporte", label: "Suporte", icon: LifeBuoy, permKey: null },
    ],
  },
]

type EmployeePermissions = {
  canClients: boolean
  canServices: boolean
  canQuotes: boolean
  canOrders: boolean
  canFinanceiro: boolean
  canRelatorios: boolean
} | null

function buildNavItems(permissions: EmployeePermissions) {
  // null = prestador (sem restrições) → mostra tudo
  if (!permissions) return allNavItems

  return allNavItems
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.permKey === null || permissions[item.permKey] === true
      ),
    }))
    .filter((group) => group.items.length > 0)
}

interface AppSidebarProps {
  user: { name: string; email: string }
  permissions?: EmployeePermissions
}

// Componente interno da nav reutilizado em desktop e mobile
function SidebarNav({
  collapsed,
  onNavClick,
  navItems,
}: {
  collapsed: boolean
  onNavClick?: () => void
  navItems: ReturnType<typeof buildNavItems>
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

export function AppSidebar({ user, permissions = null }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navItems = buildNavItems(permissions)

  const SidebarHeader = ({ isMobile = false }: { isMobile?: boolean }) => {
    // Modo colapsado desktop: ícone centralizado com botão de toggle abaixo do header
    if (!isMobile && collapsed) {
      return (
        <div className="flex flex-col items-center border-b border-sidebar-border shrink-0 py-3 h-[60px] justify-center relative">
          <Image
            src="/elevanthe-logo-neon.png"
            alt="Elevanthe CRM"
            width={34}
            height={34}
            className="object-contain"
          />
          <button
            onClick={() => setCollapsed(false)}
            className="absolute right-1 top-1/2 -translate-y-1/2 size-6 rounded-md flex items-center justify-center text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Expandir menu"
          >
            <PanelLeftOpen className="size-3.5" />
          </button>
        </div>
      )
    }

    return (
      <div className="flex items-center border-b border-sidebar-border shrink-0 px-4 py-3 h-[60px]">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Image
            src="/elevanthe-logo-neon.png"
            alt="Elevanthe CRM"
            width={34}
            height={34}
            className="object-contain shrink-0"
          />
          {!isMobile && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-sidebar-accent-foreground leading-tight tracking-tight">Elevanthe CRM</span>
              <span className="text-[10px] text-sidebar-foreground/50 truncate leading-tight">Gestão que eleva resultados</span>
            </div>
          )}
          {isMobile && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-sidebar-accent-foreground leading-tight tracking-tight">Elevanthe CRM</span>
              <span className="text-[10px] text-sidebar-foreground/50 truncate leading-tight">Gestão que eleva resultados</span>
            </div>
          )}
        </div>
        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="shrink-0 size-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Fechar menu"
          >
            <X className="size-4" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(true)}
            className="shrink-0 size-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Recolher menu"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>
    )
  }

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
        <SidebarNav collapsed={false} onNavClick={() => setMobileOpen(false)} navItems={navItems} />
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
        <SidebarNav collapsed={collapsed} navItems={navItems} />
        <SidebarFooter user={user} collapsed={collapsed} />
      </aside>
    </>
  )
}
