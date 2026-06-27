# Elevanthe CRM — Documentação do Projeto

> Ultima atualização: 2026-06-28
> Branch ativo: `v0/elevanthe-dev-32ba9a50`

---

## 1. Visão Geral

O **Elevanthe CRM** é uma plataforma SaaS de gestão de relacionamento com clientes voltada para prestadores de serviço e pequenas empresas brasileiras. Centraliza clientes, orçamentos, ordens de serviço, financeiro, cobranças via Pix e comunicação via WhatsApp em um único sistema.

**Slogan:** "Gestão de relacionamento que eleva resultados."

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS v4 + shadcn/ui |
| Banco de dados | Neon (PostgreSQL serverless) |
| ORM | Drizzle ORM |
| Autenticação | Better Auth |
| Tema | next-themes (dark/light) |
| Ícones | Lucide React |
| Imagens | next/image |
| Deploy | Vercel |

---

## 3. Estrutura de Arquivos

```
/
├── app/
│   ├── layout.tsx               # Layout raiz — metadata, fontes, ThemeProvider
│   ├── globals.css              # Tokens de design (Tailwind v4 @theme)
│   ├── sign-in/page.tsx         # Página de login
│   ├── sign-up/page.tsx         # Página de cadastro
│   ├── dashboard/               # Painel principal (autenticado)
│   └── api/                     # Rotas de API (autenticação, webhooks)
│
├── components/
│   ├── auth-form.tsx            # Formulário de login/cadastro + wallpaper + tema
│   ├── theme-provider.tsx       # Provedor next-themes
│   ├── screenshot-carousel.tsx  # Carrossel de screenshots do CRM
│   ├── orcamentos/
│   │   └── quotes-view.tsx      # Módulo completo de orçamentos
│   ├── ordens-servico/
│   │   └── service-orders-view.tsx  # Módulo completo de OS
│   ├── clientes/                # Módulo de clientes
│   ├── financeiro/              # Módulo financeiro
│   ├── relatorios/              # Módulo de relatórios
│   ├── planos/
│   │   └── planos-view.tsx      # Página de planos e preços
│   └── support/
│       └── login-chat-widget.tsx  # Chat assistente flutuante
│
├── lib/
│   ├── actions.ts               # Server Actions (CRUD principal)
│   ├── auth.ts                  # Configuração Better Auth
│   ├── utils.ts                 # Utilitários (cn, formatCurrency, etc.)
│   └── db/
│       └── schema.ts            # Schema Drizzle ORM
│
├── public/
│   ├── favicon.ico              # Favicon do elefante Elevanthe
│   ├── elevanthe-logo-transparent-dark.png   # Logo dark (fundo transparente)
│   ├── elevanthe-logo-transparent-light.png  # Logo light (fundo transparente)
│   ├── elevanthe-logo-neon.png  # Logo elefante neon (marca d'agua)
│   ├── elevanthe-chatbot-logo.png  # Avatar do chat assistente
│   └── screenshots/             # Screenshots do CRM (carrossel)
│       ├── dashboard.png
│       ├── clientes.png
│       ├── orcamentos.png
│       ├── financeiro.png
│       └── relatorios.png
│
└── docs/
    └── DOCUMENTACAO.md          # Este arquivo
```

---

## 4. Banco de Dados (Neon / Drizzle)

**Projeto Neon:** `polished-dust-86113312`
**Branch principal:** `br-winter-dust-avh5jbtt`

### Tabelas principais

#### `users`
Gerenciada pelo Better Auth. Armazena dados de autenticação.

#### `clients`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid PK | Identificador único |
| userId | uuid FK | Prestador dono do cliente |
| name | text | Nome completo |
| email | text | E-mail |
| phone | text | Telefone / WhatsApp |
| cpfCnpj | text | CPF ou CNPJ |
| address | text | Endereço |
| createdAt | timestamp | Data de cadastro |

#### `quotes` (Orçamentos)
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid PK | Identificador único |
| userId | uuid FK | Prestador |
| clientId | uuid FK | Cliente |
| number | integer | Numero sequencial |
| title | text | Titulo do orçamento |
| status | text | rascunho / enviado / aprovado / recusado |
| validUntil | text | Data de validade |
| notes | text | Observações para o cliente |
| internalNotes | text | Notas internas |
| subtotal | numeric | Soma dos itens |
| discount | numeric | Desconto em R$ |
| total | numeric | Total final |
| cashPrice | numeric | Valor à vista / Pix (opcional) |
| cardPrice | numeric | Valor no cartão (opcional) |
| cardInstallments | integer | Número de parcelas no cartão |
| rejectionReason | text | Motivo da recusa pelo cliente |
| respondedAt | timestamp | Data da resposta do cliente |
| createdAt | timestamp | Data de criação |
| updatedAt | timestamp | Ultima atualização |

#### `quoteItems`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid PK | Identificador |
| quoteId | uuid FK | Orçamento pai |
| serviceId | uuid FK | Serviço do catálogo (opcional) |
| description | text | Descrição do item |
| quantity | numeric | Quantidade |
| unitPrice | numeric | Preço unitário |
| total | numeric | Subtotal do item |

