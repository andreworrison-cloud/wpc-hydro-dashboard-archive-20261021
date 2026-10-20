/* NOAA/NWS RFC reference boundaries; independent of hydrologic raster selection. */
window.createRFCBoundaryLayer = function (map) {
    const pane = map.createPane('rfcBoundaries');
    pane.style.zIndex = 585;
    pane.style.pointerEvents = 'none';
    const group = L.layerGroup();
    const url = 'https://mapservices.weather.noaa.gov/static/rest/services/nws_reference_maps/nws_reference_map/FeatureServer/11/query?where=1%3D1&outFields=site_id,rfc_name,basin_id&outSR=4326&returnGeometry=true&maxAllowableOffset=0.002&f=geojson';
    let loaded = false;
    let pending = false;
    function status(message) {
        const node = document.getElementById('rfc-boundaries-status');
        if (node) node.textContent = message;
    }
    group.on('add', async function () {
        if (loaded || pending) return;
        pending = true;
        status('Loading NOAA RFC boundaries…');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
            const response = await fetch(url, {signal: controller.signal});
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            if (data.type !== 'FeatureCollection' || data.exceededTransferLimit ||
                !Array.isArray(data.features) || data.features.length !== 13 ||
                data.features.some(f => !f.properties?.rfc_name ||
                    !['Polygon', 'MultiPolygon'].includes(f.geometry?.type))) {
                throw new Error('Incomplete or unexpected RFC boundary response');
            }
            // Build off-map, then add to the group. If toggled off during fetch,
            // the group stays detached; asynchronous completion cannot reactivate it.
            const borders = L.geoJSON(data, {
                pane: 'rfcBoundaries',
                interactive: false,
                style: {color: '#101820', weight: 4.5, opacity: 0.9, fill: false}
            });
            const highlight = L.geoJSON(data, {
                pane: 'rfcBoundaries',
                interactive: false,
                style: {color: '#ffe066', weight: 2, opacity: 1, fill: false}
            });
            group.addLayer(borders);
            group.addLayer(highlight);
            loaded = true;
            status('NOAA/NWS RFC areas of responsibility');
        } catch (error) {
            status('RFC boundaries unavailable — toggle off/on to retry');
            console.warn('RFC boundaries:', error);
        } finally {
            clearTimeout(timeout);
            pending = false;
        }
    });
    return group;
};
