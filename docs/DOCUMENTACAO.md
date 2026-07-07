# Elevanthe CRM — Documentação Técnica Completa

> Ultima atualização: 2026-07-07
> Branch ativo: `v0/elevanthe-dev-7cfb1282`

---

## 1. Visão Geral

O **Elevanthe CRM** é uma plataforma SaaS de gestão voltada para prestadores de serviço e pequenas empresas brasileiras. Centraliza em um único sistema: clientes, orçamentos, ordens de serviço, controle financeiro, cobranças via Pix, notificações por WhatsApp, emissão de documentos públicos (PDF), suporte ao cliente e gestão de equipe.

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
| Pagamentos | Mercado Pago (Checkout Pro + PIX) |
| WhatsApp | Z-API |
| E-mail transacional | Resend |
| Anti-spam | Cloudflare Turnstile |
| PWA | Web App Manifest + Service Worker |
| Deploy | Vercel |

---

## 3. Estrutura de Arquivos

```
/
├── app/
│   ├── layout.tsx                        # Layout raiz — metadata, fontes, ThemeProvider, PWA
│   ├── globals.css                       # Tokens de design (Tailwind v4 @theme)
│   ├── page.tsx                          # Landing page pública
│   ├── sign-in/page.tsx                  # Login
│   ├── sign-up/page.tsx                  # Cadastro
│   ├── esqueci-senha/page.tsx            # Recuperação de senha (solicitar)
│   ├── reset-password/page.tsx           # Redefinir senha via token
│   ├── sessao-encerrada/page.tsx         # Sessão expirada
│   ├── demo/page.tsx                     # Tour/demo sem cadastro
│   ├── aceitar-convite/page.tsx          # Aceitar convite de funcionário
│   ├── planos/
│   │   ├── page.tsx                      # Planos para usuário autenticado
│   │   ├── publico/page.tsx              # Planos públicos (sem login)
│   │   └── sucesso/page.tsx              # Confirmação de pagamento
│   ├── orcamento/[id]/page.tsx           # Documento público do orçamento (cliente)
│   ├── ordem-servico/[id]/page.tsx       # Documento público da OS (cliente)
│   ├── recibo/[id]/page.tsx              # Recibo público da OS concluída
│   ├── admin/
│   │   ├── page.tsx                      # Painel administrativo SaaS
│   │   └── login/page.tsx                # Login admin
│   ├── dashboard/
│   │   ├── layout.tsx                    # Layout autenticado (sidebar + watcher)
│   │   ├── page.tsx                      # Dashboard principal
│   │   ├── clientes/page.tsx             # Módulo de clientes
│   │   ├── orcamentos/page.tsx           # Módulo de orçamentos
│   │   ├── ordens-servico/page.tsx       # Módulo de ordens de serviço
│   │   ├── financeiro/page.tsx           # Módulo financeiro
│   │   ├── relatorios/page.tsx           # Módulo de relatórios
│   │   ├── servicos/page.tsx             # Catálogo de serviços
│   │   ├── configuracoes/page.tsx        # Configurações da conta
│   │   ├── atualizacoes/page.tsx         # Patch notes / novidades
│   │   └── suporte/
│   │       ├── page.tsx                  # Lista de tickets de suporte
│   │       └── [id]/page.tsx             # Chat de ticket individual
│   └── api/
│       ├── auth/[...all]/route.ts        # Better Auth handler
│       ├── turnstile/route.ts            # Validação Cloudflare Turnstile
│       ├── notifications/quotes/route.ts # Notificação de resposta de orçamento
│       ├── relatorios/pdf/route.ts       # Geração de PDF de relatórios
│       ├── support/
│       │   ├── messages/route.ts         # Mensagens de suporte
│       │   └── upload/route.ts           # Upload de anexos de suporte
│       ├── mercadopago/
│       │   ├── checkout/route.ts         # Criar sessão Checkout Pro
│       │   ├── pix/route.ts              # Gerar cobrança PIX
│       │   ├── status/route.ts           # Consultar status do pagamento
│       │   └── webhook/route.ts          # Webhook Mercado Pago (ativar licença)
│       └── admin/
│           ├── login/route.ts            # Login admin por token
│           ├── geoip/route.ts            # Geolocalização por IP
│           ├── promo/route.ts            # Gestão de códigos promocionais
│           ├── support/messages/route.ts # Mensagens de suporte pelo admin
│           └── zapi/
│               ├── status/route.ts       # Status da instância Z-API
│               ├── qrcode/route.ts       # QR Code para conectar WhatsApp
│               ├── test/route.ts         # Envio de mensagem de teste
│               └── disconnect/route.ts   # Desconectar instância
│
├── components/
│   ├── auth-form.tsx                     # Formulário de login/cadastro
│   ├── pwa-banner.tsx                    # Banner de instalação PWA customizado
│   ├── intro-video-overlay.tsx           # Overlay de vídeo introdutório
│   ├── theme-provider.tsx                # Provedor next-themes
│   ├── theme-toggle.tsx                  # Botão dark/light
│   ├── screenshot-carousel.tsx           # Carrossel de screenshots
│   ├── pricing-cards.tsx                 # Cards de planos (público)
│   ├── turnstile-widget.tsx              # Widget anti-bot Cloudflare
│   ├── dashboard/
│   │   ├── app-sidebar.tsx               # Sidebar de navegação
│   │   ├── stats-cards.tsx               # Cards de métricas
│   │   ├── dashboard-chart.tsx           # Gráfico de receita
│   │   ├── recent-activity.tsx           # Log de atividades recentes
│   │   ├── revenue-goal-card.tsx         # Card de meta de faturamento
│   │   ├── birthday-clients-card.tsx     # Aniversariantes do mês
│   │   ├── license-watcher.tsx           # Monitor de licença expirada
│   │   ├── quote-notifications-provider.tsx  # Polling de notificações de orçamento
│   │   ├── breadcrumb.tsx                # Breadcrumb de navegação
│   │   └── access-denied.tsx             # Tela de acesso negado (sem permissão)
│   ├── clientes/
│   │   ├── clients-table.tsx             # Tabela + CRUD de clientes
│   │   └── inactive-clients-panel.tsx    # Painel de clientes inativos
│   ├── orcamentos/
│   │   ├── quotes-view.tsx               # Módulo completo de orçamentos
│   │   └── public-quote-view.tsx         # Documento público (cliente aprova/recusa)
│   ├── ordens-servico/
│   │   ├── service-orders-view.tsx       # Módulo completo de OS
│   │   ├── public-service-order-view.tsx # Documento público da OS
│   │   └── public-receipt-view.tsx       # Recibo público
│   ├── financeiro/
│   │   └── finance-view.tsx              # Módulo financeiro
│   ├── relatorios/
│   │   └── reports-view.tsx              # Módulo de relatórios
│   ├── servicos/
│   │   └── services-table.tsx            # Catálogo de serviços
│   ├── configuracoes/
│   │   ├── configuracoes-view.tsx        # Configurações completas da conta
│   │   └── employee-manager.tsx          # Gestão de funcionários
│   ├── planos/
│   │   ├── planos-view.tsx               # Página de planos (autenticado)
│   │   └── pix-checkout-modal.tsx        # Modal de pagamento PIX
│   ├── support/
│   │   ├── suporte-view.tsx              # Lista de tickets
│   │   ├── ticket-chat.tsx               # Chat do ticket
│   │   ├── login-chat-widget.tsx         # Chat assistente na tela de login
│   │   └── whatsapp-button.tsx           # Botão flutuante WhatsApp de suporte
│   ├── atualizacoes/
│   │   └── patch-notes-view.tsx          # Novidades e patch notes
│   └── admin/
│       ├── admin-dashboard.tsx           # Painel admin SaaS completo
│       └── admin-tickets.tsx             # Tickets de suporte (admin)
│
├── lib/
│   ├── actions.ts                        # Todas as Server Actions (ver seção 6)
│   ├── auth.ts                           # Configuração Better Auth
│   ├── auth-client.ts                    # Cliente Better Auth (browser)
│   ├── email.ts                          # Templates de e-mail (Resend)
│   ├── products.ts                       # Definição dos planos de licença
│   ├── utils.ts                          # Utilitários (cn, formatCurrency, etc.)
│   └── db/
│       ├── index.ts                      # Conexão Drizzle + Neon
│       └── schema.ts                     # Schema completo do banco
│
└── public/
    ├── manifest.json                     # Web App Manifest (PWA)
    ├── sw.js                             # Service Worker
    ├── pwa-icon-192.png                  # Ícone PWA 192x192
    ├── pwa-icon-512.png                  # Ícone PWA 512x512
    ├── pwa-icon-maskable-512.png         # Ícone maskable (Android)
    ├── apple-icon.png                    # Apple Touch Icon
    ├── elevanthe-logo-transparent-dark.png
    ├── elevanthe-logo-transparent-light.png
    ├── elevanthe-logo-neon.png
    ├── elevanthe-chatbot-logo.png
    ├── screenshots/                      # Screenshots para rich install banner
    └── splash/                           # Splash screens iOS
```

