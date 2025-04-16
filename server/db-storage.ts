import { db } from './db';
import { eq, desc, and, sql, gte } from 'drizzle-orm';
import {
  users, beneficiaries, transactions, resetTokens,
  User, InsertUser, Beneficiary, InsertBeneficiary, 
  Transaction, InsertTransaction, ResetToken, InsertResetToken
} from '@shared/schema';
import session from 'express-session';
import { Pool } from '@neondatabase/serverless';
import connectPgSimple from 'connect-pg-simple';
import { v4 as uuidv4 } from 'uuid';

const PostgresStore = connectPgSimple(session);

export interface TransactionStatistics {
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  cancelledCount: number;
  processingCount: number;
  totalAmountCAD: number;
  currencyDistribution: Record<string, { count: number, amount: number }>;
  countryDistribution: Record<string, number>;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
}

export interface IStorage {
  sessionStore: any; // Express session store
  
  // User methods
  createUser(userData: Partial<User>): Promise<User>;
  getUser(id: string | number): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string | number, userData: Partial<User>): Promise<User>;
  deleteUser(id: string | number): Promise<void>;
  getAllUsers(page: number, limit: number): Promise<User[]>;
  countUsers(): Promise<number>;
  
  // Beneficiary methods
  createBeneficiary(data: Partial<Beneficiary>): Promise<Beneficiary>;
  getBeneficiary(id: string | number): Promise<Beneficiary | null>;
  updateBeneficiary(id: string | number, data: Partial<Beneficiary>): Promise<Beneficiary>;
  deleteBeneficiary(id: string | number): Promise<void>;
  getBeneficiariesByUserId(userId: string | number): Promise<Beneficiary[]>;
  getAllBeneficiaries(page: number, limit: number): Promise<Beneficiary[]>;
  countBeneficiaries(): Promise<number>;
  
  // Transaction methods
  createTransaction(data: Partial<Transaction>): Promise<Transaction>;
  getTransaction(id: string | number): Promise<Transaction | null>;
  updateTransaction(id: string | number, data: Partial<Transaction>): Promise<Transaction>;
  getTransactionsByUserId(userId: string | number, page: number, limit: number): Promise<Transaction[]>;
  countTransactionsByUserId(userId: string | number): Promise<number>;
  getAllTransactions(page: number, limit: number, filters?: { status?: string, country?: string }): Promise<Transaction[]>;
  countAllTransactions(filters?: { status?: string, country?: string }): Promise<number>;
  getTransactionStatistics(): Promise<TransactionStatistics>;
  
  // Password reset methods
  storeResetToken(userId: string | number, token: string): Promise<void>;
  getUserIdByResetToken(token: string): Promise<string | null>;
  deleteResetToken(token: string): Promise<void>;
}

