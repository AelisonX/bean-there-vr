# Bean There VR v0.4

A very normal job. Now in three dimensions.

Three.js + TypeScript + Vite. Separate repository: https://github.com/AelisonX/bean-there-vr. Website: https://aelisonx.github.io/bean-there-vr/. Original game untouched. v0.4 is published with user approval. The live desktop browser playtest passed; physical Quest testing of this update remains pending.

## Run and choose a mode

```sh
npm ci
npm run dev
```

Node 22.12+ required (tested on 24). Open Vite's printed localhost address. For Quest, open the published HTTPS site in Meta Quest Browser and select Enter VR.

The main menu selects a 90-second shift or endless mode. Both modes end at **10 mistakes**. Options control sound, gentle bin assist and workstation height. Options work on desktop and through the in-world VR menu. Height supports seated/standing setup; no artificial locomotion. Five-minute difficulty is a design target, not a measured average human survival time.

Desktop: click a bean, move over the bin and click to release. P / Escape pauses; R restarts the selected mode. Main menu pauses the game. Hidden tabs and VR session exit pause and require manual resume.

## Quest interaction

- Reach near produce. **Trigger holds one bean; grip holds a second bean independently in the same hand.** Release the corresponding button to release that bean. Either hand can do this.
- **One mouse per hand requires both trigger and grip**, with no beans in that hand. The first button alone will not grab a mouse. Release either button to release it. Nearby mice take priority over accidental bean picks while the hand is empty.
- Recent hand motion controls throws, capped at 6 m/s to suppress tracking spikes. Catch airborne items with the same proximity/button rules. Move open hands against produce to push it.
- A / X opens/closes the pause menu. Aim the menu pointer and trigger to activate its buttons. The straight index finger is aligned to the same target-ray axis. **Pointer and cursor appear only before/after play or while paused.** Produce cannot be grabbed by ray.
- Blue gloves and their contact point follow the same target-ray pose. The trigger curls the index; grip curls the other fingers. Physical alignment still needs headset confirmation.

Good green beans stay on the conveyor. Brown, yellow, tightly curled, short/broken beans and rare mice go into the white bin forward/right. Correct rejection +20, good downstream +2, wasted good −18, missed defect −10. Score floors at zero. Floor drops count as normal mistakes.

## v0.4 changes

- Mouse feet use small hinged groups anchored inside the body. Motion is slower and reduced to 0.13 radians on the belt / 0.25 while held, preserving the existing scurrying and squeaks.
- Supervisor starts at the upstream end and approaches around the belt's near-left corner. The opposite standing bay remains reserved for future co-op.
- Thrown produce hitting his body/head causes a flinch, impact sound and **exactly one ordinary sorting mistake**. It does not fire the player or add a special penalty. The item is resolved once.
- A deliberate moving-hand contact with the supervisor ends the shift as **FIRED**. An open hand slaps; trigger or grip held punches, even if carrying beans. These have different impact sounds, poses and end messages. Collision is swept to catch fast movement; a resting hand does not trigger firing. No injury visuals.
- Starting batch stays 20 good / 5 bad. Three initial rejects are in the near working area; two are upstream with time to reach the player. No initial rejects start downstream or across the far side.
- Ten-mistake limit and separate fired end reasons throughout UI/state.
- Main menu, options and menu-only cursor/index alignment.
- Reject bin widened from 0.67 to 0.82 m, still clear of the belt. Optional assist acts only on descending objects within 0.4 m above the rim and 0.1 m of its opening, at at most 0.22 m/s² sideways. No upward pull, teleport or automatic score; throws still need to cross the opening.
- Two independent bean slots per hand and a both-button mouse rule.

## Retained

Procedural beans are 28% smaller than the first prototype, with varied shape/size/color. Mice remain rare (maximum two active), kick/scurry and squeak on ambient/pickup/throw events. Synthesized conveyor noise and cranky supervisor voices obey mute/pause/visibility. Supervisor grumbles, gestures and emotes at loss.

Timed belt speed: 0.065 m/s plus 0.0015 per successful reject, capped at 0.14. Endless: a five-minute curve reaching 0.545 m/s at 300 seconds plus a success bonus capped at 0.06. Spawn and defect frequency rise gently. Endless has no time limit.

The factory has simple windows, pipes, shelves/crates and safety markings; repeated background boxes are instanced. No networking or second player yet.

## Verification

```sh
npm test
npm run build
npm run dev -- --port 5174
node tests/browser.mjs
node tests/vr-interactions.mjs
node tests/characters.mjs
node tests/menu.mjs
node tests/supervisor-hits.mjs
```

Browser checks use installed Microsoft Edge. TEST_URL overrides the desktop test's address. Other browser tests use Vite's development modules to inject synthetic controller poses; they do not emulate a headset.

Twenty unit tests cover scoring/failure/reset, safe opening positions, dual-slot/mouse exclusivity, bounded assist, swept hits, menu regions, index alignment, difficulty, supervisor state and throw/contact math. Browser checks cover mouse sorting, independent dual grabs/releases, mouse rules, throwing/catching/pushing, cursor visibility/alignment, actual VR menu activation, desktop options/resume, audio rendering, supervisor projectile mistakes and slap/punch firing.

**v0.4 physical Quest comfort, hand alignment and 72 FPS performance remain unverified.** The user has playtested earlier releases on Quest 3. Retest hands and menu first, then dual grabs, mice, throws/assist, safe start, mistake limit and supervisor interactions. Quest 2 compatibility/performance also needs physical testing.

## Limits and publication

Lightweight interaction physics: no bean-to-bean collisions, solid bin-wall/environment rigid bodies or articulated finger contact. Gloves use a palm contact region; supervisor uses body/head collision volumes. No hand tracking. Downstream crate is visual and scored, not a growing physical pile.

Shared geometry/materials, a 60-active-item cap, no dynamic shadows and pixel ratio capped at 1.5. Vite emits its standard approximately 500 KB chunk warning.

Source on main, built static files on gh-pages root, published after approval. Run npm ci and npm run build, then publish dist contents. Relative paths support /bean-there-vr/. Never modify the original bean-there game for this prototype.

Deferred: packing with receiving crate below belt end, uninterrupted swaps, left scale, 15 kg target, outgoing belt behind player and overflow failure; premium white export boxes and parallel top-layer alignment; networked co-op and more complex supervisor AI.

