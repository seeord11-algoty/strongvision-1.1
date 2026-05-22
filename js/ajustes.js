/**
 * StrongVision - Ajustes JS
 * Cubre TC-032, TC-033, TC-039, TC-040, TC-041
 */

(function() {
    'use strict';

    if (!SV_AUTH.requireAuth('../index.html')) return;
    let usuario = SV_STORAGE.obtenerUsuarioActual();

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

        cargarDatos();

        document.getElementById('cuentaForm').addEventListener('submit', guardarCuenta);
        document.getElementById('btnGuardarAjustes').addEventListener('click', guardarAjustes);
        document.getElementById('btnExportarDatos').addEventListener('click', exportarDatos);
        document.getElementById('btnLimpiarHistorial').addEventListener('click', limpiarHistorialChat);
        document.getElementById('btnEliminarCuenta').addEventListener('click', confirmarEliminacion);
        document.getElementById('optReducirAnim').addEventListener('change', toggleReducirAnim);
    });

    function cargarDatos() {
        document.getElementById('cNombre').value = usuario.nombre || '';
        document.getElementById('cCorreo').value = usuario.correo || '';
        document.getElementById('cCiudad').value = usuario.ciudad || '';
        document.getElementById('cDireccion').value = usuario.direccion || '';

        const ajustes = SV_STORAGE.obtenerAjustes(usuario.id);

        document.getElementById('optRecordatorios').checked = ajustes.recordatorios !== false;
        document.getElementById('recHora').value = ajustes.hora_recordatorio || '07:00';
        (ajustes.dias_recordatorio || []).forEach(d => {
            const cb = document.querySelector(`input[name="dia-rec"][value="${d}"]`);
            if (cb) cb.checked = true;
        });
        document.getElementById('optNotifSesionOmitida').checked = ajustes.notif_sesion_omitida !== false;
        document.getElementById('optNotifLogros').checked = ajustes.notif_logros !== false;
        document.getElementById('optUnidad').value = ajustes.unidad || 'kg';
        const idiomaGuardado = ajustes.idioma || 'es-CO';
        document.getElementById('optIdioma').value = idiomaGuardado;
        localStorage.setItem('sv_lang', idiomaGuardado);
        document.getElementById('optReducirAnim').checked = ajustes.reducir_anim === true;
    }

    function guardarCuenta(e) {
        e.preventDefault();
        limpiarErrores();

        const nombre = document.getElementById('cNombre').value.trim();
        const ciudad = document.getElementById('cCiudad').value.trim();
        const direccion = document.getElementById('cDireccion').value.trim();
        const passActual = document.getElementById('cPassActual').value;
        const passNueva = document.getElementById('cPassNueva').value;

        const errores = {};
        if (nombre.length < 3) errores.cNombre = 'El nombre debe tener al menos 3 caracteres.';
        if (!ciudad) errores.cCiudad = 'Ciudad es obligatoria.';
        if (!direccion) errores.cDireccion = 'Dirección es obligatoria.';

        // Cambio de password
        if (passNueva) {
            if (!passActual) {
                errores.cPassNueva = 'Ingresa la contraseña actual para cambiarla.';
            } else {
                const valid = SV_AUTH.iniciarSesion(usuario.correo, passActual);
                // Restaurar sesión (la validación cambia de usuario)
                SV_STORAGE.guardarSesion(usuario.id);
                if (!valid.exito) {
                    errores.cPassNueva = 'La contraseña actual es incorrecta.';
                } else if (!validarPassword(passNueva)) {
                    errores.cPassNueva = 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo.';
                }
            }
        }

        if (Object.keys(errores).length > 0) {
            mostrarErrores(errores);
            mostrarToast('Corrige los errores marcados.', 'error');
            return;
        }

        // Persistir
        const datos = { nombre, ciudad, direccion };
        if (passNueva) datos.password = passNueva;

        SV_STORAGE.actualizarUsuario(usuario.id, datos);
        usuario = SV_STORAGE.obtenerUsuarioActual();
        document.getElementById('avatarLetter').textContent = usuario.nombre.charAt(0).toUpperCase();
        document.getElementById('cPassActual').value = '';
        document.getElementById('cPassNueva').value = '';

        mostrarToast('Datos actualizados correctamente ✓', 'success');
    }

    function guardarAjustes() {
        const ajustes = {
            recordatorios: document.getElementById('optRecordatorios').checked,
            hora_recordatorio: document.getElementById('recHora').value,
            dias_recordatorio: Array.from(document.querySelectorAll('input[name="dia-rec"]:checked')).map(c => c.value),
            notif_sesion_omitida: document.getElementById('optNotifSesionOmitida').checked,
            notif_logros: document.getElementById('optNotifLogros').checked,
            unidad: document.getElementById('optUnidad').value,
            idioma: document.getElementById('optIdioma').value,
            reducir_anim: document.getElementById('optReducirAnim').checked
        };
        const prevLang = localStorage.getItem('sv_lang') || 'es-CO';
        SV_STORAGE.guardarAjustes(usuario.id, ajustes);
        localStorage.setItem('sv_lang', ajustes.idioma);
        if (window.SV_I18N) SV_I18N.apply(ajustes.idioma);
        mostrarToast('Preferencias guardadas ✓', 'success');
        toggleReducirAnim();
        if (ajustes.idioma !== prevLang) {
            setTimeout(() => location.reload(), 900);
        }
    }

    function toggleReducirAnim() {
        const reducir = document.getElementById('optReducirAnim').checked;
        if (reducir) {
            document.documentElement.style.setProperty('--transition-fast', '0ms');
            document.documentElement.style.setProperty('--transition-base', '0ms');
            document.documentElement.style.setProperty('--transition-slow', '0ms');
        } else {
            document.documentElement.style.removeProperty('--transition-fast');
            document.documentElement.style.removeProperty('--transition-base');
            document.documentElement.style.removeProperty('--transition-slow');
        }
    }

    // ===== EXPORTAR DATOS (TC-041) =====
    function exportarDatos() {
        const datos = {
            usuario: { ...usuario, password_hash: '[REDACTED]' },
            perfil: SV_STORAGE.obtenerPerfil(usuario.id),
            rutina: SV_STORAGE.obtenerRutina(usuario.id),
            progreso: SV_STORAGE.obtenerProgreso(usuario.id),
            gamificacion: SV_STORAGE.obtenerGami(usuario.id),
            ajustes: SV_STORAGE.obtenerAjustes(usuario.id),
            chat: SV_STORAGE.obtenerHistorialChat(usuario.id),
            exportado: new Date().toISOString(),
            version: '1.0.0'
        };
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `strongvision_export_${usuario.nombre.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        mostrarToast('Tus datos han sido exportados como JSON ✓', 'success');
    }

    // ===== LIMPIAR CHAT =====
    function limpiarHistorialChat() {
        abrirConfirm({
            titulo: 'Limpiar historial de chat',
            texto: 'Se eliminarán todas las conversaciones con el asistente IA. Esta acción no se puede deshacer.',
            requiereTexto: false,
            onConfirm: () => {
                localStorage.removeItem('sv_chat_' + usuario.id);
                mostrarToast('Historial de chat eliminado ✓', 'success');
            }
        });
    }

    // ===== ELIMINAR CUENTA (TC-041) =====
    function confirmarEliminacion() {
        abrirConfirm({
            titulo: '⚠️ Eliminar cuenta permanentemente',
            texto: 'Se borrarán: perfil, rutina, progreso, gamificación, mensajes y la cuenta misma. Esta acción es IRREVERSIBLE.',
            requiereTexto: true,
            onConfirm: () => {
                SV_STORAGE.eliminarUsuario(usuario.id);
                SV_AUTH.cerrarSesion();
                mostrarToast('Cuenta eliminada. Hasta pronto.', 'info');
                setTimeout(() => window.location.href = '../index.html', 1500);
            }
        });
    }

    // ===== MODAL CONFIRMACIÓN =====
    let _confirmCallback = null;
    function abrirConfirm(opts) {
        document.getElementById('confirmTitle').textContent = opts.titulo;
        document.getElementById('confirmText').textContent = opts.texto;
        document.getElementById('confirmInputGroup').style.display = opts.requiereTexto ? 'block' : 'none';
        document.getElementById('confirmInput').value = '';
        _confirmCallback = opts.onConfirm;

        const modal = document.getElementById('confirmModal');
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        document.getElementById('confirmAccept').onclick = () => {
            if (opts.requiereTexto) {
                const texto = document.getElementById('confirmInput').value.trim().toUpperCase();
                const word = window.SV_I18N_CONFIRM_WORD ? window.SV_I18N_CONFIRM_WORD() : 'ELIMINAR';
                if (texto !== word) {
                    mostrarToast(window.SV_I18N ? window.SV_I18N.t('Debes escribir ELIMINAR para confirmar.') : 'Debes escribir ELIMINAR para confirmar.', 'warning');
                    return;
                }
            }
            cerrarConfirm();
            if (_confirmCallback) _confirmCallback();
        };
    }

    window.cerrarConfirm = function() {
        const m = document.getElementById('confirmModal');
        m.classList.remove('active');
        m.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    // ===== UTILIDADES =====
    function validarPassword(p) {
        return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={};':"\\|,.<>\/?¿¡])[A-Za-z\d!@#$%^&*()_+\-={};':"\\|,.<>\/?¿¡]{8,}$/.test(p);
    }
    function mostrarErrores(errores) {
        Object.entries(errores).forEach(([k, v]) => {
            const el = document.getElementById('err-' + k);
            if (el) el.textContent = v;
            const inp = document.getElementById(k);
            if (inp) inp.classList.add('invalid');
        });
    }
    function limpiarErrores() {
        document.querySelectorAll('.error-msg').forEach(e => e.textContent = '');
        document.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
    }
    function mostrarToast(msg, tipo, dur = 3000) {
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.className = `toast show ${tipo}`;
        setTimeout(() => t.classList.remove('show'), dur);
    }

    window.cerrarSesionApp = function() {
        SV_AUTH.cerrarSesion();
        setTimeout(() => window.location.href = '../index.html', 300);
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const m = document.getElementById('confirmModal');
            if (m?.classList.contains('active')) cerrarConfirm();
        }
    });
})();