// Database storage implementation
export class DbStorage implements IStorage {
  public sessionStore: any;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db.insert(users).values(userData as InsertUser).returning();
    return user;
  }

  async getUser(id: string | number): Promise<User | null> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const [user] = await db.select().from(users).where(eq(users.id, numericId));
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async updateUser(id: string | number, userData: Partial<User>): Promise<User> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    // Add updatedAt timestamp
    const dataToUpdate = {
      ...userData,
      updatedAt: new Date()
    };
    
    const [user] = await db
      .update(users)
      .set(dataToUpdate)
      .where(eq(users.id, numericId))
      .returning();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async deleteUser(id: string | number): Promise<void> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    await db.delete(users).where(eq(users.id, numericId));
  }
  
  async getAllUsers(page: number, limit: number): Promise<User[]> {
    const offset = (page - 1) * limit;
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  async countUsers(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result.count;
  }

  // Beneficiary methods
  async createBeneficiary(data: Partial<Beneficiary>): Promise<Beneficiary> {
    // Convert userId to number if it's a string
    if (typeof data.userId === 'string') {
      data.userId = parseInt(data.userId, 10);
    }
    
    const [beneficiary] = await db
      .insert(beneficiaries)
      .values(data as InsertBeneficiary)
      .returning();
    
    return beneficiary;
  }

  async getBeneficiary(id: string | number): Promise<Beneficiary | null> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const [beneficiary] = await db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.id, numericId));
    
    return beneficiary || null;
  }

  async updateBeneficiary(id: string | number, data: Partial<Beneficiary>): Promise<Beneficiary> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    // Convert userId to number if it's a string
    if (typeof data.userId === 'string') {
      data.userId = parseInt(data.userId, 10);
    }
    
    // Add updatedAt timestamp
    const dataToUpdate = {
      ...data,
      updatedAt: new Date()
    };
    
    const [beneficiary] = await db
      .update(beneficiaries)
      .set(dataToUpdate)
      .where(eq(beneficiaries.id, numericId))
      .returning();
    
    if (!beneficiary) {
      throw new Error('Beneficiary not found');
    }
    
    return beneficiary;
  }

  async deleteBeneficiary(id: string | number): Promise<void> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    await db.delete(beneficiaries).where(eq(beneficiaries.id, numericId));
  }

  async getBeneficiariesByUserId(userId: string | number): Promise<Beneficiary[]> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    return await db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.userId, numericUserId))
      .orderBy(desc(beneficiaries.createdAt));
  }
  
  async getAllBeneficiaries(page: number, limit: number): Promise<Beneficiary[]> {
    const offset = (page - 1) * limit;
    return await db
      .select()
      .from(beneficiaries)
      .orderBy(desc(beneficiaries.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  async countBeneficiaries(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(beneficiaries);
    return result.count;
  }

  // Transaction methods
  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    // Convert IDs to numbers if they're strings
    if (typeof data.userId === 'string') {
      data.userId = parseInt(data.userId, 10);
    }
    
    if (typeof data.beneficiaryId === 'string') {
      data.beneficiaryId = parseInt(data.beneficiaryId, 10);
    }
    
    // Generate reference if not provided
    if (!data.reference) {
      data.reference = 'TX-' + uuidv4().substring(0, 8).toUpperCase();
    }
    
    const [transaction] = await db
      .insert(transactions)
      .values(data as InsertTransaction)
      .returning();
    
    return transaction;
  }

  async getTransaction(id: string | number): Promise<Transaction | null> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, numericId));
    
    return transaction || null;
  }

  async updateTransaction(id: string | number, data: Partial<Transaction>): Promise<Transaction> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    // Convert IDs to numbers if they're strings
    if (typeof data.userId === 'string') {
      data.userId = parseInt(data.userId, 10);
    }
    
    if (typeof data.beneficiaryId === 'string') {
      data.beneficiaryId = parseInt(data.beneficiaryId, 10);
    }
    
    // Add updatedAt timestamp
    const dataToUpdate = {
      ...data,
      updatedAt: new Date()
    };
    
    const [transaction] = await db
      .update(transactions)
      .set(dataToUpdate)
      .where(eq(transactions.id, numericId))
      .returning();
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    return transaction;
  }

  async getTransactionsByUserId(userId: string | number, page: number, limit: number): Promise<Transaction[]> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const offset = (page - 1) * limit;
    
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, numericUserId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countTransactionsByUserId(userId: string | number): Promise<number> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.userId, numericUserId));
    
    return result.count;
  }
  
  async getAllTransactions(page: number, limit: number, filters?: { status?: string, country?: string }): Promise<Transaction[]> {
    const offset = (page - 1) * limit;
    
    let query = db.select().from(transactions);
    
    if (filters?.status) {
      query = query.where(eq(transactions.status, filters.status as any));
    }
    
    if (filters?.country) {
      // For country filter, we need to find all beneficiaries from that country
      // and then filter transactions by those beneficiary IDs
      const countryBeneficiaries = await db
        .select({ id: beneficiaries.id })
        .from(beneficiaries)
        .where(eq(beneficiaries.country, filters.country));
      
      const beneficiaryIds = countryBeneficiaries.map(b => b.id);
      
      if (beneficiaryIds.length > 0) {
        query = query.where(
          sql`${transactions.beneficiaryId} IN (${sql.join(beneficiaryIds, sql`, `)})`
        );
      } else {
        // No beneficiaries found for this country, return empty result
        return [];
      }
    }
    
    return await query
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  async countAllTransactions(filters?: { status?: string, country?: string }): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(transactions);
    
    if (filters?.status) {
      query = query.where(eq(transactions.status, filters.status as any));
    }
    
    if (filters?.country) {
      // For country filter, we need to find all beneficiaries from that country
      const countryBeneficiaries = await db
        .select({ id: beneficiaries.id })
        .from(beneficiaries)
        .where(eq(beneficiaries.country, filters.country));
      
      const beneficiaryIds = countryBeneficiaries.map(b => b.id);
      
      if (beneficiaryIds.length > 0) {
        query = query.where(
          sql`${transactions.beneficiaryId} IN (${sql.join(beneficiaryIds, sql`, `)})`
        );
      } else {
        // No beneficiaries found for this country, return zero
        return 0;
      }
    }
    
    const [result] = await query;
    return result.count;
  }

  async getTransactionStatistics(): Promise<TransactionStatistics> {
    // Get total counts and status counts
    const [countsResult] = await db.select({
      totalCount: sql<number>`count(*)`,
      completedCount: sql<number>`count(case when ${transactions.status} = 'completed' then 1 end)`,
      pendingCount: sql<number>`count(case when ${transactions.status} = 'pending' then 1 end)`,
      failedCount: sql<number>`count(case when ${transactions.status} = 'failed' then 1 end)`,
      cancelledCount: sql<number>`count(case when ${transactions.status} = 'cancelled' then 1 end)`,
      processingCount: sql<number>`count(case when ${transactions.status} = 'processing' then 1 end)`,
      totalAmountCAD: sql<number>`sum(case when ${transactions.sourceCurrency} = 'CAD' then ${transactions.sourceAmount} else 0 end)`,
    }).from(transactions);
    
    // Get currency distribution
    const currencyDistribution = await db
      .select({
        currency: transactions.destinationCurrency,
        count: sql<number>`count(*)`,
        amount: sql<number>`sum(${transactions.destinationAmount})`,
      })
      .from(transactions)
      .groupBy(transactions.destinationCurrency);
    
    // Get country distribution
    const countryJoinQuery = await db
      .select({
        country: beneficiaries.country,
        count: sql<number>`count(*)`,
      })
      .from(transactions)
      .innerJoin(beneficiaries, eq(transactions.beneficiaryId, beneficiaries.id))
      .groupBy(beneficiaries.country);
    
    // Get time-based statistics
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [timeResult] = await db.select({
      last24Hours: sql<number>`count(case when ${transactions.createdAt} >= ${oneDayAgo} then 1 end)`,
      last7Days: sql<number>`count(case when ${transactions.createdAt} >= ${sevenDaysAgo} then 1 end)`,
      last30Days: sql<number>`count(case when ${transactions.createdAt} >= ${thirtyDaysAgo} then 1 end)`,
    }).from(transactions);
    
    // Format currency distribution
    const currencyDist: Record<string, { count: number, amount: number }> = {};
    for (const row of currencyDistribution) {
      currencyDist[row.currency] = {
        count: row.count,
        amount: row.amount,
      };
    }
    
    // Format country distribution
    const countryDist: Record<string, number> = {};
    for (const row of countryJoinQuery) {
      countryDist[row.country] = row.count;
    }
    
    return {
      totalCount: countsResult.totalCount,
      completedCount: countsResult.completedCount,
      pendingCount: countsResult.pendingCount,
      failedCount: countsResult.failedCount,
      cancelledCount: countsResult.cancelledCount,
      processingCount: countsResult.processingCount,
      totalAmountCAD: countsResult.totalAmountCAD || 0,
      currencyDistribution: currencyDist,
      countryDistribution: countryDist,
      last24Hours: timeResult.last24Hours,
      last7Days: timeResult.last7Days,
      last30Days: timeResult.last30Days,
    };
  }

  // Password reset methods
  async storeResetToken(userId: string | number, token: string): Promise<void> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Delete any existing tokens for this user
    await db.delete(resetTokens).where(eq(resetTokens.userId, numericUserId));
    
    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    await db.insert(resetTokens).values({
      userId: numericUserId,
      token,
      expiresAt,
    });
  }

  async getUserIdByResetToken(token: string): Promise<string | null> {
    const now = new Date();
    
    const [resetToken] = await db
      .select()
      .from(resetTokens)
      .where(and(
        eq(resetTokens.token, token),
        gte(resetTokens.expiresAt, now)
      ));
    
    if (!resetToken) {
      return null;
    }
    
    return resetToken.userId.toString();
  }

  async deleteResetToken(token: string): Promise<void> {
    await db.delete(resetTokens).where(eq(resetTokens.token, token));
  }
}