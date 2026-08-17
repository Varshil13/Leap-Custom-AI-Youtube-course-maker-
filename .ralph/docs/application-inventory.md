# LEAP Application Inventory

> Complete read-only audit of the LEAP codebase.
> Generated: 2026-08-18

---

## 1. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5.15 (App Router, Turbopack) |
| Language | JavaScript (JSX) for pages, TypeScript for API routes and services |
| UI | React 19, Tailwind CSS v4 (CSS-first config), Radix UI, shadcn/ui (New York) |
| Auth | Clerk (`@clerk/nextjs` v6.33.7) |
| Database | Neon PostgreSQL (serverless) via Drizzle ORM v0.44.6 |
| AI Backend | Groq API (`openai/gpt-oss-20b` model) |
| Video Source | YouTube Data API v3 |
| Email | Nodemailer (Gmail SMTP) |
| PDF | pdf-lib (certificate generation) |
| Icons | lucide-react, react-icons (HiOutline set) |
| Notifications | react-hot-toast |

---

## 2. Project Structure

```
/
├── app/                          # Next.js App Router
│   ├── globals.css               # Tailwind v4 theme, global styles
│   ├── layout.js                 # Root layout (ClerkProvider, fonts, Toaster)
│   ├── page.js                   # Landing page
│   ├── favicon.ico
│   ├── _components/              # Landing page components (underscore = private)
│   │   ├── Header.jsx            # Logo bar
│   │   ├── Hero.jsx              # Hero section with CTA
│   │   ├── Footer.jsx            # EMPTY (placeholder)
│   │   ├── Features.jsx          # EMPTY (placeholder)
│   │   ├── Pricing.jsx           # EMPTY (placeholder)
│   │   └── LaTeXRenderer.jsx     # Custom LaTeX-to-HTML parser
│   ├── _context/
│   │   └── UserInputContext.jsx  # React Context for course creation state
│   ├── _utils/
│   │   └── extractJsonArray.js   # JSON extraction from AI text
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.jsx
│   │   └── sign-up/[[...sign-up]]/page.jsx
│   ├── dashboard/
│   │   ├── layout.jsx            # Sidebar + Header layout
│   │   ├── page.jsx              # Dashboard home (Addcourse + Showcourses)
│   │   ├── _components/
│   │   │   ├── Header.jsx        # Dashboard top bar
│   │   │   ├── Sidebar.jsx       # Fixed left sidebar nav
│   │   │   ├── Addcourse.jsx     # Welcome + Create Course button
│   │   │   └── Showcourses.jsx   # Course grid with progress
│   │   ├── completed/page.jsx    # Completed courses + certificate
│   │   ├── upgrade/page.jsx      # "UNDER DEVELOPMENT" placeholder
│   │   └── learnCourse/[courseId]/page.jsx  # Course player
│   ├── createCourse/
│   │   ├── layout.jsx            # UserInputContext.Provider
│   │   ├── page.jsx              # 2-step wizard (TopicForm → AlterRoadmap)
│   │   ├── _components/
│   │   │   ├── TopicForm.jsx     # Topic/level/video form
│   │   │   ├── AlterRoadmap.jsx  # Drag-and-drop roadmap editor
│   │   │   └── LoadingDialouge.jsx  # Loading overlay
│   │   └── [courseId]/
│   │       ├── page.jsx          # EMPTY (unused)
│   │       └── chooseVideos/page.jsx  # Video selection
│   └── api/                      # 7 API routes (TypeScript)
│       ├── genRoadmap/route.ts
│       ├── genCourseDetails/route.ts
│       ├── genSubtopicContent/route.ts
│       ├── progress/route.ts
│       ├── deleteCourse/route.ts
│       ├── genCertificate/route.ts
│       └── sendCertificate/route.ts
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.jsx
│   │   ├── accordion.jsx
│   │   ├── alert-dialog.jsx
│   │   └── progress.jsx
│   └── LaTexRenderer.jsx        # EMPTY (unused duplicate)
├── services/
│   ├── db.js                     # Neon + Drizzle connection
│   ├── schema.ts                 # 5 database tables
│   ├── gemini.ts                 # Groq AI service (misnamed)
│   └── youtube.ts                # YouTube Data API service
├── lib/
│   └── utils.js                  # cn() utility
├── public/                       # Static assets
├── middleware.js                  # Clerk auth middleware
├── drizzle.config.js             # Drizzle Kit config
├── components.json               # shadcn/ui config
├── package.json
├── tsconfig.json
├── jsconfig.json
└── postcss.config.mjs
```

