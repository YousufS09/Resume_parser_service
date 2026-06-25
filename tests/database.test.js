require('dotenv').config();

const { pool } =
    require('../src/config/db');

describe('Database Connection', () => {

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