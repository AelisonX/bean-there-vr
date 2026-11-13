# Bean There VR v0.12

A very normal job. Now in three dimensions.

Three.js + TypeScript + Vite. Repository: https://github.com/AelisonX/bean-there-vr. Game: https://aelisonx.github.io/bean-there-vr/. Original Bean There game untouched. v0.11 is live. v0.12 fixes remote VR placement, restart hit registration, guest bin placement and middle/later reject density locally, pending approval to publish. Co-op connection setup will be discussed after the single-player headset test.

## Run

```sh
npm ci
npm run dev
```

Node 22.12+ (tested on 24). Open Vite's printed localhost address. Quest: open the published HTTPS site in Meta Quest Browser and select Enter VR.

Main menu chooses a three-minute shift or endless mode; normal mode fails at 20 sorting mistakes and endless at 40. Fired practice is separate: scoring freezes and play can continue beyond the timer/mistake limit until the supervisor knocks you down or you restart. Options: sound, bin assist, workstation height. P / Escape pauses, R restarts, and VR A / X opens/resumes the pause menu. Hidden tabs and VR session exit pause. No artificial locomotion.

## Controls

VR: reach near produce. Trigger holds one bean, grip holds a second independently in the same hand. Both buttons are needed for one mouse in an empty hand; release either to release the mouse. Release a bean's corresponding button to throw/drop it. Catch airborne items with the same proximity rules. Open gloves push items. Menu pointers only appear outside active play. Gloves retain the outward roll and add a 7.5-degree downward tilt. The menu pointer follows that tilted index axis; transformed palm contact follows the glove.

Desktop: **hold left mouse for the first item and right mouse for the second; release independently to throw/drop**. Move the single robot glove with the cursor. Flick while releasing for a free throw; stop moving before release for a drop. Aim at the supervisor and release for a targeted ballistic throw. An empty left click on him slaps, an empty right click punches. Shift + right click is a strong punch. Both mouse buttons are needed to hold a mouse. The context menu is suppressed on the canvas. H or the top-right Hide/Show panel button hides/restores the desktop panel and header, clearing the supervisor approach area.

Good green beans stay on the belt. Brown/yellow, tightly curled, short/broken beans and rare mice belong in the white bin forward/right. Correct reject +20; good downstream +2; wasted good −18; missed defect −10; score floors at zero. Floor drops count as mistakes. Initial batch is 57 good / 7 bad, with bad items only near the player or upstream.

## v0.8 / testing order

**Single-player first. Co-op setup and headset pairing afterwards, on this same version.** No external server, account, tunnel, firewall rule or paid hosting has been created. Local loopback servers were used for automated tests only.

- Extra good-bean stream scales with speed and player count. Initial batch has 57 green and seven bad beans. Reserve capacity keeps reject arrivals flowing. See final v0.8 tuning below.
- Factory scenery is completed behind the player with the opposite copy, back wall/supports and symmetric overhead lights.
- Same VR hand has a 0.5-second supervisor-hit cooldown. Alternating hands can still combo. Desktop's single connected glove shares one cooldown across left/right punch/slap actions.
- A counter is blocked only when the actual moving fist segment contacts a glove region. A hand raised elsewhere does nothing. Contact block gives a thunk/chime and a short BLOCKED message, with no knockdown. No button press is needed to block.
- Held mice wriggle their bodies more, bob by a few millimetres and kick faster with anchored feet. They retain the both-button grab rule.

## Co-op rooms and play

The menu has Co-op with Host, Join, room name, optional password, and a refreshable list of rooms waiting for a second player. Exactly two players, no spectators. A third player is rejected; only the host can start after a partner joins. Enter room text/password in the browser form before entering immersive VR. The in-world menu can start/leave a connected room; room setup exits VR to use the browser keyboard.

Player one stands on the near side; player two is rotated 180 degrees on the opposite side. Both see the other player's head/torso and gloves; desktop is represented with one connected robot glove. Each side has a physical white reject bin and its own correctly facing in-world panel. The partner can catch released items. Open moving gloves meeting produce a high-five sound/haptic event, without adding score or damage. Lost/untracked hands are excluded.

Co-op is an endless team shift with shared score, mistakes, supervisor and fired status. A teammate provoking the supervisor fires the team, preserving the previous no-more-points practice rule. If the targeted player is knocked down, the team shift ends; that player's own avatar falls. These are first-prototype team rules, subject to playtesting.

Co-op belt speed is 1.5x solo; the mixed spawn interval is divided by 1.5, starts with a higher bad proportion, and mice are more frequent (up to four active). Additional initial upstream rejects and a faster good-only stream supply two players. The supervisor visits both sides and retaliates toward the player who struck him; either player's glove can physically intercept a counter.

### Local implementation (setup deferred)

