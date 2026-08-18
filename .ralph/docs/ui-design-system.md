# LEAP Neue — UI Design System v1

Driving full page redesigns for US-016. Reference: .ralph/prd.json -> US-016.

## 1. Core Palette

Dark-theme SaaS course platform. Base tone: slate. Primary action: amber (warm, pairs with slate). Secondary: indigo.

| Token                 | Value            | Usage                                   |
|-----------------------|------------------|-----------------------------------------|
| primary               | #f59e0b (amber)  | CTA buttons, active nav, primary links  |
| primary-hover         | #d97706          | Button hovers                           |
| primary-foreground    | #111827          | Text on primary buttons                 |
| secondary             | #6366f1 (indigo) | Secondary buttons, chapter badges       |
| accent                | #14b8a8 (teal)   | AI-generated content badges             |
| background            | #0f172a (slate)  | page background                         |
| card                  | #1e293b          | cards, panels                           |
| card-hover            | #293548          | course card hover                       |
| border                | #334155          | dividers, input borders                 |
| border-hover          | #475569          | input focus ring                        |
| foreground            | #f8fafc          | headings, body                          |
| muted-foreground      | #94a3b8          | subheadings, hints                      |
| muted                 | #334155          | badge backgrounds                       |
| destructive           | #f87171          | delete buttons                          |
| success               | #4ade80          | completed badges/progress               |
| warning               | #fbbf24          | draft badges                            |

Chart colors (5 hues): amber #f59e0b, teal #14b8a8, violet #8b5cf6, pink #ec4899, green #4ade80.

## 2. Typography

| Token            | Element            | Font size   | Weight |
|------------------|--------------------|-------------|--------|
| text-display     | Page h1            | 2.25rem     | 700    |
| text-heading      | Section h2         | 1.5rem      | 600    |
| text-subheading  | Block titles, cards| 1.125rem    | 600    |
| text-body        | Default body       | 1rem        | 400    |
| text-small       | Captions, metadata | 0.875rem    | 400    |
| text-caption     | Tags, footnotes    | 0.75rem     | 500    |
| text-mono        | Code blocks        | 0.875rem    | 400    |

Family: Geist Sans + Geist Mono.

## 3. Spacing + Radius

Spacing: 8px grid (4,8,12,16,20,24,32,40,48,64).
Radius: sm=4px, md=8px, lg=12px, xl=16px.

## 4. Component Specs

### Course Card
- Thumbnail (top 16:9); placeholder = course initial on muted bg
- Title text-subheading, 2 lines truncate
- Meta text-small muted (e.g. "5 chapters x 2h")
- Progress: shadcn Progress + caption "x / y lessons"
- Status badge top-right: Completed green, In Progress amber, Draft slate
- 3-dot dropdown (MoreVertical) -> Edit / Delete
- Hover: card-hover bg + shadow-xl

### Dashboard Header
- Left: Logo + Leap (links home). Center: page title. Right: UserButton + bell.
- Mobile: hamburger -> Sheet nav.

### Sidebar
- Nav: Dashboard, My Courses, Completed, Create Course, Upgrade, Settings
- Active: amber text + amber/10 bg + left amber border
- Bottom: Upgrade CTA card

### Create Course Stepper
- 3-step horizontal: Basics -> Roadmap -> Videos
- Current amber fill; complete green; pending muted outline

### Alter Roadadmap
- Draggable, collapsible chapter cards (chevron + GripVertical)
- Subtopics: checkbox + inline input + drag handle + remove
- Footer: "Add Chapter" (secondary) + "Generate with AI" (primary, sparkles)

### Choose Videos
- Top: search input + selected-chip lane (removable X)
- Tabs: All / Selected
- Grid: YouTube thumbnails 16:9, title + channel + duration, top-right checkbox
- Bottom: Confirm (primary) + Skip (ghost)

### Completed Courses
- Card grid + green badge + completion date + 100% progress
- Actions: View Certificate (Award icon), Share (Share2 icon)
- Empty: EmptyState BookOpen + "No completed courses yet" + explore link

## 5. Wireframes (ASCII)

### Dashboard / My Courses
HEADER: Logo Leap | My Courses | [UserBtn]  [hamburger on mobile]
SIDEBAR: Dashboard, My Courses, Completed, Create Course, Upgrade
MAIN:
  [Stats: 2 courses / 4 completed]
  [Search bar] [Filter v]
  [+ New Course]
  Course grid (1-3 cols):
  [thumb][thumb]
  "Intro to React" "LaTeX Math"
  "5 ch x 2h"  [badge In Progress]
  [progress bar][3/10 lessons]

### Create Course (Step 1: Basics)
HEADER: Logo Leap | Create Course
STEPPER: [1 Basics] [2 Roadmap] [3 Videos]   (current=amber)
CARD:
  Course title [input]
  Description [textarea]
  Difficulty: [Beginner] [Intermediate] [Advanced]
  Category [dropdown]
  Thumbnail [Upload or letter picker]
  [Continue to Roadmap]

### Alter Roadmap
HEADER: Logo Leap | Course title
STEPPER: [Basics] [Roadmap] [Videos]
TITLE BAR: "Lesson Roadmap" [Back] [Save]
CHAPTER CARD (draggable):
  [Chapter 1: Intro] [5 subtopics] [drag handle]
    [x] Introduction to React [edit]
    [x] Components & Props [edit]
    [x] State & Lifecycle [edit]
    [+] Add Subtopic
[+] Add Chapter   [Generate with AI sparkles]
[Continue to Videos]

### Choose Videos
HEADER: Logo Leap | Choose Videos [Skip]
SEARCH: [Search YouTube videos...]
CHIPS: [Intro React x] [Props x]
TABS: [All Videos] [Selected (2)]
GRID (4-col):
  [thumb][thumb][thumb]
  "React Tutor" "JSX Basics" "Hooks Intro"
  "12:34" "freecodecamp" "8:22"
  [checkbox] [checkbox] [checkbox]
[Confirm Selection] [Skip for now]

### Completed Courses
HEADER: Logo Leap | Completed
SIDEBAR: ...
TITLE: "Completed Courses" / subtitle "Courses you have finished"
COMPLETED CARD:
  [thumb]
  "Intro to React"
  [badge green Completed]
  "Completed on Aug 12, 2025"
  [progress 100%]
  [View Certificate][Share]
EMPTY STATE: [BookOpen icon] "No completed courses yet." [Explore Courses]

## 6. Implementation Notes
- All shadcn components from components/ui/
- All icons: lucide-react only (no emoji, react-icon, raw SVGs)
- Mobile: sidebar -> Sheet (SheetTrigger hamburger in header)
- Dashboard layout consistent on all pages; learnCourse collapses sidebar
- Dead files to remove: Addcourse.jsx, components/LaTeXRenderer.jsx, Features.jsx, Footer.jsx, Pricing.jsx, any zero-byte files
