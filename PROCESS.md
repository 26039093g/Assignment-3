# Process notes

## Starting idea

A "check-in" browser game that allows the players to take a break alongside a magnolia flower, named Agi. While watering Agi and giving them sunlight, the player can watch them grow, in both hapiness with a kind smile on their face.  

## Design and implementation decisions

- Kept the project dependency-free with plain HTML, CSS, JavaScript, and inline SVG so it runs from a local static server.
- Made water and sunlight distinct: water restores 18 points and triggers falling droplets; sunlight restores 13 and lights up the flower's rays. This makes the choice consequential and the immediate feedback legible.
- Added a happiness meter, contextual mood and care hint, and a live message that says how the action changed the meter.
- Added browser persistence, elapsed-time decay, pause/resume, reset confirmation, bounds checking, and fallback messaging for unusable browser storage.
- Added keyboard-visible focus styles, accessible button labels and a progressbar, plus reduced-motion support.
- The experience uses a gentle five-point decay every two minutes and direct care controls rather than punishment or a failure state. The flower remains available at zero happiness.

## AI tools

OpenAI Codex helped draft the project structure, original SVG character, interface, and interaction logic. The documentation was editded partly by AI, but was created and then edited again by me. The two-minute decay, local save, and pause/resume make a short-lived companion feel continuous while letting the player step away. I changed the first draft's undifferentiated care response into two distinct choices: water restores 18 points with droplets, while sunlight restores 13 with animated rays. I also made reset ask for confirmation so one click cannot erase the saved mood. No external AI services or runtime models are used by the app.

## User trial and iteration

- What the person tried first:

They tried a version where it was just the full flower that needed to be watered and given sunlight. Having just the simple interaction between player and magnolia flower.
  
- Where they hesitated or what they asked:

While the instructions and task were very simple, they wished for more visual feedback that the plant's happiness was growing. Such as having the three stages of growth then added to the game after their feedback.
 
- Whether the response made sense to them:

Everything was understandable and digestable for the player. All that truly concerned them was the lack of visualization of the change the flower went through as they watered it and gave it sunlight. 

- One improvement made from the observation, or why the design was kept:

I included an addition of 2 more forms of growth. Allowing the player to see their actual affect on Agi and the happiness they bring to them. After these changes were made and given back to the tester, they repoeted back a more positive response. 

## Credits

Original code, writing, styling, and SVG artwork were created for this assignment with OpenAI Codex assistance. No borrowed code, media, datasets, or external libraries are included.
