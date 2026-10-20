# Hydrologic priorities and operational development pathway
Date: 2026-10-20
Status: proposed research pathway; no H9 scores or alerts activated.

## Priority order
1. RFC boundaries under Dashboard Utilities: code prepared in this PR; browser and service-response verification required before deployment.
2. H9 Experimental Hydrologic Susceptibility: numerical-input audit and explainable case-review prototype.
3. Forecast Rainfall Surplus Above FFG: numerical HRRR audit and review maps, developed alongside H9.
4. Burn severity: high-priority parallel integration coordinated with Sol; feed the post-fire branch of H9 when scientifically reviewed.
5. NLDAS-3 dynamic land states: future integration after availability, timing and numerical validation.
H7 matched-time comparisons remain useful supporting validation, but are no longer the leading standalone work item.

## RFC implementation and release gate
NOAA NWS reference service FeatureServer layer 11 provides 13 polygon RFC areas of responsibility. Query requests WGS84 GeoJSON and approximately 0.002-degree display generalization; this is cartography, never an analysis mask. Source:
https://mapservices.weather.noaa.gov/static/rest/services/nws_reference_maps/nws_reference_map/FeatureServer/11
https://www.weather.gov/gis/RFCBounds

Independent default-off Utilities toggle, yellow line with dark casing above rasters, noninteractive so hazard clicks pass through. Reset defaults uses the existing reference-overlay registry. Live NOAA request on first activation, cached in memory for the page session, no recurring publishing job. Timeout/error message supports retry with off/on. Does not modify FFG or infer why a seam exists.

Required before merge:
- Validate actual GeoJSON response, all 13 RFC identities and representative geometry, browser CORS.
- Verify on/off, off during pending fetch, rapid toggling, service timeout/retry, reset defaults.
- Inspect all basemaps with FFG/soil-moisture rasters; confirm pane ordering, state borders, pan/zoom, mobile sidebar and underlying warning clicks.
- Run existing dashboard validation and JavaScript syntax checks.
Local execution/browser environment was unavailable during preparation. Source/API schema inspected; no claim of executed browser tests.

## H9: two questions, two outputs
A. Susceptibility: where would additional intense rainfall produce an unusually sensitive hydrologic response?
B. Developing threat: where does observed/forecast rainfall overlap that susceptibility now or soon?

Keep the susceptibility field distinct from a rainfall-driven threat layer. Initial outputs should show the drivers, timestamps and missing coverage rather than an uncalibrated numerical probability. A high-resolution rendering does not increase information content beyond native inputs.

### Explainable component structure
- Wetness-driven response: shallow/deep SPoRT RSM and changes, SPoRT percentile context, NWM saturation with its own definition; evaluate alternatives before combining correlated moisture estimates.
- Terrain and runoff concentration: slope, contributing area and basin geometry; slope alone is not a universal flash-flood ranking.
- Infiltration/urban context: HSG, soil texture, imperviousness and land cover. Do not imply the national layers resolve local drainage capacity.
- Post-fire response: reviewed burn severity, burned fraction within contributing basin, fire age/recovery, slope, and short-duration rainfall intensity. Preserve explicit unknown coverage.
- FFG and tendencies: useful reference/benchmark; if FFG enters the model, document overlap with moisture inputs and use ablation tests to avoid double-counting.
- Snow/frozen-ground regimes: identify as outside initial warm-season prototype scope until explicitly modeled and validated.

First review bundle: separate component panels and basin summaries for wet rural, urban, steep-terrain and post-fire examples plus heavy-rain non-events. Do not invent numerical weights to produce a polished national composite. Begin with common analysis geometry and retain each input's native resolution/validity. Compare native precipitation structure and basin averages; avoid single-pixel noise dominating a basin score.

### Burn severity implications
A dry background soil-moisture signal must not automatically suppress a reviewed post-fire hazard signal. Burn footprint alone does not establish burn severity. Satellite spectral burn severity is not interchangeable with field soil burn severity or a calibrated runoff coefficient.

Use official USGS assessment layers/thresholds where available, with their geographic and storm-duration limits. Debris-flow likelihood and flood susceptibility remain separately named hazards. Do not extrapolate a western-US debris-flow model nationally without validation. Burn recovery is time-dependent; no universal decay period or arbitrary multiplier is adopted.

Relevant primary sources:
https://landslides.usgs.gov/hazards/postfire_debrisflow/
https://pubs.usgs.gov/publication/ofr20161106
https://pubs.usgs.gov/publication/70275149

