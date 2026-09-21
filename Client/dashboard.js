/**
 * SkyWings Airlines - Passenger Dashboard Engine
 * Handles Flight Search, Multi-Tier Booking, Real-time Metrics, & Digital Boarding Passes.
 * Fully Robust, Fast, and Micro-Interaction Ready.
 */

let allFlights = [];
let myBookings = [];
let activeUser = null;

// Modal State
let currentSelectedFlight = null;
let currentTierName = 'Economy';
let currentTierMultiplier = 1;
let currentAssignedSeat = '14A';
let newlyBookedId = null;

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

// Initialization
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

    // Load Data Fast
    await Promise.all([fetchFlights(), fetchMyBookings()]);
});

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
    
    // Total spent
    const totalSpent = myBookings
        .filter(b => b.Status !== 'Cancelled')
        .reduce((sum, b) => sum + (Number(b.TotalPrice) || Number(b.BasePrice) || 0), 0);

    const badgeEl = document.getElementById('myBookingsCountBadge');
    if (badgeEl) badgeEl.innerText = confirmedCount;

    const tripsMetricEl = document.getElementById('metricConfirmedTrips');
    if (tripsMetricEl) animateValue(tripsMetricEl, 0, confirmedCount, 600);

    const spentMetricEl = document.getElementById('metricTotalSpent');
    if (spentMetricEl) animateValue(spentMetricEl, 0, totalSpent, 750, '$', 2);
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

