/**
 * SkyWings Airlines - Passenger Dashboard Engine
 * Features:
 * - Pure Web Audio API Synthesized In-Flight Chimes (Ding-Dong & Seat Click)
 * - Real-Time Multi-Currency Conversion Engine (USD, EUR, GBP, INR, AED, JPY)
 * - Interactive 2D Aircraft Cabin Fuselage Seat Map (Royal Suites, Business 2-2, Exit Row, Economy 3-3)
 * - In-Flight Extra Add-Ons (Baggage, Gourmet Dining, Wi-Fi, Travel Protection)
 * - Live Laser Barcode Scanner on Boarding Pass & Real-Time Departure Countdown
 * - Dynamic City Quick-Filter Chips & Departure Time Filters
 * - Micro-Animations, Glassmorphism & Confetti Celebration
 */

let allFlights = [];
let myBookings = [];
let activeUser = null;

// Modal & Customization State
let currentSelectedFlight = null;
let currentTierName = 'Economy';
let currentTierMultiplier = 1;
let currentAssignedSeat = '6A';
let currentSeatSurcharge = 0;
let currentAddons = {
    baggage: false,
    meal: false,
    wifi: false,
    insurance: false
};
let currentModalStep = 1;
let newlyBookedId = null;
let countdownIntervalId = null;

// =========================================================
// 1. MULTI-CURRENCY CONVERSION SYSTEM
// =========================================================
const CURRENCIES = {
    USD: { symbol: '$', rate: 1.0, decimals: 2 },
    EUR: { symbol: '€', rate: 0.92, decimals: 2 },
    GBP: { symbol: '£', rate: 0.79, decimals: 2 },
    INR: { symbol: '₹', rate: 83.5, decimals: 0 },
    AED: { symbol: 'AED ', rate: 3.67, decimals: 2 },
    JPY: { symbol: '¥', rate: 155.0, decimals: 0 }
};

let currentCurrency = localStorage.getItem('skywings_currency') || 'USD';

function formatPrice(usdAmount) {
    const cur = CURRENCIES[currentCurrency] || CURRENCIES.USD;
    const converted = Number(usdAmount || 0) * cur.rate;
    return `${cur.symbol}${converted.toLocaleString(undefined, {
        minimumFractionDigits: cur.decimals,
        maximumFractionDigits: cur.decimals
    })}`;
}

function changeCurrency(newCode) {
    if (!CURRENCIES[newCode]) return;
    currentCurrency = newCode;
    localStorage.setItem('skywings_currency', newCode);
    playSeatClick();

    // Re-render UI components with new currency
    handleFilterChange();
    updateMetricsAndBadges();
    renderBookingsTable();

    // Recalculate modal if open
    if (currentSelectedFlight) {
        updateModalCalculations();
    }

    showToast(`Currency switched to ${newCode} (${CURRENCIES[newCode].symbol})`, 'info');
}

// =========================================================
// 2. SYNTHESIZED WEB AUDIO API IN-FLIGHT CHIME ENGINE
// =========================================================
let audioCtx = null;
let audioEnabled = localStorage.getItem('skywings_audio') !== 'false';

function initAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function toggleAudio() {
    audioEnabled = !audioEnabled;
    localStorage.setItem('skywings_audio', audioEnabled ? 'true' : 'false');

    const btn = document.getElementById('audioToggleBtn');
    const icon = document.getElementById('audioIcon');
    const text = document.getElementById('audioText');

    if (btn) btn.classList.toggle('active', audioEnabled);
    if (icon) icon.innerText = audioEnabled ? '🔊' : '🔇';
    if (text) text.innerText = audioEnabled ? 'Sound: ON' : 'Sound: OFF';

    if (audioEnabled) {
        initAudioContext();
        playCabinChime();
        showToast('In-Flight sound effects enabled.', 'info');
    } else {
        showToast('In-Flight sound effects muted.', 'info');
    }
}

// Iconic Airplane Two-Tone "Ding-Dong" Call Chime (Boeing/Airbus Style)
function playCabinChime() {
    if (!audioEnabled) return;
    initAudioContext();
    if (!audioCtx) return;

    try {
        const now = audioCtx.currentTime;

        // Tone 1: High Tone (D5 - 587.33 Hz)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.001, now);
        gain1.gain.exponentialRampToValueAtTime(0.28, now + 0.04);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.55);

        // Tone 2: Low Tone (A4 - 440 Hz) starting slightly after
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(440.0, now + 0.42);
        gain2.gain.setValueAtTime(0.001, now + 0.42);
        gain2.gain.exponentialRampToValueAtTime(0.24, now + 0.46);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.42);
        osc2.stop(now + 1.25);
    } catch (e) {
        console.warn('Audio play prevented:', e);
    }
}

