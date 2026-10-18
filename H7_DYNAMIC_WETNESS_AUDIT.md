# H7 — Dynamic antecedent wetness: source and temporal audit

Audit date: 2026-10-18 UTC. Research only; no production assets, schedules, or dashboard controls changed.

## Findings and recommended first review products

| Candidate | Numerical access | Recommendation |
|---|---|---|
| 24-hour RSM change, 0–10 cm | Exact daily RSM endpoints available; no dedicated shallow-change folder in the inspected GeoTIFF root | Derive end minus start on the native numerical grid; label as dashboard-derived |
| 7-day RSM change, integrated 0–200 cm | NASA float GeoTIFF in `rsm_0-2m_diff7day` | Prefer NASA native product; retain independent endpoint comparison |
| 14-day RSM change, integrated 0–200 cm | NASA float GeoTIFF in `rsm_0-2m_diff14day` | Secondary longer-memory context; retain independent endpoint comparison where endpoints exist |

All changes are percentage points of RSM, not percent relative change, percentile-rank change, rainfall-equivalent millimeters, or flood probability. Positive means wetter, negative means drier. A change is net modeled state evolution and does not isolate rainfall infiltration.

## Source inventory

Root: https://nssrgeo.ndc.nasa.gov/SPoRT/modeling/lis/conus3km/geotiff/

Each of the four inspected RSM/change directories contained 16 daily 00Z float files, 2026-10-03 through 2026-10-18 inclusive, with no internal missing date. This is observed availability, not a guaranteed retention policy. The inspected numerical feed supports daily evolution, not hourly evolution. Historical descriptions of six-hourly LIS do not establish six-hourly availability in this feed.

The current raw endpoint inventory supports 15 exact 24-hour pairs, 9 exact 7-day pairs, and only 2 exact 14-day pairs. Native change files themselves span all 16 end dates, including dates whose earlier raw endpoint is no longer listed.

Directory modification minus valid-time intervals span approximately 10.39–46.46 hours. These are not measured first-publication latencies. Today’s 00Z files were last modified around 10:23Z; October 17 files show October 18 modifications around 10:21Z. Valid time, modification time, retrieval time, and comparison start/end must remain separate.

## Numerical checks

Downloaded and inspected 13 float GeoTIFFs: shallow RSM October 16–18; deep RSM October 3, 4, 10, 11, 17, 18; native 7/14-day change October 17 and 18. Listing continuity was checked for all 16 dates; grid/value checks were bounded to these 13 files.

All samples have one float64 band, EPSG:4326, 929 rows × 1929 columns, 0.03-degree grid spacing, bounds approximately [-124.94, 25.06, -67.07, 52.93], scale 1 and offset 0. Missing value 9999 is not declared as GeoTIFF nodata and must be explicitly masked. Exactly 1,290,511 valid cells occur in each sample; all compared masks match exactly. State fields use the approved 0.0001-pp upper roundoff tolerance and are clamped to 100 only within that tolerance.

| Ending valid time | Native change | Maximum absolute difference from raw endpoint subtraction |
|---|---|---|
| Oct 17 00Z | 7 days | 0.0075045 pp |
| Oct 17 00Z | 14 days | 0.0075054 pp |
| Oct 18 00Z | 7 days | 0.0075035 pp |
| Oct 18 00Z | 14 days | 0.0075073 pp |

Mean absolute differences are about 0.0039 pp. Native and derived values are close but not bitwise identical. Precision/processing differences are a possible explanation, not a verified cause. Preserve NASA native provenance rather than silently relabeling a derived field as native. A provisional 0.01-pp comparison tolerance covers these samples but needs broader qualification before becoming a production acceptance gate.

Derived shallow 24-hour ranges: Oct 17, -42.666 to +60.572 pp; Oct 18, -36.722 to +52.382 pp. These are mathematical differences, not validated hydrologic event attribution. Regional map review, source-quality checks and rainfall context are needed for the large localized changes. Do not suppress them merely to fit a palette.

## Same-date source revisions

The retained H6 review provenance and this audit have different SHA-256 hashes for both October 17 RSM depths at the same URL and valid time. File modification times also advanced. This proves binary file replacement; prior numerical arrays were not recovered and compared, so the magnitude or cause of scientific revision is unknown. `prior_rsm_provenance.json` preserves the earlier evidence.

H7 must therefore identify a derived generation using both endpoint hashes plus processing revision, not filenames alone. Refetch/revalidate endpoint pairs together when checking an update; record each retrieval and source modification time. This reduces accidental mixing of cached and revised inputs but cannot prove the provider's internal run consistency because the files do not expose a model-run/revision identifier. If either source changes during an ingest, retry the pair or retain the previous validated product.

## Implementation contract for next step

- Start with 24-hour shallow and native 7-day deep change; include 14-day deep change as secondary review context.
- Require exact valid-time separation. Never substitute nearest available dates, scale a 48-hour difference to 24 hours, interpolate time, or fill missing pixels with zero.
- Validate shape, affine transform, CRS, depth, numeric units and mask; calculate differences before display reprojection using the intersection of endpoint masks.
- Retain native scientific inputs in a dedicated numerical history/cache (propose at least 21 days with versioned hashes). Current image-only production branches and 14-day provenance artifacts are not a reliable 14-day numerical archive.
- Retain last valid change product on failure, with visible failure status. Apply freshness to the end valid time; the intentionally older baseline is not itself a stale current analysis. Initial review can retain the approved 48-hour warning/72-hour expiry, pending product-specific review.
- Use a signed wetting/drying palette with explicit zero/near-zero and missing-data treatment; do not reuse the wet-tail percentile palette for signed changes. No palette or thresholds are approved by this audit.
- Preserve the approved 4000 × 2538 display geometry, bilinear field reprojection, separately reprojected nearest-neighbor mask, and state-border overlays.
- NWM comparison is a separate next subtask: verify its current numerical source, freshness and normalization before comparison. No model averaging or agreement score is justified here.
- NLDAS-2 remains retired. Burn-severity work stays coordinated with Sol.

## Reproduce

From the repository root, with Python, NumPy, Rasterio and Requests installed:

```
python tools/audit_sport_h7_inventory.py
python tools/audit_sport_h7_numerical.py --prior-provenance review/h7/prior_rsm_provenance.json
```

The inventory must run first. The numerical script audits the newest two common endpoints available at execution, downloads sources to `/tmp/h7-tiffs`, and writes source hashes, headers, grid checks and comparison statistics under `review/h7`. Remote data can change; a later run will not necessarily reproduce this snapshot. Retained JSON is the authoritative evidence for this audit, not a promise of immutable upstream files. No numerical TIFFs are committed to Git.

NASA background: https://weather.ndc.nasa.gov/sport/training/articles/20151207175408_NASA-Land-Information-System-LIS-Applications-Training/media/lis-soil-moisture-quick-guide-by-nasa-sport.pdf (historical guide, dated 2015; used for RSM definition and source-quality caveats, not current cadence).
