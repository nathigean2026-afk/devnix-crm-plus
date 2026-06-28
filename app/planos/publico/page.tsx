"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Check, X, ChevronDown, ChevronUp, Zap, CalendarDays, CalendarRange,
  ShieldCheck, Clock, Sparkles, Lock, Users, FileText, BarChart3,
  MessageSquare, Palette, UserPlus, ArrowRight, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Dados dos planos ──────────────────────────────────────────────────────────
const plans = [
  {
    id: "start",
    name: "Start",
    duration: "7 dias",
    price: 7,
    priceNote: "pagamento único",
    period: "acesso por 7 dias",
    desc: "Experimente a plataforma completa. Ideal para avaliar antes de assinar.",
    icon: Zap,
    highlight: false,
    badge: null as string | null,
    cta: "Começar agora",
    ctaHref: "/sign-up",
  },
  {
    id: "business",
    name: "Business",
    duration: "30 dias",
    price: 30,
    priceNote: "por mês",
    period: "renovável mensalmente",
    desc: "Para profissionais que precisam de marca própria e notificações de orçamento.",
    icon: CalendarDays,
    highlight: true,
    badge: "Mais popular",
    cta: "Escolher Business",
    ctaHref: "/sign-up",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    duration: "360 dias",
    price: 280,
    priceNote: "por ano",
    period: "equivale a R$ 23,33/mês",
    desc: "Melhor custo-benefício com funcionário auxiliar incluso por 360 dias.",
    icon: CalendarRange,
    highlight: false,
    badge: "Melhor valor",
    cta: "Escolher Enterprise",
    ctaHref: "/sign-up",
  },
]

// ── Tabela de features completa ───────────────────────────────────────────────
type PlanAvailability = true | false | "business" | "enterprise"

const featureGroups = [
  {
    label: "Base",
    icon: FileText,
    rows: [
      { name: "Cadastro de clientes", start: true, business: true, enterprise: true },
      { name: "Catálogo de serviços", start: true, business: true, enterprise: true },
      { name: "Ordens de Serviço ilimitadas", start: true, business: true, enterprise: true },
      { name: "Orçamentos ilimitados", start: true, business: true, enterprise: true },
      { name: "Link público para orçamentos", start: true, business: true, enterprise: true },
      { name: "Financeiro (receitas e despesas)", start: true, business: true, enterprise: true },
      { name: "Pagamento via Pix", start: true, business: true, enterprise: true },
      { name: "Código promocional", start: true, business: true, enterprise: true },
    ],
  },
  {
    label: "Relatórios",
    icon: BarChart3,
    rows: [
      { name: "Relatórios e gráficos", start: true, business: true, enterprise: true },
    ],
  },
  {
    label: "Suporte",
    icon: MessageSquare,
    rows: [
      { name: "Tickets de suporte", start: true, business: true, enterprise: true },
      { name: "Suporte por e-mail", start: true, business: false, enterprise: false },
      { name: "Suporte prioritário", start: false, business: true, enterprise: true },
      { name: "Suporte VIP", start: false, business: false, enterprise: true },
    ],
  },
  {
    label: "Marca própria",
    icon: Palette,
    rows: [
      { name: "Logo nos documentos e PDFs", start: false, business: true, enterprise: true },
      { name: "Nome da empresa nos documentos", start: false, business: true, enterprise: true },
      { name: "CNPJ no cabeçalho dos documentos", start: false, business: true, enterprise: true },
      { name: "Cor de destaque personalizada", start: false, business: true, enterprise: true },
      { name: "Notificações de resposta de orçamento", start: false, business: true, enterprise: true },
    ],
  },
  {
    label: "Funcionário auxiliar",
    icon: UserPlus,
    rows: [
      { name: "1 funcionário auxiliar incluso", start: false, business: false, enterprise: true },
      { name: "Permissão: Clientes", start: false, business: false, enterprise: true },
      { name: "Permissão: Serviços", start: false, business: false, enterprise: true },
      { name: "Permissão: Orçamentos", start: false, business: false, enterprise: true },
      { name: "Permissão: Ordens de Serviço", start: false, business: false, enterprise: true },
      { name: "Permissão: Financeiro", start: false, business: false, enterprise: true },
      { name: "Permissão: Relatórios", start: false, business: false, enterprise: true },
    ],
  },
  {
    label: "Vigência",
    icon: Clock,
    rows: [
      { name: "Dias de acesso", start: "7 dias" as string | boolean, business: "30 dias" as string | boolean, enterprise: "360 dias" as string | boolean },
      { name: "Renovação automática", start: false, business: false, enterprise: false },
    ],
  },
]

