/**
 * StrongVision - Dashboard JS
 * ============================
 * Maneja: bienvenida, estadísticas, gamificación, chat IA, insights.
 */

(function() {
    'use strict';

    // Requiere autenticación
    if (!SV_AUTH.requireAuth('../index.html')) return;

    const usuario = SV_STORAGE.obtenerUsuarioActual();
    const isEN = (localStorage.getItem('sv_lang') || 'es-CO') === 'en-US';
    const L = (es, en) => isEN ? en : es;

    document.addEventListener('DOMContentLoaded', () => {
        inicializar();
    });

    function inicializar() {
        // Header de usuario
        document.getElementById('userName').textContent = usuario.nombre.split(' ')[0];
        document.getElementById('avatarLetter').textContent = usuario.nombre.charAt(0).toUpperCase();
        const _greet = document.getElementById('heroGreeting');
        if (_greet) _greet.textContent = L('¡Hola,', 'Hello,');
        const _btnLbl = document.getElementById('btnEntrenarLabel');
        if (_btnLbl) _btnLbl.textContent = L('Iniciar entrenamiento', 'Start Training');
        const _btnRut = document.getElementById('btnVerRutina');
        if (_btnRut) _btnRut.textContent = L('Ver mi rutina', 'View my routine');
        document.getElementById('userAvatar').addEventListener('click', toggleUserMenu);

        // Cerrar dropdown al click fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                document.getElementById('userDropdown')?.classList.remove('open');
            }
        });

        renderEstadisticas();
        renderRutinaActiva();
        renderGamificacion();
        renderSugerencias();
        renderLogros();
        renderBannerMotivacional();

        // Botón Entrenar
        document.getElementById('btnEntrenar').addEventListener('click', () => {
            const rutina = SV_STORAGE.obtenerRutina(usuario.id);
            if (!rutina) {
                mostrarToast(L('Primero genera tu rutina personalizada.', 'First generate your personalized routine.'), 'warning');
                setTimeout(() => window.location.href = 'rutina.html', 1000);
                return;
            }
            window.location.href = 'entrenamiento.html';
        });

        // Welcome message contextual
        const perfil = SV_STORAGE.obtenerPerfil(usuario.id);
        const rutina = SV_STORAGE.obtenerRutina(usuario.id);
        const welcome = document.getElementById('welcomeMsg');
        if (!perfil) {
            welcome.textContent = L('Para empezar, necesitamos algunos datos tuyos. Completa tu perfil físico para que la IA cree tu rutina ideal.', 'To get started, we need some info about you. Complete your physical profile so the AI can create your ideal routine.');
        } else if (!rutina) {
            welcome.textContent = L('Tu perfil está listo. Genera tu primera rutina personalizada con IA.', 'Your profile is ready. Generate your first AI-personalized routine.');
        } else {
            welcome.textContent = L('¿Listo para entrenar? Tu rutina está esperándote.', 'Ready to train? Your routine is waiting for you.');
        }
    }

    function renderEstadisticas() {
        const progreso = SV_STORAGE.obtenerProgreso(usuario.id);
        const gami = SV_STORAGE.obtenerGami(usuario.id);
        const rutina = SV_STORAGE.obtenerRutina(usuario.id);

        document.getElementById('statSesiones').textContent = progreso.sesiones.length;

        // Sesiones de esta semana
        const lunes = lunesEstaSemana();
        const sesionesSemana = progreso.sesiones.filter(s => new Date(s.fecha) >= lunes);
        const objetivoSemana = rutina?.dias_por_semana || 3;
        document.getElementById('statSemana').innerHTML = `${sesionesSemana.length} <small>/ ${objetivoSemana}</small>`;

        const maxGapRacha = Math.ceil(7 / objetivoSemana);
        const rachaEl = document.getElementById('statRacha');
        if (rachaEl) {
            rachaEl.innerHTML = `${gami.racha} <small>${L('días','days')}</small>`;
            rachaEl.closest('.stat-card')?.setAttribute('title',
                L(`Racha basada en tu plan (${objetivoSemana} días/sem). Se mantiene mientras no pases más de ${maxGapRacha} día${maxGapRacha !== 1 ? 's' : ''} sin entrenar.`,
                  `Streak based on your plan (${objetivoSemana} days/week). It holds as long as you don't go more than ${maxGapRacha} day${maxGapRacha !== 1 ? 's' : ''} without training.`));
        }

        // Adherencia (sesiones realizadas / programadas en últimas 4 semanas)
        const hace4Sem = new Date();
        hace4Sem.setDate(hace4Sem.getDate() - 28);
        const sesionesMes = progreso.sesiones.filter(s => new Date(s.fecha) >= hace4Sem);
        const programadas = objetivoSemana * 4;
        const adherencia = programadas > 0 ? Math.min(100, Math.round((sesionesMes.length / programadas) * 100)) : 0;
        document.getElementById('statAdherencia').innerHTML = `${adherencia}<small>%</small>`;
    }

    function renderRutinaActiva() {
        const rutina = SV_STORAGE.obtenerRutina(usuario.id);
        const cont = document.getElementById('rutinaContenido');

        if (!rutina) return; // Ya muestra empty state por defecto

        // Construir resumen
        const totalEjercicios = rutina.sesiones.reduce((acc, s) => acc + s.ejercicios.length, 0);

        const _svCal  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
        const _svTgt  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
        const _svTrnd = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;
        const _svDmb  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5v14"/><path d="M18 5v14"/><path d="M2 9h4"/><path d="M2 15h4"/><path d="M18 9h4"/><path d="M18 15h4"/><path d="M6 12h12"/></svg>`;

        let html = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--sp-sm); margin-bottom: var(--sp-md);">
                <div class="tag info">${_svCal} ${rutina.dias_por_semana} ${L('días/semana','days/week')}</div>
                <div class="tag info">${_svTgt} ${rutina.objetivo === 'recomposicion_corporal' ? L('Recomposición','Recomposition') : capitalize(rutina.objetivo)}</div>
                <div class="tag info">${_svTrnd} ${capitalize(rutina.nivel)}</div>
                <div class="tag info">${_svDmb} ${totalEjercicios} ${L('ejercicios','exercises')}</div>
            </div>
        `;

        if (rutina.advertencias && rutina.advertencias.length > 0) {
            html += `
                <div class="alert warning">
                    <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
                    <div class="alert-content">
                        <strong>${rutina.advertencias.length} ${L('adaptación(es) de seguridad activa(s)','active safety adaptation(s)')}</strong>
                        <small>${L('La IA ha ajustado tu rutina por tus condiciones físicas','The AI has adjusted your routine based on your physical conditions')}</small>
                    </div>
                </div>
            `;
        }

        // Mostrar primer día como preview
        const dia1 = rutina.sesiones[0];
        if (dia1) {
            html += `
                <div style="margin-top: var(--sp-md);">
                    <h3 style="font-size: var(--fs-md); margin-bottom: var(--sp-sm);">${L('Próxima sesión: Día 1','Next session: Day 1')} - ${capitalize(traducirEnfoque(dia1.enfoque).replace(/\+/g, ' + '))}</h3>
                    <div style="display: grid; gap: var(--sp-xs);">
            `;
            dia1.ejercicios.slice(0, 4).forEach(e => {
                const detalle = e.series ? `${e.series}×${e.repeticiones}` : `${e.duracion_min || 10} min`;
                html += `
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: var(--fs-sm);">
                        <span>${escapeHtml(e.nombre)}</span>
                        <span style="color: var(--color-secondary); font-weight: 600;">${detalle}</span>
                    </div>
                `;
            });
            if (dia1.ejercicios.length > 4) {
                html += `<small style="color: var(--color-text-muted);">${L(`y ${dia1.ejercicios.length - 4} ejercicio(s) más...`, `and ${dia1.ejercicios.length - 4} more exercise(s)...`)}</small>`;
            }
            html += '</div></div>';
        }

        cont.innerHTML = html;
    }

    function renderGamificacion() {
        const gami = SV_STORAGE.obtenerGami(usuario.id);
        const xpParaSiguiente = gami.nivel * 100;
        const progresoNivel = Math.min(100, (gami.xp / xpParaSiguiente) * 100);

        document.getElementById('gamiNivel').textContent = gami.nivel;
        document.getElementById('gamiXP').textContent = gami.xp;
        document.getElementById('gamiXPNext').textContent = xpParaSiguiente;
        document.getElementById('gamiBar').style.width = progresoNivel + '%';

        if (gami.racha > 0) {
            document.getElementById('gamiStreak').style.display = 'flex';
            document.getElementById('gamiStreakNum').textContent = gami.racha;
        }
    }

    function renderSugerencias() {
        const rutina = SV_STORAGE.obtenerRutina(usuario.id);
        const cont = document.getElementById('sugerenciasContenido');
        if (!cont) return;

        if (!rutina) {
            const perfil = SV_STORAGE.obtenerPerfil(usuario.id);
            cont.innerHTML = `
                <div class="empty-state">
                    <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg></div>
                    <h3>${L('Sin sugerencias por ahora','No suggestions yet')}</h3>
                    <p>${perfil ? L('Genera tu rutina personalizada para ver las recomendaciones de la IA.','Generate your personalized routine to see AI recommendations.') : L('Completa tu perfil físico y genera tu rutina para recibir sugerencias.','Complete your physical profile and generate your routine to receive suggestions.')}</p>
                    <a href="${perfil ? 'rutina.html' : 'perfil.html'}" class="btn btn-primary">${perfil ? L('Generar rutina','Generate routine') : L('Completar perfil','Complete profile')}</a>
                </div>`;
            return;
        }

        const advertencias = rutina.advertencias || [];
        const fecha = rutina.timestamp ? new Date(rutina.timestamp).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '';

        if (advertencias.length === 0) {
            cont.innerHTML = `
                <p style="color:var(--t2);font-size:var(--fs-sm);margin-bottom:var(--sp-md);">Generadas al crear tu rutina${fecha ? ' · ' + fecha : ''}</p>
                <div class="alert success">
                    <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                    <div class="alert-content">
                        <strong>${L('Tu rutina está optimizada para ti','Your routine is optimized for you')}</strong>
                        <small>${L('La IA no detectó restricciones especiales. Tu plan es apto para tu condición actual.','The AI detected no special restrictions. Your plan is suitable for your current condition.')}</small>
                    </div>
                </div>`;
            return;
        }

        cont.innerHTML = `
            <p style="color:var(--t2);font-size:var(--fs-sm);margin-bottom:var(--sp-md);">Generadas por la IA al crear tu rutina${fecha ? ' · ' + fecha : ''}</p>
            ${advertencias.map(adv => {
                const match = adv.match(/^\[([^\]]+)\]\s*(.*)/s);
                const tipo = match ? match[1] : '';
                const texto = match ? match[2] : adv;
                let alertClass, icon;
                if (tipo === 'Atención') { alertClass = 'warning'; icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`; }
                else if (tipo.startsWith('Adaptación')) { alertClass = 'info'; icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`; }
                else { alertClass = 'warning'; icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`; }
                return `
                    <div class="alert ${alertClass}">
                        <span class="icon">${icon}</span>
                        <div class="alert-content">
                            <strong>${escapeHtml(tipo)}</strong>
                            <small>${escapeHtml(texto)}</small>
                        </div>
                    </div>`;
            }).join('')}
            <div style="margin-top:var(--sp-md);">
                <a href="rutina.html" class="btn btn-secondary btn-sm">${L('Ver rutina completa →','View full routine →')}</a>
            </div>`;
    }

    function renderLogros() {
        const gami = SV_STORAGE.obtenerGami(usuario.id);
        const progreso = SV_STORAGE.obtenerProgreso(usuario.id);
        const preview = document.getElementById('logrosPreview');
        if (!preview) return;

        const desbloqueados = (gami.logros_desbloqueados || []).length;
        const sesiones = progreso.sesiones.length;

        preview.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:var(--sp-sm);margin-top:var(--sp-md);">
                <div class="stat-card">
                    <div class="stat-label">Logros</div>
                    <div class="stat-value">${desbloqueados}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Sesiones</div>
                    <div class="stat-value">${sesiones}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Racha</div>
                    <div class="stat-value">${gami.racha} <small>días</small></div>
                </div>
            </div>
            ${desbloqueados === 0 ? `
            <div class="empty-state" style="padding:var(--sp-lg) 0;">
                <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg></div>
                <h3>${L('Sin logros aún','No achievements yet')}</h3>
                <p>${L('Completa sesiones de entrenamiento para desbloquear tus primeros logros.','Complete training sessions to unlock your first achievements.')}</p>
            </div>` : ''}`;
    }

    function renderBannerMotivacional() {
        const banner = document.getElementById('motivBanner');
        const text = document.getElementById('motivText');
        const frases = isEN ? [
            'Consistency wins. One day at a time.',
            'Every session brings you closer to your best self.',
            "You don't have to be perfect, you just have to start.",
            "Today's effort is tomorrow's progress.",
            'Your only competition is who you were yesterday.',
            'Small consistent steps produce big changes.'
        ] : [
            'La constancia gana. Un día a la vez.',
            'Cada sesión te acerca a tu mejor versión.',
            'No tienes que ser perfecto, solo tienes que empezar.',
            'El esfuerzo de hoy es el progreso de mañana.',
            'Tu única competencia eres tú mismo de ayer.',
            'Pequeños pasos consistentes producen grandes cambios.'
        ];
        text.textContent = frases[Math.floor(Math.random() * frases.length)];
        banner.style.display = 'flex';
    }

    // ===== UTILIDADES =====
    function lunesEstaSemana() {
        const hoy = new Date();
        const dia = hoy.getDay();
        const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
        const lunes = new Date(hoy.setDate(diff));
        lunes.setHours(0,0,0,0);
        return lunes;
    }

    const _muscleES = { pecho: 'chest', hombro: 'shoulder', brazo: 'arm', espalda: 'back', piernas: 'legs', core: 'core', cardio: 'cardio' };
    function traducirEnfoque(str) {
        if (!isEN || !str) return str;
        return str.replace(/\b(pecho|hombro|brazo|espalda|piernas|core|cardio)\b/gi, w => _muscleES[w.toLowerCase()] || w);
    }

    function capitalize(s) {
        return String(s).charAt(0).toUpperCase() + String(s).slice(1).replace(/_/g, ' ');
    }

    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function toggleUserMenu() {
        const dd = document.getElementById('userDropdown');
        const expanded = dd.classList.toggle('open');
        document.getElementById('userAvatar').setAttribute('aria-expanded', expanded);
    }

    window.cerrarSesionApp = function() {
        SV_AUTH.cerrarSesion();
        mostrarToast(L('Sesión cerrada', 'Session closed'), 'info');
        setTimeout(() => window.location.href = '../index.html', 600);
    };

    function mostrarToast(mensaje, tipo = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = mensaje;
        toast.className = `toast show ${tipo}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
})();