---

## 3. Routes / Pages

### 3.1 Public Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.js` | Landing page — Header + Hero with "Get Started" CTA |
| `/sign-in/[[...sign-in]]` | `app/(auth)/sign-in/[[...sign-in]]/page.jsx` | Clerk sign-in (redirects to `/dashboard`) |
| `/sign-up/[[...sign-up]]` | `app/(auth)/sign-up/[[...sign-up]]/page.jsx` | Clerk sign-up (redirects to `/dashboard`) |

### 3.2 Protected Routes (require Clerk auth)

| Route | File | Description |
|-------|------|-------------|
| `/dashboard` | `app/dashboard/page.jsx` | Greeting + "Create Course" button + course grid |
| `/dashboard/completed` | `app/dashboard/completed/page.jsx` | Completed courses with certificate generation |
| `/dashboard/upgrade` | `app/dashboard/upgrade/page.jsx` | Placeholder — "UNDER DEVELOPMENT" |
| `/dashboard/learnCourse/[courseId]` | `app/dashboard/learnCourse/[courseId]/page.jsx` | Course player — sidebar tree, YouTube embed, LaTeX content |
| `/createCourse` | `app/createCourse/page.jsx` | 2-step wizard: topic form → roadmap editor |
| `/createCourse/[courseId]/chooseVideos` | `app/createCourse/[courseId]/chooseVideos/page.jsx` | YouTube video selection per lesson |

### 3.3 API Routes

| Endpoint | Method | Auth | File | Description |
|----------|--------|------|------|-------------|
| `/api/genRoadmap` | POST | None | `app/api/genRoadmap/route.ts` | Generate course roadmap via Groq AI |
| `/api/genCourseDetails` | POST | None | `app/api/genCourseDetails/route.ts` | Generate course details (with retry, **orphaned — not called**) |
| `/api/genSubtopicContent` | POST | None | `app/api/genSubtopicContent/route.ts` | Generate LaTeX lesson content via Groq AI |
| `/api/progress` | GET | Clerk | `app/api/progress/route.ts` | Load user progress for a course |
| `/api/progress` | POST | Clerk | `app/api/progress/route.ts` | Save/update lesson progress |
| `/api/deleteCourse` | DELETE | None | `app/api/deleteCourse/route.ts` | Cascade-delete a course and all related data |
| `/api/genCertificate` | POST | Clerk | `app/api/genCertificate/route.ts` | Generate PDF certificate (requires 100% completion) |
| `/api/sendCertificate` | POST | None | `app/api/sendCertificate/route.ts` | Email certificate PDF via Gmail SMTP |

---

## 4. Authentication & Authorization

### 4.1 Middleware (`middleware.js`)

Uses `clerkMiddleware` with route matchers:

**Protected routes:**
- `/dashboard(.*)` — all dashboard pages
- `/createCourse(.*)` — all course creation pages
- `/profile(.*)` — defined but **no `/profile` page exists**

**Matcher:** Skips static files, always runs for `/api/*` and `/trpc/*` paths. However, the `isProtectedRoute` matcher only guards the three page prefixes above — API routes are NOT protected by middleware.

### 4.2 Server-Side Auth (API Routes)

Only 2 of 7 API routes check for Clerk auth:
- `/api/progress` — returns 401 if no `userId` from `auth()`
- `/api/genCertificate` — returns 401 if no `userId` from `auth()`

**Unprotected API routes:** `/api/genRoadmap`, `/api/genCourseDetails`, `/api/genSubtopicContent`, `/api/deleteCourse`, `/api/sendCertificate`

### 4.3 Client-Side Auth

- `ClerkProvider` + `GoogleOneTap` in root layout
- `<SignIn />` and `<SignUp />` components with Clerk
- `<UserButton />` in dashboard header
- `useUser()` hook used in multiple components for user data

