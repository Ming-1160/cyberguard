# CyberGuard — 惡意軟件任務 / Malware Mission

A bilingual (English / 繁體中文) classroom web app for the S4 ICT lesson
**Network Security Risks: Malware** (70 minutes, 32 students, one tablet each).

> Sections below "Version 3" describe earlier versions of the site. Where they differ from
> the Version 4 notes, the Version 4 notes are the current ones.

It is the educational digital tool and the digital student worksheet described in
`INT2065_Malware_Website_Outline.docx` — the same six picture items, the same four
Checkpoint questions, the same four case files, and a printed fallback generated
from the same content.

No framework, no build step, no libraries, no network requests.


## Live site

https://ming-1160.github.io/cyberguard/

GitHub Pages publishes the site from the `gh-pages` branch. `main` holds the same
files. To update the site, push the same commit to both branches:

```bash
git push origin main main:gh-pages
```


## Version 4 (11 Nov 2026) — what changed

The lesson now uses three tools, each for one job:

| Tool | Who uses it | What it is for |
|---|---|---|
| Teaching slides | Teacher, on the projector | Hook, six types, Table 5.1, four routes, the four cases |
| **This website** | Each student, on a tablet | **Tests only** |
| Worksheet | Groups, on paper | Case study and peer check |

So the student side of the site is now short and runs in one fixed order:

1. **Part 1 · Quiz** — 10 questions. Every question has an animated picture.
2. **Part 2 · Match the routes** — 4 pictures. Checked once, then locked.
3. **Part 3 · Exit question** — one new case (Tina, from the class worksheet). Two types of
   malware fit, so both are accepted. The route is marked too. The two written answers are
   for the teacher.
