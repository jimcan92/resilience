# R.E.S.I.L.I.E.N.C.E.

**Risk Evaluation and Spatial Integration for Load- and Impact-Enhanced Networked Construction Engineering**

A web-based research prototype for exploring earthquake and typhoon-wind scenarios for buildings in the Philippines. It combines user-entered site, building, and hazard information into model scores, a Building Resilience Score (BRS), and preliminary recommendations.

**Project website:** [resilience-calc.vercel.app](https://resilience-calc.vercel.app)

> **Preliminary decision support only.** This calculator does not establish building safety, predict an actual disaster, certify code compliance, or replace an inspection and assessment by a qualified structural engineer. A high BRS is not a probability that a building will remain safe.

## Contents

- [Project context](#project-context)
- [Features and scope](#features-and-scope)
- [User guide](#user-guide)
- [Understanding the results](#understanding-the-results)
- [Calculation methodology](#calculation-methodology)
- [Advanced parameters](#advanced-parameters)
- [AI recommendations](#ai-recommendations)
- [Data, privacy, and offline use](#data-privacy-and-offline-use)
- [Disclaimers and limitations](#disclaimers-and-limitations)
- [Developer setup](#developer-setup)
- [Testing and maintenance](#testing-and-maintenance)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [References and credits](#references-and-credits)

## Project context

R.E.S.I.L.I.E.N.C.E. explores how a simplified web application can bring earthquake and wind calculations into one assessment workflow. Users can compare scenarios, inspect the assumptions behind a result, and identify topics to discuss with a qualified professional.

The repository implements a research workflow using a ground-motion equation attributed in the source to Fukushima and Tanaka (1990), a wind velocity-pressure calculation referencing NSCP 2015, an illustrative wind fragility curve, and a weighted combination of the two model scores. These references explain the implementation's basis; they do not demonstrate that the complete application has been independently validated for engineering practice.

The tool is intended for educational exploration, research demonstrations, and preliminary scenario comparison. It is not a complete structural analysis package, a real-time hazard monitoring service, or an official government hazard report.

This README describes the repository implementation. The deployed website may differ until the latest changes are deployed.

## Features and scope

| Feature                 | Current behavior                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| Guided assessment       | Four steps: Site, Building, Hazard, and Review                                                              |
| Location selection      | Interactive Leaflet map, draggable marker, map layers, coordinate copying, and optional browser geolocation |
| HazardHunterPH link     | Opens an external reference tool; users obtain and enter fault distance manually                            |
| Earthquake calculation  | Estimates PGA and converts it to a normalized earthquake score                                              |
| Wind calculation        | Calculates velocity pressure and an illustrative fragility-based typhoon score                              |
| Combined result         | Displays BRS, a model danger category, individual hazard scores, and a comparison chart                     |
| Editable assumptions    | Soil multiplier, wind factors, fragility parameters, scoring bounds, and hazard weights                     |
| Recommendations         | Local rule-based guidance, with optional Gemini-generated guidance and a browser cache                      |
| Assessment history      | Stores up to 50 assessments in the current browser, including calculation snapshots                         |
| Presentation            | Responsive layout and selectable themes                                                                     |
| Install/offline support | Web app manifest and service worker; cached pages/assets can support limited offline use                    |

The current application has no user accounts, cloud-synchronized assessment history, built-in report export, automatic fault-distance calculation, or live PAGASA/PHIVOLCS data feed.

## User guide

### 1. Prepare your information

Gather the site's location, distance to the nearest active fault, soil classification, building dimensions, construction material, roof form, and configuration. You will also need a supported wind-speed scenario, an earthquake magnitude scenario, and a wind exposure category.

The form is prefilled with demonstration values. Replace them with values appropriate to your scenario. Defaults are not automatically retrieved or verified for the selected location.

### 2. Set the site

1. Open [the calculator](https://resilience-calc.vercel.app).
2. Click the map or drag the marker to the intended site. Alternatively, choose **Use my location** and allow browser location access. Check the selected point; device location is not necessarily the building location.
3. Click the displayed latitude or longitude to copy it.
4. Open **HazardHunterPH**. Locate the same site using its coordinate or map tools. If the link does not select the site automatically, enter the copied coordinates manually.
5. Find the nearest-active-fault distance in the external assessment, check its units, and enter the distance in **kilometers** in this calculator.
6. Choose **Rock**, **Medium soil**, or **Soft soil**. Use supported site information; the map does not determine the soil category.
7. Leave advanced soil parameters at their defaults for a demonstration, or enter a justified custom multiplier for a research scenario.
8. Select **Next: Building**.

The selected coordinates provide location context. Moving the map marker does **not** update fault distance, soil type, wind speed, or the numerical hazard scores automatically. External website controls may change.

### 3. Describe the building

| Input            | Unit or available choices                              | Form requirement                   |
| ---------------- | ------------------------------------------------------ | ---------------------------------- |
| Height           | Meters                                                 | Greater than 0, no more than 150 m |
| Floors           | Whole number                                           | At least 1                         |
| Length and width | Meters                                                 | Greater than 0                     |
| Material         | Reinforced concrete, structural steel, timber, masonry | Select the applicable category     |
| Roof             | Flat, gable, hip, monoslope                            | Select the applicable category     |
| Configuration    | Regular, irregular                                     | Select the applicable category     |

Height affects the wind exposure coefficient. Material, roof type, and configuration affect the **default** wind fragility mapping. Floors, length, and width are recorded and included in recommendation context, but do not change the current score equations.

These categories are simplified inputs. They do not capture reinforcement details, connection quality, deterioration, construction defects, or the actual strength of the building.

### 4. Set the hazard scenario

- **Design wind speed:** enter a positive value in **km/h** for the scenario being studied. The calculator converts it to m/s internally. It does not select a code wind speed from the map or fetch a current weather forecast.
- **Earthquake magnitude:** enter a scenario magnitude from **0.1 to 9.5**, labeled Mw in the application. The accepted input range is not a statement that the underlying equation is validated across that entire range.
- **Wind exposure:** select B, C, or D. The interface describes these broadly as urban/suburban, open terrain, and coastal/flat water. These labels do not replace a professional determination of exposure.
- **Advanced parameters:** change these only when you can justify the assumptions. See [Advanced parameters](#advanced-parameters).

Use compatible input sources and units when comparing scenarios. An earthquake magnitude is a scenario input, not a prediction that an earthquake will occur.

### 5. Review and calculate

Check all inputs and the calculation parameter summary in **Review**. Use **Back** or the previously reached step indicators to correct information, then select **Calculate resilience**.

The numerical assessment runs in the browser. The app attempts to save the assessment locally and immediately prepares rule-based recommendations. If a matching AI cache entry is unavailable, it requests AI recommendations from the server.

If local saving fails, the calculated result remains available, but it may not appear in History. Read any message shown by the app.

### 6. Read recommendations and history

- Review the individual scores as well as the combined BRS.
- Expand **Calculation parameters** and **How to interpret** to inspect assumptions and limitations.
- Treat recommendations as discussion points for a qualified structural engineer, not instructions to alter the structure yourself.
- Choose **New assessment** to start another scenario.
- Choose **View history** or **History** to inspect saved scores and parameter snapshots.
- **Delete** removes an individual assessment. **Clear all** removes saved assessment history after confirmation.

History is specific to this browser and website origin. It does not synchronize across devices. AI recommendations are cached separately and are not stored as part of each history record. Clearing history does not clear that separate recommendation cache.

## Understanding the results

| Output                         | Meaning within this model                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Earthquake hazard score, HE    | A 0–100 score obtained by normalizing estimated PGA; higher means greater modeled ground-motion demand              |
| Typhoon hazard score, HT       | A 0–100 score derived from the selected wind fragility curve; higher means a higher modeled curve value             |
| Building Resilience Score, BRS | The complement of the weighted combined score; higher means lower combined model scores                             |
| PGA                            | Estimated peak ground acceleration, displayed in g and gal                                                          |
| Velocity pressure qz           | Wind velocity pressure, displayed in kPa; internally calculated in Pa                                               |
| Illustrative fragility         | The selected curve's output, shown as a percentage; the default curve is not calibrated to a specified damage state |
| Danger category                | A label derived from the combined model score, not an official building safety classification                       |

The combined score is classified **before rounding**:

| Combined model score   | Category |
| ---------------------- | -------- |
| 0 to 25                | LOW      |
| Greater than 25 to 50  | MODERATE |
| Greater than 50 to 75  | HIGH     |
| Greater than 75 to 100 | CRITICAL |

Individual hazard labels use the same thresholds. A combined score can conceal a high individual score, so examine both hazards separately.

**Example:** with HE = 60, HT = 20, and equal weights, the combined score is 40, BRS is 60/100, and the category is MODERATE. This does **not** mean a 60% probability of safety. The dashboard percentage is a display of the normalized BRS.

## Calculation methodology

The following equations document the code's behavior, not an independently verified design procedure. The current assessment model identifier is `paper-2026-09-parameters-2`.

### Earthquake component

The implemented ground-motion equation is:

```text
log10(A) = 0.41M - log10(R + 0.032 × 10^(0.41M)) - 0.0034R + 1.30
PGA_gal = A × soilMultiplier
PGA_g = PGA_gal / 980.665
HE = round(clamp(100 × (PGA_g - PGAmin) / (PGAmax - PGAmin), 0, 100))
```

`M` is the entered magnitude and `R` is the entered fault distance in kilometers. `A` is in gal (cm/s²). Default normalization bounds are 0 and 0.8 g. Default soil multipliers are rock = 0.60, medium = 0.87, and soft = 1.40.

The suitability of the magnitude scale, distance definition, equation, and soil multipliers for a particular Philippine site requires independent review. The 0.8 g upper bound is a scoring assumption, not a universal structural safety limit. Building material and geometry do not enter the current earthquake-score equation.

### Wind component

```text
V = windSpeed_kph / 3.6
qz = 0.613 × Kz × Kzt × Kd × V²
P = Φ(ln(qz / θ) / β)
HT = round(clamp(100 × P, 0, 100))
```

`qz` is in Pa, `Kz` is interpolated from the bundled height/exposure table, `Kzt` is the topographic factor, and `Kd` is the directionality factor. `Φ` is the standard normal cumulative distribution function. At zero pressure, the engine returns zero fragility; the user form requires a positive wind speed.

Default median parameter `θ` is computed as:

```text
θ = materialBase × roofMultiplier × configurationMultiplier
```

| Default mapping          | Values                                               |
| ------------------------ | ---------------------------------------------------- |
| Material base, Pa        | Concrete 4800; steel 4200; masonry 3200; timber 2400 |
| Roof multiplier          | Hip 1.20; gable 1.00; monoslope 0.90; flat 0.80      |
| Configuration multiplier | Regular 1.00; irregular 0.85                         |
| Dispersion, β            | 0.35                                                 |

These are **illustrative prototype values**, not verified material capacities or calibrated building fragility curves. A custom curve replaces the default θ and β; the material/roof/configuration multipliers are not applied again.

Velocity pressure is not a complete wall, roof, or connection design pressure. The current calculation does not perform a complete structural wind-load or resistance check.

### Combined score

For HE and HT on a 0–100 scale:

```text
combinedScore = wE × HE + wT × HT
BRS = 100 - combinedScore
wE + wT = 1
```

Default weights are 0.50 each. The stored BRS and displayed scores are rounded. The combined index is a weighted model summary; it does not calculate joint hazard probability, expected monetary loss, or a building's probability of survival.

## Advanced parameters

| Parameter                | Default           | Accepted condition / behavior                                                 |
| ------------------------ | ----------------- | ----------------------------------------------------------------------------- |
| Soil mode                | Default           | Custom mode uses the supplied multiplier instead of the soil-category mapping |
| Custom soil multiplier   | Initially 0.87    | Positive; changing soil category does not update this custom value            |
| Kzt                      | 1.00              | At least 1                                                                    |
| Kd                       | 0.85              | Greater than 0 and no more than 1                                             |
| Kz                       | Calculated        | Read-only; derived from height and exposure                                   |
| Fragility mode           | Default           | Custom mode uses supplied θ and β                                             |
| Custom θ                 | Initially 4800 Pa | Positive; must be appropriate to qz in Pa as the intensity measure            |
| Custom β                 | Initially 0.35    | Positive lognormal dispersion                                                 |
| Damage-state description | Empty             | Required for a custom fragility curve                                         |
| Curve source/reference   | Empty             | Required for a custom curve; recorded as supplied, not verified               |
| PGA minimum              | 0 g               | Nonnegative                                                                   |
| PGA maximum              | 0.8 g             | Greater than the minimum                                                      |
| Earthquake weight        | 50%               | From 0 to 100%; typhoon weight is the remainder                               |

Changing scoring bounds or weights changes the meaning of comparisons. Compare assessments using consistent model versions and assumptions. Saved records include resolved parameter snapshots; legacy records may not contain those snapshots and are not automatically recalculated.

## AI recommendations

AI supplements the numerical assessment; it does not calculate or modify HE, HT, BRS, or the danger category.

### Request flow

1. Generate rule-based recommendations locally for the current assessment.
2. Check the browser cache for an exact match to the recommendation context and version.
3. On a cache miss, send the assessment input to `POST /api/recommendations`.
4. Validate and allowlist the input on the server, then recalculate the scores. Browser-supplied results are not trusted.
5. If `GEMINI_API_KEY` is configured, request 3–4 recommendations from `gemini-2.5-flash` using a JSON array schema.
6. Validate the output as nonempty strings before displaying it. Invalid responses, missing configuration, provider failures, and timeouts use rule-based guidance instead.

The prompt includes building characteristics, soil type, fault distance, hazard inputs, model outputs, and resolved parameters. It asks for preliminary professional-review guidance and prohibits invented code citations, claims of compliance, or unsupported structural prescriptions. These instructions reduce risk but do not guarantee factual correctness.

### User-facing states

| Label                                               | Meaning                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| Generating recommendations…                         | The AI request is pending; local rule-based guidance remains visible |
| AI-generated recommendations                        | Validated AI text was returned for this request                      |
| Previously generated recommendations                | A matching AI response was reused from this browser's cache          |
| AI unavailable. Showing rule-based recommendations. | The app retained or received deterministic fallback guidance         |

Both AI and rule-based advice need professional review. Rule-based output can contain more than four items because multiple conditions can apply.

### Limits and cache

- Server AI deadline: **20 seconds**; browser request deadline: **25 seconds**.
- New assessments and page cleanup cancel pending browser requests; stale responses cannot overwrite the current assessment.
- Cancellation does not guarantee cancellation of provider-side processing or charges.
- Only successful AI responses are cached: **seven-day expiry**, up to **50 entries**.
- Cache keys use exact recommendation context and a version identifier. Old-version, invalid, and expired entries are discarded when encountered.
- API request bodies are limited to **16 KB**. Model-parameter text fields are limited to **1,000 characters** by server validation.
- The endpoint applies a best-effort limit of **10 requests per minute per client address per running server instance**.
- Invalid requests return HTTP 400; rate-limited requests return HTTP 429 with `Retry-After`. Provider failures for valid requests return HTTP 200 with `recommendationsFrom: "fallback"`.

The endpoint is unauthenticated. Its in-memory limiter resets on cold starts and does not coordinate across serverless instances. A shared or edge rate limiter and provider usage controls are needed for public operation; browser caching is not an abuse-prevention control.

## Data, privacy, and offline use

### Where information goes

| Destination             | Data and purpose                                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser localStorage    | Up to 50 assessment records, including coordinates, inputs, results, and parameter snapshots; separate AI cache entries and theme preference |
| Application server      | The assessment input, including coordinates, when a recommendation request is made; validation, recalculation, and AI request preparation    |
| Google Gemini           | Selected building/site context, hazard values, scores, and parameters; the prompt builder omits the coordinate fields                        |
| Map and asset providers | Requests to Google map tiles, Google Fonts, and unpkg for relevant resources                                                                 |
| HazardHunterPH          | Selected coordinates are included in the external link when you open it                                                                      |

Do not include confidential or personally identifying information in custom reference or damage-state fields: these free-text values can be included in the AI context. Omitting coordinate fields from the prompt does not remove locations or other sensitive details typed into those fields.

The repository does not implement a database of assessments or a user-account system. Hosting and third-party services may process request metadata under their own configurations and policies; this README does not promise that no external logs are retained.

Browser data is not an encrypted backup. Other people using the same browser profile may be able to view saved history. Clearing website data, using private browsing, or changing browser/device can remove or isolate records. To remove history **and** recommendation caches, clear this site's data in browser settings; this also removes cached assets and preferences.

### Offline behavior

The service worker caches same-origin assets and previously fetched navigation pages. After a successful online visit, some pages and local calculations may work offline if the necessary resources remain cached. First-time offline access and complete offline availability are not guaranteed.

New AI generation, external maps, and HazardHunterPH require internet access. Previously cached recommendations or local rule-based guidance can remain available without a successful AI request. The service worker does not cache POST recommendation responses; AI caching is managed separately in localStorage.

## Disclaimers and limitations

1. **Not a safety certification.** LOW, HIGH, and other labels describe this model's score ranges. They are not official inspection findings, occupancy decisions, or declarations that a structure is safe or unsafe.
2. **Not an engineering design.** Outputs do not replace site investigation, structural analysis, geotechnical advice, professional design, permits, or code review. Do not perform structural alterations based solely on recommendations.
3. **No automatic code compliance.** References to NSCP 2015 identify the implementation's stated basis. They do not establish completeness, applicability, or compliance with the requirements governing a particular project.
4. **Input-dependent results.** The app does not verify user-entered distances, soil, wind speed, magnitude, building characteristics, or custom sources. Demonstration defaults may be unsuitable for the site.
5. **Limited hazard coverage.** The current equations cover a simplified earthquake ground-motion scenario and wind scenario. They do not assess flooding, storm surge, landslides, liquefaction, tsunami, fire, or all secondary and cascading hazards.
6. **Limited structural detail.** Actual construction quality, age, deterioration, connections, reinforcement, foundations, occupancy, and observed damage are not comprehensively modeled. The earthquake score does not model building-specific seismic capacity.
7. **Illustrative assumptions.** Default fragility parameters, soil factors, normalization bounds, weights, and category thresholds require research justification and calibration. A custom source is not independently checked by the app.
8. **AI can be wrong.** Generated guidance may be incomplete, misleading, or inappropriate. JSON validation checks format, not engineering correctness. Rule-based advice also requires review.
9. **Not an emergency tool.** Do not use the calculator to make evacuation or re-entry decisions. Consult official advisories and qualified local authorities for an actual event.
10. **No implied endorsement.** References or links to government agencies, engineering standards, and service providers do not imply that those organizations endorse or certify this project.

## Developer setup

### Stack

Svelte 5, SvelteKit 2, TypeScript, Vite 8, Tailwind CSS 4, DaisyUI 5, Leaflet, the Google Gen AI SDK, and the SvelteKit Vercel adapter. See `package.json` and `pnpm-lock.yaml` for dependency declarations and resolved versions.

### Prerequisites

- A Node.js version supported by the installed Vite release. The locally inspected Vite package declares `^20.19.0 || >=22.12.0`; development verification used Node.js 24.
- pnpm, matching the repository's lockfile workflow.
- A Gemini API key only if you want AI generation; calculations and rule-based recommendations work without it.

### Install and run

From the project directory:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by the development server. The production website is [resilience-calc.vercel.app](https://resilience-calc.vercel.app).

To enable AI, create a `.env` file in the project root:

```dotenv
GEMINI_API_KEY=your_gemini_api_key_here
```

Restart the development server after changing environment configuration. Keep the key server-side: do not use a public environment-variable prefix, paste a real key into this README, or commit `.env`. Environment files are ignored by the repository's `.gitignore`.

No additional application environment variable is currently required. Without a key, the endpoint returns rule-based recommendations.

## Testing and maintenance

| Command            | Purpose                                                           |
| ------------------ | ----------------------------------------------------------------- |
| `pnpm dev`         | Start the development server                                      |
| `pnpm check`       | Synchronize SvelteKit types and run Svelte/TypeScript diagnostics |
| `pnpm check:watch` | Run diagnostics in watch mode                                     |
| `pnpm test`        | Run engine, storage, and recommendation regression tests          |
| `pnpm lint`        | Check formatting with Prettier; this is not an ESLint pass        |
| `pnpm format`      | Format the repository; review the resulting changes               |
| `pnpm build`       | Build the app and generate Vercel deployment output               |
| `pnpm preview`     | Preview the production app locally after building                 |

Engine tests cover formula behavior, boundaries, sensitivity, input rejection, parameter overrides, snapshot compatibility, and local storage failures. Recommendation tests cover caching, expiry, blocked storage, offline fallback, overlapping requests, cancellation, timeouts, validation, prompt context, server recalculation, and rate limits.

Recommendation tests mock the AI provider and test state logic without a browser DOM. They make no billable Gemini calls and do not validate the engineering quality of actual AI responses. Passing tests is not a scientific validation of the model.

When changing numerical behavior, update relevant tests and the assessment `modelVersion` as appropriate. When changing the AI model, prompt, or response contract, update `RECOMMENDATION_VERSION` in `src/lib/recommendation-contract.ts` to invalidate incompatible caches. Keep documentation aligned with the actual calculation path.

## Deployment

The repository configures `@sveltejs/adapter-vercel` in `vite.config.ts`. It requires server support for `/api/recommendations`; it is not a static-only deployment.

1. Import the repository into Vercel and use its SvelteKit framework configuration.
2. Use the repository root, install dependencies with the lockfile, and build with `pnpm build`.
3. Set `GEMINI_API_KEY` in the intended Vercel environments if AI generation is desired. Do not expose it to the browser.
4. Configure a shared rate limiter or a Vercel Firewall rule for `POST /api/recommendations`. Review availability and limits for the hosting account.
5. Set provider quotas/budget controls and ensure the function runtime accommodates the AI request deadline and request overhead.
6. Deploy, then verify assessment calculation, history, AI/fallback behavior, mobile layout, and the configured public domain.

The intended public URL is [https://resilience-calc.vercel.app](https://resilience-calc.vercel.app). Editing the repository does not publish changes automatically unless the project's deployment integration is configured to do so.

**Windows build note:** local verification encountered `EPERM` when the Vercel adapter tried to create deployment-package symlinks, after the client and server bundles had compiled. A Windows environment with the required symlink privileges or a Linux/Vercel build environment may be needed to complete packaging. Do not treat successful compilation alone as a completed deployment build.

## Project structure

```text
src/
  routes/
    +page.svelte                  Assessment workflow
    +layout.svelte                Shared layout and browser initialization
    history/+page.svelte          Locally saved assessment summaries
    api/recommendations/+server.ts  Validated AI/fallback endpoint
  lib/
    components/                   Forms, map, dashboard, parameter views, theme UI
    engine/                       PGA, wind, scoring, parameters, validation, rules
    data/                         Bundled tables and supporting data
    server/recommendations.ts     API input validation, body limit, rate limiter
    states/recommendations.svelte.ts  Request lifecycle and browser recommendation cache
    recommendation-contract.ts    Context, cache version, and output validation
    storage/localStorage.ts       Assessment persistence
    types.ts                      Shared input/result types
  service-worker.ts               Same-origin asset and navigation caching
static/                          Manifest and app icons
scripts/
  test-engine.cjs                 Engine/storage regressions
  test-recommendations.cjs        Mocked AI/state/API regressions
  audit-engine.cjs                Additional exploratory calculation probes
vite.config.ts                   Build configuration and Vercel adapter
```

The active engine and imported tables are the source of truth. A supporting data file's presence does not necessarily mean it is used by the current assessment path. Local research documents under `resources/` are ignored by Git and may not be available in a fresh checkout.

## Troubleshooting

| Symptom                                                   | What to check                                                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Map or external resources do not load                     | Internet connection, browser restrictions, and external-provider availability; map tiles are not available from the app's offline cache           |
| Location permission is denied                             | Select the site manually on the map; geolocation is optional                                                                                      |
| Coordinates do not open the expected HazardHunterPH point | Enter copied coordinates in the external site's coordinate search and confirm the site                                                            |
| Moving the marker does not change the result              | Fault distance and hazard inputs are manual; update them for the new site                                                                         |
| Rule-based recommendations appear                         | Check the server key, provider availability/quota, request timeout, rate limit, or input validity; the numerical assessment does not require AI   |
| Older AI wording appears                                  | A matching response may be cached for seven days; developers should bump the recommendation version when changing the prompt                      |
| Assessment history is missing                             | Confirm the browser/profile/domain; check whether storage was blocked, cleared, or used in a private session; only the latest 50 records are kept |
| Calculation succeeds but saving fails                     | Browser storage may be unavailable or full; the displayed result is not necessarily persisted                                                     |
| Results differ between assessments                        | Compare inputs, resolved parameters, weights, and model versions; displayed values are rounded                                                    |
| App appears outdated                                      | Reload while online; clearing site data can remove stale caches but also deletes local history and preferences                                    |
| Local Vercel packaging fails with symlink `EPERM`         | Check Windows symlink permissions or use a suitable Linux/Vercel build environment                                                                |

## References and credits

- **Research context:** the local September 2026 R.E.S.I.L.I.E.N.C.E. manuscript identifies Rich Mee Becerro, Jeush Francis Rey D. Dela Calzada, and Jan Marie Toquero as authors, with Mark Fel Jhon Y. Manlangit as research adviser.
- **Application developer:** [jiMcaN](https://jimcan.net), as credited in the application footer.
- **External site-hazard reference:** [HazardHunterPH / GeoRiskPH](https://hazardhunter.georisk.gov.ph/), a government hazard-assessment resource. This application links to it; it does not automatically import its reports.
- **Weather and tropical-cyclone information:** [DOST-PAGASA](https://www.pagasa.dost.gov.ph/). This application does not fetch a live forecast or automatically select a design wind speed.
- **Calculation references named in the code:** Fukushima and Tanaka (1990) for the implemented ground-motion equation and NSCP 2015 for the stated wind calculation basis. Verify primary references, applicability, and governing requirements independently.
- **Supporting services:** Google Gemini for optional AI text, Google map tiles and fonts, Leaflet for the map interface, and Vercel for hosting.

No project license is declared in the current repository. Do not assume that public access to the application grants reuse rights to its code, research documents, third-party standards, or map imagery. Third-party dependencies and services retain their own licenses and terms.
