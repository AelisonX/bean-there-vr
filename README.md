# Bean There VR v0.2

A very normal job. Now in three dimensions.

Three.js + TypeScript + Vite. Separate repository: https://github.com/AelisonX/bean-there-vr. Website: https://aelisonx.github.io/bean-there-vr/. Original game untouched. v0.2 is published with user approval; the live desktop browser playtest passed. Physical Quest testing of this update remains pending.

## Play

```sh
npm ci
npm run dev
```

Requires Node 22.12+ (tested on 24). Open the localhost address printed by Vite. For Quest, use the HTTPS website in Meta Quest Browser and select Enter VR.

Desktop: click a bean, move over the white bin and click to drop. R restarts the selected mode; P / Escape pauses. Select Start shift for 90 seconds or Endless shift for unlimited duration until five mistakes. Station-height slider adjusts equipment before entering VR, for seated/standing play. Hidden tabs pause and require manual resume.

VR: reach with the gloves. Hold trigger or grip to grab an item within about 7.5 cm of the mesh. Release to throw/drop; if both buttons are held, release both. Catch airborne items with either hand for juggling. Move an open glove against items to push. Rays only activate the menu: left half starts timed, right half endless; during play it pauses/resumes. Produce cannot be grabbed at a distance. No artificial locomotion.

Leave good green beans on the belt. Brown, yellow, tightly curled, short/broken beans and occasional mice go in the white reject bin forward/right. Correct rejection +20, good downstream +2, wasted good bean −18, escaped defect −10, score floors at zero. Floor drops count as missed defects/wasted produce. Five mistakes fails either mode.

## Changes after first Quest feedback

- Bin moved forward, completely clear of belt/front rail.
- Simple gloves with palms, thumbs, fingers and cuffs from controller grip poses; fingers curl on pickup.
- Physical-range hold grabbing, throwing with recent hand velocity, airborne catching and open-hand pushing. Release speed capped at 6 m/s to suppress tracking spikes.
- Gravity, short substeps, belt landing and sliding/friction, fast bin-opening crossing detection. Releasing hand briefly ignores its own throw.
- More bean length, thickness, color and shape variation. Rare procedural mice: about 2.4–4.8% of new items, depending on defect frequency. Initial batch remains exactly 20 good and 5 defective beans.
- Belt gains 0.0015 m/s per correct reject, capped at 0.14 m/s from 0.065 m/s. Time/mistakes do not increase speed. Spawn frequency and defect probability still increase gently over time.
- Endless mode, with the same five-mistake failure rule.
- Quiet synthesized conveyor motor/roller audio, silenced by pause, hidden tabs and sound toggle.

## Validation and headset checks

```sh
npm test
npm run build
npm run dev -- --port 5174
node tests/browser.mjs
node tests/vr-interactions.mjs
```

Browser tests use Microsoft Edge. TEST_URL overrides the desktop test address. Synthetic VR tests require Vite so they can import the loaded game module and supply controller poses. They do not emulate a physical headset.

Ten rules/interaction tests cover scoring, failure, reset, pause, 20/5 mix, endless duration, capped success-based speed, throw velocity, swept contact and bin clearance. Browser checks cover rendering, movement, mouse sorting/scoring, pause/restart, remote-grab rejection, hold/release, throwing, opposite-hand catching, pushing, fast bin entry scoring once and endless simulation.

**v0.2 physical Quest controls, comfort and 72 FPS remain unverified.** The user tested v0.1 on Quest 3 and provided the feedback behind this release. Check glove alignment, nearby pickup, trigger/grip release, throwing/juggling, pushing, bin clearance, mode selection, restart while holding, pause, mute and session exit. Repeat on Quest 2 before claiming compatibility/performance.

## Limits and publishing

Lightweight interaction physics, not full rigid bodies: no bean-to-bean collision, solid bin-wall/environment collision or articulated finger contact. Gloves use a palm contact volume. No hand tracking; controllers required. Critters have simple procedural models and no AI. Downstream crate is visual and scored rather than a growing physical pile.

Shared bean geometry/materials, 60 active-item cap, no dynamic shadows, pixel ratio capped at 1.5. Vite emits its standard approximately 500 KB chunk-size warning.

Source on main; built files on gh-pages root, published after approval. Build with npm ci and npm run build; publish dist contents. Relative asset paths support /bean-there-vr/. Never modify original bean-there for this prototype.

Deferred: packing with green receiving crate below belt end, uninterrupted crate swaps, scale on left, 15 kg target, outgoing belt behind player and overflow failure. Premium export uses white polystyrene boxes and parallel top-layer alignment. Packing, weighing and supervisor AI remain future milestones.