---

## 4. Banco de Dados (Neon + Drizzle)

### Tabelas

#### `user`
Gerenciada pelo Better Auth. Armazena dados de autenticação e licença.

| Campo | Tipo | Descrição |
|---|---|---|
| id | text PK | Identificador Better Auth |
| name | text | Nome completo |
| email | text | E-mail único |
| emailVerified | boolean | E-mail verificado |
| image | text | Avatar |
| accessExpiresAt | timestamp | Expiração da licença |
| createdAt | timestamp | Data de cadastro |

#### `clients`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid PK | Identificador |
| userId | text FK | Prestador dono do cliente |
| name | text | Nome |
| email | text | E-mail |
| phone | text | Telefone / WhatsApp |
| cpfCnpj | text | CPF ou CNPJ |
| address | text | Endereço |
| birthdate | date | Data de nascimento (aniversário) |
| createdAt | timestamp | Cadastro |

#### `services`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid PK | Identificador |
| userId | text FK | Prestador |
| name | text | Nome do serviço |
| description | text | Descrição |
| price | numeric | Preço padrão |
| createdAt | timestamp | Cadastro |

#### `quotes` (Orçamentos)
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid PK | Identificador |
| userId | text FK | Prestador |
| clientId | uuid FK | Cliente |
| number | integer | Número sequencial |
| title | text | Título |
| status | text | rascunho / enviado / aprovado / recusado |
| validUntil | text | Validade |
| notes | text | Observações para o cliente |
| internalNotes | text | Notas internas |
| subtotal | numeric | Soma dos itens |
| discount | numeric | Desconto em R$ |
| total | numeric | Total final |
| cashPrice | numeric | Valor à vista / Pix |
| cardPrice | numeric | Valor no cartão |
| cardInstallments | integer | Parcelas (1–12) |
| rejectionReason | text | Motivo da recusa |
| respondedAt | timestamp | Data da resposta |
| createdAt / updatedAt | timestamp | Controle de tempo |

