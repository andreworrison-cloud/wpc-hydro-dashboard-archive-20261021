#!/usr/bin/env python3
from pathlib import Path
import json
import re
import struct
import sys

ROOT = Path(__file__).resolve().parents[1]
app = (ROOT / "app.js").read_text(encoding="utf-8")
index = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "style.css").read_text(encoding="utf-8")
glm_generator = (ROOT / "fetch_glm_mosaic.py").read_text(encoding="utf-8")
glm_workflow = (ROOT / ".github" / "workflows" / "update_glm_mosaic.yml").read_text(encoding="utf-8")
lightningcast_generator = (ROOT / "fetch_lightningcast.py").read_text(encoding="utf-8")
lightningcast_workflow = (ROOT / ".github" / "workflows" / "update_lightningcast.yml").read_text(encoding="utf-8")
hrrr_tle_generator = (ROOT / "fetch_hrrr_tle.py").read_text(encoding="utf-8")
hrrr_tle_workflow = (ROOT / ".github" / "workflows" / "update_hrrr_tle.yml").read_text(encoding="utf-8")
nrcs_hsg_generator = (ROOT / "fetch_nrcs_hsg.py").read_text(encoding="utf-8")
nrcs_hsg_metadata_path = ROOT / "static" / "nrcs_hydrologic_soil_group_metadata.json"
nrcs_hsg_image_path = ROOT / "static" / "nrcs_hydrologic_soil_group.png"
nlcd_impervious_generator = (ROOT / "fetch_nlcd_impervious.py").read_text(encoding="utf-8")
nlcd_impervious_metadata_path = ROOT / "static" / "usgs_nlcd_fractional_impervious_2025_metadata.json"
nlcd_impervious_image_path = ROOT / "static" / "usgs_nlcd_fractional_impervious_2025.png"
nldas3_static_generator = (ROOT / "tools" / "build_nldas3_static.py").read_text(encoding="utf-8")
nldas3_static_metadata_path = ROOT / "static" / "nldas3_static_metadata.json"
nldas3_soil_image_path = ROOT / "static" / "nldas3_soil_texture.png"
nldas3_landcover_image_path = ROOT / "static" / "nldas3_landcover.png"
nldas3_slope_generator = (ROOT / "tools" / "build_nldas3_slope.py").read_text(encoding="utf-8")
nldas3_slope_metadata_path = ROOT / "static" / "nldas3_slope_metadata.json"
nldas3_slope_image_path = ROOT / "static" / "nldas3_slope_percent.png"
mrms_rala_generator = (ROOT / "fetch_mrms_rala.py").read_text(encoding="utf-8")
mrms_rala_loop_generator = (ROOT / "fetch_mrms_rala_loop.py").read_text(encoding="utf-8")
mrms_rala_workflow = (ROOT / ".github" / "workflows" / "update_mrms_rala.yml").read_text(encoding="utf-8")

errors = []

# Current registry total includes all existing dashboard data/config entries,
# basemaps, and the two validated NASA NLDAS-3 static land-surface layers.
EXPECTED_LAYER_COUNT = 186
LIGHTNINGCAST_LAYER_ID = "lightningcast-probability-60min"

# Preserve the exact operational menu order. Dashboard Utilities is rendered
# immediately after the registered data sections rather than being stored as
# another dashboardSections entry.
required_sections = [
    "Active Hazards & Warnings",
    "Radar and Satellite Data (Real-Time)",
    "Antecedent Hydrologic Conditions",
    "Land-Surface Runoff Sensitivity",
    "Wildfire / Burn Scar Context",
    "RAP Mesoanalysis Data",
    "GDI Thermodynamic Guidance",
    "HRRR Flash Flood Diagnostics - Experimental",
    "HRRR-TLE Flash Flood Guidance - Experimental",
    "CAM Nowcasts (+3h to +9h)",
    "CAM Nowcasts (+9h to +15h)",
    "Day 1 ERO CAMs",
    "Experimental Models",
    "Dashboard Utilities",
]

section_positions = []
for section in required_sections:
    marker = (
        f"title: '{section}'"
        if section != "Dashboard Utilities"
        else '<span class="section-title">Dashboard Utilities</span>'
    )
    position = app.find(marker)
    if position < 0:
        errors.append(f"Missing section: {section}")
    section_positions.append(position)

if (
    all(position >= 0 for position in section_positions)
    and section_positions != sorted(section_positions)
):
    errors.append("Dashboard sections are not in the required order.")

required_labels = [
    "Active Hydro Warnings & Advisories",
    "MRMS RALA — Direct NOAA (10-Min Loop)",
    "IEM NEXRAD Radar — Backup (2-Hour Loop)",
    "MRMS FLASH CREST Unit Q — Rolling 24-Hour Maximum",
    "MRMS FLASH FFD — Rolling 24-Hour Maximum Category",
    "GOES GLM Controlled Mosaic — Latest 5-Minute FED",
    "GOES GLM Controlled Mosaic — Rolling 30-Minute Accumulation",
    "GOES GLM Controlled Mosaic — Rolling 60-Minute Accumulation",
    "GOES GLM Controlled Mosaic — Convective Trend (15 min)",
    "CIMSS/SSEC LightningCast — Probability of Lightning in Next 60 Minutes",
    "NWM Soil Saturation (0-40cm)",
    "NASA SPoRT-LIS Relative Soil Moisture (0–10 cm)",
"NASA SPoRT-LIS Relative Soil Moisture (0–200 cm)",
"NASA SPoRT-LIS VSM Percentile (0–10 cm)",
"NASA SPoRT-LIS VSM Percentile (0–40 cm)",
"NASA SPoRT-LIS VSM Percentile (0–100 cm)",
"NASA SPoRT-LIS VSM Percentile (0–200 cm)",
    "NRCS Hydrologic Soil Group (A–D / Dual)",
    "NASA NLDAS-3 Soil Texture (Static)",
    "NASA NLDAS-3 Land Use / Vegetation (Static)",
    "NASA NLDAS-3 / MERIT Terrain Slope (Static)",
    "USGS Annual NLCD Fractional Impervious Surface (%)",
    "NIFC/WFIGS Current Wildfire Perimeters",
    "NIFC/WFIGS Historical Wildfire Perimeters",
    "Precipitable Water (PWAT)",
    "3-Hour PWAT Change",
    "+3h Forecast:</b> PWAT",
    "850mb Moisture Transport",
    "3-Hour 850mb Moisture Transport Change",
    "+3h Forecast:</b> 850mb Moisture Transport",
    "Max FFG Exceedance Ratio — Next 12 Hours",
    "FFG Exceedance Areal Coverage — Next 12 Hours",
    "FFG Exceedance Consensus",
    "Median Neighborhood-Max QPF / FFG Ratio",
    "1-h FFG Exceedance",
    "3-h FFG Exceedance",
    "6-h FFG Exceedance",
    "1-h QPF ≥ 1 in",
    "1-h QPF ≥ 2 in",
    "1-h QPF ≥ 3 in",
    "≥1 in in 2 of 3 Hours",
    "Rolling 3-h QPF ≥ 2 in",
    "Rolling 3-h QPF ≥ 3 in",
    "FFG Exceedance +00–03 h",
    "FFG Exceedance +03–06 h",
    "FFG Exceedance +06–09 h",
    "FFG Exceedance +09–12 h",
    "Prior 3 HRRR Cycles",
    "Latest 3 HRRR Cycles",
    "Run-to-Run Signal Change",
    "<b>SuperEnsemble</b>: Max FFG Exceedance",
    "<b>SuperEnsemble [ERO]</b>: Max FFG Exceedance",
]

for label in required_labels:
    if label not in app:
        errors.append(f"Missing required layer label: {label}")

# Enforce the agreed placement of the two rolling MRMS FLASH layers within
# Radar and Satellite Data. They belong directly after MRMS 24-Hour QPE and
# before the longer-duration MRMS QPE layers.
radar_start = app.find("title: 'Radar and Satellite Data (Real-Time)'")
antecedent_start = app.find("title: 'Antecedent Hydrologic Conditions'")
if radar_start >= 0 and antecedent_start > radar_start:
    radar_block = app[radar_start:antecedent_start]

    # Direct NOAA MRMS RALA is now the primary looping radar. The prior IEM
    # NEXRAD loop remains immediately beneath it as a mutually-exclusive backup.
    primary_radar_labels = [
        "{id: 'mrms-rala-direct'",
        "{id: 'nexrad-loop'",
        "{id: 'mrms-ffd'",
    ]
    primary_radar_positions = [radar_block.find(label) for label in primary_radar_labels]
    if any(position < 0 for position in primary_radar_positions):
        errors.append("Radar section is missing the primary MRMS RALA / IEM backup contract.")
    elif primary_radar_positions != sorted(primary_radar_positions):
        errors.append("Primary MRMS RALA and IEM backup radar are not in the required order.")

    radar_labels = [
        "{id: 'mrms-qpe-24h'",
        "{id: 'mrms-flash-crest-24h'",
        "{id: 'mrms-flash-ffd-24h'",
        "{id: 'mrms-qpe-48h'",
    ]
    radar_positions = [radar_block.find(label) for label in radar_labels]
    if any(position < 0 for position in radar_positions):
        errors.append(
            "Radar and Satellite Data is missing a required MRMS FLASH layer."
        )
    elif radar_positions != sorted(radar_positions):
        errors.append(
            "MRMS FLASH rolling layers are not in the required radar-section order."
        )

    glm_radar_labels = [
        "{id: 'goes-west-ir'",
        "{id: 'glm-mosaic-5min'",
        "{id: 'glm-mosaic-30min'",
        "{id: 'glm-mosaic-60min'",
        "{id: 'glm-convective-trend-15min'",
        "{id: 'lightningcast-probability-60min'",
    ]
    glm_radar_positions = [radar_block.find(label) for label in glm_radar_labels]
    if any(position < 0 for position in glm_radar_positions):
        errors.append("Radar and Satellite Data is missing a required GOES/LightningCast layer.")
    elif glm_radar_positions != sorted(glm_radar_positions):
        errors.append("GOES GLM and LightningCast layers are not in the required radar-section order.")

# Enforce the agreed order within Antecedent Hydrologic Conditions.
antecedent_start = app.find("title: 'Antecedent Hydrologic Conditions'")
rap_start = app.find("title: 'RAP Mesoanalysis Data'")
if antecedent_start >= 0 and rap_start > antecedent_start:
    antecedent_block = app[antecedent_start:rap_start]
    antecedent_labels = [
        "NASA SPoRT-LIS Relative Soil Moisture (0–10 cm)",
"NASA SPoRT-LIS Relative Soil Moisture (0–200 cm)",
"NASA SPoRT-LIS VSM Percentile (0–10 cm)",
"NASA SPoRT-LIS VSM Percentile (0–40 cm)",
"NASA SPoRT-LIS VSM Percentile (0–100 cm)",
"NASA SPoRT-LIS VSM Percentile (0–200 cm)",
        "NWM Soil Saturation (0-40cm)",
    ]
    antecedent_positions = [
        antecedent_block.find(label) for label in antecedent_labels
    ]
    if any(position < 0 for position in antecedent_positions):
        errors.append(
            "Antecedent Hydrologic Conditions is missing a required layer."
        )
    elif antecedent_positions != sorted(antecedent_positions):
        errors.append(
            "Antecedent Hydrologic Conditions layers are not in the "
            "required order."
        )

