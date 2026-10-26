# Agi — a little care companion

A tiny browser based desktop companion for anyone who wants a gentle, low-pressure interaction. Agi is a magnolia sitting on a branch. Give it water or sunlight and its happiness, expression, and feedback change in response.

## The interaction

Drag the **Water** droplet or **Give sunlight** onto Agi's garden scene to care for her; water makes it rain, while sunlight brightens the garden. You can also activate either control directly. Water gives up to 18 happiness points and sunlight gives 13. The bar, character state, and message update immediately. Happiness fades by 5 points per hour. The garden clock can be paused in the ☼ settings button and resumed later. The app remembers the mood and time in this browser, even after closing and reopening the page. **Start over** opens a confirmation before resetting.

This is a local, single-browser experience. Water and sunlight are intentionally different choices in both their amount and visual reaction. Happiness is capped at 100% and never falls below 0%.

## Run locally

No package installation is required. From this folder, start Python's built-in static server:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000> in a browser. Stop the server with `Ctrl+C` in its terminal. If `python` is not recognized, use `py -m http.server 8000` on Windows.

Opening `index.html` directly can also work, but a local server provides consistent browser storage behavior.

## Screenshot

**Before submission:** capture the running app and save the image as `screenshots/agi-preview.png`. The source repository currently does not include a screenshot.

## Files

- `index.html` — app markup and original inline SVG character
- `styles.css` — visual design, responsive layout, and reduced-motion support
- `sunlight.css` — sunlight drag control styling
- `app.js` — care actions, mood feedback, hourly decay, pause/resume, reset, and local persistence
- `PROCESS.md` — process notes and a user-trial record to complete

## Limitations

- The 5% hourly decay is based on the device clock. A substantially incorrect system clock can affect elapsed-time calculation.
- Progress is saved only in the same browser profile and device. Clearing browser data removes it.
- If browser storage is blocked or unavailable, the app stays usable during the open session and tells you that progress may not be saved.
- The flower illustration is intentionally simple and decorative; its visual states are expressed with a few expression and animation changes.

## Credits

All app code, copy, styling, and the magnolia SVG artwork were created for this project with assistance from OpenAI Codex. No external images, code libraries, fonts, data, APIs, or services are used.
