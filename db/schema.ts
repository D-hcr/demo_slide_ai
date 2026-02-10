// /db/schema.ts
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"

/**
 * Auth.js / NextAuth Drizzle Adapter tables
 * (DrizzleAdapter bu kolon isimlerini bekliyor)
 */

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
  },
  (t) => ({
    emailUq: uniqueIndex("users_email_uq").on(t.email),
  })
)

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),

    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
    userIdx: index("accounts_userId_idx").on(t.userId),
    providerIdx: index("accounts_provider_idx").on(t.provider),
  })
)

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => ({
    userIdx: index("sessions_userId_idx").on(t.userId),
  })
)

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  })
)

/**
 * App tables
 */

export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),

    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    themeName: text("themeName"),
    artifactType: text("artifactType"),
    version: integer("version").notNull().default(1),
    content: jsonb("content").notNull(),

    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("documents_userId_idx").on(t.userId),
    updatedIdx: index("documents_updatedAt_idx").on(t.updatedAt),
    idUserUq: uniqueIndex("documents_id_userId_uq").on(t.id, t.userId),
  })
)

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),

    documentId: text("documentId")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    role: varchar("role", { length: 32 }).notNull(), // user|assistant|system
    content: text("content").notNull(),

    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => ({
    docIdx: index("chat_messages_documentId_idx").on(t.documentId),
    createdIdx: index("chat_messages_createdAt_idx").on(t.createdAt),
  })
)

export const schema = {
  users,
  accounts,
  sessions,
  verificationTokens,
  documents,
  chatMessages,
}
