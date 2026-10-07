---
doc: spec
status: approved
---

# Class Blocks (working title) — Technical Spec

## How This Works, In Plain Language
The app is a handful of ordinary files: one page (HTML), one file for the look (CSS), and several JavaScript files for the behavior. You open the page in your browser and there is nothing to install and no server.

Classes are stored in the browser's `localStorage`, a sticky note the browser keeps for one site. When a rep creates a class or adds a quiz, the app writes it onto that shared note. The other window is told "the note changed" and redraws itself, which is how the student window shows the carve a moment after the rep adds it.

Each window also keeps a private note of its own (in `sessionStorage`, which belongs to one window): which classes this window created (author) or joined (attendee), its colour choices, and the week number the user set. Only classes marked "author" show the edit controls. That is why one window can act as the rep and the other as the student.

Drawing is done in two ways. The weekly block diagram and the daily cards are drawn as SVG (shapes made by code). The carve is one function that builds an organic blob and subtracts it from the block using an SVG mask, which is the same idea as a Boolean Difference in Blender. The week view and the day cards both call that one function, so they always agree. The living background is a separate `<canvas>` behind everything, with blocks drifting around, that eases into a grid once you have classes.

Why this shape: your demo needs two windows on one computer, so no accounts, server or database are needed. This keeps the project small, and every piece is readable.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. **Arrival.** The page loads. `app.js` reads the shared classes and the window's private note. Both are empty, so the background runs in full motion, the week indicator says "Set the week," and the views show their empty states. (`prd.md > States and Boundaries`)
2. **Creating (rep).** The user taps the plus button and picks "create a class". `forms.js` collects the name, days and times, colour and forks. `store.js` generates a code, saves the class to the shared note, and marks it "author" in this window's private note. The class panel and the code appear.
3. **Joining (student).** In the other window, the plus button then "join a class". The code is looked up in the shared note. If found, the class is marked "attendee" in this window's note, the join animation plays, the card appears in the day view, the block appears in the week view, and the background eases into a grid.
4. **Carving (rep).** In the rep window, the class panel's add-item form saves an item inside that class in the shared note. The browser fires a `storage` event in the other window, which re-renders. `carve.js` builds the shape and both views draw it.
5. **Success.** With both windows side by side, the student window updates by itself within about a second. This is the demo.

## Stack
No framework and no build step. This is intentionally plain so you can read every file. It is the learner's agreed choice, because it suits a demo on one computer.

| Part | Choice | Docs |
|---|---|---|
| Structure | HTML5 | https://developer.mozilla.org/docs/Web/HTML |
| Look | CSS (custom properties, grid, animations) | https://developer.mozilla.org/docs/Web/CSS |
| Behavior | JavaScript (plain scripts, no modules, no libraries) | https://developer.mozilla.org/docs/Web/JavaScript |
| Shared data | `localStorage` + `storage` event | https://developer.mozilla.org/docs/Web/API/Window/localStorage and https://developer.mozilla.org/docs/Web/API/Window/storage_event |
| Per-window data | `sessionStorage` | https://developer.mozilla.org/docs/Web/API/Window/sessionStorage |
| Week and day diagram, cards, carve | Inline SVG, `<mask>` | https://developer.mozilla.org/docs/Web/SVG/Element/mask |
| Background | `<canvas>` + `requestAnimationFrame` | https://developer.mozilla.org/docs/Web/API/Canvas_API |

Scripts are loaded as ordinary `<script>` tags in a set order, not as modules. Modules are blocked when opening a file directly, which would force a server.

Browser: current Chrome (or Edge) is the target for the recording. Not verified on other browsers.

## Where It Runs and How Someone Tries It
- **Runtime:** a browser only. No install, no API keys, no internet needed (system fonts, no external libraries).
- **Start:** double-click `index.html` to open it in Chrome. For the second window, open a **new window** (Ctrl+N) of the same browser and open the same file. Don't duplicate the tab, because a duplicated tab copies the first window's private note.
- **Recording:** place the two windows side by side. Left is the rep (create a class, add a quiz) and right is the student (join with the code).
- **Check early in the build:** whether `storage` events fire between two `file://` windows on this machine. If they don't, fall back to a static server with one command from the project folder: `python -m http.server 8000`, then open `http://localhost:8000` in both windows. The app code doesn't change.
- **Submission:** needs a short demo video and a public GitHub repository. Deployment is optional and not planned. The same files could be hosted as a static site later if wanted.

