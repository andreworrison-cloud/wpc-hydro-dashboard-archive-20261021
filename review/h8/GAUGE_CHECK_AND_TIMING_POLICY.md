# H8: Florida gauge check and operational pairing policy

Review completed 18 October 2026. Fine-scale Pass 1 QPE remains the leading candidate; retain QPE averaged to the native FFG grid as a comparison. This is a review decision and implementation contract, not production activation.

## Concentrated maximum: corroboration with qualifications

The six-hour window is 17 October 18Z–18 October 00Z. The fine-scale maximum is 152.34% of FFG near 26.1750 N, 80.7850 W in the Everglades. At that cell, Pass 1 QPE is 163.0 mm (6.42 inches), divided by approximately 107.0 mm (4.21 inches) of six-hour FFG. The regional maximum after averaging QPE to the FFG grid is 127.35%; these maxima need not occupy the same cell.

USGS NWIS returned six precipitation stations in the queried region. All values are provisional. We summed the 24 reported quarter-hour values in (18Z, 00Z], interpreting them as interval-ending precipitation increments. The service identifies parameter 00045, inches, but the retrieved metadata does not independently establish each station's interval-label convention. This assumption and the provisional status limit exact window validation. The script checks complete, unique quarter-hour coverage and rejects missing/negative values.

| Station | Distance from peak | Gauge six-hour sum (in) | Pass 1 QPE at gauge (in) |
|---|---:|---:|---:|
| Site 62, WCA 3A | 3.4 km | 4.18 | 5.54 |
| EDEN 14, WCA 3A | 12.1 km | 1.41 | 1.61 |
| Site 64, WCA 3A | 25.0 km | 1.50 | 1.45 |
| Site 63, WCA 3A | 25.4 km | 1.72 | 1.36 |
| EDEN 12, WCA 3A | 26.8 km | 1.61 | 1.50 |
| EDEN 11, WCA 2A | 39.8 km | 2.06 | 0.89 |

The nearest gauge supports a localized heavy-rainfall area, but does not establish the exact 6.42-inch grid maximum. Its 3×3 QPE neighborhood ranges from 4.20 to 6.23 inches, indicating a sharp spatial gradient. The gauge is a point measurement, not a grid-cell average. EDEN 11 also shows a substantial QPE/gauge disagreement; we retain that result rather than screening it out.

**Site 62 quality qualification:** one reported increment ending 21:30Z is 2.38 inches, 57% of its six-hour sum. This is an unusually large 15-minute amount. These records cannot distinguish a real extreme burst from timing/telemetry accumulation or an instrument problem. Omitting that increment yields 1.80 inches, but that is a sensitivity calculation only—not a corrected observation. No gauge values were clipped or replaced. USGS precipitation-record guidance calls for examination of incremental rainfall and possible spikes, and cautions that interval distribution can be uncertain even where an accumulated total is usable.

These are separate observing instruments; whether any entered MRMS gauge adjustment is unknown. Therefore this is observational corroboration, not a demonstrated independent, withheld validation set. No flood occurrence is established by this exercise. A later approved gauge record or additional nearby independent observation is needed to strengthen validation of the exact maximum. The fine-scale candidate is retained because it preserves the localized structure, not because this single case proves quantitative accuracy.

## Timing sensitivity: the denominator matters

Hold the peak's six-hour QPE fixed at 163.0 mm and sample different WPC mosaics at the same point:

| WPC nominal snapshot | GRIB reference | Six-hour FFG (mm) | Fixed-QPE ratio |
|---|---|---:|---:|
| 17 Oct 17Z | 17 Oct 12Z | 107.00 | 152.34% |
| 17 Oct 18Z | 17 Oct 18Z | 107.00 | 152.34% |
| 17 Oct 23Z | 17 Oct 18Z | 107.00 | 152.34% |
| 18 Oct 00Z | 18 Oct 00Z | 107.00 | 152.34% |
| 18 Oct 01Z | 18 Oct 00Z | 86.00 | 189.54% |

The later mosaic raises the ratio by **37.20 percentage points** without changing rainfall. The 00Z and 01Z mosaics even share a GRIB reference cycle. This demonstrates why snapshot identity and content hash must accompany the cycle. It does not establish why the guidance changed or identify the underlying RFC issuance time. Stability at this point before 00Z does not imply nationwide stability.

