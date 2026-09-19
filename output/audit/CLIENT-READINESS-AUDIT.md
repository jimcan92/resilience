# R.E.S.I.L.I.E.N.C.E. client-readiness audit

Date: 19 September 2026. Verdict: suitable for a clearly labelled prototype walkthrough after correcting the confirmed defects; not ready to present as a validated building-resilience or NSCP design calculator.

The four-step interface works and has a consistent visual design. The main blockers are scientific validity, misleading interpretation of scores, and incomplete wind cases. A disclaimer alone does not correct the numerical defects.

## What was checked

- Reviewed all calculation modules, coefficient tables, types, form validation, result dashboard, history, storage, map, themes, layout, manifest, and service worker.
- Read the supplied research proposal. It still contains formula placeholders and requires justified weights, classification thresholds, sensitivity analysis, and reference-case validation.
- Visually inspected relevant pages of the supplied scanned NSCP 2015 PDF: wind-speed selection, topography, gust assumptions, enclosure/internal pressure, velocity pressure, Kz table, and pressure equation. This is a targeted implementation audit, not an independent engineering certification or full review of the 1,008-page code.
- Cross-checked the published Boore-Atkinson 2008 description and paper.
- Executed the actual TypeScript engine through `node scripts/audit-engine.cjs`. This script reports diagnostic cases; exit code zero means the probes ran, not that the model is validated.
- Browser walkthrough: Site -> Building -> Hazard -> Review -> Calculate -> History; desktop and 375 px viewport; negative-distance validation; zero-distance result reproduction.
- `npm run check`: 0 errors, 0 warnings.
- `npm run build`: client/server/service-worker compilation succeeded, but Vercel packaging failed. The initial sandbox error was parent-directory `readlink` access; a permitted retry reached a Windows `symlink` EPERM error for the generated Vercel function. Deployment readiness is unverified. This does not establish that a Linux/Vercel build would fail.

Existing edits to Header.svelte and +layout.svelte were preserved. No application formulas or UI files were changed during this audit. Added only this report, diagnostic script/results, and reference-page renders. Two synthetic assessments were saved in the isolated local browser origin `http://127.0.0.1:5174`.

## Priority findings

### P1: Zero fault distance produces zero earthquake hazard

Location: `src/lib/engine/pga.ts:32`.

The UI explicitly accepts 0 km, but `!distanceKm` treats zero as invalid and returns PGA = 0. The formula already regularizes distance with `sqrt(distanceKm² + 6²)`, so a logarithm singularity does not justify this behavior.

For magnitude 7, medium soil, 250 kph, and 12 m height:

| Fault distance | PGA (g) | Earthquake score | Resilience | Overall label |
|---|---:|---:|---:|---|
| 0 km | 0 | 0 | 89% | LOW |
| 0.001 km | 0.387120 | 48 | 65% | MODERATE |
| 10 km | 0.195817 | 24 | 77% | LOW |

The 0 km result was reproduced through the UI. Replace truthiness checks with finite-number/domain checks. Invalid inputs should show an error, not a safe-looking zero. Add a zero-versus-near-zero regression test. This fix corrects a software defect; it does not validate the underlying GMPE.

### P1: The PGA model is not a demonstrated implementation of Boore-Atkinson 2008

Locations: `src/lib/engine/pga.ts:21`, `src/lib/data/gmpe-coefficients.json`, `src/lib/data/soil-factors.json`.

The app implements five constants with a quadratic magnitude term, logarithmic/linear distance terms, an assumed 6 km smoothing depth, and three soil multipliers. There is no coefficient provenance or validated reference-case comparison. The comment mentions a Vs30 term that is absent from the computation; the parameter interface also lists absent c6/c7 values.

Published BA08 uses source-to-site RJB, Vs30, fault type, and specified magnitude/distance/site functions. Its stated applicability includes magnitude 5-8 and RJB below 200 km; the app accepts magnitudes up to 9.5 without model-domain controls. Distance to the nearest mapped active fault is not automatically the event-specific rupture distance needed by the GMPE.

Action: select and cite a suitable published model, use its required inputs and coefficients, document applicability and uncertainty, and compare benchmark outputs. Until then call this an unvalidated illustrative model. Do not silently replace it with another invented approximation.

