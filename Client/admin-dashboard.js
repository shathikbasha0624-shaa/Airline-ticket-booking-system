/**
 * SkyWings Airlines - Admin Dashboard & Flight Operations Center
 * Full inventory management, real-time booking surveillance, and revenue analytics.
 * Includes Multi-Currency Conversion & Synthesized Audio Chimes.
 */

let adminFlights = [];
let allCustomerBookings = [];

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

    renderAdminFlightsTable();
    renderAdminBookingsTable(allCustomerBookings);
    calculateAdminMetrics();
    showToast(`Display currency changed to ${newCode}`, 'info');
}

// =========================================================
// 2. SYNTHESIZED WEB AUDIO API CHIME ENGINE
// =========================================================
let audioCtx = null;
let audioEnabled = localStorage.getItem('skywings_audio') !== 'false';

function initAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
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
        showToast('Operations audio feedback enabled.', 'info');
    } else {
        showToast('Operations audio feedback muted.', 'info');
    }
}

function playCabinChime() {
    if (!audioEnabled) return;
    initAudioContext();
    if (!audioCtx) return;

    try {
        const now = audioCtx.currentTime;
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.001, now);
        gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.5);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(440.0, now + 0.38);
        gain2.gain.setValueAtTime(0.001, now + 0.38);
        gain2.gain.exponentialRampToValueAtTime(0.2, now + 0.42);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.38);
        osc2.stop(now + 1.1);
    } catch (e) {}
}

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
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
    } catch (e) {}
}

function playSuccessChord() {
    if (!audioEnabled) return;
    initAudioContext();
    if (!audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const start = now + idx * 0.1;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.001, start);
            gain.gain.exponentialRampToValueAtTime(0.2, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(start);
            osc.stop(start + 0.6);
        });
    } catch (e) {}
}

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

// Initial Verification
document.addEventListener('DOMContentLoaded', async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '/index.html';
        return;
    }

    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'Admin') {
            showToast('Unauthorized access. Redirecting to passenger portal.', 'error');
            setTimeout(() => { window.location.href = '/dashboard.html'; }, 800);
            return;
        }

        const nameEl = document.getElementById('adminNameText');
        if (nameEl) nameEl.innerText = user.username || 'Super Admin';

        // Pre-fill default departure time to tomorrow 10:00 AM
        const depInput = document.getElementById('flightDeparture');
        if (depInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);
            depInput.value = tomorrow.toISOString().slice(0, 16);
        }

        // Synchronize Currency & Audio Controls
        const curSelector = document.getElementById('currencySelector');
        if (curSelector) curSelector.value = currentCurrency;

        const audioBtn = document.getElementById('audioToggleBtn');
        const audioIcon = document.getElementById('audioIcon');
        const audioText = document.getElementById('audioText');
        if (audioBtn) audioBtn.classList.toggle('active', audioEnabled);
        if (audioIcon) audioIcon.innerText = audioEnabled ? '🔊' : '🔇';
        if (audioText) audioText.innerText = audioEnabled ? 'Sound: ON' : 'Sound: OFF';

        document.addEventListener('click', () => { initAudioContext(); }, { once: true });

        await loadAdminData();
    } catch (err) {
        localStorage.removeItem('user');
        window.location.href = '/index.html';
    }
});

// Logout
function logoutAdmin() {
    localStorage.removeItem('user');
    showToast('Signed out from Admin Console.', 'info');
    setTimeout(() => { window.location.href = '/index.html'; }, 500);
}

function scrollToAdminSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// Route Preset Helper
function presetFlight(code, origin, dest, price) {
    playSeatClick();
    document.getElementById('flightNo').value = code;
    document.getElementById('flightOrigin').value = origin;
    document.getElementById('flightDestination').value = dest;
    document.getElementById('flightPrice').value = price;
    showToast(`Loaded preset for ${code} (${origin} ➔ ${dest})`, 'info');
}

// Load All Data
async function loadAdminData() {
    await Promise.all([loadFlights(), loadAllBookings()]);
    calculateAdminMetrics();
}

