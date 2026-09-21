const { poolPromise } = require('../config/db');

exports.getFlights = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Flights ORDER BY DepartureTime ASC');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching flights' });
    }
};

exports.createFlight = async (req, res) => {
    try {
        const { flightNumber, origin, destination, departureTime, price } = req.body;
        if (!flightNumber || !origin || !destination || !departureTime || !price) {
            return res.status(400).json({ error: 'All fields required' });
        }
        const pool = await poolPromise;
        await pool.request()
            .input('FlightNumber', flightNumber)
            .input('Origin', origin)
            .input('Destination', destination)
            .input('DepartureTime', departureTime)
            .input('Price', price)
            .query('INSERT INTO Flights (FlightNumber, Origin, Destination, DepartureTime, Price) VALUES (@FlightNumber, @Origin, @Destination, @DepartureTime, @Price)');
            
        res.status(201).json({ message: 'Flight added successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error adding flight' });
    }
};

exports.deleteFlight = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('Id', id)
            .query('DELETE FROM Bookings WHERE FlightId = @Id; DELETE FROM Flights WHERE Id = @Id;');
        res.status(200).json({ message: 'Flight deleted successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting flight' });
    }
};

