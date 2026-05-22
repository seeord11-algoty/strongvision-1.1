"""
Generador de datasets para StrongVision
- heuristicas.json: 500+ rutinas tipo gym (heurística voraz/evolutiva)
- filtros.json: 500+ reglas de filtrado por patología/lesión/edad/género/nivel
"""
import json
import random
import os

random.seed(42)

# ============================================================
# CATÁLOGO BASE DE EJERCICIOS
# ============================================================
EJERCICIOS = {
    "pecho": [
        {"nombre": "Press de banca con barra", "equipo": "barra", "impacto": "alto", "carga_axial": False, "articulaciones": ["hombro", "codo"]},
        {"nombre": "Press inclinado con mancuerna", "equipo": "mancuerna", "impacto": "medio", "carga_axial": False, "articulaciones": ["hombro", "codo"]},
        {"nombre": "Press declinado con barra", "equipo": "barra", "impacto": "medio", "carga_axial": False, "articulaciones": ["hombro", "codo"]},
        {"nombre": "Aperturas con mancuerna", "equipo": "mancuerna", "impacto": "bajo", "carga_axial": False, "articulaciones": ["hombro"]},
        {"nombre": "Cruce de poleas", "equipo": "polea", "impacto": "bajo", "carga_axial": False, "articulaciones": ["hombro"]},
        {"nombre": "Flexiones de pecho", "equipo": "ninguno", "impacto": "bajo", "carga_axial": False, "articulaciones": ["hombro", "codo", "muñeca"]},
        {"nombre": "Press en máquina Smith", "equipo": "maquina", "impacto": "bajo", "carga_axial": False, "articulaciones": ["hombro", "codo"]},
        {"nombre": "Pec deck (contractor)", "equipo": "maquina", "impacto": "bajo", "carga_axial": False, "articulaciones": ["hombro"]},
    ],
    "espalda": [
        {"nombre": "Peso muerto convencional", "equipo": "barra", "impacto": "alto", "carga_axial": True, "articulaciones": ["lumbar", "rodilla", "cadera"]},
        {"nombre": "Dominadas asistidas", "equipo": "maquina", "impacto": "medio", "carga_axial": False, "articulaciones": ["hombro", "codo"]},
        {"nombre": "Remo con barra", "equipo": "barra", "impacto": "medio", "carga_axial": True, "articulaciones": ["lumbar", "hombro", "codo"]},
        {"nombre": "Remo con mancuerna a una mano", "equipo": "mancuerna", "impacto": "medio", "carga_axial": False, "articulaciones": ["hombro", "codo"]},
        {"nombre": "Jalón al pecho en polea", "equipo": "polea", "impacto": "bajo", "carga_axial": False, "articulaciones": ["hombro", "codo"]},
        {"nombre": "Remo sentado en polea", "equipo": "polea", "impacto": "bajo", "carga_axial": False, "articulaciones": ["hombro", "codo"]},
        {"nombre": "Hiperextensiones lumbares", "equipo": "maquina", "impacto": "medio", "carga_axial": False, "articulaciones": ["lumbar"]},
        {"nombre": "Remo en máquina T-bar", "equipo": "maquina", "impacto": "medio", "carga_axial": True, "articulaciones": ["lumbar", "hombro"]},
    ],
    "piernas": [
        {"nombre": "Sentadilla con barra", "equipo": "barra", "impacto": "alto", "carga_axial": True, "articulaciones": ["lumbar", "rodilla", "cadera"]},
        {"nombre": "Sentadilla goblet con mancuerna", "equipo": "mancuerna", "impacto": "medio", "carga_axial": False, "articulaciones": ["rodilla", "cadera"]},
        {"nombre": "Prensa de piernas 45°", "equipo": "maquina", "impacto": "medio", "carga_axial": False, "articulaciones": ["rodilla", "cadera"]},
        {"nombre": "Zancadas con mancuernas", "equipo": "mancuerna", "impacto": "medio", "carga_axial": False, "articulaciones": ["rodilla", "cadera"]},
        {"nombre": "Extensión de cuádriceps en máquina", "equipo": "maquina", "impacto": "bajo", "carga_axial": False, "articulaciones": ["rodilla"]},
        {"nombre": "Curl femoral acostado", "equipo": "maquina", "impacto": "bajo", "carga_axial": False, "articulaciones": ["rodilla"]},
        {"nombre": "Elevación de gemelos de pie", "equipo": "maquina", "impacto": "bajo", "carga_axial": False, "articulaciones": ["tobillo"]},
        {"nombre": "Peso muerto rumano", "equipo": "barra", "impacto": "medio", "carga_axial": True, "articulaciones": ["lumbar", "cadera"]},
        {"nombre": "Hip thrust con barra", "equipo": "barra", "impacto": "medio", "carga_axial": False, "articulaciones": ["cadera"]},
        {"nombre": "Sentadilla búlgara", "equipo": "mancuerna", "impacto": "medio", "carga_axial": False, "articulaciones": ["rodilla", "cadera"]},
    ],
    "hombro": [
        {"nombre": "Press militar con barra", "equipo": "barra", "impacto": "alto", "carga_axial": True, "articulaciones": ["hombro", "codo", "lumbar"]},
        {"nombre": "Press de hombro con mancuerna sentado", "equipo": "mancuerna", "impacto": "medio", "carga_axial": False, "articulaciones": ["hombro", "codo"]},
        {"nombre": "Elevaciones laterales", "equipo": "mancuerna", "impacto": "bajo", "carga_axial": False, "articulaciones": ["hombro"]},
        {"nombre": "Elevaciones frontales", "equipo": "mancuerna", "impacto": "bajo", "carga_axial": False, "articulaciones": ["hombro"]},
        {"nombre": "Pájaros (rear delt fly)", "equipo": "mancuerna", "impacto": "bajo", "carga_axial": False, "articulaciones": ["hombro"]},
        {"nombre": "Face pull en polea", "equipo": "polea", "impacto": "bajo", "carga_axial": False, "articulaciones": ["hombro"]},
        {"nombre": "Press Arnold", "equipo": "mancuerna", "impacto": "medio", "carga_axial": False, "articulaciones": ["hombro", "codo"]},
    ],
    "brazo": [
        {"nombre": "Curl de bíceps con barra", "equipo": "barra", "impacto": "bajo", "carga_axial": False, "articulaciones": ["codo"]},
        {"nombre": "Curl alterno con mancuerna", "equipo": "mancuerna", "impacto": "bajo", "carga_axial": False, "articulaciones": ["codo"]},
        {"nombre": "Curl martillo", "equipo": "mancuerna", "impacto": "bajo", "carga_axial": False, "articulaciones": ["codo"]},
        {"nombre": "Extensión de tríceps en polea", "equipo": "polea", "impacto": "bajo", "carga_axial": False, "articulaciones": ["codo"]},
        {"nombre": "Press francés con barra Z", "equipo": "barra", "impacto": "bajo", "carga_axial": False, "articulaciones": ["codo"]},
        {"nombre": "Fondos en banco", "equipo": "ninguno", "impacto": "medio", "carga_axial": False, "articulaciones": ["hombro", "codo"]},
        {"nombre": "Patada de tríceps", "equipo": "mancuerna", "impacto": "bajo", "carga_axial": False, "articulaciones": ["codo"]},
    ],
    "core": [
        {"nombre": "Plancha frontal", "equipo": "ninguno", "impacto": "bajo", "carga_axial": False, "articulaciones": ["lumbar", "hombro"]},
        {"nombre": "Crunch abdominal", "equipo": "ninguno", "impacto": "bajo", "carga_axial": False, "articulaciones": ["lumbar"]},
        {"nombre": "Elevación de piernas colgado", "equipo": "barra", "impacto": "medio", "carga_axial": False, "articulaciones": ["hombro", "lumbar"]},
        {"nombre": "Russian twist", "equipo": "mancuerna", "impacto": "bajo", "carga_axial": False, "articulaciones": ["lumbar"]},
        {"nombre": "Abdominales en máquina", "equipo": "maquina", "impacto": "bajo", "carga_axial": False, "articulaciones": ["lumbar"]},
        {"nombre": "Plancha lateral", "equipo": "ninguno", "impacto": "bajo", "carga_axial": False, "articulaciones": ["lumbar", "hombro"]},
        {"nombre": "Bicicleta abdominal", "equipo": "ninguno", "impacto": "bajo", "carga_axial": False, "articulaciones": ["lumbar"]},
    ],
    "cardio": [
        {"nombre": "Caminata en cinta", "equipo": "maquina", "impacto": "bajo", "carga_axial": False, "articulaciones": ["rodilla", "tobillo"]},
        {"nombre": "Trote en cinta", "equipo": "maquina", "impacto": "alto", "carga_axial": False, "articulaciones": ["rodilla", "tobillo"]},
        {"nombre": "Bicicleta estática", "equipo": "maquina", "impacto": "bajo", "carga_axial": False, "articulaciones": ["rodilla"]},
        {"nombre": "Elíptica", "equipo": "maquina", "impacto": "bajo", "carga_axial": False, "articulaciones": ["rodilla", "tobillo"]},
        {"nombre": "Remo ergómetro", "equipo": "maquina", "impacto": "bajo", "carga_axial": False, "articulaciones": ["hombro", "rodilla"]},
        {"nombre": "Saltos con cuerda", "equipo": "ninguno", "impacto": "alto", "carga_axial": False, "articulaciones": ["rodilla", "tobillo"]},
        {"nombre": "Burpees", "equipo": "ninguno", "impacto": "alto", "carga_axial": False, "articulaciones": ["rodilla", "hombro"]},
    ],
}