#### `quoteItems`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid PK | Identificador |
| quoteId | uuid FK | Orçamento pai |
| serviceId | uuid FK | Serviço do catálogo (opcional) |
| description | text | Descrição do item |
| quantity | numeric | Quantidade |
| unitPrice | numeric | Preço unitário |
| total | numeric | Subtotal |

#### `serviceOrders` (Ordens de Serviço)
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid PK | Identificador |
| userId | text FK | Prestador |
| clientId | uuid FK | Cliente |
| quoteId | uuid FK | Orçamento vinculado (opcional) |
| number | integer | Número sequencial |
| title | text | Título |
| description | text | Descrição |
| status | text | aberta / em_andamento / aguardando / concluida / cancelada |
| priority | text | baixa / media / alta / urgente |
| notes | text | Observações |
| internalNotes | text | Notas internas |
| subtotal / discount / total | numeric | Valores |
| cashPrice / cardPrice | numeric | Formas de pagamento |
| cardInstallments | integer | Parcelas |
| scheduledAt | timestamp | Data agendada |
| completedAt | timestamp | Data de conclusão |
| createdAt / updatedAt | timestamp | Controle de tempo |

#### `serviceOrderItems`
Itens da OS, estrutura similar a `quoteItems`.

#### `transactions` (Financeiro)
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid PK | Identificador |
| userId | text FK | Prestador |
| type | text | receita / despesa |
| category | text | Categoria |
| description | text | Descrição |
| amount | numeric | Valor |
| date | text | Data |
| quoteId | uuid FK | Orçamento vinculado (opcional) |
| serviceOrderId | uuid FK | OS vinculada (opcional) |

