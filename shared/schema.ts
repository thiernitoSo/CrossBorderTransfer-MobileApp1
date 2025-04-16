
import { pgTable, serial, text, varchar, timestamp, boolean, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const paymentMethodEnum = pgEnum('payment_method', ['bank', 'mobile_money', 'cash_pickup']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'processing', 'completed', 'failed', 'cancelled']);
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const relationshipEnum = pgEnum('relationship', ['family', 'friend', 'business', 'other']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  address: varchar('address', { length: 255 }),
  city: varchar('city', { length: 100 }),
  province: varchar('province', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  role: userRoleEnum('role').default('user').notNull(),
});

// Beneficiaries table
export const beneficiaries = pgTable('beneficiaries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  country: varchar('country', { length: 2 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  relationship: relationshipEnum('relationship').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  accountNumber: varchar('account_number', { length: 50 }),
  bankName: varchar('bank_name', { length: 100 }),
  branchCode: varchar('branch_code', { length: 50 }),
  mobileMoneyProvider: varchar('mobile_money_provider', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  sourceAmount: decimal('source_amount', { precision: 10, scale: 2 }).notNull(),
  sourceCurrency: varchar('source_currency', { length: 3 }).notNull(),
  destinationAmount: decimal('destination_amount', { precision: 10, scale: 2 }).notNull(),
  destinationCurrency: varchar('destination_currency', { length: 3 }).notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 6 }).notNull(),
  fee: decimal('fee', { precision: 10, scale: 2 }).notNull(),
  beneficiaryId: integer('beneficiary_id').notNull().references(() => beneficiaries.id),
  beneficiaryName: varchar('beneficiary_name', { length: 255 }).notNull(),
  status: transactionStatusEnum('status').default('pending').notNull(),
  statusMessage: text('status_message'),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  provider: varchar('provider', { length: 100 }),
  reference: varchar('reference', { length: 100 }).notNull(),
  externalTransactionId: varchar('external_transaction_id', { length: 100 }),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Reset tokens table
export const resetTokens = pgTable('reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  token: varchar('token', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  beneficiaries: many(beneficiaries),
  transactions: many(transactions),
  resetTokens: many(resetTokens),
}));

export const beneficiariesRelations = relations(beneficiaries, ({ one, many }) => ({
  user: one(users, {
    fields: [beneficiaries.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  beneficiary: one(beneficiaries, {
    fields: [transactions.beneficiaryId],
    references: [beneficiaries.id],
  }),
}));

export const resetTokensRelations = relations(resetTokens, ({ one }) => ({
  user: one(users, {
    fields: [resetTokens.userId],
    references: [users.id],
  }),
}));

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Beneficiary = typeof beneficiaries.$inferSelect;
export type InsertBeneficiary = typeof beneficiaries.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type ResetToken = typeof resetTokens.$inferSelect;
export type InsertResetToken = typeof resetTokens.$inferInsert;

// Original interface types (keeping for backwards compatibility)
export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  isVerified: boolean;
  createdAt: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  role?: 'user' | 'admin';
}

export interface IBeneficiary {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  country: string;
  phoneNumber: string;
  relationship: string;
  paymentMethod: 'bank' | 'mobile_money' | 'cash_pickup';
  accountNumber?: string;
  bankName?: string;
  branchCode?: string;
  mobileMoneyProvider?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITransaction {
  id: string;
  userId: string;
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  exchangeRate: number;
  fee: number;
  beneficiaryId: string;
  beneficiaryName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  statusMessage?: string;
  paymentMethod: string;
  provider?: string;
  reference: string;
  externalTransactionId?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IResetToken {
  userId: string;
  token: string;
  expiresAt: string;
}