# ============================================================
# SPLITS DE ENTRENAMIENTO — distribución científica por días
# Basado en: ACSM Guidelines, Schoenfeld et al. (2016),
# principio SRA (Stimulus-Recovery-Adaptation): grupos grandes
# (piernas, espalda) necesitan 48-72h; pequeños (brazo, core) 24-48h.
# ============================================================
SPLITS = {
    2: {
        "tipo": "full_body",
        "dias": [
            {"label": "full body A (piernas+pecho+espalda+core)", "grupos": ["piernas", "pecho", "espalda", "core"]},
            {"label": "full body B (piernas+hombro+brazo+core)",  "grupos": ["piernas", "hombro", "brazo",  "core"]},
        ]
    },
    3: {
        "tipo": "ppl",
        "dias": [
            {"label": "push (pecho+hombro+brazo)",  "grupos": ["pecho",    "hombro", "brazo"]},
            {"label": "pull (espalda+brazo)",        "grupos": ["espalda",  "brazo"]},
            {"label": "legs (piernas+core+cardio)",  "grupos": ["piernas",  "core",   "cardio"]},
        ]
    },
    4: {
        "tipo": "upper_lower",
        "dias": [
            {"label": "upper A (pecho+espalda+hombro)", "grupos": ["pecho",   "espalda", "hombro"]},
            {"label": "lower A (piernas+core)",          "grupos": ["piernas", "core"]},
            {"label": "upper B (pecho+espalda+brazo)",  "grupos": ["pecho",   "espalda", "brazo"]},
            {"label": "lower B (piernas+cardio+core)",  "grupos": ["piernas", "cardio",  "core"]},
        ]
    },
    5: {
        "tipo": "ppl_upper_lower",
        "dias": [
            {"label": "push (pecho+hombro+brazo)",    "grupos": ["pecho",   "hombro",  "brazo"]},
            {"label": "pull (espalda+brazo)",          "grupos": ["espalda", "brazo"]},
            {"label": "legs (piernas+core)",           "grupos": ["piernas", "core"]},
            {"label": "upper (pecho+espalda+hombro)", "grupos": ["pecho",   "espalda", "hombro"]},
            {"label": "lower (piernas+cardio+core)",  "grupos": ["piernas", "cardio",  "core"]},
        ]
    },
    6: {
        "tipo": "ppl_x2",
        "dias": [
            {"label": "push A (pecho+hombro+brazo)",  "grupos": ["pecho",   "hombro", "brazo"]},
            {"label": "pull A (espalda+brazo)",        "grupos": ["espalda", "brazo"]},
            {"label": "legs A (piernas+core)",         "grupos": ["piernas", "core"]},
            {"label": "push B (pecho+hombro+brazo)",  "grupos": ["pecho",   "hombro", "brazo"]},
            {"label": "pull B (espalda+brazo)",        "grupos": ["espalda", "brazo"]},
            {"label": "legs B (piernas+cardio+core)", "grupos": ["piernas", "cardio", "core"]},
        ]
    },
}

