const request = require('supertest');
const app = require('../src/app');
const path = require('path');
const parseService = require('../src/services/parseService');

describe('Resume Upload API', () => {

    beforeEach(async () => {
        await parseService.clearResumeStore();
    });

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

    test('should upload, parse, list, and fetch a resume', async () => {

        const uploadResponse = await request(app)
            .post('/api/parse/upload')
            .attach(
                'resume',
                path.join(__dirname, 'test-files', 'sample.pdf')
            );

        expect(uploadResponse.statusCode).toBe(201);
        expect(uploadResponse.body.message)
            .toBe('Resume uploaded successfully');

        const uploadedResumeId = uploadResponse.body.data.id;

        const parseResponse = await request(app)
            .post(`/api/parse/resumes/${uploadedResumeId}/parse`);

        expect(parseResponse.statusCode).toBe(200);
        expect(parseResponse.body.data.id).toBe(uploadedResumeId);
        expect(parseResponse.body.data).toHaveProperty('data');

        const listResponse = await request(app)
            .get('/api/parse/resumes');

        expect(listResponse.statusCode).toBe(200);
        expect(listResponse.body.data).toHaveLength(1);
        expect(listResponse.body.data[0].id).toBe(uploadedResumeId);

        const detailResponse = await request(app)
            .get(`/api/parse/resumes/${uploadedResumeId}`);

        expect(detailResponse.statusCode).toBe(200);
        expect(detailResponse.body.data.id).toBe(uploadedResumeId);

    });

});
