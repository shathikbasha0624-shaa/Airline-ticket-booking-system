const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const config = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'DESKTOP-UVIULNA'};Database=Airline;Trusted_Connection=yes;TrustServerCertificate=yes;`
};

async function migrateDb() {
    try {
        let pool = await sql.connect(config);
        
        console.log('Adding Class and TotalPrice columns to Bookings...');
        
        try {
            await pool.request().query("ALTER TABLE Bookings ADD FlightClass NVARCHAR(50) DEFAULT 'Economy'");
            console.log('Added FlightClass');
        } catch (e) { console.log('FlightClass might already exist.'); }

        try {
            await pool.request().query("ALTER TABLE Bookings ADD TotalPrice DECIMAL(10,2) DEFAULT 0");
            console.log('Added TotalPrice');
        } catch (e) { console.log('TotalPrice might already exist.'); }
        
        await pool.close();
        console.log('Migration complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}
migrateDb();