#### `businessProfile`
| Campo | Tipo | Descrição |
|---|---|---|
| userId | text PK/FK | Prestador |
| name | text | Nome da empresa |
| document | text | CNPJ/CPF |
| phone | text | Telefone |
| email | text | E-mail |
| address | text | Endereço |
| logo | text | URL do logo (upload) |
| primaryColor | text | Cor primária dos documentos |
| docAccentColor | text | Cor de destaque dos documentos |
| docFooter | text | Rodapé personalizado dos documentos |
| quoteWhatsappTemplate | text | Template WhatsApp para envio de orçamento |
| requireSignature | boolean | Exigir assinatura digital na aprovação |
| defaultQuoteValidDays | integer | Validade padrão de orçamentos (dias) |
| monthlyRevenueGoal | numeric | Meta mensal de faturamento |
| whatsappPhone | text | Número para notificações WhatsApp |
| pixKey | text | Chave Pix |

#### `promoCodes`
Códigos promocionais para ativação de licença. Gerenciados pelo admin.

#### `supportTickets` e `supportMessages`
Sistema de suporte integrado com chat em tempo real (polling).

#### `payments`
Registro de pagamentos via Mercado Pago (Checkout Pro e PIX).

#### `employeeInvites` e `employeePermissions`
Gestão de equipe: convite por e-mail, permissões granulares por módulo.

#### `activityLog`
Log de atividades do usuário (criou orçamento, aprovou OS, etc.).

#### `patchNotes`
Registro de atualizações e novidades publicadas pelo admin.

#### `saasConfig`
Configurações globais da plataforma (gerenciadas pelo admin).

---

## 5. Planos de Licença

Definidos em `lib/products.ts`:

| Plano | Duração | Descrição |
|---|---|---|
| `7d` | 7 dias | Trial / teste |
| `30d` | 30 dias | Mensal |
| `1y` | 365 dias | Anual |

Os planos de funcionalidade (Start, Business, Enterprise) são controlados pela data de expiração (`accessExpiresAt`) e pelo guard `PlanGate` nos componentes. Usuário sem licença ativa cai na tela de planos.

---

## 6. Server Actions (`lib/actions.ts`)

Todas as mutations e queries principais da plataforma são Server Actions do Next.js.

### Autenticação e Identidade

| Função | Descrição |
|---|---|
| `getEffectiveUserId()` | Retorna o ID efetivo do usuário — se for funcionário, retorna o ID do dono da conta |
| `getMyPermissions()` | Retorna as permissões do funcionário logado (quais módulos pode ver/editar) |

### Licença

| Função | Descrição |
|---|---|
| `getUserLicense()` | Retorna dados da licença do usuário (expiração, ativo, dias restantes) |
| `getUserLicensePlan()` | Retorna o slug do plano atual ("start", "business", "enterprise") |
| `activateLicense(plan)` | Ativa uma licença pelo plano (7d, 30d, 1y) |
| `redeemPromoCode(code)` | Valida e resgata um código promocional, ativando a licença correspondente |

### Clientes

| Função | Descrição |
|---|---|
| `getClients()` | Lista todos os clientes do usuário autenticado |
| `createClient(data)` | Cria um novo cliente com nome, e-mail, telefone, CPF/CNPJ, endereço e data de nascimento |
| `updateClient(id, data)` | Atualiza dados de um cliente existente |
| `deleteClient(id)` | Remove um cliente (e suas dependências) |
| `getClientHistory(clientId)` | Retorna histórico de orçamentos e OS de um cliente específico |
| `getInactiveClients(days)` | Lista clientes sem interação (orçamento ou OS) nos últimos N dias |
| `getBirthdayClients()` | Retorna clientes aniversariantes do mês atual |