The 00Z file reports HTTP modification at 00:38:37Z. Our retrieval was much later. Neither the nominal hour nor a retrospective download proves availability at 00Z; HTTP modification is not an observed first-availability timestamp.

## Selected operational timing contract

1. **Publish a window-fixed comparison.** Use one common Pass 1 QPE ending T for the 1-, 3-, and 6-hour products. At the first successful pairing, select the latest validated WPC snapshot S with S <= T that has actually been retrieved by that pairing run. Apply the existing age, coverage, geometry and positive-denominator checks. If no eligible pair exists, do not fabricate one.
2. **Freeze the exact FFG bytes for that window.** Persist S, GRIB reference, retrieval/first-seen time, hash and pairing time. A later FFG mosaic must not silently revise ratios for unchanged QPE. The next rainfall window selects its own eligible mosaic. A source correction requires an explicitly versioned revision with a visible reason.
3. **Keep comparisons controlled.** Fine-scale and averaged products use the same rainfall source and FFG bytes. Same-window Pass 2 uses that frozen FFG baseline, remains separately labeled, and never silently replaces Pass 1. If that baseline is unavailable, the Pass 2 comparison waits.
4. **Separate historical review from as-issued verification.** A retrospective S <= T pairing is not evidence that FFG was available by T. An as-issued test needs archived first-seen records and a declared cutoff, at or before the chosen forecast/decision time. Historical windows remain visibly historical.
5. **Display the actual clocks.** Show rainfall start/end, Pass 1 or Pass 2, WPC snapshot, GRIB reference cycle and update time. Explain that individual RFC issuance times are unavailable from this mosaic. Do not interpret GRIB duration endpoints as backward QPE windows or automatic product expiration times.
6. **Retain the whole valid pair during failure.** Never mix retained rainfall with newly retrieved guidance. Keep the existing review ceilings of 3 hours since QPE ending, 3 hours since FFG snapshot, and 9 hours since GRIB reference, evaluated against wall-clock UTC; the earliest deadline controls hiding. Label retained output immediately when an update attempt fails. These remain conservative review gates pending operational cadence testing, not a claim about official RFC validity.
7. **Label the interpretation.** Suggested legend: “Observed rainfall / paired RFC flash flood guidance (%)”. Include: “Window-fixed comparison; guidance may differ from the latest RFC FFG layer.” This is neither remaining rainfall capacity nor a flood probability. The existing standalone FFG layer continues to show its latest accepted guidance.

Freezing the pairing prevents the observed 152%→190% denominator-only jump. It deliberately means a ratio for an older rainfall window may use older guidance than the standalone current FFG layer. This distinction must be visible to forecasters. The operational label should not imply antecedent, pre-rainfall FFG: this policy pairs near the end of the observed rainfall window.

## Evidence and implementation status

- `verification/usgs_precipitation.json`: exact retrieved USGS response; `usgs_request.json`: query, response headers and SHA-256.
- `verification/gauge_timing_results.json`: all 1/3/6-hour station comparisons, distance, neighborhood range, qualifications, five WPC source URLs/hashes and timing results.
- `tools/check_h8_gauges_timing.py`: reproducible analysis using the accepted Florida Pass 1 generation. Run with `--review-root /path/to/h8-review-florida --output-dir review/h8/verification`.
- Existing `ingest/florida_pass1_metadata.json` records the QPE/FFG generation and hashes. The large source rasters remain in the review cache; this commit preserves numerical findings and provenance but is not a durable raw-raster archive. Exact reprocessing after source expiry requires retaining those source bytes.
- The review ingest now enforces cross-run frozen pairing and the shared Pass 1/Pass 2 baseline. See `PAIRING_IMPLEMENTATION.md` for implementation evidence, delayed prior-window Pass 2 handling, and remaining production work. No production workflow or scheduler is activated by this review.

Primary references: [USGS instantaneous-values service](https://waterservices.usgs.gov/docs/instantaneous-values/), [USGS precipitation-record review guidance](https://water.usgs.gov/osw/time-series-guidance/SW6_Precipitation/AAA_precip.pdf), and the exact NOAA WPC and USGS URLs retained in the evidence JSON. Public SFWMD API documentation requires client credentials; no authenticated retrieval was attempted.
