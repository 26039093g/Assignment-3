# Agi — a little care companion

A tiny browser based desktop companion for anyone who wants a gentle low-pressure interaction that helps remind subtely to take a break from the menial desk work. Agi is a magnolia sitting on a branch, only a simple bud who needs to be nurtured to fufill her needs. Give Agi water or sunlight and their happiness, expression, and feedback will change in response.

## Live site

Just open the link below.

<https://26039093g.github.io/Assignment-3/>

## The interaction

Drag the **Water** droplet or **Sunlight** onto Agi's garden scene to care for them; water makes it rain, while sunlight brightens the garden. You can also activate either control directly. Water gives up to 18 happiness points and sunlight gives 13. The bar, character state, and message update immediately. Happiness fades by 5 points every 2 minutes, but while the app is open and the page is active, Agi gains 1% happiness every 10 seconds as a gentle reminder that the player is still present. The garden clock can be paused in the ☼ settings button and resumed later. The app remembers the mood and time in this browser, even after closing and reopening the page. **Start over** opens a confirmation before resetting, making sure that the player wants to reset Agi's stages instead of commiting a mistake.This is a local, single-browser experience. Water and sunlight are intentionally different choices in both their amount and visual reaction. Happiness is capped at 100% and never falls below 0%. Water and sunlight are also limited to two acts in any 30-second window, keeping Agi's growth gentle and steady.

## Run locally

No package installation is required. From this folder, start Python's built-in static server:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000> in a browser. Stop the server with `Ctrl+C` in its terminal. If `python` is not recognized, use `py -m http.server 8000` on Windows.

Opening `index.html` directly can also work, but a local server provides consistent browser storage behavior.

## Screenshot

<img width="500" height="600" alt="Screenshot 2026-10-31 201042" src="https://github.com/user-attachments/assets/7fdb30b8-5648-47a5-9ef1-b19fe531c0a4" />

## Limitations

- The 5-point decay every two minutes is based on the device clock. A substantially incorrect system clock can affect elapsed-time calculation.
- Progress is saved only in the same browser profile and device. Clearing browser data removes it.
- If browser storage is blocked or unavailable, the app stays usable during the open session and tells you that progress may not be saved.
- The flower illustration is intentionally simple and decorative; its visual states are expressed with a few expression and animation changes.

## Credits

All app code, copy, styling, and the magnolia SVG artwork were created for this project with assistance from OpenAI Codex. ReadMe and Process were written by author. No external images, code libraries, fonts, data, APIs, or services are used.
