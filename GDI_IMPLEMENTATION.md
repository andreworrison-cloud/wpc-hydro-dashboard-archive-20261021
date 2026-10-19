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
