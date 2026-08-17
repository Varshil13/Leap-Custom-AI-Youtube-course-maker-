# LEAP API & Integration Audit

> Comprehensive test and classification of every API and external integration.
> Generated: 2026-08-18

---

## Summary Table

| Service | Classification | Auth Method | Env Var(s) | Tested |
|---------|---------------|-------------|------------|--------|
| Groq AI API | **WORKING** | Bearer token | `GROK_API_KEY` | Yes - live |
| YouTube Data API v3 | **WORKING** | API key | `NEXT_PUBLIC_YOUTUBE_API_KEY` | Yes - live |
| Neon PostgreSQL | **WORKING** | Connection string | `NEXT_PUBLIC_DATABASE_URL` | Yes - live |
| Clerk Authentication | **WORKING** | SDK-managed | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Yes - SDK load + env verified |
| Gmail SMTP (Nodemailer) | **WORKING** | App password | `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Yes - transporter verified |
| pdf-lib (local library) | **WORKING** | None (local) | N/A | Yes - PDF generated |

---

## 1. Groq AI API (services/gemini.ts)

**Classification: WORKING**

| Attribute | Detail |
|-----------|--------|
| Service | Groq (OpenAI-compatible API) |
| File | `services/gemini.ts` (misnamed — not Google Gemini) |
| Endpoint | `https://api.groq.com/openai/v1/chat/completions` |
| Model | `openai/gpt-oss-20b` |
| Temperature | 0.9 |
| Auth | Bearer token via `GROK_API_KEY` env var (fallback `GROQ_API_KEY`) |
| Env var | `GROK_API_KEY` (set) |
| Test result | HTTP 200 — simple prompt returns correct response |
| Complex test | HTTP 200 — generates valid JSON array for roadmap prompt |
| Error handling | Throws with status code for non-200 responses |
| Timeout | None configured |

### Test Evidence
```
Simple prompt: "Say hello in one word." → 200 OK, "Hello"
Complex prompt: JSON roadmap generation → 200 OK, valid JSON array, 378 tokens
```

### Issues
- **Misnamed file:** `gemini.ts` actually calls Groq API, not Google Gemini
- **No timeout configured:** Long-running requests could hang indefinitely
- **No streaming:** Returns full response, not streaming
- **No rate limiting:** Unlimited API calls possible
- **No content validation:** AI responses not validated before storage
- **`files` field always empty:** Return type includes `AIFile[]` but never populated

### Used By (API Routes)
| Route | Auth | Purpose |
|-------|------|---------|
| `/api/genRoadmap` | None | Generate course roadmap JSON |
| `/api/genCourseDetails` | None | Generate course details (**ORPHANED — no client calls it**) |
| `/api/genSubtopicContent` | None | Generate LaTeX lesson content |

---

## 2. YouTube Data API v3 (services/youtube.ts)

**Classification: WORKING**

| Attribute | Detail |
|-----------|--------|
| Service | Google YouTube Data API v3 |
| File | `services/youtube.ts` |
| Endpoint | `https://www.googleapis.com/youtube/v3/search` |
| Parameters | `part=snippet`, `maxResults=3`, `q=<query>` |
| Auth | API key via `NEXT_PUBLIC_YOUTUBE_API_KEY` |
| Env var | `NEXT_PUBLIC_YOUTUBE_API_KEY` (set) |
| HTTP client | axios |
| Test result | HTTP 200 — returns video search results |

### Test Evidence
```
Query: "javascript tutorial" → 200 OK, 1 result returned
First result title: "JavaScript Tutorials for Beginners in Hindi"
```

### Issues
- **Client-side exposure:** API key uses `NEXT_PUBLIC_` prefix, exposed in browser bundle
- **No error handling:** `getVideos()` has no try/catch, errors propagate to caller
- **No rate limiting:** YouTube API has daily quotas but no client-side throttling
- **No fallback:** If API fails, empty array returned silently by caller

### Used By
| Location | Auth | Purpose |
|----------|------|---------|
| `app/createCourse/[courseId]/chooseVideos/page.jsx` | None (client-side) | Search YouTube videos for course lessons |

---

## 3. Neon PostgreSQL (services/db.js + services/schema.ts)

**Classification: WORKING**

| Attribute | Detail |
|-----------|--------|
| Service | Neon PostgreSQL (serverless) |
| Driver | `@neondatabase/serverless` (HTTP-based) |
| ORM | Drizzle ORM v0.44.6 |
| File | `services/db.js` |
| Schema | `services/schema.ts` (5 tables) |
| Connection | `NEXT_PUBLIC_DATABASE_URL` env var |
| Test result | Connected, query returned valid data |

