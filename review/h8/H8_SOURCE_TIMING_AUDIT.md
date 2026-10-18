# H8 numerical-source and timing audit

Status: initial live numerical audit completed on 18 October 2026. Review only; no production layers, publishing workflows, or schedules changed.

## Finding and recommended next step

H8 has usable numerical sources. Build a dedicated, versioned MRMS 1/3/6-hour multi-sensor ingest for review, starting with Pass 1 and retaining Pass 2 as a separately identified later analysis. Do not silently switch passes. Keep NOAA FLASH radar-based ratios distinct from this proposed multi-sensor comparison. Review timing and spatial-support alternatives before adopting a production ratio definition.

## Repository audit

Audited code commit: `d608ee7632a396d18851cbd99035b8cf2fefcc81`.

- `app.js` supplies existing MRMS 1/24/48/72-hour QPE through IEM WMS display tiles. There is no corresponding retained numerical 1/3/6-hour QPE suite in the inspected production pipeline.
- `fetch_mrms_ffd_24h.py` downloads CREST, SAC, QPE_FFGMAX, and QPE_ARIMAX for categorical FFD calculations. It deletes downloaded GRIBs after decoding. Its production workflow uses `--dashboard-only` and publishes PNG/JSON products. A maximum ratio or FFD category cannot reconstruct a duration-specific rainfall grid.
- `fetch_mrms_rala_loop.py` retains rendered reflectivity frames, not rainfall accumulations.
- The RFC FFG publisher already retains `source.g2`, exact native-mm GeoTIFFs, and provenance in `data/rfc-ffg`. The inspected branch tree contained 23 hourly generations, from 17 October 17Z through 18 October 15Z. See `retained_ffg_inventory.json` for exact tree/blob identities.
- FFG code keeps up to 48 generations, not a guaranteed gap-free 48-hour archive. Artifacts have 14-day retention; Git history is separate. Longer research/tendency archives still need an explicit completeness policy.

## Source and product contracts

| Input | Numerical route | Native quantity / temporal meaning |
|---|---|---|
| RFC FFG 1/3/6 h | `https://ftp-wpc.ncep.noaa.gov/workoff/ffg/5kmffg_YYYYMMDDHH.g2` | FFLDG, kg m-2 = mm water; duration selected from GRIB metadata |
| Multi-sensor QPE Pass 1 | `https://mrms.ncep.noaa.gov/2D/MultiSensor_QPE_01H_Pass1/` and 03H/06H | mm accumulated during the named duration ending at encoded observation time |
| Multi-sensor QPE Pass 2 | Same directory pattern with Pass2 | Separate later analysis of the same accumulation window |
| Radar-only QPE | `https://mrms.ncep.noaa.gov/2D/RadarOnly_QPE_01H/` and 03H/06H | Separate rainfall analysis; do not substitute silently for multi-sensor QPE |
| NOAA FLASH duration ratios | `https://mrms.ncep.noaa.gov/2D/FLASH/QPE_FFG01H/` and 03H/06H | Existing NOAA radar-based comparison; direct encoding/scaling must have its own validated contract |

An initial attempt to find FLASH directly below `/2D/` returned HTTP 403. Root-directory discovery located the actual `/2D/FLASH/` hierarchy. This was a path discovery issue, not evidence that the products were unavailable.

The six multi-sensor samples share an ending time of **18 October 15Z**:

| Duration | Rainfall window (UTC) | Pass 1 HTTP modification | Pass 2 HTTP modification |
|---|---|---|---|
| 1 h | 14Z–15Z | 15:15:32Z | 15:57:07Z |
| 3 h | 12Z–15Z | 15:16:22Z | 15:58:00Z |
| 6 h | 09Z–15Z | 15:16:22Z | 15:58:00Z |

The initial listings contained 26 consecutive hourly endings per multi-sensor product (17 October 14Z–18 October 15Z). Listed modification lags were 15–16 minutes for Pass 1 and 56–58 minutes for Pass 2. These are a one-day directory observation, not first-seen polling or a delivery guarantee. NOAA's current operational table gives nominal 20-minute and 60-minute latencies, respectively. Historical documentation and the installed GDAL descriptive lookup still contain older 60/120-minute values; those descriptions must not shift valid times.

MRMS samples use GRIB product template 0: reference time equals valid time, forecast seconds are zero. The template does not encode an accumulation start/end interval. The duration therefore comes from the exact NOAA parameter/product definition, cross-checked with the filename and encoded parameter ID. A generic decoder must not interpret template 0 as instantaneous rainfall.

FFG is different. The 15Z hourly snapshot has a **12Z reference cycle**, was modified at **15:38:01Z**, and encodes ends of 13Z/15Z/18Z for its 1/3/6-hour bands. Those encoded ends describe duration relative to the reference cycle; they are not the ends of backward-looking QPE windows, nor universal expiration times. Individual RFC issuance times remain unknown in the national mosaic.

## Numerical checks

All six multi-sensor files decoded successfully as millimetres on 3500 × 7000 grids at approximately 0.01-degree spacing. Preserve the encoded geographic CRS/ellipsoid and transform rather than silently assigning EPSG:4326. The samples contain 22,987,082 nonnegative cells and 1,512,918 cells flagged -3. Zero rainfall is valid; all negative flags remain unavailable.

WPC FFG retains its native 794 × 1082 polar-stereographic grid, with approximately 4.762-km projected spacing. Positive finite thresholds are required; zero/negative/missing denominators cannot produce ratios.