# Phase H1 — NRCS Hydrologic Soil Group / land-surface runoff sensitivity.
# This is intentionally a static annual soil-survey layer. Dynamic soil-moisture
# and RFC FFG products remain separate antecedent-state inputs. The browser must
# consume the final native-30m-v2 metadata contract produced by the completed
# national Phase H1 analysis, not the superseded pre-build H1 schema.
required_hsg_app_fragments = [
    "title: 'Land-Surface Runoff Sensitivity'",
    "NRCS Hydrologic Soil Group (A–D / Dual)",
    "{id: 'nrcs-hsg', label: NRCS_HSG_LAYER_NAME",
    "static/nrcs_hydrologic_soil_group.png",
    "static/nrcs_hydrologic_soil_group_metadata.json",
    "nrcs-hsg-raster",
    "image-rendering: pixelated !important",
    "fetchNRCSHSGMetadata",
    "nrcs-hsg-time-box",
    "nrcsHsgLegendHTML",
    "nrcs_hsg_dashboard_h1_native30m_v2",
    "nrcs-hsg-native30m-h1-v2-3",
    "data.attribute !== 'hydgrpdcd'",
    "data.attribute_label !== 'Hydrologic Group - Dominant Conditions'",
    "data.source_geometry_vintage !== 'FY2026'",
    "Number(data.source_native_resolution_m) !== 30",
    "Number(data.scientific_analysis_resolution_m) !== 1000",
    "data.categorical !== true",
    "data.smoothing !== false",
    "data.display_resampling !== 'nearest-neighbor'",
    "const staticVersion = [data.source_geometry_vintage, data.render_revision, data.generated_utc]",
    "if (!nrcsHsgReady) fetchNRCSHSGMetadata();",
    "['A', 'B', 'C', 'D', 'A/D', 'B/D', 'C/D']",
    "scientific GeoTIFFs",
]
for fragment in required_hsg_app_fragments:
    if fragment not in app:
        errors.append(f"Missing NRCS HSG Phase H1 app contract fragment: {fragment}")

# Enforce the new hydrologic architecture without disturbing the existing
# Antecedent -> HSG -> Wildfire -> RAP order around it.
antecedent_start = app.find("title: 'Antecedent Hydrologic Conditions'")
hsg_start = app.find("title: 'Land-Surface Runoff Sensitivity'")
wildfire_start = app.find("title: 'Wildfire / Burn Scar Context'")
rap_start = app.find("title: 'RAP Mesoanalysis Data'")
if not (
    antecedent_start >= 0
    and hsg_start > antecedent_start
    and wildfire_start > hsg_start
    and rap_start > wildfire_start
):
    errors.append(
        "Hydrologic section order is not Antecedent -> Land-Surface Runoff Sensitivity -> Wildfire -> RAP."
    )

required_hsg_generator_fragments = [
    'METADATA_MODE = "nrcs_hsg_dashboard_h1_native30m_v2"',
    'ANALYSIS_METADATA_MODE = "nrcs_hsg_native30m_analysis_v2_3"',
    'RENDER_REVISION = "nrcs-hsg-native30m-h1-v2-3"',
    'EXPECTED_SOURCE_VINTAGE = "FY2026"',
    'EXPECTED_SOURCE_NATIVE_RESOLUTION_M = 30',
    'EXPECTED_ANALYSIS_RESOLUTION_M = 1000',
    'EXPECTED_ANALYSIS_CRS = "EPSG:5070"',
    'MINIMUM_CLASSIFIED_COVERAGE = 0.25',
    'DEFAULT_OUTPUT_WIDTH = 10000',
    'OUTPUT_IMAGE = "nrcs_hydrologic_soil_group.png"',
    'OUTPUT_METADATA = "nrcs_hydrologic_soil_group_metadata.json"',
    '"A/D"', '"B/D"', '"C/D"',
    'load_analysis_metadata',
    'validate_dominant_raster',
    'muaggatt.hydgrpdcd',
    'Resampling.nearest',
    'TARGET_CRS = "EPSG:3857"',
    '"scientific_analysis_resolution_m"',
    '"analysis_source_note"',
    '"categorical": True',
    '"smoothing": False',
    'NRCS HSG Phase H1 native30m v2.3 publication self-test: PASS',
]
for fragment in required_hsg_generator_fragments:
    if fragment not in nrcs_hsg_generator:
        errors.append(f"Missing NRCS HSG Phase H1 generator contract fragment: {fragment}")

# Validate the actual committed dashboard assets against the final Phase H1
# metadata contract. This guards against accidentally committing the old pilot
# output or a display image generated from a different scientific source.
if not nrcs_hsg_metadata_path.exists():
    errors.append("Missing static/nrcs_hydrologic_soil_group_metadata.json")
else:
    try:
        hsg_meta = json.loads(nrcs_hsg_metadata_path.read_text(encoding="utf-8"))
        if hsg_meta.get("metadata_mode") != "nrcs_hsg_dashboard_h1_native30m_v2":
            errors.append("Committed NRCS HSG metadata_mode is not the native30m Phase H1 contract.")
        if hsg_meta.get("render_revision") != "nrcs-hsg-native30m-h1-v2-3":
            errors.append("Committed NRCS HSG render revision is not v2.3.")
        if hsg_meta.get("domain") != "CONUS":
            errors.append("Committed NRCS HSG domain is not CONUS.")
        if hsg_meta.get("source_geometry_vintage") != "FY2026":
            errors.append("Committed NRCS HSG source geometry vintage is not FY2026.")
        if int(hsg_meta.get("source_native_resolution_m", -1)) != 30:
            errors.append("Committed NRCS HSG native source resolution is not 30 m.")
        if int(hsg_meta.get("scientific_analysis_resolution_m", -1)) != 1000:
            errors.append("Committed NRCS HSG scientific analysis resolution is not 1 km.")
        if hsg_meta.get("attribute") != "hydgrpdcd":
            errors.append("Committed NRCS HSG attribute is not hydgrpdcd.")
        if hsg_meta.get("attribute_label") != "Hydrologic Group - Dominant Conditions":
            errors.append("Committed NRCS HSG attribute label changed unexpectedly.")
        if str(hsg_meta.get("image_crs", "")).upper() != "EPSG:3857":
            errors.append("Committed NRCS HSG display image is not EPSG:3857.")
        if hsg_meta.get("display_resampling") != "nearest-neighbor":
            errors.append("Committed NRCS HSG display is not nearest-neighbor categorical rendering.")
        if hsg_meta.get("smoothing") is not False or hsg_meta.get("categorical") is not True:
            errors.append("Committed NRCS HSG metadata violates the categorical/no-smoothing contract.")
        expected_hsg_classes = ["A", "B", "C", "D", "A/D", "B/D", "C/D"]
        actual_hsg_classes = [item.get("name") for item in hsg_meta.get("classes", [])]
        if actual_hsg_classes != expected_hsg_classes:
            errors.append("Committed NRCS HSG class order is not A, B, C, D, A/D, B/D, C/D.")
        rated_fractions = [float(item.get("rated_display_fraction", 0.0)) for item in hsg_meta.get("classes", [])]
        if rated_fractions and abs(sum(rated_fractions) - 1.0) > 1e-6:
            errors.append("Committed NRCS HSG rated class fractions do not sum to 1.")
        if not str(hsg_meta.get("analysis_source_note", "")).endswith("scientific GeoTIFFs, not this PNG."):
            errors.append("Committed NRCS HSG metadata is missing the display-vs-science safeguard.")
        if hsg_meta.get("bounds") != [[23.0, -125.0], [50.5, -66.5]]:
            errors.append("Committed NRCS HSG display bounds changed unexpectedly.")
        if int(hsg_meta.get("image_width", -1)) != 10000 or int(hsg_meta.get("image_height", -1)) != 5991:
            errors.append("Committed NRCS HSG display dimensions are not 10000x5991.")
    except Exception as exc:
        errors.append(f"Could not validate committed NRCS HSG metadata: {exc}")

if not nrcs_hsg_image_path.exists():
    errors.append("Missing static/nrcs_hydrologic_soil_group.png")
else:
    try:
        with nrcs_hsg_image_path.open("rb") as fh:
            signature = fh.read(8)
            if signature != b"\x89PNG\r\n\x1a\n":
                raise ValueError("bad PNG signature")
            length = struct.unpack(">I", fh.read(4))[0]
            chunk_type = fh.read(4)
            if length != 13 or chunk_type != b"IHDR":
                raise ValueError("missing PNG IHDR")
            width, height = struct.unpack(">II", fh.read(8))
        if (width, height) != (10000, 5991):
            errors.append(f"Committed NRCS HSG PNG dimensions are {width}x{height}, expected 10000x5991.")
    except Exception as exc:
        errors.append(f"Could not validate committed NRCS HSG PNG: {exc}")

# HSG is annual/static. Do not let future work accidentally place it on the
# 15-minute dynamic-soil refresh loop.
hsg_initial_fetch = app.find("fetchNRCSHSGMetadata();")
refresh_loop_start = app.find("setInterval(() => {", hsg_initial_fetch)
refresh_loop_end = app.find("}, 15 * 60 * 1000);", refresh_loop_start)
if refresh_loop_start >= 0 and refresh_loop_end > refresh_loop_start:
    if "fetchNRCSHSGMetadata();" in app[refresh_loop_start:refresh_loop_end]:
        errors.append("Static NRCS HSG layer was incorrectly added to the 15-minute dynamic refresh loop.")


# NASA NLDAS-3 static land-surface integration.
# Browser rasters are categorical display derivatives only. They remain separate
# from dynamic soil moisture and are never scientific inputs to future FFG work.
required_nldas3_app_fragments = [
    "NASA NLDAS-3 Soil Texture (Static)",
    "NASA NLDAS-3 Land Use / Vegetation (Static)",
    "{id: 'nldas3-soil-texture', label: NLDAS3_SOIL_LAYER_NAME",
    "{id: 'nldas3-landcover', label: NLDAS3_LANDCOVER_LAYER_NAME",
    "static/nldas3_soil_texture.png",
    "static/nldas3_landcover.png",
    "static/nldas3_static_metadata.json",
    "nldas3-soil-texture-raster",
    "nldas3-landcover-raster",
    "img.nldas3-soil-texture-raster",
    "img.nldas3-landcover-raster",
    "image-rendering: pixelated !important",
    "fetchNLDAS3StaticMetadata",
    "nldas3-soil-time-box",
    "nldas3-landcover-time-box",
    "buildNLDAS3CategoricalLegendHTML",
    "nldas3_static_dashboard_v1",
    "nldas3-static-phase1-v1",
    "soil.source_variable !== 'Soiltype_inst'",
    "land.source_variable !== 'Landcover_inst'",
    "Number(soil.water_code) !== 14",
    "landWaterCodes[0] !== 17 || landWaterCodes[1] !== 21",
    "data.categorical !== true",
    "data.smoothing !== false",
    "data.display_resampling !== 'nearest-neighbor'",
]
for fragment in required_nldas3_app_fragments:
    if fragment not in app:
        errors.append(f"Missing NLDAS-3 static app contract fragment: {fragment}")

