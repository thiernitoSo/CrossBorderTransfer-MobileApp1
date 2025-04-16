// Minimal server to verify port binding

const express = require('express');
const app = express();
const PORT = 5000;

// Basic middleware
app.use(express.json());

// Simple route to test connectivity
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Route to test if the server is responding
app.get('/', (req, res) => {
  res.send('Server is up and running!');
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server is running on http://0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});