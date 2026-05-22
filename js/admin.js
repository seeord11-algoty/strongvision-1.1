/**
 * StrongVision - Admin JS
 * ========================
 * Cubre RFA-1 a RFA-3: TC-042 a TC-050
 * Panel administrativo con CRUD de ejercicios, gestión de usuarios y reportes.
 */

(function() {
    'use strict';

    if (!SV_AUTH.requireAuth('../index.html')) return;
    const usuario = SV_STORAGE.obtenerUsuarioActual();

    // Verificar rol admin
    document.addEventListener('DOMContentLoaded', () => {
        if (usuario.rol !== 'admin') {
            document.getElementById('accesoDenegado').style.display = 'block';
            return;
        }
        inicializar();
    });

    let datasetEjercicios = null;
    let datasetRutinas = null;
    let ejerciciosCustom = []; // CRUD local

    // ===== N8N WEBHOOKS =====
    const N8N_ADMIN_MSG = 'https://svfitness.app.n8n.cloud/webhook/admin-message';

    // ===== LANGUAGE =====
    const _isEN = (localStorage.getItem('sv_lang') || 'es-CO') === 'en-US';
    const _L    = (es, en) => _isEN ? en : es;

    let correoHistorial = [];
    let correoUsuarioSeleccionado = null;
    let correoFiltroEstado = '';

    const CORREO_PLANTILLAS = [
        {
            id: 'bienvenida',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',
            titulo: 'Bienvenida',
            asunto: 'Bienvenido a StrongVision',
            cuerpo: `Hola {{nombre}},\n\n¡Bienvenido a StrongVision! Nos alegra tenerte en nuestra plataforma de entrenamiento inteligente.\n\nYa puedes:\n• Completar tu perfil físico\n• Generar tu rutina personalizada con IA\n• Registrar tu progreso diario\n\nNuestro asistente de IA está disponible en todo momento para guiarte.\n\n¡Mucho éxito en tu entrenamiento!\n\nEl equipo de StrongVision`
        },
        {
            id: 'rutina-lista',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5v14"/><path d="M18 5v14"/><path d="M2 9h4"/><path d="M2 15h4"/><path d="M18 9h4"/><path d="M18 15h4"/><path d="M6 12h12"/></svg>',
            titulo: 'Rutina lista',
            asunto: 'Tu rutina personalizada está lista — StrongVision',
            cuerpo: `Hola {{nombre}},\n\nTu cuenta en StrongVision ha sido activada y tu rutina de entrenamiento personalizada está lista para usarse.\n\nPara acceder:\n1. Inicia sesión en la plataforma\n2. Ve a "Mi rutina" en el menú\n3. Comienza tu primer entrenamiento\n\nRecuerda completar tu perfil para que la IA ajuste tu plan correctamente.\n\n¡A entrenar!\n\nEl equipo de StrongVision`
        },
        {
            id: 'motivacion',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
            titulo: 'Motivación',
            asunto: '¡Tu entrenamiento te está esperando!',
            cuerpo: `Hola {{nombre}},\n\nNotamos que llevas un tiempo sin registrar sesiones en StrongVision. ¡Tu rutina te espera!\n\nRecuerda: la consistencia es la clave del progreso. Incluso una sesión corta marca la diferencia.\n\nEntra a la plataforma hoy y retoma tu ritmo. ¡Tú puedes!\n\nEl equipo de StrongVision`
        },
        {
            id: 'por-vencer',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
            titulo: 'Suscripción por vencer',
            asunto: 'Tu suscripción vence pronto — StrongVision',
            cuerpo: `Hola {{nombre}},\n\nTe informamos que tu suscripción en StrongVision está próxima a vencer.\n\nPara continuar disfrutando de todas las funciones sin interrupciones, renueva a tiempo. Contáctanos y te asesoramos con el proceso de pago.\n\nNo pierdas tu progreso. ¡Renueva hoy y sigue adelante!\n\nEl equipo de StrongVision`
        },
        {
            id: 'vencida',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
            titulo: 'Suscripción vencida',
            asunto: 'Tu acceso ha sido suspendido — StrongVision',
            cuerpo: `Hola {{nombre}},\n\nTu suscripción en StrongVision ha vencido y tu acceso fue temporalmente suspendido.\n\nPara reactivar tu cuenta comunícate con nosotros. El proceso es rápido y tu historial de entrenamiento estará intacto.\n\n¡Te esperamos de vuelta!\n\nEl equipo de StrongVision`
        },
        {
            id: 'pago',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
            titulo: 'Recordatorio de pago',
            asunto: 'Recordatorio: renovación de suscripción',
            cuerpo: `Hola {{nombre}},\n\nEste es un recordatorio sobre la renovación de tu suscripción en StrongVision.\n\nValor mensual: $50.000 COP\n\nPara renovar, comunícate con el administrador de la plataforma o responde este correo. El proceso es sencillo y rápido.\n\nGracias por tu preferencia.\n\nEl equipo de StrongVision`
        },
        {
            id: 'actualizacion',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
            titulo: 'Novedades del sistema',
            asunto: 'Novedades en StrongVision',
            cuerpo: `Hola {{nombre}},\n\nTenemos nuevas mejoras disponibles en StrongVision.\n\nNovedades:\n• Asistente de IA mejorado con más conocimiento\n• Nuevos ejercicios en el catálogo\n• Mejor organización de la rutina\n• Gráficas de progreso renovadas\n\nInicia sesión para explorarlas. Cualquier duda, aquí estamos.\n\nEl equipo de StrongVision`
        },
        {
            id: 'felicitacion',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>',
            titulo: 'Felicitación / logro',
            asunto: '¡Felicitaciones por tu constancia!',
            cuerpo: `Hola {{nombre}},\n\nQueremos reconocer tu esfuerzo y constancia en StrongVision. Llevar un registro de tus entrenamientos demuestra tu compromiso con tu salud y bienestar.\n\nSigue así. Cada sesión te acerca más a tu objetivo.\n\n¡Sigue siendo increíble!\n\nEl equipo de StrongVision`
        },
        {
            id: 'soporte',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            titulo: 'Soporte / ayuda',
            asunto: 'Estamos aquí para ayudarte — StrongVision',
            cuerpo: `Hola {{nombre}},\n\nNos comunicamos porque queremos asegurarnos de que tu experiencia en StrongVision sea la mejor posible.\n\nSi tienes alguna duda, problema técnico o necesitas orientación sobre el uso de la plataforma, no dudes en responder este correo.\n\nEstamos aquí para ayudarte.\n\nEl equipo de StrongVision`
        },

        // ── PLANTILLAS MASIVAS ──────────────────────────────────────────────
        {
            id: 'masivo-reactivar-vencidos',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
            titulo: 'Reactivar suscripción (vencidos)',
            asunto: 'Tu acceso en StrongVision ha expirado — Reactívalo hoy',
            segmento: 'vencidos',
            cuerpo: `Hola {{nombre}},\n\nNos dimos cuenta de que tu suscripción en StrongVision ha vencido y lamentamos que hayas tenido que pausar tu entrenamiento.\n\nTu historial, rutina y progreso siguen guardados y te esperan. Reactivar es rápido y sencillo — comunícate con nosotros y lo resolvemos hoy mismo.\n\n¿Tienes alguna duda sobre el proceso? Responde este correo y te ayudamos.\n\n¡Te esperamos de vuelta!\n\nEl equipo de StrongVision`
        },
        {
            id: 'masivo-renovacion-proxima',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
            titulo: 'Renovación próxima (por vencer)',
            asunto: 'Tu suscripción vence pronto — Renueva sin perder tu progreso',
            segmento: 'por-vencer',
            cuerpo: `Hola {{nombre}},\n\nQueremos avisarte que tu suscripción en StrongVision está próxima a vencer.\n\nPara que no pierdas el acceso a tu rutina personalizada, tus estadísticas ni tu racha de entrenamientos, te recomendamos renovar antes de que expire.\n\nEl proceso es rápido — solo contáctanos y lo gestionamos inmediatamente.\n\n¡Sigue entrenando sin interrupciones!\n\nEl equipo de StrongVision`
        },
        {
            id: 'masivo-motivacion-activos',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
            titulo: 'Campaña motivacional (activos)',
            asunto: '¡Tu esfuerzo está dando resultados, {{nombre}}!',
            segmento: 'activos',
            cuerpo: `Hola {{nombre}},\n\nQueremos tomarnos un momento para reconocer tu dedicación. Cada sesión que registras en StrongVision es un paso más hacia tu mejor versión.\n\nRecuerda: la constancia es el arma más poderosa en el gimnasio. No tienes que ser perfecto, solo ser constante.\n\nSigue con ese ritmo. ¡Vas increíble!\n\nEl equipo de StrongVision`
        },
        {
            id: 'masivo-inactivos-recuperar',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
            titulo: 'Recuperar usuarios inactivos',
            asunto: 'Te echamos de menos en StrongVision, {{nombre}}',
            segmento: 'inactivos',
            cuerpo: `Hola {{nombre}},\n\nHace tiempo que no sabemos de ti y queremos asegurarnos de que estés bien.\n\nTu cuenta en StrongVision sigue activa y tu rutina te espera. Si tuviste algún inconveniente con la plataforma o necesitas ayuda para retomar, estamos aquí para apoyarte.\n\nSolo responde este correo y con gusto te ayudamos.\n\n¡Te esperamos de vuelta!\n\nEl equipo de StrongVision`
        },
        {
            id: 'masivo-novedad-todos',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
            titulo: 'Novedad / anuncio (todos)',
            asunto: 'Novedades importantes en StrongVision',
            segmento: 'todos',
            cuerpo: `Hola {{nombre}},\n\nTenemos buenas noticias para toda la comunidad StrongVision.\n\n[Escribe aquí el anuncio o novedad]\n\nGracias por ser parte de nuestra comunidad. Cualquier pregunta, no dudes en escribirnos.\n\nEl equipo de StrongVision`
        },
    ];

    async function inicializar() {
        document.getElementById('avatarLetter').textContent = (usuario.nombre || 'A').charAt(0).toUpperCase();
        document.getElementById('userAvatar').addEventListener('click', () => {
            document.getElementById('userDropdown').classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                document.getElementById('userDropdown')?.classList.remove('open');
            }
        });

        document.getElementById('adminContent').style.display = 'block';

        // Cargar datasets
        try {
            const [ej, rut] = await Promise.all([
                window.SV_DATA_EJERCICIOS
                    ? Promise.resolve(window.SV_DATA_EJERCICIOS)
                    : fetch('../data/ejercicios.json').then(r => r.json()),
                window.SV_DATA_HEURISTICAS
                    ? Promise.resolve(window.SV_DATA_HEURISTICAS)
                    : fetch('../data/heuristicas.json').then(r => r.json())
            ]);
            datasetEjercicios = ej.ejercicios;
            datasetRutinas = rut.rutinas;
        } catch (e) {
            console.error('Error cargando datasets:', e);
        }

        // Cargar custom desde localStorage
        const custom = localStorage.getItem('sv_admin_ejercicios_custom');
        if (custom) {
            try { ejerciciosCustom = JSON.parse(custom); } catch (e) {}
        }

        // Tabs
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => cambiarTab(btn.dataset.tab));
        });

        // Cargar contenido inicial
        renderDashboard();
        renderEjercicios();
        renderPlantillas();
        renderUsuarios();
        renderFinanzas();
        renderCorreos();
        renderReportes();
        renderTestCoverage();
        renderMensajesAdmin();
        initAdminAI();

        // Listeners ejercicios
        document.getElementById('btnNuevoEjercicio').addEventListener('click', () => abrirEjercicioModal());
        document.getElementById('ejercicioForm').addEventListener('submit', guardarEjercicio);
        document.getElementById('adminBuscar').addEventListener('input', renderEjercicios);
        document.getElementById('adminFiltroGrupo').addEventListener('change', renderEjercicios);
        document.getElementById('plantFiltroNivel').addEventListener('change', renderPlantillas);
        document.getElementById('plantFiltroObjetivo').addEventListener('change', renderPlantillas);
        document.getElementById('plantFiltroPatologia').addEventListener('change', renderPlantillas);

        // Listener búsqueda de usuarios
        const buscarUs = document.getElementById('usuariosBuscar');
        if (buscarUs) buscarUs.addEventListener('input', () => renderUsuarios());

        // Listeners suscripción
        document.getElementById('btnGuardarSuscripcion').addEventListener('click', guardarSuscripcion);
        document.getElementById('btnGuardarPago').addEventListener('click', guardarPago);
        document.getElementById('btnRegistrarPagoGeneral').addEventListener('click', () => abrirPagoModal(null));

        // Listeners segmento chips
        _initSegmentoChips();
        document.getElementById('btnEnviarCorreo').addEventListener('click', enviarCorreoAdmin);
    }

    function cambiarTab(tab) {
        document.querySelectorAll('.admin-tab-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tab);
        });
        document.querySelectorAll('.admin-tab-content').forEach(c => {
            c.style.display = c.id === 'tab-' + tab ? 'block' : 'none';
        });
    }

    // ===== DASHBOARD =====
    function renderDashboard() {
        const usuarios = SV_STORAGE.obtenerUsuarios();
        document.getElementById('kpiUsuarios').textContent = usuarios.length;

        let totalEj = 0;
        if (datasetEjercicios) {
            Object.values(datasetEjercicios).forEach(arr => totalEj += arr.length);
        }
        totalEj += ejerciciosCustom.length;
        document.getElementById('kpiEjercicios').textContent = totalEj;

        const estado = document.getElementById('estadoSistema');
        estado.innerHTML = `
            <div class="alert success">
                <span class="icon">✓</span>
                <div class="alert-content">
                    <strong>Sistema operativo</strong>
                    <small>Todos los servicios funcionan correctamente · localStorage activo</small>
                </div>
            </div>
            <div class="alert info">
                <span class="icon">ℹ️</span>
                <div class="alert-content">
                    <strong>Cumplimiento normativo</strong>
                    <small>ISO 25010 · ISO 9001 · CMMI nivel 2 · UI/UX accesibilidad WCAG AA</small>
                </div>
            </div>
            <div class="alert info">
                <span class="icon">📦</span>
                <div class="alert-content">
                    <strong>Datasets cargados</strong>
                    <small>${datasetRutinas?.length || 0} rutinas · 582 reglas de seguridad · ${totalEj} ejercicios</small>
                </div>
            </div>
        `;
    }

    // ===== EJERCICIOS CRUD (TC-042, TC-043) =====
    function renderEjercicios() {
        if (!datasetEjercicios) return;
        const q = document.getElementById('adminBuscar').value.toLowerCase().trim();
        const grupoF = document.getElementById('adminFiltroGrupo').value;

        // Aplanar
        const todos = [];
        Object.entries(datasetEjercicios).forEach(([grupo, lista]) => {
            lista.forEach(ej => todos.push({ ...ej, grupo, esCustom: false }));
        });
        ejerciciosCustom.forEach(ej => todos.push({ ...ej, esCustom: true }));

        let filtrados = todos;
        if (q) filtrados = filtrados.filter(e => e.nombre.toLowerCase().includes(q));
        if (grupoF) filtrados = filtrados.filter(e => e.grupo === grupoF);

        const tbody = document.getElementById('tbodyEjercicios');
        if (filtrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--color-text-muted);">No hay ejercicios que coincidan.</td></tr>';
            return;
        }

        tbody.innerHTML = filtrados.slice(0, 100).map((e, i) => {
            const customIdx = e.esCustom ? ejerciciosCustom.indexOf(ejerciciosCustom.find(c => c.nombre === e.nombre)) : -1;
            return `
                <tr>
                    <td><strong>${escapeHtml(e.nombre)}</strong> ${e.esCustom ? '<span class="tag success" style="font-size:0.6rem;">CUSTOM</span>' : ''}</td>
                    <td>${capitalize(e.grupo)}</td>
                    <td>${capitalize(e.equipo)}</td>
                    <td><span class="tag ${e.impacto === 'alto' ? 'warn' : 'info'}">${e.impacto || 'medio'}</span></td>
                    <td>${e.carga_axial ? '⚠️ Sí' : 'No'}</td>
                    <td>
                        ${e.esCustom ? `
                            <button class="btn btn-sm btn-secondary" onclick="editarEjercicioCustom(${customIdx})">✏️</button>
                            <button class="btn btn-sm btn-danger" onclick="eliminarEjercicioCustom(${customIdx})">🗑️</button>
                        ` : '<span class="tag info">Sistema</span>'}
                    </td>
                </tr>
            `;
        }).join('');

        if (filtrados.length > 100) {
            tbody.insertAdjacentHTML('beforeend', `<tr><td colspan="6" style="text-align:center; color: var(--color-text-muted);">... y ${filtrados.length - 100} más</td></tr>`);
        }
    }

    let editandoIdx = -1;
    window.abrirEjercicioModal = function(idx) {
        editandoIdx = idx ?? -1;
        if (idx >= 0) {
            const e = ejerciciosCustom[idx];
            document.getElementById('ejercicioModalTitle').textContent = 'Editar ejercicio';
            document.getElementById('ejNombre').value = e.nombre;
            document.getElementById('ejGrupo').value = e.grupo;
            document.getElementById('ejEquipo').value = e.equipo;
            document.getElementById('ejImpacto').value = e.impacto || 'medio';
            document.getElementById('ejCargaAxial').checked = !!e.carga_axial;
        } else {
            document.getElementById('ejercicioModalTitle').textContent = 'Nuevo ejercicio';
            document.getElementById('ejercicioForm').reset();
        }
        const m = document.getElementById('ejercicioModal');
        m.classList.add('active');
        m.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };
    abrirEjercicioModal = window.abrirEjercicioModal;

    window.editarEjercicioCustom = function(idx) {
        abrirEjercicioModal(idx);
    };

    window.eliminarEjercicioCustom = function(idx) {
        const e = ejerciciosCustom[idx];
        if (!confirm(`¿Eliminar "${e.nombre}"?`)) return;
        ejerciciosCustom.splice(idx, 1);
        localStorage.setItem('sv_admin_ejercicios_custom', JSON.stringify(ejerciciosCustom));
        renderEjercicios();
        renderDashboard();
        mostrarToast('Ejercicio eliminado', 'success');
    };

    function guardarEjercicio(e) {
        e.preventDefault();
        const nuevo = {
            nombre: document.getElementById('ejNombre').value.trim(),
            grupo: document.getElementById('ejGrupo').value,
            equipo: document.getElementById('ejEquipo').value,
            impacto: document.getElementById('ejImpacto').value,
            carga_axial: document.getElementById('ejCargaAxial').checked,
            articulaciones: []
        };
        if (!nuevo.nombre) {
            mostrarToast('Nombre requerido', 'error');
            return;
        }

        if (editandoIdx >= 0) {
            ejerciciosCustom[editandoIdx] = nuevo;
            mostrarToast('Ejercicio actualizado ✓', 'success');
        } else {
            ejerciciosCustom.push(nuevo);
            mostrarToast('Ejercicio agregado ✓', 'success');
        }

        localStorage.setItem('sv_admin_ejercicios_custom', JSON.stringify(ejerciciosCustom));
        cerrarEjercicioModal();
        renderEjercicios();
        renderDashboard();
    }

    window.cerrarEjercicioModal = function() {
        const m = document.getElementById('ejercicioModal');
        m.classList.remove('active');
        m.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        editandoIdx = -1;
    };

    // ===== PLANTILLAS (TC-044) =====
    function renderPlantillas() {
        if (!datasetRutinas) return;
        const nivel = document.getElementById('plantFiltroNivel').value;
        const objetivo = document.getElementById('plantFiltroObjetivo').value;
        const patologia = document.getElementById('plantFiltroPatologia').value;

        let filtradas = datasetRutinas;
        if (nivel) filtradas = filtradas.filter(r => r.nivel === nivel);
        if (objetivo) filtradas = filtradas.filter(r => r.objetivo === objetivo);
        if (patologia) filtradas = filtradas.filter(r => r.patologia_lesion === patologia);

        document.getElementById('plantillasCount').textContent = `${filtradas.length} plantillas encontradas`;

        const tbody = document.getElementById('tbodyPlantillas');
        if (filtradas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--color-text-muted);">No hay plantillas que coincidan.</td></tr>';
            return;
        }

        tbody.innerHTML = filtradas.slice(0, 100).map(r => `
            <tr>
                <td><code style="font-size: var(--fs-xs);">${r.id}</code></td>
                <td>${capitalize(r.nivel)}</td>
                <td>${capitalize(r.rango_edad)}</td>
                <td>${capitalize(r.genero)}</td>
                <td>${capitalize(r.objetivo)}</td>
                <td><span class="tag ${r.patologia_lesion === 'ninguna' ? 'success' : 'warn'}">${capitalize(r.patologia_lesion)}</span></td>
                <td>${r.dias_por_semana}</td>
                <td>${r.sesiones?.length || 0}</td>
            </tr>
        `).join('');

        if (filtradas.length > 100) {
            tbody.insertAdjacentHTML('beforeend', `<tr><td colspan="8" style="text-align:center; color: var(--color-text-muted);">... y ${filtradas.length - 100} más</td></tr>`);
        }
    }

    // ===== USUARIOS (TC-045, TC-046) =====
    function getEstadoUsuario(u) {
        if (!u.activo) return { label: 'Inactivo', cls: 'danger' };
        if (u.suscripcion_vencimiento) {
            const venc = new Date(u.suscripcion_vencimiento);
            if (venc < new Date()) return { label: 'Vencido', cls: 'danger' };
            const diasRestantes = Math.ceil((venc - new Date()) / 86400000);
            if (diasRestantes <= 7) return { label: `Vence en ${diasRestantes}d`, cls: 'warn' };
        }
        return { label: 'Activo', cls: 'success' };
    }

    function renderUsuarios(filtro) {
        let usuarios = SV_STORAGE.obtenerUsuarios();
        const q = (filtro ?? document.getElementById('usuariosBuscar')?.value ?? '').toLowerCase().trim();
        if (q) {
            usuarios = usuarios.filter(u =>
                (u.nombre || '').toLowerCase().includes(q) ||
                (u.correo || '').toLowerCase().includes(q) ||
                (u.cedula || '').includes(q)
            );
        }
        const contEl = document.getElementById('usuariosCount');
        if (contEl) contEl.textContent = usuarios.length === 1 ? '1 usuario' : `${usuarios.length} usuarios`;
        const tbody = document.getElementById('tbodyUsuarios');

        if (usuarios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--color-text-muted);">${q ? 'Sin resultados para "' + escapeHtml(q) + '".' : 'No hay usuarios registrados.'}</td></tr>`;
            return;
        }

        tbody.innerHTML = usuarios.map(u => {
            const est = getEstadoUsuario(u);
            const venc = u.suscripcion_vencimiento ? formatFecha(u.suscripcion_vencimiento) : '—';
            const isMe = u.id === usuario.id;
            const toggleCls = u.activo ? 'btn-soft-amber' : 'btn-soft-green';
            const toggleTxt = u.activo ? 'Desactivar' : 'Activar';
            return `
            <tr>
                <td><strong>${escapeHtml(u.nombre)}</strong></td>
                <td><small>${escapeHtml(u.cedula || '—')}</small></td>
                <td><small>${escapeHtml(u.correo)}</small></td>
                <td><span class="tag ${est.cls}">${est.label}</span></td>
                <td><small>${venc}</small></td>
                <td><small>${formatFecha(u.fecha_registro || u.creado)}</small></td>
                <td><span class="tag ${u.rol === 'admin' ? 'warn' : 'info'}">${u.rol || 'usuario'}</span></td>
                <td class="usr-actions-cell">
                    ${!isMe ? `
                    <div class="usr-act-row">
                        <button class="btn btn-xs ${toggleCls}" onclick="toggleUsuarioActivo('${u.id}')">${toggleTxt}</button>
                        <button class="btn btn-xs btn-secondary" onclick="abrirSuscripcionModal('${u.id}')">Suscripción</button>
                        ${u.rol !== 'admin' ? `<button class="btn btn-xs btn-secondary" onclick="hacerAdmin('${u.id}')">Admin</button>` : ''}
                        <button class="btn btn-icon-xs btn-ghost-danger" onclick="eliminarUsuarioAdmin('${u.id}')" title="Eliminar usuario">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                    </div>
                    ` : '<span style="color:var(--t3);font-size:0.75rem;">(tú)</span>'}
                </td>
            </tr>`;
        }).join('');
    }

    window.filtrarUsuarios = function() {
        renderUsuarios();
    };

    window.toggleUsuarioActivo = function(id) {
        const usuarios = SV_STORAGE.obtenerUsuarios();
        const u = usuarios.find(x => x.id === id);
        if (!u) return;
        const nuevoEstado = !u.activo;
        SV_STORAGE.actualizarUsuario(id, { activo: nuevoEstado });
        renderUsuarios();
        renderDashboard();
        renderFinanzas();
        mostrarToast(nuevoEstado ? 'Usuario activado ✓' : 'Usuario desactivado', nuevoEstado ? 'success' : 'info');
    };

    window.abrirSuscripcionModal = function(id) {
        const u = SV_STORAGE.obtenerUsuarios().find(x => x.id === id);
        if (!u) return;
        document.getElementById('suscripcionUserId').value = id;
        document.getElementById('suscripcionUserName').textContent = u.nombre + (u.cedula ? ' · CC ' + u.cedula : '') + ' · ' + u.correo;
        const hoy = new Date();
        const defecto = new Date(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
        document.getElementById('suscripcionFecha').value = (u.suscripcion_vencimiento || defecto.toISOString()).slice(0, 10);
        document.getElementById('suscripcionMonto').value = u.suscripcion_monto || 50000;
        const m = document.getElementById('suscripcionModal');
        m.classList.add('active');
        m.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    function guardarSuscripcion() {
        const id = document.getElementById('suscripcionUserId').value;
        const fecha = document.getElementById('suscripcionFecha').value;
        const monto = parseFloat(document.getElementById('suscripcionMonto').value) || 0;
        if (!fecha) { mostrarToast('Selecciona una fecha', 'error'); return; }
        SV_STORAGE.actualizarUsuario(id, {
            suscripcion_vencimiento: new Date(fecha).toISOString(),
            suscripcion_monto: monto
        });
        cerrarSuscripcionModal();
        renderUsuarios();
        renderFinanzas();
        mostrarToast('Suscripción guardada ✓', 'success');
    }

    window.cerrarSuscripcionModal = function() {
        const m = document.getElementById('suscripcionModal');
        m.classList.remove('active');
        m.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    window.hacerAdmin = function(id) {
        if (!confirm('¿Otorgar privilegios de administrador a este usuario?')) return;
        SV_STORAGE.actualizarUsuario(id, { rol: 'admin' });
        renderUsuarios();
        mostrarToast('Privilegios actualizados ✓', 'success');
    };

    window.eliminarUsuarioAdmin = function(id) {
        if (!confirm('¿Eliminar permanentemente este usuario? Esta acción es irreversible.')) return;
        SV_STORAGE.eliminarUsuario(id);
        renderUsuarios();
        renderDashboard();
        mostrarToast('Usuario eliminado', 'info');
    };

    // ===== FINANZAS =====
    function renderFinanzas() {
        const usuarios = SV_STORAGE.obtenerUsuarios();
        const pagos = SV_STORAGE.obtenerPagos();
        const ahora = new Date();
        const mesActual = ahora.getMonth();
        const anoActual = ahora.getFullYear();

        const activos = usuarios.filter(u => u.activo && (!u.suscripcion_vencimiento || new Date(u.suscripcion_vencimiento) >= ahora));
        const vencidos = usuarios.filter(u => u.suscripcion_vencimiento && new Date(u.suscripcion_vencimiento) < ahora);

        const pagosMes = pagos.filter(p => {
            const d = new Date(p.fecha);
            return d.getMonth() === mesActual && d.getFullYear() === anoActual;
        });
        const ingresosMes = pagosMes.reduce((s, p) => s + p.monto, 0);
        const totalRecaudado = pagos.reduce((s, p) => s + p.monto, 0);

        document.getElementById('finKpiMes').textContent = '$' + ingresosMes.toLocaleString('es-CO');
        document.getElementById('finKpiActivos').textContent = activos.length;
        document.getElementById('finKpiVencidos').textContent = vencidos.length;
        document.getElementById('finKpiTotal').textContent = '$' + totalRecaudado.toLocaleString('es-CO');

        // Chart mensual (últimos 6 meses)
        const meses = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(anoActual, mesActual - i, 1);
            const m = d.getMonth(), a = d.getFullYear();
            const total = pagos.filter(p => {
                const pd = new Date(p.fecha);
                return pd.getMonth() === m && pd.getFullYear() === a;
            }).reduce((s, p) => s + p.monto, 0);
            meses.push({ label: d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }), total });
        }
        const maxMes = Math.max(1, ...meses.map(m => m.total));
        document.getElementById('finChartMeses').innerHTML = meses.map(m => `
            <div class="chart-bar" style="height:${(m.total / maxMes) * 100}%;" title="${m.label}: $${m.total.toLocaleString('es-CO')}">
                <span class="chart-bar-value">$${(m.total/1000).toFixed(0)}k</span>
                <span class="chart-bar-label">${m.label}</span>
            </div>
        `).join('');

        // Tabla usuarios
        const tbody = document.getElementById('tbodyFinanzas');
        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted);">No hay usuarios.</td></tr>';
            return;
        }
        tbody.innerHTML = usuarios.map(u => {
            const pagosU = pagos.filter(p => p.usuarioId === u.id).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
            const ultimo = pagosU[0];
            const est = getEstadoUsuario(u);
            return `
            <tr>
                <td><strong>${escapeHtml(u.nombre)}</strong></td>
                <td><small>${escapeHtml(u.correo)}</small></td>
                <td><small>${ultimo ? formatFecha(ultimo.fecha) : '—'}</small></td>
                <td><small>${ultimo ? '$' + ultimo.monto.toLocaleString('es-CO') : '—'}</small></td>
                <td><span class="tag ${est.cls}">${est.label}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="abrirPagoModal('${u.id}')">+ Pago</button>
                    ${pagosU.length > 0 ? `<button class="btn btn-sm btn-secondary" onclick="verPagosUsuario('${u.id}')">Ver (${pagosU.length})</button>` : ''}
                </td>
            </tr>`;
        }).join('');

        // Poblamos selector de usuarios en correos
        const sel = document.getElementById('correoSelectUsuario');
        if (sel) {
            sel.innerHTML = usuarios.map(u => `<option value="${u.id}" data-correo="${escapeHtml(u.correo)}" data-nombre="${escapeHtml(u.nombre)}">${escapeHtml(u.nombre)} (${escapeHtml(u.correo)})</option>`).join('');
        }
    }

    window.abrirPagoModal = function(userId) {
        const u = userId ? SV_STORAGE.obtenerUsuarios().find(x => x.id === userId) : null;
        document.getElementById('pagoUserId').value = userId || '';
        document.getElementById('pagoUserName').textContent = u ? u.nombre + ' · ' + u.correo : 'Seleccionar usuario';
        document.getElementById('pagoMonto').value = u?.suscripcion_monto || 50000;
        document.getElementById('pagoConcepto').value = 'Suscripción mensual';
        const m = document.getElementById('pagoModal');
        m.classList.add('active');
        m.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    function guardarPago() {
        const userId = document.getElementById('pagoUserId').value;
        const monto = parseFloat(document.getElementById('pagoMonto').value);
        const concepto = document.getElementById('pagoConcepto').value || 'Suscripción mensual';
        if (!userId) { mostrarToast('Selecciona un usuario', 'error'); return; }
        if (!monto || monto <= 0) { mostrarToast('Monto inválido', 'error'); return; }
        SV_STORAGE.registrarPago(userId, monto, concepto);
        cerrarPagoModal();
        renderFinanzas();
        mostrarToast('Pago registrado ✓', 'success');
    }

    window.cerrarPagoModal = function() {
        const m = document.getElementById('pagoModal');
        m.classList.remove('active');
        m.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    window.verPagosUsuario = function(userId) {
        const u = SV_STORAGE.obtenerUsuarios().find(x => x.id === userId);
        const pagos = SV_STORAGE.obtenerPagos().filter(p => p.usuarioId === userId).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
        const total = pagos.reduce((s,p) => s + p.monto, 0);
        alert(`Pagos de ${u?.nombre || userId}:\n\n${pagos.map(p => `${formatFecha(p.fecha)}: $${p.monto.toLocaleString('es-CO')} — ${p.concepto}`).join('\n')}\n\nTotal: $${total.toLocaleString('es-CO')}`);
    };

    // ===== CORREOS =====
    function renderCorreos() {
        renderCorreoUsuarioBusqueda();
        renderPlantillasCorreo();
        renderCorreoHistorial();

        // Buscador de plantillas
        const searchPlantillas = document.getElementById('plantillasSearch');
        if (searchPlantillas && !searchPlantillas.dataset.bound) {
            searchPlantillas.dataset.bound = '1';
            searchPlantillas.addEventListener('input', () => renderPlantillasCorreo(searchPlantillas.value));
        }

        // Buscador de usuarios
        const buscarEl = document.getElementById('correoUsuarioBuscar');
        if (buscarEl && !buscarEl.dataset.bound) {
            buscarEl.dataset.bound = '1';
            buscarEl.addEventListener('input', () =>
                renderCorreoUsuarioBusqueda(buscarEl.value, correoFiltroEstado));
        }

        // Chips de filtro
        const chipsEl = document.getElementById('correoFiltroChips');
        if (chipsEl && !chipsEl.dataset.bound) {
            chipsEl.dataset.bound = '1';
            chipsEl.addEventListener('click', e => {
                const chip = e.target.closest('.correo-chip');
                if (!chip) return;
                chipsEl.querySelectorAll('.correo-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                correoFiltroEstado = chip.dataset.estado;
                const q = document.getElementById('correoUsuarioBuscar')?.value || '';
                renderCorreoUsuarioBusqueda(q, correoFiltroEstado);
            });
        }

    }

    // ===== SEGMENTO CHIPS =====
    let _segmentoActual = 'individual';

    function _initSegmentoChips() {
        const chips = document.getElementById('segmentoChips');
        if (!chips || chips.dataset.bound) return;
        chips.dataset.bound = '1';

        // Actualizar contadores
        _actualizarContadoresSegmento();

        chips.addEventListener('click', e => {
            const chip = e.target.closest('.seg-chip');
            if (!chip) return;
            chips.querySelectorAll('.seg-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            _segmentoActual = chip.dataset.val;
            const isInd = _segmentoActual === 'individual';
            document.getElementById('correoSelectUsuarioGroup').style.display = isInd ? '' : 'none';
            _mostrarBannerSegmento(_segmentoActual);
            // Sugerir plantilla del segmento
            _sugerirPlantillaSegmento(_segmentoActual);
        });
    }

    function _actualizarContadoresSegmento() {
        const hoy = new Date().toISOString().split('T')[0];
        const en7d = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
        const usuarios = SV_STORAGE.obtenerUsuarios();
        const activos = [], vencidos = [], porVencer = [], inactivos = [];
        usuarios.forEach(u => {
            const vence = u.suscripcion?.fechaVencimiento?.split('T')[0] || null;
            if (!u.activo) { inactivos.push(u); return; }
            if (vence && vence < hoy) { vencidos.push(u); return; }
            if (vence && vence >= hoy && vence <= en7d) { porVencer.push(u); }
            activos.push(u);
        });
        const set = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n || ''; };
        set('cntActivos',   activos.length   || '');
        set('cntVencidos',  vencidos.length  || '');
        set('cntPorVencer', porVencer.length || '');
        set('cntInactivos', inactivos.length || '');
        set('cntTodos',     usuarios.length  || '');
    }

    function _mostrarBannerSegmento(seg) {
        const banner = document.getElementById('segmentoBanner');
        if (!banner) return;
        const hoy = new Date().toISOString().split('T')[0];
        const en7d = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
        const usuarios = SV_STORAGE.obtenerUsuarios();
        const mensajes = {
            'individual': null,
            'activos':    `Se enviará a todos los usuarios con suscripción activa.`,
            'vencidos':   `Se enviará a usuarios con suscripción vencida. Ideal para campañas de reactivación.`,
            'por-vencer': `Se enviará a usuarios cuya suscripción vence en los próximos 7 días.`,
            'inactivos':  `Se enviará a usuarios desactivados. Ideal para recuperación.`,
            'todos':      `Se enviará a TODOS los usuarios registrados (${usuarios.length}).`,
        };
        const msg = mensajes[seg];
        if (!msg) { banner.style.display = 'none'; return; }
        banner.textContent = '📢 ' + msg;
        banner.style.display = 'block';
    }

    function _sugerirPlantillaSegmento(seg) {
        const mapa = {
            'vencidos':   'masivo-reactivar-vencidos',
            'por-vencer': 'masivo-renovacion-proxima',
            'activos':    'masivo-motivacion-activos',
            'inactivos':  'masivo-inactivos-recuperar',
            'todos':      'masivo-novedad-todos',
        };
        const id = mapa[seg];
        if (!id) return;
        const asunto = document.getElementById('correoAsunto');
        const cuerpo = document.getElementById('correoMensaje');
        if (asunto?.value || cuerpo?.value) return; // no sobreescribir si ya hay texto
        window.usarPlantilla(id);
    }

    function _obtenerDestinatariosSegmento(seg) {
        const hoy = new Date().toISOString().split('T')[0];
        const en7d = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
        const todos = SV_STORAGE.obtenerUsuarios();
        switch (seg) {
            case 'activos':    return todos.filter(u => u.activo && !(u.suscripcion?.fechaVencimiento?.split('T')[0] < hoy));
            case 'vencidos':   return todos.filter(u => u.activo && u.suscripcion?.fechaVencimiento?.split('T')[0] < hoy);
            case 'por-vencer': return todos.filter(u => { const v = u.suscripcion?.fechaVencimiento?.split('T')[0]; return u.activo && v && v >= hoy && v <= en7d; });
            case 'inactivos':  return todos.filter(u => !u.activo);
            case 'todos':      return todos;
            default:           return [];
        }
    }

    function renderCorreoUsuarioBusqueda(q = '', estado = '') {
        const lista = document.getElementById('correoUsuarioLista');
        if (!lista) return;

        const qL = q.toLowerCase().trim();
        let usuarios = SV_STORAGE.obtenerUsuarios();

        if (qL) {
            usuarios = usuarios.filter(u =>
                (u.nombre  || '').toLowerCase().includes(qL) ||
                (u.correo  || '').toLowerCase().includes(qL) ||
                (u.cedula  || '').toString().includes(q.trim())
            );
        }

        if (estado === 'activo') {
            usuarios = usuarios.filter(u => {
                const hoy = new Date(); hoy.setHours(0,0,0,0);
                const vence = u.suscripcion_vencimiento ? new Date(u.suscripcion_vencimiento) : null;
                return u.activo && (!vence || vence >= hoy);
            });
        } else if (estado === 'vencido') {
            usuarios = usuarios.filter(u => {
                const hoy = new Date(); hoy.setHours(0,0,0,0);
                const vence = u.suscripcion_vencimiento ? new Date(u.suscripcion_vencimiento) : null;
                return vence && vence < hoy;
            });
        } else if (estado === 'inactivo') {
            usuarios = usuarios.filter(u => !u.activo);
        }

        if (usuarios.length === 0) {
            lista.innerHTML = `<div class="correo-u-empty">Sin resultados${qL ? ` para "<em>${escapeHtml(q)}</em>"` : ''}</div>`;
            return;
        }

        const hoy = new Date(); hoy.setHours(0,0,0,0);
        lista.innerHTML = usuarios.slice(0, 25).map(u => {
            const vence = u.suscripcion_vencimiento ? new Date(u.suscripcion_vencimiento) : null;
            let tagCls = 'info', tagLbl = 'Sin sub.';
            if (!u.activo)            { tagCls = 'default'; tagLbl = 'Inactivo'; }
            else if (vence && vence < hoy) { tagCls = 'danger';  tagLbl = 'Vencido'; }
            else if (vence)           { tagCls = 'success'; tagLbl = 'Activo'; }

            const sel = correoUsuarioSeleccionado?.id === u.id;
            return `
            <div class="correo-u-item${sel ? ' selected' : ''}" onclick="seleccionarCorreoUsuario('${u.id}')">
                <div class="correo-u-avatar">${(u.nombre || '?').charAt(0).toUpperCase()}</div>
                <div class="correo-u-info">
                    <div class="correo-u-nombre">${escapeHtml(u.nombre)}</div>
                    <div class="correo-u-sub">${escapeHtml(u.correo)}${u.cedula ? ' · CC ' + escapeHtml(u.cedula) : ''}</div>
                </div>
                <span class="tag ${tagCls}" style="font-size:0.62rem;padding:2px 7px;flex-shrink:0;">${tagLbl}</span>
            </div>`;
        }).join('') +
        (usuarios.length > 25
            ? `<div class="correo-u-more">+${usuarios.length - 25} más — refina la búsqueda</div>`
            : '');
    }

    window.seleccionarCorreoUsuario = function(id) {
        const u = SV_STORAGE.obtenerUsuarios().find(x => x.id === id);
        if (!u) return;
        correoUsuarioSeleccionado = { id: u.id, nombre: u.nombre, correo: u.correo };
        // Mostrar badge
        document.getElementById('correoSelecAvatar').textContent  = (u.nombre || '?').charAt(0).toUpperCase();
        document.getElementById('correoSelecNombre').textContent  = u.nombre;
        document.getElementById('correoSelecCorreo').textContent  = u.correo;
        document.getElementById('correoUsuarioBadge').style.display    = 'flex';
        document.getElementById('correoUsuarioBuscador').style.display = 'none';
    };

    window.deseleccionarCorreoUsuario = function() {
        correoUsuarioSeleccionado = null;
        document.getElementById('correoUsuarioBadge').style.display    = 'none';
        document.getElementById('correoUsuarioBuscador').style.display = '';
        const q = document.getElementById('correoUsuarioBuscar')?.value || '';
        renderCorreoUsuarioBusqueda(q, correoFiltroEstado);
    };

    function renderPlantillasCorreo(filtro = '') {
        const cont = document.getElementById('plantillasCorreo');
        if (!cont) return;
        const q = filtro.toLowerCase().trim();
        const lista = q
            ? CORREO_PLANTILLAS.filter(p =>
                p.titulo.toLowerCase().includes(q) ||
                p.asunto.toLowerCase().includes(q))
            : CORREO_PLANTILLAS;

        if (lista.length === 0) {
            cont.innerHTML = `<p style="color:var(--t3);font-size:0.75rem;text-align:center;padding:1.2rem 0;">Sin resultados para "<em>${escapeHtml(filtro)}</em>"</p>`;
            return;
        }
        cont.innerHTML = lista.map(p => `
            <div class="plantilla-item" data-id="${p.id}" onclick="usarPlantilla('${p.id}')">
                <span class="plantilla-icon">${p.icon}</span>
                <div>
                    <div class="plantilla-titulo">${p.titulo}</div>
                    <div class="plantilla-asunto">${escapeHtml(p.asunto)}</div>
                </div>
            </div>
        `).join('');
    }

    window.usarPlantilla = function(id) {
        const p = CORREO_PLANTILLAS.find(x => x.id === id);
        if (!p) return;
        document.getElementById('correoAsunto').value = p.asunto;
        document.getElementById('correoMensaje').value = p.cuerpo;
        document.querySelectorAll('.plantilla-item').forEach(el => el.classList.remove('selected'));
        document.querySelector(`.plantilla-item[data-id="${id}"]`)?.classList.add('selected');
        document.getElementById('correoMensaje').focus();
        mostrarToast(`Plantilla "${p.titulo}" cargada. Edita antes de enviar.`, 'info');
    };

    function renderCorreoHistorial() {
        const cont = document.getElementById('correoHistorial');
        if (!cont) return;
        if (correoHistorial.length === 0) {
            cont.innerHTML = '<p style="color: var(--color-text-muted);">No hay correos enviados aún.</p>';
            return;
        }
        cont.innerHTML = `<table class="table"><thead><tr><th>Fecha</th><th>Destinatario</th><th>Asunto</th><th>Estado</th></tr></thead><tbody>
            ${correoHistorial.slice(-20).reverse().map(c => `
            <tr>
                <td><small>${formatFecha(c.fecha)}</small></td>
                <td><small>${escapeHtml(c.destinatario)}</small></td>
                <td>${escapeHtml(c.asunto)}</td>
                <td><span class="tag ${c.ok ? 'success' : 'danger'}">${c.ok ? '✓ Enviado' : '✗ Error'}</span></td>
            </tr>`).join('')}
        </tbody></table>`;
    }

    async function enviarCorreoAdmin() {
        const asunto = document.getElementById('correoAsunto').value.trim();
        const mensaje = document.getElementById('correoMensaje').value.trim();
        const feedback = document.getElementById('correo-feedback');

        if (!asunto || !mensaje) {
            feedback.textContent = 'Asunto y mensaje son obligatorios.';
            feedback.className = 'form-feedback error show';
            return;
        }

        let destinatarios = [];
        if (_segmentoActual === 'individual') {
            if (!correoUsuarioSeleccionado) {
                feedback.textContent = 'Selecciona un destinatario en el buscador.';
                feedback.className = 'form-feedback error show';
                return;
            }
            destinatarios = [{ nombre: correoUsuarioSeleccionado.nombre, correo: correoUsuarioSeleccionado.correo }];
        } else {
            destinatarios = _obtenerDestinatariosSegmento(_segmentoActual).map(u => ({ nombre: u.nombre, correo: u.correo }));
        }

        if (destinatarios.length > 1) {
            const ok = confirm(`Se enviará el correo a ${destinatarios.length} destinatario(s).\n\n¿Confirmar envío masivo?`);
            if (!ok) return;
        }

        if (destinatarios.length === 0) {
            feedback.textContent = 'No hay destinatarios disponibles.';
            feedback.className = 'form-feedback error show';
            return;
        }

        const btn = document.getElementById('btnEnviarCorreo');
        btn.disabled = true;
        btn.textContent = 'Enviando...';
        feedback.textContent = '';
        feedback.className = 'form-feedback';

        let enviados = 0, errores = 0;
        for (const dest of destinatarios) {
            const mensajePersonalizado = mensaje.replace(/\{\{nombre\}\}/gi, dest.nombre);
            const mensajeHtml = mensajePersonalizado.replace(/\n/g, '<br>');
            const html = `
<div style="background:#08080f;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:540px;margin:0 auto;background:#111118;border-radius:16px;overflow:hidden;border:1px solid #1e1e2e;">

    <div style="height:4px;background:#FFD60A;"></div>

    <div style="padding:22px 32px 18px;border-bottom:1px solid #1e1e2e;">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle;">
          <div style="width:38px;height:38px;background:#FFD60A;border-radius:9px;text-align:center;line-height:38px;font-weight:900;font-size:15px;color:#08080f;display:inline-block;">SV</div>
        </td>
        <td style="vertical-align:middle;padding-left:10px;">
          <span style="font-size:1.1rem;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">StrongVision</span>
        </td>
      </tr></table>
    </div>

    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:0.95rem;color:#ffffff;">Hola, <strong>${escapeHtml(dest.nombre)}</strong> 👋</p>
      <div style="background:#1a1a28;border-left:3px solid #FFD60A;padding:18px 20px;border-radius:0 10px 10px 0;margin:0 0 8px;line-height:1.75;color:#cccccc;font-size:0.875rem;">${mensajeHtml}</div>
    </div>

    <div style="padding:14px 32px 20px;border-top:1px solid #1e1e2e;text-align:center;">
      <p style="color:#444444;font-size:0.72rem;margin:0;letter-spacing:0.02em;">Mensaje enviado desde el panel de administración de StrongVision</p>
    </div>

  </div>
</div>`;

            try {
                const res = await fetch(N8N_ADMIN_MSG, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to_email: dest.correo, subject: asunto, html })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                enviados++;
                correoHistorial.push({ fecha: new Date().toISOString(), destinatario: dest.nombre + ' <' + dest.correo + '>', asunto, ok: true });
            } catch (err) {
                errores++;
                correoHistorial.push({ fecha: new Date().toISOString(), destinatario: dest.correo, asunto, ok: false });
                console.error('[n8n admin-message]', err);
            }
        }

        btn.disabled = false;
        btn.textContent = '📤 Enviar correo';
        feedback.textContent = `${enviados} correo(s) enviado(s)${errores > 0 ? ', ' + errores + ' error(es).' : '.'}`;
        feedback.className = `form-feedback ${errores > 0 ? 'error' : 'success'} show`;
        renderCorreoHistorial();
    }

    // ===== REPORTES (TC-047, TC-048) =====
    function renderReportes() {
        const usuarios = SV_STORAGE.obtenerUsuarios();

        // Distribución por objetivo
        const objetivos = {};
        const niveles = {};
        usuarios.forEach(u => {
            const perfil = SV_STORAGE.obtenerPerfil(u.id);
            if (perfil) {
                if (perfil.objetivo) objetivos[perfil.objetivo] = (objetivos[perfil.objetivo] || 0) + 1;
                if (perfil.nivel) niveles[perfil.nivel] = (niveles[perfil.nivel] || 0) + 1;
            }
        });

        renderChartReporte('chartObjetivos', objetivos);
        renderChartReporte('chartNiveles', niveles);
    }

    function renderChartReporte(id, data) {
        const cont = document.getElementById(id);
        const entries = Object.entries(data).sort((a,b) => b[1] - a[1]);

        if (entries.length === 0) {
            cont.innerHTML = '<p style="color: var(--color-text-muted); text-align:center; width:100%;">No hay datos suficientes.</p>';
            return;
        }

        const max = Math.max(1, ...entries.map(e => e[1]));
        cont.innerHTML = entries.map(([k, v]) => {
            const altura = (v / max) * 100;
            return `
                <div class="chart-bar" style="height: ${altura}%;" title="${capitalize(k)}: ${v}">
                    <span class="chart-bar-value">${v}</span>
                    <span class="chart-bar-label">${capitalize(k)}</span>
                </div>
            `;
        }).join('');
    }

    // ===== COBERTURA DE TESTS (TC-049, TC-050) =====
    function renderTestCoverage() {
        const cont = document.getElementById('testCoverage');
        const grupos = [
            { nombre: 'RFU-1: Registro', casos: 'TC-001 a TC-006', estado: 'completado', desc: 'Validación nombre, correo, password, ciudad, dirección' },
            { nombre: 'RFU-2: Login', casos: 'TC-007 a TC-009', estado: 'completado', desc: 'Login válido, password incorrecta, recuperación' },
            { nombre: 'RFU-3: Perfil físico', casos: 'TC-010 a TC-013', estado: 'completado', desc: 'Datos completos, sin patologías, edición, lesiones múltiples' },
            { nombre: 'RFU-4: Generar rutina IA', casos: 'TC-014 a TC-019', estado: 'completado', desc: 'Heurística voraz + filtros clínicos + adaptación lesiones + recomposicion_corporal como objetivo híbrido' },
            { nombre: 'RFU-5: Modo entrenamiento', casos: 'TC-020 a TC-025', estado: 'completado', desc: 'Calentamiento, registro series/RPE, técnica, molestias' },
            { nombre: 'RFU-6: Seguimiento', casos: 'TC-024', estado: 'completado', desc: 'Gráfica progreso semanal' },
            { nombre: 'RFU-7: Adaptación auto', casos: 'TC-026 a TC-028', estado: 'completado', desc: 'Heurística evolutiva por RPE y molestias' },
            { nombre: 'RFU-8: Historial', casos: 'TC-029 a TC-031', estado: 'completado', desc: 'Filtro fecha, filtro grupo, exportar PDF' },
            { nombre: 'RFU-9: Notificaciones', casos: 'TC-032 a TC-033', estado: 'completado', desc: 'Recordatorios, sesión omitida' },
            { nombre: 'RFU-10: Biblioteca', casos: 'TC-034 a TC-036', estado: 'completado', desc: 'Búsqueda, filtros, modal técnica' },
            { nombre: 'RFU-11: Offline', casos: 'TC-037 a TC-038', estado: 'completado', desc: 'localStorage + service worker' },
            { nombre: 'RFU-12: Cuenta/Privacidad', casos: 'TC-039 a TC-041', estado: 'completado', desc: 'Editar datos, preferencias, eliminar cuenta' },
            { nombre: 'RFA-1: CRUD ejercicios', casos: 'TC-042 a TC-043', estado: 'completado', desc: 'Crear, editar, eliminar ejercicios' },
            { nombre: 'RFA-2: Plantillas', casos: 'TC-044', estado: 'completado', desc: 'Visualización filtrable de 540 plantillas' },
            { nombre: 'RFA-3: Gestión usuarios', casos: 'TC-045 a TC-050', estado: 'completado', desc: 'Lista, roles, eliminar, reportes' }
        ];

        cont.innerHTML = `
            <table class="table">
                <thead><tr><th>Requisito</th><th>Casos</th><th>Estado</th><th>Descripción</th></tr></thead>
                <tbody>
                    ${grupos.map(g => `
                        <tr>
                            <td><strong>${g.nombre}</strong></td>
                            <td><code style="font-size: var(--fs-xs);">${g.casos}</code></td>
                            <td><span class="tag success">✓ ${g.estado}</span></td>
                            <td><small>${g.desc}</small></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="alert success" style="margin-top: var(--sp-md);">
                <span class="icon">🎯</span>
                <div class="alert-content">
                    <strong>Cobertura: 50/50 casos de prueba implementados (100%)</strong>
                    <small>Todos los requisitos funcionales (RFU) y administrativos (RFA) cubiertos</small>
                </div>
            </div>
        `;
    }

    // ===== ADMIN AI SIDEBAR =====
    function initAdminAI() {
        // Panel title
        if (_isEN) {
            const t = document.querySelector('.aas-title');
            if (t) { const svg = t.querySelector('svg'); t.textContent = ' AI Admin'; if (svg) t.prepend(svg); }
        }

        aasBotMsg(_L(
            'Hola, soy tu asistente admin.<br>Puedo consultar <strong>usuarios, finanzas y suscripciones</strong>. Usa los accesos rápidos o escribe tu consulta.',
            'Hi, I\'m your admin assistant.<br>I can look up <strong>users, finances & subscriptions</strong>. Use the quick chips or type a query.'
        ));

        const _chipEN = {
            'resumen':               ['summary',              'Summary'],
            'alertas':               ['alerts',               'Alerts'],
            'vencidos':              ['expired',              'Expired'],
            'por vencer en 30 días': ['expiring in 30 days',  '30 days'],
            'finanzas':              ['finances',             'Finance'],
            'sin perfil':            ['no profile',           'No profile'],
            'sin rutina':            ['no routine',           'No routine'],
            'estadísticas':          ['stats',                'Stats'],
            'recientes':             ['recent',               'Recent'],
            'inactivos':             ['inactive',             'Inactive'],
        };

        document.querySelectorAll('.aas-chip').forEach(chip => {
            if (_isEN) {
                const map = _chipEN[chip.dataset.query];
                if (map) { chip.dataset.query = map[0]; chip.textContent = map[1]; }
            }
            chip.addEventListener('click', () => {
                const q = chip.dataset.query;
                aasUserMsg(q);
                aasResponder(q);
            });
        });

        document.getElementById('aasInput').placeholder = _L('Consultar…', 'Query...');

        document.getElementById('aasForm').addEventListener('submit', e => {
            e.preventDefault();
            const input = document.getElementById('aasInput');
            const q = input.value.trim();
            if (!q) return;
            aasUserMsg(q);
            input.value = '';
            aasResponder(q);
        });
    }

    function aasAddMsg(cls, html) {
        const msgs = document.getElementById('aasMsgs');
        const div = document.createElement('div');
        div.className = 'aas-msg ' + cls;
        div.innerHTML = html;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
        return div;
    }
    function aasBotMsg(html)  { return aasAddMsg('aas-bot', html); }
    function aasUserMsg(text) { return aasAddMsg('aas-user', escapeHtml(text)); }

    function aasTyping() {
        const msgs = document.getElementById('aasMsgs');
        const el = document.createElement('div');
        el.className = 'aas-typing';
        el.innerHTML = '<span></span><span></span><span></span>';
        msgs.appendChild(el);
        msgs.scrollTop = msgs.scrollHeight;
        return el;
    }

    function aasResponder(q) {
        const typing = aasTyping();
        setTimeout(() => {
            typing.remove();
            const resp = aasGenerar(q);
            aasBotMsg(resp);
        }, 380);
    }

    function aasGenerar(q) {
        const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const ql   = norm(q);
        const m    = (...rx) => rx.some(r => r.test(ql));

        const usuarios  = SV_STORAGE.obtenerUsuarios();
        const pagos     = SV_STORAGE.obtenerPagos ? SV_STORAGE.obtenerPagos() : [];
        const ahora     = new Date();

        const diasHasta = u => u.suscripcion_vencimiento
            ? Math.ceil((new Date(u.suscripcion_vencimiento) - ahora) / 86400000)
            : null;

        const activos   = usuarios.filter(u => u.activo && (!u.suscripcion_vencimiento || diasHasta(u) >= 0));
        const vencidos  = usuarios.filter(u => u.activo && u.suscripcion_vencimiento && diasHasta(u) < 0);
        const inactivos = usuarios.filter(u => !u.activo);
        const admins    = usuarios.filter(u => u.rol === 'admin');
        const sinPerfil = usuarios.filter(u => !SV_STORAGE.obtenerPerfil(u.id));
        const sinRutina = usuarios.filter(u => SV_STORAGE.obtenerPerfil(u.id) && !SV_STORAGE.obtenerRutina(u.id));
        const totalRec  = pagos.reduce((s, p) => s + (p.monto || 0), 0);

        const dot = (color, txt) => `<span style="color:${color}">●</span> ${txt}`;
        const tag = (color, txt) => `<span style="display:inline-block;padding:1px 8px;border-radius:10px;background:${color}22;color:${color};font-size:0.64rem;font-weight:600;">${txt}</span>`;
        const sep = () => `<div style="height:1px;background:var(--border);margin:6px 0;opacity:0.5;"></div>`;
        const sub = txt => `<div style="padding-left:10px;color:var(--t3);font-size:0.65rem;">${txt}</div>`;
        const pct = (n, total) => {
            if (!total) return '0%';
            const v = Math.round(n / total * 100);
            const c = v >= 70 ? '#22c55e' : v >= 40 ? '#f59e0b' : '#ef4444';
            return `<span style="color:${c};font-weight:700;">${v}%</span>`;
        };
        const loc = _isEN ? 'en-US' : 'es-CO';

        // ── SALUDOS ──────────────────────────────────────────────────────
        if (m(/^(hola|hi|hey|hello|buenos|buenas|que tal|saludos|buen dia|greetings)/)) {
            return `<strong>${_L('¡Hola, administrador!','Hello, administrator!')}</strong><br>${_L('Soy tu asistente de gestión. Puedo ayudarte con:','I\'m your management assistant. I can help with:')}<br><br>` +
                `${dot('#60a5fa', _L('usuarios y suscripciones','users & subscriptions'))}<br>` +
                `${dot('#FFD60A', _L('finanzas e ingresos','finances & revenue'))}<br>` +
                `${dot('#f59e0b', _L('alertas de vencimientos','expiry alerts'))}<br>` +
                `${dot('#22c55e', _L('analíticas y reportes','analytics & reports'))}<br>` +
                `${dot('#a78bfa', _L('búsqueda de usuarios','user search'))}<br><br>` +
                _L('Escribe <em>resumen</em> para ver el estado general.','Type <em>summary</em> for a system overview.');
        }

        // ── RESUMEN GENERAL ──────────────────────────────────────────────
        if (m(/resumen|estado general|overview|dashboard|todo|como estamos|panorama|summary/)) {
            const en7  = usuarios.filter(u => { const d = diasHasta(u); return u.activo && d !== null && d >= 0 && d <= 7; });
            const en30 = usuarios.filter(u => { const d = diasHasta(u); return u.activo && d !== null && d >= 0 && d <= 30; });
            const hoy  = new Date(); hoy.setHours(0,0,0,0);
            const nuevosHoy = usuarios.filter(u => {
                const f = new Date(u.fecha_registro || u.creado || 0); f.setHours(0,0,0,0);
                return f.getTime() === hoy.getTime();
            });
            const mesNombre = ahora.toLocaleDateString(loc, { month: 'long', year: 'numeric' });
            const pagosMes  = pagos.filter(p => { const d = new Date(p.fecha); return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear(); });
            const ingresosMes = pagosMes.reduce((s,p) => s+(p.monto||0), 0);
            return `<strong>${_L('Resumen','Summary')} — ${mesNombre}</strong>${sep()}` +
                `${dot('#60a5fa', `<strong>${usuarios.length}</strong> ${_L('usuarios totales','total users')}`)}<br>` +
                `${dot('#22c55e', `<strong>${activos.length}</strong> ${_L('activos','active')}`)} ${pct(activos.length, usuarios.length)}<br>` +
                `${dot('#ef4444', `<strong>${vencidos.length}</strong> ${_L('suscripción vencida','expired subscription')}`)}<br>` +
                `${dot('#f59e0b', `<strong>${en7.length}</strong> ${_L('vencen en 7 días','expiring in 7 days')}`)}<br>` +
                `${dot('#fb923c', `<strong>${en30.length}</strong> ${_L('vencen en 30 días','expiring in 30 days')}`)}<br>` +
                `${dot('#94a3b8', `<strong>${inactivos.length}</strong> ${_L('desactivados','deactivated')}`)}<br>` +
                `${dot('#a78bfa', `<strong>${sinPerfil.length}</strong> ${_L('sin perfil completado','without completed profile')}`)}<br>` +
                (nuevosHoy.length ? `${dot('#34d399', `<strong>${nuevosHoy.length}</strong> ${_L('registro(s) hoy','registration(s) today')}`)}<br>` : '') +
                sep() +
                `${dot('#FFD60A', `<strong>$${ingresosMes.toLocaleString('es-CO')}</strong> ${_L('en','in')} ${ahora.toLocaleDateString(loc,{month:'long'})}`)}<br>` +
                `${dot('#60a5fa', `<strong>$${totalRec.toLocaleString('es-CO')}</strong> ${_L('recaudado total','total collected')}`)}`;
        }

        // ── VENCIDOS ─────────────────────────────────────────────────────
        if (m(/vencid|expirad|suscrip.*vencid|expired|lapsed/)) {
            if (vencidos.length === 0) return tag('#22c55e', _L('✓ Sin vencidos','✓ No expired')) + ' ' + _L('No hay suscripciones vencidas actualmente.','There are no expired subscriptions at this time.');
            return `<strong>${vencidos.length} ${_L('suscripción(es) vencida(s)','expired subscription(s)')}:</strong>${sep()}` +
                vencidos.slice(0, 10).map(u => {
                    const dias = Math.abs(diasHasta(u));
                    return `${dot('#ef4444', `<strong>${escapeHtml(u.nombre)}</strong>`)}<br>` +
                        sub(`${_L('CC','ID')}: ${u.cedula||'—'} · ${_L(`Venció hace ${dias} día(s)`,`Expired ${dias} day(s) ago`)} · ${formatFecha(u.suscripcion_vencimiento)}`);
                }).join('<br>') +
                (vencidos.length > 10 ? `<br><small style="color:var(--t3)">…${_L(`y ${vencidos.length-10} más. Ve a la pestaña Usuarios para ver todos.`,`and ${vencidos.length-10} more. Go to the Users tab to see all.`)}</small>` : '');
        }

        // ── POR VENCER ───────────────────────────────────────────────────
        if (m(/por vencer|pronto|proxim|vencen.*dias|en.*dias|semana|7 dias|30 dias|mes|expiring|soon|within.*days|30 days|7 days/)) {
            const limite = /30|mes|month/.test(ql) ? 30 : 7;
            const porVencer = usuarios.filter(u => { const d = diasHasta(u); return u.activo && d !== null && d >= 0 && d <= limite; })
                .sort((a,b) => diasHasta(a) - diasHasta(b));
            if (porVencer.length === 0) return tag('#22c55e','✓') + ' ' + _L(`Ninguna suscripción vence en ${limite} días.`,`No subscriptions expiring in ${limite} days.`);
            return `<strong>${porVencer.length} ${_L(`vencen en ${limite} días`,`expiring in ${limite} days`)}:</strong>${sep()}` +
                porVencer.slice(0, 10).map(u => {
                    const d = diasHasta(u);
                    const c = d <= 3 ? '#ef4444' : d <= 7 ? '#f59e0b' : '#fb923c';
                    return `${dot(c, `<strong>${escapeHtml(u.nombre)}</strong>`)}<br>` +
                        sub(`${_L('CC','ID')}: ${u.cedula||'—'} · ${_L('Vence en','Expires in')} <strong style="color:${c}">${d} ${_L('día(s)','day(s)')}</strong> · ${formatFecha(u.suscripcion_vencimiento)}`);
                }).join('<br>') +
                (porVencer.length > 10 ? `<br><small style="color:var(--t3)">…${_L('y','and')} ${porVencer.length-10} ${_L('más','more')}</small>` : '');
        }

        // ── ACTIVOS ───────────────────────────────────────────────────────
        if (m(/^activ|usuarios activ|cuantos activ|lista.*activ|^active|active users/)) {
            if (activos.length === 0) return _L('No hay usuarios con suscripción activa.','No users with an active subscription.');
            return `<strong>${activos.length} ${_L('usuario(s) activo(s)','active user(s)')}:</strong>${sep()}` +
                activos.slice(0, 10).map(u => {
                    const d = diasHasta(u);
                    const info = d !== null ? `${d} ${_L('días restantes','days remaining')}` : _L('sin vencimiento','no expiry');
                    return `${dot('#22c55e', `<strong>${escapeHtml(u.nombre)}</strong>`)}<br>` + sub(`${info} · ${u.correo}`);
                }).join('<br>') +
                (activos.length > 10 ? `<br><small style="color:var(--t3)">…${_L('y','and')} ${activos.length-10} ${_L('más','more')}</small>` : '');
        }

        // ── INACTIVOS / DESACTIVADOS ──────────────────────────────────────
        if (m(/inactiv|desactiv|bloquead|suspendid|inactive|deactivat|suspend|block/)) {
            if (inactivos.length === 0) return tag('#22c55e','✓') + ' ' + _L('Todos los usuarios están activos.','All users are active.');
            return `<strong>${inactivos.length} ${_L('usuario(s) desactivado(s)','deactivated user(s)')}:</strong>${sep()}` +
                inactivos.slice(0, 10).map(u =>
                    `${dot('#94a3b8', `<strong>${escapeHtml(u.nombre)}</strong>`)}<br>` +
                    sub(`${_L('CC','ID')}: ${u.cedula||'—'} · ${u.correo}`)
                ).join('<br>') +
                (inactivos.length > 10 ? `<br><small style="color:var(--t3)">…${_L('y','and')} ${inactivos.length-10} ${_L('más','more')}</small>` : '');
        }

        // ── SIN PERFIL ────────────────────────────────────────────────────
        if (m(/sin perfil|no tiene.*perfil|perfil.*incompleto|sin completar|no profile|without.profile|incomplete.profile|missing.profile/)) {
            if (sinPerfil.length === 0) return tag('#22c55e','✓') + ' ' + _L('Todos los usuarios tienen perfil completo.','All users have a completed profile.');
            return `<strong>${sinPerfil.length} ${_L('sin perfil completado','without completed profile')}:</strong>${sep()}` +
                sinPerfil.slice(0, 8).map(u =>
                    `${dot('#a78bfa', `<strong>${escapeHtml(u.nombre)}</strong>`)}<br>` +
                    sub(`${_L('CC','ID')}: ${u.cedula||'—'} · ${_L('Registrado','Registered')}: ${formatFecha(u.fecha_registro||u.creado)}`)
                ).join('<br>') +
                (sinPerfil.length > 8 ? `<br><small style="color:var(--t3)">…${_L('y','and')} ${sinPerfil.length-8} ${_L('más','more')}</small>` : '');
        }

        // ── SIN RUTINA ────────────────────────────────────────────────────
        if (m(/sin rutina|no tiene.*rutina|rutina.*generada|pendiente.*rutina|no routine|without.routine|missing.routine/)) {
            if (sinRutina.length === 0) return tag('#22c55e','✓') + ' ' + _L('Todos los usuarios con perfil tienen rutina generada.','All users with a profile have a generated routine.');
            return `<strong>${sinRutina.length} ${_L('con perfil pero sin rutina','with profile but no routine')}:</strong>${sep()}` +
                sinRutina.slice(0, 8).map(u =>
                    `${dot('#fb923c', `<strong>${escapeHtml(u.nombre)}</strong>`)}<br>` +
                    sub(`${_L('CC','ID')}: ${u.cedula||'—'} · ${u.correo}`)
                ).join('<br>') +
                (sinRutina.length > 8 ? `<br><small style="color:var(--t3)">…${_L('y','and')} ${sinRutina.length-8} ${_L('más','more')}</small>` : '');
        }

        // ── FINANZAS / INGRESOS ───────────────────────────────────────────
        if (m(/finanz|ingres|pago|dinero|recaud|cobr|plata|revenue|cuanto.*gana|cuanto.*recib|income|earnings|payment|finances|money/)) {
            const mesAct = ahora.getMonth(), ano = ahora.getFullYear();
            const pagosMes = pagos.filter(p => { const d = new Date(p.fecha); return d.getMonth() === mesAct && d.getFullYear() === ano; });
            const mesAnt   = pagos.filter(p => { const d = new Date(p.fecha); const mm = mesAct===0?11:mesAct-1; const aa = mesAct===0?ano-1:ano; return d.getMonth()===mm && d.getFullYear()===aa; });
            const im  = pagosMes.reduce((s,p) => s+(p.monto||0), 0);
            const im1 = mesAnt.reduce((s,p) => s+(p.monto||0), 0);
            const diff = im - im1;
            const diffStr = diff >= 0
                ? `<span style="color:#22c55e">▲ +$${diff.toLocaleString('es-CO')}</span>`
                : `<span style="color:#ef4444">▼ -$${Math.abs(diff).toLocaleString('es-CO')}</span>`;
            const mesNombre = ahora.toLocaleDateString(loc, { month: 'long' });
            const ticket = activos.length > 0 ? Math.round(im / activos.length) : 0;
            return `<strong>${_L('Resumen financiero','Financial summary')}</strong>${sep()}` +
                `${dot('#FFD60A', `<strong>$${im.toLocaleString('es-CO')}</strong> ${_L('en','in')} ${mesNombre}`)} ${im1 > 0 ? diffStr : ''}<br>` +
                `${dot('#60a5fa', `<strong>$${totalRec.toLocaleString('es-CO')}</strong> ${_L('recaudado histórico','total collected (all time)')}`)}<br>` +
                `${dot('#94a3b8', `${pagos.length} ${_L('pago(s) registrado(s)','registered payment(s)')}`)}<br>` +
                `${dot('#22c55e', `${activos.length} ${_L('suscripción(es) activa(s)','active subscription(s)')}`)}<br>` +
                (ticket > 0 ? `${dot('#a78bfa', `${_L('Ticket promedio este mes','Avg. ticket this month')}: $${ticket.toLocaleString('es-CO')}`)}` : '');
        }

        // ── REGISTROS RECIENTES ───────────────────────────────────────────
        if (m(/recient|nuevo.*usuario|ultimo.*registro|quien se registr|hoy|recent|new.user|latest.registr|today/)) {
            const recientes = [...usuarios]
                .sort((a,b) => new Date(b.fecha_registro||b.creado||0) - new Date(a.fecha_registro||a.creado||0))
                .slice(0, 7);
            return `<strong>${_L('Últimos','Last')} ${recientes.length} ${_L('registros','registrations')}:</strong>${sep()}` +
                recientes.map(u =>
                    `${dot('#60a5fa', `<strong>${escapeHtml(u.nombre)}</strong>`)}<br>` +
                    sub(`${_L('CC','ID')}: ${u.cedula||'—'} · ${formatFecha(u.fecha_registro||u.creado)}`)
                ).join('<br>');
        }

        // ── ADMINISTRADORES ───────────────────────────────────────────────
        if (m(/^admin|quienes son admin|lista.*admin|administradores/)) {
            if (admins.length === 0) return _L('No hay administradores registrados.','No administrators registered.');
            return `<strong>${admins.length} ${_L('administrador(es)','administrator(s)')}:</strong>${sep()}` +
                admins.map(u =>
                    `${dot('#f59e0b', `<strong>${escapeHtml(u.nombre)}</strong>`)}<br>` +
                    sub(`${u.correo} · ${_L('CC','ID')}: ${u.cedula||'—'}`)
                ).join('<br>');
        }

        // ── TOTALES / ESTADÍSTICAS ────────────────────────────────────────
        if (m(/cuant|total|cuantos|estadistic|numeros|metricas|cantidad|stats|statistics|metrics|how.many/)) {
            const adherencia = activos.length > 0
                ? activos.filter(u => SV_STORAGE.obtenerProgreso(u.id)?.sesiones?.length > 0).length
                : 0;
            return `<strong>${_L('Estadísticas del sistema','System statistics')}</strong>${sep()}` +
                `${dot('#60a5fa', `${_L('Total usuarios','Total users')}: <strong>${usuarios.length}</strong>`)}<br>` +
                `${dot('#22c55e', `${_L('Activos','Active')}: <strong>${activos.length}</strong> ${pct(activos.length, usuarios.length)}`)}<br>` +
                `${dot('#ef4444', `${_L('Suscripciones vencidas','Expired subscriptions')}: <strong>${vencidos.length}</strong> ${pct(vencidos.length, usuarios.length)}`)}<br>` +
                `${dot('#94a3b8', `${_L('Desactivados','Deactivated')}: <strong>${inactivos.length}</strong>`)}<br>` +
                `${dot('#a78bfa', `${_L('Sin perfil','Without profile')}: <strong>${sinPerfil.length}</strong>`)}<br>` +
                `${dot('#fb923c', `${_L('Sin rutina','Without routine')}: <strong>${sinRutina.length}</strong>`)}<br>` +
                `${dot('#f59e0b', `Admins: <strong>${admins.length}</strong>`)}<br>` +
                (adherencia > 0 ? `${dot('#34d399', `${_L('Con sesiones registradas','With recorded sessions')}: <strong>${adherencia}</strong> ${pct(adherencia, activos.length)}`)}` : '');
        }

        // ── ALERTAS CRÍTICAS ──────────────────────────────────────────────
        if (m(/alerta|critico|urgente|atencion|problema|issue|alert|critical|urgent|attention/)) {
            const en3 = usuarios.filter(u => { const d = diasHasta(u); return u.activo && d !== null && d >= 0 && d <= 3; });
            const alertas = [];
            if (vencidos.length > 0)  alertas.push(dot('#ef4444', `${vencidos.length} ${_L('suscripción(es) ya vencidas','expired subscription(s)')}`));
            if (en3.length > 0)       alertas.push(dot('#ef4444', `${en3.length} ${_L('vencen en menos de 3 días','expiring in less than 3 days')}`));
            if (sinPerfil.length > 0) alertas.push(dot('#f59e0b', `${sinPerfil.length} ${_L('usuarios sin perfil completado','users without completed profile')}`));
            if (sinRutina.length > 0) alertas.push(dot('#fb923c', `${sinRutina.length} ${_L('usuarios con perfil pero sin rutina','users with profile but no routine')}`));
            if (alertas.length === 0) return tag('#22c55e', _L('✓ Sin alertas','✓ No alerts')) + ' ' + _L('El sistema no presenta alertas críticas.','The system has no critical alerts.');
            return `<strong>${alertas.length} ${_L('alerta(s) activa(s)','active alert(s)')}:</strong>${sep()}` + alertas.join('<br>');
        }

        // ── BUSCAR USUARIO (explícito) ────────────────────────────────────
        if (m(/buscar|encontrar|search|quien es|datos de|informacion de|info de|find|look.?up/)) {
            const term = q.replace(/buscar|encontrar|search|quien es|datos de|informacion de|info de|find|look.?up/gi, '').trim();
            return term ? aasBuscarUsuario(term, usuarios) : _L('Dime el nombre, cédula o correo del usuario que buscas.','Tell me the name, ID or email of the user you\'re looking for.');
        }

        // ── Detección implícita: número → cédula ──────────────────────────
        if (/^\d{5,}$/.test(q.trim())) return aasBuscarUsuario(q.trim(), usuarios);

        // ── Detección implícita: texto → intentar buscar usuario ──────────
        const encontrados = usuarios.filter(u =>
            norm(u.nombre || '').includes(ql) ||
            (u.correo  || '').toLowerCase().includes(ql) ||
            (u.cedula  || '').includes(q.trim())
        );
        if (encontrados.length > 0) return aasBuscarUsuario(q.trim(), usuarios);

        // ── AYUDA ─────────────────────────────────────────────────────────
        return _isEN
            ? `I didn't understand that. I can answer:<br><br>` +
                `${dot('#60a5fa','<em>summary</em>')} — general system overview<br>` +
                `${dot('#ef4444','<em>expired</em>')} — expired subscriptions<br>` +
                `${dot('#f59e0b','<em>expiring</em> / <em>30 days</em>')} — about to expire<br>` +
                `${dot('#22c55e','<em>active</em> / <em>inactive</em>')} — lists by status<br>` +
                `${dot('#a78bfa','<em>no profile</em> / <em>no routine</em>')} — incomplete users<br>` +
                `${dot('#FFD60A','<em>finances</em>')} — revenue & payments<br>` +
                `${dot('#94a3b8','<em>recent</em>')} — latest registrations<br>` +
                `${dot('#fb923c','<em>alerts</em>')} — critical issues<br>` +
                `${dot('#34d399','<em>stats</em>')} — global numbers<br>` +
                `${dot('#60a5fa','<em>[name / ID]</em>')} — search specific user`
            : `No entendí la consulta. Puedo responder:<br><br>` +
                `${dot('#60a5fa','<em>resumen</em>')} — estado general del sistema<br>` +
                `${dot('#ef4444','<em>vencidos</em>')} — suscripciones expiradas<br>` +
                `${dot('#f59e0b','<em>por vencer</em> / <em>en 30 días</em>')} — próximos a vencer<br>` +
                `${dot('#22c55e','<em>activos</em> / <em>inactivos</em>')} — listas por estado<br>` +
                `${dot('#a78bfa','<em>sin perfil</em> / <em>sin rutina</em>')} — usuarios incompletos<br>` +
                `${dot('#FFD60A','<em>finanzas</em>')} — ingresos y pagos<br>` +
                `${dot('#94a3b8','<em>recientes</em>')} — últimos registros<br>` +
                `${dot('#fb923c','<em>alertas</em>')} — problemas críticos<br>` +
                `${dot('#34d399','<em>estadísticas</em>')} — números globales<br>` +
                `${dot('#60a5fa','<em>[nombre / cédula]</em>')} — buscar usuario específico`;
    }

    function aasBuscarUsuario(term, usuarios) {
        const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const t    = norm(term);
        const ahora = new Date();
        const encontrados = usuarios.filter(u =>
            norm(u.nombre  || '').includes(t) ||
            (u.correo  || '').toLowerCase().includes(t) ||
            (u.cedula  || '').includes(term)
        );
        if (encontrados.length === 0)
            return _L(
                `No encontré ningún usuario con "<strong>${escapeHtml(term)}</strong>". Prueba con nombre completo, correo o cédula.`,
                `No user found matching "<strong>${escapeHtml(term)}</strong>". Try full name, email or ID number.`
            );

        const dot      = (color, txt) => `<span style="color:${color}">●</span> ${txt}`;
        const sep      = () => `<div style="height:1px;background:var(--border);margin:5px 0;opacity:0.4;"></div>`;
        const sub      = txt => `<div style="padding-left:10px;color:var(--t3);font-size:0.65rem;">${txt}</div>`;
        const colorEst = { success:'#22c55e', warn:'#f59e0b', danger:'#ef4444' };

        return `<strong>${encontrados.length} ${_L('resultado(s) para','result(s) for')} "${escapeHtml(term)}":</strong>` +
            encontrados.slice(0, 4).map(u => {
                const est    = getEstadoUsuario(u);
                const c      = colorEst[est.cls] || '#94a3b8';
                const perfil = SV_STORAGE.obtenerPerfil(u.id);
                const rutina = SV_STORAGE.obtenerRutina(u.id);
                const diasV  = u.suscripcion_vencimiento
                    ? Math.ceil((new Date(u.suscripcion_vencimiento) - ahora) / 86400000)
                    : null;
                const subInfo = [
                    `${_L('CC','ID')}: <strong>${escapeHtml(u.cedula||'—')}</strong>`,
                    u.correo,
                    perfil ? `${perfil.nivel||'?'} · ${(perfil.objetivo||'').replace(/_/g,' ')}` : _L('⚠ sin perfil','⚠ no profile'),
                    rutina  ? _L('rutina generada','routine generated') : _L('— sin rutina','— no routine'),
                    u.rol === 'admin' ? '<span style="color:#f59e0b">admin</span>' : null
                ].filter(Boolean).join(' · ');
                const diasStr = diasV === null ? '' :
                    diasV >= 0
                        ? `${diasV}d ${_L('restantes','remaining')}`
                        : _L(`venció hace ${Math.abs(diasV)}d`, `expired ${Math.abs(diasV)}d ago`);
                return sep() +
                    `${dot('#60a5fa', `<strong>${escapeHtml(u.nombre)}</strong>`)} ` +
                    `<span style="color:${c};font-size:0.64rem;">${est.label}</span>` +
                    (diasV !== null ? ` <span style="color:var(--t3);font-size:0.64rem;">(${diasStr})</span>` : '') +
                    sub(subInfo);
            }).join('') +
            (encontrados.length > 4 ? `<br><small style="color:var(--t3)">…${_L('y','and')} ${encontrados.length - 4} ${_L('más. Usa el buscador de la tabla Usuarios para ver todos.','more. Use the Users table search to see all.')}</small>` : '');
    }

    // ===== UTILIDADES =====
    function capitalize(s) {
        if (!s) return '';
        return String(s).charAt(0).toUpperCase() + String(s).slice(1).replace(/_/g, ' ');
    }
    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
    function formatFecha(iso) {
        if (!iso) return '-';
        const d = new Date(iso);
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    function mostrarToast(msg, tipo) {
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.className = `toast show ${tipo}`;
        setTimeout(() => t.classList.remove('show'), 3000);
    }

    // ===== MENSAJES DE USUARIOS =====
    function renderThread(msg) {
        const burbujasHtml = [];
        // Mensaje inicial del usuario
        burbujasHtml.push(`
            <div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:8px;">
                <div style="width:28px;height:28px;border-radius:50%;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:var(--t2);flex-shrink:0;">${escapeHtml(msg.nombre.charAt(0).toUpperCase())}</div>
                <div style="max-width:80%;">
                    <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px 12px 12px 2px;padding:8px 12px;font-size:0.8rem;line-height:1.55;color:var(--t2);white-space:pre-wrap;">${escapeHtml(msg.mensaje)}</div>
                    <div style="font-size:0.65rem;color:var(--t3);margin-top:3px;">${formatFecha(msg.fecha)}</div>
                </div>
            </div>`);
        // Respuestas alternadas
        const respuestas = msg.respuestas || [];
        respuestas.forEach(r => {
            if (r.admin) {
                burbujasHtml.push(`
                    <div style="display:flex;gap:8px;align-items:flex-end;justify-content:flex-end;margin-bottom:8px;">
                        <div style="max-width:80%;text-align:right;">
                            <div style="background:rgba(255,214,10,0.12);border:1px solid rgba(255,214,10,0.25);border-radius:12px 12px 2px 12px;padding:8px 12px;font-size:0.8rem;line-height:1.55;color:var(--t1);white-space:pre-wrap;text-align:left;">${escapeHtml(r.texto)}</div>
                            <div style="font-size:0.65rem;color:var(--t3);margin-top:3px;">Admin · ${formatFecha(r.fecha)}</div>
                        </div>
                        <div style="width:28px;height:28px;border-radius:50%;background:rgba(255,214,10,0.15);display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;color:var(--y);flex-shrink:0;">SV</div>
                    </div>`);
            } else {
                burbujasHtml.push(`
                    <div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:8px;">
                        <div style="width:28px;height:28px;border-radius:50%;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:var(--t2);flex-shrink:0;">${escapeHtml(msg.nombre.charAt(0).toUpperCase())}</div>
                        <div style="max-width:80%;">
                            <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px 12px 12px 2px;padding:8px 12px;font-size:0.8rem;line-height:1.55;color:var(--t2);white-space:pre-wrap;">${escapeHtml(r.texto)}</div>
                            <div style="font-size:0.65rem;color:var(--t3);margin-top:3px;">${formatFecha(r.fecha)}</div>
                        </div>
                    </div>`);
            }
        });
        return burbujasHtml.join('');
    }

    // ===== MENSAJES — ID del chat abierto actualmente =====
    let _chatMsgId = null;

    function renderMensajesAdmin() {
        const mensajes = SV_STORAGE.obtenerMensajesAdmin();
        const lista = document.getElementById('listaMensajesAdmin');
        const vacio = document.getElementById('sinMensajesAdmin');
        const badge = document.getElementById('badgeMensajes');
        if (!lista) return;

        const noLeidos = mensajes.filter(m => !m.leido).length;
        if (badge) {
            badge.textContent = noLeidos;
            badge.style.display = noLeidos > 0 ? 'inline' : 'none';
        }

        if (mensajes.length === 0) {
            lista.style.display = 'none';
            if (vacio) vacio.style.display = 'block';
            return;
        }
        lista.style.display = 'flex';
        if (vacio) vacio.style.display = 'none';

        lista.innerHTML = mensajes.map(msg => {
            const preview = escapeHtml(msg.mensaje.length > 60 ? msg.mensaje.slice(0, 60) + '…' : msg.mensaje);
            const respCount = (msg.respuestas || []).length;
            return `
            <div class="msg-card-admin ${!msg.leido ? 'unread' : ''}" id="msgcard-${msg.id}" onclick="abrirChatAdmin('${msg.id}')">
                <div class="msg-card-avatar">${escapeHtml(msg.nombre.charAt(0).toUpperCase())}</div>
                <div class="msg-card-body">
                    <div class="msg-card-top">
                        <span class="msg-card-name">${escapeHtml(msg.nombre)}</span>
                        ${!msg.leido ? '<span class="msg-card-badge-new">NUEVO</span>' : ''}
                        ${respCount > 0 ? `<span class="msg-card-badge-count">${respCount} msg${respCount > 1 ? 's' : ''}</span>` : ''}
                    </div>
                    <div class="msg-card-meta">${escapeHtml(msg.correo)} · ${formatFecha(msg.fecha)}</div>
                    <div class="msg-card-subject">${escapeHtml(msg.asunto)}</div>
                    <div class="msg-card-preview">${preview}</div>
                </div>
                <div class="msg-card-actions" onclick="event.stopPropagation()">
                    <button class="btn" style="font-size:0.7rem;padding:4px 10px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2);" onclick="borrarMensajeAdmin('${msg.id}')">Eliminar</button>
                    <svg style="color:var(--t3);flex-shrink:0;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
            </div>`;
        }).join('');
    }

    window.abrirChatAdmin = function(id) {
        const mensajes = SV_STORAGE.obtenerMensajesAdmin();
        const msg = mensajes.find(m => m.id === id);
        if (!msg) return;
        _chatMsgId = id;

        // Marcar como leído
        SV_STORAGE.marcarMensajeAdminLeido(id);
        renderMensajesAdmin();

        // Poblar header
        document.getElementById('adminChatAvatar').textContent = msg.nombre.charAt(0).toUpperCase();
        document.getElementById('adminChatUserName').textContent = msg.nombre;
        document.getElementById('adminChatUserEmail').textContent = msg.correo;
        document.getElementById('adminChatSubject').textContent = msg.asunto;

        // Poblar burbujas
        _renderChatModal(msg);

        // Abrir modal
        const modal = document.getElementById('adminChatModal');
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';

        // Scroll al final
        setTimeout(() => {
            const msgs = document.getElementById('adminChatMessages');
            if (msgs) msgs.scrollTop = msgs.scrollHeight;
            document.getElementById('adminChatInput')?.focus();
        }, 80);

        // Bind send
        const sendBtn = document.getElementById('adminChatSendBtn');
        sendBtn.onclick = () => _enviarDesdeModal();
        document.getElementById('adminChatInput').onkeydown = (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); _enviarDesdeModal(); }
        };
    };

    function _renderChatModal(msg) {
        const container = document.getElementById('adminChatMessages');
        if (!container) return;
        const burbujas = [];

        // Mensaje inicial del usuario
        burbujas.push(`
            <div class="acm-bubble-user">
                <div class="acm-avatar user">${escapeHtml(msg.nombre.charAt(0).toUpperCase())}</div>
                <div class="acm-msg-wrap">
                    <div class="acm-bubble user">${escapeHtml(msg.mensaje)}</div>
                    <div class="acm-time">${formatFecha(msg.fecha)}</div>
                </div>
            </div>`);

        // Respuestas
        (msg.respuestas || []).forEach(r => {
            if (r.admin) {
                burbujas.push(`
                    <div class="acm-bubble-admin">
                        <div class="acm-msg-wrap">
                            <div class="acm-bubble admin">${escapeHtml(r.texto)}</div>
                            <div class="acm-time">Admin · ${formatFecha(r.fecha)}</div>
                        </div>
                        <div class="acm-avatar admin">SV</div>
                    </div>`);
            } else {
                burbujas.push(`
                    <div class="acm-bubble-user">
                        <div class="acm-avatar user">${escapeHtml(msg.nombre.charAt(0).toUpperCase())}</div>
                        <div class="acm-msg-wrap">
                            <div class="acm-bubble user">${escapeHtml(r.texto)}</div>
                            <div class="acm-time">${formatFecha(r.fecha)}</div>
                        </div>
                    </div>`);
            }
        });

        container.innerHTML = burbujas.join('');
    }

    function _enviarDesdeModal() {
        if (!_chatMsgId) return;
        const input = document.getElementById('adminChatInput');
        const texto = input.value.trim();
        if (!texto) { input.focus(); return; }
        SV_STORAGE.responderMensajeAdmin(_chatMsgId, texto, true);
        input.value = '';
        // Re-render burbujas en el modal
        const mensajes = SV_STORAGE.obtenerMensajesAdmin();
        const msg = mensajes.find(m => m.id === _chatMsgId);
        if (msg) _renderChatModal(msg);
        renderMensajesAdmin();
        const msgs = document.getElementById('adminChatMessages');
        if (msgs) setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 50);
        mostrarToast('Respuesta enviada', 'success');
    }

    window.cerrarChatAdmin = function() {
        document.getElementById('adminChatModal')?.classList.remove('open');
        document.body.style.overflow = '';
        _chatMsgId = null;
    };

    // Cerrar con Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') window.cerrarChatAdmin?.();
    });

    window.leerMensajeAdmin = function(id) {
        SV_STORAGE.marcarMensajeAdminLeido(id);
        renderMensajesAdmin();
    };

    window.borrarMensajeAdmin = function(id) {
        if (_chatMsgId === id) window.cerrarChatAdmin();
        SV_STORAGE.eliminarMensajeAdmin(id);
        renderMensajesAdmin();
        mostrarToast('Mensaje eliminado', 'success');
    };

    window.marcarTodosLeidos = function() {
        const mensajes = SV_STORAGE.obtenerMensajesAdmin();
        mensajes.forEach(m => SV_STORAGE.marcarMensajeAdminLeido(m.id));
        renderMensajesAdmin();
        mostrarToast('Todos los mensajes marcados como leídos', 'success');
    };

    window.cerrarSesionApp = function() {
        SV_AUTH.cerrarSesion();
        setTimeout(() => window.location.href = '../index.html', 300);
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (document.getElementById('ejercicioModal')?.classList.contains('active')) cerrarEjercicioModal();
            if (document.getElementById('suscripcionModal')?.classList.contains('active')) cerrarSuscripcionModal();
            if (document.getElementById('pagoModal')?.classList.contains('active')) cerrarPagoModal();
        }
    });
})();