required_nldas3_generator_fragments = [
    'SOURCE_KEY = "nasa-waterinsight/NLDAS3/static/NLDAS-3_dominant-soil-vegetation.nc"',
    'TARGET_CRS = "EPSG:3857"',
    'DEFAULT_WIDTH = 9000',
    'SOIL_CLASSES = {',
    'LANDCOVER_CLASSES = {',
    '21: "Open Water (LIS template surface)"',
    'validate_categories',
    'fit_coordinate_axis',
    'Resampling.nearest',
    '"metadata_mode": "nldas3_static_dashboard_v1"',
    '"render_revision": "nldas3-static-phase1-v1"',
    '"scientific_use_note"',
    '"water_code": 14',
    '"water_codes": [17, 21]',
]
for fragment in required_nldas3_generator_fragments:
    if fragment not in nldas3_static_generator:
        errors.append(f"Missing NLDAS-3 static generator contract fragment: {fragment}")

if not nldas3_static_metadata_path.exists():
    errors.append("Missing static/nldas3_static_metadata.json")
else:
    try:
        nldas3_meta = json.loads(nldas3_static_metadata_path.read_text(encoding="utf-8"))
        if nldas3_meta.get("metadata_mode") != "nldas3_static_dashboard_v1":
            errors.append("Committed NLDAS-3 metadata_mode changed unexpectedly.")
        if nldas3_meta.get("render_revision") != "nldas3-static-phase1-v1":
            errors.append("Committed NLDAS-3 render revision changed unexpectedly.")
        if str(nldas3_meta.get("image_crs", "")).upper() != "EPSG:3857":
            errors.append("Committed NLDAS-3 display images are not EPSG:3857.")
        if nldas3_meta.get("categorical") is not True or nldas3_meta.get("smoothing") is not False:
            errors.append("Committed NLDAS-3 metadata violates the categorical/no-smoothing contract.")
        if nldas3_meta.get("display_resampling") != "nearest-neighbor":
            errors.append("Committed NLDAS-3 display is not nearest-neighbor categorical rendering.")
        if nldas3_meta.get("bounds") != [[23.0, -125.0], [50.5, -66.5]]:
            errors.append("Committed NLDAS-3 CONUS display bounds changed unexpectedly.")

        soil_meta = nldas3_meta.get("soil_texture") or {}
        land_meta = nldas3_meta.get("landcover") or {}
        if soil_meta.get("source_variable") != "Soiltype_inst":
            errors.append("Committed NLDAS-3 soil source variable is not Soiltype_inst.")
        if land_meta.get("source_variable") != "Landcover_inst":
            errors.append("Committed NLDAS-3 land-cover source variable is not Landcover_inst.")
        if int(soil_meta.get("water_code", -1)) != 14:
            errors.append("Committed NLDAS-3 soil water code is not 14.")
        if [int(v) for v in land_meta.get("water_codes", [])] != [17, 21]:
            errors.append("Committed NLDAS-3 land-cover water codes are not [17, 21].")
        if [int(item.get("code")) for item in soil_meta.get("classes", [])] != list(range(1, 17)):
            errors.append("Committed NLDAS-3 soil class sequence is not 1-16.")
        if [int(item.get("code")) for item in land_meta.get("classes", [])] != list(range(1, 22)):
            errors.append("Committed NLDAS-3 land-cover class sequence is not 1-21.")
        if "display derivatives only" not in str(nldas3_meta.get("scientific_use_note", "")):
            errors.append("Committed NLDAS-3 metadata lost the display-vs-science safeguard.")
    except Exception as exc:
        errors.append(f"Could not validate committed NLDAS-3 metadata: {exc}")

for image_path, expected_name in [
    (nldas3_soil_image_path, "NLDAS-3 soil-texture"),
    (nldas3_landcover_image_path, "NLDAS-3 land-cover"),
]:
    if not image_path.exists():
        errors.append(f"Missing {image_path.relative_to(ROOT)}")
        continue
    try:
        with image_path.open("rb") as fh:
            signature = fh.read(8)
            if signature != b"\x89PNG\r\n\x1a\n":
                raise ValueError("bad PNG signature")
            length = struct.unpack(">I", fh.read(4))[0]
            chunk_type = fh.read(4)
            if length != 13 or chunk_type != b"IHDR":
                raise ValueError("missing PNG IHDR")
            width, height = struct.unpack(">II", fh.read(8))
        if (width, height) != (9000, 5392):
            errors.append(
                f"Committed {expected_name} PNG dimensions are {width}x{height}, expected 9000x5392."
            )
    except Exception as exc:
        errors.append(f"Could not validate committed {expected_name} PNG: {exc}")

nldas3_initial_fetch = app.find("fetchNLDAS3StaticMetadata();")
nldas3_refresh_start = app.find("setInterval(() => {", nldas3_initial_fetch)
nldas3_refresh_end = app.find("}, 15 * 60 * 1000);", nldas3_refresh_start)
if nldas3_refresh_start >= 0 and nldas3_refresh_end > nldas3_refresh_start:
    if "fetchNLDAS3StaticMetadata();" in app[nldas3_refresh_start:nldas3_refresh_end]:
        errors.append("Static NLDAS-3 layers were incorrectly added to the 15-minute dynamic refresh loop.")


# NASA NLDAS-3 / MERIT static terrain-slope integration.
# Percent-slope bins are descriptive terrain ranges only and must never be
# interpreted as runoff-risk or flash-flood-risk classes.
required_nldas3_slope_app_fragments = [
    "NASA NLDAS-3 / MERIT Terrain Slope (Static)",
    "{id: 'nldas3-slope', label: NLDAS3_SLOPE_LAYER_NAME",
    "static/nldas3_slope_percent.png",
    "static/nldas3_slope_metadata.json",
    "nldas3-slope-raster",
    "img.nldas3-slope-raster",
    "fetchNLDAS3SlopeMetadata",
    "nldas3-slope-time-box",
    "buildNLDAS3SlopeLegendHTML",
    "nldas3_static_slope_dashboard_v1",
    "nldas3-merit-slope-phase1b-v1",
    "data.source_variable !== 'SLOPE'",
    "data.source_standard_name !== \"MERIT '1K' slope\"",
    "data.display?.categorical_descriptive_bins !== true",
    "data.display?.display_resampling !== 'nearest-neighbor'",
    "data.display?.smoothing !== false",
    "data.display?.transparent_missing_water !== true",
    "not runoff-risk classes",
    "No infiltration or flash-flood threshold",
]
for fragment in required_nldas3_slope_app_fragments:
    if fragment not in app:
        errors.append(f"Missing NLDAS-3 slope app contract fragment: {fragment}")

required_nldas3_slope_generator_fragments = [
    'SOURCE_KEY = "nasa-waterinsight/NLDAS3/static/lis_input.nldas3.noahmp401.1km.hymap.nc"',
    'VARIABLE = "SLOPE"',
    'TARGET_CRS = "EPSG:3857"',
    'DEFAULT_WIDTH = 9000',
    'SLOPE_BINS = [',
    'standard_name", "")) != "MERIT \'1K\' slope"',
    'Resampling.nearest',
    '"metadata_mode": "nldas3_static_slope_dashboard_v1"',
    '"render_revision": "nldas3-merit-slope-phase1b-v1"',
    '"categorical_descriptive_bins": True',
    '"display_resampling": "nearest-neighbor"',
    '"smoothing": False',
    '"transparent_missing_water": True',
    '"Percent-slope bins are descriptive terrain ranges, not runoff-risk classes."',
    '"The browser PNG is a display derivative only."',
    '"No infiltration or flash-flood threshold is inferred from slope alone."',
]
for fragment in required_nldas3_slope_generator_fragments:
    if fragment not in nldas3_slope_generator:
        errors.append(f"Missing NLDAS-3 slope generator contract fragment: {fragment}")

if not nldas3_slope_metadata_path.exists():
    errors.append("Missing static/nldas3_slope_metadata.json")
else:
    try:
        slope_meta = json.loads(nldas3_slope_metadata_path.read_text(encoding="utf-8"))
        if slope_meta.get("metadata_mode") != "nldas3_static_slope_dashboard_v1":
            errors.append("Committed NLDAS-3 slope metadata_mode changed unexpectedly.")
        if slope_meta.get("render_revision") != "nldas3-merit-slope-phase1b-v1":
            errors.append("Committed NLDAS-3 slope render revision changed unexpectedly.")
        if slope_meta.get("source_variable") != "SLOPE":
            errors.append("Committed NLDAS-3 slope source variable is not SLOPE.")
        if slope_meta.get("source_standard_name") != "MERIT '1K' slope":
            errors.append("Committed NLDAS-3 slope standard_name changed unexpectedly.")
        if str(slope_meta.get("source_units_attribute", "")) != "-":
            errors.append("Committed NLDAS-3 slope source-units attribute changed unexpectedly.")
        if str(slope_meta.get("image_crs", "")).upper() != "EPSG:3857":
            errors.append("Committed NLDAS-3 slope display image is not EPSG:3857.")
        if slope_meta.get("bounds") != [[23.0, -125.0], [50.5, -66.5]]:
            errors.append("Committed NLDAS-3 slope CONUS display bounds changed unexpectedly.")
        if int(slope_meta.get("image_width", -1)) != 9000 or int(slope_meta.get("image_height", -1)) != 5392:
            errors.append("Committed NLDAS-3 slope display dimensions are not 9000x5392.")

        display = slope_meta.get("display") or {}
        if display.get("categorical_descriptive_bins") is not True:
            errors.append("Committed NLDAS-3 slope display is not identified as descriptive categorical bins.")
        if display.get("display_resampling") != "nearest-neighbor" or display.get("smoothing") is not False:
            errors.append("Committed NLDAS-3 slope display violates the nearest-neighbor/no-smoothing contract.")
        if display.get("transparent_missing_water") is not True:
            errors.append("Committed NLDAS-3 slope missing/water cells must remain transparent.")
        expected_labels = ["0–1%", "1–2%", "2–5%", "5–10%", "10–20%", "20–30%", "30–45%", "45–60%", "≥60%"]
        actual_labels = [item.get("label") for item in display.get("bins", [])]
        if actual_labels != expected_labels:
            errors.append("Committed NLDAS-3 slope descriptive bins changed unexpectedly.")
        display_fractions = [float(item.get("display_fraction", 0.0)) for item in display.get("bins", [])]
        if display_fractions and abs(sum(display_fractions) - 1.0) > 1e-6:
            errors.append("Committed NLDAS-3 slope display-bin fractions do not sum to 1.")

        stats = slope_meta.get("source_stats") or {}
        if not (
            0.0 <= float(stats.get("median_percent", -1.0)) < 5.0
            and 5.0 < float(stats.get("p90_percent", -1.0)) < 15.0
            and 15.0 < float(stats.get("p99_percent", -1.0)) < 35.0
            and 60.0 < float(stats.get("max_percent", -1.0)) < 90.0
        ):
            errors.append("Committed NLDAS-3 slope source statistics are outside the validated CONUS range.")

        safeguards = " ".join(slope_meta.get("science_safeguards") or [])
        if (
            "not runoff-risk classes" not in safeguards
            or "display derivative only" not in safeguards
            or "No infiltration or flash-flood threshold" not in safeguards
        ):
            errors.append("Committed NLDAS-3 slope metadata lost its science safeguards.")
    except Exception as exc:
        errors.append(f"Could not validate committed NLDAS-3 slope metadata: {exc}")

