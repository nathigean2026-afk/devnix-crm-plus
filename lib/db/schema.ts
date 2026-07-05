import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// ── Better Auth tables ───────────────────────────────────────────────────────
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  accessExpiresAt: timestamp("accessExpiresAt"),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// ── App tables ────────────────────────────────────────────────────────────────
export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  document: text("document"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  notes: text("notes"),
  birthdate: date("birthdate"), // data de nascimento para aniversariantes
  status: text("status").notNull().default("ativo"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const services = pgTable("services", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: text("unit").notNull().default("un"),
  category: text("category"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const quotes = pgTable("quotes", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  clientId: text("clientId").notNull(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("rascunho"),
  validUntil: date("validUntil"),
  notes: text("notes"),
  internalNotes: text("internalNotes"),
  rejectionReason: text("rejectionReason"),
  respondedAt: timestamp("respondedAt"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  cashPrice: numeric("cashPrice", { precision: 10, scale: 2 }),
  cardPrice: numeric("cardPrice", { precision: 10, scale: 2 }),
  cardInstallments: integer("cardInstallments").default(1),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const quoteItems = pgTable("quote_items", {
  id: text("id").primaryKey(),
  quoteId: text("quoteId").notNull(),
  serviceId: text("serviceId"),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: numeric("unitPrice", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  clientId: text("clientId"),
  quoteId: text("quoteId"),
  type: text("type").notNull(), // receita | despesa
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category"),
  dueDate: date("dueDate"),
  paidAt: date("paidAt"),
  status: text("status").notNull().default("pendente"), // pendente | pago | cancelado
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const businessProfile = pgTable("business_profile", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().unique(),
  name: text("name").notNull().default(""),
  document: text("document"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  website: text("website"),
  pixKey: text("pixKey"),
  pixType: text("pixType").default("cpf"),
  logo: text("logo"),
  notifAlertEnabled: boolean("notifAlertEnabled").notNull().default(false),
  notifQuoteEnabled: boolean("notifQuoteEnabled").notNull().default(true),
  whatsappPhone: text("whatsappPhone"), // número para notificações via Z-API
  licensePlan: text("licensePlan").default("starter"),
  docAccentColor: text("docAccentColor").default("#1d4ed8"), // cor de destaque dos documentos públicos
  quoteDefaultValidity: integer("quoteDefaultValidity").default(30), // validade padrão de orçamentos em dias
  quoteWhatsappTemplate: text("quoteWhatsappTemplate"), // template de mensagem ao enviar orçamento
  docFooter: text("docFooter"), // rodapé personalizado nos documentos (Business+)
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const promoCodes = pgTable("promo_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  planName: text("planName").notNull(),
  days: integer("days").notNull(),
  durationMinutes: integer("durationMinutes").notNull().default(1440),
  usedBy: text("usedBy"),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt"),
})

export const serviceOrders = pgTable("service_orders", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  clientId: text("clientId").notNull(),
  quoteId: text("quoteId"),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("aberto"),
  pixKey: text("pixKey"),
  pixType: text("pixType").default("cpf"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  discountType: text("discountType").default("valor"),
  discountExpiry: date("discountExpiry"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  cashPrice: numeric("cashPrice", { precision: 10, scale: 2 }),
  cardPrice: numeric("cardPrice", { precision: 10, scale: 2 }),
  cardInstallments: integer("cardInstallments").default(1),
  notes: text("notes"),
  internalNotes: text("internalNotes"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const serviceOrderItems = pgTable("service_order_items", {
  id: text("id").primaryKey(),
  serviceOrderId: text("serviceOrderId").notNull(),
  serviceId: text("serviceId"),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: numeric("unitPrice", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// ── Support ───────────────────────────────────────────────────────────────────
export const supportTickets = pgTable("support_tickets", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  subject: text("subject").notNull(),
  category: text("category").notNull().default("duvida"),
  status: text("status").notNull().default("aberto"),
  priority: text("priority").notNull().default("normal"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  closedAt: timestamp("closedAt"),
})

export const supportMessages = pgTable("support_messages", {
  id: text("id").primaryKey(),
  ticketId: text("ticketId").notNull(),
  authorId: text("authorId").notNull(),
  authorRole: text("authorRole").notNull().default("user"),
  body: text("body").notNull(),
  attachments: text("attachments").default("[]"), // JSON array de { name, url }
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// ── Payments ──────────────────────────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  mpPaymentId: text("mpPaymentId").notNull().unique(), // ID retornado pelo Mercado Pago
  planId: text("planId").notNull(),
  planName: text("planName").notNull(),
  amountCents: integer("amountCents").notNull(), // valor em centavos
  status: text("status").notNull().default("pending"), // pending | approved | rejected | cancelled
  paymentMethod: text("paymentMethod").notNull().default("pix"), // pix | credit_card | boleto
  durationDays: integer("durationDays").notNull().default(30),
  paidAt: timestamp("paidAt"),
  expiresLicenseAt: timestamp("expiresLicenseAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export type Payment = typeof payments.$inferSelect

// ── Employee (Enterprise) ─────────────────────────────────────────────────────
export const employeeInvites = pgTable("employee_invites", {
  id: text("id").primaryKey(),
  ownerId: text("ownerId").notNull().references(() => user.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"), // pending | accepted | cancelled
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
})

export const employeePermissions = pgTable("employee_permissions", {
  id: text("id").primaryKey(),
  ownerId: text("ownerId").notNull().references(() => user.id, { onDelete: "cascade" }),
  employeeId: text("employeeId").notNull().references(() => user.id, { onDelete: "cascade" }),
  canClients: boolean("canClients").notNull().default(false),
  canServices: boolean("canServices").notNull().default(false),
  canQuotes: boolean("canQuotes").notNull().default(false),
  canOrders: boolean("canOrders").notNull().default(false),
  canFinanceiro: boolean("canFinanceiro").notNull().default(false),
  canRelatorios: boolean("canRelatorios").notNull().default(false),
  // Novas permissões
  canDashboard: boolean("canDashboard").notNull().default(true),   // dashboard aberto por padrão
  canDelete: boolean("canDelete").notNull().default(false),        // excluir registros
  canSendQuotes: boolean("canSendQuotes").notNull().default(false), // enviar orçamentos ao cliente
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// ── Activity Log ──────────────────────────────────────────────────────────────
// Registra todas as ações do funcionário para auditoria pelo dono da empresa.
export const activityLog = pgTable("activity_log", {
  id: text("id").primaryKey(),
  ownerId: text("ownerId").notNull(),   // prestador (dono) dono dos dados
  employeeId: text("employeeId").notNull(), // quem realizou a ação
  employeeName: text("employeeName"),   // snapshot do nome no momento da ação
  action: text("action").notNull(),     // "create" | "update" | "delete" | "send"
  module: text("module").notNull(),     // "clientes" | "servicos" | "orcamentos" | "ordens" | "financeiro"
  description: text("description").notNull(), // texto legível: "Criou o cliente João Silva"
  recordId: text("recordId"),           // id do registro afetado (opcional)
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Configurações globais do SaaS (singleton — id fixo = 'singleton')
export const saasConfig = pgTable("saas_config", {
  id: text("id").primaryKey().default("singleton"),
  maintenanceMode: boolean("maintenanceMode").notNull().default(false),
  supportEmail: text("supportEmail").notNull().default("suporte@elevanthe.com.br"),
  maxClientsStarter: integer("maxClientsStarter").notNull().default(50),
  maxClientsProf: integer("maxClientsProf").notNull().default(300),
  maxOsStarter: integer("maxOsStarter").notNull().default(100),
  trialDays: integer("trialDays").notNull().default(0),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// ── Types ─────────────────────────────────────────────────────────────────────
export type User = typeof user.$inferSelect
export type Client = typeof clients.$inferSelect
export type Service = typeof services.$inferSelect
export type Quote = typeof quotes.$inferSelect
export type QuoteItem = typeof quoteItems.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type BusinessProfile = typeof businessProfile.$inferSelect
export type ServiceOrder = typeof serviceOrders.$inferSelect
export type ServiceOrderItem = typeof serviceOrderItems.$inferSelect
export type PromoCode = typeof promoCodes.$inferSelect
export type SupportTicket = typeof supportTickets.$inferSelect
export type SupportMessage = typeof supportMessages.$inferSelect
export type EmployeeInvite = typeof employeeInvites.$inferSelect
export type EmployeePermission = typeof employeePermissions.$inferSelect
export type ActivityLog = typeof activityLog.$inferSelect
export type SaasConfig = typeof saasConfig.$inferSelect
