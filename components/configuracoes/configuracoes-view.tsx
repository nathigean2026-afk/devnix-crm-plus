"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sun, Moon, Monitor, User, Palette, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfiguracoesViewProps {
  user: { name: string; email: string; id: string }
}

const themes = [
  { value: "light", label: "Claro", icon: Sun, description: "Interface clara e limpa" },
  { value: "dark", label: "Escuro", icon: Moon, description: "Modo escuro para conforto visual" },
  { value: "system", label: "Sistema", icon: Monitor, description: "Segue a preferência do sistema" },
]

export function ConfiguracoesView({ user }: ConfiguracoesViewProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground text-balance">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie sua conta e preferências do sistema.</p>
      </div>

      {/* Perfil */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            <CardTitle className="text-base text-foreground">Perfil</CardTitle>
          </div>
          <CardDescription>Informações da sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-foreground">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="secondary" className="w-fit text-xs mt-1">Administrador</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Palette className="size-4 text-primary" />
            <CardTitle className="text-base text-foreground">Aparência</CardTitle>
          </div>
          <CardDescription>Escolha o tema da interface.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => {
              const Icon = t.icon
              const isActive = mounted && theme === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all duration-150 cursor-pointer",
                    isActive
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/50 hover:bg-accent/30"
                  )}
                >
                  <Icon className={cn("size-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium", isActive ? "text-primary" : "text-foreground")}>
                    {t.label}
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight">{t.description}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <CardTitle className="text-base text-foreground">Segurança</CardTitle>
          </div>
          <CardDescription>Informações de acesso e segurança.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Senha</p>
              <p className="text-xs text-muted-foreground">Última alteração desconhecida</p>
            </div>
            <Badge variant="outline" className="text-xs">Protegida</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Autenticação</p>
              <p className="text-xs text-muted-foreground">Email e senha</p>
            </div>
            <Badge variant="secondary" className="text-xs">Ativa</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">ID da conta</p>
              <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 16)}...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