Sources: [USGS BA08 publication](https://pubs.usgs.gov/publication/70000554), [authors' published paper](https://www.daveboore.com/pubs_online/boore_atkinson_eqspectra_published.pdf).

### P1: Wind result omits governing cases and hides assumptions

Locations: `src/lib/engine/wind.ts:29`, `src/routes/+page.svelte:19`.

Correct portions: kph / 3.6 converts to m/s; qz = 0.613 Kz Kzt Kd V² matches NSCP equation 207B.3-1. The JSON Kz rows match the supplied Table 207B.3-1 through 150 m, and its notes permit linear interpolation. Pa / 1000 gives kPa correctly.

Incomplete portions: exposure is always C, Kzt always 1, G always 0.85, Cp always 0.8, and GCpi always +0.18. NSCP Table 207A.11-1 requires both signs of internal pressure; G = 0.85 is a rigid-building assumption. The implementation does not distinguish windward/leeward/side walls, roof surfaces, enclosure classes, topographic speed-up, or the appropriate q versus qi heights. It cannot represent a full building wind assessment or roof uplift.

With the default assumptions, q = 2613.2909 Pa. Current p = q(0.85 x 0.8 - 0.18) = 1306.6454 Pa. The opposite internal-pressure sign gives q(0.85 x 0.8 + 0.18) = 2247.4302 Pa, about 72% greater. This is a comparison holding all other assumptions fixed, not a complete corrected design pressure.

Action: explicitly scope the supported wind procedure/building class, collect its required inputs, check both internal-pressure cases and applicable surfaces, display the governing case and assumptions. Record wind-map edition and occupancy/risk category; a generic 'PAGASA wind map' label is insufficient to reproduce the selection.

Source: supplied `resources/pdfcoffee.pdf`, printed pages 2-32, 2-47, 2-55, 2-61, 2-62, 2-67 and 2-68; physical PDF pages 85, 100, 108, 114, 115, 120 and 121.

### P1: Hazard scores are presented as building resilience without a vulnerability model

Locations: `src/routes/+page.svelte:15`, `src/lib/engine/risk.ts:14`, `src/lib/components/ResultDashboard.svelte`.

Only magnitude, manual fault distance, soil category, wind speed and height affect the numeric result. Material, floors, length, width, roof and configuration do not affect the index. Roof/configuration affect some recommendation text only. Latitude/longitude are used for map display and external links, not hazard computation. Haversine is implemented but unused; result.haversineDistance is always null. No automated fault geometry analysis is present.

The 0.8 g and 6000 Pa score denominators, 50/50 weights, and 25/50/75 thresholds have no demonstrated calibration in the supplied proposal. Averaging earthquake=100 and typhoon=0 gives MODERATE with 50% resilience; one extreme hazard can be obscured. That arithmetic is internally consistent but is an unresolved methodology/communication choice, not proof of physical resilience or survival probability.

Action: either accurately scope the product as a scenario hazard-screening prototype, or implement justified vulnerability/fragility and building-response methods. Document the weighting policy and show separate hazard classifications so a dominant hazard remains visible. Complete the proposal's methodology before claiming validation.

### P1: Recommendations can contradict the result

Location: `src/lib/engine/recommendations.ts:59`.

When both hazard scores are 30, the overall classification is MODERATE, but a regular 12 m building on medium soil at 10 km receives 'Building appears to have low risk' because no other rule fired. 'No matching rule' does not mean 'low risk'. Rules use >=50 and >=75 while scoreToDangerLevel uses <=50 and <=75 for lower categories, creating boundary-policy inconsistencies as well.

Action: derive classification wording from one shared policy; use neutral text when no specific recommendation applies. Avoid inferring building safety from hazard-only results. Validate prescriptive recommendations such as roof replacement or base isolation against the intended methodology.

### P2: Unsupported input ranges silently produce plausible results

Locations: `src/lib/engine/wind.ts:26`, `src/lib/components/InputForm.svelte`.

Height has no upper bound but Kz stops at 150 m. Heights 150, 200 and 500 m all produce 2223.8100 Pa at 250 kph, exposure C. Positive/negative non-finite values and unknown categories are not consistently guarded at the engine boundary; score helpers do not enforce a nonnegative finite domain. Magnitude and distance are not constrained to a validated model's domain.

Action: validate supported ranges in both form and engine; reject unsupported heights or use a justified continuation. Add boundary, invalid-value and model-domain tests. Decimal dimensions should have explicit step settings. Define and validate what 'height' means for each equation.

### P2: Stored history is fragile and incomplete for client use

Location: `src/lib/storage/localStorage.ts:22`, `src/routes/history/+page.svelte`.

Malformed JSON throws (reproduced with an in-memory mock), and valid JSON of an unexpected shape is not checked. Quota/access errors are uncaught. Saved results have no model/schema version, so formula changes can leave old and new scores indistinguishable. History displays only date, scores, fault distance and height; there is no detail reopening, named project/site, edit, comparison or export. Individual deletion has no undo/confirmation, although Clear all has confirmation. Records are browser-local with no backup/export path.

Action: validate and version records, handle storage failures with honest UI feedback, preserve recoverable data, add site identity/detail view and export. Add an edit-and-recalculate flow; navigating away from the current result loses the detailed view and New assessment restores defaults.

### P2: Updates can discard an in-progress assessment

Locations: `src/service-worker.ts:18`, `src/routes/+layout.svelte:35`.

The worker unconditionally calls skipWaiting and clients.claim; controllerchange unconditionally reloads the page. This can bypass the intended user choice in the update confirmation. The form has no persistent draft. This is a code-level finding; an actual deployed update was not triggered in this audit.

Action: activate a waiting worker only after an accepted update, preserve drafts, clean up listeners/timers and verify update/offline behavior in a production build. External map tiles, marker images and fonts are not made offline by the same-origin cache.

## UI and flow audit

| Area | Observed behavior | Improvement |
|---|---|---|
| Overall layout | Consistent cards, spacing, typography; clear four-stage wizard | Keep the basic structure |
| Normal workflow | Completed end to end, saved result visible in history | Add reproducible demo cases and recovery paths |
| Validation | Negative fault distance correctly blocked; zero accepted | Fix downstream zero handling; associate errors via aria-describedby/aria-invalid and focus the first error |
| Results | Large green 'LOW' and a percent labelled building resilience | Explain 'LOW hazard/risk' explicitly, define score direction, show assumptions and limitations beside the score |
| Mobile | No horizontal overflow measured on tested site/result/history views at 375 px | Test actual phones, larger text and keyboard navigation before release |
| Navigation accessibility | Mobile Assess/History links have no accessible name; theme button unnamed | Add aria-label and active-page semantics |
| Progress accessibility | Mobile steps expose only numbers/checkmarks | Keep accessible step names even when visual labels are hidden |
| Fault input | Accessible name is only 'km' | Add a semantic label for distance to nearest active fault |
| Map workflow | Map loads; manual HazardHunter copy/paste instructions visible | Add address/coordinate input and map-failure state; require reconfirmation of site-dependent values when the pin changes |
| Data provenance | Default 10 km / 250 kph / magnitude 7 can be submitted immediately | Clearly label demo defaults; store source/date/verification for real assessments; do not imply automatic data retrieval |
| History | Synthetic assessment saved successfully | Add full details, site name, recent-first ordering, edit and print/export |
| Presentation | Browser title remains the URL; footer jiMcaN points to local /jimcan.net | Add page titles and fix the link to a fully qualified URL |
| Themes | Many selectable themes; state starts undefined despite saved theme | Initialize selector from applied theme; check contrast in supported themes; give theme trigger a name |

Additional code observations: nested label elements should be replaced with valid label/input relationships; toast updates lack a live-region role; the runtime `alert-{type}` class construction may miss generated Tailwind classes; map initialization has no cancellation/error handling around asynchronous imports. The initially added satellite layer is a different instance from the layer-control Satellite entry. These need targeted regression checks; they are not all reproduced UI failures.

## Verified numerical checks

| Check | Result |
|---|---|
| Haversine identical coordinates | 0 km |
| One degree longitude at equator | 111.19493 km |
| Double wind speed, same height/exposure | Pressure x4 |
| Default UI result vs engine probe | Matches: PGA 0.196 g displayed, pressure 1.31 kPa, scores 24/22, 77%, LOW |
| Zero-distance UI vs engine probe | Matches the defect: PGA 0, earthquake 0, 89%, LOW |
| Corrupted history JSON | Throws instead of recovering |
| Production bundle | Compiles; Windows adapter packaging fails |

Arithmetic matching the current implementation is not evidence that its scientific assumptions are valid.

## Before the client presentation

1. Fix zero-distance handling, contradictory recommendation wording, invalid-input handling and storage recovery; add regression tests that fail on these current defects.
2. Agree the product claim: hazard-screening prototype or validated building-resilience model. Resolve GMPE provenance, distance metric, scoring calibration and unsupported building inputs accordingly.
3. Complete the supported NSCP wind cases, assumptions and input selection; verify hand-calculated examples against the implementation.
4. Add result input/assumption summaries, site identity, reopen/edit and a printable/exportable report. Fix accessibility names, page titles and footer link.
5. Obtain a successful deployment build in the intended environment and run the demo on that exact build. Test reload, update, lost network/map failures and saved-history recovery.

For a prototype walkthrough today, describe it as a work in progress and avoid asserting that the displayed percentage measures a building's safety. Do not use the zero-distance scenario as a valid assessment until fixed.

## Coverage limits

No deployed URL or client acceptance checklist was supplied. Actual geolocation permission, clipboard permission failures, HazardHunter coordinate-link behavior, all themes, every screen size, real-device behavior, offline installation, destructive history controls and a production service-worker update were not exercised. No dependency vulnerability scan or penetration test was performed. No fault-data API integration exists in the reviewed code. The scanned NSCP source was reviewed only in the relevant sections named above.