### Serviços (Catálogo)

| Função | Descrição |
|---|---|
| `getServices()` | Lista todos os serviços do catálogo do prestador |
| `createService(data)` | Cria um serviço com nome, descrição e preço |
| `updateService(id, data)` | Atualiza um serviço |
| `deleteService(id)` | Remove um serviço do catálogo |

### Orçamentos

| Função | Descrição |
|---|---|
| `getQuotes()` | Lista todos os orçamentos do usuário |
| `getNextQuoteNumber(userId)` | Retorna o próximo número sequencial de orçamento |
| `createQuote(data)` | Cria um orçamento com itens, desconto, condições de pagamento e validade |
| `updateQuote(id, data)` | Atualiza um orçamento existente (itens, valores, status) |
| `updateQuoteStatus(id, status)` | Atualiza apenas o status do orçamento |
| `deleteQuote(id)` | Remove um orçamento |
| `getQuoteWithItems(id)` | Busca orçamento com seus itens (para edição) |
| `respondQuote(id, action, reason?)` | Cliente aprova ou recusa o orçamento pelo link público; cria transação financeira automaticamente ao aprovar e envia e-mail de notificação |

### Ordens de Serviço

| Função | Descrição |
|---|---|
| `getServiceOrders()` | Lista todas as OS do usuário |
| `getNextServiceOrderNumber(userId)` | Próximo número sequencial |
| `createServiceOrder(data)` | Cria OS com itens, cliente, orçamento vinculado, prioridade e agendamento |
| `updateServiceOrderStatus(id, status, data?)` | Atualiza status da OS e campos relacionados (data de conclusão, notas) |
| `getServiceOrderWithItems(id)` | Busca OS com itens (para edição) |
| `getServiceOrderForReceipt(id)` | Busca OS para exibição do recibo público |
| `deleteServiceOrder(id)` | Remove uma OS |

### Financeiro

| Função | Descrição |
|---|---|
| `getTransactions()` | Lista todas as transações financeiras |
| `createTransaction(data)` | Cria uma transação (receita ou despesa) manualmente |
| `updateTransaction(id, data)` | Atualiza uma transação |
| `deleteTransaction(id)` | Remove uma transação |

### Perfil e Configurações

| Função | Descrição |
|---|---|
| `getBusinessProfile()` | Retorna o perfil da empresa do usuário |
| `upsertBusinessProfile(data)` | Cria ou atualiza o perfil (nome, logo, cores, chave Pix, templates, metas, etc.) |

### Relatórios e Dashboard

| Função | Descrição |
|---|---|
| `getReportData(days)` | Retorna dados consolidados para relatórios: receita total, por categoria, tickets, top clientes, orçamentos por status — filtrável por período (7, 30, 60, 90 dias) |
| `getDashboardStats()` | Retorna métricas do dashboard: receita do mês, orçamentos pendentes, clientes ativos, OS em aberto, gráfico de receita, meta mensal, aniversariantes |
| `getActivityLog(limit)` | Retorna log de atividades recentes do usuário |

### Gestão de Equipe

| Função | Descrição |
|---|---|
| `getEmployeeData()` | Lista funcionários, convites pendentes e permissões |
| `inviteEmployee(email)` | Envia convite por e-mail para um funcionário |
| `cancelEmployeeInvite(inviteId)` | Cancela um convite pendente |
| `updateEmployeePermissions(permId, perms)` | Atualiza permissões granulares de um funcionário (clientes, orçamentos, OS, financeiro, relatórios, etc.) |
| `removeEmployee(permId)` | Remove um funcionário da equipe |
| `acceptEmployeeInvite(token)` | Aceita um convite de funcionário via token do e-mail |

### Suporte

| Função | Descrição |
|---|---|
| `createSupportTicket(data)` | Abre um novo ticket de suporte com título e mensagem inicial |
| `getSupportTickets()` | Lista todos os tickets do usuário |
| `getSupportTicket(id)` | Retorna um ticket com todas as mensagens |
| `sendSupportMessage(ticketId, content, attachments?)` | Envia mensagem em um ticket aberto (com suporte a anexos) |
| `closeTicketByUser(ticketId)` | Encerra um ticket pelo usuário |

