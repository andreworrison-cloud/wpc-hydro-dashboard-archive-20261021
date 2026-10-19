# GDI dashboard delivery

The first delivery adds HRRR GDI, neighborhood coverage, sampled persistence, and longest sampled run under **GDI Thermodynamic Guidance**. All are opt-in. The legend selects forecast hour (F00–F06), threshold (30/40/50), and numerical labels. Existing dashboard geographic references remain above the field overlay.

## Calculation and terrain

`tools/gdi/native_gdi_core.py` retains the selected José notebook GFS calculation: specific humidity, theta850 denominator, and additive `18 - 9000/(ps_hPa - 500)` correction. The accompanying source excerpt and prior equivalence audit record the baseline. Production uses HRRR model-postprocessed pressure-level TMP/SPFH at 950/850/700/500 hPa and surface pressure. These include model-provided below-ground values where applicable; we do not locally extrapolate missing profiles, invent a replacement formula, or mask every surface above 950 hPa. Invalid/missing inputs remain missing. This describes implementation fidelity, not a claim of new HRRR forecast-skill validation.

Native calculation arrays are not smoothed. Map PNGs use nearest-neighbor display reprojection to EPSG:3857. The numerical toggle displays rounded sampled native values, rather than contour labels. Palette endpoints saturate outside −30 to 60; the calculation does not clip values.

Coverage is the fraction exceeding the chosen threshold in an 81-cell disk of nominal 15 km radius, with at least 80% valid neighborhood support and a valid center. Persistence is the number of qualifying hourly samples among F00–F06 inclusive. Longest run counts consecutive qualifying samples. Both require all seven samples to be valid and neither represents measured continuous duration or a calibrated probability.

## Automatic delivery

`publish_gdi.yml` is a reusable workflow called as an independent sibling job by `update_hrrr_tle.yml`, which receives the existing cron-job.org dispatch. It has no native GitHub timer. Manual dispatch and code-change bootstrap remain available. `publish_rap_gdi.yml` similarly runs from the existing cron-job.org-triggered `update_rap.yml`. Neither GDI job waits for the parent model product-building job. It selects the newest inventory-complete F00–F06 cycle within six hours, decodes and validates all requested records, then builds all 41 images before atomic publication to the isolated `data/gdi` branch. AWS is primary; NOMADS uses its own index offsets as fallback. A failed run leaves the prior public generation intact. The browser checks forecast times, asset paths, SHA-256 hashes, and image dimensions before swapping its selected overlay. Its displayed cycle/valid time tracks the image actually shown. Cycles older than six hours are explicitly identified.

The data branch keeps the current and one previous generation in its working tree. Git history still retains older assets; long-term storage growth needs operational monitoring. Native intermediate arrays stay out of Git. Workflow artifacts retain acquisition metadata for 14 days.

## Next delivery order

1. Operate HRRR GDI on the dashboard and confirm the initial automated publication.
2. RAP analysis, three-hour analysis change, and same-cycle +3-hour forecast.
3. RRFS and HRRR/RRFS guidance, with current operational feed availability checked before wiring sources.
4. Valid-time-aligned lagged members and six-hour window support, with model-balanced weights for combined guidance.
5. Products aligned to the issued Day 1 ERO valid interval and remaining interval, explicitly reporting available member/window coverage.

These later products are not included in this first delivery. Forecast-skill research is separate from rollout.

## Delivery checks

The full seven-hour fixture rendered 41 assets with verified checksums, dimensions, and valid times. A local bare-repository exercise confirmed atomic publication, restore, and rejection of a stale publisher. A mocked Leaflet interaction check covered hour selection, numerical toggle, opacity, exclusive GDI products, and retention of the displayed image during an outage. This is not a browser screenshot check.

## RAP and menu delivery

RAP analysis, current-minus-prior-analysis three-hour change, and same-cycle +3-hour forecast form one complete package in `data/rap-gdi`. Pressure-level RH is converted to specific humidity with liquid-water saturation vapor pressure (Bolton form); this conversion is recorded separately from the unchanged GDI formula. Every input carries model/cycle/lead/grid/checksum provenance. The menu separates RAP Analysis & Trends, HRRR Hourly Guidance, and HRRR Six-hour Persistence. Upcoming RRFS/blend and windowed ensemble products will be placed in their own subgroups when available.