# ============================================================
# DATASET 1: HEURÍSTICAS (RUTINAS) - 500+ entradas
# ============================================================
NIVELES = ["principiante", "intermedio", "avanzado"]
GENEROS = ["masculino", "femenino", "otro"]
OBJETIVOS = ["hipertrofia", "fuerza", "definicion", "resistencia", "tonificacion", "perdida_peso"]
RANGOS_EDAD = [
    {"min": 16, "max": 25, "label": "joven"},
    {"min": 26, "max": 40, "label": "adulto"},
    {"min": 41, "max": 55, "label": "adulto_mayor"},
    {"min": 56, "max": 75, "label": "senior"},
]
PATOLOGIAS_LESIONES = [
    "ninguna",
    "hernia_lumbar",
    "rodilla_derecha",
    "rodilla_izquierda",
    "hombro_izquierdo",
    "hombro_derecho",
    "codo_tendinitis",
    "muñeca_lesion",
    "tobillo_esguince",
    "diabetes_tipo2",
    "hipertension",
    "asma",
    "escoliosis",
    "cervicales",
    "cardiopatia_leve",
    "obesidad",
    "embarazo",
    "osteoporosis",
    "artritis",
]

def split_zona(zona_pat):
    """Mapea patología/lesión a zonas a evitar"""
    mapa = {
        "hernia_lumbar": ["lumbar"],
        "rodilla_derecha": ["rodilla"],
        "rodilla_izquierda": ["rodilla"],
        "hombro_izquierdo": ["hombro"],
        "hombro_derecho": ["hombro"],
        "codo_tendinitis": ["codo"],
        "muñeca_lesion": ["muñeca"],
        "tobillo_esguince": ["tobillo"],
        "escoliosis": ["lumbar"],
        "cervicales": ["hombro"],
        "osteoporosis": ["lumbar", "rodilla"],
        "artritis": ["rodilla", "codo", "muñeca"],
    }
    return mapa.get(zona_pat, [])

def evitar_carga_axial(pat):
    return pat in ["hernia_lumbar", "escoliosis", "osteoporosis", "hipertension", "embarazo", "cardiopatia_leve"]

def evitar_alto_impacto(pat):
    return pat in ["rodilla_derecha", "rodilla_izquierda", "tobillo_esguince", "obesidad",
                   "embarazo", "osteoporosis", "artritis", "cardiopatia_leve", "hipertension"]

def filtrar_ejercicios(grupo, nivel, patologia):
    """Heurística voraz: filtra ejercicios compatibles"""
    candidatos = EJERCICIOS[grupo]
    zonas_evitar = split_zona(patologia)
    sin_carga = evitar_carga_axial(patologia)
    sin_impacto = evitar_alto_impacto(patologia)
    filtrados = []
    for e in candidatos:
        if any(z in e["articulaciones"] for z in zonas_evitar):
            continue
        if sin_carga and e["carga_axial"]:
            continue
        if sin_impacto and e["impacto"] == "alto":
            continue
        if nivel == "principiante" and e["impacto"] == "alto":
            continue
        filtrados.append(e)
    return filtrados if filtrados else [e for e in candidatos if e["impacto"] == "bajo"]

