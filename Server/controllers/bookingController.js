const { poolPromise } = require('../config/db');

exports.bookFlight = async (req, res) => {
    try {
        const { userId, flightId, flightClass, totalPrice } = req.body;
        if (!userId || !flightId) return res.status(400).json({ error: 'UserId and FlightId required' });

        const pool = await poolPromise;
        await pool.request()
            .input('UserId', userId)
            .input('FlightId', flightId)
            .input('FlightClass', flightClass || 'Economy')
            .input('TotalPrice', totalPrice || 0)
            .query('INSERT INTO Bookings (UserId, FlightId, FlightClass, TotalPrice) VALUES (@UserId, @FlightId, @FlightClass, @TotalPrice)');
            
        res.status(201).json({ message: 'Flight booked successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error booking flight' });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const userId = req.params.userId;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserId', userId)
            .query(`
                SELECT b.Id AS BookingId, f.FlightNumber, f.Origin, f.Destination, f.DepartureTime, f.Price AS BasePrice, 
                       b.FlightClass, b.TotalPrice, b.BookingDate, b.Status
                FROM Bookings b
                JOIN Flights f ON b.FlightId = f.Id
                WHERE b.UserId = @UserId
                ORDER BY b.BookingDate DESC
            `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching user bookings' });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT b.Id AS BookingId, u.Username, u.Email, f.FlightNumber, f.Origin, f.Destination, f.DepartureTime, 
                   b.FlightClass, b.TotalPrice, b.BookingDate, b.Status
            FROM Bookings b
            JOIN Flights f ON b.FlightId = f.Id
            JOIN Users u ON b.UserId = u.Id
            ORDER BY b.BookingDate DESC
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching all bookings' });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('Id', id)
            .query("UPDATE Bookings SET Status = 'Cancelled' WHERE Id = @Id");
        res.status(200).json({ message: 'Booking has been cancelled successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error cancelling booking' });
    }
};
