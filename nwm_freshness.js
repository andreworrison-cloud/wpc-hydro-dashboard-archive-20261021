/* Dashboard policy for hourly NWM analysis; age always derives from source valid time. */
(function (root) {
    function state(metadata, now = Date.now()) {
        const time = Date.parse(metadata?.valid_time_iso || '');
        const age = (now - time) / 3600000;
        const valid = Number.isFinite(age) && age >= -0.25;
        const hidden = !valid || age >= 6;
        const delayed = valid && age >= 3;
        const retained = metadata?.update_status === 'failed_retained';
        const ageText = valid ? `${Math.floor(Math.max(0, age))} h ${Math.floor(Math.max(0, age) * 60) % 60} min old` : 'Valid time unavailable';
        const status = hidden ? 'Expired — hidden' : delayed ? 'Delayed' : 'Current';
        return {hidden, delayed, age, text: `${valid ? new Date(time).toISOString().replace('T', ' ').replace(':00.000Z', 'Z') + ' · ' : ''}${ageText} · ${status}${retained ? ' · Last valid map retained after update failure' : ''}`};
    }
    root.NWMFreshness = {state};
    if (typeof module !== 'undefined') module.exports = {state};
})(typeof window !== 'undefined' ? window : globalThis);