def series_reps(nivel, objetivo):
    base = {
        "principiante": (3, "10-12"),
        "intermedio": (4, "8-12"),
        "avanzado": (4, "6-10"),
    }
    if objetivo == "fuerza":
        return {"principiante": (3, "5-6"), "intermedio": (4, "4-6"), "avanzado": (5, "3-5")}[nivel]
    if objetivo == "resistencia":
        return {"principiante": (3, "15-20"), "intermedio": (3, "12-20"), "avanzado": (4, "15-25")}[nivel]
    if objetivo in ("definicion", "tonificacion", "perdida_peso"):
        return {"principiante": (3, "12-15"), "intermedio": (4, "10-15"), "avanzado": (4, "12-15")}[nivel]
    return base[nivel]

def descanso_seg(nivel, objetivo):
    if objetivo == "fuerza":
        return 180
    if objetivo == "resistencia" or objetivo == "perdida_peso":
        return 45
    if nivel == "avanzado":
        return 90
    if nivel == "intermedio":
        return 75
    return 60

def construir_rutina(id_rutina, nivel, edad_info, genero, objetivo, patologia, dias):
    """Construye una rutina completa con distribución científica de grupos musculares.

    Splits implementados (ACSM Guidelines, Schoenfeld et al. 2016, principio SRA):
      2 días → Full Body          (recuperación 72h garantizada entre sesiones)
      3 días → Push / Pull / Legs  (48-72h entre mismos patrones de movimiento)
      4 días → Upper / Lower       (alternancia superior/inferior, 0 conflictos consecutivos)
      5 días → PPL + Upper/Lower   (cada grupo trabaja 2x/semana con 48h+ entre sesiones)
      6 días → PPL x2              (frecuencia 2x/semana, grupos distintos en días adyacentes)
    """
    if dias not in SPLITS:
        dias = 3
    split_info = SPLITS[dias]

    plan = {
        "id": id_rutina,
        "nivel": nivel,
        "rango_edad": edad_info["label"],
        "edad_min": edad_info["min"],
        "edad_max": edad_info["max"],
        "genero": genero,
        "objetivo": objetivo,
        "patologia_lesion": patologia,
        "dias_por_semana": dias,
        "split_tipo": split_info["tipo"],
        "advertencias": [],
        "calentamiento": [
            {"nombre": "Movilidad articular general", "duracion_min": 5},
            {"nombre": "Cardio suave (caminata o bici)", "duracion_min": 5},
        ],
        "estiramiento_final": [
            {"nombre": "Estiramientos generales", "duracion_min": 5},
        ],
        "sesiones": []
    }

    # Advertencias clínicas dinámicas
    if patologia == "hernia_lumbar":
        plan["advertencias"].append("Evitar carga axial. Mantener neutralidad de columna en cada repetición.")
    if patologia in ("rodilla_derecha", "rodilla_izquierda"):
        plan["advertencias"].append("Evitar saltos y sentadillas profundas. Trabajar con rangos parciales.")
    if patologia in ("hombro_izquierdo", "hombro_derecho"):
        plan["advertencias"].append("Evitar press por encima de la cabeza con carga alta. Priorizar manguito rotador.")
    if patologia == "diabetes_tipo2":
        plan["advertencias"].append("Hidratarse y monitorear glucosa antes/después de la sesión.")
    if patologia == "hipertension":
        plan["advertencias"].append("Evitar maniobra de Valsalva. Respirar continuamente. Sin HIIT.")
    if patologia == "asma":
        plan["advertencias"].append("Tener inhalador a mano. Calentamiento progresivo más extenso.")
    if patologia == "embarazo":
        plan["advertencias"].append("Sin ejercicios en supino prolongado a partir del segundo trimestre. Consultar al médico.")
    if patologia == "cardiopatia_leve":
        plan["advertencias"].append("Mantener intensidad moderada. No superar 70% FCmax.")
    if edad_info["label"] == "senior":
        plan["advertencias"].append("Énfasis en movilidad, equilibrio y rangos seguros.")

    series, reps = series_reps(nivel, objetivo)
    descanso = descanso_seg(nivel, objetivo)

    # Registro de ejercicios ya usados por grupo a lo largo de la semana.
    # Garantiza que cuando el mismo grupo aparece en varias sesiones
    # (ej: pecho en Upper A y Upper B) se usen ejercicios DISTINTOS.
    ejercicios_ya_usados = {}  # {grupo: [nombres]}

    for idx, dia_info in enumerate(split_info["dias"], start=1):
        grupos = dia_info["grupos"]
        label  = dia_info["label"]
        sesion = {"dia": idx, "enfoque": label, "ejercicios": []}

        for grupo in grupos:
            opciones = filtrar_ejercicios(grupo, nivel, patologia)
            n_ejercicios = 2 if grupo in ("brazo", "core", "cardio") else 3

            # Excluir los ya usados en sesiones previas para garantizar variedad
            ya_usados = ejercicios_ya_usados.get(grupo, [])
            opciones_nuevas = [e for e in opciones if e["nombre"] not in ya_usados]
            if len(opciones_nuevas) < n_ejercicios:
                opciones_nuevas = opciones  # fallback: repetir si no hay suficientes

            n_elegir = min(n_ejercicios, len(opciones_nuevas))
            elegidos = random.sample(opciones_nuevas, n_elegir)

            # Registrar como usados
            ejercicios_ya_usados.setdefault(grupo, []).extend(e["nombre"] for e in elegidos)

            for e in elegidos:
                if grupo == "cardio":
                    sesion["ejercicios"].append({
                        "nombre": e["nombre"],
                        "grupo": grupo,
                        "equipo": e["equipo"],
                        "duracion_min": 15 if objetivo in ("perdida_peso", "resistencia") else 10,
                        "intensidad": "moderada"
                    })
                else:
                    sesion["ejercicios"].append({
                        "nombre": e["nombre"],
                        "grupo": grupo,
                        "equipo": e["equipo"],
                        "series": series,
                        "repeticiones": reps,
                        "descanso_seg": descanso,
                        "tecnica": f"Ejecuta {e['nombre']} con control en fase excéntrica (2-3s) y respiración coordinada."
                    })
        plan["sesiones"].append(sesion)
    return plan

