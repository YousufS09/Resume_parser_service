const { Pool, types } = require('pg');

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of JS Dates,
// so they are not shifted by the server's timezone when serialized to JSON.
types.setTypeParser(1082, (value) => value);

const isTest = process.env.NODE_ENV === 'test';

const shouldUseSsl =
  process.env.DB_SSL === 'true' ||
  (process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false');

// Tests must never touch the application database: in test mode only TEST_DB_URL is used.
const connectionString = isTest
  ? process.env.TEST_DB_URL
  : process.env.DB_URL || process.env.DATABASE_URL;

const connectionConfig = connectionString
  ? { connectionString }
  : isTest
    ? // No test database configured: point at an address that refuses connections
      // instead of falling back to the DB_* variables of the real database.
      { host: '127.0.0.1', port: 1, database: 'no_test_database_configured' }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      };

const pool = new Pool({
  ...connectionConfig,
  options: '-c search_path=resume_parser,public',
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
});

// An idle client error (e.g. the database restarted) should not kill the whole service;
// the pool discards the broken client and creates a new one on the next request.
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    const databaseName = client.database || process.env.DB_NAME || 'configured database';
    console.log(`Successfully connected to PostgreSQL database: ${databaseName}`);
    client.release();
  } catch (err) {
    console.error('Failed to connect to the database:', err.message);
    process.exit(1);
  }
};

module.exports = {
  pool,
  connectDB,
  isTestDatabaseConfigured: Boolean(isTest && process.env.TEST_DB_URL),
};
