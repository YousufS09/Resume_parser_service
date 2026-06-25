const request = require('supertest');
const app = require('../src/app');
const path = require('path');

describe('Resume Upload API', () => {

    test('POST /api/parse/resume should upload resume successfully', async () => {

        const response = await request(app)
            .post('/api/parse/resume')
            .attach(
                'resume',
                path.join(__dirname, 'test-files', 'sample.pdf')
            );

        expect(response.statusCode).toBe(200);

        expect(response.body.message)
            .toBe('Resume parsed successfully');

    });

});