if not nldas3_slope_image_path.exists():
    errors.append("Missing static/nldas3_slope_percent.png")
else:
    try:
        with nldas3_slope_image_path.open("rb") as fh:
            signature = fh.read(8)
            if signature != b"\x89PNG\r\n\x1a\n":
                raise ValueError("bad PNG signature")
            length = struct.unpack(">I", fh.read(4))[0]
            chunk_type = fh.read(4)
            if length != 13 or chunk_type != b"IHDR":
                raise ValueError("missing PNG IHDR")
            width, height = struct.unpack(">II", fh.read(8))
        if (width, height) != (9000, 5392):
            errors.append(
                f"Committed NLDAS-3 slope PNG dimensions are {width}x{height}, expected 9000x5392."
            )
    except Exception as exc:
        errors.append(f"Could not validate committed NLDAS-3 slope PNG: {exc}")

slope_initial_fetch = app.find("fetchNLDAS3SlopeMetadata();")
slope_refresh_start = app.find("setInterval(() => {", slope_initial_fetch)
slope_refresh_end = app.find("}, 15 * 60 * 1000);", slope_refresh_start)
if slope_refresh_start >= 0 and slope_refresh_end > slope_refresh_start:
    if "fetchNLDAS3SlopeMetadata();" in app[slope_refresh_start:slope_refresh_end]:
        errors.append("Static NLDAS-3 slope layer was incorrectly added to the 15-minute dynamic refresh loop.")


# Phase H2 — USGS Annual NLCD fractional imperviousness.
# This is the second static Land-Surface Runoff Sensitivity layer. HSG remains
# first; Annual NLCD follows immediately beneath it. Both remain separate from
# dynamic antecedent-state fields.
required_nlcd_app_fragments = [
    "USGS Annual NLCD Fractional Impervious Surface (%)",
    "{id: 'nlcd-impervious', label: NLCD_IMPERVIOUS_LAYER_NAME",
    "static/usgs_nlcd_fractional_impervious_2025.png",
    "static/usgs_nlcd_fractional_impervious_2025_metadata.json",
    "nlcd-impervious-raster",
    "fetchNLCDImperviousMetadata",
    "nlcd-impervious-time-box",
    "nlcdImperviousLegendHTML",
    "usgs_nlcd_fractional_impervious_h2_dashboard_v1_1_clarified",
    "annual-nlcd-fctimp-2025-h2-v1-1-clarified",
    "data.source_product !== 'FctImp'",
    "Number(data.source_map_year) !== 2025",
    "Number(data.source_native_resolution_m) !== 30",
    "Number(data.scientific_analysis_resolution_m) !== 1000",
    "String(data.scientific_analysis_crs || '').toUpperCase() !== 'EPSG:5070'",
    "data.display_resampling !== 'nearest-neighbor'",
    "data.smoothing !== false",
    "Number(data.display_min_valid_coverage_fraction) !== 0.25",
    "String(data.zero_percent_color || '').toLowerCase() !== '#bdbdbd'",
    "Number(data.zero_percent_alpha) !== 150",
    "data.persistent_source_nodata_display !== 'transparent'",
    "data.insufficient_valid_coverage_display !== 'transparent'",
    "data.final_coverage_qa !== 'nlcd_h2_v1_1_final_coverage_qa.json'",
    "if (!nlcdImperviousReady) fetchNLCDImperviousMetadata();",
    "scientific GeoTIFFs",
]
for fragment in required_nlcd_app_fragments:
    if fragment not in app:
        errors.append(f"Missing Annual NLCD Phase H2 app contract fragment: {fragment}")

land_surface_start = app.find("title: 'Land-Surface Runoff Sensitivity'")
wildfire_start = app.find("title: 'Wildfire / Burn Scar Context'")
if land_surface_start >= 0 and wildfire_start > land_surface_start:
    land_surface_block = app[land_surface_start:wildfire_start]
    hsg_layer_pos = land_surface_block.find("{id: 'nrcs-hsg'")
    nldas3_soil_pos = land_surface_block.find("{id: 'nldas3-soil-texture'")
    nldas3_landcover_pos = land_surface_block.find("{id: 'nldas3-landcover'")
    nldas3_slope_pos = land_surface_block.find("{id: 'nldas3-slope'")
    nlcd_layer_pos = land_surface_block.find("{id: 'nlcd-impervious'")
    land_surface_positions = [
        hsg_layer_pos,
        nldas3_soil_pos,
        nldas3_landcover_pos,
        nldas3_slope_pos,
        nlcd_layer_pos,
    ]
    if any(position < 0 for position in land_surface_positions):
        errors.append(
            "Land-Surface Runoff Sensitivity is missing HSG, NLDAS-3 soil/land-cover/slope, or NLCD."
        )
    elif land_surface_positions != sorted(land_surface_positions):
        errors.append(
            "Land-Surface Runoff Sensitivity order must be HSG -> NLDAS-3 Soil -> "
            "NLDAS-3 Land Use/Vegetation -> NLDAS-3 Slope -> Annual NLCD."
        )

required_nlcd_generator_fragments = [
    'METADATA_MODE = "usgs_nlcd_fractional_impervious_h2_dashboard_v1_1_clarified"',
    'ANALYSIS_METADATA_MODE = "annual_nlcd_fractional_impervious_h2_v1_1"',
    'RENDER_REVISION = "annual-nlcd-fctimp-2025-h2-v1-1-clarified"',
    'EXPECTED_SOURCE_PRODUCT = "FctImp"',
    'EXPECTED_MAP_YEAR = 2025',
    'EXPECTED_SOURCE_NATIVE_RESOLUTION_M = 30',
    'EXPECTED_ANALYSIS_RESOLUTION_M = 1000',
    'EXPECTED_ANALYSIS_CRS = "EPSG:5070"',
    'EXPECTED_GRID_WIDTH = 4621',
    'EXPECTED_GRID_HEIGHT = 2913',
    'TARGET_CRS = "EPSG:3857"',
    'DEFAULT_OUTPUT_WIDTH = 9000',
    'MINIMUM_VALID_COVERAGE = 0.25',
    'OUTPUT_IMAGE = "usgs_nlcd_fractional_impervious_2025.png"',
    'OUTPUT_METADATA = "usgs_nlcd_fractional_impervious_2025_metadata.json"',
    'load_final_qa',
    'Resampling.nearest',
    '"zero_percent_display": "neutral-tint"',
    '"zero_percent_color": ZERO_PERCENT_COLOR',
    '"zero_percent_alpha": ZERO_PERCENT_ALPHA',
    '"persistent_source_nodata_display": "transparent"',
    '"insufficient_valid_coverage_display": "transparent"',
    'Annual NLCD Phase H2 v1.1 clarification publication self-test: PASS',
]
for fragment in required_nlcd_generator_fragments:
    if fragment not in nlcd_impervious_generator:
        errors.append(f"Missing Annual NLCD Phase H2 generator contract fragment: {fragment}")

if not nlcd_impervious_metadata_path.exists():
    errors.append("Missing static/usgs_nlcd_fractional_impervious_2025_metadata.json")
else:
    try:
        nlcd_meta = json.loads(nlcd_impervious_metadata_path.read_text(encoding="utf-8"))
        if nlcd_meta.get("metadata_mode") != "usgs_nlcd_fractional_impervious_h2_dashboard_v1_1_clarified":
            errors.append("Committed Annual NLCD metadata_mode is not the H2 v1.1 clarified contract.")
        if nlcd_meta.get("render_revision") != "annual-nlcd-fctimp-2025-h2-v1-1-clarified":
            errors.append("Committed Annual NLCD render revision is not the clarified display revision.")
        if nlcd_meta.get("source") != "USGS Annual NLCD Collection 1.2":
            errors.append("Committed Annual NLCD source changed unexpectedly.")
        if nlcd_meta.get("source_product") != "FctImp":
            errors.append("Committed Annual NLCD source product is not FctImp.")
        if int(nlcd_meta.get("source_map_year", -1)) != 2025:
            errors.append("Committed Annual NLCD source map year is not 2025.")
        if int(nlcd_meta.get("source_native_resolution_m", -1)) != 30:
            errors.append("Committed Annual NLCD native source resolution is not 30 m.")
        if int(nlcd_meta.get("scientific_analysis_resolution_m", -1)) != 1000:
            errors.append("Committed Annual NLCD scientific analysis resolution is not 1 km.")
        if str(nlcd_meta.get("scientific_analysis_crs", "")).upper() != "EPSG:5070":
            errors.append("Committed Annual NLCD scientific analysis CRS is not EPSG:5070.")
        if str(nlcd_meta.get("image_crs", "")).upper() != "EPSG:3857":
            errors.append("Committed Annual NLCD display image is not EPSG:3857.")
        if nlcd_meta.get("display_resampling") != "nearest-neighbor" or nlcd_meta.get("smoothing") is not False:
            errors.append("Committed Annual NLCD display violates the nearest-neighbor/no-smoothing contract.")
        if float(nlcd_meta.get("display_min_valid_coverage_fraction", -1)) != 0.25:
            errors.append("Committed Annual NLCD display valid-coverage threshold is not 0.25.")
        if nlcd_meta.get("zero_percent_display") != "neutral-tint":
            errors.append("Committed Annual NLCD zero-percent display must be the clarified neutral tint.")
        if str(nlcd_meta.get("zero_percent_color", "")).lower() != "#bdbdbd":
            errors.append("Committed Annual NLCD zero-percent color changed unexpectedly.")
        if int(nlcd_meta.get("zero_percent_alpha", -1)) != 150:
            errors.append("Committed Annual NLCD zero-percent alpha changed unexpectedly.")
        if nlcd_meta.get("persistent_source_nodata_display") != "transparent":
            errors.append("Committed Annual NLCD persistent source NoData must remain transparent.")
        if nlcd_meta.get("insufficient_valid_coverage_display") != "transparent":
            errors.append("Committed Annual NLCD insufficient-coverage display must remain transparent.")
        if nlcd_meta.get("final_coverage_qa") != "nlcd_h2_v1_1_final_coverage_qa.json":
            errors.append("Committed Annual NLCD metadata lost final coverage-QA provenance.")
        if nlcd_meta.get("leaflet_bounds") != [[23.0, -125.0], [50.5, -66.5]]:
            errors.append("Committed Annual NLCD display bounds changed unexpectedly.")
        if int(nlcd_meta.get("image_width", -1)) != 9000 or int(nlcd_meta.get("image_height", -1)) != 5392:
            errors.append("Committed Annual NLCD display dimensions are not 9000x5392.")
        expected_bins = [
            (0.0, 5.0, "#ffffcc", ">0–5%"),
            (5.0, 10.0, "#ffeda0", "5–10%"),
            (10.0, 20.0, "#fed976", "10–20%"),
            (20.0, 40.0, "#feb24c", "20–40%"),
            (40.0, 60.0, "#fd8d3c", "40–60%"),
            (60.0, 80.0, "#f03b20", "60–80%"),
            (80.0, 100.0001, "#bd0026", "80–100%"),
        ]
        actual_bins = [
            (
                float(item.get("min")),
                float(item.get("max")),
                str(item.get("color", "")).lower(),
                item.get("label"),
            )
            for item in nlcd_meta.get("display_bins", [])
        ]
        if actual_bins != expected_bins:
            errors.append("Committed Annual NLCD display bins/colors changed unexpectedly.")
        if "scientific GeoTIFFs" not in str(nlcd_meta.get("dynamic_model_use_note", "")):
            errors.append("Committed Annual NLCD metadata is missing the display-vs-science safeguard.")
    except Exception as exc:
        errors.append(f"Could not validate committed Annual NLCD metadata: {exc}")