### Patch Notes / Atualizações

| Função | Descrição |
|---|---|
| `getPatchNotes()` | Lista patch notes publicadas (visíveis ao usuário) |
| `getSaasConfig()` | Retorna configurações globais do SaaS |

### Admin — Usuários e Licenças

| Função | Descrição |
|---|---|
| `adminGetStats()` | Métricas completas do SaaS: total de usuários, receita, licenças ativas, tickets abertos, últimos cadastros |
| `adminGetPayments()` | Lista todos os pagamentos realizados na plataforma |
| `adminUpdateUser(userId, data)` | Atualiza dados de um usuário (nome, e-mail, expiração da licença) |
| `adminSendPasswordReset(userId)` | Envia e-mail de redefinição de senha para um usuário |
| `adminExtendLicense(userId, days)` | Estende a licença de um usuário por N dias |
| `adminRevokeAccess(userId)` | Revoga imediatamente o acesso de um usuário |
| `adminDeleteUser(userId)` | Remove permanentemente um usuário e todos seus dados |
| `verifyResetToken(token, userId)` | Valida um token de reset de senha |
| `updatePasswordByToken(token, userId, newPassword)` | Redefine a senha via token |

### Admin — Códigos Promocionais

| Função | Descrição |
|---|---|
| `adminCreatePromoCode(data)` | Cria um código promocional com plano, duração e limite de usos |
| `adminGetPromoCodes()` | Lista todos os códigos (ativos, expirados, esgotados) |
| `adminDeletePromoCode(id)` | Remove um código promocional |

### Admin — Suporte

| Função | Descrição |
|---|---|
| `adminGetTickets()` | Lista todos os tickets de suporte de todos os usuários |
| `adminGetTicket(id)` | Retorna ticket com mensagens para o admin |
| `adminReplyTicket(ticketId, content)` | Admin responde um ticket |
| `adminSendDirectMessage(userId, message)` | Admin envia mensagem direta para um usuário (abre ticket automaticamente) |
| `adminUpdateTicketStatus(ticketId, status)` | Admin altera status do ticket (aberto, respondido, fechado) |

### Admin — Patch Notes e Config

| Função | Descrição |
|---|---|
| `adminGetPatchNotes()` | Lista todas as patch notes (incluindo rascunhos) |
| `adminCreatePatchNote(data)` | Cria uma patch note com título, conteúdo, versão e status |
| `adminUpdatePatchNote(id, data)` | Atualiza uma patch note |
| `adminDeletePatchNote(id)` | Remove uma patch note |
| `adminSaveSaasConfig(data)` | Salva configurações globais do SaaS |

---

## 7. Rotas de API

### Autenticação
| Rota | Método | Descrição |
|---|---|---|
| `/api/auth/[...all]` | GET/POST | Handler completo do Better Auth |
| `/api/turnstile` | POST | Valida token do Cloudflare Turnstile |

### Pagamentos (Mercado Pago)
| Rota | Método | Descrição |
|---|---|---|
| `/api/mercadopago/checkout` | POST | Cria preferência de pagamento (Checkout Pro) |
| `/api/mercadopago/pix` | POST | Gera cobrança PIX com QR Code |
| `/api/mercadopago/status` | GET | Consulta status de um pagamento |
| `/api/mercadopago/webhook` | POST | Recebe eventos do Mercado Pago e ativa licença automaticamente |

### Notificações
| Rota | Método | Descrição |
|---|---|---|
| `/api/notifications/quotes` | GET | Polling de notificações de orçamentos respondidos (aprovado/recusado) |

### Relatórios
| Rota | Método | Descrição |
|---|---|---|
| `/api/relatorios/pdf` | POST | Gera e retorna PDF do relatório |

### Suporte
| Rota | Método | Descrição |
|---|---|---|
| `/api/support/messages` | GET/POST | Mensagens de tickets de suporte |
| `/api/support/upload` | POST | Upload de anexos em tickets |

