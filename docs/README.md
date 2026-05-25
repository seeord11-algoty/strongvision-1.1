# StrongVision — Plataforma Fitness con IA Personalizada

> Aplicación web fitness que combina **inteligencia artificial heurística**, **algoritmo genético** y **filtros clínicos** para generar rutinas de entrenamiento personalizadas, seguras y adaptativas.

**Equipo:** ArquiAlgorit
**Versión:** 1.1.0
**Stack:** HTML5 + CSS3 + JavaScript Vanilla (sin backend)
**Cumplimiento:** ISO 25010 · ISO 9001 · CMMI · WCAG AAA

---

## 📋 Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Cómo correr el proyecto](#cómo-correr-el-proyecto)
3. [Arquitectura del proyecto](#arquitectura-del-proyecto)
4. [Motor de IA y heurísticas](#motor-de-ia-y-heurísticas)
5. [Datasets](#datasets)
6. [Páginas y módulos](#páginas-y-módulos)
7. [Sistema de gamificación](#sistema-de-gamificación)
8. [Asistente IA y Chat](#asistente-ia-y-chat)
9. [Internacionalización (i18n)](#internacionalización-i18n)
10. [Integraciones externas](#integraciones-externas)
11. [Cobertura de casos de prueba](#cobertura-de-casos-de-prueba)
12. [Cumplimiento normativo](#cumplimiento-normativo)
13. [Capturas y flujos](#capturas-y-flujos)
14. [Mantenimiento y extensión](#mantenimiento-y-extensión)

---

## 1. Descripción general

StrongVision es una aplicación web fitness que automatiza el diseño de rutinas de entrenamiento adaptadas al perfil físico, condiciones médicas y objetivos del usuario. A diferencia de aplicaciones genéricas, StrongVision combina **4 algoritmos de IA**:

1. **Heurística voraz** — Selecciona la mejor rutina base entre 540 plantillas predefinidas
2. **Script de filtro** — Aplica 582 reglas de seguridad clínica para excluir ejercicios contraindicados
3. **Algoritmo genético** — 20 individuos × 30 generaciones optimizan 600 combinaciones de ejercicios
4. **Heurística evolutiva** — Adapta la rutina sesión a sesión según RPE y molestias reportadas

Adicionalmente incluye un **sistema de gamificación** (XP, niveles, rachas, logros), un **asistente IA flotante** con integración a N8N, soporte bilingüe (es/en) y modo PWA offline.

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
- Registra una cuenta con el correo `admin@strongvision.app`
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
├── manifest.json               # PWA — nombre, iconos, tema
├── sw.js                       # Service Worker (offline, caché 40+ recursos)
├── generate_data.py            # Generador de datasets
│
├── css/
│   ├── styles.css              # Variables CSS, base, landing
│   ├── auth.css                # Modales y formularios de autenticación
│   ├── dashboard.css           # App interna, chat, training, sidebar
│   └── gym-bg.css              # Fondo slideshow y glassmorphism
│
├── js/
│   ├── storage.js              # Capa de persistencia (localStorage)
│   ├── auth.js                 # Registro/login/recuperación
│   ├── main.js                 # Landing JS y utilidades globales
│   ├── ia-engine.js            # Motor IA: voraz + filtro + genético + evolutiva
│   ├── dashboard.js            # Dashboard principal del usuario
│   ├── perfil.js               # Perfil físico y validaciones
│   ├── rutina.js               # Visualización y edición de rutinas
│   ├── entrenamiento.js        # Modo guiado paso a paso
│   ├── progreso.js             # Gráficas e historial
│   ├── biblioteca.js           # Catálogo de ejercicios
│   ├── ajustes.js              # Cuenta y preferencias
│   ├── admin.js                # Panel administrativo
│   ├── chat-widget.js          # Asistente IA flotante (FAB + panel)
│   ├── user-ai-sidebar.js      # Widget IA en barra lateral con racha
│   ├── notificaciones.js       # Notificaciones push y logros
│   ├── nav-admin.js            # Guard de navegación y perfil completo
│   ├── gym-bg.js               # Slideshow de imágenes de fondo (30+)
│   └── i18n.js                 # Sistema de internacionalización (es/en)
│
├── pages/
│   ├── dashboard.html          # Hub principal post-login
│   ├── perfil.html             # Wizard de perfil físico
│   ├── rutina.html             # Visualización y regeneración de rutina
│   ├── entrenamiento.html      # Modo entrenamiento guiado
│   ├── progreso.html           # Gráficas e historial de sesiones
│   ├── biblioteca.html         # Catálogo de ejercicios con filtros
│   ├── logros.html             # Vitrina de logros y badges desbloqueados
│   ├── mi-cuenta.html          # Cuenta, preferencias y gestión de datos
│   └── admin.html              # Panel administrativo (rol admin)
│
└── data/
    ├── heuristicas.json        # 540 rutinas base (~3.8 MB)
    ├── filtros.json            # 582 reglas clínicas (~286 KB)
    └── ejercicios.json         # Catálogo de ejercicios por grupo muscular
```

### Patrón arquitectónico

- **Vanilla JS** sin frameworks: máxima compatibilidad y mantenibilidad
- **IIFE modulares** (`(function(){'use strict'; ...})()`) con namespaces en `window`
- **Event-driven**: eventos del DOM en lugar de framework reactivo
- **Capa de persistencia única** (`SV_STORAGE`) que abstrae localStorage con prefijos de aislamiento por dominio (usuarios, sesiones, rutinas, gamificación, chat, pagos)
- **Motor de IA centralizado** (`SV_IA`) reutilizable por todas las páginas
- **Guard de navegación** (`nav-admin.js`) bloquea acceso a páginas hasta que el perfil esté completo

### Variables CSS principales

Las variables están definidas en `styles.css` y `dashboard.css` bajo selectores `:root` y `[data-theme="light"]`:

| Variable | Valor (dark) | Descripción |
|----------|-------------|-------------|
| `--bg` | `#0B0F14` | Color de fondo principal |
| `--surface` | `rgba(255,255,255,0.05)` | Superficies/tarjetas |
| `--y` | `#FFD60A` | Amarillo primario de marca |
| `--sidebar-w` | `245px` | Ancho de barra lateral |
| `--navbar-height` | `60px` | Alto de topbar |
| `--sp-xs…3xl` | `0.25rem…3rem` | Escala de espaciado |
| `--radius-sm…full` | `6px…9999px` | Escala de bordes redondeados |
| `--fs-sm…4xl` | `0.875rem…3rem` | Escala tipográfica |

---

## 4. Motor de IA y heurísticas

### Pipeline de generación de rutina (4 etapas)

Cuando un usuario solicita generar una rutina, el motor ejecuta:

```
Perfil del usuario
        ↓
[Etapa 1] Heurística VORAZ
   → Scorea 540 rutinas base por compatibilidad
   → Selecciona top-3 con leve aleatoriedad
        ↓
[Etapa 2] FILTRO clínico
   → Aplica reglas de patología/lesión
   → Sustituye ejercicios excluidos por alternativas seguras
   → Agrega advertencias clínicas
        ↓
[Etapa 3] Algoritmo GENÉTICO (20 individuos × 30 generaciones)
   → Evalúa 600 combinaciones de distribución semanal
   → Optimiza: balance muscular, seguridad, progresión, distribución
        ↓
[Etapa 4] Heurística EVOLUTIVA (si hay historial)
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

### Algoritmo genético (detalle)

```javascript
// 20 individuos, 30 generaciones → evalúa 600 combinaciones
function algoritmoGenetico(rutinaCandidatas, perfil) {
    let poblacion = inicializarPoblacion(20, rutinaCandidatas);
    for (let gen = 0; gen < 30; gen++) {
        poblacion = poblacion.map(ind => evaluar(ind, perfil));
        poblacion.sort((a, b) => b.fitness - a.fitness);
        poblacion = seleccionYCruce(poblacion.slice(0, 10));
        poblacion = mutar(poblacion, tasaMutacion);
    }
    return poblacion[0]; // Mejor individuo
}
// Función de fitness evalúa:
//   balance muscular (grupos cubiertos), seguridad clínica,
//   progresión de carga, distribución semanal óptima
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

**Restricciones de movimiento evaluadas:** `carga_axial`, `flexion_lumbar_cargada`

**Ejemplo de regla (hernia lumbar):**

```json
{
  "tipo": "patologia_lesion",
  "clave": "hernia_lumbar",
  "ejercicios_excluir": ["sentadilla con barra", "peso muerto", "press militar de pie"],
  "alternativas_recomendadas": ["sentadilla goblet", "peso muerto rumano con mancuernas"],
  "razon_clinica": "Carga axial directa sobre columna está contraindicada",
  "severidad": "alta",
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

### `data/heuristicas.json` (540 rutinas, ~3.8 MB)

Generado por combinatoria de:
- 3 niveles × 4 rangos de edad × 3 géneros × 6 objetivos × 19 patologías
- Filtrado a combinaciones realistas → **540 rutinas resultantes**

Cada rutina contiene: `id`, `nivel`, `rango_edad`, `edad_min`, `edad_max`, `genero`, `objetivo`, `patologia_lesion`, `dias_por_semana`, `calentamiento[]`, `sesiones[].ejercicios[]`, `estiramiento_final[]`, `advertencias[]`.

Cada ejercicio dentro de sesión: `nombre`, `grupo`, `equipo`, `series`, `repeticiones`, `descanso_seg`, `tecnica`.

### `data/filtros.json` (582 reglas, ~286 KB)

Reglas de seguridad clínica organizadas por tipo. Campos por regla: `id`, `tipo`, `clave`, `regla`, `ejercicios_excluir[]`, `alternativas_recomendadas[]`, `movimientos_evitar[]`, `razon_clinica`, `severidad`.

### `data/ejercicios.json` (catálogo)

Ejercicios agrupados por grupo muscular: `pecho`, `espalda`, `pierna`, `hombro`, `brazo`, `core`, `cardio`. Cada ejercicio: `nombre`, `equipo` (barra/mancuerna/polea/maquina/ninguno), `impacto` (bajo/medio/alto), `carga_axial` (bool), `articulaciones[]`.

### Regenerar datasets

Si necesitas modificar los criterios, edita `generate_data.py` y ejecuta:

```bash
cd strongvision/
python3 generate_data.py
# Output: Rutinas generadas: 540, Filtros generados: 582
```

---

## 6. Páginas y módulos

### Pública

- `index.html` — Landing con hero, features, CTA, estadísticas (540+ rutinas, 582+ reglas, AG 20×30, 19 patologías). Modales de registro/login/recuperación con autocompletado de ciudad/dirección vía OpenStreetMap. Banner de consentimiento de privacidad.

### Autenticadas (requieren sesión)

| Página | Archivo JS principal | Funcionalidad principal |
|--------|---------------------|------------------------|
| Dashboard | `dashboard.js` | Stats, gamificación (XP/nivel/racha), previsualización de rutina, sugerencias IA, banner motivacional |
| Perfil físico | `perfil.js` | Wizard: edad, género, peso, altura, nivel, objetivo, días/semana, patologías; bloquea el resto de la app hasta completarse |
| Mi Rutina | `rutina.js` | Visualización de rutina generada (calentamiento → sesiones → estiramiento), reemplazo de ejercicios, regeneración |
| Entrenamiento | `entrenamiento.js` | Máquina de 5 estados: selección de día → previa → ejercicio activo → descanso cronometrado → resumen con RPE y reporte de molestias |
| Progreso | `progreso.js` | KPIs (sesiones, tiempo, calorías, RPE promedio), gráfica semanal 8 semanas, distribución muscular, historial filtrable, exportar PDF |
| Biblioteca | `biblioteca.js` | Catálogo buscable por nombre, grupo muscular y equipo; modal de detalle con técnica e información clínica |
| Logros | `(inline)` | Vitrina de 8 badges desbloqueables: primer paso, rachas (3/7/30 días), sesiones (10/50), niveles (5/10) |
| Mi Cuenta | `ajustes.js` | Editar nombre/ciudad/dirección, cambiar contraseña, preferencias (recordatorios, notificaciones, unidades, idioma, animaciones), exportar datos JSON, eliminar cuenta |

### Administrativas

- `admin.html` — Requiere `usuario.rol === 'admin'`. Tabs: CRUD de ejercicios personalizados, gestión de usuarios (listar, ver, enviar correo), reportes de engagement, sistema de correo con 9 plantillas preconfiguradas, integración N8N.

### Módulos JS auxiliares (cargados en múltiples páginas)

| Módulo | Función |
|--------|---------|
| `gym-bg.js` | Slideshow con 30+ imágenes de gym (Unsplash), efecto Ken Burns, aleatorización Fisher-Yates |
| `i18n.js` | Traducciones es/en con función `L(es, en)`, persistencia en `localStorage` (sv_lang) |
| `chat-widget.js` | Asistente IA flotante (FAB + panel expandible), historial de mensajes, chips contextuales, webhook N8N |
| `user-ai-sidebar.js` | Widget de racha + chips de acción rápida inyectado en la barra lateral; modal expandible con respuesta IA |
| `notificaciones.js` | Alertas de entrenamiento perdido, recordatorios por día de semana, notificación de logros desbloqueados |
| `nav-admin.js` | Guard de navegación: redirige a `perfil.html` si el perfil está incompleto; muestra enlace admin si corresponde |
| `storage.js` | `window.SV_STORAGE` — CRUD de usuarios, sesiones, rutinas, gamificación, chat, pagos; usuario admin por defecto |
| `auth.js` | `window.SV_AUTH` — validadores RFC, hash de contraseñas, flujo de recuperación en 3 pasos (email → código → reset) |
| `ia-engine.js` | `window.SV_IA` — pipeline completo de 4 etapas, normalización de patologías, adaptación de splits 1-7 días |

---

## 7. Sistema de gamificación

StrongVision incluye un sistema de gamificación completo diseñado para mantener la adherencia al entrenamiento.

### XP y Niveles

- Cada sesión completada otorga **XP** según duración, intensidad (RPE) y ejercicios completados
- El XP acumula y sube de **nivel** (escala progresiva)
- Nivel visible en el dashboard y en la barra lateral (`user-ai-sidebar.js`)

### Rachas (Streaks)

- Días consecutivos de entrenamiento sin exceder la brecha configurable
- Racha activa: mostrada con animación de fuego 🔥 en la barra lateral
- El módulo `notificaciones.js` alerta si se está en riesgo de perder la racha

### Logros (Achievements)

8 badges desbloqueables, visibles en `logros.html`:

| ID | Badge | Condición |
|----|-------|-----------|
| `primer_paso` | 👣 Primer Paso | Completar la primera sesión |
| `racha_3` | 🔥 En Llamas | Racha de 3 días |
| `racha_7` | ⚡ Imparable | Racha de 7 días |
| `racha_30` | 🏅 Leyenda | Racha de 30 días |
| `sesiones_10` | 💪 Consistente | 10 sesiones totales |
| `sesiones_50` | 🚀 Atleta | 50 sesiones totales |
| `nivel_5` | ⭐ Intermedio | Alcanzar nivel 5 |
| `nivel_10` | 🏆 Elite | Alcanzar nivel 10 |

Los logros recién desbloqueados disparan una notificación toast dentro de la app.

---

## 8. Asistente IA y Chat

### Chat flotante (`chat-widget.js`)

Disponible en todas las páginas autenticadas como un botón de acción flotante (FAB) en la esquina inferior derecha:

- Panel expandible con área de mensajes y campo de texto
- Chips de sugerencias contextuales según el perfil del usuario
- Historial de conversación persistido en `localStorage`
- Mensaje de bienvenida con estado de disponibilidad
- Respuestas via **webhook N8N** (configurable en `admin.html`)

### Widget de barra lateral (`user-ai-sidebar.js`)

Inyectado automáticamente en la barra lateral de todas las páginas app:

- Muestra racha actual con anillo de fuego animado
- Chips de acción rápida diferenciados:
  - Usuarios con rutina: "Mi rutina", "Técnica", "Proteína", etc.
  - Usuarios nuevos: "Empezar", "Frecuencia", "Nutrición", etc.
- Click en un chip abre modal con respuesta IA expandida

### Panel admin de correo (`admin.js`)

9 plantillas de correo preconfiguradas para comunicación con usuarios:

1. Bienvenida
2. Rutina lista
3. Motivación
4. Suscripción por vencer
5. Suscripción vencida
6. Recordatorio de pago
7. Actualizaciones/novedades
8. Felicitaciones
9. Soporte

---

## 9. Internacionalización (i18n)

El módulo `i18n.js` provee soporte bilingüe **español/inglés** en todas las páginas:

- Detección de idioma desde `localStorage` (`sv_lang`)
- Función de uso: `L('texto en español', 'text in english')`
- Cobertura: navegación, hero, features, modales, etiquetas de formulario, validaciones, botones, dashboard, progreso, biblioteca
- Toggle de idioma visible en la navbar de la landing
- Sin dependencias externas — diccionario embebido en el módulo

---

## 10. Integraciones externas

| Integración | Uso | Archivo |
|-------------|-----|---------|
| **OpenStreetMap Nominatim** | Autocompletado de ciudad y dirección en registro y perfil | `main.js`, `perfil.js` |
| **N8N Cloud (webhook)** | Respuestas del chat IA y mensajes del panel admin | `chat-widget.js`, `admin.js` |
| **Unsplash** | Pool de 30+ imágenes de gym para el slideshow de fondo | `gym-bg.js` |
| **Google Fonts** | Tipografías Outfit (display) y Figtree (cuerpo) | `styles.css` |
| **Service Worker (PWA)** | Caché de 40+ recursos estáticos, estrategia network-first | `sw.js` |

### PWA

`manifest.json` configura StrongVision como Progressive Web App:
- **Nombre:** StrongVision
- **Color de tema:** `#FFD60A`
- **Color de fondo:** `#0B0F14`
- **Categorías:** health, fitness, sports
- **Idioma:** es (español)
- **Iconos:** 192×192 y 512×512 PNG
- **Modo display:** standalone

---

## 11. Cobertura de casos de prueba

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
| **RFU-9: Notificaciones** | TC-032 a TC-033 | `js/notificaciones.js` |
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

- **TC-014:** Generar rutina con perfil completo → `SV_IA.generarRutina()` ejecuta voraz + filtro + genético + evolutiva en <2s
- **TC-015:** Hernia lumbar excluye carga axial → Filtro elimina sentadilla con barra, peso muerto; sustituye por sentadilla goblet
- **TC-017:** Múltiples afecciones (hernia + rodilla) → Acumula reglas y prioriza la más restrictiva
- **TC-021:** Registro de serie con peso/reps → Persistido en `localStorage` vía `SV_STORAGE.registrarSesion()`
- **TC-023:** Resumen final con XP/calorías/tiempo → `calcularXP()` y `estimarCalorias()`
- **TC-031:** Exportar PDF → `window.print()` con plantilla HTML imprimible
- **TC-041:** Eliminar cuenta → Confirmación con texto "ELIMINAR" + `SV_STORAGE.eliminarUsuario()`

---

## 12. Cumplimiento normativo

### ISO/IEC 25010 — Calidad del software

| Característica | Implementación |
|---------------|----------------|
| **Adecuación funcional** | 50 casos de prueba cubiertos al 100% |
| **Eficiencia de desempeño** | Sin backend; fetch JSON local; carga <2s |
| **Compatibilidad** | Funciona en Chrome, Firefox, Edge, Safari (responsive) |
| **Usabilidad** | Onboarding guiado, feedback inmediato, i18n es/en, accesibilidad WCAG AAA |
| **Fiabilidad** | Validación exhaustiva, manejo de errores, persistencia local |
| **Seguridad** | Hash de contraseñas, validaciones RFC, XSS protection (escapeHtml) |
| **Mantenibilidad** | Código modular IIFE, separación de responsabilidades, namespaces |
| **Portabilidad** | Sin dependencias externas; corre en cualquier servidor estático; PWA offline |

### ISO 9001 — Gestión de calidad

- ✅ Documentación completa del proceso (este README)
- ✅ Casos de prueba documentados (`CasosPrueba_StrongVision.docx`)
- ✅ Versionado semántico (1.1.0)
- ✅ Trazabilidad: cada caso de prueba mapea a un módulo/función
- ✅ Mejora continua: heurística evolutiva ajusta el sistema con cada uso

### CMMI — Modelo de madurez (Nivel 2-3)

- ✅ **Gestión de requisitos** — Documento de RFU/RFA con casos numerados
- ✅ **Planificación** — Estructura modular planeada
- ✅ **Aseguramiento de calidad** — 50 casos de prueba ejecutables
- ✅ **Gestión de configuración** — Versiones controladas, datasets versionados
- ✅ **Definición de procesos** — Pipeline de IA de 4 etapas documentado

### Accesibilidad (WCAG 2.1 AAA)

- ✅ Contraste mínimo 14.7:1 en texto principal (supera AAA)
- ✅ Navegación por teclado completa (focus-visible)
- ✅ Atributos `aria-*` (labels, roles, expanded, hidden, live)
- ✅ Soporte `prefers-reduced-motion` (opción en ajustes)
- ✅ Texto escalable (rem)
- ✅ Estructura semántica HTML5 (nav, main, article, section)
- ✅ Skip links y regiones landmarks

---

## 13. Capturas y flujos

### Flujo de usuario nuevo

```
Landing → Registro → Verificar email (mock) → Perfil físico (wizard)
   → Generar rutina IA (4 etapas) → Dashboard → Iniciar entrenamiento
   → Selección de día → Calentamiento → Ejercicios guiados → Descanso cronometrado
   → Resumen + RPE → Progreso (gráfica) → Logros desbloqueados
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
   → Heurística voraz selecciona rutina compatible (100 pts patología)
   → Filtro excluye sentadilla con barra y peso muerto (carga_axial = true)
   → Sustituye con sentadilla goblet y peso muerto rumano
   → Genera advertencia clínica visible
   → Recomienda supervisión profesional
```

### Flujo del algoritmo genético

```
Top-3 rutinas del voraz como semilla
   → Inicializar población de 20 individuos
   → 30 generaciones de selección + cruce + mutación
   → Fitness = balance muscular + seguridad + progresión + distribución semanal
   → Individuo con mayor fitness → rutina final
```

---

## 14. Mantenimiento y extensión

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

### Agregar un nuevo logro

1. **Definir el logro** en `notificaciones.js` → array `LOGROS`
2. **Agregar la tarjeta** en `pages/logros.html`
3. **Actualizar `SV_STORAGE`** si requiere nuevo campo de tracking

### Modificar el algoritmo de scoring (voraz)

Editar `heuristicaVoraz()` en `js/ia-engine.js`. Los pesos actuales son:
- Patología: 100 (seguridad máxima)
- Nivel: 40
- Objetivo: 30
- Edad: 25
- Género: 15
- Días/semana: -5 por diferencia

### Modificar el algoritmo genético

Editar `algoritmoGenetico()` en `js/ia-engine.js`. Parámetros ajustables:
- `POBLACION_SIZE` (default: 20)
- `GENERACIONES` (default: 30)
- Pesos de la función de fitness (balance, seguridad, progresión, distribución)
- Tasa de mutación

### Agregar un idioma nuevo

1. **Editar `js/i18n.js`** → agregar nuevo locale al diccionario
2. **Actualizar la función `L()`** para soportar el tercer argumento
3. **Agregar opción** en el toggle de idioma del navbar

### Conectar a backend real

1. Reemplazar `SV_STORAGE` por llamadas `fetch()` a API REST
2. Mover `data/*.json` a base de datos (PostgreSQL recomendado)
3. Implementar autenticación JWT en lugar del hash demo
4. Conectar el chat IA directamente a un LLM vía API en lugar de N8N
5. Agregar HTTPS y rate limiting

---

*Última actualización: Mayo 2026 · StrongVision v1.1.0*
