/**
 * SkyWings Airlines - Official Aviation Portal & Client Authentication Logic
 * 5-Star Experience: Real-time World Clocks, Radar Telemetry, Audio Synthesis, and Micro-interactions
 */

let isAudioEnabled = true;
let flightCache = [];

// =========================================================
// 1. SOUND SYNTHESIS ENGINE (Web Audio API - Zero External Dependencies)
// =========================================================
function getAudioCtx() {
    if (!isAudioEnabled) return null;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        return AudioContext ? new AudioContext() : null;
    } catch (e) {
        return null;
    }
}

function playTone(frequency, duration = 0.1, type = 'sine', gainVal = 0.15) {
    if (!isAudioEnabled) return;
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(gainVal, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    } catch (e) {}
}

function playLoginChime() {
    if (!isAudioEnabled) return;
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6 Major Flight Chime
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const noteStart = now + (idx * 0.12);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.001, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.2, noteStart + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.5);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(noteStart);
            osc.stop(noteStart + 0.5);
        });
    } catch (e) {}
}

function playTakeoffSound() {
    if (!isAudioEnabled) return;
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.6);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
    } catch (e) {}
}

function toggleAudioFx() {
    isAudioEnabled = !isAudioEnabled;
    localStorage.setItem('skywings_audio', isAudioEnabled ? '1' : '0');

    const iconEl = document.getElementById('soundIcon');
    const textEl = document.getElementById('soundText');
    const btnEl = document.getElementById('soundToggleBtn');

    if (iconEl) iconEl.innerText = isAudioEnabled ? '🔊' : '🔇';
    if (textEl) textEl.innerText = isAudioEnabled ? 'Audio: ON' : 'Audio: OFF';
    if (btnEl) btnEl.classList.toggle('muted', !isAudioEnabled);

    if (isAudioEnabled) playTone(784, 0.15, 'sine', 0.2);
    showToast(isAudioEnabled ? 'In-flight audio effects enabled.' : 'Audio effects muted.', 'info');
}

// =========================================================
// 2. TOAST NOTIFICATION ENGINE
// =========================================================
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
    }, 4500);
}