// Fetch Flights
async function loadFlights() {
    try {
        const res = await fetch('/api/flights');
        if (!res.ok) throw new Error('Failed to fetch flights');
        adminFlights = await res.json();
        renderAdminFlightsTable();
    } catch (err) {
        console.error(err);
        showToast('Could not load flights inventory.', 'error');
    }
}

// Fetch All Bookings
async function loadAllBookings() {
    try {
        const res = await fetch('/api/bookings/all');
        if (!res.ok) throw new Error('Failed to fetch all bookings');
        allCustomerBookings = await res.json();
        renderAdminBookingsTable(allCustomerBookings);
    } catch (err) {
        console.error(err);
        showToast('Could not load global customer reservations.', 'error');
    }
}

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

// Metrics Calculation
function calculateAdminMetrics() {
    const flightsCountEl = document.getElementById('adminTotalFlights');
    if (flightsCountEl) animateValue(flightsCountEl, 0, adminFlights.length, 650);

    const totalReservations = allCustomerBookings.length;
    const bookingsCountEl = document.getElementById('adminTotalBookings');
    if (bookingsCountEl) animateValue(bookingsCountEl, 0, totalReservations, 700);

    const activeBookings = allCustomerBookings.filter(b => b.Status !== 'Cancelled');
    const grossRevenueUSD = activeBookings.reduce((sum, b) => {
        return sum + (Number(b.TotalPrice) || Number(b.BasePrice) || 0);
    }, 0);

    const revenueEl = document.getElementById('adminGrossRevenue');
    if (revenueEl) animateValue(revenueEl, 0, grossRevenueUSD, 800, true);

    const uniqueEmails = new Set(allCustomerBookings.map(b => b.Email));
    const passengersEl = document.getElementById('adminUniquePassengers');
    if (passengersEl) animateValue(passengersEl, 0, uniqueEmails.size, 650);
}

