/**
 * Service to handle parsing and database persistence for resumes.
 */

const fs = require('fs/promises');
const path = require('path');
const { pool } = require('../config/db');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const uploadedResumes = new Map();
const parsedResumes = new Map();

const createId = () => `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

const isPresent = (value) => value !== undefined && value !== null && `${value}`.trim() !== '';

const toText = (value) => (isPresent(value) ? String(value).trim() : null);

const toInt = (value) => {
  if (!isPresent(value)) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const toDecimal = (value) => {
  if (!isPresent(value)) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toDate = (value) => {
  if (!isPresent(value)) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
};

const nowIso = () => new Date().toISOString();

const normalizeWhitespace = (value) => String(value || '').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').trim();

const splitLines = (value) =>
  normalizeWhitespace(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const isHeading = (line) => {
  if (!line) {
    return false;
  }

  const cleaned = line.replace(/[:\-–—]+$/, '').trim();
  if (!cleaned || cleaned.length > 40) {
    return false;
  }

  return /^[A-Z][A-Z0-9\s/&()+.-]+$/.test(cleaned);
};

const sectionAliases = {
  skills: ['skills', 'technical skills', 'core skills', 'key skills'],
  experience: ['experience', 'work experience', 'employment history', 'professional experience'],
  education: ['education', 'academic background', 'academics'],
  projects: ['projects', 'project experience', 'personal projects'],
  certifications: ['certifications', 'certificates', 'licenses'],
};

const buildSectionMap = (lines) => {
  const sections = {};
  let currentSection = 'header';

  for (const line of lines) {
    const labelMatch = line.match(/^(skills|experience|education|projects|certifications?)\s*[:\-–—]\s*(.*)$/i);
    if (labelMatch) {
      currentSection = labelMatch[1].toLowerCase().replace(/certifications?/, 'certifications');
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      if (labelMatch[2]) {
        sections[currentSection].push(labelMatch[2].trim());
      }
      continue;
    }

    const normalized = line.toLowerCase().replace(/[:\-–—]+$/, '').trim();
    const matchedSection = Object.entries(sectionAliases).find(([, aliases]) =>
      aliases.includes(normalized)
    );

    if (matchedSection) {
      currentSection = matchedSection[0];
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      continue;
    }

    if (isHeading(line) && !currentSection) {
      currentSection = line.toLowerCase();
    }

    if (!sections[currentSection]) {
      sections[currentSection] = [];
    }

    sections[currentSection].push(line);
  }

  return sections;
};

const parsePersonalInfo = (lines, fullText) => {
  const emailMatch = fullText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = fullText.match(/(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = fullText.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)]+/i);
  const githubMatch = fullText.match(/https?:\/\/(?:www\.)?github\.com\/[^\s)]+/i);
  const portfolioMatch = fullText.match(/https?:\/\/(?!www\.linkedin\.com|www\.github\.com)[^\s)]+/i);

  const getLabelValue = (label) => {
    const regex = new RegExp(`^${label}\\s*[:\\-–—]\\s*(.+)$`, 'i');
    const match = lines.find((line) => regex.test(line));
    return match ? match.replace(regex, '$1').trim() : null;
  };

  const nameLine = lines.find(
    (line) =>
      line &&
      !line.includes('@') &&
      !/https?:\/\//i.test(line) &&
      !/resume|curriculum vitae|cv/i.test(line) &&
      line.split(/\s+/).length <= 5 &&
      /[A-Za-z]/.test(line)
  );

  const locationLine = getLabelValue('location') || lines.find((line) =>
    /(?:location|based in|remote|hybrid|city|state|country)/i.test(line)
  );

  return {
    name: toText(getLabelValue('name') || nameLine),
    email: toText(getLabelValue('email') || emailMatch?.[0]),
    phone: toText(getLabelValue('phone') || getLabelValue('phone number') || phoneMatch?.[0]),
    linkedin: toText(getLabelValue('linkedin') || getLabelValue('linkedin url') || linkedinMatch?.[0]),
    github: toText(getLabelValue('github') || getLabelValue('github url') || githubMatch?.[0]),
    portfolio: toText(getLabelValue('portfolio') || getLabelValue('portfolio url') || portfolioMatch?.[0]),
    location: toText(locationLine),
    summary: null,
  };
};

const parseSkills = (sectionLines) => {
  const joined = sectionLines.join(' ');
  return joined
    .split(/[,•\n;/|]+/)
    .map((skill) => skill.replace(/^[-*]\s*/, '').trim())
    .filter((skill) => skill && skill.length > 1)
    .filter((skill, index, list) => list.findIndex((entry) => entry.toLowerCase() === skill.toLowerCase()) === index);
};

const parseBlocks = (sectionLines) => {
  const blocks = [];
  let current = [];

  for (const line of sectionLines) {
    if (!line || /^[-•*]\s*$/.test(line)) {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
      continue;
    }

    if (/^[-•*]\s*/.test(line) && current.length > 0) {
      blocks.push(current);
      current = [line.replace(/^[-•*]\s*/, '')];
      continue;
    }

    current.push(line.replace(/^[-•*]\s*/, ''));
  }

  if (current.length > 0) {
    blocks.push(current);
  }

  return blocks;
};

const parseExperience = (sectionLines) =>
  parseBlocks(sectionLines).map((block) => {
    const text = block.join(' ');
    const roleAtCompany = text.match(
      /^(.+?)\s+(?:at|@|\||-)\s+(.+?)(?:\s+\(?(\d{4}(?:\s*[-–—]\s*(?:\d{4}|present|current))?)\)?(?:\s*[:|-]\s*(.*))?)?$/i
    );
    const dateMatch = text.match(/(\d{4}(?:\s*[-–—]\s*(?:\d{4}|present|current))?)/i);

    return {
      company: toText(roleAtCompany?.[2] || block[0]),
      role: toText(roleAtCompany?.[1] || block[0]),
      years: toText(roleAtCompany?.[3] || dateMatch?.[1]),
      description: toText(roleAtCompany?.[4] || block.slice(1).join(' ')),
    };
  });

const parseEducation = (sectionLines) =>
  parseBlocks(sectionLines).map((block) => {
    const text = block.join(' ');
    const yearMatches = text.match(/(19|20)\d{2}/g) || [];

    return {
      institution: toText(block[0]),
      degree: toText(block[1] || text),
      specialization: null,
      start_year: toInt(yearMatches[0]),
      end_year: toInt(yearMatches[1]),
      cgpa: toDecimal((text.match(/(?:cgpa|gpa)[:\s]*([0-9.]+)/i) || [])[1]),
    };
  });

const parseProjects = (sectionLines) =>
  parseBlocks(sectionLines).map((block) => ({
    name: toText(block[0]),
    description: toText(block.slice(1).join(' ')),
    technologies: null,
    githubUrl: null,
    projectUrl: null,
  }));

const parseCertifications = (sectionLines) =>
  parseBlocks(sectionLines).map((block) => ({
    name: toText(block[0]),
    organization: toText(block[1]),
    issueDate: toDate((block.join(' ').match(/issue[d]?\s*[:\-]\s*([^\s,]+)/i) || [])[1]),
    expiryDate: toDate((block.join(' ').match(/expir(?:y|es)\s*[:\-]\s*([^\s,]+)/i) || [])[1]),
    credentialId: toText((block.join(' ').match(/credential\s*id\s*[:\-]\s*([^\s,]+)/i) || [])[1]),
  }));

const toPlainText = async (filePath, mimeType) => {
  if (mimeType === 'application/pdf') {
    const buffer = await fs.readFile(filePath);
    if (typeof pdfParse === 'function') {
      const parsed = await pdfParse(buffer);
      return normalizeWhitespace(parsed.text || '');
    }

    if (pdfParse && typeof pdfParse.PDFParse === 'function') {
      const parser = new pdfParse.PDFParse({ verbosity: 0 });
      await parser.load(buffer);
      const parsed = await parser.getText();
      return normalizeWhitespace(parsed?.text || parsed || '');
    }

    throw new Error('No supported PDF parser API found');
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    return normalizeWhitespace(result.value || '');
  }

  return normalizeWhitespace(await fs.readFile(filePath, 'utf8'));
};

const buildSummary = (lines, sections) => {
  const headerLines = (sections.header || []).filter(
    (line) => !/https?:\/\//i.test(line) && !/@/.test(line) && !isHeading(line)
  );

  const summaryCandidate = headerLines.slice(1).join(' ').trim();
  return summaryCandidate || null;
};

const buildParsedDataFromText = (text, filePath = '') => {
  const lines = splitLines(text);
  const sections = buildSectionMap(lines);
  const personalInfo = parsePersonalInfo(lines, text);

  if (!personalInfo.name) {
    personalInfo.name = toText(path.basename(filePath, path.extname(filePath))) || 'Unknown Candidate';
  }

  personalInfo.summary = buildSummary(lines, sections);

  return {
    personalInfo,
    skills: parseSkills(sections.skills || []),
    experience: parseExperience(sections.experience || []),
    education: parseEducation(sections.education || []),
    projects: parseProjects(sections.projects || []),
    certifications: parseCertifications(sections.certifications || []),
    confidenceScore: 0.75,
  };
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry.trim();
      }

      if (entry && typeof entry === 'object') {
        return toText(entry.skill_name || entry.name || entry.skill || entry.title);
      }

      return null;
    })
    .filter(Boolean);
};

const normalizeObjectArray = (value) => (Array.isArray(value) ? value.filter((entry) => entry && typeof entry === 'object') : []);

const buildParsedPayload = (parsedData) => {
  const personalInfo = parsedData?.personalInfo || {};

  return {
    fullName: toText(personalInfo.name),
    email: toText(personalInfo.email),
    phoneNumber: toText(personalInfo.phone),
    linkedinUrl: toText(personalInfo.linkedin || personalInfo.linkedinUrl),
    githubUrl: toText(personalInfo.github || personalInfo.githubUrl),
    portfolioUrl: toText(personalInfo.portfolio || personalInfo.portfolioUrl),
    currentLocation: toText(personalInfo.location || personalInfo.currentLocation),
    summary: toText(personalInfo.summary),
    skills: normalizeStringArray(parsedData?.skills),
    education: normalizeObjectArray(parsedData?.education),
    experience: normalizeObjectArray(parsedData?.experience),
    projects: normalizeObjectArray(parsedData?.projects),
    certifications: normalizeObjectArray(parsedData?.certifications),
    confidenceScore: toDecimal(parsedData?.confidenceScore ?? parsedData?.confidence_score),
    jobId: toInt(parsedData?.jobId ?? parsedData?.job_id),
  };
};

const withDbTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const insertCandidate = async (client, payload) => {
  const query = `
    INSERT INTO candidate (
      full_name,
      email,
      phone_number,
      linkedin_url,
      github_url,
      portfolio_url,
      current_location,
      summary,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING *
  `;

  const result = await client.query(query, [
    payload.fullName,
    payload.email,
    payload.phoneNumber,
    payload.linkedinUrl,
    payload.githubUrl,
    payload.portfolioUrl,
    payload.currentLocation,
    payload.summary,
  ]);

  return result.rows[0];
};

const insertResume = async (client, candidateId, file) => {
  const query = `
    INSERT INTO resume (
      candidate_id,
      file_name,
      file_path,
      file_type,
      uploaded_at
    )
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `;

  const result = await client.query(query, [
    candidateId,
    file.originalname,
    file.path,
    file.mimetype,
  ]);

  return result.rows[0];
};

const upsertSkill = async (client, skillName, skillCategory = null) => {
  const normalizedName = toText(skillName);

  if (!normalizedName) {
    return null;
  }

  const existingSkill = await client.query(
    'SELECT skill_id, skill_name, skill_category FROM skill WHERE LOWER(skill_name) = LOWER($1) LIMIT 1',
    [normalizedName]
  );

  if (existingSkill.rows.length > 0) {
    return existingSkill.rows[0];
  }

  const insertedSkill = await client.query(
    `
      INSERT INTO skill (skill_name, skill_category)
      VALUES ($1, $2)
      RETURNING skill_id, skill_name, skill_category
    `,
    [normalizedName, toText(skillCategory)]
  );

  return insertedSkill.rows[0];
};

const linkCandidateSkill = async (client, candidateId, skillId) => {
  await client.query(
    `
      INSERT INTO candidate_skill (candidate_id, skill_id)
      SELECT $1, $2
      WHERE NOT EXISTS (
        SELECT 1
        FROM candidate_skill
        WHERE candidate_id = $1 AND skill_id = $2
      )
    `,
    [candidateId, skillId]
  );
};

const insertEducationRows = async (client, candidateId, educationList) => {
  for (const education of educationList) {
    await client.query(
      `
        INSERT INTO education (
          candidate_id,
          institution_name,
          degree,
          specialization,
          start_year,
          end_year,
          cgpa
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        candidateId,
        toText(education.institution_name || education.institution || education.school || education.college),
        toText(education.degree),
        toText(education.specialization || education.field_of_study || education.fieldOfStudy),
        toInt(education.start_year || education.startYear),
        toInt(education.end_year || education.endYear),
        toDecimal(education.cgpa || education.score || education.grade),
      ]
    );
  }
};

