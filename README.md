# Bean There VR v0.6

A very normal job. Now in three dimensions.

Three.js + TypeScript + Vite. Repository: https://github.com/AelisonX/bean-there-vr. Game: https://aelisonx.github.io/bean-there-vr/. Original Bean There game untouched. v0.6 is published with user approval. Deployment and the live desktop browser playtest passed; physical Quest testing of this update remains pending.

## Run

```sh
npm ci
npm run dev
```

Node 22.12+ (tested on 24). Open Vite's printed localhost address. Quest: open the published HTTPS site in Meta Quest Browser and select Enter VR.

Main menu chooses a 90-second shift or endless mode; both normally fail at ten sorting mistakes. Fired practice is separate: scoring freezes and play can continue beyond the timer/mistake limit until the supervisor knocks you down or you restart. Options: sound, bin assist, workstation height. P / Escape pauses, R restarts, and VR A / X opens/resumes the pause menu. Hidden tabs and VR session exit pause. No artificial locomotion.

## Controls

VR: reach near produce. Trigger holds one bean, grip holds a second independently in the same hand. Both buttons are needed for one mouse in an empty hand; release either to release the mouse. Release a bean's corresponding button to throw/drop it. Catch airborne items with the same proximity rules. Open gloves push items. Menu pointers only appear outside active play. Gloves retain the outward roll and add a 7.5-degree downward tilt. The menu pointer follows that tilted index axis; transformed palm contact follows the glove.

Desktop: **hold left mouse for the first item and right mouse for the second; release independently to throw/drop**. Move the single robot glove with the cursor. Flick while releasing for a free throw; stop moving before release for a drop. Aim at the supervisor and release for a targeted ballistic throw. An empty left click on him slaps, an empty right click punches. Shift + right click is a strong punch. Both mouse buttons are needed to hold a mouse. The context menu is suppressed on the canvas. H or the top-right Hide/Show panel button hides/restores the desktop panel and header, clearing the supervisor approach area.

Good green beans stay on the belt. Brown/yellow, tightly curled, short/broken beans and rare mice belong in the white bin forward/right. Correct reject +20; good downstream +2; wasted good −18; missed defect −10; score floors at zero. Floor drops count as mistakes. Initial batch is 23 good / 7 bad, with bad items only near the player or upstream.

## v0.6 changes

- Supervisor collisions use current and previous moving poses plus arm/hand hit volumes, evaluated after his approach animation. Swept hand motion and a retract/re-arm rule make follow-up hits possible without a stationary hand generating repeated hits.
- Bin walls/floor use continuous swept-sphere collision for the curved bean samples, with two solver passes and an interior containment guard below the rim. This targets fast inside-to-outside wall escapes while leaving the opening free.
- Initial traffic rises from 25 to 30 beans (seven rejects). Continuous spawning starts every 1.25 seconds instead of 1.5, rising to 0.75 seconds; defect chance starts at 24% instead of 20%. Active items cap at 66. All initial rejects remain near the player or upstream.
- Desktop H / Hide panel toggle; own VR body/head excluded from both eye cameras on a private proxy layer, while tracking and future co-op transforms remain available.
- Counterpunch has about 0.8 seconds of visible windup, then 0.45 seconds of travel toward the head position sampled at launch. Moving more than about 0.32 m away from that target at impact makes it miss; he recovers before another counter. No forced VR camera motion.
- The first successful slap/punch permanently marks the player FIRED for this shift, even if that same punch KOs him. Score freezes at its current value; subsequent sorting/penalties cannot alter it. Practice continues beyond the timer/mistake limit, including after KO. Restart begins a fresh job. Thrown items retain the earlier ordinary-mistake rule.

## Bin physics

The reject bin now has collision walls, a floor and a rounded capsule rim matching its visual geometry. Bean contact samples follow the curved pod, scale and orientation. Impacts bounce, transfer spin and lose some energy through friction, permitting rim shots, rim rolls, bounce-ins and bounce-outs. Scoring happens once an item is sufficiently deep and slow inside the bin, not merely when it crosses the opening. Physics uses short substeps, not unrestricted full rigid bodies.