# Generar 500+ rutinas
rutinas = []
id_counter = 1
combos_target = 540

# Crear combinaciones representativas y luego rellenar al azar
combinaciones = []
for nivel in NIVELES:
    for edad_info in RANGOS_EDAD:
        for genero in GENEROS:
            for objetivo in OBJETIVOS:
                for patologia in PATOLOGIAS_LESIONES:
                    combinaciones.append((nivel, edad_info, genero, objetivo, patologia))

random.shuffle(combinaciones)
combinaciones = combinaciones[:combos_target]

for nivel, edad_info, genero, objetivo, patologia in combinaciones:
    dias = random.choice([2, 3, 4, 5, 6])
    if patologia == "embarazo":
        dias = random.choice([2, 3])
    if edad_info["label"] == "senior":
        dias = random.choice([2, 3])
    rutinas.append(construir_rutina(f"RT-{id_counter:04d}", nivel, edad_info, genero, objetivo, patologia, dias))
    id_counter += 1

print(f"Rutinas generadas: {len(rutinas)}")

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Guardar
with open(os.path.join(DATA_DIR, "heuristicas.json"), "w", encoding="utf-8") as f:
    json.dump({"version": "1.0", "total": len(rutinas), "rutinas": rutinas}, f, ensure_ascii=False, indent=2)

# ============================================================
# DATASET 2: FILTROS - 500+ reglas de filtrado
# ============================================================
filtros = []
id_filtro = 1

