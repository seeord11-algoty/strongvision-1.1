/**
 * StrongVision - Perfil Físico JS
 * Cubre los casos de prueba RFU-3 (TC-010 a TC-013)
 */

(function() {
    'use strict';

    if (!SV_AUTH.requireAuth('../index.html')) return;
    const usuario = SV_STORAGE.obtenerUsuarioActual();
    const isEN = (localStorage.getItem('sv_lang') || 'es-CO') === 'en-US';
    const L = (es, en) => isEN ? en : es;

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

        // Onboarding banner si viene de registro
        const params = new URLSearchParams(window.location.search);
        if (params.get('onboarding') === '1') {
            document.getElementById('onboardingBanner').style.display = 'flex';
        }

        // Custom dropdown edad
        const edadList = document.getElementById('edadList');
        const edadBtn  = document.getElementById('edadBtn');
        const edadWrapper = document.getElementById('edadWrapper');

        for (let i = 14; i <= 100; i++) {
            const item = document.createElement('div');
            item.className = 'cs-item';
            item.dataset.value = i;
            item.textContent = isEN ? i + ' years' : i + ' años';
            item.setAttribute('role', 'option');
            item.addEventListener('click', () => setEdad(i));
            edadList.appendChild(item);
        }

        edadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const abierto = edadWrapper.classList.toggle('open');
            edadBtn.setAttribute('aria-expanded', abierto);
            if (abierto) {
                const sel = edadList.querySelector('.cs-item.selected');
                if (sel) setTimeout(() => sel.scrollIntoView({ block: 'center' }), 50);
            }
        });

        document.addEventListener('click', () => {
            edadWrapper.classList.remove('open');
            edadBtn.setAttribute('aria-expanded', 'false');
        });

        edadList.addEventListener('click', (e) => e.stopPropagation());

        cargarPerfilExistente();

        // Bloquear navegación si el perfil está incompleto
        const _pf = SV_STORAGE.obtenerPerfil(usuario.id);
        const _completo = _pf && _pf.peso && _pf.objetivo && _pf.nivel;
        if (!_completo) {
            document.body.classList.add('perfil-locked');
            const lockNotice = document.getElementById('lockNotice');
            if (lockNotice) lockNotice.style.display = 'flex';
        }

        document.getElementById('perfilForm').addEventListener('submit', handleSubmit);

        // Panel informativo recomposición corporal
        document.querySelectorAll('input[name="objetivo"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const panel = document.getElementById('panelRecomposicion');
                if (panel) panel.style.display = radio.value === 'recomposicion_corporal' ? 'block' : 'none';
            });
        });
    });

    window.toggleSalud = function(mostrar) {
        const panel = document.getElementById('saludDetalle');
        const btnSi = document.getElementById('btnSiCondicion');
        const btnNo = document.getElementById('btnNoCondicion');
        if (mostrar) {
            panel.classList.add('open');
            btnSi.classList.add('active');
            btnNo.classList.remove('active');
        } else {
            panel.classList.remove('open');
            btnNo.classList.add('active');
            btnSi.classList.remove('active');
            // Resetear campos al ocultar
            document.getElementById('patologia').value = 'ninguna';
            document.querySelectorAll('input[name="lesion"]').forEach(cb => cb.checked = false);
            document.getElementById('notas').value = '';
        }
    };

    function setEdad(val) {
        const v = parseInt(val);
        if (!v) return;
        document.getElementById('edad').value = v;
        const display = document.getElementById('edadDisplay');
        display.textContent = isEN ? v + ' years' : v + ' años';
        display.classList.remove('cs-placeholder');
        document.getElementById('edadList').querySelectorAll('.cs-item').forEach(el => {
            el.classList.toggle('selected', parseInt(el.dataset.value) === v);
        });
        document.getElementById('edadWrapper').classList.remove('open', 'invalid');
        document.getElementById('edadBtn').setAttribute('aria-expanded', 'false');
        const aviso = document.getElementById('menorAviso');
        if (aviso) aviso.style.display = v < 18 ? 'block' : 'none';
    }

    function cargarPerfilExistente() {
        const perfil = SV_STORAGE.obtenerPerfil(usuario.id);
        if (!perfil) return;

        if (perfil.edad) setEdad(perfil.edad);
        if (perfil.genero) document.getElementById('genero').value = perfil.genero;
        if (perfil.peso) {
            document.getElementById('peso').value = perfil.peso;
            const rP = document.getElementById('pesoRange');
            if (rP) { rP.value = perfil.peso; rP.dispatchEvent(new Event('input')); }
        }
        if (perfil.altura) {
            document.getElementById('altura').value = perfil.altura;
            const rA = document.getElementById('alturaRange');
            if (rA) { rA.value = perfil.altura; rA.dispatchEvent(new Event('input')); }
        }
        if (perfil.nivel) {
            const radio = document.querySelector(`input[name="nivel"][value="${perfil.nivel}"]`);
            if (radio) radio.checked = true;
        }
        if (perfil.objetivo) {
            const radio = document.querySelector(`input[name="objetivo"][value="${perfil.objetivo}"]`);
            if (radio) radio.checked = true;
            const panel = document.getElementById('panelRecomposicion');
            if (panel) panel.style.display = perfil.objetivo === 'recomposicion_corporal' ? 'block' : 'none';
        }
        if (perfil.dias_por_semana) document.getElementById('dias').value = perfil.dias_por_semana;
        // Auto-expandir sección salud si el perfil ya tiene condiciones
        const tieneCondiciones = (perfil.patologia && perfil.patologia !== 'ninguna')
            || (perfil.lesiones && perfil.lesiones.length > 0)
            || !!perfil.notas;
        if (tieneCondiciones) {
            toggleSalud(true);
            if (perfil.patologia) document.getElementById('patologia').value = perfil.patologia;
            if (perfil.lesiones && Array.isArray(perfil.lesiones)) {
                perfil.lesiones.forEach(l => {
                    const cb = document.querySelector(`input[name="lesion"][value="${l}"]`);
                    if (cb) cb.checked = true;
                });
            }
            if (perfil.notas) document.getElementById('notas').value = perfil.notas;
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        limpiarErrores();

        const datos = {
            edad: parseInt(document.getElementById('edad').value),
            genero: document.getElementById('genero').value,
            peso: parseFloat(document.getElementById('peso').value),
            altura: parseInt(document.getElementById('altura').value),
            nivel: document.querySelector('input[name="nivel"]:checked')?.value,
            objetivo: document.querySelector('input[name="objetivo"]:checked')?.value,
            dias_por_semana: parseInt(document.getElementById('dias').value),
            patologia: document.getElementById('patologia').value || 'ninguna',
            lesiones: Array.from(document.querySelectorAll('input[name="lesion"]:checked')).map(c => c.value),
            notas: document.getElementById('notas').value.trim()
        };

        const errores = validar(datos);
        if (Object.keys(errores).length > 0) {
            mostrarErrores(errores);
            mostrarFeedback(L('Por favor corrige los errores marcados.', 'Please fix the highlighted errors.'), 'error');
            return;
        }

        SV_STORAGE.guardarPerfil(usuario.id, datos);
        document.body.classList.remove('perfil-locked');
        mostrarToast(L('Perfil guardado correctamente ✓', 'Profile saved successfully ✓'), 'success');

        const params = new URLSearchParams(window.location.search);
        const yaExisteRutina = SV_STORAGE.obtenerRutina(usuario.id) !== null;

        // Si es onboarding, ir a generar rutina
        if (params.get('onboarding') === '1' || !yaExisteRutina) {
            setTimeout(() => {
                window.location.href = 'rutina.html?generar=1';
            }, 800);
        } else {
            mostrarFeedback(L('¡Datos actualizados! Si quieres puedes regenerar tu rutina con el nuevo perfil.', 'Data updated! You can regenerate your routine with the new profile.'), 'success');
            setTimeout(() => {
                if (confirm(L('¿Quieres regenerar tu rutina con los datos actualizados?', 'Would you like to regenerate your routine with the updated data?'))) {
                    window.location.href = 'rutina.html?generar=1';
                }
            }, 600);
        }
    }

    function validar(d) {
        const e = {};
        if (!d.edad || d.edad < 14 || d.edad > 100) e.edad = L('Edad debe estar entre 14 y 100 años.', 'Age must be between 14 and 100.');
        if (!d.genero) e.genero = L('Selecciona un género.', 'Select a gender.');
        if (!d.peso || d.peso < 30 || d.peso > 250) e.peso = L('Peso entre 30 y 250 kg.', 'Weight must be between 30 and 250 kg.');
        if (!d.altura || d.altura < 120 || d.altura > 230) e.altura = L('Altura entre 120 y 230 cm.', 'Height must be between 120 and 230 cm.');
        if (!d.nivel) e.nivel = L('Selecciona tu nivel.', 'Select your level.');
        if (!d.objetivo) e.objetivo = L('Selecciona un objetivo.', 'Select a goal.');
        if (!d.dias_por_semana || d.dias_por_semana < 2 || d.dias_por_semana > 6) e.dias = L('Selecciona días.', 'Select days.');
        return e;
    }

    function mostrarErrores(errores) {
        Object.entries(errores).forEach(([campo, msg]) => {
            const el = document.getElementById('err-' + campo);
            if (el) el.textContent = msg;
            if (campo === 'edad') {
                document.getElementById('edadWrapper')?.classList.add('invalid');
            } else {
                const inp = document.getElementById(campo);
                if (inp) inp.classList.add('invalid');
            }
        });
    }

    function limpiarErrores() {
        document.querySelectorAll('.error-msg').forEach(e => e.textContent = '');
        document.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
        document.getElementById('edadWrapper')?.classList.remove('invalid');
        const fb = document.getElementById('perfil-feedback');
        if (fb) fb.className = 'form-feedback';
    }

    function mostrarFeedback(msg, tipo) {
        const fb = document.getElementById('perfil-feedback');
        if (!fb) return;
        fb.textContent = msg;
        fb.className = `form-feedback show ${tipo}`;
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
})();