### Admin
| Rota | Método | Descrição |
|---|---|---|
| `/api/admin/login` | POST | Autenticação admin via ADMIN_SECRET |
| `/api/admin/geoip` | GET | Geolocalização de IPs dos usuários |
| `/api/admin/promo` | GET/POST/DELETE | Gestão de códigos promocionais |
| `/api/admin/support/messages` | GET/POST | Mensagens de suporte pelo painel admin |
| `/api/admin/zapi/status` | GET | Status da instância Z-API (WhatsApp) |
| `/api/admin/zapi/qrcode` | GET | QR Code para conectar WhatsApp |
| `/api/admin/zapi/test` | POST | Envia mensagem de teste via Z-API |
| `/api/admin/zapi/disconnect` | POST | Desconecta a instância Z-API |

---

## 8. Módulos do Dashboard

### Dashboard Principal
- Cards de métricas: receita do mês, orçamentos pendentes, clientes ativos, OS em aberto
- Gráfico de receita mensal (barras)
- Meta de faturamento com barra de progresso
- Aniversariantes do mês com botão de WhatsApp
- Log de atividades recentes
- Monitor de licença com alerta de expiração próxima

### Clientes
- Tabela com busca e filtros
- CRUD completo (criar, editar, excluir)
- Aba "Sem contato" — clientes inativos filtrável por 30/60/90/180 dias
- Botão de WhatsApp direto por cliente
- Histórico de orçamentos e OS por cliente

### Orçamentos
- Criação com itens dinâmicos do catálogo ou avulsos
- Desconto em R$ com recalculo automático
- Condições de pagamento: à vista/Pix + cartão de crédito em parcelas (1–12x)
- Status pipeline: Rascunho → Enviado → Aprovado/Recusado
- Link público de aprovação (cliente aprova/recusa sem login)
- Envio via WhatsApp com template customizável
- Notificação em tempo real quando o cliente responde

### Ordens de Serviço
- Criação vinculada a cliente e/ou orçamento existente
- Status pipeline visual: Aberta → Em andamento → Aguardando → Concluída
- Prioridade: baixa, média, alta, urgente
- Agendamento com data e hora
- Itens de serviço com valores
- Recibo público ao concluir

### Financeiro
- Lançamentos manuais de receitas e despesas
- Transações automáticas ao aprovar orçamentos
- Filtros por período e categoria
- Resumo: total receitas, total despesas, saldo

### Relatórios
- Filtro por período: 7, 30, 60, 90 dias
- Receita total, ticket médio, taxa de conversão
- Receita por categoria
- Top clientes por faturamento
- Orçamentos por status
- Exportação em PDF

### Serviços (Catálogo)
- CRUD de serviços com nome, descrição e preço padrão
- Usados como atalho na criação de orçamentos e OS

### Configurações
- **Perfil**: nome, logo, CNPJ, telefone, e-mail, endereço
- **Documentos**: cor primária, cor de destaque, rodapé personalizado (Business+)
- **Automações**: template de WhatsApp para envio de orçamento (Business+), validade padrão de orçamentos
- **Metas**: meta de faturamento mensal
- **Pagamentos**: chave Pix para cobrança nos documentos públicos
- **Notificações**: WhatsApp para receber alertas (em desenvolvimento)
- **Segurança**: alterar senha
- **Plano**: status da licença, botão de upgrade
- **Equipe**: convidar funcionários, definir permissões por módulo

### Suporte
- Criar tickets com título e descrição
- Chat em tempo real com a equipe de suporte
- Upload de anexos
- Histórico de tickets abertos e fechados

### Atualizações
- Lista de patch notes com versão, data e conteúdo formatado

---

## 9. Painel Admin SaaS

Acessível em `/admin` com autenticação por token (`ADMIN_SECRET`).

### Abas

