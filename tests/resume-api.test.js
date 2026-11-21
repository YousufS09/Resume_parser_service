const request = require('supertest');
const app = require('../src/app');
const path = require('path');
const parseService = require('../src/services/parseService');
const { pool, isTestDatabaseConfigured } = require('../src/config/db');

const samplePdf = path.join(__dirname, 'test-files', 'sample.pdf');

// Needs a dedicated test database: set TEST_DB_URL (see README). Skipped otherwise.
const describeDb = isTestDatabaseConfigured ? describe : describe.skip;

describeDb('Resume API', () => {

    beforeEach(async () => {
        await parseService.clearResumeStore();
    });

    afterAll(async () => {
        await pool.end();
    });

    test('POST /api/parse/resume should upload and parse a resume', async () => {

        const response = await request(app)
            .post('/api/parse/resume')
            .attach('resume', samplePdf);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Resume parsed successfully');
        expect(response.body.data).toHaveProperty('personalInfo');
        expect(response.body.resume).not.toHaveProperty('path');

    });

    test('should upload, parse, list, fetch, download, re-parse, and delete a resume', async () => {

        const uploadResponse = await request(app)
            .post('/api/parse/upload')
            .attach('resume', samplePdf);

        expect(uploadResponse.statusCode).toBe(201);
        expect(uploadResponse.body.message).toBe('Resume uploaded successfully');

        const uploadedResumeId = uploadResponse.body.data.id;

        const parseResponse = await request(app)
            .post(`/api/parse/resumes/${uploadedResumeId}/parse`);

        expect(parseResponse.statusCode).toBe(200);
        expect(parseResponse.body.data.id).toBe(uploadedResumeId);
        expect(parseResponse.body.data).toHaveProperty('data');

        const listResponse = await request(app).get('/api/parse/resumes');

        expect(listResponse.statusCode).toBe(200);
        expect(listResponse.body.data).toHaveLength(1);
        expect(listResponse.body.data[0].id).toBe(uploadedResumeId);
        expect(listResponse.body.pagination.total).toBe(1);

        const pagedResponse = await request(app).get('/api/parse/resumes?limit=1&offset=1');

        expect(pagedResponse.statusCode).toBe(200);
        expect(pagedResponse.body.data).toHaveLength(0);

        const detailResponse = await request(app).get(`/api/parse/resumes/${uploadedResumeId}`);

        expect(detailResponse.statusCode).toBe(200);
        expect(detailResponse.body.data.id).toBe(uploadedResumeId);

        const fileResponse = await request(app).get(`/api/parse/resumes/${uploadedResumeId}/file`);

        expect(fileResponse.statusCode).toBe(200);
        expect(fileResponse.headers['content-disposition']).toContain('sample.pdf');

        const reparseResponse = await request(app).post(`/api/parse/resumes/${uploadedResumeId}/reparse`);

        expect(reparseResponse.statusCode).toBe(200);
        expect(reparseResponse.body.data.id).toBe(uploadedResumeId);

        const deleteResponse = await request(app).delete(`/api/parse/resumes/${uploadedResumeId}`);

        expect(deleteResponse.statusCode).toBe(200);

        const missingResponse = await request(app).get(`/api/parse/resumes/${uploadedResumeId}`);

        expect(missingResponse.statusCode).toBe(404);

    });

});

describe('Resume API validation (no database needed)', () => {

    test('rejects unsupported file types with 400', async () => {

        const response = await request(app)
            .post('/api/parse/upload')
            .attach('resume', Buffer.from('plain text resume'), { filename: 'resume.txt', contentType: 'text/plain' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error.message).toMatch(/Only PDF and DOCX/);

    });

    test('rejects non-numeric resume ids with 400', async () => {

        const response = await request(app).get('/api/parse/resumes/abc');

        expect(response.statusCode).toBe(400);

    });

});
