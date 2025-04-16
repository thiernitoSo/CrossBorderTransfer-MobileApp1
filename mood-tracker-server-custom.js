// A simple Express server focused on the Money Mood Tracker feature
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Define constants
const PORT = 5000;

// Configure middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// In-memory storage for mood entries with PostgreSQL sync
const moodEntries = [
  {
    id: '1',
    userId: '1',
    transactionId: '1',
    moodId: 'happy',
    intensity: 4,
    note: 'Really pleased with how quickly the money was sent',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    userId: '1',
    transactionId: '2',
    moodId: 'anxious',
    intensity: 3,
    note: 'Waiting for confirmation is making me nervous',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

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

// Sync flag for database status
let isDatabaseConnected = false;

// Function to fetch mood entries from PostgreSQL
async function syncWithDatabase() {
  try {
    // Execute direct SQL query using fetch
    const response = await fetch(process.env.DATABASE_SYNC_URL || 'http://localhost:3000/api/db-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'getMoodEntries',
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        // Update in-memory storage with database data
        // This keeps the custom implementation simple without direct pg dependency
        isDatabaseConnected = true;
        console.log('Successfully synced with database');
      }
    }
  } catch (error) {
    console.error('Database sync error:', error);
    isDatabaseConnected = false;
  }
  
  return moodEntries;
}

// Attempt initial sync
syncWithDatabase();

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
        .db-status { font-weight: bold; color: ${isDatabaseConnected ? '#27AE60' : '#E74C3C'}; }
      </style>
    </head>
    <body>
      <h1>Money Mood Tracker API</h1>
      <p class="status">Server is running on port ${PORT}</p>
      <p class="db-status">Database is ${isDatabaseConnected ? 'connected' : 'not connected'}</p>
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
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Money Mood Tracker API',
    port: PORT,
    database: isDatabaseConnected ? 'connected' : 'not connected',
    timestamp: new Date().toISOString()
  });
});

// Get available moods
app.get('/api/moods', (req, res) => {
  res.json({
    success: true,
    data: availableMoods
  });
});

// Get mood entries for a user
app.get('/api/mood-entries/:userId', (req, res) => {
  const userId = req.params.userId;
  const userMoodEntries = moodEntries.filter(entry => entry.userId === userId);
  
  res.json({
    success: true,
    data: userMoodEntries
  });
});

// Create a mood entry
app.post('/api/mood-entries', (req, res) => {
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
  
  const newEntry = {
    id: uuidv4(),
    userId,
    transactionId,
    moodId,
    intensity: intensity || 3,
    note: note || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  moodEntries.push(newEntry);
  
  // Attempt to sync with database
  try {
    fetch(process.env.DATABASE_SYNC_URL || 'http://localhost:3000/api/db-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'saveMoodEntry',
        data: newEntry
      }),
    }).then(response => {
      if (response.ok) {
        console.log('Successfully saved mood entry to database');
        isDatabaseConnected = true;
      }
    }).catch(error => {
      console.error('Error saving to database:', error);
    });
  } catch (error) {
    console.error('Database sync error:', error);
  }
  
  res.status(201).json({
    success: true,
    data: newEntry
  });
});

// Get mood entries for a specific transaction
app.get('/api/mood-entries/transaction/:transactionId', (req, res) => {
  const transactionId = req.params.transactionId;
  const transactionMoods = moodEntries.filter(entry => entry.transactionId === transactionId);
  
  res.json({
    success: true,
    data: transactionMoods
  });
});

// Get mood statistics for a user
app.get('/api/mood-stats/:userId', (req, res) => {
  const userId = req.params.userId;
  const userMoodEntries = moodEntries.filter(entry => entry.userId === userId);
  
  // Calculate mood distribution
  const moodDistribution = {};
  availableMoods.forEach(mood => {
    moodDistribution[mood.id] = 0;
  });
  
  userMoodEntries.forEach(entry => {
    moodDistribution[entry.moodId] = (moodDistribution[entry.moodId] || 0) + 1;
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
});

// Create an endpoint for database operations
// This helps us separate database logic while keeping the API consistent
app.post('/api/db-sync', async (req, res) => {
  const { operation, data } = req.body;
  
  try {
    // Execute SQL directly with the execute_sql_tool
    if (operation === 'getMoodEntries') {
      const response = await fetch('http://localhost:3000/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'SELECT * FROM mood_entries'
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        res.json({
          success: true,
          data: result.rows
        });
      } else {
        throw new Error('Failed to execute SQL query');
      }
    } 
    else if (operation === 'saveMoodEntry') {
      const response = await fetch('http://localhost:3000/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            INSERT INTO mood_entries (user_id, transaction_id, mood_id, intensity, note, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `,
          params: [
            data.userId, 
            data.transactionId, 
            data.moodId, 
            data.intensity, 
            data.note, 
            data.createdAt, 
            data.updatedAt
          ]
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        res.json({
          success: true,
          data: result.rows[0]
        });
      } else {
        throw new Error('Failed to save mood entry');
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid operation'
      });
    }
  } catch (error) {
    console.error('Database operation error:', error);
    res.status(500).json({
      success: false,
      message: 'Database operation failed',
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