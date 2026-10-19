# H7 complementary antecedent-wetness audit — 19 October 2026

Research only. No operational layers, numerical values, schedules or freshness limits changed by this audit.

## Decision
Use SPoRT RSM, SPoRT RSM changes, NWM saturation and RFC FFG tendency as separately labeled complementary evidence. Do not average their percentages, subtract NWM saturation from SPoRT RSM, or construct an agreement score from common numeric thresholds. The variables have different normalization, depths, time support and spatial coverage.

| Product | Quantity and depth | Native support | First comparison role |
|---|---|---|---|
| SPoRT shallow RSM | State between wilting and saturation, 0–10 cm | ~3 km / 0.03° daily 00Z numerical feed | Near-surface antecedent state |
| SPoRT shallow 24-hour change | RSM percentage-point difference, 0–10 cm | Exact daily endpoints; dashboard-derived | Recent shallow wetting/drying |
| SPoRT deep RSM and native 7-day change | State and percentage-point change, integrated 0–200 cm | ~3 km; NASA native weekly change | Longer-memory context |
| SPoRT native 14-day deep change | Percentage points, integrated 0–200 cm | Same native feed | Secondary context |
| NWM SOILSAT_TOP | Thickness-integrated water divided by saturation capacity, upper two layers, 0–40 cm | 1-km Lambert grid; hourly analysis-assimilation files | Complementary near-surface state |
| RFC FFG tendency | Current minus exact 6/12/24-hour-earlier guidance, inches | Nominal 5-km mosaics; durations 1/3/6 hours | Changing guidance sensitivity, with qualified causal interpretation |

## Normalization and source verification
NASA defines RSM as `100 × (theta − theta_wilting)/(theta_saturation − theta_wilting)`. The NWM v3.1 / WRF-Hydro v5.4.0 code computes `SOILSAT_TOP = sum(SMC(1:2) × DZS(1:2))/sum(smcmax(1:2) × DZS(1:2))`. It does not subtract wilting-point moisture. Both reach 100% at saturation, but intermediate percentages are not numerically equivalent. Different land-model states and soil parameters further limit direct comparisons.

Decoded the entire SOILSAT_TOP field from the NOAA public AWS copy of the 19 October 00Z analysis-assimilation land file using HTTP range reads. Source metadata identifies NWM v3.1, code v5.4.0, analysis_and_assimilation. Dimensions are 1 × 3840 × 4608; x/y spacing is 1000 m. The 12,248,155 valid cells have decoded fraction range 0.00300000014–1.00000004750, median 0.611000029. Packed int32 units are `1`, scale ~0.001, valid range 0–1000 and fill −9999000. The 3,319 values infinitesimally above one are packed saturation values affected by the floating-point scale; this is not evidence of physical supersaturation or corrupted observations. The existing float32 conversion rounds those values to one.

Internal valid time confirms 19 October 00Z; internal model initialization is 18 October 21Z. These must remain separate. Captured source ETag was stable across pre/post-read checks. The evidence includes a raw-variable-array SHA-256, not a hash of the entire 121,406,343-byte NetCDF file. One file establishes current numerical access and this file's semantics; it does not qualify a multi-day time series or a cross-model agreement metric.

## Live timing and coverage snapshot
At approximately 16:21–16:23Z:
- Published NWM valid time: 19 October 10Z; retrieved 11:00:21Z. Thus approximately 6 h 23 min old at audit time. Its stored `data_age_hours: 1.0` describes age at retrieval, not current age.
- Published SPoRT RSM and change fields: 19 October 00Z, accepted about 07:16Z. Shallow change spans 18–19 October 00Z; deep changes end at the same 00Z analysis.
- Published RSM metadata contains the 0–10 and integrated 0–200 cm fields. The four-depth percentile suite is a different quantity; do not relabel its percentiles as RSM.
- SPoRT grid is 929 × 1929 with 1,290,511 valid cells. NWM and SPoRT valid-cell counts are not directly comparable because their grids and coverage differ. A common valid footprint has not yet been computed.
- Match the NWM 00Z field to SPoRT 00Z for the first spatial comparison. Show the newer NWM analysis separately and display its offset from SPoRT. Do not silently substitute a nearby NWM time or synthesize a 0–40 cm SPoRT field from the available shallow/deep products.

## NWM implementation gaps found
1. `fetch_nwm.py` determines fraction-versus-percent scaling from the array maximum rather than validating encoded units and packing. The audited file is compatible with its current calculation; no numerical scaling error was established.
2. Published valid time comes from the requested filename, without asserting equality to the internal NetCDF valid time. The audited 00Z file agrees, but an explicit contract is needed.
3. On retrieval failure it returns success when an old Mercator PNG exists, without recording delayed status. The browser displays the timestamp but does not enforce an age warning or cutoff.
4. `fetch_nwm.yml` still has a native GitHub hourly `:30` cron. Move this to an established cron-job.org dispatcher (or a dedicated external job) and remove the competing GitHub schedule when activating that route.
5. The pipeline keeps PNG/metadata on main, deletes the raw NetCDF, and lacks a reproducible numerical history for temporal NWM comparisons. Introduce bounded, hash-verified source/derivative retention before deriving changes.

These are hardening and comparability gaps, not a claim that the existing NWM map is scientifically invalid.

## Next implementation order
Harden NWM unit/time/freshness and external scheduling first. Then make a matched-00Z comparison review with separately labeled panels: SPoRT shallow state/change, SPoRT deep state/7-day change, NWM 0–40 cm saturation, and FFG tendency at explicitly stated times. Preserve native structure for visual review; any common-grid summaries must use qualified area/mask handling and must not treat unmatched soil depths as identical. No blended susceptibility score is introduced at this stage.

## Sources and reproducibility
- NOAA output definition: https://water.noaa.gov/about/output_file_contents
- NOAA file inventory: https://www.nco.ncep.noaa.gov/pmb/products/nwm/nwm.t00z.analysis_assim.land.tm00.conus.nc.shtml (historical inventory; current attributes checked numerically).
- NASA definition: https://weather.ndc.nasa.gov/sport/training/articles/20151207175408_NASA-Land-Information-System-LIS-Applications-Training/media/lis-soil-moisture-quick-guide-by-nasa-sport.pdf (2015; used for variable semantics, not current cadence).
- WRF-Hydro formula: commit 49b0fba3e859ef5288b06ec430621be03193f49e, `src/Land_models/NoahMP/phys/module_sf_noahmpdrv.F`, SOILSAT_TOP assignment; release v5.4.0 corresponds to NWM v3.1.
- `tools/audit_h7_nwm_source.py --url <NOAA NetCDF URL> --output <audit.json>` reads metadata and SOILSAT_TOP without production writes; requires fsspec, aiohttp, h5netcdf, h5py and NumPy.
- Companion JSON files freeze the published product metadata and the numerical audit at this check. Current remote products may subsequently advance.

FFG tendency rollout follow-through: PR #25 is merged; the production run 39283641953 and Pages run 39283641577 were still queued during this audit. Live browser verification remains outstanding.
