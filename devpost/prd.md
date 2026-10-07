---
doc: prd
status: approved
---

# Class Blocks (working title) — Product Requirements

A local class-scheduler website where a class rep creates a class block with a code, classmates join with that code, and when the rep adds a quiz, midterm, final or other item it is visibly carved out of the class block. For university students and their class reps.
Source: `scope.md > The Core Loop`, `scope.md > The Unique Kernel`, `scope.md > The POC Boundary`.

## The Core Journey
1. **Arrival.** A student opens the website for the first time. The app floats in the middle of the screen over a living background of drifting blocks. The daily schedule is on the left and the weekly schedule on the right, both empty. The week indicator reads "Set the week."
2. **Joining.** The student taps the plus button at the bottom and picks "join a class". They enter a code. An animation plays, a card appears in the daily schedule, and the block appears in the weekly schedule. The block pops, morphing from muted to bright with a soft nebula glow. The background relaxes into a calm, unified, interlocking grid.
3. **Creating (rep).** A rep taps the plus button, picks "create a class", fills in the form and gets a code.
4. **Carving (rep).** From the class panel, the rep adds an item (midterm, final, quiz or other) to any week. A shaped piece is carved out of the class block in the complementary colour, and it shows in both the weekly and daily views.
5. **Success.** In two browser windows side by side (a rep window and a student window), the student sees the carve appear on their schedule, in both the week and day views.

Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

## Screens and Layout
One screen, a floating main panel in the middle with background space around it.
- **Daily schedule (left):** cards that follow the same carving as the weekly view.
- **Weekly schedule (right):** a block diagram. Days run along the horizontal axis and time of day runs down the vertical axis (assumed 12 a.m. to midnight). Each class block is as tall as its duration.
- **Upcoming row (top):** a darker, cloudy strip listing future events with week, date and a small countdown, for example "Week 10, Oct 30, 29 days left".
- **Week indicator:** a small section showing the current week. It reads "Set the week" until the user sets it. A user sets their own week number.
- **Week navigation:** indicators to go to the next and previous week. A nebula-like cloud appears when the mouse nears the left or right edge.
- **Plus button (bottom):** opens "join a class" and "create a class".
- **Class panel:** per class, shown only to its author. It lets them add an item, delete an item and end the class.

