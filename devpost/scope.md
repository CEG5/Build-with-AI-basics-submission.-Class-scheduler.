---
doc: scope
status: approved
---

# Class Blocks (working title)

A local class-scheduler website where a class rep makes a class "card" with a code, classmates join with that code and the block lands in their own schedule, and when the rep adds a quiz it is visibly carved out of the class block.

## The Unique Kernel
Shared, rep-owned class cards instead of everyone typing in their own schedule. You "collect" each class from its rep with a code, and when the rep adds a quiz or exam it is **carved into the class block**: the type sets the colour, and the importance sets how deep the carve is. You can see at a glance what is coming and how big it is.

## Who It's For
A university student in Saudi Arabia (the number of classes varies; the learner's own semester has six), and the class rep for each of those classes. Today the class group on WhatsApp is where quizzes and assignments get announced. The messages get buried or the group gets muted, and students miss things. Existing scheduler apps are often paid, got worse after recent updates, are a hurdle to use (login), and are individual: every student has to remember to type in every quiz themselves.

## The Core Loop
1. The rep creates a class: name, days, start and end time, and optional forks (for example a lecture and a practical, each with its own days and times). The rep gets a code.
2. A student taps the plus button, picks "join a class", and enters the code. An animation plays, a card appears in their daily view, and the block appears in their weekly view.
3. The rep clicks a week on the class block, chooses the type (midterm, final, quiz, special, other), fills in the details and the importance, and confirms. A piece is carved out of the block and its colour changes.
4. The student's week and day views show the carved block.

They come back because the schedule is the one place that shows what is due and when, without digging through chat.

## Inspiration & Identity
Interlocking, rounded building blocks, like Lego studs or puzzle pieces. A bold, colourful, tactile feel. Reference images are in the learner's moodboard file `C:\Users\MOHHAMMD\Desktop\M3 EVD\Untitled-2026-09-08-2058.svg` (Excalidraw board with 6 embedded images):
- BlockRun case study: bright lime, mint, pink and blue blocks with small connector tabs.
- A teal neumorphic "interlocking panels" web layout.
- A soft gradient block poster with overlapping rounded shapes.
- A dark timeline app with rounded vertical pill blocks on a weekly grid.
- A "current plan" screen with rounded, notched, interlocking coloured blocks.
- A dark task-card app with stacked coloured cards.

Layout in the learner's head: week schedule on the right as a block diagram, daily schedule on the left as cards that follow the same carving, and a plus button at the bottom with "join a class" and "create a class".

## Why This Matters to the Learner
The learner has forgotten assignments and has seen classmates miss quizzes because the WhatsApp group got buried. They researched the market and found nothing that solves the "everyone enters their own schedule" problem. This is also the learner's Meta Minds hackathon requirement.

## What "Working" Looks Like
A one-minute demo video of a website running locally, shown with two browser windows side by side (a class rep site and a student site) so the sharing is visible on one computer: the week and day views open, the student joins a class by code (animation plays and the block appears), the rep creates a class with forks, then the rep adds a quiz and the block visibly carves and changes colour in both the week and day views. The "oh, that's cool" beat is the carve and the animation when a code is entered.

## The POC Boundary
- A week view (block diagram) and a day view (cards), side by side.
- A plus button with "join a class" (enter code) and "create a class" (name, days, times, forks for lecture/practical).
- Joining a class by code puts it into the schedule, with an animation.
- The rep can add an item to a week of a class (midterm, final, quiz, special, other) with details and an importance level that sets the carve depth, and the block's colour changes.
- A local website, no login. The device remembers which classes you created (author) and which you joined (attendee), and only authors see the edit controls.

## Later
Nothing is planned. The learner decided the proof of concept is enough.

## Explicitly Cut
- **Real sharing between devices** (a rep's change reaching other people's phones): the learner treats this as beyond a working prototype for a video. For the demo, two local browser windows (a student site and a class rep site) show the sharing on one computer.
- **Proving who the real class rep is**: same reason. For now the device's "author" note is the only check.
- **A phone app**: a local website is enough for the demo.
- **Login and accounts**: the whole point is that there is no sign-in hurdle.
- **Anything beyond schedule and quizzes**, such as chat, grades, or assignments tracking: this stays a class scheduler only.
