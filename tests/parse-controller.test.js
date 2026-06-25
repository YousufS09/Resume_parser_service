const parseController = require('../src/controllers/parseController');
const parseService = require('../src/services/parseService');

jest.mock('../src/services/parseService');

describe('Parse Controller', () => {

    test('should return parsed resume data', async () => {

        const mockResumeData = {
            personalInfo: {
                name: 'John Doe'
            }
        };

        parseService.extractResumeData.mockResolvedValue(mockResumeData);

        const req = {
            file: {
                path: 'uploads/sample.pdf',
                mimetype: 'application/pdf'
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        const next = jest.fn();

        await parseController.parseResume(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({
            message: 'Resume parsed successfully',
            data: mockResumeData
        });

    });

});