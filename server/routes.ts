import { Express, Request, Response } from 'express';
import { createServer, Server } from 'http';
import { setupAuth } from './auth';
import { storage } from './storage';
import OpenAI from 'openai';
import { paymentService, QuoteData, PaymentRequest } from '../services/payment';
import { rafikiService } from '../services/rafiki';
import { orangeMoneyService } from '../services/orangeMoney';

export function registerRoutes(app: Express): Server {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // OpenAI integration for chatbot
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Initialize the OpenAI API with our API key
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid request format. Expected an array of messages.' });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      res.json({ response: response.choices[0].message });
    } catch (error) {
      console.error('OpenAI API error:', error);
      res.status(500).json({ error: 'Error processing chat request' });
    }
  });

  // Transaction anomaly detection
  app.post('/api/analyze-transaction', async (req: Request, res: Response) => {
    try {
      const { transaction } = req.body;

      if (!transaction) {
        return res.status(400).json({ error: 'Invalid request. Transaction data required.' });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a transaction analysis AI for a cross-border money transfer service. Analyze the transaction data and provide a risk assessment with the following structure: risk level (low, medium, high), risk score (0-100), explanation, and recommendation.'
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
  app.get('/api/beneficiaries', async (req: Request, res: Response) => {
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

  app.get('/api/beneficiaries/:id', async (req: Request, res: Response) => {
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

  app.post('/api/beneficiaries', async (req: Request, res: Response) => {
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

  app.put('/api/beneficiaries/:id', async (req: Request, res: Response) => {
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

  app.delete('/api/beneficiaries/:id', async (req: Request, res: Response) => {
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
  app.get('/api/transactions', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const transactions = await storage.getTransactionsByUserId(userId, page, limit);
      const total = await storage.countTransactionsByUserId(userId);
      
      res.json({
        data: transactions,
        total,
        page,
        limit,
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to retrieve transactions' });
    }
  });

  app.get('/api/transactions/:id', async (req: Request, res: Response) => {
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

  app.post('/api/transactions/quote', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { 
        sourceAmount, 
        destinationAmount, 
        sourceCurrency, 
        destinationCurrency, 
        destinationCountry,
        paymentMethod 
      } = req.body;
      
      if (!sourceCurrency || !destinationCurrency || !destinationCountry || !paymentMethod) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      if (!sourceAmount && !destinationAmount) {
        return res.status(400).json({ error: 'Either sourceAmount or destinationAmount is required' });
      }
      
      // Check if the payment method is available for this country
      if (!paymentService.isPaymentMethodAvailableForCountry(paymentMethod, destinationCountry)) {
        return res.status(400).json({ 
          error: `Payment method ${paymentMethod} is not available for ${destinationCountry}`,
          availableMethods: paymentService.getAvailablePaymentMethods(destinationCountry)
        });
      }
      
      // Get quote from payment service
      const quoteData: QuoteData = {
        sourceAmount: sourceAmount ? parseFloat(sourceAmount) : undefined,
        destinationAmount: destinationAmount ? parseFloat(destinationAmount) : undefined,
        sourceCurrency,
        destinationCurrency,
        destinationCountry,
        paymentMethod
      };
      
      const quote = await paymentService.getQuote(quoteData);
      res.json(quote);
    } catch (error) {
      console.error('Get transaction quote error:', error);
      res.status(500).json({ 
        error: 'Failed to get quote', 
        message: error.message 
      });
    }
  });

  app.post('/api/transactions', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = (req.user as any).id;
      const { 
        quoteId,
        sourceAmount,
        destinationAmount,
        sourceCurrency,
        destinationCurrency,
        paymentMethod,
        provider,
        beneficiaryId,
        phoneNumber
      } = req.body;
      
      // Validate required fields
      if (!sourceAmount || !destinationAmount || !sourceCurrency || !destinationCurrency || 
          !paymentMethod || !provider || !beneficiaryId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Validate beneficiary belongs to user
      const beneficiary = await storage.getBeneficiary(beneficiaryId);
      if (!beneficiary || beneficiary.userId !== userId) {
        return res.status(400).json({ error: 'Invalid beneficiary' });
      }
      
      // Create a payment request to the payment service
      const reference = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Prepare payment request based on provider
      const paymentRequest: PaymentRequest = {
        quoteId,
        sourceAmount: parseFloat(sourceAmount),
        destinationAmount: parseFloat(destinationAmount),
        sourceCurrency,
        destinationCurrency,
        paymentMethod,
        provider,
        description: `SendAfrika transfer to ${beneficiary.firstName} ${beneficiary.lastName}`,
        reference,
        beneficiaryId,
        phoneNumber,
      };
      
      // If using Rafiki, add destination details
      if (provider === 'rafiki') {
        const destination = {
          type: paymentMethod === 'bank_transfer' ? 'bank_account' : 
                paymentMethod === 'cash_pickup' ? 'cash_pickup' : 'mobile_wallet',
          countryCode: beneficiary.country,
          firstName: beneficiary.firstName,
          lastName: beneficiary.lastName,
        };
        
        // Add specific payment details based on payment method
        if (paymentMethod === 'bank_transfer' && beneficiary.bankName && beneficiary.accountNumber) {
          Object.assign(destination, {
            bankAccount: {
              accountNumber: beneficiary.accountNumber,
              bankCode: beneficiary.bankName,
              branchCode: beneficiary.branchCode,
            }
          });
        } else if ((paymentMethod === 'mobile_money' || paymentMethod === 'orange_money') && beneficiary.phoneNumber) {
          Object.assign(destination, {
            mobileWallet: {
              phoneNumber: beneficiary.phoneNumber,
              provider: beneficiary.mobileMoneyProvider || 'default',
            }
          });
        }
        
        paymentRequest.destination = destination as any;
      }
      
      // Initiate payment with payment service
      const paymentResult = await paymentService.initiatePayment(paymentRequest);
      
      // Store the transaction in our database
      const transaction = await storage.createTransaction({
        userId,
        sourceAmount: paymentResult.sourceAmount,
        sourceCurrency: paymentResult.sourceCurrency,
        destinationAmount: paymentResult.destinationAmount,
        destinationCurrency: paymentResult.destinationCurrency,
        exchangeRate: paymentResult.exchangeRate,
        fee: paymentResult.fee,
        beneficiaryId,
        beneficiaryName: `${beneficiary.firstName} ${beneficiary.lastName}`,
        status: paymentResult.status,
        statusMessage: paymentResult.message,
        paymentMethod,
        provider,
        reference: paymentResult.reference,
        externalTransactionId: paymentResult.id,
        note: req.body.note,
      });
      
      // Return the combined result
      res.status(201).json({
        ...transaction,
        paymentUrl: paymentResult.paymentUrl,
        externalTransactionId: paymentResult.id,
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ 
        error: 'Failed to create transaction',
        message: error.message
      });
    }
  });

  app.post('/api/transactions/:id/cancel', async (req: Request, res: Response) => {
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
      
      // Cancel the transaction with the payment provider if it has an external ID
      let externalCancelSuccess = false;
      
      if (transaction.externalTransactionId && transaction.provider) {
        externalCancelSuccess = await paymentService.cancelPayment(
          transaction.externalTransactionId, 
          transaction.provider as any
        );
      }
      
      // Update transaction status in our database
      const status = externalCancelSuccess ? 'cancelled' : 'failed';
      const statusMessage = externalCancelSuccess 
        ? 'Transaction cancelled successfully' 
        : 'Transaction marked as failed, but may still be processing with provider';
      
      const updatedTransaction = await storage.updateTransaction(transactionId, { 
        status, 
        statusMessage,
        updatedAt: new Date().toISOString()
      });
      
      res.json({
        ...updatedTransaction,
        externalCancelSuccess
      });
    } catch (error) {
      console.error('Cancel transaction error:', error);
      res.status(500).json({ 
        error: 'Failed to cancel transaction',
        message: error.message 
      });
    }
  });

  app.get('/api/transactions/stats', async (req: Request, res: Response) => {
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

  // Payment methods routes
  app.get('/api/payment-methods/:countryCode', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const countryCode = req.params.countryCode.toUpperCase();
      
      const availableMethods = paymentService.getAvailablePaymentMethods(countryCode);
      
      // Check which providers support this country
      const orangeMoneySupported = orangeMoneyService.getSupportedCountries().includes(countryCode);
      const rafikiSupported = rafikiService.getSupportedCountries().includes(countryCode);
      
      res.json({
        country: countryCode,
        availableMethods,
        providers: {
          orangeMoney: orangeMoneySupported,
          rafiki: rafikiSupported
        }
      });
    } catch (error) {
      console.error('Get payment methods error:', error);
      res.status(500).json({ 
        error: 'Failed to get payment methods',
        message: error.message
      });
    }
  });

  // Profile routes
  app.put('/api/users/profile', async (req: Request, res: Response) => {
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
