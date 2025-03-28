import { Express, Request, Response } from 'express';
import { createServer, Server } from 'http';
import { setupAuth } from './auth';
import { storage } from './storage';
import OpenAI from 'openai';

export function registerRoutes(app) {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // OpenAI integration for chatbot
  const openai = new OpenAI({ apiKey.env.OPENAI_API_KEY });

  // Initialize the OpenAI API with our API key
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid request format. Expected an array of messages.' });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      res.json({ response.choices[0].message });
    } catch (error) {
      console.error('OpenAI API error:', error);
      res.status(500).json({ error: 'Error processing chat request' });
    }
  });

  // Transaction anomaly detection
  app.post('/api/analyze-transaction', async (req, res) => {
    try {
      const { transaction } = req.body;

      if (!transaction) {
        return res.status(400).json({ error: 'Invalid request. Transaction data required.' });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages
          {
            role: 'system',
            content: 'You are a transaction analysis AI for a cross-border money transfer service. Analyze the transaction data and provide a risk assessment with the following structure level (low, medium, high), risk score (0-100), explanation, and recommendation.'
          },
          {
            role: 'user',
            content: `Analyze this transaction: ${JSON.stringify(transaction)}`
          }
        ],
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      res.json(analysis);
    } catch (error) {
      console.error('Transaction analysis error:', error);
      res.status(500).json({ error: 'Error analyzing transaction' });
    }
  });

  // Beneficiary routes
  app.get('/api/beneficiaries', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const beneficiaries = await storage.getBeneficiariesByUserId(userId);
      res.json(beneficiaries);
    } catch (error) {
      console.error('Get beneficiaries error:', error);
      res.status(500).json({ error: 'Failed to retrieve beneficiaries' });
    }
  });

  app.get('/api/beneficiaries/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const beneficiaryId = req.params.id;
      const beneficiary = await storage.getBeneficiary(beneficiaryId);
      
      if (!beneficiary || beneficiary.userId !== userId) {
        return res.status(404).json({ error: 'Beneficiary not found' });
      }
      
      res.json(beneficiary);
    } catch (error) {
      console.error('Get beneficiary error:', error);
      res.status(500).json({ error: 'Failed to retrieve beneficiary' });
    }
  });

  app.post('/api/beneficiaries', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const beneficiaryData = { ...req.body, userId };
      const newBeneficiary = await storage.createBeneficiary(beneficiaryData);
      res.status(201).json(newBeneficiary);
    } catch (error) {
      console.error('Create beneficiary error:', error);
      res.status(500).json({ error: 'Failed to create beneficiary' });
    }
  });

  app.put('/api/beneficiaries/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const beneficiaryId = req.params.id;
      const beneficiary = await storage.getBeneficiary(beneficiaryId);
      
      if (!beneficiary || beneficiary.userId !== userId) {
        return res.status(404).json({ error: 'Beneficiary not found' });
      }
      
      const updatedBeneficiary = await storage.updateBeneficiary(beneficiaryId, req.body);
      res.json(updatedBeneficiary);
    } catch (error) {
      console.error('Update beneficiary error:', error);
      res.status(500).json({ error: 'Failed to update beneficiary' });
    }
  });

  app.delete('/api/beneficiaries/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const beneficiaryId = req.params.id;
      const beneficiary = await storage.getBeneficiary(beneficiaryId);
      
      if (!beneficiary || beneficiary.userId !== userId) {
        return res.status(404).json({ error: 'Beneficiary not found' });
      }
      
      await storage.deleteBeneficiary(beneficiaryId);
      res.sendStatus(204);
    } catch (error) {
      console.error('Delete beneficiary error:', error);
      res.status(500).json({ error: 'Failed to delete beneficiary' });
    }
  });

  // Transaction routes
  app.get('/api/transactions', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const transactions = await storage.getTransactionsByUserId(userId, page, limit);
      const total = await storage.countTransactionsByUserId(userId);
      
      res.json({
        data,
        total,
        page,
        limit,
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to retrieve transactions' });
    }
  });

  app.get('/api/transactions/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const transactionId = req.params.id;
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction || transaction.userId !== userId) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({ error: 'Failed to retrieve transaction' });
    }
  });

  app.post('/api/transactions/quote', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { amount, sourceCurrency, destinationCurrency } = req.body;
      
      if (!amount || !sourceCurrency || !destinationCurrency) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // This would normally call a third-party service for real exchange rates
      // For now, use mock data from our service
      const quote = {
        sourceAmount(amount),
        sourceCurrency,
        destinationAmount(amount) * 550.75, // Mock exchange rate
        destinationCurrency,
        exchangeRate: 550.75,
        fee(amount) * 0.055, // 5.5% fee
        totalAmount(amount) * 1.055, // Amount + fee
        expiresAt Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
      };
      
      res.json(quote);
    } catch (error) {
      console.error('Get transaction quote error:', error);
      res.status(500).json({ error: 'Failed to get quote' });
    }
  });

  app.post('/api/transactions', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const transactionData = req.body;
      
      // Validate beneficiary belongs to user
      const beneficiary = await storage.getBeneficiary(transactionData.beneficiaryId);
      if (!beneficiary || beneficiary.userId !== userId) {
        return res.status(400).json({ error: 'Invalid beneficiary' });
      }
      
      // Create a transaction with a random reference number
      const reference = Math.random().toString(36).substring(2, 10).toUpperCase();
      const transaction = await storage.createTransaction({
        ...transactionData,
        userId,
        reference,
        status: 'pending',
        sourceAmount(transactionData.amount),
        sourceCurrency: 'CAD', // Assuming CAD as source for now
        destinationAmount(transactionData.amount) * 550.75, // Mock exchange rate
        destinationCurrency.destinationCurrency,
        exchangeRate: 550.75,
        fee(transactionData.amount) * 0.055, // 5.5% fee
        beneficiaryName: `${beneficiary.firstName} ${beneficiary.lastName}`,
      });
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  app.post('/api/transactions/:id/cancel', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const transactionId = req.params.id;
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction || transaction.userId !== userId) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      if (transaction.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending transactions can be cancelled' });
      }
      
      const updatedTransaction = await storage.updateTransaction(transactionId, { status: 'failed' });
      res.json(updatedTransaction);
    } catch (error) {
      console.error('Cancel transaction error:', error);
      res.status(500).json({ error: 'Failed to cancel transaction' });
    }
  });

  app.get('/api/transactions/stats', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const transactions = await storage.getTransactionsByUserId(userId, 1, 100);
      
      const totalSent = transactions.reduce((sum, t) => sum + t.sourceAmount + t.fee, 0);
      const totalCount = transactions.length;
      const averageAmount = totalCount > 0 ? totalSent / totalCount : 0;
      
      res.json({ totalSent, totalCount, averageAmount });
    } catch (error) {
      console.error('Get transaction stats error:', error);
      res.status(500).json({ error: 'Failed to retrieve transaction stats' });
    }
  });

  // Profile routes
  app.put('/api/users/profile', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const userData = req.body;
      
      // Don't allow changing of email in this simple route
      delete userData.email;
      
      const updatedUser = await storage.updateUser(userId, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
