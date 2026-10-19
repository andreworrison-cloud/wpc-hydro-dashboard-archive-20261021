# Operational FFG tendencies

Three rainfall durations (1, 3, 6 hours) and an independent tendency selector (6, 12, 24 hours; default 24) under Antecedent Hydrologic Conditions → RFC · FFG Tendencies.

Reviewed source and case evidence: [research/ffg-tendency](https://github.com/andreworrison-cloud/wpc-hydro-dashboard/tree/research/ffg-tendency/review/ffg-tendency).

## Science and display
Current minus exactly earlier hourly WPC `5kmffg_YYYYMMDDHH.g2` guidance, on identical native grids, converted from mm to inches after subtraction. Each endpoint must pass the existing RFC coverage and parameter checks. Missing cells stay unavailable; no nearest-time substitutes or zero filling. No cycle-file family substitutions. Guidance changes can reflect soil/streamflow changes or RFC revisions; blue = lower guidance / possible wetting, brown = higher guidance / possible drying. The reviewed West Virginia transition remains evidence against causal attribution from tendency alone.

Overlays: 4000 × 2538, EPSG:3857, bounds −126/24/−66/50, reviewed palette, neutral interval ±0.01 inch, bilinear display values with nearest paired-valid mask. State borders are separate sharp map reference layers. Source grid is nominal 5 km; display resolution adds no native information.

Both snapshot endpoints and both encoded RFC reference cycles appear in the legend. Snapshot time does not establish the issue time of each RFC. Latest snapshot warns at 2 hours and hides at the earliest of snapshot +3 hours or reference cycle +9 hours, matching the operational FFG source policy. Earlier endpoints are qualified relative to their own snapshot times. Per-lookback failures retain only the last verified map until its original deadline; expiry never resets on retrieval.

## Durability and scheduling
`data/ffg-tendency` is isolated from code and other datasets. It retains a 72-hour buffer of acquired raw hourly snapshots plus inputs needed by the three active lookbacks. It does not backfill every hour on initial activation. Current imagery and source hashes are verified before an atomic branch replacement. Each publication is a parentless snapshot with an exact-head force-with-lease; maximum reachable payload 512 MiB. GitHub controls reclamation of unreachable objects. No raster history is accumulated on main.

The existing cron-job.org RFC FFG dispatcher (hourly at :50 UTC) invokes `publish_rfc_ffg.yml`. Its independent `tendency` job calls `publish_ffg_tendency.yml`, alongside the official FFG job; failure in one does not skip the other. No second GitHub cron or new external credentials are needed. Code-change pushes bootstrap a first publication; normal dispatches require the durable branch to exist.

## Initial validation
A local live-source run accepted all nine maps with exact hourly endpoints ending 19 October 2026 15Z. For 3-hour duration each lookback had 486,606 paired cells and zero new-only/old-only cells. Initial reachable payload was 15.05 MiB (four raw snapshots and nine images). Numerical missingness/sign tests, exact-endpoint failures, freshness/expiry tests, durable restore, concurrent-writer rejection, parentless retention and storage-budget tests passed. Menu test exercised all selector choices and three duration controls. Dashboard validation: 170 registered layers (including the concurrent RAP GDI rollout). Browser review and first GitHub publication are tracked in the rollout completion evidence.
