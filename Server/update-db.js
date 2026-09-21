const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const config = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'DESKTOP-UVIULNA'};Database=Airline;Trusted_Connection=yes;TrustServerCertificate=yes;`
};

async function updateDatabase() {
    try {
        console.log('Connecting to Airline database...');
        let pool = await sql.connect(config);
        
        console.log('Creating Flights table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Flights' AND xtype='U')
            BEGIN
                CREATE TABLE Flights (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    FlightNumber NVARCHAR(20) NOT NULL,
                    Origin NVARCHAR(50) NOT NULL,
                    Destination NVARCHAR(50) NOT NULL,
                    DepartureTime DATETIME NOT NULL,
                    Price DECIMAL(10,2) NOT NULL
                );
                
                -- Insert Dummy Flights
                INSERT INTO Flights (FlightNumber, Origin, Destination, DepartureTime, Price)
                VALUES 
                ('SW101', 'New York (JFK)', 'London (LHR)', DATEADD(day, 2, GETDATE()), 450.00),
                ('SW202', 'Los Angeles (LAX)', 'Tokyo (NRT)', DATEADD(day, 3, GETDATE()), 850.00),
                ('SW303', 'Chicago (ORD)', 'Miami (MIA)', DATEADD(day, 1, GETDATE()), 150.00),
                ('SW404', 'London (LHR)', 'Paris (CDG)', DATEADD(day, 5, GETDATE()), 90.00),
                ('SW505', 'Dubai (DXB)', 'Mumbai (BOM)', DATEADD(day, 4, GETDATE()), 220.00);
            END
        `);

        console.log('Creating Bookings table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Bookings' AND xtype='U')
            BEGIN
                CREATE TABLE Bookings (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    UserId INT FOREIGN KEY REFERENCES Users(Id),
                    FlightId INT FOREIGN KEY REFERENCES Flights(Id),
                    BookingDate DATETIME DEFAULT GETDATE(),
                    Status NVARCHAR(20) DEFAULT 'Confirmed'
                );
            END
        `);
        
        console.log('Database Tables updated with Flights and Bookings!');
        await pool.close();
    } catch (err) {
        console.error('Update failed:', err);
    }
}
updateDatabase();

