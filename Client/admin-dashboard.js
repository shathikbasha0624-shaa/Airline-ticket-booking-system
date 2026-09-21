/**
 * SkyWings Airlines - Admin Dashboard & Flight Operations Center
 * Full inventory management, real-time booking surveillance, and revenue analytics.
 */

let adminFlights = [];
let allCustomerBookings = [];

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
        if (nameEl) nameEl.innerText = user.username || 'System Admin';

        // Pre-fill default departure time to tomorrow 10:00 AM
        const depInput = document.getElementById('flightDeparture');
        if (depInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);
            depInput.value = tomorrow.toISOString().slice(0, 16);
        }

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
function animateValue(element, start, end, duration = 750, prefix = '', decimals = 0) {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = start + (end - start) * easeOut;
        element.innerText = `${prefix}${currentVal.toFixed(decimals)}`;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.innerText = `${prefix}${end.toFixed(decimals)}`;
        }
    };
    window.requestAnimationFrame(step);
}

// Metrics Calculation
function calculateAdminMetrics() {
    // 1. Scheduled Flights
    const flightsCountEl = document.getElementById('adminTotalFlights');
    if (flightsCountEl) animateValue(flightsCountEl, 0, adminFlights.length, 650);

    // 2. Total Reservations
    const totalReservations = allCustomerBookings.length;
    const bookingsCountEl = document.getElementById('adminTotalBookings');
    if (bookingsCountEl) animateValue(bookingsCountEl, 0, totalReservations, 700);

    // 3. Gross Revenue (excluding cancelled)
    const activeBookings = allCustomerBookings.filter(b => b.Status !== 'Cancelled');
    const grossRevenue = activeBookings.reduce((sum, b) => {
        return sum + (Number(b.TotalPrice) || Number(b.BasePrice) || 0);
    }, 0);

    const revenueEl = document.getElementById('adminGrossRevenue');
    if (revenueEl) animateValue(revenueEl, 0, grossRevenue, 800, '$', 2);

    // 4. Unique Passengers
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
                <td><strong>✈️ ${f.FlightNumber}</strong></td>
                <td>${f.Origin}</td>
                <td>${f.Destination}</td>
                <td>📅 ${depDate}</td>
                <td><strong style="color: var(--primary);">$${Number(f.Price).toFixed(2)}</strong></td>
                <td style="text-align: right;">
                    <button type="button" class="btn-danger-outline" onclick="deleteFlightRecord('${f.Id || f.id}', '${f.FlightNumber}')">
                        🗑️ Delete Flight
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
        const price = Number(b.TotalPrice) || Number(b.BasePrice) || 0;
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
                <td><span class="class-pill ${classPill}">${fClass}</span></td>
                <td><strong style="color: var(--success); font-family: 'Space Grotesk', sans-serif;">$${price.toFixed(2)}</strong></td>
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
        submitBtn.innerHTML = '✈️ Publish Flight to Schedule';
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
