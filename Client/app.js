/**
 * SkyWings Airlines - Client Authentication Logic
 * Robust, Zero-Error, Smooth Micro-interactions
 */

// Toast Notification Engine
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '🔔';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => toast.remove(), 250);
        }
    }, 4000);
}

// Switch between Sign In and Sign Up tabs
function switchAuthTab(tab) {
    const signInContainer = document.getElementById('signInContainer');
    const signUpContainer = document.getElementById('signUpContainer');
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');

    if (tab === 'signIn') {
        signInContainer.style.display = 'block';
        signUpContainer.style.display = 'none';
        tabSignIn.classList.add('active');
        tabSignUp.classList.remove('active');
    } else {
        signInContainer.style.display = 'none';
        signUpContainer.style.display = 'block';
        tabSignUp.classList.add('active');
        tabSignIn.classList.remove('active');
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}

// 1-Click Demo Credentials Filler
function fillCredentials(email, password) {
    switchAuthTab('signIn');
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    if (emailInput && passInput) {
        emailInput.value = email;
        passInput.value = password;
        showToast(`Filled credentials for ${email}`, 'info');
    }
}

// Handle Sign In
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('loginSubmitBtn');

    if (!email || !password) {
        showToast('Please enter both email and password.', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Signing in...';

    try {
        const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showToast(`Welcome back, ${data.user.username}! Redirecting...`, 'success');
            localStorage.setItem('user', JSON.stringify(data.user));

            setTimeout(() => {
                if (data.user.role === 'Admin') {
                    window.location.href = '/admin-dashboard.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
            }, 800);
        } else {
            showToast(data.error || 'Invalid credentials. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In to SkyWings';
        }
    } catch (err) {
        console.error('Login Network Error:', err);
        showToast('Cannot connect to server. Please ensure backend is running.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In to SkyWings';
    }
}

// Handle Registration
async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const submitBtn = document.getElementById('regSubmitBtn');

    if (!username || !email || !password) {
        showToast('Please complete all registration fields.', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters long.', 'warning');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Creating account...';

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Account created successfully! Please sign in.', 'success');
            document.getElementById('registerForm').reset();
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create SkyWings Account';
            
            // Switch to sign in and auto fill email
            switchAuthTab('signIn');
            document.getElementById('loginEmail').value = email;
        } else {
            showToast(data.error || 'Registration failed. Email might already exist.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create SkyWings Account';
        }
    } catch (err) {
        console.error('Registration Network Error:', err);
        showToast('Connection error. Could not register account.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create SkyWings Account';
    }
}
