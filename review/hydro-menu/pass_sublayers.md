# Visible QPE pass sub-layers — 19 October 2026

Observed Rainfall / FFG now contains two visible sub-layer headings:

- **Pass 1 · Latest rainfall** opens by default and is described as the primary real-time view.
- **Pass 2 · Refined rainfall** remains visible when collapsed, with its value explained: reassess earlier rainfall using additional gauge information.

Each pass retains its existing 1-, 3-, and 6-hour fine-scale and FFG-grid-average controls. No new layer is automatically turned on at dashboard startup. All 12 original layer IDs, adapters, mutual exclusion, and numerical pairings are preserved.

Both headings display the rainfall-through timestamp, age measured from that timestamp, and availability/freshness status, including while Pass 2 is collapsed. The selected layer legend prominently repeats rainfall-through time, age and accumulation duration. Pass 2 explains that comparison of revisions requires the same rainfall window and paired guidance, and that more gauges do not guarantee greater accuracy everywhere.

The group renderer and registry traversal now support nested groups. Existing search expands matching ancestors and children. All 166 registered dashboard layers remain present.

Validation: JavaScript syntax; dashboard validator (166 layers); seven existing freshness checks; four new observation-age checks; DOM check of 12 unique nested controls, group counts, default expansion, visible Pass 2 purpose, and both timestamp slots. Browser verification is recorded separately after deployment if available. Source ingest, publication cadence, retention and expiration policies are unchanged.

## Live browser verification

Pages deployment 39269917575 succeeded. On 19 October 2026 around 14:34Z, the live dashboard showed Pass 1 rainfall through 14Z and Pass 2 through 13Z, with distinct observation ages. Both pass headings remained visible when collapsed. Selecting Pass 2 deselected Pass 1 and left exactly one QPE/FFG raster. Both legends showed the correct pass, accumulation duration, rainfall endpoint and guidance pairing. Searching for Pass 2 expanded the nested group and exposed all six matching controls. Screenshot: [live menu and Pass 2 legend](qpe-pass-sublayers-live.jpg).

## Menu simplification — 19 October 2026

Removed the introductory “Start with Pass 1…” sentence. Each pass now exposes only the 1-, 3-, and 6-hour fine-scale QPE/FFG controls. Removed redundant Fine-scale suffixes and repeated row descriptions; the legend still identifies the method. FFG-grid-average comparisons remain available to the research/ingest workflow but are no longer registered in the operational menu. Source products and arithmetic are unchanged. The dashboard now has 160 registered layers (six averaged controls removed).

Fine-scale preserves native QPE structure against corresponding FFG values; averaging QPE onto the larger FFG cells can dilute narrow rainfall maxima. Fine-scale display does not increase FFG resolution.
