document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const getStartedButton = document.getElementById('get-started-button');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const closeButtons = document.querySelectorAll('.close');
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const sendAmountInput = document.getElementById('send-amount');
    const destinationCountrySelect = document.getElementById('destination-country');
    const paymentMethodSelect = document.getElementById('payment-method');
    const transferFeeElement = document.getElementById('transfer-fee');
    const exchangeRateElement = document.getElementById('exchange-rate');
    const recipientAmountElement = document.getElementById('recipient-amount');
    const startTransferButton = document.getElementById('start-transfer-button');
    
    // Currency data
    const exchangeRates = {
        'nigeria': 432.50,
        'kenya': 115.75,
        'ghana': 12.50,
        'uganda': 3725.80,
        'tanzania': 2350.45,
        'senegal': 650.30,
        'cote-divoire': 650.30,
        'cameroon': 650.30
    };
    
    const currencyCodes = {
        'nigeria': 'NGN',
        'kenya': 'KES',
        'ghana': 'GHS',
        'uganda': 'UGX',
        'tanzania': 'TZS',
        'senegal': 'XOF',
        'cote-divoire': 'XOF',
        'cameroon': 'XAF'
    };
    
    // Fee structure
    function calculateFee(amount) {
        if (amount <= 100) {
            return 5.00;
        } else if (amount <= 500) {
            return 10.00;
        } else if (amount <= 1000) {
            return 15.00;
        } else {
            return amount * 0.015; // 1.5% for amounts over 1000
        }
    }
    
    // Modal functions
    function openModal(modal) {
        modal.style.display = 'block';
    }
    
    function closeModal(modal) {
        modal.style.display = 'none';
    }
    
    function closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            closeModal(modal);
        });
    }
    
    // Calculator function
    function updateCalculator() {
        const amount = parseFloat(sendAmountInput.value) || 0;
        const country = destinationCountrySelect.value;
        const method = paymentMethodSelect.value;
        
        const fee = calculateFee(amount);
        const rate = exchangeRates[country];
        const currency = currencyCodes[country];
        
        transferFeeElement.textContent = `CAD ${fee.toFixed(2)}`;
        exchangeRateElement.textContent = `1 CAD = ${rate.toFixed(2)} ${currency}`;
        
        // Calculate recipient amount
        const recipientAmount = (amount - fee) * rate;
        recipientAmountElement.textContent = `${currency} ${recipientAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    }
    
    // Event listeners
    loginButton.addEventListener('click', () => openModal(loginModal));
    registerButton.addEventListener('click', () => openModal(registerModal));
    getStartedButton.addEventListener('click', () => openModal(registerModal));
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal(registerModal);
            openModal(loginModal);
        });
    }
    
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal(loginModal);
            openModal(registerModal);
        });
    }
    
    // Calculator event listeners
    if (sendAmountInput && destinationCountrySelect && paymentMethodSelect) {
        sendAmountInput.addEventListener('input', updateCalculator);
        destinationCountrySelect.addEventListener('change', updateCalculator);
        paymentMethodSelect.addEventListener('change', updateCalculator);
        
        // Initialize calculator
        updateCalculator();
    }
    
    // Forms handling
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Here you would normally send a request to your server
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Login failed');
            })
            .then(data => {
                // On successful login
                window.location.href = '/dashboard.html'; // Redirect to dashboard
            })
            .catch(error => {
                alert('Login failed: ' + error.message);
            });
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('first-name').value;
            const lastName = document.getElementById('last-name').value;
            const email = document.getElementById('register-email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            // Here you would normally send a request to your server
            fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ firstName, lastName, email, phoneNumber: phone, password })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Registration failed');
            })
            .then(data => {
                // On successful registration
                alert('Registration successful! Please log in.');
                closeModal(registerModal);
                openModal(loginModal);
            })
            .catch(error => {
                alert('Registration failed: ' + error.message);
            });
        });
    }
    
    // Start Transfer button
    if (startTransferButton) {
        startTransferButton.addEventListener('click', function() {
            // Check if user is logged in
            fetch('/api/user')
                .then(response => {
                    if (response.ok) {
                        // User is logged in, redirect to send money page
                        window.location.href = '/send-money.html';
                    } else {
                        // User is not logged in, show login modal
                        openModal(loginModal);
                    }
                })
                .catch(error => {
                    console.error('Error checking login status:', error);
                    openModal(loginModal);
                });
        });
    }
});