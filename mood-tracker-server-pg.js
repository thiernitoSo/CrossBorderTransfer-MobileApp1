// PostgreSQL-backed Money Mood Tracker server
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

// Define constants
const PORT = 5000;

// Configure middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  }
});

// Available moods
const availableMoods = [
  { id: 'happy', name: 'Happy', emoji: '😊', description: 'Feeling good about this transaction' },
  { id: 'excited', name: 'Excited', emoji: '😃', description: 'Enthusiastic about this money transfer' },
  { id: 'anxious', name: 'Anxious', emoji: '😟', description: 'Feeling worried about this transfer' },
  { id: 'relieved', name: 'Relieved', emoji: '😌', description: 'Feeling at ease now that it\'s done' },
  { id: 'frustrated', name: 'Frustrated', emoji: '😤', description: 'Annoyed by the process' },
  { id: 'confident', name: 'Confident', emoji: '😎', description: 'Assured about this transfer' },
  { id: 'grateful', name: 'Grateful', emoji: '🙏', description: 'Thankful for being able to send money' },
  { id: 'hopeful', name: 'Hopeful', emoji: '🤞', description: 'Optimistic about this transaction' }
];

// Root route - HTML welcome page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Money Mood Tracker API</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2C3E50; }
        .endpoint { background-color: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; margin-right: 10px; }
        .get { background-color: #3498DB; }
        .post { background-color: #27AE60; }
        .put { background-color: #F39C12; }
        .delete { background-color: #E74C3C; }
        pre { background-color: #f9f9f9; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .status { font-size: 20px; color: #27AE60; margin: 20px 0; }
        .db-status { font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>Money Mood Tracker API</h1>
      <p class="status">Server is running on port ${PORT}</p>
      <p class="db-status">Using PostgreSQL database</p>
      <p>The Money Mood Tracker API allows users to record their emotional responses to money transfers.</p>
      
      <h2>Available Endpoints</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span> <strong>/api/health</strong>
        <p>Check the health status of the API server.</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <strong>/api/moods</strong>
        <p>Get a list of all available moods that can be selected.</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <strong>/api/mood-entries/:userId</strong>
        <p>Get all mood entries for a specific user.</p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span> <strong>/api/mood-entries</strong>
        <p>Create a new mood entry for a transaction.</p>
        <pre>
{
  "userId": "string",
  "transactionId": "string",
  "moodId": "string",
  "intensity": number,
  "note": "string"
}
        </pre>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <strong>/api/mood-entries/transaction/:transactionId</strong>
        <p>Get mood entries associated with a specific transaction.</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <strong>/api/mood-stats/:userId</strong>
        <p>Get mood statistics for a specific user.</p>
      </div>
      
      <h2>Try it out</h2>
      <p>Make requests to these endpoints to interact with the Money Mood Tracker API.</p>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const dbResult = await pool.query('SELECT NOW()');
    const dbTimestamp = dbResult.rows[0].now;
    
    res.json({
      status: 'ok',
      service: 'Money Mood Tracker API',
      port: PORT,
      database: 'connected',
      dbTimestamp,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      service: 'Money Mood Tracker API',
      port: PORT,
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get available moods
app.get('/api/moods', (req, res) => {
  res.json({
    success: true,
    data: availableMoods
  });
});

// Get mood entries for a user
app.get('/api/mood-entries/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  try {
    const result = await pool.query(
      'SELECT * FROM mood_entries WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting mood entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve mood entries',
      error: error.message
    });
  }
});

// Create a mood entry
app.post('/api/mood-entries', async (req, res) => {
  const { userId, transactionId, moodId, intensity, note } = req.body;
  
  if (!userId || !moodId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Validate moodId
  const moodExists = availableMoods.some(mood => mood.id === moodId);
  if (!moodExists) {
    return res.status(400).json({
      success: false,
      message: 'Invalid mood ID'
    });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO mood_entries 
       (user_id, transaction_id, mood_id, intensity, note, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [userId, transactionId, moodId, intensity || 3, note || '']
    );
    
    const newEntry = result.rows[0];
    
    res.status(201).json({
      success: true,
      data: newEntry
    });
  } catch (error) {
    console.error('Error creating mood entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mood entry',
      error: error.message
    });
  }
});

// Get mood entries for a specific transaction
app.get('/api/mood-entries/transaction/:transactionId', async (req, res) => {
  const transactionId = req.params.transactionId;
  
  try {
    const result = await pool.query(
      'SELECT * FROM mood_entries WHERE transaction_id = $1 ORDER BY created_at DESC',
      [transactionId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting transaction mood entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction mood entries',
      error: error.message
    });
  }
});

// Get mood statistics for a user
app.get('/api/mood-stats/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // Get all mood entries for the user
    const entriesResult = await pool.query(
      'SELECT * FROM mood_entries WHERE user_id = $1',
      [userId]
    );
    
    const userMoodEntries = entriesResult.rows;
    
    // Calculate mood distribution
    const moodDistribution = {};
    availableMoods.forEach(mood => {
      moodDistribution[mood.id] = 0;
    });
    
    userMoodEntries.forEach(entry => {
      moodDistribution[entry.mood_id] = (moodDistribution[entry.mood_id] || 0) + 1;
    });
    
    // Calculate average intensity
    const totalIntensity = userMoodEntries.reduce((sum, entry) => sum + entry.intensity, 0);
    const averageIntensity = userMoodEntries.length > 0 ? totalIntensity / userMoodEntries.length : 0;
    
    // Most common mood
    let mostCommonMood = null;
    let maxCount = 0;
    
    Object.entries(moodDistribution).forEach(([moodId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonMood = moodId;
      }
    });
    
    res.json({
      success: true,
      data: {
        totalEntries: userMoodEntries.length,
        moodDistribution,
        averageIntensity,
        mostCommonMood
      }
    });
  } catch (error) {
    console.error('Error getting mood statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve mood statistics',
      error: error.message
    });
  }
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Money Mood Tracker server running on http://0.0.0.0:${PORT}`);
  
  // Self-ping to verify server
  setTimeout(() => {
    const options = {
      hostname: '0.0.0.0',
      port: PORT,
      path: '/api/health',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Health check response: ${data}`);
        console.log('Server is healthy and running');
      });
    });
    
    req.on('error', (error) => {
      console.error('Health check failed:', error.message);
    });
    
    req.end();
  }, 1000);
});

// Export for testing
module.exports = { app, server };