## Look and Feel
Carried forward from `prd.md > Look and Feel`; no new design discovery.
- **Palette:** deep greens `#051F20 #0B2B26 #163832 #235347 #8EB69B #DAF1DE` for the panel and background. Class colours must pop against them.
- **Eight class presets (learner approved):** coral `#FF5A5F`, orange `#FF9F1C`, amber `#FFD23F`, lime `#B6E92E`, aqua `#2EE6D6`, sky `#3FA9FF`, violet `#8B5CF6`, magenta `#FF4FA3`. Values may be tuned by eye during the build.
- **Carve colour:** the complement, computed in code by rotating the hue 180° (not hand-picked).
- **Fork shades:** same hue; lecture goes dark to light and practical goes light to dark (a gradient inside the block).
- **Shape:** rounded pill and block corners, small stud-like details, soft glows (CSS `box-shadow`/`filter: blur`) for the nebula effect.
- **Typography:** a rounded system font stack (no web fonts, so it works offline). Bold, tactile, slightly chunky.
- **Tone of copy:** short, friendly, plain. Messages are as written in the PRD.
- **Constraint:** nebula/aurora glows are built from blurred gradients, not true volumetric effects. They are simplified first and enriched later, per `prd.md > What We're Building`.

## Components

### Shared data store (`store.js`)
Reads and writes the shared classes (`localStorage`) and the window's private note (`sessionStorage`). Generates unique class codes, creates and ends classes, adds and deletes items, and fires a callback when another window changes the data. Every other component reads data only through it.
PRD ref: `prd.md > Creating a class (rep)`, `prd.md > Joining a class (student)`, `prd.md > Ending a class (rep)`, `prd.md > States and Boundaries`.

### Time and date helpers (`time.js`)
Converts day plus minutes into screen positions, formats durations, and turns "week N, day D" into a real date using the week number the user set (`anchorWeek` + `anchorDate`, from the device clock). Computes days remaining. The week runs Sunday to Thursday (learner confirmed): five day columns, `day` is 0–4, and the next week starts on the following Sunday, so week-to-date maths adds 7 days per week.
PRD ref: `prd.md > Weeks and dates`.

### Carve engine (`carve.js`)
One function: `buildCarve(block, item, seed)` returns the blob path and the mask. Steps:
1. Make ~12 points around an ellipse, nudge each radius by a seeded random amount (seed = item id, so the shape is stable), and join them with smooth curves.
2. Fix the blob's top edge on the item's start-time line, centred on the block's day column.
3. Binary-search the blob scale until the part inside the block covers the target fraction. Coverage is estimated by sampling a grid of points. Targets: midterm = 1/3, final = 1/2, quiz/other = 20–50% from the slider.
4. Return the shape for the SVG `<mask>` (block minus blob) and the blob drawn in the complement colour.
If the time falls outside every class block, the blob is drawn alone using a reference area (a standard 100-minute block at column width). If the blob would run past the block's bottom, it is clipped, and the area then falls short of target; accepted for the POC.
PRD ref: `prd.md > Adding an item (rep)` (the carve acceptance items), `prd.md > Look and Feel`.

### Weekly view (`week-view.js`)
Draws the block diagram in SVG: days along the top, 12 a.m. to midnight down the side, faint horizontal guide lines, each class block as tall as its duration, forks as two shaded blocks, and carves for the displayed week. Classes that overlap in time share the column side by side.
PRD ref: `prd.md > Screens and Layout` (weekly schedule), `prd.md > Creating a class (rep)` (forks).

### Daily view (`day-view.js`)
Draws cards for the selected day, using the same colours and the same `carve.js` output, scaled to card size. Shows the first-use message when empty.
PRD ref: `prd.md > Screens and Layout` (daily schedule), `prd.md > States and Boundaries`.

### Upcoming row and week controls (`upcoming.js`, `week-nav.js`)
The upcoming strip lists future items with week, date and countdown (or "In week 11, you have a quiz" when no week is set). The week indicator opens a small box to set the current week. Previous and next buttons plus the edge-hover cloud move the displayed week.
PRD ref: `prd.md > Weeks and dates`, `prd.md > Screens and Layout` (upcoming row, week indicator, week navigation), `prd.md > States and Boundaries` (week not set).

### Forms and class panel (`forms.js`)
The plus menu, the create-class form (with the expanding fork section), the join form with its error messages, the per-student recolour control, the add-item form (type, week, day, time, description, "other" title, importance slider with labels and the midterm marker), item delete, and the red "end class" button with its confirmation. Only classes marked "author" in this window show the edit controls.
PRD ref: `prd.md > Creating a class (rep)`, `prd.md > Joining a class (student)`, `prd.md > Adding an item (rep)`, `prd.md > Ending a class (rep)`.

### Living background (`background.js`)
A full-page canvas of rounded blocks that drift, rise and fall. When the window has at least one class, they ease toward a unified interlocking grid. Built simple first (plain moving rectangles), then enriched with glows.
PRD ref: `prd.md > Look and Feel` (background), `prd.md > Core Journey` (steps 1 and 2).

### Join animation (`animations.js`)
Plays when a code is accepted: the new card slides into the day view, the block morphs from muted to bright with a glow. Starts as a simple CSS animation. Enriched after the main flows work.
PRD ref: `prd.md > Joining a class (student)`.