// Soft Crisp Click for Seat / Addon Toggles
function playSeatClick() {
    if (!audioEnabled) return;
    initAudioContext();
    if (!audioCtx) return;

    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1180, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.04);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
    } catch (e) {
        // Silently catch
    }
}

// Ascending Victory Chord for Booking Confirmation
function playSuccessChord() {
    if (!audioEnabled) return;
    initAudioContext();
    if (!audioCtx) return;

    try {
        const now = audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const start = now + idx * 0.1;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.001, start);
            gain.gain.exponentialRampToValueAtTime(0.22, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.65);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(start);
            osc.stop(start + 0.65);
        });
    } catch (e) {
        console.warn('Chord audio prevented:', e);
    }
}

// =========================================================
// 3. TOAST NOTIFICATION ENGINE
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
    }, 4200);
}

// =========================================================
// 4. INITIALIZATION & DATA LOADING
// =========================================================
document.addEventListener('DOMContentLoaded', async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '/index.html';
        return;
    }

    try {
        activeUser = JSON.parse(userStr);
    } catch (e) {
        localStorage.removeItem('user');
        window.location.href = '/index.html';
        return;
    }

    // Set User Profile UI
    const nameEl = document.getElementById('userNameText');
    const avatarEl = document.getElementById('userAvatarLetter');
    if (nameEl) nameEl.innerText = activeUser.username || 'Passenger';
    if (avatarEl && activeUser.username) {
        avatarEl.innerText = activeUser.username.charAt(0).toUpperCase();
    }

    // Dynamic Time-of-Day Customer Welcome
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';

    const greetingTimeEl = document.getElementById('greetingTimeText');
    const heroWelcomeEl = document.getElementById('heroWelcomeName');
    if (greetingTimeEl) greetingTimeEl.innerText = greeting;
    if (heroWelcomeEl && activeUser?.username) heroWelcomeEl.innerText = activeUser.username;

    // Currency selector synchronization
    const curSelector = document.getElementById('currencySelector');
    if (curSelector) curSelector.value = currentCurrency;

    // Audio toggle button synchronization
    const audioBtn = document.getElementById('audioToggleBtn');
    const audioIcon = document.getElementById('audioIcon');
    const audioText = document.getElementById('audioText');
    if (audioBtn) audioBtn.classList.toggle('active', audioEnabled);
    if (audioIcon) audioIcon.innerText = audioEnabled ? '🔊' : '🔇';
    if (audioText) audioText.innerText = audioEnabled ? 'Sound: ON' : 'Sound: OFF';

    // Unlock Web Audio on first user interaction
    document.addEventListener('click', () => { initAudioContext(); }, { once: true });

    // Close modals on overlay backdrop click
    window.addEventListener('click', (e) => {
        const bookingModal = document.getElementById('bookingModal');
        const bpModal = document.getElementById('boardingPassModal');
        if (e.target === bookingModal) {
            closeBookingModal();
        }
        if (e.target === bpModal) {
            closeBoardingPassModal();
        }
    });

    // Close modals on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeBookingModal();
            closeBoardingPassModal();
        }
    });

    // Load Flights & User Bookings concurrently
    await Promise.all([fetchFlights(), fetchMyBookings()]);
});

// Smooth Value Counter Animation for Metrics
function animateValue(element, start, end, duration = 750, isCurrency = false) {
    if (!element) return;
    let startTimestamp = null;
    const cur = CURRENCIES[currentCurrency] || CURRENCIES.USD;

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = start + (end - start) * easeOut;

        if (isCurrency) {
            const converted = currentVal * cur.rate;
            element.innerText = `${cur.symbol}${converted.toLocaleString(undefined, {
                minimumFractionDigits: cur.decimals,
                maximumFractionDigits: cur.decimals
            })}`;
        } else {
            element.innerText = Math.round(currentVal).toString();
        }

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            if (isCurrency) {
                const finalConverted = end * cur.rate;
                element.innerText = `${cur.symbol}${finalConverted.toLocaleString(undefined, {
                    minimumFractionDigits: cur.decimals,
                    maximumFractionDigits: cur.decimals
                })}`;
            } else {
                element.innerText = end.toString();
            }
        }
    };
    window.requestAnimationFrame(step);
}

// Logout
function logoutUser() {
    localStorage.removeItem('user');
    showToast('Signed out successfully.', 'info');
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 400);
}

// Scroll Helper
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// Fetch Flights
async function fetchFlights() {
    try {
        const res = await fetch('/api/flights');
        if (!res.ok) throw new Error('Failed to fetch flights');
        allFlights = await res.json();

        const metricEl = document.getElementById('metricTotalFlights');
        if (metricEl) animateValue(metricEl, 0, allFlights.length, 650);

        renderFlightsGrid(allFlights);
    } catch (err) {
        console.error('Error loading flights:', err);
        showToast('Could not load flights schedule.', 'error');
    }
}