The browser host simulates the shared world; a small Node/WebSocket relay handles room/password checks, exclusive item ownership, player poses, high-fives and disconnects. The guest receives world snapshots and sends input. This avoids running two independent physics/scoring loops. Shared item IDs and ownership prevent duplicate grabs/scoring. A joining VR player remains physically reach-limited; mouse controls remain the desktop fallback. Claims include a fresh hand pose to avoid fast-grab pose latency.

No host migration: host disconnect closes the room, guest disconnect pauses it, and resuming requires a second player. Rooms and passwords are memory-only; passwords are salted/hashed and never included in room listings/snapshots. Payload/rate/room limits and heartbeat cleanup are included. This is for internal testing, not competitive anti-cheat or production-scale matchmaking.

The relay can serve the built game and /multiplayer on the same origin. npm run server binds to 127.0.0.1:8787 by default. HOST/PORT configure binding; ALLOWED_ORIGINS can restrict browser origins. A public static build defaults to no configured co-op endpoint; the Connection section or server query parameter can supply one later. Quest needs HTTPS/WSS; no LAN certificate or secure external connection has been configured yet. The PC can run only the relay while two Quest players occupy the two slots.

## Retained v0.6 changes

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

The v0.4 instant-firing rule is replaced by a small combat loop. Repeated hits register distinct reactions and an on-screen combo. Moving contact can hit during any pose, with a half-second per-hand cooldown. A combo window lasts 1.6 seconds; resting contacts and implausibly rapid repeated events do not count.

Open-hand hits slap; trigger/grip held punches. The firing hit causes no damage. After that, at least three damaging punches and 12 damage are needed for KO; weaker punches can require more. Slaps cannot deliver a KO. Damage persists between combo windows. A committed counter is immune to interruption by hits, including lethal hits: the knockout takes effect when that counter resolves. Blocking and dodging remain available. Shift + right click gives a stronger desktop punch.

Once provoked by a hand strike he approaches, winds up, and counters after a longer grace period. Firing is immediate but is not an immediate game-over. Further hits can briefly delay him, with a cap to prevent endless slap stun. If his counter connects in range, one hit ends the shift as KNOCKED DOWN, without fabricating sorting mistakes. The avatar falls. Desktop view lowers/tilts; **VR camera remains headset-tracked while the avatar falls**. Throwing produce at him remains exactly one ordinary sorting mistake and does not start combat by itself. No injury visuals.

## Avatars and retained features

VR has a simple torso and tracked head proxy, with no arms/legs; tracked gloves remain separate. Desktop has a robot torso/head proxy and one glove connected by a simple telescoping arm. The own VR torso and head are hidden from both local eye cameras; desktop own head is hidden too. Private layer 31 avoids the stereo-eye layers used internally by Three.js. These are local representations for future co-op; there is no networking or second player yet.

Mice remain rare (maximum two active), with anchored feet, limited kicking/scurrying and ambient/pickup/throw squeaks. Smaller procedural beans retain varied shapes/colors. The factory has lightweight windows, pipes, storage crates and an opposite reserved standing bay. Quiet synthesized machine noise and character sounds obey mute/pause/visibility.

