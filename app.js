// --- POPUP / TOOLTIP PRIORITY ---
// The full dashboard interface is styled in style.css.
const customStyle = document.createElement('style');
customStyle.innerHTML = `
    .leaflet-popup-pane { z-index: 7000 !important; }
    .leaflet-tooltip-pane { z-index: 6500 !important; }

    /* MRMS RALA frames are categorical nearest-neighbor rasters. Keep the
       browser from intermittently applying smooth interpolation while frames
       swap or arrive from cache. */
    img.mrms-rala-raster {
        image-rendering: pixelated !important;
    }

    /* NRCS HSG is a seven-class categorical soil raster. Never blend adjacent
       hydrologic classes in the browser; retain the categorical appearance. */
    img.nrcs-hsg-raster {
        image-rendering: pixelated !important;
    }

    /* Annual NLCD is published as fixed impervious-percentage display bins.
       Keep the validated nearest-neighbor display derivative crisp. */
    img.nlcd-impervious-raster {
        image-rendering: pixelated !important;
    }

    /* NLDAS-3 soil texture and land-cover are categorical native-grid classes.
       Preserve nearest-neighbor class boundaries in the browser. */
    img.nldas3-soil-texture-raster,
    img.nldas3-landcover-raster {
        image-rendering: pixelated !important;
    }

    /* NLDAS-3 / MERIT terrain slope is published as descriptive categorical
       percent-slope bins. Preserve the validated nearest-neighbor rendering. */
    img.nldas3-slope-raster {
        image-rendering: pixelated !important;
    }

    .glm-trend-card {
        margin: 8px 8px 10px;
        overflow: hidden;
        border: 1px solid rgba(79, 195, 247, 0.46);
        border-radius: 9px;
        background:
            linear-gradient(145deg, rgba(18, 47, 68, 0.98), rgba(12, 24, 38, 0.98));
        color: #f5fbff;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        font-family: Arial, sans-serif;
    }
    .glm-trend-card__header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(118px, 0.9fr);
        gap: 8px;
        align-items: center;
        padding: 9px 10px 7px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.10);
        background: rgba(22, 61, 84, 0.60);
    }
    .glm-trend-card__kicker {
        margin-bottom: 2px;
        color: #7fd7ff;
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.10em;
        text-transform: uppercase;
    }
    .glm-trend-card__title {
        font-size: 13px;
        font-weight: 800;
        line-height: 1.1;
    }
    .glm-trend-card__select {
        width: 100%;
        min-width: 0;
        padding: 5px 24px 5px 7px;
        border: 1px solid rgba(127, 215, 255, 0.42);
        border-radius: 5px;
        background: #101f2e;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
    }
    .glm-trend-card__body { padding: 9px 10px 10px; }
    .glm-trend-card__state-row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: center;
        margin-bottom: 7px;
    }
    .glm-trend-card__state {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 8px;
        border: 1px solid currentColor;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 900;
        line-height: 1;
        letter-spacing: 0.01em;
    }
    .glm-trend-card__change {
        color: #fff;
        font-size: 18px;
        font-weight: 900;
        line-height: 1;
        text-align: right;
    }
    .glm-trend-card__change-label {
        display: block;
        margin-top: 2px;
        color: #a9bac8;
        font-size: 8px;
        font-weight: 700;
        text-transform: uppercase;
    }
    .glm-trend-card__sparkline {
        padding: 4px 5px 1px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.18);
    }
    .glm-trend-card__axis {
        display: flex;
        justify-content: space-between;
        margin-top: -1px;
        color: #91a6b6;
        font-size: 8px;
        font-weight: 700;
    }
    .glm-trend-card__metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 5px;
        margin-top: 8px;
    }
    .glm-trend-card__metric {
        min-width: 0;
        padding: 6px 5px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.035);
        text-align: center;
    }
    .glm-trend-card__metric-value {
        overflow: hidden;
        color: #fff;
        font-size: 12px;
        font-weight: 900;
        line-height: 1.05;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .glm-trend-card__metric-label {
        margin-top: 3px;
        color: #9fb1bf;
        font-size: 7px;
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: 0.03em;
        text-transform: uppercase;
    }
    .glm-trend-card__regional {
        margin-top: 7px;
        padding-top: 7px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        color: #c8d9e5;
        font-size: 9px;
        line-height: 1.25;
    }
    .glm-trend-card__regional strong { color: #7fd7ff; }
    .glm-trend-card__footnote {
        margin-top: 6px;
        color: #8298a8;
        font-size: 8px;
        line-height: 1.25;
    }
    .utility-toggle-field {
        padding: 7px 8px;
        border: 1px solid rgba(127, 215, 255, 0.18);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.025);
    }
    .utility-toggle-row {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 8px;
        align-items: start;
        color: #e8f5ff;
        cursor: pointer;
        font-size: 11px;
        line-height: 1.2;
    }
    .utility-toggle-row input {
        margin: 2px 0 0;
        accent-color: #6fd3ff;
    }
    .utility-toggle-row strong {
        display: block;
        font-size: 11px;
    }
    .utility-toggle-row small {
        display: block;
        margin-top: 3px;
        color: #8ea5b6;
        font-size: 9px;
        line-height: 1.25;
    }
    .ufvs-domain-tooltip {
        padding: 4px 7px;
        border: 1px solid rgba(111, 211, 255, 0.75);
        border-radius: 4px;
        background: rgba(8, 23, 35, 0.94);
        color: #f5fbff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        font-size: 10px;
        font-weight: 800;
        white-space: nowrap;
    }
    @media (max-width: 420px) {
        .glm-trend-card__header {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(customStyle);

// --- MOBILE VIEWPORT COMPATIBILITY ---
// Older mobile browsers can report 100vh taller than the actually visible page.
// Keep the dashboard sized to the usable browser viewport instead.
function updateDashboardViewportHeight() {
    const viewportHeight = window.innerHeight;
    if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return;
    document.documentElement.style.setProperty('--app-height', `${Math.round(viewportHeight)}px`);
}

updateDashboardViewportHeight();

// Initialize the map, centered roughly over the CONUS
const map = L.map('map', {
    zoomControl: true,
    center: [39.8283, -98.5795], 
    zoom: 5
});

let viewportRefreshTimer = null;
function refreshDashboardViewport() {
    window.clearTimeout(viewportRefreshTimer);
    viewportRefreshTimer = window.setTimeout(() => {
        updateDashboardViewportHeight();
        map.invalidateSize({pan: false, animate: false});
        viewportRefreshTimer = null;
    }, 120);
}

window.addEventListener('resize', refreshDashboardViewport, {passive: true});
window.addEventListener('orientationchange', refreshDashboardViewport, {passive: true});

// --- TOP-CENTER DASHBOARD TITLE ---
const mapTitle = L.DomUtil.create('div', 'map-title');
mapTitle.innerHTML = '<strong>WPC Real-Time Hydrometeorological Dashboard</strong>';
document.getElementById('map').appendChild(mapTitle);

// --- GLOBAL UTILITY FUNCTION ---
function formatUTC(date) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = months[date.getUTCMonth()];
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    const min = String(date.getUTCMinutes()).padStart(2, '0');
    return `${m} ${d}, ${h}${min}Z`;
}

// --- CUSTOM MAP PANES FOR STRICT Z-INDEX HAZARD PRIORITY ---
map.createPane('labels');
map.getPane('labels').style.zIndex = 600;
map.getPane('labels').style.pointerEvents = 'none';

// WPC-owned dark-reference cartography. Keep the base geography below all
// meteorological/hydrological overlays, while selected reference boundaries
// remain above raster data but below labels/UFVS annotations.
map.createPane('wpcDarkBase');
map.getPane('wpcDarkBase').style.zIndex = 180;
map.getPane('wpcDarkBase').style.pointerEvents = 'none';

map.createPane('mapReferenceBase');
map.getPane('mapReferenceBase').style.zIndex = 230;
map.getPane('mapReferenceBase').style.pointerEvents = 'none';

map.createPane('mapReference');
map.getPane('mapReference').style.zIndex = 575;
map.getPane('mapReference').style.pointerEvents = 'none';

map.createPane('watches');
map.getPane('watches').style.zIndex = 410;

map.createPane('ero');
map.getPane('ero').style.zIndex = 420;

map.createPane('mpd');
map.getPane('mpd').style.zIndex = 430;

map.createPane('ffd');
map.getPane('ffd').style.zIndex = 440;

// Hydro-product click priority is enforced with separate panes:
// Flash Flood Warning > Flood Warning > Flood Advisory > Flood Watch.
map.createPane('warnings');
map.getPane('warnings').style.zIndex = 450; // Flood Advisories

map.createPane('floodWarnings');
map.getPane('floodWarnings').style.zIndex = 451;

map.createPane('flashFloodWarnings');
map.getPane('flashFloodWarnings').style.zIndex = 452;

// Authoritative fixed WPC UFVS geographic domains used for verification.
// Keep these bounds synchronized with UFVS_TREND_DOMAINS in
// fetch_glm_mosaic.py. Boundaries are displayed above raster data but below
// the map-label pane.
map.createPane('ufvsDomains');
map.getPane('ufvsDomains').style.zIndex = 590;

const UFVS_GEOGRAPHIC_DOMAINS = [
    { id: 'west-coast', label: 'West Coast', west: -125.0, east: -117.0, south: 32.0, north: 49.0},
    { id: 'southwest', label: 'Southwest', west: -117.0, east: -104.0, south: 28.0, north: 42.0},
    { id: 'interior-mountain-west', label: 'Interior Mountain West', west: -117.0, east: -104.0, south: 42.0, north: 49.0},
    { id: 'northern-plains', label: 'Northern Plains', west: -104.0, east: -85.0, south: 38.0, north: 49.0},
    { id: 'southern-plains', label: 'Southern Plains', west: -104.0, east: -90.0, south: 24.0, north: 38.0},
    { id: 'southeast', label: 'Southeast', west: -90.0, east: -75.0, south: 24.0, north: 38.0},
    { id: 'northeast', label: 'Northeast', west: -85.0, east: -66.0, south: 38.0, north: 49.0}
];
const UFVS_DOMAINS_SESSION_KEY = 'wpc-ufvs-geographic-domains-v1';
const ufvsGeographicDomainsLayer = L.layerGroup();

UFVS_GEOGRAPHIC_DOMAINS.forEach(domain => {
    const rectangle = L.rectangle(
        [[domain.south, domain.west], [domain.north, domain.east]],
        {
            pane: 'ufvsDomains',
            color: '#6fd3ff',
            weight: 1.5,
            opacity: 0.88,
            dashArray: '7 5',
            fill: false,
            interactive: true,
            bubblingMouseEvents: false
        }
    );
    rectangle.bindTooltip(domain.label, {
        sticky: true,
        direction: 'top',
        className: 'ufvs-domain-tooltip'
    });
    rectangle.addTo(ufvsGeographicDomainsLayer);
});

function readUFVSDomainsVisibility() {
    try {
        return window.sessionStorage.getItem(UFVS_DOMAINS_SESSION_KEY) === '1';
    } catch (error) {
        return false;
    }
}

function writeUFVSDomainsVisibility(isVisible) {
    try {
        window.sessionStorage.setItem(UFVS_DOMAINS_SESSION_KEY, isVisible ? '1' : '0');
    } catch (error) {
        // Session storage is optional; the utility remains functional in-page.
    }
}

function setUFVSGeographicDomainsVisible(isVisible, persist = true) {
    const shouldShow = Boolean(isVisible);
    if (shouldShow && !map.hasLayer(ufvsGeographicDomainsLayer)) {
        map.addLayer(ufvsGeographicDomainsLayer);
    } else if (!shouldShow && map.hasLayer(ufvsGeographicDomainsLayer)) {
        map.removeLayer(ufvsGeographicDomainsLayer);
    }
    if (persist) writeUFVSDomainsVisibility(shouldShow);
    const toggle = document.getElementById('ufvs-geographic-domains-toggle');
    if (toggle) toggle.checked = shouldShow;
}

if (readUFVSDomainsVisibility()) {
    setUFVSGeographicDomainsVisible(true, false);
}

// --- BASEMAPS ---
// Expanded operational/reference basemap suite. All selections remain mutually
// exclusive through the existing sidebar basemap selector and do not count as
// registered meteorological/hydrological data layers.

// Esri Dark Gray
const esriDarkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxNativeZoom: 16,
    maxZoom: 19,
    attribution: '© Esri, HERE, Garmin, © OpenStreetMap'
});

// Esri Light Gray
const esriLightBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxNativeZoom: 16,
    maxZoom: 19,
    attribution: '© Esri, HERE, Garmin, © OpenStreetMap'
});

// OpenStreetMap
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
});

// Esri World Street Map
const esriWorldStreet = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles © Esri and contributors'
});

// OpenTopoMap
const openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxNativeZoom: 17,
    maxZoom: 19,
    attribution: 'Map data © OpenStreetMap contributors, SRTM | Map style © OpenTopoMap (CC-BY-SA)'
});

// Humanitarian OpenStreetMap
const humanitarianOSM = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors | Tiles courtesy Humanitarian OpenStreetMap Team / OSM France'
});

// Esri World Topographic
const esriWorldTopo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles © Esri — Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
});

// USGS The National Map — Topographic
const usgsTopo = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
    maxNativeZoom: 16,
    maxZoom: 20,
    attribution: 'USGS The National Map'
});

// USGS The National Map — Shaded Relief
const usgsShadedRelief = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/tile/{z}/{y}/{x}', {
    maxNativeZoom: 16,
    maxZoom: 20,
    attribution: 'USGS The National Map / 3DEP'
});

// Esri World Imagery (Satellite)
const esriWorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// USGS The National Map — Imagery Only
const usgsImageryOnly = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', {
    maxNativeZoom: 16,
    maxZoom: 20,
    attribution: 'USDA / USGS The National Map — Orthoimagery'
});

// USGS The National Map — Imagery + Topographic Reference
const usgsImageryTopo = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}', {
    maxNativeZoom: 16,
    maxZoom: 20,
    attribution: 'USGS The National Map — Orthoimagery and US Topo'
});

// WPC Dark Reference — WPC-owned Leaflet cartography designed specifically
// for hydrometeorological analysis. Natural Earth provides the keyless global
// country geometry; current U.S. Census TIGERweb services provide scalable U.S.
// reference information. The United States is intentionally near-black while
// neighboring land and water are dark gray so bright operational data dominate.
const WPC_DARK_COUNTRIES_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson';
const WPC_DARK_PLACES_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_populated_places_simple.geojson';
const TIGER_CURRENT_MAPSERVER_URL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer';
const TIGER_TRANSPORTATION_TILES_URL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer/tile/{z}/{y}/{x}';

function isUSReferenceFeature(feature) {
    const properties = feature?.properties || {};
    return properties.ADM0_A3 === 'USA'
        || properties.SOV_A3 === 'US1'
        || properties.SOVEREIGNT === 'United States of America'
        || properties.ADMIN === 'United States of America';
}

const wpcDarkCountryPolygons = L.geoJSON(null, {
    pane: 'wpcDarkBase',
    interactive: false,
    style: feature => ({
        color: isUSReferenceFeature(feature) ? '#5e6670' : '#4a5058',
        weight: isUSReferenceFeature(feature) ? 0.85 : 0.7,
        opacity: 0.82,
        fillColor: isUSReferenceFeature(feature) ? '#050608' : '#17191c',
        fillOpacity: 1.0
    })
});
const wpcDarkReferenceBase = L.layerGroup([wpcDarkCountryPolygons]);

const wpcDarkCountryLabels = L.layerGroup();
let wpcCountryLabelFeatures = [];
const wpcMajorCitiesPlacesLayer = L.layerGroup();
const wpcStateTerritoryNamesLayer = L.layerGroup();
const wpcInternationalBoundariesLayer = L.geoJSON(null, {
    pane: 'mapReference',
    interactive: false,
    style: {
        color: 'rgba(210, 215, 220, 0.72)',
        weight: 1.0,
        opacity: 0.85,
        fill: false
    }
});

// TIGERweb's WMS endpoint proved unreliable in the live dashboard for the
// state-label, county-boundary, and urban-area toggles. Use the same official
// 2026 TIGERweb MapServer through its GeoJSON query API instead. These layers
// are lazy-loaded only while visible and are spatially limited to the current
// map view, so the controls remain responsive without downloading nationwide
// high-detail geometry on startup.
function censusQueryUrl(layerId, bounds, maxAllowableOffset, outFields = 'OBJECTID') {
    const params = new URLSearchParams({
        where: '1=1',
        outFields,
        returnGeometry: 'true',
        outSR: '4326',
        f: 'geojson'
    });
    if (bounds) {
        params.set('geometry', `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`);
        params.set('geometryType', 'esriGeometryEnvelope');
        params.set('inSR', '4326');
        params.set('spatialRel', 'esriSpatialRelIntersects');
    }
    if (Number.isFinite(maxAllowableOffset) && maxAllowableOffset > 0) {
        params.set('maxAllowableOffset', String(maxAllowableOffset));
        params.set('geometryPrecision', maxAllowableOffset >= 0.02 ? '3' : '5');
    }
    return `${TIGER_CURRENT_MAPSERVER_URL}/${layerId}/query?${params.toString()}`;
}

function createCensusViewportGeoJSONLayer(layerId, options = {}) {
    const target = L.geoJSON(null, {
        pane: options.pane || 'mapReference',
        interactive: false,
        style: options.style
    });
    let controller = null;
    let requestSerial = 0;
    let refreshTimer = null;

    const offsetForZoom = zoom => {
        if (zoom <= 5) return 0.05;
        if (zoom === 6) return 0.025;
        if (zoom === 7) return 0.0125;
        if (zoom === 8) return 0.006;
        return 0.003;
    };

    const refresh = () => {
        if (!map.hasLayer(target)) return;
        const zoom = map.getZoom();
        if (zoom < (options.minZoom ?? 0)) {
            target.clearLayers();
            return;
        }
        if (controller) controller.abort();
        controller = new AbortController();
        const serial = ++requestSerial;
        const bounds = map.getBounds().pad(0.08);
        const url = censusQueryUrl(layerId, bounds, offsetForZoom(zoom));
        fetch(url, {signal: controller.signal})
            .then(response => {
                if (!response.ok) throw new Error(`TIGERweb layer ${layerId} HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (serial !== requestSerial || !map.hasLayer(target)) return;
                target.clearLayers();
                target.addData(data);
            })
            .catch(error => {
                if (error?.name !== 'AbortError') {
                    console.warn(`TIGERweb layer ${layerId} unavailable:`, error);
                }
            });
    };

    const queueRefresh = () => {
        if (!map.hasLayer(target)) return;
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refresh, 120);
    };

    target.on('add', queueRefresh);
    target.on('remove', () => {
        clearTimeout(refreshTimer);
        if (controller) controller.abort();
        controller = null;
    });
    map.on('moveend zoomend', queueRefresh);
    target.refreshFromMap = refresh;
    return target;
}

const wpcCountyBoundariesLayer = createCensusViewportGeoJSONLayer(82, {
    pane: 'mapReference',
    minZoom: 5,
    style: {
        color: 'rgba(190, 195, 200, 0.68)',
        weight: 0.75,
        opacity: 0.78,
        fillOpacity: 0
    }
});

const wpcUrbanAreasLayer = createCensusViewportGeoJSONLayer(88, {
    pane: 'mapReferenceBase',
    minZoom: 5,
    style: {
        // Stronger cool-blue urban mask for reliable visibility on WPC Dark Reference.
        // Keep below operational raster/vector layers so radar and warning colors dominate.
        color: 'rgba(130, 205, 230, 0.78)',
        weight: 0.65,
        opacity: 0.85,
        fillColor: '#4f9db8',
        fillOpacity: 0.30
    }
});

const wpcMajorRoadsLayer = L.tileLayer(TIGER_TRANSPORTATION_TILES_URL, {
    pane: 'mapReferenceBase',
    opacity: 0.30,
    minZoom: 4,
    maxZoom: 19,
    attribution: 'U.S. Census Bureau TIGERweb Transportation'
});

function escapeWPCReferenceText(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function makeWPCReferenceLabel(text, options = {}) {
    const size = options.size || '11px';
    const weight = options.weight || '600';
    const color = options.color || '#cfd5db';
    const transform = options.transform || 'none';
    const spacing = options.spacing || '0.01em';
    const dot = options.dot ? '<span style="font-size:10px;margin-right:3px;">•</span>' : '';
    const safeText = escapeWPCReferenceText(text);
    return L.divIcon({
        className: '',
        iconSize: [150, 18],
        iconAnchor: [0, 9],
        html: `<div style="white-space:nowrap;pointer-events:none;color:${color};font:${weight} ${size}/1.05 Arial,Helvetica,sans-serif;text-transform:${transform};letter-spacing:${spacing};text-shadow:-1px -1px 1px #050608,1px -1px 1px #050608,-1px 1px 1px #050608,1px 1px 1px #050608;opacity:0.92;">${dot}${safeText}</div>`
    });
}

let wpcMajorPlaceFeatures = [];
let wpcStateTerritoryFeatures = [];

function refreshWPCStateTerritoryLabels() {
    wpcStateTerritoryNamesLayer.clearLayers();
    if (!map.hasLayer(wpcStateTerritoryNamesLayer) || !wpcStateTerritoryFeatures.length) return;
    const zoom = map.getZoom();

    wpcStateTerritoryFeatures.forEach(feature => {
        const attributes = feature?.attributes || feature?.properties || {};
        const latitude = Number(attributes.CENTLAT ?? attributes.centlat);
        const longitude = Number(attributes.CENTLON ?? attributes.centlon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        const abbreviation = String(attributes.STUSAB ?? attributes.stusab ?? '').trim();
        const fullName = String(attributes.BASENAME ?? attributes.basename ?? attributes.NAME ?? attributes.name ?? '').trim();
        const label = zoom >= 7 ? (fullName || abbreviation) : (abbreviation || fullName);
        if (!label) return;

        L.marker([latitude, longitude], {
            pane: 'labels',
            interactive: false,
            keyboard: false,
            icon: makeWPCReferenceLabel(label, {
                size: zoom >= 7 ? '11px' : '10px',
                weight: '700',
                color: '#eef1f4',
                transform: zoom >= 7 ? 'none' : 'uppercase',
                spacing: zoom >= 7 ? '0.01em' : '0.06em'
            })
        }).addTo(wpcStateTerritoryNamesLayer);
    });
}

function loadWPCStateTerritoryLabels() {
    const params = new URLSearchParams({
        where: '1=1',
        outFields: 'STUSAB,BASENAME,NAME,CENTLAT,CENTLON',
        returnGeometry: 'false',
        f: 'json'
    });
    fetch(`${TIGER_CURRENT_MAPSERVER_URL}/80/query?${params.toString()}`)
        .then(response => {
            if (!response.ok) throw new Error(`TIGERweb state labels HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            wpcStateTerritoryFeatures = Array.isArray(data.features) ? data.features : [];
            refreshWPCStateTerritoryLabels();
        })
        .catch(error => console.warn('WPC state/territory labels unavailable:', error));
}


function refreshWPCDarkCountryLabels() {
    wpcDarkCountryLabels.clearLayers();
    if (!map.hasLayer(wpcDarkCountryLabels) || !wpcCountryLabelFeatures.length) return;
    const zoom = map.getZoom();
    if (zoom > 6) return;

    wpcCountryLabelFeatures.forEach(feature => {
        const properties = feature?.properties || {};
        const longitude = Number(properties.LABEL_X);
        const latitude = Number(properties.LABEL_Y);
        const label = properties.NAME_EN || properties.NAME_LONG || properties.ADMIN || properties.NAME;
        if (!label || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
        const minLabel = Number(properties.MIN_LABEL ?? 2) || 2;
        if (zoom + 0.5 < minLabel) return;
        L.marker([latitude, longitude], {
            pane: 'labels',
            interactive: false,
            keyboard: false,
            icon: makeWPCReferenceLabel(label, {
                size: '10px',
                weight: '600',
                color: isUSReferenceFeature(feature) ? '#d7dce1' : '#9ea5ab',
                transform: 'uppercase',
                spacing: '0.08em'
            })
        }).addTo(wpcDarkCountryLabels);
    });
}

function refreshWPCMajorPlaceLabels() {
    wpcMajorCitiesPlacesLayer.clearLayers();
    if (!map.hasLayer(wpcMajorCitiesPlacesLayer) || !wpcMajorPlaceFeatures.length) return;

    const zoom = map.getZoom();
    const populationThreshold = zoom <= 4 ? 2000000
        : zoom === 5 ? 750000
        : zoom === 6 ? 250000
        : zoom === 7 ? 100000
        : 0;

    wpcMajorPlaceFeatures.forEach(feature => {
        const properties = feature?.properties || {};
        const coordinates = feature?.geometry?.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) return;
        const longitude = Number(coordinates[0]);
        const latitude = Number(coordinates[1]);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        const population = Number(properties.POP_MAX ?? properties.pop_max ?? 0) || 0;
        const isCapital = Boolean(Number(properties.ADM0CAP ?? properties.adm0cap ?? 0))
            || String(properties.CAPIN ?? properties.capin ?? '').trim().length > 0;
        const isWorldCity = Boolean(Number(properties.WORLDCITY ?? properties.worldcity ?? 0));
        if (population < populationThreshold && !(isCapital && zoom >= 4) && !(isWorldCity && zoom >= 4)) return;

        const name = properties.NAMEPAR
            || properties.namepar
            || properties.NAME
            || properties.name
            || properties.NAMEASCII
            || properties.nameascii;
        if (!name) return;

        L.marker([latitude, longitude], {
            pane: 'labels',
            interactive: false,
            keyboard: false,
            icon: makeWPCReferenceLabel(name, {
                size: zoom >= 7 ? '11px' : '10px',
                weight: isCapital ? '700' : '600',
                color: isCapital ? '#f0f2f4' : '#c7cdd2',
                dot: true
            })
        }).addTo(wpcMajorCitiesPlacesLayer);
    });
}

fetch(WPC_DARK_COUNTRIES_URL)
    .then(response => {
        if (!response.ok) throw new Error(`Natural Earth countries HTTP ${response.status}`);
        return response.json();
    })
    .then(data => {
        wpcDarkCountryPolygons.addData(data);
        wpcInternationalBoundariesLayer.addData(data);

        wpcCountryLabelFeatures = Array.isArray(data.features) ? data.features : [];
        refreshWPCDarkCountryLabels();
    })
    .catch(error => console.warn('WPC Dark Reference country geometry unavailable:', error));

fetch(WPC_DARK_PLACES_URL)
    .then(response => {
        if (!response.ok) throw new Error(`Natural Earth populated places HTTP ${response.status}`);
        return response.json();
    })
    .then(data => {
        wpcMajorPlaceFeatures = Array.isArray(data.features) ? data.features : [];
        refreshWPCMajorPlaceLabels();
    })
    .catch(error => console.warn('WPC Dark Reference populated places unavailable:', error));

loadWPCStateTerritoryLabels();

map.on('zoomend', () => {
    refreshWPCDarkCountryLabels();
    refreshWPCMajorPlaceLabels();
    refreshWPCStateTerritoryLabels();
});

// WPC Black Canvas — a true near-black background with no external tile
// dependency. State boundaries remain available through the dashboard's own
// reference overlay so bright meteorological/hydrological fields retain maximum
// contrast without sacrificing basic geographic orientation.
const blackCanvasBase = L.layerGroup();

// No external basemap. Useful when a meteorological/hydrological raster should
// stand on its own with no underlying cartographic tiles.
const blankBase = L.layerGroup();

// Add default basemap — WPC Dark Reference is the operational startup background.
wpcDarkReferenceBase.addTo(map);
map.getContainer().style.backgroundColor = '#25282b';

// Floating reference labels for the Esri gray-canvas basemaps.
const esriDarkLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    pane: 'labels',
    maxNativeZoom: 16,
    maxZoom: 19
});
const esriLightLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    pane: 'labels',
    maxNativeZoom: 16,
    maxZoom: 19
});
wpcDarkCountryLabels.addTo(map);

// Official RFC FFG; durable product data are separate from the Pages code branch.
const rfcFFG = window.createRFCFFGLayers({map,
    metadataURL: 'https://raw.githubusercontent.com/andreworrison-cloud/wpc-hydro-dashboard/data/rfc-ffg/public/metadata.json',
    onChange: () => updateLegends()
});
window.RFCFFG = rfcFFG;
const ffgTendency=window.createFFGTendencyLayers({map,
    metadataURL:'https://raw.githubusercontent.com/andreworrison-cloud/wpc-hydro-dashboard/data/ffg-tendency/public/metadata.json',
    onChange:()=>{updateLegends();document.querySelectorAll('[data-ffg-tendency-status]').forEach(node=>{node.textContent=ffgTendency.summary();});}
});
window.FFGTendency=ffgTendency;
const h8Review = new URLSearchParams(location.search).get('h8Review') === '1';
const qpeFFG = [1,2].map(passNumber=>window.createQPEFFGLayers({map,passNumber,
    metadataURL: h8Review ? `review/qpe-ffg/pass${passNumber}/metadata.json` : `https://raw.githubusercontent.com/andreworrison-cloud/wpc-hydro-dashboard/data/qpe-ffg/public/pass${passNumber}/metadata.json`,
    onChange:()=>{updateLegends();updateQPEFFGMenuStatus();}
}));
window.QPEFFG=qpeFFG;


// Approved SPoRT suites: durable products are separate from dashboard code.
const sportReview = new URLSearchParams(location.search).get('sportReview') === '1';
const gdiGuidance = window.GDINamedSuite.create({map, metadataURL: 'https://raw.githubusercontent.com/andreworrison-cloud/wpc-hydro-dashboard/data/guidance-gdi/public/metadata.json', keys: ['rrfs0','rrfs3','rrfs6','blend0','blend3','blend6','maximum','support30','support40','support50','persistence30','persistence40','persistence50'], paneName: 'gdiGuidance', onChange: () => updateLegends()});
const gdiERO = window.GDINamedSuite.create({map, metadataURL: 'https://raw.githubusercontent.com/andreworrison-cloud/wpc-hydro-dashboard/data/ero-gdi/public/metadata.json', keys: ['maximum','support30','support40','support50','persistence30','persistence40','persistence50'], paneName: 'gdiERO', onChange: () => updateLegends()});
const rapGDI = window.GDINamedSuite.create({map, metadataURL: 'https://raw.githubusercontent.com/andreworrison-cloud/wpc-hydro-dashboard/data/rap-gdi/public/metadata.json', keys: ['analysis','change','forecast'], paneName: 'rapGDI', onChange: () => updateLegends()});
const hrrrGDI = window.HRRRGDI.create({map, metadataURL: 'https://raw.githubusercontent.com/andreworrison-cloud/wpc-hydro-dashboard/data/gdi/public/metadata.json', onChange: () => updateLegends()});
const sportDataRoot = 'https://raw.githubusercontent.com/andreworrison-cloud/wpc-hydro-dashboard/data/sport-lis/public/';
const sportSuite = window.SPoRTSuite.create({map,
    metadataURL: sportReview ? 'review/sport-suite/metadata.json' : sportDataRoot + 'percentile/metadata.json',
    onChange: () => updateLegends()
});
window.sportSuite = sportSuite;
const sportRSM = window.SPoRTRSM.create({map,
    metadataURL: sportReview ? 'review/sport-rsm/metadata.json' : sportDataRoot + 'rsm/metadata.json',
    onChange: () => updateLegends()
});
window.sportRSM = sportRSM;

// H7 uses durable products; the query override supports isolated review bundles.
const h7Review = new URLSearchParams(location.search).get('h7Review') === '1';
const sportChange = window.SPoRTChange.create({map,
    metadataURL: h7Review ? 'review/sport-change/metadata.json' : sportDataRoot + 'change/metadata.json', onChange: () => updateLegends()
});
window.sportChange = sportChange;

// --- AUTO-TOGGLING GEOJSON STATE BORDERS ---
const whiteBorders = L.geoJSON(null, {
    style: { color: 'rgba(255, 255, 255, 0.8)', weight: 1.5, fillOpacity: 0 },
    pane: 'labels', interactive: false
});

const blackBorders = L.geoJSON(null, {
    style: { color: 'rgba(0, 0, 0, 0.8)', weight: 1.5, fillOpacity: 0 },
    pane: 'labels', interactive: false
});

fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
    .then(response => response.json())
    .then(data => {
        whiteBorders.addData(data);
        blackBorders.addData(data);
        rfcFFG.setBorders(data); ffgTendency.setBorders(data); qpeFFG.forEach(x=>x.setBorders(data)); sportSuite?.setBorders(data); sportRSM?.setBorders(data); sportChange?.setBorders(data);
    }).catch(() => fetch('review/vendor/us-states.json')
        .then(response => { if (!response.ok) throw new Error('State reference unavailable'); return response.json(); })
        .then(data => { whiteBorders.addData(data); blackBorders.addData(data); rfcFFG.setBorders(data); ffgTendency.setBorders(data); qpeFFG.forEach(x=>x.setBorders(data)); sportSuite?.setBorders(data); sportRSM?.setBorders(data); sportChange?.setBorders(data); })
        .catch(error => console.warn('State borders unavailable:', error)));


whiteBorders.addTo(map); 

// DYNAMIC BASEMAP TOGGLE LOGIC
// Keep state-border contrast and gray-canvas reference labels appropriate for
// the selected background. USGS/OSM/Esri topo and street basemaps already carry
// their own place-name/reference content; only the Esri gray canvases need a
// separate reference-label layer.
map.on('baselayerchange', function(e) {
    for (const referenceLayer of [esriDarkLabels, esriLightLabels, wpcDarkCountryLabels]) {
        if (map.hasLayer(referenceLayer)) map.removeLayer(referenceLayer);
    }
    if (map.hasLayer(whiteBorders)) map.removeLayer(whiteBorders);
    if (map.hasLayer(blackBorders)) map.removeLayer(blackBorders);

    const selectedBase = baseMapRegistry.find(base => base.layer === e.layer || base.label === e.name);
    if (!selectedBase) return;

    // Canvas-only and WPC-owned vector basemaps can set an explicit map
    // background. Every standard tiled basemap resets this to Leaflet's normal
    // container background.
    map.getContainer().style.backgroundColor = selectedBase.canvasColor || '';

    const referenceLayers = selectedBase.referenceLayers
        || (selectedBase.referenceLayer ? [selectedBase.referenceLayer] : []);
    referenceLayers.forEach(referenceLayer => {
        if (referenceLayer && !map.hasLayer(referenceLayer)) referenceLayer.addTo(map);
    });
    if (selectedBase.id === 'wpc-dark-reference') refreshWPCDarkCountryLabels();
    if (selectedBase.borderTone === 'white') {
        whiteBorders.addTo(map);
    } else if (selectedBase.borderTone === 'black') {
        blackBorders.addTo(map);
    }
});

// --- RADAR LOOP TIME CONTROL ---
// The two radar feeds keep separate playback controls. IEM remains on the
// conventional Leaflet.TimeDimension FPS control because the tiled WMS responds
// correctly to it. Direct NOAA MRMS RALA publishes real analyses on a deliberate
// 10-minute cadence and uses an Operational Product Viewer-style frame-delay
// control. The backend retains six hours; the browser defaults to the latest two
// hours and can expose four or six hours without rebuilding the archive.
map.timeDimension = L.timeDimension({
    period: "PT10M"
});

const IEM_RADAR_DEFAULT_FPS = 5;
const IEM_RADAR_MIN_FPS = 1;
const IEM_RADAR_MAX_FPS = 10;
const MRMS_RALA_DEFAULT_FRAME_STEP_MS = 200;
const MRMS_RALA_MIN_FRAME_STEP_MS = 100;
const MRMS_RALA_MAX_FRAME_STEP_MS = 1000;
const MRMS_RALA_FRAME_STEP_INCREMENT_MS = 50;
const MRMS_RALA_TARGET_CADENCE_MINUTES = 10;
const MRMS_RALA_DEFAULT_WINDOW_MINUTES = 120;
const MRMS_RALA_WINDOW_OPTIONS_MINUTES = [120, 240, 360];

let dashboardRadarSpeedMode = 'mrms';
let iemRadarRequestedFPS = IEM_RADAR_DEFAULT_FPS;
let mrmsRalaFrameStepMs = MRMS_RALA_DEFAULT_FRAME_STEP_MS;
let mrmsRalaAnimationTimer = null;
let mrmsRalaAnimationPlaying = false;
let mrmsRalaSpeedControl = null;
let mrmsRalaSpeedSlider = null;
let mrmsRalaSpeedValue = null;
let mrmsRalaWindowSelect = null;
let mrmsRalaWindowMinutes = MRMS_RALA_DEFAULT_WINDOW_MINUTES;
let mrmsRalaTimelineEchoTime = null;

const dashboardTimeControl = L.control.timeDimension({
    position: 'bottomleft',
    autoPlay: false,
    minSpeed: IEM_RADAR_MIN_FPS,
    maxSpeed: IEM_RADAR_MAX_FPS,
    speedStep: 1,
    playerOptions: {transitionTime: Math.round(1000 / IEM_RADAR_DEFAULT_FPS), loop: true}
});

dashboardTimeControl.addTo(map);

function stockIEMSpeedControlContainer() {
    return dashboardTimeControl?._sliderSpeed?._container?.parentElement || null;
}

function syncRadarSpeedControlVisibility() {
    const iemControl = stockIEMSpeedControlContainer();
    if (iemControl) iemControl.style.display = dashboardRadarSpeedMode === 'iem' ? '' : 'none';
    if (mrmsRalaSpeedControl) {
        mrmsRalaSpeedControl.style.display = dashboardRadarSpeedMode === 'mrms' ? '' : 'none';
    }
}

function syncIEMRadarSpeedSlider() {
    if (dashboardRadarSpeedMode !== 'iem') return;
    const slider = dashboardTimeControl?._sliderSpeed;
    if (!slider || dashboardTimeControl._draggingSpeed) return;
    slider.setValue(iemRadarRequestedFPS);
}

function setIEMRadarAnimationFPS(fps) {
    const numeric = Number(fps);
    if (!Number.isFinite(numeric) || numeric <= 0) return false;
    const requestedFPS = Math.min(IEM_RADAR_MAX_FPS, Math.max(IEM_RADAR_MIN_FPS, numeric));
    iemRadarRequestedFPS = requestedFPS;
    dashboardTimeControl._steps = 1;
    const player = dashboardTimeControl?._player;
    if (!player || typeof player.setTransitionTime !== 'function') return false;
    player._steps = 1;
    player.setTransitionTime(1000 / requestedFPS);
    syncIEMRadarSpeedSlider();
    return true;
}

function syncMRMSRALAPlayButton() {
    if (dashboardRadarSpeedMode !== 'mrms') return;
    const button = dashboardTimeControl?._buttonPlayPause;
    if (!button) return;
    if (mrmsRalaAnimationPlaying) {
        L.DomUtil.addClass(button, 'pause');
        L.DomUtil.removeClass(button, 'play');
        button.title = 'Pause MRMS RALA loop';
    } else {
        L.DomUtil.removeClass(button, 'pause');
        L.DomUtil.addClass(button, 'play');
        button.title = 'Play MRMS RALA loop';
    }
}

function syncMRMSRALAFrameStepControl() {
    if (mrmsRalaSpeedSlider) {
        const speedPosition = MRMS_RALA_MAX_FRAME_STEP_MS - mrmsRalaFrameStepMs;
        mrmsRalaSpeedSlider.value = String(speedPosition);
    }
    if (mrmsRalaSpeedValue) mrmsRalaSpeedValue.textContent = `${mrmsRalaFrameStepMs} ms`;
}

function syncMRMSRALAWindowControl() {
    if (mrmsRalaWindowSelect) mrmsRalaWindowSelect.value = String(mrmsRalaWindowMinutes);
}

function stopMRMSRALAAnimation() {
    mrmsRalaAnimationPlaying = false;
    if (mrmsRalaAnimationTimer) {
        window.clearTimeout(mrmsRalaAnimationTimer);
        mrmsRalaAnimationTimer = null;
    }
    syncMRMSRALAPlayButton();
}

async function advanceMRMSRALAOneFrame() {
    if (
        dashboardRadarSpeedMode !== 'mrms' ||
        !map.hasLayer(mrmsRalaLayer) ||
        !mrmsRalaReady ||
        !mrmsRalaFresh ||
        !mrmsRalaFrames.length
    ) {
        stopMRMSRALAAnimation();
        return false;
    }

    const times = map.timeDimension.getAvailableTimes();
    if (!times.length) return false;
    let currentIndex = map.timeDimension.getCurrentTimeIndex();
    if (!Number.isInteger(currentIndex) || currentIndex < 0) currentIndex = times.length - 1;
    const nextIndex = (currentIndex + 1) % times.length;
    const nextTime = times[nextIndex];

    // Display exactly the next published 10-minute MRMS analysis. No browser-side
    // frame skipping, temporal interpolation, averaging, or synthetic frames are used.
    const displayed = await showMRMSRALAFrame(nextTime);
    if (!displayed) return false;

    // Keep the shared time label/controls synchronized without asking the
    // timeload listener to render the same frame a second time.
    mrmsRalaTimelineEchoTime = nextTime;
    map.timeDimension.setCurrentTimeIndex(nextIndex);
    return true;
}

async function runMRMSRALAAnimationTick() {
    if (!mrmsRalaAnimationPlaying) return;
    const started = performance.now();
    await advanceMRMSRALAOneFrame();
    if (!mrmsRalaAnimationPlaying) return;
    const elapsed = performance.now() - started;
    const remaining = Math.max(0, mrmsRalaFrameStepMs - elapsed);
    mrmsRalaAnimationTimer = window.setTimeout(runMRMSRALAAnimationTick, remaining);
}

function startMRMSRALAAnimation() {
    if (dashboardRadarSpeedMode !== 'mrms' || mrmsRalaAnimationPlaying) return;
    const player = dashboardTimeControl?._player;
    if (player?.isPlaying()) player.stop();
    mrmsRalaAnimationPlaying = true;
    mrmsRalaAnimationTimer = window.setTimeout(runMRMSRALAAnimationTick, mrmsRalaFrameStepMs);
    syncMRMSRALAPlayButton();
}

function setMRMSRALAFrameStep(milliseconds) {
    const numeric = Number(milliseconds);
    if (!Number.isFinite(numeric)) return false;
    const clamped = Math.min(
        MRMS_RALA_MAX_FRAME_STEP_MS,
        Math.max(MRMS_RALA_MIN_FRAME_STEP_MS, numeric)
    );
    mrmsRalaFrameStepMs = Math.round(clamped / MRMS_RALA_FRAME_STEP_INCREMENT_MS)
        * MRMS_RALA_FRAME_STEP_INCREMENT_MS;
    syncMRMSRALAFrameStepControl();

    // Apply a changed viewer speed promptly without altering the frame sequence.
    if (mrmsRalaAnimationPlaying) {
        if (mrmsRalaAnimationTimer) window.clearTimeout(mrmsRalaAnimationTimer);
        mrmsRalaAnimationTimer = window.setTimeout(runMRMSRALAAnimationTick, mrmsRalaFrameStepMs);
    }
    return true;
}

function setMRMSRALAWindowMinutes(minutes) {
    const numeric = Number(minutes);
    if (!MRMS_RALA_WINDOW_OPTIONS_MINUTES.includes(numeric)) return false;
    const wasPlaying = mrmsRalaAnimationPlaying;
    stopMRMSRALAAnimation();
    mrmsRalaWindowMinutes = numeric;
    syncMRMSRALAWindowControl();
    if (mrmsRalaReady && mrmsRalaFresh && map.hasLayer(mrmsRalaLayer)) {
        activateMRMSRALATimeline({jumpToLatest: true, applyDefaultSpeed: false, autoPlay: wasPlaying});
        showMRMSRALAFrame(map.timeDimension.getCurrentTime(), {force: true});
    }
    updateMRMSRALATimeBox();
    return true;
}

function createMRMSRALAFrameStepControl() {
    const container = dashboardTimeControl?._container;
    if (!container || mrmsRalaSpeedControl) return;

    const control = L.DomUtil.create(
        'div',
        'leaflet-control-timecontrol mrms-rala-speed-control',
        container
    );
    control.title = 'MRMS RALA loop playback speed';
    control.style.display = 'none';
    control.style.padding = '0 7px';
    control.style.whiteSpace = 'nowrap';
    control.style.minWidth = '315px';

    const loopLabel = L.DomUtil.create('span', 'mrms-rala-window-label', control);
    loopLabel.textContent = 'Loop';
    loopLabel.style.fontSize = '11px';
    loopLabel.style.fontWeight = '600';
    loopLabel.style.marginRight = '4px';

    const windowSelect = L.DomUtil.create('select', 'mrms-rala-window-select', control);
    windowSelect.setAttribute('aria-label', 'MRMS RALA loop length');
    windowSelect.style.marginRight = '8px';
    windowSelect.style.fontSize = '10px';
    MRMS_RALA_WINDOW_OPTIONS_MINUTES.forEach(minutes => {
        const option = document.createElement('option');
        option.value = String(minutes);
        option.textContent = `${minutes / 60} h`;
        windowSelect.appendChild(option);
    });
    windowSelect.addEventListener('change', event => {
        setMRMSRALAWindowMinutes(Number(event.target.value));
    });

    const slow = L.DomUtil.create('span', 'mrms-rala-speed-label', control);
    slow.textContent = 'Slow';
    slow.style.fontSize = '11px';
    slow.style.fontWeight = '600';

    const slider = L.DomUtil.create('input', 'mrms-rala-speed-slider', control);
    slider.type = 'range';
    slider.min = '0';
    slider.max = String(MRMS_RALA_MAX_FRAME_STEP_MS - MRMS_RALA_MIN_FRAME_STEP_MS);
    slider.step = String(MRMS_RALA_FRAME_STEP_INCREMENT_MS);
    slider.setAttribute('aria-label', 'MRMS RALA playback speed from slow to fast');
    slider.style.width = '105px';
    slider.style.margin = '0 5px';
    slider.style.verticalAlign = 'middle';

    const fast = L.DomUtil.create('span', 'mrms-rala-speed-label', control);
    fast.textContent = 'Fast';
    fast.style.fontSize = '11px';
    fast.style.fontWeight = '600';

    const value = L.DomUtil.create('span', 'mrms-rala-speed-value', control);
    value.style.display = 'inline-block';
    value.style.minWidth = '50px';
    value.style.marginLeft = '6px';
    value.style.fontSize = '10px';
    value.style.opacity = '0.85';

    slider.addEventListener('input', event => {
        const speedPosition = Number(event.target.value);
        setMRMSRALAFrameStep(MRMS_RALA_MAX_FRAME_STEP_MS - speedPosition);
    });

    L.DomEvent.disableClickPropagation(control);
    L.DomEvent.disableScrollPropagation(control);
    mrmsRalaSpeedControl = control;
    mrmsRalaSpeedSlider = slider;
    mrmsRalaSpeedValue = value;
    mrmsRalaWindowSelect = windowSelect;
    syncMRMSRALAFrameStepControl();
    syncMRMSRALAWindowControl();
    syncRadarSpeedControlVisibility();
}

createMRMSRALAFrameStepControl();

// IEM keeps the stock FPS slider exactly because its tiled WMS renderer responds
// correctly to conventional FPS changes. MRMS uses the viewer-style delay slider.
dashboardTimeControl._sliderSpeedValueChanged = function(newValue) {
    if (dashboardRadarSpeedMode === 'iem') setIEMRadarAnimationFPS(newValue);
};

// Manual step buttons always move exactly one native timeline frame and pause
// the MRMS animation for precise frame-by-frame interrogation.
dashboardTimeControl._buttonBackwardClicked = function() {
    if (dashboardRadarSpeedMode === 'mrms') stopMRMSRALAAnimation();
    this._timeDimension.previousTime(1);
};
dashboardTimeControl._buttonForwardClicked = function() {
    if (dashboardRadarSpeedMode === 'mrms') stopMRMSRALAAnimation();
    this._timeDimension.nextTime(1);
};

dashboardTimeControl._buttonPlayClicked = function() {
    if (dashboardRadarSpeedMode === 'mrms') {
        if (mrmsRalaAnimationPlaying) stopMRMSRALAAnimation();
        else startMRMSRALAAnimation();
        return;
    }
    if (this._player.isPlaying()) this._player.stop();
    else this._player.start(1);
};

// Leaflet.TimeDimension binds button handlers when addTo(map) creates the DOM.
// Rebind those handlers explicitly so each feed gets its intended controls.
function rebindDashboardTimeControlButton(button, originalHandler, replacementHandler) {
    if (!button || typeof originalHandler !== 'function' || typeof replacementHandler !== 'function') return;
    L.DomEvent.off(button, 'click', originalHandler, dashboardTimeControl);
    L.DomEvent.on(button, 'click', replacementHandler, dashboardTimeControl);
}
rebindDashboardTimeControlButton(
    dashboardTimeControl._buttonBackward,
    L.Control.TimeDimension.prototype._buttonBackwardClicked,
    dashboardTimeControl._buttonBackwardClicked
);
rebindDashboardTimeControlButton(
    dashboardTimeControl._buttonForward,
    L.Control.TimeDimension.prototype._buttonForwardClicked,
    dashboardTimeControl._buttonForwardClicked
);
rebindDashboardTimeControlButton(
    dashboardTimeControl._buttonPlayPause,
    L.Control.TimeDimension.prototype._buttonPlayClicked,
    dashboardTimeControl._buttonPlayClicked
);

map.timeDimension.on('timeload', function() {
    if (dashboardRadarSpeedMode === 'iem') syncIEMRadarSpeedSlider();
    else window.requestAnimationFrame(syncMRMSRALAPlayButton);
});
dashboardTimeControl._player.on('speedchange', syncIEMRadarSpeedSlider);

function buildIEMRadarTimes() {
    const endTime = new Date();
    endTime.setMinutes(Math.floor(endTime.getMinutes() / 10) * 10);
    endTime.setSeconds(0);
    endTime.setMilliseconds(0);
    const startTime = new Date(endTime.getTime() - 2 * 60 * 60 * 1000);
    const times = [];
    for (let current = new Date(startTime); current <= endTime; current = new Date(current.getTime() + 10 * 60 * 1000)) {
        times.push(current.getTime());
    }
    return times;
}

function activateIEMRadarTimeline({applyDefaultSpeed = false, autoPlay = true} = {}) {
    dashboardRadarSpeedMode = 'iem';
    stopMRMSRALAAnimation();
    syncRadarSpeedControlVisibility();
    if (applyDefaultSpeed) iemRadarRequestedFPS = IEM_RADAR_DEFAULT_FPS;
    setIEMRadarAnimationFPS(iemRadarRequestedFPS);

    const times = buildIEMRadarTimes();
    map.timeDimension.setAvailableTimes(times, 'replace');
    if (times.length) map.timeDimension.setCurrentTime(times[times.length - 1]);

    const player = dashboardTimeControl?._player;
    if (autoPlay && player && !player.isPlaying()) player.start(1);
}

// Seed the shared timeline without changing the active radar-speed mode or
// starting the backup feed. Direct NOAA MRMS remains the dashboard default and
// takes ownership as soon as its manifest is ready.
const initialIEMRadarTimes = buildIEMRadarTimes();
map.timeDimension.setAvailableTimes(initialIEMRadarTimes, 'replace');
if (initialIEMRadarTimes.length) {
    map.timeDimension.setCurrentTime(initialIEMRadarTimes[initialIEMRadarTimes.length - 1]);
}
syncRadarSpeedControlVisibility();
window.setInterval(() => {
    if (map.hasLayer(radarTimeLayer) && !map.hasLayer(mrmsRalaLayer)) {
        activateIEMRadarTimeline({applyDefaultSpeed: false, autoPlay: true});
    }
}, 10 * 60 * 1000);

// --- IEM NEXRAD BACKUP LOOP ---
const radarWMS = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q-t.cgi", {
    format: 'image/png', transparent: true, opacity: 0.7, layers: 'nexrad-n0q-wmst', attribution: "Data © IEM"
});
const radarTimeLayer = L.timeDimension.layer.wms(radarWMS, { updateTimeDimension: false });

// --- DIRECT NOAA MRMS RALA — OPERATIONAL 10-MINUTE / 2–6 HOUR LOOP ---
const MRMS_RALA_LAYER_NAME = 'MRMS RALA — Direct NOAA (10-Min Loop)';
const MRMS_RALA_DATA_ROOT = 'https://raw.githubusercontent.com/andreworrison-cloud/wpc-hydro-dashboard/mrms-rala-data';
const MRMS_RALA_MANIFEST_URL = `${MRMS_RALA_DATA_ROOT}/mrms_rala_loop_manifest.json`;
const MRMS_RALA_MANIFEST_POLL_INTERVAL_MS = 60 * 1000;
const MRMS_RALA_FRESHNESS_LIMIT_MINUTES = 20;
const MRMS_RALA_DEFAULT_OPACITY = 0.85;
const MRMS_RALA_OPACITY_STORAGE_KEY = 'wpc-mrms-rala-opacity-v2';
const MRMS_RALA_TRANSPARENT_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
const mrmsRalaPlaceholderBounds = [[20.0, -130.0], [55.0, -60.0]];

const mrmsRalaLayer = L.imageOverlay(
    MRMS_RALA_TRANSPARENT_PLACEHOLDER,
    mrmsRalaPlaceholderBounds,
    {zIndex: 11, opacity: 0, interactive: false, className: 'mrms-rala-raster'}
);
const mrmsRalaBufferLayer = L.imageOverlay(
    MRMS_RALA_TRANSPARENT_PLACEHOLDER,
    mrmsRalaPlaceholderBounds,
    {zIndex: 11, opacity: 0, interactive: false, className: 'mrms-rala-raster'}
);

// Double-buffer the direct NOAA loop. The next full-resolution PNG is loaded
// into the hidden overlay first; only after its browser load event completes do
// we swap visibility. This mirrors the operational-viewer idea of changing the
// playback delay without dropping native data frames, and avoids asking the
// visible <img> element to download/decode a new 7000-pixel raster at the exact
// moment it must be painted.
let mrmsRalaVisibleLayer = mrmsRalaLayer;
let mrmsRalaHiddenLayer = mrmsRalaBufferLayer;

// The source raster is a native-resolution categorical display of reflectivity.
// Prevent the browser from adding another bilinear-looking smoothing pass when
// Leaflet scales the full-domain image during map zooms. This keeps the native
// ~1-km MRMS structure visually crisp without changing any dBZ values.
function applyMRMSRALABrowserRendering(layer = mrmsRalaVisibleLayer) {
    const image = layer?.getElement?.();
    if (!image) return;
    image.style.setProperty('image-rendering', 'pixelated', 'important');
}
[mrmsRalaLayer, mrmsRalaBufferLayer].forEach(layer => {
    layer.on('add load', () => applyMRMSRALABrowserRendering(layer));
});

// The primary overlay remains the dashboard registry anchor. The hidden buffer
// follows it on/off the map so the backup machinery cannot leak when MRMS is off.
mrmsRalaLayer.on('add', () => {
    if (!map.hasLayer(mrmsRalaBufferLayer)) mrmsRalaBufferLayer.addTo(map);
});
mrmsRalaLayer.on('remove', () => {
    if (map.hasLayer(mrmsRalaBufferLayer)) map.removeLayer(mrmsRalaBufferLayer);
});

let mrmsRalaMetadata = null;
let mrmsRalaReady = false;
let mrmsRalaFresh = false;
let mrmsRalaLastManifestVersion = '';
let mrmsRalaManifestCheckInFlight = false;
let mrmsRalaFrames = [];
let mrmsRalaCurrentFrame = null;
let mrmsRalaFrameRequestSerial = 0;
const mrmsRalaPreloadCache = new Map();
const mrmsRalaLayerLoadState = new Map();

function readMRMSRALAStoredOpacity() {
    try {
        const stored = Number(window.localStorage.getItem(MRMS_RALA_OPACITY_STORAGE_KEY));
        if (Number.isFinite(stored) && stored >= 0.10 && stored <= 1.0) return stored;
    } catch (error) {
        console.debug('MRMS RALA opacity preference is unavailable:', error);
    }
    return MRMS_RALA_DEFAULT_OPACITY;
}

function syncMRMSRALAOpacityWidgets(opacity) {
    const percent = String(Math.round(opacity * 100));
    const inlineSlider = document.getElementById('mrms-rala-opacity-inline');
    const inlineValue = document.getElementById('mrms-rala-opacity-inline-value');
    if (inlineSlider && inlineSlider.value !== percent) inlineSlider.value = percent;
    if (inlineValue) inlineValue.textContent = `${percent}%`;

    if (selectedDashboardLayerId === 'mrms-rala-direct') {
        const genericSlider = document.getElementById('layer-opacity');
        const genericValue = document.getElementById('opacity-value');
        if (genericSlider) genericSlider.value = percent;
        if (genericValue) genericValue.textContent = `${percent}%`;
    }
}

const mrmsRalaOpacityTarget = {
    options: {opacity: readMRMSRALAStoredOpacity()},
    setOpacity(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return this;
        const opacity = Math.min(1.0, Math.max(0.10, numeric));
        this.options.opacity = opacity;
        try {
            window.localStorage.setItem(MRMS_RALA_OPACITY_STORAGE_KEY, String(opacity));
        } catch (error) {
            console.debug('Unable to persist MRMS RALA opacity preference:', error);
        }
        const visibleOpacity = map.hasLayer(mrmsRalaLayer) && mrmsRalaReady && mrmsRalaFresh ? opacity : 0;
        mrmsRalaVisibleLayer.setOpacity(visibleOpacity);
        mrmsRalaHiddenLayer.setOpacity(0);
        syncMRMSRALAOpacityWidgets(opacity);
        return this;
    }
};

// MRMS RALA is the primary baseline radar. It remains transparent until the
// rolling NOAA manifest and latest frame pass freshness/validation checks.
mrmsRalaLayer.addTo(map);

// --- MRMS & SATELLITE QPE LAYERS ---
const mrmsOptions = { format: 'image/png', transparent: true, opacity: 0.65, attribution: "Data © IEM / NCEP" };
const mrms1hr = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/us/mrms_nn.cgi", { ...mrmsOptions, layers: 'mrms_p1h' });
const mrms24hr = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/us/mrms_nn.cgi", { ...mrmsOptions, layers: 'mrms_p24h' });
const mrms48hr = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/us/mrms_nn.cgi", { ...mrmsOptions, layers: 'mrms_p48h' });
const mrms72hr = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/us/mrms_nn.cgi", { ...mrmsOptions, layers: 'mrms_p72h' });

// --- OPERATIONAL MRMS FLASH ROLLING 24-HOUR MAXIMA ---
// These transparent PNGs are pre-warped to EPSG:3857. Their exact Leaflet
// bounds and valid windows are read from the synchronized metadata files.
const MRMS_CREST_24H_LAYER_NAME = 'MRMS FLASH CREST Unit Q — Rolling 24-Hour Maximum';
const MRMS_FFD_24H_LAYER_NAME = 'MRMS FLASH FFD — Rolling 24-Hour Maximum Category';
const MRMS_CREST_24H_IMAGE_URL = 'static/mrms_crest_unitq_max24h.png';
const MRMS_CREST_24H_METADATA_URL = 'static/mrms_crest_unitq_max24h_metadata.json';
const MRMS_FFD_24H_IMAGE_URL = 'static/mrms_ffd_max24h.png';
const MRMS_FFD_24H_METADATA_URL = 'static/mrms_ffd_max24h_metadata.json';
const mrmsFlashPlaceholderBounds = [[20.0, -130.0], [55.0, -60.0]];

const mrmsCrest24hLayer = L.imageOverlay(
    MRMS_CREST_24H_IMAGE_URL,
    mrmsFlashPlaceholderBounds,
    {zIndex: 12, opacity: 0, interactive: false}
);

const mrmsFfd24hLayer = L.imageOverlay(
    MRMS_FFD_24H_IMAGE_URL,
    mrmsFlashPlaceholderBounds,
    {zIndex: 12, opacity: 0, interactive: false}
);

let mrmsCrest24hReady = false;
let mrmsFfd24hReady = false;
let mrmsCrest24hMetadata = null;
let mrmsFfd24hMetadata = null;

// --- OPERATIONAL GOES GLM CONTROLLED MOSAIC ---
// The three primary products use an exclusive GOES-18/GOES-19 ownership
// mask. The optional debug layers expose each native satellite contribution
// and the ownership mask without changing the primary dashboard display.
const GLM_MOSAIC_5MIN_LAYER_NAME = 'GOES GLM Controlled Mosaic — Latest 5-Minute FED';
const GLM_MOSAIC_30MIN_LAYER_NAME = 'GOES GLM Controlled Mosaic — Rolling 30-Minute Accumulation';
const GLM_MOSAIC_60MIN_LAYER_NAME = 'GOES GLM Controlled Mosaic — Rolling 60-Minute Accumulation';
const GLM_TREND_MAP_15MIN_LAYER_NAME = 'GOES GLM Controlled Mosaic — Convective Trend (15 min)';
const GLM_TRANSPARENT_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
const glmPlaceholderBounds = [[20.0, -130.0], [55.0, -60.0]];

function createGLMImageOverlay(imageUrl, zIndex = 13) {
    return L.imageOverlay(imageUrl, glmPlaceholderBounds, {
        zIndex,
        opacity: 0,
        interactive: false
    });
}

const glmMosaic5minLayer = createGLMImageOverlay('static/glm_conus_mosaic_5min.png');
const glmMosaic30minLayer = createGLMImageOverlay('static/glm_conus_mosaic_30min.png');
const glmMosaic60minLayer = createGLMImageOverlay('static/glm_conus_mosaic_60min.png');
const glmTrendMap15minLayer = createGLMImageOverlay(GLM_TRANSPARENT_PLACEHOLDER);


const GLM_LAYER_CONFIGS = [
    {
        id: 'glm-mosaic-5min',
        name: GLM_MOSAIC_5MIN_LAYER_NAME,
        layer: glmMosaic5minLayer,
        imageUrl: 'static/glm_conus_mosaic_5min.png',
        metadataUrl: 'static/glm_conus_mosaic_5min_metadata.json',
        productRole: 'controlled_mosaic',
        windowMinutes: 5,
        legendId: 'five-minute',
        defaultOpacity: 1.0,
        debug: false
    },
    {
        id: 'glm-mosaic-30min',
        name: GLM_MOSAIC_30MIN_LAYER_NAME,
        layer: glmMosaic30minLayer,
        imageUrl: 'static/glm_conus_mosaic_30min.png',
        metadataUrl: 'static/glm_conus_mosaic_30min_metadata.json',
        productRole: 'controlled_mosaic',
        windowMinutes: 30,
        legendId: 'rolling',
        defaultOpacity: 1.0,
        debug: false
    },
    {
        id: 'glm-mosaic-60min',
        name: GLM_MOSAIC_60MIN_LAYER_NAME,
        layer: glmMosaic60minLayer,
        imageUrl: 'static/glm_conus_mosaic_60min.png',
        metadataUrl: 'static/glm_conus_mosaic_60min_metadata.json',
        productRole: 'controlled_mosaic',
        windowMinutes: 60,
        legendId: 'rolling',
        defaultOpacity: 1.0,
        debug: false
    },
    {
        id: 'glm-convective-trend-15min',
        name: GLM_TREND_MAP_15MIN_LAYER_NAME,
        layer: glmTrendMap15minLayer,
        imageUrl: GLM_TRANSPARENT_PLACEHOLDER,
        metadataUrl: 'static/glm_convective_trend_15min_metadata.json',
        productRole: 'convective_trend_map',
        windowMinutes: 15,
        legendId: 'trend-map',
        defaultOpacity: 0.96,
        debug: false,
        embeddedImageField: 'embedded_png_base64'
    }
];

const glmConfigByName = new Map(GLM_LAYER_CONFIGS.map(config => [config.name, config]));
const glmMetadataByName = new Map();
const glmReadyNames = new Set();
const GLM_MANIFEST_URL = 'static/glm_mosaic_manifest.json';
const GLM_MANIFEST_POLL_INTERVAL_MS = 90 * 1000;
const GLM_MANIFEST_RETRY_DELAYS_MS = [0, 3500, 9000];
let glmLastManifestVersion = '';
let glmManifestCheckInFlight = false;
const GLM_TREND_SESSION_KEY = 'wpc-glm-trend-domain-v1';
const GLM_TREND_STATE_PRESENTATION = {
    rapidly_increasing: {
        label: 'Rapidly Increasing', symbol: '▲', color: '#ff4848',
        background: 'rgba(255, 72, 72, 0.15)'
    },
    increasing: {
        label: 'Increasing', symbol: '↗', color: '#ffaa40',
        background: 'rgba(255, 170, 64, 0.14)'
    },
    steady: {
        label: 'Steady', symbol: '→', color: '#ffe878',
        background: 'rgba(255, 232, 120, 0.13)'
    },
    decreasing: {
        label: 'Decreasing', symbol: '↘', color: '#4ceaff',
        background: 'rgba(76, 234, 255, 0.13)'
    },
    rapidly_decreasing: {
        label: 'Rapidly Decreasing', symbol: '▼', color: '#3876ff',
        background: 'rgba(56, 118, 255, 0.14)'
    },
    low_activity: {
        label: 'Low Activity', symbol: '•', color: '#91a6b6',
        background: 'rgba(145, 166, 182, 0.10)'
    },
    insufficient_data: {
        label: 'Insufficient Data', symbol: '—', color: '#b0bec5',
        background: 'rgba(176, 190, 197, 0.10)'
    }
};


// --- CIMSS/SSEC LIGHTNINGCAST ---
// Authorized CIMSS/SSEC real-time CONUS LightningCast contours. The backend
// publishes a transparent EPSG:3857 raster using the standard 10/30/50/70/90%
// probability contours. LightningCast remains independent of the observed GLM
// layers so forecasters may compare prediction and observed lightning together.
const LIGHTNINGCAST_LAYER_NAME = 'CIMSS/SSEC LightningCast — Probability of Lightning in Next 60 Minutes';
const LIGHTNINGCAST_IMAGE_URL = 'static/lightningcast_conus_probability_60min.png';
const LIGHTNINGCAST_METADATA_URL = 'static/lightningcast_conus_probability_60min_metadata.json';
const LIGHTNINGCAST_MANIFEST_URL = 'static/lightningcast_manifest.json';
const LIGHTNINGCAST_MANIFEST_POLL_INTERVAL_MS = 90 * 1000;
const LIGHTNINGCAST_MANIFEST_RETRY_DELAYS_MS = [0, 3500, 9000];
const lightningCastPlaceholderBounds = [[20.0, -130.0], [55.0, -60.0]];
const lightningCastLayer = L.imageOverlay(
    LIGHTNINGCAST_IMAGE_URL,
    lightningCastPlaceholderBounds,
    {zIndex: 14, opacity: 0, interactive: false}
);

let lightningCastMetadata = null;
let lightningCastReady = false;
let lightningCastLastManifestVersion = '';
let lightningCastManifestCheckInFlight = false;


// --- HRRR-TLE FLASH FLOOD GUIDANCE — EXPERIMENTAL ---
// Frozen Version 3.3 science. The production backend publishes 18 transparent
// EPSG:3857 overlays plus synchronized metadata/manifest files.
const HRRR_TLE_SECTION_TITLE = 'HRRR-TLE Flash Flood Guidance - Experimental';
const HRRR_TLE_MANIFEST_URL = 'static/hrrr_tle_manifest.json';
const HRRR_TLE_METADATA_URL = 'static/hrrr_tle_metadata.json';
const HRRR_TLE_MANIFEST_POLL_INTERVAL_MS = 3 * 60 * 1000;
const HRRR_TLE_PLACEHOLDER_BOUNDS = [[23.0, -125.0], [50.5, -66.5]];

const HRRR_DIAGNOSTIC_LAYER_CONFIGS = [
    {id: 'hrrr-diag-max-ratio', key: 'hrrr_max_ratio',
     label: 'Max FFG Exceedance Ratio — Next 12 Hours',
     file: 'hrrr_latest_12h_max_ffg_ratio.png', legendType: 'ratio',
     keywords: 'latest deterministic HRRR maximum FFG exceedance QPF ratio next 12 hours'},
    {id: 'hrrr-diag-ffg-coverage', key: 'hrrr_ffg_coverage',
     label: 'FFG Exceedance Areal Coverage — Next 12 Hours',
     file: 'hrrr_latest_12h_ffg_exceedance_coverage.png', legendType: 'coverage',
     keywords: 'latest deterministic HRRR FFG exceedance areal coverage 40 km next 12 hours'}
];

const HRRR_DIAGNOSTIC_CONFIG_BY_NAME = new Map();
HRRR_DIAGNOSTIC_LAYER_CONFIGS.forEach(config => {
    config.url = `static/${config.file}`;
    config.layer = L.imageOverlay(
        config.url,
        HRRR_TLE_PLACEHOLDER_BOUNDS,
        {zIndex: 13, opacity: 0, interactive: false}
    );
    HRRR_DIAGNOSTIC_CONFIG_BY_NAME.set(config.label, config);
});

const HRRR_TLE_LAYER_CONFIGS = [
    // Core FFG Guidance
    {id: 'hrrr-tle-ffg-consensus', key: 'ffg_consensus', group: 'Core FFG Guidance',
     label: 'FFG Exceedance Consensus', file: 'hrrr_tle_ffg_consensus.png', legendType: 'frequency6',
     keywords: 'HRRR time lagged ensemble FFG exceedance member frequency consensus'},
    {id: 'hrrr-tle-median-ratio', key: 'median_ratio', group: 'Core FFG Guidance',
     label: 'Median Neighborhood-Max QPF / FFG Ratio', file: 'hrrr_tle_median_neighborhood_ratio.png', legendType: 'ratio',
     keywords: 'median neighborhood maximum QPF FFG ratio magnitude'},
    {id: 'hrrr-tle-ffg-1h', key: 'ffg_1h', group: 'Core FFG Guidance',
     label: '1-h FFG Exceedance', file: 'hrrr_tle_ffg_1h.png', legendType: 'frequency6',
     keywords: '1 hour FFG exceedance'},
    {id: 'hrrr-tle-ffg-3h', key: 'ffg_3h', group: 'Core FFG Guidance',
     label: '3-h FFG Exceedance', file: 'hrrr_tle_ffg_3h.png', legendType: 'frequency6',
     keywords: '3 hour FFG exceedance'},
    {id: 'hrrr-tle-ffg-6h', key: 'ffg_6h', group: 'Core FFG Guidance',
     label: '6-h FFG Exceedance', file: 'hrrr_tle_ffg_6h.png', legendType: 'frequency6',
     keywords: '6 hour FFG exceedance'},

    // Heavy Rain / Persistence
    {id: 'hrrr-tle-qpf1h-1in', key: 'qpf1h_1in', group: 'Heavy Rain / Persistence',
     label: '1-h QPF ≥ 1 in', file: 'hrrr_tle_qpf1h_1in.png', legendType: 'frequency6',
     keywords: 'one hour QPF 1 inch rainfall threshold'},
    {id: 'hrrr-tle-qpf1h-2in', key: 'qpf1h_2in', group: 'Heavy Rain / Persistence',
     label: '1-h QPF ≥ 2 in', file: 'hrrr_tle_qpf1h_2in.png', legendType: 'frequency6',
     keywords: 'one hour QPF 2 inch rainfall threshold'},
    {id: 'hrrr-tle-qpf1h-3in', key: 'qpf1h_3in', group: 'Heavy Rain / Persistence',
     label: '1-h QPF ≥ 3 in', file: 'hrrr_tle_qpf1h_3in.png', legendType: 'frequency6',
     keywords: 'one hour QPF 3 inch rainfall threshold'},
    {id: 'hrrr-tle-persist-1in', key: 'persistence_1in_2of3', group: 'Heavy Rain / Persistence',
     label: '≥1 in in 2 of 3 Hours', file: 'hrrr_tle_persistence_1in_2of3.png', legendType: 'frequency6',
     keywords: 'persistence repeated one inch two of three hours'},
    {id: 'hrrr-tle-persist-3h-2in', key: 'persistence_3h_2in', group: 'Heavy Rain / Persistence',
     label: 'Rolling 3-h QPF ≥ 2 in', file: 'hrrr_tle_persistence_3h_2in.png', legendType: 'frequency6',
     keywords: 'rolling three hour QPF 2 inch'},
    {id: 'hrrr-tle-persist-3h-3in', key: 'persistence_3h_3in', group: 'Heavy Rain / Persistence',
     label: 'Rolling 3-h QPF ≥ 3 in', file: 'hrrr_tle_persistence_3h_3in.png', legendType: 'frequency6',
     keywords: 'rolling three hour QPF 3 inch'},

    // Timing / Evolution
    {id: 'hrrr-tle-evol-00-03', key: 'evolution_00_03', group: 'Timing / Evolution',
     label: 'FFG Exceedance +00–03 h', file: 'hrrr_tle_evolution_00_03.png', legendType: 'frequency6Min2',
     evolutionHours: [0, 3], keywords: 'timing evolution first 3 hours'},
    {id: 'hrrr-tle-evol-03-06', key: 'evolution_03_06', group: 'Timing / Evolution',
     label: 'FFG Exceedance +03–06 h', file: 'hrrr_tle_evolution_03_06.png', legendType: 'frequency6Min2',
     evolutionHours: [3, 6], keywords: 'timing evolution 3 to 6 hours'},
    {id: 'hrrr-tle-evol-06-09', key: 'evolution_06_09', group: 'Timing / Evolution',
     label: 'FFG Exceedance +06–09 h', file: 'hrrr_tle_evolution_06_09.png', legendType: 'frequency6Min2',
     evolutionHours: [6, 9], keywords: 'timing evolution 6 to 9 hours'},
    {id: 'hrrr-tle-evol-09-12', key: 'evolution_09_12', group: 'Timing / Evolution',
     label: 'FFG Exceedance +09–12 h', file: 'hrrr_tle_evolution_09_12.png', legendType: 'frequency6Min2',
     evolutionHours: [9, 12], keywords: 'timing evolution 9 to 12 hours'},
    {id: 'hrrr-tle-prior3', key: 'prior3', group: 'Timing / Evolution',
     label: 'Prior 3 HRRR Cycles', file: 'hrrr_tle_prior3_consensus.png', legendType: 'frequency3',
     keywords: 'prior three cycles older runs consensus'},
    {id: 'hrrr-tle-latest3', key: 'latest3', group: 'Timing / Evolution',
     label: 'Latest 3 HRRR Cycles', file: 'hrrr_tle_latest3_consensus.png', legendType: 'frequency3',
     keywords: 'latest three cycles newest runs consensus'},
    {id: 'hrrr-tle-run-change', key: 'run_change', group: 'Timing / Evolution',
     label: 'Run-to-Run Signal Change', file: 'hrrr_tle_run_change.png', legendType: 'runChange',
     keywords: 'fading persistent emerging run to run signal trend'}
];

const HRRR_TLE_CONFIG_BY_NAME = new Map();
const HRRR_TLE_CONFIG_BY_KEY = new Map();
HRRR_TLE_LAYER_CONFIGS.forEach(config => {
    config.url = `static/${config.file}`;
    config.layer = L.imageOverlay(
        config.url,
        HRRR_TLE_PLACEHOLDER_BOUNDS,
        {zIndex: 13, opacity: 0, interactive: false}
    );
    HRRR_TLE_CONFIG_BY_NAME.set(config.label, config);
    HRRR_TLE_CONFIG_BY_KEY.set(config.key, config);
});

const HRRR_ALL_LAYER_CONFIGS = [
    ...HRRR_DIAGNOSTIC_LAYER_CONFIGS,
    ...HRRR_TLE_LAYER_CONFIGS
];

let hrrrTLEMetadata = null;
let hrrrTLEReady = false;
let hrrrTLELastManifestVersion = '';
let hrrrTLEManifestCheckInFlight = false;

const satOptions = { format: 'image/png', transparent: true, opacity: 0.6 };
const goesEastVis = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/goes_east.cgi", { ...satOptions, layers: 'conus_ch02' });
const goesEastWV = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/goes_east.cgi", { ...satOptions, layers: 'conus_ch09' });
const goesEastIR = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/goes_east.cgi", { ...satOptions, layers: 'conus_ch13' });
const goesWestVis = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/goes_west.cgi", { ...satOptions, layers: 'conus_ch02' });
const goesWestWV = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/goes_west.cgi", { ...satOptions, layers: 'conus_ch09' });
const goesWestIR = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/goes_west.cgi", { ...satOptions, layers: 'conus_ch13' });

// --- AUTO-REFRESH WMS LAYERS ---
function refreshWMSLayers() {
    const wmsLayersToUpdate = [radarWMS, mrms1hr, mrms24hr, mrms48hr, mrms72hr, goesEastVis, goesEastWV, goesEastIR, goesWestVis, goesWestWV, goesWestIR];
    wmsLayersToUpdate.forEach(layer => {
        layer.setParams({_t: new Date().getTime()}, false); 
    });
}
setInterval(refreshWMSLayers, 5 * 60 * 1000); 

// --- NWS ACTIVE HYDRO WARNINGS & WATCHES ---
function getAlertColor(event) {
    if (!event) return "gray";
    if (event === "Flash Flood Warning") return "red";
    if (event === "Flood Warning") return "green";
    if (event === "Flood Advisory") return "lightgreen";
    if (event === "Flood Watch" || event === "Flash Flood Watch") return "seagreen"; 
    return "gray"; 
}

window.loadNWSAlertText = async function(event, url, containerId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "<em>Loading official text...</em>";
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("API not responding");
        const data = await response.json();
        const desc = data.properties.description ? data.properties.description.replace(/\n/g, '<br>') : "No text description provided by WFO.";
        const inst = data.properties.instruction ? "<br><br><strong>Instructions:</strong><br>" + data.properties.instruction.replace(/\n/g, '<br>') : "";
        container.innerHTML = `<div style="text-align: left; margin-top: 10px; padding: 10px; background: #ffffff; border: 1px solid #ccc; border-radius: 4px; max-height: 250px; overflow-y: auto; font-family: monospace; font-size: 11px; color: #333; z-index: 9999;">${desc}${inst}</div>`;
    } catch (error) {
        container.innerHTML = "<span style='color: red;'>Failed to load alert text from NWS API.</span>";
    }
};

const commonAlertOptions = (paneName) => ({
    pane: paneName,
    style: function (feature) {
        return { color: getAlertColor(feature.properties.prod_type), weight: 2, opacity: 1, fillOpacity: 0.2 };
    },
    onEachFeature: function (feature, layer) {
        const props = feature.properties;
        if (!props) return;
        const eventName = props.prod_type || "Unknown Hydro Alert";
        const wfo = props.wfo ? `WFO ${props.wfo}` : "NWS";
        const expires = props.expiration || "Unknown";
        
        const alertId = "alert-" + Math.random().toString(36).substr(2, 9);
        const linkHTML = props.url ? `<br><div id="${alertId}" style="margin-top: 10px;"><button onclick="loadNWSAlertText(event, '${props.url}', '${alertId}')" style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">Load Official Alert Text</button></div>` : "";

        layer.bindPopup(`
            <div style="font-family: sans-serif; text-align: center; min-width: 260px; background: white;">
                <strong style="color: ${getAlertColor(eventName)}; font-size: 1.1em;">${eventName}</strong><br>
                <em>Issued by ${wfo}</em><br>
                <hr style="margin: 5px 0;">
                <span style="font-size: 0.9em;">Expires: ${expires}</span>
                ${linkHTML}
            </div>
        `, { maxWidth: 400 });
    }
});

const floodAdvisoryLayer = L.geoJSON(
    null,
    commonAlertOptions('warnings')
);
const floodWarningLayer = L.geoJSON(
    null,
    commonAlertOptions('floodWarnings')
);
const flashFloodWarningLayer = L.geoJSON(
    null,
    commonAlertOptions('flashFloodWarnings')
);

// Preserve the existing single sidebar toggle for all warnings/advisories while
// placing each product type in its own click-priority pane.
const warningsLayer = L.layerGroup([
    floodAdvisoryLayer,
    floodWarningLayer,
    flashFloodWarningLayer
]);
const watchesLayer = L.geoJSON(null, commonAlertOptions('watches'));

warningsLayer.addTo(map);
watchesLayer.addTo(map);

let nwsAlertRefreshInFlight = false;

async function fetchNWSAlerts() {
    // Treat each refresh transactionally. NOAA's ArcGIS service can
    // occasionally return a syntactically valid HTTP-200 response whose
    // feature payload is empty or incomplete. Never clear the last known-good
    // polygons until a companion count query confirms the replacement set.
    if (nwsAlertRefreshInFlight) return;
    nwsAlertRefreshInFlight = true;

    try {
        const whereClause = "prod_type IN ('Flash Flood Warning', 'Flood Warning', 'Flood Advisory', 'Flood Watch', 'Flash Flood Watch')";
        const baseUrl = 'https://mapservices.weather.noaa.gov/eventdriven/rest/services/WWA/watch_warn_adv/MapServer/1/query';
        const refreshToken = new Date().getTime();
        const featureUrl = `${baseUrl}?where=${encodeURIComponent(whereClause)}&outFields=prod_type,wfo,expiration,url&f=geojson&t=${refreshToken}`;
        const countUrl = `${baseUrl}?where=${encodeURIComponent(whereClause)}&returnCountOnly=true&f=json&t=${refreshToken}`;

        const [featureResponse, countResponse] = await Promise.all([
            fetch(featureUrl, {cache: 'no-store'}),
            fetch(countUrl, {cache: 'no-store'})
        ]);

        if (!featureResponse.ok) {
            throw new Error(`Feature query HTTP ${featureResponse.status}`);
        }
        if (!countResponse.ok) {
            throw new Error(`Count query HTTP ${countResponse.status}`);
        }

        const [data, countData] = await Promise.all([
            featureResponse.json(),
            countResponse.json()
        ]);

        if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
            throw new Error('NOAA hydro-alert query did not return a valid FeatureCollection');
        }
        if (data.exceededTransferLimit === true) {
            throw new Error('NOAA hydro-alert query exceeded the service transfer limit');
        }

        const expectedCount = Number(countData?.count);
        if (!Number.isInteger(expectedCount) || expectedCount < 0) {
            throw new Error('NOAA hydro-alert count query returned an invalid count');
        }

        const validFeatures = data.features.filter(
            feature => feature &&
                feature.properties &&
                feature.properties.prod_type &&
                feature.geometry
        );

        // A mismatch is treated as a transient/partial upstream response.
        // Retain the existing polygons and try again at the next refresh
        // rather than flashing every active WFO product off the map.
        if (validFeatures.length !== expectedCount) {
            throw new Error(
                `NOAA hydro-alert response incomplete: received ${validFeatures.length} of ${expectedCount} expected features`
            );
        }

        const flashFloodFeatures = validFeatures.filter(
            feature => feature.properties.prod_type === 'Flash Flood Warning'
        );
        const floodWarningFeatures = validFeatures.filter(
            feature => feature.properties.prod_type === 'Flood Warning'
        );
        const floodAdvisoryFeatures = validFeatures.filter(
            feature => feature.properties.prod_type === 'Flood Advisory'
        );
        const watchFeatures = validFeatures.filter(
            feature => feature.properties.prod_type === 'Flood Watch' ||
                feature.properties.prod_type === 'Flash Flood Watch'
        );

        // Commit the replacement only after both NOAA responses agree.
        flashFloodWarningLayer.clearLayers();
        floodWarningLayer.clearLayers();
        floodAdvisoryLayer.clearLayers();
        watchesLayer.clearLayers();

        if (floodAdvisoryFeatures.length > 0) {
            floodAdvisoryLayer.addData(floodAdvisoryFeatures);
        }
        if (floodWarningFeatures.length > 0) {
            floodWarningLayer.addData(floodWarningFeatures);
        }
        if (flashFloodFeatures.length > 0) {
            flashFloodWarningLayer.addData(flashFloodFeatures);
        }
        if (watchFeatures.length > 0) {
            watchesLayer.addData(watchFeatures);
        }
    } catch (error) {
        console.error(
            "Error refreshing NWS hydro alerts; retaining last known-good polygons:",
            error
        );
    } finally {
        nwsAlertRefreshInFlight = false;
    }
}
fetchNWSAlerts();
setInterval(fetchNWSAlerts, 5 * 60 * 1000); 

// --- BULLETPROOF MRMS DVD FLASH FLOOD DETECTOR (FFD) ---
const ffdLayer = L.layerGroup();

async function fetchFFDData() {
    try {
        const targetUrl = `static/ffd_contours.txt?t=${new Date().getTime()}`;
        const response = await fetch(targetUrl);
        if (!response.ok) throw new Error("Could not fetch local FFD placefile.");
        
        const lastModified = response.headers.get('Last-Modified');
        let latestFFDTime = lastModified ? formatUTC(new Date(lastModified)) : formatUTC(new Date()); 
        
        const text = await response.text();
        ffdLayer.clearLayers(); 
        
        const lines = text.split('\n');
        let currentColor = '#00ff00'; 
        let colorInferredImpact = 'Monitor';
        let currentTooltipHTML = '<strong>Monitor</strong>';
        let isDrawing = false;
        let currentCoords = [];
        
        lines.forEach(line => {
            const cleanLine = line.trim();
            
            if (cleanLine.match(/^Color:\s*(\d+)\s+(\d+)\s+(\d+)/i)) {
                const colorMatch = cleanLine.match(/^Color:\s*(\d+)\s+(\d+)\s+(\d+)/i);
                const r = parseInt(colorMatch[1]);
                const g = parseInt(colorMatch[2]);
                const b = parseInt(colorMatch[3]);
                currentColor = `rgb(${r}, ${g}, ${b})`;
                
                if (r === 0 && g >= 200 && b === 0) colorInferredImpact = "Monitor";
                else if (r === 255 && g === 255 && b === 0) colorInferredImpact = "Advisory";
                else if (r === 255 && (g > 100 && g < 200) && b === 0) colorInferredImpact = "Base FFW";
                else if (r === 255 && g === 0 && b === 0) colorInferredImpact = "Considerable FFW";
                else if (r === 255 && g === 0 && b === 255) colorInferredImpact = "Catastrophic FFW";
                else colorInferredImpact = "Flash Flood Detector";
                return; 
            }
            
            if (cleanLine.match(/^(Line:|Polygon:)/i)) {
                isDrawing = true;
                currentCoords = [];
                const titleMatch = cleanLine.match(/"([^"]+)"/);
                if (titleMatch) {
                    let rawLabel = titleMatch[1];
                    rawLabel = rawLabel.replace(/\\[nN]/g, ' ').replace(/\/[nN]/g, ' ').replace(/boundary/i, '').replace(/\s+/g, ' ').trim();
                    const parts = rawLabel.split(' ');
                    if (parts.length > 0) {
                        let impactTag = parts.length > 1 ? parts.slice(1).join(' ') : colorInferredImpact;
                        if (impactTag.length > 0) impactTag = impactTag.charAt(0).toUpperCase() + impactTag.slice(1);
                        currentTooltipHTML = `<strong>${impactTag}</strong>`;
                    } else {
                        currentTooltipHTML = `<strong>${rawLabel}</strong>`;
                    }
                } else {
                    currentTooltipHTML = `<strong>${colorInferredImpact}</strong>`;
                }
                return;
            }
            
            if (cleanLine.match(/^End:/i) && isDrawing) {
                isDrawing = false;
                if (currentCoords.length > 2) {
                    const polygon = L.polygon(currentCoords, {
                        color: currentColor, weight: 2, fillColor: currentColor, fillOpacity: 0.35, pane: 'ffd'
                    });
                    polygon.bindTooltip(`<div style="text-align: center; line-height: 1.4; font-family: sans-serif;">${currentTooltipHTML}</div>`, { sticky: true, direction: 'top', className: 'ffd-tooltip' });
                    ffdLayer.addLayer(polygon);
                }
                return;
            }
            
            if (isDrawing) {
                const locMatch = cleanLine.match(/^([-+]?\d{1,2}\.\d+)\s*,\s*([-+]?\d{1,3}\.\d+)/);
                if (locMatch) {
                    currentCoords.push([parseFloat(locMatch[1]), parseFloat(locMatch[2])]);
                }
            }
        });

        const ffdTimeBox = document.getElementById('ffd-time-box');
        if (ffdTimeBox) {
            ffdTimeBox.innerHTML = `
                <strong>Flash Flood Detector</strong><br>
                <span style="color: #4fc3f7; font-weight: bold; font-size: 1.05em;">Latest Run: ${latestFFDTime}</span>
            `;
            if (activeLayerNames.has('MRMS DVD Flash Flood Detector')) {
                ffdTimeBox.style.display = 'block';
            }
        }
    } catch (error) { console.log("Waiting for FFD Contours..."); }
}
fetchFFDData();
setInterval(fetchFFDData, 10 * 60 * 1000); 

// --- LIVE WPC GEOJSON (Day 1 ERO & MPDs) ---
function getEroStyle(feature) {
    const cat = (feature.properties.OUTLOOK || feature.properties.outlook || feature.properties.Outlook || "").toUpperCase();
    let riskColor = "#00ff00"; 
    if (cat.includes("SLGT") || cat.includes("SLIGHT")) riskColor = "#FFFF00"; 
    if (cat.includes("MDT") || cat.includes("MODERATE"))  riskColor = "#FF0000"; 
    if (cat.includes("HIGH")) riskColor = "#FF00FF"; 
    return { color: riskColor, weight: 2, fillOpacity: 0.15 };
}

function getMpdStyle(feature) {
    const propStr = JSON.stringify(feature.properties).toUpperCase();
    let lineColor = "#ff00ff"; 
    if (propStr.includes("POSSIBLE")) lineColor = "#0000FF"; 
    if (propStr.includes("LIKELY")) lineColor = "#C77DFF";   
    return { color: lineColor, weight: 3, dashArray: "5, 5", fillOpacity: 0.1 };
}

function formatMpdValidTime(properties) {
    const start = properties && properties.valid_start_utc
        ? new Date(properties.valid_start_utc)
        : null;
    const end = properties && properties.valid_end_utc
        ? new Date(properties.valid_end_utc)
        : null;

    const formatOfficialTime = date => {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const month = date.toLocaleString('en-US', {
            month: 'short',
            timeZone: 'UTC'
        });
        const day = String(date.getUTCDate()).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${hours}${minutes}Z ${month} ${day} ${year}`;
    };

    const formattedStart = formatOfficialTime(start);
    const formattedEnd = formatOfficialTime(end);
    if (formattedStart && formattedEnd) {
        return `${formattedStart} - ${formattedEnd}`;
    }

    return properties && properties.valid_time
        ? properties.valid_time
        : 'Unknown';
}

const eroLayer = L.geoJSON(null, {
    pane: 'ero',
    style: getEroStyle,
    onEachFeature: function (feature, layer) {
        const cat = feature.properties.OUTLOOK || feature.properties.outlook || feature.properties.Outlook || "Unknown";
        layer.bindPopup(`
            <div style="text-align: center; font-family: sans-serif; background: white;">
                <strong>WPC Day 1 ERO</strong><br>Category: ${cat}<br><br>
                <a href="https://www.wpc.ncep.noaa.gov/discussions/qpferd.html" target="_blank" rel="noopener noreferrer">Read ERO Discussion</a>
            </div>
        `);
    }
});

const mpdLayer = L.geoJSON(null, {
    pane: 'mpd',
    style: getMpdStyle,
    onEachFeature: function (feature, layer) {
        const props = feature.properties;
        if (props && props.dataType === "MPD") {
            const mpdNum = props.mpd_number || "Unknown";
            const mpdTag = props.mpd_tag || "See WPC for details";
            const validTime = formatMpdValidTime(props);
            const currentYear = new Date().getUTCFullYear();
            
            const tooltipHTML = `<div style="text-align: center; font-family: sans-serif; line-height: 1.4;"><strong>MPD ${mpdNum}</strong><br>${mpdTag}<br>Valid: ${validTime}</div>`;
            layer.bindTooltip(tooltipHTML, { sticky: true, direction: "top" });
            
            const popupHTML = `
                <div style="font-family: sans-serif; font-size: 14px; min-width: 240px; text-align: center; background: white;">
                    <strong>MPD ${mpdNum}</strong><br>
                    <span style="color: #d84b2a;"><strong>${mpdTag}</strong></span><br>
                    <hr style="margin: 5px 0;">
                    <span style="font-size: 0.9em;">Valid: ${validTime}</span><br><br>
                    <a href="https://www.wpc.ncep.noaa.gov/metwatch/metwatch_mpd_multi.php?md=${mpdNum}&yr=${currentYear}" target="_blank" rel="noopener noreferrer">Read MPD Discussion</a>
                </div>
            `;
            layer.bindPopup(popupHTML);
        }
    }
});

eroLayer.addTo(map);
mpdLayer.addTo(map);

async function fetchWPCData() {
    try {
        const url = 'wpc_data.geojson?t=' + new Date().getTime();
        const response = await fetch(url);
        if (!response.ok) return;
        const data = await response.json();
        
        let eroFeatures = data.features.filter(f => f.properties.dataType === 'ERO');
        const mpdFeatures = data.features.filter(f => f.properties.dataType === 'MPD');
        
        eroFeatures.sort((a, b) => {
            const getRank = (feature) => {
                const cat = (feature.properties.OUTLOOK || feature.properties.outlook || feature.properties.Outlook || "").toUpperCase();
                if (cat.includes("HIGH")) return 4;
                if (cat.includes("MDT") || cat.includes("MODERATE")) return 3;
                if (cat.includes("SLGT") || cat.includes("SLIGHT")) return 2;
                return 1; 
            };
            return getRank(a) - getRank(b); 
        });
        
        eroLayer.clearLayers();
        mpdLayer.clearLayers();
        
        if (eroFeatures.length > 0) eroLayer.addData(eroFeatures);
        if (mpdFeatures.length > 0) mpdLayer.addData(mpdFeatures);
    } catch (error) { console.error("Error fetching WPC GeoJSON:", error); }
}

fetchWPCData();
setInterval(fetchWPCData, 5 * 60 * 1000); 

// --- RAP MESOANALYSIS LAYERS ---
const rapBounds = [[16.281, -139.856], [55.481, -57.373]]; 

// Base Fields
const pwatLayer = L.imageOverlay('static/rap_pwat.png', rapBounds, {zIndex: 10});
const sbcapeLayer = L.imageOverlay('static/rap_sbcape.png', rapBounds, {zIndex: 10});
const mlcapeLayer = L.imageOverlay('static/rap_mlcape.png', rapBounds, {zIndex: 10});
const mucapeLayer = L.imageOverlay('static/rap_mucape.png', rapBounds, {zIndex: 10});
const trans850Layer = L.imageOverlay('static/rap_trans850.png', rapBounds, {zIndex: 10});

// 3-Hour Change Fields
const pwatDiffLayer = L.imageOverlay('static/rap_pwat_diff.png', rapBounds, {zIndex: 10});
const sbcapeDiffLayer = L.imageOverlay('static/rap_sbcape_diff.png', rapBounds, {zIndex: 10});
const mlcapeDiffLayer = L.imageOverlay('static/rap_mlcape_diff.png', rapBounds, {zIndex: 10});
const mucapeDiffLayer = L.imageOverlay('static/rap_mucape_diff.png', rapBounds, {zIndex: 10});
const trans850DiffLayer = L.imageOverlay('static/rap_trans850_diff.png', rapBounds, {zIndex: 10});

// +3 Hour Forecast Fields
const pwatF03Layer = L.imageOverlay('static/rap_pwat_f03.png', rapBounds, {zIndex: 10});
const sbcapeF03Layer = L.imageOverlay('static/rap_sbcape_f03.png', rapBounds, {zIndex: 10});
const mlcapeF03Layer = L.imageOverlay('static/rap_mlcape_f03.png', rapBounds, {zIndex: 10});
const mucapeF03Layer = L.imageOverlay('static/rap_mucape_f03.png', rapBounds, {zIndex: 10});
const trans850F03Layer = L.imageOverlay('static/rap_trans850_f03.png', rapBounds, {zIndex: 10});

// Remaining Fields
const lrsfc3Layer = L.imageOverlay('static/rap_lr_sfc3.png', rapBounds, {zIndex: 10});
const lr75Layer = L.imageOverlay('static/rap_lr_75.png', rapBounds, {zIndex: 10});
const scpLayer = L.imageOverlay('static/rap_scp.png', rapBounds, {zIndex: 10});
const mfcLayer = L.imageOverlay('static/rap_mfc.png', rapBounds, {zIndex: 10});
const f925Layer = L.imageOverlay('static/rap_f925_850.png', rapBounds, {zIndex: 10});
const f850Layer = L.imageOverlay('static/rap_f850_700.png', rapBounds, {zIndex: 10});
const effShearLayer = L.imageOverlay('static/rap_eff_shear.png', rapBounds, {zIndex: 10});
const corfidiUpLayer = L.imageOverlay('static/rap_corfidi_up.png', rapBounds, {zIndex: 10});
const corfidiDownLayer = L.imageOverlay('static/rap_corfidi_down.png', rapBounds, {zIndex: 10});
const trans700Layer = L.imageOverlay('static/rap_trans700.png', rapBounds, {zIndex: 10});
const meanWindLayer = L.imageOverlay('static/rap_mean_wind.png', rapBounds, {zIndex: 10});
const vort500Layer = L.imageOverlay('static/rap_vort500.png', rapBounds, {zIndex: 10});
const diffAdvLayer = L.imageOverlay('static/rap_diff_adv.png', rapBounds, {zIndex: 10});
const div250Layer = L.imageOverlay('static/rap_div250.png', rapBounds, {zIndex: 10});

const allRapLayers = [
    pwatLayer, sbcapeLayer, mlcapeLayer, mucapeLayer, trans850Layer,
    pwatDiffLayer, sbcapeDiffLayer, mlcapeDiffLayer, mucapeDiffLayer, trans850DiffLayer,
    pwatF03Layer, sbcapeF03Layer, mlcapeF03Layer, mucapeF03Layer, trans850F03Layer,
    lrsfc3Layer, lr75Layer, scpLayer, mfcLayer, f925Layer, f850Layer, effShearLayer,
    corfidiUpLayer, corfidiDownLayer, trans700Layer, meanWindLayer, vort500Layer, diffAdvLayer, div250Layer
];

// --- NEW CAM NOWCAST ENSEMBLE LAYERS ---
const camLayers = {};
const camTempBounds = [[20, -130], [50, -60]]; 

['3h_to_9h', '9h_to_15h'].forEach(w => {
    ['href', 'refs', 'super'].forEach(m => {
        camLayers[`ffg_${w}_${m}`] = L.imageOverlay(`static/cam_ffg_${w}_${m}.png`, camTempBounds, {zIndex: 11});
        ['0.5_inch', '1_inch', '2_inch', '3_inch'].forEach(q => {
            camLayers[`qpf_${w}_${q}_${m}`] = L.imageOverlay(`static/cam_qpf_${w}_${q}_${m}.png`, camTempBounds, {zIndex: 11});
        });
    });
});

// --- NEW DAY 1 ERO CAM LAYERS ---
const eroCamLayers = {};
['href', 'refs', 'super'].forEach(m => {
    eroCamLayers[`ffg_${m}`] = L.imageOverlay(`static/ero_ffg_${m}.png`, camTempBounds, {zIndex: 11});
    ['0.5_inch', '1_inch', '2_inch', '3_inch'].forEach(q => {
        eroCamLayers[`qpf_${q}_${m}`] = L.imageOverlay(`static/ero_qpf_${q}_${m}.png`, camTempBounds, {zIndex: 11});
    });
});

// --- SOIL LAYERS (NWM & SPoRT) ---
// Leaflet's default map CRS is EPSG:3857. The Python scripts therefore
// pre-warp both PNGs to EPSG:3857 and publish WGS84 corner bounds in JSON.
//
// Start these overlays invisible. They are made visible only after valid
// metadata has been loaded, which prevents a stale or hard-coded rectangle
// from appearing before the exact bounds are known.
const NWM_IMAGE_URL = 'static/nwm_soil_saturation.png';
const SPORT_IMAGE_URL = 'static/sport_soil_percentile.png';
const NRCS_HSG_IMAGE_URL = 'static/nrcs_hydrologic_soil_group.png';
const NRCS_HSG_METADATA_URL = 'static/nrcs_hydrologic_soil_group_metadata.json';
const NRCS_HSG_LAYER_NAME = 'NRCS Hydrologic Soil Group (A–D / Dual)';
const NLCD_IMPERVIOUS_IMAGE_URL = 'static/usgs_nlcd_fractional_impervious_2025.png';
const NLCD_IMPERVIOUS_METADATA_URL = 'static/usgs_nlcd_fractional_impervious_2025_metadata.json';
const NLCD_IMPERVIOUS_LAYER_NAME = 'USGS Annual NLCD Fractional Impervious Surface (%)';
const NLDAS3_SOIL_IMAGE_URL = 'static/nldas3_soil_texture.png';
const NLDAS3_LANDCOVER_IMAGE_URL = 'static/nldas3_landcover.png';
const NLDAS3_STATIC_METADATA_URL = 'static/nldas3_static_metadata.json';
const NLDAS3_SOIL_LAYER_NAME = 'NASA NLDAS-3 Soil Texture (Static)';
const NLDAS3_LANDCOVER_LAYER_NAME = 'NASA NLDAS-3 Land Use / Vegetation (Static)';
const NLDAS3_SLOPE_IMAGE_URL = 'static/nldas3_slope_percent.png';
const NLDAS3_SLOPE_METADATA_URL = 'static/nldas3_slope_metadata.json';
const NLDAS3_SLOPE_LAYER_NAME = 'NASA NLDAS-3 / MERIT Terrain Slope (Static)';
const soilPlaceholderBounds = [[24.0, -125.0], [50.0, -66.0]];

const nwmLayer = L.imageOverlay(
    NWM_IMAGE_URL,
    soilPlaceholderBounds,
    {zIndex: 10, opacity: 0, interactive: false}
);

const sportLayer = L.imageOverlay(
    SPORT_IMAGE_URL,
    soilPlaceholderBounds,
    {zIndex: 10, opacity: 0, interactive: false}
);


const nrcsHsgLayer = L.imageOverlay(
    NRCS_HSG_IMAGE_URL,
    soilPlaceholderBounds,
    {
        zIndex: 10,
        opacity: 0,
        interactive: false,
        className: 'nrcs-hsg-raster'
    }
);

const nlcdImperviousLayer = L.imageOverlay(
    NLCD_IMPERVIOUS_IMAGE_URL,
    soilPlaceholderBounds,
    {
        zIndex: 10,
        opacity: 0,
        interactive: false,
        className: 'nlcd-impervious-raster'
    }
);

const nldas3SoilLayer = L.imageOverlay(
    NLDAS3_SOIL_IMAGE_URL,
    soilPlaceholderBounds,
    {
        zIndex: 10,
        opacity: 0,
        interactive: false,
        className: 'nldas3-soil-texture-raster'
    }
);

const nldas3LandcoverLayer = L.imageOverlay(
    NLDAS3_LANDCOVER_IMAGE_URL,
    soilPlaceholderBounds,
    {
        zIndex: 10,
        opacity: 0,
        interactive: false,
        className: 'nldas3-landcover-raster'
    }
);

const nldas3SlopeLayer = L.imageOverlay(
    NLDAS3_SLOPE_IMAGE_URL,
    soilPlaceholderBounds,
    {
        zIndex: 10,
        opacity: 0,
        interactive: false,
        className: 'nldas3-slope-raster'
    }
);

// --- NASA NLDAS-3 STATIC LAND-SURFACE CONTEXT ---
// Categorical display derivatives of the public ~1-km static parameter grid.
// They are hydrologic context only: not soil moisture, infiltration rate,
// runoff, or FFG. Never use these browser PNGs as scientific-model inputs.

// --- NIFC/WFIGS WILDFIRE / BURN-SCAR CONTEXT ---
// WFIGS supplies mapped wildfire perimeter extent. These polygons do NOT
// represent soil-burn severity; BAER/MTBS remain separate future context.
// The browser consumes only our validated wfigs-data branch, never the live
// ArcGIS service directly. Current is a compact national snapshot; the much
// larger YTD/history archives use lightweight national overviews at CONUS scale and viewport chunks when zoomed in.
const WFIGS_CURRENT_YEAR = new Date().getUTCFullYear();
const WFIGS_CURRENT_LAYER_NAME = 'NIFC/WFIGS Current Wildfire Perimeters';
const WFIGS_YTD_LAYER_NAME = `NIFC/WFIGS ${WFIGS_CURRENT_YEAR} YTD Wildfire Perimeters`;
const WFIGS_HISTORY_LAYER_NAME = 'NIFC/WFIGS Historical Wildfire Perimeters';
const WFIGS_DATA_ROOT = 'https://raw.githubusercontent.com/andreworrison-cloud/wpc-hydro-dashboard/wfigs-data/static/wfigs';
const WFIGS_CURRENT_MANIFEST_URL = `${WFIGS_DATA_ROOT}/current/manifest.json`;
const WFIGS_YTD_MANIFEST_URL = `${WFIGS_DATA_ROOT}/ytd/manifest.json`;
const WFIGS_HISTORY_ROOT = `${WFIGS_DATA_ROOT}/history`;
const WFIGS_HISTORY_INDEX_URL = `${WFIGS_HISTORY_ROOT}/manifest.json`;
const WFIGS_YTD_ACTIVITY_URL = `${WFIGS_DATA_ROOT}/ytd/seasonal_activity.json`;
const WFIGS_HISTORY_ACTIVITY_URL = `${WFIGS_HISTORY_ROOT}/seasonal_activity.json`;
const WFIGS_CURRENT_MANIFEST_POLL_INTERVAL_MS = 2 * 60 * 1000;
const WFIGS_YTD_MANIFEST_POLL_INTERVAL_MS = 15 * 60 * 1000;
const WFIGS_HISTORY_MANIFEST_POLL_INTERVAL_MS = 60 * 60 * 1000;
const WFIGS_CURRENT_SOURCE_EDIT_CAUTION_MINUTES = 45;
const WFIGS_ARCHIVE_OVERVIEW_MIN_ZOOM = 4;
const WFIGS_ARCHIVE_CHUNK_MIN_ZOOM = 6;
const WFIGS_YTD_CHUNK_CACHE_LIMIT = 36;
const WFIGS_HISTORY_CHUNK_CACHE_LIMIT_PER_YEAR = 36;
const WFIGS_HISTORY_ROLLING_YEARS = 5;
// Bright, fixed recency colors for the five completed years. The newest completed
// year receives the first color; the palette automatically rolls forward each year.
const WFIGS_HISTORY_YEAR_COLORS = ['#00e5ff', '#ffea00', '#ff4fd8', '#76ff03', '#9c7cff'];

const wfigsCurrentLayerGroup = L.layerGroup();
const wfigsYTDLayerGroup = L.layerGroup();
const wfigsHistoryLayerGroup = L.layerGroup();
let wfigsCurrentManifest = null;
let wfigsYTDManifest = null;
let wfigsHistoryIndex = null;
const wfigsHistoryManifests = new Map();
let wfigsCurrentDataLayer = null;
let wfigsCurrentManifestVersion = '';
let wfigsYTDManifestVersion = '';
let wfigsHistoryIndexVersion = '';
const wfigsHistoryManifestVersions = new Map();
let wfigsCurrentRefreshInFlight = false;
let wfigsYTDManifestRefreshInFlight = false;
let wfigsHistoryRefreshInFlight = false;
let wfigsHistoryRefreshQueued = false;
let wfigsCurrentLastError = '';
let wfigsYTDLastError = '';
let wfigsHistoryLastError = '';
let wfigsYTDViewportTimer = null;
let wfigsHistoryViewportTimer = null;
let wfigsYTDViewportSerial = 0;
let wfigsHistoryViewportSerial = 0;
let wfigsYTDLastDisplayThreshold = null;
let wfigsHistoryLastDisplayThreshold = null;
let wfigsYTDVisibleHrefs = new Set();
const wfigsHistoryVisibleHrefsByYear = new Map();
let wfigsCurrentActiveFireIds = new Set();
// Start with the newest completed year selected, but allow the forecaster to toggle
// any combination of the rolling five-year archive on at the same time.
let wfigsHistorySelectedYears = new Set([WFIGS_CURRENT_YEAR - 1]);
const wfigsYTDChunkCache = new Map();
let wfigsYTDOverviewGeoJSON = null;
let wfigsYTDOverviewLayer = null;
const wfigsHistoryChunkCache = new Map();
const wfigsHistoryOverviewCache = new Map();
let wfigsCurrentSeasonalActivity = null;
let wfigsHistoricalSeasonalActivity = null;
let wfigsSeasonalActivityLastError = '';
let wfigsSeasonalActivityLoading = false;

function ensureWFIGSDashboardStyles() {
    if (document.getElementById('wfigs-dashboard-styles')) return;
    const style = document.createElement('style');
    style.id = 'wfigs-dashboard-styles';
    style.textContent = `
        .leaflet-tooltip.wfigs-tooltip {
            background: rgba(22, 24, 27, 0.96);
            border: 1px solid rgba(255, 190, 105, 0.78);
            color: #f5f5f5;
            box-shadow: 0 2px 10px rgba(0,0,0,0.36);
            font: 12px/1.35 sans-serif;
            padding: 7px 9px;
        }
        .leaflet-tooltip-top.wfigs-tooltip::before {
            border-top-color: rgba(255, 190, 105, 0.78);
        }
        .wfigs-tooltip strong { color: #ffd28a; font-size: 12.5px; }
        .wfigs-tooltip .wfigs-muted { color: #c9c9c9; font-size: 10.5px; }
        .wfigs-popup { font: 12px/1.4 sans-serif; min-width: 235px; color: #222; }
        .wfigs-popup h3 { margin: 0 0 7px; font-size: 15px; color: #9a3c24; }
        .wfigs-popup .wfigs-row { margin: 3px 0; }
        .wfigs-popup .wfigs-science-note {
            margin-top: 8px; padding-top: 7px; border-top: 1px solid #ddd;
            color: #555; font-size: 10.5px;
        }
        .layer-description {
            display: block; margin-top: 2px; opacity: 0.68;
            font-size: 9.5px; line-height: 1.2; font-weight: 400;
        }
        .wfigs-history-year-control {
            margin: -1px 10px 10px 35px; padding: 8px 9px 9px;
            border: 1px solid rgba(255,190,105,0.34); border-radius: 5px;
            background: rgba(37,28,18,0.36);
        }
        .wfigs-history-year-control label {
            display: block; margin-bottom: 6px; font-size: 9.5px;
            color: #ffd28a; text-transform: uppercase; font-weight: 700;
            letter-spacing: 0.03em;
        }
        .wfigs-history-year-buttons {
            display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 5px;
        }
        .wfigs-history-year-button {
            min-width: 0; padding: 5px 3px; border-radius: 4px; cursor: pointer;
            border: 2px solid var(--wfigs-year-color, #ddd); color: #d5dde5;
            background: rgba(10,18,27,0.78); font-size: 10px; font-weight: 700;
            opacity: 0.55; transition: opacity 120ms ease, box-shadow 120ms ease, background 120ms ease;
        }
        .wfigs-history-year-button:hover { opacity: 0.9; }
        .wfigs-history-year-button.is-selected {
            opacity: 1; color: #fff; background: rgba(255,255,255,0.10);
            box-shadow: 0 0 0 1px var(--wfigs-year-color, #ddd) inset,
                        0 0 7px var(--wfigs-year-color, #ddd);
        }
        .wfigs-history-year-note {
            display: block; margin-top: 6px; color: rgba(235,242,249,0.68);
            font-size: 9px; line-height: 1.25;
        }
        .wfigs-seasonal-control {
            margin: 0 10px 11px 35px; padding: 8px 9px 9px;
            border: 1px solid rgba(86,196,255,0.34); border-radius: 5px;
            background: rgba(10,34,48,0.42);
        }
        .wfigs-seasonal-control-title {
            color: #8ddcff; font-size: 9.5px; font-weight: 700;
            letter-spacing: 0.03em; text-transform: uppercase; margin-bottom: 6px;
        }
        .wfigs-seasonal-open-button {
            width: 100%; padding: 7px 8px; border-radius: 4px; cursor: pointer;
            border: 1px solid rgba(141,220,255,0.72); color: #f3fbff;
            background: linear-gradient(180deg, rgba(28,99,132,0.94), rgba(15,66,91,0.94));
            font-size: 10.5px; font-weight: 700; text-align: left;
        }
        .wfigs-seasonal-open-button:hover { filter: brightness(1.08); }
        .wfigs-seasonal-control-note {
            display: block; margin-top: 6px; color: rgba(235,242,249,0.68);
            font-size: 9px; line-height: 1.25;
        }
        .wfigs-trend-panel {
            position: fixed; right: 18px; top: 78px; z-index: 1450;
            width: min(760px, calc(100vw - 36px)); max-height: calc(100vh - 100px);
            overflow: auto; border: 1px solid rgba(106,205,255,0.48); border-radius: 8px;
            background: rgba(8,15,22,0.97); color: #eef7fc;
            box-shadow: 0 14px 38px rgba(0,0,0,0.48); font-family: Arial, sans-serif;
        }
        .wfigs-trend-panel[hidden] { display: none !important; }
        .wfigs-trend-header {
            position: sticky; top: 0; z-index: 2; display: flex; align-items: center;
            justify-content: space-between; gap: 10px; padding: 11px 13px;
            background: rgba(9,25,36,0.99); border-bottom: 1px solid rgba(106,205,255,0.25);
        }
        .wfigs-trend-header h2 { margin: 0; font-size: 15px; color: #f7fbff; }
        .wfigs-trend-subtitle { margin-top: 2px; color: #9cc7da; font-size: 10px; }
        .wfigs-trend-header-actions { display: flex; gap: 6px; }
        .wfigs-trend-header-actions button {
            border: 1px solid rgba(190,226,242,0.35); border-radius: 4px;
            background: rgba(255,255,255,0.06); color: #eef7fc; cursor: pointer;
            padding: 5px 8px; font-size: 11px;
        }
        .wfigs-trend-body { padding: 12px 13px 14px; }
        .wfigs-trend-status {
            margin-bottom: 9px; padding: 7px 9px; border-radius: 4px;
            background: rgba(255,255,255,0.045); color: #bcd1dc; font-size: 10px; line-height: 1.35;
        }
        .wfigs-trend-kpis {
            display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 7px; margin-bottom: 10px;
        }
        .wfigs-trend-kpi {
            padding: 8px 9px; border-radius: 5px; background: rgba(255,255,255,0.045);
            border: 1px solid rgba(255,255,255,0.08); min-width: 0;
        }
        .wfigs-trend-kpi-label { color: #9db3bf; font-size: 9px; text-transform: uppercase; letter-spacing: .03em; }
        .wfigs-trend-kpi-value { margin-top: 3px; font-size: 18px; font-weight: 700; color: #fff; }
        .wfigs-trend-kpi-detail { margin-top: 2px; font-size: 9px; color: #9db3bf; }
        .wfigs-trend-chart-card {
            margin-top: 10px; padding: 9px 9px 7px; border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.025);
        }
        .wfigs-trend-chart-title { font-size: 12px; font-weight: 700; color: #fff; }
        .wfigs-trend-chart-note { margin-top: 2px; font-size: 9.5px; color: #96aeba; }
        .wfigs-trend-chart { position: relative; margin-top: 5px; }
        .wfigs-trend-chart svg { width: 100%; height: auto; display: block; }
        .wfigs-trend-legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 5px; font-size: 9px; color: #b8cbd5; }
        .wfigs-trend-legend-item { display: inline-flex; align-items: center; gap: 4px; }
        .wfigs-trend-swatch { width: 16px; height: 3px; border-radius: 2px; display: inline-block; }
        .wfigs-trend-swatch.range { height: 8px; background: rgba(126,184,210,0.20); border: 1px solid rgba(126,184,210,0.42); }
        .wfigs-trend-footnote {
            margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08);
            color: #90a6b1; font-size: 9.5px; line-height: 1.4;
        }
        @media (max-width: 720px) {
            .wfigs-trend-panel { right: 8px; top: 66px; width: calc(100vw - 16px); max-height: calc(100vh - 78px); }
            .wfigs-trend-kpis { grid-template-columns: 1fr; }
        }
    `;
    document.head.appendChild(style);
}
ensureWFIGSDashboardStyles();

function escapeWFIGSHTML(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatWFIGSAcres(value) {
    const acres = Number(value);
    if (!Number.isFinite(acres)) return 'Unknown';
    if (acres < 1) return `${acres.toFixed(2)} acres`;
    if (acres < 100) return `${acres.toFixed(1)} acres`;
    return `${Math.round(acres).toLocaleString('en-US')} acres`;
}

function formatWFIGSDate(value) {
    if (!value) return 'Unknown';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Unknown';
    return parsed.toLocaleDateString('en-US', {
        timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric'
    });
}

function formatWFIGSDateTime(value) {
    if (!value) return 'Unknown';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Unknown' : formatUTC(parsed);
}

function wfigsLocationText(properties = {}) {
    const parts = [properties.county, properties.state].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Location unavailable';
}

function wfigsHistoryColorForYear(year) {
    const years = (wfigsHistoryIndex?.available_years || defaultWFIGSHistoryYears()).map(Number);
    const index = years.indexOf(Number(year));
    const paletteIndex = index >= 0 ? index : Math.max(0, (WFIGS_CURRENT_YEAR - 1) - Number(year));
    return WFIGS_HISTORY_YEAR_COLORS[paletteIndex % WFIGS_HISTORY_YEAR_COLORS.length];
}

function wfigsBaseStyle(collection, archiveYear = null) {
    if (collection === 'current') {
        return {
            color: '#ff5b3a', weight: 2.2, opacity: 0.98,
            fillColor: '#e33f26', fillOpacity: 0.12, dashArray: null
        };
    }
    if (collection === 'history') {
        const color = wfigsHistoryColorForYear(archiveYear);
        return {
            color, weight: 2.15, opacity: 0.98,
            fillColor: color, fillOpacity: 0.075, dashArray: null
        };
    }
    return {
        color: '#ffb000', weight: 2.35, opacity: 0.98,
        fillColor: '#ff8a00', fillOpacity: 0.105, dashArray: null
    };
}

function wfigsHighlightStyle(collection, archiveYear = null) {
    if (collection === 'current') {
        return {
            color: '#fff0b8', weight: 3.2, opacity: 1,
            fillColor: '#ff7043', fillOpacity: 0.20, dashArray: null
        };
    }
    if (collection === 'history') {
        const color = wfigsHistoryColorForYear(archiveYear);
        return {
            color: '#ffffff', weight: 3.0, opacity: 1,
            fillColor: color, fillOpacity: 0.18, dashArray: null
        };
    }
    return {
        color: '#fff2bd', weight: 3.0, opacity: 1,
        fillColor: '#ff9800', fillOpacity: 0.18, dashArray: null
    };
}

function buildWFIGSTooltipHTML(properties = {}) {
    const containment = Number(properties.percent_contained);
    const containmentLine = Number.isFinite(containment)
        ? `<br><span>Containment: ${Math.round(containment)}%</span>`
        : '';
    const discovery = properties.discovery_time_utc
        ? `<br><span class="wfigs-muted">Discovered: ${escapeWFIGSHTML(formatWFIGSDate(properties.discovery_time_utc))}</span>`
        : '';
    return `
        <strong>${escapeWFIGSHTML(properties.incident_name || 'Unnamed wildfire')}</strong><br>
        <span>Mapped perimeter: ${escapeWFIGSHTML(formatWFIGSAcres(properties.mapped_acres))}</span><br>
        <span>${escapeWFIGSHTML(wfigsLocationText(properties))}</span>${containmentLine}${discovery}
    `;
}

function buildWFIGSPopupHTML(properties = {}, collection = null, archiveYear = null) {
    const sourceCollection = collection || properties.source_collection || '';
    const collectionLabel = sourceCollection === 'current'
        ? 'Current WFIGS perimeter'
        : (sourceCollection === 'history' || String(sourceCollection).startsWith('history-'))
            ? `${archiveYear || String(sourceCollection).replace('history-', '')} WFIGS historical perimeter`
            : `${WFIGS_CURRENT_YEAR} WFIGS YTD perimeter archive`;
    const rows = [];
    const addRow = (label, value) => {
        if (value === null || value === undefined || value === '' || value === 'Unknown') return;
        rows.push(`<div class="wfigs-row"><strong>${escapeWFIGSHTML(label)}:</strong> ${escapeWFIGSHTML(value)}</div>`);
    };

    addRow('Mapped perimeter', formatWFIGSAcres(properties.mapped_acres));
    if (Number.isFinite(Number(properties.reported_acres))) {
        addRow('Reported incident size', formatWFIGSAcres(properties.reported_acres));
    }
    if (Number.isFinite(Number(properties.percent_contained))) {
        addRow('Containment', `${Math.round(Number(properties.percent_contained))}%`);
    }
    addRow('Location', wfigsLocationText(properties));
    addRow('Discovered', formatWFIGSDateTime(properties.discovery_time_utc));
    addRow('Perimeter observed', formatWFIGSDateTime(properties.perimeter_time_utc));
    addRow('Fire cause', properties.fire_cause);
    addRow('Cause detail', properties.fire_cause_general);
    addRow('Mapping method', properties.map_method);
    addRow('Source dataset', properties.source_dataset);

    return `
        <div class="wfigs-popup">
            <h3>${escapeWFIGSHTML(properties.incident_name || 'Unnamed wildfire')}</h3>
            <div style="color:#666;font-size:10.5px;margin-bottom:6px;">${escapeWFIGSHTML(collectionLabel)}</div>
            ${rows.join('')}
            <div class="wfigs-science-note">
                WFIGS depicts mapped wildfire extent. It does not indicate soil-burn severity or hydrologic response severity.
            </div>
        </div>
    `;
}

function bindWFIGSFeatureInteraction(feature, layer, collection, archiveYear = null) {
    const properties = feature?.properties || {};
    layer.bindTooltip(buildWFIGSTooltipHTML(properties), {
        sticky: true, direction: 'top', opacity: 0.97, className: 'wfigs-tooltip'
    });
    layer.bindPopup(buildWFIGSPopupHTML(properties, collection, archiveYear), {maxWidth: 360});
    layer.on('mouseover', () => {
        if (typeof layer.setStyle === 'function') layer.setStyle(wfigsHighlightStyle(collection, archiveYear));
        if (typeof layer.bringToFront === 'function') layer.bringToFront();
    });
    layer.on('mouseout', () => {
        if (typeof layer.setStyle === 'function') layer.setStyle(wfigsBaseStyle(collection, archiveYear));
    });
}

function validateWFIGSManifest(manifest, collection) {
    if (!manifest || manifest.phase !== 'WFIGS-2' || manifest.collection !== collection) {
        throw new Error(`Invalid WFIGS ${collection} manifest`);
    }
    if (!String(manifest.processor_version || '').startsWith('wfigs_phase2_operational_v1_')) {
        throw new Error(`Unexpected WFIGS ${collection} processor version`);
    }
    if (!Number.isFinite(Number(manifest.published_fire_count)) || Number(manifest.published_fire_count) <= 0) {
        throw new Error(`WFIGS ${collection} manifest has no published wildfire perimeters`);
    }
    if (collection === 'current') {
        if (!manifest.href || !Array.isArray(manifest.active_fire_ids)) {
            throw new Error('WFIGS Current manifest is missing href or active_fire_ids');
        }
    } else {
        if (!Array.isArray(manifest.chunks) || Number(manifest.chunk_count) !== manifest.chunks.length) {
            throw new Error('WFIGS YTD manifest has an invalid chunk inventory');
        }
        manifest.chunks.forEach(chunk => {
            if (!chunk?.href || !Array.isArray(chunk.bbox) || chunk.bbox.length !== 4) {
                throw new Error('WFIGS YTD manifest contains an invalid chunk');
            }
        });
        if (!manifest.overview?.href || !Number.isFinite(Number(manifest.overview.feature_count))) {
            throw new Error('WFIGS YTD manifest is missing the zoomed-out overview product');
        }
    }
    return manifest;
}

async function fetchWFIGSJSON(url) {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, {cache: 'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

function validateWFIGSFeatureCollection(geojson, expectedCount, label) {
    if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
        throw new Error(`${label} is not a GeoJSON FeatureCollection`);
    }
    if (Number.isFinite(Number(expectedCount)) && geojson.features.length !== Number(expectedCount)) {
        throw new Error(`${label} feature count mismatch: ${geojson.features.length} vs ${expectedCount}`);
    }
    for (const feature of geojson.features) {
        const geometryType = feature?.geometry?.type;
        if (!['Polygon', 'MultiPolygon'].includes(geometryType)) {
            throw new Error(`${label} contains non-polygon geometry`);
        }
        if (!feature?.properties?.fire_id) {
            throw new Error(`${label} contains a feature without fire_id`);
        }
    }
    return geojson;
}

function wfigsManifestVersion(manifest) {
    return [
        manifest?.processor_version || '',
        manifest?.source_last_edit_epoch_ms || '',
        manifest?.generated_utc || '',
        manifest?.published_fire_count || '',
        manifest?.sha256 || '',
        manifest?.total_chunk_bytes || ''
    ].join('|');
}

function wfigsSourceEditAgeMinutes(manifest) {
    const parsed = new Date(manifest?.source_last_edit_utc || '');
    if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
    return Math.max(0, (Date.now() - parsed.getTime()) / 60000);
}

function buildWFIGSCurrentGeoJSONLayer(geojson) {
    return L.geoJSON(geojson, {
        style: () => wfigsBaseStyle('current'),
        onEachFeature: (feature, layer) => bindWFIGSFeatureInteraction(feature, layer, 'current')
    });
}

async function refreshWFIGSCurrent({forceManifest = false} = {}) {
    if (wfigsCurrentRefreshInFlight) return;
    if (!map.hasLayer(wfigsCurrentLayerGroup) && !forceManifest) return;
    wfigsCurrentRefreshInFlight = true;
    try {
        const manifest = validateWFIGSManifest(
            await fetchWFIGSJSON(WFIGS_CURRENT_MANIFEST_URL), 'current'
        );
        const version = wfigsManifestVersion(manifest);
        const changed = forceManifest || !wfigsCurrentDataLayer || version !== wfigsCurrentManifestVersion;
        wfigsCurrentManifest = manifest;
        wfigsCurrentActiveFireIds = new Set(manifest.active_fire_ids || []);

        if (changed) {
            const dataUrl = `${WFIGS_DATA_ROOT}/current/${manifest.href}?v=${encodeURIComponent(manifest.source_last_edit_epoch_ms || manifest.generated_utc || '')}`;
            const geojson = validateWFIGSFeatureCollection(
                await fetchWFIGSJSON(dataUrl), manifest.published_fire_count, 'WFIGS Current perimeters'
            );
            const replacement = buildWFIGSCurrentGeoJSONLayer(geojson);
            wfigsCurrentLayerGroup.addLayer(replacement);
            if (wfigsCurrentDataLayer) wfigsCurrentLayerGroup.removeLayer(wfigsCurrentDataLayer);
            wfigsCurrentDataLayer = replacement;
            wfigsCurrentManifestVersion = version;
            if (map.hasLayer(wfigsYTDLayerGroup)) rebuildVisibleWFIGSYTDChunkLayers();
        }
        wfigsCurrentLastError = '';
    } catch (error) {
        wfigsCurrentLastError = error?.message || String(error);
        console.warn('WFIGS Current refresh failed; retaining last successful snapshot:', error);
    } finally {
        wfigsCurrentRefreshInFlight = false;
        updateWFIGSCurrentTimeBox();
        updateLegends();
    }
}

function wfigsYTDMinimumMappedAcresForZoom(zoom = map.getZoom()) {
    if (zoom < WFIGS_ARCHIVE_OVERVIEW_MIN_ZOOM) return Number.POSITIVE_INFINITY;
    if (zoom === 4) return 10000;
    if (zoom === 5) return 5000;
    if (zoom === 6) return 500;
    if (zoom === 7) return 100;
    if (zoom === 8) return 20;
    return 0;
}

function wfigsYTDThresholdText(zoom = map.getZoom()) {
    const threshold = wfigsYTDMinimumMappedAcresForZoom(zoom);
    if (!Number.isFinite(threshold)) return `Zoom to ${WFIGS_ARCHIVE_OVERVIEW_MIN_ZOOM}+ to load the archive`;
    if (threshold <= 0) return 'All available perimeter sizes shown';
    const mode = zoom < WFIGS_ARCHIVE_CHUNK_MIN_ZOOM ? 'National overview' : 'Cartographic display';
    return `${mode}: ≥${threshold.toLocaleString('en-US')} acres at this zoom`;
}

function wfigsBBoxesIntersect(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 4 || b.length !== 4) return false;
    return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}

function wfigsMapBBox() {
    const bounds = map.getBounds();
    return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
}

function buildWFIGSYTDChunkLayer(geojson) {
    const threshold = wfigsYTDMinimumMappedAcresForZoom();
    const suppressCurrentDuplicates = map.hasLayer(wfigsCurrentLayerGroup);
    return L.geoJSON(geojson, {
        filter: feature => {
            const properties = feature?.properties || {};
            if (suppressCurrentDuplicates && wfigsCurrentActiveFireIds.has(properties.fire_id)) return false;
            if (!Number.isFinite(threshold) || threshold === Number.POSITIVE_INFINITY) return false;
            if (threshold <= 0) return true;
            const acres = Number(properties.mapped_acres);
            return Number.isFinite(acres) && acres >= threshold;
        },
        style: () => wfigsBaseStyle('ytd'),
        onEachFeature: (feature, layer) => bindWFIGSFeatureInteraction(feature, layer, 'ytd')
    });
}

async function loadWFIGSYTDOverview() {
    if (!wfigsYTDManifest?.overview?.href) throw new Error('WFIGS YTD overview metadata unavailable');
    if (wfigsYTDOverviewGeoJSON) return wfigsYTDOverviewGeoJSON;
    const meta = wfigsYTDManifest.overview;
    const url = `${WFIGS_DATA_ROOT}/ytd/${meta.href}?v=${encodeURIComponent(wfigsYTDManifest?.source_last_edit_epoch_ms || '')}`;
    wfigsYTDOverviewGeoJSON = validateWFIGSFeatureCollection(
        await fetchWFIGSJSON(url), meta.feature_count, 'WFIGS YTD national overview'
    );
    return wfigsYTDOverviewGeoJSON;
}

function rebuildWFIGSYTDOverviewLayer() {
    if (wfigsYTDOverviewLayer && wfigsYTDLayerGroup.hasLayer(wfigsYTDOverviewLayer)) {
        wfigsYTDLayerGroup.removeLayer(wfigsYTDOverviewLayer);
    }
    wfigsYTDOverviewLayer = wfigsYTDOverviewGeoJSON ? buildWFIGSYTDChunkLayer(wfigsYTDOverviewGeoJSON) : null;
    if (wfigsYTDOverviewLayer && map.hasLayer(wfigsYTDLayerGroup) && map.getZoom() < WFIGS_ARCHIVE_CHUNK_MIN_ZOOM) {
        wfigsYTDLayerGroup.addLayer(wfigsYTDOverviewLayer);
    }
}

async function loadWFIGSYTDChunk(chunkMeta) {
    const key = chunkMeta.href;
    const cached = wfigsYTDChunkCache.get(key);
    if (cached) {
        cached.lastUsed = Date.now();
        return cached;
    }

    const url = `${WFIGS_DATA_ROOT}/ytd/${chunkMeta.href}?v=${encodeURIComponent(wfigsYTDManifest?.source_last_edit_epoch_ms || '')}`;
    const geojson = validateWFIGSFeatureCollection(
        await fetchWFIGSJSON(url), chunkMeta.feature_count, `WFIGS YTD ${chunkMeta.id}`
    );
    const entry = {
        geojson,
        layer: buildWFIGSYTDChunkLayer(geojson),
        lastUsed: Date.now()
    };
    wfigsYTDChunkCache.set(key, entry);
    return entry;
}

function rebuildVisibleWFIGSYTDChunkLayers() {
    if (!map.hasLayer(wfigsYTDLayerGroup)) return;
    if (map.getZoom() < WFIGS_ARCHIVE_CHUNK_MIN_ZOOM) {
        rebuildWFIGSYTDOverviewLayer();
        wfigsYTDLastDisplayThreshold = wfigsYTDMinimumMappedAcresForZoom();
        updateWFIGSYTDTimeBox();
        return;
    }
    const visible = [...wfigsYTDVisibleHrefs];
    visible.forEach(href => {
        const cached = wfigsYTDChunkCache.get(href);
        if (!cached) return;
        if (wfigsYTDLayerGroup.hasLayer(cached.layer)) wfigsYTDLayerGroup.removeLayer(cached.layer);
        cached.layer = buildWFIGSYTDChunkLayer(cached.geojson);
        wfigsYTDLayerGroup.addLayer(cached.layer);
        cached.lastUsed = Date.now();
    });
    wfigsYTDLastDisplayThreshold = wfigsYTDMinimumMappedAcresForZoom();
    updateWFIGSYTDTimeBox();
}

function pruneWFIGSYTDChunkCache() {
    if (wfigsYTDChunkCache.size <= WFIGS_YTD_CHUNK_CACHE_LIMIT) return;
    const removable = [...wfigsYTDChunkCache.entries()]
        .filter(([href]) => !wfigsYTDVisibleHrefs.has(href))
        .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    while (wfigsYTDChunkCache.size > WFIGS_YTD_CHUNK_CACHE_LIMIT && removable.length) {
        const [href, cached] = removable.shift();
        if (wfigsYTDLayerGroup.hasLayer(cached.layer)) wfigsYTDLayerGroup.removeLayer(cached.layer);
        wfigsYTDChunkCache.delete(href);
    }
}

async function updateWFIGSYTDViewport() {
    if (!map.hasLayer(wfigsYTDLayerGroup) || !wfigsYTDManifest) return;
    const serial = ++wfigsYTDViewportSerial;
    const zoom = map.getZoom();
    const threshold = wfigsYTDMinimumMappedAcresForZoom(zoom);

    if (zoom < WFIGS_ARCHIVE_OVERVIEW_MIN_ZOOM) {
        wfigsYTDLayerGroup.clearLayers();
        wfigsYTDVisibleHrefs.clear();
        wfigsYTDLastDisplayThreshold = threshold;
        updateWFIGSYTDTimeBox();
        return;
    }

    if (zoom < WFIGS_ARCHIVE_CHUNK_MIN_ZOOM) {
        [...wfigsYTDVisibleHrefs].forEach(href => {
            const cached = wfigsYTDChunkCache.get(href);
            if (cached && wfigsYTDLayerGroup.hasLayer(cached.layer)) wfigsYTDLayerGroup.removeLayer(cached.layer);
        });
        wfigsYTDVisibleHrefs.clear();
        try {
            await loadWFIGSYTDOverview();
            if (serial !== wfigsYTDViewportSerial || !map.hasLayer(wfigsYTDLayerGroup)) return;
            rebuildWFIGSYTDOverviewLayer();
            wfigsYTDLastError = '';
        } catch (error) {
            wfigsYTDLastError = `National overview failed to load: ${error?.message || String(error)}`;
        }
        wfigsYTDLastDisplayThreshold = threshold;
        updateWFIGSYTDTimeBox();
        return;
    }

    if (wfigsYTDOverviewLayer && wfigsYTDLayerGroup.hasLayer(wfigsYTDOverviewLayer)) {
        wfigsYTDLayerGroup.removeLayer(wfigsYTDOverviewLayer);
    }
    const viewport = wfigsMapBBox();
    const desiredChunks = wfigsYTDManifest.chunks.filter(chunk => wfigsBBoxesIntersect(chunk.bbox, viewport));
    const desiredHrefs = new Set(desiredChunks.map(chunk => chunk.href));

    [...wfigsYTDVisibleHrefs].forEach(href => {
        if (desiredHrefs.has(href)) return;
        const cached = wfigsYTDChunkCache.get(href);
        if (cached && wfigsYTDLayerGroup.hasLayer(cached.layer)) wfigsYTDLayerGroup.removeLayer(cached.layer);
        wfigsYTDVisibleHrefs.delete(href);
    });

    const thresholdChanged = threshold !== wfigsYTDLastDisplayThreshold;
    if (thresholdChanged) {
        [...wfigsYTDVisibleHrefs].forEach(href => {
            const cached = wfigsYTDChunkCache.get(href);
            if (!cached) return;
            if (wfigsYTDLayerGroup.hasLayer(cached.layer)) wfigsYTDLayerGroup.removeLayer(cached.layer);
            cached.layer = buildWFIGSYTDChunkLayer(cached.geojson);
            wfigsYTDLayerGroup.addLayer(cached.layer);
        });
    }

    const results = await Promise.allSettled(
        desiredChunks.map(async chunk => ({chunk, cached: await loadWFIGSYTDChunk(chunk)}))
    );
    if (serial !== wfigsYTDViewportSerial || !map.hasLayer(wfigsYTDLayerGroup)) return;

    let failures = 0;
    results.forEach(result => {
        if (result.status !== 'fulfilled') {
            failures += 1;
            console.warn('WFIGS YTD chunk load failed:', result.reason);
            return;
        }
        const {chunk, cached} = result.value;
        if (!desiredHrefs.has(chunk.href)) return;
        // A newly loaded chunk is built using the current zoom threshold. If the
        // zoom changed while its request was in flight, rebuild before display.
        const currentThreshold = wfigsYTDMinimumMappedAcresForZoom();
        if (currentThreshold !== threshold) return;
        if (!wfigsYTDLayerGroup.hasLayer(cached.layer)) wfigsYTDLayerGroup.addLayer(cached.layer);
        wfigsYTDVisibleHrefs.add(chunk.href);
        cached.lastUsed = Date.now();
    });

    wfigsYTDLastDisplayThreshold = threshold;
    wfigsYTDLastError = failures ? `${failures} viewport chunk${failures === 1 ? '' : 's'} failed to load` : '';
    pruneWFIGSYTDChunkCache();
    updateWFIGSYTDTimeBox();
}

function scheduleWFIGSYTDViewportUpdate() {
    if (!map.hasLayer(wfigsYTDLayerGroup)) return;
    if (wfigsYTDViewportTimer) window.clearTimeout(wfigsYTDViewportTimer);
    wfigsYTDViewportTimer = window.setTimeout(() => {
        wfigsYTDViewportTimer = null;
        updateWFIGSYTDViewport();
    }, 140);
}

async function refreshWFIGSYTDManifest({forceManifest = false} = {}) {
    if (wfigsYTDManifestRefreshInFlight) return;
    if (!map.hasLayer(wfigsYTDLayerGroup) && !forceManifest) return;
    wfigsYTDManifestRefreshInFlight = true;
    try {
        const manifest = validateWFIGSManifest(
            await fetchWFIGSJSON(WFIGS_YTD_MANIFEST_URL), 'ytd'
        );
        const version = wfigsManifestVersion(manifest);
        const changed = forceManifest || !wfigsYTDManifest || version !== wfigsYTDManifestVersion;
        if (changed) {
            wfigsYTDLayerGroup.clearLayers();
            wfigsYTDChunkCache.clear();
            wfigsYTDVisibleHrefs.clear();
            wfigsYTDOverviewGeoJSON = null;
            wfigsYTDOverviewLayer = null;
            wfigsYTDLastDisplayThreshold = null;
        }
        wfigsYTDManifest = manifest;
        wfigsYTDManifestVersion = version;
        wfigsYTDLastError = '';
        await updateWFIGSYTDViewport();
    } catch (error) {
        wfigsYTDLastError = error?.message || String(error);
        console.warn('WFIGS YTD manifest refresh failed; retaining loaded chunks:', error);
    } finally {
        wfigsYTDManifestRefreshInFlight = false;
        updateWFIGSYTDTimeBox();
        updateLegends();
    }
}

function formatWFIGSCurrentTimeBox() {
    if (!wfigsCurrentManifest) {
        return `
            <strong>NIFC/WFIGS Current Wildfire Perimeters</strong><br>
            <span style="color:#ffeb3b;">${wfigsCurrentLastError ? 'Current feed unavailable' : 'Loading current wildfire perimeters...'}</span>
        `;
    }
    const age = wfigsSourceEditAgeMinutes(wfigsCurrentManifest);
    const delayed = Number.isFinite(age) && age > WFIGS_CURRENT_SOURCE_EDIT_CAUTION_MINUTES;
    const status = wfigsCurrentLastError
        ? '<span style="color:#ffb74d;font-weight:bold;">Refresh warning — showing last successful snapshot</span>'
        : delayed
            ? `<span style="color:#ffb74d;font-weight:bold;">Source edit &gt;${WFIGS_CURRENT_SOURCE_EDIT_CAUTION_MINUTES} min ago — verify freshness</span>`
            : '<span style="color:#80cbc4;font-weight:bold;">Near-real-time WFIGS perimeter snapshot</span>';
    return `
        <strong>NIFC/WFIGS Current Wildfire Perimeters</strong><br>
        ${status}<br>
        <span style="color:#ffeb3b;">Source last edit: ${escapeWFIGSHTML(formatWFIGSDateTime(wfigsCurrentManifest.source_last_edit_utc))}</span><br>
        <span style="font-size:0.82em;color:#d0d0d0;">${Number(wfigsCurrentManifest.published_fire_count).toLocaleString('en-US')} wildfire perimeters &bull; hover or click for fire details</span>
    `;
}

function updateWFIGSCurrentTimeBox() {
    const box = document.getElementById('wfigs-current-time-box');
    if (!box) return;
    if (!map.hasLayer(wfigsCurrentLayerGroup)) {
        box.style.display = 'none';
    } else {
        box.innerHTML = formatWFIGSCurrentTimeBox();
        box.style.display = 'block';
    }
    refreshLegendDockSummary();
}

function formatWFIGSYTDTimeBox() {
    if (!wfigsYTDManifest) {
        return `
            <strong>${escapeWFIGSHTML(WFIGS_YTD_LAYER_NAME)}</strong><br>
            <span style="color:#ffeb3b;">${wfigsYTDLastError ? 'Archive manifest unavailable' : `Loading ${WFIGS_CURRENT_YEAR} YTD perimeter archive...`}</span>
        `;
    }
    let displayedFeatures = 0;
    if (map.getZoom() < WFIGS_ARCHIVE_CHUNK_MIN_ZOOM && wfigsYTDOverviewLayer?.getLayers) {
        displayedFeatures = wfigsYTDOverviewLayer.getLayers().length;
    } else {
        wfigsYTDVisibleHrefs.forEach(href => {
            const cached = wfigsYTDChunkCache.get(href);
            if (cached?.layer?.getLayers) displayedFeatures += cached.layer.getLayers().length;
        });
    }
    const warning = wfigsYTDLastError
        ? `<br><span style="color:#ffb74d;">${escapeWFIGSHTML(wfigsYTDLastError)}; loaded data retained.</span>`
        : '';
    return `
        <strong>${escapeWFIGSHTML(WFIGS_YTD_LAYER_NAME)}</strong><br>
        <span style="color:#ffeb3b;">Snapshot: ${escapeWFIGSHTML(formatWFIGSDateTime(wfigsYTDManifest.source_last_edit_utc))}</span><br>
        <span style="font-size:0.82em;color:#d0d0d0;">${Number(wfigsYTDManifest.published_fire_count).toLocaleString('en-US')} mapped fires in ${Number(wfigsYTDManifest.chunk_count).toLocaleString('en-US')} regional chunks</span><br>
        <span style="font-size:0.82em;color:#80cbc4;">${escapeWFIGSHTML(wfigsYTDThresholdText())}</span><br>
        <span style="font-size:0.82em;color:#d0d0d0;">${map.getZoom() < WFIGS_ARCHIVE_CHUNK_MIN_ZOOM ? 'National overview' : `Viewport: ${wfigsYTDVisibleHrefs.size} chunks`} &bull; ${displayedFeatures.toLocaleString('en-US')} displayed perimeters</span>${warning}
    `;
}

function updateWFIGSYTDTimeBox() {
    const box = document.getElementById('wfigs-ytd-time-box');
    if (!box) return;
    if (!map.hasLayer(wfigsYTDLayerGroup)) {
        box.style.display = 'none';
    } else {
        box.innerHTML = formatWFIGSYTDTimeBox();
        box.style.display = 'block';
    }
    refreshLegendDockSummary();
}


function defaultWFIGSHistoryYears() {
    return Array.from({length: WFIGS_HISTORY_ROLLING_YEARS}, (_, index) => WFIGS_CURRENT_YEAR - 1 - index);
}

function validateWFIGSHistoryIndex(index) {
    if (!index || index.phase !== 'WFIGS-4' || index.collection !== 'history-index') {
        throw new Error('Invalid WFIGS rolling-history index');
    }
    const years = (index.available_years || []).map(Number);
    if (years.length !== WFIGS_HISTORY_ROLLING_YEARS || years.some(year => !Number.isInteger(year))) {
        throw new Error('WFIGS rolling-history index does not contain five valid years');
    }
    const contiguousDescending = years.every((year, indexPosition) =>
        indexPosition === 0 || year === years[indexPosition - 1] - 1
    );
    if (!contiguousDescending || Math.min(...years) < 2021 || years[0] > WFIGS_CURRENT_YEAR - 1) {
        throw new Error(`WFIGS rolling-history year inventory is invalid: ${years.join(',')}`);
    }
    if (years[0] !== WFIGS_CURRENT_YEAR - 1) {
        console.warn(`WFIGS rolling-history index is awaiting annual rollover; newest available completed year is ${years[0]}.`);
    }
    if (!Array.isArray(index.years) || index.years.length !== years.length) {
        throw new Error('WFIGS rolling-history index year inventory is incomplete');
    }
    return index;
}

function validateWFIGSHistoryYearManifest(manifest, year) {
    if (!manifest || manifest.phase !== 'WFIGS-4' || manifest.collection !== 'history-year') {
        throw new Error(`Invalid WFIGS ${year} historical manifest`);
    }
    if (Number(manifest.year) !== Number(year)) throw new Error(`WFIGS historical manifest year mismatch: ${year}`);
    if (!Array.isArray(manifest.chunks) || manifest.chunks.length !== Number(manifest.chunk_count)) {
        throw new Error(`WFIGS ${year} historical manifest has an invalid chunk inventory`);
    }
    if (!manifest.overview?.href || !Number.isFinite(Number(manifest.overview.feature_count))) {
        throw new Error(`WFIGS ${year} historical manifest is missing the zoomed-out overview product`);
    }
    if (Number(manifest.published_fire_count) <= 0) throw new Error(`WFIGS ${year} historical manifest has no mapped fires`);
    return manifest;
}

function computeWFIGSHistoryIndexVersion(index) {
    return JSON.stringify((index?.years || []).map(entry => [entry.year, entry.source_year_signature, entry.generated_utc]));
}

function wfigsHistoryYearManifestURL(year) {
    const entry = (wfigsHistoryIndex?.years || []).find(item => Number(item.year) === Number(year));
    const href = entry?.href || `${year}/manifest.json`;
    return `${WFIGS_HISTORY_ROOT}/${href}`;
}

function wfigsHistoryAvailableYears() {
    return (wfigsHistoryIndex?.available_years || defaultWFIGSHistoryYears()).map(Number);
}

function wfigsHistorySortedSelectedYears() {
    const selected = wfigsHistorySelectedYears;
    return wfigsHistoryAvailableYears().filter(year => selected.has(year));
}

function wfigsHistoryVisibleSet(year) {
    const numericYear = Number(year);
    if (!wfigsHistoryVisibleHrefsByYear.has(numericYear)) {
        wfigsHistoryVisibleHrefsByYear.set(numericYear, new Set());
    }
    return wfigsHistoryVisibleHrefsByYear.get(numericYear);
}

function updateWFIGSHistoryLayerDescription() {
    const description = document.querySelector('.layer-row[data-layer-id="wfigs-history"] .layer-description');
    if (!description) return;
    const selected = wfigsHistorySortedSelectedYears();
    description.textContent = selected.length
        ? `Selected years: ${selected.join(', ')}. Toggle any combination of the rolling five completed calendar years.`
        : 'No historical years selected. Toggle one or more completed calendar years below.';
}

function updateWFIGSHistoryYearToggles() {
    const container = document.getElementById('wfigs-history-year-buttons');
    if (!container) return;
    const years = wfigsHistoryAvailableYears();
    const allowed = new Set(years);
    const prior = [...wfigsHistorySelectedYears];
    wfigsHistorySelectedYears = new Set(prior.filter(year => allowed.has(Number(year))).map(Number));
    // During an annual rollover, preserve a useful default if the old selected set
    // consisted entirely of the year that just fell out of the five-year window.
    if (prior.length && !wfigsHistorySelectedYears.size && wfigsHistoryIndex?.default_year) {
        wfigsHistorySelectedYears.add(Number(wfigsHistoryIndex.default_year));
    }

    container.innerHTML = '';
    years.forEach(year => {
        const color = wfigsHistoryColorForYear(year);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wfigs-history-year-button';
        button.dataset.year = String(year);
        button.textContent = String(year);
        button.style.setProperty('--wfigs-year-color', color);
        const selected = wfigsHistorySelectedYears.has(year);
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        button.setAttribute('aria-label', `${selected ? 'Hide' : 'Show'} ${year} WFIGS wildfire perimeters`);
        button.addEventListener('click', () => toggleWFIGSHistoryYear(year));
        container.append(button);
    });
    updateWFIGSHistoryLayerDescription();
}

function renderWFIGSHistoryYearControl(parent) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wfigs-history-year-control';
    wrapper.innerHTML = `
        <label>Toggle historical fire years</label>
        <div id="wfigs-history-year-buttons" class="wfigs-history-year-buttons" role="group" aria-label="Toggle historical WFIGS wildfire years"></div>
        <span class="wfigs-history-year-note">Multiple years may be displayed together. The newest completed year starts selected; toggle any combination for regional burn-scar analysis.</span>
    `;
    parent.append(wrapper);
    updateWFIGSHistoryYearToggles();
}

function renderWFIGSSeasonalTrendControl(parent) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wfigs-seasonal-control';
    wrapper.innerHTML = `
        <div class="wfigs-seasonal-control-title">CONUS seasonal wildfire activity</div>
        <button id="wfigs-open-seasonal-trends" class="wfigs-seasonal-open-button" type="button">
            Open ${WFIGS_CURRENT_YEAR} vs rolling 5-year activity trends
        </button>
        <span class="wfigs-seasonal-control-note">Weekly new wildfire discoveries and cumulative YTD activity versus the rolling five-year median and range.</span>
    `;
    parent.append(wrapper);
    wrapper.querySelector('#wfigs-open-seasonal-trends')?.addEventListener('click', openWFIGSSeasonalTrendPanel);
}

function ensureWFIGSSeasonalTrendPanel() {
    let panel = document.getElementById('wfigs-seasonal-trend-panel');
    if (panel) return panel;
    panel = document.createElement('section');
    panel.id = 'wfigs-seasonal-trend-panel';
    panel.className = 'wfigs-trend-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'wfigs-trend-panel-title');
    panel.innerHTML = `
        <div class="wfigs-trend-header">
            <div>
                <h2 id="wfigs-trend-panel-title">CONUS Seasonal Wildfire Activity</h2>
                <div class="wfigs-trend-subtitle">WFIGS wildfire discoveries — current year versus rolling five-year history</div>
            </div>
            <div class="wfigs-trend-header-actions">
                <button id="wfigs-trend-refresh" type="button" aria-label="Refresh wildfire trend data">Refresh</button>
                <button id="wfigs-trend-close" type="button" aria-label="Close wildfire trend panel">Close</button>
            </div>
        </div>
        <div id="wfigs-trend-body" class="wfigs-trend-body"></div>
    `;
    document.body.append(panel);
    panel.querySelector('#wfigs-trend-close')?.addEventListener('click', () => { panel.hidden = true; });
    panel.querySelector('#wfigs-trend-refresh')?.addEventListener('click', () => refreshWFIGSSeasonalActivity({force: true}));
    return panel;
}

function validateWFIGSCurrentSeasonalActivity(payload) {
    if (!payload || payload.phase !== 'WFIGS-5' || payload.collection !== 'current-year-activity') {
        throw new Error('Invalid WFIGS current-year seasonal activity payload');
    }
    if (payload.domain !== 'CONUS' || Number(payload.year) !== WFIGS_CURRENT_YEAR) {
        throw new Error('WFIGS current-year seasonal activity year/domain mismatch');
    }
    const daily = payload.daily_counts;
    if (!Array.isArray(daily) || ![365, 366].includes(daily.length)) {
        throw new Error('WFIGS current-year seasonal activity daily series is invalid');
    }
    return payload;
}

function validateWFIGSHistoricalSeasonalActivity(payload) {
    if (!payload || payload.phase !== 'WFIGS-5' || payload.collection !== 'historical-baseline') {
        throw new Error('Invalid WFIGS historical seasonal activity payload');
    }
    if (payload.domain !== 'CONUS' || !Array.isArray(payload.historical_years) || payload.historical_years.length !== 5) {
        throw new Error('WFIGS historical seasonal activity year/domain mismatch');
    }
    if (!Array.isArray(payload.weekly_baseline) || payload.weekly_baseline.length < 52) {
        throw new Error('WFIGS historical weekly baseline is incomplete');
    }
    if (!Array.isArray(payload.daily_cumulative_baseline) || payload.daily_cumulative_baseline.length < 365) {
        throw new Error('WFIGS historical cumulative baseline is incomplete');
    }
    return payload;
}

function wfigsTrendFetchURL(url, version) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${encodeURIComponent(version || Date.now())}`;
}

async function refreshWFIGSSeasonalActivity({force = false} = {}) {
    if (wfigsSeasonalActivityLoading) return;
    const panel = ensureWFIGSSeasonalTrendPanel();
    const body = panel.querySelector('#wfigs-trend-body');
    if (!body) return;
    if (!force && wfigsCurrentSeasonalActivity && wfigsHistoricalSeasonalActivity) {
        renderWFIGSSeasonalTrendPanel();
        return;
    }
    wfigsSeasonalActivityLoading = true;
    wfigsSeasonalActivityLastError = '';
    body.innerHTML = '<div class="wfigs-trend-status">Loading WFIGS seasonal activity data…</div>';
    try {
        const currentVersion = wfigsYTDManifest?.source_last_edit_epoch_ms || Date.now();
        const historyVersion = wfigsHistoryIndex?.generated_utc || Date.now();
        const [currentRaw, historyRaw] = await Promise.all([
            fetchWFIGSJSON(wfigsTrendFetchURL(WFIGS_YTD_ACTIVITY_URL, currentVersion)),
            fetchWFIGSJSON(wfigsTrendFetchURL(WFIGS_HISTORY_ACTIVITY_URL, historyVersion))
        ]);
        wfigsCurrentSeasonalActivity = validateWFIGSCurrentSeasonalActivity(currentRaw);
        wfigsHistoricalSeasonalActivity = validateWFIGSHistoricalSeasonalActivity(historyRaw);
    } catch (error) {
        wfigsSeasonalActivityLastError = error?.message || String(error);
        console.warn('WFIGS seasonal activity refresh failed:', error);
    } finally {
        wfigsSeasonalActivityLoading = false;
        renderWFIGSSeasonalTrendPanel();
    }
}

function openWFIGSSeasonalTrendPanel() {
    const panel = ensureWFIGSSeasonalTrendPanel();
    panel.hidden = false;
    refreshWFIGSSeasonalActivity({force: false});
}

function wfigsTrendNiceMax(value) {
    const raw = Math.max(1, Number(value) || 1);
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const scaled = raw / power;
    const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
    return nice * power;
}

function wfigsTrendMonthTicks(year) {
    const jan1 = Date.UTC(year, 0, 1);
    return Array.from({length: 12}, (_, month) => ({
        day: Math.floor((Date.UTC(year, month, 1) - jan1) / 86400000) + 1,
        label: new Date(Date.UTC(year, month, 1)).toLocaleDateString('en-US', {timeZone: 'UTC', month: 'short'})
    }));
}

function wfigsTrendDayLabel(year, day) {
    const numericDay = wfigsTrendNumericValue(day);
    if (numericDay === null || numericDay < 1) return '';
    const dateValue = new Date(Date.UTC(year, 0, 1) + (numericDay - 1) * 86400000);
    return dateValue.toLocaleDateString('en-US', {timeZone: 'UTC', month: 'short', day: 'numeric'});
}

function wfigsTrendNumericValue(value) {
    // Missing current-year dates must stay missing. Number(null) === 0 in
    // JavaScript, which previously caused the live curve to plunge to zero
    // and continue across the unobserved remainder of the calendar year.
    if (value === null || value === undefined || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
}

function wfigsTrendPolyline(points, xScale, yScale, key) {
    return points
        .map(point => ({x: wfigsTrendNumericValue(point.x), y: wfigsTrendNumericValue(point[key])}))
        .filter(point => point.x !== null && point.y !== null)
        .map(point => `${xScale(point.x).toFixed(2)},${yScale(point.y).toFixed(2)}`)
        .join(' ');
}

function wfigsTrendEnvelopePath(points, xScale, yScale, minKey, maxKey) {
    const valid = points.filter(point => Number.isFinite(Number(point[minKey])) && Number.isFinite(Number(point[maxKey])));
    if (!valid.length) return '';
    const upper = valid.map(point => `${xScale(Number(point.x)).toFixed(2)},${yScale(Number(point[maxKey])).toFixed(2)}`);
    const lower = [...valid].reverse().map(point => `${xScale(Number(point.x)).toFixed(2)},${yScale(Number(point[minKey])).toFixed(2)}`);
    return `M ${upper.join(' L ')} L ${lower.join(' L ')} Z`;
}

function renderWFIGSTrendSVG(container, points, {currentKey, medianKey, minKey, maxKey, yLabel, year, currentEndpointLabel = ''}) {
    const width = 720;
    const height = 250;
    const margin = {left: 52, right: 16, top: 14, bottom: 34};
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const daysInYear = Math.floor((Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000);
    const xMax = Math.max(daysInYear, ...points.map(point => wfigsTrendNumericValue(point.x) ?? 0));
    const values = [];
    points.forEach(point => [currentKey, medianKey, minKey, maxKey].forEach(key => {
        const value = wfigsTrendNumericValue(point[key]);
        if (value !== null) values.push(value);
    }));
    const yMax = wfigsTrendNiceMax(Math.max(...values, 1) * 1.08);
    const xScale = x => margin.left + ((x - 1) / Math.max(1, xMax - 1)) * innerW;
    const yScale = y => margin.top + innerH - (Math.max(0, y) / yMax) * innerH;
    const yTicks = Array.from({length: 5}, (_, i) => (yMax * i) / 4);
    const monthTicks = wfigsTrendMonthTicks(year);
    const envelope = wfigsTrendEnvelopePath(points, xScale, yScale, minKey, maxKey);
    const medianLine = wfigsTrendPolyline(points, xScale, yScale, medianKey);
    const currentLine = wfigsTrendPolyline(points, xScale, yScale, currentKey);
    const currentValid = points
        .map(point => ({x: wfigsTrendNumericValue(point.x), y: wfigsTrendNumericValue(point[currentKey])}))
        .filter(point => point.x !== null && point.y !== null);
    const currentLast = currentValid.length ? currentValid[currentValid.length - 1] : null;
    const endpointGuide = currentLast ? `
        <line x1="${xScale(currentLast.x)}" y1="${margin.top}" x2="${xScale(currentLast.x)}" y2="${margin.top + innerH}" stroke="rgba(255,122,69,0.34)" stroke-width="1" stroke-dasharray="4 4"/>
        <circle cx="${xScale(currentLast.x)}" cy="${yScale(currentLast.y)}" r="4" fill="#ff7a45" stroke="#111820" stroke-width="1.4"/>
        ${currentEndpointLabel ? `<text x="${Math.min(width - margin.right - 3, xScale(currentLast.x) + 6)}" y="${margin.top + 10}" text-anchor="${xScale(currentLast.x) > width - 150 ? 'end' : 'start'}" fill="#ffad87" font-size="9" font-weight="700">${escapeWFIGSHTML(currentEndpointLabel)}</text>` : ''}
    ` : '';

    const grid = yTicks.map(value => `
        <line x1="${margin.left}" y1="${yScale(value)}" x2="${width - margin.right}" y2="${yScale(value)}" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>
        <text x="${margin.left - 7}" y="${yScale(value) + 3}" text-anchor="end" fill="#91a8b4" font-size="9">${Math.round(value).toLocaleString('en-US')}</text>
    `).join('');
    const months = monthTicks.map(tick => `
        <line x1="${xScale(tick.day)}" y1="${margin.top}" x2="${xScale(tick.day)}" y2="${margin.top + innerH}" stroke="rgba(255,255,255,0.045)" stroke-width="1"/>
        <text x="${xScale(tick.day)}" y="${height - 10}" text-anchor="middle" fill="#91a8b4" font-size="9">${tick.label}</text>
    `).join('');

    container.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeWFIGSHTML(yLabel)} seasonal wildfire activity chart">
            ${grid}${months}
            <path d="${envelope}" fill="rgba(126,184,210,0.20)" stroke="rgba(126,184,210,0.34)" stroke-width="1"/>
            <polyline points="${medianLine}" fill="none" stroke="#9bdcff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
            ${endpointGuide}
            <polyline points="${currentLine}" fill="none" stroke="#ff7a45" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>
            <text transform="translate(12 ${margin.top + innerH / 2}) rotate(-90)" text-anchor="middle" fill="#a9bec8" font-size="9">${escapeWFIGSHTML(yLabel)}</text>
        </svg>
    `;
}

function renderWFIGSSeasonalTrendPanel() {
    const panel = ensureWFIGSSeasonalTrendPanel();
    const body = panel.querySelector('#wfigs-trend-body');
    if (!body) return;
    if (wfigsSeasonalActivityLastError) {
        body.innerHTML = `<div class="wfigs-trend-status"><strong>Trend data unavailable.</strong><br>${escapeWFIGSHTML(wfigsSeasonalActivityLastError)}<br><br>Run the updated YTD and Rolling 5-Year History workflows once, then use Refresh.</div>`;
        return;
    }
    const current = wfigsCurrentSeasonalActivity;
    const history = wfigsHistoricalSeasonalActivity;
    if (!current || !history) {
        body.innerHTML = '<div class="wfigs-trend-status">Seasonal activity data have not loaded yet.</div>';
        return;
    }

    const completeDay = Number(current.complete_through_day || 0);
    const cumulativeBaseline = (history.daily_cumulative_baseline || []).find(row => Number(row.day) === completeDay) || null;
    const currentTotal = Number(current.complete_through_count || 0);
    const medianYTD = Number(cumulativeBaseline?.median);
    const departure = Number.isFinite(medianYTD) ? currentTotal - medianYTD : null;
    const pct = Number.isFinite(medianYTD) && medianYTD > 0 ? (departure / medianYTD) * 100 : null;
    const historyYearValues = (history.historical_years || []).map(Number).filter(Number.isFinite);
    const historyYears = historyYearValues.length
        ? `${Math.min(...historyYearValues)}–${Math.max(...historyYearValues)}`
        : 'rolling five-year';

    const weeklyCurrent = new Map((current.weekly_completed || []).map(row => [Number(row.period), row]));
    const weeklyPoints = (history.weekly_baseline || []).map(row => ({
        x: Number(row.end_day),
        current: weeklyCurrent.get(Number(row.period))?.count ?? null,
        median: Number(row.median),
        min: Number(row.min),
        max: Number(row.max)
    }));

    let running = 0;
    const currentDaily = (current.daily_counts || []).slice(0, completeDay).map((value, index) => {
        running += Number(value) || 0;
        return {day: index + 1, cumulative: running};
    });
    const currentDailyMap = new Map(currentDaily.map(row => [row.day, row.cumulative]));
    const cumulativePoints = (history.daily_cumulative_baseline || []).map(row => ({
        x: Number(row.day),
        current: currentDailyMap.has(Number(row.day)) ? currentDailyMap.get(Number(row.day)) : null,
        median: Number(row.median),
        min: Number(row.min),
        max: Number(row.max)
    }));

    const departureText = departure === null
        ? 'Unavailable'
        : `${departure >= 0 ? '+' : ''}${Math.round(departure).toLocaleString('en-US')}${Number.isFinite(pct) ? ` (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)` : ''}`;
    const sourceTime = current.source_last_edit_utc ? formatWFIGSDateTime(current.source_last_edit_utc) : 'Unknown';
    body.innerHTML = `
        <div class="wfigs-trend-status">
            Counts through the last complete UTC day: <strong>${escapeWFIGSHTML(current.complete_through_date || 'none yet')}</strong>. Latest YTD source edit: ${escapeWFIGSHTML(sourceTime)}.
        </div>
        <div class="wfigs-trend-kpis">
            <div class="wfigs-trend-kpi">
                <div class="wfigs-trend-kpi-label">${WFIGS_CURRENT_YEAR} CONUS discoveries</div>
                <div class="wfigs-trend-kpi-value">${currentTotal.toLocaleString('en-US')}</div>
                <div class="wfigs-trend-kpi-detail">Through ${escapeWFIGSHTML(current.complete_through_date || 'last complete UTC day')}</div>
            </div>
            <div class="wfigs-trend-kpi">
                <div class="wfigs-trend-kpi-label">${escapeWFIGSHTML(historyYears)} median YTD</div>
                <div class="wfigs-trend-kpi-value">${Number.isFinite(medianYTD) ? Math.round(medianYTD).toLocaleString('en-US') : '—'}</div>
                <div class="wfigs-trend-kpi-detail">Matched season day</div>
            </div>
            <div class="wfigs-trend-kpi">
                <div class="wfigs-trend-kpi-label">Departure from median</div>
                <div class="wfigs-trend-kpi-value">${escapeWFIGSHTML(departureText)}</div>
                <div class="wfigs-trend-kpi-detail">Positive = more discoveries than recent median</div>
            </div>
        </div>
        <div class="wfigs-trend-chart-card">
            <div class="wfigs-trend-chart-title">Weekly New Wildfire Discoveries</div>
            <div class="wfigs-trend-chart-note">${WFIGS_CURRENT_YEAR} versus ${escapeWFIGSHTML(historyYears)} median and min–max range. The orange line ends at the last completed 7-day period; the incomplete current period and future dates are intentionally unplotted.</div>
            <div id="wfigs-weekly-trend-chart" class="wfigs-trend-chart"></div>
            <div class="wfigs-trend-legend">
                <span class="wfigs-trend-legend-item"><span class="wfigs-trend-swatch" style="background:#ff7a45"></span>${WFIGS_CURRENT_YEAR}</span>
                <span class="wfigs-trend-legend-item"><span class="wfigs-trend-swatch" style="background:#9bdcff"></span>${escapeWFIGSHTML(historyYears)} median</span>
                <span class="wfigs-trend-legend-item"><span class="wfigs-trend-swatch range"></span>Historical min–max</span>
            </div>
        </div>
        <div class="wfigs-trend-chart-card">
            <div class="wfigs-trend-chart-title">Cumulative YTD Wildfire Discoveries</div>
            <div class="wfigs-trend-chart-note">Daily cumulative ${WFIGS_CURRENT_YEAR} activity through the last complete UTC day versus the recent historical envelope. The orange line ends at the latest observation; future dates are intentionally unplotted.</div>
            <div id="wfigs-cumulative-trend-chart" class="wfigs-trend-chart"></div>
            <div class="wfigs-trend-legend">
                <span class="wfigs-trend-legend-item"><span class="wfigs-trend-swatch" style="background:#ff7a45"></span>${WFIGS_CURRENT_YEAR}</span>
                <span class="wfigs-trend-legend-item"><span class="wfigs-trend-swatch" style="background:#9bdcff"></span>${escapeWFIGSHTML(historyYears)} median</span>
                <span class="wfigs-trend-legend-item"><span class="wfigs-trend-swatch range"></span>Historical min–max</span>
            </div>
        </div>
        <div class="wfigs-trend-footnote">
            <strong>Metric definition:</strong> unique deduplicated WFIGS wildfire (WF) identities by Fire Discovery Date and point-of-origin state for the 48 contiguous states plus D.C. Counts are independent of geometry validity, mapped acreage, burn severity, and the number of polygons currently visible on the map. Weekly periods are seven-day bins anchored on January 1 UTC.
        </div>
    `;

    const lastWeeklyPeriod = [...weeklyCurrent.values()].sort((a, b) => Number(a.end_day) - Number(b.end_day)).at(-1) || null;
    const weeklyEndpointLabel = lastWeeklyPeriod ? `Last complete period: ${wfigsTrendDayLabel(WFIGS_CURRENT_YEAR, lastWeeklyPeriod.end_day)}` : '';
    const cumulativeEndpointLabel = current.complete_through_date
        ? `Through ${new Date(`${current.complete_through_date}T00:00:00Z`).toLocaleDateString('en-US', {timeZone: 'UTC', month: 'short', day: 'numeric'})}`
        : '';

    renderWFIGSTrendSVG(body.querySelector('#wfigs-weekly-trend-chart'), weeklyPoints, {
        currentKey: 'current', medianKey: 'median', minKey: 'min', maxKey: 'max',
        yLabel: 'New wildfire discoveries', year: WFIGS_CURRENT_YEAR, currentEndpointLabel: weeklyEndpointLabel
    });
    renderWFIGSTrendSVG(body.querySelector('#wfigs-cumulative-trend-chart'), cumulativePoints, {
        currentKey: 'current', medianKey: 'median', minKey: 'min', maxKey: 'max',
        yLabel: 'Cumulative discoveries', year: WFIGS_CURRENT_YEAR, currentEndpointLabel: cumulativeEndpointLabel
    });
}


function removeWFIGSHistoryYearLayers(year, {clearCache = false} = {}) {
    const numericYear = Number(year);
    ++wfigsHistoryViewportSerial;
    for (const [key, cached] of [...wfigsHistoryChunkCache.entries()]) {
        if (!key.startsWith(`${numericYear}/`)) continue;
        if (cached?.layer && wfigsHistoryLayerGroup.hasLayer(cached.layer)) {
            wfigsHistoryLayerGroup.removeLayer(cached.layer);
        }
        if (clearCache) wfigsHistoryChunkCache.delete(key);
    }
    wfigsHistoryVisibleSet(numericYear).clear();
    const overview = wfigsHistoryOverviewCache.get(numericYear);
    if (overview?.layer && wfigsHistoryLayerGroup.hasLayer(overview.layer)) {
        wfigsHistoryLayerGroup.removeLayer(overview.layer);
    }
    if (clearCache) {
        wfigsHistoryVisibleHrefsByYear.delete(numericYear);
        wfigsHistoryOverviewCache.delete(numericYear);
    }
}

function toggleWFIGSHistoryYear(year) {
    const numericYear = Number(year);
    if (!Number.isInteger(numericYear) || !wfigsHistoryAvailableYears().includes(numericYear)) return;
    if (wfigsHistorySelectedYears.has(numericYear)) {
        wfigsHistorySelectedYears.delete(numericYear);
        removeWFIGSHistoryYearLayers(numericYear);
    } else {
        wfigsHistorySelectedYears.add(numericYear);
    }
    updateWFIGSHistoryYearToggles();
    updateWFIGSHistoryTimeBox();
    updateLegends();
    if (map.hasLayer(wfigsHistoryLayerGroup) && wfigsHistorySelectedYears.has(numericYear)) {
        refreshWFIGSHistory({forceIndex: !wfigsHistoryIndex, forceYears: [numericYear]});
    } else if (map.hasLayer(wfigsHistoryLayerGroup)) {
        updateWFIGSHistoryViewport();
    }
}

function buildWFIGSHistoryChunkLayer(geojson, year) {
    const threshold = wfigsYTDMinimumMappedAcresForZoom();
    const suppressCurrentDuplicates = map.hasLayer(wfigsCurrentLayerGroup);
    return L.geoJSON(geojson, {
        filter: feature => {
            const properties = feature?.properties || {};
            if (suppressCurrentDuplicates && wfigsCurrentActiveFireIds.has(properties.fire_id)) return false;
            const acres = Number(properties.mapped_acres);
            if (!Number.isFinite(threshold)) return false;
            if (threshold <= 0) return true;
            return Number.isFinite(acres) && acres >= threshold;
        },
        style: () => wfigsBaseStyle('history', year),
        onEachFeature: (feature, layer) => bindWFIGSFeatureInteraction(feature, layer, 'history', year)
    });
}

async function loadWFIGSHistoryOverview(year) {
    const numericYear = Number(year);
    const cached = wfigsHistoryOverviewCache.get(numericYear);
    if (cached?.geojson) return cached;
    const manifest = wfigsHistoryManifests.get(numericYear);
    const meta = manifest?.overview;
    if (!meta?.href) throw new Error(`WFIGS ${numericYear} historical overview metadata unavailable`);
    const url = `${WFIGS_HISTORY_ROOT}/${numericYear}/${meta.href}?v=${encodeURIComponent(manifest.source_year_signature || manifest.generated_utc || '')}`;
    const geojson = validateWFIGSFeatureCollection(
        await fetchWFIGSJSON(url), meta.feature_count, `WFIGS history ${numericYear} national overview`
    );
    const entry = {year: numericYear, geojson, layer: buildWFIGSHistoryChunkLayer(geojson, numericYear), lastUsed: Date.now()};
    wfigsHistoryOverviewCache.set(numericYear, entry);
    return entry;
}

function rebuildWFIGSHistoryOverviewLayers() {
    wfigsHistorySortedSelectedYears().forEach(year => {
        const cached = wfigsHistoryOverviewCache.get(year);
        if (!cached?.geojson) return;
        if (cached.layer && wfigsHistoryLayerGroup.hasLayer(cached.layer)) wfigsHistoryLayerGroup.removeLayer(cached.layer);
        cached.layer = buildWFIGSHistoryChunkLayer(cached.geojson, year);
        if (map.hasLayer(wfigsHistoryLayerGroup) && map.getZoom() < WFIGS_ARCHIVE_CHUNK_MIN_ZOOM) {
            wfigsHistoryLayerGroup.addLayer(cached.layer);
        }
    });
}

async function loadWFIGSHistoryChunk(year, chunkMeta) {
    const numericYear = Number(year);
    const key = `${numericYear}/${chunkMeta.href}`;
    const cached = wfigsHistoryChunkCache.get(key);
    if (cached) {
        cached.lastUsed = Date.now();
        return cached;
    }
    const manifest = wfigsHistoryManifests.get(numericYear);
    if (!manifest) throw new Error(`WFIGS ${numericYear} historical manifest is not loaded`);
    const url = `${WFIGS_HISTORY_ROOT}/${numericYear}/${chunkMeta.href}?v=${encodeURIComponent(manifest.source_year_signature || manifest.generated_utc || '')}`;
    const geojson = validateWFIGSFeatureCollection(
        await fetchWFIGSJSON(url), chunkMeta.feature_count, `WFIGS history ${numericYear} ${chunkMeta.id}`
    );
    const entry = {year: numericYear, geojson, layer: buildWFIGSHistoryChunkLayer(geojson, numericYear), lastUsed: Date.now(), key};
    wfigsHistoryChunkCache.set(key, entry);
    return entry;
}

function rebuildVisibleWFIGSHistoryChunkLayers() {
    if (!map.hasLayer(wfigsHistoryLayerGroup)) return;
    if (map.getZoom() < WFIGS_ARCHIVE_CHUNK_MIN_ZOOM) {
        rebuildWFIGSHistoryOverviewLayers();
        wfigsHistoryLastDisplayThreshold = wfigsYTDMinimumMappedAcresForZoom();
        updateWFIGSHistoryTimeBox();
        return;
    }
    wfigsHistorySortedSelectedYears().forEach(year => {
        const visible = wfigsHistoryVisibleSet(year);
        [...visible].forEach(href => {
            const key = `${year}/${href}`;
            const cached = wfigsHistoryChunkCache.get(key);
            if (!cached) return;
            if (wfigsHistoryLayerGroup.hasLayer(cached.layer)) wfigsHistoryLayerGroup.removeLayer(cached.layer);
            cached.layer = buildWFIGSHistoryChunkLayer(cached.geojson, year);
            wfigsHistoryLayerGroup.addLayer(cached.layer);
        });
    });
    wfigsHistoryLastDisplayThreshold = wfigsYTDMinimumMappedAcresForZoom();
    updateWFIGSHistoryTimeBox();
}

function pruneWFIGSHistoryChunkCache(year) {
    const numericYear = Number(year);
    const entries = [...wfigsHistoryChunkCache.entries()].filter(([key]) => key.startsWith(`${numericYear}/`));
    if (entries.length <= WFIGS_HISTORY_CHUNK_CACHE_LIMIT_PER_YEAR) return;
    const visibleKeys = new Set([...wfigsHistoryVisibleSet(numericYear)].map(href => `${numericYear}/${href}`));
    const removable = entries
        .filter(([key]) => !visibleKeys.has(key))
        .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    let count = entries.length;
    while (count > WFIGS_HISTORY_CHUNK_CACHE_LIMIT_PER_YEAR && removable.length) {
        const [key, cached] = removable.shift();
        if (wfigsHistoryLayerGroup.hasLayer(cached.layer)) wfigsHistoryLayerGroup.removeLayer(cached.layer);
        wfigsHistoryChunkCache.delete(key);
        count -= 1;
    }
}

async function updateWFIGSHistoryViewport() {
    if (!map.hasLayer(wfigsHistoryLayerGroup)) return;
    const selectedYears = wfigsHistorySortedSelectedYears();
    const serial = ++wfigsHistoryViewportSerial;
    const zoom = map.getZoom();
    const threshold = wfigsYTDMinimumMappedAcresForZoom(zoom);

    if (!selectedYears.length) {
        for (const year of wfigsHistoryAvailableYears()) removeWFIGSHistoryYearLayers(year);
        wfigsHistoryLastDisplayThreshold = threshold;
        wfigsHistoryLastError = '';
        updateWFIGSHistoryTimeBox();
        return;
    }

    if (zoom < WFIGS_ARCHIVE_OVERVIEW_MIN_ZOOM) {
        selectedYears.forEach(year => removeWFIGSHistoryYearLayers(year));
        wfigsHistoryLastDisplayThreshold = threshold;
        updateWFIGSHistoryTimeBox();
        return;
    }

    if (zoom < WFIGS_ARCHIVE_CHUNK_MIN_ZOOM) {
        selectedYears.forEach(year => {
            const visible = wfigsHistoryVisibleSet(year);
            [...visible].forEach(href => {
                const cached = wfigsHistoryChunkCache.get(`${year}/${href}`);
                if (cached?.layer && wfigsHistoryLayerGroup.hasLayer(cached.layer)) wfigsHistoryLayerGroup.removeLayer(cached.layer);
            });
            visible.clear();
        });
        const results = await Promise.allSettled(selectedYears.map(loadWFIGSHistoryOverview));
        if (serial !== wfigsHistoryViewportSerial || !map.hasLayer(wfigsHistoryLayerGroup)) return;
        let failures = 0;
        results.forEach(result => {
            if (result.status !== 'fulfilled') {
                failures += 1;
                console.warn('WFIGS historical national overview load failed:', result.reason);
            }
        });
        rebuildWFIGSHistoryOverviewLayers();
        wfigsHistoryLastError = failures ? `${failures} historical overview${failures === 1 ? '' : 's'} failed to load` : '';
        wfigsHistoryLastDisplayThreshold = threshold;
        updateWFIGSHistoryTimeBox();
        return;
    }

    selectedYears.forEach(year => {
        const overview = wfigsHistoryOverviewCache.get(year);
        if (overview?.layer && wfigsHistoryLayerGroup.hasLayer(overview.layer)) wfigsHistoryLayerGroup.removeLayer(overview.layer);
    });
    const viewport = wfigsMapBBox();
    const thresholdChanged = threshold !== wfigsHistoryLastDisplayThreshold;
    if (thresholdChanged) rebuildVisibleWFIGSHistoryChunkLayers();

    const loadRequests = [];
    selectedYears.forEach(year => {
        const manifest = wfigsHistoryManifests.get(year);
        if (!manifest) return;
        const desiredChunks = manifest.chunks.filter(chunk => wfigsBBoxesIntersect(chunk.bbox, viewport));
        const desiredHrefs = new Set(desiredChunks.map(chunk => chunk.href));
        const visible = wfigsHistoryVisibleSet(year);
        [...visible].forEach(href => {
            if (desiredHrefs.has(href)) return;
            const cached = wfigsHistoryChunkCache.get(`${year}/${href}`);
            if (cached && wfigsHistoryLayerGroup.hasLayer(cached.layer)) wfigsHistoryLayerGroup.removeLayer(cached.layer);
            visible.delete(href);
        });
        desiredChunks.forEach(chunk => loadRequests.push({year, chunk}));
    });

    const results = await Promise.allSettled(
        loadRequests.map(async request => ({...request, cached: await loadWFIGSHistoryChunk(request.year, request.chunk)}))
    );
    if (serial !== wfigsHistoryViewportSerial || !map.hasLayer(wfigsHistoryLayerGroup)) return;

    let failures = 0;
    results.forEach(result => {
        if (result.status !== 'fulfilled') {
            failures += 1;
            console.warn('WFIGS historical chunk load failed:', result.reason);
            return;
        }
        const {year, chunk, cached} = result.value;
        if (!wfigsHistorySelectedYears.has(year)) return;
        if (!wfigsHistoryLayerGroup.hasLayer(cached.layer)) wfigsHistoryLayerGroup.addLayer(cached.layer);
        cached.lastUsed = Date.now();
        wfigsHistoryVisibleSet(year).add(chunk.href);
    });
    wfigsHistoryLastDisplayThreshold = threshold;
    wfigsHistoryLastError = failures ? `${failures} viewport chunk${failures === 1 ? '' : 's'} failed to load` : '';
    selectedYears.forEach(pruneWFIGSHistoryChunkCache);
    updateWFIGSHistoryTimeBox();
}

function scheduleWFIGSHistoryViewportUpdate() {
    if (!map.hasLayer(wfigsHistoryLayerGroup)) return;
    if (wfigsHistoryViewportTimer) window.clearTimeout(wfigsHistoryViewportTimer);
    wfigsHistoryViewportTimer = window.setTimeout(() => {
        wfigsHistoryViewportTimer = null;
        updateWFIGSHistoryViewport();
    }, 130);
}

async function refreshWFIGSHistory({forceIndex = false, forceYears = []} = {}) {
    if (wfigsHistoryRefreshInFlight) {
        wfigsHistoryRefreshQueued = true;
        return;
    }
    if (!map.hasLayer(wfigsHistoryLayerGroup) && !forceIndex) return;
    wfigsHistoryRefreshInFlight = true;
    try {
        const index = validateWFIGSHistoryIndex(await fetchWFIGSJSON(WFIGS_HISTORY_INDEX_URL));
        const indexVersion = computeWFIGSHistoryIndexVersion(index);
        const indexChanged = forceIndex || !wfigsHistoryIndex || indexVersion !== wfigsHistoryIndexVersion;
        const priorSelected = [...wfigsHistorySelectedYears];
        wfigsHistoryIndex = index;
        wfigsHistoryIndexVersion = indexVersion;
        const available = new Set(index.available_years.map(Number));
        wfigsHistorySelectedYears = new Set(priorSelected.filter(year => available.has(Number(year))).map(Number));
        if (priorSelected.length && !wfigsHistorySelectedYears.size) {
            wfigsHistorySelectedYears.add(Number(index.default_year));
        }
        updateWFIGSHistoryYearToggles();

        const forced = new Set((forceYears || []).map(Number));
        const manifestErrors = [];
        for (const year of wfigsHistorySortedSelectedYears()) {
            try {
                const yearManifest = validateWFIGSHistoryYearManifest(
                    await fetchWFIGSJSON(`${wfigsHistoryYearManifestURL(year)}?v=${encodeURIComponent(indexVersion)}`),
                    year
                );
                const yearVersion = String(yearManifest.source_year_signature || yearManifest.generated_utc || '');
                const previousVersion = wfigsHistoryManifestVersions.get(year) || '';
                const yearChanged = forced.has(year) || !wfigsHistoryManifests.has(year) || yearVersion !== previousVersion || indexChanged;
                if (yearChanged) removeWFIGSHistoryYearLayers(year, {clearCache: true});
                wfigsHistoryManifests.set(year, yearManifest);
                wfigsHistoryManifestVersions.set(year, yearVersion);
            } catch (error) {
                manifestErrors.push(`${year}: ${error?.message || String(error)}`);
                console.warn(`WFIGS ${year} historical manifest refresh failed; retaining loaded data:`, error);
            }
        }
        wfigsHistoryLastError = manifestErrors.join(' | ');
        await updateWFIGSHistoryViewport();
    } catch (error) {
        wfigsHistoryLastError = error?.message || String(error);
        console.warn('WFIGS historical refresh failed; retaining loaded chunks:', error);
    } finally {
        wfigsHistoryRefreshInFlight = false;
        updateWFIGSHistoryTimeBox();
        if (wfigsHistoryRefreshQueued) {
            wfigsHistoryRefreshQueued = false;
            window.setTimeout(() => refreshWFIGSHistory(), 0);
        }
    }
}

function formatWFIGSHistoryTimeBox() {
    const selectedYears = wfigsHistorySortedSelectedYears();
    if (!selectedYears.length) {
        return `
            <strong>NIFC/WFIGS Historical Wildfire Perimeters</strong><br>
            <span style="color:#ffeb3b;">No historical years selected — use the year buttons in the sidebar.</span>
        `;
    }

    const loadedYears = selectedYears.filter(year => wfigsHistoryManifests.has(year));
    if (!loadedYears.length) {
        return `
            <strong>NIFC/WFIGS Historical Wildfire Perimeters</strong><br>
            <span style="color:#ffeb3b;">${wfigsHistoryLastError ? 'Historical archive unavailable' : `Loading ${selectedYears.join(', ')} wildfire archive...`}</span>
        `;
    }

    let displayedFeatures = 0;
    let visibleChunks = 0;
    let publishedFires = 0;
    let archiveChunks = 0;
    loadedYears.forEach(year => {
        const manifest = wfigsHistoryManifests.get(year);
        publishedFires += Number(manifest?.published_fire_count || 0);
        archiveChunks += Number(manifest?.chunk_count || 0);
        const visible = wfigsHistoryVisibleSet(year);
        visibleChunks += visible.size;
        if (map.getZoom() < WFIGS_ARCHIVE_CHUNK_MIN_ZOOM) {
            const overview = wfigsHistoryOverviewCache.get(year);
            if (overview?.layer?.getLayers) displayedFeatures += overview.layer.getLayers().length;
        } else {
            visible.forEach(href => {
                const cached = wfigsHistoryChunkCache.get(`${year}/${href}`);
                if (cached?.layer?.getLayers) displayedFeatures += cached.layer.getLayers().length;
            });
        }
    });
    const yearBadges = selectedYears.map(year => {
        const color = wfigsHistoryColorForYear(year);
        return `<span style="display:inline-block;margin-right:7px;font-weight:700;color:${color};">■ ${year}</span>`;
    }).join('');
    const warning = wfigsHistoryLastError
        ? `<br><span style="color:#ffb74d;">${escapeWFIGSHTML(wfigsHistoryLastError)}; loaded data retained where available.</span>`
        : '';
    return `
        <strong>NIFC/WFIGS Historical Wildfire Perimeters</strong><br>
        <span style="font-size:0.84em;">${yearBadges}</span><br>
        <span style="font-size:0.82em;color:#d0d0d0;">Loaded archive: ${publishedFires.toLocaleString('en-US')} mapped fires in ${archiveChunks.toLocaleString('en-US')} regional chunks</span><br>
        <span style="font-size:0.82em;color:#80cbc4;">${escapeWFIGSHTML(wfigsYTDThresholdText())}</span><br>
        <span style="font-size:0.82em;color:#d0d0d0;">${map.getZoom() < WFIGS_ARCHIVE_CHUNK_MIN_ZOOM ? 'National overview' : `Viewport: ${visibleChunks.toLocaleString('en-US')} year-chunks`} &bull; ${displayedFeatures.toLocaleString('en-US')} displayed perimeters</span><br>
        <span style="font-size:0.78em;color:#aaa;">Year = Fire Discovery Date (UTC) &bull; modern WFIGS archive &bull; multiple years can be overlaid</span>${warning}
    `;
}

function updateWFIGSHistoryTimeBox() {
    const box = document.getElementById('wfigs-history-time-box');
    if (!box) return;
    if (!map.hasLayer(wfigsHistoryLayerGroup)) {
        box.style.display = 'none';
    } else {
        box.innerHTML = formatWFIGSHistoryTimeBox();
        box.style.display = 'block';
    }
    refreshLegendDockSummary();
}

function buildWFIGSLegendHTML() {
    const selectedYears = wfigsHistorySortedSelectedYears();
    const historicalLegend = selectedYears.length
        ? selectedYears.map(year => {
            const color = wfigsHistoryColorForYear(year);
            return `
                <span style="display:block;height:12px;border:2px solid ${color};background:${color}18;"></span>
                <span>${year} historical wildfire perimeters</span>`;
        }).join('')
        : `
            <span style="display:block;height:12px;border:2px solid #777;background:rgba(0,0,0,0.03);"></span>
            <span>Historical: no years selected</span>`;
    return `
        <div style="box-sizing:border-box;width:100%;background:white;padding:9px;border-radius:5px;color:black;font-family:sans-serif;">
            <strong style="display:block;font-size:13px;line-height:1.2;text-align:center;">Wildfire / Burn Scar Context</strong>
            <div style="display:grid;grid-template-columns:25px minmax(0,1fr);gap:6px 7px;align-items:center;margin-top:7px;font-size:10px;">
                <span style="display:block;height:12px;border:2px solid #ff5b3a;background:rgba(227,63,38,0.12);"></span>
                <span>Current: actively maintained WFIGS footprint</span>
                <span style="display:block;height:12px;border:2px solid #ffb000;background:rgba(255,138,0,0.10);"></span>
                <span>${WFIGS_CURRENT_YEAR} YTD: all mapped current-year footprints</span>
                ${historicalLegend}
            </div>
            <span style="display:block;margin-top:7px;font-size:9px;line-height:1.25;text-align:center;color:#555;">Mapped fire extent only — not soil-burn severity. At CONUS scale, larger archive perimeters are shown from a lightweight overview; progressively smaller burns appear as you zoom in.</span>
        </div>
    `;
}

wfigsCurrentLayerGroup.on('add', () => {
    updateWFIGSCurrentTimeBox();
    refreshWFIGSCurrent({forceManifest: !wfigsCurrentDataLayer});
    if (map.hasLayer(wfigsYTDLayerGroup)) rebuildVisibleWFIGSYTDChunkLayers();
    if (map.hasLayer(wfigsHistoryLayerGroup)) rebuildVisibleWFIGSHistoryChunkLayers();
});
wfigsCurrentLayerGroup.on('remove', () => {
    updateWFIGSCurrentTimeBox();
    if (map.hasLayer(wfigsYTDLayerGroup)) rebuildVisibleWFIGSYTDChunkLayers();
    if (map.hasLayer(wfigsHistoryLayerGroup)) rebuildVisibleWFIGSHistoryChunkLayers();
});
wfigsYTDLayerGroup.on('add', () => {
    updateWFIGSYTDTimeBox();
    refreshWFIGSYTDManifest({forceManifest: !wfigsYTDManifest});
});
wfigsYTDLayerGroup.on('remove', updateWFIGSYTDTimeBox);
wfigsHistoryLayerGroup.on('add', () => {
    updateWFIGSHistoryTimeBox();
    refreshWFIGSHistory({forceIndex: !wfigsHistoryIndex});
});
wfigsHistoryLayerGroup.on('remove', updateWFIGSHistoryTimeBox);
map.on('moveend zoomend', scheduleWFIGSYTDViewportUpdate);
map.on('moveend zoomend', scheduleWFIGSHistoryViewportUpdate);

window.setInterval(() => {
    if (map.hasLayer(wfigsCurrentLayerGroup)) refreshWFIGSCurrent();
}, WFIGS_CURRENT_MANIFEST_POLL_INTERVAL_MS);
window.setInterval(() => {
    if (map.hasLayer(wfigsYTDLayerGroup)) refreshWFIGSYTDManifest();
}, WFIGS_YTD_MANIFEST_POLL_INTERVAL_MS);
window.setInterval(() => {
    if (map.hasLayer(wfigsHistoryLayerGroup)) refreshWFIGSHistory();
}, WFIGS_HISTORY_MANIFEST_POLL_INTERVAL_MS);


let nwmLayerReady = false;
let nwmMetadata = null;
let sportLayerReady = false;
let nrcsHsgReady = false;
let nrcsHsgMetadata = null;
let nlcdImperviousReady = false;
let nlcdImperviousMetadata = null;
let nldas3StaticReady = false;
let nldas3StaticMetadata = null;
let nldas3SlopeReady = false;
let nldas3SlopeMetadata = null;


// --- DYNAMIC METADATA FETCHING AND AUTO-UPDATING ---
let rapValidTime = "Unknown";
let rapValidTimeF03 = "Unknown";
let camCycles = { href: "Unknown", refs: "Unknown" };
let camInitTimes = { href: null, refs: null };
let eroCamCycles = { href: "Unknown", refs: "Unknown" };
let eroValidRangeStr = "Unknown";
let nwmValidTime = "Unknown";
let sportValidTime = "Unknown";
let nrcsHsgSourceVintage = "Unknown";
let nlcdImperviousMapYear = "Unknown";

function fetchRAPMetadata() {
    fetch('static/rap_metadata.json?t=' + new Date().getTime())
        .then(r => r.json())
        .then(data => {
            rapValidTime = data.valid_time || "Unknown";
            rapValidTimeF03 = data.valid_time_f03 || "Unknown"; 

            const timeBox = document.getElementById('rap-time-box');
            if (timeBox && timeBox.style.display === 'block') {
                let isF03 = false;
                [pwatF03Layer, sbcapeF03Layer, mlcapeF03Layer, mucapeF03Layer, trans850F03Layer].forEach(l => {
                    if(map.hasLayer(l)) isF03 = true;
                });
                timeBox.innerHTML = `<strong>${isF03 ? rapValidTimeF03 : rapValidTime}</strong>`;
            }

            if (data.bounds) {
                const exactBounds = L.latLngBounds(data.bounds[0], data.bounds[1]);
                allRapLayers.forEach(layer => {
                    layer.setBounds(exactBounds);
                    const base = layer._url.split('?')[0]; 
                    layer.setUrl(base + '?t=' + new Date().getTime()); 
                });
            }
        })
        .catch(err => console.log("RAP metadata not found yet."));
}

function fetchCAMMetadata() {
    fetch('static/cam_metadata.json?t=' + new Date().getTime())
        .then(r => r.json())
        .then(data => {
            if (data.valid_time) {
                const match = data.valid_time.match(/HREF (\d{2})Z \| REFS (\d{2})Z/);
                if (match) {
                    camCycles.href = match[1]; 
                    camCycles.refs = match[2];
                }
            }

            const hrefInit = new Date(data.href_init_utc || '');
            const refsInit = new Date(data.refs_init_utc || '');
            camInitTimes.href = Number.isNaN(hrefInit.getTime()) ? null : hrefInit;
            camInitTimes.refs = Number.isNaN(refsInit.getTime()) ? null : refsInit;

            if (data.bounds) {
                const exactBounds = L.latLngBounds(data.bounds[0], data.bounds[1]);
                Object.values(camLayers).forEach(layer => {
                    layer.setBounds(exactBounds);
                    const base = layer._url.split('?')[0];
                    layer.setUrl(base + '?t=' + new Date().getTime());
                });
            }
        })
        .catch(err => console.log("CAM metadata not found yet."));
}

function fetchEROCAMMetadata() {
    fetch('static/ero_cam_metadata.json?t=' + new Date().getTime())
        .then(r => r.json())
        .then(data => {
            if (data.ero_window_str) eroValidRangeStr = data.ero_window_str;

            const hrefInit = new Date(data.href_init_utc || '');
            const refsInit = new Date(data.refs_init_utc || '');
            if (!Number.isNaN(hrefInit.getTime())) {
                eroCamCycles.href = String(hrefInit.getUTCHours()).padStart(2, '0');
            }
            if (!Number.isNaN(refsInit.getTime())) {
                eroCamCycles.refs = String(refsInit.getUTCHours()).padStart(2, '0');
            }

            if (data.bounds) {
                const exactBounds = L.latLngBounds(data.bounds[0], data.bounds[1]);
                Object.values(eroCamLayers).forEach(layer => {
                    layer.setBounds(exactBounds);
                    const base = layer._url.split('?')[0];
                    layer.setUrl(base + '?t=' + new Date().getTime());
                });
            }
        })
        .catch(err => console.log("ERO CAM metadata not found yet."));
}

function validateRasterBounds(bounds, productName) {
    if (
        !Array.isArray(bounds) ||
        bounds.length !== 2 ||
        !Array.isArray(bounds[0]) ||
        !Array.isArray(bounds[1]) ||
        bounds[0].length !== 2 ||
        bounds[1].length !== 2
    ) {
        throw new Error(`${productName}: invalid bounds structure`);
    }

    const south = Number(bounds[0][0]);
    const west = Number(bounds[0][1]);
    const north = Number(bounds[1][0]);
    const east = Number(bounds[1][1]);

    if (![south, west, north, east].every(Number.isFinite)) {
        throw new Error(`${productName}: non-numeric bounds`);
    }

    if (south >= north || west >= east) {
        throw new Error(`${productName}: reversed or zero-area bounds`);
    }

    if (
        south < -85.0512 ||
        north > 85.0512 ||
        west < -180 ||
        east > 180
    ) {
        throw new Error(`${productName}: bounds outside Web Mercator limits`);
    }

    return L.latLngBounds(
        [south, west],
        [north, east]
    );
}

function cacheBustedRasterUrl(baseUrl, metadata) {
    // Prefer retrieval time rather than valid time. SPoRT has the same 00Z
    // valid time all day, so using valid_time_iso can leave an older PNG in
    // browser/CDN cache after a corrected workflow rerun.
    const versionParts = [
        metadata.retrieved_time,
        metadata.generated_time_utc,
        metadata.render_revision,
        metadata.valid_time_iso,
        metadata.window_end_utc,
        Date.now()
    ].filter(Boolean);

    return `${baseUrl}?v=${encodeURIComponent(versionParts.join('-'))}`;
}

function applySoilRasterMetadata({
    metadata,
    layer,
    baseUrl,
    productName,
    opacity = 1.0
}) {
    // ImageOverlay linearly places the image in the map's projected
    // coordinate space. The PNG itself must therefore be EPSG:3857.
    const imageCrs = String(
        metadata.image_crs ||
        metadata.crs ||
        ""
    ).toUpperCase();

    if (imageCrs !== "EPSG:3857") {
        throw new Error(
            `${productName}: expected an EPSG:3857 PNG, found ` +
            `${imageCrs || "no image CRS"}`
        );
    }

    const exactBounds = validateRasterBounds(
        metadata.bounds,
        productName
    );

    layer.setBounds(exactBounds);
    layer.setUrl(
        cacheBustedRasterUrl(baseUrl, metadata)
    );
    layer.setOpacity(opacity);

    console.info(
        `${productName} raster updated`,
        {
            bounds: metadata.bounds,
            validTime: metadata.valid_time_iso,
            imageCrs
        }
    );
}


function formatMetadataUTC(value) {
    if (!value) return "Unknown";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "Unknown" : formatUTC(parsed);
}

function mrmsRalaAgeMinutes(validTime) {
    const parsed = new Date(validTime || '');
    if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
    return Math.max(0, (Date.now() - parsed.getTime()) / 60000);
}

function validateMRMSRALAManifest(manifest) {
    if (!manifest || manifest.metadata_mode !== 'mrms_rala_loop_manifest_v2') {
        throw new Error('Invalid MRMS RALA loop manifest');
    }
    if (manifest.product !== 'ReflectivityAtLowestAltitude' || manifest.region !== 'CONUS') {
        throw new Error('Unexpected MRMS RALA product or region');
    }
    if (!manifest.latest_valid_time_utc || !Array.isArray(manifest.frames) || manifest.frames.length < 2) {
        throw new Error('MRMS RALA loop manifest has an incomplete frame inventory');
    }
    if (Number(manifest.loop_window_minutes) !== 360) {
        throw new Error(`MRMS RALA archive must retain six hours, found ${manifest.loop_window_minutes}`);
    }
    if (Number(manifest.target_frame_cadence_minutes) !== MRMS_RALA_TARGET_CADENCE_MINUTES) {
        throw new Error(`MRMS RALA published cadence must remain ${MRMS_RALA_TARGET_CADENCE_MINUTES} minutes`);
    }
    const windowOptions = Array.isArray(manifest.dashboard_window_options_minutes)
        ? manifest.dashboard_window_options_minutes.map(Number)
        : [];
    if (!MRMS_RALA_WINDOW_OPTIONS_MINUTES.every(value => windowOptions.includes(value))) {
        throw new Error('MRMS RALA manifest is missing the 2/4/6-hour window options');
    }

    const display = manifest.display || {};
    if (String(display.projection || '').toUpperCase() !== 'EPSG:3857') {
        throw new Error(`MRMS RALA expected EPSG:3857 image, found ${display.projection || 'none'}`);
    }
    if (Number(display.visible_minimum_dbz) !== 5.0) {
        throw new Error(`MRMS RALA display threshold must remain 5 dBZ, found ${display.visible_minimum_dbz}`);
    }
    if (display.resampling !== 'nearest-neighbor' || display.smoothing !== false) {
        throw new Error('MRMS RALA rendering contract failed: nearest-neighbor/no-smoothing required');
    }
    if (!Array.isArray(display.color_table) || display.color_table.length < 10) {
        throw new Error('MRMS RALA color-table metadata is missing or incomplete');
    }
    const bounds = validateRasterBounds(display.leaflet_bounds, MRMS_RALA_LAYER_NAME);

    let previousTime = Number.NEGATIVE_INFINITY;
    let previousNominalTime = Number.NEGATIVE_INFINITY;
    const frames = manifest.frames.map(item => {
        const millis = new Date(item.valid_time_utc || '').getTime();
        const nominalMillis = new Date(item.nominal_time_utc || '').getTime();
        if (
            !Number.isFinite(millis) ||
            !Number.isFinite(nominalMillis) ||
            millis <= previousTime ||
            nominalMillis <= previousNominalTime ||
            !item.png
        ) {
            throw new Error('MRMS RALA loop frames/nominal slots are invalid or not strictly chronological');
        }
        previousTime = millis;
        previousNominalTime = nominalMillis;
        return {...item, timeMillis: millis, nominalMillis};
    });
    const latest = frames[frames.length - 1];
    if (latest.valid_time_utc !== manifest.latest_valid_time_utc) {
        throw new Error('MRMS RALA loop latest time does not match its final frame');
    }

    return {manifest, frames, bounds};
}

function mrmsRalaFrameUrl(frame) {
    return `${MRMS_RALA_DATA_ROOT}/${frame.png}?v=${encodeURIComponent(frame.valid_time_utc)}`;
}

function preloadMRMSRALAFrame(frame) {
    if (!frame) return Promise.reject(new Error('No MRMS RALA frame was supplied'));
    const url = mrmsRalaFrameUrl(frame);
    if (mrmsRalaPreloadCache.has(url)) return mrmsRalaPreloadCache.get(url);

    const promise = new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = async () => {
            try {
                if (typeof image.decode === 'function') await image.decode();
            } catch (_) {
                // onload already confirms the resource is usable; decode() may
                // reject for browser-specific reasons without invalidating it.
            }
            resolve(url);
        };
        image.onerror = () => reject(new Error(`MRMS RALA frame failed to preload: ${frame.valid_time_utc}`));
        image.src = url;
    }).catch(error => {
        mrmsRalaPreloadCache.delete(url);
        throw error;
    });
    mrmsRalaPreloadCache.set(url, promise);
    return promise;
}

function mrmsRalaActiveFrames() {
    if (!mrmsRalaFrames.length) return [];
    const latestNominal = mrmsRalaFrames[mrmsRalaFrames.length - 1].nominalMillis;
    const cutoff = latestNominal - mrmsRalaWindowMinutes * 60 * 1000;
    return mrmsRalaFrames.filter(frame => frame.nominalMillis >= cutoff - 1);
}

function nearestMRMSRALAFrame(timeMillis) {
    const activeFrames = mrmsRalaActiveFrames();
    if (!activeFrames.length) return null;
    const target = Number(timeMillis);
    if (!Number.isFinite(target)) return activeFrames[activeFrames.length - 1];
    let best = activeFrames[0];
    let bestDifference = Math.abs(best.timeMillis - target);
    for (let index = 1; index < activeFrames.length; index += 1) {
        const candidate = activeFrames[index];
        const difference = Math.abs(candidate.timeMillis - target);
        if (difference < bestDifference) {
            best = candidate;
            bestDifference = difference;
        }
    }
    return best;
}

function loadMRMSRALAFrameIntoLayer(layer, frame) {
    if (!layer || !frame) return Promise.reject(new Error('MRMS RALA buffer load is missing a layer or frame'));
    const url = mrmsRalaFrameUrl(frame);
    const prior = mrmsRalaLayerLoadState.get(layer);
    if (prior?.frame?.valid_time_utc === frame.valid_time_utc) {
        if (prior.loaded) return Promise.resolve({layer, frame, url});
        if (prior.promise) return prior.promise;
    }
    if (typeof prior?.cancel === 'function') prior.cancel();

    const token = Symbol(frame.valid_time_utc);
    let cancelLoad = null;
    const promise = new Promise((resolve, reject) => {
        let timeoutId = null;
        let settled = false;
        const cleanup = () => {
            if (timeoutId) window.clearTimeout(timeoutId);
            layer.off('load', onLoad);
            layer.off('error', onError);
        };
        const finishReject = error => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(error);
        };
        const onLoad = () => {
            const state = mrmsRalaLayerLoadState.get(layer);
            if (state?.token !== token || settled) return;
            settled = true;
            cleanup();
            state.loaded = true;
            state.promise = null;
            state.cancel = null;
            applyMRMSRALABrowserRendering(layer);
            resolve({layer, frame, url});
        };
        const onError = () => {
            const state = mrmsRalaLayerLoadState.get(layer);
            if (state?.token !== token) return;
            finishReject(new Error(`MRMS RALA frame failed to load into display buffer: ${frame.valid_time_utc}`));
        };

        cancelLoad = () => finishReject(new Error(`MRMS RALA buffer load superseded: ${frame.valid_time_utc}`));
        layer.on('load', onLoad);
        layer.on('error', onError);
        timeoutId = window.setTimeout(onError, 15000);
        layer.setUrl(url);
    });

    mrmsRalaLayerLoadState.set(layer, {
        token, frame, url, loaded: false, promise,
        cancel: () => cancelLoad?.()
    });
    return promise;
}

function nextMRMSRALAFrameAfter(frame) {
    const activeFrames = mrmsRalaActiveFrames();
    if (!frame || !activeFrames.length) return null;
    const index = activeFrames.findIndex(item => item.valid_time_utc === frame.valid_time_utc);
    if (index < 0) return null;
    return activeFrames[(index + 1) % activeFrames.length];
}

function primeNextMRMSRALABuffer(frame) {
    const nextFrame = nextMRMSRALAFrameAfter(frame);
    if (!nextFrame || !mrmsRalaHiddenLayer) return;
    loadMRMSRALAFrameIntoLayer(mrmsRalaHiddenLayer, nextFrame).catch(error => {
        console.debug('MRMS RALA next-frame buffer preload skipped:', error);
    });
}

async function showMRMSRALAFrame(timeMillis, {force = false} = {}) {
    if (!mrmsRalaReady || !mrmsRalaFresh) return false;
    const frame = nearestMRMSRALAFrame(timeMillis);
    if (!frame) return false;
    if (!force && mrmsRalaCurrentFrame?.valid_time_utc === frame.valid_time_utc) {
        updateMRMSRALATimeBox();
        primeNextMRMSRALABuffer(frame);
        return true;
    }

    const requestSerial = ++mrmsRalaFrameRequestSerial;
    const targetLayer = mrmsRalaHiddenLayer;
    try {
        await loadMRMSRALAFrameIntoLayer(targetLayer, frame);
        if (requestSerial !== mrmsRalaFrameRequestSerial || targetLayer !== mrmsRalaHiddenLayer) return false;

        // Swap already-loaded image buffers atomically. Every source frame is
        // displayed; speed only controls how long we wait before requesting the
        // next sequential frame.
        const opacity = Number(mrmsRalaOpacityTarget.options.opacity);
        targetLayer.setOpacity(opacity);
        mrmsRalaVisibleLayer.setOpacity(0);
        const previousVisible = mrmsRalaVisibleLayer;
        mrmsRalaVisibleLayer = targetLayer;
        mrmsRalaHiddenLayer = previousVisible;
        mrmsRalaHiddenLayer.setOpacity(0);

        mrmsRalaCurrentFrame = frame;
        applyMRMSRALABrowserRendering(mrmsRalaVisibleLayer);
        updateMRMSRALATimeBox();
        primeNextMRMSRALABuffer(frame);
        return true;
    } catch (error) {
        console.warn('MRMS RALA loop frame load failed:', error);
        return false;
    }
}

function warmMRMSRALALoopCache() {
    // Warm the HTTP cache in chronological playback order. Keep concurrency
    // modest so background prefetching does not compete with the next-frame
    // display buffer or make the initial dashboard render sluggish.
    const frames = [...mrmsRalaActiveFrames()];
    const workers = Math.min(3, frames.length);
    let nextIndex = 0;
    const worker = async () => {
        while (nextIndex < frames.length) {
            const frame = frames[nextIndex++];
            try {
                await preloadMRMSRALAFrame(frame);
            } catch (error) {
                console.debug('MRMS RALA background preload skipped:', error);
            }
        }
    };
    Promise.all(Array.from({length: workers}, worker)).catch(() => {});
}

function activateMRMSRALATimeline({jumpToLatest = true, applyDefaultSpeed = false, autoPlay = true} = {}) {
    if (!mrmsRalaFrames.length) return false;

    dashboardRadarSpeedMode = 'mrms';
    const player = dashboardTimeControl?._player;
    if (player?.isPlaying()) player.stop();

    // Each feed owns its own speed state. MRMS uses the 200-ms viewer-style
    // default, but the much lighter 10-minute archive makes the full loop visibly
    // faster without dropping any frame from the selected 2/4/6-hour window.
    if (applyDefaultSpeed) mrmsRalaFrameStepMs = MRMS_RALA_DEFAULT_FRAME_STEP_MS;
    syncMRMSRALAFrameStepControl();
    syncMRMSRALAWindowControl();
    syncRadarSpeedControlVisibility();

    const activeFrames = mrmsRalaActiveFrames();
    const times = activeFrames.map(frame => frame.timeMillis);
    map.timeDimension.setAvailableTimes(times, 'replace');
    if (jumpToLatest) map.timeDimension.setCurrentTime(times[times.length - 1]);
    else showMRMSRALAFrame(map.timeDimension.getCurrentTime());

    if (autoPlay) startMRMSRALAAnimation();
    return true;
}

function applyMRMSRALAFreshnessState() {
    const age = mrmsRalaAgeMinutes(mrmsRalaMetadata?.latest_valid_time_utc);
    mrmsRalaFresh = Boolean(
        mrmsRalaReady && Number.isFinite(age) && age <= MRMS_RALA_FRESHNESS_LIMIT_MINUTES
    );
    if (!mrmsRalaFresh) {
        mrmsRalaVisibleLayer.setOpacity(0);
        mrmsRalaHiddenLayer.setOpacity(0);
    } else if (map.hasLayer(mrmsRalaLayer)) {
        mrmsRalaVisibleLayer.setOpacity(Number(mrmsRalaOpacityTarget.options.opacity));
        mrmsRalaHiddenLayer.setOpacity(0);
    }
    updateMRMSRALATimeBox();
    return mrmsRalaFresh;
}

function formatMRMSRALATimeBox(metadata) {
    if (!metadata) {
        return `
            <strong>${MRMS_RALA_LAYER_NAME}</strong><br>
            <span style="color:#ffeb3b;">Loading official NOAA MRMS loop...</span>
        `;
    }

    const latestAge = mrmsRalaAgeMinutes(metadata.latest_valid_time_utc);
    const ageText = Number.isFinite(latestAge) ? `${latestAge.toFixed(1)} min old` : 'age unavailable';
    const opacity = Math.round(Number(mrmsRalaOpacityTarget.options.opacity) * 100);
    const currentTime = mrmsRalaCurrentFrame?.valid_time_utc || metadata.latest_valid_time_utc;
    const activeFrameCount = mrmsRalaActiveFrames().length;
    const archiveFrameCount = Number(metadata.frame_count || mrmsRalaFrames.length || 0);
    const cadence = Number(metadata.target_frame_cadence_minutes);
    const cadenceText = Number.isFinite(cadence) ? `${cadence.toFixed(0)}-min cadence` : 'MRMS cadence';
    const selectedHours = mrmsRalaWindowMinutes / 60;

    if (!mrmsRalaFresh) {
        return `
            <strong>${MRMS_RALA_LAYER_NAME}</strong><br>
            <span style="color:#ff8a80;font-weight:bold;">STALE — radar hidden</span><br>
            <span style="color:#ffeb3b;">Latest: ${formatMetadataUTC(metadata.latest_valid_time_utc)} (${ageText})</span><br>
            <span style="font-size:0.82em;color:#d0d0d0;">Waiting for a fresh NOAA MRMS update (&le; ${MRMS_RALA_FRESHNESS_LIMIT_MINUTES} min).</span>
        `;
    }

    return `
        <strong>${MRMS_RALA_LAYER_NAME}</strong><br>
        <span style="color:#4fc3f7;font-weight:bold;">Frame: ${formatMetadataUTC(currentTime)}</span><br>
        <span style="color:#ffeb3b;">Latest: ${formatMetadataUTC(metadata.latest_valid_time_utc)} &bull; ${ageText}</span><br>
        <span style="font-size:0.82em;color:#d0d0d0;">${selectedHours} h selected &bull; ${activeFrameCount} frames &bull; ${cadenceText} &bull; &ge;5 dBZ</span><br>
        <span style="font-size:0.78em;color:#b8b8b8;">6 h archive available &bull; ${archiveFrameCount} retained frames</span>
        <div style="margin-top:7px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.18);">
            <label for="mrms-rala-opacity-inline" style="display:flex;justify-content:space-between;gap:10px;font-size:0.82em;color:#e6e6e6;">
                <span>Radar opacity</span><strong id="mrms-rala-opacity-inline-value">${opacity}%</strong>
            </label>
            <input id="mrms-rala-opacity-inline" type="range" min="10" max="100" step="5" value="${opacity}" style="width:100%;margin-top:3px;">
        </div>
    `;
}

function bindMRMSRALAOpacityControl() {
    const slider = document.getElementById('mrms-rala-opacity-inline');
    if (!slider || slider.dataset.bound === '1') return;
    slider.dataset.bound = '1';
    slider.addEventListener('input', event => {
        mrmsRalaOpacityTarget.setOpacity(Number(event.target.value) / 100);
    });
}

function updateMRMSRALATimeBox() {
    const box = document.getElementById('mrms-rala-time-box');
    if (!box) return;
    if (!map.hasLayer(mrmsRalaLayer)) {
        box.style.display = 'none';
        refreshLegendDockSummary();
        return;
    }
    box.innerHTML = formatMRMSRALATimeBox(mrmsRalaMetadata);
    box.style.display = 'block';
    bindMRMSRALAOpacityControl();
    refreshLegendDockSummary();
}

function buildMRMSRALALegendHTML() {
    const table = mrmsRalaMetadata?.display?.color_table || [];
    if (!table.length) {
        return `
            <div style="box-sizing:border-box;width:100%;background:white;padding:9px;border-radius:5px;color:black;font-family:sans-serif;">
                <strong style="display:block;font-size:13px;text-align:center;">MRMS Reflectivity at Lowest Altitude</strong>
                <span style="display:block;margin-top:4px;font-size:9px;text-align:center;">Loading dBZ color scale...</span>
            </div>
        `;
    }

    const rows = table.map(item => {
        const threshold = Number(item.threshold_dbz);
        const color = item.color || '#ffffff';
        return `
            <div style="display:grid;grid-template-columns:18px minmax(0,1fr);align-items:center;gap:5px;">
                <span style="display:block;width:18px;height:10px;background:${color};border:1px solid rgba(0,0,0,0.25);"></span>
                <span style="font-size:9px;font-weight:700;line-height:1.1;">${Number.isFinite(threshold) ? threshold : '?'}+</span>
            </div>
        `;
    }).join('');

    return `
        <div style="box-sizing:border-box;width:100%;background:white;padding:9px;border-radius:5px;color:black;font-family:sans-serif;">
            <strong style="display:block;font-size:13px;line-height:1.2;text-align:center;">MRMS Reflectivity at Lowest Altitude</strong>
            <span style="display:block;margin-top:2px;font-size:9px;line-height:1.2;text-align:center;">dBZ &bull; Direct NOAA MRMS &bull; &lt;5 dBZ transparent</span>
            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 9px;margin-top:8px;">${rows}</div>
        </div>
    `;
}

function mrmsRalaManifestVersion(manifest) {
    return [manifest?.latest_valid_time_utc || '', manifest?.generated_utc || '', manifest?.frame_count || '', manifest?.target_frame_cadence_minutes || '', manifest?.generator_revision || ''].join('|');
}

async function fetchMRMSRALAManifest() {
    const response = await fetch(`${MRMS_RALA_MANIFEST_URL}?t=${Date.now()}`, {cache: 'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

async function refreshMRMSRALAFromManifest({forceMetadata = false} = {}) {
    if (mrmsRalaManifestCheckInFlight) return false;
    mrmsRalaManifestCheckInFlight = true;
    try {
        const rawManifest = await fetchMRMSRALAManifest();
        const validated = validateMRMSRALAManifest(rawManifest);
        const version = mrmsRalaManifestVersion(rawManifest);
        const changed = forceMetadata || !version || version !== mrmsRalaLastManifestVersion;

        if (changed) {
            mrmsRalaMetadata = validated.manifest;
            mrmsRalaFrames = validated.frames;
            mrmsRalaLayer.setBounds(validated.bounds);
            mrmsRalaBufferLayer.setBounds(validated.bounds);
            mrmsRalaReady = true;
            mrmsRalaLastManifestVersion = version;
            applyMRMSRALAFreshnessState();

            if (mrmsRalaFresh) {
                await preloadMRMSRALAFrame(mrmsRalaActiveFrames()[mrmsRalaActiveFrames().length - 1]);
                if (map.hasLayer(mrmsRalaLayer)) {
                    activateMRMSRALATimeline({jumpToLatest: true});
                    await showMRMSRALAFrame(map.timeDimension.getCurrentTime(), {force: true});
                }
                warmMRMSRALALoopCache();
            }
            if (typeof updateLegends === 'function') updateLegends();
            return true;
        }

        applyMRMSRALAFreshnessState();
        return false;
    } catch (error) {
        console.error('MRMS RALA loop manifest check failed:', error);
        if (!mrmsRalaReady) {
            mrmsRalaVisibleLayer.setOpacity(0);
            mrmsRalaHiddenLayer.setOpacity(0);
        }
        updateMRMSRALATimeBox();
        return false;
    } finally {
        mrmsRalaManifestCheckInFlight = false;
    }
}

function checkMRMSRALAUpdatesNow() {
    refreshMRMSRALAFromManifest();
}

window.setInterval(() => {
    if (!document.hidden) checkMRMSRALAUpdatesNow();
}, MRMS_RALA_MANIFEST_POLL_INTERVAL_MS);

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkMRMSRALAUpdatesNow();
});
window.addEventListener('focus', checkMRMSRALAUpdatesNow);
window.addEventListener('online', checkMRMSRALAUpdatesNow);

refreshMRMSRALAFromManifest({forceMetadata: true});

function formatMRMSFlashTimeBox(title, metadata) {
    if (!metadata) {
        return `
            <strong>${title}</strong><br>
            <span style="color: #ffeb3b;">Loading latest synchronized raster...</span>
        `;
    }

    const windowHours = Number(metadata.window_hours);
    const start = formatMetadataUTC(metadata.window_start_utc);
    const end = formatMetadataUTC(metadata.window_end_utc);
    const generated = formatMetadataUTC(metadata.generated_time_utc);
    const processed = Number(metadata.processed_cycles);
    const expected = Number(metadata.expected_cycles);
    const completeness = Number(metadata.completeness_fraction);
    const completenessText = (
        Number.isFinite(processed) &&
        Number.isFinite(expected) &&
        expected > 0
    )
        ? `${processed}/${expected} cycles` +
          (Number.isFinite(completeness)
              ? ` (${Math.round(completeness * 100)}%)`
              : "")
        : "Completeness unavailable";

    return `
        <strong>${title}</strong><br>
        <span style="color: #4fc3f7; font-weight: bold;">
            Rolling ${Number.isFinite(windowHours) ? windowHours : 24}-Hour Maximum
        </span><br>
        <span style="color: #ffeb3b;">${start} &mdash; ${end}</span><br>
        <span style="font-size: 0.86em;">${completenessText}</span><br>
        <span style="font-size: 0.82em; color: #d0d0d0;">Generated: ${generated}</span>
    `;
}

function updateMRMSFlashTimeBoxes() {
    const crestTimeBox = document.getElementById('mrms-crest-24h-time-box');
    if (crestTimeBox && crestTimeBox.style.display === 'block') {
        crestTimeBox.innerHTML = formatMRMSFlashTimeBox(
            'MRMS FLASH CREST Unit Q',
            mrmsCrest24hMetadata
        );
    }

    const ffdTimeBox = document.getElementById('mrms-ffd-24h-time-box');
    if (ffdTimeBox && ffdTimeBox.style.display === 'block') {
        ffdTimeBox.innerHTML = formatMRMSFlashTimeBox(
            'MRMS FLASH Flood Detector',
            mrmsFfd24hMetadata
        );
    }
}

function applyMRMSFlashRasterMetadata({
    metadata,
    layer,
    baseUrl,
    productName,
    defaultOpacity
}) {
    const grid = metadata && metadata.grid ? metadata.grid : {};
    const imageCrs = String(grid.image_crs || "").toUpperCase();

    if (metadata.metadata_mode !== "dashboard_compact") {
        throw new Error(`${productName}: metadata is not dashboard_compact`);
    }
    if (imageCrs !== "EPSG:3857") {
        throw new Error(
            `${productName}: expected an EPSG:3857 PNG, found ` +
            `${imageCrs || "no image CRS"}`
        );
    }

    const exactBounds = validateRasterBounds(
        grid.leaflet_bounds,
        productName
    );

    const normalizedMetadata = {
        generated_time_utc: metadata.generated_time_utc,
        window_end_utc: metadata.window_end_utc,
        valid_time_iso: metadata.window_end_utc
    };

    layer.setBounds(exactBounds);
    layer.setUrl(cacheBustedRasterUrl(baseUrl, normalizedMetadata));
    layer.setOpacity(defaultOpacity);

    console.info(
        `${productName} raster updated`,
        {
            bounds: grid.leaflet_bounds,
            windowStart: metadata.window_start_utc,
            windowEnd: metadata.window_end_utc,
            processedCycles: metadata.processed_cycles,
            expectedCycles: metadata.expected_cycles,
            imageCrs
        }
    );
}

async function fetchMRMSFlash24hMetadata() {
    try {
        const cacheToken = Date.now();
        const [crestResponse, ffdResponse] = await Promise.all([
            fetch(
                `${MRMS_CREST_24H_METADATA_URL}?t=${cacheToken}`,
                {cache: 'no-store'}
            ),
            fetch(
                `${MRMS_FFD_24H_METADATA_URL}?t=${cacheToken}`,
                {cache: 'no-store'}
            )
        ]);

        if (!crestResponse.ok) {
            throw new Error(`CREST metadata HTTP ${crestResponse.status}`);
        }
        if (!ffdResponse.ok) {
            throw new Error(`FFD metadata HTTP ${ffdResponse.status}`);
        }

        const [crestData, ffdData] = await Promise.all([
            crestResponse.json(),
            ffdResponse.json()
        ]);

        if (
            crestData.window_start_utc !== ffdData.window_start_utc ||
            crestData.window_end_utc !== ffdData.window_end_utc
        ) {
            throw new Error(
                'MRMS FLASH CREST and FFD rolling windows are not synchronized'
            );
        }

        const crestOpacity = mrmsCrest24hReady
            ? Number(mrmsCrest24hLayer.options.opacity ?? 0.88)
            : 0.88;
        const ffdOpacity = mrmsFfd24hReady
            ? Number(mrmsFfd24hLayer.options.opacity ?? 0.88)
            : 0.88;

        applyMRMSFlashRasterMetadata({
            metadata: crestData,
            layer: mrmsCrest24hLayer,
            baseUrl: MRMS_CREST_24H_IMAGE_URL,
            productName: 'MRMS FLASH CREST Unit Q 24-hour maximum',
            defaultOpacity: crestOpacity
        });

        applyMRMSFlashRasterMetadata({
            metadata: ffdData,
            layer: mrmsFfd24hLayer,
            baseUrl: MRMS_FFD_24H_IMAGE_URL,
            productName: 'MRMS FLASH FFD 24-hour maximum',
            defaultOpacity: ffdOpacity
        });

        mrmsCrest24hMetadata = crestData;
        mrmsFfd24hMetadata = ffdData;
        mrmsCrest24hReady = true;
        mrmsFfd24hReady = true;
        updateMRMSFlashTimeBoxes();
    } catch (error) {
        if (!mrmsCrest24hReady) mrmsCrest24hLayer.setOpacity(0);
        if (!mrmsFfd24hReady) mrmsFfd24hLayer.setOpacity(0);
        console.error('MRMS FLASH rolling 24-hour raster update failed:', error);

        const crestTimeBox = document.getElementById('mrms-crest-24h-time-box');
        if (
            crestTimeBox &&
            crestTimeBox.style.display === 'block' &&
            !mrmsCrest24hReady
        ) {
            crestTimeBox.innerHTML = `
                <strong>MRMS FLASH CREST Unit Q</strong><br>
                <span style="color: #ff8080;">Latest raster unavailable</span>
            `;
        }

        const ffdTimeBox = document.getElementById('mrms-ffd-24h-time-box');
        if (
            ffdTimeBox &&
            ffdTimeBox.style.display === 'block' &&
            !mrmsFfd24hReady
        ) {
            ffdTimeBox.innerHTML = `
                <strong>MRMS FLASH Flood Detector</strong><br>
                <span style="color: #ff8080;">Latest raster unavailable</span>
            `;
        }
    }
}


function glmCompletenessText(metadata) {
    if (!metadata) return 'Completeness unavailable';
    if (metadata.product_role === 'controlled_mosaic') {
        const inputs = metadata.satellite_inputs || {};
        return ['G18', 'G19'].map(satellite => {
            const stats = inputs[satellite] || {};
            const processed = Number(stats.processed_files);
            const expected = Number(stats.expected_files);
            const fraction = Number(stats.completeness_fraction);
            if (!Number.isFinite(processed) || !Number.isFinite(expected) || expected <= 0) {
                return `${satellite}: unavailable`;
            }
            return `${satellite}: ${processed}/${expected}` +
                (Number.isFinite(fraction) ? ` (${Math.round(fraction * 100)}%)` : '');
        }).join(' &nbsp;|&nbsp; ');
    }
    if (metadata.product_role === 'convective_trend_map') {
        const summary = metadata.input_slot_summary || {};
        const recent = `${Number(summary.recent_available_slots) || 0}/${Number(summary.recent_required_slots) || 0}`;
        const prior = `${Number(summary.prior_available_slots) || 0}/${Number(summary.prior_required_slots) || 0}`;
        const hour = Number(summary.hour_available_slots);
        return `Recent slots: ${recent} &nbsp;|&nbsp; Prior slots: ${prior}` + (Number.isFinite(hour) ? ` &nbsp;|&nbsp; Hour slots: ${hour}/12` : '');
    }
    const processed = Number(metadata.processed_files);
    const expected = Number(metadata.expected_files);
    const fraction = Number(metadata.completeness_fraction);
    if (!Number.isFinite(processed) || !Number.isFinite(expected) || expected <= 0) {
        return 'Completeness unavailable';
    }
    return `${processed}/${expected} files` +
        (Number.isFinite(fraction) ? ` (${Math.round(fraction * 100)}%)` : '');
}

function formatGLMTimeBox(config, metadata) {
    if (!metadata) {
        return `
            <strong>${config.name}</strong><br>
            <span style="color: #ffeb3b;">Loading latest GLM raster...</span>
        `;
    }
    if (config.productRole === 'source_ownership_debug') {
        const geometry = metadata.satellite_geometry || {};
        const seam = Number(geometry.nominal_equal_angle_seam_longitude);
        return `
            <strong>${config.name}</strong><br>
            <span style="color: #4fc3f7; font-weight: bold;">Exclusive source assignment</span><br>
            <span style="color: #ffeb3b;">Nominal seam: ${Number.isFinite(seam) ? `${Math.abs(seam).toFixed(1)}°W` : 'Unknown'}</span><br>
            <span style="font-size: 0.82em; color: #d0d0d0;">Generated: ${formatMetadataUTC(metadata.generated_time_utc)}</span>
        `;
    }
    const start = formatMetadataUTC(metadata.window_start_utc);
    const end = formatMetadataUTC(metadata.window_end_utc);
    const maximum = Number(metadata.maximum_value);
    return `
        <strong>${config.name}</strong><br>
        <span style="color: #ffeb3b;">${start} &mdash; ${end}</span><br>
        <span style="font-size: 0.86em;">${glmCompletenessText(metadata)}</span><br>
        <span style="font-size: 0.86em; color: #4fc3f7;">Maximum: ${Number.isFinite(maximum) ? maximum : 'Unknown'}</span><br>
        <span style="font-size: 0.82em; color: #d0d0d0;">Generated: ${formatMetadataUTC(metadata.generated_time_utc)}</span>
    `;
}

function prepareGLMRasterMetadata(config, metadata) {
    if (!metadata || metadata.metadata_mode !== 'glm_dashboard_v1') {
        throw new Error(`${config.name}: invalid GLM metadata mode`);
    }
    if (metadata.product_role !== config.productRole) {
        throw new Error(`${config.name}: unexpected product role ${metadata.product_role}`);
    }
    if (config.productRole === 'controlled_mosaic') {
        const method = metadata.mosaic_method || {};
        if (
            method.summation !== false ||
            method.averaging !== false ||
            method.blending !== false ||
            method.secondary_source_gap_fill !== false
        ) {
            throw new Error(`${config.name}: controlled-mosaic safeguards failed`);
        }
    }
    metadata.rendering = validateGLMRenderingMetadata(metadata, config.name);
    const grid = metadata.grid || {};
    const imageCrs = String(grid.image_crs || '').toUpperCase();
    if (imageCrs !== 'EPSG:3857') {
        throw new Error(`${config.name}: expected EPSG:3857 PNG, found ${imageCrs || 'none'}`);
    }
    const bounds = validateRasterBounds(grid.leaflet_bounds, config.name);
    const currentOpacity = glmReadyNames.has(config.name)
        ? Number(config.layer.options.opacity ?? config.defaultOpacity)
        : Number(metadata.default_opacity ?? config.defaultOpacity);
    let rasterUrl = cacheBustedRasterUrl(config.imageUrl, {
        generated_time_utc: metadata.generated_time_utc,
        valid_time_iso: metadata.window_end_utc || metadata.generated_time_utc
    });
    if (config.embeddedImageField) {
        const encoded = metadata?.[config.embeddedImageField];
        if (typeof encoded !== 'string' || encoded.length < 100) {
            throw new Error(`${config.name}: embedded trend PNG missing from metadata`);
        }
        rasterUrl = `data:image/png;base64,${encoded}`;
    }
    return {
        config,
        metadata,
        bounds,
        rasterUrl,
        opacity: Number.isFinite(currentOpacity) ? currentOpacity : config.defaultOpacity
    };
}

function commitGLMRasterMetadata(prepared) {
    const {config, metadata, bounds, rasterUrl, opacity} = prepared;
    config.layer.setBounds(bounds);
    config.layer.setUrl(rasterUrl);
    config.layer.setOpacity(opacity);
    glmMetadataByName.set(config.name, metadata);
    glmReadyNames.add(config.name);
}

function applyGLMRasterMetadata(config, metadata) {
    commitGLMRasterMetadata(prepareGLMRasterMetadata(config, metadata));
}

function updateGLMTimeBox(preferredName = null) {
    const timeBox = document.getElementById('glm-time-box');
    if (!timeBox) return;
    let config = preferredName ? glmConfigByName.get(preferredName) : null;
    if (!config || !map.hasLayer(config.layer)) {
        config = GLM_LAYER_CONFIGS.find(item => map.hasLayer(item.layer)) || null;
    }
    if (!config) {
        timeBox.style.display = 'none';
        refreshLegendDockSummary();
        return;
    }
    timeBox.innerHTML = formatGLMTimeBox(config, glmMetadataByName.get(config.name));
    timeBox.style.display = 'block';
    refreshLegendDockSummary();
}


function getGLMTrendPayload() {
    for (const config of GLM_LAYER_CONFIGS) {
        const trend = glmMetadataByName.get(config.name)?.convective_trend;
        if (trend && trend.metadata_mode === 'glm_convective_trend_v1') return trend;
    }
    return null;
}

function readGLMTrendDomain(payload) {
    let stored = '';
    try {
        stored = window.sessionStorage.getItem(GLM_TREND_SESSION_KEY) || '';
    } catch (error) {
        stored = '';
    }
    if (stored && payload?.domains?.[stored]) return stored;
    const fallback = payload?.default_domain_id || 'conus';
    return payload?.domains?.[fallback] ? fallback : Object.keys(payload?.domains || {})[0];
}

function writeGLMTrendDomain(domainId) {
    try {
        window.sessionStorage.setItem(GLM_TREND_SESSION_KEY, domainId);
    } catch (error) {
        // Session storage is optional; the selected domain still works in-page.
    }
}

function formatGLMTrendInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number).toLocaleString() : '—';
}

function formatGLMTrendPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    const rounded = Math.round(number);
    return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

function buildGLMTrendSparkline(series, color) {
    const width = 280;
    const height = 68;
    const paddingX = 4;
    const paddingY = 7;
    const values = (series || []).map(item => {
        const value = Number(item?.flash_extent_contributions);
        return item?.available && Number.isFinite(value) ? value : null;
    });
    const finite = values.filter(value => value !== null);
    if (!finite.length) {
        return '<div style="padding:22px 0;color:#91a6b6;font-size:9px;text-align:center;">Trend history unavailable</div>';
    }

    const minimum = Math.min(...finite);
    const maximum = Math.max(...finite);
    const span = Math.max(1, maximum - minimum);
    const xFor = index => paddingX + (
        (width - (2 * paddingX)) * index / Math.max(1, values.length - 1)
    );
    const yFor = value => paddingY + (
        (height - (2 * paddingY)) * (1 - ((value - minimum) / span))
    );

    const segments = [];
    let current = [];
    values.forEach((value, index) => {
        if (value === null) {
            if (current.length) segments.push(current);
            current = [];
            return;
        }
        current.push(`${xFor(index).toFixed(1)},${yFor(value).toFixed(1)}`);
    });
    if (current.length) segments.push(current);

    const lines = segments.map(points => (
        `<polyline points="${points.join(' ')}" fill="none" stroke="${color}" ` +
        'stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />'
    )).join('');
    const points = values.map((value, index) => value === null ? '' : (
        `<circle cx="${xFor(index).toFixed(1)}" cy="${yFor(value).toFixed(1)}" ` +
        `r="${index === values.length - 1 ? 3.1 : 1.7}" fill="${color}" />`
    )).join('');

    return `
        <svg viewBox="0 0 ${width} ${height}" width="100%" height="68" role="img" aria-label="Sixty-minute GLM convective trend history">
            <line x1="4" y1="34" x2="276" y2="34" stroke="rgba(255,255,255,0.09)" stroke-width="1" />
            ${lines}${points}
        </svg>
    `;
}

function updateGLMTrendCard() {
    const card = document.getElementById('glm-trend-card');
    if (!card) return;
    const hasActiveGLM = GLM_LAYER_CONFIGS.some(config => map.hasLayer(config.layer));
    if (!hasActiveGLM) {
        card.style.display = 'none';
        card.innerHTML = '';
        refreshLegendDockSummary();
        return;
    }

    card.style.display = 'block';
    const payload = getGLMTrendPayload();
    if (!payload) {
        card.innerHTML = `
            <div class="glm-trend-card__header">
                <div>
                    <div class="glm-trend-card__kicker">Real-Time Diagnostic</div>
                    <div class="glm-trend-card__title">GLM Convective Trend</div>
                </div>
            </div>
            <div class="glm-trend-card__body" style="color:#ffdf7e;font-size:10px;line-height:1.35;">
                Trend metadata will populate after the next GLM generator update.
            </div>
        `;
        refreshLegendDockSummary();
        return;
    }

    const selectedId = readGLMTrendDomain(payload);
    const selected = payload.domains?.[selectedId];
    if (!selected) {
        card.innerHTML = '<div class="glm-trend-card__body">GLM trend domain unavailable.</div>';
        refreshLegendDockSummary();
        return;
    }

    const presentation = GLM_TREND_STATE_PRESENTATION[selected.classification]
        || GLM_TREND_STATE_PRESENTATION.insufficient_data;
    const options = (payload.domain_order || Object.keys(payload.domains)).map(domainId => {
        const domain = payload.domains[domainId];
        return `<option value="${escapeGLMLegendText(domainId)}"${domainId === selectedId ? ' selected' : ''}>${escapeGLMLegendText(domain.label)}</option>`;
    }).join('');

    const leaderId = payload.leading_increase_domain_id;
    const leader = leaderId ? payload.domains?.[leaderId] : null;
    const highestId = payload.highest_activity_domain_id;
    const highest = highestId ? payload.domains?.[highestId] : null;
    let regionalLine = '<strong>Regional signal:</strong> No UFVS domain is currently classified as increasing.';
    if (leader) {
        regionalLine = `<strong>Strongest acceleration:</strong> ${escapeGLMLegendText(leader.label)} (${formatGLMTrendPercent(leader.symmetric_change_percent)}).`;
    } else if (highest) {
        regionalLine = `<strong>Highest recent activity:</strong> ${escapeGLMLegendText(highest.label)}.`;
    }

    card.innerHTML = `
        <div class="glm-trend-card__header">
            <div>
                <div class="glm-trend-card__kicker">Real-Time Diagnostic</div>
                <div class="glm-trend-card__title">GLM Convective Trend</div>
            </div>
            <select id="glm-trend-domain-select" class="glm-trend-card__select" aria-label="Select GLM trend domain">
                ${options}
            </select>
        </div>
        <div class="glm-trend-card__body">
            <div class="glm-trend-card__state-row">
                <span class="glm-trend-card__state" style="color:${presentation.color};background:${presentation.background};">
                    <span aria-hidden="true">${presentation.symbol}</span>
                    ${escapeGLMLegendText(presentation.label)}
                </span>
                <div class="glm-trend-card__change">
                    ${formatGLMTrendPercent(selected.symmetric_change_percent)}
                    <span class="glm-trend-card__change-label">15-min change</span>
                </div>
            </div>
            <div class="glm-trend-card__sparkline">
                ${buildGLMTrendSparkline(selected.series, presentation.color)}
                <div class="glm-trend-card__axis"><span>−60 min</span><span>Latest 5 min</span></div>
            </div>
            <div class="glm-trend-card__metrics">
                <div class="glm-trend-card__metric">
                    <div class="glm-trend-card__metric-value">${formatGLMTrendInteger(selected.latest_value)}</div>
                    <div class="glm-trend-card__metric-label">Current 5-min contributions</div>
                </div>
                <div class="glm-trend-card__metric">
                    <div class="glm-trend-card__metric-value">${formatGLMTrendInteger(selected.latest_active_grid_cells)}</div>
                    <div class="glm-trend-card__metric-label">Active grid cells</div>
                </div>
                <div class="glm-trend-card__metric">
                    <div class="glm-trend-card__metric-value">${formatGLMTrendInteger(selected.peak_value_last_60min)}</div>
                    <div class="glm-trend-card__metric-label">60-min peak</div>
                </div>
            </div>
            <div class="glm-trend-card__regional">${regionalLine}</div>
            <div class="glm-trend-card__footnote">
                Controlled-mosaic five-minute flash-extent contributions. The map layer shows local gridcell trend classifications plus muted gray past-hour lightning context, while this card summarizes the selected domain. Classification compares the newest 15-minute neighborhood sum with the preceding 15-minute neighborhood sum. Valid through ${formatMetadataUTC(payload.window_end_utc)}.
            </div>
        </div>
    `;

    const selector = card.querySelector('#glm-trend-domain-select');
    if (selector) {
        selector.addEventListener('change', event => {
            writeGLMTrendDomain(event.target.value);
            updateGLMTrendCard();
        });
    }
    refreshLegendDockSummary();
}

async function fetchGLMMetadata(configs = GLM_LAYER_CONFIGS, options = {}) {
    const expectedWindowEnd = options?.expectedWindowEnd || null;
    const requireComplete = Boolean(options?.requireComplete);
    const cacheToken = Date.now();
    const results = await Promise.allSettled(configs.map(async config => {
        const response = await fetch(`${config.metadataUrl}?t=${cacheToken}`, {cache: 'no-store'});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const metadata = await response.json();
        return prepareGLMRasterMetadata(config, metadata);
    }));

    const preparedRecords = [];
    results.forEach((result, index) => {
        const config = configs[index];
        if (result.status === 'fulfilled') {
            preparedRecords.push(result.value);
            return;
        }
        if (!glmReadyNames.has(config.name)) config.layer.setOpacity(0);
        console.error(`GLM raster update failed for ${config.name}:`, result.reason);
    });

    if (requireComplete && preparedRecords.length !== configs.length) {
        return false;
    }

    const operationalRequested = configs.filter(config => !config.debug);
    const operationalPrepared = preparedRecords.filter(item => !item.config.debug);
    const operationalEnds = operationalPrepared
        .map(item => item.metadata.window_end_utc)
        .filter(Boolean);

    if (
        expectedWindowEnd &&
        operationalPrepared.some(item => item.metadata.window_end_utc !== expectedWindowEnd)
    ) {
        console.warn('GOES GLM files are still propagating through GitHub Pages; retaining the previous package.');
        return false;
    }

    if (
        operationalPrepared.length === operationalRequested.length &&
        operationalEnds.length === operationalRequested.length &&
        new Set(operationalEnds).size !== 1
    ) {
        console.error('GOES GLM operational products are not synchronized:', operationalEnds);
        return false;
    }

    preparedRecords.forEach(commitGLMRasterMetadata);
    updateGLMTimeBox();
    updateGLMTrendCard();
    if (typeof updateLegends === 'function') updateLegends();
    return preparedRecords.length > 0 && (!requireComplete || preparedRecords.length === configs.length);
}

function glmManifestVersion(manifest) {
    return [manifest?.window_end_utc || '', manifest?.generated_time_utc || ''].join('|');
}

function waitForGLMRefresh(milliseconds) {
    return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

async function fetchGLMManifest() {
    const response = await fetch(`${GLM_MANIFEST_URL}?t=${Date.now()}`, {cache: 'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();
    if (!manifest || manifest.metadata_mode !== 'glm_dashboard_v1' || !manifest.window_end_utc) {
        throw new Error('Invalid GLM manifest');
    }
    return manifest;
}

async function refreshGLMFromManifest({forceMetadata = false} = {}) {
    if (glmManifestCheckInFlight) return false;
    glmManifestCheckInFlight = true;
    try {
        const manifest = await fetchGLMManifest();
        const version = glmManifestVersion(manifest);
        if (!forceMetadata && version && version === glmLastManifestVersion) {
            return false;
        }

        for (const delay of GLM_MANIFEST_RETRY_DELAYS_MS) {
            if (delay > 0) await waitForGLMRefresh(delay);
            const refreshed = await fetchGLMMetadata(GLM_LAYER_CONFIGS, {
                expectedWindowEnd: manifest.window_end_utc,
                requireComplete: true
            });
            if (refreshed) {
                glmLastManifestVersion = version;
                return true;
            }
        }
        console.warn('GOES GLM manifest changed, but the complete synchronized package is not available yet.');
        return false;
    } catch (error) {
        console.error('GOES GLM manifest check failed:', error);
        if (forceMetadata && glmReadyNames.size === 0) {
            return fetchGLMMetadata(GLM_LAYER_CONFIGS, {requireComplete: true});
        }
        return false;
    } finally {
        glmManifestCheckInFlight = false;
    }
}

function checkGLMUpdatesNow() {
    refreshGLMFromManifest();
}

window.setInterval(() => {
    if (!document.hidden) checkGLMUpdatesNow();
}, GLM_MANIFEST_POLL_INTERVAL_MS);

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkGLMUpdatesNow();
});
window.addEventListener('focus', checkGLMUpdatesNow);
window.addEventListener('online', checkGLMUpdatesNow);


function validateLightningCastBounds(bounds) {
    if (!Array.isArray(bounds) || bounds.length !== 2) {
        throw new Error('LightningCast metadata has invalid Leaflet bounds');
    }
    const south = Number(bounds[0]?.[0]);
    const west = Number(bounds[0]?.[1]);
    const north = Number(bounds[1]?.[0]);
    const east = Number(bounds[1]?.[1]);
    if (![south, west, north, east].every(Number.isFinite) || south >= north || west >= east) {
        throw new Error('LightningCast metadata has malformed geographic bounds');
    }
    return [[south, west], [north, east]];
}

function validateLightningCastMetadata(metadata, expectedScanTime = null) {
    if (!metadata || metadata.metadata_mode !== 'lightningcast_dashboard_v1e') {
        throw new Error('Invalid LightningCast metadata mode');
    }
    if (metadata.product_role !== 'probability_of_lightning_next_60_minutes') {
        throw new Error(`Unexpected LightningCast product role: ${metadata.product_role}`);
    }
    const thresholds = metadata.probability_thresholds_percent || [];
    if (JSON.stringify(thresholds) !== JSON.stringify([10, 30, 50, 70, 90])) {
        throw new Error('LightningCast probability threshold contract failed');
    }
    if (expectedScanTime && metadata.scan_time_utc !== expectedScanTime) {
        throw new Error(`LightningCast scan mismatch: expected ${expectedScanTime}, found ${metadata.scan_time_utc}`);
    }
    const rendering = metadata.rendering || {};
    if (String(rendering.image_crs || '').toUpperCase() !== 'EPSG:3857') {
        throw new Error(`LightningCast expected EPSG:3857 image, found ${rendering.image_crs || 'none'}`);
    }
    if (rendering.contour_lines_only !== true || rendering.polygon_fill_inference !== false) {
        throw new Error('LightningCast contour-only rendering contract failed');
    }
    const rgb = rendering.source_threshold_rgb || [];
    if (!Array.isArray(rgb) || rgb.length !== 5) {
        throw new Error('LightningCast source-color contract failed');
    }
    const ownership = metadata.satellite_ownership || {};
    if (
        ownership.summation !== false ||
        ownership.averaging !== false ||
        ownership.blending !== false ||
        ownership.gap_fill !== false ||
        ownership.cross_boundary_geometry_clipping !== false ||
        ownership.cross_threshold_family_splitting !== false ||
        ownership.cross_satellite_family_splitting !== false
    ) {
        throw new Error('LightningCast source-ownership safeguards failed');
    }
    return {
        metadata,
        bounds: validateLightningCastBounds(rendering.leaflet_bounds)
    };
}

function lightningCastRasterUrl(metadata) {
    const version = encodeURIComponent(metadata.generated_time_utc || metadata.scan_time_utc || Date.now());
    return `${LIGHTNINGCAST_IMAGE_URL}?v=${version}`;
}

function preloadLightningCastImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(url);
        image.onerror = () => reject(new Error('LightningCast raster failed to preload'));
        image.src = url;
    });
}

async function fetchLightningCastMetadata({expectedScanTime = null} = {}) {
    const response = await fetch(`${LIGHTNINGCAST_METADATA_URL}?t=${Date.now()}`, {cache: 'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const metadata = await response.json();
    const validated = validateLightningCastMetadata(metadata, expectedScanTime);
    const rasterUrl = lightningCastRasterUrl(metadata);
    await preloadLightningCastImage(rasterUrl);

    const currentOpacity = Number(lightningCastLayer.options?.opacity);
    lightningCastLayer.setBounds(validated.bounds);
    lightningCastLayer.setUrl(rasterUrl);
    lightningCastLayer.setOpacity(
        lightningCastReady && Number.isFinite(currentOpacity) ? currentOpacity : 1.0
    );
    lightningCastMetadata = metadata;
    lightningCastReady = true;
    updateLightningCastTimeBox();
    if (typeof updateLegends === 'function') updateLegends();
    return true;
}

function formatLightningCastTimeBox(metadata) {
    if (!metadata) {
        return `
            <strong>${LIGHTNINGCAST_LAYER_NAME}</strong><br>
            <span style="color:#ffeb3b;">Loading latest LightningCast contours...</span>
        `;
    }
    return `
        <strong>${LIGHTNINGCAST_LAYER_NAME}</strong><br>
        <span style="color:#4fc3f7;font-weight:bold;">Scan: ${formatMetadataUTC(metadata.scan_time_utc)}</span><br>
        <span style="color:#ffeb3b;">Probability window: ${formatMetadataUTC(metadata.forecast_window_start_utc)} &mdash; ${formatMetadataUTC(metadata.forecast_window_end_utc)}</span><br>
        <span style="font-size:0.82em;color:#d0d0d0;">LightningCast data courtesy CIMSS/SSEC</span>
    `;
}

function updateLightningCastTimeBox() {
    const box = document.getElementById('lightningcast-time-box');
    if (!box) return;
    if (!map.hasLayer(lightningCastLayer)) {
        box.style.display = 'none';
        refreshLegendDockSummary();
        return;
    }
    box.innerHTML = formatLightningCastTimeBox(lightningCastMetadata);
    box.style.display = 'block';
    refreshLegendDockSummary();
}

function buildLightningCastLegendHTML() {
    const thresholds = lightningCastMetadata?.probability_thresholds_percent || [10, 30, 50, 70, 90];
    const colors = lightningCastMetadata?.rendering?.source_threshold_rgb || [
        [80, 201, 134], [255, 255, 81], [255, 192, 108], [255, 80, 80], [255, 80, 255]
    ];
    const rows = thresholds.map((threshold, index) => {
        const rgb = colors[index] || [255, 255, 255];
        return `
            <div style="display:grid;grid-template-columns:28px minmax(0,1fr);align-items:center;gap:7px;">
                <span style="display:block;width:26px;height:0;border-top:3px solid rgb(${rgb[0]},${rgb[1]},${rgb[2]});"></span>
                <span style="font-size:10px;font-weight:700;line-height:1.15;">${threshold}%</span>
            </div>
        `;
    }).join('');
    return `
        <div style="box-sizing:border-box;width:100%;background:white;padding:9px;border-radius:5px;color:black;font-family:sans-serif;">
            <strong style="display:block;font-size:13px;line-height:1.2;text-align:center;">CIMSS/SSEC LightningCast</strong>
            <span style="display:block;margin-top:2px;font-size:9px;line-height:1.2;text-align:center;">Probability of lightning in the next 60 minutes</span>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 14px;margin-top:8px;">${rows}</div>
            <span style="display:block;margin-top:7px;font-size:8px;line-height:1.2;text-align:center;color:#333;">LightningCast data courtesy CIMSS/SSEC</span>
        </div>
    `;
}

function lightningCastManifestVersion(manifest) {
    return [manifest?.scan_time_utc || '', manifest?.generated_time_utc || ''].join('|');
}

function waitForLightningCastRefresh(milliseconds) {
    return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

async function fetchLightningCastManifest() {
    const response = await fetch(`${LIGHTNINGCAST_MANIFEST_URL}?t=${Date.now()}`, {cache: 'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();
    if (
        !manifest ||
        manifest.manifest_mode !== 'lightningcast_dashboard_manifest_v1' ||
        !manifest.scan_time_utc
    ) {
        throw new Error('Invalid LightningCast manifest');
    }
    return manifest;
}

async function refreshLightningCastFromManifest({forceMetadata = false} = {}) {
    if (lightningCastManifestCheckInFlight) return false;
    lightningCastManifestCheckInFlight = true;
    try {
        const manifest = await fetchLightningCastManifest();
        const version = lightningCastManifestVersion(manifest);
        if (!forceMetadata && version && version === lightningCastLastManifestVersion) return false;

        for (const delay of LIGHTNINGCAST_MANIFEST_RETRY_DELAYS_MS) {
            if (delay > 0) await waitForLightningCastRefresh(delay);
            try {
                await fetchLightningCastMetadata({expectedScanTime: manifest.scan_time_utc});
                lightningCastLastManifestVersion = version;
                return true;
            } catch (error) {
                console.warn('LightningCast package not synchronized yet:', error);
            }
        }
        console.warn('LightningCast manifest changed, but the synchronized raster package is not available yet.');
        return false;
    } catch (error) {
        console.error('LightningCast manifest check failed:', error);
        if (forceMetadata && !lightningCastReady) {
            try {
                return await fetchLightningCastMetadata();
            } catch (fallbackError) {
                console.error('Initial LightningCast metadata fetch failed:', fallbackError);
            }
        }
        return false;
    } finally {
        lightningCastManifestCheckInFlight = false;
    }
}

function checkLightningCastUpdatesNow() {
    refreshLightningCastFromManifest();
}

window.setInterval(() => {
    if (!document.hidden) checkLightningCastUpdatesNow();
}, LIGHTNINGCAST_MANIFEST_POLL_INTERVAL_MS);

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkLightningCastUpdatesNow();
});
window.addEventListener('focus', checkLightningCastUpdatesNow);
window.addEventListener('online', checkLightningCastUpdatesNow);


function validateHRRRTLEMetadata(metadata, expectedCycle = null, expectedHRRRCycle = null) {
    if (!metadata || metadata.metadata_mode !== 'hrrr_tle_dashboard_v3_3') {
        throw new Error('Invalid HRRR-TLE metadata contract');
    }
    if (String(metadata.algorithm_version) !== '3.3') {
        throw new Error('Unexpected HRRR-TLE algorithm version');
    }
    if (Number(metadata.members_available) !== 6) {
        throw new Error(`HRRR-TLE dashboard requires 6/6 members; got ${metadata.members_available}`);
    }
    if (expectedCycle && metadata.latest_cycle_utc !== expectedCycle) {
        throw new Error(
            `HRRR-TLE package not synchronized: expected ${expectedCycle}, got ${metadata.latest_cycle_utc}`
        );
    }
    if (
        expectedHRRRCycle &&
        metadata.latest_hrrr_diagnostic_cycle_utc !== expectedHRRRCycle
    ) {
        throw new Error(
            `Latest-HRRR diagnostics not synchronized: expected ${expectedHRRRCycle}, got ${metadata.latest_hrrr_diagnostic_cycle_utc}`
        );
    }
    const bounds = metadata.bounds;
    if (
        !Array.isArray(bounds) || bounds.length !== 2 ||
        !Array.isArray(bounds[0]) || !Array.isArray(bounds[1]) ||
        bounds[0].length !== 2 || bounds[1].length !== 2
    ) {
        throw new Error('HRRR-TLE metadata contains invalid Leaflet bounds');
    }
    if (!metadata.layers || Object.keys(metadata.layers).length !== HRRR_ALL_LAYER_CONFIGS.length) {
        throw new Error('HRRR-TLE metadata layer inventory is incomplete');
    }
    return metadata;
}

function hrrrTLERasterUrl(config, metadata) {
    const version = encodeURIComponent(metadata.generated_utc || metadata.latest_cycle_utc || Date.now());
    const published = metadata.layers?.[config.key]?.file || config.file;
    return `static/${published}?v=${version}`;
}

function preloadDashboardRaster(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(url);
        image.onerror = () => reject(new Error(`Dashboard raster failed to preload: ${url}`));
        image.src = url;
    });
}

async function fetchHRRRTLEMetadata({expectedCycle = null, expectedHRRRCycle = null} = {}) {
    const response = await fetch(`${HRRR_TLE_METADATA_URL}?t=${Date.now()}`, {cache: 'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const metadata = validateHRRRTLEMetadata(await response.json(), expectedCycle, expectedHRRRCycle);
    const urls = HRRR_ALL_LAYER_CONFIGS.map(config => hrrrTLERasterUrl(config, metadata));

    // Preload the entire synchronized package before swapping any layer URL.
    await Promise.all(urls.map(preloadDashboardRaster));

    HRRR_ALL_LAYER_CONFIGS.forEach((config, index) => {
        const currentOpacity = Number(config.layer.options?.opacity);
        config.layer.setBounds(metadata.bounds);
        config.layer.setUrl(urls[index]);
        config.layer.setOpacity(
            hrrrTLEReady && Number.isFinite(currentOpacity) ? currentOpacity : 1.0
        );
    });

    hrrrTLEMetadata = metadata;
    hrrrTLEReady = true;
    updateHRRRDiagnosticTimeBox();
    updateHRRRTLETimeBox();
    if (typeof updateLegends === 'function') updateLegends();
    return true;
}

function hrrrTLEManifestVersion(manifest) {
    return [
        manifest?.latest_hrrr_diagnostic_cycle_utc || '',
        manifest?.hrrr_diagnostic_valid_end_utc || '',
        manifest?.latest_cycle_utc || '',
        manifest?.common_valid_end_utc || '',
        manifest?.generated_utc || ''
    ].join('|');
}

async function fetchHRRRTLEManifest() {
    const response = await fetch(`${HRRR_TLE_MANIFEST_URL}?t=${Date.now()}`, {cache: 'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();
    if (
        !manifest ||
        manifest.metadata_mode !== 'hrrr_tle_dashboard_manifest_v1' ||
        String(manifest.algorithm_version) !== '3.3' ||
        !manifest.latest_cycle_utc
    ) {
        throw new Error('Invalid HRRR-TLE manifest');
    }
    return manifest;
}

async function refreshHRRRTLEFromManifest({forceMetadata = false} = {}) {
    if (hrrrTLEManifestCheckInFlight) return false;
    hrrrTLEManifestCheckInFlight = true;
    try {
        const manifest = await fetchHRRRTLEManifest();
        const version = hrrrTLEManifestVersion(manifest);
        if (!forceMetadata && version === hrrrTLELastManifestVersion) return false;
        await fetchHRRRTLEMetadata({
            expectedCycle: manifest.latest_cycle_utc,
            expectedHRRRCycle: manifest.latest_hrrr_diagnostic_cycle_utc
        });
        hrrrTLELastManifestVersion = version;
        return true;
    } catch (error) {
        console.error('HRRR-TLE package refresh failed:', error);
        if (!hrrrTLEReady) {
            HRRR_TLE_LAYER_CONFIGS.forEach(config => config.layer.setOpacity(0));
        }
        return false;
    } finally {
        hrrrTLEManifestCheckInFlight = false;
    }
}

function formatHRRRTLEUTC(value) {
    if (!value) return 'Unknown';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : formatUTC(date);
}

function activeHRRRDiagnosticConfigs() {
    return HRRR_DIAGNOSTIC_LAYER_CONFIGS.filter(
        config => activeLayerNames.has(config.label)
    );
}

function formatHRRRDiagnosticTimeBox(config, metadata) {
    if (!config) return '';
    if (!metadata) {
        return `
            <strong>${config.label}</strong><br>
            <span style="color:#ffeb3b;">Loading latest complete HRRR f01–f12 package...</span>
        `;
    }

    return `
        <strong>${config.label}</strong><br>
        <span style="color:#4fc3f7;font-weight:bold;">Latest HRRR: ${formatHRRRTLEUTC(metadata.latest_hrrr_diagnostic_cycle_utc)}</span><br>
        <span style="color:#ffeb3b;">Valid: ${formatHRRRTLEUTC(metadata.hrrr_diagnostic_valid_start_utc)} — ${formatHRRRTLEUTC(metadata.hrrr_diagnostic_valid_end_utc)}</span><br>
        <span style="font-size:0.82em;color:#d0d0d0;">f${String(metadata.hrrr_diagnostic_fxx_start || 1).padStart(2,'0')}–f${String(metadata.hrrr_diagnostic_fxx_end || 12).padStart(2,'0')} | FFG: ${formatHRRRTLEUTC(metadata.hrrr_diagnostic_ffg_analysis_utc)} (age ${Number(metadata.hrrr_diagnostic_ffg_age_hours).toFixed(1)} h) | ${metadata.neighborhood_km} km neighborhood</span>
    `;
}

function updateHRRRDiagnosticTimeBox() {
    const box = document.getElementById('hrrr-diagnostics-time-box');
    if (!box) return;
    const active = activeHRRRDiagnosticConfigs();
    if (active.length === 0) {
        box.style.display = 'none';
        refreshLegendDockSummary();
        return;
    }
    box.innerHTML = formatHRRRDiagnosticTimeBox(
        active[active.length - 1],
        hrrrTLEMetadata
    );
    box.style.display = 'block';
    refreshLegendDockSummary();
}

function activeHRRRTLEConfigs() {
    return HRRR_TLE_LAYER_CONFIGS.filter(config => activeLayerNames.has(config.label));
}

function hrrrTLELayerValidText(config, metadata) {
    if (!metadata) return 'Loading synchronized 6-cycle package...';
    if (Array.isArray(config.evolutionHours)) {
        const start = new Date(metadata.common_valid_start_utc);
        const end = new Date(metadata.common_valid_start_utc);
        start.setUTCHours(start.getUTCHours() + config.evolutionHours[0]);
        end.setUTCHours(end.getUTCHours() + config.evolutionHours[1]);
        return `${formatUTC(start)} — ${formatUTC(end)}`;
    }
    return `${formatHRRRTLEUTC(metadata.common_valid_start_utc)} — ${formatHRRRTLEUTC(metadata.common_valid_end_utc)}`;
}

function formatHRRRTLETimeBox(config, metadata) {
    if (!config) return '';
    if (!metadata) {
        return `
            <strong>${config.label}</strong><br>
            <span style="color:#ffeb3b;">Loading newest complete HRRR-TLE package...</span>
        `;
    }

    let cycleDetail = '';
    if (config.key === 'latest3') {
        cycleDetail = `<br><span style="font-size:0.82em;color:#d0d0d0;">Cycles: ${(metadata.latest_three_cycles || []).join(', ')}</span>`;
    } else if (config.key === 'prior3') {
        cycleDetail = `<br><span style="font-size:0.82em;color:#d0d0d0;">Cycles: ${(metadata.prior_three_cycles || []).join(', ')}</span>`;
    } else if (config.key === 'run_change') {
        cycleDetail = `<br><span style="font-size:0.82em;color:#d0d0d0;">Signal threshold: ${metadata.run_change_signal_threshold || '2/3 members'}</span>`;
    }

    return `
        <strong>${config.label}</strong><br>
        <span style="color:#4fc3f7;font-weight:bold;">HRRR anchor: ${formatHRRRTLEUTC(metadata.latest_cycle_utc)} | ${metadata.members_available}/6 cycles</span><br>
        <span style="color:#ffeb3b;">Valid: ${hrrrTLELayerValidText(config, metadata)}</span><br>
        <span style="font-size:0.82em;color:#d0d0d0;">FFG: ${formatHRRRTLEUTC(metadata.ffg_analysis_utc)} (age ${Number(metadata.ffg_age_hours).toFixed(1)} h) | ${metadata.neighborhood_km} km neighborhood</span>
        ${cycleDetail}
    `;
}

function updateHRRRTLETimeBox() {
    const box = document.getElementById('hrrr-tle-time-box');
    if (!box) return;
    const active = activeHRRRTLEConfigs();
    if (active.length === 0) {
        box.style.display = 'none';
        refreshLegendDockSummary();
        return;
    }
    // If several HRRR-TLE layers are active, show the most recently found
    // active layer's shared metadata; each layer retains its own legend.
    box.innerHTML = formatHRRRTLETimeBox(active[active.length - 1], hrrrTLEMetadata);
    box.style.display = 'block';
    refreshLegendDockSummary();
}

function hrrrTLELegendShell(title, subtitle, body, footer = '') {
    return `
        <div style="box-sizing:border-box;width:100%;background:white;padding:9px;border-radius:5px;color:black;font-family:sans-serif;">
            <strong style="display:block;font-size:13px;line-height:1.2;text-align:center;">${title}</strong>
            <span style="display:block;margin-top:2px;font-size:9px;line-height:1.25;text-align:center;">${subtitle}</span>
            <div style="margin-top:8px;">${body}</div>
            ${footer ? `<span style="display:block;margin-top:7px;font-size:8px;line-height:1.2;text-align:center;color:#333;">${footer}</span>` : ''}
        </div>
    `;
}

function hrrrTLEDiscreteRows(items, columns = 2) {
    return `
        <div style="display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));gap:7px 12px;">
            ${items.map(item => `
                <div style="display:grid;grid-template-columns:28px minmax(0,1fr);align-items:center;gap:7px;">
                    <span style="display:block;width:26px;height:11px;border:1px solid rgba(0,0,0,0.28);background:${item.color};"></span>
                    <span style="font-size:9px;font-weight:700;line-height:1.15;">${item.label}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function buildHRRRTLELegendHTML(config) {
    const note = 'HRRR time-lagged member frequency / consensus; NOT calibrated probability.';
    if (config.legendType === 'coverage') {
        return hrrrTLELegendShell(
            config.label,
            'Percent of the 40-km neighborhood containing an FFG exceedance',
            hrrrTLEDiscreteRows([
                {label: '1–5%', color: '#e0f7fa'},
                {label: '5–10%', color: '#c8e6c9'},
                {label: '10–25%', color: '#fff59d'},
                {label: '25–50%', color: '#ffb74d'},
                {label: '50–75%', color: '#f44336'},
                {label: '75–100%', color: '#9c27b0'}
            ], 3),
            'Latest deterministic HRRR, next 12 hours; values <1% are transparent.'
        );
    }

    if (config.legendType === 'ratio') {
        const bins = [
            ['0.75–1.00', '#ffff00'], ['1.00–1.25', '#ffa500'],
            ['1.25–1.50', '#ff0000'], ['1.50–2.00', '#8b0000'],
            ['2.00–2.50', '#ff00ff'], ['2.50–3.00', '#800080'],
            ['3.00–4.00', '#0000ff'], ['4.00–5.00', '#00ffff'],
            ['≥5.00', '#00ffff']
        ].map(([label, color]) => ({label, color}));
        return hrrrTLELegendShell(
            config.label,
            'Median of member 40-km neighborhood-maximum QPF / FFG ratios',
            hrrrTLEDiscreteRows(bins, 3),
            'Values <0.75 are transparent.'
        );
    }

    if (config.legendType === 'runChange') {
        return hrrrTLELegendShell(
            config.label,
            'Latest 3 cycles versus prior 3 cycles; signal threshold ≥2/3 members',
            hrrrTLEDiscreteRows([
                {label: 'Fading', color: '#4575b4'},
                {label: 'Persistent', color: '#7b3294'},
                {label: 'Emerging', color: '#fdae61'}
            ], 3),
            'Categorical run-to-run signal evolution.'
        );
    }

    if (config.legendType === 'frequency3') {
        return hrrrTLELegendShell(
            config.label,
            'Three-cycle FFG-exceedance consensus',
            hrrrTLEDiscreteRows([
                {label: '1/3 (33%)', color: '#ffcc80'},
                {label: '2/3 (67%)', color: '#ef5350'},
                {label: '3/3 (100%)', color: '#5e35b1'}
            ], 3),
            note
        );
    }

    const allSix = [
        {label: '1/6 (17%)', color: '#fff59d'},
        {label: '2/6 (33%)', color: '#ffcc80'},
        {label: '3/6 (50%)', color: '#ff8a65'},
        {label: '4/6 (67%)', color: '#ef5350'},
        {label: '5/6 (83%)', color: '#ab47bc'},
        {label: '6/6 (100%)', color: '#5e35b1'}
    ];
    const items = config.legendType === 'frequency6Min2' ? allSix.slice(1) : allSix;
    const subtitle = config.legendType === 'frequency6Min2'
        ? 'FFG-exceedance member consensus; 1/6 support intentionally suppressed on display'
        : 'HRRR-TLE member frequency / consensus';
    return hrrrTLELegendShell(
        config.label,
        subtitle,
        hrrrTLEDiscreteRows(items, 3),
        note
    );
}

function checkHRRRTLEUpdatesNow() {
    refreshHRRRTLEFromManifest();
}

window.setInterval(() => {
    if (!document.hidden) checkHRRRTLEUpdatesNow();
}, HRRR_TLE_MANIFEST_POLL_INTERVAL_MS);

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkHRRRTLEUpdatesNow();
});
window.addEventListener('focus', checkHRRRTLEUpdatesNow);
window.addEventListener('online', checkHRRRTLEUpdatesNow);


function refreshNWMFreshness() {
    const state = NWMFreshness.state(nwmMetadata);
    nwmLayerReady = !!nwmMetadata && !state.hidden;
    nwmValidTime = state.text;
    nwmLayer.setOpacity(nwmLayerReady ? 1 : 0);
    const timeBox = document.getElementById('nwm-time-box');
    if (timeBox) {
        timeBox.innerHTML = '<strong>NWM 0-40cm Soil Saturation</strong><br>';
        const text = document.createElement('span');
        text.style.color = '#ffeb3b';
        text.textContent = state.text;
        timeBox.appendChild(text);
    }
}
setInterval(refreshNWMFreshness, 30000);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshNWMFreshness();
});

async function fetchNWMMetadata() {
    try {
        const response = await fetch('static/nwm_metadata.json?t=' + Date.now(), {cache: 'no-store'});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        applySoilRasterMetadata({
            metadata: data, layer: nwmLayer, baseUrl: NWM_IMAGE_URL,
            productName: "NWM soil saturation", opacity: 0
        });
        nwmMetadata = data;
    } catch (error) {
        // Retain a previously validated map, but never reset its source age.
        if (nwmMetadata) nwmMetadata = {...nwmMetadata, update_status: 'failed_retained'};
        console.error("NWM raster metadata update failed:", error);
    }
    refreshNWMFreshness();
}

async function fetchSPoRTMetadata() {
    try {
        const response = await fetch(
            'static/sport_metadata.json?t=' + Date.now(),
            {cache: 'no-store'}
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        applySoilRasterMetadata({
            metadata: data,
            layer: sportLayer,
            baseUrl: SPORT_IMAGE_URL,
            productName: "NASA SPoRT-LIS VSM percentile",
            opacity: 1.0
        });

        sportLayerReady = true;
        sportValidTime = data.valid_time || "Unknown";

        const timeBox = document.getElementById('sport-time-box');
        if (timeBox && timeBox.style.display === 'block') {
            timeBox.innerHTML = `
                <strong>NASA SPoRT-LIS VSM Percentile (0–100 cm)</strong><br>
                <span style="color: #ffeb3b;">${sportValidTime}</span>
            `;
        }
    } catch (error) {
        sportLayerReady = false;
        sportLayer.setOpacity(0);
        console.error("SPoRT raster metadata update failed:", error);
    }
}

async function fetchNRCSHSGMetadata() {
    try {
        const response = await fetch(
            `${NRCS_HSG_METADATA_URL}?t=${Date.now()}`,
            {cache: 'no-store'}
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.metadata_mode !== 'nrcs_hsg_dashboard_h1_native30m_v2') {
            throw new Error(`Unexpected HSG metadata mode: ${data.metadata_mode || 'missing'}`);
        }
        if (data.render_revision !== 'nrcs-hsg-native30m-h1-v2-3') {
            throw new Error(`Unexpected HSG render revision: ${data.render_revision || 'missing'}`);
        }
        if (data.domain !== 'CONUS') {
            throw new Error(`Unexpected HSG domain: ${data.domain || 'missing'}`);
        }
        if (
            data.attribute !== 'hydgrpdcd' ||
            data.attribute_label !== 'Hydrologic Group - Dominant Conditions'
        ) {
            throw new Error('NRCS HSG metadata does not preserve the hydgrpdcd dominant-condition contract');
        }
        if (
            data.source_geometry_vintage !== 'FY2026' ||
            Number(data.source_native_resolution_m) !== 30 ||
            Number(data.scientific_analysis_resolution_m) !== 1000
        ) {
            throw new Error('NRCS HSG metadata does not preserve the FY2026 native-30m / 1-km analysis contract');
        }
        if (data.categorical !== true || data.smoothing !== false || data.display_resampling !== 'nearest-neighbor') {
            throw new Error('NRCS HSG display metadata violates the categorical no-smoothing contract');
        }

        const expectedClasses = ['A', 'B', 'C', 'D', 'A/D', 'B/D', 'C/D'];
        const classNames = (data.classes || []).map(item => item.name);
        if (
            classNames.length !== expectedClasses.length ||
            !expectedClasses.every((name, index) => classNames[index] === name)
        ) {
            throw new Error('NRCS HSG metadata class order/contents changed; expected A, B, C, D, A/D, B/D, C/D');
        }
        if (!String(data.analysis_source_note || '').includes('scientific GeoTIFFs')) {
            throw new Error('NRCS HSG metadata is missing the scientific-analysis/display separation note');
        }

        const imageCrs = String(data.image_crs || data.crs || '').toUpperCase();
        if (imageCrs !== 'EPSG:3857') {
            throw new Error(`NRCS HSG expected EPSG:3857, found ${imageCrs || 'missing CRS'}`);
        }
        const exactBounds = validateRasterBounds(data.bounds, 'NRCS Hydrologic Soil Group');
        const staticVersion = [data.source_geometry_vintage, data.render_revision, data.generated_utc]
            .filter(Boolean)
            .join('-');
        nrcsHsgLayer.setBounds(exactBounds);
        nrcsHsgLayer.setUrl(`${NRCS_HSG_IMAGE_URL}?v=${encodeURIComponent(staticVersion)}`);
        nrcsHsgLayer.setOpacity(0.88);

        nrcsHsgMetadata = data;
        nrcsHsgSourceVintage = String(data.source_geometry_vintage || 'Unknown');
        nrcsHsgReady = true;

        const timeBox = document.getElementById('nrcs-hsg-time-box');
        if (timeBox && timeBox.style.display === 'block') {
            timeBox.innerHTML = formatNRCSHSGTimeBox(data);
        }
    } catch (error) {
        nrcsHsgReady = false;
        nrcsHsgLayer.setOpacity(0);
        console.error('NRCS HSG raster metadata update failed:', error);
    }
}

function formatNRCSHSGTimeBox(metadata = nrcsHsgMetadata) {
    const sourceVintage = metadata?.source_geometry_vintage || nrcsHsgSourceVintage || 'Unknown';
    const nativeResolution = Number(metadata?.source_native_resolution_m);
    const analysisResolution = Number(metadata?.scientific_analysis_resolution_m);
    const resolutionText = (
        Number.isFinite(nativeResolution) && Number.isFinite(analysisResolution)
            ? `${nativeResolution} m source → ${analysisResolution / 1000} km analysis`
            : 'native-source / equal-area analysis'
    );
    return `
        <strong>NRCS Hydrologic Soil Group</strong><br>
        <span style="color:#4fc3f7;font-weight:bold;">gNATSGO ${sourceVintage}</span><br>
        <span style="color:#d7edf8;">${resolutionText}</span><br>
        <span style="color:#ffeb3b;">Static annual soil-survey layer</span>
    `;
}


async function fetchNLCDImperviousMetadata() {
    try {
        const response = await fetch(
            `${NLCD_IMPERVIOUS_METADATA_URL}?t=${Date.now()}`,
            {cache: 'no-store'}
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.metadata_mode !== 'usgs_nlcd_fractional_impervious_h2_dashboard_v1_1_clarified') {
            throw new Error(`Unexpected NLCD metadata mode: ${data.metadata_mode || 'missing'}`);
        }
        if (data.render_revision !== 'annual-nlcd-fctimp-2025-h2-v1-1-clarified') {
            throw new Error(`Unexpected NLCD render revision: ${data.render_revision || 'missing'}`);
        }
        if (
            data.source !== 'USGS Annual NLCD Collection 1.2' ||
            data.source_product !== 'FctImp' ||
            Number(data.source_map_year) !== 2025
        ) {
            throw new Error('Annual NLCD source/product/year contract changed unexpectedly');
        }
        if (
            Number(data.source_native_resolution_m) !== 30 ||
            Number(data.scientific_analysis_resolution_m) !== 1000 ||
            String(data.scientific_analysis_crs || '').toUpperCase() !== 'EPSG:5070'
        ) {
            throw new Error('Annual NLCD native-30m / 1-km EPSG:5070 science contract changed');
        }
        if (
            String(data.image_crs || '').toUpperCase() !== 'EPSG:3857' ||
            data.display_resampling !== 'nearest-neighbor' ||
            data.smoothing !== false
        ) {
            throw new Error('Annual NLCD dashboard display contract changed');
        }
        if (Number(data.display_min_valid_coverage_fraction) !== 0.25) {
            throw new Error('Annual NLCD minimum valid-coverage display threshold changed');
        }
        if (
            data.zero_percent_display !== 'neutral-tint' ||
            String(data.zero_percent_color || '').toLowerCase() !== '#bdbdbd' ||
            Number(data.zero_percent_alpha) !== 150 ||
            data.persistent_source_nodata_display !== 'transparent'
        ) {
            throw new Error('Annual NLCD zero-percent / NoData display contract changed');
        }
        if (data.insufficient_valid_coverage_display !== 'transparent') {
            throw new Error('Annual NLCD insufficient-coverage display contract changed');
        }
        if (data.final_coverage_qa !== 'nlcd_h2_v1_1_final_coverage_qa.json') {
            throw new Error('Annual NLCD final QA provenance changed unexpectedly');
        }

        const expectedBins = [
            [0, 5, '#ffffcc', '>0–5%'],
            [5, 10, '#ffeda0', '5–10%'],
            [10, 20, '#fed976', '10–20%'],
            [20, 40, '#feb24c', '20–40%'],
            [40, 60, '#fd8d3c', '40–60%'],
            [60, 80, '#f03b20', '60–80%'],
            [80, 100.0001, '#bd0026', '80–100%']
        ];
        const bins = data.display_bins || [];
        if (
            bins.length !== expectedBins.length ||
            !expectedBins.every(([min, max, color, label], i) => (
                Number(bins[i]?.min) === min &&
                Number(bins[i]?.max) === max &&
                String(bins[i]?.color || '').toLowerCase() === color &&
                bins[i]?.label === label
            ))
        ) {
            throw new Error('Annual NLCD display bins/colors changed unexpectedly');
        }
        if (!String(data.dynamic_model_use_note || '').includes('scientific GeoTIFFs')) {
            throw new Error('Annual NLCD metadata is missing the science-vs-display safeguard');
        }

        const exactBounds = validateRasterBounds(
            data.leaflet_bounds,
            'USGS Annual NLCD Fractional Impervious Surface'
        );
        const staticVersion = [data.source_map_year, data.render_revision]
            .filter(Boolean)
            .join('-');

        nlcdImperviousLayer.setBounds(exactBounds);
        nlcdImperviousLayer.setUrl(
            `${NLCD_IMPERVIOUS_IMAGE_URL}?v=${encodeURIComponent(staticVersion)}`
        );
        nlcdImperviousLayer.setOpacity(0.88);

        nlcdImperviousMetadata = data;
        nlcdImperviousMapYear = String(data.source_map_year || 'Unknown');
        nlcdImperviousReady = true;

        const timeBox = document.getElementById('nlcd-impervious-time-box');
        if (timeBox && timeBox.style.display === 'block') {
            timeBox.innerHTML = formatNLCDImperviousTimeBox(data);
        }
    } catch (error) {
        nlcdImperviousReady = false;
        nlcdImperviousLayer.setOpacity(0);
        console.error('Annual NLCD impervious raster metadata update failed:', error);
    }
}

function formatNLCDImperviousTimeBox(metadata = nlcdImperviousMetadata) {
    const mapYear = metadata?.source_map_year || nlcdImperviousMapYear || 'Unknown';
    const nativeResolution = Number(metadata?.source_native_resolution_m);
    const analysisResolution = Number(metadata?.scientific_analysis_resolution_m);
    const resolutionText = (
        Number.isFinite(nativeResolution) && Number.isFinite(analysisResolution)
            ? `${nativeResolution} m source → ${analysisResolution / 1000} km analysis`
            : 'native-source / equal-area analysis'
    );
    return `
        <strong>USGS Annual NLCD Impervious Surface</strong><br>
        <span style="color:#4fc3f7;font-weight:bold;">Collection 1.2 • ${mapYear}</span><br>
        <span style="color:#d7edf8;">${resolutionText}</span><br>
        <span style="color:#ffeb3b;">0% shown in neutral gray • NoData remains transparent</span>
    `;
}

function formatNLDAS3StaticTimeBox(productKey) {
    const isSoil = productKey === 'soil_texture';
    const product = nldas3StaticMetadata?.[productKey];
    const title = isSoil ? 'NASA NLDAS-3 Soil Texture' : 'NASA NLDAS-3 Land Use / Vegetation';
    const classification = product?.classification || 'Static categorical land-surface classification';
    const sourceHistory = String(nldas3StaticMetadata?.source_history || '');
    const sourceDateMatch = sourceHistory.match(/(\d{4}-\d{2}-\d{2})/);
    const sourceDate = sourceDateMatch ? sourceDateMatch[1] : 'source build date unavailable';
    const dx = Number(nldas3StaticMetadata?.source_grid?.native_dx_deg);
    const resolutionText = Number.isFinite(dx)
        ? `native ${dx.toFixed(2)}° grid (~1 km)`
        : 'native ~1 km grid';

    return `
        <strong>${title}</strong><br>
        <span style="color:#4fc3f7;font-weight:bold;">${classification}</span><br>
        <span style="color:#d7edf8;">${resolutionText}</span><br>
        <span style="color:#ffeb3b;">Static land-surface parameter • source build ${sourceDate}</span>
    `;
}

function buildNLDAS3CategoricalLegendHTML(productKey) {
    const isSoil = productKey === 'soil_texture';
    const product = nldas3StaticMetadata?.[productKey];
    const title = isSoil ? 'NASA NLDAS-3 Soil Texture' : 'NASA NLDAS-3 Land Use / Vegetation';
    const subtitle = isSoil
        ? 'STATSGO texture classification • static ~1 km context'
        : 'IGBP/NCEP-modified surface classification • static ~1 km context';
    const transparentCodes = new Set(
        isSoil
            ? [Number(product?.water_code ?? 14)]
            : (product?.water_codes || [17, 21]).map(Number)
    );
    const classes = Array.isArray(product?.classes)
        ? product.classes.filter(item =>
            Number(item.display_pixel_count || 0) > 0 &&
            !transparentCodes.has(Number(item.code))
        )
        : [];

    const rows = classes.length
        ? classes.map(item => `
            <div style="display:grid;grid-template-columns:16px 1fr;gap:5px;align-items:center;font-size:8.5px;line-height:1.15;">
                <span style="width:14px;height:11px;background:${item.color};border:1px solid #555;"></span>
                <span><strong>${item.code}</strong> — ${item.label}</span>
            </div>
        `).join('')
        : '<div style="font-size:9px;color:#666;">Loading validated NLDAS-3 class metadata...</div>';

    const waterNote = isSoil
        ? 'Water (soil class 14) is transparent.'
        : 'Ocean/open-water surface classes are transparent.';

    return `
        <div style="background:white;padding:10px;border-radius:5px;color:black;font-family:sans-serif;min-width:300px;max-width:390px;">
            <div style="text-align:center;font-weight:800;font-size:13px;margin-bottom:2px;">${title}</div>
            <div style="text-align:center;font-size:9px;margin-bottom:7px;color:#444;">${subtitle}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 10px;">
                ${rows}
            </div>
            <div style="margin-top:7px;padding-top:6px;border-top:1px solid #bbb;font-size:8px;line-height:1.25;color:#555;">
                ${waterNote} Colors are WPC dashboard visualization colors, not an official NASA palette.
                Static land-surface context only—not real-time soil moisture, an infiltration rate, or a flash-flood threshold.
            </div>
        </div>
    `;
}

async function fetchNLDAS3StaticMetadata() {
    try {
        const response = await fetch(
            `${NLDAS3_STATIC_METADATA_URL}?t=${Date.now()}`,
            {cache: 'no-store'}
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.metadata_mode !== 'nldas3_static_dashboard_v1') {
            throw new Error(`Unexpected NLDAS-3 metadata mode: ${data.metadata_mode || 'missing'}`);
        }
        if (data.render_revision !== 'nldas3-static-phase1-v1') {
            throw new Error(`Unexpected NLDAS-3 render revision: ${data.render_revision || 'missing'}`);
        }
        if (String(data.image_crs || '').toUpperCase() !== 'EPSG:3857') {
            throw new Error(`NLDAS-3 expected EPSG:3857 display image, found ${data.image_crs || 'missing CRS'}`);
        }
        if (data.categorical !== true || data.smoothing !== false || data.display_resampling !== 'nearest-neighbor') {
            throw new Error('NLDAS-3 display metadata violates the categorical no-smoothing contract');
        }

        const soil = data.soil_texture;
        const land = data.landcover;
        if (!soil || !land) throw new Error('NLDAS-3 metadata missing soil_texture or landcover product');
        if (soil.source_variable !== 'Soiltype_inst' || land.source_variable !== 'Landcover_inst') {
            throw new Error('NLDAS-3 source-variable contract changed');
        }
        if (Number(soil.water_code) !== 14) {
            throw new Error('NLDAS-3 STATSGO water-code contract changed');
        }
        const landWaterCodes = (land.water_codes || []).map(Number);
        if (landWaterCodes.length !== 2 || landWaterCodes[0] !== 17 || landWaterCodes[1] !== 21) {
            throw new Error('NLDAS-3 land-cover water-code contract changed');
        }

        const soilCodes = (soil.classes || []).map(item => Number(item.code));
        const landCodes = (land.classes || []).map(item => Number(item.code));
        const expectedSoilCodes = Array.from({length: 16}, (_, i) => i + 1);
        const expectedLandCodes = Array.from({length: 21}, (_, i) => i + 1);
        if (JSON.stringify(soilCodes) !== JSON.stringify(expectedSoilCodes)) {
            throw new Error('NLDAS-3 soil class-code sequence changed');
        }
        if (JSON.stringify(landCodes) !== JSON.stringify(expectedLandCodes)) {
            throw new Error('NLDAS-3 land-cover class-code sequence changed');
        }

        const exactBounds = validateRasterBounds(data.bounds, 'NASA NLDAS-3 static land surface');
        const staticVersion = [data.render_revision, data.generated_utc].filter(Boolean).join('-');

        nldas3SoilLayer.setBounds(exactBounds);
        nldas3SoilLayer.setUrl(`${NLDAS3_SOIL_IMAGE_URL}?v=${encodeURIComponent(staticVersion)}`);
        nldas3SoilLayer.setOpacity(0.86);

        nldas3LandcoverLayer.setBounds(exactBounds);
        nldas3LandcoverLayer.setUrl(`${NLDAS3_LANDCOVER_IMAGE_URL}?v=${encodeURIComponent(staticVersion)}`);
        nldas3LandcoverLayer.setOpacity(0.82);

        nldas3StaticMetadata = data;
        nldas3StaticReady = true;

        const soilTimeBox = document.getElementById('nldas3-soil-time-box');
        if (soilTimeBox && soilTimeBox.style.display === 'block') {
            soilTimeBox.innerHTML = formatNLDAS3StaticTimeBox('soil_texture');
        }
        const landTimeBox = document.getElementById('nldas3-landcover-time-box');
        if (landTimeBox && landTimeBox.style.display === 'block') {
            landTimeBox.innerHTML = formatNLDAS3StaticTimeBox('landcover');
        }
        updateLegends();
    } catch (error) {
        nldas3StaticReady = false;
        nldas3SoilLayer.setOpacity(0);
        nldas3LandcoverLayer.setOpacity(0);
        console.error('NLDAS-3 static raster metadata update failed:', error);
    }
}

function formatNLDAS3SlopeTimeBox(metadata = nldas3SlopeMetadata) {
    const sourceHistory = String(metadata?.source_history || '');
    const sourceDateMatch = sourceHistory.match(/(\d{4}-\d{2}-\d{2})/);
    const sourceDate = sourceDateMatch ? sourceDateMatch[1] : 'source build date unavailable';
    const dx = Number(metadata?.source_grid?.dx_deg);
    const resolutionText = Number.isFinite(dx)
        ? `native ${dx.toFixed(2)}° grid (~1 km)`
        : 'native ~1 km grid';
    return `
        <strong>NASA NLDAS-3 / MERIT Terrain Slope</strong><br>
        <span style="color:#4fc3f7;font-weight:bold;">Percent slope • descriptive terrain context</span><br>
        <span style="color:#d7edf8;">${resolutionText}</span><br>
        <span style="color:#ffeb3b;">Static parameter • source build ${sourceDate}</span><br>
        <span style="color:#f2c879;">Not a runoff-risk or flash-flood-risk classification</span>
    `;
}

function buildNLDAS3SlopeLegendHTML(metadata = nldas3SlopeMetadata) {
    const bins = Array.isArray(metadata?.display?.bins) ? metadata.display.bins : [];
    const rows = bins.length
        ? bins.map(item => `
            <div style="display:grid;grid-template-columns:16px 1fr;gap:5px;align-items:center;font-size:9px;line-height:1.15;">
                <span style="width:14px;height:11px;background:${item.color};border:1px solid #555;"></span>
                <span>${item.label}</span>
            </div>
        `).join('')
        : '<div style="font-size:9px;color:#666;">Loading validated NLDAS-3 slope metadata...</div>';

    return `
        <div style="background:white;padding:10px;border-radius:5px;color:black;font-family:sans-serif;min-width:220px;max-width:320px;">
            <div style="text-align:center;font-weight:800;font-size:13px;margin-bottom:2px;">NLDAS-3 / MERIT Terrain Slope</div>
            <div style="text-align:center;font-size:9px;margin-bottom:7px;color:#444;">Percent slope • static ~1 km context</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 10px;">${rows}</div>
            <div style="margin-top:7px;padding-top:6px;border-top:1px solid #bbb;font-size:8px;line-height:1.25;color:#555;">
                Descriptive terrain ranges only—not runoff-risk classes, infiltration rates, or flash-flood thresholds.
                Missing/water cells are transparent. Colors are a WPC dashboard visualization palette.
            </div>
        </div>
    `;
}

async function fetchNLDAS3SlopeMetadata() {
    try {
        const response = await fetch(
            `${NLDAS3_SLOPE_METADATA_URL}?t=${Date.now()}`,
            {cache: 'no-store'}
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.metadata_mode !== 'nldas3_static_slope_dashboard_v1') {
            throw new Error(`Unexpected NLDAS-3 slope metadata mode: ${data.metadata_mode || 'missing'}`);
        }
        if (data.render_revision !== 'nldas3-merit-slope-phase1b-v1') {
            throw new Error(`Unexpected NLDAS-3 slope render revision: ${data.render_revision || 'missing'}`);
        }
        if (data.source_variable !== 'SLOPE' || data.source_standard_name !== "MERIT '1K' slope") {
            throw new Error('NLDAS-3 slope source-variable contract changed');
        }
        if (String(data.image_crs || '').toUpperCase() !== 'EPSG:3857') {
            throw new Error(`NLDAS-3 slope expected EPSG:3857 display image, found ${data.image_crs || 'missing CRS'}`);
        }
        if (
            data.display?.categorical_descriptive_bins !== true ||
            data.display?.display_resampling !== 'nearest-neighbor' ||
            data.display?.smoothing !== false ||
            data.display?.transparent_missing_water !== true
        ) {
            throw new Error('NLDAS-3 slope display metadata violates the descriptive nearest-neighbor contract');
        }

        const expectedLabels = ['0–1%', '1–2%', '2–5%', '5–10%', '10–20%', '20–30%', '30–45%', '45–60%', '≥60%'];
        const labels = (data.display?.bins || []).map(item => item.label);
        if (JSON.stringify(labels) !== JSON.stringify(expectedLabels)) {
            throw new Error('NLDAS-3 slope display-bin contract changed');
        }
        const safeguards = (data.science_safeguards || []).join(' ');
        if (
            !safeguards.includes('not runoff-risk classes') ||
            !safeguards.includes('display derivative only') ||
            !safeguards.includes('No infiltration or flash-flood threshold')
        ) {
            throw new Error('NLDAS-3 slope science safeguards are missing or changed');
        }

        const exactBounds = validateRasterBounds(data.bounds, 'NASA NLDAS-3 / MERIT terrain slope');
        const staticVersion = [data.render_revision, data.generated_utc].filter(Boolean).join('-');
        nldas3SlopeLayer.setBounds(exactBounds);
        nldas3SlopeLayer.setUrl(`${NLDAS3_SLOPE_IMAGE_URL}?v=${encodeURIComponent(staticVersion)}`);
        nldas3SlopeLayer.setOpacity(0.82);

        nldas3SlopeMetadata = data;
        nldas3SlopeReady = true;

        const timeBox = document.getElementById('nldas3-slope-time-box');
        if (timeBox && timeBox.style.display === 'block') {
            timeBox.innerHTML = formatNLDAS3SlopeTimeBox(data);
        }
        updateLegends();
    } catch (error) {
        nldas3SlopeReady = false;
        nldas3SlopeLayer.setOpacity(0);
        console.error('NLDAS-3 slope raster metadata update failed:', error);
    }
}

// Initial fetch on load
fetchRAPMetadata();
fetchCAMMetadata();
fetchEROCAMMetadata();
fetchMRMSFlash24hMetadata();
refreshGLMFromManifest({forceMetadata: true});
refreshLightningCastFromManifest({forceMetadata: true});
refreshHRRRTLEFromManifest({forceMetadata: true});
fetchNWMMetadata();
// Legacy SPoRT updater retired; shared suites own publication and freshness.
fetchNRCSHSGMetadata();
fetchNLCDImperviousMetadata();
fetchNLDAS3StaticMetadata();
fetchNLDAS3SlopeMetadata();

// Auto-Refresh generated PNGs every 15 minutes
setInterval(() => {
    fetchRAPMetadata();
    fetchCAMMetadata();
    fetchEROCAMMetadata();
    fetchMRMSFlash24hMetadata();
    fetchNWMMetadata();
    // Legacy SPoRT updater retired; shared suites own publication and freshness.
}, 15 * 60 * 1000); 

// GLM and LightningCast products are refreshed by their manifest watchers above.

function getValidTimeRange(cycleStr, windowStr, exactInitTime = null) {
    if (!cycleStr || cycleStr === "Unknown") return "Valid Time Unknown";

    let baseDate = null;
    if (exactInitTime instanceof Date && !Number.isNaN(exactInitTime.getTime())) {
        baseDate = new Date(exactInitTime.getTime());
    } else {
        // Backward-compatible fallback for metadata published before exact
        // initialization timestamps were added.
        const cycleHour = parseInt(cycleStr);
        const now = new Date();
        baseDate = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            cycleHour,
            0,
            0
        ));
        if (now.getUTCHours() < cycleHour) {
            baseDate.setUTCDate(baseDate.getUTCDate() - 1);
        }
    }

    const startOffset = windowStr === '+3h to +9h' ? 3 : 9;
    const endOffset = windowStr === '+3h to +9h' ? 9 : 15;

    const startDate = new Date(baseDate.getTime() + (startOffset * 60 * 60 * 1000));
    const endDate = new Date(baseDate.getTime() + (endOffset * 60 * 60 * 1000));

    return `${formatUTC(startDate)} &mdash; ${formatUTC(endDate)}`;
}

// --- RESPONSIVE LEGEND & VALID-TIME DOCK ---

const LEGEND_DOCK_SESSION_KEY = 'wpcLegendDockExpanded';
const legendDockCompactMedia = window.matchMedia('(max-width: 900px), (pointer: coarse)');
let legendDockExpanded = true;
let legendDockPreferenceExplicit = false;

function readLegendDockPreference() {
    try {
        return window.sessionStorage.getItem(LEGEND_DOCK_SESSION_KEY);
    } catch (error) {
        return null;
    }
}

function writeLegendDockPreference(isExpanded) {
    try {
        window.sessionStorage.setItem(
            LEGEND_DOCK_SESSION_KEY,
            isExpanded ? 'true' : 'false'
        );
    } catch (error) {
        // The dock still works when browser privacy settings block storage.
    }
}

function applyLegendDockState(dock, isExpanded) {
    if (!dock) return;

    legendDockExpanded = Boolean(isExpanded);
    dock.classList.toggle('is-collapsed', !legendDockExpanded);

    const toggle = dock.querySelector('#legend-dock-toggle');
    const title = dock.querySelector('#legend-dock-title');
    const icon = dock.querySelector('#legend-dock-icon');

    if (toggle) {
        toggle.setAttribute('aria-expanded', String(legendDockExpanded));
        toggle.setAttribute(
            'aria-label',
            legendDockExpanded
                ? 'Collapse legends and valid times'
                : 'Expand legends and valid times'
        );
    }
    if (title) {
        title.textContent = legendDockExpanded
            ? 'Legends & Valid Times'
            : 'Legends';
    }
    if (icon) icon.textContent = legendDockExpanded ? '−' : '+';
}

function setLegendDockExpanded(isExpanded, persist = true) {
    const dock = document.getElementById('legend-dock');
    applyLegendDockState(dock, isExpanded);

    if (persist) {
        legendDockPreferenceExplicit = true;
        writeLegendDockPreference(Boolean(isExpanded));
    }
}

function initializeLegendDockState() {
    const storedPreference = readLegendDockPreference();
    if (storedPreference === 'true' || storedPreference === 'false') {
        legendDockPreferenceExplicit = true;
        setLegendDockExpanded(storedPreference === 'true', false);
        return;
    }

    legendDockPreferenceExplicit = false;
    setLegendDockExpanded(!legendDockCompactMedia.matches, false);
}

function refreshLegendDockSummary() {
    const dock = document.getElementById('legend-dock');
    if (!dock) return;

    const legendContainer = document.getElementById('legend-container');
    const legendCount = legendContainer
        ? legendContainer.querySelectorAll('.legend-block').length
        : 0;
    const visibleTimeCount = Array.from(
        dock.querySelectorAll('.legend-dock-time-box')
    ).filter(box => window.getComputedStyle(box).display !== 'none').length;
    const trendCard = document.getElementById('glm-trend-card');
    const visibleTrendCount = trendCard && window.getComputedStyle(trendCard).display !== 'none'
        ? 1
        : 0;

    const count = document.getElementById('legend-dock-count');
    if (count) {
        count.textContent = String(legendCount);
        count.setAttribute(
            'aria-label',
            `${legendCount} active legend${legendCount === 1 ? '' : 's'}`
        );
    }

    dock.classList.toggle(
        'has-content',
        legendCount > 0 || visibleTimeCount > 0 || visibleTrendCount > 0
    );
}

function createLegendDockTimeBox(parent, id) {
    const div = L.DomUtil.create(
        'div',
        'time-box legend-dock-time-box',
        parent
    );
    div.id = id;
    div.style.display = 'none';
    return div;
}

const legendDockControl = L.control({position: 'bottomright'});
legendDockControl.onAdd = function () {
    const dock = L.DomUtil.create('section', 'legend-dock');
    dock.id = 'legend-dock';
    dock.setAttribute('aria-label', 'Active legends and valid times');

    dock.innerHTML = `
        <button
            id="legend-dock-toggle"
            class="legend-dock-toggle"
            type="button"
            aria-controls="legend-dock-body"
            aria-expanded="true"
        >
            <span id="legend-dock-title" class="legend-dock-title">Legends & Valid Times</span>
            <span id="legend-dock-count" class="legend-dock-count" aria-label="0 active legends">0</span>
            <span id="legend-dock-icon" class="legend-dock-icon" aria-hidden="true">−</span>
        </button>
        <div id="legend-dock-body" class="legend-dock-body">
            <div id="legend-time-stack" class="legend-time-stack"></div>
            <div id="glm-trend-card" class="glm-trend-card" style="display:none;" aria-live="polite"></div>
            <div id="legend-container" class="legend-container"></div>
        </div>
    `;

    const timeStack = dock.querySelector('#legend-time-stack');
    [
        'rap-time-box',
        'mrms-time-box',
        'cam-time-box',
        'radar-time-box',
        'mrms-rala-time-box',
        'ffd-time-box',
        'mrms-crest-24h-time-box',
        'mrms-ffd-24h-time-box',
        'glm-time-box',
        'lightningcast-time-box',
        'hrrr-diagnostics-time-box',
        'hrrr-tle-time-box',
        'nwm-time-box',
        'sport-time-box',
        'nrcs-hsg-time-box',
        'nlcd-impervious-time-box',
        'nldas3-soil-time-box',
        'nldas3-landcover-time-box',
        'nldas3-slope-time-box',
        'wfigs-current-time-box',
        'wfigs-ytd-time-box',
        'wfigs-history-time-box'
    ].forEach(id => createLegendDockTimeBox(timeStack, id));

    const toggle = dock.querySelector('#legend-dock-toggle');
    toggle.addEventListener('click', () => {
        setLegendDockExpanded(!legendDockExpanded);
    });

    L.DomEvent.disableClickPropagation(dock);
    L.DomEvent.disableScrollPropagation(dock);

    return dock;
};
legendDockControl.addTo(map);
initializeLegendDockState();
updateGLMTrendCard();

if (typeof legendDockCompactMedia.addEventListener === 'function') {
    legendDockCompactMedia.addEventListener('change', () => {
        if (!legendDockPreferenceExplicit) {
            setLegendDockExpanded(!legendDockCompactMedia.matches, false);
        }
    });
}

// Update the active radar source as the shared time player advances.
map.timeDimension.on('timeload', function(event) {
    const currentTime = Number(event?.time ?? map.timeDimension.getCurrentTime());
    if (map.hasLayer(mrmsRalaLayer)) {
        if (mrmsRalaTimelineEchoTime !== null && currentTime === mrmsRalaTimelineEchoTime) {
            mrmsRalaTimelineEchoTime = null;
            return;
        }
        mrmsRalaTimelineEchoTime = null;
        showMRMSRALAFrame(currentTime);
        return;
    }

    const radarTimeBox = document.getElementById('radar-time-box');
    if (radarTimeBox && radarTimeBox.style.display === 'block' && map.hasLayer(radarTimeLayer)) {
        const currentFrameTime = new Date(currentTime);
        radarTimeBox.innerHTML = `
            <strong>IEM NEXRAD Backup Loop</strong><br>
            <span style="color: #ffeb3b; font-weight: bold; font-size: 1.05em;">Frame: ${formatUTC(currentFrameTime)}</span>
        `;
    }
});

// --- LEGEND DICTIONARIES AND HTML BLOCKS ---
const rapLegendMapping = {
    "Precipitable Water (PWAT)": "static/leg_pwat.png",
    "&nbsp;&nbsp;&nbsp;&nbsp;3-Hour PWAT Change": "static/leg_pwat_diff.png",
    "&nbsp;&nbsp;&nbsp;&nbsp;▶ <b>+3h Forecast:</b> PWAT": "static/leg_pwat.png",
    "Surface Based CAPE": "static/leg_cape.png",
    "&nbsp;&nbsp;&nbsp;&nbsp;3-Hour SBCAPE Change": "static/leg_cape_diff.png",
    "&nbsp;&nbsp;&nbsp;&nbsp;▶ <b>+3h Forecast:</b> SBCAPE": "static/leg_cape.png",
    "Mixed Layer CAPE (90mb)": "static/leg_cape.png",
    "&nbsp;&nbsp;&nbsp;&nbsp;3-Hour MLCAPE Change": "static/leg_cape_diff.png",
    "&nbsp;&nbsp;&nbsp;&nbsp;▶ <b>+3h Forecast:</b> MLCAPE": "static/leg_cape.png",
    "Most Unstable CAPE (255mb)": "static/leg_cape.png",
    "&nbsp;&nbsp;&nbsp;&nbsp;3-Hour MUCAPE Change": "static/leg_cape_diff.png",
    "&nbsp;&nbsp;&nbsp;&nbsp;▶ <b>+3h Forecast:</b> MUCAPE": "static/leg_cape.png",
    "Sfc-3km Low-Level Lapse Rate": "static/leg_lrsfc3.png",
    "700-500mb Mid-Level Lapse Rate": "static/leg_lr75.png",
    "Supercell Composite Parameter": "static/leg_scp.png",
    "Mean BL Moisture Convergence": "static/leg_mfc.png",
    "925/850mb Frontogenesis": "static/leg_fronto.png",
    "850/700mb Frontogenesis": "static/leg_fronto.png",
    "Effective Bulk Shear": "static/leg_eff_shear.png",
    "Corfidi Upwind (Back-Building) Vectors": "static/leg_corfidi_up.png",
    "Corfidi Downwind (Forward) Vectors": "static/leg_corfidi_down.png",
    "850mb Moisture Transport": "static/leg_trans.png",
    "&nbsp;&nbsp;&nbsp;&nbsp;3-Hour 850mb Moisture Transport Change": "static/leg_trans_diff.png",
    "&nbsp;&nbsp;&nbsp;&nbsp;▶ <b>+3h Forecast:</b> 850mb Moisture Transport": "static/leg_trans.png",
    "700mb Moisture Transport": "static/leg_trans.png",
    "850-300mb Mean Layer Wind": "static/leg_mean_wind.png",
    "500mb Absolute Vorticity": "static/leg_vort.png",
    "700-400mb Diff Vorticity Advection": "static/leg_diff_adv.png",
    "250mb Divergence": "static/leg_div.png"
};

const camLegendQPF = `
    <div style="background: white; padding: 10px; border-radius: 5px; font-family: sans-serif; text-align: center; color: black; font-size: 13px; max-width: 250px;">
        <strong>Max Hourly QPF Probability (%)</strong><br>
        <div style="display: flex; margin-top: 5px; border: 1px solid #333;">
            <div style="background: #ffffcc; flex: 1; padding: 2px 5px;">10</div>
            <div style="background: #a1dab4; flex: 1; padding: 2px 5px;">30</div>
            <div style="background: #41b6c4; flex: 1; padding: 2px 5px;">50</div>
            <div style="background: #2c7fb8; flex: 1; padding: 2px 5px; color: white;">70</div>
            <div style="background: #253494; flex: 1; padding: 2px 5px; color: white;">90+</div>
        </div>
    </div>
`;

const camLegendFFG = `
    <div style="background: white; padding: 10px; border-radius: 5px; font-family: sans-serif; text-align: center; color: black; font-size: 13px; max-width: 250px;">
        <strong>Max FFG Exceedance Probability (%)</strong><br>
        <div style="display: flex; margin-top: 5px; border: 1px solid #333;">
            <div style="background: #ffffb2; flex: 1; padding: 2px 5px;">10</div>
            <div style="background: #fecc5c; flex: 1; padding: 2px 5px;">30</div>
            <div style="background: #fd8d3c; flex: 1; padding: 2px 5px;">50</div>
            <div style="background: #f03b20; flex: 1; padding: 2px 5px; color: white;">70</div>
            <div style="background: #bd0026; flex: 1; padding: 2px 5px; color: white;">90+</div>
        </div>
    </div>
`;

const hazardLegendHTML = `
    <div style="background: white; padding: 10px; border-radius: 5px; font-family: sans-serif; color: black; font-size: 12px; min-width: 200px; text-align: left;">
        <strong style="display: block; text-align: center; margin-bottom: 5px; font-size: 13px;">Hydro Warnings & Advisories</strong>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: red; margin-right: 8px; border: 1px solid #333; opacity: 0.6;"></div>
            <span>Flash Flood Warning</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: green; margin-right: 8px; border: 1px solid #333; opacity: 0.6;"></div>
            <span>Flood Warning</span>
        </div>
        <div style="display: flex; align-items: center;">
            <div style="width: 15px; height: 15px; background: lightgreen; margin-right: 8px; border: 1px solid #333; opacity: 0.6;"></div>
            <span>Flood Advisory</span>
        </div>
    </div>
`;

const watchLegendHTML = `
    <div style="background: white; padding: 10px; border-radius: 5px; font-family: sans-serif; color: black; font-size: 12px; min-width: 200px; text-align: left;">
        <strong style="display: block; text-align: center; margin-bottom: 5px; font-size: 13px;">Hydro Watches</strong>
        <div style="display: flex; align-items: center;">
            <div style="width: 15px; height: 15px; background: seagreen; margin-right: 8px; border: 1px solid #333; opacity: 0.6;"></div>
            <span>Flood / Flash Flood Watch</span>
        </div>
    </div>
`;

const mpdLegendHTML = `
    <div style="background: white; padding: 10px; border-radius: 5px; font-family: sans-serif; color: black; font-size: 12px; min-width: 200px; text-align: left;">
        <strong style="display: block; text-align: center; margin-bottom: 5px; font-size: 13px;">WPC Active MPDs</strong>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 20px; height: 3px; background: transparent; border-top: 3px dashed #800080; margin-right: 8px;"></div>
            <span>Flash Flood Likely</span>
        </div>
        <div style="display: flex; align-items: center;">
            <div style="width: 20px; height: 3px; background: transparent; border-top: 3px dashed #0000FF; margin-right: 8px;"></div>
            <span>Flash Flood Possible</span>
        </div>
    </div>
`;

const eroLegendHTML = `
    <div style="background: white; padding: 10px; border-radius: 5px; font-family: sans-serif; color: black; font-size: 12px; min-width: 200px; text-align: left;">
        <strong style="display: block; text-align: center; margin-bottom: 5px; font-size: 13px;">Day 1 ERO Risks</strong>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: #00ff00; margin-right: 8px; border: 1px solid #333; opacity: 0.6;"></div>
            <span>Marginal Risk (MRGL)</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: #ffff00; margin-right: 8px; border: 1px solid #333; opacity: 0.6;"></div>
            <span>Slight Risk (SLGT)</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: #ff0000; margin-right: 8px; border: 1px solid #333; opacity: 0.6;"></div>
            <span>Moderate Risk (MDT)</span>
        </div>
        <div style="display: flex; align-items: center;">
            <div style="width: 15px; height: 15px; background: #ff00ff; margin-right: 8px; border: 1px solid #333; opacity: 0.6;"></div>
            <span>High Risk (HIGH)</span>
        </div>
    </div>
`;

const ffdLegendHTML = `
    <div style="background: white; padding: 10px; border-radius: 5px; font-family: sans-serif; color: black; font-size: 12px; min-width: 200px; text-align: left;">
        <strong style="display: block; text-align: center; margin-bottom: 5px; font-size: 13px;">FFD Inferred Impacts</strong>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: #00ff00; margin-right: 8px; border: 1px solid #333; opacity: 0.6;"></div>
            <span>Monitor</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: #ffff00; margin-right: 8px; border: 1px solid #333; opacity: 0.6;"></div>
            <span>Advisory</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: #ffaa00; margin-right: 8px; border: 1px solid #333; opacity: 0.6;"></div>
            <span>Base FFW</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: #ff0000; margin-right: 8px; border: 1px solid #333; opacity: 0.6;"></div>
            <span>Considerable FFW</span>
        </div>
        <div style="display: flex; align-items: center;">
            <div style="width: 15px; height: 15px; background: #ff00ff; margin-right: 8px; border: 1px solid #333; opacity: 0.6;"></div>
            <span>Catastrophic FFW</span>
        </div>
    </div>
`;

const mrmsLegendQPE1hr = `
    <div style="background: white; padding: 10px; border-radius: 5px; text-align: center; color: black; font-family: sans-serif; min-width: 280px; max-width: 320px;">
        <strong style="font-size: 13px;">MRMS 1-Hour QPE (inches)</strong><br>
        <div style="display: flex; margin-top: 5px; border: 1px solid #333; height: 16px;">
            <div style="background: #000080; flex: 1;" title="0.01 - 0.1"></div>
            <div style="background: #0000FF; flex: 1;" title="0.1 - 0.25"></div>
            <div style="background: #0080FF; flex: 1;" title="0.25 - 0.5"></div>
            <div style="background: #00FFFF; flex: 1;" title="0.5 - 1.0"></div>
            <div style="background: #00FF00; flex: 1;" title="1.0 - 1.5"></div>
            <div style="background: #00C800; flex: 1;" title="1.5 - 2.0"></div>
            <div style="background: #008000; flex: 1;" title="2.0 - 3.0"></div>
            <div style="background: #FFFF00; flex: 1;" title="3.0 - 4.0"></div>
            <div style="background: #FFC800; flex: 1;" title="4.0 - 5.0"></div>
            <div style="background: #FF9000; flex: 1;" title="5.0 - 6.0"></div>
            <div style="background: #FF0000; flex: 1;" title="6.0 - 8.0"></div>
            <div style="background: #C00000; flex: 1;" title="8.0+"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 2px;">
            <span>.01</span><span>.1</span><span>.25</span><span>.5</span><span>1</span><span>1.5</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>8+</span>
        </div>
    </div>
`;

const mrmsLegendQPEMulti = `
    <div style="background: white; padding: 10px; border-radius: 5px; text-align: center; color: black; font-family: sans-serif; min-width: 280px; max-width: 320px;">
        <strong style="font-size: 13px;">MRMS Multi-Hour QPE (inches)</strong><br>
        <div style="display: flex; margin-top: 5px; border: 1px solid #333; height: 16px;">
            <div style="background: #000080; flex: 1;" title="0.01 - 0.1"></div>
            <div style="background: #0000FF; flex: 1;" title="0.1 - 0.25"></div>
            <div style="background: #0080FF; flex: 1;" title="0.25 - 0.5"></div>
            <div style="background: #00FFFF; flex: 1;" title="0.5 - 1.0"></div>
            <div style="background: #00FF00; flex: 1;" title="1.0 - 1.5"></div>
            <div style="background: #00C800; flex: 1;" title="1.5 - 2.0"></div>
            <div style="background: #008000; flex: 1;" title="2.0 - 3.0"></div>
            <div style="background: #FFFF00; flex: 1;" title="3.0 - 4.0"></div>
            <div style="background: #FFC800; flex: 1;" title="4.0 - 5.0"></div>
            <div style="background: #FF9000; flex: 1;" title="5.0 - 6.0"></div>
            <div style="background: #FF0000; flex: 1;" title="6.0 - 8.0"></div>
            <div style="background: #C00000; flex: 1;" title="8.0 - 10.0"></div>
            <div style="background: #FF00FF; flex: 1;" title="10.0 - 15.0"></div>
            <div style="background: #800080; flex: 1;" title="15.0 - 20.0"></div>
            <div style="background: #FFFFFF; flex: 1;" title="20.0+"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 2px;">
            <span>.01</span><span>.1</span><span>.25</span><span>.5</span><span>1</span><span>1.5</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>8</span><span>10</span><span>15</span><span>20+</span>
        </div>
    </div>
`;

const mrmsCrest24hLegendHTML = `
    <div style="background: white; padding: 10px; border-radius: 5px; text-align: center; color: black; font-family: sans-serif; min-width: 300px; max-width: 330px;">
        <strong style="font-size: 13px;">MRMS FLASH CREST Unit Q — 24-Hour Maximum</strong><br>
        <span style="font-size: 10px;">m³ s⁻¹ km⁻²</span>
        <div style="display: flex; margin-top: 6px; border: 1px solid #333; height: 17px;">
            <div style="background: #00ff00; flex: 1;" title="1.0–1.5"></div>
            <div style="background: #ffff00; flex: 1;" title="1.5–2.0"></div>
            <div style="background: #ffc800; flex: 1;" title="2.0–3.0"></div>
            <div style="background: #ff8c00; flex: 1;" title="3.0–4.0"></div>
            <div style="background: #ff4600; flex: 1;" title="4.0–5.0"></div>
            <div style="background: #ff0000; flex: 1;" title="5.0–6.0"></div>
            <div style="background: #be00be; flex: 1;" title="6.0–8.5"></div>
            <div style="background: #6400be; flex: 1;" title="8.5–10.0"></div>
            <div style="background: #0050ff; flex: 1;" title="10.0–15.0"></div>
            <div style="background: #0000b4; flex: 1;" title="15.0–20.0"></div>
            <div style="background: #000064; flex: 1;" title="20.0+"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 8px; margin-top: 2px;">
            <span>1</span><span>1.5</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>8.5</span><span>10</span><span>15</span><span>20+</span>
        </div>
        <div style="font-size: 9px; margin-top: 4px; text-align: left;">
            Transparent where Unit Q is below 1.0 or unavailable.
        </div>
    </div>
`;

const mrmsFfd24hLegendHTML = `
    <div style="background: white; padding: 10px; border-radius: 5px; font-family: sans-serif; color: black; font-size: 12px; min-width: 240px; text-align: left;">
        <strong style="display: block; text-align: center; margin-bottom: 6px; font-size: 13px;">MRMS FLASH FFD — Highest 24-Hour Category</strong>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: transparent; margin-right: 8px; border: 1px dashed #555;"></div>
            <span><strong>0</strong> — None / transparent</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: #00ff00; margin-right: 8px; border: 1px solid #333;"></div>
            <span><strong>1</strong> — Monitor</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: #ffff00; margin-right: 8px; border: 1px solid #333;"></div>
            <span><strong>2</strong> — Flood Advisory</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: #ffaa00; margin-right: 8px; border: 1px solid #333;"></div>
            <span><strong>3</strong> — FFW Base</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 15px; height: 15px; background: #ff0000; margin-right: 8px; border: 1px solid #333;"></div>
            <span><strong>4</strong> — FFW Considerable</span>
        </div>
        <div style="display: flex; align-items: center;">
            <div style="width: 15px; height: 15px; background: #ff00ff; margin-right: 8px; border: 1px solid #333;"></div>
            <span><strong>5</strong> — FFW Catastrophic</span>
        </div>
    </div>
`;

const nwmLegendHTML = `
    <div style="background: white; padding: 10px; border-radius: 5px; text-align: center; color: black; font-family: sans-serif; min-width: 250px;">
        <strong style="font-size: 13px;">NWM 0-40cm Soil Saturation (%)</strong><br>
        <div style="display: flex; margin-top: 5px; border: 1px solid #333; height: 16px;">
            <div style="background: #d2b48c; flex: 2;" title="0-40%"></div>
            <div style="background: #e0eee0; flex: 1;" title="40-60%"></div>
            <div style="background: #90ee90; flex: 0.5;" title="60-70%"></div>
            <div style="background: #3cb371; flex: 0.5;" title="70-80%"></div>
            <div style="background: #00ced1; flex: 0.5;" title="80-90%"></div>
            <div style="background: #1e90ff; flex: 0.25;" title="90-95%"></div>
            <div style="background: #00008b; flex: 0.25;" title="95-100%"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 2px;">
            <span>0</span><span>40</span><span>60</span><span>70</span><span>80</span><span>90</span><span>100</span>
        </div>
    </div>
`;

const sportLegendHTML = `
    <div style="background: white; padding: 10px; border-radius: 5px; text-align: center; color: black; font-family: sans-serif; min-width: 250px;">
        <strong style="font-size: 13px;">NASA SPoRT-LIS Volumetric Soil Moisture Percentile (0–100 cm)</strong><br>
        <div style="display: flex; margin-top: 5px; border: 1px solid #333; height: 16px;">
            <div style="background: rgb(170,220,255); flex: 1;" title="70-80"></div>
            <div style="background: rgb(80,170,255); flex: 1;" title="80-90"></div>
            <div style="background: rgb(20,110,235); flex: 0.5;" title="90-95"></div>
            <div style="background: rgb(0,45,180); flex: 0.3;" title="95-98"></div>
            <div style="background: rgb(120,0,180); flex: 0.2;" title="98-100"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 2px;">
            <span>70</span><span>80</span><span>90</span><span>95</span><span>98</span><span>100</span>
        </div>
    </div>
`;


const nrcsHsgLegendHTML = `
    <div style="background:white;padding:10px;border-radius:5px;color:black;font-family:sans-serif;min-width:270px;">
        <div style="text-align:center;font-weight:800;font-size:13px;margin-bottom:2px;">NRCS Hydrologic Soil Group</div>
        <div style="text-align:center;font-size:9px;margin-bottom:7px;color:#444;">Hydrologic Group — Dominant Conditions (hydgrpdcd)</div>
        ${[
            ['#2c7bb6', 'A', 'High infiltration / low runoff potential'],
            ['#abd9e9', 'B', 'Moderate infiltration / moderately low runoff'],
            ['#fdae61', 'C', 'Slow infiltration / moderately high runoff'],
            ['#d7191c', 'D', 'Very slow infiltration / high runoff potential'],
            ['#c2a5cf', 'A/D', 'A if drained; D if undrained'],
            ['#9970ab', 'B/D', 'B if drained; D if undrained'],
            ['#762a83', 'C/D', 'C if drained; D if undrained']
        ].map(([color, label, description]) => `
            <div style="display:grid;grid-template-columns:18px 34px 1fr;gap:6px;align-items:center;margin:3px 0;font-size:9px;">
                <span style="width:16px;height:13px;background:${color};border:1px solid #555;"></span>
                <strong>${label}</strong>
                <span>${description}</span>
            </div>
        `).join('')}
        <div style="margin-top:7px;padding-top:6px;border-top:1px solid #bbb;font-size:8px;line-height:1.25;color:#555;">
            FY2026 USDA-NRCS gNATSGO, native 30 m source aggregated to the 1 km equal-area Phase H1 analysis.
            Dual groups are preserved; drainage state is not inferred. Static soil-property context — not a real-time soil-moisture field or standalone runoff threshold.
        </div>
    </div>
`;

const nlcdImperviousLegendHTML = `
    <div style="background:white;padding:10px;border-radius:5px;color:black;font-family:sans-serif;min-width:270px;">
        <div style="text-align:center;font-weight:800;font-size:13px;margin-bottom:2px;">USGS Annual NLCD Impervious Surface</div>
        <div style="text-align:center;font-size:9px;margin-bottom:7px;color:#444;">2025 Fractional Impervious Surface • mean % per 1 km analysis cell</div>
        <div style="display:grid;grid-template-columns:18px 52px 1fr;gap:6px;align-items:center;margin:3px 0;font-size:9px;">
            <span style="width:16px;height:13px;background:#bdbdbd;border:1px solid #555;"></span>
            <strong>0%</strong>
            <span>No mapped impervious surface</span>
        </div>
        ${[
            ['#ffffcc', '>0–5%', 'Very low impervious fraction'],
            ['#ffeda0', '5–10%', 'Low impervious fraction'],
            ['#fed976', '10–20%', 'Modest impervious fraction'],
            ['#feb24c', '20–40%', 'Moderate impervious fraction'],
            ['#fd8d3c', '40–60%', 'High impervious fraction'],
            ['#f03b20', '60–80%', 'Very high impervious fraction'],
            ['#bd0026', '80–100%', 'Highly impervious surface']
        ].map(([color, label, description]) => `
            <div style="display:grid;grid-template-columns:18px 52px 1fr;gap:6px;align-items:center;margin:3px 0;font-size:9px;">
                <span style="width:16px;height:13px;background:${color};border:1px solid #555;"></span>
                <strong>${label}</strong>
                <span>${description}</span>
            </div>
        `).join('')}
        <div style="margin-top:7px;padding-top:6px;border-top:1px solid #bbb;font-size:8px;line-height:1.25;color:#555;">
            USGS Annual NLCD Collection 1.2 (2025), native 30 m source aggregated to the retained 1 km equal-area Phase H2 analysis.
            0% valid land cells are shown with a neutral gray tint. Basemap visible / no color indicates source NoData or insufficient valid source coverage, not an imperviousness category.
            Static land-surface context — not a rainfall threshold or dynamic runoff estimate.
        </div>
    </div>
`;

const GLM_FALLBACK_RENDERING = {
    5: {
        labels: ['1', '2–3', '4–7', '8–15', '16–31', '32–63', '64–127', '128–255', '≥256'],
        rgba: [
            [0, 255, 255, 255], [0, 255, 0, 255], [255, 255, 0, 255],
            [255, 153, 0, 255], [255, 0, 0, 255], [255, 0, 255, 255],
            [199, 125, 255, 255], [0, 102, 255, 255], [255, 255, 255, 255]
        ],
        units: 'flashes per 0.02-degree grid cell per five minutes'
    },
    rolling: {
        labels: ['1', '2–3', '4–7', '8–15', '16–31', '32–63', '64–127', '128–255', '256–511', '≥512'],
        rgba: [
            [0, 255, 255, 255], [0, 255, 0, 255], [255, 255, 0, 255],
            [255, 153, 0, 255], [255, 0, 0, 255], [255, 0, 255, 255],
            [199, 125, 255, 255], [0, 102, 255, 255], [102, 204, 255, 255],
            [255, 255, 255, 255]
        ],
        units: 'flash extent contributions per 0.02-degree grid cell'
    },
    trendMap: {
        labels: ['Past-Hour Lightning Context', 'Rapidly Decreasing', 'Decreasing', 'Steady', 'Increasing', 'Rapidly Increasing'],
        rgba: [
            [142, 146, 158, 156], [56, 118, 255, 224], [76, 234, 255, 220],
            [255, 232, 120, 214], [255, 170, 64, 224], [255, 72, 72, 232]
        ],
        units: 'categorical 15-minute convective trend class'
    }
};

function escapeGLMLegendText(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function validateGLMRenderingMetadata(metadata, layerName = 'GOES GLM') {
    const rendering = metadata?.rendering || {};
    const bins = rendering.bins;
    const labels = rendering.labels;
    const rgba = rendering.rgba;

    if (!Array.isArray(bins) || !Array.isArray(labels) || !Array.isArray(rgba)) {
        throw new Error(`${layerName}: rendering bins, labels, and rgba arrays are required`);
    }
    if (bins.length === 0 || bins.length !== labels.length || bins.length !== rgba.length) {
        throw new Error(`${layerName}: rendering bins, labels, and rgba lengths do not match`);
    }

    const normalizedBins = bins.map(Number);
    normalizedBins.forEach((value, index) => {
        if (!Number.isFinite(value) || value < 0) {
            throw new Error(`${layerName}: invalid rendering bin at index ${index}`);
        }
        if (index > 0 && value <= normalizedBins[index - 1]) {
            throw new Error(`${layerName}: rendering bins must be strictly increasing`);
        }
    });

    const normalizedColors = rgba.map((color, index) => {
        if (!Array.isArray(color) || color.length !== 4) {
            throw new Error(`${layerName}: RGBA entry ${index} must contain four channels`);
        }
        return color.map(channel => {
            const value = Number(channel);
            if (!Number.isFinite(value) || value < 0 || value > 255) {
                throw new Error(`${layerName}: invalid RGBA channel in entry ${index}`);
            }
            return Math.round(value);
        });
    });

    return {
        bins: normalizedBins,
        labels: labels.map(label => String(label)),
        rgba: normalizedColors
    };
}

function glmRGBAtoCSS(color) {
    const alpha = Math.max(0, Math.min(255, Number(color[3]))) / 255;
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha.toFixed(3)})`;
}

function buildGLMLegendHTML(title, labels, rgba, subtitle) {
    const bins = labels.map((label, index) => `
        <div style="display: grid; grid-template-columns: 18px minmax(0, 1fr); align-items: center; gap: 6px; min-width: 0;">
            <span style="display: block; width: 18px; height: 12px; border: 1px solid rgba(0, 0, 0, 0.55); border-radius: 2px; background: ${glmRGBAtoCSS(rgba[index])};"></span>
            <span style="min-width: 0; font-size: 10px; font-weight: 700; line-height: 1.15; text-align: left; white-space: nowrap;">${escapeGLMLegendText(label)}</span>
        </div>
    `).join('');
    return `
        <div style="box-sizing: border-box; width: 100%; max-width: 100%; overflow: hidden; background: white; padding: 9px; border-radius: 5px; color: black; font-family: sans-serif;">
            <strong style="display: block; font-size: 13px; line-height: 1.2; text-align: center;">${escapeGLMLegendText(title)}</strong>
            <span style="display: block; margin-top: 2px; font-size: 9px; line-height: 1.2; text-align: center;">${escapeGLMLegendText(subtitle)}</span>
            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 12px; margin-top: 8px;">${bins}</div>
        </div>
    `;
}

function glmLegendHTMLFromMetadata(config, metadata) {
    const fallback = config.legendId === 'trend-map'
        ? GLM_FALLBACK_RENDERING.trendMap
        : (config.windowMinutes === 5 ? GLM_FALLBACK_RENDERING[5] : GLM_FALLBACK_RENDERING.rolling);

    let rendering = fallback;
    if (metadata) {
        try {
            rendering = validateGLMRenderingMetadata(metadata, config.name);
        } catch (error) {
            console.error(`GLM legend metadata rejected for ${config.name}:`, error);
        }
    }

    const title = metadata?.display_label || config.name;
    const subtitle = metadata?.units || fallback.units;
    return buildGLMLegendHTML(title, rendering.labels, rendering.rgba, subtitle);
}

function glmLegendHTMLForConfig(config) {
    return glmLegendHTMLFromMetadata(config, glmMetadataByName.get(config.name));
}

// Global tracker for currently active layers
let activeLayerNames = new Set();

function updateLegends() {
    const legendContainer = document.getElementById('legend-container');
    if (!legendContainer) return;

    legendContainer.innerHTML = '';
    let hasLegend = false;

    const addLegendBlock = (htmlContent) => {
        const div = document.createElement('div');
        div.className = 'legend-block';
        div.innerHTML = htmlContent;
        legendContainer.appendChild(div);
        hasLegend = true;
    };

    qpeFFG.forEach(x=>{const html=x.legendHTML();if(html)addLegendBlock(html);});
    const tendencyLegend=ffgTendency.legendHTML();if(tendencyLegend)addLegendBlock(tendencyLegend);
    const ffgLegend = rfcFFG.legendHTML();
    if (ffgLegend) addLegendBlock(ffgLegend);
    const changeLegend = sportChange?.legendHTML();
    if (changeLegend) addLegendBlock(changeLegend);
    const rsmLegend = sportRSM?.legendHTML();
    if (rsmLegend) addLegendBlock(rsmLegend);
    [gdiGuidance,gdiERO].forEach(suite => {const html=suite.legendHTML();if(html)addLegendBlock(html);});
    const rapGdiLegend = rapGDI.legendHTML();
    if (rapGdiLegend) addLegendBlock(rapGdiLegend);
    const gdiLegend = hrrrGDI.legendHTML();
    if (gdiLegend) addLegendBlock(gdiLegend);
    const suiteLegend = sportSuite?.legendHTML();
    if (suiteLegend) addLegendBlock(suiteLegend);

    if (activeLayerNames.has('Active Hydro Warnings & Advisories')) addLegendBlock(hazardLegendHTML);
    if (activeLayerNames.has('Active Hydro Watches')) addLegendBlock(watchLegendHTML);
    if (activeLayerNames.has('WPC Active MPDs')) addLegendBlock(mpdLegendHTML);
    if (activeLayerNames.has('Day 1 ERO (Real-Time)')) addLegendBlock(eroLegendHTML);
    if (
        activeLayerNames.has(WFIGS_CURRENT_LAYER_NAME) ||
        activeLayerNames.has(WFIGS_YTD_LAYER_NAME) ||
        activeLayerNames.has(WFIGS_HISTORY_LAYER_NAME)
    ) {
        addLegendBlock(buildWFIGSLegendHTML());
    }
    if (activeLayerNames.has(MRMS_RALA_LAYER_NAME)) addLegendBlock(buildMRMSRALALegendHTML());
    if (activeLayerNames.has('MRMS DVD Flash Flood Detector')) addLegendBlock(ffdLegendHTML);
    if (activeLayerNames.has(MRMS_CREST_24H_LAYER_NAME)) addLegendBlock(mrmsCrest24hLegendHTML);
    if (activeLayerNames.has(MRMS_FFD_24H_LAYER_NAME)) addLegendBlock(mrmsFfd24hLegendHTML);
    if (activeLayerNames.has('NWM Soil Saturation (0-40cm)')) addLegendBlock(nwmLegendHTML);
    if (activeLayerNames.has(NRCS_HSG_LAYER_NAME)) addLegendBlock(nrcsHsgLegendHTML);
    if (activeLayerNames.has(NLDAS3_SOIL_LAYER_NAME)) addLegendBlock(buildNLDAS3CategoricalLegendHTML('soil_texture'));
    if (activeLayerNames.has(NLDAS3_LANDCOVER_LAYER_NAME)) addLegendBlock(buildNLDAS3CategoricalLegendHTML('landcover'));
    if (activeLayerNames.has(NLDAS3_SLOPE_LAYER_NAME)) addLegendBlock(buildNLDAS3SlopeLegendHTML());
    if (activeLayerNames.has(NLCD_IMPERVIOUS_LAYER_NAME)) addLegendBlock(nlcdImperviousLegendHTML);
    GLM_LAYER_CONFIGS
        .filter(config => activeLayerNames.has(config.name))
        .forEach(config => addLegendBlock(glmLegendHTMLForConfig(config)));
    if (activeLayerNames.has(LIGHTNINGCAST_LAYER_NAME)) addLegendBlock(buildLightningCastLegendHTML());
    HRRR_DIAGNOSTIC_LAYER_CONFIGS
        .filter(config => activeLayerNames.has(config.label))
        .forEach(config => addLegendBlock(buildHRRRTLELegendHTML(config)));
    HRRR_TLE_LAYER_CONFIGS
        .filter(config => activeLayerNames.has(config.label))
        .forEach(config => addLegendBlock(buildHRRRTLELegendHTML(config)));
    
    const hasMRMS1hr = Array.from(activeLayerNames).some(name => name === 'MRMS 1-Hour QPE');
    const hasMRMSMulti = Array.from(activeLayerNames).some(name => name.includes('MRMS') && name.includes('QPE') && !name.includes('1-Hour'));
    
    if (hasMRMS1hr) {
        addLegendBlock(mrmsLegendQPE1hr);
    } else if (hasMRMSMulti) {
        addLegendBlock(mrmsLegendQPEMulti);
    }

    const activeCAM = Array.from(activeLayerNames).find(name => name.includes('SuperEnsemble') || name.includes('HREF') || name.includes('REFS'));
    if (activeCAM) {
        if (activeCAM.includes('Max FFG Exceedance')) {
            addLegendBlock(camLegendFFG);
        } else {
            addLegendBlock(camLegendQPF);
        }
    }

    const activeRAP = Array.from(activeLayerNames).find(name => rapLegendMapping[name]);
    if (activeRAP) {
        addLegendBlock(`
            <div style="background: rgba(0, 0, 0, 0.7); padding: 10px; border-radius: 5px;">
                <img src="${rapLegendMapping[activeRAP]}" style="max-width: 300px; display: block;">
            </div>
        `);
    }

    legendContainer.style.display = hasLegend ? 'block' : 'none';
    refreshLegendDockSummary();
}

// Map overlay handling dynamically updates Sets and GUI
map.on('overlayadd', function(eventLayer) {
    activeLayerNames.add(eventLayer.name);
    updateLegends();

    const rapTimeBox = document.getElementById('rap-time-box');
    const mrmsTimeBox = document.getElementById('mrms-time-box');
    const camTimeBox = document.getElementById('cam-time-box');
    const radarTimeBox = document.getElementById('radar-time-box');
    const mrmsRalaTimeBox = document.getElementById('mrms-rala-time-box');
    const ffdTimeBox = document.getElementById('ffd-time-box');
    const mrmsCrest24hTimeBox = document.getElementById('mrms-crest-24h-time-box');
    const mrmsFfd24hTimeBox = document.getElementById('mrms-ffd-24h-time-box');
    const glmTimeBox = document.getElementById('glm-time-box');
    const lightningCastTimeBox = document.getElementById('lightningcast-time-box');
    const hrrrDiagnosticsTimeBox = document.getElementById('hrrr-diagnostics-time-box');
    const hrrrTLETimeBox = document.getElementById('hrrr-tle-time-box');
    const nwmTimeBox = document.getElementById('nwm-time-box');
    const sportTimeBox = document.getElementById('sport-time-box');
    const nrcsHsgTimeBox = document.getElementById('nrcs-hsg-time-box');
    const nlcdImperviousTimeBox = document.getElementById('nlcd-impervious-time-box');
    const nldas3SoilTimeBox = document.getElementById('nldas3-soil-time-box');
    const nldas3LandcoverTimeBox = document.getElementById('nldas3-landcover-time-box');
    const nldas3SlopeTimeBox = document.getElementById('nldas3-slope-time-box');

    if (rapLegendMapping[eventLayer.name]) {
        // Refresh bounds, valid times, and cache-busted RAP image URLs
        // immediately when a RAP layer is selected.
        fetchRAPMetadata();

        if (eventLayer.name.includes('+3h Forecast')) {
            rapTimeBox.innerHTML = `<strong>${rapValidTimeF03}</strong>`;
        } else {
            rapTimeBox.innerHTML = `<strong>${rapValidTime}</strong>`;
        }
        rapTimeBox.style.display = 'block';
    }
    
    if (eventLayer.name.includes('MRMS') && eventLayer.name.includes('QPE')) {
        let hours = 1;
        if (eventLayer.name.includes('24-Hour')) hours = 24;
        if (eventLayer.name.includes('48-Hour')) hours = 48;
        if (eventLayer.name.includes('72-Hour')) hours = 72;
        
        const now = new Date();
        const start = new Date(now.getTime() - (hours * 60 * 60 * 1000));
        mrmsTimeBox.innerHTML = `<strong>MRMS ${hours}-Hour Accumulation</strong><br>${formatUTC(start)} &mdash; ${formatUTC(now)}`;
        mrmsTimeBox.style.display = 'block';
    }

    if (eventLayer.name === MRMS_RALA_LAYER_NAME) {
        updateMRMSRALATimeBox();
        applyMRMSRALAFreshnessState();
        if (mrmsRalaReady && mrmsRalaFresh) {
            activateMRMSRALATimeline({jumpToLatest: true, applyDefaultSpeed: false});
            showMRMSRALAFrame(map.timeDimension.getCurrentTime(), {force: true});
        }
        refreshMRMSRALAFromManifest({forceMetadata: !mrmsRalaReady});
    }

    if (eventLayer.name.includes('MRMS DVD Flash Flood Detector')) {
        if (ffdTimeBox) ffdTimeBox.style.display = 'block';
    }

    if (eventLayer.name === MRMS_CREST_24H_LAYER_NAME) {
        if (mrmsCrest24hTimeBox) {
            mrmsCrest24hTimeBox.innerHTML = formatMRMSFlashTimeBox(
                'MRMS FLASH CREST Unit Q',
                mrmsCrest24hMetadata
            );
            mrmsCrest24hTimeBox.style.display = 'block';
        }
        fetchMRMSFlash24hMetadata();
    }

    if (eventLayer.name === MRMS_FFD_24H_LAYER_NAME) {
        if (mrmsFfd24hTimeBox) {
            mrmsFfd24hTimeBox.innerHTML = formatMRMSFlashTimeBox(
                'MRMS FLASH Flood Detector',
                mrmsFfd24hMetadata
            );
            mrmsFfd24hTimeBox.style.display = 'block';
        }
        fetchMRMSFlash24hMetadata();
    }

    if (eventLayer.name === LIGHTNINGCAST_LAYER_NAME) {
        if (lightningCastTimeBox) {
            lightningCastTimeBox.innerHTML = formatLightningCastTimeBox(lightningCastMetadata);
            lightningCastTimeBox.style.display = 'block';
        }
        refreshLightningCastFromManifest({forceMetadata: !lightningCastReady});
    }

    if (HRRR_DIAGNOSTIC_CONFIG_BY_NAME.has(eventLayer.name)) {
        if (hrrrDiagnosticsTimeBox) {
            hrrrDiagnosticsTimeBox.innerHTML = formatHRRRDiagnosticTimeBox(
                HRRR_DIAGNOSTIC_CONFIG_BY_NAME.get(eventLayer.name),
                hrrrTLEMetadata
            );
            hrrrDiagnosticsTimeBox.style.display = 'block';
        }
        refreshHRRRTLEFromManifest({forceMetadata: !hrrrTLEReady});
    }

    if (HRRR_TLE_CONFIG_BY_NAME.has(eventLayer.name)) {
        if (hrrrTLETimeBox) {
            hrrrTLETimeBox.innerHTML = formatHRRRTLETimeBox(
                HRRR_TLE_CONFIG_BY_NAME.get(eventLayer.name),
                hrrrTLEMetadata
            );
            hrrrTLETimeBox.style.display = 'block';
        }
        refreshHRRRTLEFromManifest({forceMetadata: !hrrrTLEReady});
    }

    const glmConfig = glmConfigByName.get(eventLayer.name);
    if (glmConfig) {
        if (glmTimeBox) {
            glmTimeBox.innerHTML = formatGLMTimeBox(
                glmConfig,
                glmMetadataByName.get(glmConfig.name)
            );
            glmTimeBox.style.display = 'block';
        }
        updateGLMTrendCard();
        fetchGLMMetadata([glmConfig]);
    }

    if (eventLayer.name === 'NWM Soil Saturation (0-40cm)') {
        fetchNWMMetadata();

        if (nwmTimeBox) {
            nwmTimeBox.innerHTML = nwmMetadata
                ? `<strong>NWM 0-40cm Soil Saturation</strong><br><span style="color: #ffeb3b;">${nwmValidTime}</span>`
                : `<strong>NWM 0-40cm Soil Saturation</strong><br><span style="color: #ffeb3b;">Loading latest raster...</span>`;
            nwmTimeBox.style.display = 'block';
        }
    }



    if (eventLayer.name === NRCS_HSG_LAYER_NAME) {
        if (!nrcsHsgReady) fetchNRCSHSGMetadata();
        if (nrcsHsgTimeBox) {
            nrcsHsgTimeBox.innerHTML = nrcsHsgReady
                ? formatNRCSHSGTimeBox(nrcsHsgMetadata)
                : `<strong>NRCS Hydrologic Soil Group</strong><br><span style="color:#ffeb3b;">Loading annual soil layer...</span>`;
            nrcsHsgTimeBox.style.display = 'block';
        }
    }

    if (eventLayer.name === NLCD_IMPERVIOUS_LAYER_NAME) {
        if (!nlcdImperviousReady) fetchNLCDImperviousMetadata();
        if (nlcdImperviousTimeBox) {
            nlcdImperviousTimeBox.innerHTML = nlcdImperviousReady
                ? formatNLCDImperviousTimeBox(nlcdImperviousMetadata)
                : `<strong>USGS Annual NLCD Impervious Surface</strong><br><span style="color:#ffeb3b;">Loading annual land-surface layer...</span>`;
            nlcdImperviousTimeBox.style.display = 'block';
        }
    }

    if (eventLayer.name === NLDAS3_SOIL_LAYER_NAME) {
        if (!nldas3StaticReady) fetchNLDAS3StaticMetadata();
        if (nldas3SoilTimeBox) {
            nldas3SoilTimeBox.innerHTML = nldas3StaticReady
                ? formatNLDAS3StaticTimeBox('soil_texture')
                : `<strong>NASA NLDAS-3 Soil Texture</strong><br><span style="color:#ffeb3b;">Loading validated static layer...</span>`;
            nldas3SoilTimeBox.style.display = 'block';
        }
    }

    if (eventLayer.name === NLDAS3_LANDCOVER_LAYER_NAME) {
        if (!nldas3StaticReady) fetchNLDAS3StaticMetadata();
        if (nldas3LandcoverTimeBox) {
            nldas3LandcoverTimeBox.innerHTML = nldas3StaticReady
                ? formatNLDAS3StaticTimeBox('landcover')
                : `<strong>NASA NLDAS-3 Land Use / Vegetation</strong><br><span style="color:#ffeb3b;">Loading validated static layer...</span>`;
            nldas3LandcoverTimeBox.style.display = 'block';
        }
    }

    if (eventLayer.name === NLDAS3_SLOPE_LAYER_NAME) {
        if (!nldas3SlopeReady) fetchNLDAS3SlopeMetadata();
        if (nldas3SlopeTimeBox) {
            nldas3SlopeTimeBox.innerHTML = nldas3SlopeReady
                ? formatNLDAS3SlopeTimeBox(nldas3SlopeMetadata)
                : `<strong>NASA NLDAS-3 / MERIT Terrain Slope</strong><br><span style="color:#ffeb3b;">Loading validated static layer...</span>`;
            nldas3SlopeTimeBox.style.display = 'block';
        }
    }

    if (eventLayer.name.includes('SuperEnsemble') || eventLayer.name.includes('HREF') || eventLayer.name.includes('REFS')) {
        const isEROCAM = eventLayer.name.includes('[ERO]');
        const displayedCycles = isEROCAM ? eroCamCycles : camCycles;
        let titleText = "";
        let cycleText = `HREF: ${displayedCycles.href}Z &nbsp;|&nbsp; REFS: ${displayedCycles.refs}Z`;
        let targetCycleForMath = displayedCycles.href;
        let targetInitForMath = isEROCAM ? null : camInitTimes.href;
        
        if (eventLayer.name.includes('SuperEnsemble')) {
            titleText = "SuperEnsemble Blend";
        } else if (eventLayer.name.includes('HREF')) {
            titleText = "HREF Only";
            cycleText = `Latest Run: ${displayedCycles.href}Z`;
            targetCycleForMath = displayedCycles.href;
            targetInitForMath = isEROCAM ? null : camInitTimes.href;
        } else if (eventLayer.name.includes('REFS')) {
            titleText = "REFS Only";
            cycleText = `Latest Run: ${displayedCycles.refs}Z`;
            targetCycleForMath = displayedCycles.refs;
            targetInitForMath = isEROCAM ? null : camInitTimes.refs;
        }

        let validRangeStr = "Valid Time Unknown";
        if (isEROCAM) {
            titleText = titleText + " (Day 1 ERO)";
            validRangeStr = eroValidRangeStr;
        } else {
            let currentWindow = "+3h to +9h";
            let matchedKey = Object.keys(camLayers).find(key => camLayers[key] === eventLayer.layer);
            if (matchedKey && matchedKey.includes('9h_to_15h')) {
                currentWindow = "+9h to +15h";
            }
            validRangeStr = getValidTimeRange(
                targetCycleForMath,
                currentWindow,
                targetInitForMath
            );
        }

        let productName = "Probabilistic Guidance";
        if (eventLayer.name.includes(':')) {
            productName = eventLayer.name.split(':')[1].trim(); 
        }

        camTimeBox.innerHTML = `
            <strong>${titleText}</strong><br>
            <span style="color: #4fc3f7; font-weight: bold; font-size: 0.95em;">${productName}</span><br>
            <span style="font-size: 0.9em;">${cycleText}</span>
            <hr style="margin: 5px 0; border-color: #555;">
            <span style="font-size: 0.95em; color: #ffeb3b;">Valid: ${validRangeStr}</span>
        `;
        camTimeBox.style.display = 'block';
    }

    if (eventLayer.name.includes('NEXRAD Radar')) {
        radarTimeBox.style.display = 'block';
        const currentFrameTime = new Date(map.timeDimension.getCurrentTime());
        radarTimeBox.innerHTML = `
            <strong>IEM NEXRAD Backup Loop</strong><br>
            <span style="color: #ffeb3b; font-weight: bold; font-size: 1.05em;">Frame: ${formatUTC(currentFrameTime)}</span>
        `;
    }

    if (eventLayer.name.includes('GOES-') && !glmConfigByName.has(eventLayer.name)) {
        radarTimeBox.style.display = 'block';
        radarTimeBox.innerHTML = `
            <strong>${eventLayer.name}</strong><br>
            <span style="color: #4fc3f7; font-weight: bold; font-size: 0.95em;">Real-Time Feed</span><br>
            <span style="font-size: 0.85em; color: #ffeb3b;">Last Checked: ${formatUTC(new Date())}</span>
        `;
    }


    refreshLegendDockSummary();
});

map.on('overlayremove', function(eventLayer) {
    activeLayerNames.delete(eventLayer.name);
    updateLegends();

    const rapTimeBox = document.getElementById('rap-time-box');
    const mrmsTimeBox = document.getElementById('mrms-time-box');
    const camTimeBox = document.getElementById('cam-time-box');
    const radarTimeBox = document.getElementById('radar-time-box');
    const mrmsRalaTimeBox = document.getElementById('mrms-rala-time-box');
    const ffdTimeBox = document.getElementById('ffd-time-box');
    const mrmsCrest24hTimeBox = document.getElementById('mrms-crest-24h-time-box');
    const mrmsFfd24hTimeBox = document.getElementById('mrms-ffd-24h-time-box');
    const glmTimeBox = document.getElementById('glm-time-box');
    const lightningCastTimeBox = document.getElementById('lightningcast-time-box');
    const hrrrDiagnosticsTimeBox = document.getElementById('hrrr-diagnostics-time-box');
    const hrrrTLETimeBox = document.getElementById('hrrr-tle-time-box');
    const nwmTimeBox = document.getElementById('nwm-time-box');
    const sportTimeBox = document.getElementById('sport-time-box');
    const nrcsHsgTimeBox = document.getElementById('nrcs-hsg-time-box');
    const nlcdImperviousTimeBox = document.getElementById('nlcd-impervious-time-box');
    const nldas3SoilTimeBox = document.getElementById('nldas3-soil-time-box');
    const nldas3LandcoverTimeBox = document.getElementById('nldas3-landcover-time-box');
    const nldas3SlopeTimeBox = document.getElementById('nldas3-slope-time-box');
    
    if (rapLegendMapping[eventLayer.name]) {
        const hasRAP = Array.from(activeLayerNames).some(name => rapLegendMapping[name]);
        if (!hasRAP) rapTimeBox.style.display = 'none';
    }
    
    if (eventLayer.name.includes('MRMS') && eventLayer.name.includes('QPE')) {
        const hasMRMS = Array.from(activeLayerNames).some(name => name.includes('MRMS') && name.includes('QPE'));
        if (!hasMRMS) mrmsTimeBox.style.display = 'none';
    }
    
    if (eventLayer.name === MRMS_RALA_LAYER_NAME) {
        if (mrmsRalaTimeBox) mrmsRalaTimeBox.style.display = 'none';
    }

    if (eventLayer.name.includes('MRMS DVD Flash Flood Detector')) {
        if (ffdTimeBox) ffdTimeBox.style.display = 'none';
    }

    if (eventLayer.name === MRMS_CREST_24H_LAYER_NAME) {
        if (mrmsCrest24hTimeBox) mrmsCrest24hTimeBox.style.display = 'none';
    }

    if (eventLayer.name === MRMS_FFD_24H_LAYER_NAME) {
        if (mrmsFfd24hTimeBox) mrmsFfd24hTimeBox.style.display = 'none';
    }

    if (eventLayer.name === LIGHTNINGCAST_LAYER_NAME) {
        if (lightningCastTimeBox) lightningCastTimeBox.style.display = 'none';
    }

    if (HRRR_DIAGNOSTIC_CONFIG_BY_NAME.has(eventLayer.name)) {
        window.setTimeout(updateHRRRDiagnosticTimeBox, 0);
    }

    if (HRRR_TLE_CONFIG_BY_NAME.has(eventLayer.name)) {
        window.setTimeout(updateHRRRTLETimeBox, 0);
    }

    if (glmConfigByName.has(eventLayer.name)) {
        window.setTimeout(() => {
            updateGLMTimeBox();
            updateGLMTrendCard();
        }, 0);
    }

    if (eventLayer.name === 'NWM Soil Saturation (0-40cm)') {
        if (nwmTimeBox) nwmTimeBox.style.display = 'none';
    }


    
    if (eventLayer.name === NRCS_HSG_LAYER_NAME) {
        if (nrcsHsgTimeBox) nrcsHsgTimeBox.style.display = 'none';
    }

    if (eventLayer.name === NLCD_IMPERVIOUS_LAYER_NAME) {
        if (nlcdImperviousTimeBox) nlcdImperviousTimeBox.style.display = 'none';
    }

    if (eventLayer.name === NLDAS3_SOIL_LAYER_NAME) {
        if (nldas3SoilTimeBox) nldas3SoilTimeBox.style.display = 'none';
    }

    if (eventLayer.name === NLDAS3_LANDCOVER_LAYER_NAME) {
        if (nldas3LandcoverTimeBox) nldas3LandcoverTimeBox.style.display = 'none';
    }

    if (eventLayer.name === NLDAS3_SLOPE_LAYER_NAME) {
        if (nldas3SlopeTimeBox) nldas3SlopeTimeBox.style.display = 'none';
    }

    if (eventLayer.name.includes('SuperEnsemble') || eventLayer.name.includes('HREF') || eventLayer.name.includes('REFS') || eventLayer.name.includes('[ERO]')) {
        const hasCAM = Array.from(activeLayerNames).some(name => name.includes('SuperEnsemble') || name.includes('HREF') || name.includes('REFS'));
        if (!hasCAM) camTimeBox.style.display = 'none';
    }
    
    if (eventLayer.name.includes('NEXRAD Radar') || (eventLayer.name.includes('GOES-') && !glmConfigByName.has(eventLayer.name))) {
        const hasSatRadar = Array.from(activeLayerNames).some(name => name.includes('NEXRAD Radar') || (name.includes('GOES-') && !glmConfigByName.has(name)));
        if (!hasSatRadar) radarTimeBox.style.display = 'none';
    }


    refreshLegendDockSummary();
});

// --- SIDEBAR LAYER REGISTRY & CONTROLS ---
// This registry is the single source of truth for layer order, labels, search,
// sidebar selection, opacity utilities, and future additions.
const baseMapRegistry = [
    {id: 'wpc-dark-reference', label: 'WPC Dark Reference', layer: wpcDarkReferenceBase, referenceLayers: [wpcDarkCountryLabels], borderTone: 'white', canvasColor: '#25282b'},
    {id: 'esri-dark', label: 'Esri Dark Gray', layer: esriDarkBase, referenceLayer: esriDarkLabels, borderTone: 'white'},
    {id: 'black-canvas', label: 'Black Canvas', layer: blackCanvasBase, borderTone: 'white', canvasColor: '#050608'},
    {id: 'esri-light', label: 'Esri Light Gray', layer: esriLightBase, referenceLayer: esriLightLabels, borderTone: 'black'},
    {id: 'osm', label: 'OpenStreetMap', layer: osmLayer, borderTone: 'black'},
    {id: 'esri-street', label: 'Esri World Street Map', layer: esriWorldStreet, borderTone: 'black'},
    {id: 'humanitarian-osm', label: 'Humanitarian OpenStreetMap', layer: humanitarianOSM, borderTone: 'black'},
    {id: 'opentopo', label: 'OpenTopoMap', layer: openTopoMap, borderTone: 'black'},
    {id: 'esri-topo', label: 'Esri World Topographic', layer: esriWorldTopo, borderTone: 'black'},
    {id: 'usgs-topo', label: 'USGS Topographic', layer: usgsTopo, borderTone: 'black'},
    {id: 'usgs-shaded-relief', label: 'USGS Shaded Relief', layer: usgsShadedRelief, borderTone: 'black'},
    {id: 'esri-imagery', label: 'Esri World Imagery (Satellite)', layer: esriWorldImagery, borderTone: 'white'},
    {id: 'usgs-imagery', label: 'USGS Imagery', layer: usgsImageryOnly, borderTone: 'white'},
    {id: 'usgs-imagery-topo', label: 'USGS Imagery + Topo', layer: usgsImageryTopo, borderTone: 'white'},
    {id: 'none', label: 'No Basemap', layer: blankBase, borderTone: 'none'}
];

function enforceExclusiveGDISelection(activeEntry) {
    getAllDashboardLayerEntries().forEach(entry => {
        if (entry !== activeEntry && entry.exclusiveGroup === 'gdi') setDashboardLayerActive(entry, false);
    });
}

function enforceExclusiveSPoRTSelection(activeEntry) {
    getAllDashboardLayerEntries().forEach(entry => {
        if (entry !== activeEntry && (entry.id === 'sport-percentile' || entry.id?.startsWith('sport-suite-') || entry.id?.startsWith('sport-rsm-') || entry.id?.startsWith('sport-change-'))) {
            setDashboardLayerActive(entry, false);
        }
    });
}

function enforceExclusiveQPEFFGSelection(activeEntry) {
    getAllDashboardLayerEntries().forEach(entry=>{if(entry!==activeEntry && entry.id?.startsWith('qpe-ffg-'))setDashboardLayerActive(entry,false);});
}

function enforceExclusiveFFGTendencySelection(activeEntry) {
    getAllDashboardLayerEntries().forEach(entry=>{if(entry!==activeEntry && entry.id?.startsWith('ffg-tendency-'))setDashboardLayerActive(entry,false);});
}
function enforceExclusiveRFCFFGSelection(activeEntry) {
    getAllDashboardLayerEntries().forEach(entry => {
        if (entry !== activeEntry && entry.id?.startsWith('rfc-ffg-')) setDashboardLayerActive(entry, false);
    });
}

function enforceExclusiveGLMSelection(activeEntry) {
    getAllDashboardLayerEntries().forEach(entry => {
        if (entry !== activeEntry && entry.id && entry.id.startsWith('glm-') && map.hasLayer(entry.layer)) {
            setDashboardLayerActive(entry, false);
        }
    });
}

function enforceExclusiveRadarSelection(activeEntry) {
    getAllDashboardLayerEntries().forEach(entry => {
        if (
            entry !== activeEntry &&
            entry.exclusiveGroup === 'radar-primary' &&
            map.hasLayer(entry.layer)
        ) {
            setDashboardLayerActive(entry, false);
        }
    });

    if (activeEntry.id === 'mrms-rala-direct') {
        dashboardRadarSpeedMode = 'mrms';
        const player = dashboardTimeControl?._player;
        if (player?.isPlaying()) player.stop();
        syncRadarSpeedControlVisibility();
        if (mrmsRalaReady && mrmsRalaFresh) {
            activateMRMSRALATimeline({jumpToLatest: true, autoPlay: true});
            showMRMSRALAFrame(map.timeDimension.getCurrentTime(), {force: true});
        } else {
            refreshMRMSRALAFromManifest({forceMetadata: !mrmsRalaReady});
        }
    } else if (activeEntry.id === 'nexrad-loop') {
        activateIEMRadarTimeline({applyDefaultSpeed: false, autoPlay: true});
    }
}

function handleRadarLayerDeactivate(entry) {
    if (entry.id === 'mrms-rala-direct') {
        stopMRMSRALAAnimation();
    } else if (entry.id === 'nexrad-loop') {
        const player = dashboardTimeControl?._player;
        if (player?.isPlaying()) player.stop();
    }
}

const dashboardSections = [
    {
        id: 'hazards',
        title: 'Active Hazards & Warnings',
        openByDefault: true,
        layers: [
            {id: 'hydro-warnings', label: 'Active Hydro Warnings & Advisories', layer: warningsLayer, kind: 'vector', defaultActive: true},
            {id: 'hydro-watches', label: 'Active Hydro Watches', layer: watchesLayer, kind: 'vector', defaultActive: true},
            {id: 'wpc-mpds', label: 'WPC Active MPDs', layer: mpdLayer, kind: 'vector', defaultActive: true},
            {id: 'day1-ero', label: 'Day 1 ERO (Real-Time)', layer: eroLayer, kind: 'vector', defaultActive: true}
        ]
    },
    {
        id: 'radar-satellite',
        title: 'Radar and Satellite Data (Real-Time)',
        layers: [
            {id: 'mrms-rala-direct', label: MRMS_RALA_LAYER_NAME, layer: mrmsRalaLayer, kind: 'raster', opacityTarget: mrmsRalaOpacityTarget, exclusiveGroup: 'radar-primary', onActivate: enforceExclusiveRadarSelection, onDeactivate: handleRadarLayerDeactivate, defaultActive: true, keywords: 'MRMS RALA reflectivity radar direct NOAA NCEP NODD operational lowest altitude 0.5 km 10 minute cadence two four six hour loop'},
            {id: 'nexrad-loop', label: 'IEM NEXRAD Radar — Backup (2-Hour Loop)', layer: radarTimeLayer, kind: 'raster', opacityTarget: radarWMS, exclusiveGroup: 'radar-primary', onActivate: enforceExclusiveRadarSelection, onDeactivate: handleRadarLayerDeactivate, defaultActive: false},
            {id: 'mrms-ffd', label: 'MRMS DVD Flash Flood Detector', layer: ffdLayer, kind: 'vector'},
            {id: 'mrms-qpe-1h', label: 'MRMS 1-Hour QPE', layer: mrms1hr, kind: 'raster'},
            {id: 'mrms-qpe-24h', label: 'MRMS 24-Hour QPE', layer: mrms24hr, kind: 'raster'},
            {id: 'mrms-flash-crest-24h', label: MRMS_CREST_24H_LAYER_NAME, layer: mrmsCrest24hLayer, kind: 'raster'},
            {id: 'mrms-flash-ffd-24h', label: MRMS_FFD_24H_LAYER_NAME, layer: mrmsFfd24hLayer, kind: 'raster'},
            {id: 'mrms-qpe-48h', label: 'MRMS 48-Hour QPE', layer: mrms48hr, kind: 'raster'},
            {id: 'mrms-qpe-72h', label: 'MRMS 72-Hour QPE', layer: mrms72hr, kind: 'raster'},
            {id: 'goes-east-vis', label: 'GOES-East: Visible (Ch. 2)', layer: goesEastVis, kind: 'raster'},
            {id: 'goes-east-wv', label: 'GOES-East: Mid-Level WV (Ch. 9)', layer: goesEastWV, kind: 'raster'},
            {id: 'goes-east-ir', label: 'GOES-East: Clean IR (Ch. 13)', layer: goesEastIR, kind: 'raster'},
            {id: 'goes-west-vis', label: 'GOES-West: Visible (Ch. 2)', layer: goesWestVis, kind: 'raster'},
            {id: 'goes-west-wv', label: 'GOES-West: Mid-Level WV (Ch. 9)', layer: goesWestWV, kind: 'raster'},
            {id: 'goes-west-ir', label: 'GOES-West: Clean IR (Ch. 13)', layer: goesWestIR, kind: 'raster'},
            {id: 'glm-mosaic-5min', label: GLM_MOSAIC_5MIN_LAYER_NAME, layer: glmMosaic5minLayer, kind: 'raster', exclusiveGroup: 'glm-primary', onActivate: enforceExclusiveGLMSelection},
            {id: 'glm-mosaic-30min', label: GLM_MOSAIC_30MIN_LAYER_NAME, layer: glmMosaic30minLayer, kind: 'raster', exclusiveGroup: 'glm-primary', onActivate: enforceExclusiveGLMSelection},
            {id: 'glm-mosaic-60min', label: GLM_MOSAIC_60MIN_LAYER_NAME, layer: glmMosaic60minLayer, kind: 'raster', exclusiveGroup: 'glm-primary', onActivate: enforceExclusiveGLMSelection},
            {id: 'glm-convective-trend-15min', label: GLM_TREND_MAP_15MIN_LAYER_NAME, layer: glmTrendMap15minLayer, kind: 'raster', exclusiveGroup: 'glm-primary', onActivate: enforceExclusiveGLMSelection},
            {id: 'lightningcast-probability-60min', label: LIGHTNINGCAST_LAYER_NAME, layer: lightningCastLayer, kind: 'raster', keywords: 'lightning forecast probability CIMSS SSEC next 60 minutes'}
        ]
    },
    {
        id: 'antecedent',
        title: 'Antecedent Hydrologic Conditions',
        layers: [],
        groups: [
            {
                id: 'sport-rsm',
                title: 'NASA SPoRT-LIS · Relative Soil Moisture',
                layers: [
                    {id: 'sport-rsm-10', label: 'NASA SPoRT-LIS Relative Soil Moisture (0–10 cm)',
                    description: 'NASA RSM: 0% at wilting point, 100% at saturation. This differs from NLDAS percent of saturation. Age warning at 48 h; hidden at 72 h.',
                    layer: sportRSM.layers[10], kind: 'raster', onActivate: enforceExclusiveSPoRTSelection,
                    keywords: 'soil moisture relative RSM saturation SPoRT LIS'},
                    {id: 'sport-rsm-200', label: 'NASA SPoRT-LIS Relative Soil Moisture (0–200 cm)',
                    description: 'NASA RSM: 0% at wilting point, 100% at saturation. This differs from NLDAS percent of saturation. Age warning at 48 h; hidden at 72 h.',
                    layer: sportRSM.layers[200], kind: 'raster', onActivate: enforceExclusiveSPoRTSelection,
                    keywords: 'soil moisture relative RSM saturation SPoRT LIS'}
                ]
            },
            {
                id: 'sport-change',
                title: 'NASA SPoRT-LIS · Soil Moisture Change',
                layers: [
                    {id: 'sport-change-shallow24h', label: 'NASA SPoRT-LIS 24-hour shallow RSM change (0–10 cm)',
                    description: 'Signed RSM change in percentage points; warning at 48 h and hidden at 72 h from ending valid time.',
                    layer: sportChange.layers.shallow24h, kind: 'raster', onActivate: enforceExclusiveSPoRTSelection,
                    keywords: 'soil moisture wetting drying tendency antecedent RSM change'},
                    {id: 'sport-change-deep7day', label: 'NASA SPoRT-LIS 7-day deep RSM change (0–200 cm)',
                    description: 'Signed RSM change in percentage points; warning at 48 h and hidden at 72 h from ending valid time.',
                    layer: sportChange.layers.deep7day, kind: 'raster', onActivate: enforceExclusiveSPoRTSelection,
                    keywords: 'soil moisture wetting drying tendency antecedent RSM change'},
                    {id: 'sport-change-deep14day', label: 'NASA SPoRT-LIS 14-day deep RSM change (0–200 cm) · Secondary context',
                    description: 'Signed RSM change in percentage points; warning at 48 h and hidden at 72 h from ending valid time.',
                    layer: sportChange.layers.deep14day, kind: 'raster', onActivate: enforceExclusiveSPoRTSelection,
                    keywords: 'soil moisture wetting drying tendency antecedent RSM change'}
                ]
            },
            {
                id: 'sport-percentile',
                title: 'NASA SPoRT-LIS · VSM Percentiles',
                layers: [
                    {id: 'sport-suite-10', label: 'NASA SPoRT-LIS VSM Percentile (0–10 cm)',
                    description: 'Four-depth suite. Shared valid time; warning at 48 h, hidden at 72 h. Original numerical NASA SPoRT-LIS percentiles.',
                    layer: sportSuite.layers[10], kind: 'raster', onActivate: enforceExclusiveSPoRTSelection,
                    keywords: 'soil moisture wet tail percentile depth SPoRT LIS hydrology'},
                    {id: 'sport-suite-40', label: 'NASA SPoRT-LIS VSM Percentile (0–40 cm)',
                    description: 'Four-depth suite. Shared valid time; warning at 48 h, hidden at 72 h. Original numerical NASA SPoRT-LIS percentiles.',
                    layer: sportSuite.layers[40], kind: 'raster', onActivate: enforceExclusiveSPoRTSelection,
                    keywords: 'soil moisture wet tail percentile depth SPoRT LIS hydrology'},
                    {id: 'sport-suite-100', label: 'NASA SPoRT-LIS VSM Percentile (0–100 cm)',
                    description: 'Four-depth suite. Shared valid time; warning at 48 h, hidden at 72 h. Original numerical NASA SPoRT-LIS percentiles.',
                    layer: sportSuite.layers[100], kind: 'raster', onActivate: enforceExclusiveSPoRTSelection,
                    keywords: 'soil moisture wet tail percentile depth SPoRT LIS hydrology'},
                    {id: 'sport-suite-200', label: 'NASA SPoRT-LIS VSM Percentile (0–200 cm)',
                    description: 'Four-depth suite. Shared valid time; warning at 48 h, hidden at 72 h. Original numerical NASA SPoRT-LIS percentiles.',
                    layer: sportSuite.layers[200], kind: 'raster', onActivate: enforceExclusiveSPoRTSelection,
                    keywords: 'soil moisture wet tail percentile depth SPoRT LIS hydrology'}
                ]
            },
            {
                id: 'nwm-soil',
                title: 'NWM · Soil Saturation',
                layers: [
                    {id: 'nwm-soilsat', label: 'NWM Soil Saturation (0-40cm)', layer: nwmLayer, kind: 'raster'}
                ]
            },
            {
                id: 'rfc-guidance',
                title: 'RFC · Flash Flood Guidance',
                layers: [
                    {id: 'rfc-ffg-1h', label: 'RFC 1-Hour Flash Flood Guidance', layer: rfcFFG.layers[1], kind: 'raster', onActivate: enforceExclusiveRFCFFGSelection},
                    {id: 'rfc-ffg-3h', label: 'RFC 3-Hour Flash Flood Guidance', layer: rfcFFG.layers[3], kind: 'raster', onActivate: enforceExclusiveRFCFFGSelection},
                    {id: 'rfc-ffg-6h', label: 'RFC 6-Hour Flash Flood Guidance', layer: rfcFFG.layers[6], kind: 'raster', onActivate: enforceExclusiveRFCFFGSelection}
                ]
            },
            {
                id: 'ffg-tendencies', title: 'RFC · FFG Tendencies', ffgTendency: true,
                layers: [
                    {id: 'ffg-tendency-1h', label: '1-hour FFG',layer:ffgTendency.layers[1],kind:'raster',onActivate:enforceExclusiveFFGTendencySelection},
                    {id: 'ffg-tendency-3h', label: '3-hour FFG',layer:ffgTendency.layers[3],kind:'raster',onActivate:enforceExclusiveFFGTendencySelection},
                    {id: 'ffg-tendency-6h', label: '6-hour FFG',layer:ffgTendency.layers[6],kind:'raster',onActivate:enforceExclusiveFFGTendencySelection}
                ]
            },
            {
                id: 'qpe-ffg-comparison',
                title: 'Observed Rainfall / FFG · Comparisons',
                groups: [
                    {id: 'qpe-ffg-pass1', title: 'Pass 1 · Latest rainfall', description: 'Primary view for real-time analysis; less processing delay.', qpePass: 1, openByDefault: true, layers: [
                        {id: 'qpe-ffg-1-fine1', label: '1-hour QPE / FFG · Pass 1', keywords: 'fine-scale latest rainfall', layer: qpeFFG[0].layers.fine1, kind: 'raster', onActivate: enforceExclusiveQPEFFGSelection},
                        {id: 'qpe-ffg-1-fine3', label: '3-hour QPE / FFG · Pass 1', keywords: 'fine-scale latest rainfall', layer: qpeFFG[0].layers.fine3, kind: 'raster', onActivate: enforceExclusiveQPEFFGSelection},
                        {id: 'qpe-ffg-1-fine6', label: '6-hour QPE / FFG · Pass 1', keywords: 'fine-scale latest rainfall', layer: qpeFFG[0].layers.fine6, kind: 'raster', onActivate: enforceExclusiveQPEFFGSelection},
                    ]},
                    {id: 'qpe-ffg-pass2', title: 'Pass 2 · Refined rainfall', description: 'Check earlier rainfall with additional gauge information; available later.', qpePass: 2, openByDefault: false, layers: [
                        {id: 'qpe-ffg-2-fine1', label: '1-hour QPE / FFG · Pass 2', keywords: 'fine-scale refined rainfall', layer: qpeFFG[1].layers.fine1, kind: 'raster', onActivate: enforceExclusiveQPEFFGSelection},
                        {id: 'qpe-ffg-2-fine3', label: '3-hour QPE / FFG · Pass 2', keywords: 'fine-scale refined rainfall', layer: qpeFFG[1].layers.fine3, kind: 'raster', onActivate: enforceExclusiveQPEFFGSelection},
                        {id: 'qpe-ffg-2-fine6', label: '6-hour QPE / FFG · Pass 2', keywords: 'fine-scale refined rainfall', layer: qpeFFG[1].layers.fine6, kind: 'raster', onActivate: enforceExclusiveQPEFFGSelection},
                    ]},
                ]
            }
        ]
    },
    {
        id: 'land-surface-runoff',
        title: 'Land-Surface Runoff Sensitivity',
        layers: [
            {id: 'nrcs-hsg', label: NRCS_HSG_LAYER_NAME,
             description: 'FY2026 USDA-NRCS gNATSGO HSG from native 30 m MUKEY geometry and map-unit dominant conditions, aggregated on the retained 1 km equal-area Phase H1 analysis; preserves all seven HSG classes.',
             layer: nrcsHsgLayer, kind: 'raster',
             keywords: 'USDA NRCS gNATSGO SSURGO hydrologic soil group HSG hydgrpdcd A B C D A/D B/D C/D infiltration runoff susceptibility soil type'}
,
            {id: 'nldas3-soil-texture', label: NLDAS3_SOIL_LAYER_NAME,
             description: 'NASA NLDAS-3 static ~1 km STATSGO soil-texture classification. Provides land-surface hydrologic context; it is not Hydrologic Soil Group, a direct infiltration rate, dynamic soil moisture, or FFG.',
             layer: nldas3SoilLayer, kind: 'raster',
             keywords: 'NASA NLDAS-3 soil texture STATSGO Noah-MP land surface infiltration runoff static hydrology'}
,
            {id: 'nldas3-landcover', label: NLDAS3_LANDCOVER_LAYER_NAME,
             description: 'NASA NLDAS-3 static ~1 km IGBP/NCEP-modified land-use and vegetation classification used by the Noah-MP/LIS land-surface framework. Water/open-water classes remain transparent.',
             layer: nldas3LandcoverLayer, kind: 'raster',
             keywords: 'NASA NLDAS-3 land cover land use vegetation IGBP NCEP Noah-MP LIS open water static hydrology'}
,
            {id: 'nldas3-slope', label: NLDAS3_SLOPE_LAYER_NAME,
             description: 'NASA NLDAS-3 / MERIT static ~1 km terrain slope expressed as percent slope. Display bins are descriptive terrain ranges only; they are not runoff-risk classes, infiltration rates, or flash-flood thresholds.',
             layer: nldas3SlopeLayer, kind: 'raster',
             keywords: 'NASA NLDAS-3 MERIT terrain slope percent slope topography physiography runoff sensitivity static hydrology'}
,
            {id: 'nlcd-impervious', label: NLCD_IMPERVIOUS_LAYER_NAME,
             description: '2025 USGS Annual NLCD Collection 1.2 Fractional Impervious Surface from native 30 m source, aggregated to the retained 1 km equal-area Phase H2 analysis; 0% valid land cells are shown in neutral gray while source NoData/insufficient coverage remains transparent.',
             layer: nlcdImperviousLayer, kind: 'raster',
             keywords: 'USGS Annual NLCD fractional impervious surface imperviousness urban pavement rooftop roads developed land cover runoff sensitivity infiltration 2025 Collection 1.2 FctImp'}
        ]
    },
    {
        id: 'wildfire-burn-scar',
        title: 'Wildfire / Burn Scar Context',
        layers: [
            {id: 'wfigs-current', label: WFIGS_CURRENT_LAYER_NAME, description: 'Current/maintained wildfire footprints; incidents can fall off as they close or become stale.', layer: wfigsCurrentLayerGroup, kind: 'vector', keywords: 'NIFC WFIGS wildfire fire perimeter burn scar post-fire debris flow current active near-real-time maintained fall-off'},
            {id: 'wfigs-ytd', label: WFIGS_YTD_LAYER_NAME, description: `All mapped ${WFIGS_CURRENT_YEAR} wildfire footprints; no Current-service fall-off.`, layer: wfigsYTDLayerGroup, kind: 'vector', keywords: `NIFC WFIGS wildfire fire perimeter burn scar post-fire debris flow recent historical year to date YTD ${WFIGS_CURRENT_YEAR} no fall-off`},
            {id: 'wfigs-history', label: WFIGS_HISTORY_LAYER_NAME, description: 'Toggle any combination of the rolling five completed calendar years for regional burn-scar analysis.', layer: wfigsHistoryLayerGroup, kind: 'vector', keywords: 'NIFC WFIGS historical wildfire perimeter archive previous five years multiyear multi-year toggle buttons seasonal activity trend trends weekly cumulative 2021 2022 2023 2024 2025'}
        ]
    },
    {
        id: 'rap',
        title: 'RAP Mesoanalysis Data',
        layers: [
            {id: 'rap-pwat', label: 'Precipitable Water (PWAT)', layer: pwatLayer, kind: 'raster'},
            {id: 'rap-pwat-diff', label: '&nbsp;&nbsp;&nbsp;&nbsp;3-Hour PWAT Change', layer: pwatDiffLayer, kind: 'raster', nested: true},
            {id: 'rap-pwat-f03', label: '&nbsp;&nbsp;&nbsp;&nbsp;▶ <b>+3h Forecast:</b> PWAT', layer: pwatF03Layer, kind: 'raster', nested: true},

            {id: 'rap-sbcape', label: 'Surface Based CAPE', layer: sbcapeLayer, kind: 'raster'},
            {id: 'rap-sbcape-diff', label: '&nbsp;&nbsp;&nbsp;&nbsp;3-Hour SBCAPE Change', layer: sbcapeDiffLayer, kind: 'raster', nested: true},
            {id: 'rap-sbcape-f03', label: '&nbsp;&nbsp;&nbsp;&nbsp;▶ <b>+3h Forecast:</b> SBCAPE', layer: sbcapeF03Layer, kind: 'raster', nested: true},

            {id: 'rap-mlcape', label: 'Mixed Layer CAPE (90mb)', layer: mlcapeLayer, kind: 'raster'},
            {id: 'rap-mlcape-diff', label: '&nbsp;&nbsp;&nbsp;&nbsp;3-Hour MLCAPE Change', layer: mlcapeDiffLayer, kind: 'raster', nested: true},
            {id: 'rap-mlcape-f03', label: '&nbsp;&nbsp;&nbsp;&nbsp;▶ <b>+3h Forecast:</b> MLCAPE', layer: mlcapeF03Layer, kind: 'raster', nested: true},

            {id: 'rap-mucape', label: 'Most Unstable CAPE (255mb)', layer: mucapeLayer, kind: 'raster'},
            {id: 'rap-mucape-diff', label: '&nbsp;&nbsp;&nbsp;&nbsp;3-Hour MUCAPE Change', layer: mucapeDiffLayer, kind: 'raster', nested: true},
            {id: 'rap-mucape-f03', label: '&nbsp;&nbsp;&nbsp;&nbsp;▶ <b>+3h Forecast:</b> MUCAPE', layer: mucapeF03Layer, kind: 'raster', nested: true},

            {id: 'rap-lr-sfc3', label: 'Sfc-3km Low-Level Lapse Rate', layer: lrsfc3Layer, kind: 'raster'},
            {id: 'rap-lr-75', label: '700-500mb Mid-Level Lapse Rate', layer: lr75Layer, kind: 'raster'},
            {id: 'rap-scp', label: 'Supercell Composite Parameter', layer: scpLayer, kind: 'raster'},
            {id: 'rap-mfc', label: 'Mean BL Moisture Convergence', layer: mfcLayer, kind: 'raster'},
            {id: 'rap-f925', label: '925/850mb Frontogenesis', layer: f925Layer, kind: 'raster'},
            {id: 'rap-f850', label: '850/700mb Frontogenesis', layer: f850Layer, kind: 'raster'},
            {id: 'rap-eff-shear', label: 'Effective Bulk Shear', layer: effShearLayer, kind: 'raster'},
            {id: 'rap-corfidi-up', label: 'Corfidi Upwind (Back-Building) Vectors', layer: corfidiUpLayer, kind: 'raster'},
            {id: 'rap-corfidi-down', label: 'Corfidi Downwind (Forward) Vectors', layer: corfidiDownLayer, kind: 'raster'},

            {id: 'rap-trans850', label: '850mb Moisture Transport', layer: trans850Layer, kind: 'raster'},
            {id: 'rap-trans850-diff', label: '&nbsp;&nbsp;&nbsp;&nbsp;3-Hour 850mb Moisture Transport Change', layer: trans850DiffLayer, kind: 'raster', nested: true},
            {id: 'rap-trans850-f03', label: '&nbsp;&nbsp;&nbsp;&nbsp;▶ <b>+3h Forecast:</b> 850mb Moisture Transport', layer: trans850F03Layer, kind: 'raster', nested: true},

            {id: 'rap-trans700', label: '700mb Moisture Transport', layer: trans700Layer, kind: 'raster'},
            {id: 'rap-mean-wind', label: '850-300mb Mean Layer Wind', layer: meanWindLayer, kind: 'raster'},
            {id: 'rap-vort500', label: '500mb Absolute Vorticity', layer: vort500Layer, kind: 'raster'},
            {id: 'rap-diff-adv', label: '700-400mb Diff Vorticity Advection', layer: diffAdvLayer, kind: 'raster'},
            {id: 'rap-div250', label: '250mb Divergence', layer: div250Layer, kind: 'raster'}
        ]
    },
    {
        id: 'gdi',
        title: 'GDI Thermodynamic Guidance',
        layers: [],
        groups: [
            {id: 'gdi-rap', title: 'RAP Analysis & Trends', openByDefault: true, layers: [
                {id: 'rap-gdi', label: 'RAP GDI · Analysis', layer: rapGDI.layers.analysis, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'rap-gdi-change', label: 'RAP GDI · 3-hour Change', layer: rapGDI.layers.change, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'rap-gdi-forecast', label: 'RAP GDI · +3-hour Forecast', layer: rapGDI.layers.forecast, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection}
            ]},
            {id: 'gdi-hrrr', title: 'HRRR · Hourly Guidance', openByDefault: true, layers: [
                {id: 'hrrr-gdi', label: 'HRRR GDI', layer: hrrrGDI.layers.gdi, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'hrrr-gdi-coverage', label: 'HRRR GDI · Neighborhood Coverage', layer: hrrrGDI.layers.coverage, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection}
            ]},
            {id: 'gdi-persistence', title: 'HRRR · Six-hour Persistence', layers: [
                {id: 'hrrr-gdi-persistence', label: 'HRRR GDI · Sampled Persistence', layer: hrrrGDI.layers.persistence, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'hrrr-gdi-longest', label: 'HRRR GDI · Longest Sampled Run', layer: hrrrGDI.layers.longest, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection}
            ]},
            {id: 'gdi-rrfs', title: 'RRFS & HRRR/RRFS Blend', layers: [
                {id: 'gdi-rrfs-rrfs0', label: 'RRFS GDI · Window +0h', layer: gdiGuidance.layers.rrfs0, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'gdi-rrfs-rrfs3', label: 'RRFS GDI · Window +3h', layer: gdiGuidance.layers.rrfs3, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'gdi-rrfs-rrfs6', label: 'RRFS GDI · Window +6h', layer: gdiGuidance.layers.rrfs6, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'gdi-rrfs-blend0', label: 'HRRR/RRFS GDI · Window +0h', layer: gdiGuidance.layers.blend0, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'gdi-rrfs-blend3', label: 'HRRR/RRFS GDI · Window +3h', layer: gdiGuidance.layers.blend3, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'gdi-rrfs-blend6', label: 'HRRR/RRFS GDI · Window +6h', layer: gdiGuidance.layers.blend6, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection}
            ]},
            {id: 'gdi-nowcast', title: 'TLE · Six-hour Nowcast', layers: [
                {id: 'gdi-nowcast-maximum', label: 'TLE Maximum GDI', layer: gdiGuidance.layers.maximum, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'gdi-nowcast-support30', label: 'GDI ≥30 · Neighborhood Support', layer: gdiGuidance.layers.support30, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'gdi-nowcast-support40', label: 'GDI ≥40 · Neighborhood Support', layer: gdiGuidance.layers.support40, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'gdi-nowcast-support50', label: 'GDI ≥50 · Neighborhood Support', layer: gdiGuidance.layers.support50, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'gdi-nowcast-persistence40', label: 'GDI ≥40 · Sampled Persistence', layer: gdiGuidance.layers.persistence40, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection}
            ]},
            {id: 'gdi-day1', title: 'TLE · Day 1 ERO Remaining Period', layers: [
                {id: 'gdi-day1-maximum', label: 'Day 1 Maximum GDI', layer: gdiERO.layers.maximum, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'gdi-day1-support30', label: 'Day 1 GDI ≥30 · Neighborhood Support', layer: gdiERO.layers.support30, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'gdi-day1-support40', label: 'Day 1 GDI ≥40 · Neighborhood Support', layer: gdiERO.layers.support40, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'gdi-day1-support50', label: 'Day 1 GDI ≥50 · Neighborhood Support', layer: gdiERO.layers.support50, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection},
                {id: 'gdi-day1-persistence40', label: 'Day 1 GDI ≥40 · Sampled Persistence', layer: gdiERO.layers.persistence40, kind: 'raster', exclusiveGroup: 'gdi', onActivate: enforceExclusiveGDISelection}
            ]}
        ]
    },
    {
        id: 'hrrr-diagnostics',
        title: 'HRRR Flash Flood Diagnostics - Experimental',
        layers: HRRR_DIAGNOSTIC_LAYER_CONFIGS.map(config => ({
            id: config.id,
            label: config.label,
            layer: config.layer,
            kind: 'raster',
            keywords: config.keywords
        }))
    },
    {
        id: 'hrrr-tle',
        title: 'HRRR-TLE Flash Flood Guidance - Experimental',
        layers: [],
        groups: [
            {
                id: 'hrrr-tle-core',
                title: 'Core FFG Guidance',
                openByDefault: true,
                layers: HRRR_TLE_LAYER_CONFIGS
                    .filter(config => config.group === 'Core FFG Guidance')
                    .map(config => ({
                        id: config.id, label: config.label, layer: config.layer,
                        kind: 'raster', keywords: config.keywords
                    }))
            },
            {
                id: 'hrrr-tle-heavy-rain',
                title: 'Heavy Rain / Persistence',
                layers: HRRR_TLE_LAYER_CONFIGS
                    .filter(config => config.group === 'Heavy Rain / Persistence')
                    .map(config => ({
                        id: config.id, label: config.label, layer: config.layer,
                        kind: 'raster', keywords: config.keywords
                    }))
            },
            {
                id: 'hrrr-tle-timing',
                title: 'Timing / Evolution',
                layers: HRRR_TLE_LAYER_CONFIGS
                    .filter(config => config.group === 'Timing / Evolution')
                    .map(config => ({
                        id: config.id, label: config.label, layer: config.layer,
                        kind: 'raster', keywords: config.keywords
                    }))
            }
        ]
    },
    {
        id: 'cam-3-9',
        title: 'CAM Nowcasts (+3h to +9h)',
        layers: [
            {id: 'cam-3-9-ffg-super', label: '<b>SuperEnsemble</b>: Max FFG Exceedance (1/3/6h)', layer: camLayers['ffg_3h_to_9h_super'], kind: 'raster'},
            {id: 'cam-3-9-ffg-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF: Max FFG Exceedance (1/3/6h)', layer: camLayers['ffg_3h_to_9h_href'], kind: 'raster', nested: true},
            {id: 'cam-3-9-ffg-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS: Max FFG Exceedance (1/3/6h)', layer: camLayers['ffg_3h_to_9h_refs'], kind: 'raster', nested: true},
            {id: 'cam-3-9-q05-super', label: '<b>SuperEnsemble</b>: Max Prob > 0.5"/hr', layer: camLayers['qpf_3h_to_9h_0.5_inch_super'], kind: 'raster'},
            {id: 'cam-3-9-q05-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF: Max Prob > 0.5"/hr', layer: camLayers['qpf_3h_to_9h_0.5_inch_href'], kind: 'raster', nested: true},
            {id: 'cam-3-9-q05-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS: Max Prob > 0.5"/hr', layer: camLayers['qpf_3h_to_9h_0.5_inch_refs'], kind: 'raster', nested: true},
            {id: 'cam-3-9-q1-super', label: '<b>SuperEnsemble</b>: Max Prob > 1.0"/hr', layer: camLayers['qpf_3h_to_9h_1_inch_super'], kind: 'raster'},
            {id: 'cam-3-9-q1-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF: Max Prob > 1.0"/hr', layer: camLayers['qpf_3h_to_9h_1_inch_href'], kind: 'raster', nested: true},
            {id: 'cam-3-9-q1-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS: Max Prob > 1.0"/hr', layer: camLayers['qpf_3h_to_9h_1_inch_refs'], kind: 'raster', nested: true},
            {id: 'cam-3-9-q2-super', label: '<b>SuperEnsemble</b>: Max Prob > 2.0"/hr', layer: camLayers['qpf_3h_to_9h_2_inch_super'], kind: 'raster'},
            {id: 'cam-3-9-q2-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF: Max Prob > 2.0"/hr', layer: camLayers['qpf_3h_to_9h_2_inch_href'], kind: 'raster', nested: true},
            {id: 'cam-3-9-q2-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS: Max Prob > 2.0"/hr', layer: camLayers['qpf_3h_to_9h_2_inch_refs'], kind: 'raster', nested: true},
            {id: 'cam-3-9-q3-super', label: '<b>SuperEnsemble</b>: Max Prob > 3.0"/hr', layer: camLayers['qpf_3h_to_9h_3_inch_super'], kind: 'raster'},
            {id: 'cam-3-9-q3-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF: Max Prob > 3.0"/hr', layer: camLayers['qpf_3h_to_9h_3_inch_href'], kind: 'raster', nested: true},
            {id: 'cam-3-9-q3-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS: Max Prob > 3.0"/hr', layer: camLayers['qpf_3h_to_9h_3_inch_refs'], kind: 'raster', nested: true}
        ]
    },
    {
        id: 'cam-9-15',
        title: 'CAM Nowcasts (+9h to +15h)',
        layers: [
            {id: 'cam-9-15-ffg-super', label: '<b>SuperEnsemble</b>: Max FFG Exceedance (1/3/6h)', layer: camLayers['ffg_9h_to_15h_super'], kind: 'raster'},
            {id: 'cam-9-15-ffg-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF: Max FFG Exceedance (1/3/6h)', layer: camLayers['ffg_9h_to_15h_href'], kind: 'raster', nested: true},
            {id: 'cam-9-15-ffg-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS: Max FFG Exceedance (1/3/6h)', layer: camLayers['ffg_9h_to_15h_refs'], kind: 'raster', nested: true},
            {id: 'cam-9-15-q05-super', label: '<b>SuperEnsemble</b>: Max Prob > 0.5"/hr', layer: camLayers['qpf_9h_to_15h_0.5_inch_super'], kind: 'raster'},
            {id: 'cam-9-15-q05-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF: Max Prob > 0.5"/hr', layer: camLayers['qpf_9h_to_15h_0.5_inch_href'], kind: 'raster', nested: true},
            {id: 'cam-9-15-q05-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS: Max Prob > 0.5"/hr', layer: camLayers['qpf_9h_to_15h_0.5_inch_refs'], kind: 'raster', nested: true},
            {id: 'cam-9-15-q1-super', label: '<b>SuperEnsemble</b>: Max Prob > 1.0"/hr', layer: camLayers['qpf_9h_to_15h_1_inch_super'], kind: 'raster'},
            {id: 'cam-9-15-q1-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF: Max Prob > 1.0"/hr', layer: camLayers['qpf_9h_to_15h_1_inch_href'], kind: 'raster', nested: true},
            {id: 'cam-9-15-q1-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS: Max Prob > 1.0"/hr', layer: camLayers['qpf_9h_to_15h_1_inch_refs'], kind: 'raster', nested: true},
            {id: 'cam-9-15-q2-super', label: '<b>SuperEnsemble</b>: Max Prob > 2.0"/hr', layer: camLayers['qpf_9h_to_15h_2_inch_super'], kind: 'raster'},
            {id: 'cam-9-15-q2-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF: Max Prob > 2.0"/hr', layer: camLayers['qpf_9h_to_15h_2_inch_href'], kind: 'raster', nested: true},
            {id: 'cam-9-15-q2-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS: Max Prob > 2.0"/hr', layer: camLayers['qpf_9h_to_15h_2_inch_refs'], kind: 'raster', nested: true},
            {id: 'cam-9-15-q3-super', label: '<b>SuperEnsemble</b>: Max Prob > 3.0"/hr', layer: camLayers['qpf_9h_to_15h_3_inch_super'], kind: 'raster'},
            {id: 'cam-9-15-q3-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF: Max Prob > 3.0"/hr', layer: camLayers['qpf_9h_to_15h_3_inch_href'], kind: 'raster', nested: true},
            {id: 'cam-9-15-q3-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS: Max Prob > 3.0"/hr', layer: camLayers['qpf_9h_to_15h_3_inch_refs'], kind: 'raster', nested: true}
        ]
    },
    {
        id: 'ero-cams',
        title: 'Day 1 ERO CAMs',
        layers: [
            {id: 'ero-ffg-super', label: '<b>SuperEnsemble [ERO]</b>: Max FFG Exceedance (1/3/6h)', layer: eroCamLayers['ffg_super'], kind: 'raster'},
            {id: 'ero-ffg-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF [ERO]: Max FFG Exceedance (1/3/6h)', layer: eroCamLayers['ffg_href'], kind: 'raster', nested: true},
            {id: 'ero-ffg-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS [ERO]: Max FFG Exceedance (1/3/6h)', layer: eroCamLayers['ffg_refs'], kind: 'raster', nested: true},
            {id: 'ero-q05-super', label: '<b>SuperEnsemble [ERO]</b>: Max Prob > 0.5"/hr', layer: eroCamLayers['qpf_0.5_inch_super'], kind: 'raster'},
            {id: 'ero-q05-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF [ERO]: Max Prob > 0.5"/hr', layer: eroCamLayers['qpf_0.5_inch_href'], kind: 'raster', nested: true},
            {id: 'ero-q05-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS [ERO]: Max Prob > 0.5"/hr', layer: eroCamLayers['qpf_0.5_inch_refs'], kind: 'raster', nested: true},
            {id: 'ero-q1-super', label: '<b>SuperEnsemble [ERO]</b>: Max Prob > 1.0"/hr', layer: eroCamLayers['qpf_1_inch_super'], kind: 'raster'},
            {id: 'ero-q1-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF [ERO]: Max Prob > 1.0"/hr', layer: eroCamLayers['qpf_1_inch_href'], kind: 'raster', nested: true},
            {id: 'ero-q1-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS [ERO]: Max Prob > 1.0"/hr', layer: eroCamLayers['qpf_1_inch_refs'], kind: 'raster', nested: true},
            {id: 'ero-q2-super', label: '<b>SuperEnsemble [ERO]</b>: Max Prob > 2.0"/hr', layer: eroCamLayers['qpf_2_inch_super'], kind: 'raster'},
            {id: 'ero-q2-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF [ERO]: Max Prob > 2.0"/hr', layer: eroCamLayers['qpf_2_inch_href'], kind: 'raster', nested: true},
            {id: 'ero-q2-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS [ERO]: Max Prob > 2.0"/hr', layer: eroCamLayers['qpf_2_inch_refs'], kind: 'raster', nested: true},
            {id: 'ero-q3-super', label: '<b>SuperEnsemble [ERO]</b>: Max Prob > 3.0"/hr', layer: eroCamLayers['qpf_3_inch_super'], kind: 'raster'},
            {id: 'ero-q3-href', label: '&nbsp;&nbsp;&nbsp;&nbsp;HREF [ERO]: Max Prob > 3.0"/hr', layer: eroCamLayers['qpf_3_inch_href'], kind: 'raster', nested: true},
            {id: 'ero-q3-refs', label: '&nbsp;&nbsp;&nbsp;&nbsp;REFS [ERO]: Max Prob > 3.0"/hr', layer: eroCamLayers['qpf_3_inch_refs'], kind: 'raster', nested: true}
        ]
    },
    {
        id: 'experimental',
        title: 'Experimental Models',
        layers: [],
        emptyMessage: 'Ready for NLDAS-3 and other experimental products. New layers can be registered without rebuilding the sidebar.'
    }
];


// Independent map-reference overlays. These controls are intentionally kept
// outside the meteorological/hydrological data registry so they can be combined
// with any basemap without changing primary data-layer counts or exclusivity.
const rfcBoundariesLayer = window.createRFCBoundaryLayer(map);

const mapReferenceOverlayConfigs = [
    {refId: 'rfc-boundaries', label: 'RFC Boundaries', layer: rfcBoundariesLayer, defaultActive: false},
    {refId: 'state-territory-names', label: 'State / Territory Names', layer: wpcStateTerritoryNamesLayer, defaultActive: true},
    {refId: 'major-cities-places', label: 'Major Cities & Places', layer: wpcMajorCitiesPlacesLayer, defaultActive: true},
    {refId: 'major-roads', label: 'Major Roads', layer: wpcMajorRoadsLayer, defaultActive: true},
    {refId: 'county-boundaries', label: 'County Boundaries', layer: wpcCountyBoundariesLayer, defaultActive: false},
    {refId: 'urban-areas', label: 'Urban Areas', layer: wpcUrbanAreasLayer, defaultActive: false},
    {refId: 'international-boundaries', label: 'International Boundaries', layer: wpcInternationalBoundariesLayer, defaultActive: false},
];

function setMapReferenceOverlayVisible(config, isVisible) {
    if (!config?.layer) return;
    if (isVisible && !map.hasLayer(config.layer)) {
        map.addLayer(config.layer);
    } else if (!isVisible && map.hasLayer(config.layer)) {
        map.removeLayer(config.layer);
    }
    if (config.refId === 'major-cities-places') refreshWPCMajorPlaceLabels();
    const toggle = document.getElementById(`map-reference-${config.refId}-toggle`);
    if (toggle) toggle.checked = Boolean(isVisible);
}

mapReferenceOverlayConfigs.forEach(config => {
    if (config.defaultActive) setMapReferenceOverlayVisible(config, true);
});

const dashboardUtilityLayers = [];

const layerEntriesById = new Map();
let selectedDashboardLayerId = null;
let sidebarRenderQueued = false;

function cleanLayerLabel(label) {
    const node = document.createElement('div');
    node.innerHTML = label;
    return (node.textContent || node.innerText || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getSectionLayerEntries(section) {
    return [
        ...(section.layers || []),
        ...((section.groups || []).flatMap(getSectionLayerEntries))
    ];
}

function getAllDashboardLayerEntries() {
    return [
        ...dashboardSections.flatMap(getSectionLayerEntries),
        ...dashboardUtilityLayers
    ];
}

function rebuildLayerEntryIndex() {
    layerEntriesById.clear();
    getAllDashboardLayerEntries().forEach(entry => {
        if (!entry.id || !entry.label || !entry.layer) {
            throw new Error('Every dashboard layer requires id, label, and layer.');
        }
        if (layerEntriesById.has(entry.id)) {
            throw new Error(`Duplicate dashboard layer id: ${entry.id}`);
        }
        entry.searchText = cleanLayerLabel(
            `${entry.label} ${entry.description || ''} ${entry.keywords || ''}`
        ).toLowerCase();
        layerEntriesById.set(entry.id, entry);
    });
}

function dispatchOverlayEvent(eventName, entry) {
    map.fire(eventName, {
        name: entry.label,
        layer: entry.layer
    });
}

function setDashboardLayerActive(entry, shouldBeActive) {
    const isActive = map.hasLayer(entry.layer);

    if (shouldBeActive && !isActive) {
        map.addLayer(entry.layer);
        dispatchOverlayEvent('overlayadd', entry);
        if (typeof entry.onActivate === 'function') entry.onActivate(entry);
    } else if (!shouldBeActive && isActive) {
        map.removeLayer(entry.layer);
        dispatchOverlayEvent('overlayremove', entry);
        if (typeof entry.onDeactivate === 'function') entry.onDeactivate(entry);
    }

    syncSidebarWithMap();
}

function selectDashboardLayer(entryId) {
    selectedDashboardLayerId = entryId;
    const selected = layerEntriesById.get(entryId) || null;
    const selectedName = document.getElementById('selected-layer-name');
    const opacitySlider = document.getElementById('layer-opacity');
    const opacityValue = document.getElementById('opacity-value');
    const opacityLabel = document.getElementById('layer-opacity-label');
    const soloButton = document.getElementById('solo-selected-layer');

    document.querySelectorAll('.layer-row').forEach(row => {
        row.classList.toggle('is-selected', row.dataset.layerId === entryId);
    });

    if (selectedName) {
        selectedName.textContent = selected
            ? cleanLayerLabel(selected.label)
            : 'No layer selected';
    }

    const opacityTarget = selected
        ? (selected.opacityTarget || selected.layer)
        : null;
    const canSetOpacity = Boolean(
        selected &&
        selected.kind === 'raster' &&
        opacityTarget &&
        typeof opacityTarget.setOpacity === 'function'
    );

    if (opacityLabel) {
        opacityLabel.textContent = canSetOpacity
            ? `${cleanLayerLabel(selected.label)} opacity`
            : 'Selected raster opacity';
    }
    if (opacitySlider) {
        opacitySlider.disabled = !canSetOpacity;
        const currentOpacity = canSetOpacity
            ? Number(opacityTarget.options?.opacity ?? 1)
            : 1;
        opacitySlider.value = String(Math.round(currentOpacity * 100));
    }
    if (opacityValue) {
        opacityValue.textContent = canSetOpacity
            ? `${opacitySlider.value}%`
            : '—';
    }
    if (soloButton) {
        soloButton.disabled = !(selected && selected.kind === 'raster');
    }
}

function updateActiveLayerCount() {
    const activeCount = getAllDashboardLayerEntries()
        .filter(entry => map.hasLayer(entry.layer))
        .length;
    const target = document.getElementById('active-layer-count');
    if (target) {
        target.textContent = `${activeCount} active layer${activeCount === 1 ? '' : 's'}`;
    }
}

function syncSidebarWithMap() {
    document.querySelectorAll('.layer-checkbox[data-layer-id]').forEach(input => {
        const entry = layerEntriesById.get(input.dataset.layerId);
        if (entry) input.checked = map.hasLayer(entry.layer);
    });
    updateActiveLayerCount();
    if (selectedDashboardLayerId) selectDashboardLayer(selectedDashboardLayerId);
}

function updateQPEFFGMenuStatus() {
    document.querySelectorAll('[data-qpe-pass-status]').forEach(node => {
        const adapter = qpeFFG[Number(node.dataset.qpePassStatus) - 1];
        const info = window.qpeFFGTimingSummary(adapter.getMetadata(), Date.now());
        node.textContent = info ? `${info.through} · ${info.age} · ${info.guidance} · ${adapter.getState().label}` : 'Rainfall time unavailable';
    });
}

function renderDashboardLayerGroup(config) {
    const group = document.createElement('details');
    group.className = 'dashboard-layer-group';
    group.dataset.groupId = config.id;
    group.open = Boolean(config.openByDefault);
    const summary = document.createElement('summary');
    const heading = document.createElement('span');
    heading.textContent = config.title;
    if (config.description) {
        const hint = document.createElement('small');
        hint.className = 'group-description';
        hint.textContent = config.description;
        heading.append(hint);
    }
    if (config.qpePass) {
        const status = document.createElement('small');
        status.className = 'qpe-pass-time';
        status.dataset.qpePassStatus = String(config.qpePass);
        heading.append(status);
    }
    const count = document.createElement('span');
    count.className = 'section-count';
    count.textContent = String(getSectionLayerEntries(config).length);
    summary.append(heading, count);
    const body = document.createElement('div');
    body.className = 'dashboard-layer-group-body';
    if(config.ffgTendency){
        const control=document.createElement('label');control.className='ffg-tendency-control';control.textContent='Change over ';
        const select=document.createElement('select');select.setAttribute('aria-label','FFG tendency change interval');
        [6,12,24].forEach(h=>{const option=document.createElement('option');option.value=String(h);option.textContent=h+' hours';select.append(option);});
        select.value=String(ffgTendency.getLookback());select.addEventListener('change',()=>ffgTendency.setLookback(select.value));control.append(select);
        const status=document.createElement('small');status.dataset.ffgTendencyStatus='1';status.className='qpe-pass-time';status.textContent=ffgTendency.summary();
        body.append(control,status);
    }
    (config.layers || []).forEach(entry => body.append(renderLayerRow(entry)));
    (config.groups || []).forEach(child => body.append(renderDashboardLayerGroup(child)));
    group.append(summary, body);
    return group;
}

function renderLayerRow(entry) {
    const row = document.createElement('label');
    row.className = `layer-row${entry.nested ? ' is-nested' : ''}`;
    row.dataset.layerId = entry.id;
    row.dataset.searchText = entry.searchText;

    const control = document.createElement('input');
    const isExclusive = Boolean(entry.exclusiveGroup);
    control.type = isExclusive ? 'radio' : 'checkbox';
    control.className = 'layer-checkbox';
    control.dataset.layerId = entry.id;
    if (isExclusive) control.name = `layer-group-${entry.exclusiveGroup}`;
    control.checked = map.hasLayer(entry.layer);

    control.addEventListener('click', event => {
        selectDashboardLayer(entry.id);
        if (isExclusive && map.hasLayer(entry.layer)) {
            event.preventDefault();
            setDashboardLayerActive(entry, false);
            return;
        }
        setDashboardLayerActive(entry, isExclusive ? true : control.checked);
    });

    const label = document.createElement('span');
    label.className = 'layer-label';
    label.innerHTML = entry.label;
    if (entry.description) {
        const description = document.createElement('small');
        description.className = 'layer-description';
        description.textContent = entry.description;
        label.append(description);
    }

    row.addEventListener('click', () => selectDashboardLayer(entry.id));
    row.append(control, label);
    return row;
}

function renderUtilitySection(container) {
    const section = document.createElement('details');
    section.className = 'dashboard-section utility-section';
    section.dataset.sectionId = 'utilities';

    const summary = document.createElement('summary');
    summary.innerHTML = '<span class="section-title">Dashboard Utilities</span>';

    const body = document.createElement('div');
    body.className = 'section-body utility-grid';
    body.innerHTML = `
        <div class="utility-field">
            <label for="basemap-select">Basemap</label>
            <select id="basemap-select" aria-label="Select basemap"></select>
        </div>
        <div class="utility-toggle-field">
            <label class="utility-toggle-row" for="ufvs-geographic-domains-toggle">
                <input id="ufvs-geographic-domains-toggle" type="checkbox">
                <span>
                    <strong>UFVS Geographic Domains</strong>
                    <small>Overlay the seven WPC verification domains. Hover over a boundary for its domain name.</small>
                </span>
            </label>
        </div>
        <div class="utility-toggle-field">
            <div style="margin-bottom:6px;">
                <strong>Map Reference Overlays</strong>
                <small style="display:block;opacity:0.75;margin-top:2px;">Add scalable geographic context above any basemap.</small>
            </div>
            <div id="map-reference-overlay-controls"></div>
        </div>
        <div class="opacity-control">
            <label id="layer-opacity-label" for="layer-opacity">Selected raster opacity</label>
            <div class="opacity-row">
                <input id="layer-opacity" type="range" min="10" max="100" step="5" value="100" disabled>
                <span id="opacity-value">—</span>
            </div>
        </div>
        <div class="utility-button-grid">
            <button id="solo-selected-layer" class="sidebar-tool-button" type="button" disabled>Solo selected raster</button>
            <button id="clear-raster-layers" class="sidebar-tool-button" type="button">Clear raster layers</button>
            <button id="reset-map-view" class="sidebar-tool-button" type="button">Reset map extent</button>
            <button id="restore-dashboard-defaults" class="sidebar-tool-button" type="button">Restore defaults</button>
        </div>
    `;


    section.append(summary, body);
    container.append(section);

    const basemapSelect = body.querySelector('#basemap-select');
    baseMapRegistry.forEach(base => {
        const option = document.createElement('option');
        option.value = base.id;
        option.textContent = base.label;
        option.selected = map.hasLayer(base.layer);
        basemapSelect.append(option);
    });

    basemapSelect.addEventListener('change', () => {
        const next = baseMapRegistry.find(base => base.id === basemapSelect.value);
        if (!next) return;
        baseMapRegistry.forEach(base => {
            if (base !== next && map.hasLayer(base.layer)) map.removeLayer(base.layer);
        });
        if (!map.hasLayer(next.layer)) map.addLayer(next.layer);
        map.fire('baselayerchange', {name: next.label, layer: next.layer});
    });

    const ufvsDomainsToggle = body.querySelector('#ufvs-geographic-domains-toggle');
    ufvsDomainsToggle.checked = map.hasLayer(ufvsGeographicDomainsLayer);
    ufvsDomainsToggle.addEventListener('change', event => {
        setUFVSGeographicDomainsVisible(event.target.checked);
    });

    const mapReferenceControls = body.querySelector('#map-reference-overlay-controls');
    mapReferenceOverlayConfigs.forEach(config => {
        const row = document.createElement('label');
        row.className = 'utility-toggle-row';
        row.htmlFor = `map-reference-${config.refId}-toggle`;
        row.style.marginTop = '4px';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `map-reference-${config.refId}-toggle`;
        input.checked = map.hasLayer(config.layer);
        input.addEventListener('change', event => {
            setMapReferenceOverlayVisible(config, event.target.checked);
        });

        const text = document.createElement('span');
        text.textContent = config.label;
        if (config.refId === 'rfc-boundaries') {
            const status = document.createElement('small');
            status.id = 'rfc-boundaries-status';
            status.style.display = 'block';
            status.textContent = 'NOAA/NWS RFC areas of responsibility';
            text.append(status);
        }
        row.append(input, text);
        mapReferenceControls.append(row);
    });

    body.querySelector('#layer-opacity').addEventListener('input', event => {
        const selected = layerEntriesById.get(selectedDashboardLayerId);
        if (!selected) return;
        const target = selected.opacityTarget || selected.layer;
        if (typeof target.setOpacity !== 'function') return;
        const opacity = Number(event.target.value) / 100;
        target.setOpacity(opacity);
        body.querySelector('#opacity-value').textContent = `${event.target.value}%`;
    });

    body.querySelector('#solo-selected-layer').addEventListener('click', () => {
        const selected = layerEntriesById.get(selectedDashboardLayerId);
        if (!selected || selected.kind !== 'raster') return;
        getAllDashboardLayerEntries().forEach(entry => {
            if (entry.kind === 'raster' && entry !== selected) {
                setDashboardLayerActive(entry, false);
            }
        });
        setDashboardLayerActive(selected, true);
    });

    body.querySelector('#clear-raster-layers').addEventListener('click', () => {
        getAllDashboardLayerEntries().forEach(entry => {
            if (entry.kind === 'raster') setDashboardLayerActive(entry, false);
        });
    });

    body.querySelector('#reset-map-view').addEventListener('click', () => {
        map.setView([39.8283, -98.5795], 5);
    });

    body.querySelector('#restore-dashboard-defaults').addEventListener('click', () => {
        getAllDashboardLayerEntries().forEach(entry => {
            setDashboardLayerActive(entry, Boolean(entry.defaultActive));
        });
        const defaultBase = baseMapRegistry[0];
        baseMapRegistry.forEach(base => {
            if (base !== defaultBase && map.hasLayer(base.layer)) map.removeLayer(base.layer);
        });
        if (!map.hasLayer(defaultBase.layer)) map.addLayer(defaultBase.layer);
        map.fire('baselayerchange', {name: defaultBase.label, layer: defaultBase.layer});
        basemapSelect.value = defaultBase.id;
        setUFVSGeographicDomainsVisible(false);
        mapReferenceOverlayConfigs.forEach(config => {
            setMapReferenceOverlayVisible(config, Boolean(config.defaultActive));
        });
        map.setView([39.8283, -98.5795], 5);
    });
}

function applyLayerSearch() {
    const searchInput = document.getElementById('layer-search');
    const query = (searchInput?.value || '').trim().toLowerCase();

    document.querySelectorAll('.dashboard-section[data-section-id]').forEach(sectionEl => {
        if (sectionEl.dataset.sectionId === 'utilities') return;
        const rows = Array.from(sectionEl.querySelectorAll('.layer-row'));
        let visibleRows = 0;
        rows.forEach(row => {
            const visible = !query || row.dataset.searchText.includes(query);
            row.hidden = !visible;
            if (visible) visibleRows += 1;
        });

        sectionEl.querySelectorAll('.dashboard-layer-group').forEach(groupEl => {
            const groupRows = Array.from(groupEl.querySelectorAll('.layer-row'));
            const groupVisible = groupRows.some(row => !row.hidden);
            groupEl.hidden = query ? !groupVisible : false;
            if (query && groupVisible) groupEl.open = true;
        });

        const isExperimentalEmpty = sectionEl.dataset.sectionId === 'experimental' && rows.length === 0;
        const emptyNote = sectionEl.querySelector('.empty-section-note');
        const noteMatches = isExperimentalEmpty && (!query || 'experimental nldas-3 model research'.includes(query));
        if (emptyNote) emptyNote.hidden = !noteMatches;

        sectionEl.hidden = query
            ? (visibleRows === 0 && !noteMatches)
            : false;
        if (query && !sectionEl.hidden) sectionEl.open = true;
    });
}

function renderDashboardSidebar() {
    if (sidebarRenderQueued) return;
    sidebarRenderQueued = true;
    requestAnimationFrame(() => {
        sidebarRenderQueued = false;
        rebuildLayerEntryIndex();
        const container = document.getElementById('sidebar-sections');
        if (!container) return;
        container.innerHTML = '';

        dashboardSections.forEach(sectionConfig => {
            const section = document.createElement('details');
            section.className = 'dashboard-section';
            section.dataset.sectionId = sectionConfig.id;
            section.open = Boolean(sectionConfig.openByDefault);

            const summary = document.createElement('summary');
            const count = getSectionLayerEntries(sectionConfig).length;
            summary.innerHTML = `
                <span class="section-title">${sectionConfig.title}</span>
                <span class="section-count">${count}</span>
            `;

            const body = document.createElement('div');
            body.className = 'section-body';

            if (count === 0) {
                const note = document.createElement('div');
                note.className = 'empty-section-note';
                note.textContent = sectionConfig.emptyMessage || 'No layers registered.';
                body.append(note);
            } else {
                (sectionConfig.layers || []).forEach(entry => {
                    body.append(renderLayerRow(entry));
                    // Keep the multi-year historical toggle buttons visually attached to the
                    // historical layer row so forecasters can overlay any combination
                    // of the rolling five completed fire years.
                    if (sectionConfig.id === 'wildfire-burn-scar' && entry.id === 'wfigs-history') {
                        renderWFIGSHistoryYearControl(body);
                        renderWFIGSSeasonalTrendControl(body);
                    }
                });

                (sectionConfig.groups || []).forEach(groupConfig => body.append(renderDashboardLayerGroup(groupConfig)));
            }

            section.append(summary, body);
            container.append(section);
        });

        renderUtilitySection(container);
        updateQPEFFGMenuStatus();
        syncSidebarWithMap();
        applyLayerSearch();
    });
}

function setSidebarOpen(isOpen, persist = true) {
    document.body.classList.toggle('sidebar-open', isOpen);
    const toggle = document.getElementById('sidebar-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));
    if (persist) localStorage.setItem('wpcSidebarOpen', isOpen ? '1' : '0');
    window.setTimeout(() => map.invalidateSize(), 240);
}

function initializeSidebarControls() {
    const savedState = localStorage.getItem('wpcSidebarOpen');
    const defaultOpen = window.innerWidth > 900;
    setSidebarOpen(savedState === null ? defaultOpen : savedState === '1', false);

    document.getElementById('sidebar-toggle')?.addEventListener('click', () => setSidebarOpen(true));
    document.getElementById('sidebar-close')?.addEventListener('click', () => setSidebarOpen(false));
    document.getElementById('layer-search')?.addEventListener('input', applyLayerSearch);
    document.getElementById('clear-layer-search')?.addEventListener('click', () => {
        const input = document.getElementById('layer-search');
        if (input) input.value = '';
        applyLayerSearch();
        input?.focus();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
            setSidebarOpen(false);
        }
    });
}

function registerDashboardLayer(sectionId, config) {
    const section = dashboardSections.find(item => item.id === sectionId);
    if (!section) throw new Error(`Unknown dashboard section: ${sectionId}`);
    if (!config || !config.id || !config.label || !config.layer) {
        throw new Error('registerDashboardLayer requires id, label, and layer.');
    }
    section.layers.push({kind: 'raster', ...config});
    renderDashboardSidebar();
    return config.layer;
}

window.WPCDashboard = Object.freeze({
    registerLayer: registerDashboardLayer,
    refreshSidebar: renderDashboardSidebar,
    sections: dashboardSections,
    getActiveLayers: () => getAllDashboardLayerEntries()
        .filter(entry => map.hasLayer(entry.layer))
        .map(entry => ({id: entry.id, label: cleanLayerLabel(entry.label)}))
});

initializeSidebarControls();
renderDashboardSidebar();
map.on('layeradd layerremove', () => window.setTimeout(syncSidebarWithMap, 0));

// --- INITIALIZE DEFAULT DASHBOARD STATE ---
setTimeout(() => {
    if (map.hasLayer(warningsLayer)) activeLayerNames.add("Active Hydro Warnings & Advisories");
    if (map.hasLayer(watchesLayer)) activeLayerNames.add("Active Hydro Watches");
    if (map.hasLayer(mpdLayer)) activeLayerNames.add("WPC Active MPDs");
    if (map.hasLayer(eroLayer)) activeLayerNames.add("Day 1 ERO (Real-Time)");
    if (map.hasLayer(mrmsRalaLayer)) activeLayerNames.add(MRMS_RALA_LAYER_NAME);
    if (map.hasLayer(radarTimeLayer)) activeLayerNames.add('IEM NEXRAD Radar — Backup (2-Hour Loop)');
    
    if (map.hasLayer(ffdLayer)) activeLayerNames.add("MRMS DVD Flash Flood Detector");
    if (map.hasLayer(mrms1hr)) activeLayerNames.add("MRMS 1-Hour QPE");

    updateLegends();
    
    const radarTimeBox = document.getElementById('radar-time-box');
    if (radarTimeBox && map.hasLayer(radarTimeLayer)) {
        radarTimeBox.style.display = 'block';
        const currentFrameTime = new Date(map.timeDimension.getCurrentTime());
        radarTimeBox.innerHTML = `
            <strong>IEM NEXRAD Backup Loop</strong><br>
            <span style="color: #ffeb3b; font-weight: bold; font-size: 1.05em;">Frame: ${formatUTC(currentFrameTime)}</span>
        `;
    }
    if (map.hasLayer(mrmsRalaLayer)) {
        updateMRMSRALATimeBox();
        if (mrmsRalaReady && mrmsRalaFresh) activateMRMSRALATimeline({jumpToLatest: true});
    }
    
    const ffdTimeBox = document.getElementById('ffd-time-box');
    if (ffdTimeBox && map.hasLayer(ffdLayer)) {
        ffdTimeBox.style.display = 'block';
    }

    refreshLegendDockSummary();
}, 1500);