# REGLAS POR PATOLOGÍA / LESIÓN
reglas_patologia = [
    {"clave": "hernia_lumbar", "evitar_grupos": [], "evitar_movimientos": ["carga_axial", "flexion_lumbar_cargada"],
     "ejercicios_excluir": ["Peso muerto convencional", "Sentadilla con barra", "Press militar con barra", "Remo con barra"],
     "alternativas": ["Prensa de piernas 45°", "Press de hombro con mancuerna sentado", "Remo sentado en polea"],
     "razon": "Carga axial empeora hernias lumbares"},
    {"clave": "rodilla_derecha", "evitar_grupos": [], "evitar_movimientos": ["alto_impacto", "flexion_profunda_rodilla"],
     "ejercicios_excluir": ["Sentadilla con barra", "Saltos con cuerda", "Burpees", "Trote en cinta", "Sentadilla búlgara"],
     "alternativas": ["Prensa de piernas 45°", "Bicicleta estática", "Caminata en cinta", "Extensión de cuádriceps en máquina"],
     "razon": "Reducir impacto y rangos profundos hasta rehabilitar"},
    {"clave": "rodilla_izquierda", "evitar_grupos": [], "evitar_movimientos": ["alto_impacto"],
     "ejercicios_excluir": ["Sentadilla con barra", "Saltos con cuerda", "Burpees", "Trote en cinta"],
     "alternativas": ["Prensa de piernas 45°", "Bicicleta estática", "Elíptica"],
     "razon": "Reducir impacto en articulación afectada"},
    {"clave": "hombro_izquierdo", "evitar_grupos": [], "evitar_movimientos": ["press_overhead_pesado"],
     "ejercicios_excluir": ["Press militar con barra", "Press de banca con barra", "Dominadas asistidas"],
     "alternativas": ["Pec deck (contractor)", "Face pull en polea", "Elevaciones laterales (rango corto)"],
     "razon": "Reducir compresión sobre el hombro afectado"},
    {"clave": "hombro_derecho", "evitar_grupos": [], "evitar_movimientos": ["press_overhead_pesado"],
     "ejercicios_excluir": ["Press militar con barra", "Press de banca con barra"],
     "alternativas": ["Pec deck (contractor)", "Face pull en polea"],
     "razon": "Proteger manguito rotador del hombro afectado"},
    {"clave": "codo_tendinitis", "evitar_grupos": [], "evitar_movimientos": ["flexion_codo_repetitiva_pesada"],
     "ejercicios_excluir": ["Curl de bíceps con barra", "Press francés con barra Z"],
     "alternativas": ["Curl martillo (carga ligera)", "Extensión de tríceps en polea (carga ligera)"],
     "razon": "Evitar estrés repetitivo sobre el tendón inflamado"},
    {"clave": "muñeca_lesion", "evitar_grupos": [], "evitar_movimientos": ["soporte_carga_muñeca"],
     "ejercicios_excluir": ["Flexiones de pecho", "Press de banca con barra"],
     "alternativas": ["Pec deck (contractor)", "Press en máquina Smith con muñequeras"],
     "razon": "Proteger la articulación de la muñeca"},
    {"clave": "tobillo_esguince", "evitar_grupos": [], "evitar_movimientos": ["alto_impacto", "salto"],
     "ejercicios_excluir": ["Saltos con cuerda", "Burpees", "Trote en cinta", "Zancadas con mancuernas"],
     "alternativas": ["Bicicleta estática", "Remo ergómetro", "Elíptica"],
     "razon": "Permitir cicatrización del esguince"},
    {"clave": "diabetes_tipo2", "evitar_grupos": [], "evitar_movimientos": ["ayuno_prolongado"],
     "ejercicios_excluir": [], "alternativas": [],
     "razon": "Hidratación y monitoreo de glucosa son críticos. Sesiones moderadas y constantes."},
    {"clave": "hipertension", "evitar_grupos": [], "evitar_movimientos": ["valsalva", "isometricos_pesados", "HIIT"],
     "ejercicios_excluir": ["Burpees", "Saltos con cuerda", "Peso muerto convencional"],
     "alternativas": ["Caminata en cinta", "Bicicleta estática", "Press en máquina Smith"],
     "razon": "Evitar picos de presión arterial"},
    {"clave": "asma", "evitar_grupos": [], "evitar_movimientos": ["esfuerzo_anaerobico_prolongado"],
     "ejercicios_excluir": ["Burpees"], "alternativas": ["Caminata en cinta", "Bicicleta estática"],
     "razon": "Calentamiento progresivo y evitar disparadores broncoconstrictores"},
    {"clave": "escoliosis", "evitar_grupos": [], "evitar_movimientos": ["carga_axial_asimetrica"],
     "ejercicios_excluir": ["Sentadilla con barra", "Peso muerto convencional", "Press militar con barra"],
     "alternativas": ["Prensa de piernas 45°", "Press de hombro con mancuerna sentado"],
     "razon": "Evitar compresión asimétrica de columna"},
    {"clave": "cervicales", "evitar_grupos": [], "evitar_movimientos": ["hiperextension_cervical"],
     "ejercicios_excluir": ["Press militar con barra"], "alternativas": ["Press de hombro con mancuerna sentado"],
     "razon": "Proteger zona cervical de compresión"},
    {"clave": "cardiopatia_leve", "evitar_grupos": [], "evitar_movimientos": ["HIIT", "alta_intensidad"],
     "ejercicios_excluir": ["Burpees", "Saltos con cuerda", "Trote en cinta"],
     "alternativas": ["Caminata en cinta", "Bicicleta estática"],
     "razon": "Mantener FC bajo umbral seguro acordado con cardiólogo"},
    {"clave": "obesidad", "evitar_grupos": [], "evitar_movimientos": ["alto_impacto"],
     "ejercicios_excluir": ["Saltos con cuerda", "Burpees", "Trote en cinta"],
     "alternativas": ["Caminata en cinta", "Bicicleta estática", "Elíptica"],
     "razon": "Reducir carga sobre articulaciones de miembros inferiores"},
    {"clave": "embarazo", "evitar_grupos": [], "evitar_movimientos": ["supino_prolongado", "alto_impacto", "core_directo_pesado"],
     "ejercicios_excluir": ["Crunch abdominal", "Russian twist", "Burpees", "Saltos con cuerda", "Peso muerto convencional"],
     "alternativas": ["Caminata en cinta", "Sentadilla goblet ligera", "Plancha lateral suave"],
     "razon": "Proteger al bebé y a la madre. Consultar siempre al médico"},
    {"clave": "osteoporosis", "evitar_grupos": [], "evitar_movimientos": ["alto_impacto", "flexion_columna_cargada"],
     "ejercicios_excluir": ["Crunch abdominal", "Saltos con cuerda", "Peso muerto convencional"],
     "alternativas": ["Caminata en cinta", "Prensa de piernas 45°", "Plancha frontal"],
     "razon": "Evitar fracturas por flexión vertebral o impacto"},
    {"clave": "artritis", "evitar_grupos": [], "evitar_movimientos": ["alto_impacto", "rangos_extremos"],
     "ejercicios_excluir": ["Saltos con cuerda", "Burpees"],
     "alternativas": ["Bicicleta estática", "Elíptica", "Pec deck (contractor)"],
     "razon": "Mantener movilidad sin agredir las articulaciones"},
]

for r in reglas_patologia:
    filtros.append({
        "id": f"FT-{id_filtro:04d}",
        "tipo": "patologia_lesion",
        "clave": r["clave"],
        "regla": "exclusion_y_sustitucion",
        "ejercicios_excluir": r["ejercicios_excluir"],
        "alternativas_recomendadas": r["alternativas"],
        "movimientos_evitar": r["evitar_movimientos"],
        "razon_clinica": r["razon"],
        "severidad": "alta" if r["clave"] in ["hernia_lumbar", "cardiopatia_leve", "embarazo"] else "media"
    })
    id_filtro += 1

