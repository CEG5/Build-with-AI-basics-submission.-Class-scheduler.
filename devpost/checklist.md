---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. A rep window creates a class and a student window joins it with the code**
  Becomes usable: Open the page in two windows. In one, create a simple class and get a code. In the other, join with the code and see the class appear as a card in the day view and a block in the week view. Also settles whether windows share data live.
  Why now: Proves the whole path end to end (page, shared storage, code, two windows) and answers the biggest risk first: do `storage` events fire between two `file://` windows? If not, we switch to the one-line server now, while it is cheap.
  PRD ref: `prd.md > The Core Journey` (steps 1-3), `prd.md > Joining a class (student)`, `prd.md > States and Boundaries` (wrong code, already joined)
  Spec ref: `spec.md > Components` (store, time, week-view, day-view, forms, app), `spec.md > File Structure`, `spec.md > Data Model`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Scaffold the folder per the spec (`index.html`, `css/`, `js/`). Write `store.js` (shared classes, private note, unique 6-character codes, change callback), `time.js` basics, a simple week block view and day card view, a plus menu with a basic create form (name, one day, start/end, one preset colour) and a join form with the error messages, and `app.js` to re-render on changes. Dark-green palette in `base.css`.
  Verify (mechanical): Run a JS syntax check on every file; load the page in a headless/in-app browser with two windows on the same origin, create a class in one, confirm the `storage` event reaches the other and it renders after joining; confirm wrong-code and already-joined messages.
  Learner check: Open `index.html` in Chrome, then open a second new window (Ctrl+N) with the same file. Create a class in the first, join it with the code in the second, and tell me whether the block and card appear and whether the layout feels like what you pictured.
  Commit: `Add scaffold, shared storage, create and join`

- [x] **2. The carve: the rep adds an item and it is carved out in the student window**
  Becomes usable: In the class panel the rep adds a midterm, final, quiz or other. A complement-coloured organic piece is carved from the block, in both week and day views, and shows live in the student window.
  Why now: This is the unique kernel and the highest technical risk (blob shape, area fitting, SVG mask). It must exist early, not last.
  PRD ref: `prd.md > Adding an item (rep)` (all acceptance items), `prd.md > Look and Feel` (carve)
  Spec ref: `spec.md > Carve engine`, `spec.md > Forms and class panel` (add-item form), `spec.md > Data Model` (items)
  Build: Write `carve.js` (`buildCarve`, seeded blob, binary-search area fit, complement colour by hue rotation, mask), a small carve test page showing 1/3, 1/2 and the slider range, the add-item form with type, week, day, time, description, "other" title and importance slider with labels and midterm marker, and the carve drawing in week and day views.
  Verify (mechanical): Run the test page logic in a browser and confirm measured coverage is within a few percent of 1/3 and 1/2 and moves smoothly across the slider; confirm a quiz at 9 a.m. has its top on the 9 a.m. line; confirm the item written in one window renders in the other.
  Learner check: Add a midterm, a final and a quiz (move the slider) in the rep window and watch the student window. Tell me whether the carve looks the way you imagined: organic, contrasting, the right size.
  Commit: `Add carve engine and add-item form`

- [x] **3. Full create-class form: forks, free times, eight colours, recolouring**
  Becomes usable: A rep can create a class with several days, any duration (1h40, 2h40, 60 min), one of eight colours, and an optional lecture/practical split shown as two related shades. A student can recolour their own copy.
  Why now: The basic class from slice 1 becomes the real one, now that the carve works on it.
  PRD ref: `prd.md > Creating a class (rep)` (both acceptance items), `prd.md > Joining a class (student)` (recolour)
  Spec ref: `spec.md > Forms and class panel`, `spec.md > Look and Feel` (colours, fork shades), `spec.md > Data Model` (forks)
  Build: Extend the create form (multi-day, free times, eight presets, expanding fork section with notes), draw fork shade gradients, side-by-side layout for overlapping classes, per-window recolour control.
  Verify (mechanical): Create classes with 100, 160 and 60 minute times and a fork class; confirm stored data and rendered block heights; confirm recolour changes only one window's note.
  Learner check: Create a class with a lecture and a practical, then recolour it in the student window and confirm the rep window's colour is unchanged.
  Commit: `Add full class form, forks, colours, recolour`