4. **My results** — one card with the three scores and the two written answers. The student
   types a class number, takes a screenshot and posts it on the class Padlet. The homework
   (the group's own sheet, 18 marks) is shown under the card.

**Simple on purpose**
- The start page is one list of the four parts and one button.
- Every part begins with "what to do" in three short steps.
- A part opens only when the part before it is finished. A locked part shows a padlock.
  Typing a locked address sends the student back to the part they are on.
- No minutes are shown on student pages.
- The wording is for one tablet per student ("Submit", not "We agree").
- In the quiz, the clues are one tidy list (a to g) instead of loose chips.
- While a question is on screen its picture is not redrawn, so the animation does not start
  again at every tap.

**Teacher code**
- Entering the teacher code opens every part on that device, and keeps it open after a
  reload. Tap *Lock* before a student uses the device.
- The earlier teaching pages (Hook, Six types, Case files) and the print pack are still in
  the site, but only open with the teacher code. They are linked from the teacher area.
- The teacher area has the answer keys for all three parts.

**Files** — there are now five files to deploy: `index.html`, `style.css`, `data.js`,
`scenes.js` (new: the ten quiz pictures) and `app.js`.

**Checked / not checked**
- Checked in Chromium: the whole flow, the locks, the scores, reload in the middle of each
  part, the teacher code, *Clear all data*, English and Chinese, landscape and portrait.
- Not checked on a real iPad (Safari).


## Version 3 (11 Nov 2026) — what changed

Only the Routes page (the matching activity) changed. `data.js` and `index.html` are
the same files as version 2; `app.js` and `style.css` are the two files to redeploy.

**Animated evidence on the four matching cards**
- Each evidence card now opens with a short animated scene (an 8-second loop) instead of
  a small icon:
  1. Pop-up — a person watches a film on a computer, the view zooms in to the screen,
     and a warning window pops up ("WARNING! … Click here to fix it").
  2. Email — a message titled ILOVEYOU arrives, it is opened, and the attachment
     LOVE-LETTER-FOR-YOU.TXT.vbs appears (the case on textbook p. 60).
  3. Free app — a photo filter from "free-apps.example" (unknown publisher) is installed
     on a phone.
  4. USB — a flash drive is picked up from the corridor floor and plugged into a laptop.
- The scenes are drawn as SVG and animated with CSS: no video files, no images, no
  libraries and no network requests. They stay sharp at any size and follow the EN / 繁 switch.
- A scene shows the evidence only. It never shows or hints at the route (the answer).
- With *About → Reduce motion*, `?static=1`, or the device's own reduce-motion setting,
  each scene rests on its last frame, so the picture still makes sense.
- Screen readers get a one-sentence description of each scene.

**Fixes on the same page**
- "Check the matches" no longer breaks the page when an item is unanswered. In version 2
  this raised a script error and the whole page was replaced by one line starting
  "ERROR:". An unanswered card now says "Choose a route first."
- Choosing a route updates the card in place instead of redrawing the page, so the scenes
  keep playing and keyboard focus stays on the button.
- The Routes answers are now kept after a page reload, like the other stages.

**Checked / not checked**
- Checked in Chromium at desktop and iPad-sized windows, in English and Chinese, with
  motion on and off.
- Not checked on a real iPad (Safari). Open the Routes page on one iPad before the lesson.


## Version 2 (6 Nov 2026) — what changed

**Look and feel — "cyber mission" theme**
- Dark navy background with a cyan glow, large text and big touch targets.
- Each malware type keeps one colour and one icon everywhere: Ransomware red (padlock),
  Spyware purple (eye), Virus green (virus), Adware orange ("AD"), Trojan program
  yellow (horse), Worm blue (worm). The quiz pictures and case files stay neutral on
  purpose — a coloured picture would give the answer away.
- A mission bar on every lesson page shows the six stages, the minutes and progress.
- Quiz: progress bar, star counter, stars burst on a correct answer, the card shakes on
  a wrong one, an end screen with stars and a rank.
- Printing still produces black-on-white sheets.

**The hook follows the lesson plan**
- Wording: "WARNING! Your computer may be infected. Click here to fix it."
- No countdown, and the pop-up appears on the Hook page only (not on the landing page).

**Content now follows the textbook (Compulsory C2, 5.1, pp. 58–67)**
- Table 5.1: "Attached to other programs" is ✓ virus, ✗ worm, ✓ Trojan program
  (version 1 had a tick for worms). The extra row "Disguises itself as useful" was
  removed because it is not in Table 5.1.
- Trojan program: "pretends to be a useful application" (it is not actually useful).
- Routes use the textbook headings: Dynamic web page and client-side script /
  Communication software and email / Freeware and shareware / Various storage devices.
- Threats after an infection follow p. 67.
- Chinese terms follow the Chinese edition: 電腦病毒, 手稿程式, 各種儲存設備,
  免費軟件及共享軟件, USB 快閃記憶體, 遠程控制.
- Small fixes: Case 1 Chinese pronoun (他), Case 2 harm wording, the word bank shows
  English and Chinese together, the quiz end screen now points to Routes (the next stage).

---

## Run it

**Simplest:** open `index.html` in a browser. Everything works from `file://`
except nothing — there are no modules and no fetch calls, so it runs as-is.

**For a class (recommended):** serve the folder over HTTP so every tablet gets the
same origin and the browser cache behaves.

```bash
cd cyberguard
python3 -m http.server 8000
# open http://<your-laptop-ip>:8000 on the tablets
```

Deploy by copying the five files to any static host (GitHub Pages, Netlify,
university web space). There is nothing to compile.

---

## Routes

| Hash | Page | Lesson minute |
|---|---|---|
| `#/` | Mission briefing: the six types (one colour + icon each), mission map | — |
| `#/hook` | Simulated "WARNING! Your computer may be infected" pop-up, pair vote, reveal | 0–5 and 63–65 |
| `#/learn` | Six types of malware + Table 5.1 (textbook p. 62) | 5–19 |
| `#/quiz` | 6 picture items + 4 Checkpoint questions, progress bar and stars | 19–31 |
| `#/routes` | Four routes (textbook headings, pp. 66–67), evidence matching, threats (p. 67) | 31–41 |
| `#/cases` | Four case files + digital worksheet | 41–63 |
| `#/exit` | Three-part exit slip, anonymous | 63–70 |
| `#/homework` | Q3 (p. 118) and Q9(a) (p. 119) scaffolds | after class |
| `#/teacher` | Answer keys, class summary, print pack | — |
| `#/print` | The printed fallback pack | — |
| `#/about` | Ethics, privacy, accessibility, credits | — |

## URL flags

| Flag | Effect |
|---|---|
| `?lang=zh` | Start in 繁體中文 (also `?lang=en`) |
| `?static=1` | No animation — used for screenshots and for very old devices |

`?nopopup=1` from version 1 is no longer needed (the landing page has no pop-up) and is
simply ignored. The language choice is remembered in the browser; the toggle is in the top bar.

---

## The alert on the Hook page

`#/hook` shows a fake browser window with one scareware pop-up, worded exactly as in
the lesson plan (step 1):

> **WARNING!** Your computer may be infected. **Click here to fix it.**

- **Only on the Hook page.** The landing page no longer opens the pop-up by itself,
  so the teacher decides when the class sees it.
- **No countdown.** The teacher sets the pace of the vote, not a timer.
- **The brand is invented** and the address uses the reserved `.example` domain.
- **A small `SIMULATION` chip** sits in the red title bar. The reveal can ask the class
  *how many of you noticed it?*
- Clicking **Click here to fix it** records the vote and opens a short explanation: on a
  real page, that link could take you to a malicious web page that downloads malware —
  the "fix" is the infection. The × (or Esc) counts as "close and ignore".

The same card is voted on twice: before the lesson, and again at 63–65 min.

## Before the lesson

1. **Change the teacher PIN.** In `app.js` look for `pin === '2065'` and edit both
   the value and the hint on the lock screen.
2. **Checkpoint wording is paraphrased on purpose.** The four Checkpoint items in
   `data.js` follow Checkpoint 5.1 (p. 63) and 5.2 (p. 66) with the same answer keys
   (A, C, D, C), but the option wording is our own, so the textbook text is not copied
   onto a website. Students can check the original wording in their own books.
3. **Plan the two votes.** `#/hook` runs twice: before the lesson (0–5 min) and again at
   the end (63–65 min) — switch rounds with the two buttons on the page. Count hands, then
   enter the totals in *Teacher area → Hook poll totals* so every tablet shows the same
   before/after comparison. The comparison only appears once those totals are saved.
4. **Print the fallback.** Teacher area → *Open the print pack* → print. Put it in
   folder A. If the tablets fail, the lesson continues on paper with the same six
   items and the same four cases.
5. **Test on the real tablets**, in landscape, on the school network.
6. **Clear old answers.** On any tablet that opened the site before, use Teacher area →
   *Clear all data on this device*. From version 3 the Routes answers are kept after a
   reload, so answers from an earlier test would still be selected.

---

## What to edit, and where

| You want to change | File |
|---|---|
| Any question, case, clue, option or definition | `data.js` |
| Colours, type, spacing, layout | `style.css` (`:root` holds the palette) |
| The colour and icon of each malware type | `app.js` (`TYPE_COLOR`, `ICON`) |
| Behaviour, routing, scoring | `app.js` |
| Page shell, nav, meta tags | `index.html` |

Every user-facing string in `data.js` is a pair: `[English, 繁體中文]`. Add a string
to both or the Chinese mode will show `undefined`.

The six illustrations are inline SVG strings in `app.js` (`ART`). They are drawings
of the real categories — no screenshot of actual malware is used anywhere.

---

## How the assessment works

- **Picture items:** the pair chooses a type *and* the clue that justified it.
  Both must be right for the mark — this is what stops the quiz rewarding label
  recall. One retry per item, then the answer is revealed (right answer in green,
  wrong pick in red). For A3 (virus) and A5 (Trojan program) the clue
  "It is attached to other programs" is also accepted, because Table 5.1 marks both
  viruses and Trojan programs that way.
- **Stars:** every correct item earns a star; the bar at the top shows progress through
  the ten items. The end screen shows the stars, the score and a rank.
- **Checkpoint items:** A–D, one attempt, explanation always shown afterwards.
- **Score:** out of 10, stored per device.
- **Cases:** not auto-marked. The worksheet captures type, evidence, route, two
  harms and a "because" sentence for each; the teacher compares against the answer
  key and gives the feedback. A machine cannot mark a reasoning chain.
- **Hook:** the pair votes once per round on `#/hook`. Clicking **Click here to fix it**
  records the vote and does nothing else — which is itself the teaching point.
  Esc or the × counts as "close and ignore". Nothing is sent anywhere.
- **Exit slip:** anonymous, group number only, 3-minute timer.

---

## Data and privacy

- No names, e-mails or student identifiers are collected anywhere.
- No server, no account, no analytics, no third-party requests.
- Everything is stored in `localStorage` on the device that entered it, under the
  key `cyberguard.v1`.
- *Teacher area → Clear all data on this device* wipes it in one click.
- Because there is no backend, the class total (most-missed item) is typed in by the
  teacher rather than aggregated automatically.

## Accessibility

- Contrast meets WCAG 2.1 AA.
- Every illustration has a text alternative describing what it shows; the scroll
  headlines keep a hidden plain-text copy for screen readers.
- All controls are keyboard reachable with a visible focus ring.
- *About → Reduce motion* stops the background animation and shows every reveal at
  once. `prefers-reduced-motion` is respected automatically.
- The animated scenes on the Routes page each carry a one-sentence description, and stop
  on their last frame when motion is reduced.
- If JavaScript fails, a message asks the reader to use the printed pack instead of
  showing a blank page.

---

## Known limitations

1. Checkpoint options are paraphrased, not the textbook's exact words (see *Before the lesson*).
2. No cross-device sync — 16 tablets hold 16 separate sets of answers. That is
   deliberate: merging them would require a server and student identifiers.
3. The landing page's scroll scenes (statement reveal, mission map panel) are decorative;
   every teaching function lives on the six stage pages and works without them.
4. The dark theme is designed for large text and high contrast, but a very bright
   classroom can still wash out a projector. Close the blinds near the screen, and
   test the projector before the lesson.
5. `file://` works, but Chrome blocks nothing and Safari on iPad prefers a served
   URL — use the HTTP server for class.

---

## File map

```
cyberguard/
├── index.html    shell, nav, canvas, error fallback
├── style.css     dark "cyber mission" theme: tokens, buttons, mission bar,
│                 type colours, all views, print rules (black on white), responsive
├── data.js       the content bank — items, cases, clues, answer keys
└── app.js        type colours + icons, router, glow renderer, letter reveal,
                  quiz engine (stars, progress bar), worksheet, teacher area, print pack
```