### 4.4 Roles

**No RBAC system.** All authenticated users have identical access.

---

## 5. Database & Persistence Layer

### 5.1 Technology

- **Driver:** `@neondatabase/serverless` (Neon serverless PostgreSQL)
- **ORM:** Drizzle ORM v0.44.6
- **Schema:** `services/schema.ts`
- **Connection:** `services/db.js`
- **Config:** `drizzle.config.js`
- **Migrations:** None — uses `drizzle-kit push` directly

### 5.2 Tables (5 total)

#### CourseDetails
| Column | DB Column | Type | Notes |
|--------|-----------|------|-------|
| `id` | `id` | serial PK | Auto-increment |
| `courseId` | `course_id` | varchar | UUID v4 |
| `name` | `name` | varchar | Course title |
| `description` | `description` | varchar | AI-generated description |
| `duration` | `duration` | varchar | Always saved as `""` |
| `level` | `level` | varchar | Introductory/Beginner/Intermediate/Advanced |
| `userName` | `user_name` | varchar | Creator's name |
| `userProfileImage` | `user_profile_image` | varchar | Creator's avatar URL |
| `createdBy` | `created_by` | varchar | Creator's email |
| `roadmap` | `roadmap` | json | `[{id, title, subtopics[]}]` |
| `includeVideos` | `include_videos` | boolean | Video preference |
| `createdAt` | `created_at` | timestamp | Auto |

#### course_videos
| Column | DB Column | Type | Notes |
|--------|-----------|------|-------|
| `id` | `id` | serial PK | |
| `courseId` | `course_id` | varchar NOT NULL | |
| `chapterTitle` | `chapter_title` | varchar NOT NULL | |
| `subtopicName` | `subtopic_name` | varchar NOT NULL | |
| `videoData` | `video_data` | json | YouTube response or `{customUrl}` or `{skipped: true}` |
| `createdAt` | `created_at` | timestamp | |

#### course_content
| Column | DB Column | Type | Notes |
|--------|-----------|------|-------|
| `id` | `id` | serial PK | |
| `courseId` | `course_id` | varchar NOT NULL | |
| `chapterTitle` | `chapter_title` | varchar NOT NULL | |
| `subtopicName` | `subtopic_name` | varchar NOT NULL | |
| `contentData` | `content_data` | json | `{ content: <raw LaTeX> }` |
| `createdAt` | `created_at` | timestamp | |

#### user_progress
| Column | DB Column | Type | Notes |
|--------|-----------|------|-------|
| `id` | `id` | serial PK | |
| `userId` | `user_id` | varchar NOT NULL | Clerk user ID |
| `courseId` | `course_id` | varchar NOT NULL | |
| `chapterTitle` | `chapter_title` | varchar NOT NULL | |
| `subtopicName` | `subtopic_name` | varchar NOT NULL | |
| `isWatched` | `is_watched` | boolean | Default false |
| `watchedAt` | `watched_at` | timestamp | |
| `createdAt` | `created_at` | timestamp | |
| `updatedAt` | `updated_at` | timestamp | |

#### certificates
| Column | DB Column | Type | Notes |
|--------|-----------|------|-------|
| `id` | `id` | serial PK | |
| `userId` | `user_id` | varchar NOT NULL | |
| `courseId` | `course_id` | varchar NOT NULL | |
| `courseName` | `course_name` | varchar NOT NULL | |
| `userName` | `user_name` | varchar NOT NULL | |
| `userEmail` | `user_email` | varchar NOT NULL | |
| `certificateUrl` | `certificate_url` | varchar | Unused (PDF returned as base64) |
| `status` | `status` | varchar | pending/sent/failed |
| `requestedAt` | `requested_at` | timestamp | |
| `sentAt` | `sent_at` | timestamp | |
| `createdAt` | `created_at` | timestamp | |

### 5.3 Relationships (logical, no FK constraints)

```
User (Clerk) ──1:N──> CourseDetails (via createdBy = email)
User (Clerk) ──1:N──> UserProgress (via userId = Clerk ID)
User (Clerk) ──1:N──> Certificates (via userId = Clerk ID)
CourseDetails ──1:N──> CourseVideos (via courseId)
CourseDetails ──1:N──> CourseContent (via courseId)
CourseDetails ──1:N──> UserProgress (via courseId)
CourseDetails ──1:N──> Certificates (via courseId)
```

