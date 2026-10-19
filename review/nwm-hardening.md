# NWM ingest and freshness hardening

NWM remains the native 1 km SOILSAT_TOP (top two layers, 0–40 cm) saturation product, not SPoRT relative soil moisture. Existing reprojection, rendering size and color palette are preserved.

- Require dimensionless units `1`, the audited scale/offset contract, and decoded fractions in [0,1], allowing only 1e-6 numerical tolerance at endpoints. No maximum-based unit guessing.
- Internal decoded time and global output-valid time must both match the requested file cycle. Store model initialization separately. Do not regress the published valid time.
- Source-time age is recomputed every 30 seconds in the browser, including when metadata retrieval fails. Dashboard policy: warn at 3 hours, hide at 6 hours; these are local display limits, not NOAA product expiration times.
- An ingest failure keeps the prior image and original valid/retrieved times, records the failed attempt, publishes that status, then fails the workflow visibly. Browser fetch failures also retain the validated map only until its original expiry.
- Existing cron-job.org QPE workflow dispatch (hourly at :30) invokes NWM as an independent reusable job. The native GitHub cron is removed. No extra external job or credential is created. Initial main-branch code merge triggers one NWM run; manual dispatch remains available. GitHub execution queues can still delay jobs even with external dispatch.

Validation: 6 Python contract/failure tests; 7 browser-state assertions; dashboard registry validation and JavaScript syntax. Actual 2026-10-19 00Z NWM AWS file passed time/packing/grid checks with 12,248,155 valid cells, 0.3–100% saturation. Initialization was 2026-10-18 21Z. NOMADS remains the operational download source.

The next H7 comparison uses matched valid times and separate product legends; no direct averaging or differencing of NWM saturation and SPoRT RSM.
