# H8 retention and scheduling policy

18 October 2026

## Retention

The H8 data branches (`data/qpe-ffg` and `data/qpe-ffg-review`) are operational snapshots, not permanent meteorological archives. Keep six hours of rainfall-window records and associated raw QPE, exact paired FFG, derived rasters and display PNGs. Also retain the current complete product for each pass and the matching Pass 1 baseline for the current Pass 2 product, even after expiry. Retention never extends the display deadline. The existing 3-hour rainfall/FFG-snapshot and 9-hour reference-cycle limits remain unchanged.

Each successful publication creates a parentless commit containing all retained files. An explicit force-with-lease against the exact restored head atomically replaces only the selected H8 data branch. This deliberately removes its old commits from branch ancestry; it does not rewrite main, code branches or other products. Frozen bindings, hashes and original pairing times remain in the retained snapshot. Both a preflight head check and the final server-side lease protect against concurrent writers.

After pruning and scientific verification, reject snapshots above 512 MiB before committing or pushing. A budget violation, invalid product or publication race leaves the previous remote snapshot intact and fails the workflow. Operators must investigate rather than reinitialize or drop required baselines. This cap bounds published payload size; it is not a GitHub repository quota guarantee.

GitHub controls garbage collection of unreachable old objects. Replacement bounds reachable H8 branch history but does not immediately erase server objects, workflow references or caches. Observe repository disk usage during operations; persistent growth requires dedicated object storage with lifecycle deletion, not ever more frequent history rewrites. Existing one-time research/review branches remain fixed evidence and must not receive recurring raster archives.

Workflow artifacts contain metadata and attempt evidence only, expire after 14 days, and are not authoritative recovery sources. Recover from the current verified data branch. Missing branches require deliberate initialization. This policy is not a long-term rainfall archive or an independent disaster-recovery backup.

## Cron-job.org activation

Run hourly at minute 30 UTC, allowing for nominal Pass 1 latency while collecting separately labeled delayed Pass 2 windows. Existing RFC FFG and SPoRT jobs remain as configured. No duplicate GitHub native cron is added.

POST `https://api.github.com/repos/andreworrison-cloud/wpc-hydro-dashboard/actions/workflows/publish_qpe_ffg.yml/dispatches` with JSON body `{"ref":"main"}`. Reuse the established GitHub authentication/header arrangement securely; do not put credentials in repository files or run logs. Do not enable `initialize` in recurring requests.

Before enabling recurrence, manually test the job, verify GitHub accepts the dispatch, and then verify the corresponding production workflow succeeds, the data-branch commit has no parents, and source/display metadata pass checksum and freshness checks. A successful HTTP dispatch alone is not proof of successful ingest. Enable failure notifications if supported by the existing account settings. Preserve the usual expiration behavior during source outages.

Activation verified on 18 October 2026: cron-job.org job **8671975**, “WPC Window-Fixed QPE FFG hourly”, enabled with `30 * * * *` (UTC), confirmed after reload. The dispatch test returned HTTP 200 and launched production run [39156530889](https://github.com/andreworrison-cloud/wpc-hydro-dashboard/actions/runs/39156530889), which completed successfully. Production snapshot `cf13de6dc8f532ce9660e412370fa3b9fe379fa9` has no parent commits; a clean restore verified all source and display checksums. Snapshot size: 47.91 MiB. Pass 1: 18Z, expiry 21Z; Pass 2: separately labeled 17Z, original expiry 19Z. Existing disable-after-failures notification setting was preserved.

Retention qualification: eight publisher/retention tests, fourteen scientific tests, seven freshness assertions; review workflow 39152127515 succeeded. Its 38.76 MiB snapshot preserved all three prior frozen window records exactly. PR #17 merged the retention policy. The next recurring dispatch was scheduled for 19:30Z (3:30 PM EDT); this record verifies activation and the manual end-to-end test, not a subsequent scheduled run.
