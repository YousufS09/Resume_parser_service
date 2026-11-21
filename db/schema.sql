-- Database schema for the Resume Parser Service.
-- Generated from resume_db_backup.dump (pg_restore --schema-only). Contains no data.
-- Apply with: psql "$DB_URL" -f db/schema.sql

--
-- PostgreSQL database dump
--


-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: resume_parser; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS resume_parser;


SET default_tablespace = '';


--
-- Name: candidate; Type: TABLE; Schema: resume_parser; Owner: -
--

CREATE TABLE resume_parser.candidate (
    candidate_id bigint NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255),
    phone_number character varying(20),
    linkedin_url character varying(500),
    github_url character varying(500),
    portfolio_url character varying(500),
    current_location character varying(255),
    summary text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: candidate_candidate_id_seq; Type: SEQUENCE; Schema: resume_parser; Owner: -
--

CREATE SEQUENCE resume_parser.candidate_candidate_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: candidate_candidate_id_seq; Type: SEQUENCE OWNED BY; Schema: resume_parser; Owner: -
--

ALTER SEQUENCE resume_parser.candidate_candidate_id_seq OWNED BY resume_parser.candidate.candidate_id;


--
-- Name: candidate_skill; Type: TABLE; Schema: resume_parser; Owner: -
--

CREATE TABLE resume_parser.candidate_skill (
    candidate_skill_id bigint NOT NULL,
    candidate_id bigint NOT NULL,
    skill_id bigint NOT NULL
);


--
-- Name: candidate_skill_candidate_skill_id_seq; Type: SEQUENCE; Schema: resume_parser; Owner: -
--

CREATE SEQUENCE resume_parser.candidate_skill_candidate_skill_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: candidate_skill_candidate_skill_id_seq; Type: SEQUENCE OWNED BY; Schema: resume_parser; Owner: -
--

ALTER SEQUENCE resume_parser.candidate_skill_candidate_skill_id_seq OWNED BY resume_parser.candidate_skill.candidate_skill_id;


--
-- Name: certification; Type: TABLE; Schema: resume_parser; Owner: -
--

CREATE TABLE resume_parser.certification (
    certification_id bigint NOT NULL,
    candidate_id bigint NOT NULL,
    certification_name character varying(255),
    issuing_organization character varying(255),
    issue_date date,
    expiry_date date,
    credential_id character varying(255)
);


--
-- Name: certification_certification_id_seq; Type: SEQUENCE; Schema: resume_parser; Owner: -
--

CREATE SEQUENCE resume_parser.certification_certification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: certification_certification_id_seq; Type: SEQUENCE OWNED BY; Schema: resume_parser; Owner: -
--

ALTER SEQUENCE resume_parser.certification_certification_id_seq OWNED BY resume_parser.certification.certification_id;


--
-- Name: education; Type: TABLE; Schema: resume_parser; Owner: -
--

CREATE TABLE resume_parser.education (
    education_id bigint NOT NULL,
    candidate_id bigint NOT NULL,
    institution_name character varying(255),
    degree character varying(255),
    specialization character varying(255),
    start_year integer,
    end_year integer,
    cgpa numeric(4,2)
);


--
-- Name: education_education_id_seq; Type: SEQUENCE; Schema: resume_parser; Owner: -
--

CREATE SEQUENCE resume_parser.education_education_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: education_education_id_seq; Type: SEQUENCE OWNED BY; Schema: resume_parser; Owner: -
--

ALTER SEQUENCE resume_parser.education_education_id_seq OWNED BY resume_parser.education.education_id;


--
-- Name: experience; Type: TABLE; Schema: resume_parser; Owner: -
--

CREATE TABLE resume_parser.experience (
    experience_id bigint NOT NULL,
    candidate_id bigint NOT NULL,
    company_name character varying(255),
    job_title character varying(255),
    employment_type character varying(100),
    start_date date,
    end_date date,
    currently_working boolean DEFAULT false,
    description text
);


--
-- Name: experience_experience_id_seq; Type: SEQUENCE; Schema: resume_parser; Owner: -
--

CREATE SEQUENCE resume_parser.experience_experience_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: experience_experience_id_seq; Type: SEQUENCE OWNED BY; Schema: resume_parser; Owner: -
--