## RRFS, blend, TLE and Day 1 ERO delivery

`publish_gdi_guidance.yml` responds to the **requested** event from the existing cron-job.org-dispatched HRRR workflow. It has no GitHub timer and does not hold up the original HRRR workflow's concurrency group. Its nowcast and ERO jobs publish independently to `data/guidance-gdi` and `data/ero-gdi`. The first uncached build is substantially larger than later updates; a bounded 36-hour decoded-field cache is retained between runs.

RRFS uses pressure-level TMP/SPFH and companion 2dfld surface PRES, with cycle, lead, units and native grid checked together. AWS uses the current operational-feed bucket. NOMADS tries production and then parallel paths, recording actual URLs. The two grids must match explicitly before blending. This adapter does not use the retired prototype bucket.

The nowcast begins at the next whole UTC hour and spans six hours, with seven inclusive hourly samples. The two newest inventory-complete HRRR runs and two newest inventory-complete RRFS runs are selected independently, then aligned to identical valid times. Each model has half the weight; each of its two lagged runs has half that model's weight. Intermediate decoded fields are mandatory before publication. HRRR/RRFS deterministic blend snapshots are the arithmetic mean of the latest run from each model at window start, +3 and +6 hours. Initialization times are recorded separately from valid times.

TLE maximum is the unsmoothed maximum across members and sampled times. Threshold support at 30/40/50 is the ensemble-mean 15-km neighborhood coverage of member window maxima; it is **not a calibrated rainfall/flash-flood probability**. Persistence is the ensemble-mean number of qualifying hourly samples. All four members must be valid at a cell for combined products. Missing members are not silently replaced by zero, and weights are not silently renormalized.

The ERO job reads the issued Day 1 start/end from NOAA's WPC hazard service and restricts its samples to the remaining complete-hour interval ending at that issued end. It uses extended forecast cycles that cover the whole remaining period. Both full issued times and sampled remaining times are carried in metadata. Missing or inconsistent issued times stop publication. Forecast-window layers clear after their published interval ends and state that current guidance is awaited.

The menu adds RRFS & HRRR/RRFS Blend, TLE Six-hour Nowcast, and TLE Day 1 ERO Remaining Period subgroups. Startup data unavailability is reported honestly until each first complete suite publishes. The established HRRR and RAP layers continue independently if a longer window suite fails.


### Provider and display audit — 2026-10-19
- Tested current HRRR, RAP, and RRFS inventories and byte ranges independently on AWS and NOMADS. RRFS NOMADS currently responds under `rrfs/para`; the adapter checks `prod` then `para`.
- Provider fallback retains each provider's own byte offsets and validates decoded identity. Humidity fallback can use SPFH or RH from the alternate provider, with the existing documented RH-to-q conversion.
- Fault-injection checks cover both provider orders and inventory, range, and corrupt-record failures. TLE checks cover exact common valid times, equal model/lag weights, intermittent exceedance, and missing-hour masks.
- Absolute GDI products share the existing HRRR palette; support shares its coverage palette. Named legends expose scale values, and fractional ensemble-mean persistence labels retain one decimal place. Persistence is a sample count, not continuous duration; support is not a calibrated rainfall probability.


### Contour and menu display update — 2026-10-19
- GDI submenus use the same bordered, padded expandable-group styling as the antecedent menu.
- Sampled number grids are replaced with labeled isolines. Absolute GDI contours use 10-unit intervals; change contours use 0, ±5, ±10, ±20, ±30; neighborhood support uses 10/25/50/75/90 percent; persistence contours use sample-count levels.
- Contours use the same display field and pixel alignment as shading, with missing cells masked and no field smoothing. Labels follow contour paths and are spaced to avoid crowding.
- Legacy `_numbers` asset keys are retained for publication compatibility, but new generations declare `overlay_type: labeled_contours_v1`. The viewer never displays old sampled-number overlays after this update. Both renderers include the contour style in immutable generation hashes.
