# Process notes

## Starting idea

A small desktop-style care window for someone who wants a gentle check-in. A little magnolia named Agi sits on a branch. The player chooses water or sunlight; Agi's happiness and expression respond, and the bar slowly drops by five points each hour to give care a reason to happen over time.

## Design and implementation decisions

- Kept the project dependency-free with plain HTML, CSS, JavaScript, and inline SVG so it runs from a local static server.
- Made water and sunlight distinct: water restores 18 points and triggers falling droplets; sunlight restores 13 and lights up the flower's rays. This makes the choice consequential and the immediate feedback legible.
- Added a happiness meter, contextual mood and care hint, and a live message that says how the action changed the meter.
- Added browser persistence, elapsed-time decay, pause/resume, reset confirmation, bounds checking, and fallback messaging for unusable browser storage.
- Added keyboard-visible focus styles, accessible button labels and a progressbar, plus reduced-motion support.
- The experience uses a moderate hourly decay and direct care buttons rather than punishment or a failure state. The flower remains available at zero happiness.

## AI tools

OpenAI Codex helped draft the project structure, original SVG character, interface, interaction logic, and documentation. I kept the proposed hourly decay, local save, and pause/resume because they make a short-lived companion feel continuous while letting the player step away. I changed the first draft's undifferentiated care response into two distinct choices: water restores 18 points with droplets, while sunlight restores 13 with animated rays. I also made reset ask for confirmation so one click cannot erase the saved mood. No external AI services or runtime models are used by the app.

## User trial and iteration

**Complete this section after a real person tries the experience, before submitting the assignment. Do not identify the person.**

- What the person tried first:
- Where they hesitated or what they asked:
- Whether the response made sense to them:
- One improvement made from the observation, or why the design was kept:

## Credits

Original code, writing, styling, and SVG artwork were created for this assignment with OpenAI Codex assistance. No borrowed code, media, datasets, or external libraries are included.