Belt speeds receive a 10% overall boost from the prior version. Normal adds an accelerating time ramp across its three minutes and a capped success bonus. Endless keeps increasing beyond five minutes and adds a sharper accelerating ramp after six minutes, with a 2.4 m/s simulation cap before the solo/co-op belt multiplier. Reject probability and arrival frequency rise in both modes and faster in endless; green traffic and co-op difficulty scale alongside them.

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
node tests/block-browser.mjs
node tests/cooldown-browser.mjs
node tests/release8-browser.mjs
node tests/coop-browser.mjs
```

Tests use Microsoft Edge. TEST_URL overrides the desktop smoke test's address. Other browser tests inject synthetic controller poses through Vite development modules; they do not emulate a headset.

Fifty-five game/relay tests. Coverage: scoring, reset/pause, safe opening, hand slots, assist, solid walls/floor/rim bounce and spin, an assisted catch versus an unassisted miss, combo timeout, punch-only KO, telegraphed counter, avatar visibility and VR camera stability. Browser coverage: actual mouse holds/releases/throws and strikes, synthetic VR grabs/combos, supervisor KO/counter defeat, fall animation, menus, character sounds and punch amplitude.

**v0.10 physical Quest alignment, comfort, bin feel and 72 FPS performance remain unverified.** The user tested earlier releases on Quest 3. Retest the downward glove tilt, early-approach hits and repeat combos, inside-wall ricochets, own-body invisibility in both eyes, fired/no-points practice and dodging the slower punch. Quest 2 needs its own hardware test.

## Limits and publication

No bean-to-bean collisions, articulated finger collisions, hand tracking, or general factory rigid-body collisions. Bin and supervisor use dedicated collision volumes. Contact physics is an approximation, not Rapier. Downstream crate is visual/scored, not a physical growing pile. Avatar arm stretch and desktop aiming are development-friendly approximations.

Shared geometry/materials, 128 active items, instanced static dressing, no dynamic shadows and pixel ratio capped at 1.5. Vite emits its standard approximately 500 KB chunk warning. Source on main, built files on gh-pages root, updated after approval. Build with npm ci and npm run build; publish dist contents. Relative paths support /bean-there-vr/.

Deferred: production hosting, host migration, voice chat and broad multiplayer device/performance validation; packing with uninterrupted crate swaps, left scale and 15 kg target; premium export alignment and more complex factory simulation.

### Final v0.8 playtest tuning
57 green and 7 defective starting beans. Belt speed reduced 15%; green arrivals scale with speed and co-op difficulty. Reject density stays gentle for two minutes, then increases in endless. Early rejects keep a visible upper silhouette, and nearby green beans yield in the belt plane. Mice scurry and displace nearby beans; floor-landed mice run away for three seconds and count only once. Thrown items visibly stagger the supervisor and, during co-op combat, redirect his next counter to the thrower with a new warning window.

### v0.8 changes
Normal shifts allow 20 mistakes, endless 40. Handling/pushing good beans is free; losing a good bean off the belt or binning it is a mistake. The supervisor visits at each five-mistake milestone. First physical strike fires the player with a warning; the second starts retaliation, aiming for impact about 1.55 seconds later while in reach. Further hits do not postpone that first counter. Hits remain active during all approach/yelling/reaction poses until KO or out of reach. Mice roam faster across the belt and displace beans using the existing planar contacts. Prepared locally for approval before publishing.

### v0.9 mouse behavior
Untouched mice stay inside every belt edge, including the downstream end, despite conveyor motion or crowd contacts. The protection ends permanently after a player touches or picks up the mouse. Either co-op player can unlock it, and that state is synchronized. Belt mice choose nearby beans, seek them and curve around close targets while pushing them through planar contacts; they retarget periodically rather than wandering aimlessly. With no beans they wait on the moving belt. Floor escape behavior is retained after handling. Automated coverage includes all-edge confinement, seeking, VR pickup/unlocking, floor escape and remote touch synchronization.

### v0.10 verification
49 unit/relay tests, production build, live browser combat checks for harmless first hit and lethal damage during an uninterrupted counter, retained mouse behavior and two-player synchronization. Quest feel and balance require playtesting.

### v0.11 fight disengagement
Five blocked or dodged counters in a fight make the supervisor retreat and stop both retaliation and mistake-triggered visits. Fired status and damage persist. A new physical strike restarts retaliation, clears the five-counter tally and keeps the player fired. Counts and disengagement are shared in co-op. Knockout damage still takes priority when an uninterruptible counter finishes. Prepared locally pending approval to publish.

Verified v0.11: 52 unit/relay tests, production build, five actual in-game dodges leading to retreat, restarting combat while remaining fired, and physical glove blocking.

### v0.12 playtest fixes
XR head poses apply the player rig transform exactly once rather than reading the renderer-owned XR matrix as an ordinary world transform. Remote avatars snap to their first pose and when switching desktop/VR, then smooth ongoing movement. Guest station bin is now on its left (world x=+0.95, z=-1.74), including solid contacts, capture, assist and sign. VR strike cooldown timestamps clear with every new shift, fixing long previous-round lockouts. Guest strikes send a fresh hand pose and bounded swept contact segment instead of testing only a stale endpoint; host still validates range, motion and per-hand cooldown. Guest collision pose history updates with supervisor snapshots. First firing hit still reacts without damage, and existing fight/KO/counter rules remain intact. Reject arrival rate rises modestly initially and more after 45 seconds, including minutes 2–3, scaling with co-op and endless; the initial batch and belt speed are unchanged.

Verified: 55 unit/relay tests, production build, both hands striking immediately after repeated solo restarts, two real browser peers with synthetic VR sweeps through the supervisor after room restart, remote opposite-side head/body coordinates and new bin capture. Physical Quest pairing still needs hardware testing. Temporary loopback servers are stopped after verification; no public/LAN host or tunnel is left running.

Local HTTPS relay support: TLS_CERT and TLS_KEY optionally supply certificate files; HOST and PORT control listening. Certificates/private keys are kept outside this repository. Windows firewall setup requires separate local approval and is not part of publishing the game.

## Friends and family online testing
One source version serves GitHub Pages single-player and a Render web service with solo/co-op. The Render service serves dist and /multiplayer together, so the secure server address configures automatically. Use the Free Node service in Singapore, build `npm ci --include=dev && npm run build`, start `npm run server`, HOST=0.0.0.0, NODE_VERSION=24 and health path /health. render.yaml records this configuration with automatic deployments off. Keep one instance because rooms live in memory; restarting/deploying closes rooms. Free services may take about a minute to wake after inactivity. Waiting rooms and optional room passwords are available; the website itself is public. No game accounts, paid plan, disk or database are required.
