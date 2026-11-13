# Bean There VR v0.3

A very normal job. Now in three dimensions.

Three.js + TypeScript + Vite. Separate repository: https://github.com/AelisonX/bean-there-vr. Website: https://aelisonx.github.io/bean-there-vr/. Original game untouched. v0.3 is published with user approval. The live desktop browser playtest passed; physical Quest testing of v0.3 remains pending.

## Play

```sh
npm ci
npm run dev
```

Requires Node 22.12+ (tested on 24). Open the localhost address printed by Vite. For Quest, use the HTTPS website in Meta Quest Browser and select Enter VR.

Desktop: click a bean, move over the white bin and click to drop. R restarts the selected mode; P / Escape pauses. Select Start shift for 90 seconds or Endless shift for unlimited duration until five mistakes. Station-height slider adjusts equipment before entering VR, for seated/standing play. Hidden tabs pause and require manual resume.

VR: reach with the gloves. Hold trigger or grip to grab an item within about 7.5 cm of the mesh. Release to throw/drop; if both buttons are held, release both. Catch airborne items with either hand for juggling. Move an open glove against items to push. Rays only activate the menu: left half starts timed, right half endless; during play it pauses/resumes. Produce cannot be grabbed at a distance. No artificial locomotion.

Leave good green beans on the belt. Brown, yellow, tightly curled, short/broken beans and occasional mice go in the white reject bin forward/right. Correct rejection +20, good downstream +2, wasted good bean −18, escaped defect −10, score floors at zero. Floor drops count as missed defects/wasted produce. Five mistakes fails either mode.

## v0.3 changes

- Blue gloves with a handed grip-space orientation and downward finger curl. Palm contact follows the transformed glove, keeping visuals and picking aligned. Axes follow the [WebXR grip convention](https://www.w3.org/TR/webxr/#dom-xrinputsource-gripspace); physical headset alignment still needs confirmation.
- Beans are 28% smaller in all dimensions; mice keep their previous size.
- Endless has a five-minute time curve: 0.065 m/s initially, about 0.15 at 90 seconds, 0.31 at three minutes and 0.545 at five minutes, plus a success bonus capped at 0.06 m/s. Average human survival around five minutes is a playtest target, not an established result. Timed mode retains the gentle success-based ramp.
- Rare mice scurry slightly on the belt, kick their feet, squeak periodically and on pickup, and squeal on a velocity throw. These are synthesized cartoon voices. All character audio respects mute/pause/hidden-tab controls.
- Simple windows, pipes, shelves, crates and floor markings. Repeated background parts use instanced rendering. The opposite standing bay stays clear for future co-op, and the floating menu is beyond/above that bay. No networking or second player is implemented.
- Round bald supervisor with high-vis vest and clipboard. He approaches after mistakes or periodically, waves and grumbles unintelligibly, then retreats; losing triggers an angry emote and longer grumble. He stays beside the reserved partner bay. His animation pauses and resets with the shift.

## Retained from v0.2

- Bin moved forward, completely clear of belt/front rail.
- Simple gloves with palms, thumbs, fingers and cuffs from controller grip poses; fingers curl on pickup.
- Physical-range hold grabbing, throwing with recent hand velocity, airborne catching and open-hand pushing. Release speed capped at 6 m/s to suppress tracking spikes.
- Gravity, short substeps, belt landing and sliding/friction, fast bin-opening crossing detection. Releasing hand briefly ignores its own throw.
- More bean length, thickness, color and shape variation. Rare procedural mice: about 2.4–4.8% of new items, depending on defect frequency. Initial batch remains exactly 20 good and 5 defective beans.
- Timed mode gains 0.0015 m/s per correct reject, capped at 0.14 m/s from 0.065 m/s. Endless adds the time curve described above. Spawn frequency and defect probability still increase gently over time.
- Endless mode, with the same five-mistake failure rule.
- Quiet synthesized conveyor motor/roller audio, silenced by pause, hidden tabs and sound toggle.

## Validation and headset checks

```sh
npm test
npm run build
npm run dev -- --port 5174
node tests/browser.mjs
node tests/vr-interactions.mjs
node tests/characters.mjs
```

Browser tests use Microsoft Edge. TEST_URL overrides the desktop test address. Synthetic VR tests require Vite so they can import the loaded game module and supply controller poses. They do not emulate a physical headset.

Thirteen rules/interaction tests cover glove axes and curl, five-minute difficulty, supervisor approach/anger/loss/pause/reset, and scoring, failure, reset, pause, 20/5 mix, endless duration, capped success-based speed, throw velocity, swept contact and bin clearance. Browser checks cover rendering, movement, mouse sorting/scoring, pause/restart, remote-grab rejection, hold/release, throwing, opposite-hand catching, pushing, fast bin entry scoring once and endless simulation.

**v0.3 physical Quest controls, comfort and 72 FPS remain unverified.** The user tested v0.1 and v0.2 on Quest 3 and supplied feedback for these changes. Browser character tests check mouse movement/kicking, pickup/throw sound triggers, non-silent synthesized voice rendering, glove color and supervisor loss response. Check glove alignment, nearby pickup, trigger/grip release, throwing/juggling, pushing, bin clearance, mode selection, restart while holding, pause, mute and session exit. Repeat on Quest 2 before claiming compatibility/performance.

## Limits and publishing

Lightweight interaction physics, not full rigid bodies: no bean-to-bean collision, solid bin-wall/environment collision or articulated finger contact. Gloves use a palm contact volume. No hand tracking; controllers required. Critters have simple procedural models and bounded scurrying, not full animal AI. Downstream crate is visual and scored rather than a growing physical pile.

Shared bean geometry/materials, 60 active-item cap, no dynamic shadows, pixel ratio capped at 1.5. Vite emits its standard approximately 500 KB chunk-size warning.

Source on main; built files on gh-pages root, published after approval. Build with npm ci and npm run build; publish dist contents. Relative asset paths support /bean-there-vr/. Never modify original bean-there for this prototype.

Deferred: packing with green receiving crate below belt end, uninterrupted crate swaps, scale on left, 15 kg target, outgoing belt behind player and overflow failure. Premium export uses white polystyrene boxes and parallel top-layer alignment. Packing, weighing, networked co-op and more complex supervisor AI remain future milestones.