A diagnostic GDAL-average reprojection of QPE to the native FFG grid, with a separately reprojected validity mask and >=99% coverage requirement, paired all 486,607 valid 1-hour FFG cells and all 486,606 valid 3/6-hour cells. This is complete overlap of the sampled numerical FFG footprint, **not a claim of complete CONUS land coverage or accurate QPE everywhere**. Existing Northwest/RFC coverage caveats remain.

Pass 1 and Pass 2 differ numerically. Maximum absolute differences after this diagnostic aggregation were approximately 1.79, 2.96, and 3.80 mm for 1/3/6 hours. Their identity must be preserved even when maps look similar. Full hashes, flags, grid definitions, raw extrema, metadata, and numerical summaries are in `source_audit.json`.

Spatial support remains a review decision:

- Averaging QPE onto FFG cells gives a coarser cell-supported diagnostic but can suppress narrow convective maxima. GDAL average is not claimed here as exact geodesic conservative remapping.
- Nearest-neighbor assignment of native FFG thresholds to the finer QPE grid preserves rainfall structure but does not create 1-km FFG information. Avoid bilinear interpolation across FFG/RFC discontinuities.
- Compare these interpretations using a concentrated heavy-rainfall case before selecting a default. High-resolution display rendering comes after the scientific calculation.

The 15Z FFG source SHA also matches the production generation retrieved at 15:51:07Z; its saved metadata is `published_ffg_metadata.json`. That establishes this exact version was available to our pipeline by that retrieval time, without claiming it was available at the nominal 15Z snapshot hour.

Supplemental numerical downloads succeeded for all three radar-only accumulations and all three native FLASH ratios. The FLASH samples ending 16:02Z carry `[non-dim]` units and raw maxima of 65, 90, and 110. **Do not assume that 1.0 is the exceedance threshold for these raw fields.** The existing IEM FFGMAX adapter uses percent-of-guidance semantics; a separate native duration-product scaling check remains necessary before display or numerical comparisons. No changes were made to that existing adapter.

## Timing policy proposed for review

Keep QPE start/end, pass, source modification, first retrieval, and acceptance times separate from FFG snapshot hour, reference cycle, modification, first retrieval, and acceptance times. Preserve hashes for every input version.

1. **Current situational comparison:** the newest complete same-pass QPE trio versus a named, accepted FFG snapshot available at publication time. Show both timestamps and any offset explicitly. A newly issued FFG mosaic may change the ratio even when QPE is unchanged. This is a comparison with current guidance, not a forecast-valid reconstruction.
2. **End-aligned retrospective comparison:** a fixed QPE end T paired with a selected FFG snapshot hour no later than T. The audit uses this mode (15Z/15Z), but the 15Z FFG file was only modified at 15:38Z. Matching nominal hours alone does not eliminate availability look-ahead.
3. **As-issued verification / pre-event baseline:** use an archived FFG version demonstrably available by the chosen cutoff, potentially the rainfall-window start. Do not infer historical availability solely from a synoptic reference cycle or a file retrieved later. Preserve the baseline throughout that comparison.

Do not compare QPE end time to FFG encoded period end as an equality rule. Do not subtract publication latency from QPE valid time. Never mix newest 1-hour QPE with older 3/6-hour QPE without explicitly treating them as different products; the initial review should require a common end.

Retained product age must continue to advance during retrieval failures. A future fused product expires when either constituent violates its approved freshness limit. Reuse existing FFG 3-hour snapshot / 9-hour reference-cycle limits as an upper bound, then settle QPE and pairing limits from the ingest rehearsal. No new operational cutoff is approved by this audit.

## Gates before operational implementation

- Dedicated numerical QPE retention with immutable versions, hashes, explicit pass identity, common-window selection, and no-data handling.
- Repeat first-seen observations across several posting cycles and a synoptic FFG transition; current modification timestamps do not measure first availability.
- Review both spatial-support alternatives and FFG pairing modes on an active-rainfall case; check anomalous rainfall pixels against independent evidence where necessary.
- Keep native NOAA FLASH products separately labeled. Its ratio/percent encoding must be verified before any interchange with the existing IEM FFGMAX-based FFD pipeline.
- Display both input times and data age, retain a valid prior pair during failures, and hide when either input expires.
- Defer “remaining FFG”: FFG minus recent QPE is an arithmetic difference, not a demonstrated remaining rainfall capacity. Recently updated FFG may already reflect antecedent rainfall.

## Reproduction and evidence

```bash
python -m pip install numpy rasterio
python tools/audit_h8_sources.py --output-dir review/h8 --cache-dir /tmp/h8-source-audit
```

This script performs read-only source retrieval and diagnostic calculations. It stores raw files in the specified cache and a machine-readable report in the output directory. Re-running observes the then-available source versions; compare source hashes before assuming exact reproduction. Raw scientific inputs are not inferred from display colors.

Primary references checked:

- https://www.nssl.noaa.gov/projects/mrms/operational/tables.php
- https://inside.nssl.noaa.gov/mrms/past-code-updates/
- https://vlab.noaa.gov/web/wdtd/-/qpe-to-ffg-ratio
- https://vlab.noaa.gov/web/wdtd/-/multi-sensor-qpe
- https://mapservices.weather.noaa.gov/raster/rest/services/precip/rfc_gridded_ffg/MapServer/info/iteminfo

Some VLab direct page requests were denied; indexed NOAA excerpts and the accessible numerical files support the limited source conclusions here. This audit does not certify production readiness or a delivery service level.
