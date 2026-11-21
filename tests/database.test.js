const { pool, isTestDatabaseConfigured } = require('../src/config/db');

// Needs a dedicated test database: set TEST_DB_URL (see README). Skipped otherwise.
const describeDb = isTestDatabaseConfigured ? describe : describe.skip;

describeDb('Database Connection', () => {

    afterAll(async () => {
        await pool.end();
    });

    test(
        'should connect to PostgreSQL',
        async () => {

            const result =
                await pool.query(
                    'SELECT NOW()'
                );

            expect(
                result.rows.length
            ).toBeGreaterThan(0);

        }
    );

});