### Test Evidence
```
SELECT 1 → [{"test":1}]
Tables found: CourseDetails, certificates, course_content, course_videos, user_progress
CourseDetails count: 20
UserProgress count: 46
```

### Schema (5 Tables)
| Table | Columns | Purpose |
|-------|---------|---------|
| `CourseDetails` | 12 | Course metadata, roadmap JSON |
| `course_videos` | 6 | YouTube video selections per lesson |
| `course_content` | 6 | AI-generated LaTeX content per lesson |
| `user_progress` | 9 | Per-lesson completion tracking |
| `certificates` | 11 | Certificate generation and delivery status |

### Issues
- **Client-side DB access:** Drizzle client imported in 6 `'use client'` components — exposes connection string in browser bundle
- **Hardcoded credentials:** `drizzle.config.js` contains full connection string with password committed to repo
- **No FK constraints:** Relationships are logical only, no database-level integrity
- **No migrations:** Uses `drizzle-kit push` directly (no versioned migrations)
- **`NEXT_PUBLIC_` prefix:** Database URL exposed to client

### Used By
| Location | Type | Operations |
|----------|------|------------|
| `app/createCourse/page.jsx` | Client | INSERT CourseDetails |
| `app/createCourse/[courseId]/chooseVideos/page.jsx` | Client | SELECT/INSERT/DELETE CourseVideos |
| `app/dashboard/_components/Showcourses.jsx` | Client | SELECT CourseDetails |
| `app/dashboard/completed/page.jsx` | Client | SELECT CourseDetails |
| `app/dashboard/learnCourse/[courseId]/page.jsx` | Client | SELECT CourseDetails, CourseVideos, CourseContent; INSERT CourseContent |
| `app/api/progress/route.ts` | Server | SELECT/INSERT/UPDATE UserProgress |
| `app/api/deleteCourse/route.ts` | Server | DELETE all tables |
| `app/api/genCertificate/route.ts` | Server | SELECT CourseDetails, UserProgress; INSERT Certificates |
| `app/api/sendCertificate/route.ts` | Server | UPDATE Certificates |

---

## 4. Clerk Authentication (@clerk/nextjs)

**Classification: WORKING**

| Attribute | Detail |
|-----------|--------|
| Service | Clerk Authentication |
| SDK | `@clerk/nextjs` v6.33.7 |
| Env vars | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (set), `CLERK_SECRET_KEY` (set) |
| Middleware | `middleware.js` — `clerkMiddleware` with route protection |
| Test result | SDK loads, auth() and clerkMiddleware functions available |

### Auth Configuration
**Protected page routes (via middleware):**
- `/dashboard(.*)`
- `/createCourse(.*)`
- `/profile(.*)` (route protected but NO page exists)

**API route auth (server-side `auth()`):**
| Route | Auth Check |
|-------|------------|
| `/api/progress` | ✅ Checks `auth()` — returns 401 if unauthorized |
| `/api/genCertificate` | ✅ Checks `auth()` — returns 401 if unauthorized |
| `/api/genRoadmap` | ❌ No auth check |
| `/api/genCourseDetails` | ❌ No auth check |
| `/api/genSubtopicContent` | ❌ No auth check |
| `/api/deleteCourse` | ❌ No auth check |
| `/api/sendCertificate` | ❌ No auth check |

### Issues
- **5 of 7 API routes have no auth:** Anyone can call genRoadmap, genCourseDetails, genSubtopicContent, deleteCourse, sendCertificate
- **`/api/deleteCourse` no auth:** Any request can delete any course by courseId
- **`/api/sendCertificate` no auth:** Any request can send emails to any address
- **`/profile` route protected but no page exists**
- **No RBAC:** All authenticated users have identical access

---

## 5. Gmail SMTP via Nodemailer

**Classification: WORKING**

| Attribute | Detail |
|-----------|--------|
| Service | Gmail SMTP |
| Library | Nodemailer v7.0.9 |
| File | `app/api/sendCertificate/route.ts` |
| Transporter | Gmail service with app password |
| Auth | `GMAIL_USER` + `GMAIL_APP_PASSWORD` env vars (both set) |
| Test result | Transporter verified successfully |

### Test Evidence
```
nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
transporter.verify() → Success
```

### Issues
- **No auth on endpoint:** `/api/sendCertificate` has no Clerk auth check
- **No rate limiting:** Could be abused to send unlimited emails
- **No email validation:** `userEmail` from request body used directly
- **No send limit:** No per-user or per-course limits on certificate emails
- **Certificate status update on failure:** Status set to 'failed' in DB, but error response may leak error details

