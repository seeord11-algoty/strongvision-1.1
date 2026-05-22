/**
 * StrongVision - Biblioteca JS
 * =============================
 * Cubre RFU-10: TC-034 (búsqueda por músculo), TC-035 (filtro equipo), TC-036 (detalle).
 */

(function() {
    'use strict';

    if (!SV_AUTH.requireAuth('../index.html')) return;
    const usuario = SV_STORAGE.obtenerUsuarioActual();

    let todosEjercicios = [];

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

        // Cargar dataset
        try {
            const data = window.SV_DATA_EJERCICIOS
                ? window.SV_DATA_EJERCICIOS
                : await fetch('../data/ejercicios.json').then(r => r.json());
            todosEjercicios = [];
            Object.entries(data.ejercicios).forEach(([grupo, lista]) => {
                lista.forEach(ej => {
                    todosEjercicios.push({ ...ej, grupo });
                });
            });
            renderResultados();
        } catch (e) {
            console.error('Error cargando ejercicios:', e);
            mostrarToast('Error cargando biblioteca', 'error');
        }

        // Filtros
        document.getElementById('busqueda').addEventListener('input', renderResultados);
        document.getElementById('filtroGrupo').addEventListener('change', renderResultados);
        document.getElementById('filtroEquipo').addEventListener('change', renderResultados);
    });

    function renderResultados() {
        const q = document.getElementById('busqueda').value.toLowerCase().trim();
        const grupo = document.getElementById('filtroGrupo').value;
        const equipo = document.getElementById('filtroEquipo').value;

        let resultados = todosEjercicios.filter(ej => {
            if (q && !ej.nombre.toLowerCase().includes(q)) return false;
            if (grupo && ej.grupo !== grupo) return false;
            if (equipo && ej.equipo !== equipo) return false;
            return true;
        });

        const cont = document.getElementById('resultadosGrid');
        const sinR = document.getElementById('sinResultados');
        const count = document.getElementById('resultadoCount');

        count.textContent = `${resultados.length} ejercicios encontrados`;

        if (resultados.length === 0) {
            cont.innerHTML = '';
            cont.style.display = 'none';
            sinR.style.display = 'block';
            return;
        }
        cont.style.display = 'grid';
        sinR.style.display = 'none';

        cont.innerHTML = resultados.map((ej, i) => {
            const idx = todosEjercicios.indexOf(ej);
            return `
                <div class="card" style="cursor:pointer; transition: transform var(--transition-fast);" onclick="verDetalle(${idx})">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--sp-sm);">
                        <h3 style="font-size: var(--fs-md); margin: 0;">${escapeHtml(ej.nombre)}</h3>
                        <span class="bib-grupo-icon" style="opacity:.7;">${iconoGrupo(ej.grupo)}</span>
                    </div>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: var(--sp-sm);">
                        <span class="tag info">${capitalize(ej.grupo)}</span>
                        <span class="tag">${capitalize(ej.equipo)}</span>
                    </div>
                    <div style="display: flex; gap: var(--sp-sm); font-size: var(--fs-xs); color: var(--color-text-muted); flex-wrap: wrap; align-items:center;">
                        <span style="display:inline-flex;align-items:center;gap:3px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Impacto: ${capitalize(ej.impacto || 'medio')}</span>
                        ${ej.carga_axial ? '<span class="tag warn" style="display:inline-flex;align-items:center;gap:3px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Carga axial</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    window.verDetalle = function(idx) {
        const ej = todosEjercicios[idx];
        if (!ej) return;

        document.getElementById('detalleNombre').textContent = ej.nombre;
        document.getElementById('detalleGrupo').textContent = `Grupo: ${capitalize(ej.grupo)} · Equipo: ${capitalize(ej.equipo)}`;

        const tags = document.getElementById('detalleTags');
        tags.innerHTML = `
            <span class="tag info" style="display:inline-flex;align-items:center;gap:4px;">${iconoGrupo(ej.grupo)} ${capitalize(ej.grupo)}</span>
            <span class="tag info" style="display:inline-flex;align-items:center;gap:4px;">${iconoEquipo(ej.equipo)} ${capitalize(ej.equipo)}</span>
            <span class="tag ${ej.impacto === 'alto' ? 'warn' : 'success'}" style="display:inline-flex;align-items:center;gap:4px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Impacto ${ej.impacto || 'medio'}</span>
            ${ej.carga_axial
                ? '<span class="tag warn" style="display:inline-flex;align-items:center;gap:4px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Carga axial</span>'
                : '<span class="tag success" style="display:inline-flex;align-items:center;gap:4px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Sin carga axial</span>'}
        `;

        // Muscle Wiki enlace externo
        const mwUrl = getMuscleWikiUrl(ej);
        const mwBtn = document.getElementById('muscleWikiBtn');
        const mwIcon = document.getElementById('muscleWikiIcon');
        const mwDesc = document.getElementById('muscleWikiDesc');
        if (mwBtn) mwBtn.href = mwUrl;
        if (mwIcon) mwIcon.innerHTML = SVG_GRUPOS[ej.grupo] ? `<div style="width:56px;height:56px;border-radius:14px;background:rgba(255,214,10,.1);display:flex;align-items:center;justify-content:center;color:var(--y,#FFD60A);">${SVG_GRUPOS[ej.grupo]}</div>` : mwIcon.innerHTML;
        if (mwDesc) mwDesc.textContent = `Ver la animación 3D de "${ej.nombre}" en MuscleWiki.`;

        document.getElementById('detalleTecnica').innerHTML = generarTecnicaDetallada(ej);
        document.getElementById('detalleErrores').innerHTML = generarErroresComunes(ej).map(e => `<li>${escapeHtml(e)}</li>`).join('');
        document.getElementById('detalleRecomendaciones').innerHTML = generarRecomendaciones(ej);

        const modal = document.getElementById('detalleModal');
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    // ===== MUSCLE WIKI =====
    function getMuscleWikiUrl(ej) {
        const grupoEn = { pecho:'chest', espalda:'back', piernas:'legs', hombro:'shoulders', brazo:'arms', core:'abs', cardio:'cardio' };
        const grupo = grupoEn[ej.grupo] || 'chest';
        const mapa = {
            'press de banca': 'barbell-bench-press',
            'press banca plano': 'barbell-bench-press',
            'press de banca inclinado': 'incline-barbell-bench-press',
            'press inclinado con barra': 'incline-barbell-bench-press',
            'press de banca declinado': 'decline-barbell-bench-press',
            'press de pecho con mancuernas': 'dumbbell-bench-press',
            'aperturas con mancuernas': 'dumbbell-flyes',
            'fondos en paralelas': 'chest-dips',
            'dominadas': 'pull-ups',
            'jalón al pecho': 'lat-pulldown',
            'remo con barra': 'bent-over-barbell-row',
            'remo con mancuerna': 'one-arm-dumbbell-row',
            'peso muerto': 'deadlift',
            'peso muerto rumano': 'romanian-deadlift',
            'sentadilla': 'barbell-squat',
            'sentadilla con barra': 'barbell-squat',
            'sentadilla goblet': 'goblet-squat',
            'press de piernas': 'leg-press',
            'extensión de cuádriceps': 'leg-extension',
            'curl de femoral': 'lying-leg-curl',
            'zancadas': 'walking-lunges',
            'prensa de piernas': 'leg-press',
            'press militar': 'barbell-overhead-press',
            'press de hombro': 'dumbbell-shoulder-press',
            'elevaciones laterales': 'dumbbell-lateral-raise',
            'elevación frontal': 'dumbbell-front-raise',
            'curl de bíceps con barra': 'barbell-bicep-curl',
            'curl con mancuernas': 'dumbbell-bicep-curl',
            'curl de bíceps': 'barbell-bicep-curl',
            'press francés': 'ez-bar-skullcrusher',
            'extensión de tríceps en polea': 'tricep-pushdown',
            'fondos de tríceps': 'tricep-dips',
            'plancha': 'plank',
            'crunch': 'crunch',
            'crunch en polea': 'cable-crunch',
            'abdominales': 'crunch',
            'elevación de piernas': 'hanging-leg-raise',
            'hip thrust': 'barbell-hip-thrust',
        };
        const nombre = ej.nombre.toLowerCase();
        const slug = mapa[nombre];
        if (slug) return `https://musclewiki.com/exercises/male/${grupo}/${slug}`;
        // Fallback: search with exercise name
        return `https://musclewiki.com/?q=${encodeURIComponent(ej.nombre)}`;
    }

    window.cerrarDetalle = function() {
        const modal = document.getElementById('detalleModal');
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    window.limpiarFiltros = function() {
        document.getElementById('busqueda').value = '';
        document.getElementById('filtroGrupo').value = '';
        document.getElementById('filtroEquipo').value = '';
        renderResultados();
    };

    // ===== TÉCNICA DETALLADA (heurística basada en propiedades) =====
    function generarTecnicaDetallada(ej) {
        const grupo = ej.grupo;
        const eq = ej.equipo;
        const partes = [];

        partes.push('<strong>1. Posición inicial:</strong> ');
        if (grupo === 'pecho') partes[partes.length-1] += 'recuéstate sobre el banco con los pies firmes en el suelo, escápulas retraídas y cabeza apoyada. Mantén una ligera curvatura natural en la zona lumbar.';
        else if (grupo === 'espalda') partes[partes.length-1] += 'cuerpo en posición neutra, columna alineada, escápulas retraídas hacia atrás y abajo, core activado para estabilizar.';
        else if (grupo === 'piernas') partes[partes.length-1] += 'pies a la anchura de los hombros, peso distribuido entre talones y mediopié, columna neutra y mirada al frente.';
        else if (grupo === 'hombro') partes[partes.length-1] += 'cuerpo erguido, core activado, escápulas estabilizadas y codos en posición ligeramente adelantada para proteger las articulaciones.';
        else if (grupo === 'brazo') partes[partes.length-1] += 'codos pegados al torso, hombros relajados y muñecas neutras. No bloquees los codos en la fase final.';
        else if (grupo === 'core') partes[partes.length-1] += 'columna en posición neutra, glúteos contraídos y respiración controlada. Evita compensar con cuello o caderas.';
        else partes[partes.length-1] += 'mantén una postura erguida y alineada, con respiración controlada.';

        partes.push('<br><br><strong>2. Ejecución:</strong> realiza el movimiento con control en la fase excéntrica (descenso o regreso) durante 2-3 segundos. Coordina la respiración: <strong>exhala</strong> en el esfuerzo (fase concéntrica) e <strong>inhala</strong> al regresar a la posición inicial.');

        partes.push('<br><br><strong>3. Rango de movimiento:</strong> trabaja el rango completo sin comprometer la técnica. Si no puedes completar el rango con buena forma, reduce la carga.');

        if (eq === 'barra') {
            partes.push('<br><br><strong>4. Agarre:</strong> firme pero no excesivo. Pulgares envueltos alrededor de la barra (agarre seguro). La barra debe descansar sobre la palma, no sobre los dedos.');
        } else if (eq === 'mancuerna') {
            partes.push('<br><br><strong>4. Equilibrio bilateral:</strong> trabaja ambos lados con la misma carga y velocidad. Las mancuernas permiten mayor rango de movimiento que la barra; aprovéchalo sin comprometer la estabilidad.');
        }

        return partes.join('');
    }

    function generarErroresComunes(ej) {
        const errores = [
            'Usar impulso o "rebotar" para completar las repeticiones — reduce el estímulo y aumenta el riesgo de lesión',
            'Bloquear las articulaciones en la fase final del movimiento',
            'Respirar de forma irregular o aguantar la respiración (Valsalva prolongada)'
        ];
        if (ej.grupo === 'piernas' || ej.carga_axial) {
            errores.push('Permitir que las rodillas colapsen hacia adentro (valgo dinámico)');
            errores.push('Perder la curvatura natural de la columna ("espalda redonda")');
        }
        if (ej.grupo === 'pecho' || ej.grupo === 'hombro') {
            errores.push('Elevar los hombros hacia las orejas durante el esfuerzo');
            errores.push('No retraer las escápulas, generando inestabilidad');
        }
        if (ej.grupo === 'espalda') {
            errores.push('Tirar con los brazos en lugar de iniciar el movimiento desde la espalda');
        }
        if (ej.grupo === 'brazo') {
            errores.push('Mover los codos hacia adelante o hacia atrás (deben permanecer fijos)');
        }
        return errores;
    }

    function generarRecomendaciones(ej) {
        const recs = [];
        recs.push(`<p>📊 <strong>Volumen sugerido:</strong> 3-4 series de 8-12 repeticiones para hipertrofia, 4-6 series de 3-6 repeticiones para fuerza, 2-3 series de 15+ repeticiones para resistencia.</p>`);
        recs.push(`<p>⏸️ <strong>Descanso entre series:</strong> 60-90 segundos para hipertrofia, 2-3 minutos para fuerza, 30-45 segundos para resistencia.</p>`);
        if (ej.carga_axial || ej.impacto === 'alto') {
            recs.push(`<p class="alert warning" style="display: block; margin-top: var(--sp-sm);">⚠️ <strong>Precaución:</strong> este ejercicio implica ${ej.carga_axial ? 'carga axial sobre la columna' : 'alto impacto articular'}. No se recomienda en caso de lesiones lumbares, hernia discal, problemas articulares o en personas mayores sin supervisión.</p>`);
        }
        recs.push(`<p><strong>Asistencia:</strong> ${ej.equipo === 'barra' && (ej.grupo === 'pecho' || ej.grupo === 'piernas') ? 'considera tener un compañero de seguridad (spotter) para series cercanas al fallo muscular.' : 'puedes ejecutarlo de forma autónoma, manteniendo siempre la técnica.'}</p>`);
        return recs.join('');
    }

    // ===== UTILIDADES =====
    const SVG_GRUPOS = {
        pecho:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9c0-1.5 1.5-3 3-3s3 1.5 3 3v6c0 1.5-1.5 3-3 3s-3-1.5-3-3V9z"/><path d="M15 9c0-1.5 1.5-3 3-3s3 1.5 3 3v6c0 1.5-1.5 3-3 3s-3-1.5-3-3V9z"/><path d="M6 12h12"/></svg>`,
        espalda: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M8 6l4-4 4 4"/><path d="M8 10h8"/><path d="M9 14h6"/><path d="M10 18h4"/></svg>`,
        piernas: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v9l-2 9"/><path d="M16 3v9l2 9"/><path d="M8 12h8"/></svg>`,
        hombro:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/><path d="M4 11c0-2 1-4 4-5"/><path d="M20 11c0-2-1-4-4-5"/></svg>`,
        brazo:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5a6 6 0 0 1 11 0"/><path d="M6.5 6.5C5 8 4 10.5 5 13l1 3 3 1 3-1 1-3c1-2.5 0-5-1.5-6.5"/><path d="M9 17v4"/><path d="M15 17v4"/></svg>`,
        core:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="5" ry="8"/><path d="M12 4v16"/><path d="M4 12h16"/></svg>`,
        cardio:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    };
    const SVG_DEFAULT_GRUPO = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="9" width="3" height="6" rx="1.5"/><rect x="5" y="7" width="2.5" height="10" rx="1"/><line x1="7.5" y1="12" x2="16.5" y2="12"/><rect x="16.5" y="7" width="2.5" height="10" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1.5"/></svg>`;

    const SVG_EQUIPOS = {
        barra:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="9" width="3" height="6" rx="1.5"/><rect x="5" y="7" width="2.5" height="10" rx="1"/><line x1="7.5" y1="12" x2="16.5" y2="12"/><rect x="16.5" y="7" width="2.5" height="10" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1.5"/></svg>`,
        mancuerna: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="10" width="3" height="4" rx="1"/><rect x="5" y="8" width="2" height="8" rx="1"/><line x1="7" y1="12" x2="17" y2="12"/><rect x="17" y="8" width="2" height="8" rx="1"/><rect x="19" y="10" width="3" height="4" rx="1"/></svg>`,
        polea:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><path d="M12 8v8"/><path d="M8 20h8"/><path d="M10 16l2 4 2-4"/></svg>`,
        maquina:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 3v6"/><path d="M15 3v6"/><path d="M9 15v6"/><path d="M15 15v6"/></svg>`,
        ninguno:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    };

    function iconoGrupo(g) { return SVG_GRUPOS[g] || SVG_DEFAULT_GRUPO; }
    function iconoEquipo(eq) { return SVG_EQUIPOS[eq] || SVG_EQUIPOS.barra; }
    function capitalize(s) {
        if (!s) return '';
        return String(s).charAt(0).toUpperCase() + String(s).slice(1).replace(/_/g, ' ');
    }
    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
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
            const m = document.getElementById('detalleModal');
            if (m?.classList.contains('active')) cerrarDetalle();
        }
    });
})();
