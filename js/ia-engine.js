/**
 * StrongVision - Motor de Generación de Rutinas (IA + Heurísticas)
 * =================================================================
 * Combina:
 *  1. Script de heurística VORAZ → escoge la mejor rutina base del dataset
 *  2. Script de heurística EVOLUTIVA → muta/optimiza la rutina según RPE y progreso
 *  3. Script de FILTRO → aplica reglas clínicas (lesiones, patologías, edad, género)
 *
 * Datasets:
 *  - data/heuristicas.json (540 rutinas base)
 *  - data/filtros.json (582 reglas)
 *  - data/ejercicios.json (catálogo)
 *
 * Cumple ISO 25010: Adecuación funcional, Fiabilidad, Mantenibilidad
 */

const SV_IA = (function () {
    'use strict';

    let _datasetRutinas = null;
    let _datasetFiltros = null;
    let _datasetEjercicios = null;
    let _cargado = false;

    // ===== CARGA DE DATASETS =====
    function _resolverDato(global, url) {
        if (global) return Promise.resolve(global);
        return fetch(url).then(r => r.json());
    }

    async function cargarDatasets() {
        if (_cargado) return;
        try {
            const [rutinas, filtros, ejercicios] = await Promise.all([
                _resolverDato(window.SV_DATA_HEURISTICAS, '../data/heuristicas.json'),
                _resolverDato(window.SV_DATA_FILTROS, '../data/filtros.json'),
                _resolverDato(window.SV_DATA_EJERCICIOS, '../data/ejercicios.json')
            ]);
            _datasetRutinas = rutinas.rutinas;
            _datasetFiltros = filtros.filtros;
            _datasetEjercicios = ejercicios.ejercicios;
            _cargado = true;
            console.log(`[SV_IA] Datasets cargados: ${_datasetRutinas.length} rutinas, ${_datasetFiltros.length} filtros`);
        } catch (e) {
            console.error('[SV_IA] Error cargando datasets:', e);
            throw new Error('No se pudieron cargar los datasets de IA. Verifica los archivos JSON.');
        }
    }

    // ===== UTILIDADES =====
    function rangoEdad(edad) {
        if (edad <= 25) return 'joven';
        if (edad <= 40) return 'adulto';
        if (edad <= 55) return 'adulto_mayor';
        return 'senior';
    }

    function normalizarPatologia(p) {
        if (!p) return 'ninguna';
        const limpio = String(p).toLowerCase().trim()
            .replace(/\s+/g, '_')
            .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
            .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u');

        // Mapeo a claves del dataset
        const mapa = {
            'hernia': 'hernia_lumbar',
            'hernia_lumbar': 'hernia_lumbar',
            'lumbar': 'hernia_lumbar',
            'rodilla_derecha': 'rodilla_derecha',
            'rodilla_izquierda': 'rodilla_izquierda',
            'rodilla': 'rodilla_derecha',
            'hombro_izquierdo': 'hombro_izquierdo',
            'hombro_derecho': 'hombro_derecho',
            'hombro': 'hombro_derecho',
            'codo': 'codo_tendinitis',
            'tendinitis': 'codo_tendinitis',
            'muñeca': 'muñeca_lesion',
            'muneca': 'muñeca_lesion',
            'tobillo': 'tobillo_esguince',
            'esguince': 'tobillo_esguince',
            'diabetes': 'diabetes_tipo2',
            'diabetes_tipo_2': 'diabetes_tipo2',
            'hipertension': 'hipertension',
            'asma': 'asma',
            'escoliosis': 'escoliosis',
            'cervical': 'cervicales',
            'cervicales': 'cervicales',
            'cardio': 'cardiopatia_leve',
            'corazon': 'cardiopatia_leve',
            'obesidad': 'obesidad',
            'embarazo': 'embarazo',
            'osteoporosis': 'osteoporosis',
            'artritis': 'artritis',
            'ninguna': 'ninguna',
            '': 'ninguna'
        };
        return mapa[limpio] || limpio;
    }

    // ===== SCRIPT 1: HEURÍSTICA VORAZ =====
    /**
     * Selecciona la mejor rutina del dataset según el perfil del usuario.
     * Algoritmo voraz: maximiza el score local (compatibilidad) en cada criterio.
     */
    function heuristicaVoraz(perfil) {
        const patNorm = normalizarPatologia(perfil.patologia);
        const edadRango = rangoEdad(perfil.edad);

        const candidatas = _datasetRutinas.map(r => {
            let score = 0;
            // Coincidencia exacta de patología (PESO MÁXIMO porque es seguridad)
            if (r.patologia_lesion === patNorm) score += 100;
            else if (r.patologia_lesion === 'ninguna' && patNorm === 'ninguna') score += 100;
            else if (r.patologia_lesion === 'ninguna') score -= 50; // penalización si tiene patología pero la rutina no la considera

            // Coincidencia de nivel
            if (r.nivel === perfil.nivel) score += 40;

            // Coincidencia de objetivo
            if (perfil.objetivo === 'recomposicion_corporal') {
                if (r.objetivo === 'recomposicion_corporal') score += 100;
                else if (r.objetivo === 'hipertrofia') score += 35;
                else if (r.objetivo === 'perdida_peso') score += 35;
            } else {
                if (r.objetivo === perfil.objetivo) score += 30;
            }

            // Coincidencia de género
            if (r.genero === perfil.genero) score += 15;

            // Coincidencia de edad
            if (r.rango_edad === edadRango) score += 25;

            // Días por semana cercanos
            const diferencia_dias = Math.abs((r.dias_por_semana || 3) - (perfil.dias_por_semana || 3));
            score -= diferencia_dias * 5;

            return { rutina: r, score };
        });

        candidatas.sort((a, b) => b.score - a.score);
        const top3 = candidatas.slice(0, 3);
        // Voraz con un poco de aleatoriedad entre los top 3 para variedad
        const ganadora = top3[Math.floor(Math.random() * top3.length)];
        return JSON.parse(JSON.stringify(ganadora.rutina)); // deep copy
    }

    // ===== ADAPTACIÓN DE DÍAS =====
    const SPLITS_ADAPT = {
        2: { tipo: 'full_body', dias: [
            { label: 'full body A (piernas+pecho+espalda+core)', grupos: ['piernas','pecho','espalda','core'] },
            { label: 'full body B (piernas+hombro+brazo+core)',  grupos: ['piernas','hombro','brazo','core'] }
        ]},
        3: { tipo: 'ppl', dias: [
            { label: 'push (pecho+hombro+brazo)', grupos: ['pecho','hombro','brazo'] },
            { label: 'pull (espalda+brazo)',       grupos: ['espalda','brazo'] },
            { label: 'legs (piernas+core+cardio)', grupos: ['piernas','core','cardio'] }
        ]},
        4: { tipo: 'upper_lower', dias: [
            { label: 'upper A (pecho+espalda+hombro)', grupos: ['pecho','espalda','hombro'] },
            { label: 'lower A (piernas+core)',          grupos: ['piernas','core'] },
            { label: 'upper B (pecho+espalda+brazo)',  grupos: ['pecho','espalda','brazo'] },
            { label: 'lower B (piernas+cardio+core)',  grupos: ['piernas','cardio','core'] }
        ]},
        5: { tipo: 'ppl_upper_lower', dias: [
            { label: 'push (pecho+hombro+brazo)',    grupos: ['pecho','hombro','brazo'] },
            { label: 'pull (espalda+brazo)',          grupos: ['espalda','brazo'] },
            { label: 'legs (piernas+core)',           grupos: ['piernas','core'] },
            { label: 'upper (pecho+espalda+hombro)', grupos: ['pecho','espalda','hombro'] },
            { label: 'lower (piernas+cardio+core)',  grupos: ['piernas','cardio','core'] }
        ]},
        6: { tipo: 'ppl_x2', dias: [
            { label: 'push A (pecho+hombro+brazo)',  grupos: ['pecho','hombro','brazo'] },
            { label: 'pull A (espalda+brazo)',        grupos: ['espalda','brazo'] },
            { label: 'legs A (piernas+core)',         grupos: ['piernas','core'] },
            { label: 'push B (pecho+hombro+brazo)',  grupos: ['pecho','hombro','brazo'] },
            { label: 'pull B (espalda+brazo)',        grupos: ['espalda','brazo'] },
            { label: 'legs B (piernas+cardio+core)', grupos: ['piernas','cardio','core'] }
        ]}
    };

    /**
     * Restructures the routine sessions to exactly match the user's requested days/week.
     * Reuses exercises from the original routine as a pool grouped by muscle group,
     * supplemented from the exercises dataset when the pool is thin.
     * Uses per-group cursors so repeated groups (e.g. pecho in PPL×2) get different exercises.
     */
    function adaptarDias(rutina, diasPedidos) {
        const target = Number(diasPedidos);
        if (!SPLITS_ADAPT[target] || rutina.dias_por_semana === target) return rutina;

        const originalDias = rutina.dias_por_semana;
        const splitTarget  = SPLITS_ADAPT[target];

        // Build deduplicated exercise pool from original routine, grouped by muscle group
        const rawPool = {};
        rutina.sesiones.forEach(sesion => {
            sesion.ejercicios.forEach(ej => {
                if (!ej.grupo) return;
                if (!rawPool[ej.grupo]) rawPool[ej.grupo] = [];
                if (!rawPool[ej.grupo].find(x => x.nombre === ej.nombre)) {
                    rawPool[ej.grupo].push({ ...ej });
                }
            });
        });

        const baseEj = rutina.sesiones[0]?.ejercicios[0] || {};

        function buildPool(grupo) {
            const src = [...(rawPool[grupo] || [])];
            if (_datasetEjercicios?.[grupo]) {
                _datasetEjercicios[grupo].forEach(e => {
                    if (!src.find(x => x.nombre === e.nombre)) {
                        src.push({
                            nombre: e.nombre, grupo,
                            equipo: e.equipo,
                            series: baseEj.series || 3,
                            repeticiones: baseEj.repeticiones || '10-12',
                            descanso_seg: baseEj.descanso_seg || 60,
                            tecnica: `Ejecuta ${e.nombre} con control y respiración coordinada.`
                        });
                    }
                });
            }
            return src.sort(() => Math.random() - 0.5);
        }

        // Per-group cursors so repeated groups across sessions get different exercises
        const pools   = {};
        const cursors = {};

        function pickN(grupo, n) {
            if (!pools[grupo]) { pools[grupo] = buildPool(grupo); cursors[grupo] = 0; }
            const out = [];
            for (let i = 0; i < n; i++) {
                if (cursors[grupo] >= pools[grupo].length) cursors[grupo] = 0;
                out.push({ ...pools[grupo][cursors[grupo]++] });
            }
            return out;
        }

        rutina.sesiones = splitTarget.dias.map((diaInfo, idx) => {
            const ejercicios = [];
            diaInfo.grupos.forEach(grupo => {
                const n = ['brazo', 'core', 'cardio'].includes(grupo) ? 2 : 3;
                pickN(grupo, n).forEach(ej => ejercicios.push({ ...ej, grupo }));
            });
            return { dia: idx + 1, enfoque: diaInfo.label, ejercicios };
        });

        rutina.dias_por_semana = target;
        rutina.split_tipo      = splitTarget.tipo;
        const nombresMap = {
            full_body: 'Cuerpo completo (Full Body)', ppl: 'Push / Pull / Legs',
            upper_lower: 'Upper / Lower', ppl_upper_lower: 'PPL + Upper/Lower (5 días)',
            ppl_x2: 'Push / Pull / Legs × 2'
        };
        rutina.split_nombre    = nombresMap[splitTarget.tipo] || splitTarget.tipo;
        rutina.adaptado_a_dias = true;

        if (!rutina.advertencias) rutina.advertencias = [];
        rutina.advertencias.push(
            `Rutina adaptada de ${originalDias} a ${target} días/semana. Split: ${rutina.split_nombre}.`
        );

        return rutina;
    }

    // ===== SCRIPT 2: FILTRO =====
    /**
     * Aplica reglas de exclusión y sustitución del dataset de filtros.
     * Garantiza seguridad: ningún ejercicio prohibido por patología/lesión sobrevive.
     */
    function aplicarFiltros(rutina, perfil) {
        const patNorm = normalizarPatologia(perfil.patologia);
        const lesiones = (perfil.lesiones || []).map(normalizarPatologia);
        const edadRango = rangoEdad(perfil.edad);

        // Reglas relevantes
        const reglasPatologia = _datasetFiltros.filter(f =>
            f.tipo === 'patologia_lesion' &&
            (f.clave === patNorm || lesiones.includes(f.clave))
        );

        const reglasEdad = _datasetFiltros.filter(f =>
            f.tipo === 'edad_nivel_objetivo' &&
            f.rango_edad === edadRango &&
            f.nivel === perfil.nivel &&
            f.objetivo === perfil.objetivo
        );

        // Conjunto consolidado de exclusiones
        const exclusiones = new Set();
        const alternativas = [];
        const advertencias = [...(rutina.advertencias || [])];

        reglasPatologia.forEach(r => {
            (r.ejercicios_excluir || []).forEach(e => exclusiones.add(e));
            (r.alternativas_recomendadas || []).forEach(a => alternativas.push(a));
            advertencias.push(`[${r.clave.toUpperCase()}] ${r.razon_clinica}`);
        });

        reglasEdad.forEach(r => {
            (r.ejercicios_excluir || []).forEach(e => exclusiones.add(e));
            if (r.razon_clinica && !advertencias.includes(r.razon_clinica)) {
                advertencias.push(`[Adaptación etaria] ${r.razon_clinica}`);
            }
        });

        // Recorrer rutina y sustituir/eliminar
        rutina.sesiones.forEach(sesion => {
            const nuevosEjercicios = [];
            sesion.ejercicios.forEach(ej => {
                if (exclusiones.has(ej.nombre)) {
                    // Buscar alternativa segura del mismo grupo
                    const alt = buscarAlternativaSegura(ej.grupo, exclusiones);
                    if (alt) {
                        nuevosEjercicios.push({
                            ...ej,
                            nombre: alt.nombre,
                            equipo: alt.equipo,
                            tecnica: `Ejecuta ${alt.nombre} con control y respiración coordinada. (Sustituye ejercicio no recomendado para tu perfil.)`,
                            sustituido_de: ej.nombre
                        });
                    }
                    // Si no hay alternativa, omitimos el ejercicio
                } else {
                    nuevosEjercicios.push(ej);
                }
            });
            sesion.ejercicios = nuevosEjercicios;
        });

        // Deduplicar advertencias
        rutina.advertencias = [...new Set(advertencias)];
        rutina.filtros_aplicados = reglasPatologia.length + reglasEdad.length;
        return rutina;
    }

    function buscarAlternativaSegura(grupo, exclusiones) {
        const candidatos = (_datasetEjercicios[grupo] || []).filter(
            e => !exclusiones.has(e.nombre) && e.impacto !== 'alto' && !e.carga_axial
        );
        if (candidatos.length === 0) {
            // Fallback: cualquier ejercicio bajo impacto
            const fallback = (_datasetEjercicios[grupo] || []).filter(
                e => !exclusiones.has(e.nombre) && e.impacto === 'bajo'
            );
            return fallback[0] || null;
        }
        return candidatos[Math.floor(Math.random() * candidatos.length)];
    }

    // ===== VALIDACIÓN DE DISTRIBUCIÓN DE DÍAS (ACSM / SRA 48h) =====
    /**
     * Verifica que ningún grupo muscular mayor (pecho, espalda, piernas, hombro)
     * aparezca en sesiones consecutivas, respetando el principio SRA de 48-72h
     * de recuperación (ACSM Guidelines; Schoenfeld et al. 2016).
     *
     * Grupos pequeños (brazo, core) toleran 24h — no se penalizan en días adyacentes.
     * Si detecta violaciones, aplica reordenamiento adaptativo (bubble-sort de sesiones)
     * para minimizar conflictos antes de generar advertencias.
     */
    function validarDistribucionDias(rutina, perfil) {
        if (!rutina?.sesiones || rutina.sesiones.length < 2) return rutina;

        const sesiones     = rutina.sesiones;
        const advertencias = rutina.advertencias || [];

        // Grupos que requieren 48-72h (músculos grandes según principio SRA)
        const GRUPOS_MAYOR = new Set(['piernas', 'pecho', 'espalda', 'hombro']);

        // Conjunto de grupos por sesión (índice original)
        const gruposSesion = sesiones.map(s =>
            new Set(s.ejercicios.map(e => e.grupo).filter(Boolean))
        );

        // Cuenta conflictos de grupos mayores en días consecutivos
        function contarConflictos(orden) {
            let total = 0;
            for (let i = 0; i < orden.length - 1; i++) {
                const g1 = gruposSesion[orden[i]];
                const g2 = gruposSesion[orden[i + 1]];
                g1.forEach(g => { if (GRUPOS_MAYOR.has(g) && g2.has(g)) total++; });
            }
            return total;
        }

        let orden     = sesiones.map((_, i) => i);
        let conflictos = contarConflictos(orden);

        // Reordenamiento adaptativo: intercambia sesiones adyacentes si reduce conflictos
        if (conflictos > 0) {
            for (let iter = 0; iter < 15 && conflictos > 0; iter++) {
                let mejorado = false;
                for (let i = 0; i < orden.length - 1; i++) {
                    [orden[i], orden[i + 1]] = [orden[i + 1], orden[i]];
                    const nuevo = contarConflictos(orden);
                    if (nuevo < conflictos) {
                        conflictos = nuevo;
                        mejorado   = true;
                    } else {
                        [orden[i], orden[i + 1]] = [orden[i + 1], orden[i]]; // revertir
                    }
                }
                if (!mejorado) break;
            }
            // Aplicar nuevo orden con días renumerados
            rutina.sesiones = orden.map((idx, i) => ({ ...sesiones[idx], dia: i + 1 }));
        }

        // Verificación final: advertir si persisten conflictos de grupos mayores
        const gruposFinales = rutina.sesiones.map(s =>
            new Set(s.ejercicios.map(e => e.grupo).filter(Boolean))
        );
        const violaciones = [];
        for (let i = 0; i < rutina.sesiones.length - 1; i++) {
            const solapados = [...gruposFinales[i]].filter(
                g => GRUPOS_MAYOR.has(g) && gruposFinales[i + 1].has(g)
            );
            if (solapados.length > 0) violaciones.push(...solapados);
        }

        if (violaciones.length > 0) {
            const grupos = [...new Set(violaciones)].join(', ');
            advertencias.push(
                `[Distribución] Sesiones consecutivas comparten grupos: ${grupos}. ` +
                `Respeta 48-72h de recuperación entre días del mismo grupo muscular ` +
                `(ACSM Guidelines; Schoenfeld et al. 2016).`
            );
        }

        // Etiquetar split_nombre a partir de split_tipo (campo generado en Python)
        if (rutina.split_tipo && !rutina.split_nombre) {
            const nombres = {
                full_body:       'Cuerpo completo (Full Body)',
                ppl:             'Push / Pull / Legs',
                upper_lower:     'Upper / Lower',
                ppl_upper_lower: 'PPL + Upper/Lower (5 días)',
                ppl_x2:          'Push / Pull / Legs × 2'
            };
            rutina.split_nombre = nombres[rutina.split_tipo] || rutina.split_tipo;
        }

        rutina.advertencias        = [...new Set(advertencias)];
        rutina.distribucion_validada = true;
        return rutina;
    }

    // ===== SCRIPT 3: ALGORITMO GENÉTICO =====
    /**
     * Optimización multicriterio mediante evolución simulada.
     * 20 individuos × 30 generaciones maximizando balance, seguridad,
     * progresión y distribución semanal. Holland 1975, Goldberg 1989.
     */
    function algoritmoGenetico(rutina, perfil) {
        const AG_CONFIG = {
            TAMANO_POBLACION: 20,
            GENERACIONES: 30,
            TASA_CRUCE: 0.80,
            TASA_MUTACION: 0.15,
            ELITISMO: 2,
            TORNEO_K: 3
        };

        const edadRango = rangoEdad(perfil.edad);
        const patNorm = normalizarPatologia(perfil.patologia);
        const lesiones = (perfil.lesiones || []).map(normalizarPatologia);

        // Exclusiones clínicas — invariante: el AG no rompe la seguridad del filtro
        const exclusionesAG = new Set();
        _datasetFiltros
            .filter(f => f.tipo === 'patologia_lesion' && (f.clave === patNorm || lesiones.includes(f.clave)))
            .forEach(r => (r.ejercicios_excluir || []).forEach(e => exclusionesAG.add(e)));

        // Catálogo plano para lookup biomecánico
        const catalogoFlat = {};
        Object.values(_datasetEjercicios || {}).forEach(lista =>
            (lista || []).forEach(e => { catalogoFlat[e.nombre] = e; })
        );

        const tieneHerniaEscoliosis = ['hernia_lumbar', 'escoliosis'].some(
            c => patNorm === c || lesiones.includes(c)
        );
        const esAdultoMayorOSenior = edadRango === 'adulto_mayor' || edadRango === 'senior';

        // ── F1: BALANCE MUSCULAR (30 pts) ──
        function calcF1(ind) {
            const sg = {};
            ind.sesiones.forEach(s => s.ejercicios.forEach(e => {
                if (e.grupo) sg[e.grupo] = (sg[e.grupo] || 0) + (e.series || 3);
            }));
            const total = Object.values(sg).reduce((a, b) => a + b, 0) || 1;
            let score = 30;
            const pecho = sg['pecho'] || 0, espalda = sg['espalda'] || 0;
            if (pecho > 0 && espalda > 0) {
                const ratio = Math.min(pecho, espalda) / Math.max(pecho, espalda);
                if (ratio < 0.8) score -= Math.round((1 - ratio) * 10);
            } else if ((pecho > 0) !== (espalda > 0)) {
                score -= 5;
            }
            Object.values(sg).forEach(s => { if (s / total > 0.4) score -= 8; });
            if (!sg['core']) score -= 5;
            if (!sg['piernas']) score -= 5;
            return Math.max(0, Math.min(30, score));
        }

        // ── F2: SEGURIDAD SEGÚN PERFIL (25 pts) ──
        function calcF2(ind) {
            let raw = 0, total = 0;
            ind.sesiones.forEach(s => s.ejercicios.forEach(ej => {
                total++;
                const cat = catalogoFlat[ej.nombre];
                if (!cat) { raw += 1; return; }
                let pts = 3;
                if (cat.carga_axial && tieneHerniaEscoliosis) pts -= 10;
                if (cat.impacto === 'alto' && esAdultoMayorOSenior) pts -= 5;
                const artic = cat.articulaciones || [];
                if (lesiones.some(l => artic.some(a => l.includes(a) || a.includes(l)))) pts -= 8;
                raw += pts;
            }));
            if (total === 0) return 25;
            return Math.max(0, Math.min(25, (raw / (total * 3)) * 25));
        }

        // ── F3: PROGRESIÓN AL NIVEL (25 pts) ──
        function calcF3(ind) {
            const nivel = perfil.nivel || 'principiante';
            const obj = (perfil.objetivo || 'hipertrofia').replace(/\s+/g, '_');
            const rangos = {
                principiante_hipertrofia:            { series: 3, rmin: 10, rmax: 15 },
                principiante_fuerza:                 { series: 3, rmin:  5, rmax:  8 },
                principiante_resistencia:            { series: 3, rmin: 15, rmax: 20 },
                principiante_perdida_peso:           { series: 3, rmin: 12, rmax: 18 },
                principiante_recomposicion_corporal: { series: 3, rmin: 10, rmax: 15 },
                intermedio_hipertrofia:              { series: 4, rmin:  8, rmax: 12 },
                intermedio_fuerza:                   { series: 4, rmin:  4, rmax:  6 },
                intermedio_resistencia:              { series: 3, rmin: 12, rmax: 20 },
                intermedio_perdida_peso:             { series: 4, rmin: 10, rmax: 15 },
                intermedio_recomposicion_corporal:   { series: 4, rmin:  8, rmax: 12 },
                avanzado_hipertrofia:                { series: 5, rmin:  6, rmax: 10 },
                avanzado_fuerza:                     { series: 5, rmin:  3, rmax:  5 },
                avanzado_resistencia:                { series: 4, rmin: 12, rmax: 20 },
                avanzado_perdida_peso:               { series: 4, rmin: 10, rmax: 15 },
                avanzado_recomposicion_corporal:     { series: 4, rmin:  8, rmax: 12 }
            };
            const r = rangos[nivel + '_' + obj] || rangos[nivel + '_hipertrofia'] || { series: 3, rmin: 10, rmax: 15 };
            const maxEj = nivel === 'principiante' ? 6 : nivel === 'intermedio' ? 8 : 10;
            let raw = 0, total = 0;
            ind.sesiones.forEach(s => {
                if (s.ejercicios.length > maxEj) raw -= 3;
                s.ejercicios.forEach(ej => {
                    if (!ej.series) return;
                    total++;
                    const ds = Math.abs(ej.series - r.series);
                    raw += ds === 0 ? 3 : ds === 1 ? 1 : -1;
                    const mt = String(ej.repeticiones || '').match(/(\d+)(?:-(\d+))?/);
                    if (mt) {
                        const lo = parseInt(mt[1]), hi = mt[2] ? parseInt(mt[2]) : lo;
                        raw += (Math.min(hi, r.rmax) - Math.max(lo, r.rmin)) > 0 ? 2 : -1;
                    }
                });
            });
            if (total === 0) return 12.5;
            return Math.max(0, Math.min(25, (raw / (total * 5)) * 25));
        }

        // ── F4: DISTRIBUCIÓN POR DÍAS (20 pts) ──
        function calcF4(ind) {
            let score = 20;
            const sess = ind.sesiones;
            for (let i = 0; i < sess.length - 1; i++) {
                const g1 = new Set(sess[i].ejercicios.map(e => e.grupo).filter(Boolean));
                const g2 = new Set(sess[i + 1].ejercicios.map(e => e.grupo).filter(Boolean));
                g1.forEach(g => { if (g2.has(g)) score -= 4; });
            }
            const totalEj = sess.reduce((a, s) => a + s.ejercicios.length, 0) || 1;
            sess.forEach(s => { if (s.ejercicios.length / totalEj > 0.6) score -= 5; });
            if (sess.length <= 3) {
                const grupos = new Set();
                sess.forEach(s => s.ejercicios.forEach(e => e.grupo && grupos.add(e.grupo)));
                if (grupos.size >= 4) score += 3;
            }
            return Math.max(0, Math.min(20, score));
        }

        function evaluarFitness(ind) {
            return calcF1(ind) + calcF2(ind) + calcF3(ind) + calcF4(ind);
        }

        // ── SELECCIÓN POR TORNEO ──
        function seleccionTorneo(pop) {
            let mejor = null;
            for (let i = 0; i < AG_CONFIG.TORNEO_K; i++) {
                const c = pop[Math.floor(Math.random() * pop.length)];
                if (!mejor || c._fit > mejor._fit) mejor = c;
            }
            return JSON.parse(JSON.stringify(mejor));
        }

        // ── CRUCE DE UN PUNTO POR SESIÓN ──
        function cruce(p1, p2) {
            if (Math.random() >= AG_CONFIG.TASA_CRUCE) {
                return [JSON.parse(JSON.stringify(p1)), JSON.parse(JSON.stringify(p2))];
            }
            const h1 = JSON.parse(JSON.stringify(p1));
            const h2 = JSON.parse(JSON.stringify(p2));
            for (let i = 0; i < Math.min(h1.sesiones.length, h2.sesiones.length); i++) {
                const len = Math.min(h1.sesiones[i].ejercicios.length, h2.sesiones[i].ejercicios.length);
                if (len < 2) continue;
                const punto = 1 + Math.floor(Math.random() * (len - 1));
                for (let j = punto; j < len; j++) {
                    const tmp = h1.sesiones[i].ejercicios[j];
                    h1.sesiones[i].ejercicios[j] = h2.sesiones[i].ejercicios[j];
                    h2.sesiones[i].ejercicios[j] = tmp;
                }
            }
            return [h1, h2];
        }

        // ── MUTACIÓN ADAPTATIVA (3 tipos) ──
        function mutar(ind) {
            const res = JSON.parse(JSON.stringify(ind));
            res.sesiones.forEach(sesion => {
                sesion.ejercicios.forEach((ej, j) => {
                    if (Math.random() >= AG_CONFIG.TASA_MUTACION) return;
                    const t = Math.random();
                    if (t < 0.6) {
                        // Tipo 1: reemplazar por ejercicio del mismo grupo (preserva estructura)
                        const pool = (_datasetEjercicios[ej.grupo] || []).filter(
                            e => e.nombre !== ej.nombre && !exclusionesAG.has(e.nombre)
                        );
                        if (pool.length > 0) {
                            const nuevo = pool[Math.floor(Math.random() * pool.length)];
                            sesion.ejercicios[j] = {
                                ...ej,
                                nombre: nuevo.nombre,
                                equipo: nuevo.equipo,
                                tecnica: 'Ejecuta ' + nuevo.nombre + ' con control en fase excéntrica y respiración coordinada.'
                            };
                        }
                    } else if (t < 0.9 && sesion.ejercicios.length > 1) {
                        // Tipo 2: intercambiar orden dentro de la sesión (compound antes de isolation)
                        const otro = Math.floor(Math.random() * sesion.ejercicios.length);
                        if (otro !== j) {
                            const tmp = sesion.ejercicios[j];
                            sesion.ejercicios[j] = sesion.ejercicios[otro];
                            sesion.ejercicios[otro] = tmp;
                        }
                    } else {
                        // Tipo 3: microajuste de series ±1 o descanso ±15s
                        if (ej.series) {
                            sesion.ejercicios[j].series = Math.max(2, Math.min(6,
                                ej.series + (Math.random() < 0.5 ? 1 : -1)));
                        }
                        if (ej.descanso_seg) {
                            sesion.ejercicios[j].descanso_seg = Math.max(30, Math.min(300,
                                ej.descanso_seg + (Math.random() < 0.5 ? 15 : -15)));
                        }
                    }
                });
            });
            return res;
        }

        // ── INICIALIZAR POBLACIÓN ──
        const base = JSON.parse(JSON.stringify(rutina));
        base._fit = evaluarFitness(base);
        const fitnessBase = base._fit;

        let poblacion = [base];
        for (let i = 1; i < AG_CONFIG.TAMANO_POBLACION; i++) {
            const ind = mutar(JSON.parse(JSON.stringify(rutina)));
            ind._fit = evaluarFitness(ind);
            poblacion.push(ind);
        }

        // ── BUCLE EVOLUTIVO ──
        let genEjecutadas = 0;
        let sinMejora = 0;
        let mejorPrevio = Math.max(...poblacion.map(i => i._fit));

        for (let gen = 0; gen < AG_CONFIG.GENERACIONES; gen++) {
            genEjecutadas++;
            poblacion.sort((a, b) => b._fit - a._fit);

            const mejorActual = poblacion[0]._fit;
            sinMejora = (mejorActual - mejorPrevio < 0.5) ? sinMejora + 1 : 0;
            mejorPrevio = mejorActual;
            if (sinMejora >= 5) break;

            const nueva = poblacion.slice(0, AG_CONFIG.ELITISMO).map(e => JSON.parse(JSON.stringify(e)));

            while (nueva.length < AG_CONFIG.TAMANO_POBLACION) {
                const hijos = cruce(seleccionTorneo(poblacion), seleccionTorneo(poblacion));
                const m1 = mutar(hijos[0]);
                m1._fit = evaluarFitness(m1);
                nueva.push(m1);
                if (nueva.length < AG_CONFIG.TAMANO_POBLACION) {
                    const m2 = mutar(hijos[1]);
                    m2._fit = evaluarFitness(m2);
                    nueva.push(m2);
                }
            }
            poblacion = nueva;
        }

        // ── MEJOR INDIVIDUO ──
        poblacion.sort((a, b) => b._fit - a._fit);
        const mejor = poblacion[0];
        delete mejor._fit;

        // Preservar metadatos de seguridad clínica (invariantes del filtro)
        mejor.advertencias = rutina.advertencias;
        mejor.filtros_aplicados = rutina.filtros_aplicados;
        if (rutina.calentamiento) mejor.calentamiento = rutina.calentamiento;
        if (rutina.estiramiento_final) mejor.estiramiento_final = rutina.estiramiento_final;

        const f1 = parseFloat(calcF1(mejor).toFixed(1));
        const f2 = parseFloat(calcF2(mejor).toFixed(1));
        const f3 = parseFloat(calcF3(mejor).toFixed(1));
        const f4 = parseFloat(calcF4(mejor).toFixed(1));
        const fitnessFinal = parseFloat((f1 + f2 + f3 + f4).toFixed(1));

        mejor.algoritmo_genetico = {
            generaciones_ejecutadas: genEjecutadas,
            fitness_final: fitnessFinal,
            fitness_componentes: {
                balance_muscular: f1,
                seguridad: f2,
                progresion: f3,
                distribucion: f4
            },
            mejora_sobre_base: parseFloat((fitnessFinal - fitnessBase).toFixed(1)),
            convergencia_anticipada: sinMejora >= 5,
            poblacion_inicial: AG_CONFIG.TAMANO_POBLACION,
            timestamp: new Date().toISOString()
        };

        return mejor;
    }

    // ===== SCRIPT 4: HEURÍSTICA EVOLUTIVA =====
    /**
     * Optimiza la rutina basándose en historial (RPE, molestias, adherencia).
     * Es "evolutiva" porque cada generación se basa en el feedback de la anterior.
     */
    function heuristicaEvolutiva(rutina, historial) {
        if (!historial || historial.sesiones.length === 0) return rutina;

        const ultimasSesiones = historial.sesiones.slice(-5);
        const rpePromedio = calcularRPEPromedio(ultimasSesiones);
        const molestiasRecientes = (historial.molestias || []).slice(-10);

        let cambios = [];

        // Regla 1: RPE bajo → incrementar carga
        if (rpePromedio !== null && rpePromedio < 5) {
            rutina.sesiones.forEach(s => {
                s.ejercicios.forEach(e => {
                    if (e.series) {
                        e.series = Math.min(e.series + 1, 5);
                        cambios.push(`+1 serie en ${e.nombre} (RPE bajo)`);
                    }
                });
            });
            rutina.advertencias.push(`[Adaptación] Tu RPE promedio fue ${rpePromedio.toFixed(1)}. Subimos 1 serie por ejercicio para progresar.`);
        }

        // Regla 2: RPE muy alto → reducir intensidad
        if (rpePromedio !== null && rpePromedio >= 9) {
            rutina.sesiones.forEach(s => {
                s.ejercicios.forEach(e => {
                    if (e.descanso_seg) e.descanso_seg = Math.min(e.descanso_seg + 30, 240);
                });
            });
            rutina.advertencias.push(`[Adaptación] Tu RPE promedio fue ${rpePromedio.toFixed(1)}. Aumentamos descansos para recuperarte mejor.`);
        }

        // Regla 3: Molestia recurrente en una zona
        const conteoMolestias = {};
        molestiasRecientes.forEach(m => {
            conteoMolestias[m.zona] = (conteoMolestias[m.zona] || 0) + 1;
        });
        Object.entries(conteoMolestias).forEach(([zona, conteo]) => {
            if (conteo >= 2) {
                rutina.advertencias.push(`[Atención] Reportaste molestia ${conteo} veces en ${zona}. Reducimos volumen y sugerimos consultar a un fisioterapeuta.`);
                // Reducir carga en la zona afectada
                rutina.sesiones.forEach(s => {
                    s.ejercicios.forEach(e => {
                        if (e.grupo && e.grupo.toLowerCase().includes(zona.toLowerCase())) {
                            if (e.series) e.series = Math.max(e.series - 1, 2);
                        }
                    });
                });
            }
        });

        rutina.evolucion = {
            generacion: (rutina.evolucion?.generacion || 0) + 1,
            rpe_promedio: rpePromedio,
            cambios: cambios,
            fecha: new Date().toISOString()
        };

        return rutina;
    }

    function calcularRPEPromedio(sesiones) {
        const valores = sesiones
            .map(s => s.rpe)
            .filter(rpe => typeof rpe === 'number');
        if (valores.length === 0) return null;
        return valores.reduce((a, b) => a + b, 0) / valores.length;
    }

    // ===== ORQUESTADOR PRINCIPAL =====
    async function generarRutina(perfil, historial = null) {
        await cargarDatasets();

        // Validación
        if (!perfil || !perfil.edad || !perfil.nivel || !perfil.objetivo) {
            throw new Error('Perfil incompleto. Necesito al menos edad, nivel y objetivo.');
        }

        // Paso 1: Voraz
        let rutina = heuristicaVoraz(perfil);

        // Paso 1b: Adaptar al número de días del perfil
        if (perfil.dias_por_semana) rutina = adaptarDias(rutina, perfil.dias_por_semana);

        // Paso 2: Filtro clínico
        rutina = aplicarFiltros(rutina, perfil);

        // Paso 2b: Validar distribución de días (48h recuperación ACSM)
        rutina = validarDistribucionDias(rutina, perfil);

        // Paso 3: Algoritmo Genético
        rutina = algoritmoGenetico(rutina, perfil);

        // Paso 4: Evolutiva (si hay historial)
        if (historial) {
            rutina = heuristicaEvolutiva(rutina, historial);
        }

        // Metadatos del proceso
        rutina.generada_para = {
            edad: perfil.edad,
            nivel: perfil.nivel,
            objetivo: perfil.objetivo,
            genero: perfil.genero,
            patologia: perfil.patologia,
            lesiones: perfil.lesiones,
            dias_por_semana: perfil.dias_por_semana
        };
        rutina.timestamp = new Date().toISOString();
        rutina.id_rutina = 'GEN-' + Date.now().toString(36);

        // Advertencias específicas para recomposición corporal
        if (perfil.objetivo === 'recomposicion_corporal') {
            if (!rutina.advertencias) rutina.advertencias = [];
            const advsRec = [
                'Mantén un déficit calórico leve de 200-300 kcal para optimizar resultados',
                'Consume 1.8-2.4g de proteína por kg de peso corporal al día',
                'Evalúa tu progreso cada 4-6 semanas — los cambios son graduales'
            ];
            advsRec.forEach(a => { if (!rutina.advertencias.includes(a)) rutina.advertencias.push(a); });
        }

        return rutina;
    }

    // ===== CHAT IA — Asistente de entrenamiento completo =====
    async function responderChat(pregunta, contexto = {}) {
        await cargarDatasets();

        const p  = pregunta.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
        const { usuario, perfil, rutina } = contexto;
        const nombre = (usuario?.nombre || perfil?.nombre || 'atleta').split(' ')[0];

        // helper: test múltiples patrones
        const m = (...rx) => rx.some(r => r.test(p));
        // helper: dato del perfil o fallback
        const pd = (k, fb = null) => (perfil && perfil[k] != null) ? perfil[k] : fb;
        // language helpers
        const isEN = (localStorage.getItem('sv_lang') || 'es-CO') === 'en-US';
        const L = (es, en) => isEN ? en : es;

        // ── 1. SALUDOS ──────────────────────────────────────────────────
        if (m(/^(hola|hi|hey|buenos|buenas|que tal|que hay|saludos|buen dia|buenas tardes|hello|good morning|good afternoon|what.?s up)/)) {
            return L(
                `Hola, **${nombre}**! Soy tu asistente de entrenamiento en StrongVision.\n\n` +
                `Puedo ayudarte con:\n▸ Ejercicios específicos y técnica\n▸ Nutrición y suplementos\n▸ Tu rutina y plan de entrenamiento\n▸ Descanso y recuperación\n▸ Lesiones y adaptaciones\n▸ Motivación y progreso\n\n¿Por dónde empezamos?`,
                `Hi, **${nombre}**! I'm your training assistant at StrongVision.\n\n` +
                `I can help you with:\n▸ Specific exercises and technique\n▸ Nutrition and supplements\n▸ Your routine and training plan\n▸ Rest and recovery\n▸ Injuries and adaptations\n▸ Motivation and progress\n\nWhere shall we start?`
            );
        }

        // ── 2. PERFIL DEL USUARIO ───────────────────────────────────────
        if (m(/mi perfil|mis datos|como estoy|cual es mi nivel|mi objetivo|my profile|my data|my level|my goal/)) {
            if (!perfil) return L(
                `Aún no tienes un perfil completo. Ve a **Perfil** para ingresar tus datos y así podré darte recomendaciones más precisas.`,
                `You don't have a complete profile yet. Go to **Profile** to enter your data so I can give you more precise recommendations.`
            );
            const pat = pd('patologia', 'ninguna');
            return L(
                `**Tu perfil:**\n▸ Edad: ${pd('edad')} años | Peso: ${pd('peso')}kg | Altura: ${pd('altura')}cm\n▸ Nivel: **${pd('nivel')}** | Objetivo: **${(pd('objetivo','') + '').replace(/_/g,' ')}**\n▸ Frecuencia: **${pd('dias_por_semana')} días/semana**${pat !== 'ninguna' ? `\n▸ Condición registrada: **${pat.replace(/_/g,' ')}**` : ''}`,
                `**Your profile:**\n▸ Age: ${pd('edad')} yrs | Weight: ${pd('peso')}kg | Height: ${pd('altura')}cm\n▸ Level: **${pd('nivel')}** | Goal: **${(pd('objetivo','') + '').replace(/_/g,' ')}**\n▸ Frequency: **${pd('dias_por_semana')} days/week**${pat !== 'ninguna' ? `\n▸ Registered condition: **${pat.replace(/_/g,' ')}**` : ''}`
            );
        }

        // ── 3. RUTINA ACTUAL ────────────────────────────────────────────
        if (m(/mi rutina|mi plan|plan de entrenamiento|mis ejercicios de hoy|que entreno hoy|my routine|my plan|training plan|my exercises today/)) {
            if (!rutina) return L(
                `Aún no tienes una rutina generada. Ve a la sección **Rutina** y presiona "Generar mi rutina" — combina 540 rutinas base con tu perfil y 582 reglas de seguridad para crear tu plan personalizado.`,
                `You don't have a generated routine yet. Go to the **Routine** section and press "Generate my routine" — it combines 540 base routines with your profile and 582 safety rules to create your personalized plan.`
            );
            const total = rutina.sesiones.reduce((a, s) => a + s.ejercicios.length, 0);
            const enfoques = rutina.sesiones.map((s,i) => `${L('Día','Day')} ${i+1}: ${s.enfoque.replace(/\+/g,' + ')}`).join('\n▸ ');
            return L(
                `**Tu rutina — Plan de ${(rutina.objetivo+'').replace(/_/g,' ')}** (nivel ${rutina.nivel})\n\n▸ **${rutina.sesiones.length} días/semana**, ${total} ejercicios totales\n▸ ${enfoques}\n\n${rutina.advertencias?.length ? `**${rutina.advertencias.length} adaptación(es) de seguridad activa(s)** — revisa las advertencias en la sección Rutina.` : 'Sin restricciones activas.'}`,
                `**Your routine — ${(rutina.objetivo+'').replace(/_/g,' ')} Plan** (level ${rutina.nivel})\n\n▸ **${rutina.sesiones.length} days/week**, ${total} total exercises\n▸ ${enfoques}\n\n${rutina.advertencias?.length ? `**${rutina.advertencias.length} active safety adaptation(s)** — check the warnings in the Routine section.` : 'No active restrictions.'}`
            );
        }

        // ── 4. EJERCICIOS ESPECÍFICOS ───────────────────────────────────
        if (m(/press.*banca|bench press|pecho.*barra|banca plana/)) {
            return L(
                `**Press de banca** — pecho mayor, deltoides anterior, tríceps\n\n▸ Escápulas retraídas y deprimidas contra el banco durante todo el movimiento\n▸ Agarre ligeramente más ancho que los hombros\n▸ Baja la barra hasta el esternón, exhala al empujar\n▸ Pies firmes en el suelo, arco lumbar natural\n▸ Codos a 45-75° del torso (no perpendiculares — protege el hombro)\n\n**Error frecuente:** separar las escápulas al bajar la barra.`,
                `**Bench press** — pectoralis major, anterior deltoid, triceps\n\n▸ Retracted and depressed scapulae against the bench throughout the movement\n▸ Grip slightly wider than shoulders\n▸ Lower the bar to the sternum, exhale while pushing\n▸ Feet firmly on the floor, natural lumbar arch\n▸ Elbows at 45-75° from the torso (not perpendicular — protects the shoulder)\n\n**Common mistake:** flaring the scapulae when lowering the bar.`
            );
        }
        if (m(/sentadilla|squat|cuclillas|sentarse.*barra/)) {
            return L(
                `**Sentadilla** — cuádriceps, glúteos, isquiotibiales, core\n\n▸ Pies a la anchura de hombros, puntas ligeramente afuera\n▸ Rodillas siguen la dirección de los pies (no colapsen adentro)\n▸ Pecho arriba, mirada al frente, espalda neutra\n▸ Baja hasta paralelo o más, empuja el suelo con los talones\n▸ El peso en el tercio medio del pie, no en los dedos\n\n**Tip:** Si los talones se levantan, trabaja movilidad de tobillo.`,
                `**Squat** — quadriceps, glutes, hamstrings, core\n\n▸ Feet shoulder-width apart, toes slightly out\n▸ Knees follow the direction of the feet (don't cave inward)\n▸ Chest up, eyes forward, neutral spine\n▸ Lower to parallel or below, push the floor with your heels\n▸ Weight in the middle third of the foot, not on the toes\n\n**Tip:** If your heels lift, work on ankle mobility.`
            );
        }
        if (m(/peso muerto|deadlift|levantamiento.*suelo/)) {
            return L(
                `**Peso muerto** — cadena posterior completa: isquiotibiales, glúteos, erectores, trapecios\n\n▸ Barra sobre el medio del pie, agarre a la anchura de hombros\n▸ Cadera abajo, pecho arriba, espalda neutra (NUNCA redondear la lumbar)\n▸ Empuja el suelo con los pies al comenzar\n▸ La barra sube pegada al cuerpo durante todo el recorrido\n▸ Extiende caderas y rodillas simultáneamente\n\n**Regla de oro:** si la técnica falla, baja el peso.`,
                `**Deadlift** — full posterior chain: hamstrings, glutes, erectors, trapezius\n\n▸ Bar over the middle of the foot, grip shoulder-width apart\n▸ Hips down, chest up, neutral spine (NEVER round the lower back)\n▸ Push the floor with your feet to initiate\n▸ Bar stays close to the body throughout the lift\n▸ Extend hips and knees simultaneously\n\n**Golden rule:** if your technique breaks down, lower the weight.`
            );
        }
        if (m(/dominada|pull.?up|jalon al pecho/)) {
            return L(
                `**Dominadas** — dorsal, bíceps, romboides, trapecio\n\n▸ Deprime las escápulas antes de jalar (no encogerse)\n▸ Agarre prono = más dorsal; supino = más bíceps\n▸ Lleva el pecho hacia la barra, codos hacia abajo y atrás\n▸ Baja de forma controlada (2-3 segundos)\n\n**Sin dominadas aún?** Usa banda de asistencia o jalón en polea hasta tener fuerza suficiente. Objetivo: 3 series de 8 con peso corporal.`,
                `**Pull-ups** — lats, biceps, rhomboids, trapezius\n\n▸ Depress the scapulae before pulling (don't shrug)\n▸ Pronated grip = more lats; supinated = more biceps\n▸ Drive the chest toward the bar, elbows down and back\n▸ Lower in a controlled manner (2-3 seconds)\n\n**Can't do pull-ups yet?** Use an assistance band or lat pulldown until you're strong enough. Goal: 3 sets of 8 with bodyweight.`
            );
        }
        if (m(/remo|rowing|row|espalda.*polea|jalón espalda/)) {
            return L(
                `**Remo** — dorsal, romboides, bíceps, trapecio\n\n▸ Espalda neutra, torso inclinado hacia adelante (remo con barra) o erguido (polea)\n▸ Jala hacia el abdomen (remo bajo) o el pecho (remo alto)\n▸ Las escápulas se acercan al terminar el movimiento\n▸ No balancees el torso — el movimiento viene de los codos y la espalda\n\n**Variaciones:** barra, mancuerna unilateral, polea baja, máquina Hammer.`,
                `**Row** — lats, rhomboids, biceps, trapezius\n\n▸ Neutral spine, torso inclined forward (barbell row) or upright (cable)\n▸ Pull toward the abdomen (low row) or chest (high row)\n▸ Scapulae come together at the end of the movement\n▸ Don't swing the torso — the movement comes from elbows and back\n\n**Variations:** barbell, unilateral dumbbell, low cable, Hammer machine.`
            );
        }
        if (m(/curl|bicep|biceps|flexion de codo/)) {
            return L(
                `**Curl de bíceps** — bíceps braquial, braquialis\n\n▸ Codos fijos y pegados al torso durante todo el movimiento\n▸ Supina la muñeca (gira la palma) en la fase concéntrica\n▸ Contrae fuerte arriba, baja de forma controlada (2-3s)\n▸ **Martillo** (palma neutra): activa más el braquialis y antebrazo\n▸ **Predicador**: aísla más, elimina el trampeo con el cuerpo\n\n**Error clásico:** balancear el torso para subir más peso. Baja el peso y ejecuta bien.`,
                `**Bicep curl** — biceps brachii, brachialis\n\n▸ Elbows fixed and tucked to the torso throughout the movement\n▸ Supinate the wrist (turn the palm up) during the concentric phase\n▸ Strong contraction at the top, lower controlled (2-3s)\n▸ **Hammer curl** (neutral palm): activates more brachialis and forearm\n▸ **Preacher curl**: more isolation, eliminates body cheat\n\n**Classic mistake:** swinging the torso to lift more weight. Lower the weight and execute properly.`
            );
        }
        if (m(/triceps|tric|extension.*codo|fondos|dips|frances|rompecraneos/)) {
            return L(
                `**Tríceps** (2/3 del brazo) — extensión del codo, 3 cabezas\n\n▸ **Polea** (pushdown): codo fijo, extiende hasta el fondo\n▸ **Francés/rompecráneos**: codos al techo, controla la fase excéntrica\n▸ **Fondos**: gran estímulo, cuida que los hombros no suban\n▸ **Press cerrado**: trabaja tríceps junto al pecho\n\nLa **cabeza larga** (la mayor) se activa mejor con el brazo por encima de la cabeza (extensión overhead).`,
                `**Triceps** (2/3 of the arm) — elbow extension, 3 heads\n\n▸ **Cable pushdown**: fixed elbow, extend all the way down\n▸ **Skull crusher/French press**: elbows to ceiling, control the eccentric phase\n▸ **Dips**: great stimulus, keep shoulders from rising\n▸ **Close-grip press**: works triceps together with chest\n\nThe **long head** (the largest) is best activated with the arm overhead (overhead extension).`
            );
        }
        if (m(/hombro|deltoid|press militar|elevacion|lateral raise/)) {
            return L(
                `**Hombros (deltoides)** — anterior, lateral, posterior\n\n▸ **Press militar**: activa los 3, más el anterior — no arquees la lumbar\n▸ **Elevaciones laterales**: el mejor para el deltoides lateral — control total, sin impulso\n▸ **Face-pull / pájaro**: deltoides posterior — fundamental para salud del hombro\n▸ **Rotación externa**: manguito rotador — no la ignores, previene lesiones\n\n**Dato:** el deltoides posterior es el más ignorado y el que más protege la articulación glenohumeral.`,
                `**Shoulders (deltoids)** — anterior, lateral, posterior\n\n▸ **Military press**: activates all 3, especially the anterior — don't arch the lower back\n▸ **Lateral raises**: best for the lateral deltoid — full control, no momentum\n▸ **Face-pull / rear delt fly**: posterior deltoid — fundamental for shoulder health\n▸ **External rotation**: rotator cuff — don't skip it, prevents injuries\n\n**Fact:** the posterior deltoid is the most neglected and the one that most protects the glenohumeral joint.`
            );
        }
        if (m(/gluteo|cadera|pompas|hip thrust|glute bridge/)) {
            return L(
                `**Glúteos** — el músculo más grande del cuerpo\n\n▸ **Hip thrust**: máxima activación del glúteo mayor con barra\n▸ **Sentadilla profunda**: glúteos + cuádriceps\n▸ **Peso muerto rumano**: cadena posterior — glúteos e isquiotibiales\n▸ **Abducción**: glúteo medio (vital para salud de rodillas y cadera)\n\n**Clave:** la conexión mente-músculo es crítica aquí. Entrena 2-3 veces/semana con variedad. Los glúteos se adaptan rápido — varía estímulos.`,
                `**Glutes** — the largest muscle in the body\n\n▸ **Hip thrust**: maximum glute activation with barbell\n▸ **Deep squat**: glutes + quadriceps\n▸ **Romanian deadlift**: posterior chain — glutes and hamstrings\n▸ **Abduction**: gluteus medius (vital for knee and hip health)\n\n**Key:** mind-muscle connection is critical here. Train 2-3 times/week with variety. Glutes adapt quickly — vary your stimuli.`
            );
        }
        if (m(/core|abdomen|abdominales|plancha|faja abdominal/)) {
            return L(
                `**Core** — no solo "six-pack"\n\nEl core real incluye: transverso abdominal, oblicuos (interno/externo), multífido, suelo pélvico\n\n▸ **Plancha**: transverso profundo — busca calidad, no tiempo récord\n▸ **Plancha lateral**: oblicuos y cuadrado lumbar\n▸ **Pallof press**: anti-rotación, excelente funcionalidad\n▸ **Crunch / sit-up**: recto abdominal, menor importancia funcional\n▸ **Dead bug / bird dog**: coordinación y estabilidad lumbar\n\nEl "six-pack" se ve con bajo % de grasa. El core fuerte se construye con estabilización.`,
                `**Core** — not just a "six-pack"\n\nThe real core includes: transverse abdominal, obliques (internal/external), multifidus, pelvic floor\n\n▸ **Plank**: deep transverse — aim for quality, not record time\n▸ **Side plank**: obliques and quadratus lumborum\n▸ **Pallof press**: anti-rotation, excellent functionality\n▸ **Crunch / sit-up**: rectus abdominis, lower functional importance\n▸ **Dead bug / bird dog**: lumbar coordination and stability\n\nThe "six-pack" shows with low body fat %. A strong core is built with stabilization.`
            );
        }

        // ── 5. NUTRICIÓN ────────────────────────────────────────────────
        if (m(/proteina|whey|caseina|cuanta proteina|proteinas|protein|how much protein/)) {
            const kg = pd('peso');
            const rango = kg ? L(`Para tus **${kg}kg**: **${Math.round(kg*1.8)}–${Math.round(kg*2.2)}g/día**`, `For your **${kg}kg**: **${Math.round(kg*1.8)}–${Math.round(kg*2.2)}g/day**`) : L('**1.8–2.2 g/kg de peso corporal**', '**1.8–2.2 g/kg body weight**');
            return L(
                `**Proteína** — el macronutriente clave para construir músculo\n\n▸ Cantidad recomendada: ${rango}\n▸ Fuentes de calidad: pollo, res, huevo, atún, salmón, yogur griego, legumbres\n▸ **Whey**: rápida absorción, ideal post-entreno. No es mágica — es solo proteína concentrada\n▸ **Caseína**: digestión lenta, buena opción antes de dormir\n\nDistribuye en 3–5 comidas. El timing importa menos que el total diario.`,
                `**Protein** — the key macronutrient for building muscle\n\n▸ Recommended amount: ${rango}\n▸ Quality sources: chicken, beef, eggs, tuna, salmon, Greek yogurt, legumes\n▸ **Whey**: fast absorption, ideal post-workout. Not magic — just concentrated protein\n▸ **Casein**: slow digestion, good option before bed\n\nDistribute across 3–5 meals. Timing matters less than the daily total.`
            );
        }
        if (m(/carbohidrato|carbo|arroz|pasta|glucosa|azucar|energia para entrenar|carb|carbohydrate/)) {
            return L(
                `**Carbohidratos** — la energía preferida para entrenamientos de fuerza\n\n▸ **Pre-entreno** (1-2h antes): carbos complejos — arroz, avena, pan integral, patata\n▸ **Post-entreno** (30-60 min): carbos simples + proteína — banana, arroz blanco + pollo\n▸ **Días de descanso**: puedes reducir ligeramente los carbos si el objetivo es definición\n\nNO los elimines — sin carbos el rendimiento y la recuperación caen notablemente. El glucógeno muscular importa.`,
                `**Carbohydrates** — the preferred energy for strength training\n\n▸ **Pre-workout** (1-2h before): complex carbs — rice, oats, whole-grain bread, potato\n▸ **Post-workout** (30-60 min): simple carbs + protein — banana, white rice + chicken\n▸ **Rest days**: you can slightly reduce carbs if your goal is definition\n\nDO NOT eliminate them — without carbs, performance and recovery drop noticeably. Muscle glycogen matters.`
            );
        }
        if (m(/grasa|grasas|aguacate|aceite de oliva|omega.?3|lipido|healthy fat/)) {
            return L(
                `**Grasas** — esenciales para hormonas, articulaciones y absorción de vitaminas\n\n▸ Consume el **20–35% de tus calorías** en grasas\n▸ Grasas buenas: aguacate, aceite de oliva, nueces, almendras, salmón, huevos\n▸ **Omega-3** (salmón, sardinas, nueces, linaza): antiinflamatorio, mejora recuperación articular\n▸ Limita grasas trans (alimentos ultraprocesados)\n\nLas grasas no te engordan. El exceso calórico sí.`,
                `**Fats** — essential for hormones, joints, and vitamin absorption\n\n▸ Consume **20–35% of your calories** from fats\n▸ Good fats: avocado, olive oil, nuts, almonds, salmon, eggs\n▸ **Omega-3** (salmon, sardines, nuts, flaxseed): anti-inflammatory, improves joint recovery\n▸ Limit trans fats (ultra-processed foods)\n\nFats don't make you fat. Caloric surplus does.`
            );
        }
        if (m(/agua|hidrat|tomar agua|cuanta agua|bebidas|water|hydrat/)) {
            const kg = pd('peso');
            const litros = kg ? L(`Para tus ${kg}kg: ~**${(kg * 0.035).toFixed(1)}L/día**`, `For your ${kg}kg: ~**${(kg * 0.035).toFixed(1)}L/day**`) : L('**2.5–3L/día**', '**2.5–3L/day**');
            return L(
                `**Hidratación** — el suplemento más barato y efectivo\n\n▸ Mínimo ${litros}\n▸ En días de entreno: adiciona 500-750ml por hora de ejercicio\n▸ Señales de deshidratación: orina oscura, fatiga prematura, calambres, dolor de cabeza\n▸ Durante el entreno: bebe cada 15-20 min sin esperar sentir sed\n\nEl café y el té también hidratan (el mito de que deshidratan es inexacto para dosis normales).`,
                `**Hydration** — the cheapest and most effective supplement\n\n▸ Minimum ${litros}\n▸ On training days: add 500-750ml per hour of exercise\n▸ Signs of dehydration: dark urine, early fatigue, cramps, headache\n▸ During training: drink every 15-20 min without waiting to feel thirsty\n\nCoffee and tea also hydrate (the myth that they dehydrate is inaccurate for normal doses).`
            );
        }
        if (m(/suplemento|creatina|bcaa|pre.?entreno|cafeina|pre.workout|beta.alanina|supplement|creatine|caffeine/)) {
            return L(
                `**Suplementos con evidencia científica real:**\n\n▸ **Creatina monohidrato**: el más respaldado. +fuerza, +masa, mejor recuperación. Dosis: 3-5g/día (no ciclar)\n▸ **Proteína en polvo (Whey)**: cómodo para alcanzar tu objetivo proteico diario\n▸ **Cafeína**: mejora rendimiento, fuerza y resistencia. 3-6mg/kg, 30-45 min antes de entrenar\n▸ **Omega-3**: antiinflamatorio, salud articular\n▸ **Vitamina D3**: importante si hay poca exposición solar\n\n**BCAA, glutamina, HMB**: evidencia débil si ya consumes suficiente proteína total.`,
                `**Supplements with real scientific evidence:**\n\n▸ **Creatine monohydrate**: the most supported. +strength, +mass, better recovery. Dose: 3-5g/day (no cycling needed)\n▸ **Protein powder (Whey)**: convenient for hitting your daily protein target\n▸ **Caffeine**: improves performance, strength, and endurance. 3-6mg/kg, 30-45 min before training\n▸ **Omega-3**: anti-inflammatory, joint health\n▸ **Vitamin D3**: important if you have low sun exposure\n\n**BCAA, glutamine, HMB**: weak evidence if you already consume enough total protein.`
            );
        }
        if (m(/cuantas calorias|deficit.*calorico|superavit|calorias.*dia|tdee|metabolismo|calories|caloric deficit|caloric surplus/)) {
            const kg = pd('peso'), alt = pd('altura'), edad = pd('edad');
            let tmb = '';
            if (kg && alt && edad) {
                const gen = pd('genero', 'masculino');
                const val = gen === 'femenino'
                    ? Math.round(655 + 9.6*kg + 1.85*alt - 4.7*edad)
                    : Math.round(66 + 13.7*kg + 5*alt - 6.8*edad);
                const tdee = Math.round(val * 1.55);
                tmb = L(`\n\n**Tu TMB estimada:** ~${val} kcal | **TDEE (~act. moderada):** ~${tdee} kcal`, `\n\n**Your estimated BMR:** ~${val} kcal | **TDEE (~moderate act.):** ~${tdee} kcal`);
            }
            const obj = pd('objetivo','');
            const consejo = L(
                /perdida|definicion|cutting/.test(obj) ? 'Para perder grasa: déficit de 300-500 kcal del TDEE'
                    : /hipertrofia|volumen|bulking/.test(obj) ? 'Para ganar músculo: superávit de 200-350 kcal del TDEE'
                    : 'Para recomposición: mantente en torno al TDEE, proteína alta',
                /perdida|definicion|cutting/.test(obj) ? 'To lose fat: 300-500 kcal deficit from TDEE'
                    : /hipertrofia|volumen|bulking/.test(obj) ? 'To gain muscle: 200-350 kcal surplus above TDEE'
                    : 'For recomposition: stay around TDEE, high protein'
            );
            return L(
                `**Calorías y metabolismo**${tmb}\n\n▸ ${consejo}\n▸ Ajusta cada 2-3 semanas según el espejo y el rendimiento\n▸ No bajes de 1500 kcal/día (hombre) o 1200 kcal/día (mujer) — pierdes músculo\n\nEl conteo exacto no es necesario — prioriza calidad de alimentos y escucha tu cuerpo.`,
                `**Calories and metabolism**${tmb}\n\n▸ ${consejo}\n▸ Adjust every 2-3 weeks based on mirror and performance\n▸ Don't go below 1500 kcal/day (men) or 1200 kcal/day (women) — you'll lose muscle\n\nExact counting isn't necessary — prioritize food quality and listen to your body.`
            );
        }

        // ── 6. DESCANSO Y RECUPERACIÓN ──────────────────────────────────
        if (m(/descans|recuper|sueno|dormir|sobreentren|overtraining|fatiga|rest|sleep|recovery/)) {
            return L(
                `**Descanso y recuperación** — donde ocurre el crecimiento real\n\n▸ **Sueño:** 7-9 horas. La hormona de crecimiento se libera en sueño profundo\n▸ **Entre sesiones:** mínimo 48h entre entrenamientos del mismo grupo muscular\n▸ **1-2 días de descanso completo** por semana\n▸ **Señales de sobreentrenamiento:** rendimiento que baja, fatiga persistente, insomnio, irritabilidad, pérdida de motivación\n\n**Si notas sobreentrenamiento:** 5-7 días de descanso activo (caminar, yoga, natación suave). El músculo crece mientras descansas, no mientras entrenas.`,
                `**Rest and recovery** — where real growth happens\n\n▸ **Sleep:** 7-9 hours. Growth hormone is released during deep sleep\n▸ **Between sessions:** minimum 48h between workouts for the same muscle group\n▸ **1-2 full rest days** per week\n▸ **Signs of overtraining:** declining performance, persistent fatigue, insomnia, irritability, loss of motivation\n\n**If you notice overtraining:** 5-7 days of active rest (walking, yoga, light swimming). Muscle grows while you rest, not while you train.`
            );
        }

        // ── 7. LESIONES Y DOLOR ─────────────────────────────────────────
        if (m(/dolor|lesion|molesti|duele|tendinitis|articulacion|inflamacion|pain|injury|inflammation/)) {
            return L(
                `**Manejo de dolor y lesiones**\n\n▸ **Ardor muscular (DOMS):** normal — micro-roturas que el cuerpo repara más fuerte\n▸ **Molestia articular:** reduce la carga, revisa la técnica, no ignores la señal\n▸ **Dolor agudo o punzante:** para inmediatamente — es una señal de alarma\n\n**Protocolo inicial (lesión leve):** RICE — Reposo, Hielo (15-20 min c/2h), Compresión, Elevación\n\nRegistra la molestia en tu sesión de entrenamiento — StrongVision adapta tu rutina automáticamente con sus 582 reglas de seguridad.`,
                `**Pain and injury management**\n\n▸ **Muscle soreness (DOMS):** normal — micro-tears the body repairs stronger\n▸ **Joint discomfort:** reduce the load, check your technique, don't ignore the signal\n▸ **Sharp or stabbing pain:** stop immediately — it's a warning signal\n\n**Initial protocol (mild injury):** RICE — Rest, Ice (15-20 min every 2h), Compression, Elevation\n\nLog the discomfort in your training session — StrongVision automatically adapts your routine with its 582 safety rules.`
            );
        }

        // ── 8. CALENTAMIENTO Y ESTIRAMIENTO ────────────────────────────
        if (m(/calent|warm.?up|estiramiento|movilidad|enfriamiento|cool.?down|stretching|mobility/)) {
            return L(
                `**Calentamiento completo (10-15 min):**\n\n▸ **Cardio suave** (3-5 min): caminata rápida, bici, trote\n▸ **Movilidad articular**: círculos de cuello, hombros, caderas, rodillas, tobillos\n▸ **Activación específica**: glute bridge, band pull-aparts, rotaciones de manguito\n▸ **Series de aproximación**: 1-2 series con 40-60% del peso de trabajo\n\n**Estiramiento estático** → siempre al FINAL (antes reduce temporalmente la fuerza)\n**Enfriamiento**: 5 min cardio suave + estiramientos 30-60s por grupo muscular.`,
                `**Complete warm-up (10-15 min):**\n\n▸ **Light cardio** (3-5 min): brisk walk, bike, jog\n▸ **Joint mobility**: neck, shoulder, hip, knee, ankle circles\n▸ **Specific activation**: glute bridge, band pull-aparts, rotator cuff rotations\n▸ **Warm-up sets**: 1-2 sets at 40-60% of working weight\n\n**Static stretching** → always at the END (before training it temporarily reduces strength)\n**Cool-down**: 5 min light cardio + 30-60s stretches per muscle group.`
            );
        }

        // ── 9. SERIES, REPS Y VOLUMEN ───────────────────────────────────
        if (m(/cuantas series|cuantas repeticion|series.*reps|reps.*series|volumen|cuanto volumen|how many sets|how many reps|sets.*reps|volume/)) {
            const obj = pd('objetivo','');
            const recom = L(
                /fuerza/.test(obj) ? '**Fuerza**: 3-6 reps, 4-6 series, descanso 2-5 min, 80-95% 1RM'
                    : /hipertrofia/.test(obj) ? '**Hipertrofia**: 8-12 reps, 3-5 series, descanso 60-90s, 65-80% 1RM'
                    : /perdida|definicion/.test(obj) ? '**Definición/resistencia**: 12-20 reps, 3-4 series, descanso 30-60s'
                    : '**Hipertrofia** (recomendado): 8-12 reps, 3-5 series, descanso 60-90s',
                /fuerza/.test(obj) ? '**Strength**: 3-6 reps, 4-6 sets, rest 2-5 min, 80-95% 1RM'
                    : /hipertrofia/.test(obj) ? '**Hypertrophy**: 8-12 reps, 3-5 sets, rest 60-90s, 65-80% 1RM'
                    : /perdida|definicion/.test(obj) ? '**Definition/endurance**: 12-20 reps, 3-4 sets, rest 30-60s'
                    : '**Hypertrophy** (recommended): 8-12 reps, 3-5 sets, rest 60-90s'
            );
            return L(
                `**Guía de series × repeticiones:**\n\n▸ **Fuerza máxima**: 1-5 reps · 4-6 series · descanso 2-5 min\n▸ **Fuerza-hipertrofia**: 5-8 reps · 3-5 series · descanso 2-3 min\n▸ **Hipertrofia**: 8-12 reps · 3-5 series · descanso 60-90s\n▸ **Resistencia muscular**: 12-20 reps · 2-4 series · descanso 30-60s\n\nPara tu objetivo: ${recom}`,
                `**Sets × reps guide:**\n\n▸ **Maximum strength**: 1-5 reps · 4-6 sets · rest 2-5 min\n▸ **Strength-hypertrophy**: 5-8 reps · 3-5 sets · rest 2-3 min\n▸ **Hypertrophy**: 8-12 reps · 3-5 sets · rest 60-90s\n▸ **Muscular endurance**: 12-20 reps · 2-4 sets · rest 30-60s\n\nFor your goal: ${recom}`
            );
        }

        // ── 10. CARGA PROGRESIVA ────────────────────────────────────────
        if (m(/progresion de carga|sobrecarga progresiva|cuando aumento el peso|cuanto peso subir|cuanto aumento|progressive overload|increase weight/)) {
            return L(
                `**Sobrecarga progresiva** — el principio más importante del entrenamiento\n\nFormas de progresar (en orden de prioridad):\n\n▸ **Más repeticiones**: llega al tope del rango antes de subir de peso\n▸ **Más peso**: cuando cumples todas las series/reps con buena técnica por 2 sesiones seguidas\n▸ **Más series**: aumenta el volumen semanal gradualmente\n▸ **Menos descanso**: mismo trabajo en menos tiempo = mayor intensidad relativa\n▸ **Mejor técnica**: más rango de movimiento, más control en la excéntrica\n\n**Regla práctica**: cuando una sesión se siente "fácil" dos entrenamientos consecutivos, es momento de progresar.`,
                `**Progressive overload** — the most important principle in training\n\nWays to progress (in order of priority):\n\n▸ **More reps**: reach the top of the range before increasing weight\n▸ **More weight**: when you complete all sets/reps with good technique for 2 consecutive sessions\n▸ **More sets**: gradually increase weekly volume\n▸ **Less rest**: same work in less time = higher relative intensity\n▸ **Better technique**: greater range of motion, more control in the eccentric\n\n**Practical rule**: when a session feels "easy" for two consecutive workouts, it's time to progress.`
            );
        }

        // ── 11. FRECUENCIA ──────────────────────────────────────────────
        if (m(/cuantos dias.*entreno|cuantos dias.*semana|frecuencia.*entreno|veces por semana|how many days|training frequency|days per week/)) {
            const diasAct = rutina?.dias_por_semana || pd('dias_por_semana');
            return L(
                `**Frecuencia de entrenamiento:**\n\n▸ **Principiante**: 3 días/sem — cuerpo completo en cada sesión\n▸ **Intermedio**: 4 días/sem — upper/lower o push/pull/legs\n▸ **Avanzado**: 5-6 días/sem — splits específicos\n\nPor evidencia: cada grupo muscular debería trabajarse **2 veces/semana** para máxima hipertrofia.${diasAct ? `\n\nTú entrenas **${diasAct} días/semana** — recuerda que la recuperación es tan importante como el entrenamiento mismo.` : ''}`,
                `**Training frequency:**\n\n▸ **Beginner**: 3 days/week — full body each session\n▸ **Intermediate**: 4 days/week — upper/lower or push/pull/legs\n▸ **Advanced**: 5-6 days/week — specific splits\n\nBy evidence: each muscle group should be trained **twice a week** for maximum hypertrophy.${diasAct ? `\n\nYou train **${diasAct} days/week** — remember that recovery is just as important as the training itself.` : ''}`
            );
        }

        // ── 12. CARDIO ──────────────────────────────────────────────────
        if (m(/cardio|correr|running|hiit|liss|aerobico|bici.*cardio|nadar|trotar|caminar|jogging|swim/)) {
            return L(
                `**Tipos de cardio:**\n\n▸ **LISS** (ritmo constante, 30-60 min): bajo impacto, fácil de recuperar, ideal como complemento al entrenamiento de fuerza. Ej: caminata rápida, bici suave, nadar\n▸ **HIIT** (intervalos 20-30 min): alta eficiencia calórica, mejora condición física. Ej: 30s sprint / 90s caminata × 8-12 rondas\n▸ **MISS** (ritmo moderado, 20-40 min): punto medio entre ambos\n\n**Para pesas**: 2-3 sesiones de cardio/sem es suficiente. Si el objetivo es ganar músculo, menos cardio es más.`,
                `**Types of cardio:**\n\n▸ **LISS** (steady state, 30-60 min): low impact, easy to recover from, ideal as a complement to strength training. E.g.: brisk walk, light cycling, swimming\n▸ **HIIT** (intervals 20-30 min): high caloric efficiency, improves fitness. E.g.: 30s sprint / 90s walk × 8-12 rounds\n▸ **MISS** (moderate pace, 20-40 min): middle ground between both\n\n**For weight training**: 2-3 cardio sessions/week is enough. If the goal is muscle gain, less cardio is more.`
            );
        }

        // ── 13. FASES DEL ENTRENAMIENTO ────────────────────────────────
        if (m(/volumen.*fase|fase.*volumen|cutting|bulking|fase.*definicion|definicion.*fase|mantenimiento|bulk|cut|maintenance/)) {
            return L(
                `**Fases del entrenamiento:**\n\n▸ **Volumen (bulking)**: superávit +200-350 kcal, proteína alta, énfasis en fuerza e hipertrofia\n▸ **Definición (cutting)**: déficit -300-500 kcal, proteína muy alta (2.2-2.6g/kg), cardio moderado\n▸ **Recomposición**: calorías de mantenimiento, proteína alta — simultáneo (ideal para principiantes)\n▸ **Mantenimiento**: calorías de mantenimiento, volumen moderado — consolida ganancias\n\nCada fase debe durar mínimo 8-16 semanas para ver resultados reales.`,
                `**Training phases:**\n\n▸ **Bulk**: +200-350 kcal surplus, high protein, emphasis on strength and hypertrophy\n▸ **Cut**: -300-500 kcal deficit, very high protein (2.2-2.6g/kg), moderate cardio\n▸ **Recomposition**: maintenance calories, high protein — simultaneous (ideal for beginners)\n▸ **Maintenance**: maintenance calories, moderate volume — consolidate gains\n\nEach phase should last at least 8-16 weeks to see real results.`
            );
        }

        // ── 14. COMPOSICIÓN CORPORAL / IMC ─────────────────────────────
        if (m(/imc|grasa corporal|porcentaje de grasa|composicion corporal|bascula|cuanto pesa|bmi|body fat|body composition/)) {
            let imcInfo = '';
            const peso = pd('peso'), alt = pd('altura');
            if (peso && alt) {
                const altm = alt / 100;
                const val = (peso / (altm * altm)).toFixed(1);
                const cat = L(
                    val < 18.5 ? 'Bajo peso' : val < 25 ? 'Peso normal' : val < 30 ? 'Sobrepeso' : 'Obesidad',
                    val < 18.5 ? 'Underweight' : val < 25 ? 'Normal weight' : val < 30 ? 'Overweight' : 'Obese'
                );
                imcInfo = L(
                    `\n\nTu IMC actual: **${val}** (${cat}) — recuerda que no distingue músculo de grasa.`,
                    `\n\nYour current BMI: **${val}** (${cat}) — remember it doesn't distinguish muscle from fat.`
                );
            }
            return L(
                `**Composición corporal:**\n\n▸ **% grasa saludable**: hombres 10-20%, mujeres 18-28%\n▸ **% atlético**: hombres 6-13%, mujeres 14-20%\n▸ La báscula puede subir aunque pierdas grasa (si ganas músculo)\n▸ Mide tu progreso con: fotos cada 4 semanas, tallas y rendimiento en el gym${imcInfo}`,
                `**Body composition:**\n\n▸ **Healthy body fat %**: men 10-20%, women 18-28%\n▸ **Athletic %**: men 6-13%, women 14-20%\n▸ The scale can go up even if you lose fat (if you gain muscle)\n▸ Measure your progress with: photos every 4 weeks, measurements, and gym performance${imcInfo}`
            );
        }

        // ── 15. RECOMPOSICIÓN CORPORAL ──────────────────────────────────
        if (m(/recompos|body recomp|ganar musculo.*perder grasa|perder grasa.*ganar musculo/)) {
            return L(
                `**Recomposición corporal** — ganar músculo y perder grasa al mismo tiempo\n\n▸ **Para quién funciona**: principiantes, personas que retoman el entrenamiento, o con alto % de grasa\n▸ **Entrenamiento**: fuerza 3-4 días/sem (hipertrofia, 8-12 reps)\n▸ **Nutrición**: calorías de mantenimiento o leve déficit (-100-200 kcal)\n▸ **Proteína**: alta — 2.0-2.4 g/kg de peso\n▸ **Cardio**: 2-3 sesiones LISS para crear déficit sin destruir músculo\n\nResultados reales en **12-20+ semanas**. Fotos y tallas son mejor indicador que la báscula.`,
                `**Body recomposition** — gaining muscle and losing fat at the same time\n\n▸ **Who it works for**: beginners, people returning to training, or those with high body fat %\n▸ **Training**: strength 3-4 days/week (hypertrophy, 8-12 reps)\n▸ **Nutrition**: maintenance calories or slight deficit (-100-200 kcal)\n▸ **Protein**: high — 2.0-2.4 g/kg body weight\n▸ **Cardio**: 2-3 LISS sessions to create deficit without destroying muscle\n\nReal results in **12-20+ weeks**. Photos and measurements are a better indicator than the scale.`
            );
        }

        // ── 16. MOTIVACIÓN Y PROGRESO ───────────────────────────────────
        if (m(/motiv|progres|resultado|constancia|disciplina|no avanzo|estancado|plateau|motivation|progress|stuck/)) {
            return L(
                `**Progreso y motivación:**\n\n**Tiempos reales de resultados:**\n▸ Fuerza perceptible: **2-4 semanas**\n▸ Cambios musculares: **6-12 semanas**\n▸ Transformación visual clara: **16+ semanas**\n\n**Si estás estancado:**\n▸ Verifica que estás aplicando sobrecarga progresiva\n▸ Revisa que duermes 7-9h y comes suficiente proteína\n▸ Considera cambiar el orden de ejercicios o agregar variaciones\n\nLa constancia supera a la intensidad. Un entrenamiento "imperfecto" que completes vale más que el perfecto que no hiciste.`,
                `**Progress and motivation:**\n\n**Real result timelines:**\n▸ Noticeable strength: **2-4 weeks**\n▸ Muscle changes: **6-12 weeks**\n▸ Clear visual transformation: **16+ weeks**\n\n**If you're stuck:**\n▸ Verify you're applying progressive overload\n▸ Check you're sleeping 7-9h and eating enough protein\n▸ Consider changing exercise order or adding variations\n\nConsistency beats intensity. An "imperfect" workout you complete is worth more than the perfect one you didn't do.`
            );
        }

        // ── 17. PATOLOGÍAS Y CONDICIONES ────────────────────────────────
        if (m(/hernia|hipertension|diabetes|embarazo|asma|osteoporosis|artritis|escoliosis|lesion.*rodilla|lesion.*hombro|hypertension|arthritis|scoliosis|knee.*injury|shoulder.*injury/)) {
            const pat = pd('patologia', 'ninguna');
            const tieneReg = pat !== 'ninguna';
            return L(
                `**Entrenamiento con condiciones médicas:**\n\nStrongVision aplica **582 reglas de seguridad** clínicas que:\n▸ Excluyen ejercicios contraindicados para tu condición\n▸ Sugieren alternativas seguras del mismo grupo muscular\n▸ Ajustan volumen e intensidad según la patología\n▸ Generan advertencias específicas en tu plan\n\n${tieneReg ? `Tu condición registrada **${pat.replace(/_/g,' ')}** ya está siendo considerada en tu rutina.` : 'Si tienes una condición, actualízala en tu **Perfil** para que el sistema la considere.'}\n\n⚠️ Esto no sustituye la supervisión médica o de fisioterapia.`,
                `**Training with medical conditions:**\n\nStrongVision applies **582 clinical safety rules** that:\n▸ Exclude exercises contraindicated for your condition\n▸ Suggest safe alternatives for the same muscle group\n▸ Adjust volume and intensity based on the condition\n▸ Generate specific warnings in your plan\n\n${tieneReg ? `Your registered condition **${pat.replace(/_/g,' ')}** is already being considered in your routine.` : 'If you have a condition, update it in your **Profile** so the system can consider it.'}\n\n⚠️ This does not replace medical or physiotherapy supervision.`
            );
        }

        // ── 18. TÉCNICA GENERAL ─────────────────────────────────────────
        if (m(/tecnica|como hago|forma correcta|ejecutar|ejecucion|postura|technique|how do i|correct form|posture/)) {
            return L(
                `**Principios universales de técnica:**\n\n▸ **Postura neutra**: columna alineada, core activado, articulaciones en posición segura\n▸ **Rango completo**: trabaja todo el recorrido del movimiento\n▸ **Fase excéntrica**: baja/extiende de forma controlada (2-4s) — aquí está gran parte del estímulo\n▸ **Respiración**: exhala en el esfuerzo (concéntrico), inhala al alargar (excéntrico)\n▸ **Conexión mente-músculo**: siente el músculo específico que estás trabajando\n\nDime el ejercicio específico y te explico la ejecución paso a paso.`,
                `**Universal technique principles:**\n\n▸ **Neutral posture**: aligned spine, activated core, joints in a safe position\n▸ **Full range**: work through the complete range of motion\n▸ **Eccentric phase**: lower/extend in a controlled manner (2-4s) — this is where much of the stimulus comes from\n▸ **Breathing**: exhale on effort (concentric), inhale on lengthening (eccentric)\n▸ **Mind-muscle connection**: feel the specific muscle you're working\n\nTell me the specific exercise and I'll explain the execution step by step.`
            );
        }

        // ── 19. ERRORES COMUNES ─────────────────────────────────────────
        if (m(/error|equivocado|mal hecho|malos habitos|que estoy haciendo mal|mistake|wrong|bad habit/)) {
            return L(
                `**Errores más comunes en el entrenamiento:**\n\n▸ **Ego lifting**: subir peso sacrificando técnica → lesiones y poco estímulo real\n▸ **Ignorar la excéntrica**: bajar rápido pierde el 40% del estímulo muscular\n▸ **No calentar**: la forma más rápida de lesionarse\n▸ **Cambiar de programa constantemente**: la consistencia supera cualquier "programa perfecto"\n▸ **Poca proteína**: sin material no hay construcción muscular\n▸ **Solo entrenar lo que se ve**: pecho y bíceps sí, espalda y piernas no → desequilibrio postural\n▸ **Cardio excesivo en volumen**: dificulta la ganancia muscular`,
                `**Most common training mistakes:**\n\n▸ **Ego lifting**: increasing weight at the cost of technique → injuries and little real stimulus\n▸ **Ignoring the eccentric**: lowering fast loses 40% of the muscular stimulus\n▸ **Not warming up**: the fastest way to get injured\n▸ **Constantly changing programs**: consistency beats any "perfect program"\n▸ **Too little protein**: no material means no muscle building\n▸ **Only training what you see**: chest and biceps yes, back and legs no → postural imbalance\n▸ **Excessive cardio during bulk**: makes muscle gain harder`
            );
        }

        // ── AG / CÓMO FUNCIONA LA IA ────────────────────────────────────
        if (m(/algoritmo genetico|genetico|fitness.*ag|fitness.*score|como genera|rutina optima|como funciona.*ia|optimiz|genetic algorithm|how does.*ai|optimize/)) {
            const ag = rutina && rutina.algoritmo_genetico;
            const scoreStr = ag ? L(` (tu rutina alcanzó **${ag.fitness_final.toFixed(1)}/100**)`, ` (your routine reached **${ag.fitness_final.toFixed(1)}/100**)`) : '';
            return L(
                `**Algoritmo Genético de StrongVision${scoreStr}:**\n\n` +
                `Simula la evolución natural para encontrar la combinación óptima de ejercicios:\n\n` +
                `▸ **Población**: 20 variantes generadas desde tu plan base\n` +
                `▸ **Evolución**: hasta 30 generaciones de selección, cruce y mutación\n` +
                `▸ **Selección por torneo**: los mejores se reproducen con mayor probabilidad\n` +
                `▸ **Elitismo**: los 2 mejores siempre pasan a la siguiente generación\n\n` +
                `**4 criterios de aptitud (fitness):**\n` +
                `▸ **Balance muscular** (30 pts): equilibrio pecho↔espalda, volumen por grupo\n` +
                `▸ **Seguridad** (25 pts): impacto articular, carga axial y lesiones de tu perfil\n` +
                `▸ **Progresión** (25 pts): series, reps y descansos óptimos para tu nivel\n` +
                `▸ **Distribución** (20 pts): recuperación entre grupos en días consecutivos\n\n` +
                `El resultado es una rutina científicamente optimizada que respeta las 582 reglas clínicas de seguridad.`,
                `**StrongVision Genetic Algorithm${scoreStr}:**\n\n` +
                `Simulates natural evolution to find the optimal combination of exercises:\n\n` +
                `▸ **Population**: 20 variants generated from your base plan\n` +
                `▸ **Evolution**: up to 30 generations of selection, crossover, and mutation\n` +
                `▸ **Tournament selection**: the best reproduce with higher probability\n` +
                `▸ **Elitism**: the top 2 always pass to the next generation\n\n` +
                `**4 fitness criteria:**\n` +
                `▸ **Muscle balance** (30 pts): chest↔back balance, volume per group\n` +
                `▸ **Safety** (25 pts): joint impact, axial load, and your profile's injuries\n` +
                `▸ **Progression** (25 pts): optimal sets, reps, and rest for your level\n` +
                `▸ **Distribution** (20 pts): recovery between groups on consecutive days\n\n` +
                `The result is a scientifically optimized routine that respects 582 clinical safety rules.`
            );
        }

        // ── 20. SOBRE STRONGVISION ──────────────────────────────────────
        if (m(/strongvision|esta app|esta plataforma|que puedo hacer|funciones|this app|this platform|what can i do|features/)) {
            return L(
                `**StrongVision — tu plataforma de entrenamiento inteligente:**\n\n▸ **Rutina IA** (pipeline de 4 etapas):\n  · Heurística Voraz: selecciona entre 540 rutinas base\n  · Filtro Clínico: verifica 582 reglas de seguridad\n  · Algoritmo Genético: evalúa 600 combinaciones (20×30 generaciones) con fitness de 4 criterios\n  · Heurística Evolutiva: adapta según RPE y molestias del historial\n▸ **Entrenar**: registra cada sesión, guarda RPE y molestias — la IA aprende de tu feedback\n▸ **Progreso**: estadísticas de sesiones, racha, adherencia y evolución\n▸ **Biblioteca**: catálogo completo de ejercicios con filtros\n▸ **Perfil**: tus datos físicos, objetivo y condiciones médicas\n▸ **Asistente IA**: ya lo estás usando — pregúntame lo que necesites\n\nTus datos se guardan localmente en el dispositivo (100% privacidad).`,
                `**StrongVision — your intelligent training platform:**\n\n▸ **AI Routine** (4-stage pipeline):\n  · Greedy Heuristic: selects from 540 base routines\n  · Clinical Filter: verifies 582 safety rules\n  · Genetic Algorithm: evaluates 600 combinations (20×30 generations) with 4 fitness criteria\n  · Evolutionary Heuristic: adapts based on RPE and discomfort history\n▸ **Train**: log each session, save RPE and discomfort — the AI learns from your feedback\n▸ **Progress**: session stats, streak, adherence, and evolution\n▸ **Library**: complete exercise catalog with filters\n▸ **Profile**: your physical data, goal, and medical conditions\n▸ **AI Assistant**: you're already using it — ask me anything\n\nYour data is stored locally on the device (100% privacy).`
            );
        }

        // ── Fallback inteligente ────────────────────────────────────────
        const preview = pregunta.length > 45 ? pregunta.substring(0, 45) + '…' : pregunta;
        return L(
            `No encontré una respuesta exacta para "${preview}", pero puedo ayudarte con:\n\n▸ Ejercicios específicos (press banca, sentadilla, peso muerto, etc.)\n▸ Nutrición y suplementos (proteína, creatina, calorías)\n▸ Series, repeticiones y volumen\n▸ Técnica de ejecución\n▸ Descanso y recuperación\n▸ Lesiones y adaptaciones médicas\n▸ Cardio, fases y motivación\n\nSé más específico y te doy una respuesta detallada.`,
            `I couldn't find an exact answer for "${preview}", but I can help you with:\n\n▸ Specific exercises (bench press, squat, deadlift, etc.)\n▸ Nutrition and supplements (protein, creatine, calories)\n▸ Sets, reps, and volume\n▸ Execution technique\n▸ Rest and recovery\n▸ Injuries and medical adaptations\n▸ Cardio, phases, and motivation\n\nBe more specific and I'll give you a detailed answer.`
        );
    }

    return {
        cargarDatasets,
        generarRutina,
        responderChat,
        // Exponer los algoritmos para testing
        heuristicaVoraz,
        adaptarDias,
        aplicarFiltros,
        validarDistribucionDias,
        algoritmoGenetico,
        heuristicaEvolutiva,
        normalizarPatologia,
        rangoEdad
    };
})();