#### `serviceOrders` (Ordens de Serviço)
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid PK | Identificador |
| userId | uuid FK | Prestador |
| clientId | uuid FK | Cliente |
| quoteId | uuid FK | Orçamento vinculado (opcional) |
| number | integer | Numero sequencial |
| title | text | Título da OS |
| description | text | Descrição do serviço |
| status | text | aberta / em_andamento / aguardando / concluida / cancelada |
| priority | text | baixa / media / alta / urgente |
| notes | text | Observações |
| internalNotes | text | Notas internas |
| subtotal | numeric | Soma dos itens |
| discount | numeric | Desconto |
| total | numeric | Total |
| cashPrice | numeric | Valor à vista / Pix (opcional) |
| cardPrice | numeric | Valor no cartão (opcional) |
| cardInstallments | integer | Parcelas no cartão |
| scheduledAt | timestamp | Data agendada |
| completedAt | timestamp | Data de conclusão |
| createdAt | timestamp | Data de abertura |
| updatedAt | timestamp | Ultima atualização |

---

## 5. Tela de Login / Cadastro

### Estrutura
- **Painel esquerdo** (desktop): `bg-[#0f1729]` em ambos os temas — logo, headline, carrossel de screenshots e watermark do elefante neon
- **Painel direito**: Wallpaper de funcionalidades + orbs de glow + card com formulário
- **Tema**: Toggle dark/light via next-themes com `ThemeToggleButton` (Sun/Moon)
- **Logo**: `elevanthe-logo-transparent-dark.png` usada em ambos os temas

### Componentes da tela
| Componente | Localização | Função |
|---|---|---|
| `ThemedLogo` | auth-form.tsx | Exibe a logo correta pelo tema |
| `ThemeToggleButton` | auth-form.tsx | Alterna dark/light com ícone |
| `ScreenshotCarousel` | screenshot-carousel.tsx | 5 slides animados das telas do CRM |
| `FeatureWallpaper` | auth-form.tsx | 54 pills de funcionalidades com posição pseudo-aleatória seeded |
| `LoginChatWidget` | support/login-chat-widget.tsx | Chat assistente flutuante |

---

## 6. Chat Assistente (LoginChatWidget)

### Localização
`/components/support/login-chat-widget.tsx`

### Funcionalidades
- 20+ FAQs com keywords em português (com e sem acentos)
- Respostas em markdown simples (`**negrito**`)
- Sugestões clicáveis contextuais após cada resposta do bot
- 5 sugestões rápidas na abertura do chat
- Indicador de "digitando..." animado (3 pontos bounce)
- Botão minimizar / expandir / fechar
- Avatar personalizado (`/public/elevanthe-chatbot-logo.png`)

### Tópicos cobertos
Planos e preços, período grátis, funcionalidades completas, WhatsApp, Pix, orçamento público, ordens de serviço, relatórios, estoque, multi-usuário, multi-empresa, assinatura digital, personalização de marca, segurança e LGPD, recuperação de senha, criar conta, app mobile, suporte e atendimento, cancelamento, API e webhooks.

---

## 7. Módulo de Orçamentos

### Funcionalidades
- Criação e edição com itens dinâmicos (adicionar/remover)
- Desconto em R$ com recalculo automático
- **Condições de pagamento** (novo):
  - Valor à vista / Pix (`cashPrice`)
  - Valor no cartão de crédito (`cardPrice`) + número de parcelas (`cardInstallments` — 1x a 12x)
  - Preview em tempo real do resumo de pagamento
- Status: rascunho / enviado / aprovado / recusado
- Link público para o cliente aprovar sem fazer login

---

## 8. Módulo de Ordens de Serviço

### Funcionalidades
- Criação vinculada a cliente e/ou orçamento
- Status com pipeline visual (Aberta → Em andamento → Aguardando → Concluída)
- Itens de serviço com preços unitários
- **Condições de pagamento**: valor à vista, cartão de crédito em parcelas
- Prioridade (baixa, média, alta, urgente)
- Agendamento com data/hora

---

## 9. Design System

### Cores (tokens CSS em globals.css)
- `--primary`: Azul Elevanthe (`#2563eb` no dark)
- `--background`: Fundo principal (`#0a0a10` dark / `#eef2fa` light)
- `--foreground`: Texto principal
- `--muted`: Elementos secundários
- `--border`: Bordas sutis

### Tipografia
- **Headings**: Geist Sans, peso 800–900
- **Body**: Geist Sans, peso 400–500
- **Mono**: Geist Mono (código e valores)

### Padrões visuais
- Cards: `rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-md`
- Orbs de glow decorativos nos painéis
- Grade de pontos radial no bg do painel do formulário

---

## 10. Histórico de Alterações

| Data | Alteração |
|---|---|
| 2026-06-27 | Carrossel de screenshots animado na tela de login |
| 2026-06-27 | Logos dark/light transparentes sem fundo |
| 2026-06-27 | Toggle de tema dark/light |
| 2026-06-27 | Wallpaper de funcionalidades espalhado aleatoriamente (seeded LCG) |
| 2026-06-27 | Favicon do elefante Elevanthe |
| 2026-06-27 | Tema light corrigido (painel esquerdo azul escuro) |
| 2026-06-27 | Chat assistente com 20+ FAQs e sugestões clicáveis |
| 2026-06-27 | Logo personalizada no chat (avatar do elefante) |
| 2026-06-28 | Campos de cartão de crédito nos orçamentos (schema + UI) |
| 2026-06-28 | Migration Neon: cashPrice, cardPrice, cardInstallments na tabela quotes |
| 2026-06-28 | Documentação do projeto criada (este arquivo) |
