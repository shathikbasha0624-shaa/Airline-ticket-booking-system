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

    // Load Data Fast
    await Promise.all([fetchFlights(), fetchMyBookings()]);
});

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
        if (metricEl) metricEl.innerText = allFlights.length;
        
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
    if (tripsMetricEl) tripsMetricEl.innerText = confirmedCount;

    const spentMetricEl = document.getElementById('metricTotalSpent');
    if (spentMetricEl) spentMetricEl.innerText = `$${totalSpent.toFixed(2)}`;
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
                    <span class="airline-code-badge">✈️ ${f.FlightNumber}</span>
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
                        <span class="plane-icon-travel">✈</span>
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
                        <span>📅</span>
                        <span>Departure: <strong>${depDate}</strong></span>
                    </div>
                    <div class="amenity-chips">
                        <span class="amenity-chip">🧳 23kg Bag</span>
                        <span class="amenity-chip">📶 In-flight WiFi</span>
                        <span class="amenity-chip">🍽️ Meals Included</span>
                    </div>
                </div>

                <div class="flight-card-bottom">
                    <div class="flight-price-box">
                        <span class="price-caption">${priceCaption}</span>
                        <span class="price-figure">$${displayPrice.toFixed(2)}</span>
                    </div>
                    <button type="button" class="btn-book-card" onclick="openBookingModal('${flightIdStr}')">
                        <span>Book Flight</span>
                        <span class="plane-arrow">✈</span>
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
                    <span class="airline-code-badge" style="font-size: 11px;">✈️ ${b.FlightNumber}</span>
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
                            🎫 E-Ticket
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
        confirmBtn.innerHTML = '<span>✈️ Securing Seat & Processing...</span>';
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
            showToast('🎉 Reservation Confirmed! E-ticket issued in your trips.', 'success');
            
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
            confirmBtn.innerHTML = '<span>💳 Reserve & Pay Now</span>';
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
}

function closeBoardingPassModal() {
    const modal = document.getElementById('boardingPassModal');
    if (modal) modal.classList.remove('active');
}
