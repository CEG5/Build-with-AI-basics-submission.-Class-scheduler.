# Class Blocks

A class scheduler where a class rep creates a class block with a code, classmates join with that code, and every quiz, midterm or final the rep adds is carved out of the block for everyone.

No install, no accounts, no server. Plain HTML, CSS and JavaScript.

## Run it

Open `index.html` **in Chrome** (right-click the file, Open with, Chrome; double-clicking may open another program). Or double-click `open-demo.bat` to open two Chrome windows at once.

To demo the sharing on one computer:

1. Open two separate Chrome windows of `index.html` (Ctrl+N for a new window; don't duplicate the tab) and place them side by side.
2. Left window (rep): press **+**, **Create a class**, note the code. Click the class pill at the bottom left to add a quiz, midterm, final or other.
3. Right window (student): press **+**, **Join a class**, enter the code. Items the rep adds appear on the student's schedule within a second.

Each window remembers its own classes (and whether it is the rep or a student) until the window is closed. The classes themselves are kept in the browser's local storage.

If the second window doesn't update live when opened as a file, run any static server in this folder and open `http://localhost:PORT` in both windows, for example `npx http-server -p 8000`.

`test/carve-test.html` shows the carve engine against its target areas (1/3, 1/2 and the quiz slider range).