### Used By
| Location | Auth | Purpose |
|----------|------|---------|
| `app/api/sendCertificate/route.ts` | ❌ None | Email certificate PDF to user |
| `app/dashboard/completed/page.jsx` | Clerk (client) | Calls `/api/sendCertificate` after generating certificate |

---

## 6. pdf-lib (Certificate Generation)

**Classification: WORKING**

| Attribute | Detail |
|-----------|--------|
| Library | pdf-lib v1.17.1 (local, no external API) |
| File | `app/api/genCertificate/route.ts` |
| Auth | Clerk (`auth()` — returns 401 if unauthorized) |
| Test result | PDF generated successfully (872 bytes) |

### Test Evidence
```
PDFDocument.create() → OK
Page: A4 landscape (842x595)
Font: HelveticaBold embedded
Text drawn, PDF saved → 872 bytes
```

### Issues
- **PDF is returned as base64:** Not streamed or saved to file system
- **`certificateUrl` column unused:** DB has `certificate_url` field but PDF is returned inline, not stored
- **No certificate uniqueness check:** User could request same certificate multiple times
- **Font limitations:** Only standard PDF fonts (Helvetica, Times) — no custom fonts

---

## 7. API Routes (Internal)

### 7.1 `/api/genRoadmap` — POST

| Attribute | Detail |
|-----------|--------|
| Auth | ✅ Clerk (`auth()`) — **FIXED in US-003** |
| Input | `{ userInputPrompt: string }` |
| Calls | `generateAIResponse()` → Groq API |
| Output | `{ text: string, files: AIFile[] }` |
| Status | **WORKING** |

### 7.2 `/api/genCourseDetails` — POST

| Attribute | Detail |
|-----------|--------|
| Auth | ❌ None |
| Input | `{ prompt: string }` |
| Calls | `generateAIResponse()` → Groq API with retry (3 attempts, exponential backoff for 503) |
| Output | `{ text: string, files: AIFile[] }` |
| Status | **REMOVED in US-003** — orphaned, no client code referenced it |

### 7.3 `/api/genSubtopicContent` — POST

| Attribute | Detail |
|-----------|--------|
| Auth | ✅ Clerk (`auth()`) — **FIXED in US-003** |
| Input | `{ courseName, courseDescription, level, chapterTitle, subtopicName, language }` |
| Calls | `generateAIResponse()` → Groq API |
| Output | `{ success: boolean, text: string }` |
| Status | **WORKING** |

### 7.4 `/api/progress` — GET/POST

| Attribute | Detail |
|-----------|--------|
| Auth | ✅ Clerk (`auth()`) |
| GET Input | `?courseId=<uuid>` |
| GET Output | `{ progress: Record<string, boolean> }` |
| POST Input | `{ courseId, chapterTitle, subtopicName, isWatched }` |
| POST Output | `{ success: boolean }` |
| Status | **WORKING** |

### 7.5 `/api/deleteCourse` — DELETE

| Attribute | Detail |
|-----------|--------|
| Auth | ✅ Clerk (`auth()`) — **FIXED in US-003** |
| Input | `?courseId=<uuid>` |
| Cascades | user_progress → course_videos → course_content → certificates → CourseDetails |
| Status | **WORKING** |

### 7.6 `/api/genCertificate` — POST

| Attribute | Detail |
|-----------|--------|
| Auth | ✅ Clerk (`auth()`) |
| Input | `{ courseId, courseName, userName, userEmail }` |
| Pre-check | Verifies 100% course completion |
| Output | `{ success, certificateId, pdfBase64, message }` |
| Status | **WORKING** |

### 7.7 `/api/sendCertificate` — POST

| Attribute | Detail |
|-----------|--------|
| Auth | ✅ Clerk (`auth()`) — **FIXED in US-003** |
| Input | `{ certificateId, pdfBase64, userEmail, userName, courseName }` |
| Calls | Nodemailer (Gmail SMTP) |
| DB update | Sets certificate status to 'sent' or 'failed' |
| Status | **WORKING** |

---

## 8. Unused Packages (in package.json but never imported)

