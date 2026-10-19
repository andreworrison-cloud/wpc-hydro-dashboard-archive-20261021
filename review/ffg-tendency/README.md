# FFG tendency audit and immediate priorities

Review only, 18 October 2026. No new operational layer or scheduler is activated by this branch.

## First unattended H8 publication

[Run 39159097844](https://github.com/andreworrison-cloud/wpc-hydro-dashboard/actions/runs/39159097844) started at 19:30:44 UTC (3:30:44 PM EDT) and succeeded. A clean restore verified the published files and hashes from data commit `475383672b2a53839460669955493248b52c54fa`. It has no parent. Reachable snapshot size was 65.71 MiB. All five prior frozen window bindings were preserved exactly. Pass 1 advanced to 19Z and Pass 2 to 18Z, with the matching Pass 1 baseline retained. Both displayed products expire at 21Z. This verifies the first unattended publication, not long-term storage behavior; operational pruning over a full retention interval remains to be observed.

## Numerical source audit

Source: https://ftp-wpc.ncep.noaa.gov/workoff/ffg/

The captured listing contains 41 consecutive hourly `.g2` snapshots (17 October 03Z through 18 October 19Z) and 2,952 nominal six-hourly `.grb2` entries (11 October 2024 00Z through 18 October 2026 18Z). Listing presence is not proof of historical first availability or a retention guarantee. Twenty-six numerical files were decoded; the entire two-year archive was not decoded.

All requested 6-, 12-, and 24-hour hourly endpoints were accessible. The 1-, 3-, and 6-hour FFG fields have matching native grids and unchanged coverage in these pairs. The sampled 19Z hourly file and 18Z cycle file were numerically identical, but one comparison does not qualify mixing archive families.

`audit.json` contains source hashes, acquisition metadata, grids, coverage counts, difference statistics, and an hourly point trace. The companion script is `tools/audit_ffg_tendency.py`. Raw downloads are a local cache, not committed historical evidence; upstream hourly files roll off. Re-running later audits the then-current latest snapshot rather than reproducing this exact snapshot.

## Proposed scientific and display contract

- Calculate current FFG minus FFG exactly 6, 12, or 24 hours earlier, separately for each 1-, 3-, and 6-hour rainfall duration. Duration and look-back are independent controls.
- Negative values mean a lower guidance threshold; positive values mean a higher threshold. Neither sign alone establishes a change in soil moisture, its cause, or future flood occurrence.
- Subtract on the identical native numerical grid before reprojection. Use only cells valid at both endpoints; never substitute zero for missing coverage or silently use a nearby time.
- Keep snapshot time, encoded reference cycle, retrieval time, and publication time separate. National mosaic timestamps do not establish each RFC's issuance time. Zero change does not prove a fresh regional update.
- Preserve numerical differences, but test a neutral display interval of ±0.01 inch. The adjacent-hour 3-hour FFG comparison contains 440,491 nonzero differences smaller than 0.01 mm; sign-only coloring would exaggerate them. The tolerance is provisional, not a new source precision claim.
- Use a diverging legend with clear “lower guidance” and “higher guidance” labels, crisp existing map dimensions and state boundaries. Review all basemaps and zoom levels before integration.
- A separate bounded FFG snapshot buffer is needed: propose 72 hours, with hashes and original acquisition times, subject to measured storage size. H8's six-hour pairing retention cannot supply the 24-hour tendency. Missing exact endpoints must make that tendency unavailable. Last-valid retention must not reset its age.

## Case requiring review

At approximately 79.833°W, 39.649°N, the sampled 3-hour guidance decreased from 10.8661 to 4.8031 inches between the 18 October 06Z and 07Z snapshots. Both carry the 06Z reference cycle. The large 24-hour decrease is therefore an abrupt mosaic change. Its hydrologic cause or possible source revision has not been established. Compare the spatial footprint with RFC information and independent rainfall evidence before interpreting it as wetting. Do not suppress an authentic source change simply because it is large.

## Updated priority list

1. Carry the 6/12/24-hour FFG tendencies into review ingest and maps, including the case above, neutral interval, coverage, timing labels, and bounded source retention. Set rainfall-minus-guidance aside. Existing rainfall/FFG ratios are a separate product.
2. H7 comparison: compare NASA SPoRT RSM/change and NWM soil saturation as separate, explicitly labeled quantities. Audit depth, units, valid times and coverage first; do not average unlike quantities. NLDAS-2 remains retired.
3. H9 planning: define an **Experimental Hydrologic Susceptibility** prototype with interpretable antecedent and terrain/land-surface components, qualified source availability, temporal alignment, missing-data behavior, and an independent event-validation design. Avoid claiming calibrated probabilities or calling the prototype FFG. Establish baselines and test geographic/seasonal transfer before operational use.
4. Burn-severity integration remains coordinated with Sol; accept its reviewed interface when ready.

Next review milestone: tendency maps and case verification, followed by production integration only after the scientific and display behavior is settled.

## Map review and rainfall consistency check

All nine duration/look-back combinations have been rendered at **4,000 × 2,538 pixels**, with state boundaries and identical signed legends. These are frozen at **18 October 2026 19Z**, using the audited endpoints. Numerical differences are calculated on the native grid before bilinear Web Mercator display reprojection. Transparent overlay gaps preserve the paired-valid mask. The ivory interval is ±0.01 inch; blue means lower guidance and brown higher guidance. Source resolution remains unchanged.

For the 3-hour FFG duration:

| Tendency | Map |
|---|---|
| 6 hours | [PNG](ffg_3h_change_6h.png) |
| 12 hours | [PNG](ffg_3h_change_12h.png) |
| 24 hours | [PNG](ffg_3h_change_24h.png) |

The equivalent 1-hour and 6-hour duration PNGs are in this directory. [Regional case panels](wv_case.png) show before/after guidance, the 06Z–07Z difference, and preceding rainfall. `ffg_tendency_review.html` embeds all nine overlays and state borders for offline pan/zoom and duration/interval selection. Automated browser verification was attempted but could not launch Chromium because the execution environment disallowed its socket creation. Interactive controls and browser projection checks therefore remain unverified; static maps were visually inspected.

### Case findings

The audited cell near 79.833°W, 39.649°N changed from **10.8661 to 4.8031 inches** of 3-hour FFG between 06Z and 07Z. MRMS MultiSensor 24-hour Pass 2 QPE ending 07Z averaged **0.0961 mm** onto that FFG cell with 100% valid coverage. The 24-hour QPE ending 19Z was **0.0 mm** at the same cell. Zero here is a decoded valid observation, not missing-data replacement.

Within the explicitly bounded 82–78°W, 37–41°N region, 5,235 cells with a guidance decrease of at least one inch had qualified QPE coverage. Their preceding 24-hour QPE median was 0.3948 mm, 95th percentile 5.6974 mm, and 60.67% had less than 1 mm. These are unweighted descriptive cell statistics; adjacent cells are not independent samples. QPE was averaged onto the FFG grid and required at least 99% valid coverage. Source hashes, acquisition timestamps, and GRIB tags are in `case_verification.json`.

The broad, sharply bounded guidance transition and very light rainfall at the extreme cell do **not** support attributing this example directly to local heavy rainfall. They do not prove the cause was a correction, model change, or other specific RFC action. The source transition is verified; the underlying RFC issuance/revision cause remains unresolved. Preserve the measured change, and label it as guidance tendency rather than soil wetting. The OHRFC definition describes FFG as based on both soil moisture and streamflow: https://www.weather.gov/ohrfc/FFG . No event-specific explanatory bulletin was established in this check.

### Verification and reproducibility

- All nine native paired-cell counts and min/max differences match the preceding numerical audit (within 0.000001 inch for extrema).
- All nine presentation maps are exactly 4,000 × 2,538 pixels; no production assets were changed.
- Raw FFG files must match the hashes in `audit.json`. MRMS files must match the fetch manifest and their decoded product, units and valid time must match the requested accumulation endpoint.
- `tools/fetch_ffg_tendency_case.py` retrieves the fixed-date rainfall files. `tools/render_ffg_tendency_review.py` produces the maps, case metrics and offline HTML from cached, verified sources. `tools/test_ffg_tendency_review.cjs` provides the pending browser checks.
- These rolling source files may become unavailable or revised; hashes prevent silently substituting a different revision. Raw files are not included in this repository.

Priority clarification from Andrew: retain **forecast QPF minus duration-matched FFG** as a future candidate. Set aside **observed QPE minus FFG** as the retrospective product. Existing QPE/FFG ratios remain distinct.

## Legend refinement — 19 October 2026

All nine map legends and the offline viewer now say **Lower guidance / possible wetting** and **Higher guidance / possible drying**. The qualification preserves the intended hydrologic interpretation without attributing every guidance change to soil moisture. A note identifies streamflow conditions and RFC updates as additional influences.

The frozen overlay bytes, palette, endpoints and numerical evidence are unchanged. `legend_update.json` records the overlay hashes. `tools/relabel_ffg_tendency_review.py` reproduces these presentation updates directly from the embedded frozen overlays when the original rolling GRIB files are no longer accessible. The primary renderer is updated for future runs as well. This remains a review branch; tendency layers are not activated in production.