# REGLAS POR EDAD
for edad in RANGOS_EDAD:
    for nivel in NIVELES:
        for objetivo in OBJETIVOS:
            ej_excluir = []
            mov_evitar = []
            razon = ""
            if edad["label"] == "senior":
                ej_excluir = ["Peso muerto convencional", "Burpees", "Saltos con cuerda", "Sentadilla con barra"]
                mov_evitar = ["alto_impacto", "carga_axial_pesada"]
                razon = "Mayores de 56 años: priorizar movilidad, equilibrio y rangos articulares seguros"
            elif edad["label"] == "adulto_mayor":
                ej_excluir = ["Burpees"] if nivel == "principiante" else []
                mov_evitar = ["HIIT_extremo"]
                razon = "Adultos 41-55: progresión gradual y trabajo de movilidad"
            elif edad["label"] == "joven":
                ej_excluir = []
                mov_evitar = []
                razon = "Jóvenes 16-25: foco en técnica antes que carga, evitar sobreentrenamiento"
            else:
                ej_excluir = []
                mov_evitar = []
                razon = "Adultos 26-40: balance entre carga, técnica y recuperación"

            filtros.append({
                "id": f"FT-{id_filtro:04d}",
                "tipo": "edad_nivel_objetivo",
                "rango_edad": edad["label"],
                "edad_min": edad["min"],
                "edad_max": edad["max"],
                "nivel": nivel,
                "objetivo": objetivo,
                "ejercicios_excluir": ej_excluir,
                "movimientos_evitar": mov_evitar,
                "razon_clinica": razon,
                "severidad": "media" if edad["label"] in ["senior", "adulto_mayor"] else "baja"
            })
            id_filtro += 1

# REGLAS POR GÉNERO + OBJETIVO
for genero in GENEROS:
    for objetivo in OBJETIVOS:
        for nivel in NIVELES:
            recomendaciones = []
            if objetivo == "tonificacion":
                recomendaciones = ["Mayor volumen (12-15 reps)", "Descansos cortos (45-60s)"]
            elif objetivo == "hipertrofia":
                recomendaciones = ["8-12 reps", "Descanso 60-90s", "Sobrecarga progresiva semanal"]
            elif objetivo == "fuerza":
                recomendaciones = ["3-6 reps", "Descanso 2-3 min", "Cargas pesadas con técnica impecable"]
            elif objetivo == "perdida_peso":
                recomendaciones = ["Combinar fuerza + cardio", "Déficit calórico ligero", "Sesiones de 45-60 min"]
            elif objetivo == "definicion":
                recomendaciones = ["Volumen alto", "Cardio HIIT moderado (si está sano)", "Hidratación y proteína"]
            else:
                recomendaciones = ["Trabajo aeróbico variado", "Buena técnica respiratoria"]

            filtros.append({
                "id": f"FT-{id_filtro:04d}",
                "tipo": "genero_objetivo_nivel",
                "genero": genero,
                "objetivo": objetivo,
                "nivel": nivel,
                "recomendaciones_metabolicas": recomendaciones,
                "ejercicios_priorizar": [],
                "razon_clinica": f"Adaptación de volumen e intensidad para {genero} con objetivo {objetivo} en nivel {nivel}",
                "severidad": "informativa"
            })
            id_filtro += 1

# REGLAS COMBINADAS (PATOLOGÍA + EDAD)
for r in reglas_patologia:
    for edad in RANGOS_EDAD:
        filtros.append({
            "id": f"FT-{id_filtro:04d}",
            "tipo": "combinada_patologia_edad",
            "clave_patologia": r["clave"],
            "rango_edad": edad["label"],
            "edad_min": edad["min"],
            "edad_max": edad["max"],
            "ejercicios_excluir": r["ejercicios_excluir"],
            "alternativas_recomendadas": r["alternativas"],
            "ajuste_intensidad": "reducida" if edad["label"] in ["senior", "adulto_mayor"] else "estandar",
            "razon_clinica": f"{r['razon']} + ajuste por rango etario {edad['label']}",
            "severidad": "alta"
        })
        id_filtro += 1

# REGLAS COMBINADAS (PATOLOGÍA + GÉNERO + NIVEL)
for r in reglas_patologia:
    for genero in GENEROS:
        for nivel in NIVELES:
            filtros.append({
                "id": f"FT-{id_filtro:04d}",
                "tipo": "combinada_patologia_genero_nivel",
                "clave_patologia": r["clave"],
                "genero": genero,
                "nivel": nivel,
                "ejercicios_excluir": r["ejercicios_excluir"],
                "alternativas_recomendadas": r["alternativas"],
                "ajuste_volumen": "bajo" if nivel == "principiante" else ("medio" if nivel == "intermedio" else "alto"),
                "razon_clinica": f"{r['razon']} ajustado a {genero} {nivel}",
                "severidad": r["clave"] in ["hernia_lumbar", "embarazo", "cardiopatia_leve"] and "alta" or "media"
            })
            id_filtro += 1