- [x] **4. Weeks, dates, upcoming row and week navigation**
  Becomes usable: The user sets the current week, moves between weeks, sees carves for the displayed week, and sees an upcoming row with dates and countdowns.
  Why now: Items belong to weeks, so the product needs week handling before it is useful across a semester.
  PRD ref: `prd.md > Weeks and dates`, `prd.md > Screens and Layout` (upcoming row, week indicator, navigation), `prd.md > States and Boundaries` (week not set)
  Spec ref: `spec.md > Time and date helpers`, `spec.md > Upcoming row and week controls`
  Build: Finish `time.js` (Sunday to Thursday, anchor week/date), `week-nav.js` (indicator box, prev/next, edge hover clouds), `upcoming.js` (dates, countdown, "In week 11..." fallback).
  Verify (mechanical): Unit-check date maths in the browser console: set week 6, an item in week 10 shows the right date and days remaining; with no week set the fallback text shows.
  Learner check: Set the week, add an item a few weeks ahead, move between weeks, and check the upcoming row says what you expect.
  Commit: `Add weeks, dates, upcoming row and navigation`

- [x] **5. Class panel: delete item, end class, author versus attendee**
  Becomes usable: Only the rep sees edit controls; the rep can delete an item and end a class (with the confirmation), and it disappears from the student window.
  Why now: Completes the rule set around the core loop before polishing visuals.
  PRD ref: `prd.md > Ending a class (rep)`, `prd.md > States and Boundaries` (who can edit, ended class)
  Spec ref: `spec.md > Forms and class panel`, `spec.md > Data Model` (ended class)
  Build: Item delete, red end-class button with pop-up, hide controls for attendees, clean stale memberships, safe handling of unreadable storage.
  Verify (mechanical): Confirm the attendee window shows no edit controls; end a class and confirm the other window drops it and cleans its note; corrupt the storage value and confirm the app starts clean.
  Learner check: End a class in the rep window and confirm it vanishes in the student window; check the student cannot edit.
  Commit: `Add delete item, end class, author rules`

- [x] **6. Living background and grid**
  Becomes usable: A canvas of drifting blocks behind the panel that eases into a calm grid once the window has a class.
  Why now: Mood and identity, built simple first as the PRD asks.
  PRD ref: `prd.md > Look and Feel` (background), `prd.md > The Core Journey` (steps 1-2)
  Spec ref: `spec.md > Living background`
  Build: `background.js` with moving rounded rectangles via `requestAnimationFrame`, easing toward a grid when a class exists, resize handling.
  Verify (mechanical): Confirm no console errors, animation running, and that the state switches from drifting to grid after joining.
  Learner check: Open the page fresh, then join a class, and tell me whether the background feels right.
  Commit: `Add living background`

- [x] **7. Join animation, glows, polish and README**
  Becomes usable: Joining plays the morph from muted to bright with a glow; nebula glows on active block and week edges; a README explains how to run.
  Why now: The demo's "oh, that's cool" beat, added once the flows are solid.
  PRD ref: `prd.md > Joining a class (student)`, `prd.md > Look and Feel` (effects)
  Spec ref: `spec.md > Join animation`, `spec.md > Look and Feel`
  Build: `animations.js` and `effects.css`, glows from blurred gradients, `README.md`.
  Verify (mechanical): Join a class and confirm the animation classes apply and clear with no console errors; run the full core journey in two windows.
  Learner check: Run the whole demo flow with two windows side by side as you would record it, and tell me what to change.
  Commit: `Add join animation, glows and README`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 2 (the carve working live across two windows)
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [x] Redesign after learner feedback: matte grey look, raised marble rim, sharper shapes, minimal type
- [x] Carve rebuilt: fills from the bottom-right corner (quarters), midterm/final grow up the right side
- [x] Forks replaced by a day dropdown + note + "add another day"; the rep can edit the schedule later
- [x] Weekly header: week button at left, upcoming strip beside it (dark nebula when something is coming); old top row and duplicate arrows removed; week-change zones live inside the weekly schedule
- [x] Add-item form defaults to the class's day and time and warns when there is no class that day
- [x] Pop animation (block rises out of the surface, grey to colour) on join and create
- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions

