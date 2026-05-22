/**
 * StrongVision - Módulo de Storage
 * ================================
 * Capa de persistencia que utiliza localStorage para simular las bases de datos
 * (gestión de usuarios, autenticación, rutinas, progreso).
 *
 * Cumple con:
 * - ISO 25010 (Mantenibilidad: módulo independiente y testeable)
 * - CMMI Gestión de configuración (versionado de estructuras)
 *
 * NOTA: En producción esto sería reemplazado por una API REST con backend real.
 */

const SV_STORAGE = (function () {
    'use strict';

    const KEYS = {
        USUARIOS: 'sv_usuarios',
        SESION: 'sv_sesion_actual',
        PERFIL_PREFIX: 'sv_perfil_',
        RUTINA_PREFIX: 'sv_rutina_',
        PROGRESO_PREFIX: 'sv_progreso_',
        AJUSTES_PREFIX: 'sv_ajustes_',
        GAMI_PREFIX: 'sv_gami_',
        CHAT_PREFIX: 'sv_chat_',
        PAGOS: 'sv_pagos',
        RECOVERY: 'sv_recovery',
        VERSION: 'sv_version'
    };

    const VERSION_ACTUAL = '1.0.0';

    // ===== PAGOS =====
    function obtenerPagos() {
        try { return JSON.parse(localStorage.getItem(KEYS.PAGOS)) || []; }
        catch { return []; }
    }

    function guardarPagos(pagos) {
        localStorage.setItem(KEYS.PAGOS, JSON.stringify(pagos));
    }

    function registrarPago(usuarioId, monto, concepto) {
        const pagos = obtenerPagos();
        const pago = {
            id: generarId(),
            usuarioId,
            monto: parseFloat(monto) || 0,
            concepto: concepto || 'Suscripción mensual',
            fecha: new Date().toISOString(),
            estado: 'pagado'
        };
        pagos.push(pago);
        guardarPagos(pagos);
        return pago;
    }

    function eliminarPago(pagoId) {
        const pagos = obtenerPagos().filter(p => p.id !== pagoId);
        guardarPagos(pagos);
    }

    // Inicializa la "DB" si está vacía
    function init() {
        if (!localStorage.getItem(KEYS.USUARIOS)) {
            localStorage.setItem(KEYS.USUARIOS, JSON.stringify([]));
        }
        if (!localStorage.getItem(KEYS.VERSION)) {
            localStorage.setItem(KEYS.VERSION, VERSION_ACTUAL);
        }

        // Crear cuenta admin por defecto si no existe ningún admin
        const usuarios = obtenerUsuarios();
        const hayAdmin = usuarios.some(u => u.rol === 'admin');
        if (!hayAdmin) {
            const adminDefault = {
                id: 'admin-default',
                nombre: 'Administrador',
                correo: 'admin@strongvision.app',
                password: hashSimple('Admin123!'),
                ciudad: 'Sistema',
                direccion: 'Sistema',
                rol: 'admin',
                activo: true,
                fecha_registro: new Date().toISOString()
            };
            usuarios.push(adminDefault);
            localStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuarios));
        }
    }

    // ===== USUARIOS =====
    function obtenerUsuarios() {
        try {
            return JSON.parse(localStorage.getItem(KEYS.USUARIOS)) || [];
        } catch {
            return [];
        }
    }

    function guardarUsuarios(usuarios) {
        localStorage.setItem(KEYS.USUARIOS, JSON.stringify(usuarios));
    }

    function buscarUsuarioPorCorreo(correo) {
        const usuarios = obtenerUsuarios();
        return usuarios.find(u => u.correo.toLowerCase() === correo.toLowerCase()) || null;
    }

    function buscarUsuarioPorCedula(cedula) {
        const usuarios = obtenerUsuarios();
        return usuarios.find(u => u.cedula === String(cedula).trim()) || null;
    }

    function crearUsuario(datos) {
        const usuarios = obtenerUsuarios();
        const usuario = {
            id: generarId(),
            nombre: datos.nombre,
            cedula: datos.cedula || '',
            correo: datos.correo.toLowerCase(),
            password: hashSimple(datos.password), // NO usar en producción
            ciudad: datos.ciudad,
            direccion: datos.direccion,
            fecha_registro: new Date().toISOString(),
            activo: true,
            rol: datos.rol || 'usuario'
        };
        usuarios.push(usuario);
        guardarUsuarios(usuarios);
        return usuario;
    }

    function actualizarUsuario(id, cambios) {
        const usuarios = obtenerUsuarios();
        const idx = usuarios.findIndex(u => u.id === id);
        if (idx === -1) return null;
        usuarios[idx] = { ...usuarios[idx], ...cambios };
        guardarUsuarios(usuarios);
        return usuarios[idx];
    }

    function eliminarUsuario(id) {
        const usuarios = obtenerUsuarios().filter(u => u.id !== id);
        guardarUsuarios(usuarios);
        // Eliminar todos los datos asociados
        localStorage.removeItem(KEYS.PERFIL_PREFIX + id);
        localStorage.removeItem(KEYS.RUTINA_PREFIX + id);
        localStorage.removeItem(KEYS.PROGRESO_PREFIX + id);
        localStorage.removeItem(KEYS.AJUSTES_PREFIX + id);
        localStorage.removeItem(KEYS.GAMI_PREFIX + id);
        localStorage.removeItem(KEYS.CHAT_PREFIX + id);
    }

    // ===== SESIÓN =====
    function guardarSesion(usuarioId) {
        const sesion = {
            usuarioId,
            inicio: new Date().toISOString()
        };
        localStorage.setItem(KEYS.SESION, JSON.stringify(sesion));
    }

    function obtenerSesion() {
        try {
            return JSON.parse(localStorage.getItem(KEYS.SESION));
        } catch {
            return null;
        }
    }

    function cerrarSesion() {
        localStorage.removeItem(KEYS.SESION);
    }

    function obtenerUsuarioActual() {
        const sesion = obtenerSesion();
        if (!sesion) return null;
        const usuarios = obtenerUsuarios();
        return usuarios.find(u => u.id === sesion.usuarioId) || null;
    }

    // ===== PERFIL FÍSICO =====
    function guardarPerfil(usuarioId, perfil) {
        const datos = { ...perfil, actualizado: new Date().toISOString() };
        localStorage.setItem(KEYS.PERFIL_PREFIX + usuarioId, JSON.stringify(datos));
        return datos;
    }

    function obtenerPerfil(usuarioId) {
        try {
            return JSON.parse(localStorage.getItem(KEYS.PERFIL_PREFIX + usuarioId));
        } catch {
            return null;
        }
    }

    // ===== RUTINA ACTIVA =====
    function guardarRutina(usuarioId, rutina) {
        const datos = { ...rutina, generada: new Date().toISOString() };
        localStorage.setItem(KEYS.RUTINA_PREFIX + usuarioId, JSON.stringify(datos));
        return datos;
    }

    function obtenerRutina(usuarioId) {
        try {
            return JSON.parse(localStorage.getItem(KEYS.RUTINA_PREFIX + usuarioId));
        } catch {
            return null;
        }
    }

    function eliminarRutina(usuarioId) {
        localStorage.removeItem(KEYS.RUTINA_PREFIX + usuarioId);
    }

    // ===== PROGRESO =====
    function obtenerProgreso(usuarioId) {
        try {
            const data = JSON.parse(localStorage.getItem(KEYS.PROGRESO_PREFIX + usuarioId));
            return data || { sesiones: [], molestias: [] };
        } catch {
            return { sesiones: [], molestias: [] };
        }
    }

    function guardarProgreso(usuarioId, progreso) {
        localStorage.setItem(KEYS.PROGRESO_PREFIX + usuarioId, JSON.stringify(progreso));
    }

    function registrarSesion(usuarioId, datosSesion) {
        const progreso = obtenerProgreso(usuarioId);
        progreso.sesiones.push({
            id: generarId(),
            fecha: new Date().toISOString(),
            ...datosSesion
        });
        guardarProgreso(usuarioId, progreso);
        return progreso;
    }

    function registrarMolestia(usuarioId, zona, ejercicio = null) {
        const progreso = obtenerProgreso(usuarioId);
        progreso.molestias.push({
            id: generarId(),
            fecha: new Date().toISOString(),
            zona,
            ejercicio
        });
        guardarProgreso(usuarioId, progreso);
        return progreso;
    }

    // ===== GAMIFICACIÓN =====
    function obtenerGami(usuarioId) {
        try {
            const data = JSON.parse(localStorage.getItem(KEYS.GAMI_PREFIX + usuarioId));
            return data || { xp: 0, nivel: 1, racha: 0, ultima_sesion: null, logros: [] };
        } catch {
            return { xp: 0, nivel: 1, racha: 0, ultima_sesion: null, logros: [] };
        }
    }

    function guardarGami(usuarioId, gami) {
        localStorage.setItem(KEYS.GAMI_PREFIX + usuarioId, JSON.stringify(gami));
    }

    // ===== AJUSTES =====
    function obtenerAjustes(usuarioId) {
        try {
            const data = JSON.parse(localStorage.getItem(KEYS.AJUSTES_PREFIX + usuarioId));
            return data || {
                notificaciones: true,
                motivacionales: true,
                recordatorios: { activos: false, dia: 'lunes', hora: '07:00' },
                tema: 'oscuro'
            };
        } catch {
            return {
                notificaciones: true,
                motivacionales: true,
                recordatorios: { activos: false, dia: 'lunes', hora: '07:00' },
                tema: 'oscuro'
            };
        }
    }

    function guardarAjustes(usuarioId, ajustes) {
        localStorage.setItem(KEYS.AJUSTES_PREFIX + usuarioId, JSON.stringify(ajustes));
    }

    // ===== CHAT IA =====
    function obtenerHistorialChat(usuarioId) {
        try {
            return JSON.parse(localStorage.getItem(KEYS.CHAT_PREFIX + usuarioId)) || [];
        } catch {
            return [];
        }
    }

    function agregarMensajeChat(usuarioId, mensaje) {
        const historial = obtenerHistorialChat(usuarioId);
        historial.push({
            id: generarId(),
            fecha: new Date().toISOString(),
            ...mensaje
        });
        // Limitar a últimos 100 mensajes
        const limitado = historial.slice(-100);
        localStorage.setItem(KEYS.CHAT_PREFIX + usuarioId, JSON.stringify(limitado));
        return limitado;
    }

    function limpiarChat(usuarioId) {
        localStorage.removeItem(KEYS.CHAT_PREFIX + usuarioId);
    }

    // ===== MENSAJES AL ADMIN =====
    const KEY_MSG_ADMIN = 'sv_mensajes_admin';

    function obtenerMensajesAdmin() {
        try { return JSON.parse(localStorage.getItem(KEY_MSG_ADMIN)) || []; }
        catch { return []; }
    }

    function guardarMensajeAdmin(datos) {
        const mensajes = obtenerMensajesAdmin();
        const msg = {
            id: generarId(),
            usuarioId: datos.usuarioId || '',
            nombre: datos.nombre || 'Anónimo',
            correo: datos.correo || '',
            asunto: datos.asunto || 'Sin asunto',
            mensaje: datos.mensaje || '',
            fecha: new Date().toISOString(),
            leido: false,
            respuestas: [],
            respuestaNoVista: false
        };
        mensajes.unshift(msg);
        localStorage.setItem(KEY_MSG_ADMIN, JSON.stringify(mensajes));
        return msg;
    }

    function responderMensajeAdmin(msgId, texto, esAdmin) {
        const mensajes = obtenerMensajesAdmin();
        const msg = mensajes.find(m => m.id === msgId);
        if (!msg) return null;
        if (!msg.respuestas) msg.respuestas = [];
        const reply = {
            id: generarId(),
            texto: texto,
            fecha: new Date().toISOString(),
            admin: esAdmin !== false
        };
        msg.respuestas.push(reply);
        if (esAdmin !== false) {
            msg.respuestaNoVista = true;
            msg.leido = true;
        } else {
            msg.leido = false;
        }
        localStorage.setItem(KEY_MSG_ADMIN, JSON.stringify(mensajes));
        return reply;
    }

    function obtenerMensajesUsuario(usuarioId) {
        return obtenerMensajesAdmin().filter(m => m.usuarioId === usuarioId);
    }

    function marcarRespuestasVistas(usuarioId) {
        const mensajes = obtenerMensajesAdmin();
        let changed = false;
        mensajes.forEach(m => {
            if (m.usuarioId === usuarioId && m.respuestaNoVista) {
                m.respuestaNoVista = false;
                changed = true;
            }
        });
        if (changed) localStorage.setItem(KEY_MSG_ADMIN, JSON.stringify(mensajes));
    }

    function marcarMensajeAdminLeido(id) {
        const mensajes = obtenerMensajesAdmin();
        const msg = mensajes.find(m => m.id === id);
        if (msg) { msg.leido = true; localStorage.setItem(KEY_MSG_ADMIN, JSON.stringify(mensajes)); }
    }

    function eliminarMensajeAdmin(id) {
        const mensajes = obtenerMensajesAdmin().filter(m => m.id !== id);
        localStorage.setItem(KEY_MSG_ADMIN, JSON.stringify(mensajes));
    }

    // ===== UTILIDADES =====
    function generarId() {
        return 'sv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
    }

    function hashSimple(str) {
        // Hash básico (NO usar en producción real, solo para simular)
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'h_' + Math.abs(hash).toString(36);
    }

    function verificarPassword(passwordPlano, hash) {
        return hashSimple(passwordPlano) === hash;
    }

    // ===== CÓDIGOS DE RECUPERACIÓN =====
    function guardarCodigoRecuperacion(correo, codigo) {
        const datos = JSON.parse(localStorage.getItem(KEYS.RECOVERY) || '{}');
        datos[correo.toLowerCase()] = {
            codigo,
            expiry: Date.now() + 15 * 60 * 1000 // 15 minutos
        };
        localStorage.setItem(KEYS.RECOVERY, JSON.stringify(datos));
    }

    function verificarCodigoRecuperacion(correo, codigo) {
        const datos = JSON.parse(localStorage.getItem(KEYS.RECOVERY) || '{}');
        const entry = datos[correo.toLowerCase()];
        if (!entry) return false;
        if (Date.now() > entry.expiry) return false;
        return entry.codigo === String(codigo).trim();
    }

    function limpiarCodigoRecuperacion(correo) {
        const datos = JSON.parse(localStorage.getItem(KEYS.RECOVERY) || '{}');
        delete datos[correo.toLowerCase()];
        localStorage.setItem(KEYS.RECOVERY, JSON.stringify(datos));
    }

    // Inicializar al cargar
    init();

    // API pública
    return {
        // Usuarios
        obtenerUsuarios,
        buscarUsuarioPorCorreo,
        buscarUsuarioPorCedula,
        crearUsuario,
        actualizarUsuario,
        eliminarUsuario,
        // Sesión
        guardarSesion,
        obtenerSesion,
        cerrarSesion,
        obtenerUsuarioActual,
        // Perfil
        guardarPerfil,
        obtenerPerfil,
        // Rutina
        guardarRutina,
        obtenerRutina,
        eliminarRutina,
        // Progreso
        obtenerProgreso,
        guardarProgreso,
        registrarSesion,
        registrarMolestia,
        // Gamificación
        obtenerGami,
        guardarGami,
        // Ajustes
        obtenerAjustes,
        guardarAjustes,
        // Chat
        obtenerHistorialChat,
        agregarMensajeChat,
        limpiarChat,
        // Pagos
        obtenerPagos,
        guardarPagos,
        registrarPago,
        eliminarPago,
        // Recuperación
        guardarCodigoRecuperacion,
        verificarCodigoRecuperacion,
        limpiarCodigoRecuperacion,
        // Mensajes al admin
        obtenerMensajesAdmin,
        guardarMensajeAdmin,
        marcarMensajeAdminLeido,
        eliminarMensajeAdmin,
        responderMensajeAdmin,
        obtenerMensajesUsuario,
        marcarRespuestasVistas,
        // Utilidades
        verificarPassword,
        hashSimple,
        generarId
    };
})();