const insertExperienceRows = async (client, candidateId, experienceList) => {
  for (const experience of experienceList) {
    await client.query(
      `
        INSERT INTO experience (
          candidate_id,
          company_name,
          job_title,
          employment_type,
          start_date,
          end_date,
          currently_working,
          description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        candidateId,
        toText(experience.company_name || experience.company || experience.employer),
        toText(experience.job_title || experience.role || experience.title),
        toText(experience.employment_type || experience.type),
        toDate(experience.start_date || experience.startDate),
        toDate(experience.end_date || experience.endDate),
        Boolean(
          experience.currently_working ??
            experience.currentlyWorking ??
            experience.isCurrent ??
            (!experience.end_date && !experience.endDate)
        ),
        toText(experience.description || experience.summary || experience.years),
      ]
    );
  }
};

const insertProjectRows = async (client, candidateId, projectList) => {
  for (const project of projectList) {
    const technologies = project.technologies_used || project.technologies || project.stack;
    const techValue = Array.isArray(technologies) ? technologies.join(', ') : toText(technologies);

    await client.query(
      `
        INSERT INTO project (
          candidate_id,
          project_name,
          project_description,
          technologies_used,
          github_link,
          project_link
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        candidateId,
        toText(project.project_name || project.name),
        toText(project.project_description || project.description),
        techValue,
        toText(project.github_link || project.githubUrl),
        toText(project.project_link || project.projectUrl || project.liveLink),
      ]
    );
  }
};

