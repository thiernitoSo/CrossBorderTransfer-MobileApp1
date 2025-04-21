const express = require('express');
const path = require('path');
const app = express();

// Set up static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Create a simple HTML page to represent our mobile app
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SendAfrika Mobile App</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
          color: #333;
        }
        .container {
          max-width: 450px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          margin-top: 30px;
        }
        header {
          background: #5a67d8;
          color: white;
          padding: 20px;
          text-align: center;
          border-top-left-radius: 15px;
          border-top-right-radius: 15px;
          margin: -20px -20px 20px -20px;
        }
        h1 {
          margin: 0;
          font-size: 24px;
        }
        .screen {
          padding: 20px;
          background: #f9f9f9;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        .button {
          display: block;
          background: #5a67d8;
          color: white;
          padding: 12px 20px;
          text-align: center;
          border-radius: 8px;
          margin-bottom: 10px;
          text-decoration: none;
          font-weight: bold;
        }
        .nav-bar {
          display: flex;
          justify-content: space-around;
          background: #fff;
          border-top: 1px solid #ddd;
          padding: 10px;
          margin: 0 -20px -20px -20px;
          border-bottom-left-radius: 15px;
          border-bottom-right-radius: 15px;
        }
        .nav-item {
          text-align: center;
          font-size: 12px;
        }
        .nav-icon {
          font-size: 24px;
          margin-bottom: 5px;
        }
        .recipient-card {
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 15px;
          background: white;
        }
        .status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        .status-success {
          background: #d1fae5;
          color: #047857;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>SendAfrika</h1>
        </header>
        
        <div class="screen">
          <h2>Dashboard</h2>
          <p>Welcome back, User!</p>
          
          <a href="#" class="button">Send Money</a>
          <a href="#" class="button" style="background: #4c51bf;">Add Beneficiary</a>
          
          <h3>Recent Transactions</h3>
          
          <div class="recipient-card">
            <p><strong>To:</strong> John Doe (Nigeria)</p>
            <p><strong>Amount:</strong> 100.00 CAD → 38,500.00 NGN</p>
            <p><strong>Date:</strong> April 16, 2025</p>
            <div class="status status-success">Completed</div>
          </div>
          
          <div class="recipient-card">
            <p><strong>To:</strong> Jane Smith (Kenya)</p>
            <p><strong>Amount:</strong> 200.00 CAD → 22,800.00 KES</p>
            <p><strong>Date:</strong> April 15, 2025</p>
            <div class="status status-pending">Pending</div>
          </div>
        </div>
        
        <div class="nav-bar">
          <div class="nav-item">
            <div class="nav-icon">🏠</div>
            <div>Home</div>
          </div>
          <div class="nav-item">
            <div class="nav-icon">💸</div>
            <div>Send</div>
          </div>
          <div class="nav-item">
            <div class="nav-icon">👥</div>
            <div>Beneficiaries</div>
          </div>
          <div class="nav-item">
            <div class="nav-icon">📋</div>
            <div>Transactions</div>
          </div>
          <div class="nav-item">
            <div class="nav-icon">👤</div>
            <div>Profile</div>
          </div>
        </div>
      </div>
      
      <script>
        // Simulate connection to API server
        fetch('https://workspace.thiernosow.repl.co/api/user')
          .then(response => {
            if (response.ok) {
              console.log('Successfully connected to backend API');
            } else {
              console.log('Backend API connection unsuccessful: ' + response.status);
            }
          })
          .catch(error => {
            console.error('Error connecting to backend API:', error);
          });
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 5002; // Changed to port 5002 to avoid conflict with MobileApp
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mobile app simulator running on http://0.0.0.0:${PORT}`);
});