if not nlcd_impervious_image_path.exists():
    errors.append("Missing static/usgs_nlcd_fractional_impervious_2025.png")
else:
    try:
        with nlcd_impervious_image_path.open("rb") as fh:
            signature = fh.read(8)
            if signature != b"\x89PNG\r\n\x1a\n":
                raise ValueError("bad PNG signature")
            length = struct.unpack(">I", fh.read(4))[0]
            chunk_type = fh.read(4)
            if length != 13 or chunk_type != b"IHDR":
                raise ValueError("missing PNG IHDR")
            width, height = struct.unpack(">II", fh.read(8))
        if (width, height) != (9000, 5392):
            errors.append(
                f"Committed Annual NLCD PNG dimensions are {width}x{height}, expected 9000x5392."
            )
    except Exception as exc:
        errors.append(f"Could not validate committed Annual NLCD PNG: {exc}")

nlcd_initial_fetch = app.find("fetchNLCDImperviousMetadata();")
refresh_loop_start = app.find("setInterval(() => {", nlcd_initial_fetch)
refresh_loop_end = app.find("}, 15 * 60 * 1000);", refresh_loop_start)
if refresh_loop_start >= 0 and refresh_loop_end > refresh_loop_start:
    if "fetchNLCDImperviousMetadata();" in app[refresh_loop_start:refresh_loop_end]:
        errors.append("Static Annual NLCD layer was incorrectly added to the 15-minute dynamic refresh loop.")

# Confirm direct NOAA MRMS RALA looping, freshness handling, data-branch
# publication, discoverable opacity, and IEM backup behavior.
required_mrms_rala_fragments = [
    "MRMS RALA — Direct NOAA (10-Min Loop)",
    "IEM NEXRAD Radar — Backup (2-Hour Loop)",
    "MRMS_RALA_DATA_ROOT",
    "mrms-rala-data",
    "mrms_rala_loop_manifest_v2",
    "MRMS_RALA_FRESHNESS_LIMIT_MINUTES = 20",
    "MRMS_RALA_DEFAULT_OPACITY = 0.85",
    "wpc-mrms-rala-opacity-v2",
    "mrmsRalaOpacityTarget",
    "mrms-rala-opacity-inline",
    "image.style.setProperty('image-rendering', 'pixelated', 'important')",
    "activateMRMSRALATimeline",
    "showMRMSRALAFrame",
    "warmMRMSRALALoopCache",
    "refreshMRMSRALAFromManifest",
    "buildMRMSRALALegendHTML",
    "mrms-rala-time-box",
    "visible_minimum_dbz) !== 5.0",
    "display.resampling !== 'nearest-neighbor'",
    "display.smoothing !== false",
    "exclusiveGroup: 'radar-primary'",
    "layer-opacity-label",
    "minSpeed: IEM_RADAR_MIN_FPS",
    "maxSpeed: IEM_RADAR_MAX_FPS",
    "speedStep: 1",
    "IEM_RADAR_DEFAULT_FPS = 5",
    "IEM_RADAR_MAX_FPS = 10",
    "MRMS_RALA_DEFAULT_FRAME_STEP_MS = 200",
    "MRMS_RALA_MIN_FRAME_STEP_MS = 100",
    "MRMS_RALA_MAX_FRAME_STEP_MS = 1000",
    "MRMS_RALA_FRAME_STEP_INCREMENT_MS = 50",
    "MRMS_RALA_TARGET_CADENCE_MINUTES = 10",
    "MRMS_RALA_DEFAULT_WINDOW_MINUTES = 120",
    "MRMS_RALA_WINDOW_OPTIONS_MINUTES = [120, 240, 360]",
    "setMRMSRALAWindowMinutes",
    "mrmsRalaActiveFrames",
    "mrms-rala-window-select",
    "setIEMRadarAnimationFPS",
    "setMRMSRALAFrameStep",
    "mrms-rala-speed-slider",
    "slow.textContent = 'Slow'",
    "fast.textContent = 'Fast'",
    "playerOptions: {transitionTime: Math.round(1000 / IEM_RADAR_DEFAULT_FPS), loop: true}",
    "activateIEMRadarTimeline({applyDefaultSpeed: false, autoPlay: true})",
    "activateMRMSRALATimeline({jumpToLatest: true, applyDefaultSpeed: false})",
    "opacity: 0.7, layers: 'nexrad-n0q-wmst'",
    "const nextIndex = (currentIndex + 1) % times.length",
    "loadMRMSRALAFrameIntoLayer",
    "mrmsRalaBufferLayer",
    "primeNextMRMSRALABuffer",
    "const workers = Math.min(3, frames.length)",
]
for fragment in required_mrms_rala_fragments:
    if fragment not in app:
        errors.append(f"Missing looping MRMS RALA integration fragment: {fragment}")

if "image.style.imageRendering = 'auto'" in app:
    errors.append("MRMS RALA frame swaps can still reset browser rendering to smooth interpolation.")

required_mrms_rala_generator_fragments = [
    'NCEP_DIR = "https://mrms.ncep.noaa.gov/2D/ReflectivityAtLowestAltitude/"',
    'NODD_ROOT = "https://noaa-mrms-pds.s3.amazonaws.com"',
    'NODD_PREFIX_ROOT = "CONUS/ReflectivityAtLowestAltitude_00.50"',
    'MIN_VISIBLE_DBZ = 5.0',
    'Resampling.nearest',
]
for fragment in required_mrms_rala_generator_fragments:
    if fragment not in mrms_rala_generator:
        errors.append(f"Missing base MRMS RALA generator contract fragment: {fragment}")

required_mrms_rala_loop_generator_fragments = [
    'METADATA_MODE = "mrms_rala_loop_manifest_v2"',
    'loop_minutes',
    'reused_cached_frames',
    'new_frames_rendered',
    'cached_fallback_frames',
    'target_frame_cadence_minutes',
    'default_dashboard_window_minutes',
    'dashboard_window_options_minutes',
    'nominal_time_utc',
    'slot_tolerance_minutes',
    'Official NOAA MRMS only',
    'NCEP MRMS HTTPS is preferred',
    'output-width',
]
for fragment in required_mrms_rala_loop_generator_fragments:
    if fragment not in mrms_rala_loop_generator:
        errors.append(f"Missing MRMS RALA loop-generator contract fragment: {fragment}")

required_mrms_rala_workflow_fragments = [
    "name: Update MRMS RALA Direct NOAA Loop",
    "workflow_dispatch:",
    "actions/checkout@v6",
    "actions/setup-python@v6",
    "fetch_mrms_rala_loop.py",
    "tools/validate_mrms_rala_loop.py",
    "--loop-minutes 360",
    "--cadence-minutes 10",
    "--slot-tolerance-minutes 4.5",
    "--minimum-span-minutes 350",
    "--expected-cadence-minutes 10",
    "--output-width 7000",
    "mrms-rala-data",
    "git push --force origin HEAD:refs/heads/mrms-rala-data",
    "cancel-in-progress: false",
]
for fragment in required_mrms_rala_workflow_fragments:
    if fragment not in mrms_rala_workflow:
        errors.append(f"Missing MRMS RALA looping workflow fragment: {fragment}")

# This feed is intentionally dispatched by cron-job.org. Native GitHub Actions
# scheduling is not allowed because update latency is operationally important.
if re.search(r"(?m)^\s{2}schedule:\s*$", mrms_rala_workflow):
    errors.append(
        "MRMS RALA workflow unexpectedly contains a GitHub Actions schedule; "
        "cron-job.org should trigger workflow_dispatch instead."
    )

# Confirm the rolling MRMS FLASH files, metadata, legends, and time boxes are
# wired into the dashboard.
required_mrms_flash_fragments = [
    "static/mrms_crest_unitq_max24h.png",
    "static/mrms_crest_unitq_max24h_metadata.json",
    "static/mrms_ffd_max24h.png",
    "static/mrms_ffd_max24h_metadata.json",
    "fetchMRMSFlash24hMetadata",
    "mrms-crest-24h-time-box",
    "mrms-ffd-24h-time-box",
    "mrmsCrest24hLegendHTML",
    "mrmsFfd24hLegendHTML",
]
for fragment in required_mrms_flash_fragments:
    if fragment not in app:
        errors.append(
            f"Missing MRMS FLASH 24-hour integration fragment: {fragment}"
        )

# Retired NLDAS-2 overlays must not reappear or keep polling stale products.
for fragment in ("nldas-rsm-010", "nldasRsm", "fetchNLDASRSMMetadata", "static/nldas_rsm_"):
    if fragment in app:
        errors.append(f"Retired NLDAS-2 dashboard integration remains: {fragment}")

if "NASA SPoRT-LIS Volumetric Soil Moisture Percentile (0–100 cm)" not in app:
    errors.append("Updated SPoRT-LIS legend heading is missing.")

