// Minimal server to verify port binding
const express = require('express');
const app = express();
const PORT = 5000;

// Basic middleware
app.use(express.json());

// Add CORS middleware to ensure proper access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Simple route to test connectivity
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', port: PORT });
});

// Route to test if the server is responding
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Server Status</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
        .status { font-size: 24px; margin: 20px; }
        .success { color: green; }
      </style>
    </head>
    <body>
      <h1>SendAfrika API Server</h1>
      <div class="status success">Server is up and running!</div>
      <div>Running on port: ${PORT}</div>
      <div>Server time: ${new Date().toISOString()}</div>
    </body>
    </html>
  `);
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server is running on http://0.0.0.0:${PORT}`);
  console.log(`Server ready to accept connections on port ${PORT}`);
  
  // Self-ping to check if server is responding
  setTimeout(() => {
    const http = require('http');
    const options = {
      hostname: '0.0.0.0',
      port: PORT,
      path: '/api/health',
      method: 'GET',
    };
    
    const req = http.request(options, (res) => {
      console.log(`Server health check status: ${res.statusCode}`);
      res.on('data', (chunk) => {
        console.log(`Health check response: ${chunk.toString()}`);
        console.log('Server health check successful - ready to accept connections');
      });
    });
    
    req.on('error', (error) => {
      console.error('Health check error:', error.message);
    });
    
    req.end();
  }, 1000); // Wait 1 second before pinging
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});