| Aba | Funcionalidades |
|---|---|
| **Visão Geral** | Métricas do SaaS: usuários, receita, licenças, tickets |
| **Licenças** | Lista usuários, extender licença, revogar acesso |
| **Usuários** | Editar dados, redefinir senha, banir, excluir |
| **Códigos Promo** | Criar/excluir códigos com plano, dias e limite de usos |
| **Suporte** | Ver e responder tickets; mensagem direta para usuários |
| **Métricas** | Gráficos de crescimento e receita |
| **Pagamentos** | Histórico de todos os pagamentos |
| **WhatsApp** | Status Z-API, QR Code, teste de envio, gerenciar instância |
| **Atualizações** | Criar e gerenciar patch notes |
| **Configurações** | Configurações globais do SaaS |

---

## 10. PWA (Progressive Web App)

- **Manifest**: `/public/manifest.json` — nome, ícones (192, 512, maskable), cores, orientação, screenshots
- **Service Worker**: `/public/sw.js` — cache de assets estáticos, Network First para HTML, sem cache de chunks JS do Next.js
- **Ícones**: `pwa-icon-192.png`, `pwa-icon-512.png`, `pwa-icon-maskable-512.png`, `apple-icon.png`
- **Splash screens iOS**: 5 tamanhos para iPhone SE até iPhone 14 Pro Max
- **Banner customizado**: `PwaInstallBanner` intercepta o evento `beforeinstallprompt` e exibe banner próprio com identidade visual da marca

---

## 11. E-mails Transacionais (`lib/email.ts`)

| Função | Gatilho |
|---|---|
| `sendQuoteResponseEmail` | Cliente aprova ou recusa orçamento |
| `sendEmployeeInviteEmail` | Convite de funcionário enviado |
| `sendPurchaseConfirmationEmail` | Pagamento confirmado (licença ativada) |
| `sendInviteAcceptedEmail` | Funcionário aceita convite |
| `sendPasswordResetEmail` | Solicitação de reset de senha |

---

## 12. Design System

### Cores (tokens em `globals.css`)
| Token | Valor dark | Valor light | Uso |
|---|---|---|---|
| `--background` | `#0a0a10` | `#eef2fa` | Fundo principal |
| `--foreground` | `#f0f4ff` | `#0d1117` | Texto principal |
| `--primary` | `#2563eb` | `#1d4ed8` | Ações primárias |
| `--muted` | `#1a1f2e` | `#e2e8f5` | Elementos secundários |
| `--border` | `rgba(255,255,255,0.07)` | `rgba(0,0,0,0.08)` | Bordas |

### Tipografia
- **Headings + Body**: Geist Sans
- **Mono**: Geist Mono (valores, códigos)

### Padrões visuais
- Cards: `rounded-xl border bg-card`
- Formulários: `bg-input border-border`
- Botão primário: `bg-primary text-primary-foreground`

---

## 13. Histórico de Alterações

| Data | Versão | Alteração |
|---|---|---|
| 2026-06-27 | — | Carrossel de screenshots, logos dark/light, toggle de tema, wallpaper de funcionalidades |
| 2026-06-27 | — | Favicon, chat assistente com 20+ FAQs |
| 2026-06-28 | — | Campos de cartão de crédito em orçamentos (cashPrice, cardPrice, cardInstallments) |
| 2026-06-28 | — | Documentação inicial criada |
| 2026-06-29 | — | Módulo de Ordens de Serviço completo |
| 2026-06-30 | — | Módulo Financeiro, Relatórios com PDF, Catálogo de Serviços |
| 2026-07-01 | — | Sistema de planos e pagamento via Mercado Pago (Checkout Pro + PIX) |
| 2026-07-02 | — | Gestão de equipe com convite por e-mail e permissões granulares |
| 2026-07-03 | — | Dashboard com meta de faturamento e aniversariantes; clientes inativos |
| 2026-07-04 | — | Painel Admin SaaS completo (licenças, usuários, promo codes, suporte, métricas) |
| 2026-07-05 | — | Suporte integrado com chat em tempo real e upload de anexos |
| 2026-07-06 | — | Integração Z-API (WhatsApp): painel admin, status, QR Code, teste de envio |
| 2026-07-06 | — | PWA melhorado: novos ícones, splash screens iOS, banner customizado de instalação |
| 2026-07-07 | — | Documentação completa atualizada; notificações WhatsApp bloqueadas (em desenvolvimento) |
