# StrongVision — Plataforma Fitness con IA Personalizada

> Aplicación web fitness que combina **inteligencia artificial heurística** con **filtros clínicos** para generar rutinas de entrenamiento personalizadas, seguras y adaptativas.

**Equipo:** Jhoan Sebastián Ordoñez ·
**Versión:** 1.0.0
**Stack:** HTML5 + CSS3 + JavaScript Vanilla (sin backend)
**Cumplimiento:** ISO 25010 · ISO 9001 · CMMI · WCAG AA

---

## 📋 Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Cómo correr el proyecto](#cómo-correr-el-proyecto)
3. [Arquitectura del proyecto](#arquitectura-del-proyecto)
4. [Motor de IA y heurísticas](#motor-de-ia-y-heurísticas)
5. [Datasets](#datasets)
6. [Páginas y módulos](#páginas-y-módulos)
7. [Cobertura de casos de prueba](#cobertura-de-casos-de-prueba)
8. [Cumplimiento normativo](#cumplimiento-normativo)
9. [Capturas y flujos](#capturas-y-flujos)
10. [Mantenimiento y extensión](#mantenimiento-y-extensión)

---

## 1. Descripción general

StrongVision es una aplicación web fitness que automatiza el diseño de rutinas de entrenamiento adaptadas al perfil físico, condiciones médicas y objetivos del usuario. A diferencia de aplicaciones genéricas, StrongVision combina **3 algoritmos de IA**:

1. **Heurística voraz** — Selecciona la mejor rutina base entre 540 plantillas predefinidas
2. **Script de filtro** — Aplica 582 reglas de seguridad clínica para excluir ejercicios contraindicados
3. **Heurística evolutiva** — Adapta la rutina sesión a sesión según RPE y molestias reportadas

Toda la lógica corre en el navegador (sin backend) y los datos se almacenan en `localStorage`, garantizando privacidad y operación offline.

---

## 2. Cómo correr el proyecto

### Opción A: Live Server en VS Code (recomendado)

1. Abrir el proyecto en **Visual Studio Code**
2. Instalar la extensión **Live Server** (Ritwick Dey)
3. Click derecho sobre `index.html` → **Open with Live Server**
4. La app abrirá en `http://127.0.0.1:5500/index.html`

### Opción B: Python HTTP Server

```bash
cd strongvision/
python3 -m http.server 8000
# abrir http://localhost:8000
```

### Opción C: Node.js http-server

```bash
npx http-server -p 8000
# abrir http://localhost:8000
```

> **Importante:** No abras el `index.html` directamente con doble click (`file://`). El motor de IA usa `fetch()` para cargar los datasets JSON, lo cual requiere un servidor HTTP local.

### Cuenta de prueba (admin)

Para acceder al panel administrativo:
- Registra una cuenta con el correo `admin@strongvision.com`
- Cualquier nombre, ciudad, dirección y password válido (ver requisitos abajo)
- Una vez dentro, navega a `/pages/admin.html`

### Requisitos de password

Mínimo **8 caracteres** con al menos una **mayúscula**, un **número** y un **símbolo**.

Ejemplos válidos: `Strong123!`, `MiPass2024@`, `Fitness99#`

---

## 3. Arquitectura del proyecto

```
strongvision/
├── index.html                  # Landing pública
├── sw.js                       # Service Worker (offline)
├── generate_data.py            # Generador de datasets
│
├── css/
│   ├── styles.css              # Variables CSS, base, landing
│   ├── auth.css                # Modales y formularios
│   └── dashboard.css           # App interna, chat, training
│
├── js/
│   ├── storage.js              # Capa de persistencia (localStorage)
│   ├── auth.js                 # Registro/login/recuperación
│   ├── main.js                 # Landing JS y utilidades globales
│   ├── ia-engine.js            # Motor IA: voraz + filtro + evolutiva
│   ├── dashboard.js            # Dashboard principal del usuario
│   ├── perfil.js               # Perfil físico y validaciones
│   ├── rutina.js               # Visualización y edición de rutinas
│   ├── entrenamiento.js        # Modo guiado paso a paso
│   ├── progreso.js             # Gráficas e historial
│   ├── biblioteca.js           # Catálogo de ejercicios
│   ├── ajustes.js              # Cuenta y preferencias
│   └── admin.js                # Panel administrativo
│
├── pages/
│   ├── dashboard.html
│   ├── perfil.html
│   ├── rutina.html
│   ├── entrenamiento.html
│   ├── progreso.html
│   ├── biblioteca.html
│   ├── ajustes.html
│   └── admin.html
│
└── data/
    ├── heuristicas.json        # 540 rutinas base
    ├── filtros.json            # 582 reglas clínicas
    └── ejercicios.json         # Catálogo de ejercicios
```

### Patrón arquitectónico

- **Vanilla JS** sin frameworks: máxima compatibilidad y mantenibilidad
- **IIFE modulares** (`(function(){'use strict'; ...})()`) para encapsular cada módulo
- **Event-driven**: eventos del DOM en lugar de framework reactivo
- **Capa de persistencia única** (`SV_STORAGE`) que abstrae localStorage
- **Motor de IA centralizado** (`SV_IA`) reutilizable por todas las páginas

---

## 4. Motor de IA y heurísticas

### Pipeline de generación de rutina

Cuando un usuario solicita generar una rutina, el motor ejecuta:

```
Perfil del usuario
        ↓
[Script 1] Heurística VORAZ
   → Scorea 540 rutinas base por compatibilidad
   → Selecciona top-3 con leve aleatoriedad
        ↓
[Script 2] FILTRO clínico
   → Aplica reglas de patología/lesión
   → Sustituye ejercicios excluidos por alternativas seguras
   → Agrega advertencias clínicas
        ↓
[Script 3] Heurística EVOLUTIVA (si hay historial)
   → Si RPE promedio < 5: aumenta volumen (+1 serie)
   → Si RPE promedio ≥ 9: aumenta descanso (+30s)
   → Si molestias recurrentes: reduce volumen en zona afectada
        ↓
Rutina personalizada y segura
```

### Algoritmo voraz (detalle)

```javascript
function heuristicaVoraz(perfil) {
    const candidatas = datasetRutinas.map(r => {
        let score = 0;
        if (r.patologia_lesion === perfil.patologia) score += 100;  // SEGURIDAD
        if (r.nivel === perfil.nivel) score += 40;
        if (r.objetivo === perfil.objetivo) score += 30;
        if (r.rango_edad === edadRango) score += 25;
        if (r.genero === perfil.genero) score += 15;
        score -= Math.abs(r.dias - perfil.dias) * 5;
        return { rutina: r, score };
    });
    candidatas.sort((a, b) => b.score - a.score);
    return aleatorio(candidatas.slice(0, 3));  // Top-3 con variedad
}
```

### Sistema de filtro clínico (582 reglas)

El sistema reconoce **19 patologías y lesiones**:

```
ninguna · hernia_lumbar · rodilla_derecha · rodilla_izquierda
hombro_izquierdo · hombro_derecho · codo_tendinitis · muñeca_lesion
tobillo_esguince · diabetes_tipo2 · hipertension · asma · escoliosis
cervicales · cardiopatia_leve · obesidad · embarazo · osteoporosis · artritis
```

**Tipos de reglas:**
- `patologia_lesion` — Excluye ejercicios riesgosos por condición
- `edad_nivel_objetivo` — Adapta carga según etapa de vida
- `genero_objetivo_nivel` — Ajustes específicos por género
- `combinada_patologia_edad` — Combinaciones críticas
- `combinada_patologia_genero_nivel` — Reglas multi-criterio
- `progresion_adaptativa_rpe` — Adaptaciones por esfuerzo percibido
- `molestia_recurrente` — Acciones automáticas ante dolor
- `equipo_disponible` — Sustitución por disponibilidad de material

**Ejemplo de regla (hernia lumbar):**

```json
{
  "tipo": "patologia_lesion",
  "clave": "hernia_lumbar",
  "ejercicios_excluir": ["sentadilla con barra", "peso muerto", "press militar de pie"],
  "alternativas_recomendadas": ["sentadilla goblet", "peso muerto rumano con mancuernas"],
  "razon_clinica": "Carga axial directa sobre columna está contraindicada",
  "supervision_requerida": true
}
```

### Heurística evolutiva (RPE-based)

Implementa progresión inteligente sin sobreentrenar:

```javascript
function heuristicaEvolutiva(rutina, historial) {
    const rpePromedio = calcularRPEPromedio(historial.ultimasSesiones);

    if (rpePromedio < 5) {
        // Demasiado fácil → progresar
        rutina.sesiones.forEach(s => s.ejercicios.forEach(e => e.series++));
    }
    if (rpePromedio >= 9) {
        // Excesivo → recuperar
        rutina.sesiones.forEach(s => s.ejercicios.forEach(e => e.descanso_seg += 30));
    }

    // Análisis de molestias por zona
    const molestiasRepetidas = analizarMolestias(historial.molestias);
    aplicarReduccionPorZona(rutina, molestiasRepetidas);
}
```

---

## 5. Datasets

### `data/heuristicas.json` (540 rutinas)

Generado por combinatoria de:
- 3 niveles × 4 rangos de edad × 3 géneros × 6 objetivos × 19 patologías
- Filtrado a combinaciones realistas → **540 rutinas resultantes**

Cada rutina contiene: id, nivel, rango_edad, genero, objetivo, patologia_lesion, dias_por_semana, calentamiento[], sesiones[].ejercicios[], estiramiento_final[], advertencias[].

### `data/filtros.json` (582 reglas)

Reglas de seguridad clínica organizadas por tipo (ver sección anterior).

### `data/ejercicios.json` (catálogo)

Ejercicios agrupados por grupo muscular: pecho, espalda, piernas, hombro, brazo, core, cardio. Cada uno con propiedades: nombre, equipo, impacto (bajo/medio/alto), carga_axial (bool), articulaciones[].

### Regenerar datasets

Si necesitas modificar los criterios, edita `generate_data.py` y ejecuta:

```bash
cd strongvision/
python3 generate_data.py
# Output: Rutinas generadas: 540, Filtros generados: 582
```

---

## 6. Páginas y módulos

### Públicas
- `index.html` — Landing con hero, features, CTA. Modales de registro/login/recuperación.

### Autenticadas (requieren sesión)

| Página | Funcionalidad principal |
|--------|------------------------|
| `dashboard.html` | Stats rápidas, gamificación, chat IA, insights personalizados |
| `perfil.html` | Datos personales, salud, lesiones, objetivos |
| `rutina.html` | Visualización de rutina, regeneración, reemplazo de ejercicios |
| `entrenamiento.html` | Modo guiado: calentamiento → ejercicios → descansos → resumen |
| `progreso.html` | Gráficas semanales, historial filtrable, exportar PDF |
| `biblioteca.html` | Catálogo buscable con técnica detallada |
| `ajustes.html` | Cuenta, notificaciones, privacidad, eliminar cuenta |

### Administrativas
- `admin.html` — Dashboard, CRUD ejercicios, plantillas, usuarios, reportes

---

## 7. Cobertura de casos de prueba

**Total: 50/50 casos implementados (100%)**

### RFU - Requisitos Funcionales de Usuario

| Requisito | Casos | Implementación |
|-----------|-------|----------------|
| **RFU-1: Registro** | TC-001 a TC-006 | `js/auth.js` + `index.html` |
| **RFU-2: Login** | TC-007 a TC-009 | `js/auth.js` |
| **RFU-3: Perfil físico** | TC-010 a TC-013 | `js/perfil.js` |
| **RFU-4: Generar rutina IA** | TC-014 a TC-019 | `js/ia-engine.js` + `js/rutina.js` |
| **RFU-5: Modo entrenamiento** | TC-020 a TC-025 | `js/entrenamiento.js` |
| **RFU-6: Seguimiento** | TC-024 | `js/progreso.js` |
| **RFU-7: Adaptación auto** | TC-026 a TC-028 | `heuristicaEvolutiva()` |
| **RFU-8: Historial** | TC-029 a TC-031 | `js/progreso.js` |
| **RFU-9: Notificaciones** | TC-032 a TC-033 | `js/ajustes.js` |
| **RFU-10: Biblioteca** | TC-034 a TC-036 | `js/biblioteca.js` |
| **RFU-11: Offline** | TC-037 a TC-038 | `sw.js` + localStorage |
| **RFU-12: Privacidad** | TC-039 a TC-041 | `js/ajustes.js` |

### RFA - Requisitos Funcionales de Administrador

| Requisito | Casos | Implementación |
|-----------|-------|----------------|
| **RFA-1: CRUD ejercicios** | TC-042 a TC-043 | `js/admin.js` |
| **RFA-2: Plantillas** | TC-044 | `js/admin.js` |
| **RFA-3: Gestión usuarios** | TC-045 a TC-050 | `js/admin.js` |

### Detalle por caso (muestra)

- **TC-014:** Generar rutina con perfil completo → `SV_IA.generarRutina()` ejecuta voraz + filtro + evolutiva en <2s
- **TC-015:** Hernia lumbar excluye carga axial → Filtro elimina sentadilla con barra, peso muerto; sustituye por sentadilla goblet
- **TC-017:** Múltiples afecciones (hernia + rodilla) → Acumula reglas y prioriza la más restrictiva
- **TC-021:** Registro de serie con peso/reps → Persistido en `localStorage` vía `SV_STORAGE.registrarSesion()`
- **TC-023:** Resumen final con XP/calorías/tiempo → `calcularXP()` y `estimarCalorias()`
- **TC-031:** Exportar PDF → `window.print()` con plantilla HTML imprimible
- **TC-041:** Eliminar cuenta → Confirmación con texto "ELIMINAR" + `SV_STORAGE.eliminarUsuario()`

---

## 8. Cumplimiento normativo

### ISO/IEC 25010 — Calidad del software

| Característica | Implementación |
|---------------|----------------|
| **Adecuación funcional** | 50 casos de prueba cubiertos al 100% |
| **Eficiencia de desempeño** | Sin backend; fetch JSON local; carga <2s |
| **Compatibilidad** | Funciona en Chrome, Firefox, Edge, Safari (responsive) |
| **Usabilidad** | Onboarding guiado, feedback inmediato, accesibilidad WCAG AA |
| **Fiabilidad** | Validación exhaustiva, manejo de errores, persistencia local |
| **Seguridad** | Hash de contraseñas, validaciones, XSS protection (escapeHtml) |
| **Mantenibilidad** | Código modular, comentado, separación de responsabilidades |
| **Portabilidad** | Sin dependencias externas; corre en cualquier servidor estático |

### ISO 9001 — Gestión de calidad

- ✅ Documentación completa del proceso (este README)
- ✅ Casos de prueba documentados (`CasosPrueba_StrongVision.docx`)
- ✅ Versionado semántico (1.0.0)
- ✅ Trazabilidad: cada caso de prueba mapea a un módulo/función
- ✅ Mejora continua: heurística evolutiva ajusta el sistema con cada uso

### CMMI — Modelo de madurez (Nivel 2-3)

- ✅ **Gestión de requisitos** — Documento de RFU/RFA con casos numerados
- ✅ **Planificación** — Estructura modular planeada
- ✅ **Aseguramiento de calidad** — 50 casos de prueba ejecutables
- ✅ **Gestión de configuración** — Versiones controladas, datasets versionados
- ✅ **Definición de procesos** — Pipeline de IA documentado paso a paso

### Accesibilidad (WCAG 2.1 AA)

- ✅ Contraste mínimo 4.5:1 en texto principal
- ✅ Navegación por teclado completa (focus-visible)
- ✅ Atributos `aria-*` (labels, roles, expanded, hidden)
- ✅ Soporte `prefers-reduced-motion`
- ✅ Texto escalable (rem)
- ✅ Estructura semántica HTML5 (nav, main, article, section)

---

## 9. Capturas y flujos

### Flujo de usuario nuevo

```
Landing → Registro → Verificar email (mock) → Perfil físico
   → Generar rutina IA → Dashboard → Iniciar entrenamiento
   → Calentamiento → Ejercicios guiados → Resumen + RPE
   → Progreso (gráfica) → Próxima sesión
```

### Flujo de adaptación

```
Sesión 1 (RPE 7) → Sesión 2 (RPE 6) → ... Sesión 5 (RPE 4)
   → Sistema detecta RPE bajo → Sugiere regenerar rutina
   → Heurística evolutiva +1 serie en cada ejercicio
   → Nueva rutina más exigente
```

### Flujo de seguridad

```
Usuario reporta hernia lumbar en perfil
   → Heurística voraz selecciona rutina compatible
   → Filtro excluye sentadilla con barra y peso muerto
   → Sustituye con sentadilla goblet y peso muerto rumano
   → Genera advertencia clínica visible
   → Recomienda supervisión profesional
```

---

## 10. Mantenimiento y extensión

### Agregar una nueva patología

1. **Editar `generate_data.py`** → agregar a la lista `PATOLOGIAS`
2. **Definir reglas** → en función `_filtros_patologias()`
3. **Regenerar datasets** → `python3 generate_data.py`
4. **Actualizar formularios** → `pages/perfil.html` (select de patología)
5. **Actualizar `SV_IA.normalizarPatologia()`** en `ia-engine.js`

### Agregar un nuevo grupo muscular

1. **Editar `data/ejercicios.json`** → agregar grupo y ejercicios
2. **Actualizar selectores** → `biblioteca.html`, `progreso.html`, `admin.html`
3. **Actualizar gráficos** → `iconoGrupo()` en `biblioteca.js`

### Modificar el algoritmo de scoring

Editar `heuristicaVoraz()` en `js/ia-engine.js`. Los pesos actuales son:
- Patología: 100 (seguridad máxima)
- Nivel: 40
- Objetivo: 30
- Edad: 25
- Género: 15
- Días/semana: -5 por diferencia

### Conectar a backend real

1. Reemplazar `SV_STORAGE` por llamadas `fetch()` a API REST
2. Mover `data/*.json` a base de datos (PostgreSQL recomendado)
3. Implementar autenticación JWT en lugar del hash demo
4. Agregar HTTPS y rate limiting

---

## Contacto del equipo

- **Jhoan Sebastián Ordoñez** — Desarrollo backend / Motor IA
- **Yeison** — Frontend / UX
- **Verónica** — Datasets / Validación clínica

---

## Licencia

Proyecto académico — uso educativo. Los datasets de heurísticas y filtros son simulaciones basadas en literatura general de entrenamiento; **no sustituyen consulta médica profesional**.

---

*Última actualización: Abril 2026 · StrongVision v1.0.0*