ALTER SEQUENCE resume_parser.experience_experience_id_seq OWNED BY resume_parser.experience.experience_id;


--
-- Name: parser_job; Type: TABLE; Schema: resume_parser; Owner: -
--

CREATE TABLE resume_parser.parser_job (
    job_id bigint NOT NULL,
    status character varying(50) NOT NULL,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone
);


--
-- Name: parser_job_job_id_seq; Type: SEQUENCE; Schema: resume_parser; Owner: -
--

CREATE SEQUENCE resume_parser.parser_job_job_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: parser_job_job_id_seq; Type: SEQUENCE OWNED BY; Schema: resume_parser; Owner: -
--

ALTER SEQUENCE resume_parser.parser_job_job_id_seq OWNED BY resume_parser.parser_job.job_id;


--
-- Name: parser_result; Type: TABLE; Schema: resume_parser; Owner: -
--

CREATE TABLE resume_parser.parser_result (
    result_id bigint NOT NULL,
    job_id bigint,
    candidate_id bigint NOT NULL,
    confidence_score numeric(5,2)
);


--
-- Name: parser_result_result_id_seq; Type: SEQUENCE; Schema: resume_parser; Owner: -
--

CREATE SEQUENCE resume_parser.parser_result_result_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: parser_result_result_id_seq; Type: SEQUENCE OWNED BY; Schema: resume_parser; Owner: -
--

ALTER SEQUENCE resume_parser.parser_result_result_id_seq OWNED BY resume_parser.parser_result.result_id;


--
-- Name: project; Type: TABLE; Schema: resume_parser; Owner: -
--

CREATE TABLE resume_parser.project (
    project_id bigint NOT NULL,
    candidate_id bigint NOT NULL,
    project_name character varying(255),
    project_description text,
    technologies_used text,
    github_link character varying(500),
    project_link character varying(500)
);


--
-- Name: project_project_id_seq; Type: SEQUENCE; Schema: resume_parser; Owner: -
--

CREATE SEQUENCE resume_parser.project_project_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_project_id_seq; Type: SEQUENCE OWNED BY; Schema: resume_parser; Owner: -
--

ALTER SEQUENCE resume_parser.project_project_id_seq OWNED BY resume_parser.project.project_id;


--
-- Name: resume; Type: TABLE; Schema: resume_parser; Owner: -
--