Assist now provides up to 2 m/s² of horizontal guidance only for descending items close to the bin (within 0.6 m above / 0.08 m below the rim and a 0.2 m margin around the opening). It never lifts or teleports items and cannot guarantee a catch. The rim turns pale mint while enabled. Tests include a repeatable near-rim miss without assist that lands with assist.

## Supervisor combat

The v0.4 instant-firing rule is replaced by a small combat loop. Repeated hits register distinct reactions and an on-screen combo. Hits must separate/re-enter rather than remaining in contact. A combo window lasts 1.6 seconds; resting contacts and implausibly rapid repeated events do not count.

Open-hand hits slap; trigger/grip held punches. Slaps stagger and build combo damage, **but only a punch can KO the supervisor**. A punch at 4.5 m/s or a punch finishing enough accumulated damage knocks him down. Desktop normal punches can combo; Shift + right click gives a strong punch. KO persists until restart, stops retaliation, and lets sorting continue without points because the player remains fired. Punch audio adds an audible midrange crack and tonal thud; slap sound is retained.

Once provoked by a hand strike he approaches, winds up, and counters after a longer grace period. Firing is immediate but is not an immediate game-over. Further hits can briefly delay him, with a cap to prevent endless slap stun. If his counter connects in range, one hit ends the shift as KNOCKED DOWN, without fabricating sorting mistakes. The avatar falls. Desktop view lowers/tilts; **VR camera remains headset-tracked while the avatar falls**. Throwing produce at him remains exactly one ordinary sorting mistake and does not start combat by itself. No injury visuals.

## Avatars and retained features

VR has a simple torso and tracked head proxy, with no arms/legs; tracked gloves remain separate. Desktop has a robot torso/head proxy and one glove connected by a simple telescoping arm. The own VR torso and head are hidden from both local eye cameras; desktop own head is hidden too. Private layer 31 avoids the stereo-eye layers used internally by Three.js. These are local representations for future co-op; there is no networking or second player yet.

Mice remain rare (maximum two active), with anchored feet, limited kicking/scurrying and ambient/pickup/throw squeaks. Smaller procedural beans retain varied shapes/colors. The factory has lightweight windows, pipes, storage crates and an opposite reserved standing bay. Quiet synthesized machine noise and character sounds obey mute/pause/visibility.

Timed belt speed starts at 0.065 m/s, adding 0.0015 per successful reject up to 0.14. Endless ramps to 0.545 m/s at five minutes plus a capped 0.06 success bonus. Five-minute average survival is a playtest target, not a verified human metric.

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
node tests/desktop-combat.mjs
node tests/release6.mjs
```

Tests use Microsoft Edge. TEST_URL overrides the desktop smoke test's address. Other browser tests inject synthetic controller poses through Vite development modules; they do not emulate a headset.

Thirty-five unit tests. Coverage: scoring, reset/pause, safe opening, hand slots, assist, solid walls/floor/rim bounce and spin, an assisted catch versus an unassisted miss, combo timeout, punch-only KO, telegraphed counter, avatar visibility and VR camera stability. Browser coverage: actual mouse holds/releases/throws and strikes, synthetic VR grabs/combos, supervisor KO/counter defeat, fall animation, menus, character sounds and punch amplitude.

**v0.6 physical Quest alignment, comfort, bin feel and 72 FPS performance remain unverified.** The user tested earlier releases on Quest 3. Retest the downward glove tilt, early-approach hits and repeat combos, inside-wall ricochets, own-body invisibility in both eyes, fired/no-points practice and dodging the slower punch. Quest 2 needs its own hardware test.

## Limits and publication

No bean-to-bean collisions, articulated finger collisions, hand tracking, or general factory rigid-body collisions. Bin and supervisor use dedicated collision volumes. Contact physics is an approximation, not Rapier. Downstream crate is visual/scored, not a physical growing pile. Avatar arm stretch and desktop aiming are development-friendly approximations.

Shared geometry/materials, 66 active items, instanced static dressing, no dynamic shadows and pixel ratio capped at 1.5. Vite emits its standard approximately 500 KB chunk warning. Source on main, built files on gh-pages root, updated after approval. Build with npm ci and npm run build; publish dist contents. Relative paths support /bean-there-vr/.

Deferred: networked co-op; packing with uninterrupted crate swaps, left scale and 15 kg target; premium export alignment and more complex factory simulation.

