# H8 Pass 1 review ingest and spatial comparison

Review completed 18 October 2026. No dashboard registration, production publisher, or schedule change.

## Result

The independent Pass 1 ingest accepted the 1/3/6-hour suite ending **16Z**, paired with the latest available eligible FFG snapshot, **15Z (12Z reference)**. Same-window Pass 2 was not yet available and is explicitly `waiting_for_same_window`. It does not hold back Pass 1 or substitute an older window.

A separate historical review ending **18 October 00Z** covers Florida rainfall during the preceding 1/3/6 hours. It uses the 00Z FFG snapshot/reference, obtained retrospectively, not a claim of guidance available before that rainfall. Both Pass 1 and Pass 2 are available, stored independently, and rendered separately.

## Review maps

All maps are 4000 × 2538 pixels, with state borders, the same percent-of-FFG palette, and EPSG:3857 display reprojection. Numerical ratios are computed before rendering. Native scientific grids and source CRS definitions are preserved.

- [Florida Pass 1 comparison](maps/florida_pass1_comparison.png)
- [Florida Pass 2 comparison](maps/florida_pass2_comparison.png)
- [16Z Pass 1 regional comparison](maps/peak_pass1_comparison.png)

Top row: QPE remains on its approximately 1-km native grid; FFG is assigned using nearest neighbor. This preserves rainfall structure but creates no new fine-scale FFG information.

Bottom row: QPE is averaged onto the native FFG grid; a separate coverage calculation requires at least 99% valid source coverage for each ratio. This is a GDAL-average diagnostic, not an exact geodesic conservative remapping claim.

Both versions use nearest-neighbor sampling for display. State outlines are the existing simplified review reference geometry, not a coastline/land mask. Gray denotes unavailable ratios; zero rainfall remains valid. Coastal FFG cells may extend beyond the simplified coastline. Regional maxima include the valid numerical footprint within the plotted bounds.

## Florida regional peaks, ending 18 October 00Z

| Duration | Pass 1 fine QPE | Pass 1 averaged QPE | Pass 2 fine QPE | Pass 2 averaged QPE |
|---|---:|---:|---:|---:|
| 1 h | 79.9% | 70.2% | 79.8% | 70.2% |
| 3 h | 123.3% | 101.2% | 124.0% | 101.9% |
| 6 h | 152.3% | 127.3% | 153.1% | 128.1% |

These are each method's regional maxima, which need not occur at the same point. They demonstrate sensitivity to spatial support, not observed flood occurrence or proof that every QPE maximum is accurate. No rainfall maxima were clipped or suppressed. Pass 1 and Pass 2 agree closely in this case, but that is not a general interchangeability claim.

Recommendation for the next review: use the fine-QPE version as the leading candidate for MetWatch situational awareness, retain the averaged version as an explicit sensitivity comparison, and keep the coarse resolution of the RFC guidance visible in the product description. A sharper image does not establish finer hydrologic threshold precision. Before production, investigate at least one concentrated high-ratio case against independent rainfall/impact evidence and settle the operational FFG pairing policy.

## Ingest and failure behavior

`tools/ingest_h8_review.py` discovers each duration and requires a common ending time within a pass. It downloads timestamped numerical sources, validates MRMS quantity/units/template/time and geometry consistency, reuses H5's FFG grid and coverage baseline checks, masks missing rainfall separately from zero, and rejects insufficient paired coverage.

Inputs and scientific derivatives reside in hash-verified generation directories in the explicitly supplied output directory. All three durations are staged before the per-pass metadata pointer is promoted. Pass 2 has its own pointer and status. Review source versions are retained; no scheduled cleanup or durable cross-runner archive is installed in this step. These local science directories are not production publishing locations.

On failure, prior metadata remains untouched. The attempt status distinguishes a verified retained generation, an expired generation, and unavailable/corrupt retention. Historical runs are explicitly historical and are never treated as current. Review-only age limits are 3 hours for QPE ending/snapshot and 9 hours for FFG reference; these are rehearsal gates, not newly approved production policy.

The checked-in `ingest/` metadata records exact source URLs/hashes, valid windows, source modification/retrieval times, acceptance time, FFG reference/snapshot, numerical output hashes, and live-age deadlines. Original GRIBs, compressed QPE downloads, and numerical GeoTIFFs are retained in the review run output directories. Git review evidence includes metadata/maps, not the full raw-data archive; durable science archival remains a production gate.

## Checks performed

Five focused tests passed: common-window selection; stale/missing common-window rejection; preservation of a narrow synthetic rainfall peak and valid zeros; missing-data coverage and missing-denominator handling; and hash-verified retention, expiry, and corruption rejection. The live and historical ingests ran successfully, and every render verifies all numerical assets against the accepted manifest. Both passes' Florida maps and the live-sample comparison received visual inspection.

## Reproduce

```bash
python -m pip install numpy rasterio matplotlib
python -m unittest discover -s tools -p test_h8_review.py -v
python tools/ingest_h8_review.py --output-dir /tmp/h8-review
python tools/render_h8_review.py --input-dir /tmp/h8-review --output-dir review/h8/maps --region peak
# Historical source availability is finite; this explicit case is not a live product.
python tools/ingest_h8_review.py --output-dir /tmp/h8-review-florida --historical-end 2026-10-18T00:00:00Z
python tools/render_h8_review.py --input-dir /tmp/h8-review-florida --output-dir review/h8/maps --region florida --pass-number 1
python tools/render_h8_review.py --input-dir /tmp/h8-review-florida --output-dir review/h8/maps --region florida --pass-number 2
```

A future rerun can encounter revised source bytes or an expired source archive. Compare recorded hashes; never assume a matching filename recreates the reviewed generation. Native NOAA FLASH ratio scaling remains a separate audit item and is not used in these calculated ratios.
