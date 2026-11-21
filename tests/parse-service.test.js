const path = require('path');
const os = require('os');
const fs = require('fs/promises');
const parseService = require('../src/services/parseService');

const {
    buildParsedDataFromText,
    computeConfidenceScore,
    toDate,
    toStoredFileType,
    fromStoredFileType,
} = parseService._internal;

const samplePdf = path.join(__dirname, 'test-files', 'sample.pdf');

describe('Parse Service', () => {

    test('extracts structured data from a real PDF', async () => {

        const result = await parseService.extractResumeData(samplePdf, 'application/pdf');

        expect(result).toHaveProperty('personalInfo');
        expect(Array.isArray(result.skills)).toBe(true);
        expect(Array.isArray(result.experience)).toBe(true);
        expect(result.confidenceScore).toBeGreaterThan(0);
        expect(result.confidenceScore).toBeLessThanOrEqual(1);

    });

    test('throws 422 instead of saving placeholder data when the file cannot be read', async () => {

        const brokenFile = path.join(os.tmpdir(), `broken-${Date.now()}.pdf`);
        await fs.writeFile(brokenFile, 'this is not a pdf');

        try {
            await expect(parseService.extractResumeData(brokenFile, 'application/pdf'))
                .rejects.toMatchObject({ status: 422 });
        } finally {
            await fs.unlink(brokenFile);
        }

    });

    test('rejects unsupported file types with 415', async () => {

        await expect(parseService.extractResumeData(samplePdf, 'text/plain'))
            .rejects.toMatchObject({ status: 415 });

    });

});

describe('Rule-based parser', () => {

    const resumeText = [
        'Jane Doe',
        'jane.doe@example.com | +1 555 123 4567',
        'https://linkedin.com/in/janedoe https://github.com/janedoe https://janedoe.dev',
        'SKILLS',
        'JavaScript, React, Node.js, PostgreSQL',
        'EXPERIENCE',
        'Software Engineer at Acme Corp 2020 - Present',
        'Built internal tools.',
        'EDUCATION',
        'State University',
        'B.Sc in Computer Science 2016 2020 CGPA 8.5',
        'PROJECTS',
        'Resume Parser',
        'Parses resumes into structured data.',
        'Tech: Node.js, React',
    ].join('\n');

    const parsed = buildParsedDataFromText(resumeText);

    test('extracts contact details and separates LinkedIn, GitHub, and portfolio links', () => {

        expect(parsed.personalInfo.name).toBe('Jane Doe');
        expect(parsed.personalInfo.email).toBe('jane.doe@example.com');
        expect(parsed.personalInfo.linkedin).toBe('https://linkedin.com/in/janedoe');
        expect(parsed.personalInfo.github).toBe('https://github.com/janedoe');
        expect(parsed.personalInfo.portfolio).toBe('https://janedoe.dev');

    });

    test('extracts skills, experience, education, and projects in the stored shape', () => {

        expect(parsed.skills).toEqual(['JavaScript', 'React', 'Node.js', 'PostgreSQL']);
        expect(parsed.experience[0]).toMatchObject({
            company_name: 'Acme Corp',
            job_title: 'Software Engineer',
            start_date: '2020-01-01',
            currently_working: true,
        });
        expect(parsed.education[0]).toMatchObject({
            institution_name: 'State University',
            start_year: 2016,
            end_year: 2020,
            cgpa: 8.5,
        });
        expect(parsed.projects[0]).toMatchObject({
            project_name: 'Resume Parser',
            technologies_used: 'Node.js, React',
        });

    });

    test('confidence score reflects profile completeness', () => {

        expect(computeConfidenceScore(parsed)).toBe(1);
        expect(computeConfidenceScore({ personalInfo: { name: 'Only Name' } })).toBe(0.15);

    });

});

describe('Helpers', () => {

    test('toDate handles years, dates, and "present"', () => {

        expect(toDate('2021')).toBe('2021-01-01');
        expect(toDate('2021-06-15')).toBe('2021-06-15');
        expect(toDate('Present')).toBeNull();
        expect(toDate('not a date')).toBeNull();

    });

    test('file types are stored in a short form that fits varchar(20)', () => {

        const docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        expect(toStoredFileType(docx)).toBe('docx');
        expect(fromStoredFileType('docx')).toBe(docx);
        expect(fromStoredFileType('application/pdf')).toBe('application/pdf');

    });

});