### 5.4 Client-Side DB Access

**Critical architectural note:** The Drizzle client is imported and used directly in `'use client'` components:
- `app/createCourse/page.jsx` — inserts CourseDetails
- `app/createCourse/[courseId]/chooseVideos/page.jsx` — queries/inserts/deletes CourseVideos
- `app/dashboard/_components/Showcourses.jsx` — queries CourseDetails
- `app/dashboard/completed/page.jsx` — queries CourseDetails
- `app/dashboard/learnCourse/[courseId]/page.jsx` — queries CourseDetails, CourseVideos, CourseContent

This works via Neon's serverless driver (HTTP-based) but exposes the database connection string in the browser bundle.

---

## 6. AI Integrations

### 6.1 Groq API (AI Service)

- **File:** `services/gemini.ts` (misnamed — not Google Gemini)
- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Model:** `openai/gpt-oss-20b`
- **Temperature:** 0.9
- **Auth:** `GROQ_API_KEY` or `GROK_API_KEY` env var
- **Returns:** `{ text: string, files: AIFile[] }`

### 6.2 AI-Powered Features

| Feature | API Route | Prompt | Retry |
|---------|-----------|--------|-------|
| Roadmap generation | `/api/genRoadmap` | Built on client, curriculum designer persona | No |
| Course details | `/api/genCourseDetails` | Generic, built on client | Yes (3 attempts, exponential backoff) |
| Subtopic content | `/api/genSubtopicContent` | Built on server, educator persona, LaTeX output | No |

### 6.3 Content Generation Pipeline

```
User opens lesson → Check DB → Check React state → Check localStorage
  → If missing: POST /api/genSubtopicContent → Groq API
  → Save to DB (CourseContent) + React state + localStorage
  → Render via LaTeXRenderer
```

### 6.4 Unused AI Package

`@google/genai` v1.22.0 is in `package.json` but **never imported**.

---

## 7. External Services Summary

| Service | Status | Auth | Env Var |
|---------|--------|------|---------|
| Groq AI | ACTIVE | Bearer token | `GROQ_API_KEY` |
| Clerk Auth | ACTIVE | SDK-managed | `NEXT_PUBLIC_CLERK_*` |
| Neon PostgreSQL | ACTIVE | Connection string | `NEXT_PUBLIC_DATABASE_URL` |
| YouTube Data API v3 | ACTIVE | API key | `NEXT_PUBLIC_YOUTUBE_API_KEY` |
| Gmail SMTP | ACTIVE | App password | `GMAIL_USER`, `GMAIL_APP_PASSWORD` |
| pdf-lib | ACTIVE | Local library | — |
| `@google/genai` | **UNUSED** | — | — |
| `resend` | **UNUSED** | — | — |

---

## 8. LaTeX Rendering Implementation

### 8.1 Active Renderer

**File:** `app/_components/LaTeXRenderer.jsx`

A custom regex-based parser that converts LaTeX structural commands to HTML:

| LaTeX | HTML Output |
|-------|-------------|
| `\section{...}` | `<h2>` |
| `\subsection{...}` | `<h3>` |
| `\begin{itemize}...\end{itemize}` | `<ul>` |
| `\begin{enumerate}...\end{enumerate}` | `<ol>` |
| `\begin{lstlisting}...\end{lstlisting}` | `<pre><code>` |
| `\textbf{...}` | `<strong>` |
| `\textit{...}` | `<em>` |
| `\texttt{...}` | `<code>` |

### 8.2 Critical Gap

The renderer does **NOT** handle mathematical expressions:
- No `$...$` inline math
- No `$$...$$` block math
- No `\frac`, `\sum`, `\int`, `\sqrt`, Greek letters, etc.

KaTeX CSS is imported (`katex/dist/katex.min.css`) and CSS rules exist in `globals.css`, but KaTeX JS rendering is never invoked.

### 8.3 Installed But Unused Math Packages