CREATE TABLE resume_parser.resume (
    resume_id bigint NOT NULL,
    candidate_id bigint,
    file_name character varying(255),
    file_path text,
    file_type character varying(20),
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: resume_resume_id_seq; Type: SEQUENCE; Schema: resume_parser; Owner: -
--

CREATE SEQUENCE resume_parser.resume_resume_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resume_resume_id_seq; Type: SEQUENCE OWNED BY; Schema: resume_parser; Owner: -
--

ALTER SEQUENCE resume_parser.resume_resume_id_seq OWNED BY resume_parser.resume.resume_id;


--
-- Name: skill; Type: TABLE; Schema: resume_parser; Owner: -
--

CREATE TABLE resume_parser.skill (
    skill_id bigint NOT NULL,
    skill_name character varying(255) NOT NULL,
    skill_category character varying(100)
);


--
-- Name: skill_skill_id_seq; Type: SEQUENCE; Schema: resume_parser; Owner: -
--

CREATE SEQUENCE resume_parser.skill_skill_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skill_skill_id_seq; Type: SEQUENCE OWNED BY; Schema: resume_parser; Owner: -
--

ALTER SEQUENCE resume_parser.skill_skill_id_seq OWNED BY resume_parser.skill.skill_id;


--
-- Name: v_candidate_experience; Type: VIEW; Schema: resume_parser; Owner: -
--

CREATE VIEW resume_parser.v_candidate_experience AS
 SELECT c.candidate_id,
    c.full_name,
    e.company_name,
    e.job_title
   FROM (resume_parser.candidate c
     JOIN resume_parser.experience e ON ((c.candidate_id = e.candidate_id)));


--
-- Name: v_candidate_resume; Type: VIEW; Schema: resume_parser; Owner: -
--

CREATE VIEW resume_parser.v_candidate_resume AS
 SELECT c.candidate_id,
    c.full_name,
    r.resume_id,
    r.file_name
   FROM (resume_parser.candidate c
     JOIN resume_parser.resume r ON ((c.candidate_id = r.candidate_id)));


--
-- Name: v_candidate_summary; Type: VIEW; Schema: resume_parser; Owner: -
--

CREATE VIEW resume_parser.v_candidate_summary AS
 SELECT candidate_id,
    full_name,
    email
   FROM resume_parser.candidate;


--
-- Name: candidate candidate_id; Type: DEFAULT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.candidate ALTER COLUMN candidate_id SET DEFAULT nextval('resume_parser.candidate_candidate_id_seq'::regclass);


--
-- Name: candidate_skill candidate_skill_id; Type: DEFAULT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.candidate_skill ALTER COLUMN candidate_skill_id SET DEFAULT nextval('resume_parser.candidate_skill_candidate_skill_id_seq'::regclass);


--
-- Name: certification certification_id; Type: DEFAULT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.certification ALTER COLUMN certification_id SET DEFAULT nextval('resume_parser.certification_certification_id_seq'::regclass);


--
-- Name: education education_id; Type: DEFAULT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.education ALTER COLUMN education_id SET DEFAULT nextval('resume_parser.education_education_id_seq'::regclass);


--
-- Name: experience experience_id; Type: DEFAULT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.experience ALTER COLUMN experience_id SET DEFAULT nextval('resume_parser.experience_experience_id_seq'::regclass);


--
-- Name: parser_job job_id; Type: DEFAULT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.parser_job ALTER COLUMN job_id SET DEFAULT nextval('resume_parser.parser_job_job_id_seq'::regclass);


--
-- Name: parser_result result_id; Type: DEFAULT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.parser_result ALTER COLUMN result_id SET DEFAULT nextval('resume_parser.parser_result_result_id_seq'::regclass);


--
-- Name: project project_id; Type: DEFAULT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.project ALTER COLUMN project_id SET DEFAULT nextval('resume_parser.project_project_id_seq'::regclass);


--
-- Name: resume resume_id; Type: DEFAULT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.resume ALTER COLUMN resume_id SET DEFAULT nextval('resume_parser.resume_resume_id_seq'::regclass);


--
-- Name: skill skill_id; Type: DEFAULT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.skill ALTER COLUMN skill_id SET DEFAULT nextval('resume_parser.skill_skill_id_seq'::regclass);


--
-- Name: candidate candidate_email_key; Type: CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.candidate
    ADD CONSTRAINT candidate_email_key UNIQUE (email);


--
-- Name: candidate candidate_pkey; Type: CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.candidate
    ADD CONSTRAINT candidate_pkey PRIMARY KEY (candidate_id);


--
-- Name: candidate_skill candidate_skill_pkey; Type: CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.candidate_skill
    ADD CONSTRAINT candidate_skill_pkey PRIMARY KEY (candidate_skill_id);


--
-- Name: certification certification_pkey; Type: CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.certification
    ADD CONSTRAINT certification_pkey PRIMARY KEY (certification_id);


--
-- Name: education education_pkey; Type: CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.education
    ADD CONSTRAINT education_pkey PRIMARY KEY (education_id);


--
-- Name: experience experience_pkey; Type: CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.experience
    ADD CONSTRAINT experience_pkey PRIMARY KEY (experience_id);


--
-- Name: parser_job parser_job_pkey; Type: CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.parser_job
    ADD CONSTRAINT parser_job_pkey PRIMARY KEY (job_id);


--
-- Name: parser_result parser_result_pkey; Type: CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.parser_result
    ADD CONSTRAINT parser_result_pkey PRIMARY KEY (result_id);


--
-- Name: project project_pkey; Type: CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (project_id);


--
-- Name: resume resume_pkey; Type: CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.resume
    ADD CONSTRAINT resume_pkey PRIMARY KEY (resume_id);


--
-- Name: skill skill_pkey; Type: CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.skill
    ADD CONSTRAINT skill_pkey PRIMARY KEY (skill_id);


--
-- Name: skill skill_skill_name_key; Type: CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.skill
    ADD CONSTRAINT skill_skill_name_key UNIQUE (skill_name);


--
-- Name: idx_candidate_email; Type: INDEX; Schema: resume_parser; Owner: -
--

CREATE INDEX idx_candidate_email ON resume_parser.candidate USING btree (email);


--
-- Name: idx_candidate_skill_candidate; Type: INDEX; Schema: resume_parser; Owner: -
--

CREATE INDEX idx_candidate_skill_candidate ON resume_parser.candidate_skill USING btree (candidate_id);


--
-- Name: idx_candidate_skill_skill; Type: INDEX; Schema: resume_parser; Owner: -
--

CREATE INDEX idx_candidate_skill_skill ON resume_parser.candidate_skill USING btree (skill_id);


--
-- Name: idx_certification_candidate; Type: INDEX; Schema: resume_parser; Owner: -
--

CREATE INDEX idx_certification_candidate ON resume_parser.certification USING btree (candidate_id);


--
-- Name: idx_experience_candidate; Type: INDEX; Schema: resume_parser; Owner: -
--

CREATE INDEX idx_experience_candidate ON resume_parser.experience USING btree (candidate_id);


--
-- Name: idx_project_candidate; Type: INDEX; Schema: resume_parser; Owner: -
--

CREATE INDEX idx_project_candidate ON resume_parser.project USING btree (candidate_id);


--
-- Name: idx_resume_candidate; Type: INDEX; Schema: resume_parser; Owner: -
--

CREATE INDEX idx_resume_candidate ON resume_parser.resume USING btree (candidate_id);


--
-- Name: idx_skill_name; Type: INDEX; Schema: resume_parser; Owner: -
--

CREATE INDEX idx_skill_name ON resume_parser.skill USING btree (skill_name);


--
-- Name: candidate_skill fk_candidate_skill_candidate; Type: FK CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.candidate_skill
    ADD CONSTRAINT fk_candidate_skill_candidate FOREIGN KEY (candidate_id) REFERENCES resume_parser.candidate(candidate_id) ON DELETE CASCADE;


--
-- Name: candidate_skill fk_candidate_skill_skill; Type: FK CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.candidate_skill
    ADD CONSTRAINT fk_candidate_skill_skill FOREIGN KEY (skill_id) REFERENCES resume_parser.skill(skill_id) ON DELETE CASCADE;


--
-- Name: certification fk_certification_candidate; Type: FK CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.certification
    ADD CONSTRAINT fk_certification_candidate FOREIGN KEY (candidate_id) REFERENCES resume_parser.candidate(candidate_id) ON DELETE CASCADE;


--
-- Name: education fk_education_candidate; Type: FK CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.education
    ADD CONSTRAINT fk_education_candidate FOREIGN KEY (candidate_id) REFERENCES resume_parser.candidate(candidate_id) ON DELETE CASCADE;


--
-- Name: experience fk_experience_candidate; Type: FK CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.experience
    ADD CONSTRAINT fk_experience_candidate FOREIGN KEY (candidate_id) REFERENCES resume_parser.candidate(candidate_id) ON DELETE CASCADE;


--
-- Name: project fk_project_candidate; Type: FK CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.project
    ADD CONSTRAINT fk_project_candidate FOREIGN KEY (candidate_id) REFERENCES resume_parser.candidate(candidate_id) ON DELETE CASCADE;


--
-- Name: resume fk_resume_candidate; Type: FK CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.resume
    ADD CONSTRAINT fk_resume_candidate FOREIGN KEY (candidate_id) REFERENCES resume_parser.candidate(candidate_id) ON DELETE CASCADE;


--
-- Name: parser_result parser_result_candidate_id_fkey; Type: FK CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.parser_result
    ADD CONSTRAINT parser_result_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES resume_parser.candidate(candidate_id) ON DELETE CASCADE;


--
-- Name: parser_result parser_result_job_id_fkey; Type: FK CONSTRAINT; Schema: resume_parser; Owner: -
--

ALTER TABLE ONLY resume_parser.parser_result
    ADD CONSTRAINT parser_result_job_id_fkey FOREIGN KEY (job_id) REFERENCES resume_parser.parser_job(job_id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--


