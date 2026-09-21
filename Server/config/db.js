const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const config = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'DESKTOP-UVIULNA'};Database=${process.env.DB_NAME || 'Airline'};Trusted_Connection=yes;TrustServerCertificate=yes;`
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL Database:', process.env.DB_NAME);
    return pool;
  })
  .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

module.exports = {
  sql, poolPromise
};