required_glm_fragments = [
    "static/glm_conus_mosaic_5min.png",
    "static/glm_conus_mosaic_30min.png",
    "static/glm_conus_mosaic_60min.png",
    "static/glm_convective_trend_15min_metadata.json",
    "glm_dashboard_v1",
    "fetchGLMMetadata",
    "glm-time-box",
    "buildGLMLegendHTML",
    "glmLegendHTMLFromMetadata",
    "validateGLMRenderingMetadata",
    "metadata.rendering",
    "grid-template-columns: repeat(2, minmax(0, 1fr))",
    "enforceExclusiveGLMSelection",
    "exclusiveGroup: 'glm-primary'",
    "glm_convective_trend_v1",
    "glm-trend-card",
    "GLM_TREND_SESSION_KEY",
    "buildGLMTrendSparkline",
    "updateGLMTrendCard",
    "Rapidly Increasing",
    "Strongest acceleration",
    "GOES GLM Controlled Mosaic — Convective Trend (15 min)",
    "embedded_png_base64",
    "glm-convective-trend-15min",
    "color: '#ff4848'",
    "color: '#ffaa40'",
    "color: '#ffe878'",
    "color: '#4ceaff'",
    "color: '#3876ff'",
    "GLM_MANIFEST_URL",
    "GLM_MANIFEST_POLL_INTERVAL_MS = 90 * 1000",
    "refreshGLMFromManifest",
    "expectedWindowEnd",
    "requireComplete",
    "document.addEventListener('visibilitychange'",
    "window.addEventListener('focus'",
    "window.addEventListener('online'",
]
for fragment in required_glm_fragments:
    if fragment not in app:
        errors.append(f"Missing GOES GLM integration fragment: {fragment}")



required_lightningcast_fragments = [
    "CIMSS/SSEC LightningCast — Probability of Lightning in Next 60 Minutes",
    "static/lightningcast_conus_probability_60min.png",
    "static/lightningcast_conus_probability_60min_metadata.json",
    "static/lightningcast_manifest.json",
    "lightningcast_dashboard_v1e",
    "lightningcast_dashboard_manifest_v1",
    "lightningcast-probability-60min",
    "lightningcast-time-box",
    "buildLightningCastLegendHTML",
    "refreshLightningCastFromManifest",
    "LIGHTNINGCAST_MANIFEST_POLL_INTERVAL_MS = 90 * 1000",
    "Probability of lightning in the next 60 minutes",
    "LightningCast data courtesy CIMSS/SSEC",
    "cross_satellite_family_splitting",
]
for fragment in required_lightningcast_fragments:
    if fragment not in app:
        errors.append(f"Missing LightningCast dashboard integration fragment: {fragment}")

required_lightningcast_generator_fragments = [
    '"metadata_mode": "lightningcast_dashboard_v1e"',
    'THRESHOLDS = (10, 30, 50, 70, 90)',
    '"contour_lines_only": True',
    '"polygon_fill_inference": False',
    '"cross_satellite_family_splitting": False',
]
for fragment in required_lightningcast_generator_fragments:
    if fragment not in lightningcast_generator:
        errors.append(f"Missing LightningCast v1E generator contract: {fragment}")

required_lightningcast_workflow_fragments = [
    "Update LightningCast",
    "workflow_dispatch:",
    "workflow_run:",
    'workflows: ["Update GOES GLM Mosaic"]',
    "lightningcast_dashboard_v1e",
    "lightningcast_conus_probability_60min.png",
    "lightningcast_manifest.json",
]
for fragment in required_lightningcast_workflow_fragments:
    if fragment not in lightningcast_workflow:
        errors.append(f"Missing LightningCast workflow integration fragment: {fragment}")


# HRRR-TLE V3.3 dashboard integration contract.
required_hrrr_tle_app_fragments = [
    "HRRR Flash Flood Diagnostics - Experimental",
    "HRRR_DIAGNOSTIC_LAYER_CONFIGS",
    "hrrr-diagnostics-time-box",
    "Max FFG Exceedance Ratio — Next 12 Hours",
    "FFG Exceedance Areal Coverage — Next 12 Hours",
    "HRRR-TLE Flash Flood Guidance - Experimental",
    "HRRR_TLE_LAYER_CONFIGS",
    "static/hrrr_tle_manifest.json",
    "static/hrrr_tle_metadata.json",
    "hrrr-tle-time-box",
    "buildHRRRTLELegendHTML",
    "refreshHRRRTLEFromManifest",
    "hrrr_tle_dashboard_v3_3",
    "Core FFG Guidance",
    "Heavy Rain / Persistence",
    "Timing / Evolution",
    "dashboard-layer-group",
    "hrrr-tle-ffg-consensus",
    "hrrr-tle-median-ratio",
    "hrrr-tle-run-change",
]
for fragment in required_hrrr_tle_app_fragments:
    if fragment not in app:
        errors.append(f"Missing HRRR-TLE dashboard integration fragment: {fragment}")

# Verify the current legend-dock time-box order without depending on exact
# whitespace from an older app.js revision.
legend_dock_marker = "].forEach(id => createLegendDockTimeBox(timeStack, id));"
legend_dock_end = app.find(legend_dock_marker)
if legend_dock_end < 0:
    errors.append("Missing legend-dock time-box creation block.")
else:
    legend_dock_start = app.rfind("[", 0, legend_dock_end)
    legend_dock_block = (
        app[legend_dock_start:legend_dock_end]
        if legend_dock_start >= 0
        else ""
    )
    required_hrrr_time_boxes = [
        "'lightningcast-time-box'",
        "'hrrr-diagnostics-time-box'",
        "'hrrr-tle-time-box'",
        "'nwm-time-box'",
    ]
    time_box_positions = [
        legend_dock_block.find(marker)
        for marker in required_hrrr_time_boxes
    ]
    if any(position < 0 for position in time_box_positions):
        errors.append(
            "Legend dock is missing a required LightningCast/HRRR/NWM time box."
        )
    elif time_box_positions != sorted(time_box_positions):
        errors.append(
            "Legend-dock time boxes are not ordered "
            "LightningCast -> HRRR Diagnostics -> HRRR-TLE -> NWM."
        )

# Enforce exact section placement below RAP and above the first CAM Nowcast section.
rap_start = app.find("title: 'RAP Mesoanalysis Data'")
hrrr_diag_start = app.find("title: 'HRRR Flash Flood Diagnostics - Experimental'")
hrrr_tle_start = app.find("title: 'HRRR-TLE Flash Flood Guidance - Experimental'")
cam_start = app.find("title: 'CAM Nowcasts (+3h to +9h)'")
if not (
    rap_start >= 0
    and hrrr_diag_start > rap_start
    and hrrr_tle_start > hrrr_diag_start
    and cam_start > hrrr_tle_start
):
    errors.append(
        "HRRR diagnostic/TLE sections are not ordered RAP -> HRRR Diagnostics -> HRRR-TLE -> CAM."
    )

hrrr_tle_ids = [
    "hrrr-diag-max-ratio", "hrrr-diag-ffg-coverage",
    "hrrr-tle-ffg-consensus", "hrrr-tle-median-ratio",
    "hrrr-tle-ffg-1h", "hrrr-tle-ffg-3h", "hrrr-tle-ffg-6h",
    "hrrr-tle-qpf1h-1in", "hrrr-tle-qpf1h-2in", "hrrr-tle-qpf1h-3in",
    "hrrr-tle-persist-1in", "hrrr-tle-persist-3h-2in", "hrrr-tle-persist-3h-3in",
    "hrrr-tle-evol-00-03", "hrrr-tle-evol-03-06",
    "hrrr-tle-evol-06-09", "hrrr-tle-evol-09-12",
    "hrrr-tle-prior3", "hrrr-tle-latest3", "hrrr-tle-run-change",
]
for layer_id in hrrr_tle_ids:
    if app.count(f"id: '{layer_id}'") != 1:
        errors.append(f"Expected exactly one HRRR-TLE layer registry entry: {layer_id}")

required_hrrr_tle_generator_fragments = [
    "DASHBOARD_HRRR_DIAGNOSTIC_HOURS = 12",
    "hrrr_latest_12h_max_ffg_ratio.png",
    "hrrr_latest_12h_ffg_exceedance_coverage.png",
    "latest_hrrr_diagnostic_cycle_utc",
    "TLE_MEMBER_COUNT = 6",
    "TLE_COMMON_HOURS = 12",
    "MIN_TLE_MEMBERS = 6",
    "NEIGHBORHOOD_KM = 40.0",
    "aligned_member_fxx",
    "candidate_is_complete",
    "find_latest_tle_cycle",
    "hrrr_tle_dashboard_v3_3",
    "hrrr_tle_dashboard_manifest_v1",
    "hrrr_tle_ffg_consensus.png",
    "hrrr_tle_run_change.png",
    "Member frequency / consensus; NOT calibrated probability.",
]
for fragment in required_hrrr_tle_generator_fragments:
    if fragment not in hrrr_tle_generator:
        errors.append(f"Missing HRRR-TLE V3.3 generator contract: {fragment}")

required_hrrr_tle_workflow_fragments = [
    "Update HRRR-TLE Flash Flood Guidance",
    "workflow_dispatch:",
    "python fetch_hrrr_tle.py --output-dir static",
    "static/hrrr_tle_*",
]
for fragment in required_hrrr_tle_workflow_fragments:
    if fragment not in hrrr_tle_workflow:
        errors.append(f"Missing HRRR-TLE workflow contract: {fragment}")

# HRRR-TLE is dispatched externally by cron-job.org. Do not require or reintroduce
# a GitHub Actions native schedule; workflow_dispatch is the intentional trigger.
if re.search(r"(?m)^\s{2}schedule:\s*$", hrrr_tle_workflow):
    errors.append(
        "HRRR-TLE workflow unexpectedly contains a GitHub Actions schedule; "
        "cron-job.org should trigger workflow_dispatch instead."
    )

required_ufvs_utility_fragments = [
    "UFVS Geographic Domains",
    "ufvs-geographic-domains-toggle",
    "UFVS_GEOGRAPHIC_DOMAINS",
    "UFVS_DOMAINS_SESSION_KEY",
    "ufvsGeographicDomainsLayer",
    "setUFVSGeographicDomainsVisible",
    "map.createPane('ufvsDomains')",
    "label: 'West Coast', west: -125.0, east: -117.0, south: 32.0, north: 49.0",
    "label: 'Southwest', west: -117.0, east: -104.0, south: 28.0, north: 42.0",
    "label: 'Interior Mountain West', west: -117.0, east: -104.0, south: 42.0, north: 49.0",
    "label: 'Northern Plains', west: -104.0, east: -85.0, south: 38.0, north: 49.0",
    "label: 'Southern Plains', west: -104.0, east: -90.0, south: 24.0, north: 38.0",
    "label: 'Southeast', west: -90.0, east: -75.0, south: 24.0, north: 38.0",
    "label: 'Northeast', west: -85.0, east: -66.0, south: 38.0, north: 49.0",
]
for fragment in required_ufvs_utility_fragments:
    if fragment not in app:
        errors.append(f"Missing UFVS Geographic Domains utility fragment: {fragment}")