## Look and Feel
- **Mood:** interlocking, rounded building blocks, bold and tactile, like Lego studs or puzzle pieces. Moodboard: `C:\Users\MOHHAMMD\Desktop\M3 EVD\Untitled-2026-09-08-2058.svg`.
- **Base palette:** the deep-green palette the learner likes (#051F20, #0B2B26, #163832, #235347, #8EB69B, #DAF1DE), with soft light and rounded pill shapes. Other reference palettes the learner shared: a purple-to-cream gradient and an orange-and-indigo gradient.
- **Class colours must pop against the greens** so the app looks different from other apps that use these greens.
- **Background:** starts as a living field of blocks shifting, rising and falling, like time passing in university (assignments appearing, midterms arriving and leaving). It relaxes into a unified interlocking grid once the student has classes.
- **Effects:** nebula or aurora-style glows around the active block and at the week-navigation edges.
- **Carve:** organic and nebula-like, not a straight cut, taking in corners.

## Features and Behavior

### Creating a class (rep)
Fields: class name (free text, so it can be whatever the rep remembers it by), days and times (free start and end, any duration), a colour from eight presets, and an optional fork option. A class repeats every week from creation until the rep ends it, so there's no start week.
- **Forks:** turning on lecture and practical expands the form. Each fork has its own days and times. The main name is copied, and the rep adds a short note to say which part it is.
- **Fork colours:** a class with forks uses one hue in different shades. The lecture runs dark to light and the practical runs light to dark.
- The rep gets a code.
- [ ] Acceptance: a class with 1h40, 2h40 and 60-minute times can be created.
- [ ] Acceptance: a class with forks shows two related, distinguishable blocks.

### Joining a class (student)
- A student enters a code. An animation plays, a card appears in the daily view, and the block appears in the weekly view.
- A student can recolour their own copy of a class. This doesn't change anyone else's colour.
- [ ] Acceptance: entering a valid code adds the class to the schedule with the animation.
- [ ] Acceptance: recolouring a class on one device doesn't change its colour on another.

### Adding an item (rep)
The rep opens the class panel and adds an item to any week without scrolling to it.
- **Type:** midterm, final, quiz or other.
- **Week, day and time:** separate controls, with faint horizontal guide lines on the grid pointing to the top of the carve.
- **Description:** for quizzes, with extra details such as the material covered.
- **Name:** for "other" only, the form expands to show a title field.
- **Importance slider:** for quiz and other only. It sets how deep the carve is, from about 20% to 50% of the block's area. The small end is labelled like an assignment ("not the end of the world, but can't be ignored"). A marker partway along shows where a typical midterm sits. The big end is labelled as important as a final. No percentages are shown.
- Midterm is fixed at one third and final is fixed at half. Neither has an importance slider.
- **No colour option.** Every carve uses the complement of the class colour the student sees.
- The carve works like a Boolean cut. If the time falls outside any class block, it carves its own area at that time.
- [ ] Acceptance: a quiz at 9 a.m. has its carve top at the 9 a.m. line.
- [ ] Acceptance: moving the slider smoothly changes the carve area.
- [ ] Acceptance: a midterm is always one third and a final always half.
- [ ] Acceptance: the carve shows in both week and day views, in a colour that contrasts with the class.

### Weeks and dates
- Each user sets their own current week number. Dates come from the device.
- The upcoming row shows future events with the date and a countdown.
- [ ] Acceptance: after setting week 6, an item in week 10 shows the right date and days remaining.

### Ending a class (rep)
- A red "end class" button in the class panel opens a pop-up: "This will delete it for everyone who has the code. Are you sure?"
- [ ] Acceptance: after confirming, the class disappears from every student window.

## States and Boundaries
- **First use:** background in full motion. The daily view shows a message that classes created or joined will be tracked here. The weekly view shows muted day blocks. The week indicator reads "Set the week."
- **Wrong code:** "Wrong code, please try a different one."
- **Already joined:** "You're already in this class."
- **Ended class:** disappears for everyone.
- **Who can edit:** the device remembers which classes you created (author) and which you joined (attendee). Only authors see the edit controls.
- **Week not set:** the upcoming row still works. It shows items by week number ("In week 11, you have a quiz") without dates or countdowns, until the user sets their week.

## Product Decisions
- Class repeats weekly with no start week — to keep it simple.
- Eight colour presets, with per-student recolouring — to avoid two reps picking the same colour while still letting students personalise.
- Effects and animations may be simplified first, then enriched later — a working product to show comes first.
- Carve colour is the complement of the class colour — the type is told apart by size, not colour.
- Carve depth 20–50%, with human labels instead of percentages — reps don't know ranges, and important events (like an expo) can be as big as a final.
- "Special" removed, "other" has a custom title.
- Per-user week setting — the university calendar talks in week numbers, not dates.
- Background relaxes into a grid once classes exist — so it doesn't distract.

## What We're Building
Priority order: the working product comes first (layout, flows, carve, colours, weeks). The animated background, nebula glows and join animation start simple and get richer afterwards, so there's always something to show for the program.

The one-screen floating layout, the week and day views, plus button, create and join flows with animation, forks, colours, the add-item form with the importance slider and organic carve, the upcoming row with countdowns, week navigation, the week indicator, ending a class, the author versus attendee distinction, and the animated background.

## Deferred From the POC
- **Real sharing between devices:** two local browser windows show the sharing on one computer.
- **Proving who the real class rep is:** the device's author note is the only check.

## Possible Later Enhancements
None planned.

## Non-Goals
- Login and accounts: the point is no sign-in hurdle.
- Phone app: a local website is enough.
- Chat, grades or assignment tracking: this stays a class scheduler only.

## Open Questions
- Exact eight preset colours. Can wait for `4-spec`.
- Whether the day axis runs from 12 a.m. to midnight. Can wait for the build.
