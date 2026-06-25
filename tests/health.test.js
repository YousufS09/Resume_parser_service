const request = require('supertest');
const app = require('../src/app');

describe('Health Check API', () => {

    test('GET /health should return status 200', async () => {

        const response = await request(app)
            .get('/health');

        expect(response.statusCode).toBe(200);

    });

    test('GET /health should return service status', async () => {

        const response = await request(app)
            .get('/health');

        expect(response.body.status).toBe('OK');

    });

});