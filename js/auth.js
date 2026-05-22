/**
 * StrongVision - Módulo de Autenticación
 * =======================================
 * Cubre los casos de prueba RFU-1 (TC-001 a TC-006) y RFU-2 (TC-007 a TC-010).
 *
 * Validaciones:
 * - Nombre: mínimo 3 caracteres
 * - Correo: formato válido + único
 * - Contraseña: mínimo 8 caracteres, al menos 1 mayúscula, 1 número y 1 símbolo
 * - Ciudad y dirección: requeridos
 */

const SV_AUTH = (function () {
    'use strict';

    // ===== VALIDADORES =====
    const validar = {
        nombre(v) {
            if (!v || v.trim().length === 0) return 'El nombre es obligatorio.';
            if (v.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.';
            return null;
        },
        cedula(v) {
            if (!v || v.trim().length === 0) return 'La cédula es obligatoria.';
            const limpia = v.trim().replace(/\s/g, '');
            if (!/^\d+$/.test(limpia)) return 'La cédula solo puede contener números.';
            if (limpia.length < 6 || limpia.length > 10) return 'La cédula debe tener entre 6 y 10 dígitos.';
            return null;
        },
        correo(v) {
            if (!v || v.trim().length === 0) return 'El correo es obligatorio.';
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regex.test(v.trim())) return 'El correo no tiene un formato válido.';
            return null;
        },
        password(v) {
            if (!v || v.length === 0) return 'La contraseña es obligatoria.';
            if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
            if (!/[A-Z]/.test(v)) return 'La contraseña debe incluir al menos una mayúscula.';
            if (!/[0-9]/.test(v)) return 'La contraseña debe incluir al menos un número.';
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(v)) return 'La contraseña debe incluir al menos un símbolo.';
            return null;
        },
        passwordSimple(v) {
            // Para login: solo verificar que no sea vacía
            if (!v || v.length === 0) return 'La contraseña es obligatoria.';
            return null;
        },
        ciudad(v) {
            if (!v || v.trim().length === 0) return 'La ciudad es obligatoria.';
            return null;
        },
        direccion(v) {
            if (!v || v.trim().length === 0) return 'La dirección es obligatoria.';
            return null;
        }
    };

    // ===== REGISTRO (TC-001 a TC-006) =====
    function registrar(datos) {
        const errores = {};

        const errNombre = validar.nombre(datos.nombre);
        if (errNombre) errores.nombre = errNombre;

        const errCedula = validar.cedula(datos.cedula);
        if (errCedula) errores.cedula = errCedula;

        const errCorreo = validar.correo(datos.correo);
        if (errCorreo) errores.correo = errCorreo;

        const errPassword = validar.password(datos.password);
        if (errPassword) errores.password = errPassword;

        const errCiudad = validar.ciudad(datos.ciudad);
        if (errCiudad) errores.ciudad = errCiudad;

        const errDireccion = validar.direccion(datos.direccion);
        if (errDireccion) errores.direccion = errDireccion;

        // Si hay errores, retornar
        if (Object.keys(errores).length > 0) {
            return { exito: false, errores };
        }

        // Verificar duplicado por correo (TC-002)
        const existente = SV_STORAGE.buscarUsuarioPorCorreo(datos.correo);
        if (existente) {
            return { exito: false, errores: { correo: 'Este correo ya está en uso' } };
        }

        // Verificar duplicado por cédula
        const cedula = datos.cedula.trim();
        const existenteCedula = SV_STORAGE.buscarUsuarioPorCedula(cedula);
        if (existenteCedula) {
            return { exito: false, errores: { cedula: 'Esta cédula ya está registrada' } };
        }

        // Crear usuario
        const usuario = SV_STORAGE.crearUsuario({
            nombre: datos.nombre.trim(),
            cedula,
            correo: datos.correo.trim().toLowerCase(),
            password: datos.password,
            ciudad: datos.ciudad.trim(),
            direccion: datos.direccion.trim(),
            rol: 'usuario',
            acepto_terminos:      datos.acepto_terminos      || false,
            acepto_habeas:        datos.acepto_habeas        || false,
            fecha_consentimiento: datos.fecha_consentimiento || null
        });

        // Auto-login tras registro
        SV_STORAGE.guardarSesion(usuario.id);

        return {
            exito: true,
            usuario,
            mensaje: 'Usuario registrado correctamente en StrongVision.'
        };
    }

    // ===== LOGIN (TC-007, TC-008) =====
    function iniciarSesion(correo, password) {
        const errores = {};

        const errCorreo = validar.correo(correo);
        if (errCorreo) errores.correo = errCorreo;

        const errPassword = validar.passwordSimple(password);
        if (errPassword) errores.password = errPassword;

        if (Object.keys(errores).length > 0) {
            return { exito: false, errores };
        }

        const usuario = SV_STORAGE.buscarUsuarioPorCorreo(correo);
        if (!usuario) {
            return { exito: false, errores: { general: 'Correo o contraseña incorrectos' } };
        }

        if (!usuario.activo) {
            return { exito: false, errores: { general: 'Tu cuenta está desactivada. Contacta al administrador.' }, suscripcionVencida: true };
        }

        if (usuario.suscripcion_vencimiento) {
            const venc = new Date(usuario.suscripcion_vencimiento);
            if (venc < new Date()) {
                return { exito: false, errores: { general: 'Tu suscripción ha vencido. Contacta al administrador para renovar.' }, suscripcionVencida: true };
            }
        }

        if (!SV_STORAGE.verificarPassword(password, usuario.password)) {
            return { exito: false, errores: { general: 'Correo o contraseña incorrectos' } };
        }

        SV_STORAGE.guardarSesion(usuario.id);

        return {
            exito: true,
            usuario,
            mensaje: `Bienvenido de vuelta, ${usuario.nombre}.`
        };
    }

    // ===== CIERRE DE SESIÓN (TC-010) =====
    function cerrarSesion() {
        SV_STORAGE.cerrarSesion();
        return { exito: true, mensaje: 'Has cerrado sesión correctamente.' };
    }

    // ===== RECUPERACIÓN — PASO 1: enviar código (TC-009) =====
    function enviarCodigoRecuperacion(correo) {
        const errCorreo = validar.correo(correo);
        if (errCorreo) return { exito: false, errores: { correo: errCorreo } };

        const usuario = SV_STORAGE.buscarUsuarioPorCorreo(correo);
        if (!usuario) {
            // Respuesta segura: no revelar si el correo existe
            return { exito: true, sinUsuario: true, mensaje: 'Si el correo está registrado, recibirás un código.' };
        }

        const codigo = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
        SV_STORAGE.guardarCodigoRecuperacion(correo, codigo);

        return { exito: true, codigo, nombre: usuario.nombre, correo: usuario.correo };
    }

    // ===== RECUPERACIÓN — PASO 2: verificar código =====
    function verificarCodigoRecuperacion(correo, codigo) {
        if (!correo || !codigo) return { exito: false, error: 'Datos incompletos.' };
        const valido = SV_STORAGE.verificarCodigoRecuperacion(correo, codigo);
        if (!valido) return { exito: false, error: 'Código incorrecto o expirado. Inténtalo de nuevo.' };
        return { exito: true };
    }

    // ===== RECUPERACIÓN — PASO 3: cambiar contraseña =====
    function cambiarPasswordConCodigo(correo, codigo, nuevaPassword) {
        if (!SV_STORAGE.verificarCodigoRecuperacion(correo, codigo)) {
            return { exito: false, error: 'Sesión de recuperación inválida. Inicia el proceso de nuevo.' };
        }
        const errPass = validar.password(nuevaPassword);
        if (errPass) return { exito: false, error: errPass };

        const usuario = SV_STORAGE.buscarUsuarioPorCorreo(correo);
        if (!usuario) return { exito: false, error: 'Usuario no encontrado.' };

        SV_STORAGE.actualizarUsuario(usuario.id, { password: SV_STORAGE.hashSimple(nuevaPassword) });
        SV_STORAGE.limpiarCodigoRecuperacion(correo);
        return { exito: true, mensaje: '¡Contraseña cambiada! Ya puedes iniciar sesión.' };
    }

    // ===== GUARDAR USUARIO ACTUAL =====
    function actualizarUsuarioActual(cambios) {
        const usuario = SV_STORAGE.obtenerUsuarioActual();
        if (!usuario) {
            return { exito: false, error: 'No hay sesión activa.' };
        }
        const actualizado = SV_STORAGE.actualizarUsuario(usuario.id, cambios);
        return { exito: true, usuario: actualizado };
    }

    // ===== ¿HAY SESIÓN? =====
    function haySesion() {
        return SV_STORAGE.obtenerUsuarioActual() !== null;
    }

    function requireAuth(redirectUrl = 'index.html') {
        if (!haySesion()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    return {
        validar,
        registrar,
        iniciarSesion,
        cerrarSesion,
        enviarCodigoRecuperacion,
        verificarCodigoRecuperacion,
        cambiarPasswordConCodigo,
        actualizarUsuarioActual,
        haySesion,
        requireAuth
    };
})();