const faqs = [
  {
    q: "O pagamento é recorrente?",
    a: "Não. Todos os planos são pagamentos únicos. Você controla quando e se quer renovar, sem cobranças automáticas.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Aceitamos Pix com ativação instantânea após confirmação do pagamento.",
  },
  {
    q: "Posso mudar de plano depois?",
    a: "Sim. Ao renovar, você pode escolher qualquer plano disponível, inclusive subir para Business ou Enterprise.",
  },
  {
    q: "O que é o funcionário auxiliar do Enterprise?",
    a: "Você pode cadastrar 1 usuário adicional (funcionário, sócio ou assistente) com acesso ao sistema. É possível definir individualmente quais módulos ele pode acessar: clientes, serviços, orçamentos, OS, financeiro e relatórios.",
  },
  {
    q: "A personalização de marca aparece em todos os documentos?",
    a: "Sim. Nos planos Business e Enterprise, seu logotipo, nome da empresa, CNPJ e cor de destaque aparecem nos orçamentos, ordens de serviço e recibos.",
  },
  {
    q: "Quanto economizo com o Enterprise vs Business mensal?",
    a: "O Business custa R$ 30/mês. Em 12 meses seriam R$ 360. O Enterprise cobre 360 dias por R$ 280 — uma economia de R$ 80, equivalendo a R$ 23,33 por mês.",
  },
]

