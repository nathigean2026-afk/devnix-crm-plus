import pg from "pg"
import crypto from "crypto"
import { promisify } from "util"
import { scrypt as _scrypt } from "crypto"

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const scryptAsync = promisify(_scrypt)

// Cria todas as tabelas do schema
await pool.query(`
  CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    image TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "accessExpiresAt" TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    scope TEXT,
    password TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "clients" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    document TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ativo',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "services" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'un',
    category TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "quotes" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'rascunho',
    "validUntil" DATE,
    notes TEXT,
    "internalNotes" TEXT,
    "rejectionReason" TEXT,
    "respondedAt" TIMESTAMP,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "quote_items" (
    id TEXT PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "serviceId" TEXT,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    "unitPrice" NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "transactions" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "quoteId" TEXT,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    category TEXT,
    "dueDate" DATE,
    "paidAt" DATE,
    status TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "business_profile" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    document TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    website TEXT,
    "pixKey" TEXT,
    "pixType" TEXT DEFAULT 'cpf',
    logo TEXT,
    "notifAlertEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notifQuoteEnabled" BOOLEAN NOT NULL DEFAULT true,
    "licensePlan" TEXT DEFAULT 'starter',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "promo_codes" (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    "planName" TEXT NOT NULL,
    days INTEGER NOT NULL,
    "usedBy" TEXT,
    "usedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "expiresAt" TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS "service_orders" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "quoteId" TEXT,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'aberto',
    "pixKey" TEXT,
    "pixType" TEXT DEFAULT 'cpf',
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0,
    "discountType" TEXT DEFAULT 'valor',
    "discountExpiry" DATE,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    "cashPrice" NUMERIC(10,2),
    "cardPrice" NUMERIC(10,2),
    "cardInstallments" INTEGER DEFAULT 1,
    notes TEXT,
    "internalNotes" TEXT,
    "completedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "service_order_items" (
    id TEXT PRIMARY KEY,
    "serviceOrderId" TEXT NOT NULL,
    "serviceId" TEXT,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    "unitPrice" NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "admin_log" (
    id TEXT PRIMARY KEY,
    "adminEmail" TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetUserEmail" TEXT,
    meta TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "support_tickets" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'duvida',
    status TEXT NOT NULL DEFAULT 'aberto',
    priority TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "closedAt" TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS "support_messages" (
    id TEXT PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL DEFAULT 'user',
    body TEXT NOT NULL,
    attachments TEXT DEFAULT '[]',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "payments" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "mpPaymentId" TEXT NOT NULL UNIQUE,
    "planId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL DEFAULT 'pix',
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "paidAt" TIMESTAMP,
    "expiresLicenseAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "employee_invites" (
    id TEXT PRIMARY KEY,
    "ownerId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "expiresAt" TIMESTAMP NOT NULL,
    "acceptedAt" TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS "employee_permissions" (
    id TEXT PRIMARY KEY,
    "ownerId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "employeeId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "canClients" BOOLEAN NOT NULL DEFAULT false,
    "canServices" BOOLEAN NOT NULL DEFAULT false,
    "canQuotes" BOOLEAN NOT NULL DEFAULT false,
    "canOrders" BOOLEAN NOT NULL DEFAULT false,
    "canFinanceiro" BOOLEAN NOT NULL DEFAULT false,
    "canRelatorios" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
  );
`)

console.log("[v0] Todas as tabelas criadas/verificadas com sucesso.")

// Cria o usuário admin via Better Auth internamente
// Better Auth usa: scrypt com salt para hash de senha
const email = "contato@elevanthe.com"
const password = "nathigean12*"
const name = "Admin Elevanthe"

// Verifica se já existe
const { rows: existing } = await pool.query('SELECT id FROM "user" WHERE email = $1', [email])

if (existing.length > 0) {
  console.log("[v0] Usuário admin já existe:", email)
} else {
  // Better Auth usa o formato: salt:hash (scrypt)
  // Gera salt de 16 bytes em hex
  const saltBuffer = crypto.randomBytes(16)
  const salt = saltBuffer.toString("hex")
  // scrypt com N=16384, r=8, p=1, keylen=64 (padrão do Better Auth)
  const hashBuffer = await scryptAsync(password.normalize("NFKC"), salt, 64, { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 })
  const hash = hashBuffer.toString("hex")
  const passwordHash = `${salt}:${hash}`

  const userId = crypto.randomUUID()
  const accountId = crypto.randomUUID()
  const now = new Date()

  // Licença vitalícia (100 anos)
  const licenseExpiry = new Date(now)
  licenseExpiry.setFullYear(licenseExpiry.getFullYear() + 100)

  await pool.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", "accessExpiresAt")
     VALUES ($1, $2, $3, true, $4, $4, $5)`,
    [userId, name, email, now, licenseExpiry]
  )

  await pool.query(
    `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
     VALUES ($1, $2, 'credential', $3, $4, $5, $5)`,
    [accountId, userId, userId, passwordHash, now]
  )

  await pool.query(
    `INSERT INTO "business_profile" (id, "userId", name, "licensePlan", "createdAt", "updatedAt")
     VALUES ($1, $2, 'Elevanthe CRM', 'enterprise', $3, $3)`,
    [crypto.randomUUID(), userId, now]
  )

  console.log("[v0] Usuário admin criado com sucesso!")
  console.log("[v0] Email:", email)
  console.log("[v0] Licença ativa até:", licenseExpiry.toLocaleDateString("pt-BR"))
}

await pool.end()
process.exit(0)
