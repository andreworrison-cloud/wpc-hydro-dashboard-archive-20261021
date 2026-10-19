# Exact calculation excerpt from supplied GDI_Modelo_Europeo.ipynb, GFS section.
# Source Library ID: libfile_a49a75ed68b88191b711bfe62419143c
# Calculation lines unmodified; excludes access and graphical interpolation.
T950 = t950 * (1000 / 950) ** (2 / 7)
T850 = t850 * (1000 / 850) ** (2 / 7)
T700 = t700 * (1000 / 700) ** (2 / 7)
T500 = t500 * (1000 / 500) ** (2 / 7)

# Definición de las tres capas representativas del GDI (según manuscrito)
THETAA = T950               # Capa A: baja troposfera (~950 hPa) — representa condiciones cercanas a superficie
A1     = T850 + T700
THETAB = 0.5 * A1           # Capa B: media troposfera baja (850–700 hPa) — zona donde suele estar la inversión de trade-wind
THETAC = T500               # Capa C: media troposfera (~500 hPa) — representa influencia de dorsales/troughs en altura

# Humedades representativas de cada capa
RA = q950                   # Humedad baja troposfera
C2 = q850 + q700
RB = 0.5 * C2               # Humedad media-baja (zona crítica para Trade Wind Inversion)
RC = q500                   # Humedad en niveles medios

# Constantes del índice (valores fijos del manuscrito Gálvez & Davison, 2016)
L0   = 2690000              # Calor latente de vaporización aproximado (J/kg)
alpha = -10                 # Ajuste empírico para EPT en capa B
cpd  = 1005.7               # Calor específico del aire seco a presión constante (J/kg/K)

# Proxy simplificado de θe (equivalent potential temperature) usando T850 en denominador
# Esto es la aproximación clave del GDI para evitar cálculo exacto del LCL
p1 = L0 * RA
p2 = L0 * RB
p3 = L0 * RC
p4 = cpd * T850

x1 = p1 / p4
x2 = p2 / p4
x3 = p3 / p4

y1 = np.exp(x1)
y2 = np.exp(x2)
y3 = np.exp(x3)

EPTPA = THETAA * y1                  # Proxy EPT capa A (baja)
EPTPB = THETAB * y2 + alpha          # Proxy EPT capa B (media-baja) + ajuste empírico
EPTPC = THETAC * y3 + alpha          # Proxy EPT capa C (media)

# ----------------------------------------------------------
# Componentes del GDI
# ----------------------------------------------------------
# 1. Energy Convective Index (ECI) → mide disponibilidad de energía/buoyancy en columna
beta = 303                      # Valor de referencia empírico (relacionado con estabilidad neutra)
ME   = EPTPC - beta             # Déficit/exceso de EPT en 500 hPa
LE   = EPTPA - beta             # Déficit/exceso de EPT en baja troposfera
gamma = 0.065                   # Factor de escala empírico
ECI  = np.where(LE <= 0, 0, gamma * LE * ME)

# 2. Mid-tropospheric Warming Index (MWI) → penaliza dorsales cálidas en altura (estabilizan)
tau = 263.15                    # Temperatura umbral en 500 hPa (~ -10°C)
mu  = -7                        # Factor de escala negativo
calc1 = t500 - tau
MWI   = np.where(calc1 <= 0, 0, calc1 * mu)

# 3. Inversion Index (II) → penaliza inversiones de subsidencia / Trade Wind Inversion (TWI)
# Combina diferencia térmica 950-700 hPa y diferencia de EPT entre capas
sigma = 1.5
op1   = t950 - t700
S     = sigma * op1                     # Efecto térmico de la posible inversión
op2   = EPTPB - EPTPA
D     = sigma * op2                     # Efecto de secado/estabilización por subsidencia
calc2 = D + S
II    = np.where(calc2 <= 0, D + S, 0)  # Solo penaliza si la suma es negativa

# 4. Corrección por presión de superficie (topografía) → ajusta por altura del terreno
pp1 = 500
pp2 = 9000
pp3 = 18
divisor  = sfcps - pp1
division = pp2 / divisor
C0 = pp3 - division

# Índice bruto y corregido
GDI  = ECI + MWI + II
GDIc = GDI + C0                     # GDI final con corrección topográfica