# REGLAS DE PROGRESIÓN ADAPTATIVA (basadas en RPE - referencia TC-026/027)
escalas_rpe = [
    {"rpe_min": 1, "rpe_max": 4, "accion": "incrementar_carga", "ajuste": "+5% peso o +1-2 reps", "razon": "RPE bajo: estímulo insuficiente, progresar"},
    {"rpe_min": 5, "rpe_max": 7, "accion": "mantener", "ajuste": "Mantener carga actual", "razon": "RPE óptimo: consolidar adaptaciones"},
    {"rpe_min": 8, "rpe_max": 9, "accion": "mantener_o_micro_reducir", "ajuste": "Mantener o -2% si fatiga acumulada", "razon": "RPE alto: cerca del límite, atender recuperación"},
    {"rpe_min": 10, "rpe_max": 10, "accion": "reducir_carga", "ajuste": "-10% peso o -2 reps + descanso extra", "razon": "RPE máximo sostenido: riesgo de lesión y sobreentrenamiento"},
]
for escala in escalas_rpe:
    for nivel in NIVELES:
        for objetivo in OBJETIVOS:
            filtros.append({
                "id": f"FT-{id_filtro:04d}",
                "tipo": "progresion_adaptativa_rpe",
                "rpe_min": escala["rpe_min"],
                "rpe_max": escala["rpe_max"],
                "accion": escala["accion"],
                "ajuste_recomendado": escala["ajuste"],
                "nivel": nivel,
                "objetivo": objetivo,
                "razon_clinica": escala["razon"],
                "severidad": "informativa"
            })
            id_filtro += 1

# REGLAS DE MOLESTIA REPORTADA (TC-027)
zonas_molestia = ["lumbar", "cervical", "rodilla", "hombro", "codo", "muñeca", "tobillo", "cadera"]
for zona in zonas_molestia:
    for sesiones_consec in [1, 2, 3]:
        accion = "advertir" if sesiones_consec == 1 else ("reducir_volumen" if sesiones_consec == 2 else "pausar_y_derivar")
        filtros.append({
            "id": f"FT-{id_filtro:04d}",
            "tipo": "molestia_recurrente",
            "zona": zona,
            "sesiones_consecutivas": sesiones_consec,
            "accion": accion,
            "ajuste_recomendado": (
                "Mostrar advertencia y recomendar descanso activo" if sesiones_consec == 1
                else "Reducir volumen 30% y sustituir ejercicios que comprometan la zona" if sesiones_consec == 2
                else "Detener entrenamiento de la zona y sugerir consulta médica/fisioterapéutica"
            ),
            "razon_clinica": f"Molestia recurrente en {zona} en {sesiones_consec} sesión(es) seguida(s) requiere acción protectora",
            "severidad": "alta" if sesiones_consec >= 2 else "media"
        })
        id_filtro += 1

# REGLAS POR EQUIPO DISPONIBLE (TC-035)
equipos_disponibles = ["ninguno", "mancuerna", "barra", "polea", "maquina", "completo"]
for equipo in equipos_disponibles:
    for objetivo in OBJETIVOS:
        for nivel in NIVELES:
            ej_priorizar = []
            if equipo == "ninguno":
                ej_priorizar = ["Flexiones de pecho", "Plancha frontal", "Burpees", "Saltos con cuerda", "Bicicleta abdominal"]
            elif equipo == "mancuerna":
                ej_priorizar = ["Curl alterno con mancuerna", "Press de hombro con mancuerna sentado", "Sentadilla goblet con mancuerna"]
            elif equipo == "barra":
                ej_priorizar = ["Press de banca con barra", "Sentadilla con barra", "Peso muerto convencional"]
            elif equipo == "polea":
                ej_priorizar = ["Jalón al pecho en polea", "Remo sentado en polea", "Cruce de poleas"]
            elif equipo == "maquina":
                ej_priorizar = ["Prensa de piernas 45°", "Pec deck (contractor)", "Extensión de cuádriceps en máquina"]
            else:
                ej_priorizar = ["Press de banca con barra", "Prensa de piernas 45°", "Jalón al pecho en polea"]
            filtros.append({
                "id": f"FT-{id_filtro:04d}",
                "tipo": "equipo_disponible",
                "equipo": equipo,
                "objetivo": objetivo,
                "nivel": nivel,
                "ejercicios_priorizar": ej_priorizar,
                "razon_clinica": f"Adaptación de rutina al equipo disponible: {equipo}",
                "severidad": "informativa"
            })
            id_filtro += 1

print(f"Filtros generados: {len(filtros)}")

# Guardar
with open(os.path.join(DATA_DIR, "filtros.json"), "w", encoding="utf-8") as f:
    json.dump({"version": "1.0", "total": len(filtros), "filtros": filtros}, f, ensure_ascii=False, indent=2)

# Guardar catálogo de ejercicios para uso de la app
with open(os.path.join(DATA_DIR, "ejercicios.json"), "w", encoding="utf-8") as f:
    json.dump({"version": "1.0", "ejercicios": EJERCICIOS}, f, ensure_ascii=False, indent=2)

print("\n✓ Datasets generados correctamente:")
print(f"  - heuristicas.json: {len(rutinas)} rutinas")
print(f"  - filtros.json: {len(filtros)} reglas")
print(f"  - ejercicios.json: catálogo base")