// Render Scheduled Flights Table
function renderAdminFlightsTable() {
    const tbody = document.getElementById('adminFlightsTableBody');
    if (!tbody) return;

    if (adminFlights.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-icon">🛫</div>
                    <h4>No Scheduled Flights in Inventory</h4>
                    <p>Use the form above to add commercial flights to the airline schedule.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = adminFlights.map(f => {
        const depDate = new Date(f.DepartureTime).toLocaleString([], {
            dateStyle: 'medium', timeStyle: 'short'
        });

        return `
            <tr>
                <td>
                    <strong>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                        ${f.FlightNumber}
                    </strong>
                </td>
                <td>${f.Origin}</td>
                <td>${f.Destination}</td>
                <td>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: -1px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                    ${depDate}
                </td>
                <td><strong style="color: var(--primary); font-family: 'Space Grotesk', sans-serif;">${formatPrice(f.Price)}</strong></td>
                <td style="text-align: right;">
                    <button type="button" class="btn-danger-outline" onclick="deleteFlightRecord('${f.Id || f.id}', '${f.FlightNumber}')">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: -1px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Delete Flight
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Render All Bookings Table
function renderAdminBookingsTable(bookings) {
    const tbody = document.getElementById('adminAllBookingsBody');
    if (!tbody) return;

    if (bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h4>No Customer Bookings Found</h4>
                    <p>Passenger reservations will populate here in real time.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = bookings.map(b => {
        const date = new Date(b.BookingDate).toLocaleDateString();
        const priceUSD = Number(b.TotalPrice) || Number(b.BasePrice) || 0;
        const fClass = b.FlightClass || 'Economy';

        let classPill = 'economy';
        if (fClass === 'Business') classPill = 'business';
        if (fClass === 'First Class') classPill = 'first';

        const isCancelled = b.Status === 'Cancelled';
        const statusClass = isCancelled ? 'cancelled' : 'confirmed';

        return `
            <tr>
                <td><strong>#BK-${b.BookingId}</strong></td>
                <td>
                    <div style="font-weight: 600;">${b.Username}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">Booked: ${date}</div>
                </td>
                <td><code>${b.Email}</code></td>
                <td><span class="airline-code-badge" style="font-size: 11px;">${b.FlightNumber}</span></td>
                <td>${b.Origin} ➔ ${b.Destination}</td>
                <td>
                    <span class="class-pill ${classPill}">${fClass}</span>
                    <div style="font-size: 11px; font-weight: 700; color: var(--primary-light); margin-top: 4px;">💺 Seat: ${b.SeatNumber || '14A'}</div>
                </td>
                <td><strong style="color: var(--success); font-family: 'Space Grotesk', sans-serif;">${formatPrice(priceUSD)}</strong></td>
                <td><span class="status-pill ${statusClass}">● ${b.Status || 'Confirmed'}</span></td>
                <td style="text-align: right;">
                    ${!isCancelled ? `
                        <button type="button" class="btn-danger-outline" onclick="adminCancelBooking('${b.BookingId || b.Id}')">
                            Cancel Booking
                        </button>
                    ` : '<span style="font-size: 12px; color: var(--text-muted);">Cancelled</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

// Filter Admin Bookings
function filterAdminBookings() {
    const term = document.getElementById('bookingSearchInput')?.value.toLowerCase().trim() || '';
    const filtered = allCustomerBookings.filter(b => {
        const name = (b.Username || '').toLowerCase();
        const email = (b.Email || '').toLowerCase();
        const fNum = (b.FlightNumber || '').toLowerCase();
        const origin = (b.Origin || '').toLowerCase();
        const dest = (b.Destination || '').toLowerCase();
        return name.includes(term) || email.includes(term) || fNum.includes(term) || origin.includes(term) || dest.includes(term);
    });
    renderAdminBookingsTable(filtered);
}

// Handle Add New Flight
async function handleCreateFlight(event) {
    event.preventDefault();

    const flightNumber = document.getElementById('flightNo').value.trim();
    const origin = document.getElementById('flightOrigin').value.trim();
    const destination = document.getElementById('flightDestination').value.trim();
    const departureTime = document.getElementById('flightDeparture').value;
    const price = document.getElementById('flightPrice').value;

    const submitBtn = document.getElementById('addFlightSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Publishing...';

    try {
        const res = await fetch('/api/flights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                flightNumber,
                origin,
                destination,
                departureTime,
                price: parseFloat(price)
            })
        });

        const data = await res.json();

        if (res.ok) {
            playSuccessChord();
            showToast(`Flight ${flightNumber} published successfully!`, 'success');
            document.getElementById('addFlightForm').reset();
            await loadFlights();
            calculateAdminMetrics();
            scrollToAdminSection('flightOpsSection');
        } else {
            showToast(data.error || 'Failed to add flight.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server error publishing flight.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
            Publish Flight to Schedule
        `;
    }
}

// Delete Flight Record
async function deleteFlightRecord(flightId, flightNumber) {
    if (!confirm(`Are you sure you want to remove Flight ${flightNumber}? This will also cancel any linked bookings.`)) return;

    try {
        const res = await fetch(`/api/flights/${flightId}`, {
            method: 'DELETE'
        });

        const data = await res.json();
        if (res.ok) {
            playCabinChime();
            showToast(`Flight ${flightNumber} removed from inventory.`, 'info');
            await loadAdminData();
        } else {
            showToast(data.error || 'Failed to delete flight.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server error deleting flight.', 'error');
    }
}

// Admin Cancel Customer Booking
async function adminCancelBooking(bookingId) {
    if (!confirm(`Cancel Booking #BK-${bookingId}? Passenger will be notified.`)) return;

    try {
        const res = await fetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE'
        });

        const data = await res.json();
        if (res.ok) {
            playSeatClick();
            showToast(`Booking #BK-${bookingId} marked as Cancelled.`, 'info');
            await loadAllBookings();
            calculateAdminMetrics();
        } else {
            showToast(data.error || 'Could not cancel booking.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server error cancelling booking.', 'error');
    }
}