const insertCertificationRows = async (client, candidateId, certificationList) => {
  for (const certification of certificationList) {
    await client.query(
      `
        INSERT INTO certification (
          candidate_id,
          certification_name,
          issuing_organization,
          issue_date,
          expiry_date,
          credential_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        candidateId,
        toText(certification.certification_name || certification.name),
        toText(certification.issuing_organization || certification.organization || certification.issuer),
        toDate(certification.issue_date || certification.issueDate),
        toDate(certification.expiry_date || certification.expiryDate),
        toText(certification.credential_id || certification.credentialId),
      ]
    );
  }
};

const insertParserResult = async (client, candidateId, jobId, confidenceScore) => {
  const result = await client.query(
    `
      INSERT INTO parser_result (
        job_id,
        candidate_id,
        confidence_score
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [jobId, candidateId, confidenceScore]
  );

  return result.rows[0];
};

const insertParserJob = async (client, status = 'processing') => {
  const result = await client.query(
    `
      INSERT INTO parser_job (
        status,
        submitted_at
      )
      VALUES ($1, NOW())
      RETURNING *
    `,
    [status]
  );

  return result.rows[0];
};

const loadParsedResumeByCandidateId = async (candidateId, resumeRow = null) => {
  const client = await pool.connect();

  try {
    const candidateResult = await client.query('SELECT * FROM candidate WHERE candidate_id = $1 LIMIT 1', [
      candidateId,
    ]);

    if (candidateResult.rows.length === 0) {
      return null;
    }

    const candidate = candidateResult.rows[0];

    const educationResult = await client.query(
      'SELECT * FROM education WHERE candidate_id = $1 ORDER BY education_id ASC',
      [candidateId]
    );
    const experienceResult = await client.query(
      'SELECT * FROM experience WHERE candidate_id = $1 ORDER BY experience_id ASC',
      [candidateId]
    );
    const projectResult = await client.query(
      'SELECT * FROM project WHERE candidate_id = $1 ORDER BY project_id ASC',
      [candidateId]
    );
    const certificationResult = await client.query(
      'SELECT * FROM certification WHERE candidate_id = $1 ORDER BY certification_id ASC',
      [candidateId]
    );
    const skillResult = await client.query(
      `
        SELECT s.skill_id, s.skill_name, s.skill_category
        FROM candidate_skill cs
        INNER JOIN skill s ON s.skill_id = cs.skill_id
        WHERE cs.candidate_id = $1
        ORDER BY s.skill_name ASC
      `,
      [candidateId]
    );
    const parserResult = await client.query(
      'SELECT * FROM parser_result WHERE candidate_id = $1 ORDER BY result_id DESC LIMIT 1',
      [candidateId]
    );

    const resumeData = {
      personalInfo: {
        name: candidate.full_name,
        email: candidate.email,
        phone: candidate.phone_number,
        linkedin: candidate.linkedin_url,
        github: candidate.github_url,
        portfolio: candidate.portfolio_url,
        location: candidate.current_location,
        summary: candidate.summary,
      },
      skills: skillResult.rows.map((skill) => skill.skill_name),
      education: educationResult.rows.map((education) => ({
        institution_name: education.institution_name,
        degree: education.degree,
        specialization: education.specialization,
        start_year: education.start_year,
        end_year: education.end_year,
        cgpa: education.cgpa,
      })),
      experience: experienceResult.rows.map((experience) => ({
        company_name: experience.company_name,
        job_title: experience.job_title,
        employment_type: experience.employment_type,
        start_date: experience.start_date,
        end_date: experience.end_date,
        currently_working: experience.currently_working,
        description: experience.description,
      })),
      projects: projectResult.rows.map((project) => ({
        project_name: project.project_name,
        project_description: project.project_description,
        technologies_used: project.technologies_used,
        github_link: project.github_link,
        project_link: project.project_link,
      })),
      certifications: certificationResult.rows.map((certification) => ({
        certification_name: certification.certification_name,
        issuing_organization: certification.issuing_organization,
        issue_date: certification.issue_date,
        expiry_date: certification.expiry_date,
        credential_id: certification.credential_id,
      })),
      confidenceScore: parserResult.rows[0]?.confidence_score ?? null,
      jobId: parserResult.rows[0]?.job_id ?? null,
    };

    const normalizedResume = {
      id: resumeRow?.resume_id || candidateId,
      originalName: resumeRow?.file_name || null,
      filename: resumeRow?.file_name || null,
      path: resumeRow?.file_path || null,
      mimeType: resumeRow?.file_type || null,
      size: resumeRow?.file_size || null,
      uploadedAt: resumeRow?.uploaded_at || candidate.created_at || nowIso(),
      parsedAt: resumeRow?.updated_at || candidate.updated_at || nowIso(),
      candidateId,
      data: resumeData,
    };

    parsedResumes.set(String(normalizedResume.id), normalizedResume);
    return normalizedResume;
  } finally {
    client.release();
  }
};

exports.extractResumeData = async (filePath, mimeType) => {
  console.log(`Processing file at ${filePath} with type ${mimeType}`);

  try {
    const plainText = await toPlainText(filePath, mimeType);
    if (!plainText) {
      throw new Error('No text could be extracted from the file');
    }

    return buildParsedDataFromText(plainText, filePath);
  } catch (error) {
    console.warn('Primary resume extraction failed, falling back to filename-based parsing:', error.message);

    const fallbackText = normalizeWhitespace(filePath);
    return buildParsedDataFromText(fallbackText || '', filePath);
  }
};

exports.saveUploadedResume = async (file) => {
  const uploadedAt = nowIso();

  const resume = await withDbTransaction(async (client) => {
    const insertedResume = await insertResume(client, null, file);

    return {
      id: insertedResume.resume_id,
      originalName: file.originalname,
      filename: insertedResume.file_name,
      path: insertedResume.file_path,
      mimeType: insertedResume.file_type,
      size: file.size,
      uploadedAt: insertedResume.uploaded_at,
      candidateId: insertedResume.candidate_id,
    };
  }).catch((error) => {
    console.warn('Falling back to in-memory resume storage because database insert failed:', error.message);
    const fallbackResume = {
      id: createId(),
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt,
      candidateId: null,
    };
    uploadedResumes.set(String(fallbackResume.id), fallbackResume);
    return fallbackResume;
  });

  uploadedResumes.set(String(resume.id), resume);
  return resume;
};

const persistParsedResume = async (uploadedResume, parsedData) => {
  const parsedPayload = buildParsedPayload(parsedData);

  return withDbTransaction(async (client) => {
    const parserJob = await insertParserJob(client, 'processing');
    const candidateRow = await insertCandidate(client, parsedPayload);

    const resumeRow = await client.query(
      `
        UPDATE resume
        SET candidate_id = $2
        WHERE resume_id = $1
        RETURNING *
      `,
      [uploadedResume.id, candidateRow.candidate_id]
    );

    const resumeRecord = resumeRow.rows[0];

    await insertEducationRows(client, candidateRow.candidate_id, parsedPayload.education);
    await insertExperienceRows(client, candidateRow.candidate_id, parsedPayload.experience);
    await insertProjectRows(client, candidateRow.candidate_id, parsedPayload.projects);
    await insertCertificationRows(client, candidateRow.candidate_id, parsedPayload.certifications);

    for (const skillName of parsedPayload.skills) {
      const skillRow = await upsertSkill(client, skillName);
      if (skillRow) {
        await linkCandidateSkill(client, candidateRow.candidate_id, skillRow.skill_id);
      }
    }

    await insertParserResult(
      client,
      candidateRow.candidate_id,
      parserJob.job_id,
      parsedPayload.confidenceScore
    );

    await client.query(
      `
        UPDATE parser_job
        SET status = $2,
            completed_at = NOW()
        WHERE job_id = $1
      `,
      [parserJob.job_id, 'completed']
    );

    const parsedResume = {
      id: resumeRecord.resume_id,
      originalName: resumeRecord.file_name,
      filename: resumeRecord.file_name,
      path: resumeRecord.file_path,
      mimeType: resumeRecord.file_type,
      size: uploadedResume.size,
      uploadedAt: resumeRecord.uploaded_at,
      parsedAt: nowIso(),
      candidateId: candidateRow.candidate_id,
      data: parsedData,
    };

    parsedResumes.set(String(parsedResume.id), parsedResume);
    uploadedResumes.set(String(uploadedResume.id), {
      ...uploadedResume,
      candidateId: candidateRow.candidate_id,
    });

    return parsedResume;
  });
};

exports.parseUploadedResume = async (id) => {
  const resumeId = Number(id);
  if (Number.isNaN(resumeId)) {
    return null;
  }

  const cachedParsedResume = parsedResumes.get(String(resumeId));
  if (cachedParsedResume) {
    return cachedParsedResume;
  }

  const cachedUploadedResume = uploadedResumes.get(String(resumeId));
  let uploadedResume = cachedUploadedResume || null;

  if (!uploadedResume) {
    try {
      const client = await pool.connect();
      try {
        const resumeResult = await client.query('SELECT * FROM resume WHERE resume_id = $1 LIMIT 1', [resumeId]);
        if (resumeResult.rows.length === 0) {
          return null;
        }

        const resumeRow = resumeResult.rows[0];
        uploadedResume = {
          id: resumeRow.resume_id,
          originalName: resumeRow.file_name,
          filename: resumeRow.file_name,
          path: resumeRow.file_path,
          mimeType: resumeRow.file_type,
          size: resumeRow.file_size || null,
          uploadedAt: resumeRow.uploaded_at,
          candidateId: resumeRow.candidate_id,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      const fallbackUploaded = uploadedResumes.get(String(resumeId));
      if (!fallbackUploaded) {
        return null;
      }
      uploadedResume = fallbackUploaded;
    }
  }

  if (uploadedResume.candidateId) {
    const existingParsed = await loadParsedResumeByCandidateId(uploadedResume.candidateId, {
      resume_id: uploadedResume.id,
      file_name: uploadedResume.originalName || uploadedResume.filename,
      file_path: uploadedResume.path,
      file_type: uploadedResume.mimeType,
      file_size: uploadedResume.size,
      uploaded_at: uploadedResume.uploadedAt,
    });
    if (existingParsed) {
      return existingParsed;
    }
  }

  const parsedData = await exports.extractResumeData(uploadedResume.path, uploadedResume.mimeType);
  try {
    return await persistParsedResume(uploadedResume, parsedData);
  } catch (error) {
    console.warn('Falling back to in-memory parsed resume storage because database write failed:', error.message);

    const fallbackParsedResume = {
      id: uploadedResume.id,
      originalName: uploadedResume.originalName,
      filename: uploadedResume.filename,
      path: uploadedResume.path,
      mimeType: uploadedResume.mimeType,
      size: uploadedResume.size,
      uploadedAt: uploadedResume.uploadedAt,
      parsedAt: nowIso(),
      candidateId: uploadedResume.candidateId || null,
      data: parsedData,
    };

    parsedResumes.set(String(fallbackParsedResume.id), fallbackParsedResume);
    uploadedResumes.set(String(uploadedResume.id), {
      ...uploadedResume,
      candidateId: uploadedResume.candidateId || null,
    });

    return fallbackParsedResume;
  }
};

exports.parseAndSaveResume = async (file) => {
  const uploadedResume = await exports.saveUploadedResume(file);
  return exports.parseUploadedResume(uploadedResume.id);
};

exports.getAllParsedResumes = async () => {
  try {
    const client = await pool.connect();
    try {
      const resumeRows = await client.query(
        `
          SELECT *
          FROM resume
          WHERE candidate_id IS NOT NULL
          ORDER BY resume_id DESC
        `
      );

      const results = [];
      for (const resumeRow of resumeRows.rows) {
        const parsedResume = await loadParsedResumeByCandidateId(resumeRow.candidate_id, resumeRow);
        if (parsedResume) {
          results.push(parsedResume);
        }
      }

      return results;
    } finally {
      client.release();
    }
  } catch (error) {
    console.warn('Falling back to in-memory parsed resume store because database read failed:', error.message);
    return Array.from(parsedResumes.values());
  }
};

exports.getParsedResumeById = async (id) => {
  const resumeId = Number(id);

  if (!Number.isNaN(resumeId) && parsedResumes.has(String(resumeId))) {
    return parsedResumes.get(String(resumeId));
  }

  try {
    const client = await pool.connect();
    try {
      const resumeResult = await client.query('SELECT * FROM resume WHERE resume_id = $1 LIMIT 1', [resumeId]);
      if (resumeResult.rows.length === 0) {
        return null;
      }

      const resumeRow = resumeResult.rows[0];
      if (!resumeRow.candidate_id) {
        return null;
      }

      return loadParsedResumeByCandidateId(resumeRow.candidate_id, resumeRow);
    } finally {
      client.release();
    }
  } catch (error) {
    console.warn('Falling back to in-memory parsed resume lookup because database read failed:', error.message);
    return parsedResumes.get(String(id)) || null;
  }
};

exports.clearResumeStore = async () => {
  uploadedResumes.clear();
  parsedResumes.clear();

  try {
    await pool.query(`
      TRUNCATE TABLE
        candidate_skill,
        parser_result,
        project,
        certification,
        experience,
        education,
        resume,
        candidate,
        skill,
        parser_job
      RESTART IDENTITY CASCADE
    `);
  } catch (error) {
    console.warn('Unable to clear database tables in clearResumeStore:', error.message);
  }
};
