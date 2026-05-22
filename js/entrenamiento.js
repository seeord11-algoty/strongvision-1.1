/**
 * StrongVision - Modo Entrenamiento (RFU-5)
 * ==========================================
 * Cubre TC-020 a TC-025: sesión guiada paso a paso.
 *
 * Estados:
 * 1. seleccion → escoger día
 * 2. previa → calentamiento + lista
 * 3. ejercicio → ejercicio activo + registro de series
 * 4. descanso → timer
 * 5. resumen → fin con stats + RPE
 */

(function() {
    'use strict';

    if (!SV_AUTH.requireAuth('../index.html')) return;
    const usuario = SV_STORAGE.obtenerUsuarioActual();
    const isEN = (localStorage.getItem('sv_lang') || 'es-CO') === 'en-US';
    const L = (es, en) => isEN ? en : es;

    // Rangos válidos según nivel del usuario
    const RANGOS_NIVEL = {
        principiante: { repsMax: 15, pesoMax: 80,  repsHint: '1 – 15 reps · nivel principiante',        pesoHint: '0 – 80 kg · carga ligera' },
        intermedio:   { repsMax: 20, pesoMax: 150, repsHint: '1 – 20 reps · nivel intermedio',           pesoHint: '0 – 150 kg · carga moderada-alta' },
        avanzado:     { repsMax: 30, pesoMax: 300, repsHint: '1 – 30 reps · nivel avanzado',             pesoHint: '0 – 300 kg · carga alta' }
    };

    function aplicarRangosNivel(nivel) {
        const r = RANGOS_NIVEL[nivel] || RANGOS_NIVEL.principiante;
        const inputReps = document.getElementById('inputReps');
        const inputPeso = document.getElementById('inputPeso');
        const repsHint  = document.getElementById('repsHint');
        const pesoHint  = document.getElementById('pesoEjHint');
        if (inputReps) inputReps.max = r.repsMax;
        if (inputPeso) inputPeso.max = r.pesoMax;
        if (repsHint)  { repsHint.textContent = r.repsHint; repsHint.classList.add('nivel-activo'); }
        if (pesoHint)  { pesoHint.textContent = r.pesoHint; pesoHint.classList.add('nivel-activo'); }
    }

    let rutina = null;
    let sesionActual = null;
    let ejercicioIdx = 0;
    let serieIdx = 0;
    let registrosSesion = [];
    let timerInterval = null;
    let segundosRestantes = 0;
    let inicioSesion = null;
    let rpeSeleccionado = null;
    let molestias = [];

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('avatarLetter').textContent = usuario.nombre.charAt(0).toUpperCase();
        document.getElementById('userAvatar').addEventListener('click', () => {
            document.getElementById('userDropdown').classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                document.getElementById('userDropdown')?.classList.remove('open');
            }
        });

        rutina = SV_STORAGE.obtenerRutina(usuario.id);
        if (!rutina) {
            document.getElementById('sinRutinaScreen').style.display = 'block';
            return;
        }

        const perfilUsuario = SV_STORAGE.obtenerPerfil(usuario.id);
        aplicarRangosNivel(perfilUsuario?.nivel || 'principiante');

        mostrarSeleccion();

        document.getElementById('btnEmpezar').addEventListener('click', empezarPrimerEjercicio);
        document.getElementById('btnSerieCompleta').addEventListener('click', registrarSerie);
        document.getElementById('btnSaltarEjercicio').addEventListener('click', saltarEjercicio);
        document.getElementById('btnVerTecnica').addEventListener('click', verTecnica);
        document.getElementById('btnMolestia').addEventListener('click', () => abrirModal('molestiaModal'));
        document.getElementById('btnSaltarDescanso').addEventListener('click', terminarDescanso);
        document.getElementById('btnAgregarTiempo').addEventListener('click', () => { segundosRestantes += 30; actualizarTimer(); });
        document.getElementById('btnFinalizar').addEventListener('click', finalizarYGuardar);
        document.getElementById('confirmarMolestia').addEventListener('click', confirmarMolestia);

        // RPE
        document.querySelectorAll('.rpe-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.rpe-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                rpeSeleccionado = parseInt(btn.dataset.rpe);
            });
        });
    });

    // ===== PANTALLA: SELECCIÓN DE DÍA =====
    const _svDumbbell = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5v14"/><path d="M18 5v14"/><path d="M6 12h12"/><line x1="2" y1="10" x2="2" y2="14"/><line x1="22" y1="10" x2="22" y2="14"/></svg>`;
    const _svClock   = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    const _svStar    = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    const _svArrow   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

    const _svLock = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

    function mostrarSeleccion() {
        document.body.classList.remove('workout-mode');
        document.body.classList.add('training-bg-active');
        if (window._trbgStart) window._trbgStart();
        ocultarTodas();
        document.getElementById('seleccionScreen').style.display = 'block';
        const cont = document.getElementById('diasSeleccion');

        // Días completados en la rutina actual (ignorar sesiones de rutinas anteriores)
        const progreso = SV_STORAGE.obtenerProgreso(usuario.id);
        const rutinaFecha = rutina.generada ? new Date(rutina.generada) : new Date(0);
        const sesionesDeRutina = progreso.sesiones.filter(s => new Date(s.fecha) >= rutinaFecha);
        const diasCompletados = new Set(sesionesDeRutina.map(s => s.dia));

        // Día desbloqueado si es el primero o si el anterior ya fue completado
        function desbloqueado(numDia) {
            return numDia === 1 || diasCompletados.has(numDia - 1);
        }

        // Próximo día sugerido
        const ultDia = sesionesDeRutina.length > 0 ? sesionesDeRutina[sesionesDeRutina.length - 1].dia : 0;
        const proxDia = (ultDia % rutina.dias_por_semana) + 1;

        cont.innerHTML = rutina.sesiones.map(s => {
            const total      = s.ejercicios.length;
            const sugerido   = s.dia === proxDia;
            const libre      = desbloqueado(s.dia);

            if (!libre) {
                return `
                <div class="dia-card locked" title="${L(`Completa el Día ${s.dia - 1} para desbloquear`, `Complete Day ${s.dia - 1} to unlock`)}">
                    <div class="dc-top">
                        <span class="dc-num">${L('Día','Day')} ${s.dia}</span>
                        <span class="dc-lock-badge">${_svLock} ${L('Bloqueado','Locked')}</span>
                    </div>
                    <div class="dc-title dc-title-locked">${capitalize(traducirEnfoque(s.enfoque).replace(/\+/g, ' + '))}</div>
                    <div class="dc-lock-msg">${L(`Completa el Día ${s.dia - 1} primero`, `Complete Day ${s.dia - 1} first`)}</div>
                    <div class="dc-stats">
                        <span class="dc-stat">${_svDumbbell} ${total} ${L('ejercicios','exercises')}</span>
                        <span class="dc-stat">${_svClock} ~${Math.round(total * 5)} min</span>
                    </div>
                </div>`;
            }

            return `
                <div class="dia-card${sugerido ? ' sugerido' : ''}" onclick="seleccionarDia(${s.dia})">
                    <div class="dc-top">
                        <span class="dc-num">${L('Día','Day')} ${s.dia}</span>
                        ${sugerido ? `<span class="dc-badge">${_svStar} ${L('Sugerido','Suggested')}</span>` : ''}
                    </div>
                    <div class="dc-title">${capitalize(traducirEnfoque(s.enfoque).replace(/\+/g, ' + '))}</div>
                    <div class="dc-stats">
                        <span class="dc-stat">${_svDumbbell} ${total} ${L('ejercicios','exercises')}</span>
                        <span class="dc-stat">${_svClock} ~${Math.round(total * 5)} min</span>
                    </div>
                    <span class="dc-arrow">${_svArrow}</span>
                </div>`;
        }).join('');
    }

    window.seleccionarDia = function(numDia) {
        const progreso = SV_STORAGE.obtenerProgreso(usuario.id);
        const rutinaFecha = rutina.generada ? new Date(rutina.generada) : new Date(0);
        const diasCompletados = new Set(progreso.sesiones.filter(s => new Date(s.fecha) >= rutinaFecha).map(s => s.dia));
        if (numDia > 1 && !diasCompletados.has(numDia - 1)) {
            mostrarToast(L(`Completa el Día ${numDia - 1} primero para desbloquear este.`, `Complete Day ${numDia - 1} first to unlock this one.`), 'warning');
            return;
        }
        sesionActual = rutina.sesiones.find(s => s.dia === numDia);
        if (!sesionActual) return;
        mostrarPrevia();
    };

    // ===== PANTALLA: VISTA PREVIA + CALENTAMIENTO (TC-020) =====
    function mostrarPrevia() {
        document.body.classList.remove('workout-mode');
        document.body.classList.add('training-bg-active');
        if (window._trbgStart) window._trbgStart();
        ocultarTodas();
        document.getElementById('previaScreen').style.display = 'block';
        document.getElementById('previaTitulo').textContent = `${L('Día','Day')} ${sesionActual.dia} - ${capitalize(traducirEnfoque(sesionActual.enfoque).replace(/\+/g, ' + '))}`;
        document.getElementById('previaSubtitulo').textContent = `${sesionActual.ejercicios.length} ${L('ejercicios','exercises')} · ${L('Generación','Generation')} ${rutina.evolucion?.generacion || 1}`;

        // Textos estáticos bilingües
        const warmupTitle = document.getElementById('warmupTitle');
        const warmupSub   = document.getElementById('warmupSub');
        const btnLbl      = document.getElementById('btnEmpezarLabel');
        const btnVolver   = document.getElementById('btnVolverLabel');
        const warmupHint  = document.getElementById('warmupHint');
        if (warmupTitle) warmupTitle.textContent = L('Calentamiento', 'Warm-up');
        if (warmupSub)   warmupSub.textContent   = L('5 – 10 min antes de empezar', '5 – 10 min before starting');
        if (btnVolver)   btnVolver.textContent    = L('Volver a la selección', 'Back to selection');
        const hintText = document.getElementById('warmupHintText');
        if (hintText) hintText.textContent = L('Completa el calentamiento para continuar.', 'Complete the warm-up to continue.');

        // Mapa de traducción de nombres de calentamiento
        const _calTrad = {
            'Movilidad articular general':     L('Movilidad articular general',     'General joint mobility'),
            'Cardio suave (caminata o bici)':  L('Cardio suave (caminata o bici)',  'Light cardio (walk or bike)'),
            'Estiramientos dinámicos':         L('Estiramientos dinámicos',         'Dynamic stretching'),
            'Activación muscular':             L('Activación muscular',             'Muscle activation'),
            'Movilidad de cadera':             L('Movilidad de cadera',             'Hip mobility'),
            'Rotación de hombros':             L('Rotación de hombros',             'Shoulder rotation'),
        };

        // Calentamiento checklist — bloqueante
        const btnEmpezar = document.getElementById('btnEmpezar');
        btnEmpezar.disabled = true;
        btnEmpezar.style.opacity = '0.45';
        btnEmpezar.style.cursor  = 'not-allowed';
        if (btnLbl) btnLbl.textContent = L('¡Listo! Empecemos', 'READY! LET\'S GO');
        if (warmupHint) {
            warmupHint.style.display = 'block';
            warmupHint.textContent = L('Completa el calentamiento antes de continuar.', 'Complete the warm-up before continuing.');
        }

        const calItems = rutina.calentamiento || [];
        const calCheck = document.getElementById('calentamientoCheck');
        calCheck.innerHTML = calItems.map(c => {
            const nombre = _calTrad[c.nombre] || escapeHtml(c.nombre);
            return `<li onclick="toggleCheck(this)">${nombre} (${c.duracion_min} min)</li>`;
        }).join('');

        // Contador de progreso inicial
        const progEl = document.getElementById('warmupProgress');
        if (progEl) progEl.textContent = `0 / ${calItems.length}`;

        // Contador y lista de ejercicios
        const total = sesionActual.ejercicios.length;
        const cntEl = document.getElementById('prevEjCount');
        if (cntEl) cntEl.textContent = total;

        const lista = document.getElementById('ejerciciosPreviewLista');
        lista.innerHTML = sesionActual.ejercicios.map((e, i) => {
            const detalle = e.series ? `${e.series}×${e.repeticiones}` : `${e.duracion_min || 10} min`;
            return `
                <div class="prev-ej-card">
                    <div class="prev-ej-num">${i + 1}</div>
                    <div class="prev-ej-body">
                        <div class="prev-ej-name">${escapeHtml(e.nombre)}</div>
                        <div class="prev-ej-group">${capitalize(e.grupo)}</div>
                    </div>
                    <div class="prev-ej-series">${detalle}</div>
                </div>
            `;
        }).join('');
    }

    window.toggleCheck = function(li) {
        li.classList.toggle('done');
        const items  = document.querySelectorAll('#calentamientoCheck li');
        const done   = [...items].filter(el => el.classList.contains('done')).length;
        const todos  = done === items.length;
        const btn    = document.getElementById('btnEmpezar');
        const hint   = document.getElementById('warmupHint');
        const progEl = document.getElementById('warmupProgress');

        btn.disabled = !todos;
        if (progEl) progEl.textContent = todos
            ? '✓'
            : `${done} / ${items.length}`;
        if (hint) hint.style.display = todos ? 'none' : 'flex';
    };

    function empezarPrimerEjercicio() {
        ejercicioIdx = 0;
        serieIdx = 0;
        registrosSesion = [];
        molestias = [];
        rpeSeleccionado = null;
        inicioSesion = Date.now();
        document.body.classList.add('workout-mode');
        mostrarEjercicio();
    }

    // ===== PANTALLA: EJERCICIO ACTIVO (TC-021) =====
    function mostrarEjercicio() {
        ocultarTodas();
        document.getElementById('ejercicioScreen').style.display = 'block';
        const ej = sesionActual.ejercicios[ejercicioIdx];
        if (!ej) return finalizarSesion();

        // Progreso
        const totalEj = sesionActual.ejercicios.length;
        const progreso = ((ejercicioIdx) / totalEj) * 100;
        document.getElementById('progressBar').style.width = progreso + '%';
        document.getElementById('counterEjercicio').textContent = L(`Ejercicio ${ejercicioIdx + 1} de ${totalEj}`, `Exercise ${ejercicioIdx + 1} of ${totalEj}`);
        const wtProg = document.getElementById('wtProgress');
        if (wtProg) wtProg.textContent = L(`Ejercicio ${ejercicioIdx + 1} de ${totalEj}`, `Exercise ${ejercicioIdx + 1} of ${totalEj}`) + ` · ${capitalize(traducirEnfoque(sesionActual.enfoque).replace(/\+/g, '+'))}`;
        document.getElementById('grupoEjercicio').textContent = (ej.grupo || '').toUpperCase();
        document.getElementById('nombreEjercicio').textContent = ej.nombre;

        if (ej.series) {
            document.getElementById('metaSeries').textContent = ej.series;
            document.getElementById('metaReps').textContent = ej.repeticiones;
            document.getElementById('metaDescanso').textContent = (ej.descanso_seg || 60) + 's';
            document.getElementById('serieRegistro').style.display = 'block';
            document.getElementById('serieActual').textContent = serieIdx + 1;
            document.getElementById('serieTotal').textContent = ej.series;
            // Sugerir reps según rango
            const repsSugeridas = parseInt(String(ej.repeticiones).split('-')[0]) || 10;
            document.getElementById('inputReps').value = repsSugeridas;
        } else {
            // Cardio
            document.getElementById('metaSeries').textContent = '1';
            document.getElementById('metaReps').textContent = ej.duracion_min + ' min';
            document.getElementById('metaDescanso').textContent = '0s';
            document.getElementById('serieRegistro').style.display = 'none';
        }

        document.getElementById('tecnicaTexto').textContent = traducirTecnica(ej.tecnica, ej.nombre) || L(`Ejecuta ${ej.nombre} con técnica adecuada y control del movimiento.`, `Perform ${(window.SV_I18N ? window.SV_I18N.t(ej.nombre) : ej.nombre)} with proper technique and movement control.`);
    }

    // ===== REGISTRO DE SERIE (TC-021) =====
    function registrarSerie() {
        const ej = sesionActual.ejercicios[ejercicioIdx];
        if (!ej) return;

        if (ej.series) {
            const inputRepsEl = document.getElementById('inputReps');
            const inputPesoEl = document.getElementById('inputPeso');
            const reps = parseInt(inputRepsEl.value) || 0;
            const peso = parseFloat(inputPesoEl.value) || 0;

            const maxReps = parseInt(inputRepsEl.max) || 50;
            const maxPeso = parseFloat(inputPesoEl.max) || 500;

            if (reps < 1 || reps > maxReps) {
                mostrarToast(L(`Reps fuera de rango (1 – ${maxReps})`, `Reps out of range (1 – ${maxReps})`), 'warning');
                inputRepsEl.focus();
                return;
            }
            if (peso < 0 || peso > maxPeso) {
                mostrarToast(L(`Peso fuera de rango (0 – ${maxPeso} kg)`, `Weight out of range (0 – ${maxPeso} kg)`), 'warning');
                inputPesoEl.focus();
                return;
            }

            // Guardar serie
            const reg = registrosSesion.find(r => r.ejercicio === ej.nombre);
            if (reg) {
                reg.series_realizadas.push({ reps, peso });
            } else {
                registrosSesion.push({
                    ejercicio: ej.nombre,
                    grupo: ej.grupo,
                    series_realizadas: [{ reps, peps: peso, peso }]
                });
            }

            serieIdx++;
            if (serieIdx >= ej.series) {
                // Pasar al siguiente ejercicio
                serieIdx = 0;
                ejercicioIdx++;
                if (ejercicioIdx >= sesionActual.ejercicios.length) {
                    finalizarSesion();
                } else {
                    iniciarDescanso(ej.descanso_seg || 60, true);
                }
            } else {
                iniciarDescanso(ej.descanso_seg || 60, false);
            }
        } else {
            // Cardio
            registrosSesion.push({
                ejercicio: ej.nombre,
                grupo: ej.grupo,
                duracion_min: ej.duracion_min || 10
            });
            ejercicioIdx++;
            if (ejercicioIdx >= sesionActual.ejercicios.length) {
                finalizarSesion();
            } else {
                mostrarEjercicio();
            }
        }
    }

    function saltarEjercicioConfirmado() {
        const ej = sesionActual.ejercicios[ejercicioIdx];
        registrosSesion.push({ ejercicio: ej.nombre, grupo: ej.grupo, omitido: true });
        serieIdx = 0;
        ejercicioIdx++;
        if (ejercicioIdx >= sesionActual.ejercicios.length) {
            finalizarSesion();
        } else {
            mostrarEjercicio();
        }
    }

    function saltarEjercicio() {
        mostrarConfirm(L('¿Saltar ejercicio?', 'Skip exercise?'), L('Se registrará como omitido en tu sesión.', 'It will be logged as skipped in your session.'), 'skip', saltarEjercicioConfirmado);
    }

    // ===== DESCANSO =====
    function iniciarDescanso(segundos, esCambioEjercicio) {
        ocultarTodas();
        document.getElementById('descansoScreen').style.display = 'block';
        segundosRestantes = segundos;
        actualizarTimer();
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            segundosRestantes--;
            actualizarTimer();
            if (segundosRestantes <= 0) {
                terminarDescanso();
            }
        }, 1000);
    }

    function actualizarTimer() {
        const min = Math.floor(segundosRestantes / 60);
        const seg = segundosRestantes % 60;
        document.getElementById('timerDisplay').textContent =
            `${String(min).padStart(2,'0')}:${String(seg).padStart(2,'0')}`;
    }

    function terminarDescanso() {
        clearInterval(timerInterval);
        mostrarEjercicio();
    }

    // ===== TÉCNICA (TC-022) =====
    function verTecnica() {
        const ej = sesionActual.ejercicios[ejercicioIdx];
        if (!ej) return;
        document.getElementById('tecnicaTitulo').textContent = ej.nombre;
        document.getElementById('tecnicaContenido').innerHTML = `
            <p><strong>${L('Grupo muscular','Muscle group')}:</strong> ${capitalize(ej.grupo)}</p>
            <p><strong>${L('Equipo','Equipment')}:</strong> ${capitalize(ej.equipo || L('libre','free'))}</p>
            ${ej.series ? `<p><strong>${L('Volumen','Volume')}:</strong> ${ej.series} ${L('series','sets')} × ${ej.repeticiones} ${L('repeticiones','reps')}</p>` : ''}
            <p><strong>${L('Descanso entre series','Rest between sets')}:</strong> ${ej.descanso_seg || 60} ${L('segundos','seconds')}</p>
            <hr style="margin: var(--sp-md) 0; border: 0; border-top: 1px solid var(--color-border);">
            <h3 style="font-size: var(--fs-md); margin-bottom: var(--sp-sm);">${L('Ejecución correcta','Correct execution')}</h3>
            <p>${traducirTecnica(ej.tecnica, ej.nombre) || L('Ejecuta el movimiento con control y rango completo.','Execute the movement with control and full range of motion.')}</p>
            <h3 style="font-size: var(--fs-md); margin: var(--sp-md) 0 var(--sp-sm);">${L('Errores comunes a evitar','Common mistakes to avoid')}</h3>
            <ul style="padding-left: 1.5rem; color: var(--color-text-muted);">
                <li>${L('No uses impulso ni rebotes','Do not use momentum or bouncing')}</li>
                <li>${L('Mantén la columna en posición neutra','Keep your spine in a neutral position')}</li>
                <li>${L('Coordina la respiración: exhala en el esfuerzo, inhala al regresar','Coordinate breathing: exhale on effort, inhale on return')}</li>
                <li>${L('Si sientes dolor articular agudo, detente','If you feel sharp joint pain, stop immediately')}</li>
            </ul>
        `;
        abrirModal('tecnicaModal');
    }

    window.cerrarTecnica = function() {
        cerrarModal('tecnicaModal');
    };

    // ===== MOLESTIA (TC-025) =====
    function confirmarMolestia() {
        const zona = document.querySelector('input[name="zona"]:checked')?.value;
        if (!zona) {
            mostrarToast(L('Selecciona una zona.', 'Select a zone.'), 'warning');
            return;
        }
        const ej = sesionActual.ejercicios[ejercicioIdx];
        molestias.push({ zona, ejercicio: ej?.nombre });
        SV_STORAGE.registrarMolestia(usuario.id, zona, ej?.nombre);
        cerrarModal('molestiaModal');
        mostrarToast(L(`Molestia en ${zona} registrada. La IA adaptará tu próxima rutina.`, `Discomfort in ${zona} logged. The AI will adapt your next routine.`), 'warning', 4000);

        // Sugerir parar o cambiar
        mostrarConfirm(L('¿Saltar este ejercicio?', 'Skip this exercise?'), L(`Reportaste molestia en ${zona}. Recomendamos omitirlo.`, `You reported discomfort in ${zona}. We recommend skipping it.`), 'warn', saltarEjercicioConfirmado);
    }

    window.cerrarMolestia = function() {
        cerrarModal('molestiaModal');
    };

    // ===== FIN DE SESIÓN (TC-023) =====
    function finalizarSesion() {
        ocultarTodas();
        document.getElementById('resumenScreen').style.display = 'block';
        const wtProg = document.getElementById('wtProgress');
        if (wtProg) wtProg.textContent = L('Sesión completada', 'Session completed');

        const completados = registrosSesion.filter(r => !r.omitido).length;
        const total = sesionActual.ejercicios.length;
        const tiempoMin = Math.round((Date.now() - inicioSesion) / 60000);
        const calorias = estimarCalorias(tiempoMin);
        const xpGanada = calcularXP(completados, total, molestias.length);

        document.getElementById('resEjercicios').textContent = completados;
        document.getElementById('resTotal').textContent = total;
        document.getElementById('resTiempo').innerHTML = `${tiempoMin}<small>min</small>`;
        document.getElementById('resCalorias').textContent = calorias;
        document.getElementById('resXP').textContent = '+' + xpGanada;

        // Verificar logros
        const logroNuevo = verificarLogros(xpGanada);
        if (logroNuevo) {
            document.getElementById('logroDesbloqueado').style.display = 'flex';
            document.getElementById('logroTexto').textContent = logroNuevo;
        }

        // Pre-seleccionar RPE 7
        document.querySelector('.rpe-btn[data-rpe="7"]').classList.add('selected');
        rpeSeleccionado = 7;
    }

    function finalizarYGuardar() {
        const completados = registrosSesion.filter(r => !r.omitido).length;
        const total = sesionActual.ejercicios.length;
        const tiempoMin = Math.round((Date.now() - inicioSesion) / 60000);
        const calorias = estimarCalorias(tiempoMin);
        const xpGanada = calcularXP(completados, total, molestias.length);

        // Registrar sesión en progreso
        SV_STORAGE.registrarSesion(usuario.id, {
            dia: sesionActual.dia,
            enfoque: sesionActual.enfoque,
            ejercicios_realizados: completados,
            ejercicios_total: total,
            duracion_min: tiempoMin,
            calorias,
            rpe: rpeSeleccionado,
            registros: registrosSesion,
            molestias_reportadas: molestias.length
        });

        // Actualizar gamificación
        const gami = SV_STORAGE.obtenerGami(usuario.id);
        gami.xp += xpGanada;

        // Actualizar racha — tolerancia basada en días de plan seleccionados
        // Ej: 3 días/sem → gap máximo permitido = ceil(7/3) = 3 días entre sesiones
        const diasPorSemana = (rutina && rutina.dias_por_semana) ? rutina.dias_por_semana : 3;
        const maxGapDias = Math.ceil(7 / diasPorSemana);

        const hoy = new Date().toDateString();
        const ult = gami.ultima_sesion ? new Date(gami.ultima_sesion).toDateString() : null;
        if (ult === hoy) {
            // Ya entrenó hoy, no incrementar racha
        } else {
            if (ult) {
                const diffMs   = Date.now() - new Date(gami.ultima_sesion).getTime();
                const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (diffDias <= maxGapDias) {
                    gami.racha++;
                } else {
                    gami.racha = 1;
                }
            } else {
                gami.racha = 1;
            }
            gami.ultima_sesion = new Date().toISOString();
        }

        // Subir nivel
        const xpNecesaria = gami.nivel * 100;
        if (gami.xp >= xpNecesaria) {
            gami.xp -= xpNecesaria;
            gami.nivel++;
            mostrarToast(L(`🎉 ¡Subiste a nivel ${gami.nivel}!`, `🎉 You reached level ${gami.nivel}!`), 'success', 4000);
        }

        // Logros
        const logros = calcularNuevosLogros(gami);
        gami.logros = [...new Set([...(gami.logros || []), ...logros])];

        SV_STORAGE.guardarGami(usuario.id, gami);

        mostrarToast(L('¡Sesión guardada exitosamente! 💪', 'Session saved successfully! 💪'), 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
    }

    function estimarCalorias(min) {
        const perfil = SV_STORAGE.obtenerPerfil(usuario.id);
        const kcalPorMin = perfil?.objetivo === 'recomposicion_corporal' ? 9 : 7;
        return min * kcalPorMin;
    }

    function calcularXP(completados, total, molestiasCount) {
        let xp = completados * 10;
        if (completados === total) xp += 30; // bonus por completar todo
        if (molestiasCount === 0) xp += 5; // bonus sin molestias
        return xp;
    }

    function verificarLogros(xpGanada) {
        const gami = SV_STORAGE.obtenerGami(usuario.id);
        const totalSesiones = SV_STORAGE.obtenerProgreso(usuario.id).sesiones.length + 1;

        if (totalSesiones === 1 && !gami.logros.includes('primer_paso')) {
            return L('👣 "Primer paso" — Completaste tu primera sesión', '👣 "First step" — You completed your first session');
        }
        if (gami.racha + 1 === 7 && !gami.logros.includes('racha_7')) {
            return L('⚡ "7 días seguidos" — Una semana de constancia', '⚡ "7 days in a row" — A week of consistency');
        }
        if (totalSesiones === 10 && !gami.logros.includes('sesiones_10')) {
            return L('💪 "10 sesiones" — Ya estás en marcha', '💪 "10 sessions" — You\'re on your way');
        }
        return null;
    }

    function calcularNuevosLogros(gami) {
        const logros = [];
        const totalSesiones = SV_STORAGE.obtenerProgreso(usuario.id).sesiones.length;
        if (totalSesiones >= 1) logros.push('primer_paso');
        if (gami.racha >= 3) logros.push('racha_3');
        if (gami.racha >= 7) logros.push('racha_7');
        if (gami.racha >= 30) logros.push('racha_30');
        if (totalSesiones >= 10) logros.push('sesiones_10');
        if (totalSesiones >= 50) logros.push('sesiones_50');
        if (gami.nivel >= 5) logros.push('nivel_5');
        if (gami.nivel >= 10) logros.push('nivel_10');
        return logros;
    }

    // ===== UTILIDADES =====
    function ocultarTodas() {
        ['sinRutinaScreen', 'seleccionScreen', 'previaScreen', 'ejercicioScreen', 'descansoScreen', 'resumenScreen']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
    }

    window.volverASeleccion = function() {
        mostrarConfirm(L('¿Volver a la selección?', 'Go back to selection?'), L('El progreso actual de esta sesión no se guardará.', 'Current progress of this session will not be saved.'), 'warn', () => {
            clearInterval(timerInterval);
            mostrarSeleccion();
        });
    };

    window.salirModoWorkout = function() {
        mostrarConfirm(L('¿Salir del entrenamiento?', 'Exit workout?'), L('El progreso de esta sesión no se guardará.', 'Progress of this session will not be saved.'), 'warn', () => {
            clearInterval(timerInterval);
            document.body.classList.remove('workout-mode');
            mostrarSeleccion();
        });
    };

    function abrirModal(id) {
        const m = document.getElementById(id);
        if (!m) return;
        m.classList.add('active');
        m.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function cerrarModal(id) {
        const m = document.getElementById(id);
        if (!m) return;
        m.classList.remove('active');
        m.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function capitalize(s) {
        if (!s) return '';
        return String(s).charAt(0).toUpperCase() + String(s).slice(1).replace(/_/g, ' ');
    }

    const _muscleES = { pecho: 'chest', hombro: 'shoulder', brazo: 'arm', espalda: 'back', piernas: 'legs', core: 'core', cardio: 'cardio' };
    function traducirEnfoque(str) {
        if (!isEN || !str) return str;
        return str.replace(/\b(pecho|hombro|brazo|espalda|piernas|core|cardio)\b/gi, w => _muscleES[w.toLowerCase()] || w);
    }

    function traducirTecnica(texto, nombre) {
        if (!isEN || !texto) return texto;
        const enName = (window.SV_I18N ? window.SV_I18N.t(nombre) : null) || nombre;
        return `Perform ${enName} with eccentric phase control (2–3s) and coordinated breathing.`;
    }

    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    function mostrarToast(mensaje, tipo, dur = 3000) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = mensaje;
        toast.className = `toast show ${tipo}`;
        setTimeout(() => toast.classList.remove('show'), dur);
    }

    window.cerrarSesionApp = function() {
        SV_AUTH.cerrarSesion();
        setTimeout(() => window.location.href = '../index.html', 300);
    };

    // ===== DETECCIÓN DE RUTINA ACTUALIZADA =====
    // Detecta si se generó una nueva rutina (desde rutina.html u otra pestaña)
    // y refresca la pantalla de selección automáticamente.
    function _checkRutinaActualizada() {
        if (document.body.classList.contains('workout-mode')) return;
        const rutinaFresh = SV_STORAGE.obtenerRutina(usuario.id);
        const genActual = rutina ? rutina.generada : null;
        const genFresh  = rutinaFresh ? rutinaFresh.generada : null;
        if (!rutinaFresh) return;
        if (genFresh !== genActual) {
            rutina = rutinaFresh;
            document.getElementById('sinRutinaScreen').style.display = 'none';
            mostrarSeleccion();
        }
    }

    // Al volver al tab (usuario estaba en rutina.html en otro tab)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') _checkRutinaActualizada();
    });

    // Al restaurar la página desde bfcache (botón atrás del navegador)
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) _checkRutinaActualizada();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ['tecnicaModal', 'molestiaModal'].forEach(id => {
                if (document.getElementById(id)?.classList.contains('active')) cerrarModal(id);
            });
        }
    });

    // ===== MODAL CONFIRMACIÓN CUSTOM =====
    let _confirmCb = null;

    function mostrarConfirm(titulo, mensaje, tipo, callback) {
        _confirmCb = callback;
        document.getElementById('confirmTitle').textContent = titulo;
        document.getElementById('confirmMsg').textContent  = mensaje;
        // Cambiar icono según tipo
        const wrap = document.getElementById('confirmIconWrap');
        if (tipo === 'skip') {
            wrap.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>`;
            wrap.style.background = 'rgba(255,214,10,.1)';
            wrap.style.borderColor = 'rgba(255,214,10,.3)';
            wrap.style.color = 'var(--y,#FFD60A)';
        } else {
            wrap.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
            wrap.style.background = 'rgba(249,115,22,.1)';
            wrap.style.borderColor = 'rgba(249,115,22,.3)';
            wrap.style.color = '#f97316';
        }
        document.getElementById('confirmYesBtn').onclick = confirmarSi;
        abrirModal('confirmModal');
    }

    function confirmarSi() {
        cerrarModal('confirmModal');
        if (_confirmCb) { _confirmCb(); _confirmCb = null; }
    }

    window.confirmarNo = function() {
        cerrarModal('confirmModal');
        _confirmCb = null;
    };
})();