| Package | Used |
|---------|------|
| `react-katex` v3.1.0 | NO |
| `@matejmazur/react-katex` v3.1.3 | NO |
| `rehype-katex` v7.0.1 | NO |
| `remark-math` v6.0.0 | NO |
| `react-markdown` v10.1.0 | NO |
| `remark-gfm` v4.0.1 | NO |
| `rehype-highlight` v7.0.2 | NO |

### 8.4 Dead Files

- `components/LaTexRenderer.jsx` — empty (0 bytes)
- `app/createCourse/[courseId]/page.jsx` — empty

---

## 9. UI Components

### 9.1 shadcn/ui Components (4 installed)

| Component | File | Based On |
|-----------|------|----------|
| Button | `components/ui/button.jsx` | Radix Slot + CVA |
| Accordion | `components/ui/accordion.jsx` | Radix Accordion |
| AlertDialog | `components/ui/alert-dialog.jsx` | Radix AlertDialog |
| Progress | `components/ui/progress.jsx` | Radix Progress |

### 9.2 Application Components

| Component | File | Purpose |
|-----------|------|---------|
| Header (landing) | `app/_components/Header.jsx` | Logo bar |
| Hero | `app/_components/Hero.jsx` | Full-screen hero with animated CTA |
| Footer | `app/_components/Footer.jsx` | Empty placeholder |
| Features | `app/_components/Features.jsx` | Empty placeholder |
| Pricing | `app/_components/Pricing.jsx` | Empty placeholder |
| LaTeXRenderer | `app/_components/LaTeXRenderer.jsx` | Custom LaTeX-to-HTML parser |
| Header (dashboard) | `app/dashboard/_components/Header.jsx` | Logo + Clerk UserButton |
| Sidebar | `app/dashboard/_components/Sidebar.jsx` | Fixed nav (Home, Completed, Upgrade) |
| Addcourse | `app/dashboard/_components/Addcourse.jsx` | Welcome + Create Course button |
| Showcourses | `app/dashboard/_components/Showcourses.jsx` | Course grid with progress bars |
| TopicForm | `app/createCourse/_components/TopicForm.jsx` | Course creation form |
| AlterRoadmap | `app/createCourse/_components/AlterRoadmap.jsx` | Drag-and-drop roadmap editor |
| LoadingDialouge | `app/createCourse/_components/LoadingDialouge.jsx` | Loading overlay |

### 9.3 Styling System

- **Tailwind CSS v4** with CSS-first config (`@theme inline` in `globals.css`)
- **Dark theme by default** — CSS custom properties define the color palette
- **Design tokens:** `--background`, `--foreground`, `--card`, `--primary` (cyan), `--secondary`, `--accent`, `--destructive`, `--muted`, `--border`, `--ring`, `--sidebar`
- **Inline styles pattern:** Many components use `style={{ background: 'var(--card)' }}` alongside Tailwind classes
- **Fonts:** Geist Sans + Geist Mono
- **Animations:** `animate-fade-in-up`, `animate-bounce`, `animate-pulse`, `animate-spin`, `animate-accordion-*`

### 9.4 State Management

- **React Context:** `UserInputContext` for course creation wizard
- **localStorage caching:** Progress data and content data cached client-side
- **useState:** All other component state

---

## 10. Core User Journeys

### 10.1 Landing → Sign Up → Dashboard

```
/ (landing) → /sign-up → /dashboard
```

1. User sees hero with "Get Started" CTA
2. Redirected to Clerk sign-up
3. On success, redirected to dashboard
4. Dashboard shows greeting + empty course list

### 10.2 Course Creation

```
/dashboard → /createCourse → /createCourse/[courseId]/chooseVideos → /dashboard
```

1. User clicks "Create Course" on dashboard
2. **Step 1:** Enter topic, select level, choose video inclusion
3. AI generates roadmap via `/api/genRoadmap`
4. **Step 2:** User edits/reorders roadmap via drag-and-drop
5. Roadmap saved to DB
6. **Video Selection:** YouTube videos auto-fetched per lesson
7. User selects, skips, or custom-URLs videos
8. Videos saved to DB, redirected to dashboard

### 10.3 Learning a Course

