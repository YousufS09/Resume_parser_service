const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`Successfully connected to PostgreSQL database: ${process.env.DB_NAME}`);
    client.release();
  } catch (err) {
    console.error('Failed to connect to the database:', err.message);
    process.exit(1);
  }
};

module.exports = {
  pool,
  connectDB,
};