# The display overlay and GLM regional trend calculations must use the exact
# same authoritative fixed WPC UFVS bounds.
expected_ufvs_domains = [
    ("west-coast", "West Coast", -125.0, -117.0, 32.0, 49.0),
    ("southwest", "Southwest", -117.0, -104.0, 28.0, 42.0),
    ("interior-mountain-west", "Interior Mountain West", -117.0, -104.0, 42.0, 49.0),
    ("northern-plains", "Northern Plains", -104.0, -85.0, 38.0, 49.0),
    ("southern-plains", "Southern Plains", -104.0, -90.0, 24.0, 38.0),
    ("southeast", "Southeast", -90.0, -75.0, 24.0, 38.0),
    ("northeast", "Northeast", -85.0, -66.0, 38.0, 49.0),
]
for domain_id, label, west, east, south, north in expected_ufvs_domains:
    app_fragment = (
        f"id: '{domain_id}', label: '{label}', west: {west:.1f}, "
        f"east: {east:.1f}, south: {south:.1f}, north: {north:.1f}"
    )
    if app_fragment not in app:
        errors.append(
            f"UFVS overlay bounds do not match the WPC definition for {label}."
        )

    generator_pattern = re.compile(
        rf'"id":\s*"{re.escape(domain_id)}".*?'
        rf'"label":\s*"{re.escape(label)}".*?'
        rf'"west":\s*{re.escape(f"{west:.1f}")}.*?'
        rf'"east":\s*{re.escape(f"{east:.1f}")}.*?'
        rf'"south":\s*{re.escape(f"{south:.1f}")}.*?'
        rf'"north":\s*{re.escape(f"{north:.1f}")}',
        re.DOTALL,
    )
    if not generator_pattern.search(glm_generator):
        errors.append(
            f"GLM UFVS trend-calculation bounds do not match the WPC definition for {label}."
        )

if "setInterval(() => fetchGLMMetadata(), 10 * 60 * 1000)" in app:
    errors.append("Legacy blind 10-minute GLM refresh interval is still active.")
if "Trend Framework" in app:
    errors.append("UFVS utility label still contains the rejected words 'Trend Framework'.")

if "const glmFiveMinuteLegendHTML" in app or "const glmRollingLegendHTML" in app:
    errors.append("GOES GLM legends are still hardcoded separately from product metadata.")

required_glm_generator_fragments = [
    "FIVE_MIN_BINS = [1, 2, 4, 8, 16, 32, 64, 128, 256]",
    '"128–255", "≥256"',
    "ROLLING_BINS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]",
    '"128–255", "256–511", "≥512"',
    '"rendering": {',
    '"bins": list(bins)',
    '"labels": list(labels)',
    '"rgba": [list(color) for color in colors]',
    "UFVS_TREND_DOMAINS = [",
    "Authoritative fixed WPC UFVS seven-domain rectangular framework",
    "TREND_HISTORY_MINUTES = 60",
    "TREND_RECENT_SLOT_COUNT = 3",
    "build_convective_trend_analysis",
    "classify_convective_trend",
    '"metadata_mode": "glm_convective_trend_v1"',
    'metadata["convective_trend"] = convective_trend',
]
for fragment in required_glm_generator_fragments:
    if fragment not in glm_generator:
        errors.append(f"Missing GOES GLM generator legend contract: {fragment}")


required_glm_workflow_fragments = [
    "glm_convective_trend_15min_metadata.json",
    "GLM trend-map metadata contract failed",
    "embedded_png_base64",
]
for fragment in required_glm_workflow_fragments:
    if fragment not in glm_workflow:
        errors.append(f"Missing GOES GLM workflow publication fragment: {fragment}")

for forbidden in [
    "glm-debug-g18-5min",
    "glm-debug-g19-5min",
    "glm-debug-ownership",
    "GLM Debug Layers",
]:
    if forbidden in app:
        errors.append(f"Production dashboard still exposes forbidden GLM debug control: {forbidden}")

# Count both the existing dashboard registry objects, which use
#   {id: '...', label: ...}
# and the HRRR diagnostics / HRRR-TLE configuration objects, which use
#   {id: '...', key: ..., ... label: ...}
# The key-aware regex counts all 20 HRRR-family layers.
ids = re.findall(r"\{id: '([a-z0-9-]+)', (?:label:|key:)", app)
duplicates = sorted({item for item in ids if ids.count(item) > 1})
if duplicates:
    errors.append(f"Duplicate layer ids: {duplicates}")

if len(ids) != EXPECTED_LAYER_COUNT:
    errors.append(
        f"Expected {EXPECTED_LAYER_COUNT} registered layers, found {len(ids)}."
    )

required_black_canvas_fragments = [
    "const blackCanvasBase = L.layerGroup();",
    "{id: 'black-canvas', label: 'Black Canvas'",
    "canvasColor: '#050608'",
]
for fragment in required_black_canvas_fragments:
    if fragment not in app:
        errors.append(f"Missing Black Canvas basemap contract: {fragment}")

required_wpc_dark_reference_fragments = [
    "const WPC_DARK_COUNTRIES_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson';",
    "const WPC_DARK_PLACES_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_populated_places_simple.geojson';",
    "const TIGER_CURRENT_MAPSERVER_URL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer';",
    "const TIGER_TRANSPORTATION_TILES_URL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer/tile/{z}/{y}/{x}';",
    "const wpcDarkReferenceBase = L.layerGroup([wpcDarkCountryPolygons]);",
    "{id: 'wpc-dark-reference', label: 'WPC Dark Reference'",
    "canvasColor: '#25282b'",
    "wpcDarkReferenceBase.addTo(map);",
    "wpcDarkCountryLabels.addTo(map);",
    "map.createPane('wpcDarkBase')",
    "map.createPane('mapReferenceBase')",
    "map.createPane('mapReference')",
    "const mapReferenceOverlayConfigs = [",
    "refId: 'state-territory-names'",
    "refId: 'major-cities-places'",
    "refId: 'major-roads'",
    "refId: 'county-boundaries'",
    "refId: 'urban-areas'",
    "refId: 'international-boundaries'",
    "map-reference-overlay-controls",
    "setMapReferenceOverlayVisible",
    "function censusQueryUrl(layerId, bounds, maxAllowableOffset",
    "function createCensusViewportGeoJSONLayer(layerId, options = {})",
    "const wpcCountyBoundariesLayer = createCensusViewportGeoJSONLayer(82",
    "const wpcUrbanAreasLayer = createCensusViewportGeoJSONLayer(88",
    "function loadWPCStateTerritoryLabels()",
    "loadWPCStateTerritoryLabels();",
]
for fragment in required_wpc_dark_reference_fragments:
    if fragment not in app:
        errors.append(f"Missing WPC Dark Reference contract: {fragment}")


# The broken TIGERweb WMS implementation must not be reintroduced. The three
# reference controls use the official TIGERweb REST/GeoJSON API instead.
for forbidden in [
    "const TIGER_CURRENT_WMS_URL =",
    "L.tileLayer.wms(TIGER_CURRENT_WMS_URL",
]:
    if forbidden in app:
        errors.append(f"Legacy broken TIGERweb WMS reference path is still present: {forbidden}")

# Phase WFIGS-5 dashboard integration (retaining Phase-4.3 perimeter behavior). The browser consumes only validated
# wfigs-data products. Current and current-year YTD remain separate opt-in layers;
# the historical archive supports simultaneous toggling of any combination of the
# previous five completed calendar years. YTD/history remain lazy-loaded by viewport
# and cartographic zoom, and browsers never query the live ArcGIS service directly.
required_wfigs_fragments = [
    "const WFIGS_CURRENT_YEAR = new Date().getUTCFullYear();",
    "const WFIGS_CURRENT_LAYER_NAME = 'NIFC/WFIGS Current Wildfire Perimeters';",
    "const WFIGS_YTD_LAYER_NAME = `NIFC/WFIGS ${WFIGS_CURRENT_YEAR} YTD Wildfire Perimeters`;",
    "const WFIGS_HISTORY_LAYER_NAME = 'NIFC/WFIGS Historical Wildfire Perimeters';",
    "const WFIGS_DATA_ROOT = 'https://raw.githubusercontent.com/andreworrison-cloud/wpc-hydro-dashboard/wfigs-data/static/wfigs';",
    "const WFIGS_CURRENT_MANIFEST_URL = `${WFIGS_DATA_ROOT}/current/manifest.json`;",
    "const WFIGS_YTD_MANIFEST_URL = `${WFIGS_DATA_ROOT}/ytd/manifest.json`;",
    "const WFIGS_HISTORY_ROOT = `${WFIGS_DATA_ROOT}/history`;",
    "const WFIGS_HISTORY_INDEX_URL = `${WFIGS_HISTORY_ROOT}/manifest.json`;",
    "const WFIGS_YTD_ACTIVITY_URL = `${WFIGS_DATA_ROOT}/ytd/seasonal_activity.json`;",
    "const WFIGS_HISTORY_ACTIVITY_URL = `${WFIGS_HISTORY_ROOT}/seasonal_activity.json`;",
    "const WFIGS_ARCHIVE_OVERVIEW_MIN_ZOOM = 4;",
    "const WFIGS_ARCHIVE_CHUNK_MIN_ZOOM = 6;",
    "const WFIGS_YTD_CHUNK_CACHE_LIMIT = 36;",
    "const WFIGS_HISTORY_CHUNK_CACHE_LIMIT_PER_YEAR = 36;",
    "const WFIGS_HISTORY_YEAR_COLORS =",
    "const WFIGS_HISTORY_ROLLING_YEARS = 5;",
    "function refreshWFIGSCurrent",
    "function refreshWFIGSYTDManifest",
    "function updateWFIGSYTDViewport",
    "function loadWFIGSYTDOverview",
    "function rebuildWFIGSYTDOverviewLayer",
    "function refreshWFIGSHistory",
    "function updateWFIGSHistoryViewport",
    "function loadWFIGSHistoryOverview",
    "function rebuildWFIGSHistoryOverviewLayers",
    "function renderWFIGSHistoryYearControl",
    "wfigs-history-year-buttons",
    "function toggleWFIGSHistoryYear",
    "function renderWFIGSSeasonalTrendControl",
    "function openWFIGSSeasonalTrendPanel",
    "function refreshWFIGSSeasonalActivity",
    "function renderWFIGSSeasonalTrendPanel",
    "function wfigsTrendNumericValue",
    "function wfigsTrendDayLabel",
    "function renderWFIGSTrendSVG",
    "future dates are intentionally unplotted",
    "Weekly New Wildfire Discoveries",
    "Cumulative YTD Wildfire Discoveries",
    "unique deduplicated WFIGS wildfire (WF) identities",
    "let wfigsHistorySelectedYears = new Set",
    "Multiple years may be displayed together",
    "aria-pressed",
    "if (sectionConfig.id === 'wildfire-burn-scar' && entry.id === 'wfigs-history')",
    "renderWFIGSSeasonalTrendControl(body);",
    "updateWFIGSHistoryLayerDescription",
    "Selected years: ${selected.join(', ')}",
    "Toggle any combination of the rolling five completed calendar years",
    "Current/maintained wildfire footprints; incidents can fall off as they close or become stale.",
    "All mapped ${WFIGS_CURRENT_YEAR} wildfire footprints; no Current-service fall-off.",
    "function buildWFIGSTooltipHTML",
    "function buildWFIGSPopupHTML",
    "bindTooltip",
    "bindPopup",
    "active_fire_ids",
    "wfigsCurrentActiveFireIds",
    "wfigsBBoxesIntersect",
    "map.on('moveend zoomend', scheduleWFIGSYTDViewportUpdate);",
    "map.on('moveend zoomend', scheduleWFIGSHistoryViewportUpdate);",
    "WFIGS depicts mapped wildfire extent. It does not indicate soil-burn severity",
    "wfigs-current-time-box",
    "wfigs-ytd-time-box",
    "wfigs-history-time-box",
    "Year = Fire Discovery Date (UTC)",
    "buildWFIGSLegendHTML",
    "manifest.overview?.href",
    "WFIGS YTD national overview",
    "historical manifest is missing the zoomed-out overview product",
    "const mode = zoom < WFIGS_ARCHIVE_CHUNK_MIN_ZOOM ? 'National overview' : 'Cartographic display';",
]
for fragment in required_wfigs_fragments:
    if fragment not in app:
        errors.append(f"Missing WFIGS Phase-4 frontend contract: {fragment}")

