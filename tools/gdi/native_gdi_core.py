import numpy as np
def gdi_components(t, q, ps_hpa, denominator='theta850', moisture='q', terrain='add', allow_postprocessed_terrain=False):
    """t/q shape (4,...), ordered 950/850/700/500; K, kg/kg, hPa.
    All finite inputs are evaluated; callers use returned valid mask for guidance.
    allow_postprocessed_terrain is only for model-supplied pressure-level inputs;
    it does not extrapolate native profiles or recover missing values.
    """
    t, q, ps = np.asarray(t, dtype=float), np.asarray(q, dtype=float), np.asarray(ps_hpa, dtype=float)
    if t.shape != q.shape or t.shape[0] != 4 or t.shape[1:] != ps.shape:
        raise ValueError('Expected t,q=(4,...), ps=(...).')
    if denominator not in ('theta850','t850') or moisture not in ('q','r') or terrain not in ('add','minus_half'):
        raise ValueError('Unknown formulation choice')
    p = np.array([950.,850.,700.,500.]).reshape((4,)+(1,)*ps.ndim)
    input_ok = (np.isfinite(t).all(axis=0) & np.isfinite(q).all(axis=0)
                & ((t>150)&(t<350)).all(axis=0) & ((q>=0)&(q<0.1)).all(axis=0)
                & np.isfinite(ps) & (ps>500.1) & (ps<1100))
    tt = np.where(input_ok[None,...],t,np.nan)
    qq = np.where(input_ok[None,...],q,np.nan)
    theta = tt*(1000/p)**(2/7)
    m = qq if moisture=='q' else qq/(1-qq)
    den = theta[1] if denominator=='theta850' else tt[1]
    a = theta[0]*np.exp(2690000*m[0]/(1005.7*den))
    b = (theta[1]+theta[2])/2*np.exp(2690000*(m[1]+m[2])/2/(1005.7*den))-10
    c = theta[3]*np.exp(2690000*m[3]/(1005.7*den))-10
    cbi = np.where(a>303,0.065*(a-303)*(c-303),0.)
    mwi = -7*np.maximum(tt[3]-263.15,0.)
    ii = np.minimum(1.5*(tt[0]-tt[2]+b-a),0.)
    tc = 18-9000/np.where(input_ok,ps-500,np.nan)
    if terrain=='minus_half': tc = -0.5*tc
    thermo=cbi+mwi+ii
    result = dict(eptp_a=a,eptp_b=b,eptp_c=c,cbi=cbi,mwi=mwi,ii=ii,
                  thermodynamic=thermo,terrain_correction=tc,gdi_raw=thermo+tc)
    result={k:np.where(input_ok,v,np.nan) for k,v in result.items()}
    result['valid'] = input_ok & (allow_postprocessed_terrain | (ps>=950))
    result['gdi'] = np.where(result['valid'],result['gdi_raw'],np.nan)
    return result

VARIANTS = {
    'jose_gfs_baseline': ('theta850','q','add'),
    'denominator_only': ('t850','q','add'),
    'moisture_only': ('theta850','r','add'),
    'supplied_hrrr': ('t850','r','add'),
    'ecmwf_terrain_sensitivity': ('theta850','q','minus_half'),
}
