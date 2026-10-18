# H7 dynamic antecedent wetness: initial map review

**Follow-up completed:** See [Florida rainfall consistency check](FLORIDA_FOLLOWUP.md) for the matched MRMS comparison, revision checks and updated recommendation. The initial observations below are retained as review history.

These are fixed audit snapshots ending 18 October 2026 at 00Z, not a live feed. Production is unchanged.

| Map | Depth | Start (00Z) | End (00Z) | Origin |
|---|---|---|---|---|
| shallow_24h.png | 0–10 cm | 17 Oct | 18 Oct | Subtraction of exact-date NASA SPoRT RSM float grids |
| deep_7day.png | 0–200 cm | 11 Oct | 18 Oct | Native NASA SPoRT 7-day change float grid |
| deep_14day.png | 0–200 cm | 04 Oct | 18 Oct | Native NASA SPoRT 14-day change float grid; secondary context |

All three figures are 4000 × 2538 pixels. Native numeric subtraction precedes bilinear EPSG:3857 reprojection. Valid masks are reprojected separately with nearest-neighbor resampling. State borders use the dashboard's existing review/vendor/us-states.json geometry. The full figures include titles and legends; they are not transparent Leaflet overlay assets.

The proposed signed palette uses brown for drying, blue for wetting, ivory for −1 to +1 percentage point, and gray for missing/masked cells. It is distinct from the operational absolute-RSM and wet-tail percentile palettes. The near-zero bin is a display choice, not a validated significance threshold. Display interpolation adds no native spatial information. Outer color bins retain the full values, with no numeric clipping.

## Numerical and visual checks

All input files matched the SHA-256 revisions in numerical.json. All three products contain 1,290,511 valid native cells. Exact extrema, source URLs, hashes, palette edges and the boundary hash are recorded in map_review.json. Existing audit comparisons found native deep-change versus endpoint-derived changes within 0.01 percentage point for the two audited endpoints; the native products remain authoritative for these review maps.

The largest 24-hour shallow changes occur in southern Florida:

| Change | Latitude | Longitude | Starting RSM | Ending RSM | Delta |
|---|---:|---:|---:|---:|---:|
| Strongest drying | 25.855 N | 81.065 W | 98.564% | 61.842% | −36.722 pp |
| Strongest wetting | 25.345 N | 80.255 W | 29.312% | 81.694% | +52.382 pp |

The regional diagnostic shows juxtaposed wetting and drying patches. This visual pattern does not establish whether the changes reflect rainfall, model behavior, forcing issues or source revisions. No coincident rainfall comparison has been completed. These extremes remain a scientific review item before operational activation; they have not been removed or smoothed away on the native grid.

## Next qualification steps

1. Compare the exact 17–18 October 00Z shallow interval against time-matched precipitation and inspect successive source revisions and additional daily pairs, especially southern Florida.
2. Review the signed palette and the −1 to +1 pp neutral display bin with forecasters.
3. Implement exact-time pairing, versioned numerical retention, separate valid/retrieval/source-modification timestamps, atomic generation publication and product-specific freshness/coverage checks.
4. Produce transparent map-only overlays and test Leaflet backgrounds, zoom, legend, timestamp and missing-data handling before production activation.

Reproduction from repo root:

```sh
python tools/render_h7_review.py --cache /path/to/audited/tiffs
```

Requirements: numpy, rasterio, matplotlib and pillow. The script deliberately refuses revised TIFFs whose hashes differ from the audit snapshot; re-audit before rendering a new generation. No production workflow or scheduler is activated by this review.
