
import { pgTable, serial, text, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// User table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  password: text('password').notNull(),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  address: varchar('address', { length: 255 }),
  city: varchar('city', { length: 100 }),
  province: varchar('province', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  role: varchar('role', { length: 20 }).default('user'),
});

// Beneficiary table
export const beneficiaries = pgTable('beneficiaries', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  country: varchar('country', { length: 2 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  relationship: varchar('relationship', { length: 50 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }),
  bankName: varchar('bank_name', { length: 100 }),
  branchCode: varchar('branch_code', { length: 50 }),
  mobileMoneyProvider: varchar('mobile_money_provider', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Transaction table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  sourceAmount: serial('source_amount').notNull(),
  sourceCurrency: varchar('source_currency', { length: 3 }).notNull(),
  destinationAmount: serial('destination_amount').notNull(), 
  destinationCurrency: varchar('destination_currency', { length: 3 }).notNull(),
  exchangeRate: serial('exchange_rate').notNull(),
  fee: serial('fee').notNull(),
  beneficiaryId: serial('beneficiary_id').references(() => beneficiaries.id),
  beneficiaryName: varchar('beneficiary_name', { length: 200 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  statusMessage: text('status_message'),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  provider: varchar('provider', { length: 50 }),
  reference: varchar('reference', { length: 100 }).notNull(),
  externalTransactionId: varchar('external_transaction_id', { length: 100 }),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Mood entry table for Money Mood Tracker feature
export const moodEntries = pgTable('mood_entries', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  transactionId: serial('transaction_id').references(() => transactions.id),
  moodId: varchar('mood_id', { length: 50 }).notNull(),
  intensity: serial('intensity').default(3),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
});

// Set up relations
export const userRelations = relations(users, ({ many }) => ({
  beneficiaries: many(beneficiaries),
  transactions: many(transactions),
  moodEntries: many(moodEntries),
}));

export const beneficiaryRelations = relations(beneficiaries, ({ one }) => ({
  user: one(users, {
    fields: [beneficiaries.userId],
    references: [users.id],
  }),
}));

export const transactionRelations = relations(transactions, ({ one, many }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  beneficiary: one(beneficiaries, {
    fields: [transactions.beneficiaryId],
    references: [beneficiaries.id],
  }),
  moodEntries: many(moodEntries),
}));

export const moodEntryRelations = relations(moodEntries, ({ one }) => ({
  user: one(users, {
    fields: [moodEntries.userId],
    references: [users.id],
  }),
  transaction: one(transactions, {
    fields: [moodEntries.transactionId],
    references: [transactions.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Beneficiary = typeof beneficiaries.$inferSelect;
export type InsertBeneficiary = typeof beneficiaries.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = typeof moodEntries.$inferInsert;
  