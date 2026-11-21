# Resume Parser Service

REST API that accepts PDF and DOCX resumes, extracts structured candidate data, and stores it in PostgreSQL.

Parsing uses the Groq LLM API (Llama 3.1) when `GROQ_API_KEY` is set. If the key is missing or the Groq call fails, a built-in rule-based parser is used instead.

## Tech stack

Node.js, Express 5, PostgreSQL (`pg`), Multer, pdf-parse, Mammoth, Groq API, Jest, Supertest.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the database and apply the schema:

   ```bash
   createdb resume_parser_db
   psql "postgresql://USER:PASSWORD@localhost:5432/resume_parser_db" -f db/schema.sql
   ```

3. Copy `.env.example` to `.env` and fill in `DB_URL` (and `GROQ_API_KEY` if you want LLM parsing).

4. Start the server:

   ```bash
   npm run dev   # with auto-reload
   npm start     # production
   ```

The API listens on `PORT` (default `3000`). Health check: `GET /health`.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DB_URL` | yes* | PostgreSQL connection string. *Or set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. |
| `DB_SSL` | no | `true` to use SSL. Defaults to on in production. |
| `TEST_DB_URL` | for tests | Separate database for `npm test`. The tests empty it. |
| `ALLOWED_ORIGINS` | no | Comma-separated frontend origins allowed by CORS. |
| `GROQ_API_KEY` | no | Enables LLM parsing. |
| `GROQ_MODEL` | no | Default `llama-3.1-8b-instant`. |
| `GROQ_TIMEOUT_MS` | no | Groq request timeout. Default `30000`. |
| `GROQ_MAX_RESUME_CHARS` | no | Resume text sent to Groq is cut to this length. Default `30000`. |
| `UPLOAD_DIR` | no | Where uploaded files are stored. Default `./uploads`. |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | no | Upload/parse requests per IP per window. Default 30 per 15 minutes. `0` disables. |

## API

All routes are under `/api/parse`. Errors are returned as `{ "error": { "message": "..." } }`.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/upload` | Upload a resume (form field `resume`) without parsing. Returns `201`. |
| `POST` | `/resume` | Upload and parse in one request. |
| `POST` | `/resumes/:id/parse` | Parse an uploaded resume. Returns the stored result if it was already parsed. |
| `POST` | `/resumes/:id/reparse` | Parse the stored file again and replace the saved result. |
| `GET` | `/resumes` | List parsed resumes. Optional `?limit=` and `?offset=`. Response includes `pagination.total`. |
| `GET` | `/resumes/:id` | Get one parsed resume. |
| `GET` | `/resumes/:id/file` | Download the original file. `410` if the file is no longer on disk. |
| `DELETE` | `/resumes/:id` | Delete the resume and its file. The candidate is deleted too if no other resume belongs to them. |

Upload rules: PDF or DOCX only, 5 MB maximum. Files that contain no readable text (scanned or image-only PDFs) are rejected with `422`.

### Confidence score

`confidenceScore` (0 to 1) measures how complete the extracted profile is: name, email, phone, links or location, skills, experience, and education each add a fixed weight.

## Database

The schema is in [`db/schema.sql`](db/schema.sql) (schema `resume_parser`). Candidates are unique by email: parsing a new resume with an existing email updates that candidate.

## Tests

```bash
npm test
```

Unit tests always run. API and database tests run only when `TEST_DB_URL` is set, and they empty every table in that database, so never point it at real data. Create the test database once:

```bash
createdb resume_parser_test
psql "$TEST_DB_URL" -f db/schema.sql
```

CI (`.github/workflows/backend-ci.yml`) starts a PostgreSQL container, loads the schema, and runs the full suite on every push and pull request to `main`.

## Known limitations

- There is no authentication: anyone who can reach the API can read and delete candidate data.
- Uploaded files are stored on the local disk. On hosts with ephemeral disks (such as Render), files are lost on redeploy; parsed data in the database is kept, but download and re-parse return `410`.
- Rate limiting is in memory, so limits apply per server instance.
