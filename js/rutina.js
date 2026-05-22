/**
 * StrongVision - Rutina JS
 * =========================
 * Cubre RFU-4 (TC-014 a TC-019) y reemplazos (TC-018, TC-036).
 */

(function() {
    'use strict';

    if (!SV_AUTH.requireAuth('../index.html')) return;
    const usuario = SV_STORAGE.obtenerUsuarioActual();
    const isEN = (localStorage.getItem('sv_lang') || 'es-CO') === 'en-US';
    const L = (es, en) => isEN ? en : es;

    let rutinaActual = null;
    let datasetEjercicios = null;

    document.addEventListener('DOMContentLoaded', async () => {
        document.getElementById('avatarLetter').textContent = usuario.nombre.charAt(0).toUpperCase();
        document.getElementById('userAvatar').addEventListener('click', () => {
            document.getElementById('userDropdown').classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                document.getElementById('userDropdown')?.classList.remove('open');
            }
        });

        // Static UI translation
        document.getElementById('pageTitle').textContent       = L('Mi Rutina', 'My Routine');
        const _psEl = document.getElementById('pageSubtitle');
        if (_psEl) _psEl.textContent = L('Diseñada por la IA según tu perfil.', 'Designed by AI based on your profile.');
        const _htEl = document.getElementById('heroTitle');
        if (_htEl) _htEl.textContent = L('Mi Rutina Personalizada', 'My Personalized Routine');
        const _hsEl = document.getElementById('heroSub');
        if (_hsEl) _hsEl.textContent = L(
            'Generada por IA: Heurística Voraz → Filtro Clínico → Algoritmo Genético → Heurística Evolutiva.',
            'AI-generated: Greedy Heuristic → Clinical Filter → Genetic Algorithm → Evolutionary Heuristic.'
        );
        const _spT = document.getElementById('sinPerfilTitle');
        if (_spT) _spT.textContent = L('Necesitas completar tu perfil primero', 'Complete your profile first');
        const _spS = document.getElementById('sinPerfilSub');
        if (_spS) _spS.textContent = L('Para generar una rutina personalizada, primero cuéntanos sobre ti.', 'To generate a personalized routine, first tell us about yourself.');
        const _spB = document.getElementById('sinPerfilBtn');
        if (_spB) _spB.textContent = L('Completar perfil', 'Complete profile');
        const _srT = document.getElementById('sinRutinaTitle');
        if (_srT) _srT.textContent = L('Genera tu primera rutina', 'Generate your first routine');
        const _srS = document.getElementById('sinRutinaSub');
        if (_srS) _srS.innerHTML = L(
            'Nuestro motor de IA ejecuta un pipeline de 4 etapas: selecciona entre <strong>540 rutinas base</strong>, aplica <strong>582 reglas de seguridad</strong>, optimiza con un <strong>Algoritmo Genético</strong> (20 individuos × 30 generaciones) y adapta según tu historial.',
            'Our AI engine runs a 4-stage pipeline: selects from <strong>540 base routines</strong>, applies <strong>582 safety rules</strong>, optimizes with a <strong>Genetic Algorithm</strong> (20 individuals × 30 generations), and adapts to your history.'
        );
        const _bGL = document.getElementById('btnGenerarLabel');
        if (_bGL) _bGL.textContent = L('Generar mi rutina', 'Generate my routine');
        const _bEL = document.getElementById('btnEntrenarLabel');
        if (_bEL) _bEL.textContent = L('Entrenar ahora', 'Train now');
        const _bRL = document.getElementById('btnRegenerarLabel');
        if (_bRL) _bRL.textContent = L('Regenerar', 'Regenerate');
        const _ldT = document.getElementById('loadingTitle');
        if (_ldT) _ldT.textContent = L('Generando tu rutina personalizada...', 'Generating your personalized routine...');
        const _rmT = document.getElementById('reemplazoModalTitle');
        if (_rmT) _rmT.textContent = L('Reemplazar ejercicio', 'Replace exercise');
        const _calH = document.getElementById('calHdrLabel');
        if (_calH) _calH.textContent = L('Calentamiento', 'Warm-up');
        const _estH = document.getElementById('estHdrLabel');
        if (_estH) _estH.textContent = L('Estiramiento final', 'Cool-down');

        const perfil = SV_STORAGE.obtenerPerfil(usuario.id);
        if (!perfil) {
            document.getElementById('sinPerfil').style.display = 'block';
            return;
        }

        // Cargar dataset de ejercicios para opciones de reemplazo
        try {
            const data = window.SV_DATA_EJERCICIOS
                ? window.SV_DATA_EJERCICIOS
                : await fetch('../data/ejercicios.json').then(r => r.json());
            datasetEjercicios = data.ejercicios;
        } catch (e) {
            console.warn('No se pudo cargar dataset de ejercicios:', e);
        }

        const rutina = SV_STORAGE.obtenerRutina(usuario.id);
        const params = new URLSearchParams(window.location.search);

        // Si vienen con ?generar=1 o ?regenerar=1, generar inmediatamente
        if (params.get('generar') === '1' || params.get('regenerar') === '1') {
            await generarRutina();
            return;
        }

        if (rutina) {
            rutinaActual = rutina;
            document.getElementById('conRutina').style.display = 'block';
            renderRutina(rutina);
        } else {
            document.getElementById('sinRutina').style.display = 'block';
        }

        document.getElementById('btnGenerar')?.addEventListener('click', generarRutina);
        document.getElementById('btnRegenerar')?.addEventListener('click', () => {
            if (confirm(L('¿Regenerar tu rutina? Se reemplazará el plan actual con una nueva versión adaptada.', 'Regenerate your routine? The current plan will be replaced with a new adapted version.'))) {
                generarRutina();
            }
            // Re-apply label after potential re-render
            const _bRL2 = document.getElementById('btnRegenerarLabel');
            if (_bRL2) _bRL2.textContent = L('Regenerar', 'Regenerate');
        });
    });

    async function generarRutina() {
        const perfil = SV_STORAGE.obtenerPerfil(usuario.id);
        if (!perfil) {
            window.location.href = 'perfil.html?onboarding=1';
            return;
        }

        document.getElementById('sinRutina').style.display = 'none';
        document.getElementById('conRutina').style.display = 'none';
        document.getElementById('loadingOverlay').style.display = 'flex';

        const stepEl = document.getElementById('loadingStep');
        const steps = isEN ? [
            'Analyzing your physical profile...',
            'Greedy Heuristic — evaluating 540 base routines...',
            'Clinical Filter — verifying 582 safety rules...',
            'Genetic Algorithm — initializing population (20 individuals)...',
            'GA Gen. 1/30 — evaluating initial fitness...',
            'GA — evolving combinations (crossover + mutation)...',
            'GA — optimizing muscle balance and distribution...',
            'GA — converging toward optimal routine...',
            'Evolutionary Heuristic — adapting to your history...',
            'Genetically optimized routine ready'
        ] : [
            'Analizando tu perfil físico...',
            'Heurística voraz — evaluando 540 rutinas base...',
            'Filtro clínico — verificando 582 reglas de seguridad...',
            'Algoritmo Genético — inicializando población (20 individuos)...',
            'AG Gen. 1/30 — evaluando aptitud inicial...',
            'AG — evolucionando combinaciones (cruce + mutación)...',
            'AG — optimizando balance muscular y distribución...',
            'AG — convergiendo hacia la rutina óptima...',
            'Heurística evolutiva — adaptando a tu historial...',
            'Rutina optimizada genéticamente lista'
        ];

        stepEl.textContent = steps[0];
        let i = 0;
        const stepInterval = setInterval(() => {
            i++;
            if (i < steps.length) stepEl.textContent = steps[i];
        }, 300);

        try {
            const historial = SV_STORAGE.obtenerProgreso(usuario.id);
            const rutina = await SV_IA.generarRutina(perfil, historial);

            // Guardar
            SV_STORAGE.guardarRutina(usuario.id, rutina);
            rutinaActual = rutina;

            await sleep(2700);
            clearInterval(stepInterval);
            stepEl.textContent = steps[steps.length - 1];
            await sleep(400);

            document.getElementById('loadingOverlay').style.display = 'none';
            document.getElementById('conRutina').style.display = 'block';
            renderRutina(rutina);
            mostrarToast(L('Rutina generada correctamente', 'Routine generated successfully'), 'success');

            // Limpiar params
            const url = new URL(window.location);
            url.searchParams.delete('generar');
            url.searchParams.delete('regenerar');
            window.history.replaceState({}, '', url);

        } catch (e) {
            clearInterval(stepInterval);
            document.getElementById('loadingOverlay').style.display = 'none';
            mostrarToast(L('Error generando rutina: ', 'Error generating routine: ') + e.message, 'error');
            console.error(e);
            document.getElementById('sinRutina').style.display = 'block';
        }
    }

    // Inline SVG helpers
    const SVG = {
        target:  `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
        bars:    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
        repeat:  `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
        pause:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
        clock:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        refresh: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
        trend:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
        calendar:`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        user:    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        heart:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
        clockBig:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        warn:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    };

    // Objective/level translation maps
    const _objTrad = {
        'hipertrofia':          L('Hipertrofia',          'Hypertrophy'),
        'definicion':           L('Definición',           'Definition'),
        'perdida_peso':         L('Pérdida de peso',      'Weight Loss'),
        'perdida de peso':      L('Pérdida de peso',      'Weight Loss'),
        'fuerza':               L('Fuerza',               'Strength'),
        'resistencia':          L('Resistencia',          'Endurance'),
        'recomposicion_corporal':L('Recomposición corporal','Body Recomposition'),
        'atletismo':            L('Atletismo',            'Athletics'),
        'rehabilitacion':       L('Rehabilitación',       'Rehabilitation'),
    };
    const _nivelTrad = {
        'principiante': L('Principiante', 'Beginner'),
        'intermedio':   L('Intermedio',   'Intermediate'),
        'avanzado':     L('Avanzado',     'Advanced'),
    };

    function traducirAdvertencia(texto) {
        if (!isEN) return texto;
        return texto
            .replace(/Rutina adaptada de (\d+) a (\d+) días\/semana\./gi, 'Routine adapted from $1 to $2 days/week.')
            .replace(/Split:/gi, 'Split:')
            .replace(/dias/gi, 'days')
            .replace(/días/gi, 'days')
            .replace(/semana/gi, 'week')
            .replace(/\[Adaptación etaria\]/gi, '[Age adaptation]')
            .replace(/Jóvenes/gi, 'Youth')
            .replace(/foco en técnica antes que carga/gi, 'focus on technique over load')
            .replace(/evitar sobreentrenamiento/gi, 'avoid overtraining')
            .replace(/Ejercicios de alto impacto ajustados/gi, 'High-impact exercises adjusted')
            .replace(/Cargas reducidas por/gi, 'Loads reduced due to')
            .replace(/Volumen reducido para recuperación/gi, 'Volume reduced for recovery')
            .replace(/Días de descanso adicionales/gi, 'Additional rest days');
    }

    function renderRutina(rutina) {
        const objNombre = _objTrad[rutina.objetivo?.toLowerCase()] || capitalize(rutina.objetivo);
        const nivelNombre = _nivelTrad[rutina.nivel?.toLowerCase()] || capitalize(rutina.nivel);

        document.getElementById('rutinaTitulo').textContent = isEN
            ? `${objNombre} Plan`
            : `Plan de ${objNombre}`;
        document.getElementById('rutinaSubtitulo').textContent = isEN
            ? `${nivelNombre} Level · ${rutina.dias_por_semana} days/week · Generated: ${formatFecha(rutina.timestamp || rutina.generada)}`
            : `Nivel ${nivelNombre} · ${rutina.dias_por_semana} días/semana · Generada: ${formatFecha(rutina.timestamp || rutina.generada)}`;

        // Tags con SVG
        const tags = document.getElementById('rutinaTags');
        tags.innerHTML = `
            <span class="tag info">${SVG.target} ${objNombre}</span>
            <span class="tag info">${SVG.trend} ${nivelNombre}</span>
            <span class="tag info">${SVG.calendar} ${rutina.dias_por_semana} ${L('días', 'days')}</span>
            <span class="tag info">${SVG.user} ${capitalize(rutina.generada_para?.genero || rutina.genero || 'general')}</span>
            ${rutina.generada_para?.patologia && rutina.generada_para.patologia !== 'ninguna'
                ? `<span class="tag warn">${SVG.heart} ${rutina.generada_para.patologia.replace(/_/g, ' ')}</span>` : ''}
            ${rutina.adaptado_a_dias
                ? `<span class="tag success">✓ ${L(`Adaptada a ${rutina.dias_por_semana} días`, `Adapted to ${rutina.dias_por_semana} days`)}</span>` : ''}
        `;

        // Advertencias con SVG
        const advs = document.getElementById('rutinaAdvertencias');
        let advsHtml = '';
        if (rutina.advertencias && rutina.advertencias.length > 0) {
            advsHtml = rutina.advertencias.map(a => `
                <div class="alert warning">
                    <span class="icon">${SVG.warn}</span>
                    <div class="alert-content"><small>${escapeHtml(traducirAdvertencia(a))}</small></div>
                </div>
            `).join('');
        }
        if (rutina.algoritmo_genetico) {
            const ag = rutina.algoritmo_genetico;
            advsHtml += `
                <details style="margin-top: var(--sp-md);">
                    <summary style="cursor:pointer; color: var(--color-primary); font-size: var(--fs-sm); display:flex; align-items:center; gap:0.4rem;">
                        ${SVG.trend} ${L('Ver análisis del Algoritmo Genético', 'View Genetic Algorithm analysis')}
                    </summary>
                    <div style="padding: var(--sp-md); background: var(--color-bg-deep);
                                border-radius: var(--radius-md); margin-top: var(--sp-sm);
                                font-size: var(--fs-xs); display: grid;
                                grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: var(--sp-sm);">
                        <div><strong>${L('Balance muscular', 'Muscle balance')}</strong><br>${ag.fitness_componentes.balance_muscular}/30</div>
                        <div><strong>${L('Seguridad', 'Safety')}</strong><br>${ag.fitness_componentes.seguridad}/25</div>
                        <div><strong>${L('Progresión', 'Progression')}</strong><br>${ag.fitness_componentes.progresion}/25</div>
                        <div><strong>${L('Distribución', 'Distribution')}</strong><br>${ag.fitness_componentes.distribucion}/20</div>
                        <div><strong>${L('Generaciones', 'Generations')}</strong><br>${ag.generaciones_ejecutadas}${ag.convergencia_anticipada ? L(' (convergió)', ' (converged)') : '/30'}</div>
                        <div><strong>${L('Mejora vs base', 'Improvement vs. base')}</strong><br>${ag.mejora_sobre_base > 0 ? '+' : ''}${ag.mejora_sobre_base} pts</div>
                    </div>
                </details>
            `;
        }
        advs.innerHTML = advsHtml;

        // Stats
        const totalEjercicios = rutina.sesiones.reduce((acc, s) => acc + s.ejercicios.length, 0);
        document.getElementById('metaDias').textContent = rutina.dias_por_semana;
        document.getElementById('metaTotal').textContent = totalEjercicios;
        document.getElementById('metaAdaptaciones').textContent = (rutina.advertencias?.length || 0);
        document.getElementById('metaGeneracion').textContent = rutina.evolucion?.generacion || 1;
        document.getElementById('metaFitness').textContent =
            rutina.algoritmo_genetico
                ? rutina.algoritmo_genetico.fitness_final.toFixed(1) + '%'
                : '-';

        // Calentamiento — chips horizontales
        const cal = document.getElementById('calentamientoLista');
        cal.innerHTML = `<div class="warmcool-grid">${(rutina.calentamiento || []).map(c => `
            <div class="wc-chip">
                <div class="wc-chip-icon">${SVG.clockBig}</div>
                <div class="wc-name">${escapeHtml(c.nombre)}</div>
                <span class="wc-dur">${c.duracion_min} min</span>
            </div>
        `).join('')}</div>`;

        // Estiramiento — chips horizontales
        const est = document.getElementById('estiramientoLista');
        est.innerHTML = `<div class="warmcool-grid">${(rutina.estiramiento_final || []).map(e => `
            <div class="wc-chip">
                <div class="wc-chip-icon">${SVG.clockBig}</div>
                <div class="wc-name">${escapeHtml(e.nombre)}</div>
                <span class="wc-dur">${e.duracion_min} min</span>
            </div>
        `).join('')}</div>`;

        // Días
        const diasCont = document.getElementById('diasContenido');
        diasCont.innerHTML = rutina.sesiones.map((sesion, i) => `
            <div class="dia-card">
                <div class="dia-header">
                    <div>
                        <div class="dia-num">${L('Día', 'Day')} ${sesion.dia}</div>
                        <div class="dia-enfoque">${capitalize(traducirEnfoque(sesion.enfoque).replace(/\+/g, ' + '))}</div>
                    </div>
                    <span class="tag info">${SVG.bars} ${sesion.ejercicios.length} ${L('ejercicios','exercises')}</span>
                </div>
                ${sesion.ejercicios.map((ej, j) => renderEjercicio(ej, i, j)).join('')}
            </div>
        `).join('');
    }

    function renderEjercicio(ej, sesionIdx, ejIdx) {
        const detalle = ej.series
            ? `<span class="meta-chip series">${SVG.repeat} ${ej.series} × ${ej.repeticiones}</span>
               <span class="meta-chip rest">${SVG.pause} ${ej.descanso_seg}s ${L('descanso', 'rest')}</span>`
            : `<span class="meta-chip">${SVG.clock} ${ej.duracion_min || 10} min</span>
               <span class="meta-chip">${escapeHtml(ej.intensidad || L('moderada', 'moderate'))}</span>`;

        const changeLabel = L('Cambiar ejercicio', 'Change exercise');
        return `
            <div class="ejercicio-row" data-sesion="${sesionIdx}" data-ej="${ejIdx}">
                <div class="ej-num">${String(ejIdx + 1).padStart(2, '0')}</div>
                <div class="ejercicio-info">
                    <div class="ej-name-row">
                        <h4>${escapeHtml(ej.nombre)}</h4>
                        ${ej.sustituido_de ? `<span class="tag success" style="font-size:0.62rem;padding:1px 7px;">${L('Adaptado', 'Adapted')}</span>` : ''}
                    </div>
                    <div class="ejercicio-meta">
                        <span class="meta-chip">${SVG.target} ${capitalize(ej.grupo)}</span>
                        <span class="meta-chip">${SVG.bars} ${capitalize(ej.equipo || L('libre', 'free'))}</span>
                        ${detalle}
                    </div>
                </div>
                <button class="ej-change-btn" onclick="abrirReemplazo(${sesionIdx},${ejIdx})" title="${changeLabel}" aria-label="${changeLabel}">${SVG.refresh}</button>
            </div>
        `;
    }

    // ===== REEMPLAZO DE EJERCICIO (TC-018, TC-036) =====
    window.abrirReemplazo = function(sesionIdx, ejIdx) {
        if (!rutinaActual || !datasetEjercicios) return;
        const ej = rutinaActual.sesiones[sesionIdx].ejercicios[ejIdx];
        if (!ej) return;

        document.getElementById('reemplazoOriginal').textContent = `${L('Original', 'Original')}: ${ej.nombre}`;
        const cont = document.getElementById('reemplazoOpciones');

        const candidatos = (datasetEjercicios[ej.grupo] || []).filter(c => c.nombre !== ej.nombre);
        if (candidatos.length === 0) {
            cont.innerHTML = `<p style="color: var(--color-text-muted);">${L('No hay alternativas disponibles para este grupo.', 'No alternatives available for this group.')}</p>`;
        } else {
            cont.innerHTML = candidatos.map((c, i) => `
                <button class="btn btn-secondary" style="justify-content: space-between;" onclick="confirmarReemplazo(${sesionIdx},${ejIdx},${i})">
                    <span>${escapeHtml(c.nombre)}</span>
                    <span class="tag info">${capitalize(c.equipo)}</span>
                </button>
            `).join('');
            // Guardar referencia
            cont.dataset.candidatos = JSON.stringify(candidatos);
        }

        const modal = document.getElementById('reemplazoModal');
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    window.confirmarReemplazo = function(sesionIdx, ejIdx, candIdx) {
        const cont = document.getElementById('reemplazoOpciones');
        const candidatos = JSON.parse(cont.dataset.candidatos || '[]');
        const nuevo = candidatos[candIdx];
        if (!nuevo) return;

        const ej = rutinaActual.sesiones[sesionIdx].ejercicios[ejIdx];
        const ejActualizado = {
            ...ej,
            nombre: nuevo.nombre,
            equipo: nuevo.equipo,
            tecnica: `Ejecuta ${nuevo.nombre} con control en fase excéntrica y respiración coordinada.`,
            sustituido_de: ej.nombre
        };
        rutinaActual.sesiones[sesionIdx].ejercicios[ejIdx] = ejActualizado;

        // Persistir
        SV_STORAGE.guardarRutina(usuario.id, rutinaActual);
        cerrarReemplazo();
        renderRutina(rutinaActual);
        mostrarToast(L(`Ejercicio reemplazado por: ${nuevo.nombre}`, `Exercise replaced with: ${nuevo.nombre}`), 'success');
    };

    window.cerrarReemplazo = function() {
        const modal = document.getElementById('reemplazoModal');
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    // ===== UTILIDADES =====
    const _muscleES = { pecho: 'chest', hombro: 'shoulder', brazo: 'arm', espalda: 'back', piernas: 'legs', core: 'core', cardio: 'cardio' };
    function traducirEnfoque(str) {
        if (!isEN || !str) return str;
        return str.replace(/\b(pecho|hombro|brazo|espalda|piernas|core|cardio)\b/gi, w => _muscleES[w.toLowerCase()] || w);
    }

    function capitalize(s) {
        if (!s) return '';
        return String(s).charAt(0).toUpperCase() + String(s).slice(1).replace(/_/g, ' ');
    }

    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    function formatFecha(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString(isEN ? 'en-US' : 'es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function mostrarToast(mensaje, tipo) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = mensaje;
        toast.className = `toast show ${tipo}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    window.cerrarSesionApp = function() {
        SV_AUTH.cerrarSesion();
        setTimeout(() => window.location.href = '../index.html', 300);
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const m = document.getElementById('reemplazoModal');
            if (m?.classList.contains('active')) cerrarReemplazo();
        }
    });
})();