# Current must precede YTD, which must precede the multi-year historical controls.
wfigs_start = app.find("title: 'Wildfire / Burn Scar Context'")
rap_start = app.find("title: 'RAP Mesoanalysis Data'")
if wfigs_start < 0 or rap_start <= wfigs_start:
    errors.append("Wildfire / Burn Scar Context is not immediately upstream of RAP Mesoanalysis.")
else:
    wfigs_block = app[wfigs_start:rap_start]
    current_pos = wfigs_block.find("{id: 'wfigs-current'")
    ytd_pos = wfigs_block.find("{id: 'wfigs-ytd'")
    history_pos = wfigs_block.find("{id: 'wfigs-history'")
    if not (current_pos >= 0 and ytd_pos > current_pos and history_pos > ytd_pos):
        errors.append("WFIGS Current/YTD/Historical layers are missing or out of order.")
    if "defaultActive: true" in wfigs_block:
        errors.append("WFIGS perimeter layers must remain opt-in at dashboard startup.")

# Archive acreage thresholds are cartographic only: the underlying data remain
# complete and progressively expose smaller burns as the forecaster zooms in.
for threshold_fragment in [
    "if (zoom === 4) return 10000;",
    "if (zoom === 5) return 5000;",
    "if (zoom === 6) return 500;",
    "if (zoom === 7) return 100;",
    "if (zoom === 8) return 20;",
    "return 0;",
]:
    if threshold_fragment not in app:
        errors.append(f"WFIGS zoom-dependent display threshold changed unexpectedly: {threshold_fragment}")

# The frontend must never bypass our validated data branch and query WFIGS
# ArcGIS directly from every user browser.
if "services3.arcgis.com/T4QMspbfLg3qTGWY" in app:
    errors.append("Frontend contains a direct NIFC/WFIGS ArcGIS query; use wfigs-data backend products instead.")

# Phase 4.2 intentionally replaces the one-year dropdown with multi-year buttons.
for forbidden in ["wfigs-history-year-select", "let wfigsHistorySelectedYear ="]:
    if forbidden in app:
        errors.append(f"Legacy single-year WFIGS selector state remains: {forbidden}")

# YTD and historical perimeters should use solid lines; year identity is carried by
# bright color rather than dash patterns, which are harder to isolate on busy maps.
style_start = app.find("function wfigsBaseStyle")
style_end = app.find("function buildWFIGSTooltipHTML", style_start)
if style_start >= 0 and style_end > style_start:
    style_block = app[style_start:style_end]
    for dashed in ["dashArray: '5 3'", "dashArray: '2 5'"]:
        if dashed in style_block:
            errors.append(f"WFIGS dashed perimeter styling reintroduced unexpectedly: {dashed}")

if "wfigs-dashboard-v2-history-v1" not in index:
    errors.append("WFIGS Phase-4 frontend cache-busting token is missing from index.html.")

# WPC Dark Reference must be the first basemap entry so startup and Restore
# Defaults resolve to it without special-case menu logic.
base_registry_start = app.find("const baseMapRegistry = [")
if base_registry_start < 0:
    errors.append("Basemap registry is missing.")
else:
    base_registry_window = app[base_registry_start:base_registry_start + 700]
    wpc_pos = base_registry_window.find("{id: 'wpc-dark-reference', label: 'WPC Dark Reference'")
    esri_pos = base_registry_window.find("{id: 'esri-dark', label: 'Esri Dark Gray'")
    black_pos = base_registry_window.find("{id: 'black-canvas', label: 'Black Canvas'")
    if not (wpc_pos >= 0 and esri_pos > wpc_pos and black_pos > esri_pos):
        errors.append("WPC Dark Reference is not the first/default basemap while preserving Esri Dark and Black Canvas.")

# Preserve the exact white state-border styling Andrew approved for dark maps.
if "style: { color: 'rgba(255, 255, 255, 0.8)', weight: 1.5, fillOpacity: 0 }" not in app:
    errors.append("Approved white state-border styling changed unexpectedly.")

if ids.count(LIGHTNINGCAST_LAYER_ID) != 1:
    errors.append(
        f"Expected exactly one registered LightningCast layer id {LIGHTNINGCAST_LAYER_ID!r}, "
        f"found {ids.count(LIGHTNINGCAST_LAYER_ID)}."
    )

if "const groupedOverlays" in app or "L.control.groupedLayers" in app:
    errors.append("Legacy grouped-layer menu code is still active.")
if "leaflet-groupedlayercontrol" in index:
    errors.append("Legacy grouped-layer-control dependency is still loaded.")
if 'id="dashboard-sidebar"' not in index:
    errors.append("Sidebar markup is missing from index.html.")
if (
    "window.WPCDashboard" not in app
    or "registerLayer: registerDashboardLayer" not in app
):
    errors.append("Plug-and-play layer registration API is missing.")
if ".dashboard-sidebar" not in css or ".dashboard-section" not in css:
    errors.append("Sidebar styles are missing.")

if "const LEGEND_DOCK_SESSION_KEY" not in app:
    errors.append("Responsive legend-dock controller is missing.")
if (
    'id="legend-dock-toggle"' not in app
    or 'id="legend-dock-body"' not in app
):
    errors.append("Legend-dock controls are missing from app.js.")
if "rapTimeControl" in app or "const legendControl" in app:
    errors.append("Legacy separate legend/time controls are still active.")
if ".legend-dock" not in css or ".legend-dock.is-collapsed" not in css:
    errors.append("Responsive legend-dock styles are missing.")
if "glm-v1" not in index and "glm-v2" not in index:
    errors.append(
        "Frontend cache-busting token for GOES GLM integration is missing."
    )

if "nrcs-hsg-native30m-h1-v2-3" not in index:
    errors.append("NRCS HSG native30m Phase H1 v2.3 cache-busting token is missing from index.html.")
if "annual-nlcd-fctimp-2025-h2-v1-1-clarified" not in index:
    errors.append("Annual NLCD Phase H2 clarified cache-busting token is missing from index.html.")
if "wfigs-dashboard-v2-history-v1-3-conus-overview" not in index:
    errors.append("WFIGS Phase 4.3 CONUS-overview cache-busting token is missing from index.html.")
if "wfigs-seasonal-trends-v1-1" not in index:
    errors.append("WFIGS Phase 5.1 seasonal-trends endpoint-fix cache-busting token is missing from index.html.")
if ".filter(point => Number.isFinite(Number(point[key])))" in app:
    errors.append("WFIGS trend polyline still coerces missing/null current-year values to zero.")

if "mrms-rala-loop-v2" not in index:
    errors.append(
        "Frontend cache-busting token for MRMS RALA Phase 2 integration is missing."
    )


if "mrms-rala-loop-v2-10-viewer-style-speed" not in index:
    errors.append("MRMS RALA v2.10 viewer-style speed cache-busting token is missing from index.html.")
if "mrms-rala-loop-v2-11-10min-windows" not in index:
    errors.append("MRMS RALA v2.11 10-minute / 2-4-6 hour cache-busting token is missing from index.html.")

if "MRMS_RALA_DEFAULT_FRAME_STEP_MS = 200" not in app:
    errors.append("MRMS RALA viewer-style 200-ms default frame step is missing from app.js.")
if "const nextIndex = (currentIndex + 1) % times.length" not in app:
    errors.append("MRMS RALA sequential all-frame loop logic is missing from app.js.")
if "frameStep:" in app and "MRMS_RALA_SPEED_PROFILES" in app:
    errors.append("Legacy MRMS frame-skipping speed profiles are still present in app.js.")
if "mrms-rala-speed-slider" not in app or "IEM_RADAR_MAX_FPS = 10" not in app:
    errors.append("Independent viewer-style MRMS / FPS IEM controls are incomplete in app.js.")
if "mrms-rala-window-select" not in app or "MRMS_RALA_DEFAULT_WINDOW_MINUTES = 120" not in app:
    errors.append("MRMS RALA 2/4/6-hour window selector is incomplete in app.js.")
if "mrmsRalaBufferLayer" not in app or "loadMRMSRALAFrameIntoLayer" not in app:
    errors.append("MRMS RALA double-buffer rendering is incomplete in app.js.")
if "dashboardRadarSpeedMode = 'iem'" not in app or "dashboardRadarSpeedMode = 'mrms'" not in app:
    errors.append("Per-feed radar speed-mode switching is incomplete in app.js.")

# Model GDI updates must be dispatched by the existing cron-job.org workflows.
for caller, callee in [('update_hrrr_tle.yml','publish_gdi.yml'),('update_rap.yml','publish_rap_gdi.yml')]:
    caller_text=(ROOT/'.github/workflows'/caller).read_text()
    callee_text=(ROOT/'.github/workflows'/callee).read_text()
    if re.search(r'^\s+schedule:',callee_text,re.M):errors.append(f'{callee} must not introduce a GitHub cron')
    if 'workflow_call:' not in callee_text or f'uses: ./.github/workflows/{callee}' not in caller_text:errors.append(f'Missing external scheduler route for {callee}')
for label in ['RAP Analysis & Trends','HRRR · Hourly Guidance','HRRR · Six-hour Persistence']:
    if label not in app:errors.append(f'Missing GDI menu group: {label}')

gdi_windows=(ROOT/'.github/workflows/publish_gdi_guidance.yml').read_text()
if re.search(r'^\s+schedule:',gdi_windows,re.M) or 'types: [requested]' not in gdi_windows or 'Update HRRR-TLE Flash Flood Guidance' not in gdi_windows:
    errors.append('GDI windows must inherit the cron-job.org HRRR dispatch without a GitHub timer')

if errors:
    print("Dashboard validation FAILED:")
    for error in errors:
        print(f" - {error}")
    sys.exit(1)

print(
    "Dashboard validation passed: "
    f"{len(ids)} registered layers; menu order, looping MRMS RALA/opacity/freshness, MRMS FLASH order, "
    "antecedent/HSG+NLCD/WFIGS order, NRCS HSG Phase H1 and clarified Annual NLCD Phase H2 static assets, MRMS/NLDAS/GLM mappings, compact legends, "
    "the GLM trend diagnostic/trend map, automatic GLM manifest refresh, "
    "LightningCast v1E integration/manifest refresh, and UFVS Geographic Domains utility preserved."
)


