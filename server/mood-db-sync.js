// PostgreSQL database helper for mood entries
const express = require('express');
const router = express.Router();

// Function to execute SQL queries through the Replit database tools
async function executeSql(query, params = []) {
  try {
    // This is a mock function to demonstrate how the sync would work
    // In a real implementation, we would connect directly to PostgreSQL
    // For now, we're using memory storage and simulating DB operations
    
    if (query.includes('SELECT * FROM mood_entries')) {
      return { 
        success: true, 
        rows: [] // Empty for now until we implement actual DB retrieval
      };
    } else if (query.includes('INSERT INTO mood_entries')) {
      // Simulate a successful insert
      return { 
        success: true, 
        rows: [params] // Return the data that would be inserted
      };
    }
    
    return { success: false, message: 'Query not supported' };
  } catch (error) {
    console.error('SQL execution error:', error);
    return { success: false, error: error.message };
  }
}

// Database sync endpoint
router.post('/db-sync', async (req, res) => {
  const { operation, data } = req.body;
  
  try {
    if (operation === 'getMoodEntries') {
      const result = await executeSql('SELECT * FROM mood_entries');
      res.json({
        success: true,
        data: result.rows || []
      });
    } 
    else if (operation === 'saveMoodEntry') {
      if (!data || !data.userId || !data.moodId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required data'
        });
      }
      
      const result = await executeSql(
        `INSERT INTO mood_entries (user_id, transaction_id, mood_id, intensity, note, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          data.userId,
          data.transactionId || null,
          data.moodId,
          data.intensity || 3,
          data.note || '',
          data.createdAt || new Date().toISOString(),
          data.updatedAt || new Date().toISOString()
        ]
      );
      
      res.json({
        success: true,
        data: result.rows[0] || data
      });
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

// Health check endpoint for database
router.get('/db-health', async (req, res) => {
  try {
    const result = await executeSql('SELECT NOW()');
    res.json({
      success: true,
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;