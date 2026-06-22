"use client"

import {
  LayoutDashboard,
  Users,
  Wrench,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  ChevronDown,
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
    ],
  },
  {
    group: "Financeiro",
    items: [
      { href: "/dashboard/financeiro", label: "Financeiro", icon: DollarSign },
    ],
  },
]

interface AppSidebarProps {
  user: { name: string; email: string }
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20reduzida-B2qAbWz2qQ52LWM7e7hYbiRRWNXHqD.png"
            alt="Devnix"
            width={32}
            height={32}
            className="shrink-0 object-contain"
          />
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-bold text-sidebar-accent-foreground leading-tight">Devnix CRM Plus</p>
            <p className="text-xs text-sidebar-foreground">Soluções Web Inteligentes</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {navItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
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
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                          )}
                        >
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium text-sidebar-accent-foreground truncate">{user.name}</span>
                    <span className="text-xs text-sidebar-foreground truncate">{user.email}</span>
                  </div>
                  <ChevronDown className="size-4 group-data-[collapsible=icon]:hidden shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 bg-popover border-border">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/configuracoes" className="flex items-center gap-2 text-foreground cursor-pointer">
                    <Settings className="size-4" />
                    Configurações
                  </Link>
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
