# H8 frozen-pair implementation and verification

18 October 2026 — review branch only.

The ingest now saves immutable per-window bindings after numerical validation and checksum verification, before replacing the current metadata pointer. A repeat run resolves FFG from that binding and verifies the retained files; it does not rediscover or replace the guidance. Fine-scale and averaged QPE products remain numerically unchanged. Pass 1 is the leading candidate.

Pass 2 requires an accepted Pass 1 baseline for the identical rainfall window and uses its exact FFG hash and original pairing timestamp. Discovery selects the newest available Pass 2 window with a still-valid archived Pass 1 binding. If this is older than the current Pass 1 window, status explicitly says `accepted_prior_window` and identifies both ending times plus the matching archived Pass 1 generation. It must not be displayed as a same-time comparison against the newer Pass 1 map. If no eligible paired window exists, status says `waiting_for_paired_window`. Historical replay remains restricted to its specifically requested window.

Changed source hashes for an already bound window are rejected as revisions requiring explicit review. There is no automatic correction override. Damaged frozen assets fail closed, without substituting newer guidance. Historical and live bindings have separate indexes. Failure retention verifies every referenced asset and evaluates the original deadline; repeated attempts do not renew freshness. The final publication step also checks expiration after processing. All gates use the existing review limits: QPE 3 hours, FFG snapshot 3 hours, GRIB reference 9 hours, with expiration at the boundary.

A nonblocking filesystem lock excludes another ingest writer using the same output directory throughout discovery, generation construction and pointer updates. This is a local-process protection, not a distributed GitHub publication lock. Pass 1 and Pass 2 pointers are individually atomic; consumers must use window identity and attempt status when comparing them.

## Verification

- **14 focused tests passed:** common rainfall windows, stale/missing windows, preservation of narrow maxima and zeros, missing-data coverage, retained-product expiration/corruption, later FFG exclusion, revision rejection, frozen-source corruption, exact Pass 2 baseline requirement, absent baseline, separate historical/live bindings, fixed baseline expiry, delayed prior-window selection, and writer exclusion/release. Some tests cover multiple conditions.
- A fresh NOAA-source historical ingest for 18 October 00Z accepted all three Pass 1 and all three Pass 2 durations under the frozen-window code. This was a retrospective retrieval, not an operational availability measurement.
- The full-grid offline regression replay uses those hash-verified source bytes. Its first run withholds Pass 2; the next makes it available while making any further WPC FFG discovery/download an assertion failure. Pass 1 metadata remains identical; both passes share the same frozen guidance and pairing timestamp. **All 24 derived TIFF hashes match the initial accepted numerical outputs.**
- `verification/pairing_replay_result.json` records the final replay result; `pairing_test_output.txt` records the focused test run. The replay simulates availability; it does not measure real source latency or prove continuous operational uptime.

Reproduce the focused tests:

```bash
python tools/test_h8_review.py
```

Reproduce the full-grid replay after obtaining a review cache containing accepted Pass 1 and Pass 2 generations for the same ending and FFG baseline:

```bash
python tools/replay_h8_pairing.py --fixture-root /path/to/source-review-cache --output-dir /path/to/new-replay-directory
```

## Remaining production work

The production publisher must durably preserve the window bindings and their referenced source generations across runners. A cache miss must not silently establish a replacement baseline for an already published window. Add workflow concurrency and guarded publication, then connect dashboard controls, legends and window-specific freshness display. Exercise a live update sequence before activating the scheduler. Neither this change nor its tests deploy an operational layer or change an existing cron job.

The current retained-source files reside in the review cache, not in this Git commit. The numerical evidence and provenance are committed; durable production source retention is still a separate required step. Historical/live review invocations should use separate output directories because their top-level display metadata pointers are shared within a directory.