- Week block text is now engraved (dark cut, light lower lip), fitted to the block width and clipped so it cannot run outside (Thermodynamics overflowed); the dark name plate was removed; the quiz, midterm or other name is engraved into the carved piece — learner feedback.
- Bug found at the final review: the carved piece (e.g. a yellow quiz on a blue block) had no raised bottom edge. It now has its own side face, so the block and the piece both stand up. Week blocks also got lit top/left edges and a darker name plate along the top — learner request.
- Fifth feedback round (from the learner's chiselled-stone reference): the front element is a light stone slab with a chipped outline, and the background is a mosaic of chipped stone slabs that still slide in chains; the insides of the daily and weekly schedules are plain and untextured; the week-change zones are now a clean emerald fade with one arrow (the cloud looked odd). The honed rim stays clean, not rough.
- Fourth feedback round: the rim is now rough, lit stone (relief lit from the top left); the background is plain concrete in shades; lighting reworked to one soft light from the top left (raised edges lit, soft deep shadows to the bottom right, recessed surfaces reversed, faint window-light bands); buttons, tabs and inputs are smooth with no texture; the cosmic nebula is now deep emerald and teal, with emerald as the accent colour for buttons and highlights — learner feedback and reference image (used for lighting only).
- Third feedback round: the background blocks are now real stone (granite, slate, basalt, marble textures that move with each block), and the main surfaces, cards, tabs, dialogs and inputs use stone textures kept dark for readability — the learner wanted a stone background and more visible stone.
- Second feedback round: the carve now also cuts through the raised side face of week blocks; the upcoming strip shows every item and scrolls sideways (mouse wheel or scrollbar); a low raised stone ridge separates the daily and weekly schedules; the floor is crisp with soft light rays behind the schedule (no soft lighting on it); the background is columns of connected grey blocks that slide in chains (a block leaving one end re-enters at the other, so nothing overlaps) and slow right down once you have classes; the nebula colours are back on the upcoming strip and the week-change zones.
- Carve model replaced (learner decision at the final review): it now fills the class block from the bottom-right corner, bottom-right quarter first, then up the right side (midterm and final) or along the bottom (some quizzes); a squarish shape with softened corners. The item's start time no longer positions the carve, so `prd.md` acceptance "a quiz at 9 a.m. has its carve top at the 9 a.m. line" is superseded; midterm 1/3, final 1/2 and the 20-50% slider are unchanged.
- Forks (lecture/practical shades) dropped; a class is now a list of weekly sessions (day, start, end, optional note) with an add-another-day control and a later schedule editor — learner request. Data model: `sessions` replaces `forks` (old saved classes are still read).
- Look rebuilt: matte grey, marble rim raised around a recessed floor, sharper corners, thin letter-spaced type, gem-tone class colours from the learner's "luxury colour" reference, varied-size grid background. Whole-panel tilt was tried and removed on request.
- Upcoming row and the duplicate week arrows removed; week button and upcoming strip now sit at the top of the weekly schedule; week-change zones are inside the weekly schedule.
- Carve shape changed from an organic blob to a full-width rounded-rectangular pocket with slightly fluid corners; class names now draw above carves — learner feedback at the first hands-on check: the blob floated in the middle and covered the course title.
- Importance slider small-end label is now just "Assignment"; the add-item button reads "Apply" — learner feedback (the longer phrase was a private joke, not for the product).
- Material direction added to the look: granite, metal and glass-like smoothness, clean and professional — to be applied in the final polish slice.
- Class name and code inputs are centred — learner request.
- Double-clicking `index.html` opened a non-browser viewer for the learner (white page, no scripts); it works when opened in Chrome. Added README guidance and `open-demo.bat` (two Chrome windows) — discovered at the first hands-on check; no change to app code.