### App entry (`app.js`)
Runs on load, wires the components together, and re-renders everything when data changes (this window's action or a `storage` event).

## Data Model
Two stores. For each: where it lives, how it changes, and what happens on return.

**Shared classes** — `localStorage` key `cb.classes`. Updated by the rep window; read by both. Survives closing and reopening the browser.
```
[{ id, code,            // code: 6 characters, unambiguous letters/digits
   name, colour,        // colour: preset key, e.g. "violet" (the rep's colour)
   forks: [ {label, note, days:[{day, startMin, endMin}] } ],   // one fork when no lecture/practical
   items: [ {id, type, weekNo, day, startMin, importance, title, description} ],
   createdAt }]
```
`type` is midterm, final, quiz or other. `importance` is 0–1 (quiz/other only; midterm and final use their fixed fractions). A class repeats weekly until it's ended, so there is no start week.

**This window's private note** — `sessionStorage` key `cb.me`. Survives reload, not closing the window.
```
{ memberships: { <classId>: { role: "author"|"attendee", colour } },
  anchorWeek, anchorDate,   // "this week is week N" as of that date; null until set
  viewedWeek }
```
Recolouring writes only to `memberships[classId].colour`, so it never affects another window.

**Ended class:** deleted from `cb.classes`; the other window's `storage` event re-renders, and its stale membership is ignored and cleaned.

## File Structure
```
class-blocks/
├── index.html            # the one page: floating panel, views, plus menu, canvas background
├── css/
│   ├── base.css          # palette variables, fonts, layout of the floating panel
│   └── effects.css       # glows, carve styling, animations
├── js/                   # loaded as plain <script> tags in this order
│   ├── store.js          # shared + private data, codes, change notification
│   ├── time.js           # day/minute/week/date maths and formatting
│   ├── carve.js          # the carve shape and area-fitting
│   ├── week-view.js      # weekly block diagram
│   ├── day-view.js       # daily cards
│   ├── upcoming.js       # upcoming row
│   ├── week-nav.js       # week indicator, prev/next, edge clouds
│   ├── forms.js          # plus menu, create, join, add item, class panel, end class
│   ├── background.js     # living canvas background
│   ├── animations.js     # join animation
│   └── app.js            # start-up and re-render wiring
├── devpost/              # Devpost learning workspace
└── README.md             # how to run (for the public repo)
```
The project can live in this existing folder; the folder name is not important.

## External Services and Dependencies
None. No APIs, accounts, keys, libraries or hosting. All built on browser features listed in **Stack**. Cost: free.

## Important Failure Modes
- **`storage` events don't fire between two `file://` windows** → the second window doesn't update live. Checked at the very start of the build; fallback is the one-line `python -m http.server` described above.
- **`localStorage` empty, blocked or holding unreadable text** → the app starts clean with the empty states rather than crashing, and shows a small note if saving fails.
- **Carve edge cases (very short block, carve near the bottom, overlapping classes)** → the carve is clipped to the block and the area may fall short; overlapping classes share the column so shapes stay readable.
- **Two reps generate the same code** → `store.js` retries until the code is unique within `cb.classes`.

## What Was Simplified and Why
- **Browser storage shared by two windows** instead of a server or database — the demo is one computer. A real version would need a server so phones could share (already in `prd.md > Deferred From the POC`).
- **Per-window membership (`sessionStorage`)** instead of per-device — lets one browser play both rep and student. Closing a window forgets its classes; this doesn't affect recording.
- **Area-sampling for the carve** instead of exact geometry — visually accurate, much simpler. An exact-geometry library (e.g. Clipper) could replace it later.
- **Glow, nebula and animations built from CSS gradients and blur** — richer effects come after the working product.
- **Weekly repeat only, no start week** — as decided in the PRD.

## Decisions and Open Issues
**Learner choices:**
- Plain HTML, CSS and JavaScript, no framework.
- Shared browser storage, no server (recommended by the agent and accepted).
- Week runs Sunday to Thursday; windows forgetting classes when closed is acceptable.
- Carve built as a seeded organic blob subtracted with an SVG mask, area-fitted by sampling (explained and accepted).
- The eight preset colours above (recommended and accepted).

**Implementation details derived from these (not learner choices):** `sessionStorage` for per-window state; file structure; load order; 6-character codes; reference area for out-of-block carves.

**Learner's open question:** "How is the carve done, is there a Boolean tool?" Clarified: a flat (2D) Boolean is done with an SVG mask, and the size is fitted by testing sample points. To be checked in the build: an early carve test page that shows 1/3, 1/2 and the slider range on a block, and confirms the areas look right.

**Unresolved / to verify early in the build:**
- Do `storage` events work between two `file://` windows here? (see Failure Modes.)
- From `prd.md > Open Questions`: the day axis runs 12 a.m. to midnight (assumed; confirm in the build).
- The eight colours may be tuned by eye for contrast on the greens.