| Package | Version | Status |
|---------|---------|--------|
| `@google/genai` | 1.22.0 | **UNUSED** — never imported anywhere |
| `resend` | 6.2.2 | **UNUSED** — never imported anywhere |
| `react-katex` | 3.1.0 | **UNUSED** — never imported anywhere |
| `@matejmazur/react-katex` | 3.1.3 | **UNUSED** — never imported anywhere |
| `rehype-katex` | 7.0.1 | **UNUSED** — never imported anywhere |
| `remark-math` | 6.0.0 | **UNUSED** — never imported anywhere |
| `react-markdown` | 10.1.0 | **UNUSED** — never imported anywhere |
| `remark-gfm` | 4.0.1 | **UNUSED** — never imported anywhere |
| `rehype-highlight` | 7.0.2 | **UNUSED** — never imported anywhere |
| `mime` | 4.1.0 | **UNUSED** — never imported anywhere |
| `uuid4` | 2.0.3 | **UNUSED** — never imported (only `uuid` v4 is used) |

**Note:** `uuid` (not `uuid4`) IS used in `app/createCourse/page.jsx` for generating course IDs.

---

## 9. Dead/Orphaned Code

| Item | File | Status |
|------|------|--------|
| ~~Empty page~~ | ~~`app/createCourse/[courseId]/page.jsx`~~ | **REMOVED in US-003** |
| Empty renderer | `components/LaTexRenderer.jsx` | **EMPTY** — 0 bytes |
| ~~Orphaned API route~~ | ~~`app/api/genCourseDetails/route.ts`~~ | **REMOVED in US-003** |
| Unused components | `Footer.jsx`, `Features.jsx`, `Pricing.jsx` | **EMPTY** — placeholders |
| `/profile` route | Protected in middleware | **NO PAGE EXISTS** |

---

## 10. Security Findings

### Critical
1. ~~**Hardcoded DB credentials** in `drizzle.config.js`~~ — **FIXED in US-003** (now uses env var)
2. **Client-side DB access** — Drizzle client imported in `'use client'` components, connection string exposed in browser bundle via `NEXT_PUBLIC_DATABASE_URL`
3. ~~**`/api/deleteCourse` has no auth**~~ — **FIXED in US-003** (now requires Clerk auth)
4. ~~**`/api/sendCertificate` has no auth**~~ — **FIXED in US-003** (now requires Clerk auth)
5. **YouTube API key exposed client-side** via `NEXT_PUBLIC_` prefix

### High
6. ~~**5 of 7 API routes have no auth checks**~~ — **FIXED in US-003** (now all 6 routes require auth; 1 orphaned route removed)
7. **No rate limiting** on any API endpoint
8. **No input validation** on most endpoints — user-provided strings used directly in prompts and DB queries

### Medium
9. ~~**No `.env.example`**~~ — **FIXED in US-003** (`.env.example` created)
10. **No CORS configuration** — defaults to same-origin only (Next.js default, acceptable)

---

## 11. Fixes Applied in US-003

### Completed
1. ✅ Added Clerk auth to `/api/deleteCourse` — prevents unauthorized course deletion
2. ✅ Added Clerk auth to `/api/sendCertificate` — prevents email abuse, verifies certificate ownership
3. ✅ Added Clerk auth to `/api/genRoadmap` — prevents API abuse
4. ✅ Added Clerk auth to `/api/genSubtopicContent` — prevents API abuse
5. ✅ Removed hardcoded credentials from `drizzle.config.js` — now uses env var
6. ✅ Removed orphaned `/api/genCourseDetails` route — dead code
7. ✅ Removed empty `app/createCourse/[courseId]/page.jsx` — was blocking production build
8. ✅ Created `.env.example` documentation

### Remaining (not in scope for US-003)
- Move client-side DB access to API routes (architectural change, belongs to later stories)
- Remove unused npm packages (cleanup, not a fix)
- Add rate limiting (enhancement, not a fix)
- Add input validation (enhancement, not a fix)

---

## 12. Environment Variables Reference

| Variable | Required By | Exposed to Client | Set in .env |
|----------|-------------|-------------------|-------------|
| `GROK_API_KEY` | `services/gemini.ts` | No | ✅ Yes |
| `NEXT_PUBLIC_DATABASE_URL` | `services/db.js` | ✅ Yes | ✅ Yes |
| `NEXT_PUBLIC_YOUTUBE_API_KEY` | `services/youtube.ts` | ✅ Yes | ✅ Yes |
| `GMAIL_USER` | `api/sendCertificate` | No | ✅ Yes |
| `GMAIL_APP_PASSWORD` | `api/sendCertificate` | No | ✅ Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `@clerk/nextjs` | ✅ Yes | ✅ Yes |
| `CLERK_SECRET_KEY` | `@clerk/nextjs` | No | ✅ Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `@clerk/nextjs` | ✅ Yes | Not verified |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `@clerk/nextjs` | ✅ Yes | Not verified |

**`.env.example` file created in US-003.**