// Fetch User Bookings
async function fetchMyBookings() {
    const userId = activeUser?.id || activeUser?.Id;
    if (!userId) return;

    try {
        const res = await fetch(`/api/bookings/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch user bookings');
        myBookings = await res.json();

        updateMetricsAndBadges();
        renderBookingsTable();
    } catch (err) {
        console.error('Error loading bookings:', err);
        showToast('Could not load your bookings.', 'error');
    }
}

// Update Metrics & Badges
function updateMetricsAndBadges() {
    const confirmedCount = myBookings.filter(b => b.Status !== 'Cancelled').length;

    const totalSpentUSD = myBookings
        .filter(b => b.Status !== 'Cancelled')
        .reduce((sum, b) => sum + (Number(b.TotalPrice) || Number(b.BasePrice) || 0), 0);

    const badgeEl = document.getElementById('myBookingsCountBadge');
    if (badgeEl) badgeEl.innerText = confirmedCount;

    const tripsMetricEl = document.getElementById('metricConfirmedTrips');
    if (tripsMetricEl) animateValue(tripsMetricEl, 0, confirmedCount, 600);

    const spentMetricEl = document.getElementById('metricTotalSpent');
    if (spentMetricEl) animateValue(spentMetricEl, 0, totalSpentUSD, 750, true);
}

// Extract City & Code helper
function parseAirport(name) {
    if (!name) return { city: 'Unknown', code: 'AIR' };
    const match = name.match(/\(([^)]+)\)/);
    if (match) {
        return {
            city: name.replace(/\([^)]+\)/, '').trim(),
            code: match[1].trim()
        };
    }
    return {
        city: name,
        code: name.slice(0, 3).toUpperCase()
    };
}

// Deterministic Simulated Airport Weather Generator
function getAirportWeather(city) {
    const weatherMap = {
        'New York': '21°C ☀️ Clear',
        'London': '15°C ⛅ Broken Clouds',
        'Tokyo': '22°C 🌸 Pleasant',
        'Paris': '17°C 🌤️ Mild Breeze',
        'Dubai': '33°C ☀️ Sunny',
        'Singapore': '29°C 🌦️ Tropical'
    };
    for (const [k, v] of Object.entries(weatherMap)) {
        if (city.includes(k)) return v;
    }
    return '20°C 🌤️ Fair Weather';
}

// =========================================================
// 5. RENDER FLIGHTS GRID WITH INTERACTIVE PARALLAX & TURBINES
// =========================================================
function renderFlightsGrid(flights) {
    const grid = document.getElementById('flightsGrid');
    const countEl = document.getElementById('flightsMatchCount');
    if (!grid) return;

    if (countEl) countEl.innerText = `Showing ${flights.length} flight(s)`;

    if (flights.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">✈️</div>
                <h4>No flights match your search query</h4>
                <p>Try searching for a different city or clearing your filters.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = flights.map((f, idx) => {
        const origin = parseAirport(f.Origin);
        const destination = parseAirport(f.Destination);
        const weatherOrigin = getAirportWeather(origin.city);
        const depDate = new Date(f.DepartureTime).toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Price preview calculation
        const classFilter = document.getElementById('classFilter')?.value || 'all';
        let baseUsdPrice = Number(f.Price);
        let priceCaption = 'From';

        if (classFilter === 'Business') {
            baseUsdPrice = baseUsdPrice * 2;
            priceCaption = 'Business';
        } else if (classFilter === 'First Class') {
            baseUsdPrice = baseUsdPrice * 3;
            priceCaption = 'First Class';
        }

        const formattedPrice = formatPrice(baseUsdPrice);
        const flightIdStr = String(f.Id || f.id);

        return `
            <div class="flight-card animate-fade" style="animation-delay: ${idx * 0.04}s" onmousemove="handleCardTilt(event, this)" onmouseleave="resetCardTilt(this)">
                <div class="flight-card-top">
                    <span class="airline-code-badge">
                        <svg class="turbine-spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
                        </svg>
                        ${f.FlightNumber}
                    </span>
                    <span class="flight-status-indicator">
                        <span class="status-dot"></span> On Time
                    </span>
                </div>

                <div class="route-visualizer">
                    <div class="route-endpoint">
                        <span class="airport-code">${origin.code}</span>
                        <span class="airport-city" title="${origin.city}">${origin.city}</span>
                        <span class="flight-weather-pill">${weatherOrigin}</span>
                    </div>

                    <div class="route-midline">
                        <span class="plane-icon-travel">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#2563eb"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                        </span>
                        <div class="route-line"></div>
                        <span class="route-duration-text">Non-Stop • 787 Jet</span>
                    </div>

                    <div class="route-endpoint" style="text-align: right;">
                        <span class="airport-code">${destination.code}</span>
                        <span class="airport-city" title="${destination.city}">${destination.city}</span>
                    </div>
                </div>

                <div class="flight-meta-details">
                    <div class="flight-time-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>Departure: <strong>${depDate}</strong></span>
                    </div>
                    <div class="amenity-chips">
                        <span class="amenity-chip">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><rect x="6" y="7" width="12" height="14" rx="2"></rect><path d="M9 7V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3"></path><line x1="9" y1="21" x2="9" y2="23"></line><line x1="15" y1="21" x2="15" y2="23"></line></svg>
                            23kg Free
                        </span>
                        <span class="amenity-chip">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
                            Sat WiFi
                        </span>
                        <span class="amenity-chip">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="6" x2="6" y2="2"></line><line x1="10" y1="6" x2="10" y2="2"></line><line x1="14" y1="6" x2="14" y2="2"></line></svg>
                            Dining
                        </span>
                    </div>
                </div>

                <div class="flight-card-bottom">
                    <div class="flight-price-box">
                        <span class="price-caption">${priceCaption}</span>
                        <span class="price-figure">${formattedPrice}</span>
                    </div>
                    <button type="button" class="btn-book-card" onclick="openBookingModal('${flightIdStr}')">
                        <span>Select Seat</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 3D Card Hover Parallax Tilt
function handleCardTilt(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = (y / (rect.height / 2)) * -4;
    const tiltY = (x / (rect.width / 2)) * 4;
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
}

function resetCardTilt(card) {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
}

// =========================================================
// 6. FILTER & SEARCH HANDLERS
// =========================================================
let activeCityFilter = 'all';

function filterByCityChip(city, element) {
    activeCityFilter = city;
    document.querySelectorAll('.city-chip').forEach(c => c.classList.remove('active'));
    if (element) element.classList.add('active');
    playSeatClick();
    handleFilterChange();
}

function handleFilterChange() {
    const query = document.getElementById('searchQuery')?.value.toLowerCase().trim() || '';
    const sortBy = document.getElementById('sortBySelect')?.value || 'price-asc';
    const timeFilter = document.getElementById('timeFilter')?.value || 'all';

    let filtered = allFlights.filter(f => {
        const o = (f.Origin || '').toLowerCase();
        const d = (f.Destination || '').toLowerCase();
        const num = (f.FlightNumber || '').toLowerCase();

        // City chip filter
        if (activeCityFilter !== 'all') {
            const cityMatch = o.includes(activeCityFilter.toLowerCase()) || d.includes(activeCityFilter.toLowerCase());
            if (!cityMatch) return false;
        }

        // Text query filter
        const queryMatch = o.includes(query) || d.includes(query) || num.includes(query);
        if (!queryMatch) return false;

        // Departure time filter
        if (timeFilter !== 'all') {
            const depHour = new Date(f.DepartureTime).getHours();
            if (timeFilter === 'morning' && (depHour < 6 || depHour >= 12)) return false;
            if (timeFilter === 'afternoon' && (depHour < 12 || depHour >= 18)) return false;
            if (timeFilter === 'evening' && depHour < 18) return false;
        }

        return true;
    });

    // Sorting
    if (sortBy === 'price-asc') {
        filtered.sort((a, b) => Number(a.Price) - Number(b.Price));
    } else if (sortBy === 'price-desc') {
        filtered.sort((a, b) => Number(b.Price) - Number(a.Price));
    } else if (sortBy === 'date-asc') {
        filtered.sort((a, b) => new Date(a.DepartureTime) - new Date(b.DepartureTime));
    }

    renderFlightsGrid(filtered);
}

function resetFilters() {
    const searchInput = document.getElementById('searchQuery');
    const sortSelect = document.getElementById('sortBySelect');
    const classFilter = document.getElementById('classFilter');
    const timeFilter = document.getElementById('timeFilter');

    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'price-asc';
    if (classFilter) classFilter.value = 'all';
    if (timeFilter) timeFilter.value = 'all';

    activeCityFilter = 'all';
    document.querySelectorAll('.city-chip').forEach(c => c.classList.remove('active'));
    document.querySelector('.city-chip')?.classList.add('active');

    renderFlightsGrid(allFlights);
}

// =========================================================
// 7. USER BOOKINGS TABLE
// =========================================================
function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;

    if (myBookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-state-icon">🎫</div>
                    <h4>No Flight Reservations Found</h4>
                    <p>Select a flight above and customize your seat class to make your first booking.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = myBookings.map(b => {
        const depDate = new Date(b.DepartureTime).toLocaleString([], {
            dateStyle: 'medium', timeStyle: 'short'
        });
        const paidUsd = Number(b.TotalPrice) || Number(b.BasePrice) || 0;
        const flightClass = b.FlightClass || 'Economy';

        let classPillType = 'economy';
        if (flightClass === 'Business') classPillType = 'business';
        if (flightClass === 'First Class') classPillType = 'first';

        const isCancelled = b.Status === 'Cancelled';
        const statusClass = isCancelled ? 'cancelled' : 'confirmed';

        const bookingId = String(b.BookingId || b.Id);
        const isRecent = newlyBookedId && String(newlyBookedId) === bookingId;

        return `
            <tr class="${isRecent ? 'row-highlight' : ''}">
                <td><strong>#BK-${bookingId}</strong></td>
                <td>
                    <span class="airline-code-badge" style="font-size: 11px;">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 3px;"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                        ${b.FlightNumber}
                    </span>
                </td>
                <td>
                    <div style="font-weight: 600;">${b.Origin} ➔ ${b.Destination}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Departs: ${depDate}</div>
                </td>
                <td>
                    <span class="class-pill ${classPillType}">${flightClass}</span>
                    <div style="font-size: 11px; font-weight: 700; color: var(--primary-light); margin-top: 4px;">💺 Seat: ${b.SeatNumber || '14A'}</div>
                </td>
                <td>
                    <strong style="color: var(--primary); font-family: 'Space Grotesk', sans-serif;">
                        ${formatPrice(paidUsd)}
                    </strong>
                </td>
                <td>
                    <span class="status-pill ${statusClass}">
                        ● ${b.Status || 'Confirmed'}
                    </span>
                </td>
                <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 8px;">
                        <button type="button" class="btn btn-outline" style="font-size: 12px; padding: 6px 12px;" 
                                onclick="openBoardingPassById('${bookingId}', event)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="6" cy="12" r="2"></circle><circle cx="18" cy="12" r="2"></circle></svg>
                            Boarding Pass
                        </button>
                        ${!isCancelled ? `
                            <button type="button" class="btn-danger-outline" onclick="cancelUserBooking('${bookingId}')">
                                Cancel
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// =========================================================
// 8. INTERACTIVE BOOKING MODAL & SEAT MAP CONTROLLER
// =========================================================
function switchModalStep(step) {
    currentModalStep = step;
    playSeatClick();

    const btn1 = document.getElementById('modalStepBtn1');
    const btn2 = document.getElementById('modalStepBtn2');
    const content1 = document.getElementById('modalStep1Content');
    const content2 = document.getElementById('modalStep2Content');

    if (btn1) btn1.classList.toggle('active', step === 1);
    if (btn2) btn2.classList.toggle('active', step === 2);

    if (content1) content1.style.display = (step === 1) ? 'block' : 'none';
    if (content2) content2.style.display = (step === 2) ? 'block' : 'none';
}

function openBookingModal(flightId) {
    if (!allFlights || allFlights.length === 0) {
        showToast('Flight schedule loading...', 'info');
        return;
    }

    const flight = allFlights.find(f => String(f.Id || f.id) === String(flightId));
    if (!flight) {
        showToast('Error: Flight details could not be found.', 'error');
        return;
    }

    currentSelectedFlight = flight;
    currentTierName = 'Economy';
    currentTierMultiplier = 1;
    currentSeatSurcharge = 0;
    currentAddons = { baggage: false, meal: false, wifi: false, insurance: false };

    // Reset addon UI cards
    document.querySelectorAll('.addon-card').forEach(card => card.classList.remove('selected'));

    const numEl = document.getElementById('modalFlightNumber');
    const routeEl = document.getElementById('modalRouteSummary');
    const dateEl = document.getElementById('modalFlightDate');

    if (numEl) numEl.innerText = `Flight ${flight.FlightNumber}`;
    if (routeEl) routeEl.innerText = `${flight.Origin} ➔ ${flight.Destination}`;
    if (dateEl) {
        dateEl.innerText = new Date(flight.DepartureTime).toLocaleDateString([], {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });
    }

    switchModalStep(1);
    selectClassTier('Economy', 1, false);
    pickSeat('6A', 'Economy', 0, false);

    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.add('active');
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) modalBody.scrollTop = 0;
        modal.scrollTop = 0;
    }
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.remove('active');
}

// Select Class Tier in Modal
function selectClassTier(tierName, multiplier, playSound = true) {
    currentTierName = tierName;
    currentTierMultiplier = multiplier;
    if (playSound) playSeatClick();

    // Update Card Highlighting
    const economyCard = document.getElementById('tierCardEconomy');
    const businessCard = document.getElementById('tierCardBusiness');
    const firstCard = document.getElementById('tierCardFirst');

    if (economyCard) economyCard.classList.toggle('selected', tierName === 'Economy');
    if (businessCard) businessCard.classList.toggle('selected', tierName === 'Business');
    if (firstCard) firstCard.classList.toggle('selected', tierName === 'First Class');

    // Auto-select a recommended seat in that class
    if (tierName === 'First Class') {
        pickSeat('1A', 'First Class', 0, false);
    } else if (tierName === 'Business') {
        pickSeat('3A', 'Business', 0, false);
    } else {
        if (!currentAssignedSeat.startsWith('6') && !currentAssignedSeat.startsWith('7') && !currentAssignedSeat.startsWith('5')) {
            pickSeat('6A', 'Economy', 0, false);
        }
    }

    updateModalCalculations();
}

// Pick Interactive Seat in Fuselage
function pickSeat(seatCode, seatClass, surcharge = 0, playSound = true) {
    currentAssignedSeat = seatCode;
    currentSeatSurcharge = surcharge;
    if (playSound) playSeatClick();

    // Update visual seat elements in cabin
    document.querySelectorAll('.cabin-seat-unit').forEach(s => s.classList.remove('selected'));
    const seatEl = document.getElementById(`seat_${seatCode}`);
    if (seatEl) seatEl.classList.add('selected');

    // Update seat text badges
    const seatBadge = document.getElementById('modalAssignedSeat');
    const seatTextBadge = document.getElementById('currentSeatBadgeText');
    if (seatBadge) seatBadge.innerText = seatCode;
    if (seatTextBadge) seatTextBadge.innerText = seatCode;

    // Sync class tier if seat belongs to another tier
    if (seatClass === 'First Class' && currentTierName !== 'First Class') {
        selectClassTier('First Class', 3, false);
    } else if (seatClass === 'Business' && currentTierName !== 'Business') {
        selectClassTier('Business', 2, false);
    }

    updateModalCalculations();
}

// Toggle Add-on Service
function toggleAddon(addonKey, usdPrice) {
    currentAddons[addonKey] = !currentAddons[addonKey];
    playSeatClick();

    const cardIdMap = {
        baggage: 'addonBaggageCard',
        meal: 'addonMealCard',
        wifi: 'addonWifiCard',
        insurance: 'addonInsuranceCard'
    };

    const card = document.getElementById(cardIdMap[addonKey]);
    if (card) {
        card.classList.toggle('selected', currentAddons[addonKey]);
    }

    updateModalCalculations();
}

// Recalculate Live Fares in Modal
function updateModalCalculations() {
    if (!currentSelectedFlight) return;
    const baseFareUSD = Number(currentSelectedFlight.Price);
    const tierMultiplier = currentTierMultiplier;
    const classSurchargeUSD = baseFareUSD * (tierMultiplier - 1);

    // Compute Add-ons
    let addonsTotalUSD = 0;
    const activeAddonsList = [];
    if (currentAddons.baggage) { addonsTotalUSD += 45; activeAddonsList.push('Extra Bag'); }
    if (currentAddons.meal) { addonsTotalUSD += 18; activeAddonsList.push('Gourmet Dining'); }
    if (currentAddons.wifi) { addonsTotalUSD += 15; activeAddonsList.push('Sat Wi-Fi'); }
    if (currentAddons.insurance) { addonsTotalUSD += 28; activeAddonsList.push('Travel Shield'); }

    const seatSurchargeUSD = currentSeatSurcharge || 0;
    const taxesUSD = 35.00;
    const grandTotalUSD = (baseFareUSD * tierMultiplier) + seatSurchargeUSD + addonsTotalUSD + taxesUSD;

    // Elements
    const baseEl = document.getElementById('calcBaseFare');
    const labelEl = document.getElementById('calcClassLabel');
    const surchargeEl = document.getElementById('calcClassSurcharge');
    const seatRow = document.getElementById('breakdownSeatRow');
    const seatNameEl = document.getElementById('calcSeatName');
    const seatSurchargeEl = document.getElementById('calcSeatSurcharge');
    const extrasRow = document.getElementById('breakdownExtrasRow');
    const extrasListEl = document.getElementById('calcExtrasList');
    const extrasSurchargeEl = document.getElementById('calcExtrasSurcharge');
    const taxesEl = document.getElementById('calcTaxesFare');
    const totalEl = document.getElementById('calcTotalFare');

    if (baseEl) baseEl.innerText = formatPrice(baseFareUSD);
    if (labelEl) labelEl.innerText = currentTierName;
    if (surchargeEl) surchargeEl.innerText = `+${formatPrice(classSurchargeUSD)}`;

    if (seatRow) {
        if (seatSurchargeUSD > 0) {
            seatRow.style.display = 'flex';
            if (seatNameEl) seatNameEl.innerText = currentAssignedSeat;
            if (seatSurchargeEl) seatSurchargeEl.innerText = `+${formatPrice(seatSurchargeUSD)}`;
        } else {
            seatRow.style.display = 'none';
        }
    }

    if (extrasRow) {
        if (addonsTotalUSD > 0) {
            extrasRow.style.display = 'flex';
            if (extrasListEl) extrasListEl.innerText = activeAddonsList.join(', ');
            if (extrasSurchargeEl) extrasSurchargeEl.innerText = `+${formatPrice(addonsTotalUSD)}`;
        } else {
            extrasRow.style.display = 'none';
        }
    }

    if (taxesEl) taxesEl.innerText = formatPrice(taxesUSD);
    if (totalEl) totalEl.innerText = formatPrice(grandTotalUSD);
}

// =========================================================
// 9. CONFIRMATION & PAYMENT PROCESSOR
// =========================================================
async function processFlightBooking() {
    const userId = activeUser?.id || activeUser?.Id;
    if (!userId) {
        showToast('Please sign in to confirm this reservation.', 'warning');
        setTimeout(() => { window.location.href = '/index.html'; }, 1000);
        return;
    }

    if (!currentSelectedFlight) {
        showToast('No flight selected.', 'error');
        return;
    }

    const confirmBtn = document.getElementById('confirmBookingBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="turbine-spin-icon"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            <span>Locking Seat & Issuing Ticket...</span>
        `;
    }

    const baseFare = Number(currentSelectedFlight.Price);
    let addonsTotalUSD = 0;
    if (currentAddons.baggage) addonsTotalUSD += 45;
    if (currentAddons.meal) addonsTotalUSD += 18;
    if (currentAddons.wifi) addonsTotalUSD += 15;
    if (currentAddons.insurance) addonsTotalUSD += 28;

    const grandTotalFare = (baseFare * currentTierMultiplier) + (currentSeatSurcharge || 0) + addonsTotalUSD + 35.00;
    const flightId = currentSelectedFlight.Id || currentSelectedFlight.id;

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                flightId: flightId,
                flightClass: currentTierName,
                totalPrice: grandTotalFare,
                seatNumber: currentAssignedSeat || '6A'
            })
        });

        const data = await response.json();

        if (response.ok) {
            closeBookingModal();
            playSuccessChord();
            launchConfetti();
            showToast(`Reservation Confirmed! Seat ${currentAssignedSeat} booked.`, 'success');

            // Refresh user trips
            await fetchMyBookings();

            if (myBookings.length > 0) {
                newlyBookedId = myBookings[0].BookingId || myBookings[0].Id;
                renderBookingsTable();
            }

            setTimeout(() => {
                scrollToSection('bookingsSection');
            }, 300);
        } else {
            showToast(data.error || 'Failed to complete reservation.', 'error');
        }
    } catch (err) {
        console.error('Booking submission error:', err);
        showToast('Network error processing booking.', 'error');
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                <span>Confirm & Reserve Flight</span>
            `;
        }
    }
}

// Cancel Booking
async function cancelUserBooking(bookingId) {
    if (!confirm('Are you sure you wish to cancel this flight reservation?')) return;

    try {
        const res = await fetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE'
        });

        const data = await res.json();
        if (res.ok) {
            playSeatClick();
            showToast('Flight reservation has been cancelled.', 'info');
            await fetchMyBookings();
        } else {
            showToast(data.error || 'Could not cancel booking.', 'error');
        }
    } catch (err) {
        console.error('Error cancelling booking:', err);
        showToast('Server error cancelling booking.', 'error');
    }
}

// =========================================================
// 10. REALISTIC BOARDING PASS & LASER SCANNER CONTROLLER
// =========================================================
function openBoardingPassById(bookingId, event) {
    if (event && event.stopPropagation) {
        event.stopPropagation();
    }

    let booking = myBookings.find(b => String(b.BookingId || b.Id || b.id) === String(bookingId));
    if (!booking && myBookings.length > 0) {
        booking = myBookings[0];
    }

    if (!booking) {
        showToast('Boarding pass details not available.', 'error');
        return;
    }

    const modal = document.getElementById('boardingPassModal');
    if (!modal) return;

    const pName = document.getElementById('bpPassengerName');
    const fNum = document.getElementById('bpFlightNumber');
    const fOrig = document.getElementById('bpOrigin');
    const fDest = document.getElementById('bpDestination');
    const fClass = document.getElementById('bpClass');
    const fDate = document.getElementById('bpDate');
    const fGate = document.getElementById('bpGate');
    const fSeat = document.getElementById('bpSeat');

    if (pName) pName.innerText = activeUser?.username || 'Passenger';
    if (fNum) fNum.innerText = booking.FlightNumber || 'SW-101';
    if (fOrig) fOrig.innerText = booking.Origin || 'Origin';
    if (fDest) fDest.innerText = booking.Destination || 'Destination';
    if (fClass) fClass.innerText = booking.FlightClass || 'Economy';
    if (fGate) fGate.innerText = booking.Gate || 'B22';
    if (fDate) {
        try {
            fDate.innerText = booking.DepartureTime ? new Date(booking.DepartureTime).toLocaleString([], {
                dateStyle: 'medium', timeStyle: 'short'
            }) : 'Scheduled Today';
        } catch (e) {
            fDate.innerText = 'Scheduled Today';
        }
    }
    if (fSeat) fSeat.innerText = booking.SeatNumber || currentAssignedSeat || '14A';

    modal.classList.add('active');

    // Ensure ticket body and modal overlay are scrolled to top
    const ticketBody = modal.querySelector('.ticket-body');
    if (ticketBody) ticketBody.scrollTop = 0;
    modal.scrollTop = 0;

    // Play Authentic In-Flight Boarding Chime safely
    try {
        playCabinChime();
    } catch (e) {
        console.warn('Cabin chime playback failed:', e);
    }

    // Trigger Customs Stamp Animation
    const card = document.getElementById('ticketModalCard');
    if (card) {
        card.classList.remove('stamped');
        setTimeout(() => {
            card.classList.add('stamped');
        }, 120);
    }

    // Start Live Departure Countdown Timer
    startCountdown(booking.DepartureTime);
}

function closeBoardingPassModal() {
    const modal = document.getElementById('boardingPassModal');
    if (modal) modal.classList.remove('active');
    const card = document.getElementById('ticketModalCard');
    if (card) card.classList.remove('stamped');

    if (countdownIntervalId) {
        clearInterval(countdownIntervalId);
        countdownIntervalId = null;
    }
}

// Live Countdown Timer to Departure
function startCountdown(departureTimeStr) {
    if (countdownIntervalId) {
        clearInterval(countdownIntervalId);
        countdownIntervalId = null;
    }

    const countdownEl = document.getElementById('bpCountdownText');
    if (!countdownEl) return;

    let targetDate = departureTimeStr ? new Date(departureTimeStr).getTime() : NaN;
    if (isNaN(targetDate)) {
        targetDate = Date.now() + (3 * 3600 * 1000);
    }

    const update = () => {
        const now = Date.now();
        const diff = targetDate - now;

        if (diff <= 0) {
            countdownEl.innerText = 'Boarding: Now Open at Gate';
            if (countdownIntervalId) {
                clearInterval(countdownIntervalId);
                countdownIntervalId = null;
            }
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownEl.innerText = `Boarding in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    update();
    countdownIntervalId = setInterval(update, 1000);
}

// =========================================================
// 11. 3D METALLIC FOIL CONFETTI CELEBRATION ENGINE
// =========================================================
function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const pieces = [];
    const metallicFoilColors = [
        '#facc15', // 24k Gold Foil
        '#38bdf8', // Sapphire Metallic
        '#34d399', // Emerald Metallic
        '#fb7185', // Rose Gold
        '#a855f7', // Electric Violet
        '#f8fafc', // Platinum Silver
        '#60a5fa'  // Sky Blue
    ];

    for (let i = 0; i < 115; i++) {
        pieces.push({
            x: canvas.width / 2 + (Math.random() * 280 - 140),
            y: canvas.height / 2 + (Math.random() * 80 - 40),
            w: Math.random() * 12 + 6,
            h: Math.random() * 6 + 4,
            color: metallicFoilColors[Math.floor(Math.random() * metallicFoilColors.length)],
            vx: (Math.random() - 0.5) * 18,
            vy: (Math.random() - 0.85) * 16 - 3,
            rotX: Math.random() * Math.PI,
            rotY: Math.random() * Math.PI,
            rotXSpeed: (Math.random() - 0.5) * 0.18,
            rotYSpeed: (Math.random() - 0.5) * 0.18,
            gravity: 0.38,
            alpha: 1
        });
    }

    let animationFrameId;
    const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let activeCount = 0;

        pieces.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.985;
            p.rotX += p.rotXSpeed;
            p.rotY += p.rotYSpeed;
            p.alpha -= 0.008;

            if (p.alpha > 0) {
                activeCount++;
                ctx.save();
                ctx.translate(p.x, p.y);
                const scaleX = Math.cos(p.rotX);
                const scaleY = Math.sin(p.rotY);
                ctx.scale(scaleX, scaleY);
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 4;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }
        });

        if (activeCount > 0) {
            animationFrameId = requestAnimationFrame(render);
        } else {
            cancelAnimationFrame(animationFrameId);
            canvas.style.display = 'none';
        }
    };

    render();
}
