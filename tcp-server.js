// Extremely simple TCP server that just binds to port 5000
const net = require('net');

const server = net.createServer((socket) => {
  console.log('Client connected');
  socket.write('Hello from TCP server!\r\n');
  socket.pipe(socket);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(5000, '0.0.0.0', () => {
  console.log('TCP server is listening on port 5000');
});

// Handle process termination
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});