// Render Flights Grid
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
        const depDate = new Date(f.DepartureTime).toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Price preview calculation
        const classFilter = document.getElementById('classFilter')?.value || 'all';
        let displayPrice = Number(f.Price);
        let priceCaption = 'From';

        if (classFilter === 'Business') {
            displayPrice = displayPrice * 2;
            priceCaption = 'Business';
        } else if (classFilter === 'First Class') {
            displayPrice = displayPrice * 3;
            priceCaption = 'First Class';
        }

        const flightIdStr = String(f.Id || f.id);

        return `
            <div class="flight-card animate-fade" style="animation-delay: ${idx * 0.04}s">
                <div class="flight-card-top">
                    <span class="airline-code-badge">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
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
                    </div>

                    <div class="route-midline">
                        <span class="plane-icon-travel">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#2563eb"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                        </span>
                        <div class="route-line"></div>
                        <span class="route-duration-text">Direct Flight</span>
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
                            23kg Bag
                        </span>
                        <span class="amenity-chip">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
                            WiFi
                        </span>
                        <span class="amenity-chip">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="6" x2="6" y2="2"></line><line x1="10" y1="6" x2="10" y2="2"></line><line x1="14" y1="6" x2="14" y2="2"></line></svg>
                            Meals
                        </span>
                    </div>
                </div>

                <div class="flight-card-bottom">
                    <div class="flight-price-box">
                        <span class="price-caption">${priceCaption}</span>
                        <span class="price-figure">$${displayPrice.toFixed(2)}</span>
                    </div>
                    <button type="button" class="btn-book-card" onclick="openBookingModal('${flightIdStr}')">
                        <span>Book Flight</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Filters Handler
function handleFilterChange() {
    const query = document.getElementById('searchQuery')?.value.toLowerCase().trim() || '';
    const sortBy = document.getElementById('sortBySelect')?.value || 'price-asc';

    let filtered = allFlights.filter(f => {
        const o = (f.Origin || '').toLowerCase();
        const d = (f.Destination || '').toLowerCase();
        const num = (f.FlightNumber || '').toLowerCase();
        return o.includes(query) || d.includes(query) || num.includes(query);
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

    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'price-asc';
    if (classFilter) classFilter.value = 'all';

    renderFlightsGrid(allFlights);
}

// Render Bookings Table
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
        const paidPrice = Number(b.TotalPrice) || Number(b.BasePrice) || 0;
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
                </td>
                <td>
                    <strong style="color: var(--primary); font-family: 'Space Grotesk', sans-serif;">
                        $${paidPrice.toFixed(2)}
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
                                onclick="openBoardingPassById('${bookingId}')">
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

// Open Booking Modal - 100% Robust matching by string conversion
function openBookingModal(flightId) {
    if (!allFlights || allFlights.length === 0) {
        showToast('Flight data loading, please wait a moment.', 'info');
        return;
    }

    const flight = allFlights.find(f => String(f.Id || f.id) === String(flightId));
    if (!flight) {
        console.error('Target flight not found. Searched for:', flightId, 'In:', allFlights);
        showToast('Error: Flight details could not be found.', 'error');
        return;
    }

    currentSelectedFlight = flight;
    currentTierName = 'Economy';
    currentTierMultiplier = 1;

    // Generate random realistic seat
    const rows = [12, 14, 18, 22, 26, 4, 2];
    const letters = ['A', 'B', 'C', 'D', 'F'];
    currentAssignedSeat = `${rows[Math.floor(Math.random() * rows.length)]}${letters[Math.floor(Math.random() * letters.length)]}`;

    const numEl = document.getElementById('modalFlightNumber');
    const routeEl = document.getElementById('modalRouteSummary');
    const dateEl = document.getElementById('modalFlightDate');
    const seatEl = document.getElementById('modalAssignedSeat');

    if (numEl) numEl.innerText = `Flight ${flight.FlightNumber}`;
    if (routeEl) routeEl.innerText = `${flight.Origin} ➔ ${flight.Destination}`;
    if (dateEl) {
        dateEl.innerText = new Date(flight.DepartureTime).toLocaleDateString([], {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });
    }
    if (seatEl) seatEl.innerText = currentAssignedSeat;

    selectClassTier('Economy', 1);

    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.remove('active');
}

// Select Class Tier in Modal
function selectClassTier(tierName, multiplier) {
    currentTierName = tierName;
    currentTierMultiplier = multiplier;

    // Update Card Highlighting
    const economyCard = document.getElementById('tierCardEconomy');
    const businessCard = document.getElementById('tierCardBusiness');
    const firstCard = document.getElementById('tierCardFirst');

    if (economyCard) economyCard.classList.toggle('selected', tierName === 'Economy');
    if (businessCard) businessCard.classList.toggle('selected', tierName === 'Business');
    if (firstCard) firstCard.classList.toggle('selected', tierName === 'First Class');

    // Calculate Prices
    if (!currentSelectedFlight) return;
    const baseFare = Number(currentSelectedFlight.Price);
    const surcharge = baseFare * (multiplier - 1);
    const taxes = 35.00;
    const totalFare = (baseFare * multiplier) + taxes;

    const baseEl = document.getElementById('calcBaseFare');
    const labelEl = document.getElementById('calcClassLabel');
    const surchargeEl = document.getElementById('calcClassSurcharge');
    const totalEl = document.getElementById('calcTotalFare');

    if (baseEl) baseEl.innerText = `$${baseFare.toFixed(2)}`;
    if (labelEl) labelEl.innerText = tierName;
    if (surchargeEl) surchargeEl.innerText = `+$${surcharge.toFixed(2)}`;
    if (totalEl) totalEl.innerText = `$${totalFare.toFixed(2)}`;
}

// Confirm & Pay Reservation
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="plane-icon-travel"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
            <span>Securing Seat & Processing...</span>
        `;
    }

    const baseFare = Number(currentSelectedFlight.Price);
    const taxes = 35.00;
    const totalFare = (baseFare * currentTierMultiplier) + taxes;
    const flightId = currentSelectedFlight.Id || currentSelectedFlight.id;

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                flightId: flightId,
                flightClass: currentTierName,
                totalPrice: totalFare
            })
        });

        const data = await response.json();

        if (response.ok) {
            closeBookingModal();
            launchConfetti();
            showToast('Reservation Confirmed! E-ticket issued in your trips.', 'success');
            
            // Reload user bookings fast
            await fetchMyBookings();
            
            // Highlight the latest booking
            if (myBookings.length > 0) {
                newlyBookedId = myBookings[0].BookingId || myBookings[0].Id;
                renderBookingsTable();
            }

            // Smooth scroll to bookings section
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
                <span>Reserve & Pay Now</span>
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

// Boarding Pass Modal - 100% Robust matching by ID
function openBoardingPassById(bookingId) {
    const booking = myBookings.find(b => String(b.BookingId || b.Id) === String(bookingId));
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
    const fSeat = document.getElementById('bpSeat');

    if (pName) pName.innerText = activeUser?.username || 'Passenger';
    if (fNum) fNum.innerText = booking.FlightNumber || 'SW-000';
    if (fOrig) fOrig.innerText = booking.Origin || 'Origin';
    if (fDest) fDest.innerText = booking.Destination || 'Destination';
    if (fClass) fClass.innerText = booking.FlightClass || 'Economy';
    if (fDate) {
        fDate.innerText = new Date(booking.DepartureTime).toLocaleString([], {
            dateStyle: 'medium', timeStyle: 'short'
        });
    }
    if (fSeat) fSeat.innerText = currentAssignedSeat || '12A';

    modal.classList.add('active');

    // Trigger authentic airline customs rubber stamp animation
    const card = document.getElementById('ticketModalCard');
    if (card) {
        card.classList.remove('stamped');
        setTimeout(() => {
            card.classList.add('stamped');
        }, 120);
    }
}

function closeBoardingPassModal() {
    const modal = document.getElementById('boardingPassModal');
    if (modal) modal.classList.remove('active');
    const card = document.getElementById('ticketModalCard');
    if (card) card.classList.remove('stamped');
}

// 3D Shimmering Metallic Ribbon Confetti Engine
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

    for (let i = 0; i < 110; i++) {
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


