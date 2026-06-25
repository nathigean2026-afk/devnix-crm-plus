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
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
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
