const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const masterConfig = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'DESKTOP-UVIULNA'};Database=master;Trusted_Connection=yes;TrustServerCertificate=yes;`
};

async function setupDatabase() {
    try {
        console.log('Connecting to master database...');
        let pool = await sql.connect(masterConfig);
        
        console.log('Checking if Airline database exists...');
        const dbCheck = await pool.request().query("SELECT * FROM sys.databases WHERE name = 'Airline'");
        
        if (dbCheck.recordset.length === 0) {
            console.log('Creating Airline database...');
            await pool.request().query("CREATE DATABASE Airline");
            console.log('Database created successfully!');
        } else {
            console.log('Airline database already exists.');
        }
        await pool.close();

        console.log('Connecting to Airline database...');
        const airlineConfig = { 
            connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'DESKTOP-UVIULNA'};Database=Airline;Trusted_Connection=yes;TrustServerCertificate=yes;` 
        };
        pool = await sql.connect(airlineConfig);
        
        console.log('Creating Users table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
            CREATE TABLE Users (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                Username NVARCHAR(50) NOT NULL,
                Email NVARCHAR(100) UNIQUE NOT NULL,
                PasswordHash NVARCHAR(255) NOT NULL,
                CreatedAt DATETIME DEFAULT GETDATE()
            )
        `);
        console.log('Users table ready!');
        await pool.close();
        
        console.log('\n--- SETUP COMPLETE ---');
        console.log('You can now run: npm start');
    } catch (err) {
        console.error('Database setup failed:', err);
    }
}

setupDatabase();
