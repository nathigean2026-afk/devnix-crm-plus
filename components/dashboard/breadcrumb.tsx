"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb"
import Link from "next/link"

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  clientes: "Clientes",
  servicos: "Serviços",
  orcamentos: "Orçamentos",
  financeiro: "Financeiro",
  configuracoes: "Configurações",
  novo: "Novo",
  editar: "Editar",
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1
          const href = "/" + segments.slice(0, i + 1).join("/")
          const label = labels[seg] ?? seg

          if (isLast) {
            return (
              <BreadcrumbItem key={seg}>
                <BreadcrumbPage className="text-foreground font-medium">{label}</BreadcrumbPage>
              </BreadcrumbItem>
            )
          }

          return (
            <>
              <BreadcrumbItem key={seg}>
                <BreadcrumbLink href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                  {label}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator key={`sep-${seg}`} className="text-muted-foreground" />
            </>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
