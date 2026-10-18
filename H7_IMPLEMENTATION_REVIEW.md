# H7 dynamic antecedent wetness — implementation review

Status: production activation approved by Andrew on 18 October 2026. The implementation now enables three H7 controls and extends the existing SPoRT publisher/schedule.

## Production activation update

- Public maps and status: `data/sport-lis`, under `public/change`; atomic publication includes the unchanged percentile and absolute-RSM suites.
- The existing cron-job.org job 8666661 dispatches `fetch_sport.yml` at 01:15, 07:15, 13:15 and 19:15 UTC. H7 runs during the same dispatch; no competing GitHub cron or new external job is added.
- Numeric source versions are restored from the newest verified `sport-h7-numeric-*` artifact produced by the main-branch SPoRT workflow. The rolling cache preserves versions for at least 21 days after last verification, and snapshots have a 30-day artifact retention period. Archive paths, index membership and source checksums are verified before reuse.
- A restored public H7 generation requires its numeric archive. A restore failure retains prior H7 maps/status and reports failure; it does not silently reset history. Numeric artifact upload precedes acceptance of new map publication.
- Freshness is approved at 48-hour warning and 72-hour hiding, measured from ending valid time. Production has 154 controls; `?h7Review=1` now only overrides H7 data URLs for isolated bundles.
- Local production qualification passed 38 Python tests (ingest, durable branch round trips, retention, archive corruption/path rejection and existing publication regressions), 64 display tests and the 154-layer validator.
- Initial production publish, a subsequent numeric restore, and live browser visual qualification are rollout verification items, recorded after activation.

The following initial-review notes preserve implementation history; this production update supersedes the review-only status and unimplemented-publishing statements below.

## Products

- 24-hour shallow RSM change, 0–10 cm: exact ending minus starting native float grids.
- Native NASA SPoRT 7-day deep RSM change, 0–200 cm.
- Native NASA SPoRT 14-day deep RSM change, 0–200 cm; secondary context.

All products retain signed percentage-point values. No scientific smoothing or extreme-value suppression is applied. The numerical subtraction occurs before display reprojection. Transparent map-only assets are 4000 × 2538 in EPSG:3857, with bilinear values and a separately reprojected nearest-neighbor validity mask. The signed palette is brown/drying, blue/wetting, ivory near zero; missing values are transparent. Native resolution remains approximately 3 km.

## Ingest contract

`python -m tools.sport_change_suite --suite-dir /path/to/output`

Each invocation discovers dated float products from NASA inventories. The newest date must be present in all three product inventories, and the shallow baseline must be exactly 24 hours earlier. An incomplete newest suite is not replaced by an older candidate. Source grids, ranges, masks and coverage are checked. Different endpoint masks are rejected; the audited valid-cell footprint may vary by no more than 1% and all product masks must match within the accepted suite.

The four required files are fetched together, followed by HTTP revision-validator checks. If usable validators are absent, a second content checksum is required. This detects observed source changes during retrieval; it does not establish an unexposed provider model-run identity or eliminate the possibility of a later upstream revision. Both endpoint hashes contribute to generation identity, so a revised baseline produces a new generation even when the valid date is unchanged.

Metadata records valid start/end, retrieval time, source modification time, hashes, native/derived provenance, coverage, acceptance and ingest-attempt time separately. Hash-addressed numeric versions are retained locally for at least 21 days after last verification. The review workflow preserves its complete output as a 30-day GitHub artifact. **Cross-run durable numeric restoration and atomic production publishing are not yet implemented.**

Images are staged and verified before metadata replacement. Failure retains the previous verified three-product suite. Corrupt prior images are not retained. Review freshness follows the established SPoRT 48-hour warning/72-hour hiding convention, measured from the ending valid time; this H7 policy is explicitly labeled review policy. Neither baseline age nor retrieval/check time resets freshness.

## Dashboard review

The default dashboard remains unchanged. With `?h7Review=1`, three additional controls appear under Antecedent Hydrologic Conditions. Selection is exclusive with the existing SPoRT layers. State borders, opacity, signed legends, provenance, comparison periods, source times and clock-based expiry are included. The browser verifies all image hashes and decoded dimensions before switching the whole suite. A failed image prevents partial replacement.

Generate `review/sport-change` locally with the ingest command, serve the repository over HTTP, and open `index.html?h7Review=1`. Alternatively run **Review SPoRT H7 Changes** on this branch and download its `sport-h7-review-*` artifact. Serve `dashboard-review` and use the same query parameter. The bundle intentionally uses the operational endpoints for the existing non-H7 layers. H7 review snapshots expire normally; rerun the workflow for fresh review data.

## Validation completed

- Live ingest accepted the 18 October 2026 00Z suite, including the exact 17 October shallow baseline, with post-download source revision checks. Evidence: `review/h7/change_ingest_evidence.json`.
- 17 Python tests: signed rendering, sentinel masking, range rejection, exact pairing, missing inputs, revised baseline identity, local numeric retention, partial render failure, corruption and expiry.
- 64 Node tests across H7 and both existing SPoRT adapters: metadata validation, clocks, unit/provenance/period consistency, all-image atomic swaps, failures, opacity, borders and exclusive controls.
- Existing dashboard validator passed with 151 default registered layers; review mode adds three.
- JavaScript syntax checks passed.
- Browser visual testing was attempted but the cloud browser could not reach the local HTTP server (`ERR_CONNECTION_REFUSED`). Automated contract tests are not a substitute for that visual review.

## Remaining before activation

1. Browser verification of all three controls, legends, light/dark/satellite backgrounds, zoom, opacity and alignment using the review bundle in a reachable browser environment.
2. Qualify a durable publisher and versioned numeric restore path, preserving the existing SPoRT production suites and last-valid behavior.
3. Settle H7 freshness and release policy, then enable operational controls and external scheduler dispatch. No new cron-job.org job is needed for this review stage.

Scientific context and Florida checks are preserved in `H7_DYNAMIC_WETNESS_AUDIT.md` and `review/h7/FLORIDA_FOLLOWUP.md`.
