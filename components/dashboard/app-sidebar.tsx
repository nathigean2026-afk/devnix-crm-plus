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
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
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
]

interface AppSidebarProps {
  user: { name: string; email: string }
}

function FooterUser({ user }: AppSidebarProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  useEffect(() => { setMounted(true) }, [])

  const handleSignOut = async () => {
    await authClient.signOut()
    toast.success("Sessão encerrada")
    router.push("/sign-in")
    router.refresh()
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isDark = mounted ? theme === "dark" : true

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center rounded-md px-2 py-2 text-sm text-sidebar-foreground outline-none",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring transition-colors",
            collapsed ? "justify-center gap-0" : "gap-2"
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
                <span className="text-xs text-sidebar-foreground truncate">{user.email}</span>
              </div>
              <ChevronDown className="size-4 shrink-0 ml-auto" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56 bg-popover border-border">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/configuracoes" className="flex items-center gap-2 cursor-pointer">
            <Settings className="size-4" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (mounted) setTheme(isDark ? "light" : "dark")
          }}
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
  )
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="size-8 shrink-0 flex items-center justify-center">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20reduzida-B2qAbWz2qQ52LWM7e7hYbiRRWNXHqD.png"
              alt="Devnix"
              width={32}
              height={32}
              style={{ width: 32, height: "auto" }}
              className="object-contain"
            />
          </div>
          <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
            <p className="text-sm font-bold text-sidebar-accent-foreground leading-tight truncate">Devnix CRM Plus</p>
            <p className="text-xs text-sidebar-foreground truncate">Soluções Web Inteligentes</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {navItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider group-data-[collapsible=icon]:hidden">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link href={item.href}>
                          <item.icon className="size-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <FooterUser user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