```
/dashboard → /dashboard/learnCourse/[courseId]
```

1. User clicks "View Course" on a dashboard course card
2. Left sidebar shows chapter/subtopic tree with progress
3. Main area shows:
   - YouTube video embed (if selected)
   - "Mark as Watched" checkbox
   - Chapter Overview (subtopic list)
   - Lesson Content (AI-generated LaTeX, generated on-demand)
4. Content is generated on first view via `/api/genSubtopicContent`
5. Content cached in DB + React state + localStorage
6. Progress tracked per subtopic

### 10.4 Course Completion & Certificate

```
/dashboard/completed → genCertificate → sendCertificate
```

1. Completed courses (100% progress) shown on `/dashboard/completed`
2. User clicks "Get Certificate"
3. `/api/genCertificate` verifies 100% completion, generates PDF
4. PDF returned as base64 to client
5. `/api/sendCertificate` emails PDF via Gmail SMTP
6. Certificate record saved to DB with status tracking

### 10.5 Course Deletion

```
/dashboard → Showcourses → handleDeregister → /api/deleteCourse
```

1. User clicks "Deregister" on a course card
2. `window.confirm()` dialog
3. DELETE request to `/api/deleteCourse`
4. Cascade deletes: UserProgress → CourseVideos → CourseContent → Certificates → CourseDetails

---

## 11. Environment Variables

| Variable | Required By | Notes |
|----------|-------------|-------|
| `GROQ_API_KEY` / `GROK_API_KEY` | `services/gemini.ts` | Groq AI auth |
| `NEXT_PUBLIC_DATABASE_URL` | `services/db.js` | Neon Postgres connection |
| `NEXT_PUBLIC_YOUTUBE_API_KEY` | `services/youtube.ts` | YouTube search |
| `GMAIL_USER` | `api/sendCertificate` | Gmail sender |
| `GMAIL_APP_PASSWORD` | `api/sendCertificate` | Gmail SMTP password |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `@clerk/nextjs` | Clerk auth |
| `CLERK_SECRET_KEY` | `@clerk/nextjs` | Clerk auth |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `@clerk/nextjs` | Sign-in page |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `@clerk/nextjs` | Sign-up page |

**No `.env.example` file exists.**

---

## 12. Security Observations

1. **Hardcoded DB credentials** in `drizzle.config.js` — full connection string with password committed to repo
2. **Client-side DB access** — Drizzle client imported in `'use client'` components, connection string exposed in browser bundle
3. **Unprotected API routes** — 5 of 7 API routes have no Clerk auth checks
4. **`/api/deleteCourse` has no auth** — any request can delete any course
5. **`/api/sendCertificate` has no auth** — any request can send emails
6. **YouTube API key exposed client-side** via `NEXT_PUBLIC_` prefix
7. **No `.env.example`** — no documentation of required env vars for developers

---

## 13. Known Issues & Technical Debt

1. **Math rendering is broken** — KaTeX installed but unused; custom parser only handles document structure, not math
2. **Dead code** — Empty files: `components/LaTexRenderer.jsx`, `app/createCourse/[courseId]/page.jsx`, `Footer.jsx`, `Features.jsx`, `Pricing.jsx`
3. **Unused packages** — `@google/genai`, `resend`, `react-katex`, `@matejmazur/react-katex`, `rehype-katex`, `remark-math`, `react-markdown`, `remark-gfm`, `rehype-highlight`, `mime`
4. **`/api/genCourseDetails` is orphaned** — has retry logic but no client calls it
5. **`duration` field always empty** — saved as `""` during course creation
6. **Mixed DnD libraries** — Both `@dnd-kit` and `@hello-pangea/dnd` used in AlterRoadmap
7. **`/profile` route protected** in middleware but no page exists
8. **No formal database migrations** — uses `drizzle-kit push` directly
9. **Misnamed service file** — `gemini.ts` actually calls Groq API
10. **No content validation** — AI responses not validated before storage
11. **No rate limiting** on any API endpoint
12. **Inline styles mixed with Tailwind** — inconsistent styling approach
13. **Two separate icon libraries** — lucide-react + react-icons
14. **Video progress is manual** — no time-based or completion tracking from YouTube embeds
