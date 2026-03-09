# Neon Courier Prototype

A lightweight browser prototype for the `Neon Courier` game idea.

## Run
- Run on GitHub Pages: [Play Neon Courier](https://boxboy2204.github.io/neon-courier-prototype/)
- Run locally: open `/Users/Joseph/Code/Games/Neon Courier Prototype/index.html` in a browser.

## Current loop
1. Pick one of 3 contracts.
2. Ride to the destination before the timer ends.
3. Avoid gang bikes, patrol zones, and flooded lanes.
4. Get paid based on delivery reward + package integrity.
5. Buy garage upgrades and run again.

## Implemented systems
- District modifiers (flood, gang pressure, patrol pressure)
- Package traits (fragile, perishable, illegal, decoy)
- Dynamic hazards and time pressure
- Persistent meta between runs (credits, rep, heat, upgrades)
- Route preview minimap before contract acceptance
- Waypoint route planning (click minimap to place up to 3 waypoints)
- Route choices now modify run hazard pressure (gang/patrol/flood, plus police on illegal jobs)
- In-run planned corridor + waypoint markers so your chosen route is visible while driving
- Police chase behavior during illegal deliveries
- Basic procedural audio (SFX + run music pulse) with mute toggle
- Screen shake and hit flash feedback on impacts
- Enhanced gameplay visuals (layered road surface, city backdrop, beacon glow, bike-style vehicles, flood ripple effects)
- District-driven weather during runs (rain/fog/storm), with visibility reduction and traction/handling effects
- Contract cards now show a district weather forecast (label + expected visibility/traction)
- Fog can deploy dense moving occlusion clouds that hide parts of the street and potential threats
- Rain now applies a slight top-speed reduction rather than a heavy slowdown
- Bike garage customization with purchasable cosmetics (big wheels, flames, streamers, basket, neon frame)
- Equipped bike cosmetics persist and render during gameplay
- Added five motion trail cosmetics that emit from the rear while riding (afterburn, smoke, sparks, cash, stars)
- Campaign loop: 5 successful deliveries unlock a boss delivery contract
- Bike damage now affects handling and top speed during runs
- Chain failures now reduce progress by 2 (instead of full reset) for smoother pacing
- Handling now scales by current integrity relative to max run integrity
- Bike condition now persists across a chain of deliveries and carries into the next run
- Entering flooded lanes can trigger brief spinouts/loss of control
- Flood spinouts now include visible bike rotation/spin animation
- Route checkpoint hits now award +50 credits each