// =========================================================
// 3. LIVE WORLD AIRPORT CLOCKS
// =========================================================
function updateWorldClocks() {
    const now = new Date();

    const timezones = {
        clockLHR: 'Europe/London',
        clockJFK: 'America/New_York',
        clockDXB: 'Asia/Dubai',
        clockHND: 'Asia/Tokyo',
        clockSIN: 'Asia/Singapore'
    };

    for (const [id, tz] of Object.entries(timezones)) {
        const el = document.getElementById(id);
        if (el) {
            try {
                const formatted = new Intl.DateTimeFormat('en-GB', {
                    timeZone: tz,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).format(now);
                el.innerText = formatted;
            } catch (e) {
                el.innerText = now.toTimeString().substring(0, 8);
            }
        }
    }
}

// =========================================================
// 4. TAB CONTROLS & AUTH MODES
// =========================================================
function switchAuthTab(tab) {
    const signInContainer = document.getElementById('signInContainer');
    const signUpContainer = document.getElementById('signUpContainer');
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');
    const slider = document.getElementById('authTabSlider');

    playTone(480, 0.08, 'sine', 0.1);

    if (tab === 'signIn') {
        signInContainer.style.display = 'block';
        signUpContainer.style.display = 'none';
        tabSignIn.classList.add('active');
        tabSignUp.classList.remove('active');
        if (slider) slider.style.transform = 'translateX(0%)';
    } else {
        signInContainer.style.display = 'none';
        signUpContainer.style.display = 'block';
        tabSignUp.classList.add('active');
        tabSignIn.classList.remove('active');
        if (slider) slider.style.transform = 'translateX(100%)';
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    playTone(600, 0.05, 'sine', 0.1);
    input.type = input.type === 'password' ? 'text' : 'password';
}

function fillCredentials(email, password) {
    switchAuthTab('signIn');
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    if (emailInput && passInput) {
        emailInput.value = email;
        passInput.value = password;
        playTone(650, 0.1, 'triangle', 0.2);
        showToast(`Credentials loaded for ${email}`, 'info');
    }
}

function showForgotPasswordHint() {
    playTone(400, 0.1, 'sine');
    showToast('Demo Credentials: admin@gmail.com (123456) or test@skywings.com (123456)', 'info');
}

// Real-time password strength checker
function checkPasswordStrength(pwd) {
    const bar = document.getElementById('strengthBar');
    const label = document.getElementById('strengthLabel');
    if (!bar || !label) return;

    if (!pwd) {
        bar.style.width = '0%';
        bar.style.background = '#cbd5e1';
        label.innerText = 'Enter password';
        label.style.color = '#94a3b8';
        return;
    }

    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 8) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[A-Z]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 25;

    bar.style.width = `${score}%`;

    if (score <= 25) {
        bar.style.background = '#ef4444';
        label.innerText = 'Weak (Min 6 characters)';
        label.style.color = '#ef4444';
    } else if (score <= 50) {
        bar.style.background = '#f59e0b';
        label.innerText = 'Fair (Add numbers & uppercase)';
        label.style.color = '#f59e0b';
    } else if (score <= 75) {
        bar.style.background = '#3b82f6';
        label.innerText = 'Good Security';
        label.style.color = '#38bdf8';
    } else {
        bar.style.background = '#10b981';
        label.innerText = 'Elite 🛡️ (Strong Protection)';
        label.style.color = '#10b981';
    }
}

// =========================================================
// 5. LIVE FLIGHT RADAR & STATUS TRACKER
// =========================================================
async function loadFlightDirectory() {
    try {
        const res = await fetch('/api/flights');
        if (res.ok) {
            flightCache = await res.json();
        }
    } catch (e) {
        console.warn('Could not preload flight directory, using fallback telemetry.');
    }
}

function quickTrack(code) {
    const input = document.getElementById('landingFlightInput');
    if (input) input.value = code;
    trackFlightStatus();
}

async function trackFlightStatus() {
    const input = document.getElementById('landingFlightInput');
    const query = input ? input.value.trim().toUpperCase() : 'SW-888';

    if (!query) {
        showToast('Please enter a flight number or route to track.', 'warning');
        return;
    }

    playTone(550, 0.1, 'sine', 0.2);

    // Try finding in loaded flights or fetch fresh
    let flight = flightCache.find(f => 
        (f.FlightNumber && f.FlightNumber.toUpperCase().replace('-', '') === query.replace('-', '')) ||
        (f.FlightNumber && f.FlightNumber.toUpperCase().includes(query)) ||
        (f.Origin && f.Origin.toUpperCase().includes(query)) ||
        (f.Destination && f.Destination.toUpperCase().includes(query))
    );

    if (!flight && flightCache.length === 0) {
        try {
            const res = await fetch('/api/flights');
            if (res.ok) {
                flightCache = await res.json();
                flight = flightCache.find(f => 
                    (f.FlightNumber && f.FlightNumber.toUpperCase().replace('-', '') === query.replace('-', '')) ||
                    (f.FlightNumber && f.FlightNumber.toUpperCase().includes(query))
                );
            }
        } catch (err) {}
    }

    // Default telemetry presets for realistic aviation demonstration
    let flightCode = query;
    let originCode = 'DXB';
    let originCity = 'Dubai Intl';
    let destCode = 'SIN';
    let destCity = 'Singapore Changi';
    let aircraft = 'Boeing 787-9 Dreamliner';
    let altitude = '38,000 FT';
    let speed = '545 KTS (877 km/h)';
    let depTime = '23:00 UTC';
    let progress = 68;

    if (flight) {
        flightCode = flight.FlightNumber;
        
        // Parse airport codes if present e.g. "Dubai (DXB)"
        const originMatch = flight.Origin.match(/\(([A-Z]{3})\)/);
        originCode = originMatch ? originMatch[1] : flight.Origin.substring(0, 3).toUpperCase();
        originCity = flight.Origin.replace(/\([A-Z]{3}\)/, '').trim();

        const destMatch = flight.Destination.match(/\(([A-Z]{3})\)/);
        destCode = destMatch ? destMatch[1] : flight.Destination.substring(0, 3).toUpperCase();
        destCity = flight.Destination.replace(/\([A-Z]{3}\)/, '').trim();

        if (flight.DepartureTime) {
            depTime = new Date(flight.DepartureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Deterministic realistic progress & altitude calculation based on flight ID
        const seed = parseInt(flight.Id || '12') % 5;
        progress = 40 + (seed * 12);
        altitude = `${34000 + (seed * 1000)} FT`;
        speed = `${510 + (seed * 15)} KTS (${Math.round((510 + seed * 15) * 1.852)} km/h)`;
        aircraft = seed % 2 === 0 ? 'Boeing 787-9 Dreamliner' : 'Airbus A350-900 Ultra';
    } else {
        // Dynamic generation for any query user typed e.g. "SW101", "BA-24", etc.
        flightCode = query;
        progress = 55;
    }

    // Render telemetry
    const originCodeEl = document.getElementById('radarOriginCode');
    const originCityEl = document.getElementById('radarOriginCity');
    const destCodeEl = document.getElementById('radarDestCode');
    const destCityEl = document.getElementById('radarDestCity');
    const flightBadgeEl = document.getElementById('radarFlightCodeBadge');
    const progressEl = document.getElementById('radarPathProgress');
    const planeIconEl = document.getElementById('radarPlaneIcon');
    const aircraftEl = document.getElementById('radarAircraft');
    const altitudeEl = document.getElementById('radarAltitude');
    const speedEl = document.getElementById('radarSpeed');
    const depTimeEl = document.getElementById('radarDepTime');
    const boxEl = document.getElementById('radarTelemetryBox');

    if (originCodeEl) originCodeEl.innerText = originCode;
    if (originCityEl) originCityEl.innerText = originCity;
    if (destCodeEl) destCodeEl.innerText = destCode;
    if (destCityEl) destCityEl.innerText = destCity;
    if (flightBadgeEl) flightBadgeEl.innerText = flightCode;
    if (progressEl) progressEl.style.width = `${progress}%`;
    if (planeIconEl) planeIconEl.style.left = `${progress}%`;
    if (aircraftEl) aircraftEl.innerText = aircraft;
    if (altitudeEl) altitudeEl.innerText = altitude;
    if (speedEl) speedEl.innerText = speed;
    if (depTimeEl) depTimeEl.innerText = depTime;

    if (boxEl) {
        boxEl.classList.remove('radar-pulse');
        void boxEl.offsetWidth; // trigger reflow
        boxEl.classList.add('radar-pulse');
    }

    showToast(`Radar locked onto Flight ${flightCode} (${originCode} ➔ ${destCode})`, 'success');
}

// =========================================================
// 6. SIGN IN & REGISTRATION HANDLERS
// =========================================================
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('loginSubmitBtn');
    const rememberMe = document.getElementById('rememberMeCheckbox');

    if (!email || !password) {
        showToast('Please enter both email and password.', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('btn-loading');
    submitBtn.innerHTML = `
        <span class="btn-spinner"></span>
        <span class="btn-text">Verifying Credentials...</span>
    `;

    playTakeoffSound();

    try {
        const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            playLoginChime();
            showToast(`Welcome Aboard, ${data.user.username}! Preparing Boarding Pass...`, 'success');
            localStorage.setItem('user', JSON.stringify(data.user));

            if (rememberMe && rememberMe.checked) {
                localStorage.setItem('skywings_remembered_email', email);
            } else {
                localStorage.removeItem('skywings_remembered_email');
            }

            setTimeout(() => {
                if (data.user.role === 'Admin') {
                    window.location.href = '/admin-dashboard.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
            }, 800);
        } else {
            showToast(data.error || 'Invalid flight credentials. Please try again.', 'error');
            resetSubmitBtn(submitBtn, 'Sign In & Board Flight', '✈️');
        }
    } catch (err) {
        console.error('Login Network Error:', err);
        showToast('Cannot connect to aviation gateway. Ensure backend is running.', 'error');
        resetSubmitBtn(submitBtn, 'Sign In & Board Flight', '✈️');
    }
}

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
    submitBtn.classList.add('btn-loading');
    submitBtn.innerHTML = `
        <span class="btn-spinner"></span>
        <span class="btn-text">Enrolling Member...</span>
    `;

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            playLoginChime();
            showToast('🎉 SkyWings Membership Activated! +1,000 SkyMiles credited.', 'success');
            document.getElementById('registerForm').reset();
            resetSubmitBtn(submitBtn, 'Create SkyWings Account', '🚀');

            // Switch to sign in and auto fill email
            switchAuthTab('signIn');
            const loginEmail = document.getElementById('loginEmail');
            if (loginEmail) loginEmail.value = email;
            const loginPass = document.getElementById('loginPassword');
            if (loginPass) loginPass.focus();
        } else {
            showToast(data.error || 'Registration failed. Email might already be registered.', 'error');
            resetSubmitBtn(submitBtn, 'Create SkyWings Account', '🚀');
        }
    } catch (err) {
        console.error('Registration Network Error:', err);
        showToast('Connection error. Could not reach enrollment server.', 'error');
        resetSubmitBtn(submitBtn, 'Create SkyWings Account', '🚀');
    }
}

function resetSubmitBtn(btn, text, emoji) {
    if (!btn) return;
    btn.disabled = false;
    btn.classList.remove('btn-loading');
    btn.innerHTML = `
        <span class="btn-text">${text}</span>
        <span class="btn-takeoff-plane">${emoji}</span>
    `;
}

// =========================================================
// 7. INITIALIZATION ON DOM READY
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Restore Audio Setting
    const savedAudio = localStorage.getItem('skywings_audio');
    if (savedAudio === '0') {
        isAudioEnabled = false;
        const iconEl = document.getElementById('soundIcon');
        const textEl = document.getElementById('soundText');
        const btnEl = document.getElementById('soundToggleBtn');
        if (iconEl) iconEl.innerText = '🔇';
        if (textEl) textEl.innerText = 'Audio: OFF';
        if (btnEl) btnEl.classList.add('muted');
    }

    // 2. Restore Remembered Email
    const remembered = localStorage.getItem('skywings_remembered_email');
    if (remembered) {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) emailInput.value = remembered;
    }

    // 3. Start Live World Clocks (every second)
    updateWorldClocks();
    setInterval(updateWorldClocks, 1000);

    // 4. Preload flight data & initiate default radar tracking
    loadFlightDirectory();

    // 5. Allow enter key to trigger flight radar search
    const flightInput = document.getElementById('landingFlightInput');
    if (flightInput) {
        flightInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                trackFlightStatus();
            }
        });
    }
});