// ── Componentes auxiliares ────────────────────────────────────────────────────
function CellIcon({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-xs font-semibold text-foreground">{value}</span>
  }
  if (value) {
    return (
      <div className="size-5 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
        <Check className="size-3 text-primary" strokeWidth={3} />
      </div>
    )
  }
  return (
    <div className="size-5 rounded-full bg-muted flex items-center justify-center mx-auto">
      <X className="size-3 text-muted-foreground/40" strokeWidth={2.5} />
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{q}</span>
        {open
          ? <ChevronUp className="size-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <p className="text-sm text-muted-foreground leading-relaxed pb-5">{a}</p>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PlanosPublicoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link href="/sign-in" className="flex items-center gap-2 shrink-0">
            <Image
              src="/elevanthe-icon.png"
              alt="Elevanthe CRM"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="font-bold text-sm tracking-tight hidden sm:block">Elevanthe CRM</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted"
            >
              Entrar
            </Link>
            <Link
              href="/sign-up"
              className="text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Hero */}
        <div className="pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-widest uppercase px-3 py-1 rounded-full border border-border bg-muted/40 text-muted-foreground mb-6">
            <Sparkles className="size-3 text-primary" />
            Planos e preços
          </div>
          <h1 className="text-4xl sm:text-[56px] font-black tracking-tighter leading-[1.04] text-foreground text-balance mb-5">
            Simples, sem surpresas
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed text-pretty mb-3">
            Pague uma vez, use o tempo inteiro. Sem assinatura automática, sem renovação forçada.
          </p>
          <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
            <Lock className="size-3" />
            Pagamento via Pix · Ativação instantânea
          </p>
        </div>

        {/* Cards de planos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border transition-all duration-200",
                  plan.highlight
                    ? "border-primary ring-2 ring-primary/20 bg-card shadow-xl shadow-primary/10"
                    : "border-border bg-card hover:shadow-md"
                )}
              >
                {plan.badge && (
                  <div className={cn(
                    "absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[11px] font-bold border",
                    plan.highlight
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-amber-500 text-white border-amber-500"
                  )}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold">{plan.name}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.duration}</p>
                    </div>
                    <div className={cn(
                      "size-9 rounded-xl flex items-center justify-center shrink-0",
                      plan.highlight ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="size-4" />
                    </div>
                  </div>

                  <div className="mb-1">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-sm font-medium text-muted-foreground mr-1">R$</span>
                      <span className={cn(
                        "text-5xl font-black tracking-tighter leading-none",
                        plan.highlight ? "text-primary" : "text-foreground"
                      )}>
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">,00</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{plan.priceNote}</p>
                    {plan.id === "enterprise" && (
                      <p className="text-xs font-semibold text-emerald-500 mt-0.5">
                        Equivale a R$ 23,33/mês · Economia de R$ 80
                      </p>
                    )}
                  </div>

                  <div className="my-4 h-px bg-border" />

                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty mb-6 flex-1">
                    {plan.desc}
                  </p>

                  <Link
                    href={plan.ctaHref}
                    className={cn(
                      "w-full h-11 rounded-xl text-sm font-semibold transition-all duration-150",
                      "flex items-center justify-center gap-2",
                      plan.highlight
                        ? "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/25"
                        : "bg-foreground text-background hover:opacity-90"
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Tabela comparativa completa */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2">
              Comparação completa
            </h2>
            <p className="text-sm text-muted-foreground">Veja exatamente o que cada plano inclui</p>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden">

            {/* Header da tabela */}
            <div className="grid grid-cols-4 bg-muted/40 border-b border-border">
              <div className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Funcionalidade</div>
              {plans.map((p) => (
                <div key={p.id} className={cn(
                  "p-4 text-center",
                  p.highlight && "bg-primary/5 border-x border-primary/20"
                )}>
                  <p className={cn("text-sm font-bold", p.highlight ? "text-primary" : "text-foreground")}>{p.name}</p>
                  <p className="text-xs text-muted-foreground">R$ {p.price}</p>
                </div>
              ))}
            </div>

            {featureGroups.map((group) => {
              const GroupIcon = group.icon
              return (
                <div key={group.label}>
                  {/* Separador de categoria */}
                  <div className="grid grid-cols-4 bg-muted/20 border-b border-border/50 px-4 py-2.5">
                    <div className="col-span-4 flex items-center gap-2">
                      <GroupIcon className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{group.label}</span>
                    </div>
                  </div>

                  {group.rows.map((row, i) => (
                    <div
                      key={row.name}
                      className={cn(
                        "grid grid-cols-4 border-b border-border/40 last:border-0",
                        i % 2 === 0 ? "bg-background" : "bg-muted/10"
                      )}
                    >
                      <div className="px-4 py-3 text-sm text-foreground/80 flex items-center">{row.name}</div>
                      {(["start", "business", "enterprise"] as const).map((planId, idx) => (
                        <div
                          key={planId}
                          className={cn(
                            "px-4 py-3 flex items-center justify-center",
                            idx === 1 && "bg-primary/5 border-x border-primary/20"
                          )}
                        >
                          <CellIcon value={row[planId] as boolean | string} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </section>

        {/* Garantias */}
        <section className="mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "Sem cobrança automática",
                desc: "Nenhuma assinatura recorrente. Você escolhe quando e se renova.",
              },
              {
                icon: Sparkles,
                title: "Ativação instantânea",
                desc: "Sua licença é ativada automaticamente após confirmação do pagamento.",
              },
              {
                icon: Star,
                title: "Suporte humano",
                desc: "Atendimento real via ticket ou WhatsApp. Sem bots, sem fila automática.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card"
              >
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2">
              Perguntas frequentes
            </h2>
            <p className="text-sm text-muted-foreground">Tire suas dúvidas antes de contratar</p>
          </div>

          <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card px-6">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="mb-24 text-center">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-3 text-balance">
              Pronto para começar?
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
              Crie sua conta gratuitamente e escolha o plano dentro do sistema.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="h-11 px-8 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/25"
              >
                Criar conta grátis
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href="/sign-in"
                className="h-11 px-8 rounded-xl border border-border bg-card text-sm font-medium text-foreground flex items-center gap-2 hover:bg-muted/50 transition-colors"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-border/50 py-6">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Elevanthe CRM — Todos os direitos reservados
          </p>
          <p className="text-xs text-muted-foreground">
            Pagamento seguro via Pix
          </p>
        </div>
      </footer>
    </div>
  )
}
