const sql = require('mssql/msnodesqlv8');
const bcrypt = require('bcrypt');
require('dotenv').config();

const config = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'DESKTOP-UVIULNA'};Database=Airline;Trusted_Connection=yes;TrustServerCertificate=yes;`
};

async function createAdmin() {
    try {
        let pool = await sql.connect(config);
        
        // 1. Add Role column if it doesn't exist
        try {
            await pool.request().query("ALTER TABLE Users ADD Role NVARCHAR(20) DEFAULT 'Customer'");
            console.log("Added 'Role' column to Users table.");
        } catch (e) { console.log("Role column likely already exists."); }

        // 2. Create Admin user
        const adminEmail = 'admin@gmail.com';
        const checkAdmin = await pool.request()
            .input('Email', adminEmail)
            .query("SELECT * FROM Users WHERE Email = @Email");

        if (checkAdmin.recordset.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            await pool.request()
                .input('Username', 'Admin')
                .input('Email', adminEmail)
                .input('PasswordHash', hashedPassword)
                .input('Role', 'Admin')
                .query("INSERT INTO Users (Username, Email, PasswordHash, Role) VALUES (@Username, @Email, @PasswordHash, @Role)");
            console.log("✅ Admin user created: admin@gmail.com / 123456");
        } else {
            console.log("Admin user already exists!");
        }

        await pool.close();
        process.exit();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}
createAdmin();