### Near-term threat and alert pathway
Proposed review windows: 0–1, 1–3 and 3–6 hours, with source-specific horizons.
Use observed radar rainfall/intensity and a separately audited extrapolation or numerical forecast. HRRR alone is not a radar-extrapolation nowcast. Preserve observed versus predicted portions, avoid double-counting overlap, and record exact time support.

After validation, prototype forecaster-facing attention cues: basin/area, valid window, dominant drivers, observed/forecast trigger, confidence/coverage, onset and last update. Require persistence/hysteresis and expiration rules to prevent flickering or stale cues. Start in silent shadow mode; no automated public warnings or outbound notifications.

### Verification and promotion gates
1. Numerical audit: units, depth, accumulation periods, grids, source/valid/retrieval times, latency, missingness and archive access. No analysis from PNG colors.
2. Retrospective cases: spatially and temporally independent storms including non-events, regional and seasonal coverage, urban/post-fire strata. Use independent reports/gauges/impacts; warnings are a decision record, not sole truth. Account for uneven reporting.
3. Benchmarks: FFG-only, rainfall-only and individual wetness inputs. Evaluate incremental skill and ablations. Prevent future data/reanalysis leakage.
4. Metrics: event detection, false alarms, lead time, spatial displacement, reliability if probabilities are developed, coverage and availability. Report uncertainty and sample counts.
5. Forecaster review and shadow operations: agree thresholds and acceptable alert load from evidence; retain experimental labeling.
6. Production: versioned immutable inputs/outputs, atomic publication, last-valid retention only until explicit expiry, rollback and monitoring. cron-job.org dispatch only; no duplicate GitHub cron. Scheduling and retention sized after measuring runtime/data volumes.

## Forecast Rainfall Surplus Above FFG
Proposed first candidate: deterministic HRRR CONUS, native nominal 3-km grid, hourly cycles. This is a candidate pending numerical ingest audit, not a completed product.
Official references:
https://rapidrefresh.noaa.gov/hrrr/
https://www.nco.ncep.noaa.gov/pmb/products/hrrr/hrrr.t00z.wrfsfcf02.grib2.shtml

For duration D in {1,3,6} hours:
S_D(x,t) = QPF(x,[t,t+D]) - FFG_D(x,t_ref), in inches.

Retain signed values; highlight positive surplus. This is a forecast amount relative to present guidance, not exceedance probability, runoff depth, remaining infiltration capacity or flood severity. A negative surplus does not rule out flooding, especially urban/post-fire cases.

Start with explicit individual forecast windows and matched FFG duration. Later, a maximum rolling 3-hour surplus within the next 12 hours must retain the maximizing window at every pixel; never subtract 3-hour FFG from 12-hour rainfall.

Audit requirements:
- Inspect APCP start/end steps and units from GRIB metadata. Difference cumulative fields only within the same cycle; confirm monotonicity and resets. Reject incomplete windows; no stitched mixed-cycle accumulations.
- Pair each product with the newest valid FFG snapshot available at product creation, retaining snapshot and RFC reference times. Never leak future FFG into historical evaluation.
- Freeze that FFG pairing within the product; state clearly that guidance is not forecast to evolve during the rainfall window.
- Initial scientific review uses native HRRR spatial structure with explicitly documented FFG resampling, plus an area-averaged comparison. A ~5-km FFG input is not refined to physical 3-km guidance by resampling.
- Record model initialization, publication/availability, forecast start/end, source grid, FFG times, retrieval and derived expiration separately.
- Evaluate convective displacement and model-cycle sensitivity; ensemble member surpluses can follow. PMM is not an exceedance probability.
- Set operational age/horizon limits after measured latency and case review. No untested numeric freshness policy is activated.

Review deliverables: 1/3/6-hour panels, paired QPF and FFG, clicked-point arithmetic, narrow convective maximum and broad rainfall cases, forecast-cycle comparison, missing/old-guidance cases and proposed legend/freshness wording.

## NLDAS-3 readiness
NASA's page inspected 2026-10-20 still describes NLDAS-3 as in development, publicly available forcing, and expected daily land-state/routing outputs:
https://ldas.gsfc.nasa.gov/nldas/v3
Do not conflate forcing availability with soil-moisture output availability. Reserve an adapter for published dynamic fields, with units, depth definitions, daily averaging, latency and version checks. Daily fields may improve antecedent context but do not themselves supply subhourly nowcasting.
