# H8 durable publishing and dashboard verification

18 October 2026. Fine-scale MRMS Pass 1 QPE remains the leading candidate; FFG-grid averages and Pass 2 remain explicitly identified comparisons.

## Implemented

- Atomic publication of scientific sources, immutable rainfall/FFG bindings, display images and status on a separate data branch. Every run restores the authoritative branch, verifies checksums, and rejects concurrent publication. A missing production branch requires explicit initialization; an ephemeral cache cannot silently replace it.
- Raw QPE GRIB/gzip, exact FFG GRIB, derived numerical rasters and their window records survive clean runners. Six hours of window records are retained at the branch tip, plus current display generations and their required Pass 1 baseline. The sustained-operation policy now replaces the dedicated H8 data branch with a single parentless snapshot using an exact-head lease, with a 512 MiB publication budget. See [retention and scheduling](retention.md). Code history is unaffected.
- Twelve exclusive dashboard choices: 1/3/6-hour windows × fine/averaged QPE × Pass 1/Pass 2. Overlays are 4000×2538 in EPSG:3857, sampled with nearest neighbor after the scientific ratio calculation. State outlines remain above the overlays. Raster colors retain the reviewed palette.
- Legends show rainfall window, FFG snapshot, reference cycle, original pairing timestamp, latest check and hiding deadline. Pass 2 can be an earlier paired window and is explicitly labeled. Failed updates retain only the complete validated pair until its original deadline; they do not reset age.
- Browser image verification stages all six assets before swapping a pass. Bitmap decoding is explicitly closed before staging the next image; a partial batch preserves the prior generation.

## Evidence

- 14 scientific/pairing tests; 4 isolated Git publisher/restore/conflict tests; 7 browser freshness assertions passed.
- A real-data local publication and clean Git restore verified every scientific and display checksum.
- GitHub run [39148506356](https://github.com/andreworrison-cloud/wpc-hydro-dashboard/actions/runs/39148506356) successfully ingested, exported and published to `data/qpe-ffg-review`. Dashboard validation also passed on GitHub.
- The full dashboard browser test exercised all 12 choices, matching legends, opacity, real image decoding, all background controls, partial-download retention, outage retention and expiry hiding, with no page errors. See `browser_result.json` and `dashboard_review.png`. External tile providers and unrelated meteorological services were isolated, so this is not a live basemap-provider availability test. The screenshot uses the real 16Z rainfall window, not the earlier 00Z heavy-rain case.
- GitHub run [39149009785](https://github.com/andreworrison-cloud/wpc-hydro-dashboard/actions/runs/39149009785) also succeeded on a new runner. The archived 16Z Pass 1 generation, FFG hash and original pairing timestamp are unchanged across both runs; see `cross_run_result.json`. The second run restored the authoritative state and republished successfully.

## Activation boundary

The workflow publishes automatically from this implementation branch to the isolated **review** data branch. On `main`, it is manual-dispatch only and uses `data/qpe-ffg`. No cron schedule is installed. Production can be initialized from the fully verified review-data commit, preserving its exact source records and original pairing timestamps. Deployment status is tracked in PR #16. Recurring scheduling remains a separate activation step; the initial products will hide at their original deadlines if no new run occurs.

The ratio is observed rainfall divided by paired RFC guidance. It is not a new official RFC FFG product, a flood probability, or remaining rainfall capacity. Fine-scale QPE preserves rainfall structure without adding native FFG resolution. The Florida gauge check corroborated localized rainfall but did not definitively validate the exact maximum; those qualifications remain in the H8 science review.

### Pass 2 viewing policy — 2026-10-19
New Pass 2 generations remain viewable until the earliest of rainfall ending +6 hours,
paired FFG snapshot +9 hours, or paired RFC reference cycle +15 hours. This is a
dashboard viewing limit for an earlier observed-rainfall comparison, not an official
RFC validity period. Pass 1 retains its 3/3/9-hour policy. Both menu and legend show
the paired RFC cycle; expiry labels identify the limiting input. Pass 2 uses only
the archived, hash-verified same-window Pass 1 guidance, never newer replacement FFG.
Pass 1 failures no longer skip the independent Pass 2 attempt (failure still reported).
Existing immutable generations retain their original deadlines; the extended policy
begins with newly generated pairs. Failed updates never reset a viewing deadline.
Six-hour archive retention plus active pairs/baselines and the 512 MiB cap are unchanged.
Validation: 16 ingest/pairing tests, 8 storage tests, 17 display/timing assertions.
