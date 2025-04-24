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
          
          <a href="/send-money" class="button">Send Money</a>
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
        fetch('http://localhost:5001/api/user')
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

// Add the Send Money route
app.get('/send-money', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SendAfrika - Send Money</title>
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
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input, select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          box-sizing: border-box;
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
          border: none;
          cursor: pointer;
          width: 100%;
          font-size: 16px;
        }
        .analysis-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
        }
        .risk-level {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 12px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .risk-low {
          background: #d1fae5;
          color: #047857;
        }
        .risk-medium {
          background: #fef3c7;
          color: #92400e;
        }
        .risk-high {
          background: #fee2e2;
          color: #b91c1c;
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
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>Send Money</h1>
        </header>
        
        <div class="screen">
          <form id="sendMoneyForm">
            <div class="form-group">
              <label for="beneficiary">Select Beneficiary</label>
              <select id="beneficiary" name="beneficiary">
                <option value="1">Alice Smith (Nigeria)</option>
                <option value="2">Bob Johnson (Ghana)</option>
                <option value="3">Carol Williams (Kenya)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="amount">Amount (CAD)</label>
              <input type="number" id="amount" name="amount" placeholder="Enter amount" value="100">
            </div>
            
            <div class="form-group">
              <label for="destinationCurrency">Destination Currency</label>
              <select id="destinationCurrency" name="destinationCurrency">
                <option value="NGN">Nigerian Naira (NGN)</option>
                <option value="GHS">Ghanaian Cedi (GHS)</option>
                <option value="KES">Kenyan Shilling (KES)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Conversion</label>
              <p>100.00 CAD = 38,500.00 NGN</p>
              <p>Fee: 5.00 CAD</p>
              <p><strong>Total to pay: 105.00 CAD</strong></p>
            </div>
            
            <div id="transactionAnalysis" class="analysis-card">
              <h3>Transaction Analysis</h3>
              <div class="risk-level risk-low">Low Risk</div>
              <p><strong>Risk Score:</strong> 25/100</p>
              <p><strong>Risk Factors:</strong></p>
              <ul>
                <li>Test risk factor</li>
              </ul>
              <p><strong>Recommendation:</strong> This is a test response to debug the API endpoint.</p>
              
              <h4>Alternative Options:</h4>
              <p><strong>Bank transfer</strong></p>
              <p>Benefits: Secure</p>
              <p>Drawbacks: Slower</p>
            </div>
            
            <button type="submit" class="button">Continue</button>
            <a href="/" class="button" style="background: #a0aec0;">Cancel</a>
          </form>
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
        document.addEventListener('DOMContentLoaded', function() {
          // Simulate fetching data from our transaction analysis API
          fetch('http://localhost:5001/api/analyze-transaction', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: 100,
              sourceCurrency: 'CAD',
              destinationCurrency: 'NGN',
              destinationCountry: 'NG'
            })
          })
          .then(response => response.json())
          .then(data => {
            console.log('Transaction analysis data:', data);
            // You could update the UI with this data
          })
          .catch(error => {
            console.error('Error fetching transaction analysis:', error);
          });
        });
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.SIMULATOR_PORT || 5002; // Use port 5002 to avoid conflict with Expo on 5000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mobile app simulator running on http://0.0.0.0:${PORT}`);
});