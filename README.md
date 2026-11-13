# Bean There VR — first playable prototype

A very normal job. Now in three dimensions.

Standalone Three.js + TypeScript + Vite project. Proposed new GitHub repository: **AelisonX/bean-there-vr**. No remote has been created, pushed, or deployed. The original game was inspected at commit `3e42b4db7d4d5cd0a5d9f876cd68c66f07e3b7cf` in a separate reference checkout and was not modified. No original source or assets were copied.

## Run on PC

Requires Node 22.12+ (tested with Node 24).

```sh
npm ci
npm run dev
```

Open the localhost address printed by Vite. For the current work session a server is running at **http://127.0.0.1:5174/**.

- Start shift: 20 good beans and 5 visible rejects, followed by continuous spawning.
- Click a bean, move it over the white bin on your right, then click to release. Thin beans have a small targeting tolerance.
- Leave good green beans on the conveyor. Brown, yellow, tightly curled beans are rejects.
- Correct rejection: +20. Good bean downstream: +2. Wasted good bean: −18. Missed defect: −10. Score floors at zero.
- Five mistakes ends the shift. Survive 90 seconds to complete it. Speed and defect frequency increase gradually.
- P / Escape pauses; R restarts. Hidden tabs pause and require manual resume. Sound toggle controls feedback tones.
- Station height slider adjusts the equipment before entering VR, including for seated play.

## Quest 3 / Quest 2 test

**Physical headset compatibility, comfort and 72 FPS performance are unverified.** WebXR entry and controller handling are implemented, not a substitute for hardware testing.

Quest Browser needs a secure origin. The PC's localhost address is not reachable as localhost on a Quest. After approval, publish `dist/` to an HTTPS host, or use an already configured trusted HTTPS development connection. Plain HTTP over the LAN is insufficient for immersive VR.

1. Open the HTTPS build in Quest Browser and enter VR.
2. Start in the center of your boundary facing the conveyor. No locomotion is required. Adjust the station height in the browser before entry if needed.
3. Point either controller at the station panel and press its trigger to start. The same panel pauses/resumes; after failure/completion it restarts.
4. Point at a bean and press trigger to grab. A second trigger press releases it. Both hands can hold independent beans. Ray grabbing keeps reaching optional.
5. Release over the white reject bin on your right. Check correct rejects, good-bean penalties, missed defects, two-handed release, pause, session exit and restart.
6. Check legibility, seated/standing reach, controller alignment and frame rate on each headset. Record any discomfort before increasing difficulty.

Controllers are tracked target-ray spaces with simple colored hand markers; no hand tracking or articulated hands. Release uses gentle gravity, not velocity-based throwing. This deliberately small hybrid simulation uses kinematic belt movement and bin/belt bounds instead of Rapier.

## Checks

```sh
npm test
npm run build
npm run dev -- --port 5174
node tests/browser.mjs
```

The browser test uses installed Microsoft Edge. Set `TEST_URL` for another local port. Passed checks: five rules tests; TypeScript and production build; real browser rendering, initial 20/5 batch, conveyor movement, mouse grab/drop into bin, +20 score, pause, restart, XR enabled and no page errors. The browser test does not emulate a headset or establish VR performance.

Geometry and materials are shared, active beans capped at 60, no dynamic shadows, pixel ratio capped at 1.5. Production JavaScript is approximately 505 KB / 130 KB gzip; Vite emits its standard 500 KB chunk-size warning.

## Publishing (approval required)

The build uses a relative asset base, compatible with a future `/bean-there-vr/` GitHub Pages path ([Vite deployment guide](https://vite.dev/guide/static-deploy.html)). No automatic deployment workflow is installed. After explicit approval: create the separate repository, push this source, build with `npm ci && npm run build`, and publish the `dist/` contents through Pages. Do not deploy the source folder as an unbuilt static game.

## Next milestones — intentionally deferred

Packing: green receiving crate directly below the conveyor end; swap full crates while the belt continues; scale on the left; adjust to 15 kg; inspect the top layer; outgoing conveyor behind the player. Overflow fails production.

Premium export: white polystyrene boxes, straight/slender quality standards, careful weight and parallel top-layer alignment. Future supervisor: short brown hair, orange high-vis vest, mask, clipboard. No packing, weighing, supervisor AI or multiplayer is implemented in this milestone.

Known prototype limits: simple bin/belt collision without bean-to-bean physics; no velocity throwing/flicking, ambient factory sound loop, saved progress or controller models. Downstream collection is represented by a green crate and scoring rather than a growing physical pile. Mistake allowance and speed need human difficulty calibration.
