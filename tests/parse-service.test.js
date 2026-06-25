const parseService =
    require('../src/services/parseService');

describe('Parse Service', () => {

    test(
        'should return parsed resume data',
        async () => {

            const result =
                await parseService.extractResumeData(
                    'uploads/sample.pdf',
                    'application/pdf'
                );

            expect(result).toHaveProperty(
                'personalInfo'
            );

            expect(result).toHaveProperty(
                'skills'
            );

            expect(result).toHaveProperty(
                'experience'
            );

        }
    );

});